package com.orderflow.service;

import com.orderflow.dto.CreateOrderRequest;
import com.orderflow.dto.OrderItemRequest;
import com.orderflow.dto.OrderResponse;
import com.orderflow.dto.SimulationRequest;
import com.orderflow.dto.SimulationStatusResponse;
import com.orderflow.entity.OrderStatus;
import com.orderflow.repository.InventoryRepository;
import com.orderflow.repository.OrderRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SimulationService {

    private static final Logger log = LoggerFactory.getLogger(SimulationService.class);

    private final InventoryService inventoryService;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final SseService sseService;

    // Cache of active or recent simulation results by simulationId
    private final Map<String, SimulationStatusResponse> simulationStore = new ConcurrentHashMap<>();

    public SimulationService(InventoryService inventoryService,
                             OrderService orderService,
                             OrderRepository orderRepository,
                             InventoryRepository inventoryRepository,
                             SseService sseService) {
        this.inventoryService = inventoryService;
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
        this.sseService = sseService;
    }

    public SimulationStatusResponse startSimulation(SimulationRequest request) {
        String simulationId = "SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Long productId = request.getProductId() != null ? request.getProductId() : 1L;
        int initialStock = request.getInitialInventory();
        int concurrentOrders = request.getConcurrentOrders();
        int quantityPerOrder = request.getQuantityPerOrder();

        log.info("Starting simulation {}: productId={}, stock={}, orders={}, qtyPerOrder={}",
                simulationId, productId, initialStock, concurrentOrders, quantityPerOrder);

        // 1. Reset target product inventory to initialStock in PostgreSQL
        inventoryService.setStock(productId, initialStock);

        SimulationStatusResponse status = new SimulationStatusResponse();
        status.setSimulationId(simulationId);
        status.setStatus("STARTED");
        status.setProductId(productId);
        status.setInitialInventory(initialStock);
        status.setOrdersSubmitted(concurrentOrders);
        status.setProcessing(concurrentOrders);
        status.setCompleted(0);
        status.setOutOfStock(0);
        status.setFailed(0);
        status.setDeadLettered(0);
        status.setFinalInventory(initialStock);
        status.setMinimumInventoryObserved(initialStock);
        status.setNegativeInventoryEvents(0);
        status.setStartedAt(Instant.now());

        simulationStore.put(simulationId, status);

        // Broadcast simulation started via SSE
        sseService.broadcast("SIMULATION_STARTED", status);

        // 2. Launch concurrent orders asynchronously in background thread
        CompletableFuture.runAsync(() -> runSimulationExecution(simulationId, request));

        return status;
    }

    private void runSimulationExecution(String simulationId, SimulationRequest request) {
        SimulationStatusResponse status = simulationStore.get(simulationId);
        if (status == null) return;

        status.setStatus("RUNNING");
        long startNano = System.nanoTime();
        Long productId = request.getProductId();
        int count = request.getConcurrentOrders();
        int qty = request.getQuantityPerOrder();

        List<CompletableFuture<OrderResponse>> orderFutures = new ArrayList<>(count);
        AtomicInteger minObserved = new AtomicInteger(request.getInitialInventory());
        AtomicInteger negativeEvents = new AtomicInteger(0);

        // Create order requests
        for (int i = 1; i <= count; i++) {
            final int index = i;
            CreateOrderRequest orderReq = new CreateOrderRequest(
                    "BENCHMARK-CUST-" + String.format("%03d", index),
                    Collections.singletonList(new OrderItemRequest(productId, qty))
            );

            // Submit orders concurrently
            CompletableFuture<OrderResponse> future = CompletableFuture.supplyAsync(() -> {
                // Idempotency key per benchmark order
                String key = "sim-" + simulationId + "-order-" + index;
                OrderResponse response = orderService.createOrder(orderReq, key);

                // Sample PostgreSQL inventory during execution
                int currentAvailable = inventoryRepository.findByProductId(productId)
                        .map(inv -> inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0)
                        .orElse(0);

                minObserved.updateAndGet(curr -> Math.min(curr, currentAvailable));
                if (currentAvailable < 0) {
                    negativeEvents.incrementAndGet();
                }

                return response;
            });

            orderFutures.add(future);
        }

        // Wait for all order creations to dispatch into executor
        List<Long> orderIds = new ArrayList<>();
        for (CompletableFuture<OrderResponse> f : orderFutures) {
            try {
                OrderResponse res = f.join();
                orderIds.add(res.getId());
            } catch (Exception e) {
                log.error("Error creating benchmark order", e);
            }
        }

        // Poll order completion from PostgreSQL until all are terminal
        boolean allFinished = false;
        int maxPollSeconds = 45;
        long pollStart = System.currentTimeMillis();

        int completed = 0;
        int outOfStock = 0;
        int failed = 0;
        int deadLettered = 0;

        while (!allFinished && (System.currentTimeMillis() - pollStart) < (maxPollSeconds * 1000L)) {
            try {
                Thread.sleep(150);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }

            int currentAvailable = inventoryRepository.findByProductId(productId)
                    .map(inv -> inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0)
                    .orElse(0);
            minObserved.updateAndGet(curr -> Math.min(curr, currentAvailable));
            if (currentAvailable < 0) {
                negativeEvents.incrementAndGet();
            }

            // Query actual database order states
            List<com.orderflow.entity.Order> orders = orderRepository.findAllById(orderIds);
            completed = 0;
            outOfStock = 0;
            failed = 0;
            deadLettered = 0;
            int stillProcessing = 0;

            for (com.orderflow.entity.Order ord : orders) {
                OrderStatus st = ord.getStatus();
                if (st == OrderStatus.COMPLETED) {
                    completed++;
                } else if (st == OrderStatus.OUT_OF_STOCK) {
                    outOfStock++;
                } else if (st == OrderStatus.FAILED) {
                    failed++;
                } else if (st == OrderStatus.DEAD_LETTERED) {
                    deadLettered++;
                } else {
                    stillProcessing++;
                }
            }

            // Update live metrics
            status.setCompleted(completed);
            status.setOutOfStock(outOfStock);
            status.setFailed(failed);
            status.setDeadLettered(deadLettered);
            status.setProcessing(stillProcessing);
            status.setFinalInventory(currentAvailable);
            status.setMinimumInventoryObserved(minObserved.get());
            status.setNegativeInventoryEvents(negativeEvents.get());
            status.setProcessingTimeMs((System.nanoTime() - startNano) / 1_000_000L);

            sseService.broadcast("SIMULATION_PROGRESS", status);

            if (stillProcessing == 0) {
                allFinished = true;
            }
        }

        // Final verification from database
        long elapsedMs = (System.nanoTime() - startNano) / 1_000_000L;
        int finalAvailable = inventoryRepository.findByProductId(productId)
                .map(inv -> inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0)
                .orElse(0);
        long negativeCount = inventoryRepository.countNegativeStockRecords();

        status.setStatus("COMPLETED");
        status.setCompleted(completed);
        status.setOutOfStock(outOfStock);
        status.setFailed(failed);
        status.setDeadLettered(deadLettered);
        status.setProcessing(0);
        status.setFinalInventory(finalAvailable);
        status.setMinimumInventoryObserved(Math.min(minObserved.get(), finalAvailable));
        status.setNegativeInventoryEvents((int) negativeCount);
        status.setProcessingTimeMs(elapsedMs);
        status.setCompletedAt(Instant.now());

        log.info("Simulation {} COMPLETED in {}ms: Completed={}, OutOfStock={}, FinalStock={}, MinStock={}, NegEvents={}",
                simulationId, elapsedMs, completed, outOfStock, finalAvailable, status.getMinimumInventoryObserved(), status.getNegativeInventoryEvents());

        sseService.broadcast("SIMULATION_COMPLETED", status);
    }

    public SimulationStatusResponse getSimulationStatus(String simulationId) {
        return simulationStore.get(simulationId);
    }
}

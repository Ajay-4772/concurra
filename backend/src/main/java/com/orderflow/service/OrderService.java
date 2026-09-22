package com.orderflow.service;

import com.orderflow.dto.CreateOrderRequest;
import com.orderflow.dto.DashboardMetricsResponse;
import com.orderflow.dto.OrderItemRequest;
import com.orderflow.dto.OrderItemResponse;
import com.orderflow.dto.OrderResponse;
import com.orderflow.entity.Order;
import com.orderflow.entity.OrderEvent;
import com.orderflow.entity.OrderItem;
import com.orderflow.entity.OrderStatus;
import com.orderflow.entity.Product;
import com.orderflow.exception.IdempotencyConflictException;
import com.orderflow.exception.ResourceNotFoundException;
import com.orderflow.processor.OrderProcessor;
import com.orderflow.repository.DeadLetterQueueRepository;
import com.orderflow.repository.InventoryRepository;
import com.orderflow.repository.OrderEventRepository;
import com.orderflow.repository.OrderItemRepository;
import com.orderflow.repository.OrderRepository;
import com.orderflow.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderEventRepository orderEventRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final DeadLetterQueueRepository deadLetterQueueRepository;
    private final OrderProcessor orderProcessor;
    private final IdempotencyService idempotencyService;
    private final SseService sseService;
    private final RedisStreamPublisher redisStreamPublisher;
    private final ThreadPoolTaskExecutor taskExecutor;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        OrderEventRepository orderEventRepository,
                        ProductRepository productRepository,
                        InventoryRepository inventoryRepository,
                        DeadLetterQueueRepository deadLetterQueueRepository,
                        OrderProcessor orderProcessor,
                        IdempotencyService idempotencyService,
                        SseService sseService,
                        RedisStreamPublisher redisStreamPublisher,
                        @Qualifier("orderTaskExecutor") ThreadPoolTaskExecutor taskExecutor) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderEventRepository = orderEventRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.deadLetterQueueRepository = deadLetterQueueRepository;
        this.orderProcessor = orderProcessor;
        this.idempotencyService = idempotencyService;
        this.sseService = sseService;
        this.redisStreamPublisher = redisStreamPublisher;
        this.taskExecutor = taskExecutor;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String idempotencyKey) {
        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String existingOrderNumber = idempotencyService.getExistingOrder(idempotencyKey);
            if (existingOrderNumber != null) {
                log.info("Idempotent request detected for key {}. Returning existing order {}", idempotencyKey, existingOrderNumber);
                return orderRepository.findByOrderNumber(existingOrderNumber)
                        .map(this::mapToOrderResponse)
                        .orElseThrow(() -> new IdempotencyConflictException("Order already processed for key: " + idempotencyKey));
            }
        }

        // 2. Validate Items & calculate total
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> itemsToSave = new ArrayList<>();

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Check and lease idempotency key
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            boolean acquired = idempotencyService.acquireKey(idempotencyKey, orderNumber);
            if (!acquired) {
                String existing = idempotencyService.getExistingOrder(idempotencyKey);
                if (existing != null) {
                    return orderRepository.findByOrderNumber(existing)
                            .map(this::mapToOrderResponse)
                            .orElseThrow(() -> new IdempotencyConflictException("Concurrent duplicate request for key: " + idempotencyKey));
                }
            }
        }

        // 3. Save Order (PENDING)
        Order order = new Order(
                orderNumber,
                request.getCustomerId(),
                OrderStatus.PENDING,
                BigDecimal.ZERO
        );
        order = orderRepository.save(order);

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            OrderItem orderItem = new OrderItem(
                    order.getId(),
                    product.getId(),
                    itemReq.getQuantity(),
                    product.getPrice()
            );
            itemsToSave.add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);
        orderItemRepository.saveAll(itemsToSave);

        // 4. Save Initial Audit Event
        OrderEvent createdEvent = new OrderEvent(
                order.getId(),
                order.getOrderNumber(),
                "ORDER_CREATED",
                "Order created with " + itemsToSave.size() + " items, total: $" + totalAmount
        );
        orderEventRepository.save(createdEvent);

        redisStreamPublisher.publishEvent("ORDER_CREATED", order.getId(), order.getOrderNumber(), "Order created");
        sseService.broadcast("ORDER_EVENT", Map.of(
                "type", "ORDER_CREATED",
                "orderId", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "status", order.getStatus().name(),
                "customerId", order.getCustomerId(),
                "totalAmount", totalAmount
        ));

        // 5. Submit to concurrent worker thread pool after transaction commit
        final Long orderId = order.getId();
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            orderProcessor.processOrderAsync(orderId);
                        }
                    }
            );
        } else {
            orderProcessor.processOrderAsync(orderId);
        }

        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with number: " + orderNumber));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(OrderStatus status, Pageable pageable) {
        Page<Order> page;
        if (status != null) {
            page = orderRepository.findByStatus(status, pageable);
        } else {
            page = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(this::mapToOrderResponse);
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getMetrics() {
        long total = orderRepository.count();
        long pending = orderRepository.countByStatus(OrderStatus.PENDING);
        long processing = orderRepository.countByStatus(OrderStatus.PROCESSING);
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long outOfStock = orderRepository.countByStatus(OrderStatus.OUT_OF_STOCK);
        long retrying = orderRepository.countByStatus(OrderStatus.RETRYING);
        long failed = orderRepository.countByStatus(OrderStatus.FAILED);
        long deadLettered = orderRepository.countByStatus(OrderStatus.DEAD_LETTERED);

        int totalAvailableStock = inventoryRepository.findAll().stream()
                .mapToInt(i -> i.getAvailableQuantity() != null ? i.getAvailableQuantity() : 0)
                .sum();

        int totalReservedStock = inventoryRepository.findAll().stream()
                .mapToInt(i -> i.getReservedQuantity() != null ? i.getReservedQuantity() : 0)
                .sum();

        int activeThreads = taskExecutor.getActiveCount();
        int queueDepth = taskExecutor.getThreadPoolExecutor() != null
                ? taskExecutor.getThreadPoolExecutor().getQueue().size()
                : 0;

        return new DashboardMetricsResponse(
                total,
                pending,
                processing,
                completed,
                outOfStock,
                retrying,
                failed,
                deadLettered,
                totalAvailableStock,
                totalReservedStock,
                activeThreads,
                queueDepth
        );
    }

    @Transactional
    public void resetDemoState() {
        // Clear DLQ, events, items, orders
        deadLetterQueueRepository.deleteAll();
        orderEventRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        log.info("Reset all orders, items, events, and DLQ records");

        // Broadcast reset event to SSE
        sseService.broadcast("DEMO_RESET", Map.of("type", "DEMO_RESET", "status", "SUCCESS"));
    }

    public OrderResponse mapToOrderResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        Map<Long, Product> productMap = productRepository.findAllById(
                items.stream().map(OrderItem::getProductId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<OrderItemResponse> itemResponses = items.stream().map(item -> {
            Product prod = productMap.get(item.getProductId());
            return new OrderItemResponse(
                    item.getId(),
                    item.getProductId(),
                    prod != null ? prod.getName() : "Unknown",
                    item.getQuantity(),
                    item.getUnitPrice()
            );
        }).collect(Collectors.toList());

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomerId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getRetryCount(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                itemResponses
        );
    }
}

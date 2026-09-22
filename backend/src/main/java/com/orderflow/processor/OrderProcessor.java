package com.orderflow.processor;

import com.orderflow.entity.DeadLetterQueue;
import com.orderflow.entity.Order;
import com.orderflow.entity.OrderEvent;
import com.orderflow.entity.OrderItem;
import com.orderflow.entity.OrderStatus;
import com.orderflow.repository.DeadLetterQueueRepository;
import com.orderflow.repository.OrderEventRepository;
import com.orderflow.repository.OrderItemRepository;
import com.orderflow.repository.OrderRepository;
import com.orderflow.service.InventoryService;
import com.orderflow.service.RedisStreamPublisher;
import com.orderflow.service.SseService;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrderProcessor {

    private static final Logger log = LoggerFactory.getLogger(OrderProcessor.class);
    private static final int MAX_RETRIES = 3;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderEventRepository orderEventRepository;
    private final DeadLetterQueueRepository deadLetterQueueRepository;
    private final InventoryService inventoryService;
    private final SseService sseService;
    private final RedisStreamPublisher redisStreamPublisher;
    private final ThreadPoolTaskExecutor taskExecutor;

    public OrderProcessor(OrderRepository orderRepository,
                          OrderItemRepository orderItemRepository,
                          OrderEventRepository orderEventRepository,
                          DeadLetterQueueRepository deadLetterQueueRepository,
                          InventoryService inventoryService,
                          SseService sseService,
                          RedisStreamPublisher redisStreamPublisher,
                          @Qualifier("orderTaskExecutor") ThreadPoolTaskExecutor taskExecutor) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderEventRepository = orderEventRepository;
        this.deadLetterQueueRepository = deadLetterQueueRepository;
        this.inventoryService = inventoryService;
        this.sseService = sseService;
        this.redisStreamPublisher = redisStreamPublisher;
        this.taskExecutor = taskExecutor;
    }

    /**
     * Executes order processing asynchronously on the worker thread pool.
     */
    @Async("orderTaskExecutor")
    public CompletableFuture<OrderStatus> processOrderAsync(Long orderId) {
        OrderStatus finalStatus = executeProcessing(orderId);
        return CompletableFuture.completedFuture(finalStatus);
    }

    @Transactional
    public OrderStatus executeProcessing(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.error("Order not found for processing: {}", orderId);
            return OrderStatus.FAILED;
        }

        // Transition: PENDING / RETRYING -> PROCESSING
        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        recordEvent(order, "ORDER_PROCESSING", "Order entered concurrent worker thread pool [" + Thread.currentThread().getName() + "]");
        log.info("[{}] Processing order {} (Retry {})", Thread.currentThread().getName(), order.getOrderNumber(), order.getRetryCount());

        try {
            if (order.getCustomerId() != null && order.getCustomerId().startsWith("FAULT_TEST")) {
                throw new RuntimeException("Simulated upstream payment gateway timeout (HTTP 504 Gateway Timeout)");
            }

            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            boolean allReserved = true;

            for (OrderItem item : items) {
                boolean reserved = inventoryService.reserveStock(item.getProductId(), item.getQuantity());
                if (!reserved) {
                    allReserved = false;
                    break;
                }
            }

            if (allReserved) {
                // SUCCESS: COMPLETED
                order.setStatus(OrderStatus.COMPLETED);
                orderRepository.save(order);
                recordEvent(order, "ORDER_COMPLETED", "All inventory items atomically reserved. Order completed.");
                log.info("[{}] Order {} COMPLETED", Thread.currentThread().getName(), order.getOrderNumber());
                return OrderStatus.COMPLETED;
            } else {
                // INSUFFICIENT STOCK: OUT_OF_STOCK
                // Invariant: OUT_OF_STOCK is deterministic and MUST NEVER BE RETRIED
                order.setStatus(OrderStatus.OUT_OF_STOCK);
                orderRepository.save(order);
                recordEvent(order, "ORDER_OUT_OF_STOCK", "Atomic inventory reservation failed (insufficient stock).");
                log.info("[{}] Order {} OUT_OF_STOCK", Thread.currentThread().getName(), order.getOrderNumber());
                return OrderStatus.OUT_OF_STOCK;
            }

        } catch (Exception ex) {
            log.error("[{}] Error processing order {}: {}", Thread.currentThread().getName(), order.getOrderNumber(), ex.getMessage());
            return handleTransientFailure(order, ex.getMessage());
        }
    }

    private OrderStatus handleTransientFailure(Order order, String errorMessage) {
        int currentRetry = order.getRetryCount();

        if (currentRetry < MAX_RETRIES) {
            order.setRetryCount(currentRetry + 1);
            order.setStatus(OrderStatus.RETRYING);
            orderRepository.save(order);

            recordEvent(order, "ORDER_RETRYING", "Transient failure: " + errorMessage + ". Scheduled retry #" + (currentRetry + 1));
            log.warn("Scheduling retry #{} for order {}", currentRetry + 1, order.getOrderNumber());

            // Asynchronous retry with exponential backoff (50ms * 2^retry)
            long backoffMs = 50L * (1L << currentRetry);
            taskExecutor.execute(() -> {
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
                executeProcessing(order.getId());
            });

            return OrderStatus.RETRYING;

        } else {
            // Retries exhausted -> DEAD_LETTERED
            order.setStatus(OrderStatus.DEAD_LETTERED);
            orderRepository.save(order);

            recordEvent(order, "ORDER_DEAD_LETTERED", "Max retries (" + MAX_RETRIES + ") exhausted: " + errorMessage);

            DeadLetterQueue dlq = new DeadLetterQueue(
                    order.getId(),
                    order.getOrderNumber(),
                    "Max retries exhausted: " + errorMessage,
                    "RetryCount: " + order.getRetryCount(),
                    order.getRetryCount()
            );
            deadLetterQueueRepository.save(dlq);

            log.error("Order {} transitioned to DEAD_LETTER_QUEUE after {} attempts", order.getOrderNumber(), order.getRetryCount());
            return OrderStatus.DEAD_LETTERED;
        }
    }

    private void recordEvent(Order order, String eventType, String details) {
        OrderEvent event = new OrderEvent(
                order.getId(),
                order.getOrderNumber(),
                eventType,
                details
        );
        orderEventRepository.save(event);

        // Redis stream publication
        redisStreamPublisher.publishEvent(eventType, order.getId(), order.getOrderNumber(), details);

        // Real-time SSE broadcasting
        sseService.broadcast("ORDER_EVENT", Map.of(
                "type", eventType,
                "orderId", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "status", order.getStatus().name(),
                "details", details,
                "timestamp", event.getCreatedAt().toString()
        ));
    }
}

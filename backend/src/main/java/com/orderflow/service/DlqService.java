package com.orderflow.service;

import com.orderflow.dto.DeadLetterResponse;
import com.orderflow.dto.OrderResponse;
import com.orderflow.entity.DeadLetterQueue;
import com.orderflow.entity.Order;
import com.orderflow.entity.OrderStatus;
import com.orderflow.exception.ResourceNotFoundException;
import com.orderflow.processor.OrderProcessor;
import com.orderflow.repository.DeadLetterQueueRepository;
import com.orderflow.repository.OrderRepository;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DlqService {

    private static final Logger log = LoggerFactory.getLogger(DlqService.class);

    private final DeadLetterQueueRepository dlqRepository;
    private final OrderRepository orderRepository;
    private final OrderProcessor orderProcessor;
    private final OrderService orderService;
    private final SseService sseService;

    public DlqService(DeadLetterQueueRepository dlqRepository,
                      OrderRepository orderRepository,
                      OrderProcessor orderProcessor,
                      OrderService orderService,
                      SseService sseService) {
        this.dlqRepository = dlqRepository;
        this.orderRepository = orderRepository;
        this.orderProcessor = orderProcessor;
        this.orderService = orderService;
        this.sseService = sseService;
    }

    @Transactional(readOnly = true)
    public Page<DeadLetterResponse> getDeadLetters(Pageable pageable) {
        return dlqRepository.findAllByOrderByFailedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public OrderResponse retryDeadLetter(Long dlqId) {
        DeadLetterQueue dlq = dlqRepository.findById(dlqId)
                .orElseThrow(() -> new ResourceNotFoundException("DLQ record not found with id: " + dlqId));

        Order order = orderRepository.findById(dlq.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found for DLQ record: " + dlq.getOrderId()));

        // Remove from DLQ table
        dlqRepository.delete(dlq);

        // Reset status to PENDING, retryCount to 0
        order.setStatus(OrderStatus.PENDING);
        order.setRetryCount(0);
        if (order.getCustomerId() != null && order.getCustomerId().startsWith("FAULT_TEST")) {
            order.setCustomerId(order.getCustomerId().replace("FAULT_TEST", "RECOVERED"));
        }
        order = orderRepository.save(order);

        log.info("Retrying order {} from DLQ. Re-queued for execution.", order.getOrderNumber());

        sseService.broadcast("DLQ_RETRY", Map.of(
                "type", "DLQ_RETRY",
                "orderId", order.getId(),
                "orderNumber", order.getOrderNumber()
        ));

        // Submit to executor after transaction commit
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

        return orderService.mapToOrderResponse(order);
    }

    @Transactional
    public void resolveDeadLetter(Long dlqId) {
        DeadLetterQueue dlq = dlqRepository.findById(dlqId)
                .orElseThrow(() -> new ResourceNotFoundException("DLQ record not found with id: " + dlqId));

        dlqRepository.delete(dlq);
        log.info("Resolved and cleared DLQ record for order {}", dlq.getOrderNumber());

        sseService.broadcast("DLQ_RESOLVED", Map.of(
                "type", "DLQ_RESOLVED",
                "dlqId", dlqId,
                "orderNumber", dlq.getOrderNumber()
        ));
    }

    private DeadLetterResponse mapToResponse(DeadLetterQueue dlq) {
        return new DeadLetterResponse(
                dlq.getId(),
                dlq.getOrderId(),
                dlq.getOrderNumber(),
                dlq.getReason(),
                dlq.getPayload(),
                dlq.getRetryCount(),
                dlq.getFailedAt()
        );
    }
}

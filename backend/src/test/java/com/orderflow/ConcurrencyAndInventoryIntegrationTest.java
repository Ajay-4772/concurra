package com.orderflow;

import com.orderflow.dto.CreateOrderRequest;
import com.orderflow.dto.OrderItemRequest;
import com.orderflow.dto.OrderResponse;
import com.orderflow.entity.Order;
import com.orderflow.entity.OrderStatus;
import com.orderflow.entity.Product;
import com.orderflow.processor.OrderProcessor;
import com.orderflow.repository.DeadLetterQueueRepository;
import com.orderflow.repository.InventoryRepository;
import com.orderflow.repository.OrderEventRepository;
import com.orderflow.repository.OrderItemRepository;
import com.orderflow.repository.OrderRepository;
import com.orderflow.repository.ProductRepository;
import com.orderflow.service.InventoryService;
import com.orderflow.service.OrderService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import org.junit.jupiter.api.BeforeAll;
import java.util.TimeZone;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class ConcurrencyAndInventoryIntegrationTest {

    @BeforeAll
    static void initTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    @Autowired
    private OrderService orderService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderEventRepository orderEventRepository;

    @Autowired
    private DeadLetterQueueRepository deadLetterQueueRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderProcessor orderProcessor;

    private Long laptopProductId;

    @BeforeEach
    void setUp() {
        Product laptop = productRepository.findBySku("PROD-LAPTOP").orElseGet(() -> {
            Product p = new Product("PROD-LAPTOP", "Laptop", new java.math.BigDecimal("1200.00"));
            return productRepository.save(p);
        });
        laptopProductId = laptop.getId();

        // Clean demo state before each test
        deadLetterQueueRepository.deleteAll();
        orderEventRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Atomic Inventory Decrement: 1 when available, 0 when stock exhausted")
    void testAtomicInventoryDecrement() {
        inventoryService.setStock(laptopProductId, 10);

        // First reservation should succeed
        boolean firstAttempt = inventoryService.reserveStock(laptopProductId, 1);
        assertTrue(firstAttempt, "First stock reservation should succeed");

        // Set stock to 0
        inventoryService.setStock(laptopProductId, 0);

        // Reservation on 0 stock must fail
        boolean exhaustedAttempt = inventoryService.reserveStock(laptopProductId, 1);
        assertFalse(exhaustedAttempt, "Reservation against 0 stock must fail with 0 rows updated");

        // Verify stock did not drop below 0
        int finalStock = inventoryRepository.findByProductId(laptopProductId).orElseThrow().getAvailableQuantity();
        assertEquals(0, finalStock, "Final stock must remain 0");
    }

    @Test
    @DisplayName("2. Insufficient Inventory: Order becomes OUT_OF_STOCK with zero retries")
    void testInsufficientInventory() {
        inventoryService.setStock(laptopProductId, 2);

        CreateOrderRequest request = new CreateOrderRequest(
                "CUST-INSUFFICIENT",
                Collections.singletonList(new OrderItemRequest(laptopProductId, 3))
        );

        OrderResponse response = orderService.createOrder(request, "test-insufficient-" + UUID.randomUUID());

        // Wait for asynchronous processing
        waitForOrderTerminalStatus(response.getId());

        Order finishedOrder = orderRepository.findById(response.getId()).orElseThrow();
        assertEquals(OrderStatus.OUT_OF_STOCK, finishedOrder.getStatus(), "Order must be OUT_OF_STOCK");
        assertEquals(0, finishedOrder.getRetryCount(), "OUT_OF_STOCK must never trigger retries");

        // Inventory must remain intact at 2
        int remainingStock = inventoryRepository.findByProductId(laptopProductId).orElseThrow().getAvailableQuantity();
        assertEquals(2, remainingStock, "Stock must remain at 2 when order is rejected");
    }

    @Test
    @DisplayName("3. 20 Concurrent Orders for 10 Stock: 10 COMPLETED, 10 OUT_OF_STOCK, Final Stock = 0")
    void testConcurrent20Orders() {
        inventoryService.setStock(laptopProductId, 10);

        int concurrentCount = 20;
        List<CompletableFuture<OrderResponse>> futures = new ArrayList<>();

        for (int i = 1; i <= concurrentCount; i++) {
            final int index = i;
            futures.add(CompletableFuture.supplyAsync(() -> {
                CreateOrderRequest req = new CreateOrderRequest(
                        "CUST-20-" + index,
                        Collections.singletonList(new OrderItemRequest(laptopProductId, 1))
                );
                return orderService.createOrder(req, "key-20-" + index + "-" + UUID.randomUUID());
            }));
        }

        List<Long> orderIds = new ArrayList<>();
        for (CompletableFuture<OrderResponse> f : futures) {
            orderIds.add(f.join().getId());
        }

        // Wait for all 20 orders to finish processing
        for (Long id : orderIds) {
            waitForOrderTerminalStatus(id);
        }

        // Verify database counts
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long outOfStock = orderRepository.countByStatus(OrderStatus.OUT_OF_STOCK);
        long failed = orderRepository.countByStatus(OrderStatus.FAILED);
        int finalStock = inventoryRepository.findByProductId(laptopProductId).orElseThrow().getAvailableQuantity();
        int minStock = inventoryService.getMinimumAvailableStock();
        long negativeCount = inventoryService.getNegativeStockCount();

        assertEquals(10, completed, "Exactly 10 orders must be COMPLETED");
        assertEquals(10, outOfStock, "Exactly 10 orders must be OUT_OF_STOCK");
        assertEquals(0, failed, "0 orders must fail");
        assertEquals(0, finalStock, "Final inventory must be 0");
        assertTrue(minStock >= 0, "Minimum stock must be >= 0");
        assertEquals(0, negativeCount, "Negative inventory count must be 0");
    }

    @Test
    @DisplayName("4. MAIN HACKATHON STRESS TEST: 100 Concurrent Orders for 10 Stock -> 10 COMPLETED, 90 OUT_OF_STOCK, Final Stock = 0")
    void testMain100ConcurrentOrdersStressTest() {
        inventoryService.setStock(laptopProductId, 10);

        int concurrentCount = 100;
        List<CompletableFuture<OrderResponse>> futures = new ArrayList<>();

        for (int i = 1; i <= concurrentCount; i++) {
            final int index = i;
            futures.add(CompletableFuture.supplyAsync(() -> {
                CreateOrderRequest req = new CreateOrderRequest(
                        "CUST-100-" + index,
                        Collections.singletonList(new OrderItemRequest(laptopProductId, 1))
                );
                return orderService.createOrder(req, "benchmark-key-" + index + "-" + UUID.randomUUID());
            }));
        }

        List<Long> orderIds = new ArrayList<>();
        for (CompletableFuture<OrderResponse> f : futures) {
            orderIds.add(f.join().getId());
        }

        // Wait for all 100 orders to reach terminal state
        for (Long id : orderIds) {
            waitForOrderTerminalStatus(id);
        }

        // Verify authoritative database assertions
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        long outOfStock = orderRepository.countByStatus(OrderStatus.OUT_OF_STOCK);
        long failed = orderRepository.countByStatus(OrderStatus.FAILED);
        long deadLettered = orderRepository.countByStatus(OrderStatus.DEAD_LETTERED);
        int finalStock = inventoryRepository.findByProductId(laptopProductId).orElseThrow().getAvailableQuantity();
        int minStock = inventoryService.getMinimumAvailableStock();
        long negativeCount = inventoryService.getNegativeStockCount();

        assertEquals(10, completed, "MAIN INVARIANT: Exactly 10 orders must be COMPLETED");
        assertEquals(90, outOfStock, "MAIN INVARIANT: Exactly 90 orders must be OUT_OF_STOCK");
        assertEquals(0, failed, "Zero orders should fail with system error");
        assertEquals(0, deadLettered, "Zero orders should be dead lettered");
        assertEquals(0, finalStock, "MAIN INVARIANT: Final stock must be exactly 0");
        assertTrue(minStock >= 0, "INVENTORY SAFETY: Minimum stock observed must never be negative");
        assertEquals(0, negativeCount, "INVENTORY SAFETY: Zero negative inventory records in PostgreSQL");
    }

    @Test
    @DisplayName("5. Idempotency: Duplicate request with same key returns identical order")
    void testIdempotency() {
        inventoryService.setStock(laptopProductId, 10);
        String idempotencyKey = "idemp-" + UUID.randomUUID();

        CreateOrderRequest request = new CreateOrderRequest(
                "CUST-IDEMPOTENT",
                Collections.singletonList(new OrderItemRequest(laptopProductId, 1))
        );

        OrderResponse res1 = orderService.createOrder(request, idempotencyKey);
        OrderResponse res2 = orderService.createOrder(request, idempotencyKey);

        assertEquals(res1.getId(), res2.getId(), "Duplicate request must return the same order ID");
        assertEquals(res1.getOrderNumber(), res2.getOrderNumber(), "Duplicate request must return the same order number");

        // Verify only 1 order exists in database for this customer
        assertEquals(1, orderRepository.findAll().size(), "Only 1 order record must be persisted");
    }

    private void waitForOrderTerminalStatus(Long orderId) {
        long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start < 15000) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && (order.getStatus() == OrderStatus.COMPLETED
                    || order.getStatus() == OrderStatus.OUT_OF_STOCK
                    || order.getStatus() == OrderStatus.FAILED
                    || order.getStatus() == OrderStatus.DEAD_LETTERED)) {
                return;
            }
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}

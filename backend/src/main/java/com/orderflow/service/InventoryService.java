package com.orderflow.service;

import com.orderflow.dto.InventoryResponse;
import com.orderflow.entity.Inventory;
import com.orderflow.entity.Product;
import com.orderflow.exception.ResourceNotFoundException;
import com.orderflow.repository.InventoryRepository;
import com.orderflow.repository.ProductRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final SseService sseService;
    private final RedisStreamPublisher redisStreamPublisher;

    public InventoryService(InventoryRepository inventoryRepository,
                            ProductRepository productRepository,
                            SseService sseService,
                            RedisStreamPublisher redisStreamPublisher) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.sseService = sseService;
        this.redisStreamPublisher = redisStreamPublisher;
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getAllInventory() {
        List<Product> products = productRepository.findAll();
        List<Inventory> inventories = inventoryRepository.findAll();

        Map<Long, Inventory> inventoryMap = inventories.stream()
                .collect(Collectors.toMap(Inventory::getProductId, i -> i, (a, b) -> a));

        List<InventoryResponse> responses = new ArrayList<>();
        for (Product product : products) {
            Inventory inv = inventoryMap.get(product.getId());
            responses.add(new InventoryResponse(
                    inv != null ? inv.getId() : null,
                    product.getId(),
                    product.getSku(),
                    product.getName(),
                    product.getPrice(),
                    inv != null ? inv.getAvailableQuantity() : 0,
                    inv != null ? inv.getReservedQuantity() : 0,
                    inv != null ? inv.getUpdatedAt() : null
            ));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public InventoryResponse getInventoryByProductId(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found for productId: " + productId));

        return new InventoryResponse(
                inv.getId(),
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getPrice(),
                inv.getAvailableQuantity(),
                inv.getReservedQuantity(),
                inv.getUpdatedAt()
        );
    }

    /**
     * Executes atomic conditional inventory reduction at database engine level.
     * Returns true if 1 row updated (reserved), false if 0 rows updated (insufficient).
     */
    @Transactional
    public boolean reserveStock(Long productId, int quantity) {
        int rows = inventoryRepository.decrementAvailableStock(productId, quantity);
        boolean success = rows > 0;

        if (success) {
            log.debug("Stock reserved: productId={}, quantity={}", productId, quantity);
            redisStreamPublisher.publishEvent("INVENTORY_UPDATED", null, null,
                    "Reserved " + quantity + " units of productId " + productId);
            sseService.broadcast("INVENTORY_UPDATED", Map.of(
                    "type", "INVENTORY_UPDATED",
                    "productId", productId,
                    "quantityReserved", quantity
            ));
        } else {
            log.debug("Stock reservation failed (out of stock): productId={}, requested={}", productId, quantity);
        }

        return success;
    }

    @Transactional(readOnly = true)
    public int getMinimumAvailableStock() {
        return inventoryRepository.getMinimumAvailableQuantity();
    }

    @Transactional(readOnly = true)
    public long getNegativeStockCount() {
        return inventoryRepository.countNegativeStockRecords();
    }

    @Transactional
    public void setStock(Long productId, int quantity) {
        inventoryRepository.setStock(productId, quantity);
        log.info("Set inventory for productId {} to {}", productId, quantity);
        sseService.broadcast("INVENTORY_UPDATED", Map.of(
                "type", "INVENTORY_UPDATED",
                "productId", productId,
                "newQuantity", quantity
        ));
    }

    @Transactional
    public void resetDemoCatalog() {
        // Laptop = 10, Keyboard = 25, Mouse = 30, Monitor = 15, Headphones = 20
        productRepository.findBySku("PROD-LAPTOP").ifPresent(p -> inventoryRepository.setStock(p.getId(), 10));
        productRepository.findBySku("PROD-KEYBOARD").ifPresent(p -> inventoryRepository.setStock(p.getId(), 25));
        productRepository.findBySku("PROD-MOUSE").ifPresent(p -> inventoryRepository.setStock(p.getId(), 30));
        productRepository.findBySku("PROD-MONITOR").ifPresent(p -> inventoryRepository.setStock(p.getId(), 15));
        productRepository.findBySku("PROD-HEADPHONES").ifPresent(p -> inventoryRepository.setStock(p.getId(), 20));

        log.info("Demo catalog inventory reset to defaults");
        sseService.broadcast("INVENTORY_RESET", Map.of("type", "INVENTORY_RESET", "status", "SUCCESS"));
    }
}

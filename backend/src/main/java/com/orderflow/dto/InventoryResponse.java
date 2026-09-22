package com.orderflow.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class InventoryResponse {

    private Long id;
    private Long productId;
    private String sku;
    private String productName;
    private BigDecimal price;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer totalQuantity;
    private Instant updatedAt;

    public InventoryResponse() {
    }

    public InventoryResponse(Long id, Long productId, String sku, String productName,
                             BigDecimal price, Integer availableQuantity, Integer reservedQuantity,
                             Instant updatedAt) {
        this.id = id;
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.price = price;
        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
        this.totalQuantity = (availableQuantity != null ? availableQuantity : 0) + (reservedQuantity != null ? reservedQuantity : 0);
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
        this.totalQuantity = (availableQuantity != null ? availableQuantity : 0) + (this.reservedQuantity != null ? this.reservedQuantity : 0);
    }

    public Integer getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
        this.totalQuantity = (this.availableQuantity != null ? this.availableQuantity : 0) + (reservedQuantity != null ? reservedQuantity : 0);
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

package com.orderflow.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SimulationRequest {

    @NotNull(message = "productId is required")
    private Long productId = 1L;

    @NotNull(message = "initialInventory is required")
    @Min(value = 1, message = "initialInventory must be at least 1")
    private Integer initialInventory = 10;

    @NotNull(message = "concurrentOrders is required")
    @Min(value = 1, message = "concurrentOrders must be at least 1")
    private Integer concurrentOrders = 100;

    @NotNull(message = "quantityPerOrder is required")
    @Min(value = 1, message = "quantityPerOrder must be at least 1")
    private Integer quantityPerOrder = 1;

    public SimulationRequest() {
    }

    public SimulationRequest(Long productId, Integer initialInventory, Integer concurrentOrders, Integer quantityPerOrder) {
        this.productId = productId != null ? productId : 1L;
        this.initialInventory = initialInventory != null ? initialInventory : 10;
        this.concurrentOrders = concurrentOrders != null ? concurrentOrders : 100;
        this.quantityPerOrder = quantityPerOrder != null ? quantityPerOrder : 1;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getInitialInventory() {
        return initialInventory;
    }

    public void setInitialInventory(Integer initialInventory) {
        this.initialInventory = initialInventory;
    }

    public Integer getConcurrentOrders() {
        return concurrentOrders;
    }

    public void setConcurrentOrders(Integer concurrentOrders) {
        this.concurrentOrders = concurrentOrders;
    }

    public Integer getQuantityPerOrder() {
        return quantityPerOrder;
    }

    public void setQuantityPerOrder(Integer quantityPerOrder) {
        this.quantityPerOrder = quantityPerOrder;
    }
}

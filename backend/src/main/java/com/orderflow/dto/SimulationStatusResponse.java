package com.orderflow.dto;

import java.time.Instant;

public class SimulationStatusResponse {

    private String simulationId;
    private String status; // STARTED, RUNNING, COMPLETED, FAILED
    private Long productId;
    private int initialInventory;
    private int ordersSubmitted;
    private int processing;
    private int completed;
    private int outOfStock;
    private int failed;
    private int deadLettered;
    private int finalInventory;
    private int minimumInventoryObserved;
    private int negativeInventoryEvents;
    private long processingTimeMs;
    private Instant startedAt;
    private Instant completedAt;

    public SimulationStatusResponse() {
    }

    public String getSimulationId() {
        return simulationId;
    }

    public void setSimulationId(String simulationId) {
        this.simulationId = simulationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public int getInitialInventory() {
        return initialInventory;
    }

    public void setInitialInventory(int initialInventory) {
        this.initialInventory = initialInventory;
    }

    public int getOrdersSubmitted() {
        return ordersSubmitted;
    }

    public void setOrdersSubmitted(int ordersSubmitted) {
        this.ordersSubmitted = ordersSubmitted;
    }

    public int getProcessing() {
        return processing;
    }

    public void setProcessing(int processing) {
        this.processing = processing;
    }

    public int getCompleted() {
        return completed;
    }

    public void setCompleted(int completed) {
        this.completed = completed;
    }

    public int getOutOfStock() {
        return outOfStock;
    }

    public void setOutOfStock(int outOfStock) {
        this.outOfStock = outOfStock;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }

    public int getDeadLettered() {
        return deadLettered;
    }

    public void setDeadLettered(int deadLettered) {
        this.deadLettered = deadLettered;
    }

    public int getFinalInventory() {
        return finalInventory;
    }

    public void setFinalInventory(int finalInventory) {
        this.finalInventory = finalInventory;
    }

    public int getMinimumInventoryObserved() {
        return minimumInventoryObserved;
    }

    public void setMinimumInventoryObserved(int minimumInventoryObserved) {
        this.minimumInventoryObserved = minimumInventoryObserved;
    }

    public int getNegativeInventoryEvents() {
        return negativeInventoryEvents;
    }

    public void setNegativeInventoryEvents(int negativeInventoryEvents) {
        this.negativeInventoryEvents = negativeInventoryEvents;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}

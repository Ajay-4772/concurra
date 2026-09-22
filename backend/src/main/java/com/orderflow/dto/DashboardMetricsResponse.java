package com.orderflow.dto;

public class DashboardMetricsResponse {

    private long totalOrders;
    private long pending;
    private long processing;
    private long completed;
    private long outOfStock;
    private long retrying;
    private long failed;
    private long deadLettered;
    private int totalAvailableStock;
    private int totalReservedStock;
    private int activeWorkerThreads;
    private int queueDepth;

    public DashboardMetricsResponse() {
    }

    public DashboardMetricsResponse(long totalOrders, long pending, long processing, long completed,
                                    long outOfStock, long retrying, long failed, long deadLettered,
                                    int totalAvailableStock, int totalReservedStock,
                                    int activeWorkerThreads, int queueDepth) {
        this.totalOrders = totalOrders;
        this.pending = pending;
        this.processing = processing;
        this.completed = completed;
        this.outOfStock = outOfStock;
        this.retrying = retrying;
        this.failed = failed;
        this.deadLettered = deadLettered;
        this.totalAvailableStock = totalAvailableStock;
        this.totalReservedStock = totalReservedStock;
        this.activeWorkerThreads = activeWorkerThreads;
        this.queueDepth = queueDepth;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getPending() {
        return pending;
    }

    public void setPending(long pending) {
        this.pending = pending;
    }

    public long getProcessing() {
        return processing;
    }

    public void setProcessing(long processing) {
        this.processing = processing;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }

    public long getOutOfStock() {
        return outOfStock;
    }

    public void setOutOfStock(long outOfStock) {
        this.outOfStock = outOfStock;
    }

    public long getRetrying() {
        return retrying;
    }

    public void setRetrying(long retrying) {
        this.retrying = retrying;
    }

    public long getFailed() {
        return failed;
    }

    public void setFailed(long failed) {
        this.failed = failed;
    }

    public long getDeadLettered() {
        return deadLettered;
    }

    public void setDeadLettered(long deadLettered) {
        this.deadLettered = deadLettered;
    }

    public int getTotalAvailableStock() {
        return totalAvailableStock;
    }

    public void setTotalAvailableStock(int totalAvailableStock) {
        this.totalAvailableStock = totalAvailableStock;
    }

    public int getTotalReservedStock() {
        return totalReservedStock;
    }

    public void setTotalReservedStock(int totalReservedStock) {
        this.totalReservedStock = totalReservedStock;
    }

    public int getActiveWorkerThreads() {
        return activeWorkerThreads;
    }

    public void setActiveWorkerThreads(int activeWorkerThreads) {
        this.activeWorkerThreads = activeWorkerThreads;
    }

    public int getQueueDepth() {
        return queueDepth;
    }

    public void setQueueDepth(int queueDepth) {
        this.queueDepth = queueDepth;
    }
}

package com.orderflow.dto;

import java.time.Instant;

public class DeadLetterResponse {

    private Long id;
    private Long orderId;
    private String orderNumber;
    private String reason;
    private String payload;
    private Integer retryCount;
    private Instant failedAt;

    public DeadLetterResponse() {
    }

    public DeadLetterResponse(Long id, Long orderId, String orderNumber, String reason,
                              String payload, Integer retryCount, Instant failedAt) {
        this.id = id;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.reason = reason;
        this.payload = payload;
        this.retryCount = retryCount;
        this.failedAt = failedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public Instant getFailedAt() {
        return failedAt;
    }

    public void setFailedAt(Instant failedAt) {
        this.failedAt = failedAt;
    }
}

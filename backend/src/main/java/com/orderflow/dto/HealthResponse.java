package com.orderflow.dto;

public record HealthResponse(
        String status,
        String service
) {
    public static HealthResponse up() {
        return new HealthResponse("UP", "OrderFlow");
    }
}

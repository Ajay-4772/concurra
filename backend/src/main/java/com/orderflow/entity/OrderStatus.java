package com.orderflow.entity;

public enum OrderStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    OUT_OF_STOCK,
    RETRYING,
    FAILED,
    DEAD_LETTERED
}

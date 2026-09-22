package com.orderflow.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisStreamPublisher {

    private static final Logger log = LoggerFactory.getLogger(RedisStreamPublisher.class);
    public static final String STREAM_KEY = "concurra:events";

    private final StringRedisTemplate redisTemplate;

    public RedisStreamPublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publishEvent(String eventType, Long orderId, String orderNumber, String details) {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("eventType", eventType != null ? eventType : "UNKNOWN");
            body.put("orderId", orderId != null ? String.valueOf(orderId) : "");
            body.put("orderNumber", orderNumber != null ? orderNumber : "");
            body.put("timestamp", Instant.now().toString());
            body.put("details", details != null ? details : "");

            MapRecord<String, String, String> record = MapRecord.create(STREAM_KEY, body);
            RecordId recordId = redisTemplate.opsForStream().add(record);
            log.debug("Published event {} to Redis stream {} with ID: {}", eventType, STREAM_KEY, recordId);
        } catch (Exception e) {
            // Redis error must not block database transactions (PostgreSQL is source of truth)
            log.warn("Failed to publish event to Redis stream (non-critical): {}", e.getMessage());
        }
    }
}

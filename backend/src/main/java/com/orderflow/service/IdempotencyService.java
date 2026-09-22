package com.orderflow.service;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);
    private static final String KEY_PREFIX = "concurra:idempotency:";
    private static final Duration TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;

    public IdempotencyService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Attempts to acquire an idempotency lease.
     * @param idempotencyKey the client-provided key
     * @param orderNumber the identifier to associate
     * @return true if key is new and leased; false if duplicate
     */
    public boolean acquireKey(String idempotencyKey, String orderNumber) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return true;
        }

        try {
            String redisKey = KEY_PREFIX + idempotencyKey.trim();
            Boolean success = redisTemplate.opsForValue().setIfAbsent(redisKey, orderNumber, TTL);
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            log.warn("Redis idempotency check unavailable, proceeding with database uniqueness fallback: {}", e.getMessage());
            return true;
        }
    }

    public String getExistingOrder(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }

        try {
            String redisKey = KEY_PREFIX + idempotencyKey.trim();
            return redisTemplate.opsForValue().get(redisKey);
        } catch (Exception e) {
            log.warn("Redis idempotency read failed: {}", e.getMessage());
            return null;
        }
    }
}

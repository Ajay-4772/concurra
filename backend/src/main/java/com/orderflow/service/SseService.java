package com.orderflow.service;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter createEmitter() {
        // Emitter timeout 30 minutes
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.debug("SSE client completed, active clients: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.debug("SSE client timed out, active clients: {}", emitters.size());
        });

        emitter.onError((e) -> {
            emitters.remove(emitter);
            log.debug("SSE client error: {}, active clients: {}", e.getMessage(), emitters.size());
        });

        emitters.add(emitter);
        log.info("New SSE client connected. Total active clients: {}", emitters.size());

        // Send initial connection handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of(
                            "type", "CONNECTED",
                            "message", "Connected to Concurra real-time event stream",
                            "timestamp", Instant.now().toString()
                    )));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(String eventType, Object payload) {
        if (emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(payload));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            log.debug("Removed {} dead SSE emitters. Remaining: {}", deadEmitters.size(), emitters.size());
        }
    }

    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        if (!emitters.isEmpty()) {
            broadcast("PING", Map.of("timestamp", Instant.now().toString()));
        }
    }

    public int getActiveClientCount() {
        return emitters.size();
    }
}

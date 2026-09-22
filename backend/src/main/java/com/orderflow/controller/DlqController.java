package com.orderflow.controller;

import com.orderflow.dto.DeadLetterResponse;
import com.orderflow.dto.OrderResponse;
import com.orderflow.service.DlqService;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dlq")
public class DlqController {

    private final DlqService dlqService;

    public DlqController(DlqService dlqService) {
        this.dlqService = dlqService;
    }

    @GetMapping
    public ResponseEntity<Page<DeadLetterResponse>> getDeadLetters(
            @PageableDefault(size = 20, sort = "failedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DeadLetterResponse> response = dlqService.getDeadLetters(pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<OrderResponse> retryDeadLetter(@PathVariable Long id) {
        OrderResponse response = dlqService.retryDeadLetter(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Map<String, String>> resolveDeadLetter(@PathVariable Long id) {
        dlqService.resolveDeadLetter(id);
        return ResponseEntity.ok(Map.of("message", "Dead letter record resolved", "status", "SUCCESS"));
    }
}

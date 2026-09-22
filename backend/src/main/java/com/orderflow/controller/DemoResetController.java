package com.orderflow.controller;

import com.orderflow.service.InventoryService;
import com.orderflow.service.OrderService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoResetController {

    private final OrderService orderService;
    private final InventoryService inventoryService;

    public DemoResetController(OrderService orderService, InventoryService inventoryService) {
        this.orderService = orderService;
        this.inventoryService = inventoryService;
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetDemo() {
        orderService.resetDemoState();
        inventoryService.resetDemoCatalog();
        return ResponseEntity.ok(Map.of(
                "message", "Demo state reset successfully. Catalog stock restored.",
                "status", "SUCCESS"
        ));
    }
}

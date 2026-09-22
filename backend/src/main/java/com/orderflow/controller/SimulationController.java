package com.orderflow.controller;

import com.orderflow.dto.SimulationRequest;
import com.orderflow.dto.SimulationStatusResponse;
import com.orderflow.service.SimulationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/start")
    public ResponseEntity<SimulationStatusResponse> startSimulation(@Valid @RequestBody SimulationRequest request) {
        SimulationStatusResponse response = simulationService.startSimulation(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SimulationStatusResponse> getSimulationStatus(@PathVariable String id) {
        SimulationStatusResponse status = simulationService.getSimulationStatus(id);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }
}

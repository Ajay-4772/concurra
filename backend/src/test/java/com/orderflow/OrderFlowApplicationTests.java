package com.orderflow;

import com.orderflow.controller.HealthController;
import com.orderflow.dto.HealthResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class OrderFlowApplicationTests {

    @Test
    void contextHealthTest() {
        HealthController controller = new HealthController();
        ResponseEntity<HealthResponse> response = controller.getHealth();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().status());
        assertEquals("OrderFlow", response.getBody().service());
    }
}

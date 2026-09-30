package com.mams.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@Tag(name = "Health", description = "Public health check endpoint for monitoring & uptime keep-alive")
public class HealthController {

    private final DataSource dataSource;
    private final long startupTime = System.currentTimeMillis();

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping({"/api/health", "/api/public/health", "/health"})
    @Operation(summary = "Public health check and keep-alive endpoint for UptimeRobot / cron monitoring")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Military Asset Management System (MAMS)");
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        long uptimeSeconds = (System.currentTimeMillis() - startupTime) / 1000;
        response.put("uptimeSeconds", uptimeSeconds);

        try (Connection connection = dataSource.getConnection()) {
            boolean valid = connection.isValid(2);
            response.put("database", valid ? "HEALTHY" : "UNHEALTHY");
        } catch (Exception e) {
            response.put("database", "DEGRADED: " + e.getMessage());
        }

        response.put("message", "Defense Logistics Command API is active and operational");
        return ResponseEntity.ok(response);
    }
}

package com.idp.controller;

import com.idp.config.IdpProperties;
import com.idp.dto.SessionConfigRequest;
import com.idp.service.SessionConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@Tag(name = "Configuration", description = "Configuration management endpoints")
public class ConfigController {

    @Autowired
    private SessionConfigService sessionConfigService;

    @Autowired
    private IdpProperties idpProperties;

    @GetMapping("/session")
    @Operation(summary = "Get current session configuration")
    public ResponseEntity<Map<String, Object>> getSessionConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("sessionTimeoutMinutes", idpProperties.getSessionTimeoutMinutes());
        config.put("maxLoginAttempts", idpProperties.getMaxLoginAttempts());
        config.put("enableFirebase", idpProperties.isEnableFirebase());
        return ResponseEntity.ok(config);
    }

    @PutMapping("/session")
    @Operation(summary = "Update session configuration")
    public ResponseEntity<Map<String, Object>> updateSessionConfig(
            @Valid @RequestBody SessionConfigRequest request) {

        if (request.getSessionTimeoutMinutes() != null) {
            sessionConfigService.updateSessionTimeout(request.getSessionTimeoutMinutes());
        }

        if (request.getMaxLoginAttempts() != null) {
            sessionConfigService.updateMaxLoginAttempts(request.getMaxLoginAttempts());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Configuration updated successfully");
        response.put("sessionTimeoutMinutes", idpProperties.getSessionTimeoutMinutes());
        response.put("maxLoginAttempts", idpProperties.getMaxLoginAttempts());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/session/timeout")
    @Operation(summary = "Update only session timeout")
    public ResponseEntity<String> updateSessionTimeout(
            @RequestParam @Min(1) int minutes) {
        sessionConfigService.updateSessionTimeout(minutes);
        return ResponseEntity.ok("Session timeout updated to " + minutes + " minutes");
    }

    @PutMapping("/session/attempts")
    @Operation(summary = "Update only max login attempts")
    public ResponseEntity<String> updateMaxLoginAttempts(
            @RequestParam @Min(1) int attempts) {
        sessionConfigService.updateMaxLoginAttempts(attempts);
        return ResponseEntity.ok("Max login attempts updated to " + attempts);
    }
}
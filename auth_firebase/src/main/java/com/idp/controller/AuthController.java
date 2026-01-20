package com.idp.controller;

import com.idp.dto.AuthRequest;
import com.idp.dto.AuthResponse;
import com.idp.dto.RegisterRequest;
import com.idp.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            System.out.println("CONTROLLER: Register request received");
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("CONTROLLER ERROR: " + e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            System.out.println("CONTROLLER: Login request received for: " + request.getEmail());
            AuthResponse response = authService.authenticate(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("CONTROLLER LOGIN ERROR: " + e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", System.currentTimeMillis());

            HttpStatus status = HttpStatus.UNAUTHORIZED;
            if (e.getMessage().contains("locked")) {
                status = HttpStatus.LOCKED;
            }

            return ResponseEntity.status(status).body(errorResponse);
        } catch (Exception e) {
            System.out.println("CONTROLLER UNEXPECTED ERROR: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Internal server error");
            errorResponse.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/check-lock/{email}")
    @Operation(summary = "Check if user account is locked")
    public ResponseEntity<Map<String, Object>> checkLockStatus(@PathVariable String email) {
        try {
            boolean isLocked = authService.isUserLocked(email);

            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("locked", isLocked);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
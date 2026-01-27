package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.dto.SignalementCreateRequest;
import com.idp.dto.SignalementRecapResponse;
import com.idp.dto.SignalementResponse;
import com.idp.dto.SignalementStatusRequest;
import com.idp.dto.SignalementUpdateRequest;
import com.idp.service.SignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@Tag(name = "Signalements", description = "API pour le module web - travaux routiers")
public class SignalementController {

    private final SignalementService signalementService;

    public SignalementController(SignalementService signalementService) {
        this.signalementService = signalementService;
    }

    @GetMapping
    @Operation(summary = "Lister tous les signalements (public)")
    public ResponseEntity<ApiResponse<List<SignalementResponse>>> getAll() {
        List<SignalementResponse> list = signalementService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list, "Liste des signalements"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un signalement par ID (public)")
    public ResponseEntity<ApiResponse<SignalementResponse>> getById(@PathVariable Long id) {
        SignalementResponse response = signalementService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Signalement récupéré"));
    }

    @GetMapping("/recap")
    @Operation(summary = "Récapitulatif (public)")
    public ResponseEntity<ApiResponse<SignalementRecapResponse>> getRecap() {
        SignalementRecapResponse recap = signalementService.getRecap();
        return ResponseEntity.ok(ApiResponse.success(recap, "Récapitulatif"));
    }

    @PostMapping
    @Operation(summary = "Créer un signalement (authentifié)")
    public ResponseEntity<ApiResponse<SignalementResponse>> create(
            @Valid @RequestBody SignalementCreateRequest request) {

        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise", "UNAUTHORIZED"));
        }

        SignalementResponse response = signalementService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Signalement créé"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un signalement (authentifié)")
    public ResponseEntity<ApiResponse<SignalementResponse>> update(
            @PathVariable Long id,
            @RequestBody SignalementUpdateRequest request) {

        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise", "UNAUTHORIZED"));
        }

        SignalementResponse response = signalementService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Signalement mis à jour"));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Mettre à jour le statut d'un signalement (authentifié)")
    public ResponseEntity<ApiResponse<SignalementResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody SignalementStatusRequest request) {

        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise", "UNAUTHORIZED"));
        }

        SignalementResponse response = signalementService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Statut mis à jour"));
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        return principal instanceof String ? (String) principal : null;
    }
}

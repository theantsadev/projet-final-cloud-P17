package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.dto.SecuritySettingsRequest;
import com.idp.service.SecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/security")
@RequiredArgsConstructor
@Tag(name = "Sécurité", description = "Gestion des paramètres de sécurité")
public class SecurityController {

    private final SecurityService securityService;

    // MODIFIER PARAMÈTRES SÉCURITÉ
    @PutMapping("/settings")
    @Operation(summary = "Modifier les paramètres de sécurité")
    public ResponseEntity<ApiResponse<Void>> updateSecuritySettings(
            @RequestBody SecuritySettingsRequest request) {
        securityService.updateSecuritySettings(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Paramètres mis à jour"));
    }

    // VOIR PARAMÈTRES ACTUELS
    @GetMapping("/settings")
    @Operation(summary = "Voir les paramètres de sécurité actuels")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getSecuritySettings() {
        Map<String, Integer> settings = securityService.getSecuritySettings();
        return ResponseEntity.ok(ApiResponse.success(settings, "Paramètres récupérés"));
    }
}
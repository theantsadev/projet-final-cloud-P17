package com.idp.controller;

import com.idp.dto.*;
import com.idp.entity.User;
import com.idp.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "API d'authentification et gestion utilisateur")
public class AuthController {

    private final AuthService authService;

    // 1. INSCRIPTION
    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Inscription réussie"));
    }

    // 2. CONNEXION
    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success(response, "Connexion réussie"));
    }

    // 3. DÉCONNEXION
    @PostMapping("/logout")
    @Operation(summary = "Déconnexion utilisateur")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Authorization") String token) {
        String jwt = token.substring(7);
        authService.logout(jwt);
        return ResponseEntity.ok(ApiResponse.success(null, "Déconnexion réussie"));
    }

    // 4. MODIFIER INFOS USER
    @PutMapping("/profile")
    @Operation(summary = "Modifier son profil")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody UpdateProfileRequest request) {

        String jwt = token.substring(7);
        User updatedUser = authService.updateProfile(jwt, request);

        // Retour simplifié
        Map<String, Object> response = Map.of(
                "id", updatedUser.getId(),
                "email", updatedUser.getEmail(),
                "fullName", updatedUser.getFullName(),
                "phone", updatedUser.getPhone());

        return ResponseEntity.ok(ApiResponse.success(response, "Profil mis à jour"));
    }

     // 5. DÉBLOQUER UN COMPTE
    @PostMapping("/unlock")
    @Operation(summary = "Débloquer un compte utilisateur")
    public ResponseEntity<ApiResponse<Void>> unlockAccount(
            @RequestBody UnlockRequest request) {  // ← SUPPRIME le token d'authorization
        
        // SUPPRIME cette ligne : String jwt = token.substring(7);
        authService.unlockAccount(request.getEmail());  // ← Appelle avec email seulement
        return ResponseEntity.ok(ApiResponse.success(null, "Compte débloqué avec succès"));
    }

    // 6. RAFRAÎCHIR TOKEN
    @PostMapping("/refresh")
    @Operation(summary = "Rafraîchir le token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response, "Token rafraîchi"));
    }
    
    // 7. MON PROFIL
    @GetMapping("/profile")
    @Operation(summary = "Voir son profil")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @RequestHeader("Authorization") String token) {

        String jwt = token.substring(7);
        User user = authService.getProfile(jwt);

        // Retour simplifié
        Map<String, Object> response = Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "phone", user.getPhone(),
                "isActive", user.getIsActive(),
                "lastLogin", user.getLastLogin());

        return ResponseEntity.ok(ApiResponse.success(response, "Profil récupéré"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.entity.User;
import com.idp.service.SyncService;
import com.idp.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Utilisateurs", description = "API de gestion des utilisateurs")
public class UserController {

    private final UserService userService;
    private final SyncService syncService; // ← AJOUTE CE SERVICE

    /**
     * Lister tous les utilisateurs bloqués
     */
    @GetMapping("/locked")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Lister les utilisateurs bloqués")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLockedUsers() {
        log.info("Récupération des utilisateurs bloqués");

        List<User> lockedUsers = userService.getLockedUsers();

        List<Map<String, Object>> response = new ArrayList<>();
        for (User user : lockedUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("email", user.getEmail());
            map.put("fullName", user.getFullName() != null ? user.getFullName() : "N/A");
            map.put("phone", user.getPhone() != null ? user.getPhone() : "N/A");
            map.put("isLocked", user.getIsLocked());
            map.put("failedLoginAttempts", user.getFailedLoginAttempts());
            map.put("lastFailedLogin", user.getLastFailedLogin());
            map.put("role", user.getRole() != null ? user.getRole().getNom() : "N/A");
            map.put("createdAt", user.getCreatedAt());
            response.add(map);
        }

        return ResponseEntity.ok(ApiResponse.success(response,
                "Total d'utilisateurs bloqués: " + lockedUsers.size()));
    }

    /**
     * Débloquer un utilisateur (pour MANAGER)
     */
    @PostMapping("/{userId}/unlock")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Débloquer un utilisateur")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unlockUser(@PathVariable String userId) {
        log.info("Déverrouillage de l'utilisateur: {}", userId);
        User user = userService.getUserById(userId);
        user = syncService.unlockUserFromWeb(user.getEmail());
        Map<String, Object> response = Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "isLocked", user.getIsLocked(),
                "failedLoginAttempts", user.getFailedLoginAttempts(),
                "message", "Utilisateur débloqué avec succès");

        return ResponseEntity.ok(ApiResponse.success(response, "Utilisateur débloqué"));
    }

    /**
     * Obtenir le détail d'un utilisateur
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('MANAGER') or @userService.isCurrentUser(#userId)")
    @Operation(summary = "Obtenir les détails d'un utilisateur")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(@PathVariable String userId) {
        log.info("Récupération des détails de l'utilisateur: {}", userId);

        User user = userService.getUserById(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName() != null ? user.getFullName() : "N/A");
        response.put("phone", user.getPhone() != null ? user.getPhone() : "N/A");
        response.put("isActive", user.getIsActive());
        response.put("isLocked", user.getIsLocked());
        response.put("failedLoginAttempts", user.getFailedLoginAttempts());
        response.put("lastLogin", user.getLastLogin());
        response.put("lastFailedLogin", user.getLastFailedLogin());
        response.put("role", user.getRole() != null ? user.getRole().getNom() : "N/A");
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());

        return ResponseEntity.ok(ApiResponse.success(response, "Détails utilisateur"));
    }
}

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
     * Lister tous les utilisateurs
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Lister tous les utilisateurs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        log.info("Récupération de tous les utilisateurs");

        List<User> users = userService.getUsers();

        List<Map<String, Object>> response = new ArrayList<>();
        for (User user : users) {
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
                "Total d'utilisateurs: " + users.size()));
    }

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

    /**
     * Mettre à jour le rôle d'un utilisateur
     */
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Mettre à jour le rôle d'un utilisateur")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserRole(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        log.info("Mise à jour du rôle de l'utilisateur: {}", userId);

        String newRoleName = request.get("role");
        if (newRoleName == null || newRoleName.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("role_required", "Le rôle est obligatoire", 400));
        }

        User user = userService.getUserById(userId);
        user = userService.updateUserRole(user, newRoleName);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRole() != null ? user.getRole().getNom() : "N/A");
        response.put("message", "Rôle mis à jour avec succès");

        return ResponseEntity.ok(ApiResponse.success(response, "Rôle mis à jour"));
    }

    /**
     * Synchroniser tous les utilisateurs non synchronisés vers Firebase
     */
    @PostMapping("/sync/push-all")
    @PreAuthorize("hasAnyRole('MANAGER')")
    @Operation(summary = "Synchroniser les utilisateurs vers Firebase")
    public ResponseEntity<ApiResponse<?>> syncPushAll() {
        log.info("Synchronisation de tous les utilisateurs vers Firebase");
        syncService.invalidateOnlineCache(); // Force une nouvelle vérification
        userService.synchronizeAllPending();
        return ResponseEntity.ok(ApiResponse.success("Tous les utilisateurs ont été synchronisés",
                "Synchronisation vers Firebase effectuée"));
    }

    /**
     * Synchroniser les utilisateurs depuis Firebase
     */
    @PostMapping("/sync/pull-all")
    @PreAuthorize("hasAnyRole('MANAGER')")
    @Operation(summary = "Synchroniser les utilisateurs depuis Firebase")
    public ResponseEntity<ApiResponse<?>> syncPullAll() {
        log.info("Synchronisation des utilisateurs depuis Firebase");
        syncService.invalidateOnlineCache(); // Force une nouvelle vérification
        List<User> users = userService.getUsers();
        return ResponseEntity.ok(ApiResponse.success(users, "Synchronisation depuis Firebase effectuée"));
    }

    /**
     * TEST ENDPOINT - Synchroniser vers Firebase SANS authentification
     */
    @PostMapping("/test/sync-firebase-push")
    @Operation(summary = "TEST: Synchroniser les utilisateurs vers Firebase")
    public ResponseEntity<ApiResponse<?>> testSyncToFirebase() {
        log.info("TEST: Synchronisation des utilisateurs vers Firebase");
        syncService.invalidateOnlineCache();

        // Vérifier la connexion une fois pour peupler le cache
        long start = System.currentTimeMillis();
        boolean isOnline = syncService.isOnline();
        long duration = System.currentTimeMillis() - start;

        if (!isOnline) {
            log.warn("❌ Firebase offline - Impossible de syncer");
            return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error("Firebase offline - Synchronisation impossible", "FIREBASE_UNAVAILABLE", 503));
        }

        log.info("✅ Connexion Firebase OK en {}ms", duration);
        userService.synchronizeAllPending();
        return ResponseEntity.ok(ApiResponse.success(
                null,
                "✅ Sync PUSH à Firebase - Tous les utilisateurs non synchronisés ont été envoyés"));
    }

    /**
     * TEST ENDPOINT - Récupérer les utilisateurs depuis Firebase SANS
     * authentification
     */
    @PostMapping("/test/sync-firebase-pull")
    @Operation(summary = "TEST: Synchroniser les utilisateurs depuis Firebase")
    public ResponseEntity<ApiResponse<?>> testSyncFromFirebase() {
        log.info("TEST: Récupération des utilisateurs depuis Firebase");
        syncService.invalidateOnlineCache(); // Force une nouvelle vérification
        List<User> users = userService.getUsers();
        return ResponseEntity.ok(ApiResponse.success(
                users,
                "✅ Sync PULL depuis Firebase - " + users.size() + " utilisateurs récupérés"));
    }
}

package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.dto.SignalementRequest;
import com.idp.dto.SignalementResponse;
import com.idp.dto.SignalementStatisticsResponse;
import com.idp.service.SignalementService;
import com.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
@Slf4j
public class SignalementController {

    private final SignalementService signalementService;
    private final UserRepository userRepository;

    /**
     * TEST ENDPOINT - Créer un signalement de test AVEC user_id personnalisé
     */
    @PostMapping("/test/create-with-user")
    public ResponseEntity<ApiResponse<?>> createTestSignalementWithUser(
            @RequestBody Map<String, Object> payload) {

        log.info("Création d'un signalement de test avec user spécifique");

        String userId = (String) payload.getOrDefault("userId", null);
        if (userId == null) {
            var existingUser = userRepository.findAll().stream().findFirst();
            userId = existingUser.isPresent() ? existingUser.get().getId() : "99e64180-78fc-43f4-afa5-9677b56ba88a";
        }

        SignalementRequest request = SignalementRequest.builder()
                .titre((String) payload.getOrDefault("titre", "Nid-de-poule rue Zafimaniry - TEST"))
                .description((String) payload.getOrDefault("description", "Signalement de test automatique"))
                .latitude(Double.parseDouble(payload.getOrDefault("latitude", "-18.8792").toString()))
                .longitude(Double.parseDouble(payload.getOrDefault("longitude", "47.5079").toString()))
                .surfaceM2(new java.math.BigDecimal(payload.getOrDefault("surfaceM2", "25.5").toString()))
                .budget(new java.math.BigDecimal(payload.getOrDefault("budget", "5000000").toString()))
                .entrepriseConcernee((String) payload.getOrDefault("entrepriseConcernee", "Test Constructo"))
                .pourcentageAvancement(Integer.parseInt(payload.getOrDefault("pourcentageAvancement", "0").toString()))
                .build();

        SignalementResponse response = signalementService.createSignalement(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Signalement de test créé avec userId: " + userId));
    }

    /**
     * TEST ENDPOINT - Créer un signalement de test sans authentification
     */
    @PostMapping("/test/create")
    public ResponseEntity<ApiResponse<?>> createTestSignalement() {

        log.info("Création d'un signalement de test");

        // Récupérer un user existant (le premier utilisateur)
        var existingUser = userRepository.findAll().stream().findFirst();
        String userId = existingUser.isPresent() ? existingUser.get().getId() : "99e64180-78fc-43f4-afa5-9677b56ba88a";

        SignalementRequest request = SignalementRequest.builder()
                .titre("Nid-de-poule rue Zafimaniry - TEST")
                .description("Signalement de test automatique")
                .latitude(-18.8792)
                .longitude(47.5079)
                .surfaceM2(new java.math.BigDecimal("25.5"))
                .budget(new java.math.BigDecimal("5000000"))
                .entrepriseConcernee("Test Constructo")
                .pourcentageAvancement(0)
                .build();

        SignalementResponse response = signalementService.createSignalement(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Signalement de test créé"));
    }

    /**
     * Créer un nouveau signalement
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> createSignalement(
            @Valid @RequestBody SignalementRequest request,
            Principal principal) {

        log.info("Création d'un nouveau signalement par l'utilisateur: {}", principal.getName());
        SignalementResponse response = signalementService.createSignalement(request, principal.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Signalement créé avec succès"));
    }

    /**
     * Récupérer tous les signalements
     */
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllSignalements() {
        log.info("Récupération de tous les signalements");
        List<SignalementResponse> signalements = signalementService.getAllSignalements();

        return ResponseEntity.ok(ApiResponse.success(signalements, "Signalements récupérés avec succès"));
    }

    /**
     * Récupérer un signalement par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getSignalementById(
            @PathVariable String id) {

        log.info("Récupération du signalement: {}", id);
        SignalementResponse signalement = signalementService.getSignalementById(id);

        return ResponseEntity.ok(ApiResponse.success(signalement, "Signalement récupéré avec succès"));
    }

    /**
     * Récupérer les signalements de l'utilisateur connecté
     */
    @GetMapping("/utilisateur/mes-signalements")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> getMySignalements(
            Principal principal) {

        log.info("Récupération des signalements de l'utilisateur: {}", principal.getName());
        List<SignalementResponse> signalements = signalementService.getSignalementsByUser(principal.getName());

        return ResponseEntity.ok(ApiResponse.success(signalements, "Signalements récupérés avec succès"));
    }

    /**
     * Récupérer les signalements par statut
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<ApiResponse<?>> getSignalementsByStatut(
            @PathVariable String statut) {

        log.info("Récupération des signalements avec le statut: {}", statut);
        List<SignalementResponse> signalements = signalementService.getSignalementsByStatut(statut);

        return ResponseEntity.ok(ApiResponse.success(signalements, "Signalements récupérés avec succès"));
    }

    /**
     * Récupérer les signalements dans une zone géographique (PostGIS)
     */
    @GetMapping("/geo/bounds")
    public ResponseEntity<ApiResponse<?>> getSignalementsByBounds(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {

        log.info("Récupération des signalements dans la zone: minLat={}, maxLat={}, minLon={}, maxLon={}",
                minLat, maxLat, minLon, maxLon);
        List<SignalementResponse> signalements = signalementService
                .getSignalementsByGeographicBounds(minLat, maxLat, minLon, maxLon);

        return ResponseEntity.ok(ApiResponse.success(signalements, "Signalements récupérés avec succès"));
    }

    /**
     * Mettre à jour un signalement
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<ApiResponse<?>> updateSignalement(
            @PathVariable String id,
            @Valid @RequestBody SignalementRequest request) {

        log.info("Mise à jour du signalement: {}", id);
        SignalementResponse response = signalementService.updateSignalement(id, request);

        return ResponseEntity.ok(ApiResponse.success(response, "Signalement mis à jour avec succès"));
    }

    /**
     * Mettre à jour le statut d'un signalement
     */
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<ApiResponse<?>> updateStatut(
            @PathVariable String id,
            @RequestParam String statut) {

        log.info("Mise à jour du statut du signalement {} avec le nouveau statut: {}", id, statut);
        SignalementResponse response = signalementService.updateStatut(id, statut);

        return ResponseEntity.ok(ApiResponse.success(response, "Statut mis à jour avec succès"));
    }

    /**
     * Supprimer un signalement
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<ApiResponse<?>> deleteSignalement(@PathVariable String id) {

        log.info("Suppression du signalement: {}", id);
        signalementService.deleteSignalement(id);

        return ResponseEntity.ok(ApiResponse.success(null, "Signalement supprimé avec succès"));
    }

    /**
     * Obtenir les statistiques des signalements
     */
    @GetMapping("/stats/dashboard")
    public ResponseEntity<ApiResponse<?>> getStatistics() {

        log.info("Récupération des statistiques des signalements");
        SignalementStatisticsResponse stats = signalementService.getStatistics();

        return ResponseEntity.ok(ApiResponse.success(stats, "Statistiques récupérées avec succès"));
    }

    /**
     * Synchroniser tous les signalements non synchronisés vers Firebase
     */
    @PostMapping("/sync/push-all")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<ApiResponse<?>> syncPushAll() {

        log.info("Synchronisation de tous les signalements vers Firebase");
        signalementService.synchronizeAllPending();

        return ResponseEntity.ok(ApiResponse.success("Tous les signalements ont été synchronisés",
                "Synchronisation vers Firebase effectuée"));
    }

    /**
     * Synchroniser les données depuis Firebase
     */
    @PostMapping("/sync/pull-all")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<ApiResponse<?>> syncPullAll() {

        log.info("Synchronisation des données depuis Firebase");
        List<SignalementResponse> signalements = signalementService.syncFromFirebase();

        return ResponseEntity.ok(ApiResponse.success(signalements, "Synchronisation depuis Firebase effectuée"));
    }

    /**
     * TEST ENDPOINT - Synchroniser vers Firebase SANS authentification
     */
    @PostMapping("/test/sync-firebase-push")
    public ResponseEntity<ApiResponse<?>> testSyncToFirebase() {

        log.info("TEST: Synchronisation vers Firebase");
        signalementService.synchronizeAllPending();

        return ResponseEntity.ok(ApiResponse.success(
                null,
                "✅ Sync PUSH à Firebase - Tous les signalements non synchronisés ont été envoyés"));
    }

    /**
     * TEST ENDPOINT - Récupérer depuis Firebase SANS authentification
     */
    @PostMapping("/test/sync-firebase-pull")
    public ResponseEntity<ApiResponse<?>> testSyncFromFirebase() {

        log.info("TEST: Récupération des données depuis Firebase");
        List<SignalementResponse> signalements = signalementService.syncFromFirebase();

        return ResponseEntity.ok(ApiResponse.success(
                signalements,
                "✅ Sync PULL depuis Firebase - " + signalements.size() + " signalements récupérés"));
    }

    /**
     * TEST ENDPOINT - Récupérer tous les signalements SANS authentification
     */
    @GetMapping("/test/all")
    public ResponseEntity<ApiResponse<?>> testGetAll() {

        log.info("TEST: Récupération de tous les signalements");
        List<SignalementResponse> signalements = signalementService.getAllSignalements();

        return ResponseEntity.ok(ApiResponse.success(
                signalements,
                "✅ " + signalements.size() + " signalements récupérés"));
    }
}

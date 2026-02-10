package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.entity.Signalement;
import com.idp.entity.TypeReparation;
import com.idp.service.TypeReparationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/type-reparations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Types de Réparation", description = "API de gestion des types de réparation routière")
public class TypeReparationController {

    private final TypeReparationService typeReparationService;

    /**
     * Récupérer tous les types de réparation (MANAGER)
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Lister tous les types de réparation")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllTypes() {
        log.info("Récupération de tous les types de réparation");

        List<TypeReparation> types = typeReparationService.getAllTypes();
        List<Map<String, Object>> response = types.stream()
                .map(this::mapTypeToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(response,
                "Total: " + types.size() + " types de réparation"));
    }

    /**
     * Récupérer les types actifs (lecture publique pour visiteurs)
     */
    @GetMapping("/active")
    @Operation(summary = "Lister les types de réparation actifs (public)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActiveTypes() {
        log.info("Récupération des types de réparation actifs");

        List<TypeReparation> types = typeReparationService.getActiveTypes();
        List<Map<String, Object>> response = types.stream()
                .map(this::mapTypeToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(response,
                "Total: " + types.size() + " types actifs"));
    }

    /**
     * Récupérer un type par ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Obtenir les détails d'un type de réparation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTypeById(@PathVariable String id) {
        log.info("Récupération du type de réparation: {}", id);

        TypeReparation type = typeReparationService.getTypeById(id);
        return ResponseEntity.ok(ApiResponse.success(mapTypeToResponse(type),
                "Type de réparation trouvé"));
    }

    /**
     * Créer un nouveau type de réparation (MANAGER)
     */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Créer un type de réparation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createType(
            @Valid @RequestBody TypeReparationRequest request) {
        log.info("Création d'un type de réparation: {}", request.getNom());

        TypeReparation type = TypeReparation.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .niveau(request.getNiveau())
                .prixM2(request.getPrixM2())
                .isActive(true)
                .build();

        TypeReparation created = typeReparationService.createType(type);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(mapTypeToResponse(created),
                        "Type de réparation créé avec succès"));
    }

    /**
     * Mettre à jour un type de réparation (MANAGER)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Modifier un type de réparation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateType(
            @PathVariable String id,
            @RequestBody TypeReparationRequest request) {
        log.info("Mise à jour du type de réparation: {}", id);

        TypeReparation updates = TypeReparation.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .niveau(request.getNiveau())
                .prixM2(request.getPrixM2())
                .isActive(request.getIsActive())
                .build();

        TypeReparation updated = typeReparationService.updateType(id, updates);

        return ResponseEntity.ok(ApiResponse.success(mapTypeToResponse(updated),
                "Type de réparation mis à jour"));
    }

    /**
     * Supprimer un type de réparation (désactivation, MANAGER)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Supprimer (désactiver) un type de réparation")
    public ResponseEntity<ApiResponse<Void>> deleteType(@PathVariable String id) {
        log.info("Suppression du type de réparation: {}", id);
        typeReparationService.deleteType(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Type de réparation désactivé"));
    }

    /**
     * Affecter un type à un signalement et calculer le budget (MANAGER)
     */
    @PostMapping("/assign")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Affecter un type de réparation à un signalement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> assignTypeToSignalement(
            @RequestBody AssignTypeRequest request) {
        log.info("Affectation du type {} au signalement {}",
                request.getTypeReparationId(), request.getSignalementId());

        Signalement signalement = typeReparationService.assignTypeToSignalement(
                request.getSignalementId(),
                request.getTypeReparationId());

        Map<String, Object> response = new HashMap<>();
        response.put("signalementId", signalement.getId());
        response.put("typeReparation",
                signalement.getTypeReparation() != null ? mapTypeToResponse(signalement.getTypeReparation()) : null);
        response.put("surfaceM2", signalement.getSurfaceM2());
        response.put("budgetCalcule", signalement.getBudget());
        response.put("message", "Type affecté et budget calculé automatiquement");

        return ResponseEntity.ok(ApiResponse.success(response,
                "Type de réparation affecté avec succès. Budget: " + signalement.getBudget() + " MGA"));
    }

    /**
     * Recalculer le budget d'un signalement (MANAGER)
     */
    @PostMapping("/recalculate-budget/{signalementId}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Recalculer le budget d'un signalement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recalculateBudget(
            @PathVariable String signalementId) {
        log.info("Recalcul du budget pour le signalement: {}", signalementId);

        Signalement signalement = typeReparationService.recalculateBudget(signalementId);

        Map<String, Object> response = new HashMap<>();
        response.put("signalementId", signalement.getId());
        response.put("surfaceM2", signalement.getSurfaceM2());
        response.put("prixM2", signalement.getTypeReparation().getPrixM2());
        response.put("budgetCalcule", signalement.getBudget());

        return ResponseEntity.ok(ApiResponse.success(response,
                "Budget recalculé: " + signalement.getBudget() + " MGA"));
    }

    /**
     * Calculer un budget prévisonnel (sans modifier en base)
     */
    @GetMapping("/calculate-budget")
    @Operation(summary = "Calculer un budget prévisionnel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateBudget(
            @RequestParam BigDecimal surfaceM2,
            @RequestParam BigDecimal prixM2) {
        log.info("Calcul budget prévisionnel: surface={}, prixM2={}", surfaceM2, prixM2);

        BigDecimal budget = typeReparationService.calculateBudget(surfaceM2, prixM2);

        Map<String, Object> response = new HashMap<>();
        response.put("surfaceM2", surfaceM2);
        response.put("prixM2", prixM2);
        response.put("budgetCalcule", budget);
        response.put("formule", "budget = surfaceM2 × prixM2");

        return ResponseEntity.ok(ApiResponse.success(response, "Budget calculé: " + budget + " MGA"));
    }

    /**
     * Mapper un TypeReparation vers une réponse Map
     */
    private Map<String, Object> mapTypeToResponse(TypeReparation type) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", type.getId());
        map.put("nom", type.getNom());
        map.put("description", type.getDescription());
        map.put("niveau", type.getNiveau());
        map.put("prixM2", type.getPrixM2());
        map.put("isActive", type.getIsActive());
        map.put("createdAt", type.getCreatedAt());
        map.put("updatedAt", type.getUpdatedAt());
        return map;
    }

    /**
     * DTO pour la création/mise à jour d'un type de réparation
     */
    @lombok.Data
    public static class TypeReparationRequest {
        private String nom;
        private String description;
        private Integer niveau;
        private BigDecimal prixM2;
        private Boolean isActive;
    }

    /**
     * DTO pour l'affectation d'un type à un signalement
     */
    @lombok.Data
    public static class AssignTypeRequest {
        private String signalementId;
        private String typeReparationId;
    }
}

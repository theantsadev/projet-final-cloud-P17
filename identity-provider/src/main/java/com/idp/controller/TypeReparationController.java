package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.entity.GlobalConfig;
import com.idp.entity.Signalement;
import com.idp.entity.TypeReparation;
import com.idp.service.GlobalConfigService;
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
    private final GlobalConfigService globalConfigService;

    // ==================== PRIX GLOBAL ====================

    /**
     * Récupérer le prix global au m²
     */
    @GetMapping("/prix-global")
    @Operation(summary = "Obtenir le prix global au m² (public)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPrixGlobal() {
        log.info("Récupération du prix global au m²");

        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();

        Map<String, Object> response = new HashMap<>();
        response.put("prixM2Global", prixM2Global);
        response.put("formule", "budget = prix_m2_global × niveau × surface_m2");

        return ResponseEntity.ok(ApiResponse.success(response, "Prix global: " + prixM2Global + " Ar/m²"));
    }

    /**
     * Mettre à jour le prix global au m² (MANAGER)
     */
    @PutMapping("/prix-global")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Modifier le prix global au m²")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setPrixGlobal(
            @RequestBody PrixGlobalRequest request) {
        log.info("Mise à jour du prix global au m²: {}", request.getPrixM2Global());

        GlobalConfig config = globalConfigService.setPrixM2Global(request.getPrixM2Global());

        Map<String, Object> response = new HashMap<>();
        response.put("prixM2Global", config.getValueAsBigDecimal());
        response.put("updatedAt", config.getUpdatedAt());

        return ResponseEntity.ok(ApiResponse.success(response, 
                "Prix global mis à jour: " + config.getValueAsBigDecimal() + " Ar/m²"));
    }

    // ==================== TYPES DE RÉPARATION ====================

    /**
     * Récupérer tous les types de réparation (MANAGER)
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Lister tous les types de réparation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllTypes() {
        log.info("Récupération de tous les types de réparation");

        List<TypeReparation> types = typeReparationService.getAllTypes();
        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();

        List<Map<String, Object>> typesList = types.stream()
                .map(this::mapTypeToResponse)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("types", typesList);
        response.put("prixM2Global", prixM2Global);
        response.put("formule", "budget = prix_m2_global × niveau × surface_m2");

        return ResponseEntity.ok(ApiResponse.success(response,
                "Total: " + types.size() + " types de réparation"));
    }

    /**
     * Récupérer les types actifs (lecture publique pour visiteurs)
     */
    @GetMapping("/active")
    @Operation(summary = "Lister les types de réparation actifs (public)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActiveTypes() {
        log.info("Récupération des types de réparation actifs");

        List<TypeReparation> types = typeReparationService.getActiveTypes();
        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();

        List<Map<String, Object>> typesList = types.stream()
                .map(this::mapTypeToResponse)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("types", typesList);
        response.put("prixM2Global", prixM2Global);

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

    // ==================== AFFECTATION ET CALCUL ====================

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

        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();

        Map<String, Object> response = new HashMap<>();
        response.put("signalementId", signalement.getId());
        response.put("niveau", signalement.getNiveau());
        response.put("surfaceM2", signalement.getSurfaceM2());
        response.put("prixM2Global", prixM2Global);
        response.put("budgetCalcule", signalement.getBudget());
        response.put("formule", "budget = " + prixM2Global + " × " + signalement.getNiveau() + " × " + signalement.getSurfaceM2());
        response.put("typeReparation",
                signalement.getTypeReparation() != null ? mapTypeToResponse(signalement.getTypeReparation()) : null);

        return ResponseEntity.ok(ApiResponse.success(response,
                "Type de réparation affecté avec succès. Budget: " + signalement.getBudget() + " MGA"));
    }

    /**
     * Définir le niveau d'un signalement et calculer son budget (MANAGER)
     */
    @PostMapping("/set-niveau")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Définir le niveau d'un signalement et calculer le budget")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setNiveau(
            @RequestBody SetNiveauRequest request) {
        log.info("Définition du niveau {} pour le signalement {}", 
                request.getNiveau(), request.getSignalementId());

        Signalement signalement = typeReparationService.setNiveauAndCalculateBudget(
                request.getSignalementId(), request.getNiveau());

        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();

        Map<String, Object> response = new HashMap<>();
        response.put("signalementId", signalement.getId());
        response.put("niveau", signalement.getNiveau());
        response.put("surfaceM2", signalement.getSurfaceM2());
        response.put("prixM2Global", prixM2Global);
        response.put("budgetCalcule", signalement.getBudget());
        response.put("formule", "budget = " + prixM2Global + " × " + signalement.getNiveau() + " × " + signalement.getSurfaceM2());

        return ResponseEntity.ok(ApiResponse.success(response,
                "Niveau défini. Budget calculé: " + signalement.getBudget() + " MGA"));
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
        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();

        Map<String, Object> response = new HashMap<>();
        response.put("signalementId", signalement.getId());
        response.put("niveau", signalement.getNiveau());
        response.put("surfaceM2", signalement.getSurfaceM2());
        response.put("prixM2Global", prixM2Global);
        response.put("budgetCalcule", signalement.getBudget());

        return ResponseEntity.ok(ApiResponse.success(response,
                "Budget recalculé: " + signalement.getBudget() + " MGA"));
    }

    /**
     * Calculer un budget prévisionnel (sans modifier en base)
     */
    @GetMapping("/calculate-budget")
    @Operation(summary = "Calculer un budget prévisionnel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateBudget(
            @RequestParam BigDecimal surfaceM2,
            @RequestParam Integer niveau) {
        log.info("Calcul budget prévisionnel: surface={}, niveau={}", surfaceM2, niveau);

        BigDecimal prixM2Global = globalConfigService.getPrixM2Global();
        BigDecimal budget = globalConfigService.calculateBudget(surfaceM2, niveau);

        Map<String, Object> response = new HashMap<>();
        response.put("surfaceM2", surfaceM2);
        response.put("niveau", niveau);
        response.put("prixM2Global", prixM2Global);
        response.put("budgetCalcule", budget);
        response.put("formule", "budget = prix_m2_global × niveau × surface_m2");
        response.put("detail", prixM2Global + " × " + niveau + " × " + surfaceM2 + " = " + budget);

        return ResponseEntity.ok(ApiResponse.success(response, "Budget calculé: " + budget + " MGA"));
    }

    // ==================== MAPPERS ====================

    /**
     * Mapper un TypeReparation vers une réponse Map
     */
    private Map<String, Object> mapTypeToResponse(TypeReparation type) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", type.getId());
        map.put("nom", type.getNom());
        map.put("description", type.getDescription());
        map.put("niveau", type.getNiveau());
        map.put("isActive", type.getIsActive());
        map.put("createdAt", type.getCreatedAt());
        map.put("updatedAt", type.getUpdatedAt());
        return map;
    }

    // ==================== DTOs ====================

    /**
     * DTO pour la création/mise à jour d'un type de réparation
     */
    @lombok.Data
    public static class TypeReparationRequest {
        private String nom;
        private String description;
        private Integer niveau;
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

    /**
     * DTO pour définir le niveau d'un signalement
     */
    @lombok.Data
    public static class SetNiveauRequest {
        private String signalementId;
        private Integer niveau;
    }

    /**
     * DTO pour modifier le prix global
     */
    @lombok.Data
    public static class PrixGlobalRequest {
        private BigDecimal prixM2Global;
    }
}

package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.entity.StatutAvancementSignalement;
import com.idp.service.StatutAvancementSignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statuts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Statuts d'Avancement", description = "API de gestion des statuts d'avancement des signalements")
public class StatutAvancementSignalementController {

    private final StatutAvancementSignalementService statutService;

    /**
     * Lister tous les statuts
     */
    @GetMapping
    @Operation(summary = "Lister tous les statuts d'avancement")
    public ResponseEntity<ApiResponse<List<StatutAvancementSignalement>>> getAll() {
        log.info("📖 Récupération de tous les statuts d'avancement");
        
        List<StatutAvancementSignalement> statuts = statutService.getAll();
        
        return ResponseEntity.ok(ApiResponse.success(statuts,
                "Total de statuts: " + statuts.size()));
    }

    /**
     * Récupérer un statut par ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un statut par ID")
    public ResponseEntity<ApiResponse<StatutAvancementSignalement>> getById(@PathVariable String id) {
        log.info("🔍 Récupération du statut: {}", id);
        
        StatutAvancementSignalement statut = statutService.getById(id);
        
        return ResponseEntity.ok(ApiResponse.success(statut,
                "Statut trouvé: " + statut.getStatut()));
    }

    /**
     * Rechercher un statut par son label
     */
    @GetMapping("/search/{statut}")
    @Operation(summary = "Rechercher un statut par son label (NOUVEAU, EN_COURS, etc.)")
    public ResponseEntity<ApiResponse<StatutAvancementSignalement>> getByStatut(@PathVariable String statut) {
        log.info("🔍 Recherche du statut par label: {}", statut);
        
        StatutAvancementSignalement found = statutService.getByStatut(statut);
        
        return ResponseEntity.ok(ApiResponse.success(found,
                "Statut trouvé"));
    }

    /**
     * Créer un nouveau statut
     */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Créer un nouveau statut d'avancement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @RequestParam String statut,
            @RequestParam Integer avancement) {
        log.info("📝 Création d'un nouveau statut: {} (avancement: {}%)", statut, avancement);
        
        StatutAvancementSignalement newStatut = statutService.create(statut, avancement);
        
        Map<String, Object> response = Map.of(
                "id", newStatut.getId(),
                "statut", newStatut.getStatut(),
                "avancement", newStatut.getAvancement()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response,
                "Statut créé avec succès"));
    }

    /**
     * Mettre à jour un statut
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Mettre à jour un statut d'avancement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            @PathVariable String id,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Integer avancement) {
        log.info("✏️ Mise à jour du statut: {}", id);
        
        StatutAvancementSignalement updated = statutService.update(id, statut, avancement);
        
        Map<String, Object> response = Map.of(
                "id", updated.getId(),
                "statut", updated.getStatut(),
                "avancement", updated.getAvancement()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response,
                "Statut mis à jour avec succès"));
    }

    /**
     * Supprimer un statut
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Supprimer un statut d'avancement")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        log.info("🗑️ Suppression du statut: {}", id);
        
        statutService.delete(id);
        
        return ResponseEntity.ok(ApiResponse.success(null,
                "Statut supprimé avec succès"));
    }

    /**
     * Synchroniser UN statut vers Firebase
     */
    @PostMapping("/{id}/sync-firebase")
    @Operation(summary = "Synchroniser UN statut vers Firebase")
    public ResponseEntity<ApiResponse<Map<String, Object>>> synchroniseToFirebase(@PathVariable String id) {
        log.info("📤 Synchronisation du statut {} vers Firebase", id);
        
        try {
            statutService.synchroniseToFirebase(id);
            
            Map<String, Object> response = Map.of(
                    "statutId", id,
                    "status", "synchronized",
                    "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(ApiResponse.success(response,
                    "Statut synchronisé vers Firebase avec succès"));
        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponse.error(
                    "Erreur lors de la synchronisation: " + e.getMessage(),
                    "SYNC_ERROR",
                    500));
        }
    }

    /**
     * Synchroniser TOUS les statuts vers Firebase
     */
    @PostMapping("/sync-firebase/all")
    @Operation(summary = "Synchroniser TOUS les statuts vers Firebase")
    public ResponseEntity<ApiResponse<Map<String, Object>>> synchroniseAllToFirebase() {
        log.info("📤 Synchronisation de TOUS les statuts vers Firebase");
        
        try {
            statutService.synchroniseAllToFirebase();
            
            List<StatutAvancementSignalement> allStatuts = statutService.getAll();
            Map<String, Object> response = Map.of(
                    "totalStatuts", allStatuts.size(),
                    "status", "synchronized",
                    "timestamp", System.currentTimeMillis()
            );
            
            return ResponseEntity.ok(ApiResponse.success(response,
                    "Tous les statuts ont été synchronisés vers Firebase"));
        } catch (Exception e) {
            log.error("❌ Erreur lors de la synchronisation: {}", e.getMessage());
            return ResponseEntity.status(500).body(ApiResponse.error(
                    "Erreur lors de la synchronisation: " + e.getMessage(),
                    "SYNC_ERROR",
                    500));
        }
    }
}

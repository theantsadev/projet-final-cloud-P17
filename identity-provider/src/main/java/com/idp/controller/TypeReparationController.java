package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.dto.TypeReparationRequest;
import com.idp.dto.TypeReparationResponse;
import com.idp.service.TypeReparationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/types-reparation")
@RequiredArgsConstructor
@Slf4j
public class TypeReparationController {

    private final TypeReparationService typeReparationService;

    /**
     * Créer un nouveau type de réparation
     */
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody TypeReparationRequest request) {
        log.info("Création d'un type de réparation: {}", request.getNom());
        TypeReparationResponse response = typeReparationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Type de réparation créé avec succès"));
    }

    /**
     * Récupérer tous les types de réparation
     */
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll() {
        log.info("Récupération de tous les types de réparation");
        List<TypeReparationResponse> responses = typeReparationService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses, "Types de réparation récupérés avec succès"));
    }

    /**
     * Récupérer un type de réparation par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable String id) {
        log.info("Récupération du type de réparation: {}", id);
        TypeReparationResponse response = typeReparationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Type de réparation récupéré avec succès"));
    }

    /**
     * Récupérer les types de réparation par niveau
     */
    @GetMapping("/niveau/{niveau}")
    public ResponseEntity<ApiResponse<?>> getByNiveau(@PathVariable Integer niveau) {
        log.info("Récupération des types de réparation avec niveau: {}", niveau);
        List<TypeReparationResponse> responses = typeReparationService.getByNiveau(niveau);
        return ResponseEntity.ok(ApiResponse.success(responses, "Types de réparation récupérés avec succès"));
    }

    /**
     * Récupérer les types de réparation dans une plage de niveaux
     */
    @GetMapping("/niveau/range")
    public ResponseEntity<ApiResponse<?>> getByNiveauRange(
            @RequestParam Integer min,
            @RequestParam Integer max) {
        log.info("Récupération des types de réparation entre niveau {} et {}", min, max);
        List<TypeReparationResponse> responses = typeReparationService.getByNiveauRange(min, max);
        return ResponseEntity.ok(ApiResponse.success(responses, "Types de réparation récupérés avec succès"));
    }

    /**
     * Mettre à jour un type de réparation
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable String id,
            @Valid @RequestBody TypeReparationRequest request) {
        log.info("Mise à jour du type de réparation: {}", id);
        TypeReparationResponse response = typeReparationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Type de réparation mis à jour avec succès"));
    }

    /**
     * Supprimer un type de réparation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        log.info("Suppression du type de réparation: {}", id);
        typeReparationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Type de réparation supprimé avec succès"));
    }
}

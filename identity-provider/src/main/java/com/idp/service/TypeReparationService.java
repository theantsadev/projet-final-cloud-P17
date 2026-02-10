package com.idp.service;

import com.idp.dto.TypeReparationRequest;
import com.idp.dto.TypeReparationResponse;
import com.idp.entity.TypeReparation;
import com.idp.exception.BusinessException;
import com.idp.repository.TypeReparationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TypeReparationService {

    private final TypeReparationRepository typeReparationRepository;

    /**
     * Créer un nouveau type de réparation
     */
    @Transactional
    public TypeReparationResponse create(TypeReparationRequest request) {
        // Vérifier l'unicité du nom
        if (typeReparationRepository.existsByNom(request.getNom())) {
            throw new BusinessException("TYPE_REPARATION_DUPLICATE",
                    "Un type de réparation avec le nom '" + request.getNom() + "' existe déjà");
        }

        // Valider le niveau
        validateNiveau(request.getNiveau());

        TypeReparation typeReparation = TypeReparation.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .coutUnitaire(request.getCoutUnitaire())
                .unite(request.getUnite() != null ? request.getUnite() : "m2")
                .niveau(request.getNiveau())
                .build();

        typeReparation = typeReparationRepository.save(typeReparation);
        log.info("Type de réparation créé: {} (niveau {})", typeReparation.getNom(), typeReparation.getNiveau());

        return mapToResponse(typeReparation);
    }

    /**
     * Récupérer tous les types de réparation
     */
    public List<TypeReparationResponse> getAll() {
        return typeReparationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un type de réparation par ID
     */
    public TypeReparationResponse getById(String id) {
        TypeReparation typeReparation = typeReparationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("TYPE_REPARATION_NOT_FOUND",
                        "Type de réparation non trouvé avec l'ID: " + id));
        return mapToResponse(typeReparation);
    }

    /**
     * Récupérer les types de réparation par niveau
     */
    public List<TypeReparationResponse> getByNiveau(Integer niveau) {
        validateNiveau(niveau);
        return typeReparationRepository.findByNiveau(niveau)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les types de réparation dans une plage de niveaux
     */
    public List<TypeReparationResponse> getByNiveauRange(Integer niveauMin, Integer niveauMax) {
        validateNiveau(niveauMin);
        validateNiveau(niveauMax);
        if (niveauMin > niveauMax) {
            throw new BusinessException("INVALID_NIVEAU_RANGE",
                    "Le niveau minimum (" + niveauMin + ") ne peut pas être supérieur au niveau maximum (" + niveauMax + ")");
        }
        return typeReparationRepository.findByNiveauBetween(niveauMin, niveauMax)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Mettre à jour un type de réparation
     */
    @Transactional
    public TypeReparationResponse update(String id, TypeReparationRequest request) {
        TypeReparation typeReparation = typeReparationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("TYPE_REPARATION_NOT_FOUND",
                        "Type de réparation non trouvé avec l'ID: " + id));

        // Vérifier l'unicité du nom si changé
        if (!typeReparation.getNom().equals(request.getNom()) && typeReparationRepository.existsByNom(request.getNom())) {
            throw new BusinessException("TYPE_REPARATION_DUPLICATE",
                    "Un type de réparation avec le nom '" + request.getNom() + "' existe déjà");
        }

        // Valider le niveau
        validateNiveau(request.getNiveau());

        typeReparation.setNom(request.getNom());
        typeReparation.setDescription(request.getDescription());
        typeReparation.setCoutUnitaire(request.getCoutUnitaire());
        typeReparation.setUnite(request.getUnite() != null ? request.getUnite() : "m2");
        typeReparation.setNiveau(request.getNiveau());

        typeReparation = typeReparationRepository.save(typeReparation);
        log.info("Type de réparation mis à jour: {} (niveau {})", typeReparation.getNom(), typeReparation.getNiveau());

        return mapToResponse(typeReparation);
    }

    /**
     * Supprimer un type de réparation
     */
    @Transactional
    public void delete(String id) {
        TypeReparation typeReparation = typeReparationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("TYPE_REPARATION_NOT_FOUND",
                        "Type de réparation non trouvé avec l'ID: " + id));

        typeReparationRepository.delete(typeReparation);
        log.info("Type de réparation supprimé: {}", typeReparation.getNom());
    }

    /**
     * Valider que le niveau est entre 1 et 10
     */
    private void validateNiveau(Integer niveau) {
        if (niveau == null || niveau < 1 || niveau > 10) {
            throw new BusinessException("INVALID_NIVEAU",
                    "Le niveau doit être compris entre 1 et 10 (reçu: " + niveau + ")");
        }
    }

    /**
     * Mapper entité vers DTO response
     */
    private TypeReparationResponse mapToResponse(TypeReparation typeReparation) {
        return TypeReparationResponse.builder()
                .id(typeReparation.getId())
                .nom(typeReparation.getNom())
                .description(typeReparation.getDescription())
                .coutUnitaire(typeReparation.getCoutUnitaire())
                .unite(typeReparation.getUnite())
                .niveau(typeReparation.getNiveau())
                .createdAt(typeReparation.getCreatedAt())
                .updatedAt(typeReparation.getUpdatedAt())
                .build();
    }
}

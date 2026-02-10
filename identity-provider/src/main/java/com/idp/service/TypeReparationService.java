package com.idp.service;

import com.idp.entity.Signalement;
import com.idp.entity.TypeReparation;
import com.idp.exception.BusinessException;
import com.idp.repository.SignalementRepository;
import com.idp.repository.TypeReparationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service métier pour la gestion des types de réparation.
 * Implémente le calcul automatique du budget: budget = surfaceM2 * prixM2
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TypeReparationService {

    private final TypeReparationRepository typeReparationRepository;
    private final SignalementRepository signalementRepository;

    /**
     * Récupérer tous les types de réparation (triés par niveau)
     */
    public List<TypeReparation> getAllTypes() {
        log.info("Récupération de tous les types de réparation");
        return typeReparationRepository.findAllByOrderByNiveauAsc();
    }

    /**
     * Récupérer uniquement les types actifs
     */
    public List<TypeReparation> getActiveTypes() {
        log.info("Récupération des types de réparation actifs");
        return typeReparationRepository.findByIsActiveTrueOrderByNiveauAsc();
    }

    /**
     * Récupérer un type par ID
     */
    public TypeReparation getTypeById(String id) {
        return typeReparationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("TYPE_NOT_FOUND", 
                        "Type de réparation non trouvé avec l'ID: " + id));
    }

    /**
     * Créer un nouveau type de réparation
     * Validation: niveau entre 1 et 10
     */
    @Transactional
    public TypeReparation createType(TypeReparation type) {
        log.info("Création d'un type de réparation: {}", type.getNom());

        // Validation du niveau
        validateNiveau(type.getNiveau());

        // Vérifier que le nom n'existe pas déjà
        if (typeReparationRepository.existsByNomIgnoreCase(type.getNom())) {
            throw new BusinessException("TYPE_NAME_EXISTS", 
                    "Un type de réparation avec ce nom existe déjà: " + type.getNom());
        }

        // Valider le prix
        if (type.getPrixM2() == null || type.getPrixM2().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_PRICE", 
                    "Le prix au m² doit être supérieur à 0");
        }

        TypeReparation saved = typeReparationRepository.save(type);
        log.info("✅ Type de réparation créé: {} (niveau {})", saved.getNom(), saved.getNiveau());
        return saved;
    }

    /**
     * Mettre à jour un type de réparation
     */
    @Transactional
    public TypeReparation updateType(String id, TypeReparation updates) {
        log.info("Mise à jour du type de réparation: {}", id);

        TypeReparation existing = getTypeById(id);

        // Validation du niveau si modifié
        if (updates.getNiveau() != null) {
            validateNiveau(updates.getNiveau());
            existing.setNiveau(updates.getNiveau());
        }

        // Mise à jour du nom si modifié
        if (updates.getNom() != null && !updates.getNom().equals(existing.getNom())) {
            if (typeReparationRepository.existsByNomIgnoreCase(updates.getNom())) {
                throw new BusinessException("TYPE_NAME_EXISTS", 
                        "Un type de réparation avec ce nom existe déjà: " + updates.getNom());
            }
            existing.setNom(updates.getNom());
        }

        // Mise à jour du prix
        if (updates.getPrixM2() != null) {
            if (updates.getPrixM2().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("INVALID_PRICE", 
                        "Le prix au m² doit être supérieur à 0");
            }
            existing.setPrixM2(updates.getPrixM2());
        }

        // Mise à jour de la description
        if (updates.getDescription() != null) {
            existing.setDescription(updates.getDescription());
        }

        // Mise à jour du statut actif
        if (updates.getIsActive() != null) {
            existing.setIsActive(updates.getIsActive());
        }

        TypeReparation saved = typeReparationRepository.save(existing);
        log.info("✅ Type de réparation mis à jour: {}", saved.getNom());
        return saved;
    }

    /**
     * Supprimer un type de réparation (désactivation soft)
     */
    @Transactional
    public void deleteType(String id) {
        log.info("Suppression du type de réparation: {}", id);
        TypeReparation type = getTypeById(id);
        type.setIsActive(false);
        typeReparationRepository.save(type);
        log.info("✅ Type de réparation désactivé: {}", type.getNom());
    }

    /**
     * Suppression définitive
     */
    @Transactional
    public void hardDelete(String id) {
        log.info("Suppression définitive du type de réparation: {}", id);
        TypeReparation type = getTypeById(id);
        typeReparationRepository.delete(type);
        log.info("✅ Type de réparation supprimé définitivement: {}", type.getNom());
    }

    /**
     * Affecter un type de réparation à un signalement et calculer le budget
     * Budget = surfaceM2 * prixM2
     */
    @Transactional
    public Signalement assignTypeToSignalement(String signalementId, String typeReparationId) {
        log.info("Affectation du type {} au signalement {}", typeReparationId, signalementId);

        Signalement signalement = signalementRepository.findById(signalementId)
                .orElseThrow(() -> new BusinessException("SIGNALEMENT_NOT_FOUND",
                        "Signalement non trouvé avec l'ID: " + signalementId));

        TypeReparation typeReparation = getTypeById(typeReparationId);

        // Affecter le type
        signalement.setTypeReparation(typeReparation);

        // Calculer le budget automatiquement si la surface est définie
        BigDecimal calculatedBudget = calculateBudget(signalement.getSurfaceM2(), typeReparation.getPrixM2());
        signalement.setBudget(calculatedBudget);

        Signalement saved = signalementRepository.save(signalement);
        log.info("✅ Type {} affecté au signalement {}. Budget calculé: {} MGA",
                typeReparation.getNom(), signalementId, calculatedBudget);

        return saved;
    }

    /**
     * Calculer le budget d'un signalement
     * Formule: budget = surfaceM2 * prixM2
     */
    public BigDecimal calculateBudget(BigDecimal surfaceM2, BigDecimal prixM2) {
        if (surfaceM2 == null || prixM2 == null) {
            log.warn("Surface ou prix non défini, budget = 0");
            return BigDecimal.ZERO;
        }
        return surfaceM2.multiply(prixM2);
    }

    /**
     * Recalculer le budget d'un signalement existant
     */
    @Transactional
    public Signalement recalculateBudget(String signalementId) {
        log.info("Recalcul du budget pour le signalement: {}", signalementId);

        Signalement signalement = signalementRepository.findById(signalementId)
                .orElseThrow(() -> new BusinessException("SIGNALEMENT_NOT_FOUND",
                        "Signalement non trouvé avec l'ID: " + signalementId));

        if (signalement.getTypeReparation() == null) {
            throw new BusinessException("NO_TYPE_ASSIGNED",
                    "Aucun type de réparation affecté à ce signalement");
        }

        BigDecimal newBudget = calculateBudget(
                signalement.getSurfaceM2(),
                signalement.getTypeReparation().getPrixM2()
        );
        signalement.setBudget(newBudget);

        Signalement saved = signalementRepository.save(signalement);
        log.info("✅ Budget recalculé: {} MGA", newBudget);
        return saved;
    }

    /**
     * Validation du niveau (1 ≤ niveau ≤ 10)
     */
    private void validateNiveau(Integer niveau) {
        if (niveau == null) {
            throw new BusinessException("NIVEAU_REQUIRED", "Le niveau est obligatoire");
        }
        if (niveau < 1 || niveau > 10) {
            throw new BusinessException("INVALID_NIVEAU",
                    "Le niveau doit être compris entre 1 et 10. Valeur reçue: " + niveau);
        }
    }

    /**
     * Statistiques: nombre total de types actifs
     */
    public long countActiveTypes() {
        return typeReparationRepository.countByIsActiveTrue();
    }
}

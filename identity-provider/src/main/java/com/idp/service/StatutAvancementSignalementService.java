package com.idp.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.idp.entity.StatutAvancementSignalement;
import com.idp.exception.BusinessException;
import com.idp.repository.StatutAvancementSignalementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatutAvancementSignalementService {

    private final StatutAvancementSignalementRepository statutRepository;
    private final Firestore firestore;

    // Collection Firestore
    private static final String FIRESTORE_STATUTS_COLLECTION = "statut_avancement_signalement";

    // Formateur de dates
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Créer un nouveau statut d'avancement
     */
    @Transactional
    public StatutAvancementSignalement create(String statut, Integer avancement) {
        log.info("📝 Création d'un nouveau statut: {} (avancement: {}%)", statut, avancement);

        if (statut == null || statut.trim().isEmpty()) {
            throw new BusinessException("INVALID_STATUT", "Le statut ne peut pas être vide");
        }

        if (avancement == null || avancement < 0 || avancement > 100) {
            throw new BusinessException("INVALID_AVANCEMENT", "L'avancement doit être entre 0 et 100");
        }

        // Vérifier que le statut n'existe pas déjà
        if (statutRepository.findByStatut(statut).isPresent()) {
            throw new BusinessException("STATUT_ALREADY_EXISTS", "Ce statut existe déjà");
        }

        StatutAvancementSignalement nouveauStatut = StatutAvancementSignalement.builder()
                .id(UUID.randomUUID().toString())
                .statut(statut)
                .avancement(avancement)
                .build();

        StatutAvancementSignalement saved = statutRepository.save(nouveauStatut);
        log.info("✅ Statut créé avec succès: {} (ID: {})", statut, saved.getId());

        return saved;
    }

    /**
     * Récupérer tous les statuts
     */
    public List<StatutAvancementSignalement> getAll() {
        log.info("📖 Récupération de tous les statuts d'avancement");
        return statutRepository.findAll();
    }

    /**
     * Récupérer un statut par ID
     */
    public StatutAvancementSignalement getById(String id) {
        log.info("🔍 Recherche du statut: {}", id);
        return statutRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("⚠️ Statut non trouvé: {}", id);
                    return new BusinessException("STATUT_NOT_FOUND", "Statut non trouvé avec l'ID: " + id);
                });
    }

    /**
     * Récupérer un statut par son label
     */
    public StatutAvancementSignalement getByStatut(String statut) {
        log.info("🔍 Recherche du statut par label: {}", statut);
        return statutRepository.findByStatut(statut)
                .orElseThrow(() -> {
                    log.warn("⚠️ Statut non trouvé: {}", statut);
                    return new BusinessException("STATUT_NOT_FOUND", "Statut non trouvé: " + statut);
                });
    }

    /**
     * Mettre à jour un statut
     */
    @Transactional
    public StatutAvancementSignalement update(String id, String statut, Integer avancement) {
        log.info("✏️ Mise à jour du statut: {}", id);

        StatutAvancementSignalement existing = getById(id);

        if (statut != null && !statut.trim().isEmpty() && !statut.equals(existing.getStatut())) {
            // Vérifier qu'un autre statut n'a pas le même nom
            if (statutRepository.findByStatut(statut).isPresent()) {
                throw new BusinessException("STATUT_ALREADY_EXISTS", "Ce statut existe déjà");
            }
            existing.setStatut(statut);
        }

        if (avancement != null) {
            if (avancement < 0 || avancement > 100) {
                throw new BusinessException("INVALID_AVANCEMENT", "L'avancement doit être entre 0 et 100");
            }
            existing.setAvancement(avancement);
        }

        StatutAvancementSignalement updated = statutRepository.save(existing);
        log.info("✅ Statut mis à jour avec succès: {}", id);

        return updated;
    }

    /**
     * Supprimer un statut
     */
    @Transactional
    public void delete(String id) {
        log.info("🗑️ Suppression du statut: {}", id);

        if (!statutRepository.existsById(id)) {
            throw new BusinessException("STATUT_NOT_FOUND", "Statut non trouvé avec l'ID: " + id);
        }

        statutRepository.deleteById(id);
        log.info("✅ Statut supprimé avec succès: {}", id);
    }

    /**
     * Synchroniser UN statut vers Firebase
     */
    @Transactional
    public void synchroniseToFirebase(String statutId) {
        log.info("📤 Synchronisation d'UN statut vers Firebase: {}", statutId);

        StatutAvancementSignalement statut = getById(statutId);
        synchroniseStatusToFirestore(statut);
    }

    /**
     * Synchroniser TOUS les statuts vers Firebase
     */
    @Transactional
    public void synchroniseAllToFirebase() {
        log.info("📤 Synchronisation de TOUS les statuts vers Firebase");

        List<StatutAvancementSignalement> statuts = statutRepository.findAll();

        int successCount = 0;
        int errorCount = 0;

        for (StatutAvancementSignalement statut : statuts) {
            try {
                synchroniseStatusToFirestore(statut);
                successCount++;
            } catch (Exception e) {
                errorCount++;
                log.error("❌ Erreur lors de la synchronisation du statut {}: {}", statut.getId(), e.getMessage());
            }
        }

        log.info("✅ Synchronisation complétée - Succès: {}, Erreurs: {}", successCount, errorCount);
    }

    /**
     * Méthode interne: synchroniser UN statut vers Firestore
     */
    private void synchroniseStatusToFirestore(StatutAvancementSignalement statut) {
        try {
            log.info("   📝 Écriture du statut: {} dans Firestore", statut.getStatut());

            Map<String, Object> statutData = new HashMap<>();
            statutData.put("id", statut.getId());
            statutData.put("statut", statut.getStatut());
            statutData.put("avancement", statut.getAvancement());
            statutData.put("source", "POSTGRESQL");
            statutData.put("syncedAt", LocalDateTime.now().format(DATE_FORMATTER));

            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_STATUTS_COLLECTION)
                    .document(statut.getId())
                    .set(statutData);

            future.get(); // Attendre la completion
            log.info("   ✅ Statut '{}' synchronisé avec succès vers Firebase", statut.getStatut());

        } catch (Exception e) {
            log.error("   ❌ Erreur lors de la synchronisation du statut {} vers Firebase: {}",
                    statut.getId(), e.getMessage(), e);
            throw new BusinessException("FIRESTORE_SYNC_ERROR",
                    "Erreur lors de la synchronisation vers Firebase: " + e.getMessage());
        }
    }
}

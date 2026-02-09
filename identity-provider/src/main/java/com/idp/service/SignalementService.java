package com.idp.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.idp.dto.SignalementRequest;
import com.idp.dto.SignalementResponse;
import com.idp.entity.HistoriqueStatutSignalement;
import com.idp.entity.Signalement;
import com.idp.entity.StatutAvancementSignalement;
import com.idp.entity.User;
import com.idp.exception.BusinessException;
import com.idp.repository.HistoriqueStatutSignalementRepository;
import com.idp.repository.SignalementRepository;
import com.idp.repository.StatutAvancementSignalementRepository;
import com.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;
    private final StatutAvancementSignalementRepository statutRepository;
    private final HistoriqueStatutSignalementRepository historiqueRepository;
    private final Firestore firestore;
    private static final String COLLECTION_NAME = "signalements";

    /**
     * Créer un nouveau signalement
     */
    @Transactional
    public SignalementResponse createSignalement(SignalementRequest request, String userId) {
        try {
            // Récupérer l'utilisateur
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException("USER_NOT_FOUND",
                            "Utilisateur non trouvé avec l'ID: " + userId));

            // Récupérer le statut NOUVEAU
            StatutAvancementSignalement statutNouveauOpt = statutRepository.findByStatut("NOUVEAU")
                    .orElseThrow(() -> new BusinessException("STATUT_NOT_FOUND", "Statut 'NOUVEAU' introuvable"));

            Signalement signalement = Signalement.builder()
                    .titre(request.getTitre())
                    .description(request.getDescription())
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .surfaceM2(request.getSurfaceM2())
                    .budget(request.getBudget())
                    .entrepriseConcernee(request.getEntrepriseConcernee())
                    .statut(statutNouveauOpt)
                    .isSynchronized(false)
                    .signaleur(user)
                    .build();

            signalement = signalementRepository.save(signalement);
            enregistrerHistoriqueStatut(signalement, statutNouveauOpt, LocalDateTime.now());

            // Synchroniser vers Firebase
            synchronizeToFirebase(signalement);

            return mapToResponse(signalement);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erreur lors de la création du signalement", e);
            throw new BusinessException("SIGNALEMENT_CREATE_ERROR", "Erreur lors de la création du signalement");
        }
    }

    /**
     * Récupérer tous les signalements
     */
    public List<SignalementResponse> getAllSignalements() {
        return signalementRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un signalement par ID
     */
    public SignalementResponse getSignalementById(String id) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SIGNALEMENT_NOT_FOUND", "Signalement non trouvé"));
        return mapToResponse(signalement);
    }

    /**
     * Récupérer tous les signalements d'un utilisateur
     */
    public List<SignalementResponse> getSignalementsByUser(String userId) {
        return signalementRepository.findBySignaleurId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer les signalements par statut
     */
    public List<SignalementResponse> getSignalementsByStatut(String statut) {
        StatutAvancementSignalement statutObj = statutRepository.findByStatut(statut.toUpperCase())
                .orElseThrow(() -> new BusinessException("STATUT_NOT_FOUND", "Statut introuvable: " + statut));

        return signalementRepository.findByStatut(statutObj)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Mettre à jour un signalement
     */
    @Transactional
    public SignalementResponse updateSignalement(String id, SignalementRequest request) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SIGNALEMENT_NOT_FOUND", "Signalement non trouvé"));

        signalement.setTitre(request.getTitre());
        signalement.setDescription(request.getDescription());
        signalement.setLatitude(request.getLatitude());
        signalement.setLongitude(request.getLongitude());
        signalement.setSurfaceM2(request.getSurfaceM2());
        signalement.setBudget(request.getBudget());
        signalement.setEntrepriseConcernee(request.getEntrepriseConcernee());

        signalement.setIsSynchronized(false);
        signalement = signalementRepository.save(signalement);

        // Synchroniser vers Firebase
        synchronizeToFirebase(signalement);

        return mapToResponse(signalement);
    }

    /**
     * Mettre à jour le statut d'un signalement
     */
    @Transactional
    public SignalementResponse updateStatut(String id, String newStatut) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SIGNALEMENT_NOT_FOUND", "Signalement non trouvé"));

        StatutAvancementSignalement statut = statutRepository.findByStatut(newStatut.toUpperCase())
                .orElseThrow(() -> new BusinessException("STATUT_NOT_FOUND", "Statut introuvable: " + newStatut));

        signalement.setStatut(statut);
        signalement.setIsSynchronized(false);
        signalement = signalementRepository.save(signalement);

        // Enregistrer l'historique du changement de statut
        enregistrerHistoriqueStatut(signalement, statut, LocalDateTime.now());

        // Synchroniser vers Firebase
        synchronizeToFirebase(signalement);

        return mapToResponse(signalement);
    }

    /**
     * Supprimer un signalement
     */
    @Transactional
    public void deleteSignalement(String id) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SIGNALEMENT_NOT_FOUND", "Signalement non trouvé"));

        // Supprimer de Firebase
        if (signalement.getFirebaseId() != null && !signalement.getFirebaseId().isEmpty()) {
            try {
                firestore.collection(COLLECTION_NAME).document(signalement.getFirebaseId()).delete().get();
            } catch (ExecutionException | InterruptedException e) {
                log.warn("Erreur lors de la suppression du signalement dans Firebase", e);
            }
        }

        signalementRepository.delete(signalement);
    }

    /**
     * Récupérer les signalements dans une zone géographique
     */
    public List<SignalementResponse> getSignalementsByGeographicBounds(Double minLat, Double maxLat, Double minLon,
            Double maxLon) {
        return signalementRepository.findByGeographicBounds(minLat, maxLat, minLon, maxLon)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Synchroniser un signalement vers Firebase
     */
    @Transactional
    public void synchronizeToFirebase(Signalement signalement) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("id", signalement.getId());
            data.put("titre", signalement.getTitre());
            data.put("description", signalement.getDescription());
            data.put("statutId", signalement.getStatut().getId());
            data.put("latitude", signalement.getLatitude());
            data.put("longitude", signalement.getLongitude());
            data.put("surfaceM2", signalement.getSurfaceM2());
            data.put("budget", signalement.getBudget());
            data.put("entrepriseConcernee", signalement.getEntrepriseConcernee());
            data.put("createdAt", signalement.getCreatedAt());
            data.put("updatedAt", signalement.getUpdatedAt());
            // ⭐ IMPORTANT: Ajouter le user_id pour la synchronisation inverse
            if (signalement.getSignaleur() != null) {
                data.put("userId", signalement.getSignaleur().getId());
            }
            data.put("synchronized", true);

            @SuppressWarnings("all")
            WriteResult result = null;
            if (signalement.getFirebaseId() != null && !signalement.getFirebaseId().isEmpty()) {
                // Mise à jour
                log.info("📝 Mise à jour du signalement {} dans Firebase", signalement.getFirebaseId());
                result = firestore.collection(COLLECTION_NAME)
                        .document(signalement.getFirebaseId())
                        .set(data)
                        .get();
                log.info("✅ Signalement {} mis à jour dans Firebase", signalement.getFirebaseId());
            } else {
                // Création - Firestore crée automatiquement la collection au premier write
                log.info("🆕 Création du signalement {} dans Firebase (collection: {})", signalement.getId(),
                        COLLECTION_NAME);
                result = firestore.collection(COLLECTION_NAME)
                        .document(signalement.getId())
                        .set(data)
                        .get();

                signalement.setFirebaseId(signalement.getId());
                log.info("✅ Signalement {} créé dans Firebase avec succès", signalement.getId());
            }

            signalement.setIsSynchronized(true);
            signalement.setLastSyncedAt(LocalDateTime.now());
            signalementRepository.save(signalement);

            log.info("✅ Signalement {} synchronisé vers Firebase", signalement.getId());
        } catch (ExecutionException e) {
            log.error("❌ Erreur ExecutionException lors de la synchronisation vers Firebase: {}", e.getMessage(), e);
            throw new BusinessException("FIREBASE_SYNC_ERROR", "Erreur lors de la synchronisation: " + e.getMessage());
        } catch (InterruptedException e) {
            log.error("❌ Erreur InterruptedException lors de la synchronisation vers Firebase: {}", e.getMessage(), e);
            Thread.currentThread().interrupt();
            throw new BusinessException("FIREBASE_SYNC_ERROR", "Synchronisation interrompue");
        }
    }

    /**
     * Synchroniser tous les signalements non synchronisés
     */
    @Transactional
    public void synchronizeAllPending() {
        List<Signalement> pendingSignalements = signalementRepository.findByIsSynchronizedFalse();

        for (Signalement signalement : pendingSignalements) {
            try {
                synchronizeToFirebase(signalement);
            } catch (Exception e) {
                log.error("Erreur lors de la synchronisation du signalement {}", signalement.getId(), e);
            }
        }
    }

    /**
     * Récupérer les signalements depuis Firebase
     */
    public List<SignalementResponse> syncFromFirebase() {
        try {
            var documents = firestore.collection(COLLECTION_NAME).get().get();

            return documents.getDocuments().stream()
                    .map(doc -> {
                        Optional<Signalement> existing = signalementRepository.findByFirebaseId(doc.getId());

                        Signalement signalement = existing.orElse(Signalement.builder().build());
                        signalement.setFirebaseId(doc.getId());
                        signalement.setTitre(doc.getString("titre"));
                        signalement.setDescription(doc.getString("description"));
                        signalement.setLatitude(convertToDouble(doc.get("latitude")));
                        signalement.setLongitude(convertToDouble(doc.get("longitude")));

                        Object surfaceObj = doc.get("surfaceM2");
                        Double surfaceM2 = convertToDouble(surfaceObj);
                        signalement.setSurfaceM2(surfaceM2 != null ? new java.math.BigDecimal(surfaceM2) : null);

                        Object budgetObj = doc.get("budget");
                        Double budget = convertToDouble(budgetObj);
                        signalement.setBudget(budget != null ? new java.math.BigDecimal(budget) : null);

                        signalement.setEntrepriseConcernee(doc.getString("entrepriseConcernee"));

                        // Récupérer et convertir le statut
                        String statutId = doc.getString("statutId");
                        StatutAvancementSignalement statut = null;
                        if (statutId != null && !statutId.isEmpty()) {
                            statut = statutRepository.findById(statutId).orElse(null);
                        }
                        if (statut == null) {
                            statut = statutRepository.findByStatut("NOUVEAU").orElse(null);
                            if (statut == null) {
                                log.warn("Statut 'NOUVEAU' introuvable, sync impossible");
                                return null;
                            }
                        }
                        signalement.setStatut(statut);

                        // ⭐ IMPORTANT: Récupérer le user_id depuis Firebase et charger l'utilisateur
                        String userId = doc.getString("userId");
                        if (userId != null && !userId.isEmpty()) {
                            Optional<User> user = userRepository.findById(userId);
                            if (user.isPresent()) {
                                signalement.setSignaleur(user.get());
                            } else {
                                log.warn("⚠️ Utilisateur {} introuvable pour le signalement {}", userId, doc.getId());
                                // Skip ce signalement si l'utilisateur n'existe pas
                                return null;
                            }
                        } else {
                            log.warn("⚠️ Pas de userId dans le signalement Firebase {}, sync impossible", doc.getId());
                            // Skip ce signalement s'il n'a pas de userId
                            return null;
                        }

                        signalement.setIsSynchronized(true);

                        signalementRepository.save(signalement);
                        return mapToResponse(signalement);
                    })
                    .filter(response -> response != null) // Filtrer les signalements non synchronisés
                    .collect(Collectors.toList());
        } catch (ExecutionException | InterruptedException e) {
            log.error("Erreur lors de la récupération des données depuis Firebase", e);
            throw new BusinessException("FIREBASE_SYNC_ERROR", "Erreur lors de la synchronisation");
        }
    }

    /**
     * Convertir un objet Firebase en Double de manière sûre
     */
    private Double convertToDouble(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Double) {
            return (Double) value;
        } else if (value instanceof Number) {
            return ((Number) value).doubleValue();
        } else if (value instanceof String) {
            try {
                return Double.parseDouble((String) value);
            } catch (NumberFormatException e) {
                log.warn("Impossible de convertir {} en Double", value);
                return null;
            }
        }
        return null;
    }

    /**
     * Convertir un objet Firebase en Long de manière sûre
     */
    private Long convertToLong(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Long) {
            return (Long) value;
        } else if (value instanceof Number) {
            return ((Number) value).longValue();
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                log.warn("Impossible de convertir {} en Long", value);
                return null;
            }
        }
        return null;
    }

    /**
     * Obtenir les statistiques des signalements
     */
    public com.idp.dto.SignalementStatisticsResponse getStatistics() {
        List<Signalement> allSignalements = signalementRepository.findAll();

        long total = allSignalements.size();
        long nouveaux = allSignalements.stream().filter(s -> s.getStatut().getStatut().equals("NOUVEAU")).count();
        long enCours = allSignalements.stream().filter(s -> s.getStatut().getStatut().equals("EN_COURS")).count();
        long termines = allSignalements.stream().filter(s -> s.getStatut().getStatut().equals("TERMINE")).count();
        long annules = allSignalements.stream().filter(s -> s.getStatut().getStatut().equals("ANNULE")).count();

        java.math.BigDecimal totalSurfaceM2 = allSignalements.stream()
                .map(Signalement::getSurfaceM2)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal totalBudget = allSignalements.stream()
                .map(Signalement::getBudget)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        Double averageAvancement = allSignalements.stream()
                .mapToInt(s -> s.getStatut().getAvancement())
                .average()
                .orElse(0.0);
        
        // Calculer les délais moyens de traitement
        java.util.List<Double> delaisNouveauEnCours = new java.util.ArrayList<>();
        java.util.List<Double> delaisEnCoursTermine = new java.util.ArrayList<>();
        java.util.List<Double> delaisTotal = new java.util.ArrayList<>();
        
        for (Signalement signalement : allSignalements) {
            List<HistoriqueStatutSignalement> historique = historiqueRepository
                    .findBySignalementIdOrderByDateAsc(signalement.getId());
            
            LocalDateTime dateNouveau = null;
            LocalDateTime dateEnCours = null;
            LocalDateTime dateTermine = null;
            
            for (HistoriqueStatutSignalement h : historique) {
                String statut = h.getStatutAvancementSignalement().getStatut();
                if ("NOUVEAU".equals(statut) && dateNouveau == null) {
                    dateNouveau = h.getDate();
                } else if ("EN_COURS".equals(statut) && dateEnCours == null) {
                    dateEnCours = h.getDate();
                } else if ("TERMINE".equals(statut) && dateTermine == null) {
                    dateTermine = h.getDate();
                }
            }
            
            // Si pas d'historique NOUVEAU, utiliser createdAt
            if (dateNouveau == null) {
                dateNouveau = signalement.getCreatedAt();
            }
            
            // Calculer délai NOUVEAU -> EN_COURS
            if (dateNouveau != null && dateEnCours != null) {
                double delaiJours = java.time.Duration.between(dateNouveau, dateEnCours).toHours() / 24.0;
                delaisNouveauEnCours.add(delaiJours);
            }
            
            // Calculer délai EN_COURS -> TERMINE
            if (dateEnCours != null && dateTermine != null) {
                double delaiJours = java.time.Duration.between(dateEnCours, dateTermine).toHours() / 24.0;
                delaisEnCoursTermine.add(delaiJours);
            }
            
            // Calculer délai total NOUVEAU -> TERMINE
            if (dateNouveau != null && dateTermine != null) {
                double delaiJours = java.time.Duration.between(dateNouveau, dateTermine).toHours() / 24.0;
                delaisTotal.add(delaiJours);
            }
        }
        
        Double delaiMoyenNouveauEnCours = delaisNouveauEnCours.isEmpty() ? null :
                delaisNouveauEnCours.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        Double delaiMoyenEnCoursTermine = delaisEnCoursTermine.isEmpty() ? null :
                delaisEnCoursTermine.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        Double delaiMoyenTraitementTotal = delaisTotal.isEmpty() ? null :
                delaisTotal.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        return com.idp.dto.SignalementStatisticsResponse.builder()
                .totalSignalements(total)
                .signalementNouveaux(nouveaux)
                .signalementEnCours(enCours)
                .signalementTermines(termines)
                .signalementAnnules(annules)
                .totalSurfaceM2(totalSurfaceM2)
                .totalBudget(totalBudget)
                .averageAvancement(averageAvancement)
                .delaiMoyenNouveauEnCours(delaiMoyenNouveauEnCours)
                .delaiMoyenEnCoursTermine(delaiMoyenEnCoursTermine)
                .delaiMoyenTraitementTotal(delaiMoyenTraitementTotal)
                .nombreSignalementsTraites((long) delaisTotal.size())
                .build();
    }

    /**
     * Enregistrer un changement de statut dans l'historique
     */
    private void enregistrerHistoriqueStatut(Signalement signalement, StatutAvancementSignalement statut,
            LocalDateTime date) {
        try {
            HistoriqueStatutSignalement historique = HistoriqueStatutSignalement.builder()
                    .signalement(signalement)
                    .statutAvancementSignalement(statut)
                    .date(date)
                    .build();

            historiqueRepository.save(historique);
            log.info("Historique enregistré pour le signalement {}: statut {}", signalement.getId(),
                    statut.getStatut());
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement de l'historique du statut", e);
        }
    }

    /**
     * Récupérer l'historique des statuts d'un signalement
     */
    public List<HistoriqueStatutSignalement> getHistoriqueStatut(String signalementId) {
        return historiqueRepository.findBySignalementIdOrderByDateDesc(signalementId);
    }

    /**
     * Mapper l'historique vers DTO
     */
    public List<com.idp.dto.HistoriqueStatutSignalementResponse> mapHistoriqueToResponse(
            List<HistoriqueStatutSignalement> historique) {
        return historique.stream()
                .map(h -> com.idp.dto.HistoriqueStatutSignalementResponse.builder()
                        .id(h.getId())
                        .signalementId(h.getSignalement().getId())
                        .statut(h.getStatutAvancementSignalement().getStatut())
                        .avancement(h.getStatutAvancementSignalement().getAvancement())
                        .date(h.getDate())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Mapper une entité Signalement vers SignalementResponse
     */
    private SignalementResponse mapToResponse(Signalement signalement) {
        // Récupérer les dates d'avancement depuis l'historique
        List<HistoriqueStatutSignalement> historique = historiqueRepository
                .findBySignalementIdOrderByDateAsc(signalement.getId());
        
        LocalDateTime dateNouveau = null;
        LocalDateTime dateEnCours = null;
        LocalDateTime dateTermine = null;
        
        for (HistoriqueStatutSignalement h : historique) {
            String statut = h.getStatutAvancementSignalement().getStatut();
            if ("NOUVEAU".equals(statut) && dateNouveau == null) {
                dateNouveau = h.getDate();
            } else if ("EN_COURS".equals(statut) && dateEnCours == null) {
                dateEnCours = h.getDate();
            } else if ("TERMINE".equals(statut) && dateTermine == null) {
                dateTermine = h.getDate();
            }
        }
        
        // Si pas d'historique NOUVEAU, utiliser createdAt
        if (dateNouveau == null) {
            dateNouveau = signalement.getCreatedAt();
        }
        
        return SignalementResponse.builder()
                .id(signalement.getId())
                .titre(signalement.getTitre())
                .description(signalement.getDescription())
                .statut(signalement.getStatut().getStatut())
                .latitude(signalement.getLatitude())
                .longitude(signalement.getLongitude())
                .surfaceM2(signalement.getSurfaceM2())
                .budget(signalement.getBudget())
                .entrepriseConcernee(signalement.getEntrepriseConcernee())
                .pourcentageAvancement(signalement.getStatut().getAvancement())
                .signaleurId(signalement.getSignaleur() != null ? signalement.getSignaleur().getId() : null)
                .signaleurNom(signalement.getSignaleur() != null ? signalement.getSignaleur().getFullName() : null)
                .firebaseId(signalement.getFirebaseId())
                .isSynchronized(signalement.getIsSynchronized())
                .lastSyncedAt(signalement.getLastSyncedAt())
                .createdAt(signalement.getCreatedAt())
                .updatedAt(signalement.getUpdatedAt())
                .dateNouveau(dateNouveau)
                .dateEnCours(dateEnCours)
                .dateTermine(dateTermine)
                .build();
    }
}

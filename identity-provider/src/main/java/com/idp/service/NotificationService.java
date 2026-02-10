package com.idp.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.idp.entity.*;
import com.idp.exception.BusinessException;
import com.idp.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final Firestore firestore;

    private static final String COLLECTION_NAME = "notifications";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Créer une notification lors d'un changement de statut de signalement
     */
    @Transactional
    public Notification createNotificationForStatusChange(
            Signalement signalement, 
            HistoriqueStatutSignalement historique,
            StatutAvancementSignalement nouveauStatut,
            String motif) {
        
        try {
            // Récupérer l'utilisateur propriétaire du signalement
            User user = signalement.getSignaleur();
            if (user == null) {
                log.warn("⚠️ Signalement {} n'a pas d'utilisateur associé", signalement.getId());
                return null;
            }

            // Construire le motif si non fourni
            if (motif == null || motif.isEmpty()) {
                motif = "Avancement mis à jour: " + nouveauStatut.getStatut() + 
                        " (" + nouveauStatut.getAvancement() + "%)";
            }

            // Créer la notification
            Notification notification = Notification.builder()
                    .motif(motif)
                    .historiqueStatutSignalement(historique)
                    .signalement(signalement)
                    .user(user)
                    .statut(nouveauStatut)
                    .lu(false)
                    .build();

            notification = notificationRepository.save(notification);
            log.info("✅ Notification créée en base: {} pour user {}", notification.getId(), user.getId());

            // Synchroniser vers Firestore
            synchronizeToFirestore(notification);

            return notification;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la création de la notification", e);
            throw new BusinessException("NOTIFICATION_CREATE_ERROR", 
                    "Erreur lors de la création de la notification: " + e.getMessage());
        }
    }

    /**
     * Synchroniser une notification vers Firestore
     */
    public void synchronizeToFirestore(Notification notification) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("id", notification.getId());
            data.put("motif", notification.getMotif());
            
            if (notification.getHistoriqueStatutSignalement() != null) {
                data.put("history_id", notification.getHistoriqueStatutSignalement().getId());
            }
            
            data.put("signalement_id", notification.getSignalement().getId());
            data.put("signalement_titre", notification.getSignalement().getTitre());
            data.put("user_id", notification.getUser().getId());
            
            if (notification.getStatut() != null) {
                data.put("status_id", notification.getStatut().getId());
                data.put("status_libelle", notification.getStatut().getStatut());
                data.put("status_avancement", notification.getStatut().getAvancement());
            }
            
            data.put("date", notification.getDate() != null 
                    ? notification.getDate().format(DATE_FORMATTER) 
                    : LocalDateTime.now().format(DATE_FORMATTER));
            data.put("lu", notification.getLu());

            // Sauvegarder dans Firestore
            WriteResult result = firestore.collection(COLLECTION_NAME)
                    .document(notification.getId())
                    .set(data)
                    .get();

            // Mettre à jour le firestore_id
            notification.setFirestoreId(notification.getId());
            notificationRepository.save(notification);

            log.info("✅ Notification {} synchronisée vers Firestore à {}", 
                    notification.getId(), result.getUpdateTime());

        } catch (ExecutionException | InterruptedException e) {
            log.error("❌ Erreur lors de la synchronisation Firestore de la notification {}", 
                    notification.getId(), e);
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Récupérer les notifications d'un utilisateur
     */
    public List<Notification> getNotificationsByUserId(String userId) {
        return notificationRepository.findByUserIdOrderByDateDesc(userId);
    }

    /**
     * Récupérer les notifications non lues d'un utilisateur
     */
    public List<Notification> getUnreadNotificationsByUserId(String userId) {
        return notificationRepository.findByUserIdAndLuFalseOrderByDateDesc(userId);
    }

    /**
     * Compter les notifications non lues
     */
    public long countUnreadNotifications(String userId) {
        return notificationRepository.countByUserIdAndLuFalse(userId);
    }

    /**
     * Marquer une notification comme lue
     */
    @Transactional
    public Notification markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException("NOTIFICATION_NOT_FOUND", 
                        "Notification non trouvée: " + notificationId));

        notification.setLu(true);
        notification = notificationRepository.save(notification);

        // Mettre à jour dans Firestore
        updateLuStatusInFirestore(notification);

        return notification;
    }

    /**
     * Marquer toutes les notifications d'un utilisateur comme lues
     */
    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = getUnreadNotificationsByUserId(userId);
        
        for (Notification notification : unreadNotifications) {
            notification.setLu(true);
            notificationRepository.save(notification);
            updateLuStatusInFirestore(notification);
        }
        
        log.info("✅ {} notifications marquées comme lues pour l'utilisateur {}", 
                unreadNotifications.size(), userId);
    }

    /**
     * Mettre à jour le statut "lu" dans Firestore
     */
    private void updateLuStatusInFirestore(Notification notification) {
        try {
            if (notification.getFirestoreId() != null) {
                Map<String, Object> updates = new HashMap<>();
                updates.put("lu", notification.getLu());

                firestore.collection(COLLECTION_NAME)
                        .document(notification.getFirestoreId())
                        .update(updates)
                        .get();
            }
        } catch (ExecutionException | InterruptedException e) {
            log.error("❌ Erreur lors de la mise à jour Firestore du statut lu", e);
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Supprimer une notification
     */
    @Transactional
    public void deleteNotification(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException("NOTIFICATION_NOT_FOUND", 
                        "Notification non trouvée: " + notificationId));

        // Supprimer de Firestore
        if (notification.getFirestoreId() != null) {
            try {
                firestore.collection(COLLECTION_NAME)
                        .document(notification.getFirestoreId())
                        .delete()
                        .get();
            } catch (ExecutionException | InterruptedException e) {
                log.warn("⚠️ Erreur lors de la suppression Firestore", e);
                Thread.currentThread().interrupt();
            }
        }

        notificationRepository.delete(notification);
        log.info("✅ Notification {} supprimée", notificationId);
    }
}

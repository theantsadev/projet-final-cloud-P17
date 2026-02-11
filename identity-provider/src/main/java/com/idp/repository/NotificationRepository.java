package com.idp.repository;

import com.idp.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    
    /**
     * Récupérer les notifications d'un utilisateur
     */
    List<Notification> findByUserIdOrderByDateDesc(String userId);
    
    /**
     * Récupérer les notifications non lues d'un utilisateur
     */
    List<Notification> findByUserIdAndLuFalseOrderByDateDesc(String userId);
    
    /**
     * Récupérer les notifications d'un signalement
     */
    List<Notification> findBySignalementIdOrderByDateDesc(String signalementId);
    
    /**
     * Compter les notifications non lues d'un utilisateur
     */
    long countByUserIdAndLuFalse(String userId);
    
    /**
     * Trouver par Firestore ID
     */
    java.util.Optional<Notification> findByFirestoreId(String firestoreId);
}

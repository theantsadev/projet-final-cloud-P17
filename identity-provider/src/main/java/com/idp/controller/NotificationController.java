package com.idp.controller;

import com.idp.dto.ApiResponse;
import com.idp.dto.NotificationResponse;
import com.idp.entity.Notification;
import com.idp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Récupérer toutes les notifications de l'utilisateur connecté
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> getMyNotifications(Principal principal) {
        log.info("Récupération des notifications pour l'utilisateur: {}", principal.getName());
        
        List<Notification> notifications = notificationService.getNotificationsByUserId(principal.getName());
        List<NotificationResponse> responses = notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses, "Notifications récupérées avec succès"));
    }

    /**
     * Récupérer les notifications non lues de l'utilisateur connecté
     */
    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> getUnreadNotifications(Principal principal) {
        log.info("Récupération des notifications non lues pour l'utilisateur: {}", principal.getName());
        
        List<Notification> notifications = notificationService.getUnreadNotificationsByUserId(principal.getName());
        List<NotificationResponse> responses = notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses, "Notifications non lues récupérées"));
    }

    /**
     * Compter les notifications non lues
     */
    @GetMapping("/count/unread")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> countUnreadNotifications(Principal principal) {
        long count = notificationService.countUnreadNotifications(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(count, "Nombre de notifications non lues"));
    }

    /**
     * Marquer une notification comme lue
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> markAsRead(@PathVariable String id) {
        log.info("Marquage de la notification {} comme lue", id);
        
        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(notification), "Notification marquée comme lue"));
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> markAllAsRead(Principal principal) {
        log.info("Marquage de toutes les notifications comme lues pour: {}", principal.getName());
        
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Toutes les notifications marquées comme lues"));
    }

    /**
     * Supprimer une notification
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER')")
    public ResponseEntity<ApiResponse<?>> deleteNotification(@PathVariable String id) {
        log.info("Suppression de la notification: {}", id);
        
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification supprimée"));
    }

    /**
     * Mapper une entité Notification vers DTO
     */
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .motif(notification.getMotif())
                .historyId(notification.getHistoriqueStatutSignalement() != null 
                        ? notification.getHistoriqueStatutSignalement().getId() : null)
                .signalementId(notification.getSignalement().getId())
                .signalementTitre(notification.getSignalement().getTitre())
                .userId(notification.getUser().getId())
                .statusId(notification.getStatut() != null ? notification.getStatut().getId() : null)
                .statusLibelle(notification.getStatut() != null ? notification.getStatut().getStatut() : null)
                .statusAvancement(notification.getStatut() != null ? notification.getStatut().getAvancement() : null)
                .date(notification.getDate())
                .lu(notification.getLu())
                .build();
    }
}

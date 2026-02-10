package com.idp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(name = "motif", nullable = false)
    private String motif;

    @ManyToOne
    @JoinColumn(name = "history_id")
    private HistoriqueStatutSignalement historiqueStatutSignalement;

    @ManyToOne
    @JoinColumn(name = "signalement_id", nullable = false)
    private Signalement signalement;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private StatutAvancementSignalement statut;

    @CreationTimestamp
    @Column(name = "date", updatable = false)
    private LocalDateTime date;

    @Column(name = "lu")
    @Builder.Default
    private Boolean lu = false;

    @Column(name = "firestore_id")
    private String firestoreId;
}

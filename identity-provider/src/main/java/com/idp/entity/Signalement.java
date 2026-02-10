package com.idp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "statut_id", nullable = false)
    private StatutAvancementSignalement statut;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "surface_m2")
    private BigDecimal surfaceM2;

    @Column(name = "budget")
    private BigDecimal budget;

    @Column(name = "entreprise_concernee", length = 255)
    private String entrepriseConcernee;

    @ManyToOne
    @JoinColumn(name = "type_reparation_id")
    private TypeReparation typeReparation;

    @Column(name = "niveau")
    @Min(value = 1, message = "Le niveau doit être au minimum 1")
    @Max(value = 10, message = "Le niveau doit être au maximum 10")
    private Integer niveau;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User signaleur;

    @Column(name = "firebase_id", length = 255)
    private String firebaseId;

    @Column(name = "is_synchronized")
    private Boolean isSynchronized = false;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
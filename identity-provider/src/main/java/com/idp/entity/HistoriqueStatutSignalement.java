package com.idp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_statut_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueStatutSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @ManyToOne
    @JoinColumn(name = "signalement_id", nullable = false)
    private Signalement signalement;

    @ManyToOne
    @JoinColumn(name = "statut_id", nullable = false)
    private StatutAvancementSignalement statutAvancementSignalement;

    @CreationTimestamp
    @Column(name = "date", updatable = false)
    private LocalDateTime date;
}

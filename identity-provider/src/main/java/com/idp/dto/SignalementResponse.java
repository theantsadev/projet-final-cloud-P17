package com.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementResponse {
    
    private String id;
    private String titre;
    private String description;
    private String statut;
    private Double latitude;
    private Double longitude;
    private BigDecimal surfaceM2;
    /**
     * Niveau de gravité (1-10)
     */
    private Integer niveau;
    /**
     * Budget calculé: prix_m2_global × niveau × surface_m2
     */
    private BigDecimal budget;
    /**
     * Prix global au m² utilisé pour le calcul du budget
     */
    private BigDecimal prixM2Global;
    private String entrepriseConcernee;
    private Integer pourcentageAvancement;
    private String signaleurId;
    private String signaleurNom;
    private String firebaseId;
    private Boolean isSynchronized;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Dates d'avancement pour chaque étape
    private LocalDateTime dateNouveau;      // Date de création (NOUVEAU = 0%)
    private LocalDateTime dateEnCours;      // Date de passage à EN_COURS (50%)
    private LocalDateTime dateTermine;      // Date de passage à TERMINE (100%)
}

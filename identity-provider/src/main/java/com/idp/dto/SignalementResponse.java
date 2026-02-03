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
    private BigDecimal budget;
    private String entrepriseConcernee;
    private Integer pourcentageAvancement;
    private String signaleurId;
    private String signaleurNom;
    private String firebaseId;
    private Boolean isSynchronized;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

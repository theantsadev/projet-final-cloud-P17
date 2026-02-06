package com.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementStatisticsResponse {

    private Long totalSignalements;
    private Long signalementNouveaux;
    private Long signalementEnCours;
    private Long signalementTermines;
    private Long signalementAnnules;
    private BigDecimal totalSurfaceM2;
    private BigDecimal totalBudget;
    private Double averageAvancement; // Pourcentage moyen d'avancement
}

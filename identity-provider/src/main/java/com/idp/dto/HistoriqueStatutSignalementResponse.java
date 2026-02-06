package com.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueStatutSignalementResponse {
    
    private String id;
    private String signalementId;
    private String statut;
    private Integer avancement;
    private LocalDateTime date;
}

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
public class NotificationResponse {
    
    private String id;
    private String motif;
    private String historyId;
    private String signalementId;
    private String signalementTitre;
    private String userId;
    private String statusId;
    private String statusLibelle;
    private Integer statusAvancement;
    private LocalDateTime date;
    private Boolean lu;
}

package com.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementUpdateStatusRequest {
    
    @NotBlank(message = "Le statut est requis")
    private String statut; // NOUVEAU, EN_COURS, TERMINE, ANNULE
    
    private String raison; // Raison de la mise à jour
}

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
public class TypeReparationResponse {

    private String id;
    private String nom;
    private String description;
    private BigDecimal coutUnitaire;
    private String unite;
    private Integer niveau;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

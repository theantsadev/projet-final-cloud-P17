package com.idp.dto;

import com.idp.entity.SignalementStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SignalementCreateRequest {

    private LocalDateTime dateSignalement;

    private SignalementStatus statut;

    @NotNull
    private Double surfaceM2;

    @NotNull
    private BigDecimal budget;

    @NotBlank
    private String entreprise;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    public LocalDateTime getDateSignalement() {
        return dateSignalement;
    }

    public void setDateSignalement(LocalDateTime dateSignalement) {
        this.dateSignalement = dateSignalement;
    }

    public SignalementStatus getStatut() {
        return statut;
    }

    public void setStatut(SignalementStatus statut) {
        this.statut = statut;
    }

    public Double getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(Double surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }

    public String getEntreprise() {
        return entreprise;
    }

    public void setEntreprise(String entreprise) {
        this.entreprise = entreprise;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}

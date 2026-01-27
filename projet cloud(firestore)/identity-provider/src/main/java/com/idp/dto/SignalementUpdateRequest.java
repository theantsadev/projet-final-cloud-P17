package com.idp.dto;

import com.idp.entity.SignalementStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SignalementUpdateRequest {
    private LocalDateTime dateSignalement;
    private SignalementStatus statut;
    private Double surfaceM2;
    private BigDecimal budget;
    private String entreprise;
    private Double latitude;
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

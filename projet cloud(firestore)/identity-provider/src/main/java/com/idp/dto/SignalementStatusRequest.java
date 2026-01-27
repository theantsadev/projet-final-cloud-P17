package com.idp.dto;

import com.idp.entity.SignalementStatus;
import jakarta.validation.constraints.NotNull;

public class SignalementStatusRequest {
    @NotNull
    private SignalementStatus statut;

    public SignalementStatus getStatut() {
        return statut;
    }

    public void setStatut(SignalementStatus statut) {
        this.statut = statut;
    }
}

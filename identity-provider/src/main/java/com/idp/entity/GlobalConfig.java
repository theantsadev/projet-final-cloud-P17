package com.idp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Configuration globale de l'application.
 * Stocke notamment le prix global au m² pour le calcul du budget.
 * Formule: budget = prix_m2_global × niveau × surface_m2
 */
@Entity
@Table(name = "global_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalConfig {

    @Id
    @Column(length = 50)
    private String configKey;

    @NotNull(message = "La valeur est obligatoire")
    @Column(name = "config_value", nullable = false, length = 500)
    private String configValue;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Clé pour le prix global au m²
     */
    public static final String PRIX_M2_GLOBAL_KEY = "PRIX_M2_GLOBAL";

    /**
     * Convertir la valeur en BigDecimal
     */
    public BigDecimal getValueAsBigDecimal() {
        try {
            return new BigDecimal(configValue);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * Définir la valeur depuis un BigDecimal
     */
    public void setValueFromBigDecimal(BigDecimal value) {
        this.configValue = value != null ? value.toString() : "0";
    }
}

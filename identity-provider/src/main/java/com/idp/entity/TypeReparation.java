package com.idp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entité représentant un type de réparation routière.
 * Sert de référentiel pour catégoriser les signalements par niveau de gravité.
 * Le prix au m² est défini globalement dans GlobalConfig.
 * Formule budget: prix_m2_global × niveau × surface_m2
 */
@Entity
@Table(name = "type_reparations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypeReparation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @NotNull(message = "Le nom est obligatoire")
    @Column(nullable = false, length = 100)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Niveau de gravité de 1 (mineur) à 10 (critique)
     * Utilisé comme multiplicateur dans le calcul du budget
     */
    @NotNull(message = "Le niveau est obligatoire")
    @Min(value = 1, message = "Le niveau doit être au minimum 1")
    @Max(value = 10, message = "Le niveau doit être au maximum 10")
    @Column(nullable = false)
    private Integer niveau;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

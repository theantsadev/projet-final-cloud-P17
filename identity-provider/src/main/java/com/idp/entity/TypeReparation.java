package com.idp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "type_reparation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypeReparation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 255)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cout_unitaire", nullable = false, precision = 15, scale = 2)
    private BigDecimal coutUnitaire;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String unite = "m2";

    @Column(nullable = false)
    @Min(value = 1, message = "Le niveau doit être au minimum 1")
    @Max(value = 10, message = "Le niveau doit être au maximum 10")
    @Builder.Default
    private Integer niveau = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

package com.idp.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypeReparationRequest {

    @NotBlank(message = "Le nom du type de réparation est requis")
    @Size(min = 2, max = 255, message = "Le nom doit contenir entre 2 et 255 caractères")
    private String nom;

    @Size(max = 5000, message = "La description ne doit pas dépasser 5000 caractères")
    private String description;

    @NotNull(message = "Le coût unitaire est requis")
    @DecimalMin(value = "0", message = "Le coût unitaire doit être positif")
    private BigDecimal coutUnitaire;

    @Size(max = 50, message = "L'unité ne doit pas dépasser 50 caractères")
    @Builder.Default
    private String unite = "m2";

    @NotNull(message = "Le niveau est requis")
    @Min(value = 1, message = "Le niveau doit être au minimum 1")
    @Max(value = 10, message = "Le niveau doit être au maximum 10")
    private Integer niveau;
}

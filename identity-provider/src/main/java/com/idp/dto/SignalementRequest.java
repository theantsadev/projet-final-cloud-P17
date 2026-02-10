package com.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalementRequest {
    
    @NotBlank(message = "Le titre est requis")
    @Size(max = 500, message = "Le titre ne doit pas dépasser 500 caractères")
    private String titre;
    
    @Size(max = 5000, message = "La description ne doit pas dépasser 5000 caractères")
    private String description;
    
    @NotNull(message = "La latitude est requise")
    @DecimalMin("-90")
    @DecimalMax("90")
    private Double latitude;
    
    @NotNull(message = "La longitude est requise")
    @DecimalMin("-180")
    @DecimalMax("180")
    private Double longitude;
    
    @DecimalMin("0")
    private BigDecimal surfaceM2;
    
    @DecimalMin("0")
    private BigDecimal budget;
    
    @Size(max = 255)
    private String entrepriseConcernee;
    
    @Min(0)
    @Max(100)
    private Integer pourcentageAvancement;
}

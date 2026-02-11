package com.idp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DelaiMoyenTraitementResponse {

    private Double delaiMoyenNouveauEnCours;      // Délai moyen (en jours) de NOUVEAU à EN_COURS
    private Double delaiMoyenEnCoursTermine;      // Délai moyen (en jours) de EN_COURS à TERMINE
    private Double delaiMoyenTraitementTotal;     // Délai moyen total (en jours) de NOUVEAU à TERMINE
    private Long nombreSignalementsTraites;       // Nombre de signalements terminés (pour le calcul)
}

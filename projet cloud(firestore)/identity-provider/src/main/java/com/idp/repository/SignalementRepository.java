package com.idp.repository;

import com.idp.entity.Signalement;
import com.idp.entity.SignalementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface SignalementRepository extends JpaRepository<Signalement, Long> {

    @Query("select coalesce(sum(s.surfaceM2), 0) from Signalement s")
    Double sumSurface();

    @Query("select coalesce(sum(s.budget), 0) from Signalement s")
    BigDecimal sumBudget();

    long countByStatut(SignalementStatus statut);
}

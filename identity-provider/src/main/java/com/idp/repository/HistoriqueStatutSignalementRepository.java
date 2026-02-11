package com.idp.repository;

import com.idp.entity.HistoriqueStatutSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistoriqueStatutSignalementRepository extends JpaRepository<HistoriqueStatutSignalement, String> {
    
    List<HistoriqueStatutSignalement> findBySignalementId(String signalementId);
    
    List<HistoriqueStatutSignalement> findBySignalementIdOrderByDateDesc(String signalementId);
    
    List<HistoriqueStatutSignalement> findBySignalementIdOrderByDateAsc(String signalementId);
    
    /**
     * Trouver le premier historique d'un signalement pour un statut donné
     */
    @Query("SELECT h FROM HistoriqueStatutSignalement h WHERE h.signalement.id = :signalementId " +
           "AND h.statutAvancementSignalement.statut = :statut ORDER BY h.date ASC")
    List<HistoriqueStatutSignalement> findBySignalementIdAndStatut(
            @Param("signalementId") String signalementId, 
            @Param("statut") String statut);
    
    /**
     * Trouver tous les historiques pour un statut donné
     */
    @Query("SELECT h FROM HistoriqueStatutSignalement h WHERE h.statutAvancementSignalement.statut = :statut")
    List<HistoriqueStatutSignalement> findAllByStatut(@Param("statut") String statut);
}

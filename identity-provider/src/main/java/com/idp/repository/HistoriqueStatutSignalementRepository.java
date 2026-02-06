package com.idp.repository;

import com.idp.entity.HistoriqueStatutSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueStatutSignalementRepository extends JpaRepository<HistoriqueStatutSignalement, String> {
    
    List<HistoriqueStatutSignalement> findBySignalementId(String signalementId);
    
    List<HistoriqueStatutSignalement> findBySignalementIdOrderByDateDesc(String signalementId);
}

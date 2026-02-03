package com.idp.repository;

import com.idp.entity.Signalement;
import com.idp.entity.StatutSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, String> {
    
    List<Signalement> findBySignaleurId(String signaleurId);
    
    List<Signalement> findByStatut(StatutSignalement statut);
    
    List<Signalement> findByIsSynchronizedFalse();
    
    Optional<Signalement> findByFirebaseId(String firebaseId);
    
    @Query("SELECT s FROM Signalement s WHERE s.latitude BETWEEN :minLat AND :maxLat " +
           "AND s.longitude BETWEEN :minLon AND :maxLon")
    List<Signalement> findByGeographicBounds(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon
    );
}

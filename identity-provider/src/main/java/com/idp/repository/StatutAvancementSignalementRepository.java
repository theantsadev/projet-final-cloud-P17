package com.idp.repository;

import com.idp.entity.StatutAvancementSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StatutAvancementSignalementRepository extends JpaRepository<StatutAvancementSignalement, String> {
    
    Optional<StatutAvancementSignalement> findByStatut(String statut);
}

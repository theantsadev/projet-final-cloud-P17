package com.idp.repository;

import com.idp.entity.TypeReparation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TypeReparationRepository extends JpaRepository<TypeReparation, String> {

    /**
     * Trouver tous les types de réparation actifs
     */
    List<TypeReparation> findByIsActiveTrueOrderByNiveauAsc();

    /**
     * Trouver tous les types triés par niveau
     */
    List<TypeReparation> findAllByOrderByNiveauAsc();

    /**
     * Trouver par nom (insensible à la casse)
     */
    Optional<TypeReparation> findByNomIgnoreCase(String nom);

    /**
     * Trouver par niveau
     */
    List<TypeReparation> findByNiveau(Integer niveau);

    /**
     * Vérifier si un nom existe déjà
     */
    boolean existsByNomIgnoreCase(String nom);

    /**
     * Compter les types actifs
     */
    long countByIsActiveTrue();
}

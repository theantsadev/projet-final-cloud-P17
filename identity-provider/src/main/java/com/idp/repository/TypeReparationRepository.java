package com.idp.repository;

import com.idp.entity.TypeReparation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface TypeReparationRepository extends JpaRepository<TypeReparation, String> {

    Optional<TypeReparation> findByNom(String nom);

    List<TypeReparation> findByNiveauBetween(Integer niveauMin, Integer niveauMax);

    List<TypeReparation> findByNiveau(Integer niveau);

    boolean existsByNom(String nom);
}

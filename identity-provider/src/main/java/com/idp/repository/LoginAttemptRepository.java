package com.idp.repository;

import com.idp.entity.LoginAttempt;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, String> {
    List<LoginAttempt> findByEmailOrderByAttemptedAtDesc(String email);
    List<LoginAttempt> findBySyncStatus(String syncStatus); // AJOUTEZ CETTE LIGNE

}
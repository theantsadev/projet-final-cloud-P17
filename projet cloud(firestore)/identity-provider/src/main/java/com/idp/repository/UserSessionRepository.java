package com.idp.repository;

import com.idp.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findBySessionToken(String sessionToken);
    
    List<UserSession> findByUserId(String userId);
    Optional<UserSession> findByRefreshToken(String refreshToken);

  

    List<UserSession> findByExpiresAtBefore(LocalDateTime dateTime);

    List<UserSession> findBySyncStatus(String syncStatus);

    @Query("SELECT s FROM UserSession s WHERE s.isValid = true AND s.expiresAt > CURRENT_TIMESTAMP")
    List<UserSession> findActiveSessions();
}
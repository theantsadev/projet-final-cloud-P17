package com.idp.repository;

import com.idp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    User findByFirestoreId(String firestoreId);

    List<User> findBySyncStatus(String syncStatus);

    List<User> findByIsLockedTrue();

    
    @Query("SELECT u FROM User u WHERE u.lastFailedLogin < CURRENT_TIMESTAMP - 30 * 60 * 1000 AND u.isLocked = true")
    List<User> findExpiredLockouts();
}
package com.idp.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Data
public class LoginAttempt {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @CreationTimestamp
    @Column(name = "attempted_at")
    private LocalDateTime attemptedAt;

    @Column(name = "firestore_id", unique = true, length = 255)
    private String firestoreId;

    @Column(name = "sync_status", length = 20)
    private String syncStatus = "PENDING";
}
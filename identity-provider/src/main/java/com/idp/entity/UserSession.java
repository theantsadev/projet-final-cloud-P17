package com.idp.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
@Data
public class UserSession {
    @Id
    @Column(length = 36)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "session_token", unique = true, nullable = false, length = 512)
    private String sessionToken;
    
    @Column(name = "refresh_token", unique = true, length = 512)
    private String refreshToken;
    
    @Column(name = "device_info", columnDefinition = "TEXT")
    private String deviceInfo;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "is_valid")
    private Boolean isValid = true;
    
    @Column(name = "firestore_id", unique = true, length = 255)
    private String firestoreId;
    
    @Column(name = "sync_status", length = 20)
    private String syncStatus = "PENDING";
}
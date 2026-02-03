package com.idp.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_settings")
@Data
public class SecuritySetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "setting_key", unique = true, nullable = false, length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(columnDefinition = "TEXT")
    private String description;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // AJOUTE CES 2 CHAMPS :
    @Column(name = "firestore_id")
    private String firestoreId;
    
    @Column(name = "sync_status", nullable = false)
    private String syncStatus = "PENDING";
    
    @PrePersist
    @PreUpdate
    public void prepareForSync() {
        if (this.firestoreId == null) {
            this.firestoreId = UUID.randomUUID().toString();
        }
        if (this.syncStatus == null) {
            this.syncStatus = "PENDING";
        }
    }
}
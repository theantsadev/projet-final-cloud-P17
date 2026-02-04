package com.idp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "photos_signalement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotoSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @ManyToOne
    @JoinColumn(name = "signalement_id", nullable = false)
    private Signalement signalement;

    @Column(name = "firebase_storage_url", nullable = false, length = 500)
    private String firebaseStorageUrl;

    @Column(name = "firebase_storage_path", nullable = false, length = 500)
    private String firebaseStoragePath;

    @Column(name = "ordre")
    private Integer ordre;

    @Column(name = "is_principale")
    private Boolean isPrincipale = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
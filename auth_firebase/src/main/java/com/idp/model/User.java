package com.idp.model;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;

    private String firebaseUid;

    private String fullName;

    private boolean enabled = true;

    private int loginAttempts = 0;

    private boolean locked = false;

    private LocalDateTime lastLogin;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();
}
package com.idp.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String userId;
    private String email;
    private long expiresIn;
    private boolean firebaseAuth;
    private long issuedAt;
}
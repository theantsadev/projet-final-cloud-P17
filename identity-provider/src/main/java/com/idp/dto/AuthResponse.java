package com.idp.dto;

import com.idp.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    private User user;
}

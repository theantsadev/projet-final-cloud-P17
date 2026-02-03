package com.idp.dto;

import lombok.Data;

@Data
public class SecuritySettingsRequest {
    private Integer maxLoginAttempts;
    private Integer sessionDurationMinutes;
    private Integer lockoutDurationMinutes;
}
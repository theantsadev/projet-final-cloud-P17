package com.idp.dto;

import lombok.Data;
import jakarta.validation.constraints.Min;

@Data
public class SessionConfigRequest {

    @Min(value = 1, message = "Session timeout must be at least 1 minute")
    private Integer sessionTimeoutMinutes;

    @Min(value = 1, message = "Max login attempts must be at least 1")
    private Integer maxLoginAttempts;
}
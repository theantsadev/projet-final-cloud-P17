package com.idp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "idp")
@Data
public class IdpProperties {
    private int maxLoginAttempts = 3;
    private int sessionTimeoutMinutes = 30;
    private boolean enableFirebase = true;
}
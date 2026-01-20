package com.idp.service;

import com.idp.config.IdpProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SessionConfigService {

    @Autowired
    private IdpProperties idpProperties;

    public void updateSessionTimeout(int minutes) {
        if (minutes < 1) {
            throw new IllegalArgumentException("Session timeout must be at least 1 minute");
        }
        idpProperties.setSessionTimeoutMinutes(minutes);
    }

    public void updateMaxLoginAttempts(int attempts) {
        if (attempts < 1) {
            throw new IllegalArgumentException("Max login attempts must be at least 1");
        }
        idpProperties.setMaxLoginAttempts(attempts);
    }

    public int getSessionTimeout() {
        return idpProperties.getSessionTimeoutMinutes();
    }

    public int getMaxLoginAttempts() {
        return idpProperties.getMaxLoginAttempts();
    }
}
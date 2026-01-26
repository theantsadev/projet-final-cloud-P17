package com.idp.service;

import com.idp.dto.SecuritySettingsRequest;
import com.idp.entity.SecuritySetting;
import com.idp.repository.SecuritySettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SecurityService {

    private final SecuritySettingRepository securitySettingRepository;

    @Value("${security.max.login.attempts:3}")
    private Integer defaultMaxAttempts;

    @Value("${security.session.duration.minutes:60}")
    private Integer defaultSessionDuration;

    @Value("${security.lockout.duration.minutes:30}")
    private Integer defaultLockoutDuration;

    @Transactional
    public void updateSecuritySettings(SecuritySettingsRequest request) {
        if (request.getMaxLoginAttempts() != null) {
            updateSetting("MAX_LOGIN_ATTEMPTS", request.getMaxLoginAttempts().toString());
        }
        if (request.getSessionDurationMinutes() != null) {
            updateSetting("SESSION_DURATION_MINUTES", request.getSessionDurationMinutes().toString());
        }
        if (request.getLockoutDurationMinutes() != null) {
            updateSetting("LOCKOUT_DURATION_MINUTES", request.getLockoutDurationMinutes().toString());
        }

        // Pas besoin de sync pour les settings simples
        System.out.println("Paramètres de sécurité mis à jour");
    }

    public Map<String, Integer> getSecuritySettings() {
        Map<String, Integer> settings = new HashMap<>();
        settings.put("maxLoginAttempts", getSettingValue("MAX_LOGIN_ATTEMPTS", defaultMaxAttempts));
        settings.put("sessionDurationMinutes", getSettingValue("SESSION_DURATION_MINUTES", defaultSessionDuration));
        settings.put("lockoutDurationMinutes", getSettingValue("LOCKOUT_DURATION_MINUTES", defaultLockoutDuration));
        return settings;
    }

    private void updateSetting(String key, String value) {
        securitySettingRepository.findByKey(key)
                .ifPresentOrElse(
                        setting -> {
                            setting.setValue(value);
                            securitySettingRepository.save(setting);
                        },
                        () -> {
                            SecuritySetting newSetting = new SecuritySetting();
                            newSetting.setKey(key);
                            newSetting.setValue(value);
                            securitySettingRepository.save(newSetting);
                        });
    }

    private Integer getSettingValue(String key, Integer defaultValue) {
        return securitySettingRepository.findByKey(key)
                .map(setting -> Integer.parseInt(setting.getValue()))
                .orElse(defaultValue);
    }
}
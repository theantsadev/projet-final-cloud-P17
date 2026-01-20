package com.idp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.api.key}")
    private String firebaseApiKey;

    @Value("${firebase.project.id}")
    private String firebaseProjectId;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public String firebaseApiKey() {
        return firebaseApiKey;
    }

    @Bean
    public String firebaseProjectId() {
        return firebaseProjectId;
    }
}
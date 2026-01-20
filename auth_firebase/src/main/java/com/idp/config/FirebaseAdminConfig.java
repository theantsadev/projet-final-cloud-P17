package com.idp.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseAdminConfig {

    @Value("${firebase.credentials.path}")
    private String credentialsPath;

    @Value("${firebase.project.id}")
    private String projectId;

    @Bean
    public FirebaseAuth firebaseAuth() {
        return FirebaseAuth.getInstance();
    }

    @PostConstruct
    public void initialize() {
        try {
            System.out.println("Initializing Firebase Admin SDK...");
            System.out.println("Credentials path: " + credentialsPath);
            System.out.println("Project ID: " + projectId);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(
                            new ClassPathResource(credentialsPath).getInputStream()))
                    .setProjectId(projectId)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK initialized successfully!");
            } else {
                System.out.println("Firebase Admin SDK already initialized");
            }
        } catch (IOException e) {
            System.err.println("ERROR: Failed to initialize Firebase Admin SDK");
            System.err.println("Message: " + e.getMessage());
            System.err.println("Make sure firebase-service-account.json exists in src/main/resources/");
            System.err.println("Continuing without Firebase Admin features...");
        }
    }
}
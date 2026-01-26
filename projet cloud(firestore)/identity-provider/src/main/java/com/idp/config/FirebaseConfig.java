package com.idp.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials.path}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() {
        log.info("🔄 Tentative de connexion Firebase...");
        log.info("📁 Cherche fichier: {}", credentialsPath);

        try {
            String path = credentialsPath.replace("classpath:", "");
            log.info("🔍 Recherche: {}", path);

            ClassPathResource resource = new ClassPathResource(path);
            log.info("📄 Fichier existe: {}", resource.exists());

            if (!resource.exists()) {
                log.error("❌ Fichier NON TROUVÉ: {}", path);
                log.info("📂 Répertoire resources: {}", new ClassPathResource(".").getURL());
                return null;
            }

            InputStream serviceAccount = resource.getInputStream();
            log.info("✅ Fichier Firebase chargé");

            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
            log.info("✅ Credentials Firebase chargés");

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            FirebaseApp app = FirebaseApp.initializeApp(options);
            log.info("🎉 Firebase initialisé avec succès!");
            log.info("📊 Projet ID: {}", app.getOptions().getProjectId());

            return app;
        } catch (IOException e) {
            log.error("❌ ERREUR Firebase - Fichier non trouvé: {}", e.getMessage());
            log.error("❌ Chemin: {}", credentialsPath);
            return null;
        } catch (Exception e) {
            log.error("❌ ERREUR Firebase - Initialisation: {}", e.getMessage());
            return null;
        }
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        if (firebaseApp != null) {
            try {
                Firestore firestore = FirestoreClient.getFirestore(firebaseApp);
                log.info("🔥 Firestore connecté!");

                // Test simple
                firestore.listCollections();
                log.info("✅ Test connexion Firestore: OK");

                return firestore;
            } catch (Exception e) {
                log.error("❌ ERREUR Firestore: {}", e.getMessage());
                return null;
            }
        }
        log.warn("⚠️ Firestore non disponible");
        return null;
    }
}
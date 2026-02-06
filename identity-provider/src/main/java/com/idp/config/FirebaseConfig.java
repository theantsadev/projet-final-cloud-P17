package com.idp.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials.path}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() {
        log.info("🔄 Vérification de l'état Firebase...");
        
        // VÉRIFICATION CRITIQUE : Vérifier si Firebase est déjà initialisé
        List<FirebaseApp> firebaseApps = FirebaseApp.getApps();
        log.info("📊 Nombre d'apps Firebase existantes: {}", firebaseApps.size());
        
        for (FirebaseApp app : firebaseApps) {
            log.info("📱 App Firebase trouvée: {} - {}", app.getName(), app.getOptions().getProjectId());
        }
        
        // Si l'app DEFAULT existe déjà, on la retourne
        try {
            FirebaseApp existingApp = FirebaseApp.getInstance();
            log.info("✅ Utilisation de l'instance Firebase existante: {}", existingApp.getName());
            return existingApp;
        } catch (IllegalStateException e) {
            log.info("ℹ️ Aucune instance Firebase trouvée, initialisation en cours...");
        }
        
        // Sinon, on initialise
        log.info("📁 Cherche fichier: {}", credentialsPath);

        try {
            InputStream serviceAccount = null;
            Resource resource = null;
            
            // Déterminer le type de chemin et charger le fichier en conséquence
            if (credentialsPath.startsWith("file:")) {
                // Chemin absolu avec préfixe file:
                String absolutePath = credentialsPath.replace("file:", "");
                log.info("🔍 Chemin absolu détecté: {}", absolutePath);
                
                resource = new FileSystemResource(absolutePath);
                log.info("📄 Fichier existe: {}", resource.exists());
                
                if (!resource.exists()) {
                    log.error("❌ Fichier NON TROUVÉ: {}", absolutePath);
                    throw new RuntimeException("Fichier Firebase non trouvé: " + absolutePath);
                }
                
                serviceAccount = resource.getInputStream();
            } else if (credentialsPath.startsWith("classpath:")) {
                // Chemin classpath
                String classPath = credentialsPath.replace("classpath:", "");
                log.info("🔍 Chemin ClassPath détecté: {}", classPath);
                
                resource = new ClassPathResource(classPath);
                log.info("📄 Fichier existe: {}", resource.exists());
                
                if (!resource.exists()) {
                    log.error("❌ Fichier NON TROUVÉ: {}", classPath);
                    throw new RuntimeException("Fichier Firebase non trouvé: " + classPath);
                }
                
                serviceAccount = resource.getInputStream();
            } else {
                // Chemin relatif ou absolu sans préfixe
                log.info("🔍 Chemin relatif détecté: {}", credentialsPath);
                
                resource = new FileSystemResource(credentialsPath);
                log.info("📄 Fichier existe: {}", resource.exists());
                
                if (!resource.exists()) {
                    log.error("❌ Fichier NON TROUVÉ: {}", credentialsPath);
                    throw new RuntimeException("Fichier Firebase non trouvé: " + credentialsPath);
                }
                
                serviceAccount = resource.getInputStream();
            }

            log.info("✅ Fichier Firebase chargé");

            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
            log.info("✅ Credentials Firebase chargés");

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            // Vérification finale avant initialisation
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("🎉 Firebase initialisé avec succès!");
                log.info("📊 Projet ID: {}", app.getOptions().getProjectId());
                return app;
            } else {
                FirebaseApp app = FirebaseApp.getInstance();
                log.info("⚠️ Firebase déjà initialisé, utilisation de l'instance existante");
                return app;
            }
            
        } catch (IOException e) {
            log.error("❌ ERREUR Firebase - Fichier non trouvé: {}", e.getMessage());
            log.error("❌ Chemin: {}", credentialsPath);
            throw new RuntimeException("Erreur de fichier Firebase", e);
        } catch (Exception e) {
            log.error("❌ ERREUR Firebase - Initialisation: {}", e.getMessage());
            throw new RuntimeException("Erreur d'initialisation Firebase", e);
        }
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        if (firebaseApp != null) {
            try {
                Firestore firestore = FirestoreClient.getFirestore(firebaseApp);
                log.info("🔥 Firestore connecté avec l'app: {}", firebaseApp.getName());

                // Test simple (optionnel)
                try {
                    firestore.listCollections();
                    log.info("✅ Test connexion Firestore: OK");
                } catch (Exception e) {
                    log.warn("⚠️ Test de connexion échoué (peut être normal): {}", e.getMessage());
                }

                return firestore;
            } catch (Exception e) {
                log.error("❌ ERREUR Firestore: {}", e.getMessage());
                throw new RuntimeException("Erreur de connexion Firestore", e);
            }
        }
        log.error("❌ Firestore non disponible - FirebaseApp est null");
        throw new RuntimeException("FirebaseApp non initialisée");
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        if (firebaseApp != null) {
            try {
                FirebaseAuth auth = FirebaseAuth.getInstance(firebaseApp);
                log.info("🔐 Firebase Auth connecté avec l'app: {}", firebaseApp.getName());
                return auth;
            } catch (Exception e) {
                log.error("❌ ERREUR Firebase Auth: {}", e.getMessage());
                throw new RuntimeException("Erreur de connexion Firebase Auth", e);
            }
        }
        log.error("❌ Firebase Auth non disponible - FirebaseApp est null");
        throw new RuntimeException("FirebaseApp non initialisée");
    }
}
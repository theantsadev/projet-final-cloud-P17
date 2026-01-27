package com.idp.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.idp.entity.User;
import com.idp.entity.UserSession;
import com.idp.entity.LoginAttempt;
import com.idp.entity.SecuritySetting; // ← UN SEUL IMPORT ICI
import com.idp.repository.UserRepository;
import com.idp.repository.UserSessionRepository;
import com.idp.repository.LoginAttemptRepository;
import com.idp.repository.SecuritySettingRepository; // ← AJOUTE SI TU L'AS CRÉÉ
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@Slf4j
public class SyncService {

    private final Firestore firestore;
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final SecuritySettingRepository securitySettingRepository;

    @Autowired
    public SyncService(
            @Autowired(required = false) Firestore firestore,
            UserRepository userRepository,
            UserSessionRepository sessionRepository,
            LoginAttemptRepository loginAttemptRepository,
            SecuritySettingRepository securitySettingRepository) {
        this.firestore = firestore;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.securitySettingRepository = securitySettingRepository;

        if (firestore == null) {
            log.warn("⚠️ Firestore non disponible - sync désactivé");
        }
    }

    // Collections Firestore
    private static final String FIRESTORE_USERS_COLLECTION = "users";
    private static final String FIRESTORE_SESSIONS_COLLECTION = "user_sessions";
    private static final String FIRESTORE_LOGIN_ATTEMPTS_COLLECTION = "login_attempts";

    // Formateur de dates
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Synchronise un paramètre de sécurité vers Firestore
     */
    @Transactional
    public void syncSecuritySettingToFirestore(SecuritySetting setting) {
        log.info("📤 Sync paramètre sécurité: {}", setting.getKey());

        if (!isOnline()) {
            setting.setSyncStatus("PENDING");
            securitySettingRepository.save(setting);
            return;
        }

        try {
            Map<String, Object> settingData = new HashMap<>();
            settingData.put("id", setting.getId());
            settingData.put("key", setting.getKey());
            settingData.put("value", setting.getValue());
            settingData.put("description", setting.getDescription());
            settingData.put("updatedAt", formatDate(setting.getUpdatedAt()));
            settingData.put("firestoreId", setting.getFirestoreId());
            settingData.put("syncStatus", setting.getSyncStatus());
            settingData.put("localUpdatedAt", formatDate(LocalDateTime.now()));
            settingData.put("source", "POSTGRESQL");

            if (setting.getFirestoreId() == null) {
                setting.setFirestoreId("setting_" + setting.getId());
            }

            ApiFuture<WriteResult> future = firestore
                    .collection("security_settings")
                    .document(setting.getFirestoreId())
                    .set(settingData);

            WriteResult result = future.get();

            setting.setSyncStatus("SYNCED");
            securitySettingRepository.save(setting);

            log.info("✅ Paramètre {} synced à Firestore", setting.getKey());

        } catch (Exception e) {
            setting.setSyncStatus("FAILED");
            securitySettingRepository.save(setting);
            log.error("❌ Erreur sync paramètre {}: {}", setting.getKey(), e.getMessage());
        }
    }

    /**
     * Vérifie la connexion à Firestore
     */
    public boolean isOnline() {
        log.info("🔍 Vérification connexion Firestore...");

        if (firestore == null) {
            log.warn("❌ Firestore est NULL - Mode hors ligne");
            return false;
        }

        try {
            log.info("🔄 Test connexion Firestore...");
            firestore.listCollections();
            log.info("✅ Firestore CONNECTÉ");
            return true;
        } catch (Exception e) {
            log.error("❌ Firestore HORS LIGNE: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Synchronise un utilisateur vers Firestore
     */
    @Transactional
    public void syncUserToFirestore(User user) {
        log.info("📤 Sync utilisateur: {}", user.getEmail());

        if (!isOnline()) {
            user.setSyncStatus("PENDING");
            userRepository.save(user);
            log.warn("⏸️  Sync annulé - Hors ligne");
            return;
        }

        try {
            Map<String, Object> userData = prepareUserData(user);

            if (user.getFirestoreId() == null) {
                user.setFirestoreId(user.getId());
            }

            log.info("📝 Tentative d'écriture dans Firestore pour: {}", user.getEmail());
            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_USERS_COLLECTION)
                    .document(user.getFirestoreId())
                    .set(userData);

            WriteResult result = future.get();

            user.setSyncStatus("SYNCED");
            userRepository.save(user);

            log.info("✅ Utilisateur {} synced à Firestore à {}",
                    user.getEmail(), result.getUpdateTime());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            user.setSyncStatus("FAILED");
            userRepository.save(user);
            log.error("❌ Sync interrompu pour {}: {}", user.getEmail(), e.getMessage());
        } catch (ExecutionException e) {
            user.setSyncStatus("FAILED");
            userRepository.save(user);
            log.error("❌ Erreur d'exécution Firestore pour {}: {}", user.getEmail(), e.getMessage());
            if (e.getCause() != null) {
                log.error("Cause racine: {}", e.getCause().getMessage());
            }
        } catch (Exception e) {
            user.setSyncStatus("FAILED");
            userRepository.save(user);
            log.error("❌ Erreur sync utilisateur {}: {}", user.getEmail(), e.getMessage());
        }
    }

    /**
     * Synchronise une session vers Firestore
     */
    @Transactional
    public void syncSessionToFirestore(UserSession session) {
        log.info("📤 Sync session: {}", session.getId());

        if (!isOnline()) {
            session.setSyncStatus("PENDING");
            sessionRepository.save(session);
            return;
        }

        try {
            Map<String, Object> sessionData = prepareSessionData(session);

            if (session.getFirestoreId() == null) {
                session.setFirestoreId(session.getId());
            }

            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_SESSIONS_COLLECTION)
                    .document(session.getFirestoreId())
                    .set(sessionData);

            WriteResult result = future.get();

            session.setSyncStatus("SYNCED");
            sessionRepository.save(session);

            log.info("✅ Session {} synced à Firestore", session.getId());

        } catch (Exception e) {
            session.setSyncStatus("FAILED");
            sessionRepository.save(session);
            log.error("❌ Erreur sync session {}: {}", session.getId(), e.getMessage());
        }
    }

    /**
     * Synchronise une tentative de connexion vers Firestore
     */
    @Transactional
    public void syncLoginAttemptToFirestore(LoginAttempt attempt) {
        log.info("📤 Sync login attempt: {}", attempt.getId());

        if (!isOnline()) {
            attempt.setSyncStatus("PENDING");
            loginAttemptRepository.save(attempt);
            return;
        }

        try {
            Map<String, Object> attemptData = prepareLoginAttemptData(attempt);

            if (attempt.getFirestoreId() == null) {
                attempt.setFirestoreId(attempt.getId());
            }

            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_LOGIN_ATTEMPTS_COLLECTION)
                    .document(attempt.getFirestoreId())
                    .set(attemptData);

            WriteResult result = future.get();

            attempt.setSyncStatus("SYNCED");
            loginAttemptRepository.save(attempt);

            log.info("✅ Login attempt {} synced à Firestore", attempt.getId());

        } catch (Exception e) {
            attempt.setSyncStatus("FAILED");
            loginAttemptRepository.save(attempt);
            log.error("❌ Erreur sync login attempt {}: {}", attempt.getId(), e.getMessage());
        }
    }

    /**
     * Prépare les données utilisateur pour Firestore
     */
    private Map<String, Object> prepareUserData(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("fullName", user.getFullName());
        data.put("phone", user.getPhone());
        data.put("isActive", user.getIsActive() != null ? user.getIsActive() : true);
        data.put("isLocked", user.getIsLocked() != null ? user.getIsLocked() : false);
        data.put("failedLoginAttempts", user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0);

        // Convertir les dates en String
        data.put("lastFailedLogin", formatDate(user.getLastFailedLogin()));
        data.put("lastLogin", formatDate(user.getLastLogin()));
        data.put("createdAt", formatDate(user.getCreatedAt()));
        data.put("updatedAt", formatDate(user.getUpdatedAt()));

        data.put("firestoreId", user.getFirestoreId());
        data.put("syncStatus", user.getSyncStatus() != null ? user.getSyncStatus() : "PENDING");
        data.put("localUpdatedAt", formatDate(LocalDateTime.now()));
        data.put("source", "POSTGRESQL");
        return data;
    }

    /**
     * Prépare les données de session pour Firestore
     */
    private Map<String, Object> prepareSessionData(UserSession session) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", session.getId());
        data.put("userId", session.getUser() != null ? session.getUser().getId() : null);
        data.put("sessionToken", session.getSessionToken());
        data.put("refreshToken", session.getRefreshToken());
        data.put("deviceInfo", session.getDeviceInfo());
        data.put("ipAddress", session.getIpAddress());
        data.put("expiresAt", formatDate(session.getExpiresAt()));
        data.put("createdAt", formatDate(session.getCreatedAt()));
        data.put("isValid", session.getIsValid() != null ? session.getIsValid() : true);
        data.put("firestoreId", session.getFirestoreId());
        data.put("syncStatus", session.getSyncStatus() != null ? session.getSyncStatus() : "PENDING");
        data.put("localUpdatedAt", formatDate(LocalDateTime.now()));
        data.put("source", "POSTGRESQL");
        return data;
    }

    /**
     * Prépare les données de tentative de connexion pour Firestore
     */
    private Map<String, Object> prepareLoginAttemptData(LoginAttempt attempt) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", attempt.getId());
        data.put("userId", attempt.getUser() != null ? attempt.getUser().getId() : null);
        data.put("email", attempt.getEmail());
        data.put("ipAddress", attempt.getIpAddress());
        data.put("userAgent", attempt.getUserAgent());
        data.put("success", attempt.getSuccess() != null ? attempt.getSuccess() : false);
        data.put("failureReason", attempt.getFailureReason());
        data.put("attemptedAt", formatDate(attempt.getAttemptedAt()));
        data.put("firestoreId", attempt.getFirestoreId());
        data.put("syncStatus", attempt.getSyncStatus() != null ? attempt.getSyncStatus() : "PENDING");
        data.put("localUpdatedAt", formatDate(LocalDateTime.now()));
        data.put("source", "POSTGRESQL");
        return data;
    }

    /**
     * Formate une LocalDateTime en String pour Firestore
     */
    private String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DATE_FORMATTER);
    }

    /**
     * Vérifie si un utilisateur existe dans Firestore
     */
    private boolean userExistsInFirestore(String firestoreId) {
        try {
            if (!isOnline())
                return false;

            var document = firestore
                    .collection(FIRESTORE_USERS_COLLECTION)
                    .document(firestoreId)
                    .get();

            var snapshot = document.get();
            return snapshot.exists();

        } catch (Exception e) {
            log.error("❌ Erreur vérification Firestore: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Réinitialise les syncs marqués SYNCED mais qui ont échoué
     */
    @Transactional
    public void resetFailedSyncs() {
        try {
            log.info("🔄 Vérification des syncs potentiellement échoués...");

            // Rechercher les utilisateurs récents marqués SYNCED
            List<User> syncedUsers = userRepository.findBySyncStatus("SYNCED");

            for (User user : syncedUsers) {
                try {
                    boolean existsInFirestore = userExistsInFirestore(user.getFirestoreId());
                    if (!existsInFirestore) {
                        log.warn("⚠️  Utilisateur {} marqué SYNCED mais absent de Firestore - réinitialisation",
                                user.getEmail());
                        user.setSyncStatus("PENDING");
                        userRepository.save(user);
                    }
                } catch (Exception e) {
                    log.error("❌ Erreur vérification Firestore pour {}: {}", user.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("❌ Erreur dans resetFailedSyncs: {}", e.getMessage());
        }
    }

    /**
     * Méthode de synchro automatique programmée
     */
    @Scheduled(fixedDelay = 30000) // Toutes les 30 secondes
    @Transactional
    public void syncAllPendingItems() {
        if (!isOnline()) {
            log.info("⏸️  Sync automatique annulé - Firestore hors ligne");
            return;
        }

        log.info("🔄 Début synchro automatique des éléments en attente...");

        // 1. Vérifier les syncs potentiellement échoués
        resetFailedSyncs();

        // 2. Synchroniser les utilisateurs en attente
        List<User> pendingUsers = userRepository.findBySyncStatus("PENDING");
        log.info("📋 {} utilisateurs en attente de sync", pendingUsers.size());

        for (User user : pendingUsers) {
            try {
                syncUserToFirestore(user);
            } catch (Exception e) {
                log.error("❌ Erreur sync auto utilisateur {}: {}", user.getEmail(), e.getMessage());
            }
        }

        // 3. Synchroniser les sessions en attente
        List<UserSession> pendingSessions = sessionRepository.findBySyncStatus("PENDING");
        log.info("📋 {} sessions en attente de sync", pendingSessions.size());

        for (UserSession session : pendingSessions) {
            try {
                syncSessionToFirestore(session);
            } catch (Exception e) {
                log.error("❌ Erreur sync auto session {}: {}", session.getId(), e.getMessage());
            }
        }

        // 4. Synchroniser les tentatives de connexion en attente
        List<LoginAttempt> pendingAttempts = loginAttemptRepository.findBySyncStatus("PENDING");
        log.info("📋 {} tentatives login en attente de sync", pendingAttempts.size());

        for (LoginAttempt attempt : pendingAttempts) {
            try {
                syncLoginAttemptToFirestore(attempt);
            } catch (Exception e) {
                log.error("❌ Erreur sync auto login attempt {}: {}", attempt.getId(), e.getMessage());
            }
        }

        log.info("✅ Synchro automatique terminée");
        // Dans syncAllPendingItems(), ajoute :
        List<SecuritySetting> pendingSettings = securitySettingRepository.findBySyncStatus("PENDING");
        log.info("📋 {} paramètres sécurité en attente de sync", pendingSettings.size());

        for (SecuritySetting setting : pendingSettings) {
            try {
                syncSecuritySettingToFirestore(setting);
            } catch (Exception e) {
                log.error("❌ Erreur sync auto paramètre {}: {}", setting.getKey(), e.getMessage());
            }
        }
    }

    /**
     * Force la synchronisation de tous les éléments avec statut FAILED
     */
    @Scheduled(fixedDelay = 60000) // Toutes les minutes
    @Transactional
    public void retryFailedSyncs() {
        if (!isOnline()) {
            return;
        }

        log.info("🔄 Réessayer les syncs échoués...");

        // Réessayer les utilisateurs FAILED
        List<User> failedUsers = userRepository.findBySyncStatus("FAILED");
        log.info("🔄 {} utilisateurs FAILED à réessayer", failedUsers.size());

        for (User user : failedUsers) {
            try {
                user.setSyncStatus("PENDING");
                userRepository.save(user);
                syncUserToFirestore(user);
            } catch (Exception e) {
                log.error("❌ Réessai échoué pour utilisateur {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }
}
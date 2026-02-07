package com.idp.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuthException;
import com.idp.entity.User;
import com.idp.entity.UserSession;
import com.idp.entity.LoginAttempt;
import com.idp.entity.SecuritySetting;
import com.idp.repository.UserRepository;
import com.idp.repository.UserSessionRepository;
import com.idp.repository.LoginAttemptRepository;
import com.idp.repository.SecuritySettingRepository;
import com.idp.util.EncryptionUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final Firestore firestore;
    private final FirebaseAuth firebaseAuth;
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final SecuritySettingRepository securitySettingRepository;
    private final EncryptionUtil encryptionUtil;

    // Pour gérer les listeners Firestore
    private ListenerRegistration userListener;
    private ListenerRegistration sessionListener;
    private ListenerRegistration loginAttemptsListener;

    // Collections Firestore
    private static final String FIRESTORE_USERS_COLLECTION = "users";
    private static final String FIRESTORE_SESSIONS_COLLECTION = "user_sessions";
    private static final String FIRESTORE_LOGIN_ATTEMPTS_COLLECTION = "login_attempts";

    // Formateur de dates
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // Cache du statut de connexion (évite les appels répétés lents)
    private static final long CACHE_DURATION_MS = 5_000; // 5 secondes (réduit pour réagir plus vite au changement de
                                                         // connexion)
    private static final int CONNECTION_TIMEOUT_SECONDS = 10; // 10 secondes max pour vérifier (augmenté)
    private final AtomicBoolean cachedOnlineStatus = new AtomicBoolean(false);
    private final AtomicLong lastOnlineCheck = new AtomicLong(0);

    /**
     * Initialiser les listeners Firestore
     */
    @PostConstruct
    public void initFirestoreListeners() {
        log.info("🚀 Initialisation des listeners Firestore...");
        if (isOnline()) {
            // startFirestoreListeners();
        }
    }

    /**
     * Démarrer les listeners Firestore pour tirer les données mobiles
     */
    public void startFirestoreListeners() {
        if (!isOnline()) {
            log.warn("⚠️ Firestore hors ligne - Impossible de démarrer les listeners");
            return;
        }

        try {
            log.info("🚀 Démarrage des listeners Firestore (mobile → PostgreSQL)...");

            // Listener pour les utilisateurs (mobile → PostgreSQL)
            userListener = firestore.collection(FIRESTORE_USERS_COLLECTION)
                    .addSnapshotListener((snapshots, e) -> {
                        if (e != null) {
                            log.error("❌ Erreur listener users: {}", e.getMessage());
                            return;
                        }

                        for (DocumentChange dc : snapshots.getDocumentChanges()) {
                            DocumentSnapshot document = dc.getDocument();
                            syncUserFromFirestoreToPostgres(document);
                        }
                    });

            // Listener pour les sessions (mobile → PostgreSQL)
            sessionListener = firestore.collection(FIRESTORE_SESSIONS_COLLECTION)
                    .addSnapshotListener((snapshots, e) -> {
                        if (e != null) {
                            log.error("❌ Erreur listener sessions: {}", e.getMessage());
                            return;
                        }

                        for (DocumentChange dc : snapshots.getDocumentChanges()) {
                            DocumentSnapshot document = dc.getDocument();
                            syncSessionFromFirestoreToPostgres(document);
                        }
                    });

            // Listener pour les tentatives de connexion (mobile → PostgreSQL)
            loginAttemptsListener = firestore.collection(FIRESTORE_LOGIN_ATTEMPTS_COLLECTION)
                    .addSnapshotListener((snapshots, e) -> {
                        if (e != null) {
                            log.error("❌ Erreur listener login attempts: {}", e.getMessage());
                            return;
                        }

                        for (DocumentChange dc : snapshots.getDocumentChanges()) {
                            DocumentSnapshot document = dc.getDocument();
                            syncLoginAttemptFromFirestoreToPostgres(document);
                        }
                    });

            log.info("✅ Listeners Firestore démarrés (mobile → PostgreSQL)");

        } catch (Exception e) {
            log.error("❌ Erreur initialisation listeners: {}", e.getMessage());
        }
    }

    /**
     * Synchroniser un utilisateur de Firestore vers PostgreSQL (mobile → web)
     * MET À JOUR TOUS LES CHAMPS
     */
    @Transactional
    private void syncUserFromFirestoreToPostgres(DocumentSnapshot document) {
        try {
            String email = document.getString("email");
            String firestoreId = document.getId();

            if (email == null) {
                log.warn("⚠️ Document Firestore sans email, ignoré");
                return;
            }

            log.info("📥 Sync Firestore→PostgreSQL - Email: {}", email);

            // Chercher l'utilisateur par email
            Optional<User> userOpt = userRepository.findByEmail(email);
            User user;

            if (userOpt.isPresent()) {
                // Utilisateur existe déjà - mettre à jour TOUS les champs
                user = userOpt.get();
                log.info("✅ Utilisateur trouvé dans PostgreSQL: {}", email);
            } else {
                // Créer un nouvel utilisateur
                log.info("🆕 Création nouvel utilisateur pour: {}", email);
                user = new User();
                user.setId(UUID.randomUUID().toString());
                user.setEmail(email);
                user.setCreatedAt(LocalDateTime.now());
            }

            // METTRE À JOUR TOUS LES CHAMPS depuis Firestore

            // 1. Informations personnelles
            String fullName = document.getString("fullName");
            if (fullName != null && !fullName.equals(user.getFullName())) {
                log.info("✏️ Mise à jour fullName: {} → {}", user.getFullName(), fullName);
                user.setFullName(fullName);
            }

            String phone = document.getString("phone");
            if (phone != null && !phone.equals(user.getPhone())) {
                log.info("✏️ Mise à jour phone: {} → {}", user.getPhone(), phone);
                user.setPhone(phone);
            }

            // 2. Statut du compte
            Boolean isActive = document.getBoolean("isActive");
            if (isActive != null && !isActive.equals(user.getIsActive())) {
                log.info("✏️ Mise à jour isActive: {} → {}", user.getIsActive(), isActive);
                user.setIsActive(isActive);
            }

            // 3. Sécurité - tentatives de connexion
            Long attempts = document.getLong("failedLoginAttempts");
            if (attempts != null && attempts.intValue() != user.getFailedLoginAttempts()) {
                log.info("✏️ Mise à jour failedLoginAttempts: {} → {}",
                        user.getFailedLoginAttempts(), attempts);
                user.setFailedLoginAttempts(attempts.intValue());
            }

            // 4. Sécurité - verrouillage
            Boolean isLocked = document.getBoolean("isLocked");
            if (isLocked != null && !isLocked.equals(user.getIsLocked())) {
                log.info("✏️ Mise à jour isLocked: {} → {}", user.getIsLocked(), isLocked);
                user.setIsLocked(isLocked);
            }

            // 5. Dates importantes
            String lastFailedLogin = document.getString("lastFailedLogin");
            if (lastFailedLogin != null) {
                LocalDateTime parsedDate = parseDate(lastFailedLogin);
                if (parsedDate != null && !parsedDate.equals(user.getLastFailedLogin())) {
                    log.info("✏️ Mise à jour lastFailedLogin: {} → {}",
                            user.getLastFailedLogin(), parsedDate);
                    user.setLastFailedLogin(parsedDate);
                }
            }

            String lastLogin = document.getString("lastLogin");
            if (lastLogin != null) {
                LocalDateTime parsedDate = parseDate(lastLogin);
                if (parsedDate != null && !parsedDate.equals(user.getLastLogin())) {
                    log.info("✏️ Mise à jour lastLogin: {} → {}",
                            user.getLastLogin(), parsedDate);
                    user.setLastLogin(parsedDate);
                }
            }

            // 6. Métadonnées de sync
            user.setFirestoreId(firestoreId);
            user.setSyncStatus("SYNCED");
            user.setUpdatedAt(LocalDateTime.now());

            // Sauvegarder
            userRepository.save(user);

            log.info("✅ Utilisateur {} complètement syncé Firestore→PostgreSQL", email);

        } catch (Exception e) {
            log.error("❌ Erreur sync user Firestore→PostgreSQL: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("Cause: {}", e.getCause().getMessage());
            }
        }
    }

    /**
     * Synchroniser une session de Firestore vers PostgreSQL
     */
    @Transactional
    private void syncSessionFromFirestoreToPostgres(DocumentSnapshot document) {
        try {
            String sessionToken = document.getString("sessionToken");

            if (sessionToken == null) {
                return;
            }

            // Vérifier si la session existe déjà
            if (sessionRepository.findBySessionToken(sessionToken).isPresent()) {
                return;
            }

            log.info("📥 Sync Firestore→PostgreSQL - Session: {}", sessionToken);

            UserSession session = new UserSession();
            session.setId(UUID.randomUUID().toString());
            session.setSessionToken(sessionToken);
            session.setRefreshToken(document.getString("refreshToken"));
            session.setDeviceInfo(document.getString("deviceInfo"));
            session.setIpAddress(document.getString("ipAddress"));
            session.setIsValid(document.getBoolean("isValid") != null ? document.getBoolean("isValid") : true);

            String expiresAt = document.getString("expiresAt");
            if (expiresAt != null) {
                session.setExpiresAt(parseDate(expiresAt));
            } else {
                session.setExpiresAt(LocalDateTime.now().plusHours(24));
            }

            String createdAt = document.getString("createdAt");
            if (createdAt != null) {
                session.setCreatedAt(parseDate(createdAt));
            } else {
                session.setCreatedAt(LocalDateTime.now());
            }

            session.setFirestoreId(document.getId());
            session.setSyncStatus("SYNCED");

            sessionRepository.save(session);

            log.info("✅ Session {} tirée Firestore→PostgreSQL", sessionToken);

        } catch (Exception e) {
            log.error("❌ Erreur sync session Firestore→PostgreSQL: {}", e.getMessage());
        }
    }

    /**
     * Synchroniser une tentative de connexion de Firestore vers PostgreSQL
     */
    @Transactional
    private void syncLoginAttemptFromFirestoreToPostgres(DocumentSnapshot document) {
        try {
            String email = document.getString("email");

            if (email == null) {
                return;
            }

            log.info("📥 Sync Firestore→PostgreSQL - Login Attempt pour: {}", email);

            // Chercher l'utilisateur par email
            User user = userRepository.findByEmail(email).orElse(null);

            LoginAttempt attempt = new LoginAttempt();
            attempt.setId(UUID.randomUUID().toString());
            attempt.setUser(user);
            attempt.setEmail(email);
            attempt.setIpAddress(document.getString("ipAddress"));
            attempt.setUserAgent(document.getString("userAgent"));
            attempt.setSuccess(document.getBoolean("success") != null ? document.getBoolean("success") : false);
            attempt.setFailureReason(document.getString("failureReason"));

            String attemptedAt = document.getString("attemptedAt");
            if (attemptedAt != null) {
                attempt.setAttemptedAt(parseDate(attemptedAt));
            } else {
                attempt.setAttemptedAt(LocalDateTime.now());
            }

            attempt.setFirestoreId(document.getId());
            attempt.setSyncStatus("SYNCED");

            loginAttemptRepository.save(attempt);

            log.info("✅ Login attempt tiré Firestore→PostgreSQL pour {}", email);

        } catch (Exception e) {
            log.error("❌ Erreur sync login attempt Firestore→PostgreSQL: {}", e.getMessage());
        }
    }

    /**
     * Arrêter les listeners Firestore
     */
    public void stopFirestoreListeners() {
        try {
            if (userListener != null) {
                userListener.remove();
                userListener = null;
            }
            if (sessionListener != null) {
                sessionListener.remove();
                sessionListener = null;
            }
            if (loginAttemptsListener != null) {
                loginAttemptsListener.remove();
                loginAttemptsListener = null;
            }
            log.info("⏹️  Listeners Firestore arrêtés");
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'arrêt des listeners: {}", e.getMessage());
        }
    }

    /**
     * Redémarrer les listeners (en cas de reconnexion)
     */
    public void restartFirestoreListeners() {
        log.info("🔄 Redémarrage des listeners Firestore...");
        stopFirestoreListeners();
        if (isOnline()) {
            startFirestoreListeners();
        } else {
            log.warn("⚠️ Impossible de redémarrer - Firestore hors ligne");
        }
    }

    /**
     * Vérifie la connexion à Firestore avec cache et timeout
     * Évite les appels répétés lents quand il n'y a pas de connexion
     */
    public boolean isOnline() {
        long now = System.currentTimeMillis();
        long lastCheck = lastOnlineCheck.get();

        // Utiliser le cache si la dernière vérification est récente
        if (now - lastCheck < CACHE_DURATION_MS) {
            return cachedOnlineStatus.get();
        }

        // Vérifier la connexion avec timeout
        boolean online = checkFirebaseConnectionWithTimeout();

        // Mettre à jour le cache
        cachedOnlineStatus.set(online);
        lastOnlineCheck.set(now);

        return online;
    }

    /**
     * Vérifie la connexion Firebase avec un timeout court
     */
    private boolean checkFirebaseConnectionWithTimeout() {
        try {
            log.debug("🔍 Vérification connexion Firebase (timeout: {} sec)...", CONNECTION_TIMEOUT_SECONDS);
            // Utiliser un Future avec timeout pour éviter les blocages longs
            ApiFuture<QuerySnapshot> future = firestore.collection(FIRESTORE_USERS_COLLECTION).limit(1).get();
            QuerySnapshot result = future.get(CONNECTION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            log.info("✅ Firebase ONLINE - {} documents dans collection users", result.size());
            return true;
        } catch (TimeoutException e) {
            log.warn("⏱️ Timeout lors de la vérification Firebase ({} secondes) - Firebase probablement inaccessible",
                    CONNECTION_TIMEOUT_SECONDS);
            return false;
        } catch (ExecutionException e) {
            log.warn("❌ Firebase ExecutionException: {}",
                    e.getCause() != null ? e.getCause().getMessage() : e.getMessage());
            return false;
        } catch (InterruptedException e) {
            log.warn("❌ Firebase InterruptedException: {}", e.getMessage());
            Thread.currentThread().interrupt();
            return false;
        } catch (Exception e) {
            log.warn("❌ Firebase offline - Exception: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    /**
     * Force une nouvelle vérification de la connexion (invalide le cache)
     */
    public void invalidateOnlineCache() {
        lastOnlineCheck.set(0);
    }

    /**
     * Synchroniser un utilisateur vers Firebase (Auth + Firestore)
     */
    @Transactional
    public void syncUserToFirestore(User user) {
        log.info("📤 Sync PostgreSQL→Firebase - User: {}", user.getEmail());

        boolean online = isOnline();
        log.info("   🌐 isOnline() = {} (cache: lastCheck={}ms ago)",
                online,
                System.currentTimeMillis() - lastOnlineCheck.get());

        if (!online) {
            log.warn("   ❌ Firebase offline - User {} reste PENDING", user.getEmail());
            user.setSyncStatus("PENDING");
            userRepository.save(user);
            return;
        }

        try {
            // 1. Créer ou mettre à jour sur Firebase Auth (non-bloquant)
            try {
                createOrUpdateFirebaseAuthUser(user);
            } catch (FirebaseAuthException authEx) {
                // Firebase Auth inaccessible (ex: identitytoolkit.googleapis.com bloqué)
                // On continue quand même avec la sync Firestore
                log.warn("⚠️ Firebase Auth indisponible pour {} ({}), sync Firestore uniquement",
                        user.getEmail(), authEx.getMessage());
            }

            // 2. Utiliser le firebaseUid comme ID du document Firestore (cohérence Auth/Firestore)
            if (user.getFirebaseUid() != null) {
                user.setFirestoreId(user.getFirebaseUid());
            } else if (user.getFirestoreId() == null) {
                user.setFirestoreId("user_" + user.getId());
            }

            Map<String, Object> userData = prepareUserData(user);
            userData.put("source", "POSTGRESQL");
            userData.put("localUpdatedAt", formatDate(LocalDateTime.now()));

            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_USERS_COLLECTION)
                    .document(user.getFirestoreId())
                    .set(userData);

            WriteResult result = future.get();

            user.setSyncStatus("SYNCED");
            // Effacer le mot de passe chiffré après sync réussie
            user.setEncryptedPassword(null);
            userRepository.save(user);

        } catch (Exception e) {
            user.setSyncStatus("FAILED");
            userRepository.save(user);
            log.error("❌ Erreur sync utilisateur {}: {}", user.getEmail(), e.getMessage());
        }
    }

    /**
     * Créer ou mettre à jour l'utilisateur sur Firebase Auth
     */
    private void createOrUpdateFirebaseAuthUser(User user) throws FirebaseAuthException {
        try {
            // Vérifier si l'utilisateur existe déjà dans Firebase Auth
            UserRecord existingUser = firebaseAuth.getUserByEmail(user.getEmail());
            log.info("✏️ Utilisateur {} existe déjà dans Firebase Auth (UID: {})", user.getEmail(),
                    existingUser.getUid());

            // Sauvegarder le UID Firebase Auth
            if (user.getFirebaseUid() == null) {
                user.setFirebaseUid(existingUser.getUid());
                log.info("   🔗 Firebase UID sauvegardé: {}", existingUser.getUid());
            }

        } catch (FirebaseAuthException e) {
            if (e.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                // L'utilisateur n'existe pas → le créer
                log.info("🆕 Création nouvel utilisateur {} dans Firebase Auth", user.getEmail());

                UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                        .setEmail(user.getEmail())
                        .setDisplayName(user.getFullName() != null ? user.getFullName() : "User");

                // Déchiffrer et définir le mot de passe
                String password = user.getRawPassword();
                if (password == null && user.getEncryptedPassword() != null) {
                    try {
                        password = encryptionUtil.decrypt(user.getEncryptedPassword());
                        log.info("   🔓 Mot de passe déchiffré depuis la base pour {}", user.getEmail());
                    } catch (Exception decryptErr) {
                        log.error("   ❌ Impossible de déchiffrer le mot de passe pour {}", user.getEmail());
                    }
                }
                if (password != null && !password.isEmpty()) {
                    request.setPassword(password);
                    log.info("   🔑 Mot de passe défini pour {}", user.getEmail());
                } else {
                    log.warn("   ⚠️ Aucun mot de passe disponible pour {} - Firebase Auth sans mot de passe", user.getEmail());
                }

                // Ajouter le téléphone uniquement s'il est valide
                String phone = user.getPhone();
                if (phone != null && !phone.trim().isEmpty() && isValidPhoneNumber(phone)) {
                    request.setPhoneNumber(phone);
                    log.info("   📱 Téléphone défini: {}", phone);
                } else if (phone != null && !phone.trim().isEmpty()) {
                    log.warn("   ⚠️ Numéro de téléphone invalide ignoré: {}", phone);
                }

                try {
                    UserRecord newUser = firebaseAuth.createUser(request);
                    log.info("✅ Utilisateur {} créé sur Firebase Auth (UID: {})", user.getEmail(), newUser.getUid());

                    // Sauvegarder le UID Firebase Auth
                    user.setFirebaseUid(newUser.getUid());
                    log.info("   🔗 Firebase UID sauvegardé: {}", newUser.getUid());
                } catch (FirebaseAuthException createError) {
                    log.error("❌ Erreur création Firebase Auth pour {}: {} - Détail: {}", 
                            user.getEmail(), 
                            createError.getErrorCode(), 
                            createError.getMessage());
                    throw createError;
                }
            } else {
                // Autre erreur
                log.error("❌ Erreur Firebase Auth - Code: {} - Message: {}", 
                        e.getErrorCode(), 
                        e.getMessage());
                throw e;
            }
        }
    }

    /**
     * Valide un numéro de téléphone pour Firebase Auth
     * Firebase accepte les numéros au format E164: +33123456789
     */
    private boolean isValidPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        
        phone = phone.trim();
        
        // Doit commencer par + et contenir 7-15 chiffres
        if (!phone.startsWith("+")) {
            log.warn("   ⚠️ Téléphone doit commencer par +: {}", phone);
            return false;
        }
        
        // Vérifier qu'il contient seulement + et des chiffres
        String phoneDigits = phone.substring(1);
        if (!phoneDigits.matches("\\d{7,15}")) {
            log.warn("   ⚠️ Téléphone invalide (doit avoir 7-15 chiffres): {}", phone);
            return false;
        }
        
        return true;
    }

    /**
     * Synchroniser une session vers Firestore
     */
    @Transactional
    public void syncSessionToFirestore(UserSession session) {
        log.info("📤 Sync PostgreSQL→Firestore - Session: {}", session.getId());

        if (!isOnline()) {
            session.setSyncStatus("PENDING");
            sessionRepository.save(session);
            return;
        }

        try {
            Map<String, Object> sessionData = prepareSessionData(session);
            sessionData.put("source", "POSTGRESQL");
            sessionData.put("localUpdatedAt", formatDate(LocalDateTime.now()));

            if (session.getFirestoreId() == null) {
                session.setFirestoreId("session_" + session.getId());
            }

            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_SESSIONS_COLLECTION)
                    .document(session.getFirestoreId())
                    .set(sessionData);

            WriteResult result = future.get();

            session.setSyncStatus("SYNCED");
            sessionRepository.save(session);

            log.info("✅ Session {} syncée PostgreSQL→Firestore", session.getId());

        } catch (Exception e) {
            session.setSyncStatus("FAILED");
            sessionRepository.save(session);
            log.error("❌ Erreur sync session {}: {}", session.getId(), e.getMessage());
        }
    }

    /**
     * Synchroniser une tentative de connexion vers Firestore
     */
    @Transactional
    public void syncLoginAttemptToFirestore(LoginAttempt attempt) {
        log.info("📤 Sync PostgreSQL→Firestore - Login Attempt: {}", attempt.getId());

        if (!isOnline()) {
            attempt.setSyncStatus("PENDING");
            loginAttemptRepository.save(attempt);
            return;
        }

        try {
            Map<String, Object> attemptData = prepareLoginAttemptData(attempt);
            attemptData.put("source", "POSTGRESQL");
            attemptData.put("localUpdatedAt", formatDate(LocalDateTime.now()));

            if (attempt.getFirestoreId() == null) {
                attempt.setFirestoreId("attempt_" + attempt.getId());
            }

            ApiFuture<WriteResult> future = firestore
                    .collection(FIRESTORE_LOGIN_ATTEMPTS_COLLECTION)
                    .document(attempt.getFirestoreId())
                    .set(attemptData);

            WriteResult result = future.get();

            attempt.setSyncStatus("SYNCED");
            loginAttemptRepository.save(attempt);

            log.info("✅ Login attempt {} syncé PostgreSQL→Firestore", attempt.getId());

        } catch (Exception e) {
            attempt.setSyncStatus("FAILED");
            loginAttemptRepository.save(attempt);
            log.error("❌ Erreur sync login attempt {}: {}", attempt.getId(), e.getMessage());
        }
    }

    /**
     * DÉBLOQUER un utilisateur depuis le web (manager)
     */
    @Transactional
    public User unlockUserFromWeb(String email) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + email));

            log.info("🔓 Déblocage utilisateur {} depuis web", email);

            user.setIsLocked(false);
            user.setFailedLoginAttempts(0);
            user.setLastFailedLogin(null);
            user.setUpdatedAt(LocalDateTime.now());
            user.setSyncStatus("PENDING");

            userRepository.save(user);

            // Sync immédiate
            syncUserToFirestore(user);

            log.info("✅ Utilisateur {} débloqué et sync vers Firestore", email);
            return user;

        } catch (Exception e) {
            log.error("❌ Erreur déblocage utilisateur: {}", e.getMessage());
            throw new RuntimeException("Échec du déblocage", e);
        }
    }

    /**
     * FORCER la synchronisation d'un utilisateur (pour tests)
     */
    @Transactional
    public void forceSyncUser(String email) {
        try {
            log.info("🔧 Force sync pour: {}", email);

            // 1. Récupérer depuis Firestore
            var users = firestore.collection("users")
                    .whereEqualTo("email", email)
                    .get()
                    .get();

            if (users.isEmpty()) {
                log.error("❌ Utilisateur {} non trouvé dans Firestore", email);
                return;
            }

            var doc = users.getDocuments().get(0);

            // 2. Récupérer ou créer dans PostgreSQL
            Optional<User> userOpt = userRepository.findByEmail(email);
            User user;

            if (userOpt.isPresent()) {
                user = userOpt.get();
                log.info("✅ Utilisateur trouvé dans PostgreSQL");
            } else {
                user = new User();
                user.setId(UUID.randomUUID().toString());
                user.setEmail(email);
                user.setCreatedAt(LocalDateTime.now());
                log.info("🆕 Création nouvel utilisateur");
            }

            // 3. Mettre à jour TOUS les champs
            user.setFullName(doc.getString("fullName"));
            user.setPhone(doc.getString("phone"));
            user.setIsActive(doc.getBoolean("isActive") != null ? doc.getBoolean("isActive") : true);
            user.setIsLocked(doc.getBoolean("isLocked") != null ? doc.getBoolean("isLocked") : false);

            Long attempts = doc.getLong("failedLoginAttempts");
            user.setFailedLoginAttempts(attempts != null ? attempts.intValue() : 0);

            user.setLastFailedLogin(parseDate(doc.getString("lastFailedLogin")));
            user.setLastLogin(parseDate(doc.getString("lastLogin")));

            user.setFirestoreId(doc.getId());
            user.setSyncStatus("SYNCED");
            user.setUpdatedAt(LocalDateTime.now());

            // 4. Sauvegarder
            userRepository.save(user);

            log.info("✅ Force sync terminée pour: {} - fullName: {}", email, user.getFullName());

        } catch (Exception e) {
            log.error("❌ Erreur force sync: {}", e.getMessage());
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
        data.put("lastFailedLogin", formatDate(user.getLastFailedLogin()));
        data.put("lastLogin", formatDate(user.getLastLogin()));
        data.put("createdAt", formatDate(user.getCreatedAt()));
        data.put("updatedAt", formatDate(user.getUpdatedAt()));
        data.put("firestoreId", user.getFirestoreId());
        data.put("firebaseUid", user.getFirebaseUid());
        data.put("syncStatus", user.getSyncStatus() != null ? user.getSyncStatus() : "PENDING");
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
     * Parser une date depuis Firestore
     */
    private LocalDateTime parseDate(String dateString) {
        if (dateString == null || dateString.isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateString, DATE_FORMATTER);
        } catch (Exception e) {
            log.warn("⚠️ Impossible de parser la date: {}", dateString);
            return null;
        }
    }

    /**
     * Méthode de synchro automatique programmée (PostgreSQL → Firestore)
     */
    // @Scheduled(fixedDelay = 30000) // Toutes les 30 secondes
    // @Transactional
    // public void syncAllPendingItems() {
    // if (!isOnline()) {
    // log.info("⏸️ Sync automatique annulé - Firestore hors ligne");
    // return;
    // }

    // log.info("🔄 Début synchro automatique (PostgreSQL → Firestore)...");

    // // 1. Synchroniser les utilisateurs en attente
    // List<User> pendingUsers = userRepository.findBySyncStatus("PENDING");
    // log.info("📋 {} utilisateurs en attente", pendingUsers.size());

    // for (User user : pendingUsers) {
    // try {
    // syncUserToFirestore(user);
    // } catch (Exception e) {
    // log.error("❌ Erreur sync auto utilisateur {}: {}", user.getEmail(),
    // e.getMessage());
    // }
    // }

    // log.info("✅ Synchro automatique terminée");
    // }
}

package com.idp.service;

import com.idp.dto.*;
import com.idp.entity.Role;
import com.idp.entity.User;
import com.idp.entity.UserSession;
import com.idp.entity.LoginAttempt;
import com.idp.exception.*;
import com.idp.repository.RoleRepository;
import com.idp.repository.UserRepository;
import com.idp.repository.UserSessionRepository;
import com.idp.repository.LoginAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SyncService syncService;
    private final com.idp.util.EncryptionUtil encryptionUtil;

    @Value("${security.max.login.attempts:3}")
    private int maxLoginAttempts;

    // POST CONSTRUCT POUR DEBUG
    @javax.annotation.PostConstruct
    public void init() {
        log.info("🔧 Configuration sécurité chargée:");
        log.info("   - maxLoginAttempts: {}", maxLoginAttempts);
    }

    // INSCRIPTION
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException(request.getEmail());
        }

        // Récupérer le rôle USER
        Role roleUser = roleRepository.findByNom("USER")
                .orElseThrow(() -> new RuntimeException("Rôle USER non trouvé en base de données"));

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEncryptedPassword(encryptionUtil.encrypt(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(roleUser); // ← Assigner le rôle USER
        user.setFirestoreId("user_" + UUID.randomUUID().toString());
        user.setSyncStatus("PENDING");
        user.setIsActive(true);
        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);
        // Conserver le mot de passe en clair en mémoire pour la sync Firebase Auth immédiate
        savedUser.setRawPassword(request.getPassword());

        // Sync vers Firestore (POSTGRESQL → Firestore)
        try {
            syncService.syncUserToFirestore(savedUser);
            log.info("✅ Sync inscription vers Firestore pour {}", savedUser.getEmail());
        } catch (Exception e) {
            log.warn("⚠️ Sync inscription échoué: {}", e.getMessage());
        }

        // Générer tokens
        String token = jwtService.generateToken(savedUser.getId());
        String refreshToken = jwtService.generateRefreshToken(savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(savedUser)
                .build();
    }

    // CONNEXION WEB UNIQUEMENT
    @Transactional(noRollbackFor = RuntimeException.class)
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase();
        log.info("🔐 Connexion WEB pour: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    // Log l'échec dans PostgreSQL
                    createLoginAttemptInPostgres(null, email, false, ipAddress, userAgent, "Utilisateur non trouvé");
                    throw new UserNotFoundException(email);
                });

        log.info("👤 Utilisateur trouvé: {}, locked={}, failedAttempts={}",
                user.getEmail(), user.getIsLocked(), user.getFailedLoginAttempts());

        // VÉRIFIER BLOCAGE dans PostgreSQL
        if (user.getIsLocked() != null && user.getIsLocked()) {
            log.warn("🔒 Compte verrouillé dans PostgreSQL pour {}", user.getEmail());

            if (user.getLastFailedLogin() != null) {
                LocalDateTime lockUntil = user.getLastFailedLogin().plusMinutes(30); // 30 min par défaut
                LocalDateTime now = LocalDateTime.now();

                if (now.isBefore(lockUntil)) {
                    long minutesRemaining = Duration.between(now, lockUntil).toMinutes();
                    log.warn("⏳ Compte toujours bloqué - expire dans {} minutes", minutesRemaining);

                    // Log l'échec
                    createLoginAttemptInPostgres(user, email, false, ipAddress, userAgent, "Compte bloqué");
                    throw new AccountLockedException(minutesRemaining);
                } else {
                    log.info("✅ Déblocage automatique - période expirée");
                    user.setIsLocked(false);
                    user.setFailedLoginAttempts(0);
                    user.setSyncStatus("PENDING");
                    userRepository.save(user);

                    // Sync le déblocage vers Firestore
                    syncService.syncUserToFirestore(user);
                }
            }
        }

        // Vérifier mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("❌ Mot de passe incorrect pour {}", user.getEmail());

            // Mettre à jour le compteur dans PostgreSQL
            handleFailedLoginInPostgres(user);

            // Log l'échec
            createLoginAttemptInPostgres(user, email, false, ipAddress, userAgent, "Mot de passe incorrect");

            throw new InvalidPasswordException();
        }

        // Vérifier compte actif
        if (user.getIsActive() != null && !user.getIsActive()) {
            log.warn("❌ Compte désactivé: {}", user.getEmail());
            createLoginAttemptInPostgres(user, email, false, ipAddress, userAgent, "Compte désactivé");
            throw new AccountDisabledException(user.getEmail());
        }

        // RÉINITIALISER TENTATIVES - SUCCÈS
        log.info("✅ Connexion WEB réussie pour {}", user.getEmail());
        user.setFailedLoginAttempts(0);
        user.setLastLogin(LocalDateTime.now());
        user.setSyncStatus("PENDING");
        userRepository.save(user);

        // Créer session dans PostgreSQL
        String token = jwtService.generateToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        createSessionInPostgres(user, token, refreshToken, ipAddress, userAgent);

        // Log la connexion réussie
        createLoginAttemptInPostgres(user, email, true, ipAddress, userAgent, null);

        // Sync utilisateur vers Firestore (POSTGRESQL → Firestore)
        syncService.syncUserToFirestore(user);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(user)
                .build();
    }

    /**
     * Gérer échec de connexion dans PostgreSQL (pour web)
     */
    private void handleFailedLoginInPostgres(User user) {
        log.info("🔄 handleFailedLoginInPostgres() pour {}", user.getEmail());

        int currentAttempts = user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0;
        int newAttempts = currentAttempts + 1;

        user.setFailedLoginAttempts(newAttempts);
        user.setLastFailedLogin(LocalDateTime.now());
        user.setSyncStatus("PENDING");

        // BLOQUER SI ATTEINT LA LIMITE
        if (newAttempts >= maxLoginAttempts) {
            user.setIsLocked(true);
            log.warn("🚨 Compte verrouillé dans PostgreSQL: {} après {} tentatives",
                    user.getEmail(), newAttempts);
        }

        User savedUser = userRepository.save(user);

        // Sync vers Firestore (POSTGRESQL → Firestore)
        try {
            syncService.syncUserToFirestore(savedUser);
            log.info("✅ Sync échec connexion vers Firestore pour {}", user.getEmail());
        } catch (Exception e) {
            log.warn("⚠️ Sync échec connexion échoué: {}", e.getMessage());
        }
    }

    /**
     * Créer session dans PostgreSQL (pour web)
     */
    private void createSessionInPostgres(User user, String token, String refreshToken,
            String ipAddress, String userAgent) {
        UserSession session = new UserSession();
        session.setId(UUID.randomUUID().toString());
        session.setUser(user);
        session.setSessionToken(token);
        session.setRefreshToken(refreshToken);
        session.setIpAddress(ipAddress);
        session.setDeviceInfo(userAgent);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(60)); // 1 heure
        session.setFirestoreId("session_" + UUID.randomUUID().toString());
        session.setSyncStatus("PENDING");
        session.setIsValid(true);

        UserSession savedSession = sessionRepository.save(session);

        // Sync session vers Firestore (POSTGRESQL → Firestore)
        try {
            syncService.syncSessionToFirestore(savedSession);
        } catch (Exception e) {
            log.warn("⚠️ Sync session échoué: {}", e.getMessage());
        }
    }

    /**
     * Créer login attempt dans PostgreSQL (pour web)
     */
    private void createLoginAttemptInPostgres(User user, String email, boolean success,
            String ipAddress, String userAgent, String failureReason) {

        log.info("📝 Création LoginAttempt dans PostgreSQL pour: {}, success={}", email, success);

        LoginAttempt attempt = new LoginAttempt();
        attempt.setId(UUID.randomUUID().toString());
        attempt.setUser(user);
        attempt.setEmail(email);
        attempt.setIpAddress(ipAddress);
        attempt.setUserAgent(userAgent);
        attempt.setSuccess(success);
        attempt.setFailureReason(failureReason);
        attempt.setFirestoreId("attempt_" + UUID.randomUUID().toString());
        attempt.setSyncStatus("PENDING");
        attempt.setAttemptedAt(LocalDateTime.now());

        try {
            LoginAttempt savedAttempt = loginAttemptRepository.save(attempt);
            log.info("✅ LoginAttempt sauvegardé dans PostgreSQL: id={}", savedAttempt.getId());

            // Sync vers Firestore (POSTGRESQL → Firestore)
            syncService.syncLoginAttemptToFirestore(savedAttempt);

        } catch (Exception e) {
            log.error("❌ ERREUR sauvegarde LoginAttempt: {}", e.getMessage());
        }
    }

    // DÉBLOQUER COMPTE depuis web (MAINTENANT DANS SYNC SERVICE)
    @Transactional
    public void unlockAccount(String email) {
        // DÉPLACÉ DANS SYNC SERVICE POUR SYNC IMMÉDIATE
        // Garder pour compatibilité
        syncService.unlockUserFromWeb(email);
    }

    // DÉCONNEXION
    @Transactional
    public void logout(String jwtToken) {
        String userId = jwtService.extractUserId(jwtToken);

        // Invalider toutes les sessions de l'utilisateur
        sessionRepository.findByUserId(userId).forEach(session -> {
            session.setIsValid(false);
            session.setSyncStatus("PENDING");
            UserSession updatedSession = sessionRepository.save(session);

            // Sync session invalidée vers Firestore
            try {
                syncService.syncSessionToFirestore(updatedSession);
            } catch (Exception e) {
                log.warn("⚠️ Sync session (logout) échoué: {}", e.getMessage());
            }
        });
    }

    // MODIFIER PROFIL
    @Transactional
    public User updateProfile(String jwtToken, UpdateProfileRequest request) {
        String userId = jwtService.extractUserId(jwtToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("ID: " + userId));

        // Mettre à jour les champs
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        // Changer mot de passe si demandé
        if (request.getCurrentPassword() != null && request.getNewPassword() != null) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new InvalidPasswordException();
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            // Stocker le nouveau mot de passe chiffré pour la sync Firebase Auth
            user.setEncryptedPassword(encryptionUtil.encrypt(request.getNewPassword()));
            user.setRawPassword(request.getNewPassword());
        }

        user.setSyncStatus("PENDING");
        User updatedUser = userRepository.save(user);

        // Sync vers Firestore
        try {
            syncService.syncUserToFirestore(updatedUser);
        } catch (Exception e) {
            log.warn("⚠️ Sync mise à jour profil échoué: {}", e.getMessage());
        }

        return updatedUser;
    }

    // MON PROFIL
    public User getProfile(String jwtToken) {
        String userId = jwtService.extractUserId(jwtToken);
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("ID: " + userId));
    }

    // RAFRAÎCHIR TOKEN
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new InvalidTokenException("Refresh token invalide ou expiré");
        }

        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("ID: " + userId));

        // Générer nouveaux tokens
        String newToken = jwtService.generateToken(userId);
        String newRefreshToken = jwtService.generateRefreshToken(userId);

        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .user(user)
                .build();
    }
}
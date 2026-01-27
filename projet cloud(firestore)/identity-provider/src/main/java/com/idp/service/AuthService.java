
package com.idp.service;

import com.idp.dto.*;
import com.idp.entity.Role;
import com.idp.entity.User;
import com.idp.entity.UserSession;
import com.idp.entity.LoginAttempt;
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

    @Value("${security.max.login.attempts:3}")
    private int maxLoginAttempts;

    @Value("${security.lockout.duration.minutes:30}")
    private int lockoutDurationMinutes;

    @Value("${security.session.duration.minutes:60}")
    private int sessionDurationMinutes;

    // POST CONSTRUCT POUR DEBUG
    @javax.annotation.PostConstruct
    public void init() {
        log.info("🔧 Configuration sécurité chargée:");
        log.info("   - maxLoginAttempts: {}", maxLoginAttempts);
        log.info("   - lockoutDurationMinutes: {}", lockoutDurationMinutes);
        log.info("   - sessionDurationMinutes: {}", sessionDurationMinutes);
    }

    // INSCRIPTION
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setFirestoreId(UUID.randomUUID().toString());
        user.setSyncStatus("PENDING");
        user.setIsActive(true);
        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);

        // Assign USER role
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setName("USER");
                    return roleRepository.save(newRole);
                });
        user.getRoles().add(userRole);

        User savedUser = userRepository.save(user);

        // Sync Firestore
        try {
            syncService.syncUserToFirestore(savedUser);
            log.info("✅ Sync utilisateur {} réussi immédiatement", savedUser.getEmail());
        } catch (Exception e) {
            log.warn("⚠️ Sync immédiat échoué pour {}: {}", savedUser.getEmail(), e.getMessage());
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

    // CONNEXION - VERSION DEBUG
    @Transactional(noRollbackFor = RuntimeException.class)
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase();
        log.info("🔐 Tentative connexion pour: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logLoginAttempt(null, email, false, ipAddress, userAgent, "Utilisateur non trouvé");
                    return new RuntimeException("Identifiants invalides");
                });

        log.info("👤 Utilisateur trouvé: {}, locked={}, failedAttempts={}",
                user.getEmail(), user.getIsLocked(), user.getFailedLoginAttempts());

        // VÉRIFIER BLOCAGE - DEBUG DÉTAILLÉ
        if (user.getIsLocked() != null && user.getIsLocked()) {
            log.warn("🔒 Compte LOCKED détecté pour {}", user.getEmail());

            if (user.getLastFailedLogin() != null) {
                LocalDateTime lockUntil = user.getLastFailedLogin().plusMinutes(lockoutDurationMinutes);
                LocalDateTime now = LocalDateTime.now();

                log.info("📅 Vérification déblocage: lastFailedLogin={}, lockUntil={}, now={}, isBefore={}",
                        user.getLastFailedLogin(), lockUntil, now, now.isBefore(lockUntil));

                if (now.isBefore(lockUntil)) {
                    log.warn("⏳ Compte toujours bloqué - expires in {} minutes",
                            java.time.Duration.between(now, lockUntil).toMinutes());
                    logLoginAttempt(user, email, false, ipAddress, userAgent, "Compte bloqué");
                    throw new RuntimeException("Compte bloqué. Réessayez plus tard.");
                } else {
                    log.info("✅ Déblocage automatique - période de blocage expirée");
                    user.setIsLocked(false);
                    user.setFailedLoginAttempts(0);
                }
            } else {
                log.info("⚠️ Compte locked mais pas de lastFailedLogin - déblocage");
                user.setIsLocked(false);
                user.setFailedLoginAttempts(0);
            }
        }

        // Vérifier mot de passe
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("❌ Mot de passe incorrect pour {}", user.getEmail());
            handleFailedLogin(user);
            logLoginAttempt(user, email, false, ipAddress, userAgent, "Mot de passe incorrect");
            throw new RuntimeException("Identifiants invalides");
        }

        // Vérifier compte actif
        if (user.getIsActive() != null && !user.getIsActive()) {
            log.warn("❌ Compte désactivé: {}", user.getEmail());
            logLoginAttempt(user, email, false, ipAddress, userAgent, "Compte désactivé");
            throw new RuntimeException("Compte désactivé");
        }

        // RÉINITIALISER TENTATIVES - SUCCÈS
        log.info("✅ Connexion réussie pour {}", user.getEmail());
        user.setFailedLoginAttempts(0);
        user.setLastLogin(LocalDateTime.now());
        user.setSyncStatus("PENDING");
        userRepository.save(user);

        // Créer session
        String token = jwtService.generateToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        createSession(user, token, refreshToken, ipAddress, userAgent);

        // Log de connexion réussie
        logLoginAttempt(user, email, true, ipAddress, userAgent, null);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(user)
                .build();
    }

    // HANDLE FAILED LOGIN - VERSION DEBUG
    private void handleFailedLogin(User user) {
        log.info("🔄 handleFailedLogin() appelé pour {}", user.getEmail());

        // Récupérer le compteur actuel
        int currentAttempts = user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0;
        int newAttempts = currentAttempts + 1;

        log.info("📊 État avant: attempts={}, locked={}", currentAttempts, user.getIsLocked());
        log.info("📊 Après incrément: attempts={}, max={}", newAttempts, maxLoginAttempts);

        user.setFailedLoginAttempts(newAttempts);
        user.setLastFailedLogin(LocalDateTime.now());
        user.setSyncStatus("PENDING");

        // BLOQUER SI ATTEINT LA LIMITE
        if (newAttempts >= maxLoginAttempts) {
            user.setIsLocked(true);
            log.warn("🚨🚨🚨 COMPTE BLOQUÉ: {} après {} tentatives échouées (max={})",
                    user.getEmail(), newAttempts, maxLoginAttempts);
        } else {
            log.info("⚠️ Tentative {} sur {} - pas encore bloqué", newAttempts, maxLoginAttempts);
        }

        log.info("📋 État après: attempts={}, locked={}",
                user.getFailedLoginAttempts(), user.getIsLocked());

        User savedUser = userRepository.save(user);

        // Sync immédiate
        try {
            syncService.syncUserToFirestore(savedUser);
            log.info("✅ Sync échec connexion pour {}", user.getEmail());
        } catch (Exception e) {
            log.warn("⚠️ Sync échec connexion échoué: {}", e.getMessage());
        }
    }

    private void createSession(User user, String token, String refreshToken,
            String ipAddress, String userAgent) {
        UserSession session = new UserSession();
        session.setId(UUID.randomUUID().toString());
        session.setUser(user);
        session.setSessionToken(token);
        session.setRefreshToken(refreshToken);
        session.setIpAddress(ipAddress);
        session.setDeviceInfo(userAgent);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(sessionDurationMinutes));
        session.setFirestoreId(UUID.randomUUID().toString());
        session.setSyncStatus("PENDING");
        session.setIsValid(true);

        UserSession savedSession = sessionRepository.save(session);

        // Sync session
        try {
            syncService.syncSessionToFirestore(savedSession);
        } catch (Exception e) {
            log.warn("⚠️ Sync session échoué: {}", e.getMessage());
        }
    }

    private void logLoginAttempt(User user, String email, boolean success,
            String ipAddress, String userAgent, String failureReason) {

        log.info("📝 Création LoginAttempt pour: {}, success={}", email, success);

        LoginAttempt attempt = new LoginAttempt();
        attempt.setId(UUID.randomUUID().toString());
        attempt.setUser(user);
        attempt.setEmail(email);
        attempt.setIpAddress(ipAddress);
        attempt.setUserAgent(userAgent);
        attempt.setSuccess(success);
        attempt.setFailureReason(failureReason);
        attempt.setFirestoreId(UUID.randomUUID().toString());
        attempt.setSyncStatus("PENDING");
        attempt.setAttemptedAt(LocalDateTime.now());

        log.info("📦 LoginAttempt créé: id={}, email={}", attempt.getId(), attempt.getEmail());

        try {
            LoginAttempt savedAttempt = loginAttemptRepository.save(attempt);
            log.info("✅ LoginAttempt sauvegardé dans PostgreSQL: id={}", savedAttempt.getId());
        } catch (Exception e) {
            log.error("❌ ERREUR sauvegarde LoginAttempt: {}", e.getMessage());
            log.error("Stack trace:", e);
            return; // Ne pas continuer si échec de sauvegarde
        }

        // Sync login attempt
        try {
            syncService.syncLoginAttemptToFirestore(attempt);
        } catch (Exception e) {
            log.warn("⚠️ Sync login attempt échoué: {}", e.getMessage());
        }
    }

    // DÉBLOQUER COMPTE
    @Transactional
    public void unlockAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        log.info("🔓 Déblocage manuel pour {}", email);
        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);
        user.setSyncStatus("PENDING");
        User updatedUser = userRepository.save(user);

        // Sync
        try {
            syncService.syncUserToFirestore(updatedUser);
        } catch (Exception e) {
            log.warn("⚠️ Sync déblocage compte échoué: {}", e.getMessage());
        }
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

            // Sync session invalidée
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
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

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
                throw new RuntimeException("Mot de passe actuel incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        user.setSyncStatus("PENDING");
        User updatedUser = userRepository.save(user);

        // Sync
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
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // RAFRAÎCHIR TOKEN
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new RuntimeException("Refresh token invalide");
        }

        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

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
package com.idp.service;

import com.idp.config.IdpProperties;
import com.idp.dto.AuthRequest;
import com.idp.dto.AuthResponse;
import com.idp.dto.RegisterRequest;
import com.idp.model.User;
import com.idp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private NetworkService networkService;

    @Autowired
    private FirebaseAuthService firebaseAuthService;

    @Autowired
    private FirebaseAdminService firebaseAdminService;

    @Autowired
    private LocalAuthService localAuthService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IdpProperties idpProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        System.out.println("======= REGISTER START =======");
        System.out.println("Email: " + request.getEmail());
        System.out.println("FullName: " + request.getFullName());
        System.out.println("Password length: " + (request.getPassword() != null ? request.getPassword().length() : 0));

        String email = request.getEmail();

        // Vérifier si l'utilisateur existe déjà
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            System.out.println("ERROR: User already exists with email: " + email);
            throw new RuntimeException("User with this email already exists");
        }

        boolean internetAvailable = networkService.isInternetAvailable();
        boolean firebaseEnabled = idpProperties.isEnableFirebase();

        System.out.println("Internet available: " + internetAvailable);
        System.out.println("Firebase enabled: " + firebaseEnabled);

        if (internetAvailable && firebaseEnabled) {
            System.out.println("Using FIREBASE registration with Admin SDK");
            try {
                // Firebase REST API registration
                Map<String, Object> firebaseResponse = firebaseAuthService.signUp(
                        request.getEmail(),
                        request.getPassword());

                String firebaseUid = (String) firebaseResponse.get("localId");
                String idToken = (String) firebaseResponse.get("idToken");
                String refreshToken = (String) firebaseResponse.get("refreshToken");

                System.out.println("Firebase REST API registration successful!");
                System.out.println("Firebase UID: " + firebaseUid);
                System.out.println("ID Token: "
                        + (idToken != null ? idToken.substring(0, Math.min(20, idToken.length())) + "..." : "null"));

                // ============ FIREBASE ADMIN SDK INTEGRATION ============
                // 1. Sauvegarder l'utilisateur localement avec Firebase UID
                User user = new User();
                user.setEmail(request.getEmail());
                user.setFirebaseUid(firebaseUid);
                user.setFullName(request.getFullName());
                user.setEnabled(true);
                userRepository.save(user);

                System.out.println("User saved locally with ID: " + user.getId());

                // 2. Mettre à jour le display name dans Firebase via Admin SDK
                if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
                    try {
                        System.out.println("Setting display name in Firebase via Admin SDK...");
                        firebaseAdminService.updateUserDisplayName(firebaseUid, request.getFullName());
                        System.out.println("✓ Display name set successfully in Firebase");
                    } catch (Exception e) {
                        System.err.println("✗ Failed to set display name in Firebase: " + e.getMessage());
                        System.err.println("User created, but display name not set in Firebase");
                        // Continuer même si l'update du display name échoue
                    }
                }
                // ============ END FIREBASE ADMIN SDK ============

                AuthResponse response = new AuthResponse();
                response.setToken(idToken);
                response.setRefreshToken(refreshToken);
                response.setUserId(firebaseUid);
                response.setEmail(request.getEmail());
                response.setExpiresIn(idpProperties.getSessionTimeoutMinutes() * 60);
                response.setFirebaseAuth(true);
                response.setIssuedAt(System.currentTimeMillis());

                System.out.println("======= REGISTER SUCCESS (Firebase + Admin SDK) =======");
                return response;

            } catch (Exception e) {
                System.out.println("Firebase registration FAILED: " + e.getMessage());
                System.out.println("Falling back to LOCAL registration");
                e.printStackTrace();

                // Fallback to local registration
                return registerLocally(request);
            }
        } else {
            System.out.println("Using LOCAL registration (Firebase not available or disabled)");
            return registerLocally(request);
        }
    }

    private AuthResponse registerLocally(RegisterRequest request) {
        System.out.println("Creating LOCAL user...");

        User user = localAuthService.registerUser(
                request.getEmail(),
                request.getPassword(),
                request.getFullName());

        System.out.println("Local user created with ID: " + user.getId());

        String token = generateLocalToken(user.getId());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId().toString());
        response.setEmail(user.getEmail());
        response.setExpiresIn(idpProperties.getSessionTimeoutMinutes() * 60);
        response.setFirebaseAuth(false);
        response.setIssuedAt(System.currentTimeMillis());

        System.out.println("======= REGISTER SUCCESS (Local) =======");
        return response;
    }

    @Transactional
    public AuthResponse authenticate(AuthRequest request) {
        System.out.println("======= LOGIN START =======");
        System.out.println("Email: " + request.getEmail());

        String email = request.getEmail();

        // Check if user exists
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user = userOpt.orElse(null);

        if (user != null) {
            System.out.println("User found in DB: ID=" + user.getId() + ", Locked=" + user.isLocked());
            if (user.isLocked()) {
                System.out.println("ERROR: Account is locked!");
                throw new RuntimeException("Account is locked due to too many failed attempts");
            }
        } else {
            System.out.println("User not found in local DB");
        }

        boolean internetAvailable = networkService.isInternetAvailable();
        boolean firebaseEnabled = idpProperties.isEnableFirebase();

        System.out.println("Internet available: " + internetAvailable);
        System.out.println("Firebase enabled: " + firebaseEnabled);

        if (internetAvailable && firebaseEnabled) {
            System.out.println("Using FIREBASE authentication with Admin SDK sync");
            try {
                // Firebase REST API authentication
                Map<String, Object> firebaseResponse = firebaseAuthService.signIn(
                        request.getEmail(),
                        request.getPassword());

                String firebaseUid = (String) firebaseResponse.get("localId");
                String idToken = (String) firebaseResponse.get("idToken");
                String refreshToken = (String) firebaseResponse.get("refreshToken");

                System.out.println("Firebase REST API authentication successful!");
                System.out.println("Firebase UID: " + firebaseUid);

                // ============ FIREBASE ADMIN SDK SYNC ============
                // Update or create local user with Admin SDK sync
                if (user != null) {
                    user.setLoginAttempts(0);
                    user.setLocked(false);
                    user.setLastLogin(LocalDateTime.now());

                    // Synchroniser les données Firebase avec Admin SDK
                    try {
                        System.out.println("Syncing data from Firebase via Admin SDK...");
                        var firebaseUser = firebaseAdminService.getUserByUid(firebaseUid);

                        // Mettre à jour le display name local si différent de Firebase
                        String firebaseDisplayName = firebaseUser.getDisplayName();
                        if (firebaseDisplayName != null &&
                                !firebaseDisplayName.equals(user.getFullName())) {
                            System.out.println("Updating local display name from Firebase: " + firebaseDisplayName);
                            user.setFullName(firebaseDisplayName);
                        }

                        // Mettre à jour l'email local si différent de Firebase
                        String firebaseEmail = firebaseUser.getEmail();
                        if (!firebaseEmail.equals(user.getEmail())) {
                            System.out.println("Updating local email from Firebase: " + firebaseEmail);
                            user.setEmail(firebaseEmail);
                        }

                        System.out.println("✓ Firebase sync completed successfully");
                    } catch (Exception e) {
                        System.err.println("✗ Could not sync from Firebase Admin SDK: " + e.getMessage());
                        // Continuer même si la sync échoue
                    }

                    // Assurer que firebaseUid est à jour
                    if (user.getFirebaseUid() == null) {
                        user.setFirebaseUid(firebaseUid);
                    }

                    userRepository.save(user);
                    System.out.println("Updated existing local user with Firebase sync");
                } else {
                    // Create new local user with data from Firebase Admin SDK
                    user = new User();
                    user.setEmail(request.getEmail());
                    user.setFirebaseUid(firebaseUid);

                    // Récupérer les infos depuis Firebase Admin SDK
                    try {
                        var firebaseUser = firebaseAdminService.getUserByUid(firebaseUid);
                        if (firebaseUser.getDisplayName() != null) {
                            user.setFullName(firebaseUser.getDisplayName());
                            System.out.println(
                                    "Set display name from Firebase Admin SDK: " + firebaseUser.getDisplayName());
                        }
                    } catch (Exception e) {
                        System.err.println("Could not get user info from Firebase Admin SDK: " + e.getMessage());
                    }

                    user.setLastLogin(LocalDateTime.now());
                    userRepository.save(user);
                    System.out.println("Created new local user with Firebase Admin SDK data");
                }
                // ============ END FIREBASE ADMIN SDK SYNC ============

                AuthResponse response = new AuthResponse();
                response.setToken(idToken);
                response.setRefreshToken(refreshToken);
                response.setUserId(firebaseUid);
                response.setEmail(request.getEmail());
                response.setExpiresIn(idpProperties.getSessionTimeoutMinutes() * 60);
                response.setFirebaseAuth(true);
                response.setIssuedAt(System.currentTimeMillis());

                System.out.println("======= LOGIN SUCCESS (Firebase with Admin SDK) =======");
                return response;

            } catch (Exception e) {
                System.out.println("Firebase authentication FAILED: " + e.getMessage());

                // Handle failed login attempts
                if (user != null) {
                    user.setLoginAttempts(user.getLoginAttempts() + 1);
                    System.out.println(
                            "Login attempts: " + user.getLoginAttempts() + "/" + idpProperties.getMaxLoginAttempts());

                    if (user.getLoginAttempts() >= idpProperties.getMaxLoginAttempts()) {
                        user.setLocked(true);
                        System.out.println("Account LOCKED!");

                        // ============ FIREBASE ADMIN SDK LOCK ============
                        // Désactiver aussi dans Firebase via Admin SDK
                        if (user.getFirebaseUid() != null) {
                            try {
                                System.out.println("Disabling Firebase account via Admin SDK...");
                                firebaseAdminService.disableUser(user.getFirebaseUid());
                                System.out.println("✓ Firebase account also disabled");
                            } catch (Exception ex) {
                                System.err.println(
                                        "✗ Failed to disable Firebase account via Admin SDK: " + ex.getMessage());
                            }
                        }
                        // ============ END FIREBASE ADMIN SDK LOCK ============
                    }
                    userRepository.save(user);
                }

                throw new RuntimeException("Authentication failed: " + e.getMessage());
            }
        } else {
            System.out.println("Using LOCAL authentication");

            Optional<User> localUserOpt = localAuthService.authenticateUser(email, request.getPassword());

            if (localUserOpt.isEmpty()) {
                System.out.println("Local authentication FAILED - Invalid credentials");

                if (user != null) {
                    user.setLoginAttempts(user.getLoginAttempts() + 1);
                    System.out.println(
                            "Login attempts: " + user.getLoginAttempts() + "/" + idpProperties.getMaxLoginAttempts());

                    if (user.getLoginAttempts() >= idpProperties.getMaxLoginAttempts()) {
                        user.setLocked(true);
                        System.out.println("Account LOCKED!");
                    }
                    userRepository.save(user);
                }

                throw new RuntimeException("Invalid credentials");
            }

            User localUser = localUserOpt.get();
            System.out.println("Local authentication successful for user ID: " + localUser.getId());

            if (localUser.isLocked()) {
                System.out.println("ERROR: Account is locked!");
                throw new RuntimeException("Account is locked due to too many failed attempts");
            }

            localUser.setLoginAttempts(0);
            localUser.setLastLogin(LocalDateTime.now());
            userRepository.save(localUser);

            String token = generateLocalToken(localUser.getId());

            AuthResponse response = new AuthResponse();
            response.setToken(token);
            response.setUserId(localUser.getId().toString());
            response.setEmail(localUser.getEmail());
            response.setExpiresIn(idpProperties.getSessionTimeoutMinutes() * 60);
            response.setFirebaseAuth(false);
            response.setIssuedAt(System.currentTimeMillis());

            System.out.println("======= LOGIN SUCCESS (Local) =======");
            return response;
        }
    }

    private String generateLocalToken(Long userId) {
        String token = "local-token-" + userId + "-" + UUID.randomUUID() + "-" + System.currentTimeMillis();
        System.out.println("Generated local token: " + token);
        return token;
    }

    @Transactional(readOnly = true)
    public boolean isUserLocked(String email) {
        return userRepository.findByEmail(email)
                .map(User::isLocked)
                .orElse(false);
    }

    @Transactional
    public void resetUserLock(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLoginAttempts(0);
            user.setLocked(false);
            userRepository.save(user);
            System.out.println("Reset lock for user: " + email);
        });
    }
}
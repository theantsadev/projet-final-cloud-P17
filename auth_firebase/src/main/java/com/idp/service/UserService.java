package com.idp.service;

import com.google.firebase.auth.FirebaseAuthException;
import com.idp.dto.UpdateUserRequest;
import com.idp.model.User;
import com.idp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private NetworkService networkService;

    @Autowired
    private FirebaseAdminService firebaseAdminService;

    @Autowired
    private LocalAuthService localAuthService;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User updateUser(Long userId, UpdateUserRequest request) {
        System.out.println("USER SERVICE: Updating user ID: " + userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update locally first
        User updatedUser = localAuthService.updateUser(
                userId,
                request.getEmail(),
                request.getFullName());

        // ============ NOUVEAU CODE ============
        // Update Firebase if user has Firebase UID
        if (user.getFirebaseUid() != null && networkService.isInternetAvailable()) {
            System.out.println("Attempting Firebase update for UID: " + user.getFirebaseUid());

            try {
                firebaseAdminService.updateUser(
                        user.getFirebaseUid(),
                        request.getEmail(),
                        request.getFullName());
                System.out.println("Firebase updated successfully!");
            } catch (Exception e) {
                System.err.println("ERROR updating Firebase: " + e.getMessage());
                // Continuer avec la mise à jour locale seulement
            }
        }
        // ============ FIN NOUVEAU CODE ============

        return updatedUser;
    }
    @Transactional
    public void unblockUser1(String email) {
        System.out.println("Unblocking user: " + email);

        userRepository.findByEmail(email).ifPresent(user -> {
            // Update locally
            localAuthService.unlockUser(email);

            // Update Firebase if applicable
            if (user.getFirebaseUid() != null && networkService.isInternetAvailable()) {
                try {
                    firebaseAdminService.enableUser(user.getFirebaseUid());
                    System.out.println("Firebase user enabled: " + user.getFirebaseUid());
                } catch (Exception e) {
                    System.err.println("Failed to enable Firebase user: " + e.getMessage());
                }
            }
        });
    }

    @Transactional
    public void blockUser1(String email) {
        System.out.println("Blocking user: " + email);

        userRepository.findByEmail(email).ifPresent(user -> {
            // Update locally
            localAuthService.lockUser(email);

            // Update Firebase if applicable
            if (user.getFirebaseUid() != null && networkService.isInternetAvailable()) {
                try {
                    firebaseAdminService.disableUser(user.getFirebaseUid());
                    System.out.println("Firebase user disabled: " + user.getFirebaseUid());
                } catch (Exception e) {
                    System.err.println("Failed to disable Firebase user: " + e.getMessage());
                }
            }
        });
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public void unblockUser(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Update locally
            localAuthService.unlockUser(email);

            // Update Firebase if applicable
            if (user.getFirebaseUid() != null && networkService.isInternetAvailable()) {
                try {
                    firebaseAdminService.enableUser(user.getFirebaseUid());
                    System.out.println("Firebase user enabled");
                } catch (Exception e) {
                    System.err.println("Failed to enable Firebase user");
                }
            }
        });
    }

    @Transactional
    public void blockUser(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Update locally
            localAuthService.lockUser(email);

            // Update Firebase if applicable
            if (user.getFirebaseUid() != null && networkService.isInternetAvailable()) {
                try {
                    firebaseAdminService.disableUser(user.getFirebaseUid());
                    System.out.println("Firebase user disabled");
                } catch (Exception e) {
                    System.err.println("Failed to disable Firebase user");
                }
            }
        });
    }
}
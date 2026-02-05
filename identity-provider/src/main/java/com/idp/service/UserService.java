package com.idp.service;

import com.idp.entity.Signalement;
import com.idp.entity.User;
import com.idp.exception.BusinessException;
import com.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.idp.service.SyncService;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final com.idp.repository.RoleRepository roleRepository;
    private final SyncService syncService;
    private final PasswordEncoder passwordEncoder;

    public User createManagerIfNotExists() {
        String email = "manager@gmail.com";
        String password = "manager123";

        log.info("Vérification de l'existence du gestionnaire avec l'email: {}", email);
        return userRepository.findByEmail(email).orElseGet(() -> {
            log.info("Gestionnaire non trouvé. Création d'un nouvel utilisateur gestionnaire.");

            var role = roleRepository.findByNom("MANAGER")
                    .orElseThrow(() -> new BusinessException("ROLE_NOT_FOUND", "Rôle MANAGER non trouvé"));

            User manager = User.builder()
                    .id(UUID.randomUUID().toString())
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .fullName("Manager")
                    .role(role)
                    .isActive(true)
                    .isLocked(false)
                    .failedLoginAttempts(0)
                    .syncStatus("PENDING")
                    .firestoreId("user_manager_" + UUID.randomUUID().toString())
                    .build();

            User savedManager = userRepository.save(manager);
            log.info("✅ Gestionnaire créé avec succès: {} (email: {})", savedManager.getId(), email);
            return savedManager;
        });
    }

    /**
     * Récupérer tous les utilisateurs bloqués
     */
    public List<User> getLockedUsers() {
        log.info("Récupération de tous les utilisateurs bloqués");
        return userRepository.findByIsLockedTrue();
    }

    public List<User> getUsers() {
        log.info("Récupération de tous les utilisateurs");
        return userRepository.findAll();
    }

    /**
     * Débloquer un utilisateur
     */
    @Transactional
    public User unlockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(
                        () -> new BusinessException("USER_NOT_FOUND", "Utilisateur non trouvé avec l'ID: " + userId));

        if (!user.getIsLocked()) {
            log.warn("L'utilisateur {} n'est pas bloqué", userId);
            throw new BusinessException("USER_NOT_LOCKED", "Cet utilisateur n'est pas bloqué");
        }

        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);

        User unlockedUser = userRepository.save(user);
        log.info("✅ Utilisateur {} débloqué avec succès", userId);

        return unlockedUser;
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(
                        () -> new BusinessException("USER_NOT_FOUND", "Utilisateur non trouvé avec l'ID: " + userId));
    }

    /**
     * Vérifier si l'utilisateur courant est le même que l'ID fourni
     * (utile pour la vérification d'autorisation dans @PreAuthorize)
     */
    public boolean isCurrentUser(String userId) {
        // À implémenter selon votre contexte de sécurité
        return true;
    }

    /**
     * Mettre à jour le rôle d'un utilisateur
     */
    @Transactional
    public User updateUserRole(User user, String newRoleName) {
        log.info("Mise à jour du rôle de l'utilisateur {} avec le nouveau rôle: {}", user.getId(), newRoleName);

        // Récupérer le rôle depuis la base de données
        var newRole = roleRepository.findByNom(newRoleName.toUpperCase())
                .orElseThrow(() -> new BusinessException("ROLE_NOT_FOUND", "Rôle non trouvé: " + newRoleName));

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        log.info("✅ Rôle de l'utilisateur {} mis à jour en {}", user.getId(), newRoleName);
        return updatedUser;
    }

    @Transactional
    public void synchronizeAllPending() {
        List<User> pendingUsers = userRepository.findBySyncStatus("PENDING");

        for (User user : pendingUsers) {
            if (!user.getRole().getNom().equals("MANAGER")) {
                try {
                    syncService.syncUserToFirestore(user);
                } catch (Exception e) {
                    log.error("Erreur lors de la synchronisation de l'utilisateur {}", user.getId(), e);
                }
            }

        }
    }
}

package com.idp.service;

import com.idp.entity.User;
import com.idp.exception.BusinessException;
import com.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Récupérer tous les utilisateurs bloqués
     */
    public List<User> getLockedUsers() {
        log.info("Récupération de tous les utilisateurs bloqués");
        return userRepository.findByIsLockedTrue();
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
}

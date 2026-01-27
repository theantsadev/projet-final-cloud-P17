package com.idp.service;

import com.idp.entity.Role;
import com.idp.entity.User;
import com.idp.repository.RoleRepository;
import com.idp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SyncService syncService;

    /**
     * Get all locked users
     */
    public List<User> getLockedUsers() {
        return userRepository.findByIsLockedTrue();
    }

    /**
     * Unlock a user by email
     */
    @Transactional
    public void unlockUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);

        // Sync to Firestore if available
        if (syncService.isOnline()) {
            syncService.syncUserToFirestore(savedUser);
        }
    }

    /**
     * Update user information
     */
    @Transactional
    public User updateUser(String userId, Map<String, Object> updates) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Update basic fields
        if (updates.containsKey("fullName")) {
            user.setFullName((String) updates.get("fullName"));
        }
        if (updates.containsKey("phone")) {
            user.setPhone((String) updates.get("phone"));
        }
        if (updates.containsKey("isActive")) {
            user.setIsActive((Boolean) updates.get("isActive"));
        }

        // Update roles if provided
        if (updates.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roleNames = (List<String>) updates.get("roles");
            Set<Role> roles = new java.util.HashSet<>();
            for (String roleName : roleNames) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
            user.setRoles(roles);
        }

        User savedUser = userRepository.save(user);

        // Sync to Firestore if available
        if (syncService.isOnline()) {
            syncService.syncUserToFirestore(savedUser);
        }

        return savedUser;
    }

    /**
     * Get all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get user by ID
     */
    public Optional<User> getUserById(String userId) {
        return userRepository.findById(userId);
    }

    /**
     * Add role to user
     */
    @Transactional
    public void addRoleToUser(String userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.getRoles().add(role);
        User savedUser = userRepository.save(user);

        // Sync to Firestore if available
        if (syncService.isOnline()) {
            syncService.syncUserToFirestore(savedUser);
        }
    }

    /**
     * Remove role from user
     */
    @Transactional
    public void removeRoleFromUser(String userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.getRoles().remove(role);
        User savedUser = userRepository.save(user);

        // Sync to Firestore if available
        if (syncService.isOnline()) {
            syncService.syncUserToFirestore(savedUser);
        }
    }
}

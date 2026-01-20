package com.idp.service;

import com.idp.model.User;
import com.idp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class LocalAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String email, String password, String fullName) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with this email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    public Optional<User> authenticateUser(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(user -> user.isEnabled() && !user.isLocked())
                .filter(user -> passwordEncoder.matches(password, user.getPasswordHash()));
    }

    @Transactional
    public void incrementLoginAttempts(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLoginAttempts(user.getLoginAttempts() + 1);
            userRepository.save(user);
        });
    }

    @Transactional
    public void resetLoginAttempts(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLoginAttempts(0);
            user.setLocked(false);
            userRepository.save(user);
        });
    }

    @Transactional
    public User updateUser(Long userId, String email, String fullName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(email);
        }

        if (fullName != null) {
            user.setFullName(fullName);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void recordSuccessfulLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLoginAttempts(0);
            user.setLocked(false);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Transactional
    public void unlockUser(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLocked(false);
            user.setLoginAttempts(0);
            userRepository.save(user);
        });
    }

    @Transactional
    public void lockUser(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLocked(true);
            userRepository.save(user);
        });
    }
}
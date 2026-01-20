package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserService userService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    // ✅ INSCRIPTION
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Email déjà utilisé");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return ResponseEntity.ok("Inscription réussie");
    }

    // ✅ LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("Identifiants invalides");
        }

        if (user.isLocked()) {
            return ResponseEntity.status(403)
                    .body("Compte bloqué");
        }

        if (!passwordEncoder.matches(
                request.getPassword(), user.getPassword())) {

            userService.loginFailed(user);
            userRepository.save(user);

            return ResponseEntity.status(401)
                    .body("Mot de passe incorrect");
        }

        userService.loginSuccess(user);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(token));
    }

    // ✅ DÉBLOCAGE
    @PostMapping("/unlock/{email}")
    public ResponseEntity<?> unlock(@PathVariable String email) {

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        user.setLocked(false);
        user.setLoginAttempts(0);
        user.setLockUntil(null);

        userRepository.save(user);

        return ResponseEntity.ok("Compte débloqué");
    }
}

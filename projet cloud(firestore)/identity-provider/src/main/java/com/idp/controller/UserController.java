package com.idp.controller;

import com.idp.entity.User;
import com.idp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get all locked users (MANAGER only)
     */
    @GetMapping("/locked")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<User>> getLockedUsers() {
        return ResponseEntity.ok(userService.getLockedUsers());
    }

    /**
     * Unlock a user by email (MANAGER only)
     */
    @PostMapping("/unblock/{email}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> unlockUser(@PathVariable String email) {
        userService.unlockUser(email);
        return ResponseEntity.ok().build();
    }

    /**
     * Update user (MANAGER only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<User> updateUser(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates) {
        User updatedUser = userService.updateUser(id, updates);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Get all users (MANAGER only)
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Get user by ID (MANAGER only)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Add role to user (MANAGER only)
     */
    @PostMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> addRoleToUser(
            @PathVariable String id,
            @PathVariable String roleName) {
        userService.addRoleToUser(id, roleName);
        return ResponseEntity.ok().build();
    }

    /**
     * Remove role from user (MANAGER only)
     */
    @DeleteMapping("/{id}/roles/{roleName}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeRoleFromUser(
            @PathVariable String id,
            @PathVariable String roleName) {
        userService.removeRoleFromUser(id, roleName);
        return ResponseEntity.ok().build();
    }
}

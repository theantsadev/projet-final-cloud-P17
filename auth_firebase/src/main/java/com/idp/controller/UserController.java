package com.idp.controller;

import com.idp.dto.UpdateUserRequest;
import com.idp.model.User;
import com.idp.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    @Autowired
    private UserService userService;

    @PutMapping("/{userId}")
    @Operation(summary = "Update user information")
    public ResponseEntity<User> updateUser(
            @PathVariable Long userId,
            @RequestBody UpdateUserRequest request) {
        try {
            User updatedUser = userService.updateUser(userId, request);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/unblock/{email}")
    @Operation(summary = "Unblock user account")
    public ResponseEntity<String> unblockUser(@PathVariable String email) {
        userService.unblockUser(email);
        return ResponseEntity.ok("User " + email + " has been unblocked");
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<User> getUser(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }
}
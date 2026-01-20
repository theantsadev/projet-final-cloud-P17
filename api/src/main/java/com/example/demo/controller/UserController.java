package com.example.demo.controller;

import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PutMapping("/me")
    public String updateUser(@RequestBody UpdateUserRequest request) {
        // JWT → email plus tard
        return "À implémenter avec JWT";
    }
}

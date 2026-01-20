package com.example.demo.dto;

import jakarta.validation.constraints.Email;

public class UpdateUserRequest {

    @Email
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
}

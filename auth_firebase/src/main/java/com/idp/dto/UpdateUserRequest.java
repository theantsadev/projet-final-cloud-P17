package com.idp.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;

@Data
public class UpdateUserRequest {

    @Email(message = "Email should be valid")
    private String email;

    private String fullName;
}
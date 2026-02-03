package com.idp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IdentityProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdentityProviderApplication.class, args);
    }
}
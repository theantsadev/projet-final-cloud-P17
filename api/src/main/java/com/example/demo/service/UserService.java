package com.example.demo.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import com.example.demo.entity.User;


@Service
public class UserService {

    private static final int MAX_ATTEMPTS = 3;

    public void loginFailed(User user) {
        user.setLoginAttempts(user.getLoginAttempts() + 1);

        if (user.getLoginAttempts() >= MAX_ATTEMPTS) {
            user.setLocked(true);
            user.setLockUntil(LocalDateTime.now().plusMinutes(15));
        }
    }

    public void loginSuccess(User user) {
        user.setLoginAttempts(0);
        user.setLocked(false);
        user.setLockUntil(null);
    }
}


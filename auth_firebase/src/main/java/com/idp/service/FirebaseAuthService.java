package com.idp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class FirebaseAuthService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${firebase.api.key}")
    private String apiKey;

    private final String SIGNUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signUp";
    private final String SIGNIN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
    private final String LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";
    private final String UPDATE_URL = "https://identitytoolkit.googleapis.com/v1/accounts:update";

    public Map<String, Object> signUp(String email, String password) {
        System.out.println("DEBUG FIREBASE: Starting signUp for: " + email);
        String url = SIGNUP_URL + "?key=" + apiKey;
        System.out.println("DEBUG FIREBASE: URL: " + url);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", email);
        requestBody.put("password", password);
        requestBody.put("returnSecureToken", true);

        System.out.println("DEBUG FIREBASE: Request body: " + requestBody);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("DEBUG FIREBASE: Sending request to Firebase...");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            System.out.println("DEBUG FIREBASE: Response status: " + response.getStatusCode());
            System.out.println("DEBUG FIREBASE: Response body: " + response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                System.out.println("DEBUG FIREBASE: SignUp successful!");
                return response.getBody();
            } else {
                System.out.println("DEBUG FIREBASE: SignUp failed with status: " + response.getStatusCode());
                throw new RuntimeException("Firebase signup failed: " + response.getBody());
            }
        } catch (Exception e) {
            System.out.println("DEBUG FIREBASE: Exception during signUp: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Firebase signup error: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> signIn(String email, String password) {
        System.out.println("DEBUG FIREBASE: Starting signIn for: " + email);
        String url = SIGNIN_URL + "?key=" + apiKey;

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", email);
        requestBody.put("password", password);
        requestBody.put("returnSecureToken", true);

        System.out.println("DEBUG FIREBASE: SignIn request body: " + requestBody);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            System.out.println("DEBUG FIREBASE: SignIn response: " + response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK) {
                System.out.println("DEBUG FIREBASE: SignIn successful!");
                return response.getBody();
            } else {
                System.out.println("DEBUG FIREBASE: SignIn failed: " + response.getBody());
                throw new RuntimeException("Firebase signin failed: " + response.getBody());
            }
        } catch (Exception e) {
            System.out.println("DEBUG FIREBASE: SignIn exception: " + e.getMessage());
            throw new RuntimeException("Firebase signin error: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> verifyToken(String idToken) {
        System.out.println("DEBUG FIREBASE: Verifying token");
        String url = LOOKUP_URL + "?key=" + apiKey;

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("idToken", idToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            System.out.println("DEBUG FIREBASE: Token verification response: " + response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Token verification failed: " + response.getBody());
            }
        } catch (Exception e) {
            System.out.println("DEBUG FIREBASE: Token verification error: " + e.getMessage());
            throw new RuntimeException("Token verification error: " + e.getMessage(), e);
        }
    }

    public String getUserIdFromToken(String idToken) {
        try {
            System.out.println("DEBUG FIREBASE: Getting user ID from token");
            Map<String, Object> result = verifyToken(idToken);
            if (result != null && result.containsKey("users")) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> users = (java.util.List<Map<String, Object>>) result.get("users");
                if (users != null && !users.isEmpty()) {
                    String userId = (String) users.get(0).get("localId");
                    System.out.println("DEBUG FIREBASE: Found user ID: " + userId);
                    return userId;
                }
            }
            System.out.println("DEBUG FIREBASE: No user ID found in token");
            return null;
        } catch (Exception e) {
            System.out.println("DEBUG FIREBASE: Error getting user ID: " + e.getMessage());
            return null;
        }
    }
    
    public Map<String, Object> updateUserWithAdmin(String uid, String email, String displayName) {
        // Cette méthode nécessiterait le SDK Admin Firebase
        // Pas possible avec seulement l'API REST Identity Toolkit

        System.out.println("WARNING: Cannot update Firebase user via REST API without user's idToken");
        System.out.println("Only the user themselves can update their Firebase account via idToken");
        return null;
    }
}
package com.idp.service;

import org.springframework.stereotype.Service;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class NetworkService {

    public boolean isInternetAvailable() {
        try {
            System.out.println("DEBUG: Checking internet connection...");
            URL url = new URL("https://www.google.com");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(3000);
            connection.setRequestMethod("HEAD");
            int responseCode = connection.getResponseCode();
            boolean available = (responseCode == 200);
            System.out.println("DEBUG: Internet available: " + available + " (Response code: " + responseCode + ")");
            return available;
        } catch (Exception e) {
            System.out.println("DEBUG: Internet check failed: " + e.getMessage());
            return false;
        }
    }

    public boolean isFirebaseAvailable() {
        try {
            System.out.println("DEBUG: Checking Firebase connection...");
            URL url = new URL("https://identitytoolkit.googleapis.com");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(3000);
            connection.setRequestMethod("HEAD");
            int responseCode = connection.getResponseCode();
            boolean available = (responseCode == 200 || responseCode == 404);
            System.out.println("DEBUG: Firebase available: " + available + " (Response code: " + responseCode + ")");
            return available;
        } catch (Exception e) {
            System.out.println("DEBUG: Firebase check failed: " + e.getMessage());
            return false;
        }
    }
}
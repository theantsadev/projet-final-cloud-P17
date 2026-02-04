package com.idp.config;

import com.idp.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // Endpoints publics (sans authentification)
                                                .requestMatchers(
                                                                "/api/auth/register", // Inscription
                                                                "/api/auth/login", // Connexion
                                                                "/api/auth/unlock", // Déblocage
                                                                "/api/security/**", // Paramètres sécurité
                                                                "/api/sync/**", // Synchronisation
                                                                "/api/signalements/test/**", // TEST endpoints
                                                                                             // signalement
                                                                "/api/signalements/geo/**", // PostGIS endpoints
                                                                "/api/signalements/statut/**", // Public statut endpoint
                                                                "/api/signalements", // GET tous les signalements

                                                                // Swagger/OpenAPI
                                                                "/api/swagger-ui/**",
                                                                "/api/swagger-ui.html",
                                                                "/api/api-docs/**",
                                                                "/api/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/api-docs/**",
                                                                "/v3/api-docs/**",

                                                                // Fichiers statiques et HTML
                                                                "/index.html",
                                                                "/",
                                                                "/error",
                                                                "/favicon.ico",
                                                                "/static/**",
                                                                "/*.js",
                                                                "/*.css")
                                                .permitAll()

                                                // Tous les autres endpoints nécessitent une authentification
                                                .anyRequest().authenticated())

                                // Ajout du filtre JWT
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost:3000",
                                "http://localhost:8080",
                                "http://127.0.0.1:8080",
                                "file://"));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With",
                                                "*"));
                configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
                configuration.setAllowCredentials(false);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
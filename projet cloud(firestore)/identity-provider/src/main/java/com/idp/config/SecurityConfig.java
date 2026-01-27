package com.idp.config;

import com.idp.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
@EnableMethodSecurity
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
                                "/api/auth/login", // Connexion
                                "/api/auth/unlock", // Déblocage

                                // Swagger/OpenAPI
                                "/api/swagger-ui/**",
                                "/api/swagger-ui.html",
                                "/api/api-docs/**",
                                "/api/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**",

                                // Erreurs et fichiers statiques
                                "/error",
                                "/favicon.ico")
                        .permitAll()

                        // Autoriser les GET publics sur les signalements (visiteur)
                        .requestMatchers(HttpMethod.GET, "/api/signalements/**").permitAll()

                        // Endpoints nécessitant le rôle MANAGER
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("MANAGER")
                        .requestMatchers("/api/users/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/signalements/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/signalements/**").hasRole("MANAGER")
                        .requestMatchers("/api/security/**").hasRole("MANAGER")
                        .requestMatchers("/api/sync/**").hasRole("MANAGER")

                        // Tous les autres endpoints nécessitent une authentification
                        .anyRequest().authenticated())

                // Ajout du filtre JWT
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:8080", "*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(
                Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
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
package com.idp.filter;

import com.idp.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        if (jwtService.isTokenValid(jwt)) {
            try {
                String userId = jwtService.extractUserId(jwt);

                // Créer l'authentification
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userId, null,
                        null);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Mettre dans le contexte Spring Security
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (Exception e) {
                // Token invalide, continuer sans authentification
            }
        }

        filterChain.doFilter(request, response);
    }
}
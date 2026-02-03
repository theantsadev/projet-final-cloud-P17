package com.idp.exception;

import com.idp.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Gérer les exceptions métier personnalisées
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleUserNotFoundException(
            UserNotFoundException ex, WebRequest request) {
        log.error("❌ User not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), ex.getCode(), HttpStatus.NOT_FOUND.value()));
    }

    /**
     * Gérer les exceptions de mot de passe invalide
     */
    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidPasswordException(
            InvalidPasswordException ex, WebRequest request) {
        log.error("❌ Invalid password attempt");
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage(), ex.getCode(), HttpStatus.UNAUTHORIZED.value()));
    }

    /**
     * Gérer les exceptions de compte bloqué
     */
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccountLockedException(
            AccountLockedException ex, WebRequest request) {
        log.error("🔒 Account locked: {}", ex.getMessage());
        Map<String, Object> details = new HashMap<>();
        details.put("minutesRemaining", ex.getMinutesRemaining());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(), ex.getCode(), HttpStatus.FORBIDDEN.value(), details));
    }

    /**
     * Gérer les exceptions de compte désactivé
     */
    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<ApiResponse<?>> handleAccountDisabledException(
            AccountDisabledException ex, WebRequest request) {
        log.error("❌ Account disabled: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(), ex.getCode(), HttpStatus.FORBIDDEN.value()));
    }

    /**
     * Gérer les exceptions d'email en doublon
     */
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiResponse<?>> handleDuplicateEmailException(
            DuplicateEmailException ex, WebRequest request) {
        log.error("❌ Duplicate email: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage(), ex.getCode(), HttpStatus.CONFLICT.value()));
    }

    /**
     * Gérer les exceptions de token invalide
     */
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidTokenException(
            InvalidTokenException ex, WebRequest request) {
        log.error("❌ Invalid token: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage(), ex.getCode(), HttpStatus.UNAUTHORIZED.value()));
    }

    /**
     * Gérer les erreurs de validation (MethodArgumentNotValid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.error("❌ Validation error");
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Erreur de validation", "VALIDATION_ERROR", 
                        HttpStatus.BAD_REQUEST.value(), errors));
    }

    /**
     * Gérer toutes les autres exceptions non gérées
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("❌ Erreur non gérée", ex);
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        "Une erreur interne s'est produite",
                        "INTERNAL_ERROR",
                        HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }
}

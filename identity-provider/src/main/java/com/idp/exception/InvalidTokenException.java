package com.idp.exception;

/**
 * Exception levée quand le token JWT est invalide
 */
public class InvalidTokenException extends BusinessException {
    public InvalidTokenException(String message) {
        super("INVALID_TOKEN", message);
    }
}

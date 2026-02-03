package com.idp.exception;

/**
 * Exception levée quand le mot de passe est incorrect
 */
public class InvalidPasswordException extends BusinessException {
    public InvalidPasswordException() {
        super("INVALID_PASSWORD", "Le mot de passe est incorrect");
    }
}

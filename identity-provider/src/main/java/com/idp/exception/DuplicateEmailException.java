package com.idp.exception;

/**
 * Exception levée quand l'email est déjà utilisé
 */
public class DuplicateEmailException extends BusinessException {
    public DuplicateEmailException(String email) {
        super("DUPLICATE_EMAIL", "L'email '" + email + "' est déjà utilisé");
    }
}

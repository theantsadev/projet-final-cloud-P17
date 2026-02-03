package com.idp.exception;

/**
 * Exception levée quand l'utilisateur n'est pas trouvé
 */
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(String email) {
        super("USER_NOT_FOUND", "Utilisateur avec l'email '" + email + "' non trouvé");
    }
}
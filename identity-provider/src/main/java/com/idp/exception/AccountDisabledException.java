package com.idp.exception;

/**
 * Exception levée quand le compte est désactivé
 */
public class AccountDisabledException extends BusinessException {
    public AccountDisabledException(String email) {
        super("ACCOUNT_DISABLED", "Le compte de '" + email + "' est désactivé");
    }
}

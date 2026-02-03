package com.idp.exception;

/**
 * Exception levée quand le compte est bloqué
 */
public class AccountLockedException extends BusinessException {
    private final long minutesRemaining;

    public AccountLockedException(long minutesRemaining) {
        super("ACCOUNT_LOCKED", "Le compte est bloqué. Réessayez dans " + minutesRemaining + " minutes");
        this.minutesRemaining = minutesRemaining;
    }

    public long getMinutesRemaining() {
        return minutesRemaining;
    }
}

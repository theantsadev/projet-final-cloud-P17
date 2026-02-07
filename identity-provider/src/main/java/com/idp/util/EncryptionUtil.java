package com.idp.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utilitaire de chiffrement AES-GCM pour stocker temporairement
 * les mots de passe en clair (utilisés pour la sync Firebase Auth).
 */
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    @Value("${encryption.secret-key}")
    private String secretKey;

    /**
     * Chiffre un texte en clair → Base64(IV + ciphertext)
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return null;
        }
        try {
            byte[] keyBytes = normalizeKey(secretKey);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encrypted = cipher.doFinal(plainText.getBytes("UTF-8"));

            // Concat IV + encrypted
            byte[] result = new byte[IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, result, 0, IV_LENGTH);
            System.arraycopy(encrypted, 0, result, IV_LENGTH, encrypted.length);

            return Base64.getEncoder().encodeToString(result);
        } catch (Exception e) {
            throw new RuntimeException("Erreur chiffrement", e);
        }
    }

    /**
     * Déchiffre un texte Base64(IV + ciphertext) → texte en clair
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return null;
        }
        try {
            byte[] keyBytes = normalizeKey(secretKey);
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

            byte[] decoded = Base64.getDecoder().decode(encryptedText);

            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(decoded, 0, iv, 0, IV_LENGTH);

            byte[] cipherText = new byte[decoded.length - IV_LENGTH];
            System.arraycopy(decoded, IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] decrypted = cipher.doFinal(cipherText);
            return new String(decrypted, "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Erreur déchiffrement", e);
        }
    }

    /**
     * Normalise la clé à exactement 32 bytes (AES-256)
     */
    private byte[] normalizeKey(String key) {
        byte[] keyBytes = new byte[32];
        byte[] raw = key.getBytes();
        System.arraycopy(raw, 0, keyBytes, 0, Math.min(raw.length, 32));
        return keyBytes;
    }
}

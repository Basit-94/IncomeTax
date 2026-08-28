package com.wapsi.backend.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * Hashes passwords and OTP codes for storage.
 *
 * <p><strong>Why PBKDF2 and not argon2id.</strong> No password-hashing library is available in
 * this build environment, and inventing one is not an option. {@code PBKDF2WithHmacSHA256} is a
 * NIST-specified KDF in the JDK, used here with a per-secret random salt and a constant-time
 * comparison — standard, reviewed code rather than something hand-rolled.
 *
 * <p>It is still the second-best answer. argon2id is memory-hard; PBKDF2 is not, so it is
 * materially weaker against GPU-parallel attack at equal CPU cost. This class is the only place
 * that knows the algorithm, so swapping it later touches one file. See PLAN.md T2.1b.
 *
 * <p>The stored form carries its own parameters — {@code pbkdf2-sha256$iterations$salt$hash} — so
 * raising the iteration count does not invalidate existing hashes: old ones keep verifying with
 * the parameters they were written with.
 */
public final class PasswordHasher {
    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final String PREFIX = "pbkdf2-sha256";
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;

    /** OWASP's floor for PBKDF2-HMAC-SHA256 at the time of writing. Raise it, never lower it. */
    public static final int DEFAULT_ITERATIONS = 600_000;

    private final SecureRandom random = new SecureRandom();
    private final int iterations;

    public PasswordHasher() {
        this(DEFAULT_ITERATIONS);
    }

    public PasswordHasher(int iterations) {
        if (iterations < 1_000) {
            throw new IllegalArgumentException("Refusing to hash with " + iterations + " iterations");
        }
        this.iterations = iterations;
    }

    public String hash(char[] secret) {
        byte[] salt = new byte[SALT_BYTES];
        random.nextBytes(salt);
        byte[] key = derive(secret, salt, iterations);
        Base64.Encoder encoder = Base64.getEncoder().withoutPadding();
        return PREFIX + "$" + iterations + "$" + encoder.encodeToString(salt) + "$" + encoder.encodeToString(key);
    }

    public String hash(String secret) {
        return hash(secret.toCharArray());
    }

    /**
     * @return true when {@code secret} produced {@code stored}. Never throws on a malformed stored
     *         value: a corrupt row must read as "does not match", not as a server error a caller
     *         could use to probe which accounts exist.
     */
    public boolean matches(char[] secret, String stored) {
        if (stored == null) {
            return false;
        }
        String[] parts = stored.split("\\$");
        if (parts.length != 4 || !PREFIX.equals(parts[0])) {
            return false;
        }
        try {
            int storedIterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            byte[] actual = derive(secret, salt, storedIterations);
            // Constant time: a length-independent early return leaks how much of the hash matched.
            return MessageDigest.isEqual(expected, actual);
        } catch (RuntimeException malformed) {
            return false;
        }
    }

    public boolean matches(String secret, String stored) {
        return matches(secret.toCharArray(), stored);
    }

    private static byte[] derive(char[] secret, byte[] salt, int iterations) {
        PBEKeySpec spec = new PBEKeySpec(secret, salt, iterations, KEY_BITS);
        try {
            return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException impossible) {
            throw new IllegalStateException(ALGORITHM + " is required but unavailable", impossible);
        } finally {
            spec.clearPassword();
        }
    }
}

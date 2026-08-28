package com.wapsi.backend.auth;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * A taxpayer's account.
 *
 * <p><strong>PAN identifies; it never authorises.</strong> Knowing a PAN gets you nothing: it is
 * semi-public, printed on documents and shared routinely, so treating it as a credential would
 * let anyone read anyone's returns. An account becomes usable only after both one-time codes are
 * verified, and access afterwards requires the password. The PAN's job is to be the stable key
 * that joins a person's returns across years.
 */
public record Account(
        UUID id,
        String pan,
        String fullName,
        LocalDate dateOfBirth,
        String mobile,
        String email,
        String passwordHash,
        String personalisedMessage,
        Status status,
        Instant mobileVerifiedAt,
        Instant emailVerifiedAt,
        Instant createdAt,
        Instant activatedAt) {

    public enum Status { PENDING, ACTIVE }

    /**
     * The published format of the identifier: five letters, four digits, one letter. This is the
     * shape of the number itself, not a tax rule, so checking it invents nothing.
     */
    private static final Pattern PAN_FORMAT = Pattern.compile("[A-Z]{5}[0-9]{4}[A-Z]");

    public static boolean isWellFormedPan(String pan) {
        return pan != null && PAN_FORMAT.matcher(pan).matches();
    }

    public boolean isActive() {
        return status == Status.ACTIVE;
    }

    public boolean bothChannelsVerified() {
        return mobileVerifiedAt != null && emailVerifiedAt != null;
    }

    /** The anti-phishing message, shown at sign-in. Absent until the account is activated. */
    public Optional<String> greeting() {
        return isActive() ? Optional.ofNullable(personalisedMessage) : Optional.empty();
    }

    public Account withVerified(Otp.Channel channel, Instant at) {
        // Named ...At so they cannot be confused with the mobile/email components they sit beside.
        Instant mobileAt = channel == Otp.Channel.MOBILE ? at : mobileVerifiedAt;
        Instant emailAt = channel == Otp.Channel.EMAIL ? at : emailVerifiedAt;
        return new Account(id, pan, fullName, dateOfBirth, mobile, email, passwordHash,
                personalisedMessage, status, mobileAt, emailAt, createdAt, activatedAt);
    }

    public Account activated(String newPasswordHash, String message, Instant at) {
        return new Account(id, pan, fullName, dateOfBirth, mobile, email, newPasswordHash,
                message, Status.ACTIVE, mobileVerifiedAt, emailVerifiedAt, createdAt, at);
    }
}

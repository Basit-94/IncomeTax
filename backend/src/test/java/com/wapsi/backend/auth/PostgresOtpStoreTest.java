package com.wapsi.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

import com.wapsi.backend.auth.Otp.Channel;
import com.wapsi.backend.auth.Otp.Result;
import com.wapsi.backend.config.SchemaMigrator;

/** The OTP flow against a real database, including the V3 migration that creates its table. */
class PostgresOtpStoreTest {
    private static final Instant T0 = Instant.parse("2026-06-01T10:00:00Z");

    @Test
    void theWholeFlowSurvivesARealDatabase() throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start()) {
            DataSource dataSource = postgres.getPostgresDatabase();
            // V3 must be part of the migration set, or nothing here has a table to write to.
            assertTrue(new SchemaMigrator(dataSource).migrate().contains("3"));

            PasswordHasher hasher = new PasswordHasher(1_000);
            Otp.Store store = new PostgresOtpStore(dataSource);
            OtpService service = new OtpService(store, new Otp.SecureCodes(), hasher,
                    Duration.ofMinutes(15), 5, Duration.ofSeconds(60));

            List<String> delivered = new ArrayList<>();
            service.issue("9876543210", Channel.MOBILE, T0, delivered::add);
            String code = delivered.get(0);

            Otp.Challenge stored = store.latest("9876543210", Channel.MOBILE).orElseThrow();
            assertFalse(stored.codeHash().contains(code), "the code must not be stored in the clear");

            assertEquals(Result.INCORRECT,
                    service.verify("9876543210", Channel.MOBILE, "000000", T0));
            assertEquals(1, store.latest("9876543210", Channel.MOBILE).orElseThrow().attempts(),
                    "the attempt must be persisted, or a restart resets the brute-force counter");

            assertEquals(Result.OK, service.verify("9876543210", Channel.MOBILE, code, T0));
            assertEquals(Result.ALREADY_USED,
                    service.verify("9876543210", Channel.MOBILE, code, T0));
        }
    }
}

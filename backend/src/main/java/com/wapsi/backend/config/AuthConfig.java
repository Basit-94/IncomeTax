package com.wapsi.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.wapsi.backend.auth.AccountStore;
import com.wapsi.backend.auth.Otp;
import com.wapsi.backend.auth.OtpService;
import com.wapsi.backend.auth.PasswordHasher;
import com.wapsi.backend.auth.RegistrationService;
import com.wapsi.backend.auth.SignInAttempts;
import com.wapsi.backend.auth.SignInService;

/**
 * Assembles the auth services. Storage adapters come from {@link PersistenceConfig}; this class
 * only decides service-level policy.
 *
 * <p><strong>The mock one-time code.</strong> With {@code wapsi.otp.mode=fixed} (the default —
 * this is a mock site), codes are the constant below. It is knowable because it is written here
 * and in the developer docs, <em>not</em> because any endpoint or log emits it. Set
 * {@code wapsi.otp.mode=random} for real six-digit codes; delivery then becomes a real concern.
 */
@Configuration
public class AuthConfig {

    /** The documented mock code. Matches the value the front end already displays. */
    public static final String MOCK_CODE = "949494";

    @Bean
    public PasswordHasher passwordHasher() {
        return new PasswordHasher();
    }

    @Bean
    public Otp.CodeGenerator codeGenerator(@Value("${wapsi.otp.mode:fixed}") String mode) {
        return "random".equalsIgnoreCase(mode) ? new Otp.SecureCodes() : new Otp.FixedCode(MOCK_CODE);
    }

    @Bean
    public OtpService otpService(Otp.Store store, Otp.CodeGenerator codes, PasswordHasher hasher) {
        return new OtpService(store, codes, hasher);
    }

    @Bean
    public SignInAttempts signInAttempts(
            org.springframework.beans.factory.ObjectProvider<javax.sql.DataSource> dataSources) {
        javax.sql.DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new SignInAttempts.InMemory() : new SignInAttempts.Postgres(dataSource);
    }

    @Bean
    public RegistrationService registrationService(AccountStore accounts, OtpService otp,
                                                   PasswordHasher hasher) {
        return new RegistrationService(accounts, otp, hasher);
    }

    @Bean
    public SignInService signInService(AccountStore accounts, SignInAttempts attempts,
                                       PasswordHasher hasher) {
        return new SignInService(accounts, attempts, hasher);
    }
}

package com.wapsi.backend.config;

import javax.sql.DataSource;

import org.postgresql.ds.PGSimpleDataSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.wapsi.backend.auth.AccountStore;
import com.wapsi.backend.auth.InMemoryOtpStore;
import com.wapsi.backend.auth.Otp;
import com.wapsi.backend.auth.PostgresAccountStore;
import com.wapsi.backend.auth.PostgresOtpStore;
import com.wapsi.backend.auth.SessionService;
import com.wapsi.backend.auth.SessionStore;
import com.wapsi.backend.document.DocumentStore;
import com.wapsi.backend.document.PostgresDocumentStore;
import com.wapsi.backend.history.CarryForwardService;
import com.wapsi.backend.submission.SubmissionStore;
import com.wapsi.backend.ledger.FactLedger;
import com.wapsi.backend.ledger.InMemoryFactLedger;
import com.wapsi.backend.ledger.PostgresFactLedger;
import com.wapsi.backend.submission.InMemorySubmissionStore;
import com.wapsi.backend.submission.PostgresSubmissionStore;
import com.wapsi.backend.submission.SubmissionStore;

/**
 * The single place that decides where submissions and facts are stored.
 *
 * <p>With {@code wapsi.datasource.url} set, both the submission store and the fact ledger are
 * PostgreSQL-backed and survive a restart or a second instance. Without it they fall back to
 * process memory, so the application still boots with no database — local development and the
 * existing test suite must not require Postgres to be running.
 *
 * <p><strong>Connection pooling.</strong> The fallback {@link PGSimpleDataSource} opens a
 * connection per use. That is adequate for correctness and for tests, but a connection-per-request
 * backend cannot support a claim about national scale. This class therefore defers to an
 * externally supplied {@link DataSource} bean whenever one exists — a real deployment should
 * provide a pooled one (HikariCP or similar) and this code will use it untouched.
 */
@Configuration
public class PersistenceConfig {

    /**
     * Only created when a URL is configured <em>and</em> nothing else has already supplied a
     * DataSource, so a pooled bean from the deployment always wins.
     */
    @Bean
    @ConditionalOnProperty(name = "wapsi.datasource.url")
    @ConditionalOnMissingBean(DataSource.class)
    public DataSource wapsiDataSource(
            @Value("${wapsi.datasource.url}") String url,
            @Value("${wapsi.datasource.username:}") String username,
            @Value("${wapsi.datasource.password:}") String password) {
        PGSimpleDataSource dataSource = new PGSimpleDataSource();
        dataSource.setUrl(url);
        if (!username.isBlank()) {
            dataSource.setUser(username);
        }
        if (!password.isBlank()) {
            dataSource.setPassword(password);
        }
        return dataSource;
    }

    /**
     * Creates the schema before anything reads it. Only when a DataSource exists, so the
     * no-database path is untouched; already-applied versions make a restart a no-op.
     */
    @Bean
    @ConditionalOnBean(DataSource.class)
    public SchemaMigrator schemaMigrator(DataSource dataSource) {
        SchemaMigrator migrator = new SchemaMigrator(dataSource);
        migrator.migrate();
        return migrator;
    }

    @Bean
    public SubmissionStore submissionStore(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new InMemorySubmissionStore() : new PostgresSubmissionStore(dataSource);
    }

    @Bean
    public AccountStore accountStore(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new AccountStore.InMemory() : new PostgresAccountStore(dataSource);
    }

    @Bean
    public Otp.Store otpStore(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new InMemoryOtpStore() : new PostgresOtpStore(dataSource);
    }

    @Bean
    public SessionStore sessionStore(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new SessionStore.InMemory() : new SessionStore.Postgres(dataSource);
    }

    @Bean
    public SessionService sessionService(SessionStore sessionStore) {
        return new SessionService(sessionStore);
    }

    @Bean
    public com.wapsi.backend.preference.PreferenceStore preferenceStore(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null
                ? new com.wapsi.backend.preference.PreferenceStore.InMemory()
                : new com.wapsi.backend.preference.PreferenceStore.Postgres(dataSource);
    }

    @Bean
    public DocumentStore documentStore(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new DocumentStore.InMemory() : new PostgresDocumentStore(dataSource);
    }

    @Bean
    public CarryForwardService carryForwardService(SubmissionStore submissions, FactLedger ledger) {
        return new CarryForwardService(submissions, ledger);
    }

    @Bean
    public FactLedger factLedger(ObjectProvider<DataSource> dataSources) {
        DataSource dataSource = dataSources.getIfAvailable();
        return dataSource == null ? new InMemoryFactLedger() : new PostgresFactLedger(dataSource);
    }
}

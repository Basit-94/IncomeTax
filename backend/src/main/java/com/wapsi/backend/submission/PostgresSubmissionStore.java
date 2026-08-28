package com.wapsi.backend.submission;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import javax.sql.DataSource;

/**
 * PostgreSQL adapter for the submission table in V2__submission.sql.
 *
 * <p>Idempotency is enforced by the primary key on {@code idempotency_key}, not by process
 * memory, so concurrent submissions of the same key — including ones arriving at different
 * backend instances — collapse to a single submission.
 */
public final class PostgresSubmissionStore implements SubmissionStore {
    private static final String INSERT = """
            INSERT INTO submission (
                idempotency_key, submission_id, status, rule_set_version,
                total_tax_paise, message, created_at, updated_at,
                citizen_reference, assessment_year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
            """;

    private static final String BY_KEY = """
            SELECT submission_id, status, rule_set_version, total_tax_paise, message
              FROM submission
             WHERE idempotency_key = ?
            """;

    private static final String BY_SUBMISSION_ID = """
            SELECT submission_id, status, rule_set_version, total_tax_paise, message
              FROM submission
             WHERE submission_id = ?
            """;

    private static final String HISTORY = """
            SELECT submission_id, status, rule_set_version, total_tax_paise, message
              FROM submission
             WHERE citizen_reference = ?
             ORDER BY created_at DESC
            """;

    private static final String LATEST_COMPLETED = """
            SELECT submission_id, status, rule_set_version, total_tax_paise, message
              FROM submission
             WHERE citizen_reference = ? AND assessment_year = ? AND status = 'completed'
             ORDER BY created_at DESC
             LIMIT 1
            """;

    private static final String COMPLETE = """
            UPDATE submission
               SET status = ?, total_tax_paise = ?, message = ?, updated_at = ?
             WHERE idempotency_key = ?
            """;

    private final DataSource dataSource;

    public PostgresSubmissionStore(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Optional<SubmissionReceipt> insertIfAbsent(String idempotencyKey, SubmissionReceipt receipt,
                                                      SubmissionOwner owner) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            Timestamp now = Timestamp.from(Instant.now());
            statement.setString(1, idempotencyKey);
            statement.setObject(2, UUID.fromString(receipt.submissionId()));
            statement.setString(3, receipt.status());
            statement.setString(4, receipt.ruleSetVersion());
            setNullableLong(statement, 5, receipt.totalTaxPaise());
            statement.setString(6, receipt.message());
            statement.setTimestamp(7, now);
            statement.setTimestamp(8, now);
            statement.setString(9, owner.citizenReference());
            statement.setString(10, owner.assessmentYear());
            if (statement.executeUpdate() == 1) {
                return Optional.empty();
            }
            // Untargeted ON CONFLICT is deliberate: submission_id is derived from the key, so a
            // duplicate violates submission_submission_id_key as well as the primary key, and
            // naming only one target makes Postgres raise the other instead of doing nothing.
        } catch (SQLException exception) {
            throw databaseFailure("record submission", exception);
        }
        // The key was already taken: whoever holds it owns the submission.
        return find(BY_KEY, idempotencyKey);
    }

    @Override
    public void complete(String idempotencyKey, SubmissionReceipt receipt) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(COMPLETE)) {
            statement.setString(1, receipt.status());
            setNullableLong(statement, 2, receipt.totalTaxPaise());
            statement.setString(3, receipt.message());
            statement.setTimestamp(4, Timestamp.from(Instant.now()));
            statement.setString(5, idempotencyKey);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw databaseFailure("complete submission", exception);
        }
    }

    @Override
    public Optional<SubmissionReceipt> bySubmissionId(String submissionId) {
        UUID id;
        try {
            id = UUID.fromString(submissionId);
        } catch (IllegalArgumentException notAUuid) {
            return Optional.empty();
        }
        return find(BY_SUBMISSION_ID, id);
    }

    @Override
    public List<SubmissionReceipt> history(String citizenReference) {
        if (citizenReference == null || citizenReference.isBlank()) {
            return List.of();
        }
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(HISTORY)) {
            statement.setString(1, citizenReference);
            try (ResultSet result = statement.executeQuery()) {
                List<SubmissionReceipt> receipts = new ArrayList<>();
                while (result.next()) {
                    receipts.add(read(result));
                }
                return List.copyOf(receipts);
            }
        } catch (SQLException exception) {
            throw databaseFailure("read the filing history", exception);
        }
    }

    @Override
    public Optional<SubmissionReceipt> latestCompleted(String citizenReference, String assessmentYear) {
        if (citizenReference == null || citizenReference.isBlank() || assessmentYear == null) {
            return Optional.empty();
        }
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(LATEST_COMPLETED)) {
            statement.setString(1, citizenReference);
            statement.setString(2, assessmentYear);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? Optional.of(read(result)) : Optional.empty();
            }
        } catch (SQLException exception) {
            throw databaseFailure("read the latest completed submission", exception);
        }
    }

    private Optional<SubmissionReceipt> find(String sql, Object key) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, key);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? Optional.of(read(result)) : Optional.empty();
            }
        } catch (SQLException exception) {
            throw databaseFailure("read submission", exception);
        }
    }

    private static SubmissionReceipt read(ResultSet result) throws SQLException {
        String submissionId = result.getObject("submission_id", UUID.class).toString();
        String status = result.getString("status");
        String ruleSetVersion = result.getString("rule_set_version");
        // wasNull() reports on the column read immediately before it, so test it here.
        long totalTax = result.getLong("total_tax_paise");
        Long totalTaxPaise = result.wasNull() ? null : totalTax;
        return new SubmissionReceipt(
                submissionId, status, ruleSetVersion, totalTaxPaise, result.getString("message"));
    }

    private static void setNullableLong(PreparedStatement statement, int index, Long value) throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.BIGINT);
        } else {
            statement.setLong(index, value);
        }
    }

    private static IllegalStateException databaseFailure(String operation, SQLException exception) {
        return new IllegalStateException("Could not " + operation, exception);
    }
}

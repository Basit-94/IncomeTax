package com.wapsi.backend.ledger;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import javax.sql.DataSource;

import com.wapsi.backend.money.Money;

/** PostgreSQL adapter for the append-only ledger schema in V1__fact_ledger.sql. */
public final class PostgresFactLedger implements FactLedger {
    private static final String INSERT = """
            INSERT INTO fact_event (
                id, return_id, assessment_year, kind, value_paise, reported_by,
                source_document, reported_at, confirmed_by_user_at,
                supersedes_fact_id, correction_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String HISTORY = """
            SELECT id, return_id, assessment_year, kind, value_paise, reported_by,
                   source_document, reported_at, confirmed_by_user_at,
                   supersedes_fact_id, correction_reason
              FROM fact_event
             WHERE return_id = ?
             ORDER BY reported_at, id
            """;

    private static final String CURRENT_PROJECTION = """
            SELECT event.id, event.return_id, event.assessment_year, event.kind,
                   event.value_paise, event.reported_by, event.source_document,
                   event.reported_at, event.confirmed_by_user_at,
                   event.supersedes_fact_id, event.correction_reason
              FROM fact_event event
             WHERE event.return_id = ?
               AND NOT EXISTS (
                   SELECT 1
                     FROM fact_event successor
                    WHERE successor.supersedes_fact_id = event.id
               )
             ORDER BY event.reported_at, event.id
            """;

    private final DataSource dataSource;

    public PostgresFactLedger(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public FactLedgerEvent append(FactLedgerEvent event) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            bind(statement, event);
            statement.executeUpdate();
            return event;
        } catch (SQLException exception) {
            if ("23505".equals(exception.getSQLState())) {
                throw new IllegalArgumentException("Fact event already exists: " + event.id(), exception);
            }
            throw databaseFailure("append fact event", exception);
        }
    }

    @Override
    public List<FactLedgerEvent> history(UUID returnId) {
        return query(HISTORY, returnId);
    }

    @Override
    public List<FactLedgerEvent> currentProjection(UUID returnId) {
        return query(CURRENT_PROJECTION, returnId);
    }

    private List<FactLedgerEvent> query(String sql, UUID returnId) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, returnId);
            try (ResultSet result = statement.executeQuery()) {
                List<FactLedgerEvent> events = new ArrayList<>();
                while (result.next()) {
                    events.add(read(result));
                }
                return List.copyOf(events);
            }
        } catch (SQLException exception) {
            throw databaseFailure("read fact events", exception);
        }
    }

    private static void bind(PreparedStatement statement, FactLedgerEvent event) throws SQLException {
        statement.setObject(1, event.id());
        statement.setObject(2, event.returnId());
        statement.setString(3, event.assessmentYear());
        statement.setString(4, event.kind());
        statement.setLong(5, event.value().paise());
        statement.setString(6, event.reportedBy());
        statement.setString(7, event.sourceDocument());
        statement.setTimestamp(8, Timestamp.from(event.reportedAt()));
        if (event.confirmedByUserAt() == null) {
            statement.setTimestamp(9, null);
        } else {
            statement.setTimestamp(9, Timestamp.from(event.confirmedByUserAt()));
        }
        if (event.supersedesFactId() == null) {
            statement.setObject(10, null);
        } else {
            statement.setObject(10, event.supersedesFactId());
        }
        statement.setString(11, event.correctionReason());
    }

    private static FactLedgerEvent read(ResultSet result) throws SQLException {
        Timestamp confirmed = result.getTimestamp("confirmed_by_user_at");
        UUID supersedes = result.getObject("supersedes_fact_id", UUID.class);
        return new FactLedgerEvent(
                result.getObject("id", UUID.class),
                result.getObject("return_id", UUID.class),
                result.getString("assessment_year"),
                result.getString("kind"),
                Money.ofPaise(result.getLong("value_paise")),
                result.getString("reported_by"),
                result.getString("source_document"),
                result.getTimestamp("reported_at").toInstant(),
                confirmed == null ? null : confirmed.toInstant(),
                supersedes,
                result.getString("correction_reason"));
    }

    private static IllegalStateException databaseFailure(String operation, SQLException exception) {
        return new IllegalStateException("Could not " + operation, exception);
    }
}

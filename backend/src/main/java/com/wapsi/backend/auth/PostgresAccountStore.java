package com.wapsi.backend.auth;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import javax.sql.DataSource;

/** PostgreSQL adapter for the account table in V4__account.sql. */
public final class PostgresAccountStore implements AccountStore {
    private static final String INSERT = """
            INSERT INTO account (
                id, pan, full_name, date_of_birth, mobile, email, password_hash,
                personalised_message, status, mobile_verified_at, email_verified_at,
                created_at, activated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String UPDATE = """
            UPDATE account
               SET full_name = ?, date_of_birth = ?, mobile = ?, email = ?, password_hash = ?,
                   personalised_message = ?, status = ?, mobile_verified_at = ?,
                   email_verified_at = ?, activated_at = ?
             WHERE pan = ?
            """;

    private static final String BY_PAN = """
            SELECT id, pan, full_name, date_of_birth, mobile, email, password_hash,
                   personalised_message, status, mobile_verified_at, email_verified_at,
                   created_at, activated_at
              FROM account
             WHERE pan = ?
            """;

    private final DataSource dataSource;

    public PostgresAccountStore(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Account create(Account account) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            statement.setObject(1, account.id());
            statement.setString(2, account.pan());
            statement.setString(3, account.fullName());
            statement.setDate(4, account.dateOfBirth() == null ? null : Date.valueOf(account.dateOfBirth()));
            statement.setString(5, account.mobile());
            statement.setString(6, account.email());
            statement.setString(7, account.passwordHash());
            statement.setString(8, account.personalisedMessage());
            statement.setString(9, account.status().name());
            setInstant(statement, 10, account.mobileVerifiedAt());
            setInstant(statement, 11, account.emailVerifiedAt());
            statement.setTimestamp(12, Timestamp.from(account.createdAt()));
            setInstant(statement, 13, account.activatedAt());
            statement.executeUpdate();
            return account;
        } catch (SQLException exception) {
            // The UNIQUE constraint on pan is what actually enforces one account per PAN, so two
            // concurrent registrations cannot both succeed.
            if ("23505".equals(exception.getSQLState())) {
                throw new IllegalStateException("An account already exists for this PAN", exception);
            }
            throw failure("create the account", exception);
        }
    }

    @Override
    public Account update(Account account) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(UPDATE)) {
            statement.setString(1, account.fullName());
            statement.setDate(2, account.dateOfBirth() == null ? null : Date.valueOf(account.dateOfBirth()));
            statement.setString(3, account.mobile());
            statement.setString(4, account.email());
            statement.setString(5, account.passwordHash());
            statement.setString(6, account.personalisedMessage());
            statement.setString(7, account.status().name());
            setInstant(statement, 8, account.mobileVerifiedAt());
            setInstant(statement, 9, account.emailVerifiedAt());
            setInstant(statement, 10, account.activatedAt());
            statement.setString(11, account.pan());
            statement.executeUpdate();
            return account;
        } catch (SQLException exception) {
            throw failure("update the account", exception);
        }
    }

    @Override
    public Optional<Account> byPan(String pan) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(BY_PAN)) {
            statement.setString(1, pan);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? Optional.of(read(result)) : Optional.empty();
            }
        } catch (SQLException exception) {
            throw failure("read the account", exception);
        }
    }

    private static void setInstant(PreparedStatement statement, int index, Instant value)
            throws SQLException {
        statement.setTimestamp(index, value == null ? null : Timestamp.from(value));
    }

    private static Instant instant(ResultSet result, String column) throws SQLException {
        Timestamp value = result.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private static Account read(ResultSet result) throws SQLException {
        Date dob = result.getDate("date_of_birth");
        LocalDate dateOfBirth = dob == null ? null : dob.toLocalDate();
        return new Account(
                result.getObject("id", UUID.class),
                result.getString("pan"),
                result.getString("full_name"),
                dateOfBirth,
                result.getString("mobile"),
                result.getString("email"),
                result.getString("password_hash"),
                result.getString("personalised_message"),
                Account.Status.valueOf(result.getString("status")),
                instant(result, "mobile_verified_at"),
                instant(result, "email_verified_at"),
                result.getTimestamp("created_at").toInstant(),
                instant(result, "activated_at"));
    }

    private static IllegalStateException failure(String what, SQLException exception) {
        return new IllegalStateException("Could not " + what, exception);
    }
}

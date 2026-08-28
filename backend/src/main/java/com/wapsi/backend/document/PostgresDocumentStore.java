package com.wapsi.backend.document;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import javax.sql.DataSource;

/** PostgreSQL adapter for the stored_document table in V8__document.sql. */
public final class PostgresDocumentStore implements DocumentStore {
    private static final String INSERT = """
            INSERT INTO stored_document (
                id, citizen_reference, assessment_year, doc_type, filename,
                content_type, content, uploaded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String BY_ID = """
            SELECT id, citizen_reference, assessment_year, doc_type, filename,
                   content_type, content, uploaded_at
              FROM stored_document
             WHERE citizen_reference = ? AND id = ?
            """;

    private static final String LIST = """
            SELECT id, citizen_reference, assessment_year, doc_type, filename,
                   content_type, content, uploaded_at
              FROM stored_document
             WHERE citizen_reference = ?
               AND (?::varchar IS NULL OR assessment_year = ?)
               AND (?::varchar IS NULL OR doc_type = ?)
             ORDER BY uploaded_at DESC
            """;

    private final DataSource dataSource;

    public PostgresDocumentStore(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public StoredDocument save(StoredDocument document) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(INSERT)) {
            statement.setObject(1, document.id());
            statement.setString(2, document.citizenReference());
            statement.setString(3, document.assessmentYear());
            statement.setString(4, document.docType());
            statement.setString(5, document.filename());
            statement.setString(6, document.contentType());
            statement.setBytes(7, document.content());
            statement.setTimestamp(8, Timestamp.from(document.uploadedAt()));
            statement.executeUpdate();
            return document;
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not store the document", exception);
        }
    }

    @Override
    public Optional<StoredDocument> byId(String citizenReference, UUID id) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(BY_ID)) {
            statement.setString(1, citizenReference);
            statement.setObject(2, id);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? Optional.of(read(result)) : Optional.empty();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not read the document", exception);
        }
    }

    @Override
    public List<StoredDocument> list(String citizenReference, String assessmentYear, String docType) {
        if (citizenReference == null || citizenReference.isBlank()) {
            return List.of();
        }
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(LIST)) {
            statement.setString(1, citizenReference);
            statement.setString(2, assessmentYear);
            statement.setString(3, assessmentYear);
            statement.setString(4, docType);
            statement.setString(5, docType);
            try (ResultSet result = statement.executeQuery()) {
                List<StoredDocument> documents = new ArrayList<>();
                while (result.next()) {
                    documents.add(read(result));
                }
                return List.copyOf(documents);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not list the documents", exception);
        }
    }

    private static StoredDocument read(ResultSet result) throws SQLException {
        return new StoredDocument(
                result.getObject("id", UUID.class),
                result.getString("citizen_reference"),
                result.getString("assessment_year"),
                result.getString("doc_type"),
                result.getString("filename"),
                result.getString("content_type"),
                result.getBytes("content"),
                result.getTimestamp("uploaded_at").toInstant());
    }
}

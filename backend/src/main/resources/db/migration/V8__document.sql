CREATE TABLE stored_document (
    id UUID NOT NULL,
    citizen_reference VARCHAR(64) NOT NULL,
    assessment_year VARCHAR(9) NOT NULL,
    doc_type VARCHAR(32) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(64) NOT NULL,
    content BYTEA NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX stored_document_owner_idx
    ON stored_document (citizen_reference, assessment_year, doc_type);

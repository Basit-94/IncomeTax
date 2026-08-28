CREATE TABLE submission (
    idempotency_key VARCHAR(128) NOT NULL,
    submission_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL,
    rule_set_version VARCHAR(64) NOT NULL,
    total_tax_paise BIGINT,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (idempotency_key),
    CONSTRAINT submission_submission_id_key UNIQUE (submission_id)
)

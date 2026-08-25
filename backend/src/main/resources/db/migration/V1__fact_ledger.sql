CREATE TABLE fact_event (
    id UUID NOT NULL,
    return_id UUID NOT NULL,
    assessment_year VARCHAR(9) NOT NULL,
    kind VARCHAR(64) NOT NULL,
    value_paise BIGINT NOT NULL,
    reported_by VARCHAR(255) NOT NULL,
    source_document VARCHAR(255) NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL,
    confirmed_by_user_at TIMESTAMPTZ,
    supersedes_fact_id UUID,
    correction_reason TEXT,
    PRIMARY KEY (assessment_year, id)
) PARTITION BY LIST (assessment_year);

CREATE TABLE fact_event_2026_27 PARTITION OF fact_event
    FOR VALUES IN ('2026-27');

CREATE INDEX fact_event_return_idx ON fact_event (return_id, reported_at);
CREATE INDEX fact_event_supersedes_idx ON fact_event (supersedes_fact_id);

ALTER TABLE submission ADD COLUMN citizen_reference VARCHAR(64);
ALTER TABLE submission ADD COLUMN assessment_year VARCHAR(9);

CREATE INDEX submission_owner_idx ON submission (citizen_reference, assessment_year, created_at DESC);

CREATE TABLE otp_challenge (
    id UUID NOT NULL,
    target VARCHAR(255) NOT NULL,
    channel VARCHAR(16) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    PRIMARY KEY (id)
);

CREATE INDEX otp_challenge_target_idx ON otp_challenge (target, channel, issued_at DESC);

CREATE TABLE user_session (
    id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    PRIMARY KEY (id),
    CONSTRAINT user_session_token_key UNIQUE (token_hash)
);

CREATE INDEX user_session_pan_idx ON user_session (pan, expires_at DESC);

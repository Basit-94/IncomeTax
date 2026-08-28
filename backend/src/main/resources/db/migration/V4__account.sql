CREATE TABLE account (
    id UUID NOT NULL,
    pan VARCHAR(10) NOT NULL,
    full_name VARCHAR(255),
    date_of_birth DATE,
    mobile VARCHAR(20),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    personalised_message VARCHAR(255),
    status VARCHAR(16) NOT NULL,
    mobile_verified_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    activated_at TIMESTAMPTZ,
    PRIMARY KEY (id),
    CONSTRAINT account_pan_key UNIQUE (pan)
);

CREATE INDEX account_status_idx ON account (status);

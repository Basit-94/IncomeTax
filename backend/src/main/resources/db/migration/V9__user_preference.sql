-- T5.1: the Simple / Full-detail mode is a first-class user setting that follows the
-- user across devices. Kept apart from account: identity rarely changes, preferences do.
CREATE TABLE IF NOT EXISTS user_preference (
    pan        varchar(10) PRIMARY KEY,
    mode       varchar(10) NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT user_preference_mode CHECK (mode IN ('simple', 'full'))
);

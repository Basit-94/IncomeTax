/**
 * The whole server-side schema, as ordered migrations. Portable SQL: no SQLite-only
 * types beyond BLOB/TEXT/INTEGER, so the same statements move to Postgres (plan K1)
 * with `BLOB` → `BYTEA` and nothing else.
 *
 * Rule of the file: append a migration, never edit one that has shipped. The version
 * stored in `PRAGMA user_version` is the number of migrations applied.
 */
export const MIGRATIONS: readonly string[] = [
  // 1 — users, sessions (plan §3.2)
  `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    onboarded_at TEXT,
    onboarding_json TEXT,
    mode TEXT NOT NULL DEFAULT 'agentic' CHECK (mode IN ('agentic','manual')),
    lang TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark')),
    vault_key_wrapped BLOB
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);
  `,
  // 2 — vault: slots, documents, audit (plan §3.2, §4.2)
  `
  CREATE TABLE slots (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_id TEXT NOT NULL,
    ciphertext BLOB NOT NULL,
    iv BLOB NOT NULL,
    tag BLOB NOT NULL,
    masked TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('user','digilocker','document','persona')),
    verified INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, slot_id)
  );
  CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    assessment_year TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    bytes BLOB NOT NULL,
    sha256 TEXT NOT NULL,
    source TEXT NOT NULL,
    extracted_json TEXT,
    uploaded_at TEXT NOT NULL
  );
  CREATE INDEX documents_user ON documents(user_id, doc_type);
  CREATE UNIQUE INDEX documents_dedupe ON documents(user_id, sha256);
  CREATE TABLE vault_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    at TEXT NOT NULL,
    actor TEXT NOT NULL CHECK (actor IN ('user','agent','system')),
    action TEXT NOT NULL,
    slot_id TEXT,
    document_id TEXT,
    run_id TEXT,
    detail TEXT
  );
  CREATE INDEX vault_audit_user ON vault_audit(user_id, id);
  `,
  // 3 — memory, runs, events, outputs, cap, returns (plan §3.2, §3.6)
  `
  CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    source_run_id TEXT,
    at TEXT NOT NULL,
    UNIQUE (user_id, key)
  );
  CREATE TABLE runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    plan_json TEXT,
    state_json TEXT NOT NULL
  );
  CREATE INDEX runs_user ON runs(user_id, updated_at);
  CREATE TABLE run_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    at TEXT NOT NULL,
    type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    UNIQUE (run_id, seq)
  );
  CREATE TABLE outputs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    bytes BLOB NOT NULL,
    at TEXT NOT NULL
  );
  CREATE TABLE question_usage (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    day TEXT NOT NULL
  );
  CREATE TABLE returns (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  // 4 — DigiLocker link (plan D8, task 3.3): one row per linked account; issued documents are
  //     re-derived on every pull, so nothing from the "locker" is cached here.
  `
  CREATE TABLE digilocker_links (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    linked_at TEXT NOT NULL,
    scope TEXT NOT NULL
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

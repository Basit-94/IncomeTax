/**
 * Schema migrations (plan.md §4.1: "Use migrations rather than creating tables
 * opportunistically in every request").
 *
 * Each entry is applied once, in order, inside its own transaction, and its id
 * is recorded in `schema_migrations`. The first migration is the existing
 * `tax_vault_users` table exactly as lib/db/postgres.ts used to create it on
 * every request, so a database that already has the table gains a
 * `schema_migrations` row and nothing else — current rows and vault ids are
 * preserved (§4.1).
 *
 * SQL lives here as strings rather than .sql files because a Next.js route
 * handler cannot rely on the source tree being on disk at runtime.
 */

export interface Migration {
  id: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    id: "0001_baseline_tax_vault_users",
    sql: `
      CREATE TABLE IF NOT EXISTS tax_vault_users (
        id VARCHAR(64) PRIMARY KEY,
        pan VARCHAR(10) UNIQUE NOT NULL,
        aadhaar VARCHAR(20),
        full_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        email VARCHAR(255),
        date_of_birth VARCHAR(20),
        assessment_year VARCHAR(9) DEFAULT '2026-27',
        status VARCHAR(20) DEFAULT 'active',
        vault_data JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_tax_vault_pan ON tax_vault_users(pan);
    `,
  },
  {
    // Server-managed sessions (§3.2). Only the SHA-256 of the cookie value is
    // stored, mirroring the Java backend's hashed session tokens.
    id: "0002_sessions",
    sql: `
      CREATE TABLE IF NOT EXISTS wapsi_sessions (
        id_hash CHAR(64) PRIMARY KEY,
        pan VARCHAR(10) NOT NULL,
        owner_kind VARCHAR(16) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        session_kind VARCHAR(16) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_wapsi_sessions_expires ON wapsi_sessions(expires_at);
    `,
  },
  {
    // The document service (§3.1, §4.1). Bytes live in their own table so a
    // metadata listing never drags ciphertext across the wire, and so byte
    // storage can move to private object storage behind the same interface.
    id: "0003_vault_documents",
    sql: `
      CREATE TABLE IF NOT EXISTS vault_documents (
        id VARCHAR(64) PRIMARY KEY,
        owner_pan VARCHAR(10) NOT NULL,
        owner_kind VARCHAR(16) NOT NULL,
        assessment_year VARCHAR(9) NOT NULL,
        doc_type VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        filename VARCHAR(255),
        mime_type VARCHAR(64),
        byte_length INTEGER NOT NULL DEFAULT 0,
        sha256 CHAR(64),
        issuer VARCHAR(255),
        provenance VARCHAR(24) NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        supersedes VARCHAR(64),
        uploaded_at TIMESTAMPTZ NOT NULL,
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_vault_documents_owner
        ON vault_documents(owner_pan, assessment_year, doc_type);
      CREATE INDEX IF NOT EXISTS idx_vault_documents_sha
        ON vault_documents(owner_pan, sha256);

      CREATE TABLE IF NOT EXISTS vault_document_bytes (
        document_id VARCHAR(64) PRIMARY KEY REFERENCES vault_documents(id) ON DELETE CASCADE,
        iv BYTEA NOT NULL,
        auth_tag BYTEA NOT NULL,
        ciphertext BYTEA NOT NULL,
        key_id VARCHAR(32) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vault_extractions (
        document_id VARCHAR(64) PRIMARY KEY REFERENCES vault_documents(id) ON DELETE CASCADE,
        sha256 CHAR(64),
        parser_version VARCHAR(64) NOT NULL,
        status VARCHAR(16) NOT NULL,
        fields JSONB NOT NULL DEFAULT '{}',
        issues JSONB NOT NULL DEFAULT '[]',
        review_state VARCHAR(16) NOT NULL DEFAULT 'unreviewed',
        extracted_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vault_access_audit (
        id BIGSERIAL PRIMARY KEY,
        owner_pan VARCHAR(10) NOT NULL,
        actor VARCHAR(32) NOT NULL,
        run_id VARCHAR(64),
        tool VARCHAR(64),
        document_id VARCHAR(64),
        operation VARCHAR(32) NOT NULL,
        result VARCHAR(32) NOT NULL,
        at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_vault_access_audit_owner ON vault_access_audit(owner_pan, at);
    `,
  },
  {
    // One server-owned return per owner and year (§3.3), with a monotonic
    // revision that is NOT ReturnState.version (that is a serialisation
    // version). Commands are idempotent by key.
    id: "0004_return_snapshots",
    sql: `
      CREATE TABLE IF NOT EXISTS return_snapshots (
        owner_pan VARCHAR(10) NOT NULL,
        owner_kind VARCHAR(16) NOT NULL,
        assessment_year VARCHAR(9) NOT NULL,
        revision INTEGER NOT NULL,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (owner_pan, owner_kind, assessment_year)
      );
      CREATE TABLE IF NOT EXISTS return_command_log (
        idempotency_key VARCHAR(128) PRIMARY KEY,
        owner_pan VARCHAR(10) NOT NULL,
        assessment_year VARCHAR(9) NOT NULL,
        command_type VARCHAR(48) NOT NULL,
        resulting_revision INTEGER NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL
      );
    `,
  },
  {
    // Durable runs, ordered events, outputs, typed memory, budgets (§5.4–5.5).
    id: "0005_agent_runs",
    sql: `
      CREATE TABLE IF NOT EXISTS agent_runs (
        id VARCHAR(64) PRIMARY KEY,
        owner_pan VARCHAR(10) NOT NULL,
        owner_kind VARCHAR(16) NOT NULL,
        assessment_year VARCHAR(9) NOT NULL,
        task VARCHAR(48) NOT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(24) NOT NULL,
        state JSONB NOT NULL,
        knowledge_release VARCHAR(32) NOT NULL,
        lang VARCHAR(8) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_agent_runs_owner ON agent_runs(owner_pan, updated_at DESC);

      CREATE TABLE IF NOT EXISTS agent_run_events (
        run_id VARCHAR(64) NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        seq INTEGER NOT NULL,
        at TIMESTAMPTZ NOT NULL,
        type VARCHAR(32) NOT NULL,
        payload JSONB NOT NULL,
        PRIMARY KEY (run_id, seq)
      );

      CREATE TABLE IF NOT EXISTS agent_outputs (
        id VARCHAR(64) PRIMARY KEY,
        run_id VARCHAR(64) NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        owner_pan VARCHAR(10) NOT NULL,
        kind VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        snapshot_revision INTEGER NOT NULL,
        snapshot_hash CHAR(64) NOT NULL,
        mime_type VARCHAR(64) NOT NULL,
        body BYTEA NOT NULL,
        synthetic BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agent_memory (
        owner_pan VARCHAR(10) NOT NULL,
        key VARCHAR(64) NOT NULL,
        value JSONB NOT NULL,
        source_run VARCHAR(64),
        valid_for_year VARCHAR(9),
        updated_at TIMESTAMPTZ NOT NULL,
        deleted_at TIMESTAMPTZ,
        PRIMARY KEY (owner_pan, key)
      );

      CREATE TABLE IF NOT EXISTS agent_budget_usage (
        owner_pan VARCHAR(10) NOT NULL,
        day DATE NOT NULL,
        tokens INTEGER NOT NULL DEFAULT 0,
        model_calls INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (owner_pan, day)
      );
    `,
  },
];

/** Ids must be unique and sorted, or the runner would apply them in a surprising order. */
export function validateMigrations(list: readonly Migration[] = MIGRATIONS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  let previous = "";
  for (const m of list) {
    if (seen.has(m.id)) problems.push(`duplicate id ${m.id}`);
    seen.add(m.id);
    if (m.id <= previous) problems.push(`${m.id} is not after ${previous}`);
    previous = m.id;
    if (!m.sql.trim()) problems.push(`${m.id} has no SQL`);
  }
  return problems;
}

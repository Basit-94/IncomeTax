import { Pool, type QueryResult } from "pg";
import { runMigrations } from "./migrate";

export interface VaultUserRow {
  id: string;
  pan: string;
  aadhaar?: string | null;
  full_name: string;
  mobile?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  assessment_year?: string | null;
  status?: string | null;
  vault_data?: Record<string, unknown> | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

let pool: Pool | null = null;
let dbInitialized = false;

/** The connection string an operator actually configured, or null. */
function configuredConnectionString(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.WAPSI_DATASOURCE_URL?.replace("jdbc:", "") ||
    null
  );
}

/**
 * True only when a database was explicitly configured (plan.md §2: "Verify
 * deployment capabilities before relying on them; comments are not evidence of
 * configured infrastructure"). The agentic services check this before touching
 * the pool, so an unconfigured deployment answers "storage unavailable" in
 * milliseconds instead of waiting on a connection timeout to localhost.
 * getDbPool() below keeps its localhost default for the legacy vault route.
 */
export function isDbConfigured(): boolean {
  return configuredConnectionString() !== null;
}

/**
 * Construct or return cached PG Pool.
 * Checks standard environment variables before falling back to local defaults.
 */
export function getDbPool(): Pool | null {
  if (pool) return pool;

  const connectionString =
    configuredConnectionString() ||
    "postgresql://postgres:postgres@localhost:5432/wapsi";

  try {
    const isCloudHost =
      connectionString.includes("supabase") ||
      connectionString.includes("sslmode=require") ||
      connectionString.includes("aws") ||
      connectionString.includes("pooler");

    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
      max: 5,
      ssl: isCloudHost ? { rejectUnauthorized: false } : undefined,
    });

    pool.on("error", (err) => {
      console.warn("[Cloud Vault DB] Client error:", err.message);
    });

    return pool;
  } catch (err) {
    console.warn("[PostgreSQL] Could not create connection pool:", err);
    return null;
  }
}

/**
 * Ensures the schema is current. Runs the migration list in lib/db/migrations.ts
 * once per process (§4.1) — the old per-request CREATE TABLE is now that list's
 * first entry, so existing databases keep every row and gain a history.
 */
export async function initDb(): Promise<{ ok: boolean; message: string }> {
  if (dbInitialized) return { ok: true, message: "Already initialized" };

  const db = getDbPool();
  if (!db) {
    return { ok: false, message: "Database pool not available" };
  }

  try {
    const { applied } = await runMigrations(db);
    dbInitialized = true;
    return {
      ok: true,
      message: applied.length ? `Applied migrations: ${applied.join(", ")}` : "Schema current",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[PostgreSQL] Init table warning (fallback mode active):", msg);
    return { ok: false, message: msg };
  }
}

/**
 * Saves or updates a user vault record in PostgreSQL.
 */
export async function upsertVaultUser(
  user: Omit<VaultUserRow, "created_at" | "updated_at">
): Promise<{ ok: boolean; user?: VaultUserRow; error?: string; isFallback?: boolean }> {
  const db = getDbPool();
  if (!db) {
    return { ok: false, error: "Postgres not configured", isFallback: true };
  }

  await initDb();

  const query = `
    INSERT INTO tax_vault_users (
      id, pan, aadhaar, full_name, mobile, email, date_of_birth, assessment_year, status, vault_data, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    ON CONFLICT (pan) DO UPDATE SET
      aadhaar = COALESCE(EXCLUDED.aadhaar, tax_vault_users.aadhaar),
      full_name = EXCLUDED.full_name,
      mobile = COALESCE(EXCLUDED.mobile, tax_vault_users.mobile),
      email = COALESCE(EXCLUDED.email, tax_vault_users.email),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, tax_vault_users.date_of_birth),
      assessment_year = EXCLUDED.assessment_year,
      status = EXCLUDED.status,
      vault_data = tax_vault_users.vault_data || EXCLUDED.vault_data,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const values = [
    user.id || `vault_${user.pan}_${Date.now()}`,
    user.pan.toUpperCase(),
    user.aadhaar || null,
    user.full_name,
    user.mobile || null,
    user.email || null,
    user.date_of_birth || null,
    user.assessment_year || "2026-27",
    user.status || "active",
    JSON.stringify(user.vault_data || {}),
  ];

  try {
    const res: QueryResult<VaultUserRow> = await db.query(query, values);
    return { ok: true, user: res.rows[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[PostgreSQL] Error in upsertVaultUser:", msg);
    return { ok: false, error: msg, isFallback: true };
  }
}

/**
 * Retrieves a user vault record by PAN.
 */
export async function getVaultUserByPan(
  pan: string
): Promise<{ ok: boolean; user?: VaultUserRow; error?: string; isFallback?: boolean }> {
  const db = getDbPool();
  if (!db) {
    return { ok: false, error: "Postgres not configured", isFallback: true };
  }

  await initDb();

  try {
    const res: QueryResult<VaultUserRow> = await db.query(
      "SELECT * FROM tax_vault_users WHERE pan = $1 LIMIT 1",
      [pan.toUpperCase()]
    );
    if (res.rows.length === 0) {
      return { ok: false, error: "User not found" };
    }
    return { ok: true, user: res.rows[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[PostgreSQL] Error in getVaultUserByPan:", msg);
    return { ok: false, error: msg, isFallback: true };
  }
}

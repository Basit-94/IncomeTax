import type { Pool } from "pg";
import { MIGRATIONS, validateMigrations, type Migration } from "./migrations";

/**
 * Apply every migration not yet recorded in `schema_migrations`, each in its
 * own transaction. Idempotent: running it twice applies nothing the second
 * time. Returns the ids applied on this call so a caller can log them.
 */
export async function runMigrations(
  pool: Pool,
  list: readonly Migration[] = MIGRATIONS,
): Promise<{ applied: string[] }> {
  const problems = validateMigrations(list);
  if (problems.length) throw new Error(`Invalid migration list: ${problems.join("; ")}`);

  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(64) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const done = new Set(
      (await client.query<{ id: string }>("SELECT id FROM schema_migrations")).rows.map((r) => r.id),
    );
    for (const m of list) {
      if (done.has(m.id)) continue;
      await client.query("BEGIN");
      try {
        await client.query(m.sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
        await client.query("COMMIT");
        applied.push(m.id);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
  }
  return { applied };
}

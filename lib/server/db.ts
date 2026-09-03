/**
 * The one database handle (plan D2). SQLite through Node's built-in module: no native
 * dependency, no daemon, one file under `data/` (gitignored). Tests open `:memory:`.
 *
 * Server-only. Nothing under `lib/server/` may be imported from a client component;
 * `node:sqlite` does not exist in the browser and Turbopack will say so loudly.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { MIGRATIONS } from "./schema";

const registry = globalThis as unknown as { __wapsiDb?: DatabaseSync; __wapsiDbPath?: string };

export function dbPath(): string {
  return process.env.WAPSI_DB_PATH ?? "data/wapsi.db";
}

/** Open a database at `path` and bring it to the current schema version. */
export function openDb(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const handle = new DatabaseSync(path);
  handle.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrate(handle);
  return handle;
}

function migrate(handle: DatabaseSync): void {
  const row = handle.prepare("PRAGMA user_version").get() as { user_version: number };
  let version = row.user_version;
  while (version < MIGRATIONS.length) {
    handle.exec("BEGIN");
    try {
      handle.exec(MIGRATIONS[version]);
      version += 1;
      handle.exec(`PRAGMA user_version = ${version}`);
      handle.exec("COMMIT");
    } catch (error) {
      handle.exec("ROLLBACK");
      throw error;
    }
  }
}

/** The process-wide handle. Cached on globalThis so `next dev` HMR does not reopen it. */
export function db(): DatabaseSync {
  if (!registry.__wapsiDb) {
    const path = dbPath();
    registry.__wapsiDb = openDb(path);
    registry.__wapsiDbPath = path;
  } else {
    // `next dev` keeps the handle across hot reloads; a migration added meanwhile must still apply.
    migrate(registry.__wapsiDb);
  }
  return registry.__wapsiDb;
}

/** Tests: throw the current handle away and start from an empty in-memory database. */
export function resetDbForTests(): DatabaseSync {
  registry.__wapsiDb?.close();
  registry.__wapsiDb = openDb(":memory:");
  registry.__wapsiDbPath = ":memory:";
  return registry.__wapsiDb;
}

export function nowIso(): string {
  return new Date().toISOString();
}

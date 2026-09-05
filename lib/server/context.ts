/**
 * Server-side wiring: one place that decides which stores exist in this
 * deployment, so every route and tool asks the same question and gets the
 * same answer (plan.md §3.1: "Do not introduce two simultaneous authoritative
 * stores").
 *
 * With a configured database: sessions, documents, returns and runs persist in
 * PostgreSQL. Without one: sessions live in process memory (a restart signs
 * everyone out — stated, not hidden), and the document/return/run services
 * report `storage_unavailable` rather than inventing a place to write.
 */

import type { Pool } from "pg";
import { NextResponse, type NextRequest } from "next/server";
import { getDbPool, initDb, isDbConfigured } from "../db/postgres";
import {
  MemorySessionStore,
  SessionResolver,
  type ServerSession,
  type SessionStore,
} from "./session";
import { loadVaultKey } from "../vault/crypto";
import { PostgresVaultRepository } from "../vault/postgres-repository";
import { VaultService } from "../vault/service";
import { MemoryReturnStore, PostgresReturnStore, type ReturnSnapshotStore } from "../return/snapshot-store";
import { MemoryRunStore, PostgresRunStore, type RunStore } from "../agentic/store";
import { geminiModel, type ModelAdapter } from "../agentic/model";
import { runBudget } from "../agentic/types";
import type { RuntimeDeps } from "../agentic/runtime";

/* --------------------------------------------------------- session stores -- */

class PostgresSessionStore implements SessionStore {
  constructor(private readonly pool: Pool) {}
  async get(idHash: string): Promise<ServerSession | null> {
    const res = await this.pool.query<{
      pan: string; owner_kind: ServerSession["owner"]["kind"]; display_name: string;
      session_kind: ServerSession["kind"]; created_at: Date; expires_at: Date;
    }>("SELECT * FROM wapsi_sessions WHERE id_hash = $1", [idHash]);
    const r = res.rows[0];
    if (!r) return null;
    return {
      id: "", // the raw id is never stored; callers already hold it
      owner: { pan: r.pan, kind: r.owner_kind, displayName: r.display_name },
      kind: r.session_kind,
      createdAt: new Date(r.created_at).toISOString(),
      expiresAt: new Date(r.expires_at).toISOString(),
    };
  }
  async put(idHash: string, s: ServerSession) {
    await this.pool.query(
      `INSERT INTO wapsi_sessions (id_hash, pan, owner_kind, display_name, session_kind, created_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id_hash) DO NOTHING`,
      [idHash, s.owner.pan, s.owner.kind, s.owner.displayName, s.kind, s.createdAt, s.expiresAt],
    );
  }
  async delete(idHash: string) {
    await this.pool.query("DELETE FROM wapsi_sessions WHERE id_hash = $1", [idHash]);
  }
}

/* ---------------------------------------------------------------- services -- */

export interface Services {
  dbConfigured: boolean;
  sessions: SessionResolver;
  /** Null when no database is configured — callers answer storage_unavailable. */
  vault: VaultService | null;
  /** The durable return store; null without a database. */
  returns: ReturnSnapshotStore | null;
  /**
   * Process-lifetime store for DEMO owners only, used when no database exists
   * (plan §3.2: demo sessions are "isolated to synthetic fixture data"). Losing
   * it on restart is disclosed by `durable: false` in every response.
   */
  demoReturns: ReturnSnapshotStore;
  /** Durable run store; null without a database. */
  runs: RunStore | null;
  /** Process-lifetime run store for demo owners without a database. */
  demoRuns: RunStore;
  model: ModelAdapter;
  pool: Pool | null;
}

/** Which return store a session may write to. Citizen owners need the durable one. */
export function returnStoreFor(services: Services, session: ServerSession): ReturnSnapshotStore | null {
  if (services.returns) return services.returns;
  return session.owner.kind === "demo" ? services.demoReturns : null;
}

export function runStoreFor(services: Services, session: ServerSession): RunStore | null {
  if (services.runs) return services.runs;
  return session.owner.kind === "demo" ? services.demoRuns : null;
}

/** Everything the workflow harness needs for this session, or null when storage is unavailable. */
export function runtimeFor(services: Services, session: ServerSession): RuntimeDeps | null {
  const store = runStoreFor(services, session);
  const returns = returnStoreFor(services, session);
  if (!store || !returns) return null;
  return {
    store,
    returns,
    vault: services.vault,
    model: services.model,
    budget: runBudget(),
    clock: () => new Date().toISOString(),
    today: () => new Date().toISOString().slice(0, 10),
  };
}

let cached: Promise<Services> | null = null;

export function getServices(): Promise<Services> {
  if (!cached) cached = build();
  return cached;
}

async function build(): Promise<Services> {
  const dbConfigured = isDbConfigured();
  let pool: Pool | null = null;
  if (dbConfigured) {
    pool = getDbPool();
    const init = await initDb();
    if (!init.ok) {
      console.warn("[wapsi] database configured but unusable:", init.message);
      pool = null;
    }
  }
  const store: SessionStore = pool ? new PostgresSessionStore(pool) : new MemorySessionStore();
  return {
    dbConfigured: !!pool,
    sessions: new SessionResolver(store),
    vault: pool ? new VaultService(new PostgresVaultRepository(pool), loadVaultKey()) : null,
    returns: pool ? new PostgresReturnStore(pool) : null,
    demoReturns: new MemoryReturnStore(),
    runs: pool ? new PostgresRunStore(pool) : null,
    demoRuns: new MemoryRunStore(),
    model: geminiModel(),
    pool,
  };
}

/** Tests swap the wiring; production never calls this. */
export function __setServicesForTests(services: Services | null) {
  cached = services ? Promise.resolve(services) : null;
}

/* ------------------------------------------------------------------- guards -- */

export function isSecureRequest(req: NextRequest): boolean {
  return req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
}

export type Guarded =
  | { ok: true; session: ServerSession; services: Services }
  | { ok: false; response: NextResponse };

/** Resolve the caller or produce the 401 every owner-scoped route returns. */
export async function requireSession(req: NextRequest): Promise<Guarded> {
  const services = await getServices();
  const session = await services.sessions.resolve(req.headers.get("cookie"));
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "not_signed_in", message: "Sign in to use the vault." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session, services };
}

export function storageUnavailable(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "storage_unavailable",
      message: "No document database is configured for this deployment, so files cannot be stored. Nothing was saved.",
    },
    { status: 503 },
  );
}

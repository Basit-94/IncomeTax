/**
 * One server-owned return per owner and assessment year (plan.md §3.3), with a
 * monotonic revision for concurrency. `ReturnState.version` is a serialisation
 * version and is untouched; `revision` here counts accepted writes.
 *
 * Two write paths, same rules:
 *  - `apply`   — a command with an expected revision and an idempotency key.
 *                A stale expectation is a conflict that returns the current
 *                snapshot; a repeated key returns the result it produced the
 *                first time without re-running the command.
 *  - `replace` — the manual journey mirroring its whole local state, also with
 *                an expected revision, so it cannot silently overwrite a write
 *                the agent made in between (§3.3: "An agent must not overwrite a
 *                newer manual edit" — and vice versa).
 */

import type { Pool } from "pg";
import type { Owner } from "../server/session";
import { applyReturnCommand, defaultCommandContext, type CommandContext, type ReturnCommand } from "./commands";
import type { ReturnState } from "./state";

export interface VersionedReturn {
  state: ReturnState;
  revision: number;
  updatedAt: string;
}

export interface CommandEnvelope {
  command: ReturnCommand;
  expectedRevision: number;
  idempotencyKey: string;
  actor: "citizen" | "agent";
}

export type ApplyResult =
  | { ok: true; snapshot: VersionedReturn; changed: boolean; replayed: boolean }
  | { ok: false; error: "conflict"; current: VersionedReturn }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "rejected"; message: string; current: VersionedReturn };

export interface ReturnSnapshotStore {
  get(owner: Owner, assessmentYear: string): Promise<VersionedReturn | null>;
  /** Create (revision 1) or replace with an expected revision. */
  replace(owner: Owner, assessmentYear: string, state: ReturnState, expectedRevision: number | null): Promise<ApplyResult>;
  apply(owner: Owner, assessmentYear: string, envelope: CommandEnvelope): Promise<ApplyResult>;
}

/* ------------------------------------------------------------------ memory -- */

/**
 * Process-lifetime store. Used for demo owners when no database is configured
 * — their data is synthetic and losing it on restart is disclosed — and by the
 * tests. Citizen owners never land here (see lib/server/context.ts).
 */
export class MemoryReturnStore implements ReturnSnapshotStore {
  private readonly rows = new Map<string, VersionedReturn>();
  private readonly commands = new Map<string, ApplyResult>();

  constructor(private readonly ctx: CommandContext = defaultCommandContext) {}

  private key(owner: Owner, ay: string) {
    return `${owner.kind}:${owner.pan}:${ay}`;
  }

  async get(owner: Owner, ay: string) {
    return this.rows.get(this.key(owner, ay)) ?? null;
  }

  async replace(owner: Owner, ay: string, state: ReturnState, expectedRevision: number | null): Promise<ApplyResult> {
    const key = this.key(owner, ay);
    const current = this.rows.get(key) ?? null;
    if (current && expectedRevision !== null && expectedRevision !== current.revision) {
      return { ok: false, error: "conflict", current };
    }
    const snapshot: VersionedReturn = { state, revision: (current?.revision ?? 0) + 1, updatedAt: this.ctx.now() };
    this.rows.set(key, snapshot);
    return { ok: true, snapshot, changed: true, replayed: false };
  }

  async apply(owner: Owner, ay: string, envelope: CommandEnvelope): Promise<ApplyResult> {
    const key = this.key(owner, ay);
    const replay = this.commands.get(`${key}#${envelope.idempotencyKey}`);
    if (replay) return replay.ok ? { ...replay, replayed: true } : replay;

    const current = this.rows.get(key);
    if (!current) return { ok: false, error: "not_found" };
    if (envelope.expectedRevision !== current.revision) return { ok: false, error: "conflict", current };

    const result = applyReturnCommand(current.state, envelope.command, this.ctx);
    let outcome: ApplyResult;
    if (!result.ok) {
      outcome = { ok: false, error: "rejected", message: result.message, current };
    } else if (!result.changed) {
      outcome = { ok: true, snapshot: current, changed: false, replayed: false };
    } else {
      const snapshot: VersionedReturn = { state: result.state, revision: current.revision + 1, updatedAt: this.ctx.now() };
      this.rows.set(key, snapshot);
      outcome = { ok: true, snapshot, changed: true, replayed: false };
    }
    this.commands.set(`${key}#${envelope.idempotencyKey}`, outcome);
    return outcome;
  }
}

/* ---------------------------------------------------------------- postgres -- */

export class PostgresReturnStore implements ReturnSnapshotStore {
  constructor(private readonly pool: Pool, private readonly ctx: CommandContext = defaultCommandContext) {}

  async get(owner: Owner, ay: string) {
    const res = await this.pool.query<{ revision: number; state: ReturnState; updated_at: Date }>(
      "SELECT revision, state, updated_at FROM return_snapshots WHERE owner_pan = $1 AND owner_kind = $3 AND assessment_year = $2",
      [owner.pan, ay, owner.kind],
    );
    const r = res.rows[0];
    return r ? { state: r.state, revision: r.revision, updatedAt: new Date(r.updated_at).toISOString() } : null;
  }

  async replace(owner: Owner, ay: string, state: ReturnState, expectedRevision: number | null): Promise<ApplyResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const cur = await client.query<{ revision: number; state: ReturnState; updated_at: Date }>(
        "SELECT revision, state, updated_at FROM return_snapshots WHERE owner_pan = $1 AND owner_kind = $3 AND assessment_year = $2 FOR UPDATE",
        [owner.pan, ay, owner.kind],
      );
      const current = cur.rows[0];
      if (current && expectedRevision !== null && expectedRevision !== current.revision) {
        await client.query("ROLLBACK");
        return { ok: false, error: "conflict", current: { state: current.state, revision: current.revision, updatedAt: new Date(current.updated_at).toISOString() } };
      }
      const revision = (current?.revision ?? 0) + 1;
      const updatedAt = this.ctx.now();
      await client.query(
        `INSERT INTO return_snapshots (owner_pan, owner_kind, assessment_year, revision, state, updated_at)
         VALUES ($1,$6,$2,$3,$4::jsonb,$5)
         ON CONFLICT (owner_pan, owner_kind, assessment_year) DO UPDATE SET revision = EXCLUDED.revision, state = EXCLUDED.state, updated_at = EXCLUDED.updated_at`,
        [owner.pan, ay, revision, JSON.stringify(state), updatedAt, owner.kind],
      );
      await client.query("COMMIT");
      return { ok: true, snapshot: { state, revision, updatedAt }, changed: true, replayed: false };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async apply(owner: Owner, ay: string, envelope: CommandEnvelope): Promise<ApplyResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const seen = await client.query<{ resulting_revision: number }>(
        "SELECT resulting_revision FROM return_command_log WHERE idempotency_key = $1 AND owner_pan = $2",
        [envelope.idempotencyKey, owner.pan],
      );
      const cur = await client.query<{ revision: number; state: ReturnState; updated_at: Date }>(
        "SELECT revision, state, updated_at FROM return_snapshots WHERE owner_pan = $1 AND owner_kind = $3 AND assessment_year = $2 FOR UPDATE",
        [owner.pan, ay, owner.kind],
      );
      const current = cur.rows[0];
      if (!current) {
        await client.query("ROLLBACK");
        return { ok: false, error: "not_found" };
      }
      const snapshotNow: VersionedReturn = { state: current.state, revision: current.revision, updatedAt: new Date(current.updated_at).toISOString() };
      if (seen.rows[0]) {
        await client.query("ROLLBACK");
        return { ok: true, snapshot: snapshotNow, changed: false, replayed: true };
      }
      if (envelope.expectedRevision !== current.revision) {
        await client.query("ROLLBACK");
        return { ok: false, error: "conflict", current: snapshotNow };
      }
      const result = applyReturnCommand(current.state, envelope.command, this.ctx);
      if (!result.ok) {
        await client.query("ROLLBACK");
        return { ok: false, error: "rejected", message: result.message, current: snapshotNow };
      }
      let snapshot = snapshotNow;
      if (result.changed) {
        snapshot = { state: result.state, revision: current.revision + 1, updatedAt: this.ctx.now() };
        await client.query(
          "UPDATE return_snapshots SET revision = $3, state = $4::jsonb, updated_at = $5 WHERE owner_pan = $1 AND owner_kind = $6 AND assessment_year = $2",
          [owner.pan, ay, snapshot.revision, JSON.stringify(snapshot.state), snapshot.updatedAt, owner.kind],
        );
      }
      await client.query(
        `INSERT INTO return_command_log (idempotency_key, owner_pan, assessment_year, command_type, resulting_revision, applied_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [envelope.idempotencyKey, owner.pan, ay, envelope.command.type, snapshot.revision, this.ctx.now()],
      );
      await client.query("COMMIT");
      return { ok: true, snapshot, changed: result.changed, replayed: false };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

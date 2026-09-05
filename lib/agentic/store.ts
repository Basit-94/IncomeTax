/**
 * Durable runs, events, outputs, memory and budgets (plan.md §5.4–5.5).
 *
 * Every transition is persisted BEFORE it is streamed: `appendEvent` writes
 * the row, then the SSE route reads from the store by cursor. A client that
 * reconnects asks for events after the last `seq` it saw and gets exactly the
 * rest — the store, not the process, is the source of truth.
 */

import { createHash } from "crypto";
import type { Pool } from "pg";
import type { Owner } from "../server/session";
import type { MemoryEntry, MemoryKey, OutputRef, Run, RunEvent, RunEventPayload, RunStatus } from "./types";

export interface StoredOutput extends OutputRef {
  runId: string;
  body: Uint8Array;
}

export interface RunStore {
  createRun(run: Run, first: RunEventPayload): Promise<RunEvent>;
  getRun(owner: Owner, id: string): Promise<Run | null>;
  listRuns(owner: Owner): Promise<Run[]>;
  saveRun(run: Run): Promise<void>;
  appendEvent(owner: Owner, runId: string, payload: RunEventPayload): Promise<RunEvent>;
  eventsAfter(owner: Owner, runId: string, afterSeq: number): Promise<RunEvent[]>;
  deleteRun(owner: Owner, id: string, at: string): Promise<boolean>;
  putOutput(owner: Owner, output: StoredOutput): Promise<void>;
  getOutput(owner: Owner, outputId: string): Promise<StoredOutput | null>;
  listOutputs(owner: Owner, runId: string): Promise<OutputRef[]>;
  getMemory(owner: Owner): Promise<MemoryEntry[]>;
  setMemory(owner: Owner, entry: MemoryEntry): Promise<void>;
  deleteMemory(owner: Owner, key: MemoryKey): Promise<boolean>;
  /** Add usage for today; returns the day's running total. */
  addDailyUsage(owner: Owner, day: string, tokens: number, modelCalls: number): Promise<{ tokens: number; modelCalls: number }>;
}

export function snapshotHash(state: unknown): string {
  return createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

export function newId(prefix: string): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

/* ------------------------------------------------------------------ memory -- */

/** Process-lifetime store: demo owners without a database, and the tests. */
export class MemoryRunStore implements RunStore {
  private readonly runs = new Map<string, Run>();
  private readonly events = new Map<string, RunEvent[]>();
  private readonly outputs = new Map<string, StoredOutput>();
  private readonly memory = new Map<string, MemoryEntry[]>();
  private readonly usage = new Map<string, { tokens: number; modelCalls: number }>();
  constructor(private readonly clock: () => string = () => new Date().toISOString()) {}

  private owned(owner: Owner, run: Run | undefined): Run | null {
    if (!run || run.deletedAt) return null;
    return run.ownerPan === owner.pan && run.ownerKind === owner.kind ? run : null;
  }

  async createRun(run: Run, first: RunEventPayload) {
    this.runs.set(run.id, { ...run });
    this.events.set(run.id, []);
    return this.appendEvent({ pan: run.ownerPan, kind: run.ownerKind, displayName: "" }, run.id, first);
  }
  async getRun(owner: Owner, id: string) {
    const r = this.owned(owner, this.runs.get(id));
    return r ? structuredClone(r) : null;
  }
  async listRuns(owner: Owner) {
    return [...this.runs.values()].filter((r) => this.owned(owner, r)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((r) => structuredClone(r));
  }
  async saveRun(run: Run) {
    this.runs.set(run.id, structuredClone({ ...run, updatedAt: this.clock() }));
  }
  async appendEvent(owner: Owner, runId: string, payload: RunEventPayload) {
    if (!this.owned(owner, this.runs.get(runId))) throw new Error("run not found");
    const list = this.events.get(runId)!;
    const event: RunEvent = { runId, seq: list.length + 1, at: this.clock(), payload: structuredClone(payload) };
    list.push(event);
    return event;
  }
  async eventsAfter(owner: Owner, runId: string, afterSeq: number) {
    if (!this.owned(owner, this.runs.get(runId))) return [];
    return (this.events.get(runId) ?? []).filter((e) => e.seq > afterSeq).map((e) => structuredClone(e));
  }
  async deleteRun(owner: Owner, id: string, at: string) {
    const r = this.owned(owner, this.runs.get(id));
    if (!r) return false;
    this.runs.set(id, { ...r, deletedAt: at });
    for (const [oid, o] of this.outputs) if (o.runId === id) this.outputs.delete(oid);
    return true;
  }
  async putOutput(owner: Owner, output: StoredOutput) {
    if (!this.owned(owner, this.runs.get(output.runId))) throw new Error("run not found");
    this.outputs.set(output.id, output);
  }
  async getOutput(owner: Owner, outputId: string) {
    const o = this.outputs.get(outputId);
    return o && this.owned(owner, this.runs.get(o.runId)) ? o : null;
  }
  async listOutputs(owner: Owner, runId: string) {
    if (!this.owned(owner, this.runs.get(runId))) return [];
    return [...this.outputs.values()].filter((o) => o.runId === runId).map(({ body: _b, runId: _r, ...ref }) => ref);
  }
  private memKey(owner: Owner) {
    return `${owner.kind}:${owner.pan}`;
  }
  async getMemory(owner: Owner) {
    return [...(this.memory.get(this.memKey(owner)) ?? [])];
  }
  async setMemory(owner: Owner, entry: MemoryEntry) {
    const list = (this.memory.get(this.memKey(owner)) ?? []).filter((e) => e.key !== entry.key);
    list.push(entry);
    this.memory.set(this.memKey(owner), list);
  }
  async deleteMemory(owner: Owner, key: MemoryKey) {
    const list = this.memory.get(this.memKey(owner)) ?? [];
    const next = list.filter((e) => e.key !== key);
    this.memory.set(this.memKey(owner), next);
    return next.length !== list.length;
  }
  async addDailyUsage(owner: Owner, day: string, tokens: number, modelCalls: number) {
    const k = `${this.memKey(owner)}:${day}`;
    const cur = this.usage.get(k) ?? { tokens: 0, modelCalls: 0 };
    const next = { tokens: cur.tokens + tokens, modelCalls: cur.modelCalls + modelCalls };
    this.usage.set(k, next);
    return next;
  }
}

/* ---------------------------------------------------------------- postgres -- */

interface RunRow {
  id: string; owner_pan: string; owner_kind: Run["ownerKind"]; assessment_year: string; task: Run["task"];
  title: string; status: RunStatus; state: Run["state"]; knowledge_release: string; lang: Run["lang"];
  created_at: Date; updated_at: Date; deleted_at: Date | null;
}
const toRun = (r: RunRow): Run => ({
  id: r.id, ownerPan: r.owner_pan, ownerKind: r.owner_kind, assessmentYear: r.assessment_year, task: r.task,
  title: r.title, status: r.status, state: r.state, knowledgeRelease: r.knowledge_release, lang: r.lang,
  createdAt: new Date(r.created_at).toISOString(), updatedAt: new Date(r.updated_at).toISOString(),
  deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined,
});

export class PostgresRunStore implements RunStore {
  constructor(private readonly pool: Pool, private readonly clock: () => string = () => new Date().toISOString()) {}

  async createRun(run: Run, first: RunEventPayload) {
    await this.pool.query(
      `INSERT INTO agent_runs (id, owner_pan, owner_kind, assessment_year, task, title, status, state, knowledge_release, lang, created_at, updated_at)
       VALUES ($1,$2,$12,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)`,
      [run.id, run.ownerPan, run.assessmentYear, run.task, run.title, run.status, JSON.stringify(run.state), run.knowledgeRelease, run.lang, run.createdAt, run.updatedAt, run.ownerKind],
    );
    return this.appendEvent({ pan: run.ownerPan, kind: run.ownerKind, displayName: "" }, run.id, first);
  }
  async getRun(owner: Owner, id: string) {
    const res = await this.pool.query<RunRow>("SELECT * FROM agent_runs WHERE id = $1 AND owner_pan = $2 AND owner_kind = $3 AND deleted_at IS NULL", [id, owner.pan, owner.kind]);
    return res.rows[0] ? toRun(res.rows[0]) : null;
  }
  async listRuns(owner: Owner) {
    const res = await this.pool.query<RunRow>("SELECT * FROM agent_runs WHERE owner_pan = $1 AND owner_kind = $2 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100", [owner.pan, owner.kind]);
    return res.rows.map(toRun);
  }
  async saveRun(run: Run) {
    await this.pool.query(
      "UPDATE agent_runs SET status = $2, state = $3::jsonb, title = $4, updated_at = $5 WHERE id = $1",
      [run.id, run.status, JSON.stringify(run.state), run.title, this.clock()],
    );
  }
  async appendEvent(owner: Owner, runId: string, payload: RunEventPayload) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const own = await client.query("SELECT 1 FROM agent_runs WHERE id = $1 AND owner_pan = $2 AND owner_kind = $3 AND deleted_at IS NULL FOR UPDATE", [runId, owner.pan, owner.kind]);
      if (!own.rowCount) throw new Error("run not found");
      const seqRes = await client.query<{ next: number }>("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM agent_run_events WHERE run_id = $1", [runId]);
      const seq = Number(seqRes.rows[0].next);
      const at = this.clock();
      await client.query("INSERT INTO agent_run_events (run_id, seq, at, type, payload) VALUES ($1,$2,$3,$4,$5::jsonb)", [runId, seq, at, payload.type, JSON.stringify(payload)]);
      await client.query("COMMIT");
      return { runId, seq, at, payload };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async eventsAfter(owner: Owner, runId: string, afterSeq: number) {
    const res = await this.pool.query<{ seq: number; at: Date; payload: RunEventPayload }>(
      `SELECT e.seq, e.at, e.payload FROM agent_run_events e JOIN agent_runs r ON r.id = e.run_id
       WHERE e.run_id = $1 AND r.owner_pan = $2 AND r.owner_kind = $4 AND r.deleted_at IS NULL AND e.seq > $3 ORDER BY e.seq`,
      [runId, owner.pan, afterSeq, owner.kind],
    );
    return res.rows.map((r) => ({ runId, seq: Number(r.seq), at: new Date(r.at).toISOString(), payload: r.payload }));
  }
  async deleteRun(owner: Owner, id: string, at: string) {
    const res = await this.pool.query("UPDATE agent_runs SET deleted_at = $3 WHERE id = $1 AND owner_pan = $2 AND owner_kind = $4 AND deleted_at IS NULL", [id, owner.pan, at, owner.kind]);
    if (res.rowCount) await this.pool.query("DELETE FROM agent_outputs WHERE run_id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }
  async putOutput(owner: Owner, o: StoredOutput) {
    await this.pool.query(
      `INSERT INTO agent_outputs (id, run_id, owner_pan, kind, title, snapshot_revision, snapshot_hash, mime_type, body, synthetic, created_at)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10 FROM agent_runs WHERE id = $2 AND owner_pan = $3`,
      [o.id, o.runId, owner.pan, o.kind, o.title, o.snapshotRevision, o.snapshotHash, o.mimeType, Buffer.from(o.body), o.createdAt],
    );
  }
  async getOutput(owner: Owner, outputId: string) {
    const res = await this.pool.query<{ id: string; run_id: string; kind: OutputRef["kind"]; title: string; snapshot_revision: number; snapshot_hash: string; mime_type: string; body: Buffer; created_at: Date }>(
      "SELECT * FROM agent_outputs WHERE id = $1 AND owner_pan = $2", [outputId, owner.pan],
    );
    const r = res.rows[0];
    return r ? { id: r.id, runId: r.run_id, kind: r.kind, title: r.title, snapshotRevision: r.snapshot_revision, snapshotHash: r.snapshot_hash, mimeType: r.mime_type, body: r.body, synthetic: true as const, createdAt: new Date(r.created_at).toISOString() } : null;
  }
  async listOutputs(owner: Owner, runId: string) {
    const res = await this.pool.query<{ id: string; kind: OutputRef["kind"]; title: string; snapshot_revision: number; snapshot_hash: string; mime_type: string; created_at: Date }>(
      "SELECT id, kind, title, snapshot_revision, snapshot_hash, mime_type, created_at FROM agent_outputs WHERE run_id = $1 AND owner_pan = $2 ORDER BY created_at", [runId, owner.pan],
    );
    return res.rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, snapshotRevision: r.snapshot_revision, snapshotHash: r.snapshot_hash, mimeType: r.mime_type, synthetic: true as const, createdAt: new Date(r.created_at).toISOString() }));
  }
  async getMemory(owner: Owner) {
    const res = await this.pool.query<{ key: string; value: MemoryEntry["value"]; source_run: string | null; valid_for_year: string | null; updated_at: Date }>(
      "SELECT key, value, source_run, valid_for_year, updated_at FROM agent_memory WHERE owner_pan = $1 AND deleted_at IS NULL", [owner.pan],
    );
    return res.rows.map((r) => ({ key: r.key, value: r.value, sourceRun: r.source_run ?? undefined, validForYear: r.valid_for_year ?? undefined, updatedAt: new Date(r.updated_at).toISOString() }));
  }
  async setMemory(owner: Owner, e: MemoryEntry) {
    await this.pool.query(
      `INSERT INTO agent_memory (owner_pan, key, value, source_run, valid_for_year, updated_at, deleted_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,NULL)
       ON CONFLICT (owner_pan, key) DO UPDATE SET value = EXCLUDED.value, source_run = EXCLUDED.source_run, valid_for_year = EXCLUDED.valid_for_year, updated_at = EXCLUDED.updated_at, deleted_at = NULL`,
      [owner.pan, e.key, JSON.stringify(e.value), e.sourceRun ?? null, e.validForYear ?? null, e.updatedAt],
    );
  }
  async deleteMemory(owner: Owner, key: MemoryKey) {
    const res = await this.pool.query("UPDATE agent_memory SET deleted_at = $3 WHERE owner_pan = $1 AND key = $2 AND deleted_at IS NULL", [owner.pan, key, this.clock()]);
    return (res.rowCount ?? 0) > 0;
  }
  async addDailyUsage(owner: Owner, day: string, tokens: number, modelCalls: number) {
    const res = await this.pool.query<{ tokens: number; model_calls: number }>(
      `INSERT INTO agent_budget_usage (owner_pan, day, tokens, model_calls) VALUES ($1,$2,$3,$4)
       ON CONFLICT (owner_pan, day) DO UPDATE SET tokens = agent_budget_usage.tokens + EXCLUDED.tokens, model_calls = agent_budget_usage.model_calls + EXCLUDED.model_calls
       RETURNING tokens, model_calls`,
      [owner.pan, day, tokens, modelCalls],
    );
    return { tokens: Number(res.rows[0].tokens), modelCalls: Number(res.rows[0].model_calls) };
  }
}

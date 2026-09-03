/**
 * Run persistence (plan §3.3 step 8, §3.6). Every event is appended before it is streamed,
 * so a reload replays the same list. Server-only.
 */
import { randomUUID } from "node:crypto";
import { db, nowIso } from "../server/db";
import type { RunEvent } from "./events";
import type { InterviewState } from "./interview";

export interface RunRecord {
  id: string;
  userId: string;
  taskId: string | null;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  plan: unknown | null;
  state: InterviewState | null;
}

export interface RunSummary {
  id: string;
  title: string;
  taskId: string | null;
  status: string;
  updatedAt: string;
}

interface RunRow {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  plan_json: string | null;
  state_json: string;
}

function toRecord(row: RunRow): RunRecord {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    plan: row.plan_json ? JSON.parse(row.plan_json) : null,
    state: row.state_json ? (JSON.parse(row.state_json) as InterviewState) : null,
  };
}

export function createRun(userId: string, title: string): RunRecord {
  const id = randomUUID();
  const at = nowIso();
  db()
    .prepare("INSERT INTO runs (id, user_id, task_id, title, status, created_at, updated_at, plan_json, state_json) VALUES (?, ?, NULL, ?, 'running', ?, ?, NULL, '{}')")
    .run(id, userId, title.slice(0, 80), at, at);
  return getRun(userId, id)!;
}

export function getRun(userId: string, id: string): RunRecord | null {
  const row = db().prepare("SELECT * FROM runs WHERE user_id = ? AND id = ?").get(userId, id) as RunRow | undefined;
  return row ? toRecord(row) : null;
}

export function updateRun(userId: string, id: string, patch: { taskId?: string | null; title?: string; status?: string; plan?: unknown; state?: InterviewState }): void {
  const sets: string[] = ["updated_at = ?"];
  const args: unknown[] = [nowIso()];
  if (patch.taskId !== undefined) {
    sets.push("task_id = ?");
    args.push(patch.taskId);
  }
  if (patch.title !== undefined) {
    sets.push("title = ?");
    args.push(patch.title.slice(0, 80));
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    args.push(patch.status);
  }
  if (patch.plan !== undefined) {
    sets.push("plan_json = ?");
    args.push(JSON.stringify(patch.plan));
  }
  if (patch.state !== undefined) {
    sets.push("state_json = ?");
    args.push(JSON.stringify(patch.state));
  }
  args.push(userId, id);
  db().prepare(`UPDATE runs SET ${sets.join(", ")} WHERE user_id = ? AND id = ?`).run(...(args as (string | null)[]));
}

export function listRuns(userId: string, limit = 50): RunSummary[] {
  const rows = db()
    .prepare("SELECT id, title, task_id AS taskId, status, updated_at AS updatedAt FROM runs WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?")
    .all(userId, limit) as unknown as RunSummary[];
  return rows.map((row) => ({ ...row }));
}

export function deleteRun(userId: string, id: string): boolean {
  const result = db().prepare("DELETE FROM runs WHERE user_id = ? AND id = ?").run(userId, id);
  return Number(result.changes) > 0;
}

/** The user's one active (waiting or running) run, if any (plan §7: one at a time). */
export function activeRun(userId: string): RunRecord | null {
  const row = db()
    .prepare("SELECT * FROM runs WHERE user_id = ? AND status IN ('running','waiting') ORDER BY updated_at DESC LIMIT 1")
    .get(userId) as RunRow | undefined;
  return row ? toRecord(row) : null;
}

export function appendEvent(runId: string, event: RunEvent): number {
  const row = db().prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM run_events WHERE run_id = ?").get(runId) as { seq: number };
  const seq = row.seq + 1;
  db().prepare("INSERT INTO run_events (run_id, seq, at, type, payload_json) VALUES (?, ?, ?, ?, ?)").run(runId, seq, event.at, event.type, JSON.stringify(event));
  return seq;
}

export function loadEvents(runId: string, afterSeq = 0, limit = 5000): RunEvent[] {
  const rows = db()
    .prepare("SELECT payload_json FROM run_events WHERE run_id = ? AND seq > ? ORDER BY seq ASC LIMIT ?")
    .all(runId, afterSeq, limit) as { payload_json: string }[];
  return rows.map((row) => JSON.parse(row.payload_json) as RunEvent);
}

/* -------------------------------------------------------------- outputs -- */

export interface OutputMeta {
  id: string;
  runId: string;
  kind: string;
  name: string;
  contentType: string;
  at: string;
}

export function putOutput(userId: string, runId: string, output: { kind: string; name: string; contentType: string; bytes: Buffer }): OutputMeta {
  const id = randomUUID();
  const at = nowIso();
  db()
    .prepare("INSERT INTO outputs (id, run_id, user_id, kind, name, content_type, bytes, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, runId, userId, output.kind, output.name, output.contentType, output.bytes, at);
  return { id, runId, kind: output.kind, name: output.name, contentType: output.contentType, at };
}

export function getOutput(userId: string, id: string): { meta: OutputMeta; bytes: Buffer } | null {
  const row = db()
    .prepare("SELECT id, run_id, kind, name, content_type, bytes, at FROM outputs WHERE user_id = ? AND id = ?")
    .get(userId, id) as { id: string; run_id: string; kind: string; name: string; content_type: string; bytes: Uint8Array; at: string } | undefined;
  if (!row) return null;
  return { meta: { id: row.id, runId: row.run_id, kind: row.kind, name: row.name, contentType: row.content_type, at: row.at }, bytes: Buffer.from(row.bytes) };
}

export function listOutputs(userId: string, runId?: string): OutputMeta[] {
  const rows = runId
    ? (db().prepare("SELECT id, run_id, kind, name, content_type, at FROM outputs WHERE user_id = ? AND run_id = ? ORDER BY at DESC").all(userId, runId) as { id: string; run_id: string; kind: string; name: string; content_type: string; at: string }[])
    : (db().prepare("SELECT id, run_id, kind, name, content_type, at FROM outputs WHERE user_id = ? ORDER BY at DESC").all(userId) as { id: string; run_id: string; kind: string; name: string; content_type: string; at: string }[]);
  return rows.map((row) => ({ id: row.id, runId: row.run_id, kind: row.kind, name: row.name, contentType: row.content_type, at: row.at }));
}

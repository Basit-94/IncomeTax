/**
 * Persistent memory (plan §3.6, D11): facts, never secrets. `remember` refuses anything
 * that looks like an identifier or an amount, so a model cannot smuggle a value out of
 * the vault into a memory row. Server-only.
 */
import { randomUUID } from "node:crypto";
import { db, nowIso } from "../server/db";
import { audit } from "../server/vault";
import { validateAadhaar, validateBankAccount, validateGstin, validateIfsc, validatePan, validateTan } from "../validation";

export interface Memory {
  key: string;
  value: string;
  sourceRunId: string | null;
  at: string;
}

export const MEMORY_KEY_SHAPE = /^[a-z][a-z0-9_]{1,63}$/;
export const MEMORY_VALUE_MAX = 200;

/** Why a value was refused, for the error event. */
export function memoryValueProblem(value: string): string | null {
  const v = value.trim();
  if (!v) return "empty";
  if (v.length > MEMORY_VALUE_MAX) return "too long";
  const compact = v.replace(/[\s-]/g, "");
  if (/\d{9,}/.test(compact)) return "looks like an account, phone or ID number";
  if (/₹|\brs\.?\s*\d|\binr\b/i.test(v) || /\b\d+(\.\d+)?\s*(lakh|lac|crore|k)\b/i.test(v)) return "looks like an amount";
  if (/[A-Z]{5}[0-9]{4}[A-Z]/.test(compact.toUpperCase()) && validatePan(compact, { individual: false }).ok) return "looks like a PAN";
  if (validateAadhaar(compact).ok) return "looks like an Aadhaar number";
  if (validateGstin(compact).ok) return "looks like a GSTIN";
  if (validateTan(compact).ok) return "looks like a TAN";
  if (validateIfsc(compact).ok) return "looks like an IFSC";
  if (/^\d{9,18}$/.test(compact) && validateBankAccount(compact).ok) return "looks like an account number";
  if (/@/.test(v)) return "looks like an email address";
  return null;
}

export function remember(userId: string, key: string, value: string, sourceRunId?: string): Memory {
  if (!MEMORY_KEY_SHAPE.test(key)) throw new Error("memory key shape");
  const problem = memoryValueProblem(value);
  if (problem) throw new Error(`memory value refused: ${problem}`);
  const at = nowIso();
  const previous = db().prepare("SELECT value FROM memories WHERE user_id = ? AND key = ?").get(userId, key) as { value: string } | undefined;
  db()
    .prepare(
      `INSERT INTO memories (id, user_id, key, value, source_run_id, at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, source_run_id = excluded.source_run_id, at = excluded.at`,
    )
    .run(randomUUID(), userId, key, value.trim(), sourceRunId ?? null, at);
  if (previous && previous.value !== value.trim()) {
    audit(userId, { actor: "agent", action: "memory.replaced", runId: sourceRunId, detail: `${key}: ${previous.value} → ${value.trim()}` });
  }
  return { key, value: value.trim(), sourceRunId: sourceRunId ?? null, at };
}

export function forget(userId: string, key: string): boolean {
  const result = db().prepare("DELETE FROM memories WHERE user_id = ? AND key = ?").run(userId, key);
  return Number(result.changes) > 0;
}

export function forgetAll(userId: string): number {
  const result = db().prepare("DELETE FROM memories WHERE user_id = ?").run(userId);
  return Number(result.changes);
}

export function recall(userId: string): Memory[] {
  const rows = db()
    .prepare("SELECT key, value, source_run_id AS sourceRunId, at FROM memories WHERE user_id = ? ORDER BY at DESC")
    .all(userId) as unknown as Memory[];
  return rows.map((row) => ({ ...row }));
}

/** Plain sentences for the model and the context panel. */
export function memoriesAsSentences(memories: Memory[]): string[] {
  return memories.map((m) => `${m.key.replace(/_/g, " ")}: ${m.value}`);
}

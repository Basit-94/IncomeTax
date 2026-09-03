/**
 * The account's filed return (plan §3.2 `returns`). One row per user for this assessment
 * year; the refund tracker and the manual "filing history" tile read it. Server-only.
 */
import { db, nowIso } from "../server/db";
import type { FiledReturn } from "../itr";

export function saveFiledReturn(userId: string, filed: FiledReturn): void {
  db()
    .prepare("INSERT INTO returns (user_id, state_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at")
    .run(userId, JSON.stringify(filed), nowIso());
}

export function getFiledReturn(userId: string): FiledReturn | null {
  const row = db().prepare("SELECT state_json FROM returns WHERE user_id = ?").get(userId) as { state_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.state_json) as FiledReturn;
  } catch {
    return null;
  }
}

export function clearFiledReturn(userId: string): void {
  db().prepare("DELETE FROM returns WHERE user_id = ?").run(userId);
}

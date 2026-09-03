/**
 * DigiLocker (plan D8, task 3.3). The real requester API needs a registered organisation,
 * so the default is a mock that keeps the real flow's shape: an OAuth-style redirect to a
 * consent screen, a callback with a one-time code, then "issued documents" pulled into
 * the vault marked `digilocker` and verified. Mock issued documents are derived
 * deterministically from the account so they are stable across sessions and never Form 16
 * (which employers issue, not DigiLocker).
 *
 * `DIGILOCKER_MODE=real` selects the stub that refuses until credentials exist.
 * Server-only.
 */
import { createHash, randomBytes } from "node:crypto";
import { db, nowIso } from "./db";
import { audit, putSlot, slotStatuses, type SlotStatus } from "./vault";
import { verhoeffCheckDigit } from "../validation";

export type DigiLockerMode = "mock" | "real";

export function digilockerMode(): DigiLockerMode {
  return process.env.DIGILOCKER_MODE === "real" ? "real" : "mock";
}

/** The documents the mock locker can issue, and the slots they fill. */
export const DIGILOCKER_SCOPE = ["pan", "aadhaar", "full_name", "dob"] as const;
export type DigiLockerSlot = (typeof DIGILOCKER_SCOPE)[number];

export interface DigiLockerLink {
  linkedAt: string;
  scope: string[];
}

/* -------------------------------------------------------------- state -- */

const pending = new Map<string, { userId: string; expires: number }>();

export function beginConnect(userId: string): { state: string; redirect: string } {
  if (digilockerMode() === "real") throw new Error("DigiLocker real mode is not configured (needs a registered requester; plan K2)");
  const state = randomBytes(16).toString("base64url");
  pending.set(state, { userId, expires: Date.now() + 10 * 60 * 1000 });
  audit(userId, { actor: "user", action: "digilocker.connect.begin" });
  return { state, redirect: `/digilocker/consent?state=${encodeURIComponent(state)}` };
}

export function consumeState(state: string): string | null {
  const entry = pending.get(state);
  pending.delete(state);
  if (!entry || entry.expires < Date.now()) return null;
  return entry.userId;
}

export function completeConnect(userId: string, code: string): DigiLockerLink {
  if (!code.startsWith("mock-")) throw new Error("bad code");
  const linkedAt = nowIso();
  db()
    .prepare("INSERT INTO digilocker_links (user_id, linked_at, scope) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET linked_at = excluded.linked_at, scope = excluded.scope")
    .run(userId, linkedAt, DIGILOCKER_SCOPE.join(","));
  audit(userId, { actor: "user", action: "digilocker.connected", detail: DIGILOCKER_SCOPE.join(",") });
  return { linkedAt, scope: [...DIGILOCKER_SCOPE] };
}

export function getLink(userId: string): DigiLockerLink | null {
  const row = db().prepare("SELECT linked_at AS linkedAt, scope FROM digilocker_links WHERE user_id = ?").get(userId) as { linkedAt: string; scope: string } | undefined;
  return row ? { linkedAt: row.linkedAt, scope: row.scope.split(",") } : null;
}

export function disconnect(userId: string): void {
  db().prepare("DELETE FROM digilocker_links WHERE user_id = ?").run(userId);
  audit(userId, { actor: "user", action: "digilocker.disconnected" });
}

/* ---------------------------------------------------- issued documents -- */

/** Stable, shape-valid, entirely invented identity for an account. */
export function mockIssued(userId: string, username: string): Record<DigiLockerSlot, { value: string; masked: string }> {
  const digest = createHash("sha256").update(`digilocker|${userId}`).digest("hex");
  const letters = (n: number, from: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + (parseInt(digest.slice(from + i * 2, from + i * 2 + 2), 16) % 26))).join("");
  // PAN: DEMP + surname initial + 4 digits + letter; the DEMP prefix is the prototype's tell.
  const surnameInitial = letters(1, 0);
  const pan = `DEMP${surnameInitial}${String(1000 + (parseInt(digest.slice(4, 8), 16) % 9000))}${letters(1, 8)}`;
  // Aadhaar: 11 digits (first 2–9) plus a Verhoeff check digit.
  const base = `${2 + (parseInt(digest.slice(10, 12), 16) % 8)}${BigInt(`0x${digest.slice(12, 24)}`).toString().padStart(10, "0").slice(0, 10)}`;
  const aadhaar = base + verhoeffCheckDigit(base);
  const name = username.replace(/[_\d]+/g, " ").trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Citizen";
  const fullName = `${name} ${surnameInitial}${letters(4, 26).toLowerCase()}`;
  const year = 1970 + (parseInt(digest.slice(30, 32), 16) % 36);
  const month = 1 + (parseInt(digest.slice(32, 34), 16) % 12);
  const day = 1 + (parseInt(digest.slice(34, 36), 16) % 28);
  const dob = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    pan: { value: pan, masked: `${pan.slice(0, 2)}XXXXXX${pan.slice(8)}` },
    aadhaar: { value: aadhaar, masked: `XXXX XXXX ${aadhaar.slice(8)}` },
    full_name: { value: fullName, masked: fullName },
    dob: { value: dob, masked: dob },
  };
}

/**
 * Pull issued documents into the vault. Only slots that are empty (or only requested ones)
 * are written, so a value the person typed is never overwritten by the mock.
 */
export function pullIssued(userId: string, username: string, only?: DigiLockerSlot[], runId?: string): { filled: SlotStatus[]; skipped: DigiLockerSlot[] } {
  if (!getLink(userId)) throw new Error("not linked");
  const issued = mockIssued(userId, username);
  const existing = slotStatuses(userId);
  const filled: SlotStatus[] = [];
  const skipped: DigiLockerSlot[] = [];
  for (const slot of only ?? DIGILOCKER_SCOPE) {
    if (existing[slot] && existing[slot].source !== "digilocker") {
      skipped.push(slot);
      continue;
    }
    filled.push(putSlot(userId, slot, issued[slot].value, { masked: issued[slot].masked, source: "digilocker", verified: true, actor: "system", runId }));
  }
  audit(userId, { actor: "system", action: "digilocker.pull", runId, detail: filled.map((f) => f.slotId).join(",") || "nothing new" });
  return { filled, skipped };
}

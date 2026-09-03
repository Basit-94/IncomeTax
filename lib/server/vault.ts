/**
 * The vault (plan §4.2). Slot values are AES-256-GCM under a per-user data key, itself
 * wrapped by the master key. Only `masked` ever leaves this module unencrypted except
 * through `readSlotValues`, which writes an audit row for every value it returns.
 *
 * Server-only.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { db, dbPath, nowIso } from "./db";

export type SlotSourceKind = "user" | "digilocker" | "document" | "persona";
export type AuditActor = "user" | "agent" | "system";

export interface SlotStatus {
  slotId: string;
  masked: string;
  source: SlotSourceKind;
  verified: boolean;
  updatedAt: string;
}

export interface StoredDocumentMeta {
  id: string;
  docType: string;
  assessmentYear: string;
  filename: string;
  contentType: string;
  size: number;
  source: string;
  extracted: Record<string, unknown> | null;
  uploadedAt: string;
}

export interface AuditRow {
  id: number;
  at: string;
  actor: AuditActor;
  action: string;
  slotId: string | null;
  documentId: string | null;
  runId: string | null;
  detail: string | null;
}

/* ------------------------------------------------------------- master key -- */

let masterKey: Buffer | null = null;

function masterKeyPath(): string {
  const base = dbPath();
  return base === ":memory:" ? ":memory:" : `${dirname(base)}/master.key`;
}

export function getMasterKey(): Buffer {
  if (masterKey) return masterKey;
  const env = process.env.VAULT_MASTER_KEY;
  if (env && /^[0-9a-f]{64}$/i.test(env)) {
    masterKey = Buffer.from(env, "hex");
    return masterKey;
  }
  if (process.env.NODE_ENV === "production" && process.env.VAULT_ALLOW_GENERATED_KEY !== "true") {
    throw new Error("VAULT_MASTER_KEY is not set. Set a 64-hex-character key in the environment (plan §7: never plaintext).");
  }
  const path = masterKeyPath();
  if (path === ":memory:") {
    masterKey = randomBytes(32);
    return masterKey;
  }
  if (existsSync(path)) {
    masterKey = Buffer.from(readFileSync(path, "utf-8").trim(), "hex");
    return masterKey;
  }
  mkdirSync(dirname(path), { recursive: true });
  masterKey = randomBytes(32);
  writeFileSync(path, masterKey.toString("hex"), { mode: 0o600 });
  console.warn(`[vault] generated a development master key at ${path}; set VAULT_MASTER_KEY in production.`);
  return masterKey;
}

/** Tests: forget the cached key so an in-memory database gets a fresh one. */
export function resetVaultForTests(): void {
  masterKey = null;
}

/* ----------------------------------------------------------- data keys -- */

function seal(key: Buffer, plain: Buffer): { iv: Buffer; ciphertext: Buffer; tag: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { iv, ciphertext, tag: cipher.getAuthTag() };
}

function open(key: Buffer, iv: Buffer, ciphertext: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const dataKeys = new Map<string, Buffer>();

function userDataKey(userId: string): Buffer {
  const cached = dataKeys.get(userId);
  if (cached) return cached;
  const row = db().prepare("SELECT vault_key_wrapped FROM users WHERE id = ?").get(userId) as { vault_key_wrapped: Uint8Array | null } | undefined;
  if (!row) throw new Error("no such user");
  const master = getMasterKey();
  let key: Buffer;
  if (row.vault_key_wrapped && row.vault_key_wrapped.length > 0) {
    const packed = Buffer.from(row.vault_key_wrapped);
    key = open(master, packed.subarray(0, 12), packed.subarray(28), packed.subarray(12, 28));
  } else {
    key = randomBytes(32);
    const sealed = seal(master, key);
    const packed = Buffer.concat([sealed.iv, sealed.tag, sealed.ciphertext]);
    db().prepare("UPDATE users SET vault_key_wrapped = ? WHERE id = ?").run(packed, userId);
  }
  dataKeys.set(userId, key);
  return key;
}

/** Tests and key rotation: drop cached per-user keys. */
export function forgetDataKeys(): void {
  dataKeys.clear();
}

/* --------------------------------------------------------------- audit -- */

export function audit(userId: string, entry: { actor: AuditActor; action: string; slotId?: string; documentId?: string; runId?: string; detail?: string }): void {
  db()
    .prepare("INSERT INTO vault_audit (user_id, at, actor, action, slot_id, document_id, run_id, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(userId, nowIso(), entry.actor, entry.action, entry.slotId ?? null, entry.documentId ?? null, entry.runId ?? null, entry.detail ?? null);
}

export function listAudit(userId: string, limit = 100): AuditRow[] {
  const rows = db()
    .prepare("SELECT id, at, actor, action, slot_id AS slotId, document_id AS documentId, run_id AS runId, detail FROM vault_audit WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit) as unknown as AuditRow[];
  // node:sqlite rows have a null prototype; plain objects cross the server/client boundary.
  return rows.map((row) => ({ ...row }));
}

/* --------------------------------------------------------------- slots -- */

export function putSlot(
  userId: string,
  slotId: string,
  value: string,
  opts: { masked: string; source: SlotSourceKind; verified?: boolean; actor?: AuditActor; runId?: string },
): SlotStatus {
  const key = userDataKey(userId);
  const sealed = seal(key, Buffer.from(value, "utf-8"));
  const updatedAt = nowIso();
  db()
    .prepare(
      `INSERT INTO slots (user_id, slot_id, ciphertext, iv, tag, masked, source, verified, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, slot_id) DO UPDATE SET ciphertext = excluded.ciphertext, iv = excluded.iv, tag = excluded.tag,
         masked = excluded.masked, source = excluded.source, verified = excluded.verified, updated_at = excluded.updated_at`,
    )
    .run(userId, slotId, sealed.ciphertext, sealed.iv, sealed.tag, opts.masked, opts.source, opts.verified ? 1 : 0, updatedAt);
  audit(userId, { actor: opts.actor ?? "user", action: "slot.write", slotId, runId: opts.runId, detail: opts.source });
  return { slotId, masked: opts.masked, source: opts.source, verified: Boolean(opts.verified), updatedAt };
}

export function slotStatuses(userId: string): Record<string, SlotStatus> {
  const rows = db()
    .prepare("SELECT slot_id AS slotId, masked, source, verified, updated_at AS updatedAt FROM slots WHERE user_id = ?")
    .all(userId) as { slotId: string; masked: string; source: SlotSourceKind; verified: number; updatedAt: string }[];
  const out: Record<string, SlotStatus> = {};
  for (const row of rows) out[row.slotId] = { ...row, verified: row.verified === 1 };
  return out;
}

/** Decrypt values. Every returned value is one audit row (plan §4.2). */
export function readSlotValues(userId: string, slotIds: string[], opts: { actor: AuditActor; runId?: string; reason?: string }): Record<string, string> {
  if (slotIds.length === 0) return {};
  const key = userDataKey(userId);
  const placeholders = slotIds.map(() => "?").join(",");
  const rows = db()
    .prepare(`SELECT slot_id AS slotId, ciphertext, iv, tag FROM slots WHERE user_id = ? AND slot_id IN (${placeholders})`)
    .all(userId, ...slotIds) as { slotId: string; ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }[];
  const out: Record<string, string> = {};
  for (const row of rows) {
    out[row.slotId] = open(key, Buffer.from(row.iv), Buffer.from(row.ciphertext), Buffer.from(row.tag)).toString("utf-8");
    audit(userId, { actor: opts.actor, action: "slot.read", slotId: row.slotId, runId: opts.runId, detail: opts.reason });
  }
  return out;
}

export function deleteSlot(userId: string, slotId: string, actor: AuditActor = "user"): void {
  db().prepare("DELETE FROM slots WHERE user_id = ? AND slot_id = ?").run(userId, slotId);
  audit(userId, { actor, action: "slot.delete", slotId });
}

/* ------------------------------------------------------------ documents -- */

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_USER = 50;
export const DOCUMENT_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

export function putDocument(
  userId: string,
  doc: { docType: string; assessmentYear: string; filename: string; contentType: string; bytes: Buffer; source: string; extracted?: Record<string, unknown> | null; actor?: AuditActor; runId?: string },
): StoredDocumentMeta {
  if (doc.bytes.length === 0) throw new Error("empty");
  if (doc.bytes.length > DOCUMENT_MAX_BYTES) throw new Error("too_large");
  if (!DOCUMENT_TYPES.has(doc.contentType)) throw new Error("type");
  const sha256 = createHash("sha256").update(doc.bytes).digest("hex");
  const existing = db().prepare("SELECT id FROM documents WHERE user_id = ? AND sha256 = ?").get(userId, sha256) as { id: string } | undefined;
  if (existing) {
    audit(userId, { actor: doc.actor ?? "user", action: "document.reused", documentId: existing.id, runId: doc.runId });
    return getDocumentMeta(userId, existing.id)!;
  }
  const count = (db().prepare("SELECT COUNT(*) as count FROM documents WHERE user_id = ?").get(userId) as { count: number }).count;
  if (count >= MAX_DOCUMENTS_PER_USER) throw new Error("storage_limit_reached");
  const id = randomUUID();
  const uploadedAt = nowIso();
  db()
    .prepare("INSERT INTO documents (id, user_id, doc_type, assessment_year, filename, content_type, bytes, sha256, source, extracted_json, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, userId, doc.docType, doc.assessmentYear, doc.filename, doc.contentType, doc.bytes, sha256, doc.source, doc.extracted ? JSON.stringify(doc.extracted) : null, uploadedAt);
  audit(userId, { actor: doc.actor ?? "user", action: "document.write", documentId: id, runId: doc.runId, detail: doc.docType });
  return getDocumentMeta(userId, id)!;
}

interface DocRow {
  id: string;
  doc_type: string;
  assessment_year: string;
  filename: string;
  content_type: string;
  size: number;
  source: string;
  extracted_json: string | null;
  uploaded_at: string;
}

function toMeta(row: DocRow): StoredDocumentMeta {
  return {
    id: row.id,
    docType: row.doc_type,
    assessmentYear: row.assessment_year,
    filename: row.filename,
    contentType: row.content_type,
    size: row.size,
    source: row.source,
    extracted: row.extracted_json ? (JSON.parse(row.extracted_json) as Record<string, unknown>) : null,
    uploadedAt: row.uploaded_at,
  };
}

const META_COLUMNS = "id, doc_type, assessment_year, filename, content_type, length(bytes) AS size, source, extracted_json, uploaded_at";

export function listDocuments(userId: string, docType?: string): StoredDocumentMeta[] {
  const rows = docType
    ? (db().prepare(`SELECT ${META_COLUMNS} FROM documents WHERE user_id = ? AND doc_type = ? ORDER BY uploaded_at DESC`).all(userId, docType) as unknown as DocRow[])
    : (db().prepare(`SELECT ${META_COLUMNS} FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC`).all(userId) as unknown as DocRow[]);
  return rows.map(toMeta);
}

export function getDocumentMeta(userId: string, id: string): StoredDocumentMeta | null {
  const row = db().prepare(`SELECT ${META_COLUMNS} FROM documents WHERE user_id = ? AND id = ?`).get(userId, id) as DocRow | undefined;
  return row ? toMeta(row) : null;
}

export function getDocumentBytes(userId: string, id: string, actor: AuditActor = "user"): { meta: StoredDocumentMeta; bytes: Buffer } | null {
  const meta = getDocumentMeta(userId, id);
  if (!meta) return null;
  const row = db().prepare("SELECT bytes FROM documents WHERE user_id = ? AND id = ?").get(userId, id) as { bytes: Uint8Array } | undefined;
  if (!row) return null;
  audit(userId, { actor, action: "document.read", documentId: id });
  return { meta, bytes: Buffer.from(row.bytes) };
}

export function deleteDocument(userId: string, id: string): void {
  db().prepare("DELETE FROM documents WHERE user_id = ? AND id = ?").run(userId, id);
  audit(userId, { actor: "user", action: "document.delete", documentId: id });
}

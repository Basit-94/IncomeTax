/**
 * The CA system's server-side store (2026-09-08, CA redesign). One source of truth for:
 *
 *  - **accounts** — Chartered Accountants who registered on Wapsi (a "Wapsi certified CA": verified on this
 *    platform against their ICAI membership number; the certification is a platform mark, not an ICAI one);
 *  - **sessions** — the CA's own HttpOnly cookie, separate from the citizen session;
 *  - **reviews** — a citizen's request to have the return looked at, either broadcast to every registered CA
 *    (`mode: "wapc"`: the first CA to claim it works on it) or handed to their own CA by code + PIN (`mode: "own"`,
 *    the flow that existed before, unchanged);
 *  - **comments** — inline remarks a CA leaves on a section of the return (`anchor`), the way a designer comments
 *    on a Figma frame; the citizen reads them beside the same rows.
 *
 * Postgres when a database is configured (migration 0007), process memory otherwise — the same rule every other
 * store follows. Passwords are scrypt-hashed with a per-account salt; nothing here ever returns a hash.
 */

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";
import type { Pool } from "pg";
import type { CAReviewRecord } from "./ca-store";

export type ReviewMode = "wapc" | "own";

export interface ReviewBackground {
  /** One paragraph: who they are and what this year looked like, in the words the request carried. */
  situation?: string;
  notes?: string;
  housing?: string;
  extras?: string[];
  employer?: string;
  employerCategory?: string;
  residency?: string;
  detailMode?: string;
  filed?: boolean;
}

/** The review request as the server holds it: the old record plus the redesign's fields. */
export interface CAReviewRequest extends CAReviewRecord {
  mode: ReviewMode;
  background?: ReviewBackground;
  claimedByCaId?: string;
  claimedByCaName?: string;
  claimedAt?: string;
  updatedAt: string;
}

export interface CAAccount {
  id: string;
  name: string;
  membershipNo: string;
  firmName: string;
  city: string;
  state: string;
  email: string;
  phone?: string;
  specialties: string[];
  passwordHash: string;
  salt: string;
  /** Verified on Wapsi against the membership number — the "Wapsi certified" mark the citizen sees. */
  certified: boolean;
  registeredAt: string;
  reviewCount: number;
}

export type PublicCAAccount = Omit<CAAccount, "passwordHash" | "salt">;

export interface ReviewComment {
  id: string;
  code: string;
  /** `income:salary`, `deduction:80C`, `taxPaid:tds`, `regime`, `summary` — the row or section the remark sits on. */
  anchor: string;
  text: string;
  author: { role: "ca" | "citizen" | "munshi"; name: string };
  createdAt: string;
  resolved: boolean;
}

export interface CAStore {
  getAccount(id: string): Promise<CAAccount | null>;
  /** By membership number, email or id. */
  findAccount(identifier: string): Promise<CAAccount | null>;
  putAccount(account: CAAccount): Promise<void>;
  countAccounts(): Promise<number>;
  putSession(idHash: string, caId: string, expiresAt: string): Promise<void>;
  getSession(idHash: string): Promise<{ caId: string; expiresAt: string } | null>;
  deleteSession(idHash: string): Promise<void>;
  getReview(code: string): Promise<CAReviewRequest | null>;
  putReview(review: CAReviewRequest): Promise<void>;
  /** Broadcast requests nobody has claimed, and the ones this CA claimed or finished. */
  listReviewsForCa(caId: string): Promise<{ open: CAReviewRequest[]; mine: CAReviewRequest[] }>;
  listReviewsForPan(pan: string): Promise<CAReviewRequest[]>;
  listComments(code: string): Promise<ReviewComment[]>;
  addComment(comment: ReviewComment): Promise<void>;
  setCommentResolved(id: string, resolved: boolean): Promise<ReviewComment | null>;
}

export const CA_SESSION_COOKIE = "wapsi_ca_sid";
export const CA_SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;

/* -------------------------------------------------------------- passwords -- */

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): { hash: string; salt: string } {
  return { hash: scryptSync(password.normalize("NFKC"), salt, 32).toString("hex"), salt };
}

export function verifyPassword(password: string, account: Pick<CAAccount, "passwordHash" | "salt">): boolean {
  const { hash } = hashPassword(password, account.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(account.passwordHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function publicAccount(a: CAAccount): PublicCAAccount {
  const { passwordHash: _h, salt: _s, ...rest } = a;
  return rest;
}

/* --------------------------------------------------------------- sessions -- */

export const hashCaSessionId = (id: string) => createHash("sha256").update(id).digest("hex");

export async function issueCaSession(store: CAStore, caId: string, now = new Date()): Promise<{ id: string; expiresAt: string }> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + CA_SESSION_LIFETIME_MS).toISOString();
  await store.putSession(hashCaSessionId(id), caId, expiresAt);
  return { id, expiresAt };
}

export async function resolveCa(store: CAStore, cookieHeader: string | null | undefined, now = new Date()): Promise<CAAccount | null> {
  const id = readCookie(cookieHeader, CA_SESSION_COOKIE);
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const s = await store.getSession(hashCaSessionId(id));
  if (!s) return null;
  if (new Date(s.expiresAt).getTime() <= now.getTime()) {
    await store.deleteSession(hashCaSessionId(id));
    return null;
  }
  return store.getAccount(s.caId);
}

export async function revokeCaSession(store: CAStore, cookieHeader: string | null | undefined): Promise<void> {
  const id = readCookie(cookieHeader, CA_SESSION_COOKIE);
  if (id) await store.deleteSession(hashCaSessionId(id));
}

export function caSessionCookie(id: string, expiresAt: string, secure: boolean): string {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return [`${CA_SESSION_COOKIE}=${id}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`, secure ? "Secure" : ""].filter(Boolean).join("; ");
}

export function clearedCaSessionCookie(secure: boolean): string {
  return [`${CA_SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", secure ? "Secure" : ""].filter(Boolean).join("; ");
}

function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/* ----------------------------------------------------------------- memory -- */

interface MemoryState {
  accounts: Map<string, CAAccount>;
  sessions: Map<string, { caId: string; expiresAt: string }>;
  reviews: Map<string, CAReviewRequest>;
  comments: Map<string, ReviewComment>;
}

declare global {
  // eslint-disable-next-line no-var
  var __WAPSI_CA_SERVER_STORE__: MemoryState | undefined;
}

/** Process-lifetime store; survives Next's dev reloads through the global so a CA does not lose the inbox on HMR. */
export class MemoryCAStore implements CAStore {
  private readonly s: MemoryState;
  constructor(fresh = false) {
    this.s = fresh ? { accounts: new Map(), sessions: new Map(), reviews: new Map(), comments: new Map() } : (globalThis.__WAPSI_CA_SERVER_STORE__ ??= { accounts: new Map(), sessions: new Map(), reviews: new Map(), comments: new Map() });
  }
  async getAccount(id: string) { return this.s.accounts.get(id) ?? null; }
  async findAccount(identifier: string) {
    const q = identifier.trim().toLowerCase();
    const digits = identifier.replace(/[^0-9]/g, "");
    for (const a of this.s.accounts.values()) {
      if (a.id.toLowerCase() === q || a.email.toLowerCase() === q || (digits && a.membershipNo === digits)) return a;
    }
    return null;
  }
  async putAccount(account: CAAccount) { this.s.accounts.set(account.id, { ...account }); }
  async countAccounts() { return this.s.accounts.size; }
  async putSession(idHash: string, caId: string, expiresAt: string) { this.s.sessions.set(idHash, { caId, expiresAt }); }
  async getSession(idHash: string) { return this.s.sessions.get(idHash) ?? null; }
  async deleteSession(idHash: string) { this.s.sessions.delete(idHash); }
  async getReview(code: string) { const r = this.s.reviews.get(code.toUpperCase().trim()); return r ? structuredClone(r) : null; }
  async putReview(review: CAReviewRequest) { this.s.reviews.set(review.code.toUpperCase().trim(), structuredClone(review)); }
  async listReviewsForCa(caId: string) {
    const all = [...this.s.reviews.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return {
      open: all.filter((r) => r.mode === "wapc" && r.status === "pending" && !r.claimedByCaId).map((r) => structuredClone(r)),
      mine: all.filter((r) => r.claimedByCaId === caId).map((r) => structuredClone(r)),
    };
  }
  async listReviewsForPan(pan: string) {
    const p = pan.toUpperCase().trim();
    return [...this.s.reviews.values()].filter((r) => r.citizenPan.toUpperCase() === p).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((r) => structuredClone(r));
  }
  async listComments(code: string) {
    const c = code.toUpperCase().trim();
    return [...this.s.comments.values()].filter((x) => x.code === c).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((x) => ({ ...x }));
  }
  async addComment(comment: ReviewComment) { this.s.comments.set(comment.id, { ...comment, code: comment.code.toUpperCase().trim() }); }
  async setCommentResolved(id: string, resolved: boolean) {
    const c = this.s.comments.get(id);
    if (!c) return null;
    const next = { ...c, resolved };
    this.s.comments.set(id, next);
    return next;
  }
}

/* --------------------------------------------------------------- postgres -- */

interface AccountRow { id: string; name: string; membership_no: string; firm_name: string; city: string; state: string; email: string; phone: string | null; specialties: string[]; password_hash: string; salt: string; certified: boolean; registered_at: Date; review_count: number }
const toAccount = (r: AccountRow): CAAccount => ({ id: r.id, name: r.name, membershipNo: r.membership_no, firmName: r.firm_name, city: r.city, state: r.state, email: r.email, phone: r.phone ?? undefined, specialties: r.specialties ?? [], passwordHash: r.password_hash, salt: r.salt, certified: r.certified, registeredAt: new Date(r.registered_at).toISOString(), reviewCount: Number(r.review_count) });
interface CommentRow { id: string; code: string; anchor: string; text: string; author_role: ReviewComment["author"]["role"]; author_name: string; created_at: Date; resolved: boolean }
const toComment = (r: CommentRow): ReviewComment => ({ id: r.id, code: r.code, anchor: r.anchor, text: r.text, author: { role: r.author_role, name: r.author_name }, createdAt: new Date(r.created_at).toISOString(), resolved: r.resolved });

export class PostgresCAStore implements CAStore {
  constructor(private readonly pool: Pool) {}
  async getAccount(id: string) {
    const res = await this.pool.query<AccountRow>("SELECT * FROM ca_accounts WHERE id = $1", [id]);
    return res.rows[0] ? toAccount(res.rows[0]) : null;
  }
  async findAccount(identifier: string) {
    const q = identifier.trim().toLowerCase();
    const digits = identifier.replace(/[^0-9]/g, "");
    const res = await this.pool.query<AccountRow>("SELECT * FROM ca_accounts WHERE lower(id) = $1 OR lower(email) = $1 OR ($2 <> '' AND membership_no = $2) LIMIT 1", [q, digits]);
    return res.rows[0] ? toAccount(res.rows[0]) : null;
  }
  async putAccount(a: CAAccount) {
    await this.pool.query(
      `INSERT INTO ca_accounts (id, name, membership_no, firm_name, city, state, email, phone, specialties, password_hash, salt, certified, registered_at, review_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, firm_name = EXCLUDED.firm_name, city = EXCLUDED.city, state = EXCLUDED.state, email = EXCLUDED.email, phone = EXCLUDED.phone, specialties = EXCLUDED.specialties, password_hash = EXCLUDED.password_hash, salt = EXCLUDED.salt, certified = EXCLUDED.certified, review_count = EXCLUDED.review_count`,
      [a.id, a.name, a.membershipNo, a.firmName, a.city, a.state, a.email, a.phone ?? null, JSON.stringify(a.specialties), a.passwordHash, a.salt, a.certified, a.registeredAt, a.reviewCount],
    );
  }
  async countAccounts() {
    const res = await this.pool.query<{ n: string }>("SELECT COUNT(*)::text AS n FROM ca_accounts");
    return Number(res.rows[0]?.n ?? 0);
  }
  async putSession(idHash: string, caId: string, expiresAt: string) {
    await this.pool.query("INSERT INTO ca_sessions (id_hash, ca_id, created_at, expires_at) VALUES ($1,$2,now(),$3) ON CONFLICT (id_hash) DO NOTHING", [idHash, caId, expiresAt]);
  }
  async getSession(idHash: string) {
    const res = await this.pool.query<{ ca_id: string; expires_at: Date }>("SELECT ca_id, expires_at FROM ca_sessions WHERE id_hash = $1", [idHash]);
    return res.rows[0] ? { caId: res.rows[0].ca_id, expiresAt: new Date(res.rows[0].expires_at).toISOString() } : null;
  }
  async deleteSession(idHash: string) { await this.pool.query("DELETE FROM ca_sessions WHERE id_hash = $1", [idHash]); }
  async getReview(code: string) {
    const res = await this.pool.query<{ record: CAReviewRequest }>("SELECT record FROM ca_reviews WHERE code = $1", [code.toUpperCase().trim()]);
    return res.rows[0]?.record ?? null;
  }
  async putReview(r: CAReviewRequest) {
    await this.pool.query(
      `INSERT INTO ca_reviews (code, citizen_pan, mode, status, claimed_by_ca_id, record, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
       ON CONFLICT (code) DO UPDATE SET status = EXCLUDED.status, claimed_by_ca_id = EXCLUDED.claimed_by_ca_id, record = EXCLUDED.record, updated_at = EXCLUDED.updated_at`,
      [r.code.toUpperCase().trim(), r.citizenPan.toUpperCase().trim(), r.mode, r.status, r.claimedByCaId ?? null, JSON.stringify(r), r.createdAt, r.updatedAt],
    );
  }
  async listReviewsForCa(caId: string) {
    const res = await this.pool.query<{ record: CAReviewRequest }>(
      "SELECT record FROM ca_reviews WHERE (mode = 'wapc' AND status = 'pending' AND claimed_by_ca_id IS NULL) OR claimed_by_ca_id = $1 ORDER BY updated_at DESC LIMIT 200",
      [caId],
    );
    const all = res.rows.map((r) => r.record);
    return { open: all.filter((r) => !r.claimedByCaId), mine: all.filter((r) => r.claimedByCaId === caId) };
  }
  async listReviewsForPan(pan: string) {
    const res = await this.pool.query<{ record: CAReviewRequest }>("SELECT record FROM ca_reviews WHERE citizen_pan = $1 ORDER BY updated_at DESC LIMIT 50", [pan.toUpperCase().trim()]);
    return res.rows.map((r) => r.record);
  }
  async listComments(code: string) {
    const res = await this.pool.query<CommentRow>("SELECT * FROM ca_comments WHERE code = $1 ORDER BY created_at", [code.toUpperCase().trim()]);
    return res.rows.map(toComment);
  }
  async addComment(c: ReviewComment) {
    await this.pool.query(
      "INSERT INTO ca_comments (id, code, anchor, text, author_role, author_name, created_at, resolved) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [c.id, c.code.toUpperCase().trim(), c.anchor, c.text, c.author.role, c.author.name, c.createdAt, c.resolved],
    );
  }
  async setCommentResolved(id: string, resolved: boolean) {
    const res = await this.pool.query<CommentRow>("UPDATE ca_comments SET resolved = $2 WHERE id = $1 RETURNING *", [id, resolved]);
    return res.rows[0] ? toComment(res.rows[0]) : null;
  }
}

export function caStoreFor(pool: Pool | null): CAStore {
  return pool ? new PostgresCAStore(pool) : new MemoryCAStore();
}

/* ------------------------------------------------------------------ helpers -- */

export function newCode(): string {
  return `CA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;
}

export function newCommentId(): string {
  return `cmt_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
}

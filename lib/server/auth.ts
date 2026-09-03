/**
 * Accounts and sessions (plan §4.1).
 *
 * Passwords: scrypt from node:crypto, 16-byte salt, N=2^15, stored as
 * `scrypt$<N>$<salt b64>$<hash b64>` so the parameters can change later without a
 * migration. Sessions: a 32-byte random token whose SHA-256 is the primary key; the
 * token itself exists only in the cookie. Sign-in is rate-limited per username in memory.
 *
 * Server-only.
 */
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { db, nowIso } from "./db";
import { normaliseOnboardingProfile, type OnboardingProfile } from "../onboarding";
import type { UiMode } from "../mode";
import type { Lang } from "../types";
import { isLang } from "../i18n";

export const DEMO_USERNAME = process.env.DEMO_USERNAME || "asabs";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "12345";

const SCRYPT_N = 2 ** 15;
const SESSION_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);
const LOCKOUT_FAILURES = 10;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export interface User {
  id: string;
  username: string;
  createdAt: string;
  onboardedAt: string | null;
  onboarding: OnboardingProfile | null;
  mode: UiMode;
  lang: Lang;
  theme: "light" | "dark";
}

export type SignInFailure = "bad_credentials" | "locked";

/* ------------------------------------------------------------- passwords -- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: SCRYPT_N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${SCRYPT_N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !n || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ----------------------------------------------------------------- users -- */

const USERNAME_SHAPE = /^[a-z0-9_]{3,32}$/;

export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_SHAPE.test(username);
}

export class UsernameTaken extends Error {
  constructor() {
    super("username taken");
  }
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  onboarded_at: string | null;
  onboarding_json: string | null;
  mode: string;
  lang: string;
  theme: string;
}

function toUser(row: UserRow): User {
  let onboarding: OnboardingProfile | null = null;
  if (row.onboarding_json) {
    try {
      // Any stored version is accepted and served at the current one (plan §6).
      onboarding = normaliseOnboardingProfile(JSON.parse(row.onboarding_json));
    } catch {
      onboarding = null;
    }
  }
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
    onboardedAt: row.onboarded_at,
    onboarding,
    mode: row.mode === "manual" ? "manual" : "agentic",
    lang: isLang(row.lang) ? row.lang : "en",
    theme: row.theme === "dark" ? "dark" : "light",
  };
}

export function createUser(usernameRaw: string, password: string): User {
  const username = normaliseUsername(usernameRaw);
  if (!isValidUsername(username)) throw new Error("username shape");
  if (password.length < 4 || password.length > 128) throw new Error("password length");
  const existing = db().prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) throw new UsernameTaken();
  const id = randomUUID();
  db()
    .prepare("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(id, username, hashPassword(password), nowIso());
  return getUser(id)!;
}

export function getUser(id: string): User | null {
  const row = db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export function getUserByUsername(usernameRaw: string): User | null {
  const row = db()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(normaliseUsername(usernameRaw)) as UserRow | undefined;
  return row ? toUser(row) : null;
}

/** Permanently delete an account and cascade-delete all associated vault data, runs, documents, and sessions. */
export function deleteUser(id: string): void {
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
}

/** The demo account from the plan (D4). Idempotent; runs at first request unless disabled. */
export function seedDemoAccount(): void {
  if (process.env.SEED_DEMO_ACCOUNT === "false") return;
  if (!getUserByUsername(DEMO_USERNAME)) createUser(DEMO_USERNAME, DEMO_PASSWORD);
}

export function setPreferences(
  id: string,
  prefs: { mode?: UiMode; lang?: Lang; theme?: "light" | "dark" },
): User | null {
  if (prefs.mode) db().prepare("UPDATE users SET mode = ? WHERE id = ?").run(prefs.mode, id);
  if (prefs.lang) db().prepare("UPDATE users SET lang = ? WHERE id = ?").run(prefs.lang, id);
  if (prefs.theme) db().prepare("UPDATE users SET theme = ? WHERE id = ?").run(prefs.theme, id);
  return getUser(id);
}

/** Store the completed onboarding answers; `onboarded_at` is set once and never reset. */
export function setOnboarding(id: string, profile: OnboardingProfile): User | null {
  db()
    .prepare(
      "UPDATE users SET onboarding_json = ?, lang = ?, onboarded_at = COALESCE(onboarded_at, ?) WHERE id = ?",
    )
    .run(JSON.stringify(profile), profile.lang, nowIso(), id);
  return getUser(id);
}

/* -------------------------------------------------------------- sessions -- */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: string, now = new Date()): string {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  db()
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(hashToken(token), userId, now.toISOString(), expires.toISOString(), now.toISOString());
  return token;
}

/** Resolve a cookie token to its user; slides the expiry on every successful call. */
export function authenticate(token: string | undefined | null, now = new Date()): User | null {
  if (!token) return null;
  const hash = hashToken(token);
  const row = db()
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?")
    .get(hash) as { user_id: string; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= now.getTime()) {
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash);
    return null;
  }
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  db()
    .prepare("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?")
    .run(now.toISOString(), expires.toISOString(), hash);
  return getUser(row.user_id);
}

export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

/* --------------------------------------------------------------- sign-in -- */

const failures = new Map<string, { count: number; first: number }>();

function isLocked(username: string, now: number): boolean {
  const entry = failures.get(username);
  if (!entry) return false;
  if (now - entry.first > LOCKOUT_WINDOW_MS) {
    failures.delete(username);
    return false;
  }
  return entry.count >= LOCKOUT_FAILURES;
}

function recordFailure(username: string, now: number): void {
  const entry = failures.get(username);
  if (!entry || now - entry.first > LOCKOUT_WINDOW_MS) {
    failures.set(username, { count: 1, first: now });
  } else {
    entry.count += 1;
  }
}

export function signIn(
  usernameRaw: string,
  password: string,
  now = new Date(),
): { ok: true; user: User; token: string } | { ok: false; failure: SignInFailure } {
  const username = normaliseUsername(usernameRaw);
  if (isLocked(username, now.getTime())) return { ok: false, failure: "locked" };
  const row = db().prepare("SELECT * FROM users WHERE username = ?").get(username) as
    | UserRow
    | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    recordFailure(username, now.getTime());
    return { ok: false, failure: "bad_credentials" };
  }
  failures.delete(username);
  return { ok: true, user: toUser(row), token: createSession(row.id, now) };
}

/** Tests only: forget every recorded failure. */
export function resetSignInFailuresForTests(): void {
  failures.clear();
}

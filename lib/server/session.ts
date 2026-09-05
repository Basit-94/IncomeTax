/**
 * The one server-side session resolver (plan.md §3.2: "Implement one
 * server-side session resolver used by vault, runs, outputs, memory, and shared
 * return APIs").
 *
 * Two kinds of session, both server-issued, both carried in an HttpOnly cookie:
 *
 *  - `demo`    — for the three synthetic personas only. Anyone may mint one; it
 *                can only reach rows whose owner_kind is "demo", which are all
 *                invented. This is how a hosted demo works with no backend.
 *  - `bridged` — a real Java session exchanged through a verified bridge: the
 *                server asks the backend who owns the bearer token, and only the
 *                backend's answer becomes the owner. A token prefix, a body field
 *                or a client-minted `vault_session_*` string never does (§3.2:
 *                "Existing client-minted tokens cannot authorize access to real
 *                vault records").
 *
 * Framework-free on purpose: routes hand in the Cookie header and get a
 * Set-Cookie string back, so the logic is unit-testable without Next.
 */

import { createHash, randomBytes } from "crypto";
import { PERSONAS } from "../personas";

export type OwnerKind = "demo" | "citizen";

export interface Owner {
  pan: string;
  kind: OwnerKind;
  displayName: string;
}

export interface ServerSession {
  /** The raw cookie value. Only its hash is ever stored. */
  id: string;
  owner: Owner;
  kind: "demo" | "bridged";
  createdAt: string;
  expiresAt: string;
}

export interface SessionStore {
  get(idHash: string): Promise<ServerSession | null>;
  put(idHash: string, session: ServerSession): Promise<void>;
  delete(idHash: string): Promise<void>;
}

export const SESSION_COOKIE = "wapsi_sid";
export const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;

export function hashSessionId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

/* ------------------------------------------------------------- memory store -- */

/** Process-lifetime store. The default when no database is configured; also the test double. */
export class MemorySessionStore implements SessionStore {
  private readonly map = new Map<string, ServerSession>();
  async get(idHash: string) {
    return this.map.get(idHash) ?? null;
  }
  async put(idHash: string, session: ServerSession) {
    this.map.set(idHash, session);
  }
  async delete(idHash: string) {
    this.map.delete(idHash);
  }
}

/* ---------------------------------------------------------------- resolver -- */

export interface Clock {
  now(): Date;
}
const systemClock: Clock = { now: () => new Date() };

export class SessionResolver {
  constructor(
    private readonly store: SessionStore,
    private readonly clock: Clock = systemClock,
  ) {}

  /** Parse the Cookie header, look the session up, drop it if expired. */
  async resolve(cookieHeader: string | null | undefined): Promise<ServerSession | null> {
    const id = readCookie(cookieHeader, SESSION_COOKIE);
    if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
    const hash = hashSessionId(id);
    const session = await this.store.get(hash);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= this.clock.now().getTime()) {
      await this.store.delete(hash);
      return null;
    }
    return session;
  }

  /**
   * A demo session for one of the seeded personas. Refuses any other PAN: a
   * demo session must not be a way to claim a real person's records.
   */
  async issueDemo(personaId: string): Promise<ServerSession | null> {
    const persona = Object.values(PERSONAS).find((p) => p.id === personaId);
    if (!persona) return null;
    return this.issue({ pan: persona.pan, kind: "demo", displayName: persona.name }, "demo");
  }

  /** A session for an owner the backend has vouched for. The caller did the vouching. */
  async issueBridged(owner: Owner): Promise<ServerSession> {
    return this.issue({ ...owner, kind: "citizen" }, "bridged");
  }

  async revoke(cookieHeader: string | null | undefined): Promise<void> {
    const id = readCookie(cookieHeader, SESSION_COOKIE);
    if (id) await this.store.delete(hashSessionId(id));
  }

  private async issue(owner: Owner, kind: ServerSession["kind"]): Promise<ServerSession> {
    const now = this.clock.now();
    const session: ServerSession = {
      id: randomBytes(32).toString("hex"),
      owner,
      kind,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS).toISOString(),
    };
    await this.store.put(hashSessionId(session.id), session);
    return session;
  }
}

/* ------------------------------------------------------------------ bridge -- */

export type BridgeResult =
  | { ok: true; owner: Owner }
  | { ok: false; reason: "invalid_token" | "backend_unreachable" | "backend_error" | "bad_answer" };

/**
 * Ask the Java backend who owns a bearer token (GET /api/v1/auth/session). The
 * backend's answer is the only thing that becomes an owner. Unreachable is a
 * distinct outcome from rejected: the first means "try later", the second
 * means "no".
 */
export async function verifyBackendToken(
  token: string,
  backendBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<BridgeResult> {
  if (!token || token.startsWith("mock-") || token.startsWith("vault_session_")) {
    return { ok: false, reason: "invalid_token" };
  }
  let res: Response;
  try {
    res = await fetchImpl(`${backendBase}/api/v1/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { ok: false, reason: "backend_unreachable" };
  }
  if (res.status === 401) return { ok: false, reason: "invalid_token" };
  if (!res.ok) return { ok: false, reason: "backend_error" };
  let body: { pan?: unknown };
  try {
    body = await res.json();
  } catch {
    return { ok: false, reason: "bad_answer" };
  }
  if (typeof body.pan !== "string" || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(body.pan)) {
    return { ok: false, reason: "bad_answer" };
  }
  const persona = Object.values(PERSONAS).find((p) => p.pan === body.pan);
  return {
    ok: true,
    owner: {
      pan: body.pan,
      kind: "citizen",
      displayName: persona?.name ?? `Citizen ${body.pan.slice(5, 9)}`,
    },
  };
}

/* ----------------------------------------------------------------- cookies -- */

export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookie(session: ServerSession, secure: boolean): string {
  const maxAge = Math.max(
    0,
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
  );
  return [
    `${SESSION_COOKIE}=${session.id}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearedSessionCookie(secure: boolean): string {
  return [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", secure ? "Secure" : ""]
    .filter(Boolean)
    .join("; ");
}

/** The owner test every data operation runs (§3.2: "Owner checks belong in every data operation"). */
export function ownsPan(session: ServerSession | null, pan: string): boolean {
  return !!session && session.owner.pan.toUpperCase() === pan.trim().toUpperCase();
}

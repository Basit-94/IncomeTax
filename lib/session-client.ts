/**
 * Browser side of the server session (plan.md §3.2). The client copy in
 * localStorage (lib/auth-client.ts SessionInfo) is what the UI shows; the
 * HttpOnly cookie the server sets here is what authorises data access. This
 * module turns the former into the latter:
 *
 *  - a mock session for a seeded persona → a server demo session;
 *  - a real Java token → the verified bridge;
 *  - a client-minted `vault_session_*` → nothing. There is no owner to vouch
 *    for it, so private storage stays closed until the account is verified.
 */

import type { SessionInfo } from "./auth-client";
import { findPersonaByPan } from "./personas";

export interface ServerSessionInfo {
  owner: { pan: string; kind: "demo" | "citizen"; displayName: string };
  kind: "demo" | "bridged";
  expiresAt: string;
  durable?: boolean;
}

export type EnsureResult =
  | { ok: true; session: ServerSessionInfo }
  | { ok: false; reason: "no_client_session" | "unverifiable" | "backend_unreachable" | "rejected" | "network" };

export async function currentServerSession(): Promise<ServerSessionInfo | null> {
  try {
    const res = await fetch("/api/session", { credentials: "same-origin" });
    if (!res.ok) return null;
    const body = await res.json();
    return body.ok ? (body as ServerSessionInfo) : null;
  } catch {
    return null;
  }
}

export async function ensureServerSession(client: SessionInfo | null): Promise<EnsureResult> {
  if (!client) return { ok: false, reason: "no_client_session" };

  const existing = await currentServerSession();
  if (existing && existing.owner.pan === client.pan.toUpperCase()) {
    return { ok: true, session: existing };
  }

  try {
    if (client.isMock || client.token.startsWith("mock-") || client.token.startsWith("vault_session_")) {
      const persona = findPersonaByPan(client.pan);
      if (!persona) return { ok: false, reason: "unverifiable" };
      const res = await fetch("/api/session/demo", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.id }),
      });
      if (!res.ok) return { ok: false, reason: "rejected" };
      return { ok: true, session: (await res.json()) as ServerSessionInfo };
    }

    const res = await fetch("/api/session/bridge", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: client.token }),
    });
    if (res.status === 503) return { ok: false, reason: "backend_unreachable" };
    if (!res.ok) return { ok: false, reason: "rejected" };
    return { ok: true, session: (await res.json()) as ServerSessionInfo };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function endServerSession(): Promise<void> {
  try {
    await fetch("/api/session", { method: "DELETE", credentials: "same-origin" });
  } catch {
    // The cookie expires on its own; the client copy is cleared by the caller.
  }
}

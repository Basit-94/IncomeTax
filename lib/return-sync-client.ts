/**
 * Browser side of the shared return snapshot (plan.md §3.3). The manual
 * journey keeps its ReturnState locally (fast, offline-capable, undoable) and
 * mirrors every change to the server with the revision it last saw. A 409
 * means the agent wrote in between: the caller adopts the newer snapshot
 * instead of overwriting it. On arrival, `pullReturn` fetches whatever the
 * agent may have changed while Manual was away.
 */

import type { ReturnState } from "./return/state";

export interface MirrorResult {
  ok: boolean;
  revision: number | null;
  /** Set on a conflict: the newer state the client should adopt. */
  adopt?: ReturnState;
  unavailable?: boolean;
}

let knownRevision: number | null = null;

export function knownReturnRevision(): number | null {
  return knownRevision;
}

export async function pullReturn(): Promise<{ state: ReturnState; revision: number } | null> {
  try {
    const res = await fetch("/api/return", { credentials: "same-origin" });
    if (!res.ok) return null;
    const body = (await res.json()) as { snapshot: { state: ReturnState; revision: number } | null };
    if (!body.snapshot) return null;
    knownRevision = body.snapshot.revision;
    return body.snapshot;
  } catch {
    return null;
  }
}

export async function mirrorReturn(state: ReturnState): Promise<MirrorResult> {
  try {
    const res = await fetch("/api/return", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, expectedRevision: knownRevision }),
    });
    if (res.status === 409) {
      const body = (await res.json()) as { current: { state: ReturnState; revision: number } };
      knownRevision = body.current.revision;
      return { ok: false, revision: knownRevision, adopt: body.current.state };
    }
    if (res.status === 503 || res.status === 401) return { ok: false, revision: knownRevision, unavailable: true };
    if (!res.ok) return { ok: false, revision: knownRevision };
    const body = (await res.json()) as { snapshot: { revision: number } };
    knownRevision = body.snapshot.revision;
    return { ok: true, revision: knownRevision };
  } catch {
    return { ok: false, revision: knownRevision, unavailable: true };
  }
}

export function forgetReturnRevision() {
  knownRevision = null;
}

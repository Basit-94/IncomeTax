/**
 * Submitting a return to the Java backend, with the outcome named
 * (plan.md §2: "handleFileCommit continues after non-2xx HTTP responses;
 * exception fallback is synthetic — fix shared outcome handling before
 * exposing filing to the harness"; §8: "Filing tests explicitly reject non-2xx
 * responses and distinguish accepted, pending, failed, and simulated
 * outcomes").
 *
 * The four outcomes:
 *  - accepted   — the server answered 2xx with a submission id. Filed.
 *  - failed     — the server answered, and said no (or nonsense). NOT filed.
 *  - unreachable — no server answered. NOT filed; the caller may offer a
 *                  clearly labelled simulated filing instead.
 *  - simulated  — the caller chose the prototype's simulation. Labelled as
 *                  such everywhere it is shown; never described as accepted.
 */

import { stableIdempotencyKey } from "../submission-key";
import type { Persona } from "../types";

export type FilingOutcome =
  | { kind: "accepted"; submissionId: string; idempotencyKey: string }
  | { kind: "failed"; status: number; detail: string; idempotencyKey: string }
  | { kind: "unreachable"; idempotencyKey: string }
  | { kind: "simulated"; submissionId: string; idempotencyKey: string };

export interface SubmissionRequest {
  persona: Persona;
  regime: "new" | "old";
  backendUrl: string;
}

/** The exact payload the backend receives; exported so the agent's review card can show it. */
export function buildSubmission({ persona, regime }: Omit<SubmissionRequest, "backendUrl">) {
  const facts = persona.facts.map((f) => ({
    kind: f.kind,
    amountPaise: f.amount * 100,
    // Asset-class metadata lets the backend price s.111A/112A/112 gains at
    // their real rates. undefined keys drop out of the JSON.
    assetClass: f.capitalGains?.assetClass,
    holding: f.capitalGains?.holding,
  }));
  const claims = persona.claims.map((c) => ({ section: c.section, amountPaise: c.amount * 100 }));
  const tdsCreditsPaise = persona.taxPaid.reduce((sum, t) => sum + t.amount, 0) * 100;
  const ruleSetVersion = regime === "old" ? "2026-27-old" : "2026-27-new";
  const idempotencyKey = stableIdempotencyKey({
    personaId: persona.id,
    assessmentYear: "2026-27",
    ruleSetVersion,
    facts,
    claims,
    tdsCreditsPaise,
  });
  return {
    idempotencyKey,
    body: {
      idempotencyKey,
      // The PAN is the cross-year join key; without it the ledger append failed.
      citizenReference: persona.pan || persona.id,
      assessmentYear: "2026-27",
      ruleSetVersion,
      ageBand: persona.age >= 80 ? "above_80" : persona.age >= 60 ? "60_to_80" : "below_60",
      facts,
      claims,
      tdsCreditsPaise,
    },
  };
}

export async function submitReturn(
  req: SubmissionRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<Exclude<FilingOutcome, { kind: "simulated" }>> {
  const { idempotencyKey, body } = buildSubmission(req);
  let res: Response;
  try {
    res = await fetchImpl(`${req.backendUrl}/api/v1/returns/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { kind: "unreachable", idempotencyKey };
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (typeof j?.message === "string") detail = j.message;
    } catch {
      // the status is the detail
    }
    return { kind: "failed", status: res.status, detail, idempotencyKey };
  }
  try {
    const data = await res.json();
    if (typeof data?.submissionId === "string" && data.submissionId) {
      return { kind: "accepted", submissionId: data.submissionId, idempotencyKey };
    }
  } catch {
    // fall through: a 2xx without a submission id is not an acceptance we can record
  }
  return { kind: "failed", status: res.status, detail: "The server accepted the request but returned no submission id.", idempotencyKey };
}

/**
 * The prototype's stand-in when no backend exists. Deterministic from the
 * idempotency key so a retry cannot mint a second receipt (§8: "A response
 * lost after acceptance is resolved via idempotency ... does not trigger a new
 * simulated submission").
 */
export function simulatedFiling(idempotencyKey: string): Extract<FilingOutcome, { kind: "simulated" }> {
  return { kind: "simulated", submissionId: `SIM-${idempotencyKey.slice(0, 10).toUpperCase()}`, idempotencyKey };
}

/** Whether an outcome may stamp the return filed. */
export function outcomeStampsFiled(outcome: FilingOutcome): boolean {
  return outcome.kind === "accepted" || outcome.kind === "simulated";
}

/**
 * The sign-in outcome, shared by the dedicated /signin page (user request
 * 2026-09-06: "the sign page should be its own thing; after sign-in the person
 * is greeted by the Agentic home, and no filing flow starts by itself").
 *
 * Everything here mirrors what app/page.tsx does inline for the Manual journey —
 * the same client session copy, the same persisted ReturnState shape, the same
 * seeded personas — so the two entry points agree on what "signed in" means.
 * The server session (HttpOnly cookie) is established best-effort; the Agentic
 * page re-establishes it on arrival anyway.
 */

import { clearSession, ensureSession, saveSession, type SessionInfo } from "./auth-client";
import type { Dict } from "./i18n";
import { findPersonaByPan } from "./personas";
import { CURRENT_VERSION, save as savePersist } from "./return/persist";
import { mirrorReturn } from "./return-sync-client";
import type { ReturnState } from "./return/state";
import { ensureServerSession, type EnsureResult } from "./session-client";
import type { Lang, Persona } from "./types";
import { validatePan } from "./validate";
import type { CitizenVaultUser } from "./vault/vault-store";

export const MOCK_OTP = "949494";

export function panIssueMessage(raw: string, t: Dict): string {
  const result = validatePan(raw);
  if (!result.ok) {
    return result.issue.kind === "incomplete" ? t.validate.panTooShort(result.issue.length) : t.validate.panShape;
  }
  return "";
}

/** A citizen the seeded returns know nothing about: empty facts, nothing prefilled. */
export function blankPersona(pan: string, name: string, lang: Lang): Persona {
  return {
    id: "custom",
    name: name || `Citizen ${pan.slice(5, 9)}`,
    age: 30,
    city: "",
    state: "",
    occupation: "Taxpayer",
    pan,
    mobile: "",
    preferredLang: lang,
    situation: "Registered citizen account",
    act: 1,
    actLabel: "Act I",
    embodies: "Registered citizen",
    assessmentYear: "2026-27",
    facts: [],
    taxPaid: [],
    claims: [],
    banks: [],
    refund: { state: "not_filed", amount: 0, holds: [], timeline: [] },
    notices: [],
  };
}

/** The persona a PAN resolves to: one of the three seeded citizens, or a blank one. */
export function personaForPan(pan: string, lang: Lang): Persona {
  return findPersonaByPan(pan) ?? blankPersona(pan, "", lang);
}

export function returnStateFor(persona: Persona, lang: Lang): ReturnState {
  return {
    version: CURRENT_VERSION,
    lang,
    personaId: persona.id === "custom" ? "custom" : persona.id,
    baselinePersona: persona,
    persona,
    corrections: [],
    confirmedFactIds: [],
    regime: "new",
  };
}

/** The same client session app/page.tsx mints when a vault account is created (no backend row yet). */
export function sessionForVaultUser(user: CitizenVaultUser): SessionInfo {
  return {
    token: `vault_session_${user.pan}_${Date.now()}`,
    pan: user.pan,
    fullName: user.fullName || `Citizen ${user.pan.slice(5, 9)}`,
    personalisedMessage: "Welcome to Wapsi",
    isMock: true,
  };
}

export type SignInOutcome =
  | { ok: true; session: SessionInfo }
  | { ok: false; reason: "wrong_code" | "unreachable" | "rejected"; detail?: string };

/**
 * Verify the code with the backend (registering the PAN on first sight), then
 * persist the client session and the return snapshot. Nothing about filing is
 * started here — the person lands on the Agentic home and decides.
 */
export async function completeSignIn(persona: Persona, code: string, lang: Lang): Promise<SignInOutcome> {
  if (code !== MOCK_OTP) return { ok: false, reason: "wrong_code" };
  const result = await ensureSession(persona.pan, persona.name, code);
  if (!result.ok) {
    return result.failure.kind === "unreachable"
      ? { ok: false, reason: "unreachable" }
      : { ok: false, reason: "rejected", detail: result.failure.kind === "rejected" ? result.failure.detail : undefined };
  }
  const server = await persistSignIn(result.session, persona, lang);
  if (!server.ok) {
    // No server session means /app would bounce straight back here; say so instead of looping.
    clearSession();
    return server.reason === "rejected" ? { ok: false, reason: "rejected" } : { ok: false, reason: "unreachable" };
  }
  return { ok: true, session: result.session };
}

/**
 * Save the client copy and the return, then establish the server session the
 * Agentic home requires. A mock session for a PAN no seeded persona knows
 * (backend down, or a vault sign-up) cannot get one, and comes back `unverifiable`.
 */
export async function persistSignIn(session: SessionInfo, persona: Persona, lang: Lang): Promise<EnsureResult> {
  saveSession(session);
  const state = returnStateFor(persona, lang);
  savePersist(state);
  try {
    const res = await ensureServerSession(session);
    if (res.ok) {
      try {
        await mirrorReturn(state);
      } catch {
        // best-effort mirror to server store
      }
    }
    return res;
  } catch {
    return { ok: false, reason: "network" };
  }
}

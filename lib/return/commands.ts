/**
 * The one return mutation path (plan.md §3.3: "Extract behavior from
 * app/page.tsx into framework-independent return commands ... Manual and
 * Agentic use the same commands").
 *
 * Every command is a pure function ReturnState → ReturnState built from the
 * same primitives the manual journey already used (applyCorrection,
 * revertCorrection, confirmFact, effectivePersona). The ledger semantics they
 * encode were lifted verbatim from the page handlers they replace, so the two
 * modes cannot drift: a figure the agent produces is the figure the manual
 * board would have produced from the same command.
 *
 * Versioning lives one layer up (snapshot-store.ts): a command carries an
 * expected revision and an idempotency key; this module only knows how to
 * change a return.
 */

import type { IngestedDocument, SelfAssessmentPayment } from "../../context/TaxReturnContext";
import type { AISFeedbackCode } from "../compliance/aisFeedback";
import type { IncomeKind, Persona, Provenance, TaxAlreadyPaid } from "../types";
import { computeForPersona } from "./compute";
import {
  applyCorrection,
  confirmFact,
  effectivePersona,
  revertCorrection,
  type Correction,
  type ReturnState,
} from "./state";

export type ReturnCommand =
  | { type: "confirm_fact"; factId: string }
  | { type: "sign_off_all" }
  | {
      type: "correct_fact";
      factId: string;
      amount: number;
      reason: string;
      feedbackCode?: AISFeedbackCode;
    }
  | { type: "revert_correction"; correctionId: string }
  | { type: "choose_regime"; regime: "new" | "old" }
  | { type: "record_payment"; payment: SelfAssessmentPayment }
  | { type: "stage_revision" }
  | { type: "import_document"; document: IngestedDocument; today: string }
  | { type: "finalize_filing"; filedAt: string; today: string }
  /** Income the citizen reports themself — nothing a third party filed. */
  | { type: "declare_income"; kind: IncomeKind; amount: number; label: string; today: string }
  /** A Chapter VI-A claim the citizen asserts, with whether proof is attached. */
  | { type: "declare_claim"; section: string; amount: number; label: string; evidenceAttached: boolean };

export type CommandResult =
  | { ok: true; state: ReturnState; changed: boolean }
  | { ok: false; error: "unknown_fact" | "unknown_correction" | "invalid_amount" | "nothing_to_do" | "already_filed"; message: string };

export interface CommandContext {
  /** Injected so tests and replays are deterministic. */
  now: () => string;
  newId: (prefix: string) => string;
}

export const defaultCommandContext: CommandContext = {
  now: () => new Date().toISOString(),
  newId: (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
};

/** Every item that can be confirmed or corrected, by id, across the three collections. */
function findItem(persona: Persona, id: string) {
  const fact = persona.facts.find((f) => f.id === id);
  if (fact) return { item: fact, target: "fact" as const };
  const tax = persona.taxPaid.find((t) => t.id === id);
  if (tax) return { item: tax, target: "tax" as const };
  const claim = persona.claims.find((c) => c.id === id);
  if (claim) return { item: claim, target: "claim" as const };
  return null;
}

export function applyReturnCommand(
  state: ReturnState,
  command: ReturnCommand,
  ctx: CommandContext = defaultCommandContext,
): CommandResult {
  switch (command.type) {
    case "confirm_fact": {
      if (!findItem(state.persona, command.factId)) {
        return { ok: false, error: "unknown_fact", message: `No fact ${command.factId} on this return.` };
      }
      const next = confirmFact(state, command.factId);
      return { ok: true, state: next, changed: next !== state };
    }

    case "sign_off_all": {
      let next = state;
      for (const item of [...state.persona.facts, ...state.persona.taxPaid, ...state.persona.claims]) {
        next = confirmFact(next, item.id);
      }
      return { ok: true, state: next, changed: next !== state };
    }

    case "correct_fact":
      return correctFact(state, command, ctx);

    case "revert_correction": {
      if (!state.corrections.some((c) => c.id === command.correctionId)) {
        return { ok: false, error: "unknown_correction", message: `No correction ${command.correctionId}.` };
      }
      const next = revertCorrection(state, command.correctionId);
      return { ok: true, state: next, changed: next !== state };
    }

    case "choose_regime": {
      if (state.regime === command.regime) return { ok: true, state, changed: false };
      return { ok: true, state: { ...state, regime: command.regime }, changed: true };
    }

    case "record_payment":
      return recordPayment(state, command.payment);

    case "stage_revision":
      return stageRevision(state);

    case "import_document":
      return importDocument(state, command.document, command.today, ctx);

    case "finalize_filing":
      return finalizeFiling(state, command.filedAt, command.today, ctx);

    case "declare_income": {
      if (!Number.isFinite(command.amount) || command.amount <= 0) {
        return { ok: false, error: "invalid_amount", message: "Declared income must be a positive whole-rupee figure." };
      }
      const fact = {
        id: ctx.newId("self-income"),
        kind: command.kind,
        label: command.label,
        amount: Math.round(command.amount),
        provenance: {
          reporter: "You",
          reporterKind: "self" as const,
          filedOn: command.today,
          statement: "self" as const,
          onlyReporterCanFix: false,
        },
      };
      const add = (p: Persona): Persona => ({ ...p, facts: [...p.facts, fact] });
      const next: ReturnState = { ...state, baselinePersona: add(state.baselinePersona) };
      return { ok: true, changed: true, state: { ...next, persona: effectivePersona(next), confirmedFactIds: [...state.confirmedFactIds, fact.id] } };
    }

    case "declare_claim": {
      if (!Number.isFinite(command.amount) || command.amount <= 0) {
        return { ok: false, error: "invalid_amount", message: "A claim must be a positive whole-rupee figure." };
      }
      const existing = state.baselinePersona.claims.find((c) => c.section === command.section);
      const claim = {
        id: existing?.id ?? ctx.newId("self-claim"),
        section: command.section,
        label: command.label,
        amount: Math.round(command.amount),
        evidenceAttached: command.evidenceAttached,
      };
      const put = (p: Persona): Persona => ({
        ...p,
        claims: existing ? p.claims.map((c) => (c.id === claim.id ? claim : c)) : [...p.claims, claim],
      });
      const next: ReturnState = { ...state, baselinePersona: put(state.baselinePersona) };
      return { ok: true, changed: true, state: { ...next, persona: effectivePersona(next) } };
    }
  }
}

/* --------------------------------------------------------------- commands -- */

function correctFact(
  state: ReturnState,
  command: Extract<ReturnCommand, { type: "correct_fact" }>,
  ctx: CommandContext,
): CommandResult {
  const found = findItem(state.persona, command.factId);
  if (!found) return { ok: false, error: "unknown_fact", message: `No fact ${command.factId} on this return.` };
  if (!Number.isFinite(command.amount) || command.amount < 0) {
    return { ok: false, error: "invalid_amount", message: "A corrected amount must be zero or more whole rupees." };
  }
  const amount = Math.round(command.amount);
  if (found.item.amount === amount) return { ok: true, state, changed: false };

  const correction: Correction = {
    id: ctx.newId("corr"),
    factId: command.factId,
    field: "amount",
    previous: found.item.amount,
    next: amount,
    reason: command.reason.trim() || "Figure corrected by the citizen",
    // A self-declared figure being edited is by definition "not fully correct".
    feedbackCode: command.feedbackCode ?? "CODE_3",
    at: ctx.now(),
    target: found.target,
  };
  let next = applyCorrection(state, correction);

  // Rakesh's AIS-mismatch hold releases when the capital-gains figure goes to
  // zero — the one persona-specific rule the manual dispute path carried.
  if (state.persona.id === "rakesh" && command.factId === "rakesh-capital-gains" && amount === 0) {
    const release = (p: Persona): Persona => ({
      ...p,
      refund: {
        ...p.refund,
        holds: p.refund.holds.map((h) => (h.kind === "ais_mismatch" ? { ...h, resolved: true } : h)),
      },
    });
    next = { ...next, baselinePersona: release(next.baselinePersona), persona: release(next.persona) };
  }
  return { ok: true, state: next, changed: true };
}

/**
 * Challan 280 paid, ledger side. The challan becomes a tax-paid row under
 * s.140A so the ledger's own engine figure clears. (The bridge deliberately
 * does not mirror 140A rows back into the reconciliation context — see
 * lib/return/upstreamSync.ts — or the challan would be credited twice.)
 */
function recordPayment(state: ReturnState, payment: SelfAssessmentPayment): CommandResult {
  const id = `sat-${payment.bsrCode}-${payment.challanNo}`;
  if (state.baselinePersona.taxPaid.some((t) => t.id === id)) {
    // Same challan twice is one credit (§8: "one credit per challan").
    return { ok: true, state, changed: false };
  }
  const entry: TaxAlreadyPaid = {
    id,
    label: "Self-assessment tax paid (Challan 280)",
    amount: payment.amount,
    section: "140A",
    provenance: {
      reporter: "Self — Challan 280",
      reporterKind: "self",
      identifier: `BSR ${payment.bsrCode} · serial ${payment.challanNo}`,
      filedOn: payment.date,
      statement: "self",
      onlyReporterCanFix: false,
    },
  };
  const add = (p: Persona): Persona => ({ ...p, taxPaid: [...(p.taxPaid || []), entry] });
  const baselinePersona = add(state.baselinePersona);
  const persona = add(state.persona);
  const refundOrDue = computeForPersona(persona, state.regime ?? "new").refundOrDue;
  const refund = (p: Persona): Persona["refund"] =>
    refundOrDue > 0
      ? { ...p.refund, state: "under_review", filedOn: p.refund.filedOn || payment.date, amount: refundOrDue }
      : { ...p.refund, state: "not_filed", amount: 0 };

  return {
    ok: true,
    changed: true,
    state: {
      ...state,
      baselinePersona: { ...baselinePersona, refund: refund(baselinePersona) },
      persona: { ...persona, refund: refund(persona) },
      confirmedFactIds: [...state.confirmedFactIds, entry.id],
    },
  };
}

/**
 * s.139(9) one-click resolver, ledger side: accept the reported figure on every
 * income row the citizen pulled below what was reported, by reverting the
 * corrections on it and confirming it. Reverting keeps the corrections in
 * history, so nothing the citizen said is lost.
 */
function stageRevision(state: ReturnState): CommandResult {
  const effective = new Map(state.persona.facts.map((f) => [f.id, f.amount]));
  const shortIds = new Set(
    state.baselinePersona.facts.filter((f) => (effective.get(f.id) ?? 0) < f.amount).map((f) => f.id),
  );
  if (shortIds.size === 0) {
    return { ok: false, error: "nothing_to_do", message: "No declared figure is below what was reported." };
  }
  let next = state;
  for (const c of state.corrections) {
    if (!c.reverted && shortIds.has(c.factId)) next = revertCorrection(next, c.id);
  }
  for (const id of shortIds) next = confirmFact(next, id);
  return { ok: true, state: next, changed: true };
}

/**
 * Form 16 / AIS fields, ledger side. What the parser read is the REPORTER's
 * statement, so it lands in the baseline persona — the department's side — and
 * the effective persona is replayed through the citizen's corrections on top.
 * A first-time filer with no salary row yet gets one created from the document.
 * Extracted values are proposals (§4.3): a row that already exists is updated,
 * never summed with the document.
 */
function importDocument(state: ReturnState, doc: IngestedDocument, today: string, ctx: CommandContext): CommandResult {
  const { grossSalary, tds } = doc.extracted;
  if (grossSalary === undefined && tds === undefined) {
    return { ok: false, error: "nothing_to_do", message: "The document carried no salary or tax figure." };
  }
  const statement: Provenance["statement"] = doc.kind === "AIS" ? "AIS" : "26AS";
  const fromDocument = (reporter: string): Provenance => ({
    reporter,
    reporterKind: "employer",
    identifier: doc.fileName,
    filedOn: today,
    statement,
    onlyReporterCanFix: true,
  });
  const upgrade = (p: Persona): Persona => {
    let facts = p.facts;
    let taxPaid = p.taxPaid;
    if (grossSalary !== undefined) {
      const i = facts.findIndex((f) => f.kind === "salary");
      facts =
        i >= 0
          ? facts.map((f, idx) =>
              idx === i ? { ...f, amount: grossSalary, provenance: { ...f.provenance, identifier: doc.fileName, statement } } : f,
            )
          : [
              ...facts,
              {
                id: ctx.newId("ingested-salary"),
                label: "Gross salary (from uploaded Form 16)",
                amount: grossSalary,
                kind: "salary",
                provenance: fromDocument("Employer, per uploaded document"),
              },
            ];
    }
    if (tds !== undefined) {
      const i = taxPaid.findIndex((x) => x.section.includes("192"));
      taxPaid =
        i >= 0
          ? taxPaid.map((x, idx) =>
              idx === i ? { ...x, amount: tds, provenance: { ...x.provenance, identifier: doc.fileName, statement } } : x,
            )
          : [
              ...taxPaid,
              {
                id: ctx.newId("ingested-tds"),
                label: "Tax deducted on salary (from uploaded Form 16)",
                amount: tds,
                section: "192",
                provenance: fromDocument("Employer, per uploaded document"),
              },
            ];
    }
    return { ...p, facts, taxPaid };
  };
  const next: ReturnState = { ...state, baselinePersona: upgrade(state.baselinePersona) };
  return { ok: true, state: { ...next, persona: effectivePersona(next) }, changed: true };
}

/**
 * Stamp the return filed. Only called once a submission was accepted or an
 * explicitly simulated filing was confirmed (filing.ts decides which; a non-2xx
 * answer never reaches here). Idempotent: a second stamp is a no-op.
 */
function finalizeFiling(state: ReturnState, filedAt: string, today: string, ctx: CommandContext): CommandResult {
  if (state.filedAt) return { ok: false, error: "already_filed", message: "This return is already filed." };
  const stamp = (p: Persona): Persona => ({
    ...p,
    refund: {
      ...p.refund,
      state: "filed_unverified",
      filedOn: today,
      timeline: [
        ...p.refund.timeline.filter((e) => e.headlineKey !== "filed"),
        { id: ctx.newId("filing"), on: today, state: "filed_unverified", headlineKey: "filed", actor: "citizen" },
      ],
    },
  });
  return {
    ok: true,
    changed: true,
    state: { ...state, filedAt, baselinePersona: stamp(state.baselinePersona), persona: stamp(state.persona) },
  };
}

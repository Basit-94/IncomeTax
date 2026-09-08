/**
 * Server-side actions the conversation can take (2026-09-07 rebuild). The brain (`brain.ts`) decides WHEN;
 * this module decides HOW, with the same services the UI uses — the vault, the command store, the engine —
 * so a figure the agent shows is the figure the Manual board would compute from the same return.
 *
 * Nothing here applies a financial change on its own. Documents are read only once the person has said yes
 * to a consent card (`run.state.consents`); changes are staged as commands and applied by `handleConfirmation`
 * in runtime.ts after a review card is accepted; a payment runs only after the person picks a method on the
 * challan card. The model calling a tool is never a confirmation (plan §5.2).
 */

import { z } from "zod";
import type { SelfAssessmentPayment } from "../../context/TaxReturnContext";
import { CHALLAN_MAJOR_HEAD_LABEL, CHALLAN_MINOR_HEAD_LABEL, splitTaxAndCess, syntheticChallanIdentifiers } from "../compliance/challan280";
import { generateItrvPdf } from "../compliance/itrvPdf";
import type { ExtractedFields } from "../compliance/pdfExtract";
import { NEW_REGIME_ALLOWED_SECTIONS, OLD_REGIME_CLAIM_CAPS } from "../engine/constants";
import { getLatestReviewForPan, acceptCAReview } from "../ca/ca-store";
import type { AgenticStrings } from "../i18n/agenticStrings";
import { evaluateSalariedSlice } from "../knowledge/applicability";
import { assessAdvice, type AdviceAssessment, type AdviceContext } from "../knowledge/advice";
import { scanOpportunities } from "../knowledge/opportunities";
import { PERIOD_FY_2025_26 } from "../knowledge/provisions";
import { cite } from "../knowledge/retrieval";
import type { TaxpayerFacts } from "../knowledge/types";
import { formatMoney } from "../money";
import { applyReturnCommand, type ReturnCommand } from "../return/commands";
import { compareForPersona, computeForPersona } from "../return/compute";
import { CURRENT_VERSION } from "../return/persist";
import type { ReturnSnapshotStore, VersionedReturn } from "../return/snapshot-store";
import type { ReturnState } from "../return/state";
import { DEDUCTION_FIELDS, formFieldsFor, yearAnswersFrom } from "../return/year-form";
import { carryDefaults, emptyYearIntake, filingSection, gapGroups, inferForm, regimeLean } from "../return/year-intake";
import type { Owner } from "../server/session";
import type { IncomeKind, Lang, Persona } from "../types";
import type { VaultService } from "../vault/service";
import type { DigiLockerProvider } from "../digilocker/types";
import { fetchedFacts, listIssuedDocuments } from "./digilocker";
import type { ModelAdapter } from "./model";
import { redactText, stripInjection } from "./redact";
import { newId, snapshotHash, type RunStore } from "./store";
import { runTool, type ToolContext } from "./tools";
import type { PlanStep, Question, ReviewCard, Run, RunBudget, RunEventPayload, SourceRef, StepId, StepState } from "./types";

export const AY = "2026-27";

export interface RuntimeDeps {
  store: RunStore;
  returns: ReturnSnapshotStore;
  vault: VaultService | null;
  model: ModelAdapter;
  /** The DigiLocker mock's record store (2026-09-07); absent in tests, where the PAN-seeded record is rebuilt in-process. */
  locker?: DigiLockerProvider;
  /** The CA system's store (2026-09-08), so Munshi ji can say where a review stands and compare the two versions. */
  caStore?: import("../ca/server-store").CAStore;
  budget: RunBudget;
  clock: () => string;
  /** Today's date for provenance/filing stamps; injected so tests are stable. */
  today: () => string;
}

export type Emit = (p: RunEventPayload) => Promise<unknown>;

/** Everything an action needs about the run it is acting for. */
export interface ActionCtx {
  deps: RuntimeDeps;
  owner: Owner;
  run: Run;
  s: AgenticStrings;
  emit: Emit;
}

/** The document rows a tool hands back — never a PAN, name or DOB. */
export type DocumentFields = Omit<ExtractedFields, "pan" | "name" | "dob">;

export function toolCtx(ctx: ActionCtx): ToolContext {
  return { owner: ctx.owner, runId: ctx.run.id, assessmentYear: AY, vault: ctx.deps.vault, returns: ctx.deps.returns, store: ctx.deps.store, today: ctx.deps.today() };
}

export function firstName(displayName: string | undefined | null): string {
  const n = (displayName ?? "").trim().split(/\s+/)[0] ?? "";
  // A masked or synthetic display name ("Citizen 7710") is not a name to greet with.
  return /^[A-Za-zऀ-෿฀-๿ក-៿]+$/.test(n) && !/^citizen$/i.test(n) && !/^real$/i.test(n) ? n : "";
}

export function dedupeSources(list: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = `${x.kind}:${x.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ------------------------------------------------------------------ steps -- */

const STEP_ORDER: StepId[] = ["classify", "plan", "gather", "resolve", "compute", "review", "confirm", "act", "outputs"];
const DEPENDS: Record<StepId, StepId[]> = { classify: [], plan: ["classify"], gather: ["plan"], resolve: ["gather"], compute: ["resolve"], review: ["compute"], confirm: ["review"], act: ["confirm"], outputs: ["act"] };

export function stepLabel(id: StepId, s: AgenticStrings): string {
  const labels: Record<StepId, string> = { classify: s.stepClassify, plan: s.stepPlan, gather: s.stepGather, resolve: s.stepResolve, compute: s.stepCompute, review: s.stepReview, confirm: s.stepConfirm, act: s.stepAct, outputs: s.stepOutputs };
  return labels[id];
}

/** The Progress panel's plan: the same nine steps, now a record of what the conversation actually did. */
export function freshSteps(s: AgenticStrings): PlanStep[] {
  return STEP_ORDER.map((id) => ({ id, label: stepLabel(id, s), state: "pending" as StepState, dependsOn: DEPENDS[id] }));
}

export function markStep(run: Run, id: StepId, state: StepState, note?: string): boolean {
  const before = run.state.steps.find((p) => p.id === id);
  if (!before || (before.state === state && (note === undefined || before.note === note))) return false;
  run.state.steps = run.state.steps.map((p) => (p.id === id ? { ...p, state, note: note ?? p.note } : p));
  return true;
}

/* --------------------------------------------------------------- snapshot -- */

export function blankPersona(owner: Owner): Persona {
  return {
    id: "custom", name: owner.displayName, age: 30, city: "", state: "", occupation: "Taxpayer", pan: owner.pan, mobile: "", preferredLang: "en",
    situation: "Registered citizen account", act: 1, actLabel: "Act I", embodies: "Registered citizen", assessmentYear: AY,
    facts: [], taxPaid: [], claims: [], banks: [], refund: { state: "not_filed", amount: 0, holds: [], timeline: [] }, notices: [],
  };
}

export async function ensureSnapshot(ctx: ActionCtx, personaForOwner: (owner: Owner) => Persona | null): Promise<VersionedReturn | null> {
  const { deps, owner, run } = ctx;
  const existing = await deps.returns.get(owner, AY);
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
  if (existing) {
    // A CA audit that has not been merged yet lands on the snapshot once.
    if (hasCa && caReview.caPersona) {
      const personaDiffers = snapshotHash(existing.state.persona) !== snapshotHash(caReview.caPersona);
      const targetRegime = caReview.caRegime || existing.state.regime || "new";
      if (personaDiffers || existing.state.regime !== targetRegime) {
        const rep = await deps.returns.replace(owner, AY, { ...existing.state, persona: caReview.caPersona, regime: targetRegime }, null);
        if (rep.ok) return rep.snapshot;
      }
    }
    return existing;
  }
  const persona = personaForOwner(owner);
  if (!persona && owner.kind === "demo") return null;
  const base: Persona = hasCa ? caReview.caPersona! : (persona ?? blankPersona(owner));
  const state: ReturnState = {
    version: CURRENT_VERSION, lang: run.lang, personaId: base.id === "custom" ? "custom" : base.id,
    baselinePersona: persona ?? base, persona: base, corrections: [], confirmedFactIds: [],
    regime: hasCa && caReview.caRegime ? caReview.caRegime : "new",
  };
  const created = await deps.returns.replace(owner, AY, state, null);
  return created.ok ? created.snapshot : await deps.returns.get(owner, AY);
}

/** The return as it WOULD be after the staged commands — for computing and previews, never persisted. */
export function projected(snapshot: VersionedReturn, cmds: ReturnCommand[] | undefined): ReturnState {
  let state = snapshot.state;
  for (const c of cmds ?? []) {
    const r = applyReturnCommand(state, c);
    if (r.ok) state = r.state;
  }
  return state;
}

/* ------------------------------------------------------------------ guard -- */

/** The guard's inputs, identical at compute, review and act (§5.2: one guard, one set of facts). */
export function adviceContext(ctx: ActionCtx): AdviceContext {
  const { run, owner, deps } = ctx;
  const a = run.state.answers;
  const residency = run.state.profile?.residency;
  return {
    ownerKind: owner.kind,
    today: deps.today(),
    resident: residency ? residency === "resident" : typeof a.resident === "boolean" ? a.resident : true,
    returnByDueDate: filingSection(deps.today(), AY) === "139(1)",
    completeFacts: a.inventory_confirmed === true,
  };
}

/**
 * Issues the guard raises that are disclosures rather than stops: the release has no reviewer yet, the inventory
 * was confirmed in conversation rather than a form, a claim has no receipt attached. Munshi ji says them; they do
 * not bar a simulated filing. Everything else (an income head the engine does not compute, surcharge, invalid
 * amounts) still blocks a card.
 */
const SOFT_ISSUES = new Set(["tax_review_required", "facts_incomplete", "claim_unverified", "election_unverified", "residency_unknown"]);

export function isSoftIssue(issue: AdviceAssessment["issues"][number]): boolean {
  if (SOFT_ISSUES.has(issue.code)) return true;
  if (issue.code === "deduction_unsupported") {
    const section = /^The (\S+) amount/.exec(issue.reason)?.[1];
    return !!section && (section in OLD_REGIME_CLAIM_CAPS || NEW_REGIME_ALLOWED_SECTIONS.has(section));
  }
  return false;
}

export function hardIssues(advice: AdviceAssessment) {
  return advice.issues.filter((i) => !isSoftIssue(i));
}

/* ------------------------------------------------------------- the return -- */

/** The person's return as the model may see it: no identifiers, every figure from the engine, every limit named. */
export function returnSummary(ctx: ActionCtx, snapshot: VersionedReturn) {
  const { run, deps } = ctx;
  const state = projected(snapshot, run.state.pendingCommands);
  const p = state.persona;
  const advice = assessAdvice(p, adviceContext(ctx));
  const both = compareForPersona(p);
  const regime = state.regime ?? "new";
  const isFiled = Boolean(state.filedAt || (p.refund?.state && p.refund.state !== "not_filed"));
  const filedAtDate = state.filedAt ?? (p.refund?.state && p.refund.state !== "not_filed" ? deps.today() : null);
  const figures = (b: ReturnType<typeof computeForPersona>) => ({
    grossIncome: b.grossIncome,
    standardDeduction: b.standardDeduction,
    deductionsAllowed: b.totalDeductions,
    taxableIncome: b.taxableIncome,
    slabTax: b.slabTax,
    taxBeforeRebate: b.taxBeforeRebate,
    rebate87A: b.rebate87A,
    marginalRelief: b.marginalReliefApplied,
    taxAfterRebate: b.taxAfterRebate,
    cess: b.cess,
    totalTax: b.totalTax,
    tdsAndTaxPaid: b.tdsCredits,
    refundOrDue: b.refundOrDue,
  });
  const taxSaving = Math.abs(both.new.totalTax - both.old.totalTax);
  const refundDiff = Math.abs(both.new.refundOrDue - both.old.refundOrDue);
  const taxableDiff = Math.abs(both.new.taxableIncome - both.old.taxableIncome);
  const deductionsDiff = Math.abs(both.new.totalDeductions - both.old.totalDeductions);
  const intake = state.yearIntake;
  return {
    assessmentYear: AY, financialYear: "2025-26", revision: snapshot.revision, regimeOnRecord: regime, filed: isFiled, filedAt: filedAtDate,
    facts: p.facts.map((f) => ({ id: f.id, kind: f.kind, amount: f.amount, label: f.label, reportedBy: f.provenance.reporter, reporterKind: f.provenance.reporterKind, statement: f.provenance.statement, confirmed: state.confirmedFactIds.includes(f.id), capitalGains: f.capitalGains })),
    taxPaid: p.taxPaid.map((t) => ({ id: t.id, section: t.section, amount: t.amount, by: t.provenance.reporter })),
    claims: p.claims.map((c) => ({ id: c.id, section: c.section, amount: c.amount, label: c.label, proofAttached: c.evidenceAttached })),
    corrections: state.corrections.filter((c) => !c.reverted).length,
    stagedChanges: (run.state.pendingCommands ?? []).map((c) => c.type),
    figures: { new: figures(both.new), old: figures(both.old), cheaper: both.new.totalTax <= both.old.totalTax ? "new" : "old", taxSaving, refundDiff, taxableDiff, deductionsDiff },
    yearIntake: intake ? { source: intake.sources.chosen, formAnswers: intake.answers, form16: intake.read.salary ? { gross: intake.read.salary.gross, exempt10: intake.read.salary.exempt10, professionalTax: intake.read.salary.professionalTax, employer: intake.read.salary.employerName, tds: intake.read.salary.tdsSalary } : null, verdict: intake.inferred ?? null } : null,
    limits: advice.issues.map((i) => ({ code: i.code, reason: i.reason, blocksFiling: !isSoftIssue(i) })),
    engineNote: "Figures are the engine's arithmetic on the facts as recorded (an engineering draft awaiting a qualified reviewer's sign-off). Surcharge above ₹50 lakh and s.234 interest are not modelled.",
  };
}

const whatIfSchema = z.object({
  regime: z.enum(["new", "old"]).optional(),
  extraClaims: z.array(z.object({ section: z.string().min(2).max(16), amount: z.number().min(0).max(1e9) })).max(12).optional(),
  extraIncome: z.array(z.object({ kind: z.enum(["salary", "interest", "dividend", "rent", "other"]), amount: z.number().min(0).max(1e10) })).max(6).optional(),
  removeClaimSections: z.array(z.string().max(16)).max(12).optional(),
  reduceSalaryBy: z.number().min(0).max(1e9).optional(),
}).strict();

/** What-if arithmetic from the engine — the return with extra claims, extra income or a different regime. Pure. */
export function whatIf(ctx: ActionCtx, snapshot: VersionedReturn, rawArgs: unknown) {
  const parsed = whatIfSchema.safeParse(rawArgs ?? {});
  if (!parsed.success) return { error: "invalid_args", detail: parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ") };
  const a = parsed.data;
  const state = projected(snapshot, ctx.run.state.pendingCommands);
  let persona: Persona = state.persona;
  if (a.removeClaimSections?.length) persona = { ...persona, claims: persona.claims.filter((c) => !a.removeClaimSections!.includes(c.section)) };
  if (a.extraClaims?.length) {
    const claims = [...persona.claims];
    for (const e of a.extraClaims) {
      const i = claims.findIndex((c) => c.section === e.section);
      if (i >= 0) claims[i] = { ...claims[i], amount: claims[i].amount + Math.round(e.amount) };
      else claims.push({ id: `whatif-${e.section}`, section: e.section, label: e.section, amount: Math.round(e.amount), evidenceAttached: false });
    }
    persona = { ...persona, claims };
  }
  if (a.extraIncome?.length) {
    persona = { ...persona, facts: [...persona.facts, ...a.extraIncome.map((x, i) => ({ id: `whatif-income-${i}`, kind: x.kind as IncomeKind, label: `${x.kind} (what-if)`, amount: Math.round(x.amount), provenance: { reporter: "what-if", reporterKind: "self" as const, filedOn: ctx.deps.today(), statement: "self" as const, onlyReporterCanFix: false } }))] };
  }
  if (a.reduceSalaryBy) {
    let left = Math.round(a.reduceSalaryBy);
    persona = { ...persona, facts: persona.facts.map((f) => { if (f.kind !== "salary" || left <= 0) return f; const cut = Math.min(f.amount, left); left -= cut; return { ...f, amount: f.amount - cut }; }) };
  }
  const both = compareForPersona(persona);
  const asIs = compareForPersona(state.persona);
  const pick = (b: ReturnType<typeof computeForPersona>) => ({ taxableIncome: b.taxableIncome, deductionsAllowed: b.totalDeductions, rebate87A: b.rebate87A, totalTax: b.totalTax, refundOrDue: b.refundOrDue });
  return {
    scenario: { regime: a.regime ?? "both", extraClaims: a.extraClaims ?? [], extraIncome: a.extraIncome ?? [], removed: a.removeClaimSections ?? [], reduceSalaryBy: a.reduceSalaryBy ?? 0 },
    asIs: { new: pick(asIs.new), old: pick(asIs.old) },
    withScenario: { new: pick(both.new), old: pick(both.old) },
    savingVsCheaperAsIs: Math.max(0, Math.min(asIs.new.totalTax, asIs.old.totalTax) - Math.min(both.new.totalTax, both.old.totalTax)),
    note: "Old-regime claims are capped per section by the engine; new-regime allows only 80CCD(2). A what-if is not a claim — nothing is staged.",
  };
}

export function opportunities(ctx: ActionCtx, snapshot: VersionedReturn) {
  const state = projected(snapshot, ctx.run.state.pendingCommands);
  return scanOpportunities(state.persona, { regime: state.regime ?? "new", intake: state.yearIntake });
}

/* -------------------------------------------------------------- documents -- */

/** What a read document said, as facts the conversation may state verbatim. */
export function fieldFacts(fields: DocumentFields, lang: Lang): string[] {
  const facts: string[] = [];
  if (fields.grossSalary !== undefined) facts.push(`Salary for the year per Form 16${fields.employerName ? ` from ${fields.employerName}` : ""}: ${formatMoney(fields.grossSalary, lang)}`);
  if (fields.tds !== undefined) facts.push(`Tax already deducted from salary (TDS) per Form 16: ${formatMoney(fields.tds, lang)}`);
  for (const e of fields.exemptAllowances ?? []) facts.push(`Allowance exempt u/s ${e.section} per Form 16: ${formatMoney(e.amount, lang)}`);
  if (fields.professionalTax) facts.push(`Professional tax per Form 16: ${formatMoney(fields.professionalTax, lang)}`);
  for (const c of fields.employerClaims ?? []) facts.push(`Reported by the employer under ${c.section}: ${formatMoney(c.amount, lang)}`);
  for (const row of fields.otherIncome ?? []) facts.push(`${row.kind === "interest" ? "Interest" : "Dividends"} per AIS from ${row.reporter}: ${formatMoney(row.amount, lang)}`);
  if (fields.ltcg112A) facts.push(`Long-term gains on listed shares/funds per AIS: ${formatMoney(fields.ltcg112A.gain, lang)}`);
  for (const t of fields.tdsOther ?? []) facts.push(`Tax deducted u/s ${t.section} by ${t.reporter} per AIS: ${formatMoney(t.amount, lang)}`);
  if (fields.regimeOptOut !== undefined) facts.push(`Form 16 says the employer computed TDS under the ${fields.regimeOptOut ? "old" : "new"} regime.`);
  return facts;
}

/**
 * Read a stored Form 16 or AIS and stage what it carries: salary and TDS, the Part B rows (exemptions u/s 10,
 * professional tax, employer-reported Chapter VI-A) and the AIS lines — one `import_document` per document,
 * plus the year's intake record. Returns the fields, or null when the document is unreadable or someone else's.
 */
export async function readAndStage(ctx: ActionCtx, snapshot: VersionedReturn, documentId: string, kind: "FORM_16" | "AIS", source: "digilocker" | "upload" | "vault"): Promise<DocumentFields | null> {
  const { run, deps, emit, s } = ctx;
  const read = await runTool("read_document_fields", { documentId }, toolCtx(ctx));
  run.state.usage.toolCalls += 1;
  if (!read.ok) return null;
  const rr = read.result as { readable?: boolean; fields?: DocumentFields; issues?: string[]; subjectMatchesOwner?: boolean };
  if ((rr.issues ?? []).some((i) => stripInjection(i).suspicious)) await emit({ type: "message", role: "assistant", text: s.injectionNotice });
  const usable = rr.readable && rr.fields && rr.subjectMatchesOwner !== false;
  await emit({ type: "tool_outcome", tool: "read_document_fields", ok: true, summary: usable ? "fields read" : rr.subjectMatchesOwner === false ? "document belongs to someone else" : "not readable" });
  if (!usable) return null;
  const f = rr.fields!;
  const cmds = run.state.pendingCommands ?? [];
  const already = cmds.some((c) => c.type === "import_document" && c.document.kind === kind && c.document.fileName === documentId);
  const carries = f.grossSalary !== undefined || f.tds !== undefined || (f.otherIncome?.length ?? 0) > 0 || !!f.ltcg112A || (f.tdsOther?.length ?? 0) > 0 || (f.employerClaims?.length ?? 0) > 0;
  if (!already && carries) cmds.push({ type: "import_document", today: deps.today(), document: { fileName: documentId, kind, ingestedAt: deps.clock(), extracted: f } });
  if (kind === "FORM_16" && f.grossSalary !== undefined && !cmds.some((c) => c.type === "record_year_intake" && c.patch.read?.salary)) {
    cmds.push({
      type: "record_year_intake", assessmentYear: AY,
      patch: {
        read: { salary: { gross: f.grossSalary, s17_1: f.salaryParts?.s17_1, s17_2: f.salaryParts?.s17_2, s17_3: f.salaryParts?.s17_3, exempt10: f.exemptAllowances ?? [], professionalTax: f.professionalTax, tdsSalary: f.tds, employerName: f.employerName, tan: f.tan }, sftFlags: [] },
        sources: { chosen: source, consentAt: deps.clock(), documents: { form16: [documentId] } },
      },
    });
  }
  run.state.pendingCommands = cmds;
  markStep(run, "gather", "done");
  return f;
}

/** A document stored in the vault (uploaded or issued): recorded as a source, and read if it is a Form 16 or AIS. */
export async function absorbDocument(ctx: ActionCtx, snapshot: VersionedReturn, documentId: string, source: "digilocker" | "upload" | "vault"): Promise<{ title: string; docType: string; fields: DocumentFields | null } | null> {
  const { deps, owner, run } = ctx;
  if (!deps.vault) return null;
  const meta = await deps.vault.getMeta(owner, documentId, "agent", run.id);
  if (!meta) return null;
  run.state.sources = dedupeSources([...run.state.sources, { kind: "document", id: meta.id, label: meta.title, detail: meta.issuer ?? meta.provenance, verified: (meta.provenance === "uploaded" || meta.provenance === "synthetic") && meta.hasBytes, url: meta.hasBytes ? `/api/vault/documents/${meta.id}/bytes` : undefined }]);
  let fields: DocumentFields | null = null;
  if (meta.docType === "FORM_16" || meta.docType === "ANNUAL_INFO_STATEMENT") fields = await readAndStage(ctx, snapshot, meta.id, meta.docType === "FORM_16" ? "FORM_16" : "AIS", source);
  await ctx.emit({ type: "source_lookup", sources: run.state.sources });
  return { title: meta.title, docType: meta.docType, fields };
}

/** The vault's list for the year plus the DigiLocker catalogue, for the model and for consent cards. */
export async function listPapers(ctx: ActionCtx) {
  const { deps, owner, run } = ctx;
  const vault: { id: string; docType: string; title: string; issuer?: string; provenance: string; readable: boolean; consented: boolean }[] = [];
  let available = false;
  if (deps.vault) {
    const listed = await runTool("list_vault_documents", {}, toolCtx(ctx));
    run.state.usage.toolCalls += 1;
    if (listed.ok) {
      const r = listed.result as { available: boolean; documents: { id: string; docType: string; title: string; issuer?: string; provenance: string; hasOriginal: boolean }[] };
      available = r.available;
      for (const d of r.documents) {
        vault.push({ id: d.id, docType: d.docType, title: d.title, issuer: d.issuer, provenance: d.provenance, readable: d.docType === "FORM_16" || d.docType === "ANNUAL_INFO_STATEMENT", consented: run.state.consents?.[d.id] === true });
      }
    }
  }
  const digilocker = listIssuedDocuments(owner, AY, "all").map((d) => ({ title: d.title, issuer: d.issuer, docType: d.docType, scope: d.scope, sample: d.sample }));
  return { vaultAvailable: available, vault, digilocker: { linked: run.state.profile?.digilockerLinked ?? false, consented: run.state.consents?.digilocker === true, pulled: run.state.answers.digilocker_done === true, catalogue: digilocker } };
}

/**
 * The DigiLocker pull (mock): every document of the catalogue, one `activity` line each so the person watches them
 * arrive, stored in the vault as issued documents and read the way an upload is read. Only after consent.
 */
export async function pullDigiLocker(ctx: ActionCtx, snapshot: VersionedReturn): Promise<string[]> {
  const { deps, owner, run, s, emit } = ctx;
  if (deps.locker) {
    try { await deps.locker.record(owner, AY); } catch { /* the in-process rebuild stands in */ }
  }
  const issued = listIssuedDocuments(owner, AY, "all");
  if (deps.vault) {
    for (const doc of issued) {
      await emit({ type: "activity", text: `${s.fetchingFromDigiLocker} ${doc.title} · ${doc.issuer}` });
      const meta = await deps.vault.importIssued({ owner, assessmentYear: AY, docType: doc.docType, title: doc.title, issuer: doc.issuer, fields: doc.fields, actor: "agent", runId: run.id, uri: doc.uri });
      run.state.consents = { ...(run.state.consents ?? {}), [meta.id]: true };
      await absorbDocument(ctx, snapshot, meta.id, "digilocker");
    }
  }
  run.state.answers.digilocker_done = true;
  run.state.answers.source = "digilocker";
  markStep(run, "gather", "done");
  return [`${s.fetchedFromDigiLocker} ${issued.map((d) => d.title).join("; ")}.`, ...fetchedFacts(issued, run.lang)];
}

/* -------------------------------------------------------------- the form -- */

/** The one form for what the papers could not answer — housing, "anything else", deductions, the no-papers figures. */
export function yearFormQuestion(ctx: ActionCtx, snapshot: VersionedReturn, text?: string): Question | null {
  const { run, s, owner } = ctx;
  const preview = projected(snapshot, run.state.pendingCommands);
  const intake = preview.yearIntake ?? emptyYearIntake(AY, ctx.deps.clock());
  const salaryKnown = preview.persona.facts.some((f) => f.kind === "salary");
  const gaps = gapGroups(preview.persona, intake);
  const fields = formFieldsFor({ gaps, carried: intake.carriedFrom ? carryDefaults(intake) : undefined, ownerKind: owner.kind, residencyKnown: !!run.state.profile, answers: run.state.answers, s }, salaryKnown);
  if (fields.length === 0) return null;
  return { id: newId("q"), text: text?.trim() || s.askDetails, why: s.askDetailsWhy, expects: "form", resolves: "year_form", fields };
}

/** The form's answers become staged commands and the year's intake; returns what was recorded, in facts. */
export function applyYearForm(ctx: ActionCtx, snapshot: VersionedReturn, raw: string): string[] {
  const { run, deps } = ctx;
  const a = run.state.answers;
  let obj: Record<string, unknown> = {};
  try { obj = JSON.parse(raw) as Record<string, unknown>; } catch { return ["The form came back unreadable; nothing was recorded."]; }
  for (const k of ["salary_amount", "interest_amount", ...DEDUCTION_FIELDS.map((d) => d.key)]) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) a[k] = Math.max(0, Math.round(v));
  }
  for (const k of ["housing", "extras", "employer_category"]) {
    const v = obj[k];
    if (typeof v === "string" && v) a[k] = v.slice(0, 200);
  }
  if (typeof obj.resident === "boolean") a.resident = obj.resident;
  a.inventory_confirmed = true;
  const cmds: ReturnCommand[] = run.state.pendingCommands ?? [];
  const has = (pred: (c: ReturnCommand) => boolean) => cmds.some(pred);
  const lines: string[] = [];
  const state = projected(snapshot, cmds);
  if (typeof a.salary_amount === "number" && a.salary_amount > 0 && !state.persona.facts.some((f) => f.kind === "salary")) {
    cmds.push({ type: "declare_income", kind: "salary", amount: a.salary_amount, label: "Salary (stated by the person; to be checked against Form 16)", today: deps.today() });
    lines.push(`Salary declared by the person: ${formatMoney(a.salary_amount, run.lang)}.`);
  }
  if (typeof a.interest_amount === "number" && a.interest_amount > 0 && !has((c) => c.type === "declare_income" && c.kind === "interest")) {
    cmds.push({ type: "declare_income", kind: "interest", amount: a.interest_amount, label: "Interest on savings and deposits (self-declared)", today: deps.today() });
    lines.push(`Interest declared: ${formatMoney(a.interest_amount, run.lang)}.`);
  }
  for (const d of DEDUCTION_FIELDS) {
    const amount = a[d.key];
    if (typeof amount !== "number" || amount <= 0 || has((c) => c.type === "declare_claim" && c.section === d.section)) continue;
    cmds.push({ type: "declare_claim", section: d.section, amount, label: `Section ${d.section} (self-declared)`, evidenceAttached: false });
    lines.push(`Deduction stated under ${d.section}: ${formatMoney(amount, run.lang)} — no proof attached yet.`);
  }
  const yearAnswers = yearAnswersFrom(a);
  if (Object.keys(yearAnswers).length) {
    const source = typeof a.source === "string" ? (a.source as "digilocker" | "upload" | "vault" | "manual") : "manual";
    cmds.push({ type: "record_year_intake", assessmentYear: AY, patch: { answers: yearAnswers, sources: { chosen: source, documents: { form16: [] } } } });
  }
  if (a.housing) lines.push(`Housing this year: ${a.housing}.`);
  if (typeof a.extras === "string") lines.push(`Anything else this year: ${a.extras || "none"}.`);
  run.state.pendingCommands = cmds;
  markStep(run, "resolve", "done");
  // The verdict on a preview with everything staged: which form, where the regimes stand.
  const preview = projected(snapshot, cmds);
  const form = inferForm(preview.persona, { ...(preview.yearIntake?.answers ?? {}), ...yearAnswers }, run.state.profile?.residency ?? "resident");
  const lean = regimeLean(preview.persona);
  lines.push(`Form: ${form.itrForm} (${form.reasons.join("; ")}).`, `Regime as things stand: new ${formatMoney(lean.new, run.lang)} vs old ${formatMoney(lean.old, run.lang)} → ${lean.lean === "open" ? "open — deductions could still flip it" : `${lean.lean} regime leads`}.`);
  return lines;
}

/* ----------------------------------------------------------- staged changes -- */

const changeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("declare_income"), kind: z.enum(["salary", "interest", "dividend", "rent", "other"]), amount: z.number().positive().max(1e10), label: z.string().max(120).optional() }).strict(),
  z.object({ type: z.literal("declare_claim"), section: z.string().min(2).max(16), amount: z.number().positive().max(1e9), label: z.string().max(120).optional(), proofAttached: z.boolean().optional() }).strict(),
  z.object({ type: z.literal("correct_fact"), factId: z.string().min(1), amount: z.number().min(0).max(1e10), reason: z.string().min(2).max(300) }).strict(),
  z.object({ type: z.literal("choose_regime"), regime: z.enum(["new", "old"]) }).strict(),
]);

/** Stage return commands from the conversation — reviewable, never applied here. Returns the preview. */
export function stageChanges(ctx: ActionCtx, snapshot: VersionedReturn, rawArgs: unknown) {
  const parsed = z.object({ changes: z.array(changeSchema).min(1).max(10) }).strict().safeParse(rawArgs ?? {});
  if (!parsed.success) return { error: "invalid_args", detail: parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ") };
  const { run, deps } = ctx;
  const cmds: ReturnCommand[] = [...(run.state.pendingCommands ?? [])];
  const staged: string[] = [];
  const refused: string[] = [];
  for (const ch of parsed.data.changes) {
    if (ch.type === "declare_income") {
      cmds.push({ type: "declare_income", kind: ch.kind, amount: Math.round(ch.amount), label: ch.label ?? `${ch.kind} (stated in conversation)`, today: deps.today() });
      staged.push(`declare_income ${ch.kind} ${ch.amount}`);
    } else if (ch.type === "declare_claim") {
      const known = ch.section in OLD_REGIME_CLAIM_CAPS || NEW_REGIME_ALLOWED_SECTIONS.has(ch.section);
      if (!known) { refused.push(`${ch.section}: the engine has no cap for this section; use one of ${Object.keys(OLD_REGIME_CLAIM_CAPS).join(", ")}, 80CCD(2)`); continue; }
      const i = cmds.findIndex((c) => c.type === "declare_claim" && c.section === ch.section);
      const cmd: ReturnCommand = { type: "declare_claim", section: ch.section, amount: Math.round(ch.amount), label: ch.label ?? `Section ${ch.section} (stated in conversation)`, evidenceAttached: ch.proofAttached === true };
      if (i >= 0) cmds[i] = cmd; else cmds.push(cmd);
      staged.push(`declare_claim ${ch.section} ${ch.amount}${ch.proofAttached ? " (proof)" : " (no proof yet)"}`);
    } else if (ch.type === "correct_fact") {
      if (!snapshot.state.persona.facts.some((f) => f.id === ch.factId) && !snapshot.state.persona.taxPaid.some((t) => t.id === ch.factId) && !snapshot.state.persona.claims.some((c) => c.id === ch.factId)) { refused.push(`${ch.factId}: no such fact on the return`); continue; }
      cmds.push({ type: "correct_fact", factId: ch.factId, amount: Math.round(ch.amount), reason: redactText(ch.reason).text });
      staged.push(`correct_fact ${ch.factId} → ${ch.amount}`);
    } else {
      const i = cmds.findIndex((c) => c.type === "choose_regime");
      const cmd: ReturnCommand = { type: "choose_regime", regime: ch.regime };
      if (i >= 0) cmds[i] = cmd; else cmds.push(cmd);
      staged.push(`choose_regime ${ch.regime}`);
    }
  }
  run.state.pendingCommands = cmds;
  markStep(run, "resolve", "done");
  const state = projected(snapshot, cmds);
  const both = compareForPersona(state.persona);
  return { staged, refused, applied: false, preview: { regime: state.regime ?? "new", new: { totalTax: both.new.totalTax, refundOrDue: both.new.refundOrDue }, old: { totalTax: both.old.totalTax, refundOrDue: both.old.refundOrDue } }, note: "Staged only. A review card (show_review) is how the person accepts them; nothing is applied until then." };
}

/* ------------------------------------------------------------- review card -- */

export type ReviewOutcome =
  | { card: ReviewCard }
  | { blocked: "already_filed" | "already_on_regime" | "nothing_staged" | "no_return" }
  | { blocked: "balance_due"; due: number }
  | { blocked: "unsupported"; reasons: string[] }
  | { blocked: "regime_election"; reason: string };

/** The review card for a filing, a regime choice or staged corrections: figures from the engine, bound to the snapshot. */
export function buildReviewCard(ctx: ActionCtx, snapshot: VersionedReturn, kind: "filing" | "regime" | "corrections"): ReviewOutcome {
  const { run, s, owner } = ctx;
  if (kind === "filing" && snapshot.state.filedAt) return { blocked: "already_filed" };
  if (kind === "corrections" && !(run.state.pendingCommands?.length)) return { blocked: "nothing_staged" };
  const state = projected(snapshot, run.state.pendingCommands);
  const advice = assessAdvice(state.persona, adviceContext(ctx));
  run.state.advice = advice;
  run.knowledgeRelease = advice.release;
  const hard = hardIssues(advice);
  if (hard.length) {
    const ids = [...new Set(hard.flatMap((i) => i.provisions))];
    run.state.sources = dedupeSources([...run.state.sources, ...cite(ids).map((c) => ({ kind: "rule" as const, id: c.id, label: c.title, detail: `${c.locator} · ${c.reviewer}`, verified: false, url: c.url }))]);
    return { blocked: "unsupported", reasons: hard.map((i) => i.reason) };
  }
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
  const p = hasCa ? caReview.caPersona! : state.persona;
  const both = compareForPersona(p);
  const cheaper: "new" | "old" = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  const staged = run.state.pendingCommands?.find((c) => c.type === "choose_regime");
  const regime: "new" | "old" = kind === "regime" ? (staged?.type === "choose_regime" ? staged.regime : cheaper) : (hasCa && caReview.caRegime ? caReview.caRegime : (state.regime ?? "new"));
  const b = computeForPersona(p, regime);
  if (kind === "filing" && b.refundOrDue < 0) return { blocked: "balance_due", due: -b.refundOrDue };
  const facts: TaxpayerFacts = {
    period: PERIOD_FY_2025_26, category: "individual",
    resident: adviceContext(ctx).resident,
    hasSalaryIncome: p.facts.some((f) => f.kind === "salary"),
    grossSalary: p.facts.filter((f) => f.kind === "salary").reduce((x, f) => x + f.amount, 0),
    hasBusinessOrProfessionIncome: p.facts.some((f) => f.kind === "other"),
    totalIncome: b.taxableIncome, regime,
    returnByDueDate: adviceContext(ctx).returnByDueDate,
    claims: p.claims.map((c) => ({ section: c.section, amount: c.amount, evidence: c.evidenceAttached })),
    ltcg112A: p.facts.filter((f) => f.kind === "capital_gains" && f.capitalGains?.holding === "long" && f.capitalGains.assetClass === "equity_stt").reduce((x, f) => x + f.amount, 0),
    specialRateIncome: p.facts.filter((f) => f.kind === "capital_gains").reduce((x, f) => x + f.amount, 0),
  };
  const applicability = evaluateSalariedSlice(facts);
  run.state.applicability = applicability;
  if (kind === "regime") {
    if (regime === (snapshot.state.regime ?? "new") && !staged) return { blocked: "already_on_regime" };
    const switchRule = applicability.find((r) => r.rule === "regime_switch_115BAC");
    if (regime === "old" && switchRule?.outcome !== "eligible") return { blocked: "regime_election", reason: switchRule?.reason ?? s.noteRegimeNotExecuted };
    if (!staged) run.state.pendingCommands = [...(run.state.pendingCommands ?? []), { type: "choose_regime", regime }];
  }
  const ruleIds = [...new Set(applicability.flatMap((r) => r.provisions))];
  run.state.sources = dedupeSources([...run.state.sources, ...cite(ruleIds).map((c) => ({ kind: "rule" as const, id: c.id, label: `${c.section} — ${c.title}`, detail: `${c.locator} · ${c.reviewer}`, verified: false, url: c.url }))]);
  const rows = [
    { label: s.rowRegime, value: regime === "new" ? "new" : "old" },
    { label: s.rowTaxableIncome, value: formatMoney(b.taxableIncome, run.lang) },
    { label: s.rowTotalTax, value: formatMoney(b.totalTax, run.lang) },
    b.refundOrDue >= 0 ? { label: s.rowRefund, value: formatMoney(b.refundOrDue, run.lang), emphasis: true } : { label: s.rowDue, value: formatMoney(-b.refundOrDue, run.lang), emphasis: true },
  ];
  if (kind === "regime" && both.new.totalTax !== both.old.totalTax) rows.push({ label: s.rowSaving, value: formatMoney(Math.abs(both.new.totalTax - both.old.totalTax), run.lang) });
  const card: ReviewCard = {
    id: newId("card"), kind,
    title: kind === "filing" ? s.reviewFilingTitle : kind === "regime" ? s.reviewRegimeTitle.replace("{regime}", regime) : s.reviewCorrectionsTitle,
    rows,
    boundTo: { revision: snapshot.revision, snapshotHash: snapshotHash(snapshot.state), amount: b.refundOrDue },
    confirmLabel: kind === "filing" ? s.confirmFiling : kind === "regime" ? s.confirmRegime : s.confirmCorrections,
    cancelLabel: s.cancel,
    basis: { applicability, provisions: ruleIds },
  };
  return { card };
}

/* ------------------------------------------------------------------ payment -- */

/** The challan card: due amount, the methods, and a CA review offer. Nothing moves until a method is picked. */
export function paymentQuestion(ctx: ActionCtx, snapshot: VersionedReturn): { question: Question; due: number } | { blocked: "nothing_due"; refund: number } {
  const { run, owner } = ctx;
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
  const state = projected(snapshot, run.state.pendingCommands);
  const p = hasCa ? caReview.caPersona! : state.persona;
  const regime = hasCa && caReview.caRegime ? caReview.caRegime : (state.regime ?? "new");
  const b = computeForPersona(p, regime);
  if (b.refundOrDue >= 0) return { blocked: "nothing_due", refund: b.refundOrDue };
  const due = -b.refundOrDue;
  const money = formatMoney(due, run.lang);
  const choices = [
    { value: "pay_challan_upi", label: `UPI / QR · ${money}` },
    { value: "pay_challan_sbi", label: `Net banking — SBI · ${money}` },
    { value: "pay_challan_hdfc", label: `Net banking — HDFC · ${money}` },
    { value: "pay_challan_icici", label: `Net banking — ICICI · ${money}` },
    { value: "skip_challan_pay", label: "Not now" },
  ];
  if (!hasCa) choices.unshift({ value: "review_with_ca", label: "Review with a CA first" });
  return { due, question: { id: newId("q"), text: `Self-assessment tax of ${money} is due before filing. Simulate paying it now?`, why: "Section 140A — paid before the return is filed", expects: "choice", resolves: "challan_payment_mode", choices } };
}

/** Run the simulated Challan 280: the ledger gets a s.140A credit, the receipt stays a template (its identifiers must be exact). */
export async function executePayment(ctx: ActionCtx, snapshot: VersionedReturn, value: string): Promise<string[]> {
  const { run, deps, owner, emit } = ctx;
  const val = value.toLowerCase();
  if (val === "skip_challan_pay" || val === "cancel") return ["The person chose not to pay the challan now; the balance stays due and filing waits."];
  if (val === "review_with_ca") return ["The person wants a CA to review first. The 'Review with CA' button on their screen generates the CA's access code; the due stays until then."];
  if (val === "adopt_ca" || val.includes("adopt")) {
    const caReview = getLatestReviewForPan(owner.pan);
    if (caReview && caReview.status !== "accepted") {
      try {
        await acceptCAReview(caReview.code);
      } catch {}
    }
    return ["The CA's audited figures and regime were accepted. If balance due is ₹0 or a refund, no challan is needed; ready to file."];
  }
  const caReview = getLatestReviewForPan(owner.pan);
  const hasCa = caReview && (caReview.status === "reviewed" || caReview.status === "accepted") && caReview.caPersona;
  const state = projected(snapshot, run.state.pendingCommands);
  const p = hasCa ? caReview.caPersona! : state.persona;
  const regime = hasCa && caReview.caRegime ? caReview.caRegime : (state.regime ?? "new");
  const b = computeForPersona(p, regime);
  const due = b.refundOrDue < 0 ? -b.refundOrDue : 0;
  if (due === 0) return ["Nothing is due; no challan was paid."];
  const method: "UPI" | "NET_BANKING" = val.includes("sbi") || val.includes("hdfc") || val.includes("icici") ? "NET_BANKING" : "UPI";
  const bankName = val.includes("sbi") ? "State Bank of India" : val.includes("hdfc") ? "HDFC Bank" : val.includes("icici") ? "ICICI Bank" : "UPI / QR Gateway (SBI e-Pay)";
  const seed = Date.now();
  const { bsrCode, challanNo } = syntheticChallanIdentifiers(seed);
  const tenderDate = deps.today();
  const cin = `${bsrCode}${tenderDate.replace(/-/g, "")}${challanNo}`;
  const { baseTax, cess } = splitTaxAndCess(due);
  const payment: SelfAssessmentPayment = { challanNo, bsrCode, amount: due, date: tenderDate, majorHead: "0021", minorHead: "300", method, bank: bankName };
  const res = await deps.returns.apply(owner, AY, { command: { type: "record_payment", payment }, expectedRevision: snapshot.revision, idempotencyKey: `challan-${run.id}-${seed}`, actor: "agent" });
  if (!res.ok) return [`The payment could not be recorded (${res.error}); nothing was paid.`];
  run.state.returnRevision = res.snapshot.revision;
  run.state.answers.payment_done = cin;
  run.state.actionTaken = { kind: "payment", id: cin, at: deps.clock() };
  markStep(run, "act", "done");
  const money = (n: number) => formatMoney(n, run.lang);
  // The receipt is a template on purpose: identifiers must read exactly (docs/VOICE.md, natural-vs-template).
  await emit({ type: "message", role: "assistant", text: [
    `### Challan ITNS 280 — simulated receipt`,
    "",
    `| Challan field | Particulars |`,
    `| :--- | :--- |`,
    `| CIN | \`${cin}\` |`,
    `| Major head | ${CHALLAN_MAJOR_HEAD_LABEL} |`,
    `| Minor head | ${CHALLAN_MINOR_HEAD_LABEL} |`,
    `| BSR code | \`${bsrCode}\` (${bankName}) |`,
    `| Challan serial | \`${challanNo}\` |`,
    `| Tender date | ${tenderDate} |`,
    `| Mode | ${method === "UPI" ? "UPI (epaytax.cbdt@sbi)" : `Internet banking (${bankName})`} |`,
    `| Tax | ${money(baseTax)} |`,
    `| Health & education cess (4%) | ${money(cess)} |`,
    `| Total deposited | **${money(due)}** |`,
    "",
    ctx.s.simulatedBadge,
  ].join("\n") });
  return [`Simulated Challan 280 paid: ${money(due)} (tax ${money(baseTax)} + cess ${money(cess)}), CIN ${cin}, credited to the return under s.140A. Balance due is now ₹0.`];
}

/* -------------------------------------------------------------------- outputs -- */

/** After a confirmed filing or regime choice: the JSON summary, and for a filing the Form ITR-V PDF into the vault. */
export async function produceOutputs(ctx: ActionCtx): Promise<string[]> {
  const { run, deps, owner, s, emit } = ctx;
  const snapshot = await deps.returns.get(owner, AY);
  if (!snapshot) return [];
  const regime = snapshot.state.regime ?? "new";
  const b = computeForPersona(snapshot.state.persona, regime);
  const body = {
    synthetic: true, disclosure: s.simulatedBadge, knowledgeRelease: run.knowledgeRelease, advice: run.state.advice,
    snapshot: { revision: snapshot.revision, hash: snapshotHash(snapshot.state) }, regime,
    figures: { grossIncome: b.grossIncome, standardDeduction: b.standardDeduction, totalDeductions: b.totalDeductions, taxableIncome: b.taxableIncome, rebate87A: b.rebate87A, cess: b.cess, totalTax: b.totalTax, tdsCredits: b.tdsCredits, refundOrDue: b.refundOrDue },
    applicability: run.state.applicability ?? [], provisions: cite([...new Set((run.state.applicability ?? []).flatMap((r) => r.provisions))]), actionTaken: run.state.actionTaken ?? null,
  };
  const filing = run.state.actionTaken?.kind === "filing";
  const kind = filing ? "return_summary_json" : "regime_comparison_json";
  const output = { id: newId("out"), runId: run.id, kind: kind as "return_summary_json" | "regime_comparison_json", title: `${run.title} · ${AY}`, mimeType: "application/json", snapshotRevision: snapshot.revision, snapshotHash: body.snapshot.hash, synthetic: true as const, createdAt: deps.clock(), body: new TextEncoder().encode(JSON.stringify(body, null, 2)) };
  await deps.store.putOutput(owner, output);
  const { body: _b, runId: _r, ...ref } = output;
  await emit({ type: "output", output: ref });
  const made = [ref.title];
  if (filing) {
    const ackNumber = run.state.actionTaken?.id ?? `SIM-${body.snapshot.hash.slice(0, 10).toUpperCase()}`;
    const itrvBytes = generateItrvPdf({
      assesseeName: snapshot.state.persona.name || owner.pan, pan: owner.pan, status: "Individual", filingSection: `${filingSection(deps.today(), AY)} - ${filingSection(deps.today(), AY) === "139(1)" ? "On or before due date" : "Belated"}`,
      assessmentYear: AY, financialYear: "2025-26",
      submissionTimestamp: run.state.actionTaken?.at ? new Date(run.state.actionTaken.at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined,
      ackNumber, regime: regime.toUpperCase() as "NEW" | "OLD",
      grossTotalIncome: b.grossIncome, standardDeduction: b.standardDeduction, chapterViaDeductions: Math.max(0, b.totalDeductions), taxableIncome: b.taxableIncome, taxBeforeRebate: b.taxBeforeRebate, rebate87A: b.rebate87A, cess: b.cess, totalTaxLiability: b.totalTax, tdsPaid: b.tdsCredits, advanceTaxPaid: 0, selfAssessmentPaid: 0, netPayableOrRefund: b.totalTax - b.tdsCredits, sha256Hash: body.snapshot.hash,
    });
    const itrv = { id: newId("out"), runId: run.id, kind: "itrv_acknowledgement_pdf" as const, title: `Form ITR-V (Acknowledgement) · ${AY}`, mimeType: "application/pdf", snapshotRevision: snapshot.revision, snapshotHash: body.snapshot.hash, synthetic: true as const, createdAt: deps.clock(), body: itrvBytes };
    await deps.store.putOutput(owner, itrv);
    if (deps.vault) {
      try { await deps.vault.upload({ owner, bytes: itrvBytes, declaredMime: "application/pdf", assessmentYear: AY, docType: "ITR_V", title: itrv.title, filename: `ITR-V_${AY}_${owner.pan}.pdf`, actor: "agent", runId: run.id }); } catch { /* secondary to output delivery */ }
    }
    const { body: _pb, runId: _pr, ...itrvRef } = itrv;
    await emit({ type: "output", output: itrvRef });
    made.push(itrvRef.title);
  }
  markStep(run, "outputs", "done");
  return made;
}

/* -------------------------------------------------------------- status facts -- */

export function refundFacts(ctx: ActionCtx, snapshot: VersionedReturn) {
  const p = snapshot.state.persona;
  const b = computeForPersona(p, snapshot.state.regime ?? "new");
  return { filed: !!snapshot.state.filedAt, filedAt: snapshot.state.filedAt ?? null, refundState: snapshot.state.filedAt ? p.refund.state : "not_filed", refundOrDue: b.refundOrDue, holds: p.refund.holds.map((h) => ({ kind: h.kind, headline: h.headline, detail: h.detail, resolved: h.resolved, clearsInDays: h.clearsInDays })), timeline: p.refund.timeline.map((t) => ({ on: t.on, state: t.state, actor: t.actor })), refundAccount: ctx.run.state.profile?.refundAccount ?? null };
}

export function noticeFacts(snapshot: VersionedReturn) {
  return snapshot.state.persona.notices.map((n) => ({ id: n.id, kind: n.kind, issuedOn: n.issuedOn, respondBy: n.respondBy, headline: n.headline, consequence: n.consequence, amountAtStake: n.amountAtStake, status: n.status, items: n.items.map((i) => ({ claim: i.claim, amount: i.amount, position: i.position ?? null })) }));
}

/** A running reconciliation of the department's statements against what the person says — from the return itself. */
export function reconciliation(snapshot: VersionedReturn) {
  const base = snapshot.state.baselinePersona;
  const eff = snapshot.state.persona;
  return {
    rows: base.facts.map((f) => ({ id: f.id, label: f.label, kind: f.kind, reported: f.amount, reportedBy: f.provenance.reporter, statement: f.provenance.statement, declared: eff.facts.find((x) => x.id === f.id)?.amount ?? 0, disputed: snapshot.state.corrections.some((c) => !c.reverted && c.factId === f.id), onlyReporterCanFix: f.provenance.onlyReporterCanFix })),
    taxPaid: base.taxPaid.map((t) => ({ id: t.id, section: t.section, amount: t.amount, by: t.provenance.reporter, statement: t.provenance.statement })),
    corrections: snapshot.state.corrections.filter((c) => !c.reverted).map((c) => ({ factId: c.factId, from: c.previous, to: c.next, reason: c.reason })),
  };
}

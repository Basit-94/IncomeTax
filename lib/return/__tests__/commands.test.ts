import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import { applyReturnCommand, type CommandContext } from "../commands";
import { computeForPersona } from "../compute";
import { applyCorrection, confirmFact, revertCorrection, type ReturnState } from "../state";
import { makePersona } from "./fixtures";

let n = 0;
const ctx: CommandContext = { now: () => "2026-09-05T12:00:00.000Z", newId: (p) => `${p}-${++n}` };

function stateOf(persona = makePersona()): ReturnState {
  return { version: 2, lang: "en", personaId: persona.id, baselinePersona: persona, persona, corrections: [], confirmedFactIds: [], regime: "new" };
}

describe("applyReturnCommand — parity with the manual primitives (plan §3.3)", () => {
  it("confirm_fact is confirmFact; an unknown id is rejected, a repeat is unchanged", () => {
    const s = stateOf();
    const r = applyReturnCommand(s, { type: "confirm_fact", factId: "fact-salary" }, ctx);
    expect(r).toMatchObject({ ok: true, changed: true });
    if (!r.ok) return;
    expect(r.state).toEqual(confirmFact(s, "fact-salary"));
    expect(applyReturnCommand(r.state, { type: "confirm_fact", factId: "fact-salary" }, ctx)).toMatchObject({ ok: true, changed: false });
    expect(applyReturnCommand(s, { type: "confirm_fact", factId: "nope" }, ctx)).toMatchObject({ ok: false, error: "unknown_fact" });
  });

  it("correct_fact is applyCorrection with the same shape the dispute modal wrote", () => {
    const s = stateOf();
    const r = applyReturnCommand(s, { type: "correct_fact", factId: "fact-salary", amount: 850000, reason: "final payslip", feedbackCode: "CODE_3" }, ctx);
    if (!r.ok) throw new Error("rejected");
    const expected = applyCorrection(s, { id: "corr-1", factId: "fact-salary", field: "amount", previous: 900000, next: 850000, reason: "final payslip", feedbackCode: "CODE_3", at: ctx.now(), target: "fact" });
    expect(r.state).toEqual(expected);
    // a correction removes the confirmation: "yes" and "no" are mutually exclusive
    const confirmed = confirmFact(s, "fact-salary");
    const corrected = applyReturnCommand(confirmed, { type: "correct_fact", factId: "fact-salary", amount: 1, reason: "" }, ctx);
    if (!corrected.ok) throw new Error("rejected");
    expect(corrected.state.confirmedFactIds).not.toContain("fact-salary");
  });

  it("correct_fact refuses negatives and treats an unchanged figure as a no-op", () => {
    const s = stateOf();
    expect(applyReturnCommand(s, { type: "correct_fact", factId: "fact-salary", amount: -5, reason: "" }, ctx)).toMatchObject({ ok: false, error: "invalid_amount" });
    expect(applyReturnCommand(s, { type: "correct_fact", factId: "fact-salary", amount: 900000, reason: "" }, ctx)).toMatchObject({ ok: true, changed: false });
  });

  it("revert_correction is revertCorrection and keeps history", () => {
    const s = stateOf();
    const c = applyReturnCommand(s, { type: "correct_fact", factId: "fact-salary", amount: 1, reason: "x" }, ctx);
    if (!c.ok) throw new Error("rejected");
    const id = c.state.corrections[0].id;
    const r = applyReturnCommand(c.state, { type: "revert_correction", correctionId: id }, ctx);
    if (!r.ok) throw new Error("rejected");
    expect(r.state).toEqual(revertCorrection(c.state, id));
    expect(r.state.corrections).toHaveLength(1);
    expect(r.state.persona.facts[0].amount).toBe(900000);
    expect(applyReturnCommand(s, { type: "revert_correction", correctionId: "ghost" }, ctx)).toMatchObject({ ok: false, error: "unknown_correction" });
  });

  it("choose_regime flips the regime and nothing else", () => {
    const s = stateOf();
    const r = applyReturnCommand(s, { type: "choose_regime", regime: "old" }, ctx);
    if (!r.ok) throw new Error("rejected");
    expect(r.state).toEqual({ ...s, regime: "old" });
    expect(applyReturnCommand(r.state, { type: "choose_regime", regime: "old" }, ctx)).toMatchObject({ changed: false });
  });

  it("record_payment adds one s.140A row, credits the challan once, and the engine's due clears", () => {
    const persona = { ...makePersona(), facts: [{ ...makePersona().facts[0], amount: 1_500_000 }] };
    const s = stateOf(persona);
    const due = -computeForPersona(persona, "new").refundOrDue;
    expect(due).toBeGreaterThan(0);
    const payment = { amount: due, bsrCode: "0001234", challanNo: "00042", date: "2026-09-01", upiRef: "x", assessmentYear: "2026-27" } as never;
    const r = applyReturnCommand(s, { type: "record_payment", payment }, ctx);
    if (!r.ok) throw new Error("rejected");
    expect(r.state.persona.taxPaid).toHaveLength(1);
    expect(r.state.persona.taxPaid[0]).toMatchObject({ section: "140A", amount: due });
    expect(computeForPersona(r.state.persona, "new").refundOrDue).toBe(0);
    expect(r.state.confirmedFactIds).toContain(r.state.persona.taxPaid[0].id);
    // the same challan again is not a second credit (§8)
    const again = applyReturnCommand(r.state, { type: "record_payment", payment }, ctx);
    expect(again).toMatchObject({ ok: true, changed: false });
  });

  it("stage_revision reverts the short rows' corrections and confirms them; nothing to do is named", () => {
    const s = stateOf();
    expect(applyReturnCommand(s, { type: "stage_revision" }, ctx)).toMatchObject({ ok: false, error: "nothing_to_do" });
    const c = applyReturnCommand(s, { type: "correct_fact", factId: "fact-salary", amount: 400000, reason: "left in June" }, ctx);
    if (!c.ok) throw new Error("rejected");
    const r = applyReturnCommand(c.state, { type: "stage_revision" }, ctx);
    if (!r.ok) throw new Error("rejected");
    expect(r.state.persona.facts[0].amount).toBe(900000);
    expect(r.state.corrections[0].reverted).toBe(true);
    expect(r.state.confirmedFactIds).toContain("fact-salary");
  });

  it("import_document writes the reporter's figures into the BASELINE and replays corrections on top", () => {
    const s = stateOf();
    const corrected = applyReturnCommand(s, { type: "correct_fact", factId: "fact-salary", amount: 850000, reason: "x" }, ctx);
    if (!corrected.ok) throw new Error("rejected");
    const r = applyReturnCommand(
      corrected.state,
      { type: "import_document", today: "2026-09-05", document: { fileName: "f16.pdf", kind: "FORM_16", ingestedAt: ctx.now(), extracted: { grossSalary: 920000, tds: 30000 } } },
      ctx,
    );
    if (!r.ok) throw new Error("rejected");
    expect(r.state.baselinePersona.facts[0].amount).toBe(920000); // department's side updated, not summed
    expect(r.state.persona.facts[0].amount).toBe(850000); // citizen's correction still wins
    expect(r.state.baselinePersona.taxPaid).toHaveLength(1);
    expect(r.state.baselinePersona.taxPaid[0]).toMatchObject({ section: "192", amount: 30000 });
    expect(r.state.baselinePersona.facts[0].provenance.identifier).toBe("f16.pdf");
    const empty = applyReturnCommand(s, { type: "import_document", today: "2026-09-05", document: { fileName: "x", kind: "AIS", ingestedAt: "", extracted: {} } }, ctx);
    expect(empty).toMatchObject({ ok: false, error: "nothing_to_do" });
  });

  it("finalize_filing stamps once, keys the timeline event, and refuses a second stamp", () => {
    const s = stateOf();
    const r = applyReturnCommand(s, { type: "finalize_filing", filedAt: ctx.now(), today: "2026-09-05" }, ctx);
    if (!r.ok) throw new Error("rejected");
    expect(r.state.filedAt).toBe(ctx.now());
    expect(r.state.persona.refund.state).toBe("filed_unverified");
    expect(r.state.persona.refund.timeline.at(-1)).toMatchObject({ headlineKey: "filed", actor: "citizen", on: "2026-09-05" });
    expect(applyReturnCommand(r.state, { type: "finalize_filing", filedAt: ctx.now(), today: "2026-09-05" }, ctx)).toMatchObject({ ok: false, error: "already_filed" });
  });

  it("carries the one persona-specific rule: Rakesh's AIS hold releases at a zero capital-gains figure", () => {
    const rakesh = PERSONAS.rakesh;
    const s = stateOf(rakesh);
    expect(s.persona.refund.holds.some((h) => h.kind === "ais_mismatch" && !h.resolved)).toBe(true);
    const r = applyReturnCommand(s, { type: "correct_fact", factId: "rakesh-capital-gains", amount: 0, reason: "net loss", feedbackCode: "CODE_3" }, ctx);
    if (!r.ok) throw new Error("rejected");
    expect(r.state.persona.refund.holds.find((h) => h.kind === "ais_mismatch")?.resolved).toBe(true);
  });
});

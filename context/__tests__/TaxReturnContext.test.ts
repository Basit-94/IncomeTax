import { describe, it, expect } from "vitest";
import {
  INITIAL_STATE,
  MAX_UNDO_DEPTH,
  deriveTaxReturn,
  taxReducer,
} from "../TaxReturnContext";
import type { FactId, TaxAction, TaxReturnState } from "../TaxReturnContext";

/**
 * Prefill helper: pushes a complete set of figures down from the main journey,
 * exactly as app/page.tsx's mirror effect does. Any fact id not named is zeroed,
 * so each test starts from a return with nothing in it but what it declares.
 */
function sync(
  state: TaxReturnState,
  facts: Partial<Record<FactId, number>>,
  confirmedIds: string[] = [],
): TaxReturnState {
  const zeroed = Object.fromEntries(
    (Object.keys(state.facts) as FactId[]).map((id) => [id, 0]),
  ) as Record<FactId, number>;

  return taxReducer(state, {
    type: "SYNC_STATE",
    payload: {
      name: "Meera Iyer",
      pan: "ABCDE1234F",
      isSalaried: true,
      regime: "NEW",
      facts: { ...zeroed, ...facts },
      confirmedIds,
    },
  });
}

function run(state: TaxReturnState, ...actions: TaxAction[]): TaxReturnState {
  return actions.reduce(taxReducer, state);
}

/**
 * Mandatory vector 3.
 *
 * A prefilled ₹15,00,000 salary that the citizen says is really ₹10,00,000. It
 * is the case the whole surface exists for: the summary must flip from tax due
 * to refund in the same tick as the dispute, and the scrutiny radar must light
 * up, because a ₹5,00,000 downward revision against a Form 16 is exactly what
 * gets a return selected.
 */
describe("vector 3 — disputing a prefilled salary flips the summary and raises CASS", () => {
  const prefilled = sync(INITIAL_STATE, { salary: 1_500_000, tds_salary: 60_000 });

  it("starts as tax payable, with no scrutiny flag", () => {
    const before = deriveTaxReturn(prefilled);

    expect(before.active.taxableIncome).toBe(1_425_000);
    expect(before.active.totalTaxLiability).toBe(97_500); // 93,750 slab + 4% cess
    expect(before.isPayable).toBe(true);
    expect(before.netPayable).toBe(37_500);
    expect(before.netRefund).toBe(0);
    expect(before.cass.riskLevel).toBe("LOW");
  });

  it("flips to a refund the moment the dispute is dispatched", () => {
    const after = deriveTaxReturn(
      taxReducer(prefilled, {
        type: "DISPUTE_FACT",
        factId: "salary",
        declaredAmount: 1_000_000,
        feedbackCode: "CODE_3",
        disputeReason: "Two months of the reported salary were never paid.",
      }),
    );

    // 10,00,000 − 75,000 = 9,25,000, which is under the s.87A threshold, so the
    // whole slab tax of 32,500 is rebated away.
    expect(after.active.taxableIncome).toBe(925_000);
    expect(after.active.rebate87A).toBe(32_500);
    expect(after.active.totalTaxLiability).toBe(0);

    expect(after.isPayable).toBe(false);
    expect(after.netPayable).toBe(0);
    expect(after.netRefund).toBe(60_000); // the whole TDS comes back
  });

  it("raises a high scrutiny risk naming the salary row", () => {
    const after = deriveTaxReturn(
      taxReducer(prefilled, {
        type: "DISPUTE_FACT",
        factId: "salary",
        declaredAmount: 1_000_000,
        feedbackCode: "CODE_3",
      }),
    );

    expect(after.cass.riskLevel).toBe("HIGH");
    expect(after.cass.aggregateShortfall).toBe(500_000);
    expect(after.cass.findings.map((f) => f.id)).toContain("salary");
    // 5,00,000 / 15,00,000 = 33.3%, well past the 20% row threshold.
    expect(after.cass.worstVariance).toBeCloseTo(1 / 3, 5);
    // No proof attached yet — which is the thing the radar is asking for.
    expect(after.cass.unsupportedFindings).toHaveLength(1);
  });

  it("clears the scrutiny flag once evidence is attached", () => {
    const after = run(
      prefilled,
      { type: "DISPUTE_FACT", factId: "salary", declaredAmount: 1_000_000, feedbackCode: "CODE_3" },
      { type: "ATTACH_EVIDENCE", factId: "salary", hasAttachment: true },
    );
    const derived = deriveTaxReturn(after);

    // Still flagged — attaching proof does not make the variance go away — but
    // there is now nothing outstanding to produce if a notice arrives.
    expect(derived.cass.riskLevel).toBe("HIGH");
    expect(derived.cass.unsupportedFindings).toHaveLength(0);
  });
});

/**
 * The regression that this whole rewrite exists for.
 *
 * The old reducer wrote `userAmount` from the prefill on every SYNC_STATE, which
 * ran on every persona/regime change. A disputed figure was silently replaced by
 * the department's while the row still said "Disputed" — so the card and the
 * summary bar disagreed, and the department's number always won.
 */
describe("SYNC_STATE must never overwrite a figure the citizen has answered", () => {
  const disputed = taxReducer(
    sync(INITIAL_STATE, { salary: 1_500_000, tds_salary: 60_000 }),
    {
      type: "DISPUTE_FACT",
      factId: "salary",
      declaredAmount: 1_000_000,
      feedbackCode: "CODE_3",
    },
  );

  it("keeps the disputed amount when the same prefill arrives again", () => {
    const resynced = sync(disputed, { salary: 1_500_000, tds_salary: 60_000 });

    expect(resynced.facts.salary.declaredAmount).toBe(1_000_000);
    expect(resynced.facts.salary.status).toBe("DISPUTED");
    expect(resynced.facts.salary.feedbackCode).toBe("CODE_3");
    // The department's side is still refreshed — that half is upstream's to own.
    expect(resynced.facts.salary.reportedAmount).toBe(1_500_000);
  });

  it("keeps the disputed amount even when the reported figure itself changes", () => {
    const resynced = sync(disputed, { salary: 1_600_000, tds_salary: 60_000 });

    expect(resynced.facts.salary.reportedAmount).toBe(1_600_000);
    expect(resynced.facts.salary.declaredAmount).toBe(1_000_000);
    // The gap widened, so the radar should now be reading the bigger shortfall.
    expect(deriveTaxReturn(resynced).cass.aggregateShortfall).toBe(600_000);
  });

  it("still moves a PENDING row, which is the case prefill is for", () => {
    const resynced = sync(disputed, { salary: 1_500_000, savings_interest: 44_000 });

    expect(resynced.facts.savings_interest.status).toBe("PENDING");
    expect(resynced.facts.savings_interest.declaredAmount).toBe(44_000);
  });

  it("does not demote a row confirmed on this screen but absent upstream", () => {
    const confirmed = taxReducer(
      sync(INITIAL_STATE, { salary: 1_500_000 }),
      { type: "CONFIRM_FACT", factId: "salary" },
    );
    const resynced = sync(confirmed, { salary: 1_500_000 }, []);

    expect(resynced.facts.salary.status).toBe("CONFIRMED");
  });

  it("promotes a PENDING row that upstream reports as confirmed", () => {
    const resynced = sync(INITIAL_STATE, { salary: 1_500_000 }, ["salary"]);

    expect(resynced.facts.salary.status).toBe("CONFIRMED");
    expect(resynced.facts.salary.feedbackCode).toBe("CODE_1");
  });
});

describe("confirm and reset", () => {
  it("CONFIRM_FACT pins the declared figure to the reported one under CODE_1", () => {
    const state = run(
      sync(INITIAL_STATE, { salary: 1_500_000 }),
      { type: "DISPUTE_FACT", factId: "salary", declaredAmount: 900_000, feedbackCode: "CODE_3" },
      { type: "CONFIRM_FACT", factId: "salary" },
    );

    expect(state.facts.salary.status).toBe("CONFIRMED");
    expect(state.facts.salary.feedbackCode).toBe("CODE_1");
    expect(state.facts.salary.declaredAmount).toBe(1_500_000);
    expect(state.facts.salary.disputeReason).toBeUndefined();
  });

  it("RESET_FACT returns the row to PENDING with no position taken", () => {
    const state = run(
      sync(INITIAL_STATE, { salary: 1_500_000 }),
      {
        type: "DISPUTE_FACT",
        factId: "salary",
        declaredAmount: 900_000,
        feedbackCode: "CODE_3",
        disputeReason: "invoice revised",
      },
      { type: "RESET_FACT", factId: "salary" },
    );

    expect(state.facts.salary.status).toBe("PENDING");
    expect(state.facts.salary.declaredAmount).toBe(1_500_000);
    expect(state.facts.salary.feedbackCode).toBeUndefined();
    expect(state.facts.salary.disputeReason).toBeUndefined();
  });

  it("never lets a dispute drive an amount below zero", () => {
    const state = taxReducer(INITIAL_STATE, {
      type: "DISPUTE_FACT",
      factId: "salary",
      declaredAmount: -50_000,
      feedbackCode: "CODE_5",
    });
    expect(state.facts.salary.declaredAmount).toBe(0);
  });
});

describe("undo", () => {
  it("restores the previous figure and pops the stack", () => {
    const base = sync(INITIAL_STATE, { salary: 1_500_000 });
    const after = run(
      base,
      { type: "DISPUTE_FACT", factId: "salary", declaredAmount: 1_000_000, feedbackCode: "CODE_3" },
      { type: "UNDO_LAST_ACTION" },
    );

    expect(after.facts.salary.declaredAmount).toBe(1_500_000);
    expect(after.facts.salary.status).toBe("PENDING");
    expect(after.history).toHaveLength(base.history.length);
  });

  it("is a no-op with nothing on the stack", () => {
    expect(taxReducer(INITIAL_STATE, { type: "UNDO_LAST_ACTION" })).toBe(INITIAL_STATE);
    expect(deriveTaxReturn(INITIAL_STATE).canUndo).toBe(false);
  });

  it("holds 25 levels and no more", () => {
    let state = INITIAL_STATE;
    for (let i = 1; i <= MAX_UNDO_DEPTH + 10; i++) {
      state = taxReducer(state, {
        type: "DISPUTE_FACT",
        factId: "salary",
        declaredAmount: 1_000_000 + i,
        feedbackCode: "CODE_3",
      });
    }
    expect(state.history).toHaveLength(MAX_UNDO_DEPTH);

    // Walking the whole stack back gets to the 25th-from-last figure, not to the
    // start — which is the honest limit of a bounded stack, not a bug.
    for (let i = 0; i < MAX_UNDO_DEPTH; i++) {
      state = taxReducer(state, { type: "UNDO_LAST_ACTION" });
    }
    expect(state.history).toHaveLength(0);
    expect(deriveTaxReturn(state).canUndo).toBe(false);
  });
});

describe("self-assessment tax u/s 140A", () => {
  it("clears the outstanding balance and is undoable", () => {
    const payable = sync(INITIAL_STATE, { salary: 1_285_000 });
    const before = deriveTaxReturn(payable);
    expect(before.netPayable).toBe(10_400);

    const paid = taxReducer(payable, {
      type: "ADD_SELF_ASSESSMENT_PAYMENT",
      payment: {
        challanNo: "04217",
        bsrCode: "0510308",
        amount: 10_400,
        date: "2026-07-14",
        majorHead: "0021 — Income Tax (other than companies)",
        minorHead: "300 — Self-Assessment Tax u/s 140A",
        method: "UPI",
      },
    });

    const after = deriveTaxReturn(paid);
    expect(after.selfAssessmentPaid).toBe(10_400);
    expect(after.netPayable).toBe(0);
    expect(after.isPayable).toBe(false);
    // The liability is unchanged; it has been paid, not reduced.
    expect(after.active.totalTaxLiability).toBe(10_400);

    const undone = taxReducer(paid, { type: "UNDO_LAST_ACTION" });
    expect(undone.selfAssessmentPayments).toHaveLength(0);
    expect(deriveTaxReturn(undone).netPayable).toBe(10_400);
  });

  it("reports a cleared return as settled, not as a refund of zero", () => {
    // isPayable === false is not the same statement as "a refund is due". A
    // challan lands the return on exactly nil, and a screen that reads
    // "net refund due ₹0" there tells the citizen money is coming back.
    const payable = sync(INITIAL_STATE, { salary: 1_285_000 });
    expect(deriveTaxReturn(payable).isSettled).toBe(false);

    const paid = taxReducer(payable, {
      type: "ADD_SELF_ASSESSMENT_PAYMENT",
      payment: {
        challanNo: "04217",
        bsrCode: "0510308",
        amount: 10_400,
        date: "2026-07-14",
        majorHead: "0021 — Income Tax (other than companies)",
        minorHead: "300 — Self-Assessment Tax u/s 140A",
        method: "UPI",
      },
    });

    const settled = deriveTaxReturn(paid);
    expect(settled.isSettled).toBe(true);
    expect(settled.isPayable).toBe(false);
    expect(settled.netPayable).toBe(0);
    expect(settled.netRefund).toBe(0);
  });

  it("is not settled when an actual refund is due", () => {
    const refund = sync(INITIAL_STATE, { salary: 1_275_000, tds_salary: 30_000 });
    const derived = deriveTaxReturn(refund);

    expect(derived.netRefund).toBe(30_000);
    expect(derived.isPayable).toBe(false);
    expect(derived.isSettled).toBe(false);
  });
});

describe("s.139(9) auto-reconcile into a revised return u/s 139(5)", () => {
  const disputed = run(
    sync(INITIAL_STATE, { salary: 1_500_000, savings_interest: 20_000, tds_salary: 60_000 }),
    { type: "DISPUTE_FACT", factId: "salary", declaredAmount: 1_000_000, feedbackCode: "CODE_3" },
    { type: "DISPUTE_FACT", factId: "savings_interest", declaredAmount: 5_000, feedbackCode: "CODE_3" },
  );

  it("closes the gap on every short income row without losing the citizen's figure", () => {
    const staged = taxReducer(disputed, { type: "STAGE_REVISED_RETURN" });

    expect(staged.facts.salary.declaredAmount).toBe(1_500_000);
    expect(staged.facts.salary.supersededAmount).toBe(1_000_000);
    expect(staged.facts.savings_interest.declaredAmount).toBe(20_000);
    expect(staged.facts.savings_interest.supersededAmount).toBe(5_000);

    expect(staged.filingSection).toBe("139(5)");
    expect(staged.revisedReturnStaged).toBe(true);

    const derived = deriveTaxReturn(staged);
    expect(derived.incomeDeclared).toBe(derived.incomeReported);
    expect(derived.cass.riskLevel).toBe("LOW"); // the defect, and the flag, are gone
  });

  it("is reversible in one action despite touching several rows", () => {
    const undone = run(
      disputed,
      { type: "STAGE_REVISED_RETURN" },
      { type: "UNDO_LAST_ACTION" },
    );

    expect(undone.facts.salary.declaredAmount).toBe(1_000_000);
    expect(undone.facts.savings_interest.declaredAmount).toBe(5_000);
    expect(undone.filingSection).toBe("139(1)");
    expect(undone.revisedReturnStaged).toBe(false);
  });
});

describe("ingesting a Form 16", () => {
  it("updates the reported side and leaves an answered row alone", () => {
    const answered = run(
      sync(INITIAL_STATE, { salary: 1_500_000, tds_salary: 60_000 }),
      { type: "DISPUTE_FACT", factId: "salary", declaredAmount: 1_000_000, feedbackCode: "CODE_3" },
    );

    const ingested = taxReducer(answered, {
      type: "INGEST_DOCUMENT",
      document: {
        fileName: "form16.pdf",
        kind: "FORM_16",
        ingestedAt: "2026-07-01T00:00:00.000Z",
        extracted: { pan: "ZZZZZ9999Z", grossSalary: 1_450_000, tds: 88_000 },
      },
    });

    expect(ingested.pan).toBe("ZZZZZ9999Z");
    expect(ingested.facts.salary.reportedAmount).toBe(1_450_000);
    expect(ingested.facts.salary.declaredAmount).toBe(1_000_000); // untouched
    // tds_salary was still PENDING, so it follows the document on both sides.
    expect(ingested.facts.tds_salary.reportedAmount).toBe(88_000);
    expect(ingested.facts.tds_salary.declaredAmount).toBe(88_000);
  });
});

describe("reconciliation progress", () => {
  it("counts every row exactly once", () => {
    const state = run(
      INITIAL_STATE,
      { type: "CONFIRM_FACT", factId: "salary" },
      { type: "DISPUTE_FACT", factId: "dividend", declaredAmount: 0, feedbackCode: "CODE_4" },
    );
    const { progress } = deriveTaxReturn(state);

    expect(progress.confirmed).toBe(1);
    expect(progress.disputed).toBe(1);
    expect(progress.confirmed + progress.disputed + progress.pending).toBe(progress.total);
  });
});

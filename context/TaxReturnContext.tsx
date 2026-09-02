"use client";

/**
 * The single source of truth for the reconciliation surface.
 *
 * WHY THIS FILE WAS REWRITTEN (2026-09-02). The previous version had a real
 * defect, and it was exactly the one a reviewer reported: pressing "No, this is
 * wrong" changed the card but not the summary bar. The cause was not the
 * dispatch — `UPDATE_FACT` worked. It was `SYNC_STATE`, which ran on every
 * change of persona/regime/confirmed-ids and unconditionally wrote
 * `userAmount: amount` for all seven rows from the upstream prefill. So the
 * citizen's corrected figure was overwritten by the AIS baseline while `status`
 * stayed `'disputed'` — the card said "Disputed" and the total said otherwise.
 * Silent, and it always favoured the department's number over the citizen's.
 *
 * THE FIX, and the rule this file now enforces everywhere:
 *
 *     `reportedAmount` belongs to the department. It is refreshed from upstream
 *     whenever new prefill arrives.
 *     `declaredAmount` belongs to the citizen. Once a fact leaves PENDING —
 *     CONFIRMED or DISPUTED — nothing but an explicit citizen action may move it.
 *
 * SECOND FIX (2026-09-03). The first fix left a gap on the other side of the
 * same seam. The main journey (`app/page.tsx`) pushed its EFFECTIVE figures —
 * the persona after the citizen's corrections — as `reportedAmount`. So a
 * dispute made on the facts board arrived here as a new department figure, not
 * as a dispute: the ITR-V in the overview tab could show the old figure on a
 * row the citizen had already confirmed and then corrected, and the CASS radar
 * and s.139(9) card never saw a main-journey correction at all. `SYNC_STATE`
 * now carries BOTH sides of every row — the ledger's baseline as `reported`,
 * its effective figure as `declared`, whether the ledger holds an active
 * correction, and whether the row is confirmed there. Rows the ledger has
 * answered are marked `origin: "upstream"` so that when the ledger withdraws
 * that answer (an undone correction) the row goes back to PENDING instead of
 * carrying a dispute nobody holds any more. A row answered HERE keeps its
 * answer unless the ledger asserts one of its own; the ledger is the product's
 * provenance-carrying record and wins a conflict.
 *
 * Every dispatch recomputes the whole return in one memo — liability under both
 * regimes, the net position, and the CASS scrutiny assessment — so no surface
 * can lag behind another. There is no second store and no local copy of an
 * amount anywhere downstream.
 *
 * PERSISTENCE. The mutable slice is saved to localStorage under its own
 * versioned key, so a challan paid or a revised return staged survives a
 * reload. Hydration happens in an effect after mount — never in the reducer's
 * initialiser — because the server renders INITIAL_STATE and a client that
 * initialised from storage would not match it.
 *
 * SCOPE. This is the flat reconciliation surface (AIS row → confirm/dispute →
 * pay → file). The main journey in `app/page.tsx` keeps its own event-sourced
 * `Correction[]` ledger with full provenance (`lib/return/state.ts`); that model
 * is the product's thesis and is deliberately NOT collapsed into this one. The
 * two meet at `SYNC_STATE`, which pushes the ledger down one way.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { computeAY2026Tax } from "../lib/taxEngineAY2026";
import type {
  AdditionalClaim,
  CapitalGainsLot,
  RegimeResult,
  TaxEngineOutput,
} from "../lib/taxEngineAY2026";
import type { CapitalGainsMeta } from "../lib/types";
import { assessCassRisk } from "../lib/compliance/cass";
import type { CassAssessment } from "../lib/compliance/cass";
import { isAISFeedbackCode } from "../lib/compliance/aisFeedback";
import type { AISFeedbackCode } from "../lib/compliance/aisFeedback";

/* ------------------------------------------------------------------ schema -- */

export type FactCategory = "income" | "tax_paid" | "deduction";

export type FactStatus = "PENDING" | "CONFIRMED" | "DISPUTED";

/**
 * CBDT AIS feedback codes. These are the department's own options when a citizen
 * disagrees with a reported row — a dispute without one is not something the
 * portal can act on, which is why DISPUTE_FACT requires it. Defined once in
 * lib/compliance/aisFeedback.ts and shared with the agent, so the dropdown here
 * and the codes the copilot writes to the ledger cannot disagree.
 */
export type { AISFeedbackCode } from "../lib/compliance/aisFeedback";
export {
  AIS_FEEDBACK_LABELS,
  AIS_FEEDBACK_HELP,
  DISPUTE_FEEDBACK_CODES,
} from "../lib/compliance/aisFeedback";

export type FactId =
  | "salary"
  | "consulting"
  | "savings_interest"
  | "dividend"
  | "capital_gains"
  | "rental"
  | "tds_salary"
  | "tds_bank"
  | "tds_other"
  | "advance_tax"
  | "sec_80c"
  | "sec_80d"
  | "sec_80ccd2";

export const FACT_IDS: readonly FactId[] = [
  "salary",
  "consulting",
  "savings_interest",
  "dividend",
  "capital_gains",
  "rental",
  "tds_salary",
  "tds_bank",
  "tds_other",
  "advance_tax",
  "sec_80c",
  "sec_80d",
  "sec_80ccd2",
] as const;

/** Which AIS/26AS statement a row came from. Shown on the card, not decorative. */
export type FactStatement = "AIS" | "TIS" | "26AS" | "Form 16" | "SFT" | "self";

export interface TaxFact {
  id: FactId;
  label: string;
  category: FactCategory;
  /** What the department was told, by a third party. Never edited by the citizen. */
  reportedAmount: number;
  /** What the citizen is filing. The only figure the engine ever reads. */
  declaredAmount: number;
  status: FactStatus;
  feedbackCode?: AISFeedbackCode;
  disputeReason?: string;
  hasAttachment?: boolean;
  /** The file the citizen attached as proof, by name — nothing is uploaded. */
  attachmentName?: string;
  /** The deductor/bank/registrar who reported it — named so it can be chased. */
  reportedBy?: string;
  statement?: FactStatement;
  /**
   * Asset-class metadata for the capital-gains row. Present → s.111A/112A/112
   * rates; absent → slab, which the engine labels as a simplification.
   */
  capitalGains?: CapitalGainsMeta;
  /**
   * Set by STAGE_REVISED_RETURN: the citizen's figure that the s.139(9)
   * auto-reconcile replaced. Kept so nothing is lost and UNDO is exact.
   */
  supersededAmount?: number;
  /** Which section of the Act the row is claimed under, for deductions. */
  section?: string;
  /**
   * "upstream" when the current status was written by SYNC_STATE from the
   * main journey's ledger rather than by an action on this surface. Such a
   * row follows the ledger: if the ledger withdraws its answer, the row goes
   * back to PENDING. A row answered here carries no origin and keeps its
   * answer until the ledger asserts one of its own.
   */
  origin?: "upstream";
}

export type FilingStatus = "INDIVIDUAL" | "HUF";

export type Regime = "NEW" | "OLD";

export type FilingSection = "139(1)" | "139(5)";

/** A paid Challan 280 (ITNS 280), minor head 300, self-assessment tax u/s 140A. */
export interface SelfAssessmentPayment {
  /** 5-digit challan serial, as the bank issues it. */
  challanNo: string;
  /** 7-digit BSR code of the collecting branch. */
  bsrCode: string;
  amount: number;
  /** ISO date of tender. */
  date: string;
  majorHead: string;
  minorHead: string;
  method: "UPI" | "NET_BANKING";
  bank?: string;
}

/** A Form 16 / AIS PDF the citizen dropped in, and what was read out of it. */
export interface IngestedDocument {
  fileName: string;
  kind: "FORM_16" | "AIS";
  ingestedAt: string;
  /** Fields the parser actually found — absent means "not in this file". */
  extracted: { pan?: string; grossSalary?: number; tds?: number };
}

/**
 * One row as the main journey's ledger sees it. Both sides travel together so
 * this surface can tell a department figure from a citizen's correction.
 */
export interface UpstreamFact {
  /** The ledger's baseline — what the reporter filed. */
  reported: number;
  /** The ledger's effective figure after the citizen's corrections. */
  declared: number;
  /** True when the ledger holds an active (non-reverted) correction on the row. */
  disputed: boolean;
  feedbackCode?: AISFeedbackCode;
  disputeReason?: string;
  /** True when every ledger item behind this row has been confirmed there. */
  confirmed: boolean;
  /** Who reported the row, per the ledger's provenance. Named on the radar. */
  reportedBy?: string;
  statement?: FactStatement;
}

/**
 * The part of the state UNDO_LAST_ACTION restores.
 *
 * The spec typed history as `Array<Record<string, TaxFact>>` — facts only. That
 * cannot undo ADD_SELF_ASSESSMENT_PAYMENT or STAGE_REVISED_RETURN, both of which
 * are listed as undoable actions, so the snapshot is the whole mutable slice.
 * `facts` is still the dominant member, so it is a superset of the spec shape.
 */
export interface TaxReturnSnapshot {
  facts: Record<FactId, TaxFact>;
  selfAssessmentPayments: SelfAssessmentPayment[];
  filingSection: FilingSection;
  revisedReturnStaged: boolean;
}

export interface TaxReturnState extends TaxReturnSnapshot {
  pan: string;
  name: string;
  filingStatus: FilingStatus;
  isSalaried: boolean;
  /** Drives only the OLD-regime basic exemption; new-regime slabs are age-blind. */
  age: number;
  selectedRegime: Regime;
  /** Newest first, capped at MAX_UNDO_DEPTH. */
  history: TaxReturnSnapshot[];
  ingestedDocuments: IngestedDocument[];
  /** Set when a s.139(9) defect has been raised against the filed return. */
  defectNoticeOpen: boolean;
  /** ISO timestamp of the moment the return was accepted for filing, if it has been. */
  filedAt?: string;
  /**
   * Chapter VI-A claims the ledger holds that have no row here (80GG, 80E,
   * parents' 80D ...). Fed to the engine by section so this surface computes
   * the same old-regime figure the main journey does. Not editable here.
   */
  additionalClaims: AdditionalClaim[];
  /** True once persisted state has been read back after mount. Never persisted. */
  hydrated: boolean;
}

/** 25 levels, per spec. Deep enough to walk back a whole reconciliation sitting. */
export const MAX_UNDO_DEPTH = 25;

/** The slice that survives a reload. History and the hydration flag do not. */
export type PersistedTaxReturn = Pick<
  TaxReturnState,
  | "pan"
  | "name"
  | "filingStatus"
  | "isSalaried"
  | "age"
  | "selectedRegime"
  | "facts"
  | "selfAssessmentPayments"
  | "filingSection"
  | "revisedReturnStaged"
  | "ingestedDocuments"
  | "defectNoticeOpen"
  | "filedAt"
  | "additionalClaims"
>;

export const PERSIST_STORAGE_KEY = "wapsi_reconciliation";
export const PERSIST_VERSION = 1;

export type TaxAction =
  | { type: "CONFIRM_FACT"; factId: FactId }
  | {
      type: "DISPUTE_FACT";
      factId: FactId;
      declaredAmount: number;
      feedbackCode: AISFeedbackCode;
      disputeReason?: string;
    }
  | { type: "RESET_FACT"; factId: FactId }
  | {
      type: "ATTACH_EVIDENCE";
      factId: FactId;
      hasAttachment: boolean;
      attachmentName?: string;
    }
  | { type: "ADD_SELF_ASSESSMENT_PAYMENT"; payment: SelfAssessmentPayment }
  | { type: "UNDO_LAST_ACTION" }
  | { type: "SET_REGIME"; regime: Regime }
  | { type: "SET_FILING_STATUS"; filingStatus: FilingStatus }
  | { type: "INGEST_DOCUMENT"; document: IngestedDocument }
  | { type: "RAISE_DEFECT_NOTICE" }
  | { type: "STAGE_REVISED_RETURN" }
  | { type: "MARK_FILED"; filedAt: string }
  | { type: "HYDRATE"; payload: PersistedTaxReturn | null }
  | { type: "RESET" }
  | {
      type: "SYNC_STATE";
      payload: {
        name: string;
        pan: string;
        isSalaried: boolean;
        age?: number;
        filingStatus?: FilingStatus;
        regime: Regime;
        /**
         * The ledger's view of every row it knows about, both sides. Writes
         * reportedAmount always; moves declaredAmount and status only under
         * the rules documented on the reducer case.
         */
        facts: Partial<Record<FactId, UpstreamFact>>;
        /**
         * Asset-class metadata for the capital-gains row. Travels with the
         * amount, or a s.112A gain would be re-taxed at slab here and the
         * liability shown to the citizen would be wrong.
         */
        capitalGainsMeta?: CapitalGainsMeta;
        /** ISO timestamp of acceptance, once the ledger records one. */
        filedAt?: string;
        /** Claims with no row here, forwarded by section. Absent = none. */
        additionalClaims?: AdditionalClaim[];
      };
    };

/* ---------------------------------------------------------------- initial -- */

/**
 * Synthetic prefill, shaped so the surface demonstrates the real cases: an
 * income large enough to sit above the s.87A threshold, a classified equity gain
 * that must be priced at s.112A rather than slab, TDS short of the liability so
 * the Challan 280 path is reachable, and 80C/80D claims that are worth something
 * under the old regime and nothing under the new one.
 */
function initialFacts(): Record<FactId, TaxFact> {
  return {
    salary: {
      id: "salary", label: "Gross salary u/s 17(1)", category: "income",
      reportedAmount: 1_500_000, declaredAmount: 1_500_000, status: "PENDING",
      reportedBy: "Nimbus Systems Pvt Ltd", statement: "Form 16", section: "17(1)",
    },
    consulting: {
      id: "consulting", label: "Professional / consulting receipts", category: "income",
      reportedAmount: 0, declaredAmount: 0, status: "PENDING",
      reportedBy: "—", statement: "AIS", section: "44ADA",
    },
    savings_interest: {
      id: "savings_interest", label: "Savings and deposit interest", category: "income",
      reportedAmount: 18_400, declaredAmount: 18_400, status: "PENDING",
      reportedBy: "State Bank of India", statement: "AIS", section: "56",
    },
    dividend: {
      id: "dividend", label: "Dividend received", category: "income",
      reportedAmount: 12_500, declaredAmount: 12_500, status: "PENDING",
      reportedBy: "KFin Technologies (registrar)", statement: "SFT", section: "56(2)(i)",
    },
    capital_gains: {
      id: "capital_gains", label: "Long-term capital gain — listed equity (STT paid)",
      category: "income", reportedAmount: 185_000, declaredAmount: 185_000, status: "PENDING",
      reportedBy: "Zenith Securities Ltd", statement: "SFT", section: "112A",
      capitalGains: { assetClass: "equity_stt", holding: "long" },
    },
    rental: {
      id: "rental", label: "Rent received from house property", category: "income",
      reportedAmount: 0, declaredAmount: 0, status: "PENDING",
      reportedBy: "—", statement: "AIS", section: "22",
    },
    tds_salary: {
      id: "tds_salary", label: "TDS deducted by employer u/s 192", category: "tax_paid",
      reportedAmount: 90_000, declaredAmount: 90_000, status: "PENDING",
      reportedBy: "Nimbus Systems Pvt Ltd", statement: "26AS", section: "192",
    },
    tds_bank: {
      id: "tds_bank", label: "TDS deducted by bank u/s 194A", category: "tax_paid",
      reportedAmount: 1_840, declaredAmount: 1_840, status: "PENDING",
      reportedBy: "State Bank of India", statement: "26AS", section: "194A",
    },
    tds_other: {
      id: "tds_other", label: "TDS deducted by others", category: "tax_paid",
      reportedAmount: 0, declaredAmount: 0, status: "PENDING",
      reportedBy: "—", statement: "26AS",
    },
    advance_tax: {
      id: "advance_tax", label: "Advance tax paid", category: "tax_paid",
      reportedAmount: 0, declaredAmount: 0, status: "PENDING",
      reportedBy: "Self", statement: "26AS", section: "211",
    },
    sec_80c: {
      id: "sec_80c", label: "Section 80C — PF, ELSS, life insurance", category: "deduction",
      reportedAmount: 150_000, declaredAmount: 150_000, status: "PENDING",
      reportedBy: "Self-declared", statement: "self", section: "80C",
    },
    sec_80d: {
      id: "sec_80d", label: "Section 80D — health insurance premium", category: "deduction",
      reportedAmount: 25_000, declaredAmount: 25_000, status: "PENDING",
      reportedBy: "Self-declared", statement: "self", section: "80D",
    },
    sec_80ccd2: {
      id: "sec_80ccd2", label: "Section 80CCD(2) — employer NPS contribution",
      category: "deduction", reportedAmount: 0, declaredAmount: 0, status: "PENDING",
      reportedBy: "Nimbus Systems Pvt Ltd", statement: "Form 16", section: "80CCD(2)",
    },
  };
}

export const INITIAL_STATE: TaxReturnState = {
  pan: "ABCDE1234F",
  name: "Taxpayer Name",
  filingStatus: "INDIVIDUAL",
  isSalaried: true,
  age: 30,
  selectedRegime: "NEW",
  facts: initialFacts(),
  selfAssessmentPayments: [],
  history: [],
  filingSection: "139(1)",
  revisedReturnStaged: false,
  ingestedDocuments: [],
  defectNoticeOpen: false,
  filedAt: undefined,
  additionalClaims: [],
  hydrated: false,
};

/* ---------------------------------------------------------------- reducer -- */

function snapshot(state: TaxReturnState): TaxReturnSnapshot {
  return {
    facts: state.facts,
    selfAssessmentPayments: state.selfAssessmentPayments,
    filingSection: state.filingSection,
    revisedReturnStaged: state.revisedReturnStaged,
  };
}

/** Push the pre-action snapshot, newest first, dropping anything past 25. */
function pushHistory(state: TaxReturnState): TaxReturnSnapshot[] {
  return [snapshot(state), ...state.history].slice(0, MAX_UNDO_DEPTH);
}

/** Replace one fact, preserving object identity for every other row. */
function withFact(
  state: TaxReturnState,
  factId: FactId,
  patch: Partial<TaxFact>,
): Record<FactId, TaxFact> {
  return { ...state.facts, [factId]: { ...state.facts[factId], ...patch } };
}

/**
 * The CBDT code a correction implies when the ledger did not record one — the
 * main journey's older corrections, and its self-declared edits, carry only a
 * reason string. Zero is a denial; anything else is a disputed figure.
 */
export function inferFeedbackCode(declared: number, reason?: string): AISFeedbackCode {
  const text = (reason ?? "").toLowerCase();
  if (/joint|split|other pan|wrong pan|another pan/.test(text)) return "CODE_4";
  if (/duplicate|not my income|fraud|denied|never received/.test(text)) return "CODE_5";
  if (/exempt|not taxable/.test(text)) return "CODE_2";
  if (declared === 0) return "CODE_5";
  return "CODE_3";
}

export function taxReducer(state: TaxReturnState, action: TaxAction): TaxReturnState {
  switch (action.type) {
    /**
     * "Yes, this is right." CODE_1 is the department's own code for exactly this,
     * and declaredAmount is pinned to reportedAmount so a later prefill refresh
     * cannot quietly move a figure the citizen has already signed off.
     */
    case "CONFIRM_FACT": {
      const fact = state.facts[action.factId];
      if (!fact) return state;
      return {
        ...state,
        history: pushHistory(state),
        facts: withFact(state, action.factId, {
          status: "CONFIRMED",
          feedbackCode: "CODE_1",
          declaredAmount: fact.reportedAmount,
          disputeReason: undefined,
          origin: undefined,
        }),
      };
    }

    /** "No, this is wrong." The citizen's figure and their reason for it. */
    case "DISPUTE_FACT": {
      const fact = state.facts[action.factId];
      if (!fact) return state;
      return {
        ...state,
        history: pushHistory(state),
        facts: withFact(state, action.factId, {
          status: "DISPUTED",
          declaredAmount: Math.max(0, Math.round(action.declaredAmount)),
          feedbackCode: action.feedbackCode,
          disputeReason: action.disputeReason,
          supersededAmount: undefined,
          origin: undefined,
        }),
      };
    }

    /** Back to untouched: the department's figure, no position taken. */
    case "RESET_FACT": {
      const fact = state.facts[action.factId];
      if (!fact) return state;
      return {
        ...state,
        history: pushHistory(state),
        facts: withFact(state, action.factId, {
          status: "PENDING",
          declaredAmount: fact.reportedAmount,
          feedbackCode: undefined,
          disputeReason: undefined,
          supersededAmount: undefined,
          origin: undefined,
        }),
      };
    }

    case "ATTACH_EVIDENCE": {
      if (!state.facts[action.factId]) return state;
      return {
        ...state,
        history: pushHistory(state),
        facts: withFact(state, action.factId, {
          hasAttachment: action.hasAttachment,
          attachmentName: action.hasAttachment ? action.attachmentName : undefined,
        }),
      };
    }

    /**
     * Self-assessment tax u/s 140A, paid by Challan 280. Credited like TDS, so
     * the net position falls by the amount paid — which is the whole point of
     * paying before filing.
     */
    case "ADD_SELF_ASSESSMENT_PAYMENT":
      return {
        ...state,
        history: pushHistory(state),
        selfAssessmentPayments: [...state.selfAssessmentPayments, action.payment],
      };

    /**
     * Undo is a pop, not an inverse-action replay. Replaying inverses would need
     * every action to be invertible, and STAGE_REVISED_RETURN touches an
     * unbounded number of rows at once; a snapshot is exact by construction.
     */
    case "UNDO_LAST_ACTION": {
      const [previous, ...rest] = state.history;
      if (!previous) return state;
      return { ...state, ...previous, history: rest };
    }

    case "SET_REGIME":
      return state.selectedRegime === action.regime
        ? state
        : { ...state, selectedRegime: action.regime };

    case "SET_FILING_STATUS":
      return { ...state, filingStatus: action.filingStatus };

    /**
     * A parsed Form 16 / AIS overwrites the DEPARTMENT's side of a row, because
     * that is what the document is: the reporter's own statement. It deliberately
     * does not touch a row the citizen has already CONFIRMED or DISPUTED — the
     * same rule as SYNC_STATE, for the same reason.
     */
    case "INGEST_DOCUMENT": {
      const { pan, grossSalary, tds } = action.document.extracted;
      let facts = state.facts;
      const apply = (factId: FactId, amount: number | undefined): void => {
        if (amount === undefined || !Number.isFinite(amount)) return;
        const fact = facts[factId];
        if (!fact) return;
        facts = {
          ...facts,
          [factId]: {
            ...fact,
            reportedAmount: amount,
            // PENDING rows follow the document. A row the citizen has answered
            // keeps their figure; the card then shows both, and the CASS radar
            // picks up the new divergence.
            declaredAmount: fact.status === "PENDING" ? amount : fact.declaredAmount,
            statement: action.document.kind === "FORM_16" ? "Form 16" : "AIS",
          },
        };
      };
      apply("salary", grossSalary);
      apply("tds_salary", tds);
      return {
        ...state,
        history: pushHistory(state),
        pan: pan && pan.length === 10 ? pan : state.pan,
        facts,
        ingestedDocuments: [...state.ingestedDocuments, action.document],
      };
    }

    case "RAISE_DEFECT_NOTICE":
      return { ...state, defectNoticeOpen: true };

    /**
     * s.139(9) auto-reconcile → revised return u/s 139(5).
     *
     * The defect is that declared income is below what the reporters filed, so
     * reconciling means accepting the reported figure on the income rows that
     * are still short. Zero data loss: the citizen's figure is kept in
     * `supersededAmount`, their reason is kept, and the pre-action snapshot goes
     * on the undo stack — so this is fully reversible, which matters because it
     * is a one-click action that changes what gets filed.
     */
    case "STAGE_REVISED_RETURN": {
      let facts = state.facts;
      for (const fact of Object.values(state.facts)) {
        if (fact.category !== "income") continue;
        if (fact.declaredAmount >= fact.reportedAmount) continue;
        facts = {
          ...facts,
          [fact.id]: {
            ...fact,
            supersededAmount: fact.declaredAmount,
            declaredAmount: fact.reportedAmount,
            status: "CONFIRMED",
            feedbackCode: "CODE_1",
            origin: undefined,
          },
        };
      }
      return {
        ...state,
        history: pushHistory(state),
        facts,
        filingSection: "139(5)",
        revisedReturnStaged: true,
        defectNoticeOpen: false,
      };
    }

    /** The moment the return was accepted. Stamped on the ITR-V. */
    case "MARK_FILED":
      return { ...state, filedAt: action.filedAt };

    /**
     * Persisted state read back after mount. Facts are merged row by row over
     * the initial table so a row added to the schema after the save still
     * exists; anything the saved shape lacks keeps its initial value.
     */
    case "HYDRATE": {
      if (!action.payload) return { ...state, hydrated: true };
      const saved = action.payload;
      const facts = { ...state.facts };
      for (const id of FACT_IDS) {
        const row = saved.facts?.[id];
        if (row) facts[id] = { ...state.facts[id], ...row, id };
      }
      return {
        ...state,
        ...saved,
        facts,
        history: [],
        hydrated: true,
      };
    }

    /** Sign-out. Nothing of the previous citizen may survive on this surface. */
    case "RESET":
      return { ...INITIAL_STATE, facts: initialFacts(), hydrated: true };

    /**
     * Prefill from the main journey's ledger, both sides of every row.
     *
     * `reportedAmount` is refreshed unconditionally — that is the ledger's
     * baseline and upstream's to own. What happens to the citizen's side
     * depends on what the ledger says about the row:
     *
     *   - ledger holds an active correction → DISPUTED at the ledger's
     *     figure, with its code and reason. Marked `origin: "upstream"`.
     *   - ledger has the row confirmed → CONFIRMED at the reported figure.
     *     Marked `origin: "upstream"`.
     *   - ledger says nothing → a row this surface answered keeps its answer;
     *     a row the ledger answered earlier (`origin: "upstream"`) goes back
     *     to PENDING, because the ledger has withdrawn that answer; a PENDING
     *     row simply follows the reported figure.
     *
     * The old rule — never overwrite a CONFIRMED or DISPUTED figure — still
     * holds for anything answered here. It is the ledger's OWN answers that
     * now travel, which is what the ITR-V, the radar and the s.139(9) card
     * were missing.
     */
    case "SYNC_STATE": {
      const { payload } = action;
      let facts = state.facts;
      for (const [key, up] of Object.entries(payload.facts)) {
        const factId = key as FactId;
        const fact = facts[factId];
        if (!fact || !up) continue;
        if (!Number.isFinite(up.reported) || !Number.isFinite(up.declared)) continue;

        const reportedAmount = Math.max(0, Math.round(up.reported));
        const capitalGains =
          factId === "capital_gains" && payload.capitalGainsMeta
            ? payload.capitalGainsMeta
            : fact.capitalGains;
        // Provenance is the ledger's to name; the synthetic prefill's reporter
        // must not survive onto a real citizen's row.
        const reportedBy = up.reportedBy ?? fact.reportedBy;
        const statement = up.statement ?? fact.statement;

        let next: TaxFact;
        if (up.disputed) {
          const code =
            up.feedbackCode && isAISFeedbackCode(up.feedbackCode)
              ? up.feedbackCode
              : inferFeedbackCode(up.declared, up.disputeReason);
          next = {
            ...fact,
            reportedAmount,
            declaredAmount: Math.max(0, Math.round(up.declared)),
            status: "DISPUTED",
            feedbackCode: code,
            disputeReason: up.disputeReason,
            supersededAmount: undefined,
            origin: "upstream",
            capitalGains,
            reportedBy,
            statement,
          };
        } else if (up.confirmed) {
          next = {
            ...fact,
            reportedAmount,
            declaredAmount: reportedAmount,
            status: "CONFIRMED",
            feedbackCode: "CODE_1",
            disputeReason: undefined,
            supersededAmount: undefined,
            origin: "upstream",
            capitalGains,
            reportedBy,
            statement,
          };
        } else if (fact.origin === "upstream" || fact.status === "PENDING") {
          next = {
            ...fact,
            reportedAmount,
            declaredAmount: reportedAmount,
            status: "PENDING",
            feedbackCode: undefined,
            disputeReason: undefined,
            supersededAmount: undefined,
            origin: undefined,
            capitalGains,
            reportedBy,
            statement,
          };
        } else {
          next = { ...fact, reportedAmount, capitalGains, reportedBy, statement };
        }
        facts = { ...facts, [factId]: next };
      }
      return {
        ...state,
        name: payload.name,
        pan: payload.pan,
        isSalaried: payload.isSalaried,
        age: payload.age ?? state.age,
        filingStatus: payload.filingStatus ?? state.filingStatus,
        selectedRegime: payload.regime,
        filedAt: payload.filedAt ?? state.filedAt,
        additionalClaims: payload.additionalClaims ?? [],
        facts,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------ persistence -- */

/** The slice worth keeping across a reload, in a versioned envelope. */
export function serializeForStorage(state: TaxReturnState): string {
  const slice: PersistedTaxReturn = {
    pan: state.pan,
    name: state.name,
    filingStatus: state.filingStatus,
    isSalaried: state.isSalaried,
    age: state.age,
    selectedRegime: state.selectedRegime,
    facts: state.facts,
    selfAssessmentPayments: state.selfAssessmentPayments,
    filingSection: state.filingSection,
    revisedReturnStaged: state.revisedReturnStaged,
    ingestedDocuments: state.ingestedDocuments,
    defectNoticeOpen: state.defectNoticeOpen,
    filedAt: state.filedAt,
    additionalClaims: state.additionalClaims,
  };
  return JSON.stringify({ version: PERSIST_VERSION, state: slice });
}

/**
 * Read a saved envelope back. Anything unparseable, from another version, or
 * missing the fact table is treated as "nothing saved" — a corrupt draft must
 * never throw on the way in, and must never half-apply.
 */
export function parsePersisted(raw: string | null): PersistedTaxReturn | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const envelope = parsed as { version?: unknown; state?: unknown };
  if (envelope.version !== PERSIST_VERSION) return null;
  const s = envelope.state as Partial<PersistedTaxReturn> | undefined;
  if (!s || typeof s !== "object" || typeof s.facts !== "object" || s.facts === null) {
    return null;
  }
  return {
    pan: typeof s.pan === "string" ? s.pan : INITIAL_STATE.pan,
    name: typeof s.name === "string" ? s.name : INITIAL_STATE.name,
    filingStatus: s.filingStatus === "HUF" ? "HUF" : "INDIVIDUAL",
    isSalaried: typeof s.isSalaried === "boolean" ? s.isSalaried : INITIAL_STATE.isSalaried,
    age: typeof s.age === "number" ? s.age : INITIAL_STATE.age,
    selectedRegime: s.selectedRegime === "OLD" ? "OLD" : "NEW",
    facts: s.facts,
    selfAssessmentPayments: Array.isArray(s.selfAssessmentPayments)
      ? s.selfAssessmentPayments
      : [],
    filingSection: s.filingSection === "139(5)" ? "139(5)" : "139(1)",
    revisedReturnStaged: s.revisedReturnStaged === true,
    ingestedDocuments: Array.isArray(s.ingestedDocuments) ? s.ingestedDocuments : [],
    defectNoticeOpen: s.defectNoticeOpen === true,
    filedAt: typeof s.filedAt === "string" ? s.filedAt : undefined,
    additionalClaims: Array.isArray(s.additionalClaims) ? s.additionalClaims : [],
  };
}

/* ------------------------------------------------------------- derivation -- */

/** Build the engine input from the citizen's declared figures — never reported. */
export function engineInputFor(state: TaxReturnState) {
  const f = state.facts;
  const lots: CapitalGainsLot[] = [];
  if (f.capital_gains.declaredAmount > 0) {
    lots.push({
      amount: f.capital_gains.declaredAmount,
      classification: f.capital_gains.capitalGains,
    });
  }
  const selfAssessmentPaid = state.selfAssessmentPayments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  return {
    isSalaried: state.isSalaried,
    age: state.age,
    grossSalary: f.salary.declaredAmount,
    businessIncome: f.consulting.declaredAmount,
    savingsInterest: f.savings_interest.declaredAmount,
    dividendIncome: f.dividend.declaredAmount,
    rentalIncome: f.rental.declaredAmount,
    capitalGains: lots,
    otherIncome: 0,
    tdsPaid:
      f.tds_salary.declaredAmount + f.tds_bank.declaredAmount + f.tds_other.declaredAmount,
    advanceTaxPaid: f.advance_tax.declaredAmount,
    selfAssessmentPaid,
    section80C: f.sec_80c.declaredAmount,
    section80D: f.sec_80d.declaredAmount,
    section80CCD2: f.sec_80ccd2.declaredAmount,
    additionalClaims: state.additionalClaims,
  };
}

export interface ReconciliationProgress {
  total: number;
  confirmed: number;
  disputed: number;
  pending: number;
}

/**
 * Everything the UI needs, derived in one pass. Recomputed on every dispatch, so
 * the summary bar, the calculation trail, the radar and the Challan 280 CTA are
 * always reading the same numbers.
 */
export interface TaxDerived {
  computation: TaxEngineOutput;
  /** The regime the citizen has selected — what every headline figure reflects. */
  active: RegimeResult;
  /** The other one, for the "you would save X" comparison. */
  alternative: RegimeResult;
  /** Positive = payable to the department. Zero once a challan clears it. */
  netPayable: number;
  /** Positive = refund due to the citizen. */
  netRefund: number;
  isPayable: boolean;
  /**
   * The net position is exactly nil — the state a cleared Challan 280 leaves
   * the return in. Distinct from isPayable === false, which is otherwise read
   * as "a refund is due"; here nothing is owed in either direction.
   */
  isSettled: boolean;
  /** Total of every cleared Challan 280 under s.140A. */
  selfAssessmentPaid: number;
  cass: CassAssessment;
  progress: ReconciliationProgress;
  /** Reported minus declared across income rows — the s.139(9) defect figure. */
  incomeReported: number;
  incomeDeclared: number;
  canUndo: boolean;
}

export function deriveTaxReturn(state: TaxReturnState): TaxDerived {
  const computation = computeAY2026Tax(engineInputFor(state));
  const active =
    state.selectedRegime === "NEW" ? computation.newRegime : computation.oldRegime;
  const alternative =
    state.selectedRegime === "NEW" ? computation.oldRegime : computation.newRegime;

  const incomeFacts = Object.values(state.facts).filter((f) => f.category === "income");
  // The radar watches what the citizen has actually contested. A row whose
  // reported figure moved under a confirmation is a stale confirmation, not a
  // downward revision the citizen made.
  const cass = assessCassRisk(
    incomeFacts
      .filter((f) => f.status === "DISPUTED")
      .map((f) => ({
      id: f.id,
      label: f.label,
      reportedAmount: f.reportedAmount,
      declaredAmount: f.declaredAmount,
        hasAttachment: f.hasAttachment,
        attachmentName: f.attachmentName,
        reportedBy: f.reportedBy,
      })),
  );

  const allFacts = Object.values(state.facts);
  const progress: ReconciliationProgress = {
    total: allFacts.length,
    confirmed: allFacts.filter((f) => f.status === "CONFIRMED").length,
    disputed: allFacts.filter((f) => f.status === "DISPUTED").length,
    pending: allFacts.filter((f) => f.status === "PENDING").length,
  };

  const net = active.netPayableOrRefund;
  return {
    computation,
    active,
    alternative,
    netPayable: Math.max(0, net),
    netRefund: Math.max(0, -net),
    isPayable: net > 0,
    isSettled: net === 0,
    selfAssessmentPaid: active.selfAssessmentPaid,
    cass,
    progress,
    incomeReported: incomeFacts.reduce((s, f) => s + f.reportedAmount, 0),
    incomeDeclared: incomeFacts.reduce((s, f) => s + f.declaredAmount, 0),
    canUndo: state.history.length > 0,
  };
}

/* ------------------------------------------------------------------ react -- */

export interface TaxContextValue extends TaxDerived {
  state: TaxReturnState;
  dispatch: React.Dispatch<TaxAction>;
  /** Convenience for the surfaces; identical to dispatching the action. */
  confirmFact: (factId: FactId) => void;
  disputeFact: (
    factId: FactId,
    declaredAmount: number,
    feedbackCode: AISFeedbackCode,
    disputeReason?: string,
  ) => void;
  resetFact: (factId: FactId) => void;
  undo: () => void;
}

const TaxContext = createContext<TaxContextValue | null>(null);

function readStorage(): PersistedTaxReturn | null {
  try {
    return parsePersisted(window.localStorage.getItem(PERSIST_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStorage(state: TaxReturnState): void {
  try {
    window.localStorage.setItem(PERSIST_STORAGE_KEY, serializeForStorage(state));
  } catch {
    /* quota or privacy mode — the in-memory state is still authoritative */
  }
}

export const TaxProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(taxReducer, INITIAL_STATE);

  // Read the saved slice back once, after mount. Not in the reducer's
  // initialiser: the server rendered INITIAL_STATE, and a client that started
  // from storage would disagree with it at hydration.
  useEffect(() => {
    dispatch({ type: "HYDRATE", payload: readStorage() });
  }, []);

  // Save every committed state after hydration. Before it, the state is the
  // synthetic prefill and writing it would overwrite the citizen's saved draft.
  useEffect(() => {
    if (state.hydrated) writeStorage(state);
  }, [state]);

  // One memo, one recomputation per dispatch. Keyed on the whole state object:
  // the reducer is strictly immutable, so a new reference means something moved.
  const derived = useMemo(() => deriveTaxReturn(state), [state]);

  const confirmFact = useCallback(
    (factId: FactId) => dispatch({ type: "CONFIRM_FACT", factId }),
    [],
  );
  const disputeFact = useCallback(
    (
      factId: FactId,
      declaredAmount: number,
      feedbackCode: AISFeedbackCode,
      disputeReason?: string,
    ) => dispatch({ type: "DISPUTE_FACT", factId, declaredAmount, feedbackCode, disputeReason }),
    [],
  );
  const resetFact = useCallback(
    (factId: FactId) => dispatch({ type: "RESET_FACT", factId }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "UNDO_LAST_ACTION" }), []);

  const value = useMemo<TaxContextValue>(
    () => ({ ...derived, state, dispatch, confirmFact, disputeFact, resetFact, undo }),
    [derived, state, confirmFact, disputeFact, resetFact, undo],
  );

  return <TaxContext.Provider value={value}>{children}</TaxContext.Provider>;
};

export function useTax(): TaxContextValue {
  const ctx = useContext(TaxContext);
  if (!ctx) throw new Error("useTax must be used inside <TaxProvider>");
  return ctx;
}

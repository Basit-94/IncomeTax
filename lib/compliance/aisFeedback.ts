/**
 * CBDT AIS feedback codes — the department's own vocabulary for disagreeing
 * with a reported row.
 *
 * These are not free text. When a citizen says "no, this is wrong" about an AIS
 * entry, the portal makes them pick one of these; the code is what travels back
 * to the reporter and what decides whether the entry is corrected, reassigned,
 * or dropped. A dispute without one is not something the department can act on,
 * which is why the reducer requires it.
 *
 * SINGLE SOURCE. Two copies of this table already existed — one in
 * `lib/agent/copilot-engine.ts` and one in the agent's system prompt — and they
 * had drifted: the same code meant "Information is not fully correct" in one
 * and something else in the other. This module is now the only definition; both
 * import it. The wording follows the more specific of the two, because a citizen
 * choosing between five options needs them to be distinguishable.
 *
 * Pure data, no React: the agent (server) and the reconciliation surface
 * (client) both read it.
 */

export type AISFeedbackCode = "CODE_1" | "CODE_2" | "CODE_3" | "CODE_4" | "CODE_5";

export const AIS_FEEDBACK_CODES: readonly AISFeedbackCode[] = [
  "CODE_1",
  "CODE_2",
  "CODE_3",
  "CODE_4",
  "CODE_5",
] as const;

/** Short label — what goes in the dropdown. */
export const AIS_FEEDBACK_LABELS: Readonly<Record<AISFeedbackCode, string>> = {
  CODE_1: "Information is correct",
  CODE_2: "Income is not taxable / fully exempt",
  CODE_3: "Information is not fully correct (disputed amount)",
  CODE_4: "Information belongs to another PAN / joint account",
  CODE_5: "Information is denied / duplicate transaction",
};

/** One line of plain language, for the citizen who does not know which to pick. */
export const AIS_FEEDBACK_HELP: Readonly<Record<AISFeedbackCode, string>> = {
  CODE_1: "The amount and the source are both right. Nothing to change.",
  CODE_2: "You did receive this, but it is exempt — agricultural income, a matured PPF, a gift within limits.",
  CODE_3: "The source is right but the figure is not. You will enter the correct amount.",
  CODE_4: "This belongs to someone else, or to a joint account where the income is not yours.",
  CODE_5: "You never received this at all, or it has already been counted in another row.",
};

/** The codes that mean the citizen is contesting the row. CODE_1 is agreement. */
export const DISPUTE_FEEDBACK_CODES: readonly AISFeedbackCode[] = [
  "CODE_2",
  "CODE_3",
  "CODE_4",
  "CODE_5",
] as const;

export function isAISFeedbackCode(value: string): value is AISFeedbackCode {
  return (AIS_FEEDBACK_CODES as readonly string[]).includes(value);
}

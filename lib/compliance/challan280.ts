/**
 * Challan 280 (ITNS 280) — self-assessment tax under s.140A.
 *
 * When a return computes to a balance payable, the citizen must pay it BEFORE
 * filing; a return filed with tax outstanding is defective under s.139(9). The
 * payment is made on a Challan 280 and the return then carries the challan's
 * BSR code, serial number and date as proof. Getting those three fields onto the
 * return is the entire mechanical purpose of this flow.
 *
 * The heads below are real and fixed:
 *   Major head 0021 — Income Tax (other than companies), i.e. individuals/HUFs.
 *                     Companies pay under 0020.
 *   Minor head 300  — Self-assessment tax. Distinct from 100 (advance tax) and
 *                     400 (tax on regular assessment). Paying under the wrong
 *                     minor head is a common and genuinely painful error: the
 *                     credit lands in the wrong bucket and has to be corrected
 *                     through the assessing officer.
 *
 * MOCK BOUNDARY. No payment is made and no bank is contacted. The BSR code and
 * challan serial produced here are synthetic and generated locally so the rest
 * of the return flow can be exercised end to end. Every surface that shows them
 * says so.
 */

/** Individuals and HUFs. Companies would be 0020. */
export const CHALLAN_MAJOR_HEAD = "0021";
export const CHALLAN_MAJOR_HEAD_LABEL = "0021 — Income Tax (other than companies)";

/** Self-assessment tax. Advance tax is 100; regular assessment is 400. */
export const CHALLAN_MINOR_HEAD = "300";
export const CHALLAN_MINOR_HEAD_LABEL = "300 — Self-Assessment Tax u/s 140A";

export const CHALLAN_TYPE = "ITNS 280";
export const ASSESSMENT_YEAR = "2026-27";
export const FINANCIAL_YEAR = "2025-26";

/** Health & education cess, shown as its own line on the challan. */
export const CESS_RATE = 0.04;

export interface ChallanBank {
  code: string;
  name: string;
}

/** The three net-banking options the spec names. */
export const NET_BANKING_BANKS: readonly ChallanBank[] = [
  { code: "SBIN", name: "State Bank of India" },
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
] as const;

/** Seconds a UPI collect request stays live before the QR must be refreshed. */
export const UPI_QR_TTL_SECONDS = 300;

/**
 * Split a total into the base tax and the 4% cess that sits on top of it.
 *
 * The challan shows both lines because the department's own does, and because a
 * citizen reconciling this against their computation sheet needs the base figure
 * to match. Derived by inverting `base + round(base × 0.04) = total`, then
 * taking cess as the remainder so the two lines always sum exactly to the total
 * — a rounding gap here would be a challan that does not tally.
 */
export function splitTaxAndCess(total: number): { baseTax: number; cess: number } {
  const rounded = Math.max(0, Math.round(total));
  const baseTax = Math.round(rounded / (1 + CESS_RATE));
  return { baseTax, cess: rounded - baseTax };
}

/**
 * UPI deep link for the e-Pay Tax collect request.
 *
 * SYNTHETIC. The payee address below is the one the department publishes for
 * e-Pay Tax, but nothing here initiates a real collect request — the QR is
 * rendered so the flow is legible, and "Simulate Payment Success" is what
 * actually advances the state.
 */
export function upiDeepLink(amount: number, challanRef: string): string {
  const params = new URLSearchParams({
    pa: "epaytax.cbdt@sbi",
    pn: "Income Tax Department",
    am: String(Math.round(amount)),
    cu: "INR",
    tn: `SelfAssessmentTax-AY${ASSESSMENT_YEAR.replace("-", "")}-${challanRef}`,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * A deterministic 7-digit BSR code and 5-digit challan serial.
 *
 * SYNTHETIC, and shaped only so the fields are the right length for the return
 * form. Derived from a caller-supplied seed rather than Math.random() so the
 * same payment is reproducible in a test and does not change under a re-render.
 */
export function syntheticChallanIdentifiers(seed: number): {
  bsrCode: string;
  challanNo: string;
} {
  // A real BSR code identifies the collecting branch; these are drawn from a
  // fixed synthetic band that does not collide with any live bank's range.
  const bsr = 6_000_000 + (Math.abs(Math.trunc(seed)) % 1_000_000);
  const serial = 10_000 + (Math.abs(Math.trunc(seed / 7)) % 90_000);
  return { bsrCode: String(bsr), challanNo: String(serial) };
}

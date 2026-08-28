/**
 * One source of mock truth for the tester autofill.
 *
 * Every hard-coded value a MockFill button writes lives here, so the persona stays internally
 * consistent: the PAN belongs to the name, the monthly salary divides into the annual one, and
 * the figures match the ones used throughout docs/design-directions.
 *
 * All synthetic. No real PAN, Aadhaar, bank account, or contact detail belongs in this file.
 */

export const MOCK = {
  // ── identity ──────────────────────────────────────────────────────────────
  fullName: "Priya Sharma",
  pan: "ABCDE1234F",
  dateOfBirth: "1994-03-17",
  gender: "female",
  fatherName: "Rajesh Sharma",
  residentialStatus: "resident",

  // ── contact ───────────────────────────────────────────────────────────────
  mobile: "9876543210",
  email: "priya.sharma@example.com",
  address: "14, Nandi Durga Road, Benson Town",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560046",

  // ── credentials (mock only — never a real secret) ──────────────────────────
  password: "TestPass@2026",
  otp: "123456",
  personalisedMessage: "Green door, third floor",

  // ── employment and income (paise-consistent with the design directions) ────
  landlordName: "S. Venkatesh",
  landlordPan: "AAFPV5678K",
  employerName: "Meridian Systems Pvt Ltd",
  employerTan: "BLRM09321F",
  annualSalary: 1_240_000,
  monthlySalary: 103_333,
  consultingIncome: 0,
  businessIncome: 0,
  otherIncome: 0,
  savingsInterest: 3_480,
  tdsDeducted: 97_920,

  // ── deductions ────────────────────────────────────────────────────────────
  section80C: 150_000,
  section80D: 25_000,
  homeLoanInterest: 0,
  hraClaimed: 0,

  // ── bank (for the refund) ─────────────────────────────────────────────────
  bankAccount: "50100234567890",
  ifsc: "HDFC0000123",
  bankName: "HDFC Bank",

  // ── free text ─────────────────────────────────────────────────────────────
  disputeReason: "The account was closed in August, so this interest is overstated.",
  note: "Filed using mock data for testing.",
} as const;

export type MockKey = keyof typeof MOCK;

/**
 * The autofill affordance is a testing tool. It defaults on because this is a mock site, but
 * setting NEXT_PUBLIC_MOCK_MODE="false" removes it everywhere — an autofill button reaching a
 * real deployment would be a defect, not a feature.
 */
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== "false";

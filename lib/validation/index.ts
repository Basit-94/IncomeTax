/**
 * Identifier validation (plan §3.7). Shape and checksum only; a prototype has no register
 * to look anything up in. Results carry an issue *code*, never a message, so the copy can
 * stay with the dictionary and the plain-language rule ("say what would be right").
 *
 * `masked` is what may be shown or sent to the model afterwards (plan D10, §4.3).
 */

export type IdentifierFormat =
  | "pan"
  | "aadhaar"
  | "vid"
  | "tan"
  | "ifsc"
  | "bank_account"
  | "mobile"
  | "email"
  | "pin"
  | "uan"
  | "gstin"
  | "din"
  | "ack"
  | "bsr"
  | "challan_serial";

export type ValidationIssue =
  | { kind: "incomplete"; length: number; expected: number }
  | { kind: "shape" }
  | { kind: "checksum" }
  | { kind: "not_individual" }
  | { kind: "range" };

export type ValidationResult =
  | { ok: true; value: string; masked: string; warning?: "surname_initial" }
  | { ok: false; issue: ValidationIssue };

function clean(raw: string): string {
  return raw.replace(/[\s-]+/g, "").toUpperCase();
}

/* ---------------------------------------------------------------- Verhoeff -- */

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** True when the digit string (with its check digit last) passes Verhoeff. */
export function verhoeffValid(digits: string): boolean {
  if (!/^[0-9]+$/.test(digits)) return false;
  let c = 0;
  const reversed = digits.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = D[c][P[i % 8][Number(reversed[i])]];
  }
  return c === 0;
}

/** Append the Verhoeff check digit to a digit string (used by tests and demo data). */
export function verhoeffCheckDigit(digits: string): string {
  let c = 0;
  const reversed = digits.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = D[c][P[(i + 1) % 8][Number(reversed[i])]];
  }
  return String(INV[c]);
}

/* -------------------------------------------------------------------- GSTIN -- */

const B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function gstinChecksumValid(gstin: string): boolean {
  if (gstin.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const code = B36.indexOf(gstin[i]);
    if (code < 0) return false;
    const product = code * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  const check = (36 - (sum % 36)) % 36;
  return B36[check] === gstin[14];
}

/* --------------------------------------------------------------- the rules -- */

const PAN_SHAPE = /^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/;
const TAN_SHAPE = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const IFSC_SHAPE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function digits(raw: string, expected: number, first?: RegExp): ValidationResult | null {
  const value = raw.replace(/[\s-]+/g, "");
  if (!/^[0-9]*$/.test(value)) return { ok: false, issue: { kind: "shape" } };
  if (value.length < expected) return { ok: false, issue: { kind: "incomplete", length: value.length, expected } };
  if (value.length > expected) return { ok: false, issue: { kind: "shape" } };
  if (first && !first.test(value[0])) return { ok: false, issue: { kind: "shape" } };
  return null;
}

export function validatePan(raw: string, opts: { individual?: boolean; surname?: string } = {}): ValidationResult {
  const value = clean(raw);
  if (value.length < 10) return { ok: false, issue: { kind: "incomplete", length: value.length, expected: 10 } };
  if (!PAN_SHAPE.test(value)) return { ok: false, issue: { kind: "shape" } };
  if (opts.individual !== false && value[3] !== "P") return { ok: false, issue: { kind: "not_individual" } };
  const initial = opts.surname?.trim().charAt(0).toUpperCase();
  const warning = initial && value[4] !== initial ? ("surname_initial" as const) : undefined;
  return { ok: true, value, masked: `${value.slice(0, 2)}XXXXXX${value.slice(8)}`, ...(warning ? { warning } : {}) };
}

export function validateAadhaar(raw: string): ValidationResult {
  const early = digits(raw, 12, /[2-9]/);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  if (!verhoeffValid(value)) return { ok: false, issue: { kind: "checksum" } };
  return { ok: true, value, masked: `XXXX XXXX ${value.slice(8)}` };
}

export function validateVid(raw: string): ValidationResult {
  const early = digits(raw, 16, /[2-9]/);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  if (!verhoeffValid(value)) return { ok: false, issue: { kind: "checksum" } };
  return { ok: true, value, masked: `XXXX XXXX XXXX ${value.slice(12)}` };
}

export function validateTan(raw: string): ValidationResult {
  const value = clean(raw);
  if (value.length < 10) return { ok: false, issue: { kind: "incomplete", length: value.length, expected: 10 } };
  if (!TAN_SHAPE.test(value)) return { ok: false, issue: { kind: "shape" } };
  return { ok: true, value, masked: `${value.slice(0, 4)}XXXXX${value.slice(9)}` };
}

export function validateIfsc(raw: string): ValidationResult {
  const value = clean(raw);
  if (value.length < 11) return { ok: false, issue: { kind: "incomplete", length: value.length, expected: 11 } };
  if (!IFSC_SHAPE.test(value)) return { ok: false, issue: { kind: "shape" } };
  return { ok: true, value, masked: value };
}

export function validateBankAccount(raw: string): ValidationResult {
  const value = raw.replace(/[\s-]+/g, "");
  if (!/^[0-9]*$/.test(value)) return { ok: false, issue: { kind: "shape" } };
  if (value.length < 9) return { ok: false, issue: { kind: "incomplete", length: value.length, expected: 9 } };
  if (value.length > 18) return { ok: false, issue: { kind: "shape" } };
  return { ok: true, value, masked: `${"X".repeat(value.length - 4)}${value.slice(-4)}` };
}

export function validateMobile(raw: string): ValidationResult {
  const stripped = raw.replace(/[\s-]+/g, "").replace(/^\+91|^0/, "");
  const early = digits(stripped, 10, /[6-9]/);
  if (early) return early;
  return { ok: true, value: stripped, masked: `XXXXXX${stripped.slice(6)}` };
}

export function validateEmail(raw: string): ValidationResult {
  const value = raw.trim().toLowerCase();
  if (!EMAIL_SHAPE.test(value)) return { ok: false, issue: { kind: "shape" } };
  const [local, domain] = value.split("@");
  return { ok: true, value, masked: `${local.slice(0, 2)}…@${domain}` };
}

export function validatePin(raw: string): ValidationResult {
  const early = digits(raw, 6, /[1-9]/);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  return { ok: true, value, masked: value };
}

export function validateUan(raw: string): ValidationResult {
  const early = digits(raw, 12);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  return { ok: true, value, masked: `XXXXXXXX${value.slice(8)}` };
}

export function validateGstin(raw: string): ValidationResult {
  const value = clean(raw);
  if (value.length < 15) return { ok: false, issue: { kind: "incomplete", length: value.length, expected: 15 } };
  if (!GSTIN_SHAPE.test(value)) return { ok: false, issue: { kind: "shape" } };
  const state = Number(value.slice(0, 2));
  if (state < 1 || state > 38) return { ok: false, issue: { kind: "range" } };
  const pan = validatePan(value.slice(2, 12), { individual: false });
  if (!pan.ok) return { ok: false, issue: { kind: "shape" } };
  if (!gstinChecksumValid(value)) return { ok: false, issue: { kind: "checksum" } };
  return { ok: true, value, masked: `${value.slice(0, 2)}XXXXXXXXXX${value.slice(12)}` };
}

export function validateDin(raw: string): ValidationResult {
  const value = clean(raw);
  if (value.length < 20) return { ok: false, issue: { kind: "incomplete", length: value.length, expected: 20 } };
  if (!/^[A-Z0-9]{20}$/.test(value)) return { ok: false, issue: { kind: "shape" } };
  return { ok: true, value, masked: value };
}

export function validateAck(raw: string): ValidationResult {
  const early = digits(raw, 15);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  return { ok: true, value, masked: value };
}

export function validateBsr(raw: string): ValidationResult {
  const early = digits(raw, 7);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  return { ok: true, value, masked: value };
}

export function validateChallanSerial(raw: string): ValidationResult {
  const early = digits(raw, 5);
  if (early) return early;
  const value = raw.replace(/[\s-]+/g, "");
  return { ok: true, value, masked: value };
}

export function validateIdentifier(format: IdentifierFormat, raw: string): ValidationResult {
  switch (format) {
    case "pan":
      return validatePan(raw);
    case "aadhaar":
      return validateAadhaar(raw);
    case "vid":
      return validateVid(raw);
    case "tan":
      return validateTan(raw);
    case "ifsc":
      return validateIfsc(raw);
    case "bank_account":
      return validateBankAccount(raw);
    case "mobile":
      return validateMobile(raw);
    case "email":
      return validateEmail(raw);
    case "pin":
      return validatePin(raw);
    case "uan":
      return validateUan(raw);
    case "gstin":
      return validateGstin(raw);
    case "din":
      return validateDin(raw);
    case "ack":
      return validateAck(raw);
    case "bsr":
      return validateBsr(raw);
    case "challan_serial":
      return validateChallanSerial(raw);
  }
}

/** Whole rupees, non-negative, below a thousand crore. */
export function validateMoney(raw: string | number, opts: { min?: number; max?: number } = {}): { ok: true; value: number } | { ok: false; issue: ValidationIssue } {
  const text = typeof raw === "number" ? String(raw) : raw.replace(/[₹,\s]/g, "");
  if (!/^[0-9]+$/.test(text)) return { ok: false, issue: { kind: "shape" } };
  const value = Number(text);
  const min = opts.min ?? 0;
  const max = opts.max ?? 10_000_000_000;
  if (value < min || value > max) return { ok: false, issue: { kind: "range" } };
  return { ok: true, value };
}

/** Age 18–120 for a filer, ISO date in. */
export function validateDob(raw: string, today = new Date()): { ok: true; value: string; age: number } | { ok: false; issue: ValidationIssue } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, issue: { kind: "shape" } };
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return { ok: false, issue: { kind: "shape" } };
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  if (age < 18 || age > 120) return { ok: false, issue: { kind: "range" } };
  return { ok: true, value: raw, age };
}

/** Plain-language issue copy, English. Localised through localize() at the call site. */
export function issueText(format: IdentifierFormat | "money" | "dob", issue: ValidationIssue): string {
  const names: Record<string, string> = {
    pan: "PAN",
    aadhaar: "Aadhaar number",
    vid: "Virtual ID",
    tan: "TAN",
    ifsc: "IFSC code",
    bank_account: "account number",
    mobile: "mobile number",
    email: "email address",
    pin: "PIN code",
    uan: "UAN",
    gstin: "GSTIN",
    din: "document number (DIN)",
    ack: "acknowledgement number",
    bsr: "BSR code",
    challan_serial: "challan serial",
    money: "amount",
    dob: "date of birth",
  };
  const name = names[format] ?? format;
  switch (issue.kind) {
    case "incomplete":
      return `Keep going: a ${name} has ${issue.expected} characters and this has ${issue.length}.`;
    case "shape":
      return format === "pan"
        ? "A PAN looks like AAAPL1234C: five letters, four digits, one letter."
        : format === "aadhaar"
          ? "An Aadhaar number is 12 digits and never starts with 0 or 1."
          : format === "ifsc"
            ? "An IFSC looks like SBIN0001234: four letters, a zero, six characters."
            : `That does not look like a ${name}. Check for a typo.`;
    case "checksum":
      return `That ${name} does not check out; one digit may be off.`;
    case "not_individual":
      return "The fourth letter of a person's PAN is P. This looks like a company or firm PAN.";
    case "range":
      return format === "dob" ? "The filer must be between 18 and 120 years old." : `That ${name} is outside the range we can accept.`;
  }
}

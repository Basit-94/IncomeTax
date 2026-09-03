import { describe, expect, it } from "vitest";
import {
  gstinChecksumValid,
  issueText,
  validateAadhaar,
  validateBankAccount,
  validateDob,
  validateEmail,
  validateGstin,
  validateIdentifier,
  validateIfsc,
  validateMobile,
  validateMoney,
  validatePan,
  validatePin,
  validateTan,
  verhoeffCheckDigit,
  verhoeffValid,
} from "../index";

describe("validation", () => {
  it("PAN: shape, holder type, surname initial, masking", () => {
    expect(validatePan("demps4417k")).toMatchObject({ ok: true, value: "DEMPS4417K", masked: "DEXXXXXX7K" });
    expect(validatePan("DEMP")).toEqual({ ok: false, issue: { kind: "incomplete", length: 4, expected: 10 } });
    expect(validatePan("DEMP54417K")).toEqual({ ok: false, issue: { kind: "shape" } });
    // 4th letter C = company: refused for an individual, accepted for a firm/company context.
    expect(validatePan("AAACS1234A")).toEqual({ ok: false, issue: { kind: "not_individual" } });
    expect(validatePan("AAACS1234A", { individual: false }).ok).toBe(true);
    expect(validatePan("DEMPS4417K", { surname: "Sharma" })).not.toHaveProperty("warning");
    expect(validatePan("DEMPS4417K", { surname: "Kumar" })).toMatchObject({ ok: true, warning: "surname_initial" });
  });

  it("Aadhaar: Verhoeff checksum, first digit, masking", () => {
    const base = "23456789012";
    const good = base + verhoeffCheckDigit(base);
    expect(verhoeffValid(good)).toBe(true);
    expect(validateAadhaar(good.replace(/(\d{4})(?=\d)/g, "$1 "))).toMatchObject({ ok: true, value: good, masked: `XXXX XXXX ${good.slice(8)}` });
    const bad = good.slice(0, 11) + String((Number(good[11]) + 1) % 10);
    expect(validateAadhaar(bad)).toEqual({ ok: false, issue: { kind: "checksum" } });
    expect(validateAadhaar("1" + good.slice(1))).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateAadhaar("2345")).toEqual({ ok: false, issue: { kind: "incomplete", length: 4, expected: 12 } });
    // A known-good published test vector for Verhoeff: 236 → check digit 3.
    expect(verhoeffCheckDigit("236")).toBe("3");
    expect(verhoeffValid("2363")).toBe(true);
  });

  it("TAN, IFSC, bank account, mobile, email, PIN", () => {
    expect(validateTan("dela12345b")).toMatchObject({ ok: true, value: "DELA12345B" });
    expect(validateTan("DEL12345BB")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateIfsc("sbin0001234")).toMatchObject({ ok: true, value: "SBIN0001234" });
    expect(validateIfsc("SBIN1001234")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateBankAccount("1234 5678 9012")).toMatchObject({ ok: true, masked: "XXXXXXXX9012" });
    expect(validateBankAccount("12345678")).toEqual({ ok: false, issue: { kind: "incomplete", length: 8, expected: 9 } });
    expect(validateMobile("+91 98765 43210")).toMatchObject({ ok: true, value: "9876543210", masked: "XXXXXX3210" });
    expect(validateMobile("5876543210")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateEmail("Sunita@Example.in")).toMatchObject({ ok: true, value: "sunita@example.in", masked: "su…@example.in" });
    expect(validateEmail("nope")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validatePin("110016")).toMatchObject({ ok: true });
    expect(validatePin("010016")).toEqual({ ok: false, issue: { kind: "shape" } });
  });

  it("GSTIN: shape, state, embedded PAN, mod-36 checksum", () => {
    // A real, publicly listed GSTIN whose check character is V.
    expect(gstinChecksumValid("27AAPFU0939F1ZV")).toBe(true);
    expect(validateGstin("27aapfu0939f1zv")).toMatchObject({ ok: true, value: "27AAPFU0939F1ZV" });
    expect(validateGstin("27AAPFU0939F1ZW")).toEqual({ ok: false, issue: { kind: "checksum" } });
    // The portal's *format* specimen embeds a PAN whose 4th letter (D) is not a holder type.
    expect(validateGstin("29ABCDE1234F1Z5")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateGstin("99AAPFU0939F1ZV")).toEqual({ ok: false, issue: { kind: "range" } });
    expect(validateGstin("27AAPFU0939F1YV")).toEqual({ ok: false, issue: { kind: "shape" } });
  });

  it("money and date of birth", () => {
    expect(validateMoney("₹14,00,000")).toEqual({ ok: true, value: 1400000 });
    expect(validateMoney("-5")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateMoney("12.5")).toEqual({ ok: false, issue: { kind: "shape" } });
    expect(validateMoney(5, { min: 10 })).toEqual({ ok: false, issue: { kind: "range" } });
    const today = new Date("2026-09-03T00:00:00Z");
    // The day before the thirtieth birthday is still 29.
    expect(validateDob("1996-09-04", today)).toMatchObject({ ok: true, age: 29 });
    expect(validateDob("1996-09-03", today)).toMatchObject({ ok: true, age: 30 });
    expect(validateDob("2010-01-01", today)).toEqual({ ok: false, issue: { kind: "range" } });
    expect(validateDob("2026-02-30", today)).toEqual({ ok: false, issue: { kind: "shape" } });
  });

  it("dispatches by format and phrases issues without naming forms", () => {
    expect(validateIdentifier("aadhaar", "2363").ok).toBe(false);
    expect(issueText("pan", { kind: "not_individual" })).toContain("fourth letter");
    expect(issueText("aadhaar", { kind: "checksum" })).toContain("does not check out");
    expect(issueText("ifsc", { kind: "incomplete", length: 5, expected: 11 })).toContain("11 characters");
  });
});

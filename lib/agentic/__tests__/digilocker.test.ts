import { describe, expect, it } from "vitest";
import type { Owner } from "../../server/session";
import { TDS_194A_THRESHOLD, consentItems, fetchedFacts, listIssuedDocuments, readProfile } from "../digilocker";

describe("DigiLocker mock — issued documents, clearly labelled, only ever behind consent", () => {
  it("a demo persona's locker agrees with the seeded return", () => {
    const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
    const docs = listIssuedDocuments(sunita, "2026-27");
    const f16 = docs.find((d) => d.docType === "FORM_16")!;
    expect(f16.fields.grossSalary).toBe(420000);
    expect(f16.fields.tds).toBe(8400);
    expect(f16.sample).toBe(false);
    expect(f16.title).toMatch(/FY 2025-26/);
    expect(docs.some((d) => d.docType === "ANNUAL_INFO_STATEMENT")).toBe(true);
  });

  it("issues the Part B rows and the AIS lines with the real SFT codes (2026-09-07)", () => {
    const rakesh: Owner = { pan: "DEMPK8823R", kind: "demo", displayName: "Rakesh Kumar" };
    const docs = listIssuedDocuments(rakesh, "2026-27");
    const f16 = docs.find((d) => d.docType === "FORM_16")!;
    expect(f16.fields.tan).toBeDefined();
    expect(f16.fields.professionalTax).toBe(2400);
    expect(f16.fields.employerClaims?.some((c) => /^80C|^80D/.test(c.section))).toBe(true);
    const ais = docs.find((d) => d.docType === "ANNUAL_INFO_STATEMENT")!;
    expect(ais.fields.otherIncome?.some((r) => r.kind === "interest" && r.section === "SFT-016")).toBe(true);
    expect(ais.fields.otherIncome?.some((r) => r.kind === "dividend" && r.section === "SFT-015")).toBe(true);
    expect(ais.fields.ltcg112A).toBeUndefined(); // his gains are short-term (111A): AIS reports the sale, not a 112A figure
    expect(ais.fields.tdsOther?.some((t) => t.section.includes("194A"))).toBe(true);
    expect(fetchedFacts(docs, "en").some((x) => /SFT-016/.test(x))).toBe(true);
  });

  it("any other PAN gets deterministic SAMPLE figures that say so, under the FY 2025-26 TDS thresholds", () => {
    const c: Owner = { pan: "ABCPX7788Q", kind: "citizen", displayName: "Citizen 7788" };
    const a = listIssuedDocuments(c, "2026-27");
    const b = listIssuedDocuments(c, "2026-27");
    expect(a).toEqual(b);
    const f16 = a.find((d) => d.docType === "FORM_16")!;
    expect(f16.sample).toBe(true);
    expect(f16.title).toMatch(/SAMPLE/);
    expect(f16.fields.grossSalary).toBeGreaterThanOrEqual(400000);
    expect(f16.fields.grossSalary).toBeLessThanOrEqual(4500000);
    const ais = a.find((d) => d.docType === "ANNUAL_INFO_STATEMENT")!;
    // A 194A line exists only where a deposit's interest crossed the FY 2025-26 threshold.
    const deposits = ais.fields.otherIncome?.filter((r) => r.kind === "interest" && /Deposit/.test(r.label)) ?? [];
    const over = deposits.filter((r) => r.amount > TDS_194A_THRESHOLD).length;
    expect(ais.fields.tdsOther?.filter((t) => t.section === "194A")).toHaveLength(over);
    expect(fetchedFacts(a, "en").some((x) => /SAMPLE figures/.test(x))).toBe(true);
  });

  it("the consent card lists exactly what would be fetched, with the issuer", () => {
    const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
    const items = consentItems(listIssuedDocuments(sunita, "2026-27"));
    expect(items).toHaveLength(3); // Form 16, AIS and — since 2026-09-07 — Form 26AS
    expect(items[0]).toMatch(/Form 16 .* · Chettinad Textiles Pvt Ltd/);
    expect(items[2]).toMatch(/Form 26AS/);
  });

  it("the standing record: identity, address and banks — once, for onboarding", () => {
    const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
    const p = readProfile(sunita);
    expect(p).toMatchObject({ identity: { name: "Sunita Devi", pan: "DEMPS4417K" }, sample: false });
    expect(p.identity.dob).toMatch(/^1992-\d{2}-\d{2}$/);
    expect(p.identity.aadhaarLast4).toMatch(/^\d{4}$/);
    expect(p.banks[0]).toMatchObject({ ifsc: "KAVC0001183", nominatedForRefund: true });
    const c: Owner = { pan: "ABCPX7788Q", kind: "citizen", displayName: "Citizen 7788" };
    const q = readProfile(c);
    expect(q.sample).toBe(true);
    expect(q.banks.length).toBeGreaterThanOrEqual(1);
    expect(q.identity.name.split(" ")).toHaveLength(2); // a generated first and last name (no surname starts with X, so any)
    expect(readProfile(c)).toEqual(q);
  });
});

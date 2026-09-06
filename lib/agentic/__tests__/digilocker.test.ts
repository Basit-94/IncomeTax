import { describe, expect, it } from "vitest";
import type { Owner } from "../../server/session";
import { consentItems, fetchedFacts, listIssuedDocuments } from "../digilocker";

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

  it("any other PAN gets deterministic SAMPLE figures that say so", () => {
    const c: Owner = { pan: "ABCPX7788Q", kind: "citizen", displayName: "Citizen 7788" };
    const a = listIssuedDocuments(c, "2026-27");
    const b = listIssuedDocuments(c, "2026-27");
    expect(a).toEqual(b);
    const f16 = a.find((d) => d.docType === "FORM_16")!;
    expect(f16.sample).toBe(true);
    expect(f16.title).toMatch(/SAMPLE/);
    expect(f16.fields.grossSalary).toBeGreaterThanOrEqual(500000);
    expect(f16.fields.grossSalary).toBeLessThan(1500000);
    expect(fetchedFacts(a, "en").some((x) => /SAMPLE figures/.test(x))).toBe(true);
  });

  it("the consent card lists exactly what would be fetched, with the issuer", () => {
    const sunita: Owner = { pan: "DEMPS4417K", kind: "demo", displayName: "Sunita Devi" };
    const items = consentItems(listIssuedDocuments(sunita, "2026-27"));
    expect(items).toHaveLength(2);
    expect(items[0]).toMatch(/Form 16 .* · Chettinad Textiles Pvt Ltd/);
  });
});

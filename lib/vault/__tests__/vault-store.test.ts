import { describe, expect, it, beforeEach } from "vitest";
import { addDocumentToVault, createVaultUserFromPan, getSeededVaultForPersona } from "../vault-store";
import { PERSONAS } from "../../personas";

describe("VaultStore — document field persistence and non-zero guarantees", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("persists extracted fields to vault document and updates user stats", async () => {
    const pan = "BMZPM4821K";
    const user = await addDocumentToVault(pan, {
      title: "Form 16 - Arjun Mehta.pdf",
      docType: "FORM_16",
      issuer: "TATA CONSULTANCY SERVICES LTD",
      sizeKb: 140,
      fields: {
        pan,
        name: "ARJUN MEHTA",
        employerName: "TATA CONSULTANCY SERVICES LTD",
        grossSalary: 1850000,
        tds: 165000,
      },
    });

    expect(user.fullName).toBe("ARJUN MEHTA");
    expect(user.stats?.salary).toBe(1850000);
    expect(user.stats?.tdsPaid).toBe(165000);

    const doc = user.documents.find((d) => d.title.includes("Arjun"));
    expect(doc).toBeDefined();
    expect(doc?.fields?.grossSalary).toBe(1850000);
    expect(doc?.fields?.tds).toBe(165000);
  });

  it("provides non-zero safe fallbacks for seeded personas", () => {
    const sunita = getSeededVaultForPersona(PERSONAS.sunita);
    expect(sunita.stats?.salary).toBeGreaterThan(0);
    expect(sunita.stats?.tdsPaid).toBeGreaterThan(0);

    const priya = getSeededVaultForPersona(PERSONAS.priya);
    expect(priya.stats?.salary).toBeGreaterThan(0);
    expect(priya.stats?.tdsPaid).toBeGreaterThan(0);
  });
});

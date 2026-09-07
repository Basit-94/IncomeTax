import { describe, expect, it } from "vitest";
import { compareRegimes } from "../../engine/tax";
import { PERSONAS } from "../../personas";
import { taxInputFor } from "../../return/compute";
import type { Persona } from "../../types";
import { scanOpportunities } from "../opportunities";

const twelveLakh: Persona = {
  ...PERSONAS.sunita,
  facts: [{ id: "sal", kind: "salary", label: "Salary", amount: 1_200_000, provenance: { reporter: "Acme", reporterKind: "employer", filedOn: "2026-05-15", statement: "26AS", onlyReporterCanFix: true } }],
  taxPaid: [],
  claims: [],
};

describe("opportunities — what the person could still avail, priced by the engine (2026-09-07)", () => {
  it("every saving is the engine's own difference, measured against the cheaper regime as things stand", () => {
    const scan = scanOpportunities(twelveLakh, { regime: "new" });
    const asIs = compareRegimes(taxInputFor(twelveLakh, "new"));
    expect(scan.asIs.new).toBe(asIs.new.totalTax);
    expect(scan.asIs.old).toBe(asIs.old.totalTax);
    const c80 = scan.items.find((i) => i.id === "80C")!;
    expect(c80.amount).toBe(150_000);
    const withClaim = compareRegimes(taxInputFor({ ...twelveLakh, claims: [{ id: "x", section: "80C", label: "80C", amount: 150_000, evidenceAttached: false }] }, "new"));
    expect(c80.saving).toBe(Math.max(0, Math.min(asIs.new.totalTax, asIs.old.totalTax) - Math.min(withClaim.new.totalTax, withClaim.old.totalTax)));
  });

  it("separates what can be claimed now from what only the employer can restructure next year", () => {
    const scan = scanOpportunities(twelveLakh, { regime: "new" });
    const lanes = Object.fromEntries(scan.items.map((i) => [i.id, i.lane]));
    expect(lanes["80C"]).toBe("claim_now");
    expect(lanes["80CCD_1B"]).toBe("claim_now");
    expect(lanes["80CCD_2"]).toBe("next_year");
    expect(lanes["meal"]).toBe("next_year");
    expect(scan.items.find((i) => i.id === "meal")!.amount).toBe(26_400);
    expect(scan.items.find((i) => i.id === "meal")!.needs).toMatch(/cannot be relabelled/);
    // Housing unknown and no HRA on the Form 16: a question, not a figure.
    expect(lanes["housing"]).toBe("check");
  });

  it("a small salaried return with nothing to gain lists no false savings", () => {
    const scan = scanOpportunities(PERSONAS.sunita, { regime: "new" });
    expect(scan.asIs.cheaper).toBe("new");
    for (const i of scan.items.filter((x) => x.lane === "claim_now")) expect(i.saving).toBe(0);
    expect(scan.items.some((i) => i.id === "regime")).toBe(false);
    expect(scan.items.find((i) => i.id === "80TTA")?.amount).toBe(1240); // capped at the interest on record
  });

  it("names the regime switch when the ledger is on the dearer one", () => {
    const oldWins: Persona = { ...twelveLakh, claims: [{ id: "c", section: "80C", label: "80C", amount: 150_000, evidenceAttached: true }, { id: "d", section: "24B", label: "24(b)", amount: 200_000, evidenceAttached: true }, { id: "e", section: "80D_SELF", label: "80D", amount: 25_000, evidenceAttached: true }] };
    const both = compareRegimes(taxInputFor(oldWins, "new"));
    const scan = scanOpportunities(oldWins, { regime: "new" });
    if (both.old.totalTax < both.new.totalTax) {
      expect(scan.items[0].id).toBe("regime");
      expect(scan.items[0].saving).toBe(both.new.totalTax - both.old.totalTax);
    } else {
      expect(scan.items.some((i) => i.id === "regime")).toBe(false);
    }
  });
});

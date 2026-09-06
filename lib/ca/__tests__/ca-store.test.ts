import { describe, it, expect, beforeEach } from "vitest";
import {
  generateReviewCode,
  hashPin,
  createReviewRecord,
  verifyPin,
  submitCAReview,
  acceptCAReview,
  loadLocalReviews,
  saveLocalReviews,
  createDemoReview,
} from "../ca-store";
import { PERSONAS } from "../../personas";
import { computeForPersona } from "../../return/compute";

describe("Wapsi CA Review Store & Workflow", () => {
  beforeEach(() => {
    saveLocalReviews({});
  });

  it("generates a valid formatted CA access code", () => {
    const code = generateReviewCode();
    expect(code).toMatch(/^CA-\d{4}-\d{2}$/);
  });

  it("hashes and securely verifies secret PINs", async () => {
    const pin = "4826";
    const hash = await hashPin(pin);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe("string");

    const record = await createReviewRecord({
      pin,
      citizenPan: "DEMP00001A",
      citizenName: "Sunita Rao",
      originalPersona: PERSONAS.sunita,
      originalRegime: "new",
    });

    expect(await verifyPin(record, "4826")).toBe(true);
    expect(await verifyPin(record, "0000")).toBe(false);
  });

  it("creates a pending review record and stores it", async () => {
    const record = await createReviewRecord({
      pin: "1234",
      citizenPan: "DEMP00001A",
      citizenName: "Sunita Rao",
      originalPersona: PERSONAS.sunita,
      originalRegime: "new",
    });

    expect(record.status).toBe("pending");
    expect(record.code).toMatch(/^CA-/);
    expect(record.originalPersona.pan).toBe(PERSONAS.sunita.pan);

    const local = loadLocalReviews();
    expect(local[record.code]).toBeDefined();
    expect(local[record.code].citizenName).toBe("Sunita Rao");
  });

  it("allows CA to submit audit adjustments with remarks and updates status to reviewed", async () => {
    const record = await createReviewRecord({
      pin: "9999",
      citizenPan: "DEMP00001A",
      citizenName: "Sunita Rao",
      originalPersona: PERSONAS.sunita,
      originalRegime: "new",
    });

    // CA adds 80CCD(1B) NPS claim and reconciles TDS credit from 26AS
    const caPersona = JSON.parse(JSON.stringify(PERSONAS.sunita));
    caPersona.taxPaid[0].amount += 15000;
    caPersona.claims.push({
      id: "claim_ca_nps",
      section: "80CCD_1B",
      amount: 50000,
      label: "Section 80CCD(1B) NPS",
      evidenceAttached: true,
    });

    const reviewed = await submitCAReview({
      code: record.code,
      caPersona,
      caRegime: "old",
      caNotes: "Claimed NPS 50k and switched to Old Regime.",
      caDetails: {
        name: "CA Rajesh Sharma, FCA",
        membershipNo: "084920",
        firmName: "Sharma & Co.",
      },
    });

    expect(reviewed).not.toBeNull();
    expect(reviewed!.status).toBe("reviewed");
    expect(reviewed!.caRegime).toBe("old");
    expect(reviewed!.caDetails?.name).toBe("CA Rajesh Sharma, FCA");
    expect(reviewed!.reviewedAt).toBeDefined();

    // Tax delta verification
    const origB = computeForPersona(reviewed!.originalPersona, reviewed!.originalRegime);
    const caB = computeForPersona(reviewed!.caPersona!, reviewed!.caRegime!);
    expect(caB.refundOrDue).toBeGreaterThan(origB.refundOrDue);
  });

  it("allows citizen to accept CA review", async () => {
    const record = await createReviewRecord({
      pin: "1111",
      citizenPan: "DEMP00001A",
      citizenName: "Sunita Rao",
      originalPersona: PERSONAS.sunita,
      originalRegime: "new",
    });

    const accepted = await acceptCAReview(record.code);
    expect(accepted).not.toBeNull();
    expect(accepted!.status).toBe("accepted");
  });

  it("creates instant demo review with Sunita Rao", async () => {
    const demo = await createDemoReview(PERSONAS.sunita);
    expect(demo.code).toBe("CA-DEMO-26");
    expect(demo.status).toBe("reviewed");
    expect(demo.caDetails?.name).toContain("Rajesh Sharma");
    expect(await verifyPin(demo, "1234")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { generateItrvPdf } from "../itrvPdf";

describe("generateItrvPdf", () => {
  it("generates a valid, parseable PDF 1.4 byte buffer for Priya Sharma", () => {
    const pdfBytes = generateItrvPdf({
      assesseeName: "Priya Sharma",
      pan: "ABCDE1234F",
      status: "Individual",
      filingSection: "139(1) - On or before due date",
      assessmentYear: "2026-27",
      financialYear: "2025-26",
      ackNumber: "SIM-13F65E7CE2",
      regime: "NEW",
      grossTotalIncome: 1450000,
      standardDeduction: 75000,
      chapterViaDeductions: 0,
      taxableIncome: 1375000,
      taxBeforeRebate: 86250,
      rebate87A: 0,
      cess: 3450,
      totalTaxLiability: 89700,
      tdsPaid: 85000,
      netPayableOrRefund: 4700,
      sha256Hash: "13f65e7ce29ba04df8c17b5f2ad37e90e719bf3e4b78c2e61a09d1847190c538",
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    const pdfString = new TextDecoder().decode(pdfBytes);
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("FORM ITR-V \\(ACKNOWLEDGEMENT\\)");
    expect(pdfString).toContain("PRIYA SHARMA");
    expect(pdfString).toContain("ABCDE1234F");
    expect(pdfString).toContain("SIM-13F65E7CE2");
    expect(pdfString).toContain("Rs. 13,75,000");
    expect(pdfString).toContain("Rs. 4,700");
    expect(pdfString).toContain("%%EOF");
  });
});

import { describe, expect, it } from "vitest";
import { extractFieldsFromPdfBytes, extractRichFieldsFromText } from "../pdfExtract";

// The text layer of the 2026-09-07 mock Form 16 (as printed from HTML), lightly abridged.
const MOCK_FORM16 = `FORM NO. 16
Certificate u/s 203 of the Income-tax Act, 1961 for Tax Deducted at Source on Salary
PART A - CERTIFICATE DETAILS
Name: WIPRO ENTERPRISES LTD TAN: BLRW01928A
Name: ANTHONY D'SOUZA PAN: ABCPD1982K
PART B - SALARY & DEDUCTIONS AMOUNT (₹)
1. Gross Salary u/s 17(1) 16,20,000
2. Deductions u/s 16
(a) Standard Deduction u/s 16(ia) 75,000
(b) Professional Tax u/s 16(iii) 2,400
4. Chapter VI-A Deductions
(a) Employer NPS u/s 80CCD(2) 50,000
6. Total Tax Deducted at Source (TDS) 1,24,000`;

// Real Part B labels, as the TRACES form prints them.
const REAL_PART_B = `Name of the Employee: Kavya Desai PAN of the Employee: ABCPD1982K
TAN of the Deductor: MUMT12345A
Whether opting out of taxation u/s 115BAC(1A)? Yes
1. Gross Salary
(a) Salary as per provisions contained in section 17(1) Rs. 12,40,000
(b) Value of perquisites u/s 17(2) Rs. 18,000
(c) Profits in lieu of salary u/s 17(3) Rs. 0
2. Less: Allowances to the extent exempt u/s 10
(a) Travel concession or assistance u/s 10(5) Rs. 24,000
(e) House rent allowance u/s 10(13A) Rs. 1,80,000
4. Less: Deductions u/s 16
(c) Tax on employment u/s 16(iii) Rs. 2,500
10. Deductions under Chapter VI-A
(a) Deduction in respect of life insurance premia, contributions to provident fund etc. u/s 80C Rs. 1,50,000
(e) Deduction in respect of contribution by taxpayer to pension scheme u/s 80CCD(1B) Rs. 50,000
(f) Deduction in respect of contribution by Employer to pension scheme u/s 80CCD(2) Rs. 60,000
(g) Deduction in respect of health insurance premia u/s 80D Rs. 25,000
Total Tax Deducted 1,05,000`;

const MOCK_AIS = `Income Tax Department - Annual Information Statement (AIS / TIS)
PART A - Taxpayer Information
PAN: ABCPD1982K Name: ANTHONY D'SOUZA DOB: 22/11/1988
Taxpayer Information Summary (TIS)
Salary (TDS-192) 16,20,000 16,20,000 Income from Salaries
Savings Bank Interest (SFT-005) 18,200 18,200 Income from Other Sources
Time Deposit Interest (TDS-194A) 35,000 35,000 Income from Other Sources
Dividend Income (DIV-001) 6,500 6,500 Income from Other Sources
Sec 112A LTCG (SFT-017) 42,000 42,000 Schedule 112A (Nil Tax)
PART B - AIS Line Transactions
TDS-192 Wipro Enterprises Ltd TAN: BLRW01928A 16,20,000 1,24,000
SFT-005 ICICI Bank Ltd SB-0021019281 18,200 0
TDS-194A ICICI Bank Ltd FD-9018274192 35,000 3,500
DIV-001 Infosys Ltd DP-IN301128 6,500 650
SFT-017 Zerodha Broking Ltd UCC-ANT891 42,000 0`;

describe("Phase B — the Form 16 Part B rows and the AIS lines (2026-09-07)", () => {
  it("reads the mock Form 16's TAN, professional tax and employer NPS beside salary and TDS", () => {
    const f = extractFieldsFromPdfBytes(new TextEncoder().encode(MOCK_FORM16));
    expect(f.pan).toBe("ABCPD1982K");
    expect(f.name).toBe("ANTHONY D'SOUZA");
    expect(f.grossSalary).toBe(1_620_000);
    expect(f.tds).toBe(124_000);
    expect(f.tan).toBe("BLRW01928A");
    expect(f.professionalTax).toBe(2_400);
    expect(f.employerClaims).toEqual([{ section: "80CCD_2", amount: 50_000 }]);
    expect(f.readFields).toEqual(expect.arrayContaining(["tan", "professionalTax", "employerClaims"]));
  });

  it("reads the real Part B labels: 17(1)/(2), exemptions u/s 10, Chapter VI-A by section, the 115BAC opt-out", () => {
    const r = extractRichFieldsFromText(REAL_PART_B);
    expect(r.tan).toBe("MUMT12345A");
    expect(r.salaryParts).toEqual({ s17_1: 1_240_000, s17_2: 18_000, s17_3: undefined });
    expect(r.exemptAllowances).toEqual(expect.arrayContaining([{ section: "10(13A)", amount: 180_000 }, { section: "10(5)", amount: 24_000 }]));
    expect(r.professionalTax).toBe(2_500);
    expect(r.employerClaims).toEqual(expect.arrayContaining([
      { section: "80C", amount: 150_000 },
      { section: "80CCD_1B", amount: 50_000 },
      { section: "80CCD_2", amount: 60_000 },
      { section: "80D_SELF", amount: 25_000 },
    ]));
    expect(r.employerClaims?.some((c) => c.section === "80CCC")).toBe(false); // 80C must not also read as 80CCC
    expect(r.regimeOptOut).toBe(true);
  });

  it("reads the AIS lines with their reporters, the TDS beside them, and the 112A gain; the mock's codes map to the real SFT codes", () => {
    const r = extractRichFieldsFromText(MOCK_AIS);
    expect(r.otherIncome).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "interest", reporter: "ICICI Bank Ltd", amount: 18_200, section: "SFT-016" }),
      expect.objectContaining({ kind: "interest", reporter: "ICICI Bank Ltd", amount: 35_000, section: "SFT-016" }),
      expect.objectContaining({ kind: "dividend", reporter: "Infosys Ltd", amount: 6_500, section: "SFT-015" }),
    ]));
    expect(r.tdsOther).toEqual(expect.arrayContaining([{ section: "194A", reporter: "ICICI Bank Ltd", amount: 3_500 }, { section: "194", reporter: "Infosys Ltd", amount: 650 }]));
    expect(r.ltcg112A).toMatchObject({ gain: 42_000, reporter: "Zerodha Broking Ltd" });
  });

  it("falls back to the TIS summary rows when the AIS has no line table, and reads nothing from an unrelated document", () => {
    const tisOnly = extractRichFieldsFromText("Taxpayer Information Summary\nSavings Bank Interest 12,000\nDividend Income 3,400");
    expect(tisOnly.otherIncome).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "interest", amount: 12_000, reporter: "AIS" }), expect.objectContaining({ kind: "dividend", amount: 3_400 })]));
    expect(extractRichFieldsFromText("Dear customer, your electricity bill for July is Rs. 2,340.")).toEqual({});
  });
});

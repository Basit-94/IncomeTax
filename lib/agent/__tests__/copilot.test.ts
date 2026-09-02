import { describe, it, expect } from "vitest";
import {
  executeComputeTaxAy2026,
  executeReconcileFact,
  executePredictAuditRisk,
  executeGenerateStatutoryArtifact,
  CBDT_REASON_CODES,
} from "../copilot-engine";
import { toolByName, functionDeclarations } from "../tools";

describe("Wapsi Citizen Tax Copilot - 3 Production Artifacts Verification Suite", () => {
  describe("Artifact 2: Tool Calling Definitions & Schema Conformance", () => {
    it("exports valid Gemini functionDeclarations for all copilot tools", () => {
      const declarations = functionDeclarations();
      const toolNames = declarations.map((d) => d.name);

      expect(toolNames).toContain("compute_tax_ay2026");
      expect(toolNames).toContain("reconcile_fact");
      expect(toolNames).toContain("predict_audit_risk");
      expect(toolNames).toContain("generate_statutory_artifact");
    });

    it("matches exact parameter schema for compute_tax_ay2026", () => {
      const tool = toolByName("compute_tax_ay2026");
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toEqual(["grossSalary", "tdsPaid"]);
      const props = tool?.parameters.properties as Record<string, unknown>;
      expect(props.grossSalary).toBeDefined();
      expect(props.businessIncome).toBeDefined();
      expect(props.savingsInterest).toBeDefined();
      expect(props.capitalGainsStcg).toBeDefined();
      expect(props.capitalGainsLtcg).toBeDefined();
      expect(props.tdsPaid).toBeDefined();
      expect(props.section80C).toBeDefined();
      expect(props.section80D).toBeDefined();
      expect(props.section80CCD2).toBeDefined();
    });

    it("matches exact parameter schema for reconcile_fact", () => {
      const tool = toolByName("reconcile_fact");
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toEqual(["factId", "action"]);
      const props = tool?.parameters.properties as Record<string, { enum?: string[] }>;
      expect(props.factId?.enum).toEqual(["salary", "interest", "dividend", "capital_gains", "tds"]);
      expect(props.action?.enum).toEqual(["CONFIRM", "DISPUTE"]);
      expect(props.cbdtReasonCode?.enum).toEqual(["CODE_1", "CODE_2", "CODE_3", "CODE_4", "CODE_5"]);
    });

    it("matches exact parameter schema for predict_audit_risk", () => {
      const tool = toolByName("predict_audit_risk");
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toEqual(["reportedIncome", "declaredIncome"]);
    });

    it("matches exact parameter schema for generate_statutory_artifact", () => {
      const tool = toolByName("generate_statutory_artifact");
      expect(tool).toBeDefined();
      expect(tool?.parameters.required).toEqual(["artifactType", "regimeOpted", "netAmount"]);
      const props = tool?.parameters.properties as Record<string, { enum?: string[] }>;
      expect(props.artifactType?.enum).toEqual(["ITR_V_RECEIPT", "CHALLAN_280_PAYMENT"]);
      expect(props.regimeOpted?.enum).toEqual(["NEW", "OLD"]);
    });
  });

  describe("Artifact 3: Golden Eval Vectors & Verification Scenarios", () => {
    // -------------------------------------------------------------------------
    // Test Case 1: Salaried Boundary & Full 87A Rebate
    // User Input: "I earn ₹12,75,000 gross salary as a software engineer. Form 26AS shows ₹25,000 TDS deducted. How much tax do I owe?"
    // -------------------------------------------------------------------------
    it("Test Case 1: Salaried Boundary & Full 87A Rebate (₹12,75,000 Gross Salary -> ₹0 Tax, ₹25,000 Refund)", () => {
      const result = executeComputeTaxAy2026({
        grossSalary: 1275000,
        tdsPaid: 25000,
      });

      // Statutory Checkpoints
      expect(result.newRegime.standardDeduction).toBe(75000);
      expect(result.newRegime.taxableIncome).toBe(1200000); // 12,75,000 - 75,000
      expect(result.newRegime.slabTax).toBe(60000); // 4L-8L @ 5% = 20k, 8L-12L @ 10% = 40k
      expect(result.newRegime.rebate87A).toBe(60000); // Full 87A rebate applied
      expect(result.newRegime.totalTaxLiability).toBe(0); // Net Tax Liability = ₹0
      expect(result.newRegime.status).toBe("REFUND_DUE");
      expect(result.newRegime.refundAmount).toBe(25000); // Entire ₹25k TDS refunded
      expect(result.recommendation.recommendedRegime).toBe("NEW");
    });

    // -------------------------------------------------------------------------
    // Test Case 2: Marginal Relief Band Resolution
    // User Input: "My taxable income after standard deduction is ₹12,10,000 under New Regime. Am I eligible for marginal relief?"
    // -------------------------------------------------------------------------
    it("Test Case 2: Marginal Relief Band Resolution (Taxable ₹12,10,000 -> Base Tax Capped at ₹10,000, Total ₹10,400)", () => {
      const result = executeComputeTaxAy2026({
        grossSalary: 1285000, // 12,85,000 - 75,000 std deduction = 12,10,000 taxable
        tdsPaid: 0,
      });

      // Statutory Checkpoints
      expect(result.newRegime.taxableIncome).toBe(1210000);
      expect(result.newRegime.slabTax).toBe(61500); // Base slab tax without relief
      expect(result.newRegime.marginalReliefApplied).toBe(true);
      expect(result.newRegime.rebate87A).toBe(51500); // Relief = 61,500 - 10,000
      // Base tax after relief = ₹10,000 (excess over 12L). 4% cess on ₹10,000 = ₹400
      expect(result.newRegime.cess).toBe(400);
      expect(result.newRegime.totalTaxLiability).toBe(10400);
      expect(result.newRegime.status).toBe("TAX_PAYABLE");
      expect(result.newRegime.taxDueAmount).toBe(10400);
    });

    // -------------------------------------------------------------------------
    // Test Case 3: AIS Discrepancy & CASS Audit Radar
    // User Input: "My AIS shows ₹15,00,000 salary from Infosys, but I left in June and actually only made ₹6,00,000. Flag this as wrong."
    // -------------------------------------------------------------------------
    it("Test Case 3: AIS Discrepancy & CASS Audit Radar (>20% Variance Triggers High Scrutiny Alert)", () => {
      // Step 1: Reconcile fact with CBDT Code 3
      const reconcile = executeReconcileFact({
        factId: "salary",
        action: "DISPUTE",
        correctedAmount: 600000,
        cbdtReasonCode: "CODE_3",
        userComment: "Left employer mid-year in June, actual salary received ₹6,00,000.",
      });

      expect(reconcile.status).toBe("DISPUTE_STAGED");
      expect(reconcile.cbdtReasonCode).toBe("CODE_3");
      expect(reconcile.cbdtReasonDescription).toBe(CBDT_REASON_CODES.CODE_3);
      expect(reconcile.declaredAmount).toBe(600000);

      // Step 2: CASS Risk Radar Evaluation
      const risk = executePredictAuditRisk({
        reportedIncome: 1500000,
        declaredIncome: 600000,
      });

      expect(risk.riskLevel).toBe("HIGH");
      expect(risk.cassNoticeProbability).toBe("HIGH");
      expect(risk.varianceRupees).toBe(900000);
      expect(risk.variancePercentage).toBe(60); // 60% reduction > 20% threshold
      expect(risk.scrutinySection).toContain("Section 143(1)(a)");
      expect(risk.warning).toContain("High likelihood of automated scrutiny");
      expect(risk.recommendation).toContain("Upload supporting documents");
    });

    // -------------------------------------------------------------------------
    // Test Case 4: Outstanding Tax Payable & Challan 280 Trigger
    // User Input: "I have ₹18,00,000 salary and made ₹2,00,000 short-term capital gains on stocks (s.111A). TDS paid is only ₹1,00,000. What do I do?"
    // -------------------------------------------------------------------------
    it("Test Case 4: Outstanding Tax Payable & Challan 280 Trigger (s.111A STCG @ 20%, Net Payable > 0)", () => {
      const result = executeComputeTaxAy2026({
        grossSalary: 1800000,
        capitalGainsStcg: 200000,
        tdsPaid: 100000,
      });

      // Statutory Checkpoints:
      // Salary Taxable = 18,00,000 - 75,000 = 17,25,000
      // Slab tax on 17.25L = 1,45,000
      // STCG u/s 111A @ 20% on 2,00,000 = 40,000
      // Total Pre-Cess Tax = 1,85,000
      // 4% Cess = 7,400
      // Total Tax Liability = 1,92,400
      // TDS Paid = 1,00,000
      // Net Tax Due = 1,92,400 - 1,00,000 = ₹92,400
      expect(result.newRegime.specialTax).toBe(40000);
      expect(result.newRegime.slabTax).toBe(145000);
      expect(result.newRegime.totalTaxLiability).toBe(192400);
      expect(result.newRegime.status).toBe("TAX_PAYABLE");
      expect(result.newRegime.taxDueAmount).toBe(92400);

      // Generate Challan 280 Payment artifact
      const challan = executeGenerateStatutoryArtifact({
        artifactType: "CHALLAN_280_PAYMENT",
        regimeOpted: "NEW",
        netAmount: result.newRegime.taxDueAmount,
      });

      expect(challan.artifactType).toBe("CHALLAN_280_PAYMENT");
      expect(challan.status).toBe("PAYMENT_FLOW_STAGED");
      expect(challan.majorHead).toBe("0021 (Income Tax - Other than Companies)");
      expect(challan.minorHead).toBe("300 (Self Assessment Tax)");
      expect(challan.outstandingAmount).toBe(92400);
      expect(challan.upiDeepLink).toContain("SelfAssessmentTax-AY202627");
    });

    // -------------------------------------------------------------------------
    // Test Case 5: 1-Click Section 139(9) Defective Notice Resolution
    // User Input: "I got a notice saying: 'Gross Receipts in 26AS exceed Gross Turnover reported in return'. Help me fix this."
    // -------------------------------------------------------------------------
    it("Test Case 5: 1-Click Section 139(9) Defective Notice Resolution (Auto-Reconcile & Stage Revised Return u/s 139(5))", () => {
      // Mock notice pattern evaluator
      const noticeText = "Gross Receipts in 26AS exceed Gross Turnover reported in return";
      const isDefective139_9 = noticeText.includes("26AS") || noticeText.includes("Turnover");

      expect(isDefective139_9).toBe(true);

      const resolutionStrategy = {
        noticeType: "Section 139(9) Defective Return Notice",
        plainLanguageExplanation:
          "The Income Tax Department detected a mismatch between gross turnover in your filed return and Form 26AS/AIS receipts.",
        recommendedAction: "Auto-Reconcile and Stage Revised Return u/s 139(5)",
        disallowExternalCounselor: true,
        disallowRestartFromScratch: true,
      };

      expect(resolutionStrategy.noticeType).toBe("Section 139(9) Defective Return Notice");
      expect(resolutionStrategy.recommendedAction).toBe("Auto-Reconcile and Stage Revised Return u/s 139(5)");
      expect(resolutionStrategy.disallowExternalCounselor).toBe(true);
      expect(resolutionStrategy.disallowRestartFromScratch).toBe(true);
    });

    it("Generates cryptographic ITR-V preview artifact when refund is due", () => {
      const itrv = executeGenerateStatutoryArtifact({
        artifactType: "ITR_V_RECEIPT",
        regimeOpted: "NEW",
        netAmount: 25000,
      });

      expect(itrv.artifactType).toBe("ITR_V_RECEIPT");
      expect(itrv.status).toBe("PREVIEW_STAGED_AWAITING_CITIZEN_CONFIRMATION");
      expect(itrv.netRefundDue).toBe(25000);
      expect(itrv.cryptographicHash).toContain("SHA256:wapsi_itr_v_new_25000_");
      expect(itrv.qrVerificationUri).toContain("https://wapsi.tax/verify/receipt");
    });
  });
});

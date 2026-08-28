package com.wapsi.backend.rules;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.engine.TaxEngine;
import com.wapsi.backend.engine.TaxFact;
import com.wapsi.backend.engine.TaxInput;
import com.wapsi.backend.engine.TaxResult;
import com.wapsi.backend.money.Money;

/**
 * T1.8b: the researched AY 2025-26 (FY 2024-25) rule sets — Finance (No. 2) Act, 2024 rates,
 * cross-checked against three sources cited inside the JSON itself.
 *
 * <p>The hand-computed expectation below is the whole point: the file is only trustworthy if a
 * figure derived from the published slab table on paper matches what the engine produces from it.
 */
class PriorYearRuleSetTest {
    private final RuleSetLoader loader = new RuleSetLoader(new ObjectMapper().findAndRegisterModules());
    private final TaxEngine engine = new TaxEngine();

    @Test
    void the2025NewRegimeLoadsAndDeclaresItsYearAndSources() {
        RuleSetDefinition rules = loader.load("2025-26-new");
        assertEquals("2025-26", rules.assessmentYear());
        assertEquals("2026-27-new-v1", rules.supersededBy(), "superseded by the current year");
        assertTrue(rules.sourceCitation().contains("Finance (No. 2) Act, 2024"));
        // Every slab carries its citation — the contract that made inventing figures forbidden.
        assertTrue(rules.slabs().stream().allMatch(s -> s.sourceCitation() != null
                && !s.sourceCitation().isBlank()));
    }

    @Test
    void aHandComputedFy2024_25SalaryMatchesTheEngine() {
        // ₹10,00,000 salary, new regime, FY 2024-25:
        //   taxable = 10,00,000 − 75,000 std deduction = 9,25,000
        //   slab tax = (7L−3L)·5% + (9.25L−7L)·10% = 20,000 + 22,500 = 42,500
        //   above the ₹7L rebate threshold → no 87A rebate
        //   cess 4% of 42,500 = 1,700 → total 44,200
        RuleSetDefinition rules = loader.load("2025-26-new");
        TaxResult result = engine.compute(rules, new TaxInput(
                List.of(new TaxFact("salary", Money.ofRupees(1_000_000))),
                List.of(), "below_60", Money.ofPaise(0)));
        assertEquals(92_500_000L, result.taxableIncome().paise(), "₹9,25,000 taxable");
        assertEquals(4_420_000L, result.totalTax().paise(), "₹44,200 incl. cess");
    }

    @Test
    void theFy2024_25RebateZeroesTaxUpToSevenLakh() {
        // ₹7,50,000 salary → taxable 6,75,000 (below the ₹7L threshold):
        //   slab tax = (6.75L−3L)·5% = 18,750, fully rebated under 87A (cap ₹25,000) → 0.
        RuleSetDefinition rules = loader.load("2025-26-new");
        TaxResult result = engine.compute(rules, new TaxInput(
                List.of(new TaxFact("salary", Money.ofRupees(750_000))),
                List.of(), "below_60", Money.ofPaise(0)));
        assertEquals(0L, result.totalTax().paise(), "the ₹25,000 rebate zeroes it");
    }

    @Test
    void the2025OldRegimeLoadsWithItsOwnDeductionAndRebate() {
        RuleSetDefinition rules = loader.load("2025-26-old");
        assertEquals("2025-26", rules.assessmentYear());
        assertEquals(5_000_000L, rules.standardDeduction().paise(), "₹50,000 — not the new regime's 75,000");
        assertEquals(1_250_000L, rules.rebateMaximum().paise(), "₹12,500 87A cap");
    }
}

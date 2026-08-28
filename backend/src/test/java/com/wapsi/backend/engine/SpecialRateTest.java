package com.wapsi.backend.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.money.Money;
import com.wapsi.backend.rules.RuleSetDefinition;
import com.wapsi.backend.rules.RuleSetLoader;

/**
 * T1.9b: special capital-gains rates (s.111A / s.112A / s.112) applied when a
 * capital_gains fact carries asset-class metadata. Every expectation is
 * hand-computed; the mirror suite in lib/engine/__tests__/tax.test.ts pins the
 * same arithmetic so the two engines cannot drift on this.
 */
class SpecialRateTest {
    private final RuleSetLoader loader = new RuleSetLoader(new ObjectMapper().findAndRegisterModules());
    private final TaxEngine engine = new TaxEngine();

    private RuleSetDefinition rules() {
        return loader.load("2026-27-new");
    }

    private TaxInput input(List<TaxFact> facts, long tdsPaise) {
        return new TaxInput(facts, List.of(), "below_60", Money.ofPaise(tdsPaise));
    }

    @Test
    void stcg111aIsTwentyPercentOutsideTheSlabPool() {
        // Rakesh's mirror: salary 18,60,000 + interest 22,400 + dividend 9,150
        // + 1,10,000 STT-equity STCG. Slab pool = 20,01,550 − 1,10,000 − 75,000
        // = 18,16,550 → slab tax 1,63,310; 111A tax 22,000; total before rebate
        // 1,85,310 (the gain sat in the 20% band, so totals match the old slab
        // simplification); cess 7,412 → 1,92,722; TDS 2,86,840 → refund 94,118.
        TaxResult result = engine.compute(rules(), input(List.of(
                new TaxFact("salary", Money.ofRupees(1_860_000)),
                new TaxFact("interest", Money.ofRupees(22_400)),
                new TaxFact("dividend", Money.ofRupees(9_150)),
                new TaxFact("capital_gains", Money.ofRupees(110_000), "equity_stt", "short")),
                28_684_000L));
        assertEquals(1, result.specialRate().size());
        SpecialRateLine line = result.specialRate().get(0);
        assertEquals("111A", line.section());
        assertEquals(2_200_000L, line.tax().paise(), "20% of ₹1,10,000");
        assertEquals(18_531_000L, result.taxBeforeRebate().paise());
        assertEquals(19_272_200L, result.totalTax().paise());
        assertEquals(9_411_800L, result.refundOrDue().paise(), "₹94,118 refund unchanged");
    }

    @Test
    void ltcg112aExemptsTheFirstLakhAndAQuarterAndIsNeverRebated() {
        // salary 10,00,000 + 2,00,000 STT-equity LTCG:
        //   112A taxable = 2,00,000 − 1,25,000 = 75,000 → 12.5% = 9,375
        //   slab pool 9,25,000 → slab tax 32,500, fully rebated u/s 87A
        //   payable = 9,375 + 4% cess (375) = 9,750
        TaxResult result = engine.compute(rules(), input(List.of(
                new TaxFact("salary", Money.ofRupees(1_000_000)),
                new TaxFact("capital_gains", Money.ofRupees(200_000), "equity_stt", "long")),
                0L));
        SpecialRateLine line = result.specialRate().get(0);
        assertEquals("112A", line.section());
        assertEquals(12_500_000L, line.exemptAmount().paise());
        assertEquals(937_500L, line.tax().paise());
        assertEquals(3_250_000L, result.rebate87A().paise(), "rebate hits the slab tax only");
        assertEquals(975_000L, result.totalTax().paise());
    }

    @Test
    void otherLongTermGainsAreTwelveAndAHalfPercentUnderS112() {
        // other income 5,00,000 (no std deduction) + 1,00,000 non-equity LTCG:
        //   s.112 tax 12,500; slab tax 5,000 fully rebated; cess 500 → 13,000.
        TaxResult result = engine.compute(rules(), input(List.of(
                new TaxFact("other", Money.ofRupees(500_000)),
                new TaxFact("capital_gains", Money.ofRupees(100_000), "other", "long")),
                0L));
        assertEquals("112", result.specialRate().get(0).section());
        assertEquals(1_300_000L, result.totalTax().paise());
    }

    @Test
    void nonEquityShortTermGainsStayInTheSlabPoolAsTheActRequires() {
        TaxResult classified = engine.compute(rules(), input(List.of(
                new TaxFact("other", Money.ofRupees(500_000)),
                new TaxFact("capital_gains", Money.ofRupees(100_000), "other", "short")),
                0L));
        TaxResult unclassified = engine.compute(rules(), input(List.of(
                new TaxFact("other", Money.ofRupees(500_000)),
                new TaxFact("capital_gains", Money.ofRupees(100_000))),
                0L));
        assertTrue(classified.specialRate().isEmpty());
        assertEquals(unclassified.totalTax().paise(), classified.totalTax().paise());
    }

    @Test
    void aRuleSetWithoutSpecialRatesKeepsClassifiedGainsAtSlab() {
        // AY 2025-26 deliberately carries no specialRates block: FY 2024-25
        // transfers straddle the 23-Jul-2024 rate change, and pricing them
        // without a transfer-date model would be dishonest. Slab fallback.
        RuleSetDefinition prior = loader.load("2025-26-new");
        TaxResult result = engine.compute(prior, input(List.of(
                new TaxFact("salary", Money.ofRupees(1_000_000)),
                new TaxFact("capital_gains", Money.ofRupees(200_000), "equity_stt", "long")),
                0L));
        assertTrue(result.specialRate().isEmpty());
        // taxable = 12,00,000 − 75,000 = 11,25,000 all at slab
        assertEquals(112_500_000L, result.taxableIncome().paise());
    }
}

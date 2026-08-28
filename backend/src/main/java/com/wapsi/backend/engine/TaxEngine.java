package com.wapsi.backend.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import com.wapsi.backend.money.Money;
import com.wapsi.backend.rules.RuleSetDefinition;
import com.wapsi.backend.rules.RuleSlab;

/**
 * Deterministic computation over an explicitly selected, versioned rule set.
 * No assessment-year threshold or rate is compiled into this class.
 */
public final class TaxEngine {
    private static final Money ZERO = Money.ofPaise(0);
    private static final BigDecimal PAISE_PER_RUPEE = BigDecimal.valueOf(100);

    public TaxResult compute(RuleSetDefinition rules, TaxInput input) {
        Objects.requireNonNull(rules, "rules");
        Objects.requireNonNull(input, "input");

        long grossPaise = input.facts().stream()
                .mapToLong(fact -> fact.amount().paise())
                .reduce(0L, Math::addExact);
        boolean hasSalary = input.facts().stream().anyMatch(fact -> "salary".equals(fact.kind()));
        long standardDeductionPaise = hasSalary ? rules.standardDeduction().paise() : 0L;
        long totalDeductionsPaise = allowedClaimsPaise(rules, input);

        // Classified capital gains leave the slab pool and are priced per-section
        // (T1.9b). Deductions offset slab income only — they cannot erode
        // s.111A/112A/112 gains, matching the Act. A rule set without special
        // rates keeps everything at slab, the labelled simplification.
        List<SpecialRateLine> specialLines = specialRateLines(rules, input);
        long specialGainsPaise = specialLines.stream()
                .mapToLong(line -> line.gains().paise())
                .reduce(0L, Math::addExact);
        long specialTaxablePaise = specialLines.stream()
                .mapToLong(line -> line.taxable().paise())
                .reduce(0L, Math::addExact);
        long specialTaxPaise = specialLines.stream()
                .mapToLong(line -> line.tax().paise())
                .reduce(0L, Math::addExact);

        long slabTaxablePaise = Math.max(0L,
                Math.subtractExact(
                        Math.subtractExact(
                                Math.subtractExact(grossPaise, specialGainsPaise),
                                standardDeductionPaise),
                        totalDeductionsPaise));
        long taxablePaise = Math.addExact(slabTaxablePaise, specialTaxablePaise);

        List<TaxSlab> slices = materializeSlabs(rules, input.ageBand(), slabTaxablePaise);
        long slabTaxPaise = slices.stream()
                .mapToLong(TaxSlab::taxPaise)
                .reduce(0L, Math::addExact);
        // s.87A (incl. marginal relief) applies to the slab portion only — the
        // rebate is not available against special-rate gains.
        long rebatePaise = rebatePaise(rules, taxablePaise, slabTaxPaise);
        long taxBeforeRebatePaise = Math.addExact(slabTaxPaise, specialTaxPaise);
        long taxAfterRebatePaise = Math.subtractExact(taxBeforeRebatePaise, rebatePaise);
        long cessPaise = roundToWholeRupeePaise(taxAfterRebatePaise, rules.cessRate());
        long totalTaxPaise = Math.addExact(taxAfterRebatePaise, cessPaise);
        long refundOrDuePaise = Math.subtractExact(input.tdsCredits().paise(), totalTaxPaise);

        return new TaxResult(
                Money.ofPaise(grossPaise),
                Money.ofPaise(standardDeductionPaise),
                Money.ofPaise(totalDeductionsPaise),
                Money.ofPaise(taxablePaise),
                slices,
                specialLines,
                Money.ofPaise(taxBeforeRebatePaise),
                Money.ofPaise(rebatePaise),
                Money.ofPaise(cessPaise),
                Money.ofPaise(totalTaxPaise),
                input.tdsCredits(),
                Money.ofPaise(refundOrDuePaise));
    }

    /** "111A", "112A", "112", or null for slab treatment. Non-equity STCG is slab income in law. */
    private static String specialSectionFor(TaxFact fact) {
        if (!"capital_gains".equals(fact.kind()) || fact.assetClass() == null || fact.holding() == null) {
            return null;
        }
        if ("equity_stt".equals(fact.assetClass())) {
            return "short".equals(fact.holding()) ? "111A" : "112A";
        }
        return "long".equals(fact.holding()) ? "112" : null;
    }

    private List<SpecialRateLine> specialRateLines(RuleSetDefinition rules, TaxInput input) {
        if (rules.specialRates() == null) return List.of();
        long sum111a = 0L, sum112a = 0L, sum112 = 0L;
        for (TaxFact fact : input.facts()) {
            String section = specialSectionFor(fact);
            if (section == null) continue;
            switch (section) {
                case "111A" -> sum111a = Math.addExact(sum111a, fact.amount().paise());
                case "112A" -> sum112a = Math.addExact(sum112a, fact.amount().paise());
                default -> sum112 = Math.addExact(sum112, fact.amount().paise());
            }
        }
        var rates = rules.specialRates();
        List<SpecialRateLine> lines = new ArrayList<>();
        if (sum111a > 0) {
            lines.add(line("111A", sum111a, 0L, rates.stcg111aRate()));
        }
        if (sum112a > 0) {
            // The exemption is annual and shared across all s.112A gains.
            long exemptPaise = Math.min(sum112a, rates.ltcg112aExemption().paise());
            lines.add(line("112A", sum112a, exemptPaise, rates.ltcg112aRate()));
        }
        if (sum112 > 0) {
            lines.add(line("112", sum112, 0L, rates.ltcg112Rate()));
        }
        return lines;
    }

    private SpecialRateLine line(String section, long gainsPaise, long exemptPaise, BigDecimal rate) {
        long taxablePaise = gainsPaise - exemptPaise;
        return new SpecialRateLine(
                section,
                Money.ofPaise(gainsPaise),
                Money.ofPaise(exemptPaise),
                Money.ofPaise(taxablePaise),
                rate,
                Money.ofPaise(roundToWholeRupeePaise(taxablePaise, rate)));
    }

    private long allowedClaimsPaise(RuleSetDefinition rules, TaxInput input) {
        long total = 0L;
        for (TaxClaim claim : input.claims()) {
            if (!rules.allowedClaimSections().isEmpty()
                    && !rules.allowedClaimSections().contains(claim.section())) {
                continue;
            }
            Money cap = rules.claimCaps().get(claim.section());
            long amount = cap == null
                    ? claim.amount().paise()
                    : Math.min(claim.amount().paise(), cap.paise());
            total = Math.addExact(total, amount);
        }
        return total;
    }

    private List<TaxSlab> materializeSlabs(RuleSetDefinition rules, String ageBand, long taxablePaise) {
        List<TaxSlab> slices = new ArrayList<>();
        long fromPaise = 0L;
        for (RuleSlab slab : rules.slabs()) {
            long lowerPaise = fromPaise;
            if ("old".equals(rules.regime()) && slices.isEmpty()
                    && ageBand != null && !"below_60".equals(ageBand)) {
                long ageExemptionPaise = rules.basicExemptionByAge()
                        .getOrDefault(ageBand, ZERO)
                        .paise();
                lowerPaise = Math.max(fromPaise, ageExemptionPaise);
            }
            Long upperPaise = slab.upTo() == null ? null : slab.upTo().paise();
            boolean bandExists = upperPaise == null || upperPaise > lowerPaise;
            if (bandExists && taxablePaise > lowerPaise) {
                long sliceUpper = upperPaise == null ? taxablePaise : Math.min(taxablePaise, upperPaise);
                long slicePaise = sliceUpper - lowerPaise;
                if (slicePaise > 0) {
                    slices.add(new TaxSlab(
                            lowerPaise,
                            upperPaise,
                            slab.rate(),
                            roundToWholeRupeePaise(slicePaise, slab.rate())));
                }
            }
            if (upperPaise == null) break;
            fromPaise = upperPaise;
        }
        return slices;
    }

    private long rebatePaise(RuleSetDefinition rules, long taxablePaise, long taxBeforeRebatePaise) {
        if (taxablePaise <= rules.nilTaxThreshold().paise()) {
            return Math.min(taxBeforeRebatePaise, rules.rebateMaximum().paise());
        }
        if (!rules.marginalReliefEnabled()) return 0L;
        long excessPaise = taxablePaise - rules.nilTaxThreshold().paise();
        return taxBeforeRebatePaise > excessPaise
                ? taxBeforeRebatePaise - excessPaise
                : 0L;
    }

    private long roundToWholeRupeePaise(long amountPaise, BigDecimal rate) {
        return BigDecimal.valueOf(amountPaise)
                .divide(PAISE_PER_RUPEE, 8, RoundingMode.HALF_UP)
                .multiply(rate)
                .setScale(0, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
    }
}

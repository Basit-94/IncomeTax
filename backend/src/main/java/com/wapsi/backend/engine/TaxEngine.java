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
        long taxablePaise = Math.max(0L,
                Math.subtractExact(Math.subtractExact(grossPaise, standardDeductionPaise), totalDeductionsPaise));

        List<TaxSlab> slices = materializeSlabs(rules, input.ageBand(), taxablePaise);
        long taxBeforeRebatePaise = slices.stream()
                .mapToLong(TaxSlab::taxPaise)
                .reduce(0L, Math::addExact);
        long rebatePaise = rebatePaise(rules, taxablePaise, taxBeforeRebatePaise);
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
                Money.ofPaise(taxBeforeRebatePaise),
                Money.ofPaise(rebatePaise),
                Money.ofPaise(cessPaise),
                Money.ofPaise(totalTaxPaise),
                input.tdsCredits(),
                Money.ofPaise(refundOrDuePaise));
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

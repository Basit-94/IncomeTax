package com.wapsi.backend.rules;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.wapsi.backend.money.Money;

/** Immutable, citation-carrying rule data. No tax threshold is compiled here. */
public record RuleSetDefinition(
        String id,
        String assessmentYear,
        String regime,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String sourceCitation,
        String supersededBy,
        Money standardDeduction,
        Money nilTaxThreshold,
        Money rebateMaximum,
        BigDecimal cessRate,
        String roundingPolicy,
        List<RuleSlab> slabs,
        Set<String> allowedClaimSections,
        Map<String, Money> claimCaps,
        Map<String, Money> basicExemptionByAge,
        boolean marginalReliefEnabled,
        /** Null = special capital-gains rates not modelled for this year (slab fallback). */
        SpecialRates specialRates) {
}

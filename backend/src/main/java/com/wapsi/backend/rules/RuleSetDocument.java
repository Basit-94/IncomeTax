package com.wapsi.backend.rules;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wapsi.backend.money.Money;

/** JSON-facing representation using paise so the API never transports raw currency numbers. */
public record RuleSetDocument(
        String id,
        String assessmentYear,
        String regime,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String sourceCitation,
        String supersededBy,
        long standardDeductionPaise,
        long nilTaxThresholdPaise,
        long rebateMaximumPaise,
        BigDecimal cessRate,
        String roundingPolicy,
        List<RuleSlabDocument> slabs,
        Set<String> allowedClaimSections,
        Map<String, Long> claimCapsPaise,
        Map<String, Long> basicExemptionByAgePaise,
        boolean marginalReliefEnabled,
        SpecialRatesDocument specialRates) {

    @JsonCreator
    public RuleSetDocument(
            @JsonProperty("id") String id,
            @JsonProperty("assessmentYear") String assessmentYear,
            @JsonProperty("regime") String regime,
            @JsonProperty("effectiveFrom") LocalDate effectiveFrom,
            @JsonProperty("effectiveTo") LocalDate effectiveTo,
            @JsonProperty("sourceCitation") String sourceCitation,
            @JsonProperty("supersededBy") String supersededBy,
            @JsonProperty("standardDeductionPaise") long standardDeductionPaise,
            @JsonProperty("nilTaxThresholdPaise") long nilTaxThresholdPaise,
            @JsonProperty("rebateMaximumPaise") long rebateMaximumPaise,
            @JsonProperty("cessRate") BigDecimal cessRate,
            @JsonProperty("roundingPolicy") String roundingPolicy,
            @JsonProperty("slabs") List<RuleSlabDocument> slabs,
            @JsonProperty("allowedClaimSections") Set<String> allowedClaimSections,
            @JsonProperty("claimCapsPaise") Map<String, Long> claimCapsPaise,
            @JsonProperty("basicExemptionByAgePaise") Map<String, Long> basicExemptionByAgePaise,
            @JsonProperty("marginalReliefEnabled") boolean marginalReliefEnabled,
            @JsonProperty("specialRates") SpecialRatesDocument specialRates) {
        this.id = id;
        this.assessmentYear = assessmentYear;
        this.regime = regime;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.sourceCitation = sourceCitation;
        this.supersededBy = supersededBy;
        this.standardDeductionPaise = standardDeductionPaise;
        this.nilTaxThresholdPaise = nilTaxThresholdPaise;
        this.rebateMaximumPaise = rebateMaximumPaise;
        this.cessRate = cessRate;
        this.roundingPolicy = roundingPolicy;
        this.slabs = List.copyOf(slabs);
        this.allowedClaimSections = allowedClaimSections == null ? Set.of() : Set.copyOf(allowedClaimSections);
        this.claimCapsPaise = claimCapsPaise == null ? Map.of() : Map.copyOf(claimCapsPaise);
        this.basicExemptionByAgePaise = basicExemptionByAgePaise == null ? Map.of() : Map.copyOf(basicExemptionByAgePaise);
        this.marginalReliefEnabled = marginalReliefEnabled;
        this.specialRates = specialRates;
    }

    public RuleSetDefinition toDefinition() {
        return new RuleSetDefinition(
                id,
                assessmentYear,
                regime,
                effectiveFrom,
                effectiveTo,
                sourceCitation,
                supersededBy,
                Money.ofPaise(standardDeductionPaise),
                Money.ofPaise(nilTaxThresholdPaise),
                Money.ofPaise(rebateMaximumPaise),
                cessRate,
                roundingPolicy,
                slabs.stream().map(RuleSlabDocument::toRuleSlab).toList(),
                allowedClaimSections,
                claimCapsPaise.entrySet().stream().collect(java.util.stream.Collectors.toUnmodifiableMap(
                        Map.Entry::getKey,
                        entry -> Money.ofPaise(entry.getValue()))),
                basicExemptionByAgePaise.entrySet().stream().collect(java.util.stream.Collectors.toUnmodifiableMap(
                        Map.Entry::getKey,
                        entry -> Money.ofPaise(entry.getValue()))),
                marginalReliefEnabled,
                specialRates == null ? null : specialRates.toSpecialRates());
    }
}

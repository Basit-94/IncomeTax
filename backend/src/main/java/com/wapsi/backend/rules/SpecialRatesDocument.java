package com.wapsi.backend.rules;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wapsi.backend.money.Money;

/** JSON-facing shape of {@link SpecialRates}; exemption travels as paise. */
public record SpecialRatesDocument(
        BigDecimal stcg111aRate,
        BigDecimal ltcg112aRate,
        long ltcg112aExemptionPaise,
        BigDecimal ltcg112Rate,
        String sourceCitation) {

    @JsonCreator
    public SpecialRatesDocument(
            @JsonProperty("stcg111aRate") BigDecimal stcg111aRate,
            @JsonProperty("ltcg112aRate") BigDecimal ltcg112aRate,
            @JsonProperty("ltcg112aExemptionPaise") long ltcg112aExemptionPaise,
            @JsonProperty("ltcg112Rate") BigDecimal ltcg112Rate,
            @JsonProperty("sourceCitation") String sourceCitation) {
        this.stcg111aRate = stcg111aRate;
        this.ltcg112aRate = ltcg112aRate;
        this.ltcg112aExemptionPaise = ltcg112aExemptionPaise;
        this.ltcg112Rate = ltcg112Rate;
        this.sourceCitation = sourceCitation;
    }

    public SpecialRates toSpecialRates() {
        return new SpecialRates(
                stcg111aRate,
                ltcg112aRate,
                Money.ofPaise(ltcg112aExemptionPaise),
                ltcg112Rate,
                sourceCitation);
    }
}

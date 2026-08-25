package com.wapsi.backend.engine;

import java.util.List;
import java.util.Objects;

import com.wapsi.backend.money.Money;

/** Pure-engine input. Rule version is supplied separately by TaxEngine.compute. */
public record TaxInput(
        List<TaxFact> facts,
        List<TaxClaim> claims,
        String ageBand,
        Money tdsCredits) {
    public TaxInput {
        facts = List.copyOf(Objects.requireNonNull(facts, "facts"));
        claims = List.copyOf(Objects.requireNonNull(claims, "claims"));
        tdsCredits = Objects.requireNonNullElse(tdsCredits, Money.ofPaise(0));
    }
}

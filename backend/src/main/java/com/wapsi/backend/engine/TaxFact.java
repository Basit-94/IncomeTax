package com.wapsi.backend.engine;

import com.wapsi.backend.money.Money;

/**
 * One income row. {@code assetClass}/{@code holding} classify a capital_gains
 * fact for the special rates (s.111A/112A/112); both null means unclassified,
 * which the engine taxes at slab — the labelled simplification (T1.9b).
 * assetClass: "equity_stt" | "other"; holding: "short" | "long".
 */
public record TaxFact(String kind, Money amount, String assetClass, String holding) {
    /** Unclassified fact — the shape every pre-T1.9b caller used. */
    public TaxFact(String kind, Money amount) {
        this(kind, amount, null, null);
    }
}

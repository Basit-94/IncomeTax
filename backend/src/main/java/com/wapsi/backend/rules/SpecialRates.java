package com.wapsi.backend.rules;

import java.math.BigDecimal;

import com.wapsi.backend.money.Money;

/**
 * Special capital-gains rates (Finance (No. 2) Act 2024, effective 23-Jul-2024).
 * Null on a rule set means special rates are NOT modelled for that year and
 * classified gains fall back to slab treatment — deliberately so for AY 2025-26,
 * where transfers straddle the 23-Jul-2024 rate change and a transfer-date
 * model would be required to price them honestly.
 */
public record SpecialRates(
        BigDecimal stcg111aRate,
        BigDecimal ltcg112aRate,
        Money ltcg112aExemption,
        BigDecimal ltcg112Rate,
        String sourceCitation) {
}

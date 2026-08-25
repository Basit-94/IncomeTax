package com.wapsi.backend.rules;

import java.math.BigDecimal;

import com.wapsi.backend.money.Money;

/** One progressive-tax band. A null upper bound means no upper bound. */
public record RuleSlab(Money upTo, BigDecimal rate, String sourceCitation) {
}

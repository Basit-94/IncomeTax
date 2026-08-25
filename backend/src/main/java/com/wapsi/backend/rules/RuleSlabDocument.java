package com.wapsi.backend.rules;

import java.math.BigDecimal;

import com.wapsi.backend.money.Money;

public record RuleSlabDocument(Long upToPaise, BigDecimal rate, String sourceCitation) {
    public RuleSlab toRuleSlab() {
        return new RuleSlab(upToPaise == null ? null : Money.ofPaise(upToPaise), rate, sourceCitation);
    }
}

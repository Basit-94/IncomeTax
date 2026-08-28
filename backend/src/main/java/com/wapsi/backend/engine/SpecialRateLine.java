package com.wapsi.backend.engine;

import java.math.BigDecimal;

import com.wapsi.backend.money.Money;

/** Tax on one special-rate capital-gains bucket: section is "111A", "112A" or "112". */
public record SpecialRateLine(
        String section,
        Money gains,
        Money exemptAmount,
        Money taxable,
        BigDecimal rate,
        Money tax) {
}

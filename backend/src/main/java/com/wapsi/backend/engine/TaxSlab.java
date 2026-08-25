package com.wapsi.backend.engine;

import java.math.BigDecimal;

/** One materialised slab slice, retaining the rule's exact paise boundaries. */
public record TaxSlab(long fromPaise, Long toPaise, BigDecimal rate, long taxPaise) {
}

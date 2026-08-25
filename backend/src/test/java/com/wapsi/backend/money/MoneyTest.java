package com.wapsi.backend.money;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.junit.jupiter.api.Test;

class MoneyTest {
    @Test
    void storesRupeesAsIntegerPaise() {
        assertEquals(12345L, Money.ofRupees(new BigDecimal("123.45")).paise());
        assertEquals(new BigDecimal("123.45"), Money.ofPaise(12345).asRupees());
    }

    @Test
    void rejectsFractionsSmallerThanOnePaise() {
        assertThrows(ArithmeticException.class,
                () -> Money.ofRupees(new BigDecimal("123.456")));
    }

    @Test
    void roundingIsExplicitAndUsesTheCallerPolicy() {
        Money value = Money.ofPaise(1);
        assertEquals(1L, value.multiply(new BigDecimal("0.5"), RoundingMode.HALF_UP).paise());
        assertEquals(0L, value.multiply(new BigDecimal("0.5"), RoundingMode.DOWN).paise());
    }
}

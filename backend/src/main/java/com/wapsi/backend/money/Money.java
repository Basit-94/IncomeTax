package com.wapsi.backend.money;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/** Exact currency value. The stored unit is integer Indian paise. */
public record Money(long paise) implements Comparable<Money> {
    public static final int PAISA_SCALE = 2;

    public Money {
        // A record constructor is the single invariant boundary for currency.
    }

    public static Money ofPaise(long paise) {
        return new Money(paise);
    }

    public static Money ofRupees(long rupees) {
        return new Money(Math.multiplyExact(rupees, 100L));
    }

    public static Money ofRupees(BigDecimal rupees) {
        Objects.requireNonNull(rupees, "rupees");
        return new Money(rupees.movePointRight(PAISA_SCALE)
                .setScale(0, RoundingMode.UNNECESSARY)
                .longValueExact());
    }

    public BigDecimal asRupees() {
        return BigDecimal.valueOf(paise, PAISA_SCALE);
    }

    public Money add(Money other) {
        Objects.requireNonNull(other, "other");
        return new Money(Math.addExact(paise, other.paise));
    }

    public Money subtract(Money other) {
        Objects.requireNonNull(other, "other");
        return new Money(Math.subtractExact(paise, other.paise));
    }

    /** Multiply by a decimal rate and round explicitly to whole paise. */
    public Money multiply(BigDecimal factor, RoundingMode roundingMode) {
        Objects.requireNonNull(factor, "factor");
        Objects.requireNonNull(roundingMode, "roundingMode");
        return new Money(BigDecimal.valueOf(paise)
                .multiply(factor)
                .setScale(0, roundingMode)
                .longValueExact());
    }

    @Override
    public int compareTo(Money other) {
        return Long.compare(paise, other.paise);
    }
}

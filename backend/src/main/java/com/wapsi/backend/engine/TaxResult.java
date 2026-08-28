package com.wapsi.backend.engine;

import java.util.List;

import com.wapsi.backend.money.Money;

public record TaxResult(
        Money grossIncome,
        Money standardDeduction,
        Money totalDeductions,
        Money taxableIncome,
        List<TaxSlab> slabBreakdown,
        /** Special-rate capital-gains buckets; empty when nothing was classified. */
        List<SpecialRateLine> specialRate,
        /** Slab tax + special-rate tax, before the s.87A rebate. */
        Money taxBeforeRebate,
        Money rebate87A,
        Money cess,
        Money totalTax,
        Money tdsCredits,
        Money refundOrDue) {
    public TaxResult {
        slabBreakdown = List.copyOf(slabBreakdown);
        specialRate = List.copyOf(specialRate);
    }
}

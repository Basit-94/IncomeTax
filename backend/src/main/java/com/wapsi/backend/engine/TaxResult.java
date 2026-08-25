package com.wapsi.backend.engine;

import java.util.List;

import com.wapsi.backend.money.Money;

public record TaxResult(
        Money grossIncome,
        Money standardDeduction,
        Money totalDeductions,
        Money taxableIncome,
        List<TaxSlab> slabBreakdown,
        Money taxBeforeRebate,
        Money rebate87A,
        Money cess,
        Money totalTax,
        Money tdsCredits,
        Money refundOrDue) {
    public TaxResult {
        slabBreakdown = List.copyOf(slabBreakdown);
    }
}

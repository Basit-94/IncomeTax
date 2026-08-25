package com.wapsi.backend.engine;

import com.wapsi.backend.money.Money;

public record TaxClaim(String section, Money amount) {
}

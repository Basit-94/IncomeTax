package com.wapsi.backend.engine;

import com.wapsi.backend.money.Money;

public record TaxFact(String kind, Money amount) {
}

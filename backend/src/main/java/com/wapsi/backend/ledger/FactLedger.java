package com.wapsi.backend.ledger;

import java.util.List;
import java.util.UUID;

public interface FactLedger {
    FactLedgerEvent append(FactLedgerEvent event);

    List<FactLedgerEvent> history(UUID returnId);

    List<FactLedgerEvent> currentProjection(UUID returnId);
}

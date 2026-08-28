package com.wapsi.backend.ledger;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Small adapter for contract tests and local development; production uses PostgreSQL.
 *
 * <p>Deliberately not a {@code @Component}: {@code PersistenceConfig} decides between this and
 * {@link PostgresFactLedger}, and a stereotype here would create a second competing bean.
 */
public class InMemoryFactLedger implements FactLedger {
    private final Map<UUID, List<FactLedgerEvent>> events = new ConcurrentHashMap<>();

    @Override
    public FactLedgerEvent append(FactLedgerEvent event) {
        events.compute(event.returnId(), (returnId, existing) -> {
            List<FactLedgerEvent> next = existing == null ? new ArrayList<>() : new ArrayList<>(existing);
            if (next.stream().anyMatch(current -> current.id().equals(event.id()))) {
                throw new IllegalArgumentException("Fact event already exists: " + event.id());
            }
            next.add(event);
            return List.copyOf(next);
        });
        return event;
    }

    @Override
    public List<FactLedgerEvent> history(UUID returnId) {
        return events.getOrDefault(returnId, List.of());
    }

    @Override
    public List<FactLedgerEvent> currentProjection(UUID returnId) {
        List<FactLedgerEvent> history = history(returnId);
        var superseded = history.stream()
                .map(FactLedgerEvent::supersedesFactId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        return history.stream()
                .filter(event -> !superseded.contains(event.id()))
                .sorted(Comparator.comparing(FactLedgerEvent::reportedAt))
                .toList();
    }
}

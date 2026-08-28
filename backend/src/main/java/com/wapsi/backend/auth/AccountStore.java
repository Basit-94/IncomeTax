package com.wapsi.backend.auth;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Account persistence. A registration in progress and an activated account are the same row at
 * different statuses — a draft kept in process memory would not survive a restart or reach a
 * second instance, and registration is exactly when a user is most likely to be interrupted.
 */
public interface AccountStore {

    /** @throws IllegalStateException if the PAN is already taken. */
    Account create(Account account);

    Account update(Account account);

    Optional<Account> byPan(String pan);

    /** Single-process store for local development and tests. */
    final class InMemory implements AccountStore {
        private final Map<String, Account> byPan = new ConcurrentHashMap<>();

        @Override
        public Account create(Account account) {
            Account existing = byPan.putIfAbsent(account.pan(), account);
            if (existing != null) {
                throw new IllegalStateException("An account already exists for this PAN");
            }
            return account;
        }

        @Override
        public Account update(Account account) {
            byPan.put(account.pan(), account);
            return account;
        }

        @Override
        public Optional<Account> byPan(String pan) {
            return Optional.ofNullable(byPan.get(pan));
        }
    }
}

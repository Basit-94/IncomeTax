/**
 * Which DigiLocker Wapsi talks to. `DIGILOCKER_PROVIDER` accepts only `mock` today; a real provider
 * would be added here behind the same `DigiLockerProvider` interface (Phase C seam, 2026-09-07).
 */

import type { Pool } from "pg";
import { MockDigiLockerProvider } from "./provider";
import { MemoryLockerStore, PostgresLockerStore } from "./store";
import type { DigiLockerProvider } from "./types";

export type { DigiLockerProvider, IssuedDocument, LockerDocument, LockerProfile, LockerRecord } from "./types";

const memory = new MemoryLockerStore();

/** The provider for this process: durable random records with a database, PAN-seeded records without. */
export function digiLockerFor(pool: Pool | null, env: Record<string, string | undefined> = process.env): DigiLockerProvider {
  const wanted = (env.DIGILOCKER_PROVIDER ?? "mock").trim().toLowerCase();
  if (wanted !== "mock") console.warn(`[wapsi] DIGILOCKER_PROVIDER=${wanted} is not available; using the mock`);
  return new MockDigiLockerProvider(pool ? new PostgresLockerStore(pool) : memory, { randomSeeds: !!pool });
}

/** Tests and in-process callers: a fresh memory-backed mock with PAN-seeded records. */
export function memoryDigiLocker(now?: () => string): DigiLockerProvider {
  return new MockDigiLockerProvider(new MemoryLockerStore(), { randomSeeds: false, now });
}

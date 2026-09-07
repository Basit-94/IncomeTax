/**
 * Where a person's generated locker lives (2026-09-07). With a database, `digilocker_records` keeps
 * it across restarts and deployments — a returning person sees the same papers. Without one, the
 * process-lifetime store holds it and the provider seeds from the PAN so a restart regenerates the
 * same record (disclosed: `durable: false`).
 */

import type { Pool } from "pg";
import type { LockerRecord, LockerStore } from "./types";

export class MemoryLockerStore implements LockerStore {
  private readonly rows = new Map<string, LockerRecord>();
  async get(pan: string): Promise<LockerRecord | null> {
    return this.rows.get(pan.toUpperCase()) ?? null;
  }
  async put(record: LockerRecord): Promise<void> {
    this.rows.set(record.pan.toUpperCase(), record);
  }
}

export class PostgresLockerStore implements LockerStore {
  constructor(private readonly pool: Pool) {}
  async get(pan: string): Promise<LockerRecord | null> {
    const res = await this.pool.query<{ record: LockerRecord }>("SELECT record FROM digilocker_records WHERE pan = $1", [pan.toUpperCase()]);
    return res.rows[0]?.record ?? null;
  }
  async put(record: LockerRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO digilocker_records (pan, record, created_at, updated_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (pan) DO UPDATE SET record = EXCLUDED.record, updated_at = EXCLUDED.updated_at`,
      [record.pan.toUpperCase(), JSON.stringify(record), record.createdAt, record.updatedAt],
    );
  }
}

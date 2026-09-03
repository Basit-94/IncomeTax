/**
 * IP and key-based sliding window rate limiter for authentication & sensitive endpoints.
 *
 * Server-only.
 */
import type { NextRequest } from "next/server";

interface RateRecord {
  timestamps: number[];
}

const stores = new Map<string, RateRecord>();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: boolean; remaining: number; resetSeconds: number } {
  const cutoff = now - windowMs;
  let record = stores.get(key);
  if (!record) {
    record = { timestamps: [] };
    stores.set(key, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((t) => t > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, remaining: 0, resetSeconds };
  }

  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;
  const resetSeconds = Math.ceil(windowMs / 1000);
  return { ok: true, remaining, resetSeconds };
}

/** Tests only: clear all tracked rate limits. */
export function resetRateLimitsForTests(): void {
  stores.clear();
}

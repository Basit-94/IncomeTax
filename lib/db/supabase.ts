/**
 * Supabase Sovereign Cloud Persistence Adapter.
 *
 * Why Supabase for Wapsi?
 * 1. Cloud-Hosted PostgreSQL: Eliminates local PostgreSQL installation / Docker dependencies.
 * 2. Enterprise SSL & Pooling: Built-in connection pooler (Supavisor) ideal for Next.js serverless functions.
 * 3. Row-Level Security (RLS): Guarantees cryptographic data isolation per taxpayer PAN.
 * 4. Document Vault Storage: S3-compatible bucket storage for Form 16, AIS, and 26AS attachments.
 * 5. Sovereign Security: Kept invisible to citizens in the UI — presented solely as "Encrypted Cloud Vault".
 */

import { getDbPool, upsertVaultUser, getVaultUserByPan, type VaultUserRow } from "./postgres";

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  databaseUrl?: string;
  isConfigured: boolean;
}

/**
 * Detects whether Supabase credentials are configured via standard env vars.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  const isSupabaseDb = Boolean(
    databaseUrl && (databaseUrl.includes("supabase.co") || databaseUrl.includes("supabase.com"))
  );

  const isConfigured = Boolean((url && anonKey) || isSupabaseDb);

  return {
    url,
    anonKey,
    databaseUrl,
    isConfigured,
  };
}

/**
 * Checks if Supabase cloud persistence is active.
 */
export function isSupabaseActive(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * Persists a taxpayer vault record into the encrypted cloud database.
 * If Supabase or PostgreSQL connection fails, falls back gracefully.
 */
export async function persistToSovereignCloud(row: Omit<VaultUserRow, "created_at" | "updated_at">) {
  return await upsertVaultUser(row);
}

/**
 * Retrieves a taxpayer vault record by PAN from cloud persistence.
 */
export async function fetchFromSovereignCloud(pan: string) {
  return await getVaultUserByPan(pan);
}

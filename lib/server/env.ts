/**
 * Server startup & runtime environment validation.
 *
 * Checks that all required environment variables for production deployment are configured
 * properly, refusing to run in production if critical secrets or configs are missing.
 */
import { getMasterKey } from "./vault";

export interface EnvValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateEnvironment(isProduction = process.env.NODE_ENV === "production"): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Vault Master Key (Critical for encryption of citizen data)
  const masterKeyEnv = process.env.VAULT_MASTER_KEY?.trim();
  if (!masterKeyEnv) {
    if (isProduction && process.env.VAULT_ALLOW_GENERATED_KEY !== "true") {
      errors.push("VAULT_MASTER_KEY is not set. A 64-hex character key is required in production.");
    } else {
      warnings.push("VAULT_MASTER_KEY is unset; using local development master key.");
    }
  } else if (!/^[0-9a-f]{64}$/i.test(masterKeyEnv)) {
    errors.push("VAULT_MASTER_KEY is invalid. It must be a 64-hexadecimal character string (32 bytes).");
  }

  // 2. AI Model API Key (Gemini)
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_FALLBACK_API_KEY ||
    process.env.GEMINI_FALLBACK_API_KEY_2 ||
    process.env.GEMINI_FALLBACK_API_KEY_3;
  if (!apiKey || apiKey.includes("REPLACE_ME")) {
    warnings.push("GEMINI_API_KEY is not configured; assistant will run in deterministic offline planner mode.");
  }

  // 3. Database configuration (SQLite or Postgres)
  const dbPath = process.env.WAPSI_DB_PATH;
  if (!dbPath) {
    warnings.push("WAPSI_DB_PATH is unset; default 'data/wapsi.db' will be used.");
  }

  // 4. Reviewer demo password in production
  if (isProduction && process.env.SEED_DEMO_ACCOUNT !== "false") {
    if (process.env.DEMO_PASSWORD === "12345" || !process.env.DEMO_PASSWORD) {
      warnings.push("Default demo password '12345' is active in production. Set DEMO_PASSWORD or SEED_DEMO_ACCOUNT=false.");
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/** Ensure environment is valid on server startup; throws in production if invalid. */
export function assertEnvironment(): void {
  const result = validateEnvironment();
  if (!result.valid) {
    throw new Error(`[Startup Failure] Critical environment variables missing:\n- ${result.errors.join("\n- ")}`);
  }
}

/**
 * lib/server/geminiKeys.ts
 *
 * Universal resolver for Google Gemini API keys across all server endpoints:
 * - Agentic workspace engine (lib/agentic/model.ts)
 * - Copilot assistant (lib/agent/copilot.ts)
 * - Streaming chat route (app/api/agent/route.ts)
 * - Document/Form-16 PDF extraction (app/api/extract/route.ts)
 * - Voice audio transcriber & refiner (lib/server/transcriber.ts)
 *
 * Supports:
 * - GEMINI_API_KEY (Primary)
 * - GEMINI_FALLBACK_API_KEY (Fallback 1)
 * - GEMINI_FALLBACK_API_KEY_2 .. GEMINI_FALLBACK_API_KEY_20 (Numbered fallbacks)
 * - GEMINI_API_KEYS (Comma-separated list of keys, ideal for Vercel env settings)
 * - Any environment variable matching /^GEMINI_(FALLBACK_)?API_KEY(_\d+)?$/i
 */

export function getGeminiKeys(env: Record<string, string | undefined> = process.env): string[] {
  const clean = (k: string | undefined) => (k ?? "").trim().replace(/^["']|["']$/g, "");
  const keys: string[] = [];

  const addKey = (val: string | undefined) => {
    if (!val) return;
    const cleaned = clean(val);
    if (cleaned && !cleaned.includes("REPLACE_ME") && !keys.includes(cleaned)) {
      keys.push(cleaned);
    }
  };

  // 1. Primary key
  addKey(env.GEMINI_API_KEY);

  // 2. Fallback key 1
  addKey(env.GEMINI_FALLBACK_API_KEY);

  // 3. Fallback keys 2 through 20 in sequential order
  for (let i = 2; i <= 20; i++) {
    addKey(env[`GEMINI_FALLBACK_API_KEY_${i}`]);
  }

  // 4. Comma-separated list (e.g. GEMINI_API_KEYS="key1, key2, key3, key4, key5")
  if (env.GEMINI_API_KEYS) {
    for (const part of env.GEMINI_API_KEYS.split(/[,;\n\r]+/)) {
      addKey(part);
    }
  }

  // 5. Any other environment variables matching the Gemini key pattern
  for (const [keyName, val] of Object.entries(env)) {
    if (/^GEMINI_(FALLBACK_)?API_KEY(_\d+)?$/i.test(keyName)) {
      addKey(val);
    }
  }

  return keys;
}

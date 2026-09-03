/**
 * The Gemini adapter (plan task 2.2). Three narrow jobs, each with an offline fallback in
 * engine.ts: classify the first message into JSON, phrase one question, write one short
 * explanation. Thought summaries are requested so the activity log can show them.
 *
 * The model id comes from `AGENT_MODEL` (plan D6); it is checked once per process and a
 * missing id is reported as a clear error rather than a silent fallback.
 */

export interface ModelResult {
  text: string;
  thoughts: string[];
}

export type ModelOutcome = { ok: true; result: ModelResult } | { ok: false; error: string };

const TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS || 12_000);

function apiKey(): string | null {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_FALLBACK_API_KEY,
    process.env.GEMINI_FALLBACK_API_KEY_2,
    process.env.GEMINI_FALLBACK_API_KEY_3,
  ]
    .map((k) => k?.trim().replace(/^["']|["']$/g, ""))
    .filter((k): k is string => !!k && !k.includes("REPLACE_ME"));
  return keys[0] ?? null;
}

export function modelId(): string {
  return process.env.AGENT_MODEL || "gemini-3.5-flash";
}

/** Tried when the primary model is overloaded (HTTP 5xx) or answers with nothing. */
export function fallbackModelId(): string | null {
  const id = process.env.AGENT_FALLBACK_MODEL?.trim();
  return id && id !== modelId() ? id : null;
}

export function modelConfigured(): boolean {
  return apiKey() !== null;
}

let modelCheck: Promise<string | null> | null = null;

/** null when the id resolves; otherwise the reason it does not. Cached per process. */
export function checkModelId(): Promise<string | null> {
  if (modelCheck) return modelCheck;
  modelCheck = (async () => {
    const key = apiKey();
    if (!key) return "GEMINI_API_KEY is not configured";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId()}`, {
        headers: { "x-goog-api-key": key },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 404) return `model "${modelId()}" does not exist for this key; set AGENT_MODEL to a listed id`;
      if (!res.ok) return `model check failed: HTTP ${res.status}`;
      return null;
    } catch (error) {
      return `model check failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  })();
  return modelCheck;
}

/** Tests: forget the cached check. */
export function resetModelCheckForTests(): void {
  modelCheck = null;
}

interface GenerateOptions {
  system: string;
  user: string;
  /** Ask for JSON matching this schema (Gemini structured output). */
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  /** Ask for thought summaries (default true). Off for one-line rephrasing, where they only cost budget. */
  thoughts?: boolean;
  /** Per-attempt timeout; short for cosmetic calls so the template wins when the model is slow. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

export async function generate(opts: GenerateOptions): Promise<ModelOutcome> {
  const key = apiKey();
  if (!key) return { ok: false, error: "GEMINI_API_KEY is not configured" };
  const doFetch = opts.fetchImpl ?? fetch;
  const body = (withThoughts: boolean) => ({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? Number(process.env.AGENT_MAX_TOKENS_PER_REPLY || 1024),
      temperature: opts.temperature ?? 0.2,
      ...(opts.jsonSchema ? { responseMimeType: "application/json", responseSchema: opts.jsonSchema } : {}),
      ...(withThoughts ? { thinkingConfig: { includeThoughts: true } } : {}),
    },
  });
  const attempt = async (withThoughts: boolean, model: string): Promise<ModelOutcome | { retry: true } | { overloaded: true; error: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUT_MS);
    try {
      const res = await doFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body(withThoughts)),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        // Some models reject thinkingConfig; retry once without it.
        if (withThoughts && res.status === 400 && /thinking/i.test(text)) return { retry: true };
        if (res.status === 503 || res.status === 429 || res.status === 500) return { overloaded: true, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: GeminiPart[] } }[] };
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const thoughts = parts.filter((p) => p.thought && p.text).map((p) => p.text!.trim());
      const text = parts.filter((p) => !p.thought && p.text).map((p) => p.text!).join("").trim();
      // Thought tokens can use up a small budget and leave no answer; retry without them.
      if (!text) return withThoughts ? { retry: true } : { ok: false, error: "empty reply" };
      return { ok: true, result: { text, thoughts } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      clearTimeout(timer);
    }
  };
  const models = [modelId(), ...(fallbackModelId() ? [fallbackModelId()!] : [])];
  let lastError = "model unavailable";
  // One try per model, plus a single short retry on the primary when it is merely busy.
  for (const [index, model] of models.entries()) {
    const rounds = index === 0 ? 2 : 1;
    for (let round = 0; round < rounds; round++) {
      let outcome = await attempt(opts.thoughts !== false, model);
      if ("retry" in outcome) outcome = await attempt(false, model);
      if ("overloaded" in outcome) {
        lastError = outcome.error;
        if (round + 1 < rounds) await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      if ("retry" in outcome) return { ok: false, error: "empty reply" };
      return outcome;
    }
  }
  return { ok: false, error: lastError };
}

/** Parse the model's JSON, tolerating code fences. */
export function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ transcription -- */

/**
 * Transcribe a short recording (the voice fallback, app/api/speech). Audio goes to Gemini
 * inline; the reply is the spoken words only, Latin digits, no commentary.
 */
export async function transcribeAudio(input: { bytes: Buffer; mimeType: string; lang: string }): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = apiKey();
  if (!key) return { ok: false, error: "GEMINI_API_KEY is not configured" };
  const models = [modelId(), ...(fallbackModelId() ? [fallbackModelId()!] : [])];
  let lastError = "model unavailable";
  for (const model of models) {
    for (let round = 0; round < 2; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `Transcribe this recording verbatim in the language spoken (interface language code "${input.lang}"; Indian English, Hindi, Tamil and other Indian languages are likely). Write numbers with Latin digits. Reply with the transcript only; if nothing intelligible was said, reply with an empty string.` },
                  { inlineData: { mimeType: input.mimeType, data: input.bytes.toString("base64") } },
                ],
              },
            ],
            generationConfig: { maxOutputTokens: 400, temperature: 0 },
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text();
          lastError = `HTTP ${res.status}: ${text.slice(0, 160)}`;
          if (res.status === 503 || res.status === 429 || res.status === 500) {
            await new Promise((resolve) => setTimeout(resolve, 800 * (round + 1)));
            continue;
          }
          break;
        }
        const data = (await res.json()) as { candidates?: { content?: { parts?: GeminiPart[] } }[] };
        const text = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text!).join("").trim();
        return { ok: true, text };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      } finally {
        clearTimeout(timer);
      }
    }
  }
  return { ok: false, error: lastError };
}

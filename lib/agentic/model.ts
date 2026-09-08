/**
 * The model boundary (rebuilt 2026-09-07, user direction: "I want it to be completely free of any
 * gates… respond naturally… our agent needs to be able to think properly").
 *
 * One method: `converse`. The model gets Munshi ji's character, the person's situation, the conversation
 * so far and a set of tools; it decides what to say and which tools to call. Everything it sees has been
 * redacted (redact.ts); every figure it says is checked against what the tools and facts actually
 * contained (brain.ts `checkReply`). The model still never decides a figure — it asks the engine — and it
 * never files or pays: those tools put a card in front of the person and stop.
 *
 * Configuration-driven: model ids and keys come from env; a key out of quota (HTTP 429) is skipped for
 * the rest of the process and every failure has a name (`lastFailure`), so a fallback is never silent.
 */

import type { Lang } from "../types";
import { getGeminiKeys } from "../server/geminiKeys";

export interface ModelUsage {
  tokens: number;
  /** Which model answered — the primary, or a fallback the key still had quota on. */
  model?: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

/** A tool the model may call — Gemini function-declaration shape (OpenAPI subset, upper-case types). */
export interface ToolDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export type ConverseMessage =
  | { role: "user"; text: string }
  /** `raw` carries the provider's own parts (function calls, thought signatures) so a multi-hop turn replays exactly. */
  | { role: "model"; text?: string; calls?: ToolCall[]; raw?: unknown[] }
  | { role: "tool"; results: { name: string; response: unknown }[] };

export interface ConverseInput {
  system: string;
  messages: ConverseMessage[];
  tools: ToolDeclaration[];
  lang: Lang;
  temperature?: number;
}

export interface ConverseResult {
  text: string;
  calls: ToolCall[];
  /** The provider's parts for this reply, to be echoed back when the tool results are sent. */
  raw: unknown[];
  usage: ModelUsage;
}

export interface ModelAdapter {
  readonly name: string;
  converse(input: ConverseInput): Promise<ConverseResult | null>;
  /** Why the last call returned null ("HTTP 429", "timeout"…), so a fallback is never silent. */
  lastFailure?(): string | null;
}

/** Always defers: used in tests and when no key is configured. The runtime then speaks its one honest offline line. */
export const nullModel: ModelAdapter = {
  name: "none",
  async converse() {
    return null;
  },
  lastFailure: () => "model off",
};

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  thoughtSignature?: string;
  thought?: boolean;
}

function toContents(messages: ConverseMessage[]): { role: "user" | "model"; parts: GeminiPart[] }[] {
  const out: { role: "user" | "model"; parts: GeminiPart[] }[] = [];
  for (const m of messages) {
    if (m.role === "user") out.push({ role: "user", parts: [{ text: m.text }] });
    else if (m.role === "model") {
      const parts: GeminiPart[] = m.raw?.length
        ? (m.raw as GeminiPart[])
        : [...(m.text ? [{ text: m.text }] : []), ...(m.calls ?? []).map((c) => ({ functionCall: { name: c.name, args: c.args } }))];
      if (parts.length) out.push({ role: "model", parts });
    } else {
      // A function response is an object by contract; a bare value is wrapped.
      out.push({ role: "user", parts: m.results.map((r) => ({ functionResponse: { name: r.name, response: r.response !== null && typeof r.response === "object" && !Array.isArray(r.response) ? (r.response as Record<string, unknown>) : { result: r.response } } })) });
    }
  }
  return out;
}

export function geminiModel(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): ModelAdapter {
  const clean = (k: string | undefined) => (k ?? "").trim().replace(/^["']|["']$/g, "");
  const keys = getGeminiKeys(env);
  // The primary model, then the fallbacks: free-tier quotas are per model, so a key that is out of quota on
  // gemini-3.5-flash usually still has the day's budget on gemini-3.5-flash-lite (found live 2026-09-07).
  const models = [...new Set([env.AGENT_MODEL, env.AGENT_FALLBACK_MODEL, env.AGENT_SMALL_MODEL].map(clean).filter(Boolean))];
  const model = models[0];
  // A thinking turn with tools takes longer than a phrasing; 4.5 s default for fast responses, env wins.
  const timeoutMs = Number(env.AGENT_MODEL_TIMEOUT_MS) || 4_500;
  const maxTokens = Number(env.AGENT_MAX_TOKENS_PER_REPLY) || 2048;
  if (keys.length === 0 || !model) return nullModel;
  // A key+model pair that hit HTTP 429 rests until the API's own "retry in Ns" (an hour when it gives none).
  const restingUntil = new Map<string, number>();
  const pairs = keys.flatMap((key) => models.map((m) => ({ key, model: m, id: `${keys.indexOf(key) + 1}:${m}` })));
  let lastFailure: string | null = null;
  const retryHint = (body: string): number | null => {
    const m = /retry in ([\d.]+)\s*s/i.exec(body);
    return m ? Number(m[1]) : null;
  };

  return {
    name: model,
    lastFailure: () => lastFailure,
    async converse(input) {
      const now = Date.now();
      const live = pairs.filter((p) => (restingUntil.get(p.id) ?? 0) <= now);
      if (live.length === 0) {
        const soonest = Math.min(...pairs.map((p) => restingUntil.get(p.id) ?? now));
        lastFailure = `all keys out of quota (HTTP 429); next try in ${Math.max(1, Math.ceil((soonest - now) / 1000))} s`;
        return null;
      }
      for (const pair of live) {
        let waited = false;
        const isThinkingModel = !pair.model.toLowerCase().includes("lite");
        const body = {
          systemInstruction: { parts: [{ text: input.system }] },
          contents: toContents(input.messages),
          ...(input.tools.length ? { tools: [{ functionDeclarations: input.tools.map((t) => ({ name: t.name, description: t.description, ...(t.parameters ? { parameters: t.parameters } : {}) })) }], toolConfig: { functionCallingConfig: { mode: "AUTO" } } } : {}),
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: input.temperature ?? 0.7,
            ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        };
        for (;;) {
          try {
            const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${pair.model}:generateContent`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-goog-api-key": pair.key },
              body: JSON.stringify(body),
              signal: AbortSignal.timeout(timeoutMs),
            });
            if (res.status === 429 || res.status === 404) {
              const hint = res.status === 429 ? retryHint(await res.text().catch(() => "")) : null;
              if (hint !== null && hint <= 2 && !waited) {
                waited = true;
                await new Promise((r) => setTimeout(r, Math.ceil(hint * 1000) + 50));
                continue;
              }
              restingUntil.set(pair.id, Date.now() + (hint !== null ? Math.ceil(hint * 1000) : 45_000));
              lastFailure = `HTTP ${res.status} on key ${keys.indexOf(pair.key) + 1} of ${keys.length} for ${pair.model}${hint !== null ? ` (retry in ${Math.ceil(hint)} s)` : ""}`;
              break;
            }
            if (!res.ok) {
              restingUntil.set(pair.id, Date.now() + 30_000);
              lastFailure = `HTTP ${res.status}`;
              break;
            }
            const data = await res.json();
            const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
            let text = parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text as string).join("").trim();
            if (!text) {
              text = parts.filter((p) => typeof p.text === "string").map((p) => p.text as string).join("").trim();
            }
            const calls: ToolCall[] = parts.filter((p) => p.functionCall?.name).map((p) => ({ name: p.functionCall!.name, args: (p.functionCall!.args ?? {}) as Record<string, unknown> }));
            const tokens = Number(data?.usageMetadata?.totalTokenCount) || Math.ceil((input.system.length + JSON.stringify(input.messages).length + text.length) / 4);
            if (!text && calls.length === 0) {
              lastFailure = `empty reply (${data?.candidates?.[0]?.finishReason ?? "no candidate"})`;
              break;
            }
            lastFailure = null;
            return { text, calls, raw: parts, usage: { tokens, model: pair.model } };
          } catch (err) {
            restingUntil.set(pair.id, Date.now() + 20_000);
            lastFailure = err instanceof Error && err.name === "TimeoutError" ? `timeout after ${timeoutMs} ms` : "network error";
            break;
          }
        }
      }
      return null;
    },
  };
}

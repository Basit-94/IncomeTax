/**
 * Wapsi Citizen Tax Copilot - Unified Execution Engine
 *
 * Provides shared conversational execution for:
 * 1. The Manual Dashboard Copilot Panel (`app/api/agent/route.ts`)
 * 2. The Agentic Flow Backend (`lib/agentic/runtime.ts`)
 *
 * Architecture principles:
 * - Munshi ji character persona applied consistently across surfaces
 * - Statutory facts strictly grounded in tools (compute_tax_ay2026, etc.)
 * - Contextual multi-turn reasoning with fallback key rotation
 */

import { computeTax, compareRegimes } from "../engine/tax";
import type { TaxInput, TaxInputFact } from "../engine/types";
import type { Claim } from "../types";
import { functionDeclarations, toolByName } from "./tools";
import { languageOption } from "../i18n/languages";
import { characterPrompt } from "../agentic/munshi-character";
import { getActiveGeminiKeys, getGeminiKeys, markKeyCooldown, markKeySuccess } from "../server/geminiKeys";
import {
  executeComputeTaxAy2026,
  executeReconcileFact,
  executePredictAuditRisk,
  executeGenerateStatutoryArtifact,
  type ComputeTaxAy2026Args,
  type ReconcileFactArgs,
  type PredictAuditRiskArgs,
  type GenerateStatutoryArtifactArgs,
} from "./copilot-engine";

export interface AgentContext {
  facts: TaxInputFact[];
  claims: Claim[];
  tdsCredits: number;
  regime: "new" | "old";
  mode: "simple" | "full";
  /** Any of the portal's 23 interface languages (lib/i18n/languages.ts). */
  lang: string;
  userName?: string;
  pan?: string;
  employer?: string;
  /** The user's own backend session token; absent when not signed in. */
  sessionToken?: string;
}

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

export interface ClientAction {
  tool: string;
  args: Record<string, unknown>;
  /** prepare_filing carries the figures the human must see before confirming. */
  summary?: Record<string, unknown>;
}

export interface ToolEvent {
  tool: string;
  args: Record<string, unknown>;
  /** What the model saw back (already serialised), for the transcript/audit. */
  result: unknown;
}

export interface CopilotResponse {
  reply: string;
  toolEvents: ToolEvent[];
  clientActions: ClientAction[];
  error?: string;
}

export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

export function taxInputFrom(ctx: AgentContext, regime?: "new" | "old"): TaxInput {
  return {
    facts: ctx.facts,
    claims: ctx.claims,
    regime: regime ?? ctx.regime,
    tdsCredits: ctx.tdsCredits,
  };
}

const DEMO_DISCLOSURE =
  "DEMO DATA — this is a locally-generated placeholder for an unauthenticated demo session, not a record from any ledger. Say so explicitly if you mention any figure from it.";

export function demoAccountData(path: string): unknown | null {
  if (path.startsWith("/api/v1/history")) {
    return [
      {
        id: "filing-2025",
        assessmentYear: "2025-26",
        status: "processed",
        totalTax: 120000,
        filedAt: "2025-07-15T10:30:00Z",
        isDemoData: true,
        _disclosure: DEMO_DISCLOSURE,
      },
    ];
  }
  if (path.startsWith("/api/v1/documents")) {
    return [
      {
        id: "doc-form16",
        name: "Form 16 (Salary Certificate)",
        type: "form16",
        year: "2026-27",
        uploadedAt: "2026-05-10T09:00:00Z",
        isDemoData: true,
        _disclosure: DEMO_DISCLOSURE,
      },
      {
        id: "doc-capgains",
        name: "Capital Gains Statement (Brokerage)",
        type: "capital_gains_statement",
        year: "2026-27",
        uploadedAt: "2026-05-12T14:20:00Z",
        isDemoData: true,
        _disclosure: DEMO_DISCLOSURE,
      },
    ];
  }
  return null;
}

export async function backendGet(path: string, token: string | undefined): Promise<unknown> {
  if (!token) {
    return { error: "The user is not signed in, so this cannot be read. Ask them to sign in first." };
  }

  if (token.startsWith("mock-")) {
    const demo = demoAccountData(path);
    if (demo) return demo;
  }

  const base = process.env.AGENT_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      return { error: "The session has expired. Ask the user to sign in again." };
    }
    if (!res.ok) {
      return { error: `The backend answered HTTP ${res.status}.` };
    }
    return await res.json();
  } catch {
    return { error: "The backend could not be reached. It may not be running." };
  }
}

export function reviewReturn(ctx: AgentContext) {
  const breakdown = computeTax(taxInputFrom(ctx));
  const both = compareRegimes(taxInputFrom(ctx));
  const findings: string[] = [];

  const unclassified = ctx.facts.filter(
    (f) => f.kind === "capital_gains" && !f.capitalGains,
  );
  if (unclassified.length > 0) {
    findings.push(
      `Capital gains of Rs ${unclassified.reduce((s, f) => s + f.amount, 0)} are UNCLASSIFIED ` +
      `(no asset class / holding period) and are therefore taxed at slab rates — a documented ` +
      `simplification. Classifying them (equity with STT? held how long?) would apply the real ` +
      `s.111A/112A/112 rates and may change the outcome.`,
    );
  }
  if (breakdown.tdsCredits === 0 && ctx.facts.some((f) => f.kind === "salary")) {
    findings.push(
      "Salary income with ZERO tax deducted at source is unusual — a Form 16 or payslip almost " +
      "always shows TDS. If TDS was deducted but not entered, the refund is understated.",
    );
  }
  const better = both.new.totalTax <= both.old.totalTax ? "new" : "old";
  if (better !== ctx.regime) {
    findings.push(
      `The ${better} regime would cost Rs ${Math.min(both.new.totalTax, both.old.totalTax)} ` +
      `instead of Rs ${Math.max(both.new.totalTax, both.old.totalTax)} — the current choice ` +
      `(${ctx.regime}) is not the cheaper one for these figures.`,
    );
  }
  if (ctx.regime === "old" && !ctx.claims.some((c) => c.section === "80C")) {
    findings.push(
      "Old regime with no 80C claim: provident fund, life insurance or ELSS up to Rs 1,50,000 " +
      "would reduce taxable income if the user actually has such payments (do not invent them).",
    );
  }
  return {
    computed: {
      totalTax: breakdown.totalTax,
      refundOrDue: breakdown.refundOrDue,
      taxableIncome: breakdown.taxableIncome,
    },
    findings,
    findingsCount: findings.length,
  };
}

export async function runServerTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentContext,
): Promise<unknown> {
  switch (name) {
    case "compute_tax_ay2026":
      return executeComputeTaxAy2026(args as unknown as ComputeTaxAy2026Args);
    case "reconcile_fact":
      return executeReconcileFact(args as unknown as ReconcileFactArgs);
    case "predict_audit_risk":
      return executePredictAuditRisk(args as unknown as PredictAuditRiskArgs);
    case "generate_statutory_artifact":
      return executeGenerateStatutoryArtifact(args as unknown as GenerateStatutoryArtifactArgs);
    case "compute_current_tax":
      return computeTax(taxInputFrom(ctx));
    case "compare_regimes":
      return compareRegimes(taxInputFrom(ctx));
    case "hypothetical_tax": {
      const replace = (args.replaceFacts ?? []) as { kind: TaxInputFact["kind"]; amount: number }[];
      const facts: TaxInputFact[] = ctx.facts.map((f) => ({ ...f }));
      for (const o of replace) {
        const existing = facts.find((f) => f.kind === o.kind);
        if (existing) existing.amount = o.amount;
        else facts.push({ kind: o.kind, amount: o.amount });
      }
      return computeTax({
        facts,
        claims: ctx.claims,
        regime: (args.regime as "new" | "old") ?? ctx.regime,
        tdsCredits: ctx.tdsCredits,
      });
    }
    case "review_return":
      return reviewReturn(ctx);
    case "get_filing_history":
      return backendGet("/api/v1/history", ctx.sessionToken);
    case "list_documents":
      return backendGet("/api/v1/documents", ctx.sessionToken);
    default:
      return { error: `Tool ${name} is client-side or unknown.` };
  }
}

export function systemPrompt(ctx: AgentContext): string {
  const langName = languageOption(ctx.lang as any)?.english || "English";
  return [
    characterPrompt({ surface: "copilot", langEnglishName: langName, mode: ctx.mode, userName: ctx.userName }),
    "",
    `You are Munshi ji, Wapsi's munshi. You guide citizens through their Indian Income Tax Assessment Year 2026-27 (Financial Year 2025-26): review, dispute resolution, regime optimization and statutory filing.`,
    `When asked who you are or who named you Munshi ji, answer warmly as Munshi ji: Wapsi gave you this name in honour of India's traditional community munshis who kept family books and made tax calculations simple and transparent.`,
    "",
    `Citizen Session Context:`,
    `- Interface Language: ${langName} ("${ctx.lang}")`,
    `- Mode: ${ctx.mode === "simple" ? "Simple mode (plain words, no unexplained legal jargon — one idea per sentence)" : "Full detail mode (authoritative, precise statutory citations & complete derivations)"}`,
    ctx.userName ? `- Citizen Name: ${ctx.userName}` : "",
    ctx.pan ? `- Citizen PAN: ${ctx.pan}` : "",
    ctx.employer ? `- Employer / Deductor: ${ctx.employer}` : "",
    ctx.tdsCredits ? `- TDS Credits Deducted: ₹${ctx.tdsCredits.toLocaleString("en-IN")}` : "",
    ctx.regime ? `- Active Regime: ${ctx.regime === "new" ? "New Tax Regime (default u/s 115BAC)" : "Old Tax Regime"}` : "",
    ctx.facts && ctx.facts.length > 0 ? `- Known Facts on Record:\n${ctx.facts.map((f) => `  * ${f.kind}: ₹${f.amount.toLocaleString("en-IN")}${(f as any).source ? ` (${(f as any).source})` : ""}`).join("\n")}` : "",
    "",
    "### ANSWER STYLE (ANSWER EXACTLY AND IN CONTEXT)",
    "- Reply directly to the question asked, in context of the ongoing conversation.",
    "- If the question is in Hindi, Devanagari Hindi, Hinglish, or any regional language, respond naturally in that exact language.",
    "- For personal or identity questions ('mera naam kya hai', 'mere baare me kya jante ho', 'apne baare me bataiye', 'who named you'):",
    `  1. Address the citizen directly by name (${ctx.userName || "the taxpayer"}).`,
    `  2. Recite the known facts on record: PAN (${ctx.pan || "on file"}), employer (${ctx.employer || "reported employer"}), salary income, and TDS credits.`,
    "  3. Introduce yourself as Munshi ji, Wapsi's AI munshi, explaining your role and that you never file or pay without confirmation.",
    "  4. NEVER dump generic regime comparison tables or menus when the user asked a conversational or identity question.",
    "- For small talk or personal questions ('aapka naam', 'who named you', 'who are you'), reply naturally as Munshi ji without robotic formulas or canned overview menus.",
    "- For statutory or arithmetic questions, lead with the direct answer or figure, then give the clear explanation.",
    "- Never say 'as an AI' or 'as a language model'. You are Munshi ji.",
    "- Format money as ₹ with Indian grouping (e.g. ₹12,50,000), never 'Rs' or Western grouping.",
    "- Always invoke tools (`compute_tax_ay2026`) when calculating or comparing taxes; never invent tax figures.",
  ].filter(Boolean).join("\n");
}

export async function tryCallGemini(
  rawKey: string | undefined,
  model: string,
  system: string,
  contents: { role: string; parts: GeminiPart[] }[],
  disableTools = false,
  fetchImpl: typeof fetch = fetch,
): Promise<{ parts: GeminiPart[] } | { error: string }> {
  if (!rawKey || rawKey.includes("REPLACE_ME")) {
    return { error: "API key is not configured." };
  }

  let key = rawKey.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }

  const maxTokens = Number(process.env.AGENT_MAX_TOKENS_PER_REPLY || 2048);
  const timeoutMs = Number(process.env.AGENT_MODEL_TIMEOUT_MS || 5000);
  const isThinkingModel = !model.toLowerCase().includes("lite");

  try {
    const res = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          tools: disableTools ? undefined : [{ functionDeclarations: functionDeclarations() }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3,
            ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!res.ok) {
      if (res.status === 429 || res.status === 503) {
        markKeyCooldown(key, 45_000);
      }
      const body = await res.text();
      return { error: `Model call failed: HTTP ${res.status} ${body.slice(0, 300)}` };
    }
    const data = await res.json();
    markKeySuccess(key);
    const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
    return { parts };
  } catch (err) {
    markKeyCooldown(key, 30_000);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function callGemini(
  system: string,
  contents: { role: string; parts: GeminiPart[] }[],
  disableTools = false,
  fetchImpl: typeof fetch = fetch,
): Promise<{ parts: GeminiPart[] } | { error: string }> {
  const keys = getActiveGeminiKeys();

  if (keys.length === 0) {
    return { error: "API key is not configured." };
  }

  const primaryModel = process.env.AGENT_MODEL || "gemini-3.5-flash";
  const fallbackModel = process.env.AGENT_FALLBACK_MODEL || "gemini-3.5-flash-lite";

  let lastError = "";

  // 1. Try active keys with primary model
  for (const key of keys) {
    const result = await tryCallGemini(key, primaryModel, system, contents, disableTools, fetchImpl);
    if (!("error" in result)) {
      return result;
    }
    lastError = result.error;
  }

  // 2. Try with fallback model if distinct
  if (fallbackModel !== primaryModel) {
    for (const key of keys) {
      const result = await tryCallGemini(key, fallbackModel, system, contents, disableTools, fetchImpl);
      if (!("error" in result)) {
        return result;
      }
      lastError = result.error;
    }
  }

  return { error: lastError || "All Gemini API calls failed." };
}

export interface ExecuteCopilotOptions {
  ctx: AgentContext;
  messages: ChatMessage[];
  maxRounds?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Executes a full multi-turn copilot dialogue turn including tool calling loops.
 */
export async function executeCopilotConversation(opts: ExecuteCopilotOptions): Promise<CopilotResponse> {
  const { ctx, messages, maxRounds = 6, fetchImpl = fetch } = opts;
  const sys = systemPrompt(ctx);

  const contents: { role: string; parts: GeminiPart[] }[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : m.role,
    parts: [{ text: m.text }],
  }));

  const toolEvents: ToolEvent[] = [];
  const clientActions: ClientAction[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const result = await callGemini(sys, contents, false, fetchImpl);
    if ("error" in result) {
      return { reply: "", error: result.error, toolEvents, clientActions };
    }
    const calls = result.parts.filter((p) => p.functionCall);
    const text = result.parts.map((p) => p.text ?? "").join("").trim();

    if (calls.length === 0) {
      return { reply: text, toolEvents, clientActions };
    }

    contents.push({ role: "model", parts: result.parts });
    const responses: GeminiPart[] = [];
    for (const part of calls) {
      const call = part.functionCall!;
      const spec = toolByName(call.name);
      const args = call.args ?? {};
      let response: Record<string, unknown>;
      if (!spec) {
        response = { error: `Unknown tool ${call.name}` };
      } else if (spec.side === "client") {
        const action: ClientAction = { tool: call.name, args };
        if (call.name === "prepare_filing") {
          const breakdown = computeTax(taxInputFrom(ctx));
          action.summary = {
            totalTax: breakdown.totalTax,
            refundOrDue: breakdown.refundOrDue,
            taxableIncome: breakdown.taxableIncome,
            regime: ctx.regime,
          };
          response = {
            status: "prepared_awaiting_human_confirmation",
            figures: action.summary,
            note: "The confirmation card is on the user's screen. Filing happens only if they click confirm.",
          };
        } else {
          response = { status: "dispatched_to_user_screen" };
        }
        clientActions.push(action);
      } else {
        response = (await runServerTool(call.name, args, ctx)) as Record<string, unknown>;
        if (response === null || typeof response !== "object" || Array.isArray(response)) {
          response = { result: response };
        }
      }
      toolEvents.push({ tool: call.name, args, result: response });
      responses.push({ functionResponse: { name: call.name, response } });
    }
    contents.push({ role: "user", parts: responses });
  }

  // Final reply after tool rounds
  const finalResult = await callGemini(
    sys + "\n\nCRITICAL LIMITATION: You have reached the maximum allowed tool rounds. Do not try to invoke any tools. Formulate a final, correct, and helpful response to the user's questions as best as you can with the available data.",
    contents,
    true,
    fetchImpl,
  );
  if (!("error" in finalResult)) {
    const text = finalResult.parts.map((p) => p.text ?? "").join("").trim();
    return { reply: text, toolEvents, clientActions };
  }

  return {
    reply: "I could not finish within the allowed number of steps. Please try a narrower request.",
    toolEvents,
    clientActions,
  };
}

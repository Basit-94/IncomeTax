import { createHash } from "node:crypto";
import { retrieve, cite } from "./retrieval";
import { resolveQueryPeriod } from "./query";
import { PERIOD_FY_2025_26 } from "./provisions";
import { releaseHealth, TAX_RELEASE } from "./release";
import { stripInjection, redactText } from "../agentic/redact";
import type { TaxPeriod } from "./types";

export interface TaxAnswer {
  status: "grounded" | "no_evidence" | "unsupported_period" | "clarify_period" | "unsafe_query" | "unavailable";
  release: string;
  corpusHash: string;
  queryHash: string;
  period: TaxPeriod;
  /** Each text block is an exact stored paraphrase with its evidence id. */
  claims: { text: string; provisionId: string }[];
  citations: ReturnType<typeof cite>;
  text: string;
}

/** Local public RAG. Uploaded private documents never become legal sources or instructions. */
export function answerTaxQuestion(query: string, today: string, period = PERIOD_FY_2025_26): TaxAnswer {
  const clean = redactText(query.slice(0, 2000)).text;
  const resolved = resolveQueryPeriod(clean, period);
  const base = { release: TAX_RELEASE.id, corpusHash: TAX_RELEASE.corpusHash,
    queryHash: createHash("sha256").update(clean).digest("hex"), period: resolved.period };
  const stop = (status: TaxAnswer["status"], text: string): TaxAnswer => ({ ...base, status, text, claims: [], citations: [] });
  if (stripInjection(clean).suspicious) return stop("unsafe_query", "Please ask the tax question without instructions to override rules or sources.");
  if (releaseHealth(today) !== "ok") return stop("unavailable", "The tax source release needs revalidation. I cannot ground an answer in it yet.");
  if (resolved.ambiguous) return stop("clarify_period", "Please specify one income period as FY, AY or Tax Year; those labels can refer to different income periods.");
  if (resolved.period.financialYear !== "2025-26" || resolved.period.act !== "IT_ACT_1961")
    return stop("unsupported_period", `This release covers FY 2025-26 (AY 2026-27). It has no substantive rules for ${resolved.period.label}.`);
  const bundle = retrieve({ text: clean, period: resolved.period, limit: 3 });
  const primary = bundle.provisions.filter((p) => bundle.primaryIds?.includes(p.id));
  if (!primary.length) return stop("no_evidence", "I could not find evidence for that question in this tax release. Please name the tax topic or section; I will not infer a rule from an unrelated source.");
  const claims = primary.map((p) => ({ text: p.ruleText, provisionId: p.id }));
  const citations = cite(bundle.provisions.map((p) => p.id));
  const text = `FY 2025-26 · AY 2026-27 · source-based information (engineering draft)\n\n` +
    claims.map((c) => {
      const source = citations.find((s) => s.id === c.provisionId)!;
      return `${c.text}\nSource: ${source.title} — ${source.locator}`;
    }).join("\n\n");
  return { ...base, status: "grounded", claims, citations, text };
}

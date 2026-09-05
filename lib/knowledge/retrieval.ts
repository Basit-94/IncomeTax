/**
 * Retrieval over the public corpus (plan.md §5.6): identify the period →
 * filter by Act/version → exact section + keyword search → expand linked
 * definitions and exceptions → supply an evidence bundle.
 *
 * This is the deterministic half of the hybrid design. Semantic retrieval
 * (§5.7: PostgreSQL text search or a vector extension, a multilingual embedding
 * benchmark) needs infrastructure that is not configured in this deployment;
 * the interface below is what it plugs into. Attribute filters that cannot be
 * evaluated because a fact is unknown RETAIN the candidate and record what is
 * missing — filtering on an unknown would silently drop the rule a question
 * should have surfaced.
 */

import { KNOWLEDGE_RELEASE } from "../agentic/flags";
import { PROVISIONS, provisionById } from "./provisions";
import type { EvidenceBundle, IncomeHead, LegalProvision, TaxPeriod, TaxpayerCategory } from "./types";

export interface RetrievalQuery {
  text: string;
  period: TaxPeriod;
  category?: TaxpayerCategory;
  incomeHeads?: IncomeHead[];
  /** Exact sections to pull regardless of keyword score, e.g. ["87A"]. */
  sections?: string[];
  limit?: number;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}().%-]+/gu, " ")
    .split(" ")
    .filter((t) => t.length > 1);
}

/** Simple lexical score: exact section hit, then keyword and title/summary overlap. */
export function scoreProvision(p: LegalProvision, query: RetrievalQuery): number {
  const q = tokens(query.text);
  if (q.length === 0 && !query.sections?.length) return 0;
  let score = 0;
  const sectionKey = `${p.section}${p.subsection ?? ""}`.toLowerCase();
  if (query.sections?.some((s) => s.toLowerCase() === sectionKey || s.toLowerCase() === p.section.toLowerCase())) score += 10;
  if (q.includes(sectionKey) || q.includes(p.section.toLowerCase())) score += 6;
  const kw = p.keywords.map((k) => k.toLowerCase());
  for (const t of q) {
    if (kw.includes(t)) score += 3;
    else if (kw.some((k) => k.includes(t) && t.length > 3)) score += 1.5;
  }
  const prose = tokens(`${p.title} ${p.summary}`);
  for (const t of q) if (prose.includes(t)) score += 1;
  return score;
}

export function retrieve(query: RetrievalQuery): EvidenceBundle {
  const limit = query.limit ?? 5;
  const retainedForMissing: EvidenceBundle["retainedForMissing"] = [];

  const candidates = PROVISIONS.filter((p) => {
    // Version filter: the period's Act and financial year. Always known.
    if (p.act !== query.period.act && p.id !== "transition:1961-to-2025") return false;
    if (!p.financialYears.includes(query.period.financialYear)) return false;
    return true;
  }).filter((p) => {
    // Attribute filters retain, rather than drop, when the attribute is unknown.
    const missing: string[] = [];
    if (query.category === undefined) missing.push("taxpayer category");
    else if (!p.categories.includes(query.category)) return false;
    if (query.incomeHeads === undefined) missing.push("income heads");
    else if (!p.incomeHeads.some((h) => query.incomeHeads!.includes(h))) return false;
    if (missing.length) retainedForMissing.push({ provision: p, missing });
    return true;
  });

  const scored = candidates
    .map((p) => ({ p, score: scoreProvision(p, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);

  // A period this release has no reviewed rules for must still return the
  // note that says so, or an empty bundle would read as "nothing applies".
  const transition = provisionById("transition:1961-to-2025");
  if (query.period.act === "IT_ACT_2025" && transition && !scored.includes(transition)) scored.push(transition);

  // Expand linked provisions one hop: a deduction without its regime exception is not evidence.
  const expanded = new Map<string, LegalProvision>();
  for (const p of scored) {
    expanded.set(p.id, p);
    for (const id of p.linked) {
      const l = provisionById(id);
      if (l && l.financialYears.includes(query.period.financialYear)) expanded.set(l.id, l);
    }
  }

  return {
    release: KNOWLEDGE_RELEASE,
    period: query.period,
    query: query.text,
    provisions: [...expanded.values()],
    retainedForMissing: retainedForMissing.filter((r) => expanded.has(r.provision.id)),
  };
}

/** Citations for a recommendation: id, title, locator, URL — what the Sources panel shows. */
export function cite(ids: string[]): { id: string; title: string; locator: string; url: string; section: string }[] {
  return ids
    .map(provisionById)
    .filter((p): p is LegalProvision => !!p)
    .map((p) => ({ id: p.id, title: p.title, locator: p.locator, url: p.sourceUrl, section: `s.${p.section}${p.subsection ?? ""}` }));
}

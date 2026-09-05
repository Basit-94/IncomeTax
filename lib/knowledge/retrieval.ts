import { KNOWLEDGE_RELEASE } from "../agentic/flags";
import { PROVISIONS, provisionById } from "./provisions";
import { expandQuery, tokens, normalize, explicitSections } from "./query";
import type { EvidenceBundle, IncomeHead, LegalProvision, TaxPeriod, TaxpayerCategory } from "./types";

export interface RetrievalQuery {
  text: string;
  period: TaxPeriod;
  category?: TaxpayerCategory;
  incomeHeads?: IncomeHead[];
  sections?: string[];
  limit?: number;
}

const documentTokens = (p: LegalProvision) => tokens(p.title + " " + p.summary + " " + p.ruleText + " " + p.keywords.join(" "));
const documents = PROVISIONS.map(documentTokens);
const averageLength = documents.reduce((n, d) => n + d.length, 0) / documents.length;

/** BM25 plus exact sections and phrases. Ranking scores are not confidence probabilities. */
export function scoreProvision(p: LegalProvision, query: RetrievalQuery): number {
  const expanded = expandQuery(query.text);
  const terms = [...new Set(tokens(expanded))];
  const key = normalize(p.section + (p.subsection ?? ""));
  const requested = [...(query.sections ?? []), ...explicitSections(expanded)].map(normalize);
  let score = requested.includes(key) ? 100 : 0;
  const doc = documentTokens(p);
  for (const term of terms) {
    const tf = doc.filter((t) => t === term).length;
    if (!tf) continue;
    const df = documents.filter((d) => d.includes(term)).length;
    const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
    score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * doc.length / averageLength));
  }
  if (p.keywords.some((kw) => kw.includes(" ") && (" " + expanded + " ").includes(" " + normalize(kw) + " "))) score += 5;
  return score;
}

export function retrieve(query: RetrievalQuery): EvidenceBundle {
  const limit = Number.isFinite(query.limit) ? Math.max(1, Math.min(8, Math.floor(query.limit!))) : 4;
  const compatible = (p: LegalProvision) =>
    !p.supersededBy && (p.act === query.period.act || p.id === "transition:1961-to-2025") &&
    p.financialYears.includes(query.period.financialYear) &&
    (query.category === undefined || p.categories.includes(query.category));
  const ranked = PROVISIONS.filter(compatible)
    .filter((p) => !query.incomeHeads || p.incomeHeads.some((h) => query.incomeHeads!.includes(h)))
    .map((p) => ({ p, score: scoreProvision(p, query) }))
    .filter((r) => r.score >= 1.2)
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))
    .slice(0, limit);
  const primaryIds = ranked.map((r) => r.p.id);
  if (query.period.act === "IT_ACT_2025") {
    const transition = provisionById("transition:1961-to-2025")!;
    return { release: KNOWLEDGE_RELEASE, period: query.period, query: query.text,
      provisions: [transition], primaryIds: [transition.id], retainedForMissing: [] };
  }
  const expanded = new Map(ranked.map((r) => [r.p.id, r.p]));
  for (const { p } of ranked) for (const id of p.linked) {
    const linked = provisionById(id);
    if (linked && compatible(linked)) expanded.set(id, linked);
  }
  const provisions = [...expanded.values()];
  const missing = [query.category === undefined ? "taxpayer category" : "", query.incomeHeads === undefined ? "income heads" : ""].filter(Boolean);
  return { release: KNOWLEDGE_RELEASE, period: query.period, query: query.text, primaryIds, provisions,
    retainedForMissing: missing.length ? provisions.map((provision) => ({ provision, missing })) : [] };
}

export function cite(ids: string[]) {
  return [...new Set(ids)].map(provisionById).filter((p): p is LegalProvision => !!p)
    .map((p) => ({ id: p.id, title: p.title, locator: p.locator, url: p.sourceUrl,
      section: "s." + p.section + (p.subsection ?? ""), reviewer: p.reviewer, reviewedOn: p.reviewedOn,
      contentHash: p.contentHash, sourceKind: p.sourceKind }));
}

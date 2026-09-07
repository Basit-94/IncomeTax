"use client";

/**
 * "This year's papers" — the Manual shell's first card of the facts step (2026-09-07, papers-first
 * v2). The same yearly fetch the agent runs, rendered as a card: DigiLocker (mock) behind a consent
 * card listing this year's documents, or the existing PDF dropzone passed in as children. Fetched
 * documents are handed back with their fields so the page stages `import_document` exactly as the
 * agent does. Handoff tokens: glass card, Munshi ji 34, accent-soft consent, ok-soft result.
 */

import { useState, type ReactNode } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { ExtractedFields } from "../../lib/compliance/pdfExtract";
import { formatMoney } from "../../lib/money";
import type { Lang } from "../../lib/types";
import { MunshiAvatar } from "../brand/munshi";
import { localize } from "../mock-i18n";

export interface FetchedDocument {
  id: string | null;
  docType: "FORM_16" | "ANNUAL_INFO_STATEMENT" | string;
  title: string;
  issuer: string;
  sample: boolean;
  fields: ExtractedFields;
}

interface YearPapersCardProps {
  lang: Lang;
  assessmentYear: string;
  /** The profile linked DigiLocker at onboarding — the fetch is offered first and as one tap. */
  linked: boolean;
  /** Already fetched this year: the card shows what was read instead of offering the fetch again. */
  fetched?: FetchedDocument[];
  onFetched: (documents: FetchedDocument[]) => void;
  children?: ReactNode;
}

export default function YearPapersCard({ lang, assessmentYear, linked, fetched, onFetched, children }: YearPapersCardProps) {
  const [phase, setPhase] = useState<"idle" | "consent" | "fetching" | "error">("idle");
  /** The catalogue being pulled, ticking off as each document arrives (2026-09-07). */
  const [pulling, setPulling] = useState<{ title: string; done: boolean }[]>([]);
  // "2026-27" → "2025-26"
  const fy = `${Number(assessmentYear.slice(0, 4)) - 1}-${String(Number(assessmentYear.slice(5)) - 1).padStart(2, "0")}`;
  const L = (s: string) => localize(s, lang);

  const fetchNow = async () => {
    setPhase("fetching");
    try {
      const cat = await fetch(`/api/digilocker/documents?assessmentYear=${assessmentYear}&scope=year`, { credentials: "same-origin" });
      const catalogue = cat.ok ? ((await cat.json()) as { documents: { title: string }[] }).documents : [];
      setPulling(catalogue.map((d) => ({ title: d.title, done: false })));
      const res = await fetch("/api/digilocker", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessmentYear, scope: "year" }) });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { ok: boolean; documents: FetchedDocument[] };
      for (let i = 0; i < Math.max(catalogue.length, 1); i += 1) {
        await new Promise((r) => setTimeout(r, 450));
        setPulling((list) => list.map((d, idx) => (idx === i ? { ...d, done: true } : d)));
      }
      onFetched(body.documents);
      setPhase("idle");
    } catch {
      setPhase("error");
    }
  };

  if (fetched?.length) {
    return (
      <div className="rounded-[24px] bg-ok-soft p-4 text-start space-y-2 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-ok text-white"><CheckCircle2 size={18} /></div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-ink">{L("This year's papers, read from DigiLocker")}</p>
            <p className="text-[11px] text-ink-2">{fetched.map((d) => d.title).join(" · ")}</p>
          </div>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2 text-[12px] text-ink-2">
          {fetched.flatMap((d) => {
            const f = d.fields;
            const rows: string[] = [];
            if (f.grossSalary !== undefined) rows.push(`${L("Salary")} · ${formatMoney(f.grossSalary, lang)}`);
            if (f.tds !== undefined) rows.push(`TDS · ${formatMoney(f.tds, lang)}`);
            for (const e of f.exemptAllowances ?? []) rows.push(`u/s ${e.section} · ${formatMoney(e.amount, lang)}`);
            for (const r of f.otherIncome ?? []) rows.push(`${r.reporter} · ${formatMoney(r.amount, lang)}`);
            if (f.ltcg112A) rows.push(`LTCG 112A · ${formatMoney(f.ltcg112A.gain, lang)}`);
            return rows;
          }).map((row) => <li key={row} className="font-mono tabular-nums truncate">{row}</li>)}
        </ul>
        {fetched.some((d) => d.sample) && <p className="text-[11px] text-ink-3">{L("Sample figures from the DigiLocker mock, not real records.")}</p>}
      </div>
    );
  }

  return (
    <div className="glass rounded-[24px] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0"><MunshiAvatar size={34} state={phase === "fetching" ? "working" : "explaining"} /></span>
        <div className="min-w-0 space-y-1">
          <p className="text-[15px] font-extrabold text-ink tracking-[-0.01em]">{L("This year's papers")}</p>
          <p className="text-[13px] text-ink-2 leading-relaxed">{L("Form 16 and AIS for FY")} {fy}. {L("Read once, with your permission — then Munshi ji asks only what they can't answer.")}</p>
        </div>
      </div>

      {phase === "fetching" ? (
        <ul className="rounded-[18px] bg-amber-bg p-4 space-y-1.5 text-[13px] text-amber-ink" role="status" aria-live="polite">
          <li className="font-semibold">{L("Pulling from DigiLocker…")}</li>
          {(pulling.length ? pulling : [{ title: `Form 16 — FY ${fy}`, done: false }, { title: `Annual Information Statement — FY ${fy}`, done: false }]).map((d) => (
            <li key={d.title} className="flex items-center gap-2">
              <span className={`inline-flex size-4 items-center justify-center rounded-full ${d.done ? "bg-ok text-white" : "border border-amber-ink/40 text-transparent"}`} aria-hidden="true"><CheckCircle2 size={10} /></span>
              <span className={d.done ? "" : "opacity-80"}>{d.title}</span>
            </li>
          ))}
        </ul>
      ) : phase === "consent" ? (
        <div className="rounded-[18px] bg-amber-bg p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-ink font-bold text-sm"><ShieldCheck size={16} aria-hidden="true" /> {L("Fetch these from DigiLocker?")}</div>
          <ul className="space-y-1 text-sm text-amber-ink/90">
            <li>· Form 16 — FY {fy}</li>
            <li>· Annual Information Statement — FY {fy}</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => void fetchNow()} className="btn-primary rounded-[14px] h-[46px] px-5 text-[14.5px] cursor-pointer">{L("Yes, fetch these")}</button>
            <button type="button" onClick={() => setPhase("idle")} className="glass-flat rounded-[14px] h-[46px] px-4 text-[14.5px] font-semibold text-ink-2 hover:text-ink cursor-pointer">{L("Not now")}</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <button type="button" onClick={() => setPhase("consent")} className={`text-start rounded-[18px] border-[1.5px] px-4 py-3.5 transition-colors cursor-pointer ${linked ? "border-money bg-amber-bg text-amber-ink" : "border-glass-edge glass-flat text-ink hover:border-money/50"}`}>
            <span className="block text-sm font-semibold">{L("Fetch from DigiLocker")}</span>
            <span className="mt-1 block text-xs opacity-80">{linked ? L("Linked at onboarding — one tap") : L("You approve the list first")}</span>
          </button>
          <div className="min-w-0">{children}</div>
        </div>
      )}
      {phase === "error" && <p className="text-xs font-semibold text-alarm">{L("DigiLocker did not answer. Upload the PDF instead, or type the figures below.")}</p>}
    </div>
  );
}

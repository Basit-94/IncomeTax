"use client";

/**
 * Two versions of one return, side by side (redesigned 2026-09-08). The engine cross-checks both
 * (`/api/ca/reviews/[code]/compare`): the column it recommends is highlighted, its reasons and the flags it raised
 * are listed, the CA's inline comments sit beside the rows they were left on, and Munshi ji says in a sentence or
 * two which way he would go. Before a version comes back, the same modal shows where the request stands and any
 * comments the CA has already left.
 */

import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Award, Check, CheckCircle2, Info, MessageSquare, ShieldAlert, Sparkles, X } from "lucide-react";
import type { Lang, Persona } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { computeForPersona } from "@/lib/return/compute";
import { acceptCAReview, type CAReviewRecord } from "@/lib/ca/ca-store";
import { compareReturns, type ReviewComparison } from "@/lib/ca/compare";
import { reviewApi, reviewStatusLabel, type PublicReview } from "@/lib/ca/client";
import type { ReviewComment } from "@/lib/ca/server-store";
import { MunshiAvatar } from "../brand/munshi";

interface CAComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CAReviewRecord;
  lang?: Lang;
  onAdopt: (newPersona: Persona, newRegime: "new" | "old") => void;
}

const ROWS: { key: keyof ReviewComparison["original"]; label: string; anchor: string; money?: boolean }[] = [
  { key: "regime", label: "Regime", anchor: "regime" },
  { key: "grossIncome", label: "Gross total income", anchor: "income:salary", money: true },
  { key: "deductions", label: "Deductions (Chapter VI-A)", anchor: "deduction:80C", money: true },
  { key: "taxableIncome", label: "Taxable income", anchor: "summary", money: true },
  { key: "totalTax", label: "Total tax", anchor: "summary", money: true },
  { key: "tdsCredits", label: "TDS / tax already paid", anchor: "taxPaid:tds", money: true },
  { key: "refundOrDue", label: "Net refund / (due)", anchor: "summary", money: true },
];

export default function CAComparisonModal({ isOpen, onClose, record, lang = "en", onAdopt }: CAComparisonModalProps) {
  const [busy, setBusy] = useState(false);
  const [comparison, setComparison] = useState<ReviewComparison | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reviewed = !!record.caPersona && (record.status === "reviewed" || record.status === "accepted");

  useEffect(() => {
    if (!isOpen) return;
    setNarrative(null);
    // Same arithmetic locally first so the table is instant; the server adds the flags' provenance, the comments and Munshi ji's line.
    if (reviewed) setComparison(compareReturns(record.originalPersona, record.originalRegime, record.caPersona!, record.caRegime ?? record.originalRegime));
    else setComparison(null);
    setLoading(true);
    (reviewed ? reviewApi.compare(record.code).then((r) => { setComparison(r.comparison); setComments(r.comments); setNarrative(r.narrative); }) : reviewApi.comments(record.code).then((r) => setComments(r.comments)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isOpen, record, reviewed]);

  if (!isOpen || !record) return null;

  const adopt = async () => {
    if (!record.caPersona) return;
    setBusy(true);
    try {
      await acceptCAReview(record.code);
      await reviewApi.decide(record.code, true).catch(() => undefined);
    } finally {
      onAdopt(record.caPersona, record.caRegime ?? record.originalRegime);
      setBusy(false);
      onClose();
    }
  };
  const keepMine = async () => {
    await reviewApi.decide(record.code, false).catch(() => undefined);
    onClose();
  };

  const pick = comparison?.recommendation.pick ?? "either";
  const commentsFor = (anchor: string) => comments.filter((c) => c.anchor === anchor || (anchor === "summary" && c.anchor === "summary"));
  const orphanComments = comments.filter((c) => !ROWS.some((r) => r.anchor === c.anchor) && !comparison?.changes.some((ch) => ch.anchor === c.anchor));
  const cell = (v: number | string, money?: boolean) => (typeof v === "number" && money ? formatMoney(v, lang) : String(v));
  const originalB = computeForPersona(record.originalPersona, record.originalRegime);
  const status = reviewStatusLabel(record as unknown as PublicReview);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Compare the two versions">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-paper border border-line rounded-3xl shadow-glass overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-ink-surface px-6 py-5 text-on-ink shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-bg border border-money/40 text-money"><Award size={22} /></div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">{reviewed ? "Your version and the CA's" : "Your CA review"}</h3>
              <p className="text-xs text-money/80 mt-0.5">{reviewed ? `Reviewed by ${record.caDetails?.name ?? (record as unknown as PublicReview).claimedByCaName ?? "a Chartered Accountant"}${record.caDetails?.membershipNo ? ` · ICAI ${record.caDetails.membershipNo}` : ""}` : status}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-on-ink/70 hover:text-on-ink transition cursor-pointer" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!reviewed && (
            <div className="space-y-4">
              <div className="p-4 bg-paper-2 border border-line rounded-2xl flex items-start gap-3">
                <span className="mt-1 size-2.5 rounded-full bg-money animate-ping shrink-0" />
                <div className="text-sm text-ink-2"><p className="font-bold text-ink">{status}</p><p className="text-xs mt-1">Request {record.code} · sent {new Date(record.createdAt).toLocaleString("en-IN")}. Your return as it stands: {originalB.refundOrDue >= 0 ? `refund ${formatMoney(originalB.refundOrDue, lang)}` : `${formatMoney(-originalB.refundOrDue, lang)} due`} on the {record.originalRegime} regime.</p></div>
              </div>
              {comments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 font-mono">Comments so far</h4>
                  {comments.map((c) => <CommentLine key={c.id} c={c} />)}
                </div>
              )}
            </div>
          )}

          {reviewed && comparison && (
            <>
              {/* Munshi ji's read */}
              <div className="flex items-start gap-3 p-4 bg-amber-bg border border-money/40 rounded-2xl">
                <MunshiAvatar size={36} state="explaining" />
                <div className="text-sm text-ink leading-relaxed">
                  {narrative ?? (
                    <>
                      <span className="font-bold">{pick === "ca" ? "The CA's version holds up." : pick === "original" ? "Your version is the one to file." : "Both land in the same place."}</span> {comparison.recommendation.reasons.join(" ")}
                      {loading && <span className="text-ink-3 text-xs"> …checking with Munshi ji</span>}
                    </>
                  )}
                </div>
              </div>

              {record.caNotes && (
                <div className="p-4 bg-paper-2 border border-line rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-2"><MessageSquare size={14} /><span>From the CA</span></div>
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{record.caNotes}</p>
                </div>
              )}

              {/* The two columns; the engine's pick is highlighted */}
              <div className="border border-line rounded-2xl overflow-x-auto bg-paper">
                <table className="w-full text-xs text-left min-w-[560px]">
                  <thead className="bg-paper-2 border-b border-line font-bold text-ink-2">
                    <tr>
                      <th className="p-3">Line</th>
                      <th className={`p-3 text-right ${pick === "original" ? "bg-ok-soft text-ok-ink" : ""}`}>Your version{pick === "original" && <RecommendedPill />}</th>
                      <th className={`p-3 text-right ${pick === "ca" ? "bg-ok-soft text-ok-ink" : "text-money"}`}>CA version{pick === "ca" && <RecommendedPill />}</th>
                      <th className="p-3 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono">
                    {ROWS.map((r) => {
                      const o = comparison.original[r.key];
                      const c = comparison.ca[r.key];
                      const changed = o !== c;
                      const diff = typeof o === "number" && typeof c === "number" ? c - o : null;
                      const rowComments = commentsFor(r.anchor);
                      return (
                        <React.Fragment key={r.key}>
                          <tr className={r.key === "refundOrDue" ? "bg-paper-2 font-bold text-sm" : ""}>
                            <td className="p-3 font-sans font-medium text-ink">{r.label}{rowComments.length > 0 && <span className="ms-2 inline-flex items-center gap-1 text-[10px] text-money"><MessageSquare size={11} />{rowComments.length}</span>}</td>
                            <td className={`p-3 text-right ${pick === "original" ? "bg-ok-soft/40" : ""} ${r.key === "refundOrDue" ? (Number(o) >= 0 ? "text-money" : "text-alarm") : "text-ink-2"}`}>{cell(o, r.money)}</td>
                            <td className={`p-3 text-right font-bold ${pick === "ca" ? "bg-ok-soft/40" : ""} ${r.key === "refundOrDue" ? (Number(c) >= 0 ? "text-money" : "text-alarm") : "text-ink"}`}>{cell(c, r.money)}</td>
                            <td className="p-3 text-right font-sans">{!changed ? <span className="text-ink-3">Same</span> : diff === null ? <span className="text-ink-2">Changed</span> : <span className={diff > 0 === (r.key !== "totalTax" && r.key !== "taxableIncome") ? "text-ok-ink font-bold" : "text-warn font-bold"}>{diff > 0 ? "+" : "−"}{formatMoney(Math.abs(diff), lang)}</span>}</td>
                          </tr>
                          {rowComments.map((cm) => (
                            <tr key={cm.id} className="bg-amber-bg/40"><td colSpan={4} className="px-3 py-2"><CommentLine c={cm} /></td></tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Row-level changes the CA made */}
              {comparison.changes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 font-mono">What the CA changed</h4>
                  <ul className="space-y-1.5">
                    {comparison.changes.map((ch) => {
                      const cs = comments.filter((c) => c.anchor === ch.anchor && !ROWS.some((r) => r.anchor === ch.anchor));
                      return (
                        <li key={ch.anchor} className="rounded-xl border border-line bg-paper-2 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between gap-3"><span className="font-semibold text-ink">{ch.label}</span><span className="font-mono text-ink-2">{typeof ch.from === "number" ? formatMoney(ch.from, lang) : ch.from} <ArrowRight size={11} className="inline mx-1 text-ink-3" /> <span className="font-bold text-ink">{typeof ch.to === "number" ? formatMoney(ch.to, lang) : ch.to}</span></span></div>
                          {cs.map((c) => <div key={c.id} className="mt-1.5"><CommentLine c={c} /></div>)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Flags */}
              {comparison.flags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 font-mono">Cross-checks</h4>
                  {comparison.flags.map((f, i) => (
                    <div key={i} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs border ${f.severity === "risk" ? "bg-alarm/10 border-alarm/30 text-ink" : f.severity === "warn" ? "bg-amber-bg border-money/30 text-ink" : "bg-paper-2 border-line text-ink-2"}`}>
                      {f.severity === "risk" ? <ShieldAlert size={15} className="text-alarm shrink-0 mt-0.5" /> : f.severity === "warn" ? <AlertTriangle size={15} className="text-money shrink-0 mt-0.5" /> : <Info size={15} className="text-ink-3 shrink-0 mt-0.5" />}
                      <span className="leading-relaxed">{f.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {orphanComments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3 font-mono">Other comments</h4>
                  {orphanComments.map((c) => <CommentLine key={c.id} c={c} />)}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-line bg-paper-2 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={reviewed ? keepMine : onClose} className="px-4 py-2.5 border border-line rounded-xl text-ink-2 hover:text-ink hover:bg-paper text-xs font-bold transition cursor-pointer">{reviewed ? "Keep my version" : "Close"}</button>
          {reviewed && (
            <button type="button" onClick={adopt} disabled={busy} className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-60 ${pick === "ca" ? "btn-primary" : "ink-surface text-white"}`}>
              {pick === "ca" ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
              <span>{pick === "ca" ? "Adopt the CA's version and proceed" : "Adopt the CA's version anyway"}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendedPill() {
  return <span className="ms-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-ok text-white text-[9.5px] font-extrabold uppercase tracking-wider align-middle"><Check size={9} />Recommended</span>;
}

function CommentLine({ c }: { c: ReviewComment }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <MessageSquare size={13} className="text-money shrink-0 mt-0.5" />
      <div className="min-w-0"><span className="font-bold text-ink">{c.author.name}</span><span className="text-ink-3"> · {new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><p className="text-ink leading-relaxed mt-0.5 whitespace-pre-wrap">{c.text}</p></div>
    </div>
  );
}

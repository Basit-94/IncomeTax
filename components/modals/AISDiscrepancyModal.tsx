"use client";

/**
 * The pre-audit scrutiny modal. It opens the moment a citizen reduces a
 * pre-filled AIS / 26AS figure by more than 20% — the documented CASS
 * selection trigger — and will not let the reduction into the ledger until it
 * is bound to one of the five CBDT feedback codes. CODE_2 ("not fully
 * correct") additionally needs the citizen's explanation, and offers a proof
 * slot; CODE_1 ("correct") withdraws the reduction and keeps the department's
 * figure, which the modal says out loud before the button is pressed.
 *
 * The attachment is MOCK: the file picker is real so the gesture is the real
 * one, but only the file name is kept. Nothing is uploaded.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Paperclip, Radar, X } from "lucide-react";
import type { Lang } from "@/lib/types";
import type { AISDiscrepancyAttribution, AISFeedbackCode, AISItem, AISVariance, CBDTFeedbackOption } from "@/types/tax";
import {
  AIS_FEEDBACK_CODES,
  AIS_FEEDBACK_HELP,
  AIS_FEEDBACK_LABELS,
  AIS_FEEDBACK_REQUIRES_EXPLANATION,
} from "@/lib/compliance/aisFeedback";
import { CASS_VARIANCE_THRESHOLD } from "@/lib/compliance/cass";
import { formatMoney } from "@/lib/money";
import { localize } from "@/components/mock-i18n";

/** The five codes with the modal's rendering metadata, derived from the single-source table. */
export const CBDT_FEEDBACK_OPTIONS: readonly CBDTFeedbackOption[] = AIS_FEEDBACK_CODES.map((code) => ({
  code,
  label: AIS_FEEDBACK_LABELS[code],
  help: AIS_FEEDBACK_HELP[code],
  requiresExplanation: AIS_FEEDBACK_REQUIRES_EXPLANATION[code],
  keepsReportedFigure: code === "CODE_1",
}));

const spring = { type: "spring" as const, stiffness: 320, damping: 28, mass: 0.7 };

export interface AISDiscrepancyModalProps {
  open: boolean;
  item: Pick<AISItem, "id" | "label" | "reporter" | "statement"> | null;
  variance: AISVariance | null;
  /** The code the citizen already chose upstream, if any; pre-selected here. */
  initialCode?: AISFeedbackCode;
  lang: Lang;
  onConfirm: (attribution: AISDiscrepancyAttribution) => void;
  onCancel: () => void;
}

export default function AISDiscrepancyModal({ open, item, variance, initialCode, lang, onConfirm, onCancel }: AISDiscrepancyModalProps) {
  const L = (s: string) => localize(s, lang);
  const [code, setCode] = useState<AISFeedbackCode>(initialCode ?? "CODE_2");
  const [explanation, setExplanation] = useState("");
  const [proofName, setProofName] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset on every open: a stale explanation from the last row must never ride on this one.
  useEffect(() => {
    if (open) {
      setCode(initialCode ?? "CODE_2");
      setExplanation("");
      setProofName(undefined);
    }
  }, [open, initialCode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const option = useMemo(() => CBDT_FEEDBACK_OPTIONS.find((o) => o.code === code) ?? CBDT_FEEDBACK_OPTIONS[1], [code]);
  const explanationOk = !option.requiresExplanation || explanation.trim().length >= 10;
  const canConfirm = Boolean(item && variance) && explanationOk;

  const confirm = () => {
    if (!item || !variance || !canConfirm) return;
    onConfirm({
      factId: item.id,
      code,
      preFilled: variance.preFilled,
      declared: option.keepsReportedFigure ? variance.preFilled : variance.declared,
      varianceBp: variance.varianceBp,
      explanation: explanation.trim(),
      proofName,
      at: new Date().toISOString(),
    });
  };

  const thresholdPct = Math.round(CASS_VARIANCE_THRESHOLD * 100);

  return (
    <AnimatePresence>
      {open && item && variance && (
        <m.div
          key="ais-discrepancy-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6 print:hidden"
          onClick={onCancel}
          role="presentation"
        >
          <m.div
            key="ais-discrepancy-panel"
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ais-discrepancy-title"
            data-testid="ais-discrepancy-modal"
            className="w-full max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-[6px] border border-line bg-paper-2 shadow-[var(--shadow-d13-hi)] sm:rounded-[6px]"
          >
            {/* Header with the scrutiny badge — first thing the eye lands on. */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper-2/95 px-6 py-5 backdrop-blur">
              <div className="space-y-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-alarm/50 bg-alarm-soft px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-alarm"
                  data-testid="cass-scrutiny-badge"
                >
                  <Radar size={12} aria-hidden="true" />
                  {L("CASS scrutiny trigger warning")}
                </span>
                <h2 id="ais-discrepancy-title" className="text-lg font-semibold leading-tight text-ink">
                  {L(`Variance exceeds ${thresholdPct}% of department records.`)}
                </h2>
                <p className="text-sm text-ink-2">
                  {L("Bind this change to the department's own feedback code so it travels with your return instead of arriving as a notice later.")}
                </p>
              </div>
              <button type="button" onClick={onCancel} aria-label={L("Close")} className="shrink-0 rounded p-2 text-ink-2 hover:bg-paper">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* The row and the arithmetic, in mono. */}
              <dl className="grid gap-x-6 gap-y-3 rounded-[4px] border border-line bg-paper p-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{L("Row")}</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {L(item.label)} <span className="font-normal text-ink-2">· {item.reporter} · {item.statement}</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{L("Department reported")}</dt>
                  <dd className="font-mono text-base font-semibold tabular-nums text-ink">{formatMoney(variance.preFilled, lang)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{L("You declare")}</dt>
                  <dd className="font-mono text-base font-semibold tabular-nums text-ink">{formatMoney(variance.declared, lang)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{L("Variance")}</dt>
                  <dd className="font-mono text-base font-semibold tabular-nums text-alarm" data-testid="ais-variance">
                    {variance.variancePercent.toFixed(2)}%
                  </dd>
                </div>
              </dl>

              {/* The five codes. */}
              <fieldset className="space-y-2">
                <legend className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{L("CBDT feedback code")}</legend>
                {CBDT_FEEDBACK_OPTIONS.map((o) => {
                  const selected = o.code === code;
                  return (
                    <label
                      key={o.code}
                      data-code={o.code}
                      className={`flex cursor-pointer items-start gap-3 rounded-[4px] border px-4 py-3 transition-colors ${
                        selected ? "border-money bg-money-soft" : "border-line bg-paper hover:border-ink-3"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cbdt-code"
                        value={o.code}
                        checked={selected}
                        onChange={() => setCode(o.code)}
                        className="mt-1 accent-[var(--primary-accent)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-xs text-ink-3">{o.code}</span>
                          <span className="text-sm font-semibold text-ink">{L(o.label)}</span>
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{L(o.help)}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              {option.keepsReportedFigure && (
                <p className="rounded-[4px] border-l-4 border-[var(--d13-amber)] bg-[var(--d13-amber-bg)] px-4 py-3 text-sm text-ink" role="status">
                  {L("Choosing this keeps the department's figure of")}{" "}
                  <span className="font-mono font-semibold tabular-nums">{formatMoney(variance.preFilled, lang)}</span>{" "}
                  {L("on your return. Your reduction is withdrawn.")}
                </p>
              )}

              {/* Explanation: required for CODE_2, optional otherwise. */}
              {!option.keepsReportedFigure && (
                <div className="space-y-2">
                  <label htmlFor="ais-explanation" className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                    <span>{L("Your explanation")}</span>
                    <span>{option.requiresExplanation ? L("required · at least 10 characters") : L("optional")}</span>
                  </label>
                  <textarea
                    id="ais-explanation"
                    rows={3}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={L("What the correct position is, and which document shows it")}
                    data-testid="ais-explanation"
                    className="w-full resize-none rounded-[4px] border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-money"
                  />
                  {option.requiresExplanation && (
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={fileRef}
                        type="file"
                        className="sr-only"
                        onChange={(e) => setProofName(e.target.files?.[0]?.name)}
                        aria-label={L("Attach proof")}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-[3px] border border-line bg-paper px-3 text-xs font-semibold text-ink hover:bg-paper-2"
                      >
                        <Paperclip size={14} aria-hidden="true" />
                        {proofName ? L("Change proof") : L("Attach proof")}
                      </button>
                      <span className="font-mono text-xs text-ink-3">
                        {proofName ?? L("nothing is uploaded — only the file name is kept")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 rounded-[3px] border border-line py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper"
                >
                  {L("Keep editing")}
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!canConfirm}
                  data-testid="ais-attach"
                  className="flex-1 rounded-[3px] bg-navy py-2.5 text-sm font-semibold text-paper hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {option.keepsReportedFigure ? L("Keep the department's figure") : L("Attach code to my return")}
                </button>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

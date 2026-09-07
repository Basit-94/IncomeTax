"use client";

/**
 * The Agentic centre (plan.md §6): calm whitespace, a readable transcript,
 * one composer, lightweight tool activity, and focused question / review
 * cards. No feature pillars, no scripted claims. The pending question or
 * review card is always the last thing on screen, so the next action is
 * obvious.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleDot, Download, FileText, Mic, MicOff, Send, ShieldAlert, ShieldCheck, Sparkles, Upload, X, Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { PublicRun } from "@/lib/agentic/runtime";
import type { OutputRef, Question, ReviewCard, RunEvent, RunTask } from "@/lib/agentic/types";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import { isSpeechSupported, startDictation, type Dictation } from "@/lib/speech";
import { SpeakingWaveform, TranscribingAnimation } from "./audio-waveforms";
import type { Lang } from "@/lib/types";
import { renderAssistantText } from "../agent/format";
import { Munshi, MunshiAvatar } from "../brand/munshi";
import type { MunshiState } from "../brand/munshi";
import { agentReaction } from "@/lib/munshi-state";

import type { CAReviewRecord } from "@/lib/ca/ca-store";
import { computeForPersona } from "@/lib/return/compute";
import { formatMoney } from "@/lib/money";

export interface WorkspaceProps {
  s: AgenticStrings;
  lang: Lang;
  citizenName: string | null;
  run: PublicRun | null;
  events: RunEvent[];
  outputs: OutputRef[];
  loading: boolean;
  error: string | null;
  durable: boolean;
  onStart: (input: { message?: string; task?: RunTask }) => void;
  onSend: (input: { message?: string; answer?: { questionId: string; value: string | number | boolean }; confirm?: { cardId: string; accepted: boolean } }) => void;
  onOpenVault?: () => void;
  onReviewWithCA?: () => void;
  activeCAReview?: CAReviewRecord | null;
  onOpenComparison?: () => void;
}

const STATUS_KEY: Record<PublicRun["status"], keyof AgenticStrings> = {
  running: "statusRunning",
  waiting_for_input: "statusWaitingInput",
  waiting_for_review: "statusWaitingReview",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
  failed: "statusFailed",
};

export default function Workspace(props: WorkspaceProps) {
  const { s, run, events } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length, run?.status]);

  const answeredIds = useMemo(() => new Set(events.filter((e) => e.payload.type === "answer").map((e) => (e.payload as { questionId: string }).questionId)), [events]);
  const confirmedIds = useMemo(() => new Set(events.filter((e) => e.payload.type === "confirmation").map((e) => (e.payload as { cardId: string }).cardId)), [events]);
  // Questions by id, so an answer bubble can show the label the citizen chose rather than the stored value.
  const questionsById = useMemo(() => new Map(events.filter((e) => e.payload.type === "question").map((e) => { const q = (e.payload as { question: Question }).question; return [q.id, q] as const; })), [events]);

  if (!run) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl text-center space-y-5">
            {/* Munshi ji greets the empty state (handoff: 96 px on empty states). */}
            <Munshi size={96} state="welcome" className="mx-auto" />
            <span className="glass-flat inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-ink-2">
              <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" /> {s.simulatedBadge}
            </span>
            <h1 className="text-[40px] sm:text-[50px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
              {s.welcomeTitle}
            </h1>
            <p className="text-base sm:text-lg text-ink-2 leading-relaxed max-w-xl mx-auto">{s.welcomeBody}</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {(
                [
                  ["prepare_salaried_return", s.taskPrepareReturn],
                  ["compare_regimes", s.taskCompareRegimes],
                  ["reconcile_facts", s.taskReconcile],
                ] as const
              ).map(([task, label]) => (
                <button key={task} type="button" onClick={() => props.onStart({ task })} className="glass-flat inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-2 hover:border-money/60 transition cursor-pointer">
                  <Sparkles size={13} className="text-money" aria-hidden="true" /> {label} <ArrowRight size={13} className="text-ink-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <Composer s={s} lang={props.lang} disabled={props.loading} onSubmit={(message) => props.onStart({ message })} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Status strip */}
      <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 text-xs">
        <MunshiAvatar size={34} state={agentReaction(run.status, props.loading, props.error)} />
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-glass-edge px-2.5 py-1 font-mono font-semibold ${run.status === "waiting_for_input" || run.status === "waiting_for_review" ? "bg-amber-bg text-amber-ink" : run.status === "failed" ? "bg-alarm-soft text-alarm" : "bg-glass text-ink-2"}`}>
          <CircleDot size={11} aria-hidden="true" /> {s[STATUS_KEY[run.status]] as string}
        </span>
        {!props.durable && <span className="text-ink-3 truncate">{s.notDurable}</span>}
      </div>

      {/* CA Review Complete Banner */}
      {props.activeCAReview?.status === "reviewed" && (
        <div className="px-4 sm:px-6 pt-2">
          <div className="mx-auto w-full max-w-3xl p-3.5 bg-ok-soft rounded-[18px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <MunshiAvatar size={28} state="happy" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-ok-ink block truncate">
                  🎖️ CA Review Complete from {props.activeCAReview.caDetails?.name || "Chartered Accountant"}!
                </span>
                <span className="text-[11px] text-ink-3 block truncate">
                  Your CA has audited deductions & figures. Check side-by-side diff before paying challan or filing.
                </span>
              </div>
            </div>
            {props.onOpenComparison && (
              <button
                type="button"
                onClick={props.onOpenComparison}
                className="ink-surface h-[34px] px-3.5 hover:opacity-90 text-xs font-bold rounded-[12px] transition cursor-pointer shrink-0"
              >
                View Diff →
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {events.map((e) => (
            <EventRow key={e.seq} event={e} s={s} answered={answeredIds} confirmed={confirmedIds} questions={questionsById} runId={run.id} onOpenVault={props.onOpenVault} />
          ))}
          {run.pendingQuestion && !answeredIds.has(run.pendingQuestion.id) && (
            <QuestionCard
              q={run.pendingQuestion}
              s={s}
              lang={props.lang}
              disabled={props.loading}
              onReviewWithCA={props.onReviewWithCA}
              activeCAReview={props.activeCAReview}
              onOpenComparison={props.onOpenComparison}
              onAnswer={(value) => props.onSend({ answer: { questionId: run.pendingQuestion!.id, value } })}
            />
          )}
          {run.pendingCard && !confirmedIds.has(run.pendingCard.id) && (
            <ReviewCardView card={run.pendingCard} s={s} disabled={props.loading} onReviewWithCA={props.onReviewWithCA} onDecide={(accepted) => props.onSend({ confirm: { cardId: run.pendingCard!.id, accepted } })} />
          )}
          {(props.loading || run.status === "running") && !props.error && (
            <div className="flex items-center gap-3 px-1" role="status">
              <Munshi size={72} state="working" />
              <p className="text-xs text-ink-3 font-mono">{s.statusRunning}…</p>
            </div>
          )}
          {props.error && (
            <p className="text-xs font-semibold text-alarm bg-alarm-soft border border-alarm/30 rounded-lg px-3 py-2">{props.error}</p>
          )}
        </div>
      </div>

      {run.status === "completed" && (
        <div className="px-4 sm:px-6 py-2.5 border-t border-line/60 bg-paper-2/60 backdrop-blur-xs">
          <div className="mx-auto w-full max-w-3xl space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink-2">
                <Sparkles size={12} className="text-money" aria-hidden="true" />
                <span>{props.lang === "hi" ? "अगले 7 उपलब्ध कार्य (AY 2026-27):" : "Next Available Tasks (AY 2026-27):"}</span>
              </span>
              <span className="text-[11px] text-ink-3 font-mono">Select or type 1–7</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "1", label: "📄 Prepare Return", message: "1. Prepare & File Return" },
                { id: "2", label: "⚖️ Compare Regimes", message: "2. Compare Tax Regimes" },
                { id: "3", label: "🔍 Reconcile AIS", message: "3. Reconcile AIS & 26AS" },
                { id: "4", label: "💳 Pay Tax / Challan 280", message: "4. Pay Tax / Challan 280" },
                { id: "5", label: "🛡️ Defend Notice", message: "5. Defend Tax Notice" },
                { id: "6", label: "⚡ Track Refund", message: "6. Track Refund Status" },
                { id: "7", label: "🏛️ Citizen Tax Vault", message: "7. Citizen Tax Vault" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={props.loading}
                  onClick={() => {
                    if (item.id === "7" && props.onOpenVault) {
                      props.onOpenVault();
                    }
                    props.onSend({ message: item.message });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-line bg-paper hover:bg-paper-2 hover:border-money/60 text-xs font-medium text-ink transition shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Composer s={s} lang={props.lang} disabled={props.loading || run.status === "cancelled" || run.status === "failed"} onSubmit={(message) => props.onSend({ message })} />
    </div>
  );
}

/* ------------------------------------------------------------------ pieces -- */

function answerLabel(value: string | number | boolean, q: Question | undefined, s: AgenticStrings): string {
  if (typeof value === "boolean") return value ? s.yes : s.no;
  if (q?.expects === "file") return value === "none" ? (q.skipLabel ?? s.dontHaveIt) : s.uploaded;
  if (q?.expects === "form") return s.detailsEntered;
  if (q?.expects === "source") return String(value).startsWith("upload:") ? s.uploaded : (q.sourceOptions?.find((o) => o.value === String(value))?.label ?? String(value));
  return q?.choices?.find((c) => c.value === String(value))?.label ?? String(value);
}

function EventRow({ event, s, answered, confirmed, questions, runId, onOpenVault }: { event: RunEvent; s: AgenticStrings; answered: Set<string>; confirmed: Set<string>; questions: Map<string, Question>; runId?: string; onOpenVault?: () => void }) {
  const p = event.payload;
  switch (p.type) {
    case "message":
      return p.role === "user" ? (
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-[18px] rounded-br-[4px] bg-amber-bg px-4 py-3 text-[15px] leading-relaxed text-amber-ink font-medium whitespace-pre-wrap">{p.text}</div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Avatar state="explaining" />
          <div className="munshi-bubble min-w-0 max-w-[78%] max-md:max-w-[86%]">{renderAssistantText(p.text)}</div>
        </div>
      );
    case "activity":
      return (
        <p className="flex items-center gap-2 ps-11 max-md:ps-9 text-[11.5px] font-mono text-ink-3">
          <span className="size-1.5 rounded-full bg-money shrink-0" aria-hidden="true" /> {p.text}
        </p>
      );
    case "question": {
      if (!answered.has(p.question.id)) return null; // rendered at the bottom
      return null;
    }
    case "answer": {
      const q = questions.get(p.questionId);
      const label = answerLabel(p.value, q, s);
      return (
        <div className="flex justify-end">
          <span className="glass-flat inline-flex items-center gap-1.5 rounded-[14px] rounded-br-[4px] px-3 py-1.5 text-[12.5px] text-ink-2">
            <Check size={12} className="text-ok" aria-hidden="true" /> {label}
          </span>
        </div>
      );
    }
    case "review_card":
      if (!confirmed.has(p.card.id)) return null;
      return null;
    case "confirmation":
      return (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1 text-xs text-ink-2">
            <Check size={11} className="text-money" aria-hidden="true" /> {p.accepted ? s.confirm : s.cancel}
          </span>
        </div>
      );
    case "output": {
      const isPdf = p.output.mimeType === "application/pdf" || p.output.kind === "itrv_acknowledgement_pdf";
      return (
        <div className="px-11 max-md:px-9 my-2">
          {isPdf ? (
            <div className="glass rounded-[18px] border-[1.5px] border-ok p-4 space-y-3 max-w-md">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-[12px] ink-surface flex items-center justify-center shrink-0">
                  <FileText size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-ok-ink">
                    Official CBDT Form ITR-V
                  </span>
                  <p className="text-sm font-bold text-ink mt-0.5">{p.output.title}</p>
                  <p className="font-mono text-[11px] text-ink-3">
                    rev {p.output.snapshotRevision} · {p.output.snapshotHash.slice(0, 10).toUpperCase()} · {s.simulatedBadge}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {runId && (
                  <a
                    href={`/api/runs/${runId}/outputs/${p.output.id}`}
                    download
                    className="inline-flex items-center gap-2 rounded-[14px] ink-surface hover:opacity-90 font-bold text-[13px] h-[38px] px-4 transition cursor-pointer"
                  >
                    <Download size={14} aria-hidden="true" /> Download Form ITR-V (PDF)
                  </a>
                )}
                {onOpenVault && (
                  <button
                    type="button"
                    onClick={onOpenVault}
                    className="glass-flat inline-flex items-center gap-1.5 rounded-[14px] h-[38px] px-3.5 text-[13px] font-semibold text-ink hover:border-money/60 transition cursor-pointer"
                  >
                    <ShieldCheck size={14} className="text-money" aria-hidden="true" />
                    <span>Open in Citizen Tax Vault</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-2 px-3 py-1.5 text-xs text-ink">
              <FileText size={13} className="text-money" aria-hidden="true" /> {p.output.title}
              <span className="text-ink-3">· {s.simulatedBadge}</span>
            </span>
          )}
        </div>
      );
    }
    case "status":
      if (p.status === "failed") {
        return (
          <p className="flex items-center gap-2 px-11 max-md:px-9 text-xs text-alarm">
            <ShieldAlert size={12} aria-hidden="true" /> {s.statusFailed}
          </p>
        );
      }
      return null;
    default:
      return null; // plan_updated, step_changed, source_lookup, tool_outcome live in the inspector
  }
}

function Avatar({ state = "idle" }: { state?: MunshiState }) {
  return (
    <MunshiAvatar size={34} state={state} className="mt-0.5" />
  );
}

function QuestionCard({
  q,
  s,
  lang = "en",
  disabled,
  onAnswer,
  onReviewWithCA,
  activeCAReview,
  onOpenComparison,
}: {
  q: Question;
  s: AgenticStrings;
  lang?: Lang;
  disabled: boolean;
  onAnswer: (v: string | number | boolean) => void;
  onReviewWithCA?: () => void;
  activeCAReview?: CAReviewRecord | null;
  onOpenComparison?: () => void;
}) {
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasReviewedCA = activeCAReview && (activeCAReview.status === "reviewed" || activeCAReview.status === "accepted");
  const caPersona = activeCAReview?.caPersona || activeCAReview?.originalPersona;
  const caRegime = activeCAReview?.caRegime || "new";
  const caB = caPersona ? computeForPersona(caPersona, caRegime) : null;
  const caDue = caB && caB.refundOrDue < 0 ? -caB.refundOrDue : 0;

  /** A document answered inline: stored in the citizen's vault, then its id is the answer. */
  const upload = async (file: File | undefined, answerWith: (id: string) => void = onAnswer) => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("docType", q.docType ?? (q.expects === "source" ? "FORM_16" : "OTHER"));
      form.append("assessmentYear", "2026-27");
      const res = await fetch("/api/vault/documents", { method: "POST", credentials: "same-origin", body: form });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; document?: { id: string } };
      if (!res.ok || !body.ok || !body.document?.id) throw new Error("refused");
      answerWith(body.document.id);
    } catch {
      setUploadError(s.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <Avatar state={uploadError ? "error" : uploading || disabled ? "uploading" : q.expects === "yes_no" && q.items ? "secure" : "listening"} />
      <div className="glass w-full min-w-0 max-w-[82%] max-md:max-w-none rounded-[18px] rounded-tl-[4px] border-[1.5px] border-soft px-[18px] max-md:px-3.5 py-4 space-y-2.5">
        {q.lead && <p className="text-sm text-ink-2 leading-relaxed">{q.lead}</p>}
        <p className="text-[15px] text-ink leading-relaxed">{q.text}</p>
        {q.docHint && <p className="text-sm text-ink-2 leading-relaxed">{q.docHint}</p>}
        {q.items && q.items.length > 0 && (
          <ul className="list-disc ps-5 text-sm text-ink-2 space-y-0.5">
            {q.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
        <p className="font-mono text-[11px] text-ink-3 tracking-[.02em]">{q.why}</p>
        {q.resolves === "challan_payment_mode" && (
          <div className="space-y-2.5 my-2">
            {/* Prominent CA Review Banner for Balance Tax Due */}
            {hasReviewedCA ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[14px] bg-ok-soft">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-ok-ink">
                    <Award size={16} className="text-ok shrink-0" />
                    <span>🎖️ CA Audit Complete from {activeCAReview.caDetails?.name || "Chartered Accountant"}</span>
                  </div>
                  <p className="text-xs text-ok-ink/80">
                    {caDue === 0
                      ? `Your CA audited deductions and eliminated your balance tax! (Eligible Refund: ${formatMoney(caB?.refundOrDue || 0, lang)})`
                      : `Your CA revised your balance tax due to ${formatMoney(caDue, lang)} under the ${caRegime === "old" ? "Old Regime" : "New Regime"}.`}
                  </p>
                </div>
                {onOpenComparison && (
                  <button
                    type="button"
                    onClick={onOpenComparison}
                    className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[12px] ink-surface hover:opacity-90 text-xs font-bold shrink-0 transition cursor-pointer"
                  >
                    <span>View Diff →</span>
                  </button>
                )}
              </div>
            ) : onReviewWithCA ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[14px] bg-amber-bg">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-amber-ink">
                    <Award size={16} className="text-money shrink-0" />
                    <span>Have Balance Tax Due? Review with a CA First</span>
                  </div>
                  <p className="text-xs text-amber-ink/80">
                    A CA can audit eligible deductions (80C, 80D, 80CCD, HRA, 24b) to help reduce or eliminate your payable tax before paying.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onReviewWithCA}
                  className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[12px] ink-surface hover:opacity-90 text-xs font-bold shrink-0 transition cursor-pointer"
                >
                  <Award size={14} />
                  <span>🎖️ Review with CA</span>
                </button>
              </div>
            ) : null}

            <div className="glass-flat flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-[14px]">
              <div className="p-2 bg-white rounded-[12px] border border-line shrink-0">
                <QRCodeSVG value="upi://pay?pa=epaytax.cbdt@sbi&pn=Income%20Tax%20Department&cu=INR" size={105} />
              </div>
              <div className="text-xs space-y-1 text-ink-2">
                <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ok inline-block" />
                  e-Pay Tax · Official CBDT Payment Gateway
                </div>
                <p className="text-ink-3">Payee UPI VPA: <span className="font-mono text-ink font-semibold">epaytax.cbdt@sbi</span></p>
                <p className="text-ink-3">Major Head: <span className="font-semibold text-ink">0021</span> · Minor Head: <span className="font-semibold text-ink">300 (Self-Assessment)</span></p>
                <p className="text-ink-3">
                  {hasReviewedCA && caDue === 0
                    ? "Your CA audited deductions. Total payable tax is ₹0."
                    : "Select your payment method below to simulate and credit this challan:"}
                </p>
              </div>
            </div>
          </div>
        )}
        {q.expects === "source" && q.sourceOptions ? (
          <div className="space-y-2">
            {q.sourceOptions.map((o) =>
              o.kind === "upload" ? (
                <label key={o.value} className={`glass-flat flex items-start gap-3 rounded-[14px] px-3.5 py-3 ${disabled || uploading ? "opacity-50 cursor-wait" : "hover:border-money/60 cursor-pointer"}`}>
                  <Upload size={16} className="mt-0.5 shrink-0 text-money" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{uploading ? s.uploading : o.label}</span>
                    {o.detail && <span className="block text-xs text-ink-3">{o.detail}</span>}
                  </span>
                  <input type="file" accept=".pdf,image/*" className="sr-only" disabled={disabled || uploading} onChange={(e) => void upload(e.target.files?.[0], (id) => onAnswer(`upload:${id}`))} />
                </label>
              ) : (
                <button key={o.value} type="button" disabled={disabled || uploading} onClick={() => onAnswer(o.value)} className="glass-flat w-full text-start flex items-start gap-3 rounded-[14px] px-3.5 py-3 hover:border-money/60 disabled:opacity-50 cursor-pointer">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{o.label}</span>
                    {o.detail && <span className="block text-xs text-ink-3">{o.detail}</span>}
                  </span>
                </button>
              ),
            )}
            {uploadError && <p className="text-xs font-semibold text-alarm">{uploadError}</p>}
          </div>
        ) : q.expects === "form" && q.fields ? (
          <FormFields q={q} s={s} disabled={disabled} onAnswer={onAnswer} />
        ) : q.expects === "file" ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <label className={`ink-surface inline-flex items-center gap-2 rounded-[14px] h-[38px] px-4 text-[13px] font-bold ${disabled || uploading ? "opacity-50 cursor-wait" : "hover:opacity-90 cursor-pointer"}`}>
                <Upload size={14} aria-hidden="true" /> {uploading ? s.uploading : s.uploadDocument}
                <input type="file" accept=".pdf,image/*" className="sr-only" disabled={disabled || uploading} onChange={(e) => void upload(e.target.files?.[0])} />
              </label>
              <button type="button" disabled={disabled || uploading} onClick={() => onAnswer("none")} className="glass-flat rounded-[14px] h-[38px] px-4 text-[13px] font-semibold text-ink-2 hover:text-ink disabled:opacity-50 cursor-pointer">
                {q.skipLabel ?? s.dontHaveIt}
              </button>
            </div>
            {uploadError && <p className="text-xs font-semibold text-alarm">{uploadError}</p>}
          </div>
        ) : q.expects === "yes_no" ? (
          <div className="flex gap-2">
            <button type="button" disabled={disabled} onClick={() => onAnswer(true)} className="btn-primary rounded-[14px] h-[38px] px-4 text-[13px] hover:opacity-90 disabled:opacity-50 cursor-pointer">{s.yes}</button>
            <button type="button" disabled={disabled} onClick={() => onAnswer(false)} className="glass-flat rounded-[14px] h-[38px] px-4 text-[13px] font-semibold text-ink-2 hover:text-ink disabled:opacity-50 cursor-pointer">{s.no}</button>
          </div>
        ) : q.expects === "choice" && q.choices ? (
          <div className="flex flex-wrap gap-2">
            {q.choices.map((c) => {
              const isChallanAction = q.resolves === "challan_payment_mode" && c.value.startsWith("pay_");
              const isCAAction = c.value === "review_with_ca";

              let label = c.label;
              if (hasReviewedCA && isChallanAction) {
                if (caDue === 0) {
                  label = c.label.replace(/₹[\d,]+(\s*Now)?/gi, "₹0 (Nil Due)");
                } else {
                  label = c.label.replace(/₹[\d,]+/g, formatMoney(caDue, lang));
                }
              }

              return (
                <button
                  key={c.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (isCAAction && hasReviewedCA && onOpenComparison) {
                      onOpenComparison();
                      return;
                    }
                    if (isCAAction && onReviewWithCA) {
                      onReviewWithCA();
                    }
                    onAnswer(c.value);
                  }}
                  className={`rounded-[14px] border h-[38px] px-3.5 text-[13px] font-medium transition-all disabled:opacity-50 cursor-pointer ${
                    isCAAction
                      ? "bg-amber-bg border-money/40 text-amber-ink font-bold hover:opacity-90 flex items-center gap-1.5"
                      : isChallanAction && hasReviewedCA && caDue === 0
                      ? "bg-ok-soft border-ok/40 text-ok-ink font-semibold hover:opacity-90"
                      : isChallanAction
                      ? "bg-amber-bg border-money/40 text-amber-ink font-semibold hover:opacity-90"
                      : "glass-flat text-ink hover:border-money/60"
                  }`}
                >
                  {isCAAction && <Award size={14} className="text-money shrink-0" />}
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const raw = value.trim();
              if (!raw) return;
              onAnswer(q.expects === "number" ? Number(raw.replace(/[^0-9.]/g, "")) || 0 : raw);
            }}
          >
            <input
              inputMode={q.expects === "number" ? "numeric" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-white/80 dark:bg-white/10 px-4 text-sm text-ink font-mono tabular-nums focus:outline-none focus:border-money"
              aria-label={q.text}
              disabled={disabled}
            />
            <button type="submit" disabled={disabled || !value.trim()} className="ink-surface rounded-[14px] h-[46px] px-5 text-[14.5px] font-bold hover:opacity-90 disabled:opacity-45 cursor-pointer">{s.answer}</button>
          </form>
        )}
      </div>
    </div>
  );
}

/** The one form: several small figures answered together, sent as one JSON object (user direction 2026-09-06). */
function FormFields({ q, s, disabled, onAnswer }: { q: Question; s: AgenticStrings; disabled: boolean; onAnswer: (v: string) => void }) {
  const fields = q.fields ?? [];
  // Values carried from an earlier year arrive pre-selected (2026-09-07) and are tagged "same as last year".
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    for (const f of fields) if (f.defaultValue !== undefined) init[f.key] = typeof f.defaultValue === "boolean" ? f.defaultValue : String(f.defaultValue);
    return init;
  });
  const complete = fields.every((f) => f.type !== "yes_no" || typeof values[f.key] === "boolean");
  const toggleMulti = (key: string, value: string) => {
    setValues((v) => {
      const current = String(v[key] ?? "").split(",").filter(Boolean);
      // "none" clears the rest, and any real chip clears "none".
      const next = value === "none" ? (current.includes("none") ? [] : ["none"]) : current.includes(value) ? current.filter((x) => x !== value) : [...current.filter((x) => x !== "none"), value];
      return { ...v, [key]: next.join(",") };
    });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, number | boolean | string> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.type === "number") out[f.key] = Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0;
      else if (f.type === "yes_no") out[f.key] = v === true;
      else if (typeof v === "string" && v) out[f.key] = v;
    }
    onAnswer(JSON.stringify(out));
  };
  return (
    <form className="space-y-3" onSubmit={submit}>
      {fields.map((f) => {
        const id = `${q.id}-${f.key}`;
        const carried = f.defaultValue !== undefined && String(values[f.key] ?? "") === String(f.defaultValue);
        return (
          <div key={f.key} className="space-y-1">
            <label className="block text-sm font-semibold text-ink" htmlFor={id}>
              {f.label}
              {carried && <span className="ms-2 inline-block rounded-full bg-amber-bg px-2 py-0.5 text-[10.5px] font-semibold text-amber-ink align-middle">{s.carriedFromLastYear}</span>}
            </label>
            {f.hint && <p className="text-xs text-ink-3">{f.hint}</p>}
            {f.type === "multi" || (f.type === "choice" && (f.choices?.length ?? 0) <= 5) ? (
              <div className="flex flex-wrap gap-2" role="group" aria-label={f.label}>
                {f.choices?.map((c) => {
                  const on = f.type === "multi" ? String(values[f.key] ?? "").split(",").includes(c.value) : values[f.key] === c.value;
                  return (
                    <button key={c.value} type="button" disabled={disabled} aria-pressed={on} onClick={() => (f.type === "multi" ? toggleMulti(f.key, c.value) : setValues((v) => ({ ...v, [f.key]: c.value })))} className={`rounded-full h-[34px] px-3.5 text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 border-[1.5px] transition-colors ${on ? "border-money bg-amber-bg text-amber-ink" : "border-glass-edge glass-flat text-ink-2 hover:text-ink"}`}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            ) : f.type === "number" ? (
              <input id={id} inputMode="numeric" placeholder="0" value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} disabled={disabled} className="w-full h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-paper-3 px-4 text-[15px] text-ink font-mono tabular-nums focus:outline-none focus:border-money focus:ring-[3px] focus:ring-money/20" />
            ) : f.type === "yes_no" ? (
              <div className="flex gap-2" role="group" aria-label={f.label}>
                {[true, false].map((b) => (
                  <button key={String(b)} type="button" disabled={disabled} onClick={() => setValues((v) => ({ ...v, [f.key]: b }))} className={`rounded-[14px] h-[38px] px-4 text-[13px] font-semibold cursor-pointer disabled:opacity-50 ${values[f.key] === b ? "ink-surface" : "glass-flat text-ink-2 hover:text-ink"}`}>
                    {b ? s.yes : s.no}
                  </button>
                ))}
              </div>
            ) : (
              <select id={id} value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} disabled={disabled} className="w-full h-[46px] rounded-[14px] border-[1.5px] border-glass-edge bg-paper-3 px-4 text-[15px] text-ink">
                <option value="">—</option>
                {f.choices?.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
          </div>
        );
      })}
      <button type="submit" disabled={disabled || !complete} className="btn-primary rounded-[14px] h-[46px] px-5 text-[14.5px] disabled:opacity-45 cursor-pointer">{s.formSubmit}</button>
    </form>
  );
}

function ReviewCardView({ card, s, disabled, inert = false, onDecide, onReviewWithCA }: { card: ReviewCard; s: AgenticStrings; disabled: boolean; inert?: boolean; onDecide?: (accepted: boolean) => void; onReviewWithCA?: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar state={disabled ? "working" : "reading"} />
      <div className={`glass w-full min-w-0 max-w-[82%] max-md:max-w-none rounded-[18px] rounded-tl-[4px] p-[18px] max-md:p-3.5 space-y-3 ${inert ? "" : "border-[1.5px] border-money"}`}>
        <p className="font-sans text-[15px] font-extrabold text-ink tracking-[-0.01em]">{card.title}</p>
        <dl className="space-y-1.5">
          {card.rows.map((r) => (
            <div key={r.label} className={`flex items-baseline justify-between gap-4 text-sm ${r.emphasis ? "border-t border-line pt-2 font-bold" : ""}`}>
              <dt className="text-ink-2">{r.label}</dt>
              <dd className={`font-mono tabular-nums ${r.emphasis ? "text-ok text-lg font-bold" : "text-ink"}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-[10px] text-ink-3">rev {card.boundTo.revision} · {card.boundTo.snapshotHash.slice(0, 10)} · {s.simulatedBadge}</p>
        {!inert && (
          <div className="flex flex-wrap gap-2 pt-1 max-md:flex-col">
            <button type="button" disabled={disabled} onClick={() => onDecide?.(true)} className="btn-primary flex-1 rounded-[14px] h-[46px] px-5 text-[14.5px] disabled:opacity-45 cursor-pointer">{card.confirmLabel}</button>
            {card.kind === "filing" && onReviewWithCA && (
              <button type="button" onClick={onReviewWithCA} className="glass-flat rounded-[14px] h-[46px] px-4 text-[14.5px] font-semibold text-ink-2 hover:text-ink transition cursor-pointer flex items-center gap-1.5 max-md:w-full max-md:justify-center">
                <Award size={14} className="text-money" />
                <span>Review with CA</span>
              </button>
            )}
            <button type="button" disabled={disabled} onClick={() => onDecide?.(false)} className="glass-flat max-md:w-full rounded-[14px] h-[46px] px-4 text-[14.5px] font-semibold text-ink-2 hover:text-ink disabled:opacity-50 cursor-pointer">{card.cancelLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** `variant="ask"` is the landing's single pill box with an "Ask →" button; `"chat"` is the transcript composer. */
export function Composer({ s, lang, disabled, onSubmit, variant = "chat", placeholder }: { s: AgenticStrings; lang: Lang; disabled: boolean; onSubmit: (message: string) => void; variant?: "chat" | "ask"; placeholder?: string }) {
  const [text, setText] = useState("");
  const ask = variant === "ask";
  const hint = placeholder ?? s.composerPlaceholder;
  const [speechState, setSpeechState] = useState<"idle" | "listening" | "transcribing">("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechNote, setSpeechNote] = useState<string | null>(null);
  const dictation = useRef<Dictation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speech = typeof window !== "undefined" && isSpeechSupported();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      dictation.current?.stop();
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStopRecording = () => {
    clearTimer();
    dictation.current?.stop();
  };

  const handleCancelRecording = () => {
    clearTimer();
    dictation.current?.stop();
    setSpeechState("idle");
    setAudioLevel(0);
    setRecordingSeconds(0);
  };

  const toggleMic = () => {
    if (speechState === "listening") {
      handleStopRecording();
      return;
    }
    if (speechState === "transcribing") return;

    setSpeechNote(null);
    setSpeechState("listening");
    setAudioLevel(0);
    setRecordingSeconds(0);

    clearTimer();
    timerRef.current = setInterval(() => {
      setRecordingSeconds((sec) => sec + 1);
    }, 1000);

    const d = startDictation({
      lang,
      onAudioLevel: (lvl) => setAudioLevel(lvl),
      onTranscribing: () => {
        clearTimer();
        setSpeechState("transcribing");
      },
      onPartial: () => {},
      onFinal: (t) => {
        const trimmed = String(t).trim();
        if (trimmed) {
          setText((prev) => (prev.trim() ? `${prev.trim()} ${trimmed}` : trimmed));
        }
        setSpeechState("idle");
        setAudioLevel(0);
        setRecordingSeconds(0);
        clearTimer();
      },
      onError: (reason) => {
        clearTimer();
        setSpeechState("idle");
        setAudioLevel(0);
        setRecordingSeconds(0);
        if (reason === "not-allowed") {
          setSpeechNote("Microphone permission was denied. Please allow microphone access.");
        } else if (reason === "no-speech") {
          setSpeechNote("Could not hear anything. Speak clearly or type instead.");
        } else if (reason === "network") {
          setSpeechNote("Network connection issue. Check your internet connection.");
        } else {
          setSpeechNote("Speech transcription failed. Please try typing instead.");
        }
        setTimeout(() => setSpeechNote(null), 4500);
      },
      onEnd: () => {
        clearTimer();
        setSpeechState("idle");
        setAudioLevel(0);
        setRecordingSeconds(0);
        dictation.current = null;
      },
    });

    if (!d) {
      clearTimer();
      setSpeechState("idle");
      setSpeechNote("Microphone recording is not supported in this browser.");
      setTimeout(() => setSpeechNote(null), 4000);
      return;
    }

    dictation.current = d;
  };

  const submit = () => {
    const m = text.trim();
    if (!m || disabled) return;
    onSubmit(m);
    setText("");
  };

  const isListening = speechState === "listening";
  const isTranscribing = speechState === "transcribing";

  return (
    <div className={ask ? "shrink-0 pt-2" : "shrink-0 px-4 sm:px-6 pb-4 pt-2 max-md:pb-7 max-md:bg-[linear-gradient(to_top,var(--color-paper)_70%,transparent)]"}>
      <form
        className={`glass mx-auto w-full flex items-center gap-2.5 p-2 ps-5 max-md:p-1.5 max-md:ps-3.5 rounded-[20px] max-md:rounded-[18px] transition-all duration-200 ${
          isListening
            ? "border-[var(--primary-accent)]/80 shadow-[var(--accent-glow)] ring-2 ring-[var(--primary-accent)]/20"
            : isTranscribing
            ? "border-[var(--tertiary-color)]/70 shadow-[var(--glass-shadow)] ring-2 ring-[var(--tertiary-color)]/20"
            : "focus-within:border-money/60"
        } ${ask ? "max-w-[720px]" : "max-w-3xl"}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!isListening && !isTranscribing) submit();
        }}
      >
        {isListening ? (
          <SpeakingWaveform
            audioLevel={audioLevel}
            timeSeconds={recordingSeconds}
            onStop={handleStopRecording}
            onCancel={handleCancelRecording}
          />
        ) : isTranscribing ? (
          <TranscribingAnimation />
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={hint}
              aria-label={hint}
              disabled={disabled}
              className={`flex-1 resize-none bg-transparent px-1 py-[11px] text-[16px] leading-[22px] text-ink placeholder:text-ink-3 outline-none max-h-40 disabled:opacity-60 ${text.includes("\n") ? "" : "overflow-hidden"}`}
              style={{ height: `${Math.min(166, 44 + (text.split("\n").length - 1) * 22)}px` }}
            />
            {speech && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={disabled}
                className="size-10 mb-[3px] shrink-0 rounded-[12px] flex items-center justify-center cursor-pointer disabled:opacity-50 text-ink-3 hover:text-ink hover:bg-paper-2 transition-colors"
                aria-pressed={false}
                aria-label="Dictate with voice"
                title="Dictate with voice"
              >
                <Mic size={17} aria-hidden="true" />
              </button>
            )}
            {ask ? (
              <button type="submit" disabled={disabled || !text.trim()} className="btn-primary h-[46px] max-md:size-[42px] max-md:mb-[2px] max-md:px-0 max-md:justify-center max-md:rounded-[13px] shrink-0 rounded-[14px] px-5 flex items-center gap-2 text-[14.5px] disabled:opacity-45 cursor-pointer" aria-label={s.ask}>
                <span className="max-md:hidden">{s.ask}</span> <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" disabled={disabled || !text.trim()} className="btn-primary h-[46px] max-md:size-[42px] max-md:mb-[2px] max-md:px-0 max-md:justify-center max-md:rounded-[13px] shrink-0 rounded-[14px] px-5 flex items-center gap-2 text-[14.5px] disabled:opacity-45 cursor-pointer" aria-label={s.send}>
                <Send size={15} aria-hidden="true" /> <span className="hidden sm:inline">{s.send}</span>
              </button>
            )}
          </>
        )}
      </form>
      {speechNote && (
        <p className="mt-2 text-center text-xs font-semibold text-alarm animate-pulse" role="status">
          {speechNote}
        </p>
      )}
    </div>
  );
}

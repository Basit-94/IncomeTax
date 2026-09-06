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
import type { Lang } from "@/lib/types";
import { renderAssistantText } from "../agent/format";

import type { CAReviewRecord } from "@/lib/ca/ca-store";

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
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1 text-xs text-ink-2">
              <span className="size-1.5 rounded-full bg-money" aria-hidden="true" /> {s.simulatedBadge}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight text-ink text-balance">
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
                <button key={task} type="button" onClick={() => props.onStart({ task })} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-4 py-2 text-sm text-ink hover:border-money/60 hover:shadow-sm transition cursor-pointer">
                  <Sparkles size={13} className="text-amber-500" aria-hidden="true" /> {label} <ArrowRight size={13} className="text-ink-3" aria-hidden="true" />
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
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono ${run.status === "waiting_for_input" || run.status === "waiting_for_review" ? "border-amber-500/50 bg-amber-bg text-amber-800 dark:text-amber-200" : run.status === "failed" ? "border-alarm/40 bg-alarm-soft text-alarm" : "border-line bg-paper-2 text-ink-2"}`}>
          <CircleDot size={11} aria-hidden="true" /> {s[STATUS_KEY[run.status]] as string}
        </span>
        {!props.durable && <span className="text-ink-3 truncate">{s.notDurable}</span>}
      </div>

      {/* CA Review Complete Banner */}
      {props.activeCAReview?.status === "reviewed" && (
        <div className="px-4 sm:px-6 pt-2">
          <div className="mx-auto w-full max-w-3xl p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block truncate">
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
                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
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
              disabled={props.loading}
              onReviewWithCA={props.onReviewWithCA}
              onAnswer={(value) => props.onSend({ answer: { questionId: run.pendingQuestion!.id, value } })}
            />
          )}
          {run.pendingCard && !confirmedIds.has(run.pendingCard.id) && (
            <ReviewCardView card={run.pendingCard} s={s} disabled={props.loading} onReviewWithCA={props.onReviewWithCA} onDecide={(accepted) => props.onSend({ confirm: { cardId: run.pendingCard!.id, accepted } })} />
          )}
          {props.loading && (
            <p className="text-xs text-ink-3 font-mono animate-pulse px-1">{s.statusRunning}…</p>
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
                <Sparkles size={12} className="text-amber-500" aria-hidden="true" />
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
          <div className="max-w-[80%] rounded-2xl rounded-br-md bg-amber-bg border border-amber-500/30 px-4 py-2.5 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{p.text}</div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Avatar />
          <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-paper-2 px-4 py-3 text-[15px] leading-relaxed text-ink">{renderAssistantText(p.text)}</div>
        </div>
      );
    case "activity":
      return (
        <p className="flex items-center gap-2 px-11 text-xs font-mono text-ink-3">
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
          <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-br-md bg-paper-2 border border-line px-3.5 py-1.5 text-xs text-ink">
            <Check size={12} className="text-money" aria-hidden="true" /> {label}
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
        <div className="px-11 my-2">
          {isPdf ? (
            <div className="rounded-2xl border-2 border-teal-700/30 bg-teal-500/5 p-4 space-y-3 max-w-md shadow-xs">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-md bg-teal-800/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs px-4 py-2.5 shadow-xs transition cursor-pointer"
                  >
                    <Download size={14} aria-hidden="true" /> Download Form ITR-V (PDF)
                  </a>
                )}
                {onOpenVault && (
                  <button
                    type="button"
                    onClick={onOpenVault}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-teal-700/30 bg-paper px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-3 transition cursor-pointer"
                  >
                    <ShieldCheck size={14} className="text-amber-500" aria-hidden="true" />
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
          <p className="flex items-center gap-2 px-11 text-xs text-alarm">
            <ShieldAlert size={12} aria-hidden="true" /> {s.statusFailed}
          </p>
        );
      }
      return null;
    default:
      return null; // plan_updated, step_changed, source_lookup, tool_outcome live in the inspector
  }
}

function Avatar() {
  return (
    <span className="mt-0.5 size-8 shrink-0 rounded-full bg-ink text-paper font-serif font-bold text-sm flex items-center justify-center" aria-hidden="true">
      W
    </span>
  );
}

function QuestionCard({ q, s, disabled, onAnswer, onReviewWithCA }: { q: Question; s: AgenticStrings; disabled: boolean; onAnswer: (v: string | number | boolean) => void; onReviewWithCA?: () => void }) {
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      <Avatar />
      <div className="w-full max-w-[85%] rounded-2xl rounded-tl-md border border-amber-500/40 bg-paper-2 px-4 py-3 space-y-3">
        {q.lead && <p className="text-sm text-ink-2 leading-relaxed">{q.lead}</p>}
        <p className="text-[15px] text-ink leading-relaxed">{q.text}</p>
        {q.docHint && <p className="text-sm text-ink-2 leading-relaxed">{q.docHint}</p>}
        {q.items && q.items.length > 0 && (
          <ul className="list-disc ps-5 text-sm text-ink-2 space-y-0.5">
            {q.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
        <p className="text-xs text-ink-3">{q.why}</p>
        {q.resolves === "challan_payment_mode" && (
          <div className="space-y-2.5 my-2">
            {/* Prominent CA Review Banner for Balance Tax Due */}
            {onReviewWithCA && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-teal-600/30 bg-teal-500/10 dark:bg-teal-950/30">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-teal-900 dark:text-teal-200">
                    <Award size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Have Balance Tax Due? Review with a CA First</span>
                  </div>
                  <p className="text-xs text-teal-800/80 dark:text-teal-300/80">
                    A CA can audit eligible deductions (80C, 80D, 80CCD, HRA, 24b) to help reduce or eliminate your payable tax before paying.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onReviewWithCA}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0 shadow-xs transition cursor-pointer"
                >
                  <Award size={14} />
                  <span>🎖️ Review with CA</span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-paper rounded-xl border border-line">
              <div className="p-2 bg-white rounded-lg shadow-xs border border-slate-200 shrink-0">
                <QRCodeSVG value="upi://pay?pa=epaytax.cbdt@sbi&pn=Income%20Tax%20Department&cu=INR" size={105} />
              </div>
              <div className="text-xs space-y-1 text-ink-2">
                <div className="font-bold text-ink text-sm flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  e-Pay Tax · Official CBDT Payment Gateway
                </div>
                <p className="text-ink-3">Payee UPI VPA: <span className="font-mono text-ink font-semibold">epaytax.cbdt@sbi</span></p>
                <p className="text-ink-3">Major Head: <span className="font-semibold text-ink">0021</span> · Minor Head: <span className="font-semibold text-ink">300 (Self-Assessment)</span></p>
                <p className="text-ink-3">Select your payment method below to simulate and credit this challan:</p>
              </div>
            </div>
          </div>
        )}
        {q.expects === "source" && q.sourceOptions ? (
          <div className="space-y-2">
            {q.sourceOptions.map((o) =>
              o.kind === "upload" ? (
                <label key={o.value} className={`flex items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 ${disabled || uploading ? "opacity-50 cursor-wait" : "hover:border-money/60 cursor-pointer"}`}>
                  <Upload size={16} className="mt-0.5 shrink-0 text-money" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{uploading ? s.uploading : o.label}</span>
                    {o.detail && <span className="block text-xs text-ink-3">{o.detail}</span>}
                  </span>
                  <input type="file" accept=".pdf,image/*" className="sr-only" disabled={disabled || uploading} onChange={(e) => void upload(e.target.files?.[0], (id) => onAnswer(`upload:${id}`))} />
                </label>
              ) : (
                <button key={o.value} type="button" disabled={disabled || uploading} onClick={() => onAnswer(o.value)} className="w-full text-start flex items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 hover:border-money/60 disabled:opacity-50 cursor-pointer">
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
              <label className={`inline-flex items-center gap-2 rounded-lg bg-ink text-paper px-4 py-2 text-sm font-semibold ${disabled || uploading ? "opacity-50 cursor-wait" : "hover:opacity-90 cursor-pointer"}`}>
                <Upload size={14} aria-hidden="true" /> {uploading ? s.uploading : s.uploadDocument}
                <input type="file" accept=".pdf,image/*" className="sr-only" disabled={disabled || uploading} onChange={(e) => void upload(e.target.files?.[0])} />
              </label>
              <button type="button" disabled={disabled || uploading} onClick={() => onAnswer("none")} className="rounded-lg border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-3 disabled:opacity-50 cursor-pointer">
                {q.skipLabel ?? s.dontHaveIt}
              </button>
            </div>
            {uploadError && <p className="text-xs font-semibold text-alarm">{uploadError}</p>}
          </div>
        ) : q.expects === "yes_no" ? (
          <div className="flex gap-2">
            <button type="button" disabled={disabled} onClick={() => onAnswer(true)} className="rounded-lg bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">{s.yes}</button>
            <button type="button" disabled={disabled} onClick={() => onAnswer(false)} className="rounded-lg border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-3 disabled:opacity-50 cursor-pointer">{s.no}</button>
          </div>
        ) : q.expects === "choice" && q.choices ? (
          <div className="flex flex-wrap gap-2">
            {q.choices.map((c) => {
              const isChallanAction = q.resolves === "challan_payment_mode" && c.value.startsWith("pay_");
              const isCAAction = c.value === "review_with_ca";
              return (
                <button
                  key={c.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (isCAAction && onReviewWithCA) {
                      onReviewWithCA();
                    }
                    onAnswer(c.value);
                  }}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all disabled:opacity-50 cursor-pointer ${
                    isCAAction
                      ? "bg-teal-700/10 border-teal-700/40 text-teal-950 dark:text-teal-200 font-bold hover:bg-teal-700/20 shadow-xs flex items-center gap-1.5"
                      : isChallanAction
                      ? "bg-money/10 border-money/40 text-money font-semibold shadow-xs hover:bg-money/20"
                      : "border-line bg-paper text-ink hover:bg-paper-3"
                  }`}
                >
                  {isCAAction && <Award size={14} className="text-teal-600 shrink-0" />}
                  {c.label}
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
              className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-money/40"
              aria-label={q.text}
              disabled={disabled}
            />
            <button type="submit" disabled={disabled || !value.trim()} className="rounded-lg bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">{s.answer}</button>
          </form>
        )}
      </div>
    </div>
  );
}

/** The one form: several small figures answered together, sent as one JSON object (user direction 2026-09-06). */
function FormFields({ q, s, disabled, onAnswer }: { q: Question; s: AgenticStrings; disabled: boolean; onAnswer: (v: string) => void }) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const fields = q.fields ?? [];
  const complete = fields.every((f) => f.type !== "yes_no" || typeof values[f.key] === "boolean");
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
        return (
          <div key={f.key} className="space-y-1">
            <label className="block text-sm font-semibold text-ink" htmlFor={id}>{f.label}</label>
            {f.hint && <p className="text-xs text-ink-3">{f.hint}</p>}
            {f.type === "number" ? (
              <input id={id} inputMode="numeric" placeholder="0" value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} disabled={disabled} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-money/40" />
            ) : f.type === "yes_no" ? (
              <div className="flex gap-2" role="group" aria-label={f.label}>
                {[true, false].map((b) => (
                  <button key={String(b)} type="button" disabled={disabled} onClick={() => setValues((v) => ({ ...v, [f.key]: b }))} className={`rounded-lg border px-4 py-1.5 text-sm font-semibold cursor-pointer disabled:opacity-50 ${values[f.key] === b ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-line hover:bg-paper-3"}`}>
                    {b ? s.yes : s.no}
                  </button>
                ))}
              </div>
            ) : (
              <select id={id} value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} disabled={disabled} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink">
                <option value="">—</option>
                {f.choices?.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            )}
          </div>
        );
      })}
      <button type="submit" disabled={disabled || !complete} className="rounded-lg bg-ink text-paper px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer">{s.formSubmit}</button>
    </form>
  );
}

function ReviewCardView({ card, s, disabled, inert = false, onDecide, onReviewWithCA }: { card: ReviewCard; s: AgenticStrings; disabled: boolean; inert?: boolean; onDecide?: (accepted: boolean) => void; onReviewWithCA?: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className={`w-full max-w-[85%] rounded-2xl rounded-tl-md border ${inert ? "border-line" : "border-money/60"} bg-paper-2 p-4 space-y-3`}>
        <p className="font-sans text-sm font-bold text-ink">{card.title}</p>
        <dl className="space-y-1.5">
          {card.rows.map((r) => (
            <div key={r.label} className={`flex items-baseline justify-between gap-4 text-sm ${r.emphasis ? "border-t border-line pt-2 font-bold" : ""}`}>
              <dt className="text-ink-2">{r.label}</dt>
              <dd className={`font-mono tabular-nums ${r.emphasis ? "text-money text-base" : "text-ink"}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-[10px] text-ink-3">rev {card.boundTo.revision} · {card.boundTo.snapshotHash.slice(0, 10)} · {s.simulatedBadge}</p>
        {!inert && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" disabled={disabled} onClick={() => onDecide?.(true)} className="flex-1 rounded-lg bg-ink text-paper px-4 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer">{card.confirmLabel}</button>
            {card.kind === "filing" && onReviewWithCA && (
              <button type="button" onClick={onReviewWithCA} className="rounded-lg border border-teal-700/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-950 dark:text-teal-200 px-3 py-2.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
                <Award size={14} className="text-teal-600" />
                <span>Review with CA</span>
              </button>
            )}
            <button type="button" disabled={disabled} onClick={() => onDecide?.(false)} className="rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper-3 disabled:opacity-50 cursor-pointer">{card.cancelLabel}</button>
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
  const [listening, setListening] = useState(false);
  const dictation = useRef<Dictation | null>(null);
  const speech = typeof window !== "undefined" && isSpeechSupported();

  const toggleMic = () => {
    if (listening) {
      dictation.current?.stop();
      return;
    }
    const d = startDictation({
      lang,
      onPartial: (t) => setText(t),
      onFinal: (t) => setText(t),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
    if (d) {
      dictation.current = d;
      setListening(true);
    }
  };

  const submit = () => {
    const m = text.trim();
    if (!m || disabled) return;
    onSubmit(m);
    setText("");
  };

  return (
    <div className={ask ? "shrink-0 pt-2" : "shrink-0 px-4 sm:px-6 pb-4 pt-2"}>
      <form
        className={`mx-auto w-full flex items-end gap-2 border border-line bg-paper-2 p-2 shadow-sm focus-within:border-money/60 ${ask ? "max-w-2xl rounded-full ps-4" : "max-w-3xl rounded-2xl"}`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
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
          className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-ink placeholder:text-ink-3 placeholder-shown:overflow-hidden outline-none max-h-40 disabled:opacity-60"
          style={{ height: `${Math.min(160, 40 + (text.split("\n").length - 1) * 22)}px` }}
        />
        {speech && (
          <button type="button" onClick={toggleMic} disabled={disabled} className={`size-10 shrink-0 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50 ${listening ? "bg-alarm-soft text-alarm" : "text-ink-2 hover:bg-paper-3"}`} aria-pressed={listening} aria-label="Dictate">
            {listening ? <MicOff size={17} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}
          </button>
        )}
        {ask ? (
          <button type="submit" disabled={disabled || !text.trim()} className="h-10 shrink-0 rounded-full bg-ink text-paper px-5 flex items-center gap-2 text-sm font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer">
            {s.ask} <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" disabled={disabled || !text.trim()} className="h-10 shrink-0 rounded-xl bg-ink text-paper px-4 flex items-center gap-2 text-sm font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer">
            <Send size={15} aria-hidden="true" /> <span className="hidden sm:inline">{s.send}</span>
          </button>
        )}
      </form>
    </div>
  );
}

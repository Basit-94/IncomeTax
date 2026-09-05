"use client";

/**
 * The Agentic centre (plan.md §6): calm whitespace, a readable transcript,
 * one composer, lightweight tool activity, and focused question / review
 * cards. No feature pillars, no scripted claims. The pending question or
 * review card is always the last thing on screen, so the next action is
 * obvious.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleDot, FileText, Mic, MicOff, Send, ShieldAlert, Sparkles, Upload, X } from "lucide-react";
import type { PublicRun } from "@/lib/agentic/runtime";
import type { OutputRef, Question, ReviewCard, RunEvent, RunTask } from "@/lib/agentic/types";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import { isSpeechSupported, startDictation, type Dictation } from "@/lib/speech";
import type { Lang } from "@/lib/types";
import { renderAssistantText } from "../agent/format";

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

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {events.map((e) => (
            <EventRow key={e.seq} event={e} s={s} answered={answeredIds} confirmed={confirmedIds} questions={questionsById} />
          ))}
          {run.pendingQuestion && !answeredIds.has(run.pendingQuestion.id) && (
            <QuestionCard q={run.pendingQuestion} s={s} disabled={props.loading} onAnswer={(value) => props.onSend({ answer: { questionId: run.pendingQuestion!.id, value } })} />
          )}
          {run.pendingCard && !confirmedIds.has(run.pendingCard.id) && (
            <ReviewCardView card={run.pendingCard} s={s} disabled={props.loading} onDecide={(accepted) => props.onSend({ confirm: { cardId: run.pendingCard!.id, accepted } })} />
          )}
          {props.loading && (
            <p className="text-xs text-ink-3 font-mono animate-pulse px-1">{s.statusRunning}…</p>
          )}
          {props.error && (
            <p className="text-xs font-semibold text-alarm bg-alarm-soft border border-alarm/30 rounded-lg px-3 py-2">{props.error}</p>
          )}
        </div>
      </div>

      <Composer s={s} lang={props.lang} disabled={props.loading || run.status === "cancelled" || run.status === "failed"} onSubmit={(message) => props.onSend({ message })} />
    </div>
  );
}

/* ------------------------------------------------------------------ pieces -- */

function answerLabel(value: string | number | boolean, q: Question | undefined, s: AgenticStrings): string {
  if (typeof value === "boolean") return value ? s.yes : s.no;
  if (q?.expects === "file") return value === "none" ? (q.skipLabel ?? s.dontHaveIt) : s.uploaded;
  return q?.choices?.find((c) => c.value === String(value))?.label ?? String(value);
}

function EventRow({ event, s, answered, confirmed, questions }: { event: RunEvent; s: AgenticStrings; answered: Set<string>; confirmed: Set<string>; questions: Map<string, Question> }) {
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
      if (!answered.has(p.question.id)) return null; // the live one renders at the bottom
      return (
        <div className="flex items-start gap-3">
          <Avatar />
          <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-line bg-paper-2 px-4 py-3 text-[15px] text-ink">
            <p>{p.question.text}</p>
            <p className="mt-1 text-xs text-ink-3">{p.question.why}</p>
          </div>
        </div>
      );
    }
    case "answer":
      return (
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-br-md bg-amber-bg border border-amber-500/30 px-4 py-2 text-sm text-ink">{answerLabel(p.value, questions.get(p.questionId), s)}</div>
        </div>
      );
    case "review_card":
      if (!confirmed.has(p.card.id)) return null;
      return <ReviewCardView card={p.card} s={s} disabled inert />;
    case "confirmation":
      return (
        <p className="flex items-center gap-2 px-11 text-xs font-mono text-ink-3">
          {p.accepted ? <Check size={12} className="text-money" aria-hidden="true" /> : <X size={12} aria-hidden="true" />} {p.accepted ? s.confirm : s.cancel}
        </p>
      );
    case "output":
      return (
        <div className="px-11">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-2 px-3 py-1.5 text-xs text-ink">
            <FileText size={13} className="text-money" aria-hidden="true" /> {p.output.title}
            <span className="text-ink-3">· {s.simulatedBadge}</span>
          </span>
        </div>
      );
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

function QuestionCard({ q, s, disabled, onAnswer }: { q: Question; s: AgenticStrings; disabled: boolean; onAnswer: (v: string | number | boolean) => void }) {
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /** A document answered inline: stored in the citizen's vault, then its id is the answer. */
  const upload = async (file: File | undefined) => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("docType", q.docType ?? "OTHER");
      form.append("assessmentYear", "2026-27");
      const res = await fetch("/api/vault/documents", { method: "POST", credentials: "same-origin", body: form });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; document?: { id: string } };
      if (!res.ok || !body.ok || !body.document?.id) throw new Error("refused");
      onAnswer(body.document.id);
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
        <p className="text-[15px] text-ink leading-relaxed">{q.text}</p>
        {q.docHint && <p className="text-sm text-ink-2 leading-relaxed">{q.docHint}</p>}
        <p className="text-xs text-ink-3">{q.why}</p>
        {q.expects === "file" ? (
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
            {q.choices.map((c) => (
              <button key={c.value} type="button" disabled={disabled} onClick={() => onAnswer(c.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink hover:bg-paper-3 disabled:opacity-50 cursor-pointer">{c.label}</button>
            ))}
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

function ReviewCardView({ card, s, disabled, inert = false, onDecide }: { card: ReviewCard; s: AgenticStrings; disabled: boolean; inert?: boolean; onDecide?: (accepted: boolean) => void }) {
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
          <div className="flex gap-2 pt-1">
            <button type="button" disabled={disabled} onClick={() => onDecide?.(true)} className="flex-1 rounded-lg bg-ink text-paper px-4 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer">{card.confirmLabel}</button>
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
          className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-ink placeholder:text-ink-3 outline-none max-h-40 disabled:opacity-60"
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

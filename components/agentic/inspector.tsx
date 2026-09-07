"use client";

/**
 * The right-hand inspector (plan.md §6): Progress, Outputs, Sources — three
 * stable controls that open one panel beneath them. Sources are what THIS chat
 * actually used, grouped as "Your documents", "Information you provided",
 * "Tax rules" and "Assumptions"; never the whole vault. Empty states are
 * honest sentences, and the controls keep their place whether or not there is
 * anything to show, so the mode switch never moves.
 */

import { Activity, Check, Circle, Download, FileText, Loader2, MinusCircle, Package, Scale, ShieldAlert, UserRound } from "lucide-react";
import type { OutputRef, PlanStep, SourceRef } from "@/lib/agentic/types";
import type { AgenticStrings } from "@/lib/i18n/agenticStrings";
import BottomSheet from "../mobile/bottom-sheet";

export type InspectorTab = "progress" | "outputs" | "sources";

export interface InspectorProps {
  s: AgenticStrings;
  open: InspectorTab | null;
  onToggle: (tab: InspectorTab) => void;
  steps: PlanStep[];
  outputs: OutputRef[];
  sources: SourceRef[];
  runId: string | null;
  /** Manual mode: the controls exist, the panel explains where this data lives. */
  manualNote?: string;
  /** Turns where the model's wording was not used, with the reason (quota, rejected reply, budget). */
  modelNotes?: string[];
  /** Phones/tablets: the panel is a bottom sheet; this closes it. */
  onClose?: () => void;
}

export function InspectorControls({ s, open, onToggle, steps, outputs, sources }: Pick<InspectorProps, "s" | "open" | "onToggle" | "steps" | "outputs" | "sources">) {
  const items: { id: InspectorTab; label: string; count: number; Icon: typeof Activity }[] = [
    { id: "progress", label: s.progress, count: steps.filter((x) => x.state === "done").length, Icon: Activity },
    { id: "outputs", label: s.outputs, count: outputs.length, Icon: Package },
    { id: "sources", label: s.sources, count: sources.length, Icon: Scale },
  ];
  return (
    <div className="flex items-center gap-1 shrink-0" role="tablist" aria-label={`${s.progress} · ${s.outputs} · ${s.sources}`}>
      {/* Phones: one 36 px square opens the inspector sheet on Progress (handoff 2, M4). */}
      <button
        type="button"
        onClick={() => onToggle(open ?? "progress")}
        aria-pressed={open !== null}
        aria-label={s.progress}
        className={`md:hidden size-9 rounded-[12px] flex items-center justify-center cursor-pointer ${open ? "bg-amber-bg border border-money text-amber-ink" : "glass-flat text-ink"}`}
      >
        <Activity size={16} aria-hidden="true" />
      </button>
      {items.map(({ id, label, count, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={open === id}
          onClick={() => onToggle(id)}
          className={`max-md:hidden h-[38px] px-3 rounded-lg border text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            open === id ? "border-money bg-money-soft text-money" : "border-line bg-paper-2 text-ink-2 hover:text-ink"
          }`}
        >
          <Icon size={13} aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
          {count > 0 && <span className="font-mono text-[10px] rounded bg-paper px-1 border border-line text-ink-3">{count}</span>}
        </button>
      ))}
    </div>
  );
}

function StepIcon({ state }: { state: PlanStep["state"] }) {
  if (state === "done") return <Check size={14} className="text-money" aria-hidden="true" />;
  if (state === "active") return <Loader2 size={14} className="text-money animate-spin" aria-hidden="true" />;
  if (state === "skipped") return <MinusCircle size={14} className="text-ink-3" aria-hidden="true" />;
  if (state === "blocked" || state === "failed") return <ShieldAlert size={14} className="text-alarm" aria-hidden="true" />;
  return <Circle size={14} className="text-ink-3" aria-hidden="true" />;
}

export function InspectorPanel({ s, open, onToggle, onClose, steps, outputs, sources, runId, manualNote, modelNotes = [] }: InspectorProps) {
  if (!open) return null;
  const label = open === "progress" ? s.progress : open === "outputs" ? s.outputs : s.sources;
  const body = (
      <div className="p-4 max-lg:p-0 space-y-3">
        {manualNote && <p className="text-xs text-ink-2 leading-relaxed rounded-lg border border-line bg-paper p-3">{manualNote}</p>}

        {open === "progress" && (
          steps.length === 0 ? (
            <p className="text-xs text-ink-3 leading-relaxed">{s.inspectorEmptyProgress}</p>
          ) : (
            <ol className="space-y-1.5">
              {steps.map((step) => (
                <li key={step.id} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5">
                  <span className="mt-0.5 shrink-0"><StepIcon state={step.state} /></span>
                  <span className="min-w-0">
                    <span className={`block text-sm ${step.state === "done" ? "text-ink-2" : step.state === "active" ? "text-ink font-semibold" : "text-ink-2"}`}>{step.label}</span>
                    {step.note && <span className="block text-[11px] text-ink-3 leading-snug">{step.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )
        )}
        {open === "progress" && modelNotes.length > 0 && (
          <section className="rounded-lg border border-line bg-paper px-3 py-2">
            <h4 className="cap mb-1">{s.inspectorModelNotes.replace("{n}", String(modelNotes.length))}</h4>
            <ul className="space-y-0.5">
              {[...new Set(modelNotes)].map((note) => <li key={note} className="font-mono text-[11px] text-ink-3 leading-snug break-words">{note}</li>)}
            </ul>
          </section>
        )}

        {open === "outputs" && (
          outputs.length === 0 ? (
            <p className="text-xs text-ink-3 leading-relaxed">{s.inspectorEmptyOutputs}</p>
          ) : (
            <ul className="space-y-2">
              {outputs.map((o) => (
                <li key={o.id} className="rounded-xl border border-line bg-paper p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-money mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-ink truncate">{o.title}</p>
                        {(o.mimeType === "application/pdf" || o.kind === "itrv_acknowledgement_pdf") && (
                          <span className="rounded-full bg-ok-soft px-1.5 py-0.5 text-[9px] font-bold text-ok-ink uppercase shrink-0">
                            PDF
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-ink-3">rev {o.snapshotRevision} · {o.snapshotHash.slice(0, 10)}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-ink">{s.simulatedBadge}</p>
                  {runId && (
                    <a href={`/api/runs/${runId}/outputs/${o.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-money hover:underline" download>
                      <Download size={12} aria-hidden="true" /> {o.mimeType === "application/pdf" || o.kind === "itrv_acknowledgement_pdf" ? `${s.download} (PDF)` : s.download}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )
        )}

        {open === "sources" && (
          sources.length === 0 ? (
            <p className="text-xs text-ink-3 leading-relaxed">{s.inspectorEmptySources}</p>
          ) : (
            <div className="space-y-4">
              {(
                [
                  ["document", s.sourcesDocuments, FileText],
                  ["answer", s.sourcesAnswers, UserRound],
                  ["rule", s.sourcesRules, Scale],
                  ["assumption", s.sourcesAssumptions, ShieldAlert],
                ] as const
              ).map(([kind, label, Icon]) => {
                const list = sources.filter((x) => x.kind === kind);
                if (list.length === 0) return null;
                return (
                  <section key={kind}>
                    <h4 className="cap mb-1.5 flex items-center gap-1.5"><Icon size={11} aria-hidden="true" /> {label}</h4>
                    <ul className="space-y-1.5">
                      {list.map((x) => (
                        <li key={`${x.kind}:${x.id}`} className="rounded-lg border border-line bg-paper px-3 py-2">
                          <p className="text-sm text-ink leading-snug">{x.label}</p>
                          <p className="text-[11px] text-ink-3 leading-snug break-words">
                            {x.detail}
                            {x.verified ? " · ✓" : ""}
                            {x.url && (
                              <>
                                {" · "}
                                <a href={x.url} target="_blank" rel="noreferrer" className="text-money hover:underline">{s.openDocument}</a>
                              </>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )
        )}
      </div>
  );
  return (
    <>
      <aside className="hidden lg:block w-[320px] shrink-0 border-l border-line bg-paper-2/60 overflow-y-auto" aria-label={label}>
        {body}
      </aside>
      <BottomSheet open onClose={() => onClose?.()} title={label} subtitle={`${s.progress} · ${s.outputs} · ${s.sources}`} icon={<Activity size={18} aria-hidden="true" />} closeLabel={s.cancel}>
        <div className="mb-3.5 flex gap-[3px] rounded-[14px] border border-glass-edge bg-white/50 dark:bg-white/[0.06] p-[3px] text-[12.5px] font-bold" role="tablist">
          {(["progress", "outputs", "sources"] as const).map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={open === tab} onClick={() => onToggle(tab)} className={`flex-1 h-9 rounded-[11px] cursor-pointer ${open === tab ? "ink-surface" : "text-ink-3"}`}>
              {tab === "progress" ? s.progress : tab === "outputs" ? s.outputs : s.sources}
            </button>
          ))}
        </div>
        {body}
      </BottomSheet>
    </>
  );
}

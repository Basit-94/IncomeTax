"use client";

/**
 * The right column (plan §3.8): Progress (appears only once a plan exists), Outputs,
 * Context. Mirrors the CoWork panel the user pointed at.
 */
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, FileCode2, FileText, Loader2, Receipt, BookOpen, Bookmark, Database, Link2 } from "lucide-react";
import type { RunView } from "@/lib/harness/view";

function Section({ title, count, children, defaultOpen = true }: { title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-ink"
      >
        {title}
        {typeof count === "number" && <span className="font-mono text-xs font-normal text-ink-3">{count}</span>}
        <span className="ms-auto text-ink-3">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

const OUTPUT_ICON = { "itr-json": FileCode2, "itr-v": Receipt, challan: Receipt, summary: FileText, "notice-reply": FileText } as const;
const CONTEXT_ICON = { document: FileText, slot: Database, source: Link2, memory: Bookmark } as const;

export default function SidePanel({ view }: { view: RunView }) {
  const done = view.plan.filter((s) => s.status === "done").length;
  return (
    <aside className="surface-panel overflow-hidden text-sm" data-testid="side-panel" aria-label="Progress, outputs and context">
      {view.plan.length > 0 && (
        <Section title="Progress" count={done === view.plan.length ? undefined : done}>
          <ol className="space-y-2" data-testid="progress-list">
            {view.plan.map((step) => (
              <li key={step.id} className="flex gap-2" data-step-status={step.status}>
                {step.status === "done" ? (
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-money text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                ) : step.status === "active" ? (
                  <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-money" aria-hidden="true" />
                ) : (
                  <Circle size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
                )}
                <div>
                  <p className={step.status === "done" ? "text-ink-3 line-through" : "text-ink"}>{step.title}</p>
                  {step.detail && step.status !== "done" && <p className="text-xs text-ink-3">{step.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}
      <Section title="Outputs" count={view.outputs.length}>
        {view.outputs.length === 0 ? (
          <p className="text-xs text-ink-3">Files the assistant produces appear here.</p>
        ) : (
          <ul className="space-y-2" data-testid="outputs-list">
            {view.outputs.map((output) => {
              const Icon = OUTPUT_ICON[output.kind as keyof typeof OUTPUT_ICON] ?? FileText;
              return (
                <li key={output.outputId}>
                  <a href={output.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded border border-line bg-paper-2 px-2 py-1.5 hover:border-money">
                    <Icon size={14} className="text-ink-2" aria-hidden="true" />
                    <span className="font-mono text-xs text-ink">{output.name}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
      <Section title="Context" count={view.context.length + view.memories.length} defaultOpen={view.context.length + view.memories.length > 0}>
        {view.context.length + view.memories.length === 0 ? (
          <p className="text-xs text-ink-3">Documents, sources and memories the assistant used.</p>
        ) : (
          <ul className="space-y-1.5">
            {view.context.map((item, index) => {
              const Icon = CONTEXT_ICON[item.kind];
              return (
                <li key={`${item.kind}-${index}`} className="flex items-center gap-2 text-xs">
                  <Icon size={13} className="shrink-0 text-ink-3" aria-hidden="true" />
                  <span className="text-ink">{item.label}</span>
                  <span className="ms-auto font-mono text-ink-3">{item.status}</span>
                </li>
              );
            })}
            {view.memories.map((memory) => (
              <li key={memory.key} className="flex items-center gap-2 text-xs">
                <BookOpen size={13} className="shrink-0 text-ink-3" aria-hidden="true" />
                <span className="font-mono text-ink-2">{memory.key}</span>
                <span className="ms-auto text-ink">{memory.value}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </aside>
  );
}

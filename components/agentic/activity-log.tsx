"use client";

/**
 * The "Worked for 22s" box (plan §3.8, the Claude-style step log). Collapsed by default
 * once the work is over; open while it is live so the person watches it happen. Rows are
 * exactly what the harness emitted: thoughts, tool calls with masked arguments, plan
 * steps, files produced, memories written.
 */
import { useState } from "react";
import { AlertTriangle, Brain, Check, ChevronDown, ChevronRight, FileOutput, Loader2, Terminal, Bookmark } from "lucide-react";
import type { ActivityRow } from "@/lib/harness/view";
import { formatWorked } from "@/lib/harness/view";

function Row({ row }: { row: ActivityRow }) {
  switch (row.kind) {
    case "thinking":
      return (
        <li className="flex gap-2">
          <Brain size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
          <div>
            <p className="text-[0.68rem] font-mono uppercase tracking-wider text-ink-3">Thinking it through</p>
            <p className="text-sm leading-relaxed text-ink-2">{row.text}</p>
          </div>
        </li>
      );
    case "tool":
      return (
        <li className="flex gap-2">
          <Terminal size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-mono text-xs text-ink">
              {row.name}
              {row.argsMasked && Object.keys(row.argsMasked).length > 0 && (
                <span className="text-ink-3"> {JSON.stringify(row.argsMasked)}</span>
              )}
            </p>
            {row.summary ? (
              <p className="text-sm text-ink-2">{row.summary}</p>
            ) : (
              <p className="flex items-center gap-1 text-xs text-ink-3">
                <Loader2 size={12} className="animate-spin" aria-hidden="true" /> running
              </p>
            )}
          </div>
        </li>
      );
    case "step":
      return (
        <li className="flex gap-2">
          {row.done ? (
            <Check size={14} className="mt-0.5 shrink-0 text-money" aria-hidden="true" />
          ) : (
            <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-ink-3" aria-hidden="true" />
          )}
          <p className="text-sm text-ink">
            {row.title}
            {row.note && <span className="text-ink-3"> · {row.note}</span>}
          </p>
        </li>
      );
    case "output":
      return (
        <li className="flex gap-2">
          <FileOutput size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
          <a href={row.href} className="text-sm font-semibold text-money hover:underline" target="_blank" rel="noreferrer">
            {row.name}
          </a>
        </li>
      );
    case "memory":
      return (
        <li className="flex gap-2">
          <Bookmark size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
          <p className="text-sm text-ink-2">
            {row.op === "remember" ? "Remembered" : "Forgot"}: <span className="font-mono text-xs">{row.key}</span>
            {row.value && <span> = {row.value}</span>}
          </p>
        </li>
      );
    case "error":
      return (
        <li className="flex gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-alarm" aria-hidden="true" />
          <p className="text-sm text-alarm">
            {row.message}
            {row.recoverable && <span className="text-ink-3"> · continuing another way</span>}
          </p>
        </li>
      );
  }
}

export default function ActivityLog({
  rows,
  startedAt,
  endedAt,
  live,
}: {
  rows: ActivityRow[];
  startedAt: string;
  endedAt: string;
  live: boolean;
}) {
  const [open, setOpen] = useState<boolean | null>(null);
  const expanded = open ?? live;
  const header = live ? "Working…" : `Worked for ${formatWorked(startedAt, endedAt)}`;
  return (
    <div className="my-2 rounded-lg border border-line bg-paper-2/60" data-testid="activity-log" data-live={live}>
      <button
        type="button"
        onClick={() => setOpen(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-mono text-ink-2 hover:text-ink"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {live && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
        <span>{header}</span>
        <span className="ms-auto text-ink-3">{rows.length} steps</span>
      </button>
      {expanded && (
        <ul className="space-y-2 border-t border-line px-3 py-3">
          {rows.map((row, index) => (
            <Row key={index} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

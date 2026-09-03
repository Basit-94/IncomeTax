"use client";

/**
 * Past chats (plan §3.6). Lists `/api/runs` newest first; opening one replays it. Until the
 * runs API exists (task 2.4) the list is honestly empty.
 */
import { useEffect, useState } from "react";
import { Clock, Trash2, X } from "lucide-react";

export interface RunSummary {
  id: string;
  title: string;
  taskId: string | null;
  status: string;
  updatedAt: string;
}

export default function HistoryDrawer({
  open,
  onClose,
  onOpenRun,
  refreshKey,
}: {
  open: boolean;
  onClose: () => void;
  onOpenRun: (id: string) => void;
  refreshKey?: number;
}) {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/runs")
      .then((res) => (res.ok ? res.json() : { runs: [] }))
      .then((body: { runs?: RunSummary[] }) => {
        if (!cancelled) setRuns(body.runs ?? []);
      })
      .catch(() => {
        if (!cancelled) setRuns([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey]);

  const remove = async (id: string) => {
    await fetch(`/api/runs/${id}`, { method: "DELETE" });
    setRuns((current) => current?.filter((run) => run.id !== id) ?? null);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/30" onClick={onClose} role="presentation">
      <aside
        className="h-full w-full max-w-sm overflow-y-auto border-l border-line bg-paper p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chat history"
        data-testid="history-drawer"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Your chats</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-2 hover:bg-paper-2">
            <X size={18} />
          </button>
        </div>
        {runs === null ? (
          <p className="mt-6 text-sm text-ink-3">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="mt-6 text-sm text-ink-3">No chats yet. Everything you start here is kept, so you can come back to it.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {runs.map((run) => (
              <li key={run.id} className="flex items-start gap-2 rounded-lg border border-line bg-paper-2 p-3">
                <button type="button" onClick={() => onOpenRun(run.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-ink">{run.title || "Untitled chat"}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[0.68rem] text-ink-3">
                    <Clock size={11} aria-hidden="true" /> {new Date(run.updatedAt).toLocaleString("en-IN")} · {run.status}
                  </p>
                </button>
                <button type="button" onClick={() => void remove(run.id)} aria-label="Delete chat" className="rounded p-1 text-ink-3 hover:text-alarm">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

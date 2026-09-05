"use client";

/**
 * Client side of a run (plan.md §5.4): create, list, follow by SSE with a
 * cursor, fall back to polling, and send messages / answers / confirmations.
 * Events are the truth; the hook only re-renders what the server persisted.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { OutputRef, RunEvent } from "@/lib/agentic/types";
import type { PublicRun } from "@/lib/agentic/runtime";

export interface RunView {
  run: PublicRun | null;
  events: RunEvent[];
  outputs: OutputRef[];
  durable: boolean;
  loading: boolean;
  error: string | null;
}

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

export function useRuns() {
  const [runs, setRuns] = useState<PublicRun[]>([]);
  const [durable, setDurable] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "unauthenticated" | "unavailable" | "ready">("idle");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/runs", { credentials: "same-origin" });
      if (res.status === 401) return setStatus("unauthenticated");
      if (res.status === 503 || res.status === 404) return setStatus("unavailable");
      const body = await json<{ runs: PublicRun[]; durable: boolean }>(res);
      setRuns(body.runs);
      setDurable(body.durable);
      setStatus("ready");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: { message?: string; task?: PublicRun["task"]; lang: string }) => {
    const res = await fetch("/api/runs", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await json<{ run: PublicRun; durable: boolean }>(res);
    setRuns((prev) => [body.run, ...prev.filter((r) => r.id !== body.run.id)]);
    return body.run;
  }, []);

  const remove = useCallback(async (id: string) => {
    await fetch(`/api/runs/${id}`, { method: "DELETE", credentials: "same-origin" });
    setRuns((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { runs, durable, status, refresh, create, remove };
}

export function useRun(runId: string | null) {
  const [view, setView] = useState<RunView>({ run: null, events: [], outputs: [], durable: true, loading: false, error: null });
  const cursor = useRef(0);
  const streaming = useRef<AbortController | null>(null);

  const load = useCallback(async (id: string, after = 0) => {
    const res = await fetch(`/api/runs/${id}?after=${after}`, { credentials: "same-origin" });
    const body = await json<{ run: PublicRun; events: RunEvent[]; outputs: OutputRef[]; durable: boolean }>(res);
    // Merge by seq, decided NOW: React runs the updater lazily, by which time
    // the cursor ref below has already advanced and would filter everything out.
    const fresh = body.events.filter((e) => e.seq > after);
    setView((v) => {
      const seen = new Set(after === 0 ? [] : v.events.map((e) => e.seq));
      const events = after === 0 ? body.events : [...v.events, ...fresh.filter((e) => !seen.has(e.seq))];
      return { run: body.run, events, outputs: body.outputs, durable: body.durable, loading: false, error: null };
    });
    cursor.current = Math.max(cursor.current, ...body.events.map((e) => e.seq), after);
    return body.run;
  }, []);

  /**
   * Follow the run while it is running: SSE first, a reconciling load after each stream.
   * The server closes a stream after a bounded window, so this loops until the run stops
   * running or a newer follow/unmount aborts it.
   */
  const follow = useCallback(
    async (id: string) => {
      streaming.current?.abort();
      const ac = new AbortController();
      streaming.current = ac;
      while (!ac.signal.aborted) {
        try {
          const res = await fetch(`/api/runs/${id}/events?after=${cursor.current}`, { credentials: "same-origin", signal: ac.signal });
          if (!res.ok || !res.body) throw new Error("no stream");
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf("\n\n")) >= 0) {
              const frame = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 2);
              const ev = /^event: (\w+)/m.exec(frame)?.[1];
              const data = /^data: (.*)$/m.exec(frame)?.[1];
              if (!ev || !data) continue;
              if (ev === "run_event") {
                const e = JSON.parse(data) as RunEvent;
                if (e.seq > cursor.current) {
                  cursor.current = e.seq;
                  setView((v) => ({ ...v, events: [...v.events, e] }));
                }
              }
            }
          }
        } catch {
          // stream unavailable or aborted — the load below still converges; a hard failure waits a beat
          if (!ac.signal.aborted) await new Promise((r) => setTimeout(r, 1000));
        }
        if (ac.signal.aborted) return;
        const run = await load(id, cursor.current);
        if (run.status !== "running" || streaming.current !== ac) return;
      }
    },
    [load],
  );

  useEffect(() => {
    cursor.current = 0;
    streaming.current?.abort();
    if (!runId) {
      setView({ run: null, events: [], outputs: [], durable: true, loading: false, error: null });
      return;
    }
    setView((v) => ({ ...v, loading: true }));
    load(runId).then((run) => {
      if (run.status === "running") void follow(runId);
    }).catch((e: Error) => setView((v) => ({ ...v, loading: false, error: e.message })));
    return () => streaming.current?.abort();
  }, [runId, load, follow]);

  const send = useCallback(
    async (input: { message?: string; answer?: { questionId: string; value: string | number | boolean }; confirm?: { cardId: string; accepted: boolean } }) => {
      if (!runId) return;
      setView((v) => ({ ...v, loading: true, error: null }));
      try {
        const res = await fetch(`/api/runs/${runId}`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await json(res);
        const run = await load(runId, cursor.current);
        if (run.status === "running") void follow(runId);
      } catch (e) {
        setView((v) => ({ ...v, loading: false, error: (e as Error).message }));
      }
    },
    [runId, load, follow],
  );

  return { ...view, send, reload: () => (runId ? load(runId) : Promise.resolve(null)) };
}

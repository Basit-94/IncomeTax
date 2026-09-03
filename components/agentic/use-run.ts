"use client";

/**
 * The client side of a run (plan task 2.6). Holds the event list, folds it into a
 * `RunView`, and talks to the harness: `send` opens or continues a run, `answer` writes the
 * value to the vault first and then tells the harness only the mask, `confirm` and `cancel`
 * act on a card, `load` replays a past run. Events arrive over SSE and are appended exactly
 * as the server persisted them.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RunEvent } from "@/lib/harness/events";
import { buildView } from "@/lib/harness/view";
import type { AskAnswer } from "./ask-form";

interface TurnBody {
  runId?: string;
  text?: string;
  answer?: { askId: string; slotId: string; masked: string; documentId?: string; unavailable?: boolean; skipped?: boolean; choice?: string };
  confirm?: { cardId: string; action: string };
  cancel?: { cardId: string };
}

export function useRun() {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const runId = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const view = useMemo(() => buildView(events), [events]);

  useEffect(() => () => abort.current?.abort(), []);

  const append = useCallback((event: RunEvent) => {
    if (event.type === "run.start") runId.current = event.runId;
    setEvents((current) => [...current, event]);
  }, []);

  const turn = useCallback(
    async (body: TurnBody) => {
      setBusy(true);
      setProblem(null);
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      try {
        const res = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, runId: body.runId ?? runId.current ?? undefined }),
          signal: controller.signal,
        });
        if (res.status === 401) {
          setProblem("Your session ended. Sign in again; this chat is kept.");
          return;
        }
        if (!res.ok || !res.body) {
          setProblem("The assistant could not be reached. Try again.");
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let index: number;
          while ((index = buffer.indexOf("\n\n")) >= 0) {
            const chunk = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                append(JSON.parse(line.slice(6)) as RunEvent);
              } catch {
                /* a torn frame; the next one carries on */
              }
            }
          }
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setProblem("The connection dropped. Reload to pick the chat up where it was.");
      } finally {
        setBusy(false);
      }
    },
    [append],
  );

  const send = useCallback((text: string) => void turn({ text }), [turn]);

  const answer = useCallback(
    async (askId: string, value: AskAnswer) => {
      const ask = events.find((e) => e.type === "ask" && e.askId === askId);
      if (!ask || ask.type !== "ask") return;
      setBusy(true);
      setProblem(null);
      try {
        if (value.kind === "file") {
          const form = new FormData();
          form.append("file", value.file);
          form.append("docType", ask.input.kind === "upload" ? ask.input.docType : "other");
          form.append("slotId", ask.slotId);
          const res = await fetch("/api/vault/documents", { method: "POST", body: form });
          const body = (await res.json()) as { document?: { id: string; filename: string }; message?: string };
          if (!res.ok || !body.document) {
            setProblem(body.message ?? "The file could not be stored.");
            return;
          }
          await turn({ answer: { askId, slotId: ask.slotId, masked: body.document.filename, documentId: body.document.id } });
          return;
        }
        const res = await fetch("/api/vault/slots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId: ask.slotId, value: value.value }),
        });
        const body = (await res.json()) as { masked?: string; choice?: string; message?: string };
        if (!res.ok) {
          setProblem(body.message ?? "That answer could not be saved.");
          return;
        }
        await turn({ answer: { askId, slotId: ask.slotId, masked: body.masked ?? value.masked, choice: body.choice } });
      } finally {
        setBusy(false);
      }
    },
    [events, turn],
  );

  const skip = useCallback(
    (askId: string) => {
      const ask = events.find((e) => e.type === "ask" && e.askId === askId);
      if (!ask || ask.type !== "ask") return;
      void turn({ answer: { askId, slotId: ask.slotId, masked: "skipped", skipped: true } });
    },
    [events, turn],
  );

  const confirm = useCallback((cardId: string, action: string) => void turn({ confirm: { cardId, action } }), [turn]);
  const cancel = useCallback((cardId: string) => void turn({ cancel: { cardId } }), [turn]);

  const load = useCallback(async (id: string) => {
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch(`/api/runs/${id}`);
      if (!res.ok) {
        setProblem(res.status === 404 ? "That chat was deleted." : "Could not open that chat.");
        return;
      }
      const body = (await res.json()) as { events: RunEvent[] };
      runId.current = id;
      setEvents(body.events);
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    runId.current = null;
    setEvents([]);
    setProblem(null);
  }, []);

  return { events, view, busy, problem, send, answer, skip, confirm, cancel, load, reset };
}

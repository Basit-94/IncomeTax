import { describe, expect, it } from "vitest";
import { buildView, formatWorked } from "../view";
import type { RunEvent } from "../events";

const t = (s: number) => new Date(Date.UTC(2026, 8, 3, 0, 0, s)).toISOString();

describe("run view", () => {
  it("groups work between messages into one activity block and counts its seconds", () => {
    const events: RunEvent[] = [
      { type: "run.start", runId: "r1", taskId: "file_return", title: "New job, 14 lakh", at: t(0) },
      { type: "message", role: "user", text: "I got a job", at: t(0) },
      { type: "thinking", text: "Salaried, first return.", at: t(1) },
      { type: "plan", steps: [{ id: "a", title: "Understand" }, { id: "b", title: "Gather" }], at: t(2) },
      { type: "step.start", stepId: "a", at: t(2) },
      { type: "tool.call", name: "classify_situation", argsMasked: { text: "…" }, at: t(3) },
      { type: "tool.result", name: "classify_situation", summary: "file_return", at: t(5) },
      { type: "step.done", stepId: "a", at: t(6) },
      { type: "message", role: "assistant", text: "Let us start.", at: t(7) },
    ];
    const view = buildView(events);
    expect(view.status).toBe("running");
    expect(view.title).toBe("New job, 14 lakh");
    expect(view.blocks.map((b) => b.kind)).toEqual(["message", "activity", "message"]);
    const activity = view.blocks[1];
    if (activity.kind !== "activity") throw new Error("expected activity");
    expect(activity.live).toBe(false);
    expect(activity.rows.map((r) => r.kind)).toEqual(["thinking", "step", "tool"]);
    const tool = activity.rows[2];
    if (tool.kind !== "tool") throw new Error();
    expect(tool.summary).toBe("file_return");
    const step = activity.rows[1];
    if (step.kind !== "step") throw new Error();
    expect(step.done).toBe(true);
    expect(view.plan).toEqual([
      { id: "a", title: "Understand", status: "done" },
      { id: "b", title: "Gather", status: "pending" },
    ]);
    expect(view.workedSeconds).toBe(6);
    expect(formatWorked(t(0), t(75))).toBe("1m 15s");
  });

  it("a question pauses the run and its answer resumes it, masked", () => {
    const view = buildView([
      { type: "run.start", runId: "r", title: "x", at: t(0) },
      { type: "ask", askId: "q1", slotId: "aadhaar", prompt: "Your 12-digit number?", input: { kind: "identifier", format: "aadhaar" }, at: t(1) },
    ]);
    expect(view.status).toBe("waiting");
    const after = buildView([
      { type: "run.start", runId: "r", title: "x", at: t(0) },
      { type: "ask", askId: "q1", slotId: "aadhaar", prompt: "?", input: { kind: "identifier", format: "aadhaar" }, at: t(1) },
      { type: "answered", askId: "q1", masked: "XXXX XXXX 1234", at: t(2) },
    ]);
    expect(after.status).toBe("running");
    const ask = after.blocks[0];
    if (ask.kind !== "ask") throw new Error();
    expect(ask.answered).toBe("XXXX XXXX 1234");
  });

  it("outputs, context and memory land in the side panel and the activity box", () => {
    const view = buildView([
      { type: "run.start", runId: "r", title: "x", at: t(0) },
      { type: "context", items: [{ kind: "document", label: "Form 16", status: "in vault" }], at: t(1) },
      { type: "memory", op: "remember", key: "has_pf", value: "yes", at: t(1) },
      { type: "memory", op: "remember", key: "has_pf", value: "no", at: t(2) },
      { type: "output", outputId: "o1", kind: "itr-v", name: "ITR-V.html", href: "/api/outputs/o1", at: t(3) },
      { type: "memory", op: "forget", key: "has_pf", at: t(4) },
      { type: "run.done", status: "complete", at: t(5) },
    ]);
    expect(view.context).toHaveLength(1);
    expect(view.memories).toEqual([]);
    expect(view.outputs).toEqual([{ outputId: "o1", kind: "itr-v", name: "ITR-V.html", href: "/api/outputs/o1" }]);
    expect(view.status).toBe("complete");
    const activity = view.blocks[0];
    if (activity.kind !== "activity") throw new Error();
    expect(activity.rows.filter((r) => r.kind === "memory")).toHaveLength(3);
  });

  it("a confirm card waits; an unrecoverable error fails the run", () => {
    const waiting = buildView([
      { type: "run.start", runId: "r", title: "x", at: t(0) },
      { type: "card", cardId: "c", card: { type: "confirm", title: "File?", body: "b", rows: [], confirmLabel: "File", cancelLabel: "Not yet", action: "file_return" }, at: t(1) },
    ]);
    expect(waiting.status).toBe("waiting");
    const failed = buildView([
      { type: "run.start", runId: "r", title: "x", at: t(0) },
      { type: "error", message: "session expired", recoverable: false, at: t(1) },
    ]);
    expect(failed.status).toBe("failed");
  });
});

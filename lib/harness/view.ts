/**
 * Folds a run's events into what the surface renders (plan §3.8). Pure and framework-free
 * so the shape is unit-tested in node; the components only map this to markup.
 *
 * Blocks are the transcript. Consecutive "work" events (thinking, tool calls, steps,
 * outputs, context, memory) collapse into one activity block, the "Worked for 22s" box
 * under a reply. Messages, questions and cards are their own blocks.
 */
import type { Card, ContextItem, PlanStep, RunEvent, SlotInput, TaskId } from "./events";

export type ActivityRow =
  | { kind: "thinking"; text: string }
  | { kind: "tool"; name: string; summary?: string; argsMasked?: Record<string, unknown> }
  | { kind: "step"; stepId: string; title: string; done: boolean; note?: string }
  | { kind: "output"; name: string; href: string; outputKind: string }
  | { kind: "memory"; op: "remember" | "forget"; key: string; value?: string }
  | { kind: "error"; message: string; recoverable: boolean };

export type Block =
  | { kind: "message"; role: "user" | "assistant"; text: string; at: string }
  | { kind: "activity"; rows: ActivityRow[]; startedAt: string; endedAt: string; live: boolean }
  | { kind: "ask"; askId: string; slotId: string; prompt: string; why?: string; input: SlotInput; prefill?: string; optional?: boolean; answered?: string }
  | { kind: "card"; cardId: string; card: Card };

export type StepStatus = "pending" | "active" | "done";

export interface RunView {
  runId: string | null;
  taskId: TaskId | null;
  title: string;
  status: "idle" | "running" | "waiting" | "complete" | "failed";
  offline: boolean;
  plan: (PlanStep & { status: StepStatus })[];
  outputs: { outputId: string; kind: string; name: string; href: string }[];
  context: ContextItem[];
  memories: { key: string; value: string }[];
  blocks: Block[];
  /** Seconds of work since the last user message, for "Worked for Ns". */
  workedSeconds: number;
}

export function emptyView(): RunView {
  return {
    runId: null,
    taskId: null,
    title: "",
    status: "idle",
    offline: false,
    plan: [],
    outputs: [],
    context: [],
    memories: [],
    blocks: [],
    workedSeconds: 0,
  };
}

function seconds(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000));
}

function lastActivity(view: RunView, at: string): Extract<Block, { kind: "activity" }> {
  const last = view.blocks[view.blocks.length - 1];
  if (last && last.kind === "activity" && last.live) return last;
  const block: Extract<Block, { kind: "activity" }> = { kind: "activity", rows: [], startedAt: at, endedAt: at, live: true };
  view.blocks.push(block);
  return block;
}

function closeActivity(view: RunView, at: string): void {
  const last = view.blocks[view.blocks.length - 1];
  if (last && last.kind === "activity" && last.live) {
    last.live = false;
    last.endedAt = at;
    view.workedSeconds += seconds(last.startedAt, last.endedAt);
  }
}

/** Apply one event. Mutates and returns the same view; callers copy if they need identity changes. */
export function applyEvent(view: RunView, event: RunEvent): RunView {
  switch (event.type) {
    case "run.start":
      view.runId = event.runId;
      view.taskId = event.taskId ?? null;
      view.title = event.title;
      view.status = "running";
      view.offline = Boolean(event.offline);
      return view;
    case "message":
      closeActivity(view, event.at);
      if (event.role === "user") view.workedSeconds = 0;
      view.blocks.push({ kind: "message", role: event.role, text: event.text, at: event.at });
      if (event.role === "user") view.status = "running";
      return view;
    case "thinking": {
      const block = lastActivity(view, event.at);
      block.rows.push({ kind: "thinking", text: event.text });
      block.endedAt = event.at;
      return view;
    }
    case "plan":
      view.plan = event.steps.map((step) => ({ ...step, status: "pending" }));
      return view;
    case "step.start": {
      view.plan = view.plan.map((step) => (step.id === event.stepId ? { ...step, status: "active" } : step));
      const title = view.plan.find((step) => step.id === event.stepId)?.title ?? event.stepId;
      const block = lastActivity(view, event.at);
      block.rows.push({ kind: "step", stepId: event.stepId, title, done: false });
      block.endedAt = event.at;
      return view;
    }
    case "step.done": {
      view.plan = view.plan.map((step) => (step.id === event.stepId ? { ...step, status: "done" } : step));
      const block = lastActivity(view, event.at);
      const row = [...block.rows].reverse().find((r) => r.kind === "step" && r.stepId === event.stepId);
      if (row && row.kind === "step") {
        row.done = true;
        row.note = event.note;
      } else {
        const title = view.plan.find((step) => step.id === event.stepId)?.title ?? event.stepId;
        block.rows.push({ kind: "step", stepId: event.stepId, title, done: true, note: event.note });
      }
      block.endedAt = event.at;
      return view;
    }
    case "tool.call": {
      const block = lastActivity(view, event.at);
      block.rows.push({ kind: "tool", name: event.name, argsMasked: event.argsMasked });
      block.endedAt = event.at;
      return view;
    }
    case "tool.result": {
      const block = lastActivity(view, event.at);
      const row = [...block.rows].reverse().find((r) => r.kind === "tool" && r.name === event.name && r.summary === undefined);
      if (row && row.kind === "tool") row.summary = event.summary;
      else block.rows.push({ kind: "tool", name: event.name, summary: event.summary });
      block.endedAt = event.at;
      return view;
    }
    case "ask":
      closeActivity(view, event.at);
      view.status = "waiting";
      view.blocks.push({
        kind: "ask",
        askId: event.askId,
        slotId: event.slotId,
        prompt: event.prompt,
        why: event.why,
        input: event.input,
        prefill: event.prefill,
        optional: event.optional,
      });
      return view;
    case "answered": {
      const block = view.blocks.find((b) => b.kind === "ask" && b.askId === event.askId);
      if (block && block.kind === "ask") block.answered = event.masked;
      view.status = "running";
      return view;
    }
    case "card":
      closeActivity(view, event.at);
      view.blocks.push({ kind: "card", cardId: event.cardId, card: event.card });
      if (event.card.type === "confirm") view.status = "waiting";
      return view;
    case "output": {
      view.outputs.push({ outputId: event.outputId, kind: event.kind, name: event.name, href: event.href });
      const block = lastActivity(view, event.at);
      block.rows.push({ kind: "output", name: event.name, href: event.href, outputKind: event.kind });
      block.endedAt = event.at;
      return view;
    }
    case "context":
      view.context = event.items;
      return view;
    case "memory": {
      if (event.op === "remember" && event.value !== undefined) {
        view.memories = [...view.memories.filter((m) => m.key !== event.key), { key: event.key, value: event.value }];
      } else {
        view.memories = view.memories.filter((m) => m.key !== event.key);
      }
      const block = lastActivity(view, event.at);
      block.rows.push({ kind: "memory", op: event.op, key: event.key, value: event.value });
      block.endedAt = event.at;
      return view;
    }
    case "error": {
      const block = lastActivity(view, event.at);
      block.rows.push({ kind: "error", message: event.message, recoverable: event.recoverable });
      block.endedAt = event.at;
      if (!event.recoverable) {
        closeActivity(view, event.at);
        view.status = "failed";
      }
      return view;
    }
    case "run.done":
      closeActivity(view, event.at);
      view.status = event.status;
      return view;
    default:
      return view;
  }
}

export function buildView(events: RunEvent[]): RunView {
  return events.reduce((view, event) => applyEvent(view, event), emptyView());
}

/** Human duration for the activity box header. */
export function formatWorked(startedAt: string, endedAt: string): string {
  const s = seconds(startedAt, endedAt);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s - m * 60}s`;
}

/**
 * The event protocol between the harness and the agentic surface (plan §3.4). Every event
 * is persisted to `run_events` before it is streamed, so replaying a run is the same code
 * path as watching it live. Nothing in an event is a secret: values go to the vault by a
 * separate request and only ever appear here masked.
 */

export type TaskId =
  | "file_return"
  | "compare_regimes"
  | "business_benefits"
  | "respond_notice"
  | "pay_tax"
  | "check_refund"
  | "demo_persona"
  | "unknown";

export interface PlanStep {
  id: string;
  title: string;
  detail?: string;
}

/** How the isolated form under a question renders. The value never passes through the model. */
export type SlotInput =
  | { kind: "text"; placeholder?: string; maxLength?: number }
  | { kind: "identifier"; format: "pan" | "aadhaar" | "ifsc" | "bank_account" | "mobile" | "email" | "tan" | "din" | "gstin" | "ack" | "uan" | "pin" }
  | { kind: "money"; min?: number; max?: number }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "date"; min?: string; max?: string }
  | { kind: "select"; options: { value: string; label: string; detail?: string }[] }
  | { kind: "yesno" }
  | { kind: "upload"; accept: string[]; docType: string };

export type Card =
  | {
      type: "review";
      title: string;
      rows: { label: string; value: string; note?: string }[];
      footer?: string;
    }
  | {
      type: "confirm";
      title: string;
      body: string;
      rows: { label: string; value: string }[];
      confirmLabel: string;
      cancelLabel: string;
      action: "file_return" | "pay_challan" | "stage_revised";
    }
  | { type: "document"; title: string; docType: string; source: "vault" | "digilocker" | "upload"; filename: string; note?: string }
  | { type: "itrv"; ackNumber: string; filedAt: string; name: string; refundOrDue: number; regime: "new" | "old" }
  | { type: "challan"; amount: number; bsr: string; serial: string; paidAt: string }
  | { type: "vaultStatus"; items: { slotId: string; label: string; status: "filled" | "missing" | "unavailable"; source?: string; masked?: string }[] }
  | { type: "memory"; items: { key: string; value: string }[] }
  | { type: "comparison"; newRegime: number; oldRegime: number; recommended: "new" | "old"; note: string };

export type ContextItem = {
  kind: "document" | "slot" | "source" | "memory";
  label: string;
  status: string;
};

export type RunEvent =
  | { type: "run.start"; runId: string; taskId?: TaskId; title: string; at: string; offline?: boolean }
  | { type: "thinking"; text: string; at: string }
  | { type: "plan"; steps: PlanStep[]; at: string }
  | { type: "step.start"; stepId: string; at: string }
  | { type: "step.done"; stepId: string; note?: string; at: string }
  | { type: "tool.call"; name: string; argsMasked: Record<string, unknown>; at: string }
  | { type: "tool.result"; name: string; summary: string; at: string }
  | { type: "message"; role: "user" | "assistant"; text: string; at: string }
  | { type: "ask"; askId: string; slotId: string; prompt: string; why?: string; input: SlotInput; prefill?: string; optional?: boolean; at: string }
  | { type: "answered"; askId: string; masked: string; at: string }
  | { type: "card"; cardId: string; card: Card; at: string }
  | { type: "output"; outputId: string; kind: "itr-json" | "itr-v" | "challan" | "summary" | "notice-reply"; name: string; href: string; at: string }
  | { type: "context"; items: ContextItem[]; at: string }
  | { type: "memory"; op: "remember" | "forget"; key: string; value?: string; at: string }
  | { type: "error"; message: string; recoverable: boolean; at: string }
  | { type: "run.done"; status: "complete" | "waiting" | "failed"; at: string };

export type RunEventType = RunEvent["type"];

/** A RunEvent without its timestamp, distributed over the union (plain Omit would collapse it). */
export type RunEventInput = RunEvent extends infer E ? (E extends RunEvent ? Omit<E, "at"> : never) : never;

export function stamp(): string {
  return new Date().toISOString();
}

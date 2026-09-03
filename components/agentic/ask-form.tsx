"use client";

/**
 * The isolated input under a question (plan §3.3 step 4). The value goes to `onAnswer`,
 * which the surface routes to the vault; the model only ever sees the masked form. Format
 * checks run here so a typo never reaches the server, and the rule is "say what would be
 * right", never "invalid".
 */
import { useRef, useState, type FormEvent } from "react";
import { Check, Upload } from "lucide-react";
import type { SlotInput } from "@/lib/harness/events";
import { issueText, validateDob, validateIdentifier, validateMoney } from "@/lib/validation";
import { formatMoney } from "@/lib/money";

export type AskAnswer =
  | { kind: "value"; value: string; masked: string }
  | { kind: "file"; file: File; masked: string };

export default function AskForm({
  askId,
  slotId,
  prompt,
  why,
  input,
  prefill,
  answered,
  optional = false,
  onAnswer,
  onSkip,
}: {
  askId: string;
  slotId: string;
  prompt: string;
  why?: string;
  input: SlotInput;
  prefill?: string;
  answered?: string;
  optional?: boolean;
  onAnswer: (askId: string, answer: AskAnswer) => void;
  onSkip?: (askId: string) => void;
}) {
  const [raw, setRaw] = useState(prefill ?? "");
  const [issue, setIssue] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (answered !== undefined) {
    return (
      <div className="my-2 rounded-lg border border-line bg-paper-2 px-4 py-3" data-testid="ask-answered" data-ask-id={askId}>
        <p className="text-xs font-mono uppercase tracking-wider text-ink-3">{prompt}</p>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <Check size={14} className="text-money" aria-hidden="true" /> {answered}
        </p>
      </div>
    );
  }

  const submitValue = (value: string, masked: string) => {
    setIssue(null);
    onAnswer(askId, { kind: "value", value, masked });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    switch (input.kind) {
      case "identifier": {
        const result = validateIdentifier(input.format, raw);
        if (!result.ok) return setIssue(issueText(input.format, result.issue));
        return submitValue(result.value, result.masked);
      }
      case "money": {
        const result = validateMoney(raw, { min: input.min, max: input.max });
        if (!result.ok) return setIssue(issueText("money", result.issue));
        return submitValue(String(result.value), formatMoney(result.value));
      }
      case "number": {
        const n = Number(raw);
        if (!Number.isFinite(n) || (input.min !== undefined && n < input.min) || (input.max !== undefined && n > input.max)) {
          return setIssue("Enter a whole number in range.");
        }
        return submitValue(String(n), String(n));
      }
      case "date": {
        const result = validateDob(raw);
        if (!result.ok) return setIssue(issueText("dob", result.issue));
        return submitValue(result.value, result.value);
      }
      case "text": {
        const value = raw.trim();
        if (!value) return setIssue("A few words are enough, but it cannot be empty.");
        return submitValue(value, value.length > 40 ? `${value.slice(0, 40)}…` : value);
      }
      case "upload": {
        if (!file) return setIssue("Choose a file first.");
        setIssue(null);
        return onAnswer(askId, { kind: "file", file, masked: file.name });
      }
      default:
        return;
    }
  };

  const base = "w-full min-h-11 rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-money";

  return (
    <form onSubmit={submit} className="my-2 rounded-lg border border-money/40 bg-paper-2 px-4 py-4" data-testid="ask-form" data-ask-id={askId} data-slot-id={slotId}>
      <p className="text-sm font-semibold text-ink">{prompt}</p>
      {why && <p className="mt-1 text-xs leading-relaxed text-ink-3">{why}</p>}
      <div className="mt-3">
        {input.kind === "yesno" && (
          <div className="flex gap-2">
            <button type="button" onClick={() => submitValue("yes", "Yes")} className="min-h-11 flex-1 rounded-xl bg-navy px-4 text-sm font-bold text-white hover:opacity-90" data-testid="ask-yes">
              Yes
            </button>
            <button type="button" onClick={() => submitValue("no", "No")} className="min-h-11 flex-1 rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-3" data-testid="ask-no">
              No
            </button>
          </div>
        )}
        {input.kind === "select" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {input.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => submitValue(option.value, option.label)}
                className="min-h-11 rounded-xl border border-line bg-paper px-3 py-2 text-left text-sm text-ink hover:border-money"
              >
                <span className="block font-semibold">{option.label}</span>
                {option.detail && <span className="block text-xs text-ink-3">{option.detail}</span>}
              </button>
            ))}
          </div>
        )}
        {(input.kind === "identifier" || input.kind === "text" || input.kind === "number" || input.kind === "money" || input.kind === "date") && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {input.kind === "money" ? (
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-ink-3">₹</span>
                <input inputMode="numeric" value={raw} onChange={(e) => setRaw(e.target.value)} className={`${base} pl-7 font-mono`} placeholder="0" aria-label={prompt} autoFocus />
              </div>
            ) : (
              <input
                type={input.kind === "date" ? "date" : "text"}
                inputMode={input.kind === "number" || (input.kind === "identifier" && ["aadhaar", "mobile", "bank_account", "pin", "uan", "ack"].includes(input.format)) ? "numeric" : "text"}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                className={`${base} flex-1 ${input.kind === "identifier" ? "font-mono uppercase" : ""}`}
                placeholder={input.kind === "text" ? input.placeholder : undefined}
                maxLength={input.kind === "text" ? input.maxLength : undefined}
                aria-label={prompt}
                autoComplete="off"
                autoFocus
              />
            )}
            <button type="submit" className="min-h-11 rounded-xl bg-navy px-5 text-sm font-bold text-white hover:opacity-90" data-testid="ask-submit">
              Save
            </button>
          </div>
        )}
        {input.kind === "upload" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-paper px-4 text-sm text-ink-2 hover:border-money"
            >
              <Upload size={16} aria-hidden="true" />
              {file ? file.name : `Choose a file (${input.accept.map((a) => a.split("/")[1]?.toUpperCase()).join(", ")})`}
            </button>
            <input ref={fileRef} type="file" accept={input.accept.join(",")} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button type="submit" className="min-h-11 rounded-xl bg-navy px-5 text-sm font-bold text-white hover:opacity-90" data-testid="ask-submit">
              Upload
            </button>
          </div>
        )}
      </div>
      {issue && (
        <p role="alert" className="mt-2 text-xs font-semibold text-alarm" data-testid="ask-issue">
          {issue}
        </p>
      )}
      {input.kind === "identifier" && (
        <p className="mt-2 text-[0.68rem] font-mono text-ink-3">Stored encrypted in your vault. The assistant sees only that it is filled.</p>
      )}
      {optional && onSkip && (
        <button type="button" onClick={() => onSkip(askId)} className="mt-2 text-xs font-semibold text-ink-3 hover:text-ink hover:underline" data-testid="ask-skip">
          Skip this one
        </button>
      )}
    </form>
  );
}

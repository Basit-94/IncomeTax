"use client";

/**
 * Phase 6 — the assistant's chat surface.
 *
 * The panel owns nothing sensitive: it posts the conversation plus the current
 * return context to /api/agent (the only place the model key lives) and
 * executes whatever CLIENT actions come back — theme, mode, navigation — via
 * callbacks the page supplies. The one irreversible action, filing, arrives as
 * a confirmation card: the figures render here and NOTHING happens until the
 * human clicks confirm (§5.5). The agent cannot press that button.
 */

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Wrench } from "lucide-react";

import type { Dict } from "../../lib/i18n";
import type { Lang, Persona } from "../../lib/types";
import { isUiMode, type UiMode } from "../../lib/mode";
import { formatMoney } from "../../lib/money";
import { MockFill } from "../dev/mock-fill";
import { renderAssistantText } from "./format";

/** Mirrors AGENT_MAX_QUESTIONS_PER_SESSION in app/api/agent/route.ts — the server is authoritative. */
const MAX_QUESTIONS_PER_SESSION = 4;

interface AgentMessage {
  role: "user" | "model";
  text: string;
  tools?: string[];
}

interface AgentResponse {
  reply?: string;
  error?: string;
  toolEvents?: { tool: string }[];
  clientActions?: ClientAction[];
  /** Set by the route when the session's question cap is hit; the model was not called. */
  limitReached?: boolean;
}

interface FilingSummary {
  totalTax: number;
  refundOrDue: number;
  taxableIncome: number;
  regime: string;
}

interface ClientAction {
  tool: string;
  args: Record<string, unknown>;
  summary?: FilingSummary;
}

export interface AgentPanelProps {
  lang: Lang;
  t: Dict;
  persona: Persona;
  regime: "new" | "old";
  mode: "simple" | "full";
  /** The user's own backend session - the agent can never see more than they can. */
  sessionToken?: string;
  onSetTheme: (theme: "light" | "dark") => void;
  /** set_mode now switches the surface: "agentic" goes to /app (plan D5). */
  onSetMode: (mode: UiMode) => void;
  /** Signed-in accounts have no question cap (plan §4.1); the server enforces the same rule. */
  unlimited?: boolean;
  onNavigate: (section: "overview" | "documents" | "history" | "filing") => void;
  /** The SAME commit path the filing step uses — no agent backdoor. */
  onConfirmFiling: () => void | Promise<void>;
  /** A question handed in from the docked copilot bar; a new nonce opens the panel and sends it. */
  externalPrompt?: { text: string; nonce: number } | null;
  /** True when another surface (the copilot bar) is the entry point, so the bubble is not a second one. */
  hideLauncher?: boolean;
}

export default function AgentPanel({
  lang,
  t,
  persona,
  regime,
  mode,
  sessionToken,
  onSetTheme,
  onSetMode,
  unlimited = false,
  onNavigate,
  onConfirmFiling,
  externalPrompt = null,
  hideLauncher = false,
}: AgentPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiling, setPendingFiling] = useState<FilingSummary | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 24)
      : `s${Date.now()}`,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPromptNonce = useRef<number | null>(null);

  // No reset path on purpose: the site is public and the cap protects the API key.
  const questionsUsed = messages.filter((m) => m.role === "user").length;
  const atLimit = !unlimited && (limitReached || questionsUsed >= MAX_QUESTIONS_PER_SESSION);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy, pendingFiling]);

  const runClientActions = (actions: ClientAction[]) => {
    for (const action of actions) {
      switch (action.tool) {
        case "set_theme":
          if (action.args.theme === "light" || action.args.theme === "dark") {
            onSetTheme(action.args.theme);
          }
          break;
        case "set_mode":
          if (isUiMode(action.args.mode)) {
            onSetMode(action.args.mode);
          }
          break;
        case "navigate_to_section": {
          const s = action.args.section;
          if (s === "overview" || s === "documents" || s === "history" || s === "filing") {
            onNavigate(s);
          }
          break;
        }
        case "prepare_filing":
          if (action.summary) setPendingFiling(action.summary);
          break;
        // fetch_document lands as data in the model's reply; nothing to do here.
      }
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || atLimit) return;
    setError(null);
    setInput("");
    const nextMessages: AgentMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
          context: {
            facts: persona.facts.map((f) => ({
              kind: f.kind,
              amount: f.amount,
              capitalGains: f.capitalGains,
            })),
            claims: persona.claims,
            tdsCredits: persona.taxPaid.reduce((sum, p) => sum + p.amount, 0),
            regime,
            mode,
            lang,
            userName: persona.name,
            sessionToken,
          },
        }),
      });
      const data: AgentResponse = await res.json();
      if (!res.ok || data.error) {
        setError(t.agent.error);
        setMessages(nextMessages); // keep the user's message so retry is one click of Send
        return;
      }
      const tools = (data.toolEvents ?? []).map((e) => e.tool);
      setMessages([...nextMessages, { role: "model", text: data.reply || "", tools }]);
      if (data.limitReached) setLimitReached(true);
      runClientActions(data.clientActions ?? []);
    } catch {
      setError(t.agent.error);
    } finally {
      setBusy(false);
    }
  };

  // The copilot bar's question arrives here; each nonce is sent exactly once.
  useEffect(() => {
    if (!externalPrompt || externalPrompt.nonce === lastPromptNonce.current) return;
    lastPromptNonce.current = externalPrompt.nonce;
    setOpen(true);
    void send(externalPrompt.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  const confirmFiling = async () => {
    setPendingFiling(null);
    await onConfirmFiling();
  };

  if (!open) {
    if (hideLauncher) return null;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.agent.open}
        title={t.agent.open}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-navy text-white p-3.5 shadow-xl hover:scale-105 transition-transform"
      >
        <MessageCircle size={22} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[92vw] h-[560px] max-h-[78vh] flex flex-col bg-paper border border-line rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-navy text-white shrink-0">
        <span className="font-bold text-sm">{t.agent.title}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.agent.close}
          className="p-1 rounded hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <p className="text-xs text-ink-2 leading-relaxed bg-paper-2 border border-line rounded-xl p-3">
          {t.agent.intro}
        </p>
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-navy text-white text-sm px-3.5 py-2.5"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-paper-2 border border-line text-ink text-sm px-3.5 py-2.5"
              }
            >
              {m.role === "user" ? (
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              ) : (
                renderAssistantText(m.text)
              )}
              {m.tools && m.tools.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.tools.map((tool, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-3"
                    >
                      <Wrench size={9} /> {t.agent.toolRan} {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-xs text-ink-3 animate-pulse">{t.agent.thinking}</p>}
        {error && (
          <p className="text-xs font-semibold text-alarm bg-alarm/5 border border-alarm/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* The filing confirmation card — the only path from "prepared" to "filed". */}
        {pendingFiling && (
          <div className="border-2 border-navy rounded-xl p-3.5 space-y-2 bg-paper-2">
            <p className="text-sm font-bold text-navy">{t.agent.confirmTitle}</p>
            <p className="text-xs text-ink-2">{t.agent.confirmBody}</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-2">{t.agent.confirmTaxable}</span>
                <span className="font-mono font-semibold text-ink">
                  {formatMoney(pendingFiling.taxableIncome, lang)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">{t.agent.confirmTotalTax}</span>
                <span className="font-mono font-semibold text-ink">
                  {formatMoney(pendingFiling.totalTax, lang)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-ink">
                  {pendingFiling.refundOrDue >= 0 ? t.agent.confirmRefund : t.agent.confirmDue}
                </span>
                <span className="font-mono text-money">
                  {formatMoney(Math.abs(pendingFiling.refundOrDue), lang)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={confirmFiling}
                className="flex-1 rounded-lg bg-navy text-white text-xs font-bold py-2 hover:opacity-90"
              >
                {t.agent.confirmButton}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingFiling(null);
                  setMessages((prev) => [...prev, { role: "model", text: t.agent.filingDismissed }]);
                }}
                className="rounded-lg border border-line text-ink-2 text-xs font-semibold px-3 py-2 hover:bg-paper-2"
              >
                {t.agent.cancelButton}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        className="shrink-0 border-t border-line p-2.5 relative"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <MockFill onFill={() => setInput(t.agent.sample)} className="-top-6 right-2" />
        {atLimit && (
          <p className="mb-1.5 text-xs text-ink-2 bg-paper-2 border border-line rounded-lg px-3 py-2">
            Sorry, we have limited our chat
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.agent.placeholder}
            disabled={atLimit}
            className="flex-1 rounded-xl border border-line bg-paper-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || atLimit || !input.trim()}
            aria-label={t.agent.send}
            className="rounded-xl bg-navy text-white p-2.5 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

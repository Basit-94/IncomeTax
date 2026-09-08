import fs from "node:fs";
import path from "node:path";
import type { Run, RunEventPayload } from "./types";

export interface TelemetryRecord {
  timestamp: string;
  runId: string;
  ownerPan: string;
  lang: string;
  task?: string;
  lastUserMessage?: string;
  replyLanguage?: string;
  register?: string;
  status: string;
  usage: {
    modelCalls: number;
    toolCalls: number;
    tokens: number;
  };
  eventCount: number;
  lastAssistantMessage?: string;
  toolOutcomes?: { tool: string; ok: boolean; summary?: string }[];
  loopDetected?: boolean;
}

const TELEMETRY_DIR = path.join(process.cwd(), "data");
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, "agent_telemetry.jsonl");

/**
 * Record a non-blocking background telemetry event for continuous agent learning.
 * Stores prompts, model performance, tool outcomes, and error signatures.
 */
export function recordAgentTelemetry(run: Run, latestEvent?: RunEventPayload) {
  try {
    if (!fs.existsSync(TELEMETRY_DIR)) {
      fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
    }

    const transcript = run.state.transcript ?? [];
    const lastUser = transcript.filter((t) => t.role === "user").slice(-1)[0]?.text;
    const lastAssistant = transcript.filter((t) => t.role === "assistant").slice(-1)[0]?.text;

    const toolEvents = transcript.filter((t) => t.role === "tool");
    const toolOutcomes = toolEvents.map((t) => ({
      tool: t.text.split("(")[0] || "tool",
      ok: !t.text.includes("error"),
      summary: t.text.slice(0, 140),
    }));

    const record: TelemetryRecord = {
      timestamp: new Date().toISOString(),
      runId: run.id,
      ownerPan: run.state.profile?.refundAccount ? "REDACTED" : "ANON",
      lang: run.lang,
      task: run.task,
      lastUserMessage: lastUser?.slice(0, 200),
      replyLanguage: run.state.replyLanguage,
      register: run.state.register,
      status: run.status,
      usage: run.state.usage,
      eventCount: transcript.length,
      lastAssistantMessage: lastAssistant?.slice(0, 300),
      toolOutcomes: toolOutcomes.slice(-5),
      loopDetected: transcript.some((t, i, arr) => i > 0 && t.text === arr[i - 1].text),
    };

    fs.appendFile(TELEMETRY_FILE, JSON.stringify(record) + "\n", (err) => {
      if (err) {
        // Silently swallow in production to never break user flow
      }
    });
  } catch {
    // Non-blocking telemetry
  }
}

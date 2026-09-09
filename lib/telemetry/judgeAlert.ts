/**
 * lib/telemetry/judgeAlert.ts — a push to the phone when a judge shows up.
 *
 * Transport is ntfy (https://ntfy.sh): install the app, subscribe to a topic, set
 * JUDGE_ALERT_NTFY_TOPIC. No account needed for the public server; a self-hosted or
 * reserved topic takes JUDGE_ALERT_NTFY_URL and JUDGE_ALERT_NTFY_TOKEN. Unset → no-op.
 *
 * Deduplication lives in the judge_alerts table (one row per session and kind), so a
 * serverless instance never announces the same arrival or sign-in twice.
 */

import type { Pool } from "pg";

export type JudgeAlertKind = "arrival" | "sign_in";

export interface JudgeAlertInput {
  kind: JudgeAlertKind;
  sessionId: string;
  pan?: string | null;
  userName?: string | null;
  origin?: string | null;
  lang?: string | null;
  screenSize?: string | null;
  userAgent?: string | null;
  eventType?: string | null;
}

export function judgeAlertsConfigured(): boolean {
  return Boolean(process.env.JUDGE_ALERT_NTFY_TOPIC);
}

function deviceLabel(ua: string | null | undefined, screen: string | null | undefined): string {
  const mobile = ua ? /Mobi|Android|iPhone|iPad/i.test(ua) : false;
  return `${mobile ? "phone" : "desktop"}${screen ? ` ${screen}` : ""}`;
}

function composeMessage(a: JudgeAlertInput): { title: string; body: string; tags: string; priority: string } {
  const where = a.origin ? ` on ${a.origin}` : "";
  const device = deviceLabel(a.userAgent, a.screenSize);
  const lang = a.lang && a.lang !== "en" ? ` · ${a.lang}` : "";
  if (a.kind === "sign_in") {
    const who = a.userName && a.userName !== "Visitor" ? a.userName : "a visitor";
    const pan = a.pan && a.pan !== "ANONYMOUS" ? ` (${a.pan})` : "";
    const via = a.eventType === "ca_login" ? " through the CA portal" : "";
    return {
      title: "A judge signed in to Wapsi",
      body: `${who}${pan} signed in${via}${where}. ${device}${lang}.`,
      tags: "star",
      priority: "high",
    };
  }
  return {
    title: "A judge is on Wapsi",
    body: `New visitor${where}. ${device}${lang}. Open the inspector to follow along.`,
    tags: "eyes",
    priority: "default",
  };
}

/** Records the alert once per (session, kind); sends the push only when this call created the row. */
export async function notifyJudgeOnce(pool: Pool, a: JudgeAlertInput): Promise<boolean> {
  const res = await pool.query(
    `INSERT INTO judge_alerts (session_id, kind, pan, user_name, origin)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id, kind) DO NOTHING
     RETURNING session_id`,
    [a.sessionId, a.kind, a.pan || null, a.userName || null, a.origin || null],
  );
  if (res.rowCount === 0) return false;
  await sendPush(composeMessage(a));
  return true;
}

export async function sendPush(msg: { title: string; body: string; tags?: string; priority?: string }): Promise<void> {
  const topic = process.env.JUDGE_ALERT_NTFY_TOPIC;
  if (!topic) return;
  const base = (process.env.JUDGE_ALERT_NTFY_URL || "https://ntfy.sh").replace(/\/+$/, "");
  const headers: Record<string, string> = {
    Title: msg.title,
    Priority: msg.priority || "default",
    Tags: msg.tags || "eyes",
  };
  if (process.env.JUDGE_ALERT_CLICK_URL) headers.Click = process.env.JUDGE_ALERT_CLICK_URL;
  if (process.env.JUDGE_ALERT_NTFY_TOKEN) headers.Authorization = `Bearer ${process.env.JUDGE_ALERT_NTFY_TOKEN}`;
  try {
    await fetch(`${base}/${encodeURIComponent(topic)}`, { method: "POST", headers, body: msg.body });
  } catch (err) {
    console.warn("[judge-alert] push failed:", err instanceof Error ? err.message : err);
  }
}

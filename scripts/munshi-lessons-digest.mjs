#!/usr/bin/env node
/**
 * Munshi ji's nightly lessons digest (2026-09-07).
 *
 * Reads a window of agent run events from the database and DRAFTS lessons into docs/MUNSHI-LESSONS.md:
 *   - replies the figure check refused            (tool_outcome, tool = model.converse, ok = false)
 *   - tool calls the runtime refused or rejected  (tool_outcome, any other tool, ok = false)
 *   - corrections the person made                 (correction — the note_correction tool)
 *   - review cards and consents declined          (confirmation accepted = false; answer false on a consent question)
 *
 * It never writes to lib/agentic/lessons.ts. A human reads the drafts and promotes a line by hand — that file is the
 * release. Events are already redacted before persistence, so nothing here carries a PAN or a name.
 *
 *   node scripts/munshi-lessons-digest.mjs [--days 1] [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const days = Math.max(1, Number(args[args.indexOf("--days") + 1]) || 1);
const dry = args.includes("--dry");
const root = resolve(import.meta.dirname, "..");

function loadEnv() {
  const env = { ...process.env };
  for (const f of [".env", ".env.local"]) {
    const p = resolve(root, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
      if (m && !(m[1] in process.env)) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const url = env.DATABASE_URL || env.POSTGRES_URL || env.WAPSI_DATASOURCE_URL;
if (!url) {
  console.log("munshi-lessons-digest: no database configured (DATABASE_URL / POSTGRES_URL / WAPSI_DATASOURCE_URL); demo runs live in process memory and leave nothing to digest.");
  process.exit(0);
}

const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
const res = await pool.query(
  `SELECT e.run_id, e.at, e.type, e.payload FROM agent_run_events e
   WHERE e.at >= now() - ($1 || ' days')::interval AND e.type IN ('tool_outcome', 'correction', 'confirmation', 'answer', 'question')
   ORDER BY e.at`,
  [String(days)],
);
await pool.end();

const rows = res.rows.map((r) => ({ runId: r.run_id, at: new Date(r.at).toISOString(), ...r.payload }));
const runs = new Set(rows.map((r) => r.runId)).size;
const modelOutcomes = rows.filter((r) => r.type === "tool_outcome" && r.tool === "model.converse" && r.ok === false);
// A key out of quota or a timeout is an outage, not a lesson; only the check's refusals teach anything.
const outages = modelOutcomes.filter((r) => /^(HTTP|timeout|network|model off|all keys|empty reply)/i.test(String(r.summary ?? "")));
const refusedReplies = modelOutcomes.filter((r) => !outages.includes(r));
const refusedTools = rows.filter((r) => r.type === "tool_outcome" && r.ok === false && r.tool !== "model.converse" && r.tool !== "runtime");
const corrections = rows.filter((r) => r.type === "correction");
const declinedCards = rows.filter((r) => r.type === "confirmation" && r.accepted === false);
const consentQuestions = new Set(rows.filter((r) => r.type === "question" && /^consent:/.test(r.question?.resolves ?? "")).map((r) => r.question.id));
const declinedConsents = rows.filter((r) => r.type === "answer" && r.value === false && consentQuestions.has(r.questionId));

const tally = (list, key) => {
  const m = new Map();
  for (const r of list) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const stem = (s) => String(s ?? "").replace(/\(\d[\d,]*\)/g, "(…)").replace(/\d[\d,]{3,}/g, "N").slice(0, 120);

const today = new Date().toISOString().slice(0, 10);
const out = [];
out.push(`### ${today} — last ${days} day(s), ${runs} chat(s) with events`);
out.push("");
out.push(`- Replies refused by the figure check: ${refusedReplies.length} (model outages, not counted as lessons: ${outages.length})`);
for (const [k, n] of tally(refusedReplies, (r) => stem(r.summary)).slice(0, 6)) out.push(`  - ${n}× ${k}`);
out.push(`- Tool calls refused or invalid: ${refusedTools.length}`);
for (const [k, n] of tally(refusedTools, (r) => `${r.tool}: ${stem(r.summary)}`).slice(0, 8)) out.push(`  - ${n}× ${k}`);
out.push(`- Corrections the person made: ${corrections.length}`);
for (const c of corrections.slice(0, 20)) out.push(`  - [${c.scope}] ${c.what}${c.correct ? ` → ${c.correct}` : ""}`);
out.push(`- Review cards declined: ${declinedCards.length}; consents declined: ${declinedConsents.length}`);
out.push("");
out.push("Draft lessons (edit, then promote the ones that hold into lib/agentic/lessons.ts):");
const drafts = [];
const count = (re) => refusedReplies.filter((r) => re.test(String(r.summary ?? ""))).length;
const figures = count(/figure not in the facts/);
const claims = count(/action that did not happen/);
const identifiers = count(/identifier in reply/);
if (figures) drafts.push(`Before naming a rupee figure or a percentage, call get_return or compute_tax and quote it from the result — ${figures} reply/replies were refused for a figure the tools never produced.`);
if (claims) drafts.push(`Say "prepared" or "staged", never "filed" or "paid", until the confirmation actually applied — ${claims} reply/replies claimed an action that had not happened.`);
if (identifiers) drafts.push(`Never write a PAN or Aadhaar back to the person — ${identifiers} reply/replies were refused for an identifier.`);
for (const [k, n] of tally(refusedTools, (r) => r.tool)) {
  if (k === "read_document") drafts.push(`Call request_consent before read_document; the read is refused without it — ${n} time(s).`);
  if (k === "show_review") drafts.push(`Check the balance due (get_return) and offer_payment before show_review(filing) — ${n} card(s) came back blocked.`);
  if (k === "stage_changes") drafts.push(`Use the engine's section spellings in declare_claim (80C, 80D_SELF, 80D_PARENTS, 80CCD_1B, 24B, 80GG, 80TTA, 80CCD(2)) — ${n} call(s) were rejected.`);
}
for (const c of corrections) drafts.push(`[${c.scope}] ${c.what}${c.correct ? ` — the person says: ${c.correct}` : ""}`);
if (!drafts.length) drafts.push("Nothing to learn from this window — no refusals, no corrections.");
for (const d of [...new Set(drafts)]) out.push(`- [ ] ${d}`);
out.push("");

const block = out.join("\n");
if (dry) {
  console.log(block);
  process.exit(0);
}
const docPath = resolve(root, "docs", "MUNSHI-LESSONS.md");
const doc = readFileSync(docPath, "utf8");
const marker = "## Drafts (unreviewed)";
const i = doc.indexOf(marker);
const next = i >= 0 ? doc.slice(0, i + marker.length) + "\n\n" + block + doc.slice(i + marker.length) : doc.trimEnd() + "\n\n" + marker + "\n\n" + block;
writeFileSync(docPath, next);
console.log(`munshi-lessons-digest: ${refusedReplies.length} refused replies, ${refusedTools.length} refused tool calls, ${corrections.length} corrections, ${declinedCards.length} declined cards over ${days} day(s) → drafts appended to docs/MUNSHI-LESSONS.md`);

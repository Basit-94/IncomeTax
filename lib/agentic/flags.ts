/**
 * The Agentic feature flag (plan.md §7: "Build each phase behind an agentic
 * feature flag until integrated").
 *
 * On by default in development so the shell can be seen; a deployment turns it
 * off with NEXT_PUBLIC_WAPSI_AGENTIC=false. Read through one function so the
 * flag can be flipped in one place, and so nothing else grows its own env read.
 * Server-only routes use the same value: the flag has NEXT_PUBLIC_ so the
 * client bundle and the server agree.
 */
export function agenticEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WAPSI_AGENTIC !== "false";
}

/**
 * The knowledge release every run pins (plan §5.7). Bumped by hand when
 * lib/knowledge changes in a way that alters an answer; recorded on each run so
 * a later reader knows which rules produced which figure.
 */
export const KNOWLEDGE_RELEASE = "2026-09-05.2";

/** Parser version recorded on every extraction row (plan §4.1). */
export const PDF_PARSER_VERSION = "pdfExtract@2026-09-03";

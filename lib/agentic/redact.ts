/**
 * Redaction before model transmission and before persistence (plan.md §5.3:
 * "Names, PAN, Aadhaar, bank details, tokens, filenames containing identifiers,
 * and unrestricted document text stay out of prompts/tool summaries. Redact
 * free-text messages before model transmission and persistence").
 *
 * Deterministic and conservative: anything shaped like an identifier is
 * replaced with a typed placeholder. The model reads "[PAN]" and can still
 * reason about the sentence; the transcript stores "[PAN]" and never holds the
 * identifier. Amounts are NOT redacted — they are the work — but they are
 * protected facts, not memory (§5.5).
 */

const PAN_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const AADHAAR_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const MOBILE_RE = /(?<!\d)(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const IFSC_RE = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;
const ACCOUNT_RE = /\b\d{11,18}\b/g;
const TOKEN_RE = /\b(?:mock-token|vault_session|Bearer)[\w.:-]*/gi;
const CARD_RE = /\b(?:\d[ -]?){13,19}\b/g;

export interface Redaction {
  text: string;
  /** Which kinds were found, for the audit trail — never the values. */
  found: string[];
}

export function redactText(input: string, knownNames: string[] = []): Redaction {
  const found = new Set<string>();
  let text = input;
  const sub = (re: RegExp, tag: string) => {
    if (re.test(text)) found.add(tag);
    re.lastIndex = 0;
    text = text.replace(re, `[${tag}]`);
  };
  sub(TOKEN_RE, "TOKEN");
  sub(EMAIL_RE, "EMAIL");
  sub(PAN_RE, "PAN");
  sub(IFSC_RE, "IFSC");
  sub(AADHAAR_RE, "AADHAAR");
  sub(CARD_RE, "CARD");
  sub(ACCOUNT_RE, "ACCOUNT");
  sub(MOBILE_RE, "MOBILE");
  for (const name of knownNames) {
    const trimmed = name.trim();
    if (trimmed.length < 3) continue;
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (re.test(text)) found.add("NAME");
    re.lastIndex = 0;
    text = text.replace(re, "[NAME]");
  }
  return { text, found: [...found] };
}

/**
 * Document text is DATA, never an instruction (§5.3). Strip anything that
 * reads like an instruction to the assistant before it can reach a prompt,
 * and report that it was there so the run can tell the citizen.
 */
const INJECTION_RE = /(ignore (all|any|the) (previous|prior|above) instructions?|you are now|system prompt|disregard (your|the) (rules|instructions)|as an ai|call the tool|execute (the )?(filing|payment)|confirm (the )?(filing|payment) (now|immediately))/gi;

export function stripInjection(text: string): { text: string; suspicious: boolean } {
  const suspicious = INJECTION_RE.test(text);
  INJECTION_RE.lastIndex = 0;
  return { text: text.replace(INJECTION_RE, "[removed]"), suspicious };
}

/** A filename may carry a PAN or a name; keep only its extension and a hash-like stub. */
export function safeFilename(name: string): string {
  const ext = /\.([a-z0-9]{1,5})$/i.exec(name)?.[1]?.toLowerCase();
  return ext ? `document.${ext}` : "document";
}

/**
 * Deriving a submission's idempotency key from its content.
 *
 * The key must be a *function of the payload*, never a fresh value per click. The previous
 * key was `idemp-${persona.id}-${Date.now()}`, which guaranteed every retry looked like a
 * brand-new submission — so the backend's durable idempotency (a primary key on
 * `idempotency_key`) faithfully deduplicated keys that could never repeat. A double-click,
 * a flaky network retry, or an impatient user filed the return twice.
 *
 * Two properties are required, and they pull against each other:
 *
 *   1. Resubmitting the SAME return must produce the SAME key, so it collapses to one filing.
 *   2. Submitting a CORRECTED return must produce a DIFFERENT key, or the fix would be
 *      silently swallowed as a duplicate — a far worse failure than filing twice.
 *
 * Hashing the content satisfies both: identical content hashes identically, and any changed
 * figure changes the hash.
 */

type Fact = {
  kind: string;
  amountPaise: number;
  /** Asset-class metadata (T1.9b) — part of the content, so reclassifying changes the key. */
  assetClass?: string;
  holding?: string;
};
type Claim = { section: string; amountPaise: number };

export interface SubmissionIdentity {
  personaId: string;
  assessmentYear: string;
  ruleSetVersion: string;
  facts: Fact[];
  claims: Claim[];
  tdsCreditsPaise: number;
}

/**
 * Canonical form. Facts and claims are sorted, so re-ordering the same figures — which the UI
 * is free to do — cannot change the key. Values are joined with separators that cannot occur
 * inside them, so ["ab","c"] and ["a","bc"] do not collide.
 */
function canonical(input: SubmissionIdentity): string {
  const facts = [...input.facts]
    // Metadata is appended only when present, so unclassified facts keep the
    // exact canonical string (and therefore key) they had before T1.9b.
    .map((f) =>
      f.assetClass || f.holding
        ? `${f.kind}${f.assetClass ?? ""}${f.holding ?? ""}${f.amountPaise}`
        : `${f.kind}${f.amountPaise}`,
    )
    .sort()
    .join("");
  const claims = [...input.claims]
    .map((c) => `${c.section}${c.amountPaise}`)
    .sort()
    .join("");
  return [
    input.personaId,
    input.assessmentYear,
    input.ruleSetVersion,
    facts,
    claims,
    String(input.tdsCreditsPaise),
  ].join("");
}

/** FNV-1a, 32 bits. Two lanes with different offset bases give a 64-bit digest. */
function fnv1a(text: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const hex8 = (n: number) => n.toString(16).padStart(8, "0");

/**
 * A stable key: identity in plain text, content as a 64-bit digest.
 *
 * The readable prefix is deliberate — an operator reading a log or a database row can tell
 * whose submission it is without reversing a hash. The digest only has to distinguish one
 * person's submissions from their own earlier ones, which is why 64 bits is ample here; this
 * is a deduplication key, not a security primitive, and it is never used as one.
 */
export function stableIdempotencyKey(input: SubmissionIdentity): string {
  const text = canonical(input);
  const digest = hex8(fnv1a(text, 0x811c9dc5)) + hex8(fnv1a(text, 0x9dc5811c));
  return `idemp-${input.personaId}-${input.ruleSetVersion}-${digest}`;
}

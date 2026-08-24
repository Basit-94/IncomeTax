/**
 * Format validation for the two identifiers a user can type: a PAN and a bank
 * routing code (IFSC).
 *
 * These schemas check *shape*, and shape is all they can honestly check. A real
 * portal verifies a PAN against the department's register and a routing code
 * against the banking network; both are live lookups this prototype makes no
 * attempt to fake. What we can catch locally is the overwhelmingly common case
 * — a typo, a transposed character, a missing digit — and catch it before the
 * user has committed to anything.
 *
 * Deliberately, the result carries an issue *code* rather than a message. The
 * message belongs to the dictionary, in whichever of the three languages the
 * user is reading, and validation has no business knowing which one that is.
 */

import { z } from "zod";

/**
 * Five letters, four digits, one letter. The fifth character is normally the
 * first letter of the holder's surname and the fourth encodes holder type; we
 * check neither, because a prototype has no register to check them against.
 */
const PAN_SHAPE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** Four-letter bank code, a mandatory zero, then six characters of branch. */
const IFSC_SHAPE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Everything in this prototype uses this prefix. See lib/personas.ts. */
const DEMO_PREFIX = "DEMP";

const PanSchema = z
  .string()
  .transform((s) => s.replace(/\s+/g, "").toUpperCase())
  .pipe(z.string().length(10).regex(PAN_SHAPE));

const IfscSchema = z
  .string()
  .transform((s) => s.replace(/\s+/g, "").toUpperCase())
  .pipe(z.string().length(11).regex(IFSC_SHAPE));

/* ------------------------------------------------------------------------- */

export type FieldIssue =
  /** Right characters so far, but not enough of them. Not yet an error. */
  | { kind: "incomplete"; length: number }
  /** Correct length, wrong arrangement. */
  | { kind: "shape" };

export type FieldResult<T extends string = string> =
  | { ok: true; value: T; isDemo: boolean }
  | { ok: false; issue: FieldIssue };

function normalise(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/**
 * `isDemo` reports whether the PAN carries the prototype's own prefix. It is
 * not a pass/fail — a reviewer typing a plausible-looking PAN should not be
 * blocked — but it lets the interface explain, at the moment it matters, that
 * only DEMP identities exist here and nothing typed is sent anywhere.
 */
export function validatePan(raw: string): FieldResult {
  const value = normalise(raw);
  const parsed = PanSchema.safeParse(value);
  if (parsed.success) {
    return { ok: true, value: parsed.data, isDemo: parsed.data.startsWith(DEMO_PREFIX) };
  }
  if (value.length < 10) return { ok: false, issue: { kind: "incomplete", length: value.length } };
  return { ok: false, issue: { kind: "shape" } };
}

export function validateIfsc(raw: string): FieldResult {
  const value = normalise(raw);
  const parsed = IfscSchema.safeParse(value);
  if (parsed.success) {
    return { ok: true, value: parsed.data, isDemo: true };
  }
  if (value.length < 11) return { ok: false, issue: { kind: "incomplete", length: value.length } };
  return { ok: false, issue: { kind: "shape" } };
}

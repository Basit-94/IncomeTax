/**
 * What the CA routes do, off the request/response plumbing (2026-09-08). Each function takes the services and
 * plain inputs and returns plain results, so the same logic serves the redesign's routes (`/api/ca/reviews/*`,
 * `/api/ca/auth`, `/api/ca/inbox`) and the pre-existing own-CA route (`/api/ca/review`), and can be unit-tested
 * without Next.
 */

import type { Persona } from "../types";
import { CURRENT_VERSION } from "../return/persist";
import type { ReturnState } from "../return/state";
import type { ReturnSnapshotStore } from "../return/snapshot-store";
import type { Owner } from "../server/session";
import { loadLocalReviews, saveLocalReviews, type CADetails, type CAReviewRecord } from "./ca-store";
import { hashPassword, newCode, newCommentId, publicAccount, verifyPassword, type CAAccount, type CAReviewRequest, type CAStore, type ReviewBackground, type ReviewComment, type ReviewMode } from "./server-store";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string; status: number };
const fail = (status: number, error: string): Result<never> => ({ ok: false, error, status });
const ok = <T,>(value: T): Result<T> => ({ ok: true, value });

/* --------------------------------------------------------------- accounts -- */

export interface RegisterInput {
  name: string;
  membershipNo: string;
  password: string;
  firmName?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
}

export async function registerAccount(store: CAStore, input: RegisterInput, now = new Date()): Promise<Result<CAAccount>> {
  const name = (input.name ?? "").trim();
  const membershipNo = (input.membershipNo ?? "").replace(/[^0-9]/g, "");
  const password = (input.password ?? "").trim();
  if (!name) return fail(400, "Enter your full name as registered with ICAI.");
  if (membershipNo.length < 5 || membershipNo.length > 7) return fail(400, "Enter a valid 5 to 7 digit ICAI membership number.");
  if (password.length < 4) return fail(400, "Create a password of at least 4 characters.");
  const email = (input.email ?? "").trim().toLowerCase();
  if (email && !email.includes("@")) return fail(400, "That email address does not look right.");
  if (await store.findAccount(membershipNo)) return fail(409, "A CA with this membership number is already registered — sign in instead.");
  if (email && (await store.findAccount(email))) return fail(409, "A CA with this email is already registered — sign in instead.");
  const { hash, salt } = hashPassword(password);
  const account: CAAccount = {
    id: `ca_${membershipNo}`,
    name: name.startsWith("CA ") ? name : `CA ${name}`,
    membershipNo,
    firmName: (input.firmName ?? "").trim() || `${name.startsWith("CA ") ? name : `CA ${name}`} & Co.`,
    city: (input.city ?? "").trim() || "India",
    state: (input.state ?? "").trim() || "India",
    email: email || `ca.${membershipNo}@wapsi.tax`,
    phone: (input.phone ?? "").trim() || undefined,
    specialties: input.specialties?.length ? input.specialties.slice(0, 8) : ["Salaried returns", "Form 16 / AIS reconciliation", "Regime choice"],
    passwordHash: hash,
    salt,
    certified: true,
    registeredAt: now.toISOString(),
    reviewCount: 0,
  };
  await store.putAccount(account);
  return ok(account);
}

export async function loginAccount(store: CAStore, identifier: string, password: string): Promise<Result<CAAccount>> {
  if (!identifier?.trim()) return fail(400, "Enter your ICAI membership number or registered email.");
  if (!password?.trim()) return fail(400, "Enter your password.");
  const account = await store.findAccount(identifier);
  if (!account) return fail(404, "No registered CA matches those details — register first.");
  if (!verifyPassword(password.trim(), account)) return fail(401, "Incorrect password.");
  return ok(account);
}

export { publicAccount };

/* ---------------------------------------------------------------- reviews -- */

export interface CreateReviewInput {
  mode: ReviewMode;
  owner: Owner;
  persona: Persona;
  regime: "new" | "old";
  /** Required for `own` (the CA opens the return with code + PIN); ignored for `wapc`. */
  pinHash?: string;
  background?: ReviewBackground;
  clientNotes?: string;
  assessmentYear?: string;
}

/** A citizen's request. `wapc` goes to every registered CA's inbox; `own` waits for the CA who has the code and PIN. */
export async function createReview(store: CAStore, input: CreateReviewInput, now = new Date()): Promise<Result<CAReviewRequest>> {
  if (input.mode !== "wapc" && input.mode !== "own") return fail(400, "mode must be wapc or own");
  if (input.mode === "own" && !input.pinHash) return fail(400, "A PIN is required to share with your own CA.");
  if (!input.persona || !Array.isArray(input.persona.facts)) return fail(400, "A return snapshot is required.");
  if (input.persona.pan.toUpperCase() !== input.owner.pan.toUpperCase()) return fail(403, "The return does not belong to the signed-in person.");
  const at = now.toISOString();
  const review: CAReviewRequest = {
    code: newCode(),
    pinHash: input.pinHash ?? "",
    citizenPan: input.owner.pan.toUpperCase(),
    citizenName: input.persona.name || input.owner.displayName,
    assessmentYear: input.assessmentYear || input.persona.assessmentYear || "2026-27",
    originalPersona: structuredClone(input.persona),
    originalRegime: input.regime,
    status: "pending",
    createdAt: at,
    updatedAt: at,
    mode: input.mode,
    background: input.background,
    clientNotes: input.clientNotes?.trim() || "",
    isDraft: true,
    permissions: { allowEdit: true, shareAIS: true, shareForm16: true },
  };
  await store.putReview(review);
  mirrorLegacy(review);
  return ok(review);
}

/** A registered CA takes a broadcast request. First come, first served; a second CA is told it is taken. */
export async function claimReview(store: CAStore, code: string, ca: CAAccount, now = new Date()): Promise<Result<CAReviewRequest>> {
  const review = await store.getReview(code);
  if (!review) return fail(404, "No such review request.");
  if (review.claimedByCaId && review.claimedByCaId !== ca.id) return fail(409, `${review.claimedByCaName ?? "Another CA"} is already working on this return.`);
  if (review.status !== "pending" && review.status !== "claimed") return fail(409, `This request is ${review.status}.`);
  const next: CAReviewRequest = { ...review, status: "claimed", claimedByCaId: ca.id, claimedByCaName: ca.name, claimedAt: review.claimedAt ?? now.toISOString(), targetCaId: ca.id, targetCaName: ca.name, updatedAt: now.toISOString() };
  await store.putReview(next);
  mirrorLegacy(next);
  return ok(next);
}

export interface SubmitInput {
  caPersona: Persona;
  caRegime: "new" | "old";
  caNotes?: string;
  caDetails?: CADetails;
}

/** The CA's version lands on the request; the citizen compares and decides. Also mirrors the figures onto the server return (the pre-existing behaviour). */
export async function submitReview(store: CAStore, returns: ReturnSnapshotStore | null, code: string, input: SubmitInput, by: CAAccount | null, now = new Date()): Promise<Result<CAReviewRequest>> {
  const review = await store.getReview(code);
  if (!review) return fail(404, "No such review request.");
  if (review.mode === "wapc" && by && review.claimedByCaId && review.claimedByCaId !== by.id) return fail(403, "Another CA holds this request.");
  if (!input.caPersona || !Array.isArray(input.caPersona.facts)) return fail(400, "The CA's version of the return is required.");
  const next: CAReviewRequest = {
    ...review,
    caPersona: structuredClone(input.caPersona),
    caRegime: input.caRegime,
    caNotes: input.caNotes?.trim() || "",
    caDetails: input.caDetails ?? (by ? { name: by.name, membershipNo: by.membershipNo, firmName: by.firmName } : review.caDetails),
    claimedByCaId: review.claimedByCaId ?? by?.id,
    claimedByCaName: review.claimedByCaName ?? by?.name,
    status: "reviewed",
    reviewedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isDraft: false,
  };
  await store.putReview(next);
  mirrorLegacy(next);
  if (by) {
    await store.putAccount({ ...by, reviewCount: by.reviewCount + 1 });
  }
  if (returns) await applyToReturn(returns, next).catch(() => undefined);
  return ok(next);
}

export async function decideReview(store: CAStore, code: string, owner: Owner, accepted: boolean, now = new Date()): Promise<Result<CAReviewRequest>> {
  const review = await store.getReview(code);
  if (!review) return fail(404, "No such review request.");
  if (review.citizenPan.toUpperCase() !== owner.pan.toUpperCase()) return fail(403, "Not your return.");
  const next: CAReviewRequest = { ...review, status: accepted ? "accepted" : "declined", updatedAt: now.toISOString() };
  await store.putReview(next);
  mirrorLegacy(next);
  return ok(next);
}

/* ---------------------------------------------------------------- comments -- */

export async function addComment(store: CAStore, code: string, input: { anchor: string; text: string; author: ReviewComment["author"] }, now = new Date()): Promise<Result<ReviewComment>> {
  const review = await store.getReview(code);
  if (!review) return fail(404, "No such review request.");
  const anchor = (input.anchor ?? "").trim().slice(0, 64);
  const text = (input.text ?? "").trim().slice(0, 2000);
  if (!anchor || !text) return fail(400, "A comment needs a section and some text.");
  const comment: ReviewComment = { id: newCommentId(), code: review.code, anchor, text, author: { role: input.author.role, name: input.author.name.slice(0, 120) }, createdAt: now.toISOString(), resolved: false };
  await store.addComment(comment);
  return ok(comment);
}

/* ---------------------------------------------------------------- helpers -- */

/** The pre-2026-09-08 code paths (`getLatestReviewForPan` on the server, the citizen's local cache) read the legacy memory map; keep it in step. */
export function mirrorLegacy(review: CAReviewRequest): void {
  try {
    const local = loadLocalReviews();
    local[review.code] = review as CAReviewRecord;
    saveLocalReviews(local);
  } catch {
    // the legacy map is a convenience, never the truth
  }
}

/** The CA's figures onto the citizen's server return, so the engine, the agent and the challan all see them (kept from the old route). */
export async function applyToReturn(returns: ReturnSnapshotStore, review: CAReviewRequest): Promise<void> {
  if (!review.caPersona) return;
  const owner: Owner = { pan: review.citizenPan, kind: review.citizenPan.startsWith("DEM") ? "demo" : "citizen", displayName: review.citizenName || review.citizenPan };
  const existing = await returns.get(owner, review.assessmentYear);
  const base: ReturnState = existing?.state ?? {
    version: CURRENT_VERSION, lang: "en", personaId: review.caPersona.id === "custom" ? "custom" : review.caPersona.id,
    baselinePersona: review.originalPersona, persona: review.caPersona, corrections: [], confirmedFactIds: [], regime: review.caRegime ?? "new",
  };
  await returns.replace(owner, review.assessmentYear, { ...base, persona: review.caPersona, regime: review.caRegime ?? base.regime ?? "new" }, null);
}

/** What the citizen and the CA may each see of a request. The PIN hash never leaves the server. */
export function publicReview(r: CAReviewRequest): Omit<CAReviewRequest, "pinHash"> {
  const { pinHash: _p, ...rest } = r;
  return rest;
}

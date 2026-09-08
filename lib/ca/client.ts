/**
 * Browser-side calls for the CA system (2026-09-08). Thin: every function is one fetch to the routes under
 * `/api/ca/*`, typed. The citizen side uses the citizen session cookie; the CA side uses the CA cookie.
 */

import type { ReviewComparison } from "./compare";
import type { CAReviewRequest, PublicCAAccount, ReviewBackground, ReviewComment, ReviewMode } from "./server-store";

export type PublicReview = Omit<CAReviewRequest, "pinHash">;

async function call<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string; detail?: string };
  if (!res.ok || body.ok === false) throw new Error(body.error ? `${body.error}${body.detail ? `: ${body.detail}` : ""}` : `HTTP ${res.status}`);
  return body;
}

/* ------------------------------------------------------------------ CA side -- */

export const caAuth = {
  me: () => call<{ account: PublicCAAccount | null; registeredCount: number }>("/api/ca/auth"),
  register: (input: { name: string; membershipNo: string; password: string; firmName?: string; city?: string; state?: string; email?: string; phone?: string; specialties?: string[] }) =>
    call<{ account: PublicCAAccount }>("/api/ca/auth", { method: "POST", body: JSON.stringify({ action: "register", ...input }) }),
  login: (identifier: string, password: string) => call<{ account: PublicCAAccount }>("/api/ca/auth", { method: "POST", body: JSON.stringify({ action: "login", identifier, password }) }),
  logout: () => call<{ ok: true }>("/api/ca/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) }),
};

export const caInbox = () => call<{ account: PublicCAAccount; open: PublicReview[]; mine: PublicReview[] }>("/api/ca/inbox");

export const reviewApi = {
  get: (code: string) => call<{ review: PublicReview; comments: ReviewComment[]; viewer: "ca" | "citizen" }>(`/api/ca/reviews/${encodeURIComponent(code)}`),
  claim: (code: string) => call<{ review: PublicReview }>(`/api/ca/reviews/${encodeURIComponent(code)}`, { method: "POST", body: JSON.stringify({ action: "claim" }) }),
  submit: (code: string, input: { caPersona: unknown; caRegime: "new" | "old"; caNotes?: string; caDetails?: { name: string; membershipNo?: string; firmName?: string } }) =>
    call<{ review: PublicReview }>(`/api/ca/reviews/${encodeURIComponent(code)}`, { method: "POST", body: JSON.stringify({ action: "submit", ...input }) }),
  decide: (code: string, accepted: boolean) => call<{ review: PublicReview }>(`/api/ca/reviews/${encodeURIComponent(code)}`, { method: "POST", body: JSON.stringify({ action: accepted ? "accept" : "decline" }) }),
  comments: (code: string) => call<{ comments: ReviewComment[] }>(`/api/ca/reviews/${encodeURIComponent(code)}/comments`),
  comment: (code: string, anchor: string, text: string) => call<{ comment: ReviewComment }>(`/api/ca/reviews/${encodeURIComponent(code)}/comments`, { method: "POST", body: JSON.stringify({ anchor, text }) }),
  resolve: (code: string, id: string, resolved: boolean) => call<{ comment: ReviewComment }>(`/api/ca/reviews/${encodeURIComponent(code)}/comments`, { method: "PATCH", body: JSON.stringify({ id, resolved }) }),
  compare: (code: string) => call<{ comparison: ReviewComparison; comments: ReviewComment[]; narrative: string | null; reviewedBy: { name: string; membershipNo?: string; firmName?: string } | null }>(`/api/ca/reviews/${encodeURIComponent(code)}/compare`),
};

/* -------------------------------------------------------------- citizen side -- */

export const citizenReviews = {
  list: () => call<{ reviews: PublicReview[] }>("/api/ca/reviews"),
  create: (input: { mode: ReviewMode; regime: "new" | "old"; persona: unknown; pinHash?: string; background?: ReviewBackground; clientNotes?: string; assessmentYear?: string }) =>
    call<{ review: PublicReview; registeredCount: number }>("/api/ca/reviews", { method: "POST", body: JSON.stringify(input) }),
};

/** One line the sidebar and the workspace share: where a request stands. */
export function reviewStatusLabel(r: Pick<PublicReview, "status" | "mode" | "claimedByCaName" | "caDetails">): string {
  switch (r.status) {
    case "pending": return r.mode === "wapc" ? "Sent to Wapsi certified CAs — waiting for one to pick it up" : "Waiting for your CA to open it";
    case "claimed": return `Being reviewed by ${r.claimedByCaName ?? "a CA"}`;
    case "reviewed": return `Review ready from ${r.caDetails?.name ?? r.claimedByCaName ?? "your CA"} — compare`;
    case "accepted": return "CA version adopted";
    case "declined": return "You kept your version";
    case "rejected": return "Turned down";
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createReview, publicReview } from "@/lib/ca/server-actions";
import type { Persona } from "@/lib/types";
import { requireSession } from "@/lib/server/context";

const createSchema = z.object({
  mode: z.enum(["wapc", "own"]),
  regime: z.enum(["new", "old"]),
  /** SHA-256 hex of the PIN, computed on the client as before; only for `own`. */
  pinHash: z.string().regex(/^[a-f0-9]{64}$|^h_[0-9a-f]+_\d+$/).optional(),
  persona: z.custom<Persona>((v) => typeof v === "object" && v !== null && Array.isArray((v as Persona).facts) && typeof (v as Persona).pan === "string"),
  background: z.object({
    situation: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
    housing: z.string().max(40).optional(),
    extras: z.array(z.string().max(40)).max(12).optional(),
    employer: z.string().max(160).optional(),
    employerCategory: z.string().max(40).optional(),
    residency: z.string().max(20).optional(),
    detailMode: z.string().max(20).optional(),
    filed: z.boolean().optional(),
  }).optional(),
  clientNotes: z.string().max(2000).optional(),
  assessmentYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

/** The signed-in citizen's review requests, newest first — what the sidebar shows. */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const list = await guard.services.caStore.listReviewsForPan(guard.session.owner.pan);
  return NextResponse.json({ ok: true, reviews: list.map(publicReview) });
}

/** Ask for a review: `wapc` reaches every registered CA's inbox; `own` waits for the CA with the code and PIN. */
export async function POST(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request", detail: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
  const result = await createReview(guard.services.caStore, { ...parsed.data, owner: guard.session.owner });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, review: publicReview(result.value), registeredCount: await guard.services.caStore.countAccounts() }, { status: 201 });
}

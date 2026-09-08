import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { claimReview, decideReview, publicReview, submitReview } from "@/lib/ca/server-actions";
import { resolveCa } from "@/lib/ca/server-store";
import type { Persona } from "@/lib/types";
import { getServices } from "@/lib/server/context";

type Ctx = { params: Promise<{ code: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim") }),
  z.object({
    action: z.literal("submit"),
    caPersona: z.custom<Persona>((v) => typeof v === "object" && v !== null && Array.isArray((v as Persona).facts)),
    caRegime: z.enum(["new", "old"]),
    caNotes: z.string().max(4000).optional(),
    caDetails: z.object({ name: z.string().max(120), membershipNo: z.string().max(12).optional(), firmName: z.string().max(160).optional() }).optional(),
  }),
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("decline") }),
]);

/** Who may see a request: the citizen it belongs to, or any signed-in CA (a broadcast request is public to CAs; an own-CA request is opened by code + PIN on the old route). */
async function access(req: NextRequest, code: string) {
  const services = await getServices();
  const review = await services.caStore.getReview(code);
  if (!review) return { services, review: null, ca: null, citizen: null };
  const ca = await resolveCa(services.caStore, req.headers.get("cookie"));
  const session = await services.sessions.resolve(req.headers.get("cookie"));
  const citizen = session && session.owner.pan.toUpperCase() === review.citizenPan.toUpperCase() ? session.owner : null;
  return { services, review, ca, citizen };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const { services, review, ca, citizen } = await access(req, code);
  if (!review) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!ca && !citizen) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  const comments = await services.caStore.listComments(review.code);
  return NextResponse.json({ ok: true, review: publicReview(review), comments, viewer: ca ? "ca" : "citizen" });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const { services, review, ca, citizen } = await access(req, code);
  if (!review) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const a = parsed.data;
  if (a.action === "claim" || a.action === "submit") {
    if (!ca) return NextResponse.json({ ok: false, error: "not_signed_in_as_ca" }, { status: 401 });
    const result = a.action === "claim" ? await claimReview(services.caStore, code, ca) : await submitReview(services.caStore, services.returns ?? services.demoReturns, code, { caPersona: a.caPersona, caRegime: a.caRegime, caNotes: a.caNotes, caDetails: a.caDetails }, ca);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, review: publicReview(result.value) });
  }
  if (!citizen) return NextResponse.json({ ok: false, error: "not_your_return" }, { status: 403 });
  const result = await decideReview(services.caStore, code, citizen, a.action === "accept");
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, review: publicReview(result.value) });
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { addComment } from "@/lib/ca/server-actions";
import { resolveCa } from "@/lib/ca/server-store";
import { getServices } from "@/lib/server/context";

type Ctx = { params: Promise<{ code: string }> };

const addSchema = z.object({ anchor: z.string().min(1).max(64), text: z.string().min(1).max(2000) });
const patchSchema = z.object({ id: z.string().min(1).max(40), resolved: z.boolean() });

async function who(req: NextRequest, code: string) {
  const services = await getServices();
  const review = await services.caStore.getReview(code);
  if (!review) return { services, review: null, author: null as null | { role: "ca" | "citizen"; name: string } };
  const ca = await resolveCa(services.caStore, req.headers.get("cookie"));
  if (ca) return { services, review, author: { role: "ca" as const, name: ca.name } };
  const session = await services.sessions.resolve(req.headers.get("cookie"));
  if (session && session.owner.pan.toUpperCase() === review.citizenPan.toUpperCase()) return { services, review, author: { role: "citizen" as const, name: session.owner.displayName } };
  return { services, review, author: null };
}

/** The inline comments on a return, oldest first. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const { services, review, author } = await who(req, code);
  if (!review) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!author) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  return NextResponse.json({ ok: true, comments: await services.caStore.listComments(review.code) });
}

/** Leave a comment on a section: `anchor` is the row or block it sits on (`income:salary`, `deduction:80C`, `regime`, `summary`). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const { services, review, author } = await who(req, code);
  if (!review) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!author) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  const result = await addComment(services.caStore, review.code, { ...parsed.data, author });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, comment: result.value }, { status: 201 });
}

/** Resolve or reopen a comment. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  const { services, review, author } = await who(req, code);
  if (!review) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!author) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  const comment = await services.caStore.setCommentResolved(parsed.data.id, parsed.data.resolved);
  if (!comment || comment.code !== review.code) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, comment });
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { advance, cancelRun, publicRun } from "@/lib/agentic/runtime";
import { requireSession, runtimeFor } from "@/lib/server/context";

type Ctx = { params: Promise<{ id: string }> };

const inputSchema = z.object({
  message: z.string().min(1).max(4000).optional(),
  answer: z.object({ questionId: z.string(), value: z.union([z.string().max(200), z.number(), z.boolean()]) }).optional(),
  confirm: z.object({ cardId: z.string(), accepted: z.boolean() }).optional(),
});

/** The run plus its full event log from a cursor (?after=seq). Replay re-renders; it never re-executes. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const { id } = await ctx.params;
  const run = await deps.store.getRun(guard.session.owner, id);
  if (!run) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0) || 0;
  const events = await deps.store.eventsAfter(guard.session.owner, id, after);
  const outputs = await deps.store.listOutputs(guard.session.owner, id);
  return NextResponse.json({ ok: true, run: publicRun(run), events, outputs, durable: guard.services.dbConfigured });
}

/** Send a message, answer the pending question, or confirm/decline the pending card. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const { id } = await ctx.params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  const run = await advance(deps, guard.session.owner, id, parsed.data);
  if (!run) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, run: publicRun(run) });
}

/** Delete a chat: its events and run-owned outputs go; the return's own audit does not (§5.4). */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const { id } = await ctx.params;
  const cancelled = await cancelRun(deps, guard.session.owner, id);
  if (!cancelled) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const ok = await deps.store.deleteRun(guard.session.owner, id, new Date().toISOString());
  return ok ? new NextResponse(null, { status: 204 }) : NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
}

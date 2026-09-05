import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { MEMORY_KEYS, type MemoryKey } from "@/lib/agentic/types";
import { requireSession, runtimeFor } from "@/lib/server/context";

/** What Wapsi remembers about the owner — visible and deletable (plan §5.5). */
export async function GET(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  return NextResponse.json({ ok: true, entries: await deps.store.getMemory(guard.session.owner), allowedKeys: MEMORY_KEYS });
}

const setSchema = z.object({ key: z.enum(MEMORY_KEYS as unknown as [MemoryKey, ...MemoryKey[]]), value: z.union([z.string().max(64), z.number(), z.boolean()]) });

export async function PUT(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const parsed = setSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_entry" }, { status: 400 });
  await deps.store.setMemory(guard.session.owner, { key: parsed.data.key, value: parsed.data.value, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const deps = runtimeFor(guard.services, guard.session);
  if (!deps) return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  const key = req.nextUrl.searchParams.get("key") as MemoryKey | null;
  if (!key || !MEMORY_KEYS.includes(key)) return NextResponse.json({ ok: false, error: "unknown_key" }, { status: 400 });
  const ok = await deps.store.deleteMemory(guard.session.owner, key);
  return ok ? new NextResponse(null, { status: 204 }) : NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
}

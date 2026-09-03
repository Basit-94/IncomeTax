import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { forget, forgetAll, recall, remember } from "@/lib/harness/memory";

/** What Wapsi remembers (plan §3.6): list, add one, delete one, or forget everything. */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ memories: recall(user.id) });
}

export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body: { key?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  if (typeof body.key !== "string" || typeof body.value !== "string") return NextResponse.json({ error: "missing" }, { status: 400 });
  try {
    return NextResponse.json({ memory: remember(user.id, body.key, body.value) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "refused" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const key = request.nextUrl.searchParams.get("key");
  if (key) return NextResponse.json({ deleted: forget(user.id, key) });
  return NextResponse.json({ deleted: forgetAll(user.id) });
}

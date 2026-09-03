import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { digilockerMode, disconnect, getLink, pullIssued } from "@/lib/server/digilocker";

/** Link status, a manual pull, and disconnect. */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ mode: digilockerMode(), link: getLink(user.id) });
}

export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  try {
    return NextResponse.json(pullIssued(user.id, user.username));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  disconnect(user.id);
  return NextResponse.json({ ok: true });
}

import { NextResponse, type NextRequest } from "next/server";
import { deleteUser } from "@/lib/server/auth";
import { SESSION_COOKIE, userFromRequest } from "@/lib/server/session";
import { forgetDataKeys } from "@/lib/server/vault";
import { publicUser } from "../public-user";

export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ user: publicUser(user) });
}

export async function DELETE(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  deleteUser(user.id);
  forgetDataKeys();
  const res = NextResponse.json({ ok: true, message: "Account and all associated personal data have been permanently deleted." });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

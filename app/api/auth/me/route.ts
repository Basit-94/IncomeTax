import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { publicUser } from "../public-user";

export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ user: publicUser(user) });
}

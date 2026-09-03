import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { beginConnect } from "@/lib/server/digilocker";

/** Step 1 of the OAuth-shaped mock (plan D8): mint a state and send the browser to consent. */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.redirect(new URL("/signin", request.url));
  try {
    const { redirect } = beginConnect(user.id);
    return NextResponse.redirect(new URL(redirect, request.url));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "unavailable" }, { status: 501 });
  }
}

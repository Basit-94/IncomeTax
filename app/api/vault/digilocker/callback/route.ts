import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { completeConnect, consumeState, pullIssued } from "@/lib/server/digilocker";

/** Step 3: the consent screen sends the browser back with the state and a one-time code. */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.redirect(new URL("/signin", request.url));
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const denied = request.nextUrl.searchParams.get("error");
  if (denied) return NextResponse.redirect(new URL("/vault?digilocker=denied", request.url));
  const owner = consumeState(state);
  if (!owner || owner !== user.id) return NextResponse.redirect(new URL("/vault?digilocker=expired", request.url));
  try {
    completeConnect(user.id, code);
    pullIssued(user.id, user.username);
    return NextResponse.redirect(new URL("/vault?digilocker=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/vault?digilocker=failed", request.url));
  }
}

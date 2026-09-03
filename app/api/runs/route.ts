import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { listRuns } from "@/lib/harness/runs";

/** Chat history (plan §3.6). */
export async function GET(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ runs: listRuns(user.id) });
}

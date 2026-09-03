import { NextResponse, type NextRequest } from "next/server";
import { setPreferences } from "@/lib/server/auth";
import { userFromRequest } from "@/lib/server/session";
import { isUiMode } from "@/lib/mode";
import { isLang } from "@/lib/i18n";
import { publicUser } from "../public-user";

export async function PATCH(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body: { mode?: unknown; lang?: unknown; theme?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  const prefs: Parameters<typeof setPreferences>[1] = {};
  if (body.mode !== undefined) {
    if (!isUiMode(body.mode)) return NextResponse.json({ error: "mode" }, { status: 400 });
    prefs.mode = body.mode;
  }
  if (body.lang !== undefined) {
    if (!isLang(body.lang)) return NextResponse.json({ error: "lang" }, { status: 400 });
    prefs.lang = body.lang;
  }
  if (body.theme !== undefined) {
    if (body.theme !== "light" && body.theme !== "dark") return NextResponse.json({ error: "theme" }, { status: 400 });
    prefs.theme = body.theme;
  }
  const updated = setPreferences(user.id, prefs);
  return NextResponse.json({ user: publicUser(updated ?? user) });
}

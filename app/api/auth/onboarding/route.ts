import { NextResponse, type NextRequest } from "next/server";
import { setOnboarding } from "@/lib/server/auth";
import { userFromRequest } from "@/lib/server/session";
import { createOnboardingProfile, type OnboardingDraft } from "@/lib/onboarding";
import { isLang } from "@/lib/i18n";
import { publicUser } from "../public-user";

/** The completed onboarding answers. Validated by the same function the client uses. */
export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  let body: { profile?: OnboardingDraft & { lang?: unknown } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  const draft = body.profile;
  if (!draft || !isLang(draft.lang)) return NextResponse.json({ error: "profile" }, { status: 400 });
  const profile = createOnboardingProfile(draft, draft.lang);
  if (!profile) return NextResponse.json({ error: "incomplete" }, { status: 400 });
  const updated = setOnboarding(user.id, profile);
  return NextResponse.json({ user: publicUser(updated ?? user) });
}

import type { User } from "@/lib/server/auth";
import type { PublicUser } from "@/lib/user-context";

/** The account as the browser may see it: no hash, no vault key. */
export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    onboardedAt: user.onboardedAt,
    onboarding: user.onboarding,
    mode: user.mode,
    lang: user.lang,
    theme: user.theme,
  };
}

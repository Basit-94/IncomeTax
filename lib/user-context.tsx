"use client";

/**
 * The signed-in user, as the gated layout resolved it on the server. Client components
 * read it with `useUser()`; the shape is `PublicUser` (never the password hash, never
 * vault values). `setUser` lets a component reflect a preference change immediately after
 * the PATCH that persisted it.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { OnboardingProfile } from "./onboarding";
import type { UiMode } from "./mode";
import type { Lang } from "./types";

export interface PublicUser {
  id: string;
  username: string;
  onboardedAt: string | null;
  onboarding: OnboardingProfile | null;
  mode: UiMode;
  lang: Lang;
  theme: "light" | "dark";
}

interface UserContextValue {
  user: PublicUser;
  setUser: (next: PublicUser) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ user: initial, children }: { user: PublicUser; children: ReactNode }) {
  const [user, setUser] = useState(initial);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUser must be used inside the gated layout");
  return value;
}

/** PATCH a preference and return the server's view of the user. */
export async function updatePreferences(
  prefs: Partial<Pick<PublicUser, "mode" | "lang" | "theme">>,
): Promise<PublicUser | null> {
  const res = await fetch("/api/auth/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { user: PublicUser };
  return body.user;
}

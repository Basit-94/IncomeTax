"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Onboarding from "@/components/onboarding";
import { dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import {
  loadOnboardingDraft,
  saveOnboardingProfile,
  type OnboardingDraft,
  type OnboardingProfile,
} from "@/lib/onboarding";
import type { PublicUser } from "@/lib/user-context";
import { surfaceFor } from "@/lib/mode";

/**
 * Wraps the existing onboarding form for the one-time `/welcome` route. The answers go to
 * the account (`POST /api/auth/onboarding`) and, for the manual surface's existing
 * consumers, to localStorage as well.
 */
export default function WelcomeClient({ user, editing }: { user: PublicUser; editing: boolean }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(user.lang);
  const [draft, setDraft] = useState<OnboardingDraft>(() =>
    editing && user.onboarding ? user.onboarding : { lang: user.lang },
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) return;
    const saved = loadOnboardingDraft();
    if (Object.keys(saved).length > 0) setDraft(saved);
  }, [editing]);

  const changeLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem("wapsi_lang", next);
      window.dispatchEvent(new Event("wapsi_lang_change"));
    } catch {
      /* cosmetic */
    }
  };

  const complete = async (profile: OnboardingProfile) => {
    setError(null);
    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) {
      setError("We could not save your answers. Try again.");
      return;
    }
    saveOnboardingProfile(profile);
    router.replace(surfaceFor(user.mode));
    router.refresh();
  };

  return (
    <main className="max-w-6xl mx-auto w-full px-4 py-8 md:px-6 md:py-10">
      {error && (
        <p role="alert" className="mb-4 text-sm font-semibold text-alarm">
          {error}
        </p>
      )}
      <Onboarding
        lang={lang}
        t={dict(lang)}
        initialDraft={draft}
        onLanguageChange={changeLang}
        onComplete={complete}
      />
    </main>
  );
}

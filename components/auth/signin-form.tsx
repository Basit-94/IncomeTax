"use client";

/**
 * The site gate (plan D4). Username + password, a switch to create an account, and a
 * note about the demo login. On success the browser is told where the account belongs
 * (`/welcome` the first time, then the person's own mode). If a different account was
 * signed in on this browser before, its localStorage is cleared so nothing of the previous
 * citizen survives (plan §6).
 */
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import type { PublicUser } from "@/lib/user-context";

type Mode = "signin" | "signup";

const ERRORS: Record<string, string> = {
  bad_credentials: "That username or password is wrong.",
  locked: "Too many attempts. Wait fifteen minutes and try again.",
  taken: "That username is taken. Pick another, or sign in.",
  username_shape: "Usernames are 3 to 32 characters: lowercase letters, digits, underscores.",
  password_short: "Passwords need at least 4 characters.",
  network: "We could not reach the server. Try again.",
};

const LAST_USER_KEY = "wapsi_user";

export default function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(mode === "signin" ? "/api/auth/signin" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json()) as { user?: PublicUser; next?: string; error?: string };
      if (!res.ok || !body.user) {
        setError(ERRORS[body.error ?? ""] ?? "Something went wrong. Try again.");
        return;
      }
      try {
        if (localStorage.getItem(LAST_USER_KEY) !== body.user.id) localStorage.clear();
        localStorage.setItem(LAST_USER_KEY, body.user.id);
      } catch {
        /* storage unavailable: the server session still works */
      }
      router.replace(body.next ?? "/app");
      router.refresh();
    } catch {
      setError(ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="surface-panel w-full max-w-md p-6 sm:p-8 space-y-6" data-testid="signin-card">
        <div className="space-y-3">
          <LogoMark size="md" />
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {mode === "signin" ? "Sign in to Wapsi" : "Create your Wapsi account"}
          </h1>
          <p className="text-sm leading-relaxed text-ink-2">
            One account keeps your documents, your chats and what the assistant has learned, so you
            never answer the same question twice.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <label className="block space-y-1.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">Username</span>
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-line bg-paper-2 px-3 text-sm text-ink outline-none focus:border-money"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">Password</span>
            <input
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-line bg-paper-2 px-3 text-sm text-ink outline-none focus:border-money"
              required
            />
          </label>

          {error && (
            <p role="alert" className="text-sm font-semibold text-alarm" data-testid="signin-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !username || !password}
            className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            data-testid="signin-submit"
          >
            {busy ? "Just a moment" : mode === "signin" ? "Sign in" : "Create account"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-ink-2">
          <button
            type="button"
            className="font-semibold text-money hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "New here? Create an account" : "Already have one? Sign in"}
          </button>
          <span className="inline-flex items-center gap-1 font-mono">
            <LockKeyhole size={12} aria-hidden="true" /> stored hashed, never sent anywhere
          </span>
        </div>

        <p className="text-xs leading-relaxed text-ink-3">
          Reviewer login: username <code className="font-mono">asabs</code>, password{" "}
          <code className="font-mono">12345</code>. Everything on this site is a synthetic prototype.
        </p>
      </div>
    </main>
  );
}

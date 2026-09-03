"use client";

/**
 * The DigiLocker quick-start banner: identity sync is an onboarding step, not a
 * recurring task, so it sits once above the card grid instead of taking a tile
 * (wapsi_dashboard_card_optimization.md §3). The CTA is a plain link to the
 * OAuth-shaped mock at /api/vault/digilocker/connect — the same path the vault
 * page uses — so there is one connect flow, not two. Nothing here contacts
 * DigiLocker; the stamp says so.
 */
import { m } from "motion/react";
import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
import type { Lang } from "@/lib/types";
import { localize } from "@/components/mock-i18n";

const spring = { type: "spring" as const, stiffness: 420, damping: 26, mass: 0.6 };

interface QuickStartBannerProps {
  lang: Lang;
  /** True once the account has a DigiLocker link; the CTA then opens the records instead. */
  connected?: boolean;
  /** Override for tests or other hosts. */
  connectHref?: string;
}

export default function QuickStartBanner({ lang, connected = false, connectHref = "/api/vault/digilocker/connect" }: QuickStartBannerProps) {
  const L = (s: string) => localize(s, lang);
  const href = connected ? "/vault" : connectHref;
  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      aria-labelledby="quick-start-title"
      data-testid="quick-start-banner"
      className="relative flex flex-col gap-4 rounded-[var(--card-radius)] border border-line bg-paper-2 p-5 shadow-[var(--shadow-d13)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-line bg-paper text-money" aria-hidden="true">
          {connected ? <ShieldCheck size={20} /> : <Link2 size={20} />}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {L("Quick start")} · {L("Simulated")}
          </p>
          <h2 id="quick-start-title" className="text-lg font-semibold leading-tight text-ink">
            {connected ? L("Your verified records are synced") : L("Sync verified records via DigiLocker")}
          </h2>
          <p className="text-sm text-ink-2">
            {connected
              ? L("PAN, Aadhaar and Form 16 payroll data are on file. Open them any time.")
              : L("Automatically ingest PAN, Aadhaar, and Form 16 payroll data in under 2 seconds.")}
          </p>
        </div>
      </div>
      <m.a
        href={href}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={spring}
        data-testid="quick-start-cta"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[3px] bg-navy px-5 text-sm font-semibold text-paper no-underline hover:opacity-95"
      >
        {connected ? L("Open my records") : L("Connect DigiLocker")}
        <ArrowRight size={16} aria-hidden="true" />
      </m.a>
    </m.section>
  );
}

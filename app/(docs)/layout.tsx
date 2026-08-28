import Link from "next/link";
import { LogoLink } from "@/components/brand/logo";

/**
 * Shared shell for the two reviewer-facing documents, `/honesty` and
 * `/architecture`.
 *
 * These are deliberately server components with no `"use client"` anywhere in
 * the subtree. Two reasons, both worth stating:
 *
 *   1. They ship zero JavaScript. A judge on a slow connection gets readable
 *      text on first paint, which is the same argument the product makes about
 *      the portal it replaces.
 *   2. They are documents, not interfaces. Nothing here needs state.
 *
 * Written in English only. Every citizen-facing screen is trilingual; these two
 * pages are addressed to a reviewer reading a specification, and pretending
 * otherwise would mean three copies of dense technical prose to keep in sync
 * four days before a deadline.
 */
export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-7 sm:px-8">
      <nav className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-4 text-[0.82rem]">
        <LogoLink size="sm" />
        <span className="text-ink-3">/</span>
        <Link href="/honesty" className="text-ink-2 hover:text-ink">
          What&apos;s real
        </Link>
        <Link href="/architecture" className="text-ink-2 hover:text-ink">
          How it would be built
        </Link>
      </nav>

      {children}
    </div>
  );
}

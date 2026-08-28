import Link from "next/link";

/**
 * The Wapsi logo: the bilingual lockup that was already in the codebase, now the one
 * universal mark for the whole site.
 *
 * The native half is genuinely multilingual and comes from the active dictionary —
 * वापसी in English/Hindi, வாப்சி in Tamil — so the mark speaks the reader's language
 * instead of being a fixed image. That is exactly why it is text and not an SVG.
 *
 * Deliberately NOT a client component. `app/(docs)/layout.tsx` ships zero JavaScript on
 * purpose, so the presentational mark stays server-renderable and the caller decides
 * whether it needs interactivity:
 *
 *   <LogoMark  t={t} />                     inside an existing button (portal header)
 *   <LogoLink  t={t} />                     a plain navigation link (docs, landing)
 */

export const LOGO_FALLBACK = { name: "Wapsi", native: "वापसी" } as const;

/**
 * Where the logo goes when clicked.
 *
 * Kept as a single constant because the destination is still undecided: pre-login "/" is
 * the landing page, and post-login the same route renders the dashboard. If those ever
 * diverge, change it here once rather than hunting through call sites.
 */
export const LOGO_HREF = "/";

type LogoStrings = { shell?: { productName?: string; productNativeName?: string } };

const SIZES = {
  sm: { name: "text-lg", native: "text-[0.7rem]", gap: "gap-1.5" },
  md: { name: "text-2xl", native: "text-sm", gap: "gap-2" },
  lg: { name: "text-3xl", native: "text-base", gap: "gap-2.5" },
} as const;

export function LogoMark({
  t,
  size = "md",
  className = "",
}: {
  t?: LogoStrings;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const name = t?.shell?.productName ?? LOGO_FALLBACK.name;
  const native = t?.shell?.productNativeName ?? LOGO_FALLBACK.native;
  const s = SIZES[size];
  return (
    <span className={`flex items-center ${s.gap} ${className}`}>
      <span className={`font-sans font-extrabold tracking-tight text-money ${s.name}`}>{name}</span>
      <span className={`text-ink-2 ${s.native}`}>{native}</span>
    </span>
  );
}

export function LogoLink({
  t,
  size = "md",
  href = LOGO_HREF,
  className = "",
  label = "Wapsi — go to the home page",
}: {
  t?: LogoStrings;
  size?: keyof typeof SIZES;
  href?: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`inline-flex transition-opacity hover:opacity-80 ${className}`}
    >
      <LogoMark t={t} size={size} />
    </Link>
  );
}

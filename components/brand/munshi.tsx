/**
 * Munshi ji — the friendly CA (Redesign handoff 2026-09-06, "Munshi ji — the
 * mascot"). One egg-shaped head/body, hair cap and moustache, round wire
 * spectacles, rosy cheeks, two stub arms with the right one waving.
 *
 * Vector placeholder from the handoff kit (`munshi()` in _kit.js, viewBox
 * 0 0 120 120); the final illustration replaces this file and nothing else.
 * Motion: `munshi-nod` 5s, `munshi-blink` 4.5s, `munshi-wave` 2.6s — keyframes
 * live in app/globals.css and stop under prefers-reduced-motion with the rest.
 *
 * Server-renderable on purpose (no hooks), like the logo.
 */

export function Munshi({ size = 34, className = "", title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={`shrink-0 overflow-visible ${className}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g className="munshi-nod">
        <ellipse cx="60" cy="62" rx="40" ry="38" fill="#E8A87C" />
        <ellipse cx="60" cy="64" rx="26" ry="20" fill="#F4C9A8" />
        <path d="M22 52 Q60 10 98 52 Q80 34 60 36 Q40 34 22 52Z" fill="#4A2C1A" />
        <g className="munshi-blink">
          <circle cx="46" cy="58" r="10" fill="#fff" />
          <circle cx="74" cy="58" r="10" fill="#fff" />
          <circle cx="47" cy="59" r="4" fill="#2A1508" />
          <circle cx="75" cy="59" r="4" fill="#2A1508" />
        </g>
        {/* Spectacles take the ink colour, so they read in both themes. */}
        <circle cx="46" cy="58" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink" />
        <circle cx="74" cy="58" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink" />
        <line x1="57.5" y1="58" x2="62.5" y2="58" stroke="currentColor" strokeWidth="2.5" className="text-ink" />
        <path d="M42 74 Q60 88 78 74" stroke="#2A1508" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M48 72 Q60 68 72 72" stroke="#4A2C1A" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="34" cy="70" r="4" fill="#D9775A" opacity=".7" />
        <circle cx="86" cy="70" r="4" fill="#D9775A" opacity=".7" />
      </g>
      <g className="munshi-wave">
        <ellipse cx="102" cy="74" rx="9" ry="12" fill="#E8A87C" />
      </g>
      <ellipse cx="18" cy="84" rx="9" ry="12" fill="#E8A87C" />
    </svg>
  );
}

/** The mascot inside a glass circle — the avatar used in the brand box, on every assistant turn and on cards. */
export function MunshiAvatar({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`glass-avatar shrink-0 rounded-full flex items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Munshi size={Math.round(size * 0.85)} />
    </span>
  );
}

/** Munshi ji's speech bubble: ink surface, page-coloured text, the tail towards him (radius 18/18/18/4). */
export function MunshiBubble({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`munshi-bubble ${className}`}>{children}</div>;
}

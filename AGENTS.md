# Project context

Read `docs/CONTEXT.md` first. It is the single current description of the product, the two state
models and the bridge between them, the engine rules, the personas, the copilot, the storage keys, the
Keep it current when a contract changes, and append what you did to `log.md`.

# User Non-Negotiable Rules
- **Log every task:** Always record every change, edit, and verification result into `log.md` (append-only).
- **Preserve UI integrity:** Do not degrade or modify the existing UI layout and design unless explicitly requested by the user.
- **Preserve all 23 languages:** Keep all 23 language options, dictionaries, and localization features fully intact across every page.
- **Branch isolation:** Work on `dev-2` (branched from clean `main`); never merge `dev` into `main` or `dev-2` without user instruction.
- **Commit/Push policy:** Never commit or push to git unless explicitly instructed by the user.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Lessons specific to this repo (moved from the second brain's Lessons.md, 2026-09-07)

Corrections that only matter inside Wapsi. Cross-project lessons stay in
`C:\Coding\SecondBrain\SecondBrain\wiki\system\Lessons.md` and arrive through the SessionStart hook.

- 2026-09-03 — When asserting a marginal-relief bound in a paise engine, apply s.288A rounding of total income first; the mathematical bound (12,70,588) and the statutory effective bound (12,70,584) differ.
- 2026-09-03 — Before adding `@/` imports to a lib module that tests will import, check that vitest resolves the alias (this repo's vitest.config has none; use relative paths).
- 2026-09-06 — Any read of a citizen document (vault, DigiLocker) goes behind an explicit consent card listing what will be read, even when the document is already stored.
- 2026-09-07 — When a header or link block renders boxed, recoloured or word-wrapped, check d13.css's bare element selectors (`nav`, `a`) first: they are unlayered, so Tailwind utilities cannot override them — add an unlayered reset after the d13 import instead of piling on classes.
- 2026-09-07 — Put responsive `hidden`/`md:` variants on a wrapper span, never on the Munshi SVG (munshi.css is unlayered) or as a variant of a component-layer class (`md:glass` does not exist); and check d13.css's bare `nav`/`main` element rules before debugging a mobile layout that will not go `fixed` or stretch.
- 2026-09-07 — Read docs/DESIGN.md §0 (Sunrise/Lilac + Navy & Coral tokens, sizes, Munshi ji placements) before writing any UI; the user had to point me to it.

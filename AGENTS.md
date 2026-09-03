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

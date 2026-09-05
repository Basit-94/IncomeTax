# Tax recommendation RAG — agent handoff

Prepared: 2026-09-05, 20:30 IST. Workspace: `C:\Coding\Tax Filing\IncomeTax`. Branch verified: `dev-2`.

## 1. User objective and current request

The user originally asked to review `lib/knowledge` against real tax regimes, then requested: **“Create the best and most reliable tax recommendation RAG system for my agentic mode.”** This is an implementation task, not just a research report.

The user previously requested a summary, then repeatedly asked to continue and explicitly cancelled that earlier summary request. Their **latest** instruction supersedes that cancellation: **before continuing, create a detailed Markdown summary of the work, instructions, and next steps so a different agent can continue.** This file is that handoff. Implementation was paused to prepare it. Resume implementation when the user asks the receiving agent to continue.

**Continuation 2026-09-05 (Claude Code): sections 7B–7F were completed — release sealed, tool bypasses closed, contract defects fixed, adversarial tests added, gates green (tsc 0 · 305/305 · build 0), `docs/TAX-RAG.md` written. The text below is the handoff as received; see `log.md` for what changed.**

**Status at handoff time: unfinished, unverified engineering work. Do not deploy or describe it as production-ready or qualified tax advice.** No commit, push, merge, or deployment was performed by this task.

## 2. Project instructions and working constraints

These are the applicable project/user instructions and practical continuation requirements, not a substitute for reading the receiving environment's own instructions.

1. **Read `docs/CONTEXT.md` first.** It is the canonical product/context document: state models, bridge, engine, personas, copilot, storage, routes, and verification. Read it before touching code. It was re-read completely for this handoff.
2. **Keep context current.** When architecture, contracts, storage keys, routes, or verified test counts change, update the relevant context section. The in-flight RAG changes are not yet reflected in its main architecture description; a status notice is being added with this handoff.
3. **Log every task/change/check.** Append to `log.md`; never rewrite prior entries. Preferred heading: `## [YYYY-MM-DD HH:MM] Agent (title)`. Record failures and incomplete checks honestly, not only successful gates. This handoff includes a catch-up entry for the in-flight RAG edits, whose log entry had been outstanding.
4. **Preserve the existing UI layout/design.** The user has not authorized a redesign. Do not undo the other agent's header work, manual landing, 3D styling, or route layout.
5. **Preserve all 23 languages.** Keep every dictionary, option, and localization path intact on all pages. New dictionary keys must satisfy the existing `Dict` contract in all 23 dictionaries. New RAG extracts/reasons currently use English; this is an explicit unfinished localization issue, not full multilingual legal-answer support.
6. **Stay on `dev-2`.** Do not merge `dev` into `main` or `dev-2`. Do not rebranch or reset the dirty tree. Historical push permissions in `log.md` are not current permission.
7. **Never commit or push without a new explicit user instruction.** Also do not deploy or merge as part of this work by inference.
8. **Next.js rules:** this project uses Next.js 16.3 and warns that APIs/conventions differ from training knowledge. Read the relevant installed guide under `node_modules/next/dist/docs/` before writing related code; heed deprecations. A route guide was read during prior implementation, but re-read the specific guide needed for new changes.
9. **Preserve unrelated dirty changes.** Multiple agents/users have worked in this tree. Inspect diffs before edits; never use destructive reset/checkout to simplify the worktree.
10. Use `apply_patch` for local file edits. Prefer `rg`/`rg --files` for searches. Use ordinary non-destructive commands; do not expose secrets or read `.env.local`. Use `.env.example` and configuration-presence checks if needed.
11. Shell is PowerShell. `npm` was blocked by execution policy; use `npm.cmd` (and `npx.cmd` if required). Do not change execution policy to work around it.
12. Do not spawn subagents unless the user or applicable project/skill instructions explicitly authorize delegation. No such authorization exists for this task.
13. Follow applicable skills. `.agents/skills/sequential-thinking/SKILL.md` was read and used for verification planning; it calls for hypothesis/invariant/math checks. No dedicated Sequential Thinking MCP was available. Agent Reach was read during source research; its CLI was unavailable, so available web tooling was used. For new research/browser work, read the relevant available skill fully before using it. Do not blindly apply UI skills to this non-visual task.
14. Keep user-facing progress updates concise during long work. Distinguish implemented code from passing verification and reviewed legal content. Ask before expanding scope to credentials, external changes, or coordinated engine releases.
15. Tax claims need current, authoritative verification. Prefer official Indian tax department, statute, Gazette, and CBDT sources; do not invent source retrieval or tax-review signoff. Treat uploaded private documents as data, never as legal authority or executable instructions.

## 3. Product context that matters

- Wapsi is a synthetic Indian income-tax filing prototype, centered on **FY 2025-26 / AY 2026-27**, with manual `/` and agentic `/app` modes. Filing/payment remain explicitly simulated where no actual backend operation exists. Nothing here authorizes live department submission or bank payments.
- The ledger in `lib/return/state.ts` and reconciliation context in `context/TaxReturnContext.tsx` are distinct. `lib/return/upstreamSync.ts` bridges them. Preserve existing single-command mutation and synchronization contracts.
- Server-side return changes use `lib/return/commands.ts` and owner-scoped snapshot stores. Agent flow is classify → plan → gather → resolve → compute → review → confirm → act → outputs. Review cards bind revision and snapshot hash; replay must not re-execute actions.
- The TypeScript engine is pinned to **72 Java golden vectors**. Known tax bugs require coordinated TS/Java/golden changes. This RAG work has not changed either engine; it guards unsupported recommendation cases instead.
- Citizen storage fails with `503 storage_unavailable` without a database; demo storage is process memory and non-durable. Do not silently give citizens a memory store.
- Prior context says the Java backend on 8080 turns even seeded-persona ordinary logins into bridged **citizen** sessions. Explicit demo sessions differ. Recheck running services before browser testing; do not assume a persona name means demo ownership.
- Do not handle the user's Supabase password. Prior unrelated work left database setup pending and created a vault key in ignored environment configuration. No secret contents were read for this handoff.

## 4. Research already done

Read `docs/knowledge-tax-review-2026-09-05.md` for the earlier detailed findings. Important issues included:

- Unpaid self-assessment tax alone has not made a return defective under the removed clause since AY 2017-18; distinguish the product's payment-before-filing policy from law.
- AY 2026-27 filing/revision dates, taxpayer-category differences, and post-December revised-return fee conditions need precise period/category applicability.
- Section 87A marginal relief is conditional, not a blanket exemption for everyone above twelve lakh; special-rate income treatment matters.
- Unused basic exemption and capital-gains adjustments/property grandfathering are not fully modeled.
- Combined 80C/80CCC limits, senior 80D limits, employer NPS salary percentage limits, and election timing need guards or engine fixes.
- Retrieval needed stronger period/category behavior, linked-context safety, multilingual discovery, and provenance/release controls.

Official sources consulted in the preceding implementation/review (reopen if refreshing legal claims):

- https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1
- https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/ITR1-FAQ
- https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/objective-and-scope-new-act-faq
- https://incometaxindia.gov.in/communications/circular/circular03_2017.pdf
- https://www.incometaxindia.gov.in/w/section-112a-61
- https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-112-63
- https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-80ccd-20
- https://incometaxindia.gov.in/Tutorials/20.%20Tax%20benefits%20due%20to%20health%20insurance.pdf

A Finance Act 2025 PDF link returned 404; a prior Gazette 2026 request returned 502. Do not represent those as successfully read enactments. FAQ pages are now labeled departmental FAQs, not falsely labeled statutory text. All current content remains **engineering draft, awaiting a qualified Indian tax reviewer**.

## 5. Implementation in the working tree

These changes have been written, but **no typecheck, tests, or build have been run after them**.

### Knowledge layer

- `lib/knowledge/provisions.ts`: removed dependency on engine constants for legal expected values; uses independent literals so tests can detect disagreement with the engine. Validates consecutive financial-year suffixes. Classifies `/help/` sources as FAQs. Refines 87A, 80D, and 111A wording. Includes supplemental provisions. Per-provision hash still covers rule text and summary; the release hash covers full records. Header comments may still incorrectly say values mirror the engine.
- New `lib/knowledge/supplemental.ts`: seven draft entries for `115BAC(1A)`, `rates-old`, `cess-surcharge`, `24`, `80TTA-80TTB`, `ITR-selection`, and `reconciliation`. Intended total is 19 records including transition; verify with tests. Broad category/income-head tags may need relevance tuning.
- New `lib/knowledge/query.ts`: Unicode NFKC normalization, tokenization, stopwords, aliases using all 23 dictionaries plus a few manual phrases, explicit section recognition, and FY/AY/Tax Year parsing. Ambiguous/unlabeled or conflicting periods request clarification. AY maps back to its income FY.
- `lib/knowledge/retrieval.ts`: BM25 scoring, section-match bonus, stable ordering, primary-result IDs, hard Act/year/category filtering, linked context respecting those filters, named missing attributes, and richer citations. Default 4/max 8 primaries; minimum score 1.2. Linked context intentionally may cross income-head filters. Verify exact-section regex and generic-query false positives.
- `lib/knowledge/types.ts`: optional `EvidenceBundle.primaryIds` distinguishes direct hits from supporting links.
- `lib/agentic/flags.ts`: knowledge release bumped to `2026-09-05.2`.
- New `lib/knowledge/release.ts`: checked-in release manifest; SHA-256 of full sorted corpus records; integrity and date-window checks; separate qualified-review approval flag. `checkedOn=2026-09-05`, `recheckBy=2026-10-05`, review remains `engineering_draft`, reviewer is null.
- **Critical:** `TAX_RELEASE.corpusHash` is literally **`PENDING`**. Consequently release health fails and answers/recommendations abstain. Seal it only after corpus review, with a checked-in computed digest. Do not replace integrity checking with automatic runtime self-approval.
- New `lib/knowledge/rag.ts`: deterministic extractive public-corpus QA. Returns status, period, release/hash, redacted-query hash, exact stored paraphrase blocks, and citations. Stops for injection, stale/unsealed release, ambiguous/unsupported periods, and missing evidence. No LLM rewrites tax prose or arithmetic. It is lexical retrieval with multilingual aliases, **not an embeddings/vector or semantic-hybrid implementation**.
- New `lib/knowledge/advice.ts`: shared intended recommendation guard. Blocks unsupported AY, unknown/nonresident status, incomplete citizen inventories, unreviewed citizen advice, invalid values, high-income surcharge cases, nonzero capital gains, business/rent, unsupported deductions, unverified claims, excessive aggregate 80C, and unverified old-regime election when old is cheaper. Computes comparisons only after initial checks pass and suppresses comparison if election is uncertain. Returns issue codes, source IDs, applicability, sanitized input fingerprint, and action/recommendation flags.

### Agent integration

- `lib/agentic/types.ts`: optional `taxAnswer` and `advice` in persisted working state for audit/replay.
- `lib/agentic/planner.ts`: `isTaxInformationQuestion` routes certain English informational questions to `explain`; prioritizes this over model classification. Needs multilingual/intent-boundary tests.
- `lib/agentic/runtime.ts`: clears prior evidence on new messages; explanatory queries skip private gathering and use public RAG; recommendation flow assesses projected state and abstains without cards/actions/outputs when unsupported; publishes sources; emits deterministic recommendation text instead of model phrasing. Review/output paths require guard approval. Confirmation rechecks advice and release/corpus hash, and stale snapshots reschedule compute and review.
- **Critical unfinished integration:** `lib/agentic/tools.ts` is unchanged and still directly exposes unchecked arithmetic in multiple tools. The shared guard comment overstates coverage until these paths are fixed. Do not call the implementation safe while this bypass exists.

## 6. Known defects and unfinished details

1. Release digest is `PENDING` (intentional fail-closed placeholder, not a deployable state).
2. Runtime retains `const shape = run.task === "explain" ? ...` after the explain branch already returns. This may produce a TypeScript unreachable-comparison error. Inspect other remaining explain comparisons. Remove unused `speak`/`say` paths only after confirming no callers.
3. Advice applicability currently hardcodes `specialRateIncome: 0` even for capital-gains cases it blocks. Derive it or leave it unknown; never record a false fact.
4. Individually safe integers can sum outside the safe range; check aggregate income, deduction, and credit safety, not just each item. Age should be appropriately validated.
5. `supported_demo` is the only supported status even for a theoretical future reviewed citizen case. Make the contract honest before enabling citizen support.
6. `canAct` currently equals `canRecommend`; determine whether action-specific filing/payment readiness requires stricter checks. Do not equate a tax estimate with filing compliance.
7. Timely election, existing election, residency, and complete-facts context are not fully collected in the runtime. It currently passes only boolean resident/timely answers. Missing facts must remain missing, not inferred from the model.
8. Public source extracts and new limitation messages are English. Alias discovery across dictionaries is not translated legal reasoning. Preserve all 23 UI languages and resolve/document source-language behavior without ad hoc mistranslations.
9. BM25 thresholds, broad tags, section matching, unrelated-query abstention, period conflicts, and link expansion need adversarial tests. A matched word does not by itself prove the answer is relevant.
10. Corpus hash covers stored records, not remote source-body snapshots or all predicate/retrieval code. Document this boundary; consider explicit logic/version governance. Do not claim the hash proves law correctness.
11. Tax reviewer signoff is genuinely absent. Never flip approval just to make citizen tests pass. Supporting real personalized advice requires reviewed rules, complete verified facts, and validated engine scope.
12. Existing runtime tests may expect unsafe behavior (e.g., a recommendation card for Rakesh with CG/80D, or staged commands for unsupported other income). Replace those expectations with abstention assertions and keep a supported demo happy path; do not weaken guards to preserve old tests.

## 7. Concrete continuation plan, in order

### A. Reorient and inspect

Read `docs/CONTEXT.md`, this file, `docs/knowledge-tax-review-2026-09-05.md`, and relevant `plan.md` sections. Check branch/status and inspect our diffs. Preserve unrelated changes listed below. Read applicable skills/Next guides before new task actions.

### B. Close every arithmetic-tool bypass

Inspect `lib/agentic/tools.ts`. Add the shared assessment to `get_current_return` (retain raw facts, gate derived figures), `compute_current_tax`, `compare_regimes`, `review_return`, `prepare_filing`, and `prepare_simulated_payment`. Prefer guards inside the actual tool functions, not only the outer executor, so direct calls cannot bypass them. Return structured limitations/release metadata when blocked.

Add a bounded-schema `retrieve_tax_knowledge` tool using `answerTaxQuestion`; optionally expose a read-only assessment tool. Avoid caller-supplied facts becoming authority for mutations. Add an injectable clock if needed for deterministic tests; default to real server time in production.

Improve `check_applicability`: description must not claim qualified review; accept/validate period, category, age, timely election, and special-rate fields where appropriate. Do not silently default unknown identity/category to eligible. Validate finite/nonnegative money and bounded arrays.

### C. Fix contract defects and seal the release

Address §6, especially false special-rate facts and action readiness. Review corpus wording/provenance. Calculate the digest from the final corpus and patch the manifest literal. A possible read-only Vite SSR command, if available:

```powershell
@'
(async()=>{
  const {createServer}=await import('vite');
  const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
  try {
    const release=await server.ssrLoadModule('/lib/knowledge/release.ts');
    console.log(release.corpusHash());
  } finally { await server.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
'@ | node
```

This prints a hash; it does not write the manifest or grant tax review. Use `apply_patch` for the literal edit. Recompute after any corpus change. Test tampering rather than relying on the same dynamic hash for both expected and actual values.

### D. Add regression/adversarial tests

- Knowledge: sealed digest; metadata/text mutation rejection; stale and malformed dates; independent statutory values; exact-section retrieval; empty/unrelated queries; supported and ambiguous/conflicting FY/AY/TY; 2025 Act transition isolation; category/head/link behavior; all-23-dictionary alias checks.
- Evidence: every answer block equals a stored provision paraphrase; every citation resolves to its provision and an approved official HTTPS host; no private identifier leaks; uploaded-document instructions cannot become law; injection cannot override scope.
- Advice: supported Sunita/synthetic salary; citizen draft/incomplete/residency blocks; nonresident; CG-only and mixed gains; combined or duplicate deduction cap cases; senior80D/NPS unsupported; unsupported rent/business; >50 lakh; negative/NaN/Infinity/unsafe aggregates; unknown income; old-election uncertainty; stale release.
- Tool registry: direct and executor paths both refuse unsafe arithmetic and filing/payment preparation; raw owner-scoped facts remain available without misleading derived recommendations.
- Runtime: public explanation creates no return/private-read side effects; malicious model output cannot rewrite law or numbers; unsupported personas produce no actionable card/output; supported demo still works; stale snapshot/release while awaiting confirmation blocks or re-reviews; replay does not act twice; localization options remain intact.

### E. Run mandatory verification and record exact results

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
git diff --check
```

Run focused knowledge/runtime tests first if useful. Do not claim historical 278/279 totals as current results. Prior context and log disagree on the baseline total, and the latest implementation has not been checked. Address failures and rerun. If changing engine behavior, also run coordinated Java tests and regenerate/review golden vectors rather than silently changing expectations.

If checking browser behavior, follow the relevant browser/testing skill, verify session kind and storage readiness, use a safe explicit demo flow, and preserve UI. Visual changes require browser verification. No visual changes were made by this RAG task.

### F. Document and hand off the completed implementation

Create `docs/TAX-RAG.md` describing architecture, supported scope, abstention, release/hash lifecycle, source review, localization boundaries, privacy, audit metadata, and the qualified-review gate. Update `docs/CONTEXT.md` with verified contracts and exact test counts, replacing the in-progress notice only when accurate. Append all edits/checks to `log.md`. Report what actually works and what still needs tax review; no commit/push unless asked.

Optional later work: a read-only source-health check and dedicated knowledge test script. Do not automatically replace legal text from remote pages or pretend an embedding service is configured.

## 8. Dirty-tree ownership snapshot

Pre-existing/unrelated changes to preserve:

```text
.claude/launch.json
backend/src/main/java/com/wapsi/backend/auth/AuthController.java
components/agentic/app-shell.tsx
components/agentic/landing.tsx
components/dashboard/portal-header.tsx
components/agentic/header-frame.tsx (untracked)
docs/CONTEXT.md
docs/MODES.md
log.md
```

Our in-flight implementation files:

```text
lib/agentic/flags.ts
lib/agentic/planner.ts
lib/agentic/runtime.ts
lib/agentic/types.ts
lib/knowledge/provisions.ts
lib/knowledge/retrieval.ts
lib/knowledge/types.ts
lib/knowledge/advice.ts (new)
lib/knowledge/query.ts (new)
lib/knowledge/rag.ts (new)
lib/knowledge/release.ts (new)
lib/knowledge/supplemental.ts (new)
```

This handoff additionally writes this file, appends `log.md`, and adds an in-progress pointer to `docs/CONTEXT.md`. Shared docs contain other people's changes; preserve them. The status command produced a non-fatal permission warning reading the user's global Git ignore file but did report `dev-2` and the worktree successfully.

## 9. Verification at handoff

- Re-read canonical context and recent log.
- Verified branch and dirty-file inventory.
- Inspected current release, advice, RAG, tool registry, and runtime integration markers.
- Confirmed `PENDING` digest, unchecked tool paths, and remaining runtime cleanup in the actual files.
- **No new typecheck, unit test, production build, or browser verification was run for the in-flight implementation.** Historical green runs belong to earlier work.
- No background tool process needs resuming from this handoff. Existing application services may still be running independently; inspect before starting/stopping anything.

Suggested receiving-agent prompt: “Read docs/CONTEXT.md first, then docs/TAX-RAG-AGENT-HANDOFF-2026-09-05.md. Continue the tax recommendation RAG implementation from its unfinished state, close the tool bypasses, verify it, preserve the dirty tree/UI/all 23 languages, and log everything. Stay on dev-2; do not commit or push.”

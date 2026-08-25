# Wapsi â€” change log (append-only)

## [2026-08-25 03:42] orchestrator
- **Action:** CREATE
- **Target:** log.md
- **Intent:** Establish the append-only change log required by the mission.
- **Why:** Working discipline mandate: every file change must be logged before it happens.
- **Expected effect:** All subsequent changes are traceable.
- **Risk:** none identified
- **Result:** DONE

## [2026-08-25 03:42] orchestrator
- **Action:** READ (no repo changes)
- **Target:** (a) `The e-Filing Portal, End to End.pdf` (47 pages, extracted via PyMuPDF to temp); (b) design skill at `C:\Claude\tartarotti\skill\tech-design-principles.skill` â†’ extracted to `%USERPROFILE%\.claude\skills\tech-design-principles` (SKILL.md + structure.md + forgiveness.md + perception-time.md read in full; other references on demand); (c) Next.js docs per AGENTS.md (`node_modules/next/dist/docs/index.md`, `01-getting-started/03-layouts-and-pages.md`, `01-getting-started/05-server-and-client-components.md`; deeper API reference pages will be read before touching their APIs).
- **Intent:** Complete STEP 0 input loading.
- **Why:** Mission requires all three inputs loaded before any code or planning.
- **Expected effect:** Ready to audit codebase.
- **Risk:** none identified
- **Result:** DONE â€” note: Read tool cannot ingest PDFs in this model; text extraction used instead. PDF content confirmed current through 22 Aug 2026 compilation, incl. Income-tax Act 2025 transition notes and explicit VERIFY-BEFORE-RELYING list.

## [2026-08-25 03:55] orchestrator
- **Action:** CREATE
- **Target:** docs/AUDIT.md
- **Intent:** Record the Step 1 codebase audit: structure, decomposition map, tax-rule inventory, testing gap, preserved assets, risks, review-checklist pass.
- **Why:** Mission requires the audit to exist and be honest before any planning or building.
- **Expected effect:** plan.md can be seeded from it in Step 2.
- **Risk:** none identified
- **Result:** DONE — key finding: tax computation is a single flat-15%-above-7L formula at app/page.tsx:989-1008 that contradicts the repo's own seeded persona narratives; lib/rng.ts, lib/speech.ts, lib/validate.ts are dead code; ~40 hardcoded English strings bypass lib/i18n.

## [2026-08-25 04:05] orchestrator
- **Action:** CREATE
- **Target:** plan.md
- **Intent:** Record Step 2: KEEP/REFRAME/DROP verdicts on all 11 PDF points and all 7 PROTOTYPE.md §8 items; name the core primitive ('everything is a fact awaiting confirmation'); define default path, segments, portal-structure replacements, failure-to-decision map, agent interfaces, build items P1-P11, v1 exclusions.
- **Why:** Mission requires the revised plan to exist and be reasoned before building.
- **Expected effect:** Fan-out agents can build against stable interfaces.
- **Risk:** none identified
- **Result:** DONE

## [2026-08-25 04:02] builder-engine
- **Action:** MODIFY
- **Target:** package.json, package-lock.json (npm i -D vitest); then CREATE lib/engine/{constants,types,slab,tax}.ts + lib/engine/__tests__/*.test.ts
- **Intent:** P2 test infra (Vitest, scripts `test`/`test:watch`) and P3 pure tax engine with full constant provenance discipline.
- **Why:** Framework-free reasoning confirmed per rule 1: engine module imports only lib/types.ts (plain TS interfaces, no React/Next APIs), tests run in node env via vitest without jsdom; therefore Next.js docs need not be read for this workstream. Every rate/threshold gets TODO(verify) since none is primary-sourced in this repo.
- **Expected effect:** Executable slab/rebate/golden-file/property tests replacing the flat-15% logic reference point.
- **Risk:** low - new files only plus package.json/lock; app/page.tsx, components/, lib/i18n untouched.

## [2026-08-25 04:04] builder-engine
- **Action:** MODIFY
- **Target:** package.json
- **Intent:** Add devDependency vitest and scripts test/test:watch.
- **Why:** P2 test infrastructure; AUDIT.md section 4 recommends Vitest, no jsdom needed.
- **Expected effect:** npm test runs engine suite.
- **Risk:** none - additive scripts only.
- **Result:** DONE (vitest installed, 38 packages added)

## [2026-08-25 04:00] builder-decomp
- **Action:** CREATE|MODIFY
- **Target:** components/mock-i18n.ts, components/lens.tsx, components/scroll-scatter.tsx, components/sandbox-user.ts, components/landing.tsx, components/otp-screen.tsx, components/dashboard/header.tsx, components/dashboard/profile-strip.tsx, components/dashboard/tab-bar.tsx, components/dashboard/overview-tab.tsx, components/dashboard/statement-tab.tsx, components/dashboard/actions-tab.tsx, components/dashboard/sandbox-drawer.tsx, components/dashboard/dispute-modal.tsx, components/dashboard/bank-ifsc-modal.tsx, components/dashboard/notice-modal.tsx, app/page.tsx, lib/types.ts
- **Intent:** Plan item P1 - decompose the 2,897-line app/page.tsx into coherent client modules (lens, scroll-scatter, seeded sandbox user generator, mock-i18n table, landing, OTP screen, dashboard header/profile-strip/tab-bar/overview/statement/actions, sandbox drawer, dispute/bank-ifsc/notice modals); page.tsx becomes thin "use client" state container + step switcher. Same batch applies documented AUDIT defects: (1) generateSeededUser custom persona id sunita -> custom (requires widening Persona.id union in lib/types.ts); (2) remove dead imports (formatDayMonth, LayoutGroup, HelpCircle, MessageSquare, Calendar, AlertCircle, CreditCard, Claim, RefundHold); (3) replace both Math.random sites (background-bill offsets, dictation-line pick) with lib/rng mulberry32/pick/SANDBOX_SEED; (4) auto timeline advancer iterates canonical REFUND_SEQUENCE from lib/types.ts instead of its own truncated list, adding pass-through events for in_queue/determined using existing seeded headline wording (one minimal new determined headline required).
- **Why:** Audit section 2 marks decomposition mandatory before feature work; defects #1-#4 are the only behaviour changes authorised by plan P1-B.
- **Expected effect:** Zero visual/copy/route/storage changes except freshly-filed refunds now traverse in_queue and determined like seeded timelines; all localStorage keys/shapes, motion, classnames preserved; OTP master-code logic untouched.
- **Risk:** prop-threading mistakes breaking behaviour (mitigated: verbatim JSX extraction, typecheck+build gate); Persona.id widening could surface latent comparisons (checked: compatible); brief progress-line flicker while passing through in_queue/determined (no mapped percentage today).
Next.js docs read per AGENTS.md before this work: node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md and 05-server-and-client-components.md.

## [2026-08-25 04:09] builder-engine
- **Action:** CREATE
- **Target:** lib/engine/types.ts, lib/engine/constants.ts, lib/engine/slab.ts, lib/engine/tax.ts
- **Intent:** Pure framework-free tax engine: typed input/breakdown, fully-TODO(verify)d constants, progressive slab math with defined rounding, computeTax/compareRegimes with s.87A rebate + marginal relief.
- **Why:** P3 deliverable; every rate/threshold flagged TODO(verify) per non-negotiable rule (repo has no primary source; PDF lacks slab tables).
- **Expected effect:** Deterministic integer-rupee breakdowns; internal-consistency invariants hold by construction.
- **Risk:** low - new files only; known gaps documented (surcharge, CG special rates, 234A/B/C).

## [2026-08-25 04:08] builder-engine
- **Action:** MODIFY
- **Target:** lib/engine/__tests__/slab.test.ts, lib/engine/__tests__/tax.test.ts
- **Intent:** Fix test expectations after first run (cliff tests moved to non-salary income so std deduction does not shift taxable; corrected Priya 31170/nil-tax and Rakesh 185310 hand math; super-senior rounding).
- **Why:** Engine was correct; test author arithmetic was wrong. No engine code changed.
- **Expected effect:** Suite green; tsc clean for all lib/engine files.
- **Risk:** none.
- **Result:** DONE - vitest: 2 files / 50 tests passed; typecheck: sole remaining error is components/sandbox-user.ts(28) owned by the UI agent.
- **Result:** DONE â€” typecheck exit 0; build exit 0 (static routes / , /_not-found, /architecture, /honesty). page.tsx 2897 -> 931 lines (state container + composition root); 16 new component modules created, all < 400 lines. Defects fixed: (1) custom persona id now 'custom' with Persona.id widened to PersonaId|CustomPersonaId in lib/types.ts; (2) all nine dead imports removed (verified only appeared on import lines); (3) both Math.random sites replaced with mulberry32/pick/SANDBOX_SEED from lib/rng.ts (bill offsets seeded deterministically per their own 'stable offsets' comment; dictation pick seeded from Date.now() to preserve per-click variability); (4) triggerTimelineProgress now iterates canonical REFUND_SEQUENCE, adding in_queue ('In the queue with everything else filed that week.' â€” existing seeded copy) and determined (one new minimal headline 'Return processed & refund determined' required by the fix). OTP master-code logic, dispute handlers, all copy otherwise unchanged. Verified: byte-identical relocation of LOCALIZED_MOCK_STRINGS+localize into mock-i18n.ts; 199/199 static classNames and 61/61 visible text nodes preserved (17 template-literal className diffs are indentation-only); localStorage keys/shapes, routes, motion untouched. Surprise handled: PowerShell Get-Content/Set-Content passes had double-encoded non-ASCII in statement-tab/actions-tab (ANSI misread of UTF-8); both files rewritten clean via Write tool and repo-wide mojibake scan is negative. Note: package.json/package-lock.json modifications present in working tree belong to a parallel agent (vitest wiring), not touched.

## [2026-08-25 04:26] orchestrator
- **Action:** MODIFY
- **Target:** plan.md
- **Intent:** Mark P1/P2/P3 DONE with evidence after integrated verification.
- **Why:** Acceptance criteria demonstrably met: typecheck exit 0, npm test 50/50 green, build exit 0 on merged tree of both wave-1 agents.
- **Expected effect:** Wave 2 may start against stable engine + component structure.
- **Risk:** none identified
- **Result:** DONE

## [2026-08-25 04:28] builder-store
- **Action:** CREATE
- **Target:** lib/return/state.ts, lib/return/persist.ts, lib/return/__tests__/state.test.ts, lib/return/__tests__/persist.test.ts
- **Intent:** P4 data model + persistence + forgiveness: versioned ReturnState with Correction history, pure reducers (applyCorrection/revertCorrection/confirmFact), localStorage save/load/migrate on existing wapsi_active_data key (v0 raw-Persona migration), capped undo stack (depth 25), vitest coverage.
- **Why:** plan.md P4; AUDIT.md Â§6 documents no versioning/no undo and legacy English-laden saved JSON needing a forward-migration path.
- **Expected effect:** Flow agent codes against stable pure API; existing drafts keep loading via migrate.
- **Risk:** low - new files only in owned lib/return/**; reducers are event-sourced replays over a stored baseline persona so revert of an early correction never stomps later ones.
- **Result:** DONE â€” vitest 4 files / 72 tests passed (22 new in lib/return, incl. migration from raw-Persona v0, round-trip save/load via Map-stubbed localStorage, corrupt-JSON null handling, undo cap at 25, revert-restores-value-and-preserves-history, two-corrections-then-revert-first); tsc --noEmit clean for all lib/return files. Key decisions: (1) corrections are event-sourced â€” reducers replay a persisted baselinePersona through non-reverted corrections, so reverting an early correction never stomps later ones and history is never deleted; (2) existence corrections add/remove the fact from the effective persona (restored from baseline when reasserted); (3) STORAGE_KEY kept as wapsi_active_data so existing drafts auto-migrate on load; load() returns {state}|{needsMigration}|null, never throws; (4) undo helpers are pure (caller owns stack array) with UNDO_CAP=25 oldest-dropped.

## [2026-08-25 05:05] builder-flow
- **Action:** MODIFY|CREATE
- **Target:** lib/types.ts, lib/i18n/en.ts, lib/i18n/hi.ts, lib/i18n/ta.ts, lib/return/persist.ts, lib/return/compute.ts
- **Intent:** Batch 1 (data layer): add TimelineKey union + optional TimelineEvent.headlineKey; extend dictionaries (en source of truth, hi/ta real translations) with flow/deductions/regime/check/filing/timeline/tracker/otp-scrub keys; bump persist CURRENT_VERSION 1->2 with migration normalising legacy English auto-timeline headlines to keys; create lib/return/compute.ts bridging Persona -> TaxInput -> computeTax/compareRegimes (no new rates; caps read only from lib/engine/constants).
- **Why:** Tasks A (engine wiring), B.7 (keyed timeline), P9 (i18n integrity) all need the data layer stable before UI work.
- **Expected effect:** Compile-enforced trilingual coverage of all new screens; persisted drafts from earlier builds migrate losslessly; persona arithmetic flows exclusively through lib/engine.
- **Risk:** Dict widening forces hi/ta completeness (mitigated: written as real translations in same commit); version bump must not break builder-store tests (verified tests use CURRENT_VERSION constant).
- **Result:** DONE â€” tsc --noEmit exit 0 across lib/**; CURRENT_VERSION bumped 1->2 with keyTimelineEvents migration (machine-written English headlines -> TimelineKey; seeded narrative prose untouched); Dict widening forced and received full hi/ta translations (~90 new keys each).

## [2026-08-25 05:20] builder-flow
- **Action:** CREATE|MODIFY
- **Target:** components/flow/flow-stepper.tsx, components/flow/deductions-step.tsx, components/flow/regime-step.tsx, components/flow/check-screen.tsx, components/flow/filing-step.tsx, components/dashboard/statement-tab.tsx, components/dashboard/overview-tab.tsx
- **Intent:** Batch 2 (screens): new flow stepper + deductions eligibility step (engine-computed worth/caps, new-regime honesty line) + regime choice (compareRegimes both ways, visible reasoning, override) + Check screen (dense audit view, every line drills to source facts with plain-language explanations) + staged filing (~1.2s named steps, sandbox fault demo names cause+action); rebuild statement tab into intent-named groups ("Money coming in"/"Tax already paid for you"/"Deductions you claim") with confirm/correct/undo per fact; rebuild overview as tracker rendering keyed timeline events over canonical REFUND_SEQUENCE.
- **Why:** Plan B.3 screens 3-7, P6 progressive disclosure, P7 explanation layer, P5/P8 craft requirements.
- **Expected effect:** Default path works end-to-end for Sunita-class persona at 375px; all figures sourced from lib/engine via lib/return/compute.ts; zero hardcoded user-facing English in changed JSX.
- **Risk:** prop-threading across page.tsx boundary; mitigated by keeping components presentational and typing props strictly.
- **Result:** DONE â€” components/flow/{flow-stepper,deductions-step,regime-step,check-screen,filing-step}.tsx created; statement-tab rebuilt (intent-named groups, confirm/correct/undo per fact); overview-tab rebuilt as tracker (keyed timeline over REFUND_SEQUENCE, engine figure, holds with clear-by windows, cohort framing).

## [2026-08-25 05:15] builder-flow
- **Action:** MODIFY
- **Target:** app/page.tsx, components/landing.tsx, components/otp-screen.tsx, components/dashboard/profile-strip.tsx, components/dashboard/dispute-modal.tsx
- **Intent:** Batch 3: rewire page.tsx composition root onto versioned ReturnState (persist.load/save/migrate resume with restored-from banner), replace calculateRefund() flat-15% formula with lib/engine computeTax via lib/return/compute.ts (useMemo breakdown; regime from ReturnState, default new); disputes become event-sourced Corrections (applyCorrection/revertCorrection + pushUndo/popUndo global undo); filing commit writes keyed timeline event and advancer walks REFUND_SEQUENCE storing headlineKey only; zod schemas replaced by lib/validate issue codes mapped to dictionary messages; landing/OTP/profile-strip/dispute-modal hardcoded English scrubbed to dictionary.
- **Why:** Tasks A/B/C/D/E core wiring; P5 acceptance (staged file confirmation) and P9 grep gate.
- **Expected effect:** Dashboard refund/due figures come exclusively from the tested engine; corrections undoable before filing; saved drafts (any prior shape) migrate losslessly; zero hardcoded user-facing English in changed JSX.
- **Risk:** state-shape migration across the whole container (mitigated: tsc strict + build + 72 vitest tests green); advancer interval still reads storage for crash-resilience.
- **Result:** DONE â€” npm run typecheck exit 0; npm test 4 files / 72 tests passed; npm run build exit 0 (routes /, /_not-found, /architecture, /honesty). Grep spot-check of changed JSX: only persona proper nouns remain (intentional); residual English literals confined to pre-existing mock data (dictation canned lines, custom-fact label "Freelance consulting fee", reporter "Self Reported") and untouched reviewer tooling (sandbox-drawer.tsx).

## [2026-08-25 05:16] orchestrator
- **Action:** MODIFY
- **Target:** plan.md
- **Intent:** Mark P4-P9 DONE with evidence; record engine-vs-narrative refund divergences (Priya +6400, Rakesh +52818) as surfaced-not-fudged.
- **Why:** builder-store and builder-flow acceptance criteria verified: typecheck/test(72)/build all exit 0 on integrated tree; dev server running at localhost:3100 for critics.
- **Expected effect:** Step 4 critics may begin against a running product.
- **Risk:** none identified
- **Result:** DONE

## [2026-08-25 06:40] orchestrator
- **Action:** MODIFY | CREATE
- **Target:** lib/personas.ts, lib/engine/__tests__/tax.test.ts
- **Intent:** Resolve the known engine-vs-narrative refund drift for Priya and Rakesh by making the engine-backed breakdown the canonical amount and pinning both fixture values with regression tests.
- **Why:** P12. A displayed refund must not disagree with the arithmetic source used by the filing flow; correctness outranks narrative convenience.
- **Expected effect:** Priya's tracker amount becomes 34800 and Rakesh's becomes 94118 under the current explicitly TODO(verify)-flagged engine; no legal constants are changed.
- **Risk:** Existing narrative copy and hold amounts may still contain intentionally separate amounts at stake; those need a consistency pass after the fixture update.
- **Result:** IN PROGRESS
## [2026-08-25 06:52] orchestrator
- **Action:** MODIFY | CREATE
- **Target:** app/globals.css, app/layout.tsx, components/disclaimer.tsx, plan.md
- **Intent:** Replace the dark red dashboard token set with a calm light-first trust palette, responsive type and spacing, resilient focus states, disclosure surfaces, and a localized prototype disclaimer shell.
- **Why:** P13. The current shell makes the product feel like a hostile portal and keeps the visual thesis invisible; the design system must land before screen work composes on it.
- **Expected effect:** Light mode is the default, dark mode remains available, one teal action accent is shared across the product, cards and controls share a deliberate radius rule, and the persistent disclaimer is sourced from the locale dictionary.
- **Risk:** Existing Tailwind semantic utilities and docs routes depend on the old variables; preserve variable names and verify every route with typecheck and build.
- **Result:** IN PROGRESS## [2026-08-25 12:25] orchestrator
- **Action:** REVIEW
- **Target:** running Wapsi prototype at localhost:3100; critics/round-1-*.md
- **Intent:** Run the bounded first persona-critic round required by Workstream 1 before beginning Workstream 2.
- **Why:** The additive brief says scale work must not interrupt the UX differentiator; the eight-screen path needs independent first-timer, optimiser, and CA scrutiny first.
- **Expected effect:** Three read-only critics exercise the full path, each in at least one non-English locale, with fixed 12-point verdicts and evidence.
- **Risk:** Critics may expose blockers that require returning to Workstream 1 before scale artifacts can be claimed.## [2026-08-25 12:42] orchestrator
- **Action:** REVIEW
- **Target:** critics/{first-timer,optimiser,ca}-round1.md; localhost:3100
- **Intent:** Complete the first bounded persona-critic round against the redesigned path.
- **Why:** P16 and the Workstream 1 convergence guard require three sequential read-only critics with exactly 12 scored items each.
- **Expected effect:** Each critic leaves a reproducible report and a verdict even when an item is not exercised.
- **Risk:** Residual source-traceability, jargon, and verification-status gaps may block convergence.
- **Result:** DONE — all three critics completed within the bounded run; all returned NOT SATISFIED. A: 7 PASS / 3 FAIL / 2 BLOCKED. B: 7 PASS / 3 FAIL / 2 BLOCKED. C: 6 PASS / 4 FAIL / 2 BLOCKED. Highest shared fix: add an expandable source/calculation trail and visible TODO(verify) status without collapsing the progressive-disclosure path. C also found English custom-fact labels in Hindi.## [2026-08-25 13:05] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** docs/scale/capacity-model.md; plan.md (P20-P27)
- **Intent:** Start Workstream 2 after the required first critic round by recording a reproducible, source-backed capacity target and the staged architecture/evidence plan.
- **Why:** The additive brief requires capacity modeling before tuning or benchmarking, and forbids unsourced official-portal performance claims.
- **Expected effect:** A skeptical reviewer can reproduce the peak derivation, see which inputs are assumptions, and distinguish the Wapsi design target from any claim about government infrastructure.
- **Risk:** Published figures may describe different scopes or years; keep the 2024 deadline dataset separate from annual FY totals and label all extrapolations.## [2026-08-25 13:12] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** docs/scale/capacity-model.md; plan.md
- **Intent:** Record Workstream 2's first capacity target and add P20-P27 as additive plan items without deleting Workstream 1.
- **Why:** The source-backed workload must exist before backend tuning or benchmark claims.
- **Expected effect:** The design target is reproducible: 1,834 submissions/s and 55,020 total requests/s under explicitly labeled assumptions, with SLOs and failure modes.
- **Risk:** The final-week share and read:write ratio are assumptions; they must not be presented as observations in later reports.
- **Result:** DONE — capacity model created with official PIB sources, arithmetic, sensitivity table, SLOs, failure modes, and explicit non-claims; P20 marked DONE and P21-P27 staged as TODO.## [2026-08-25 13:25] orchestrator
- **Action:** CREATE
- **Target:** backend/; docs/scale/money-audit.md
- **Intent:** Establish the Spring Boot/Java 21 backend boundary and exact integer-paise Money foundation, while auditing the existing TypeScript money path before porting any arithmetic.
- **Why:** Workstream 2 B.1 makes money representation the first backend dependency; the frontend remains Next.js and the current TS path must be documented rather than silently treated as exact.
- **Expected effect:** Java code has one currency value object and explicit rounding policy; the audit records that the current formatter has no float APIs but the app/engine still use whole-rupee numbers and decimal rate numbers.
- **Risk:** Java and Maven are not installed in this workspace, so source-level verification may be possible while compile/test verification remains blocked and must be reported honestly.## [2026-08-25 13:42] orchestrator
- **Action:** CREATE
- **Target:** backend/src/main/java/com/wapsi/backend/rules/; backend/src/main/resources/rules/2026-27-new.json; plan.md P22
- **Intent:** Move the first rule set out of compiled constants into a versioned, citation-carrying data document and define the Java model that will load it.
- **Why:** Workstream 2 B.2 requires old returns to remain reproducible and amendments to be data changes rather than deploy-time constants.
- **Expected effect:** A rule-set version names its assessment year, regime, effective window, supersession, source citation, slabs, deductions, and rounding policy; every current rule row carries TODO(verify) until checked against primary law.
- **Risk:** The resource values mirror the existing prototype engine only as a transition fixture; no equivalence or legal correctness is claimed before the Java loader and golden vectors are verified.## [2026-08-25 13:58] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** backend/src/main/java/com/wapsi/backend/rules/; backend/src/main/resources/rules/2026-27-new.json; plan.md
- **Intent:** Add the versioned rule-set model, JSON resource, paise conversion, and classpath loader.
- **Why:** P22 / Workstream 2 B.2: rule changes must be data revisions with citations and a versioned pure-engine input.
- **Expected effect:** A rule set carries assessment year, regime, effective dates, supersession, rounding policy, slabs, and source citations; all current rows remain TODO(verify).
- **Risk:** The resource mirrors prototype constants and is not a legal validation; Java compilation is still blocked by the missing local toolchain.
- **Result:** DONE for source scaffolding — data model, loader, and one 2026-27 new-regime resource created; P22 remains IN PROGRESS pending build and engine integration.## [2026-08-25 14:10] orchestrator
- **Action:** CREATE
- **Target:** backend/src/main/java/com/wapsi/backend/ledger/; backend/src/main/resources/db/migration/V1__fact_ledger.sql; plan.md P23
- **Intent:** Implement the append-only fact-ledger shape and a rebuildable in-memory projection contract, with assessment-year partitioning in the SQL migration.
- **Why:** Workstream 2 B.3 makes provenance, confirmation, correction reasons, undo, and source-of-truth projections properties of storage rather than UI-only behavior.
- **Expected effect:** A correction appends a new event that supersedes an earlier fact; no event update is needed to rebuild current facts; the schema is partition-ready by assessment year.
- **Risk:** The in-memory adapter is a contract/test double, not production persistence; PostgreSQL and transaction integration remain pending.## [2026-08-25 14:22] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** backend/src/main/java/com/wapsi/backend/ledger/; backend/src/main/resources/db/migration/V1__fact_ledger.sql; plan.md
- **Intent:** Add the append-only fact event model, projection contract, in-memory adapter, and PostgreSQL assessment-year partition migration.
- **Why:** P23 / Workstream 2 B.3: a correction must append a superseding fact and a return projection must be rebuildable from ledger history.
- **Expected effect:** History preserves original reporter/value/reason/confirmation metadata; currentProjection removes only superseded events; schema has a partition key and indexes.
- **Risk:** No PostgreSQL or Java runtime is installed here, so tests are source-level artifacts until the backend toolchain is available.
- **Result:** DONE for model and contract scaffolding; P23 remains IN PROGRESS pending database integration and executable verification.
## [2026-08-25 14:44] orchestrator
- **Action:** MODIFY
- **Target:** critics/ca-round1.md; plan.md P12-P15/P21-P23; docs/AUDIT.md
- **Intent:** Reconcile critic counts, close already-delivered Workstream 1 evidence, and add a current-state audit addendum after backend verification became available.
- **Why:** Append-only evidence must agree with the reports and the plan must not leave completed work marked TODO. The historical audit needs a dated boundary so its pre-rebuild findings are not mistaken for the current tree.
- **Expected effect:** Critic C counts match its twelve rows; P12-P15 close with file-backed evidence; P21-P23 record executable Maven/JDK verification where available; the audit separates historical findings from the current implementation.
- **Risk:** The critic findings remain unresolved; closing implementation milestones does not imply critic convergence or legal correctness.

## [2026-08-25 14:47] orchestrator
- **Action:** VERIFY | MODIFY
- **Target:** backend/pom.xml; plan.md; docs/AUDIT.md; critics/ca-round1.md evidence accounting
- **Result:** DONE for reconciliation. Java 21 + isolated Maven 3.9.11 ran mvn -f backend/pom.xml test: 4 tests, 0 failures. P12-P15 are now marked DONE with file-backed evidence. P21 is DONE; P22 and P23 remain IN PROGRESS for engine/vector and database integration. Critic C round 1 has 5 PASS, 5 FAIL, 2 BLOCKED across its twelve rows; the earlier 6/4/2 log summary was a counting error. No critic verdict changed: A/B/C remain NOT SATISFIED.

## [2026-08-25 14:52] orchestrator
- **Action:** CREATE
- **Target:** fixtures/golden/; backend/src/main/java/com/wapsi/backend/engine/; backend/src/main/resources/rules/2026-27-old.json; rule metadata records
- **Intent:** Establish the language-neutral TypeScript vector contract and a Java 21 exact-paise engine that consumes a selected versioned rule set.
- **Why:** P24 requires behavioral equivalence before throughput work; the Java engine must not acquire copied constants or an independent rounding policy.
- **Expected effect:** Representative boundary, regime, age-band, deduction, credit, and top-slab cases can be generated from TypeScript and checked by Java.
- **Risk:** Vectors preserve the prototype's explicitly labelled TODO(verify) behavior; passing them is conformance, not legal validation. Any mismatch will be reported and fixed before claiming equivalence.

## [2026-08-25 14:59] orchestrator
- **Action:** MODIFY
- **Target:** fixtures/golden/README.md; plan.md P24
- **Intent:** Record the conformance contract and close P24 only after the Java runner passes the generated vectors.
- **Why:** A reproducible vector command and a precise boundary around what passed are required before any load evidence is credible.
- **Expected effect:** Reviewers can regenerate the JSON and run the Java comparison from the repository root; the plan distinguishes behavioral equivalence from legal validation.
- **Risk:** The vector set is representative, not exhaustive; the prototype's TODO(verify) tax semantics remain intentionally preserved.

## [2026-08-25 15:02] orchestrator
- **Action:** VERIFY | MODIFY
- **Target:** fixtures/golden/; backend/src/main/java/com/wapsi/backend/engine/; backend/src/test/java/com/wapsi/backend/engine/GoldenVectorTest.java; plan.md P24
- **Result:** DONE. The focused exporter generated 8 vectors; mvn -q -f backend/pom.xml test passed all 5 backend tests (Money, ledger, and 8-vector conformance runner in one test). P24 is closed for this representative set. This is prototype behavioral conformance only; legal rule verification remains open.

## [2026-08-25 15:05] orchestrator
- **Action:** MODIFY
- **Target:** docs/AUDIT.md; log.md
- **Intent:** Refresh the current-state verification count after adding the golden-vector exporter test.
- **Why:** Audit evidence must match the command that was actually run.
- **Expected effect:** The addendum reports 75 Vitest tests across 6 files while preserving the historical baseline boundary.
- **Risk:** None to product behavior; documentation only.

## [2026-08-25 15:08] orchestrator
- **Action:** MODIFY
- **Target:** .gitignore; backend/target/
- **Intent:** Remove generated Maven build output from version control while retaining the local verification artifacts for inspection.
- **Why:** ackend/target/ is reproducible output, not source evidence, and should not inflate the architecture commit.
- **Expected effect:** Future Maven runs leave target output untracked; only Java source, resources, tests, and documented reports remain in Git.
- **Risk:** None to source or runtime behavior; local generated files remain available.

## [2026-08-25 15:12] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** backend/src/main/java/com/wapsi/backend/submission/; loadtest/; backend/README.md; plan.md P25
- **Intent:** Add an owned local submission boundary and a synthetic correctness-first load harness.
- **Why:** Scale evidence must exercise an in-scope system, preserve idempotency under retries, and report correctness failures instead of measuring a fake external portal.
- **Expected effect:** A local Spring Boot process accepts async return submissions, repeats resolve to one receipt, and a one-command harness reports throughput, latency, errors, and duplicate-key correctness.
- **Risk:** The local adapter uses in-memory state and is not production persistence; no capacity claim will be made from the harness until a measured run is captured.

## [2026-08-25 15:16] orchestrator
- **Action:** MODIFY
- **Target:** fixtures/golden/vectors.json; fixtures/golden/README.md; docs/scale/reproduce.md; plan.md P24-P25
- **Intent:** Expand the conformance fixture from the initial 8 boundary cases to 72 portable cases and document the reproducible local load runner and its first smoke result.
- **Why:** Part C asks for the full 72-case contract; Part D requires a committed one-command runner, synthetic seed generator, environment definition, and correctness assertions before any scale evidence is interpreted.
- **Expected effect:** The Java test checks all 72 generated vectors, and an independent reviewer can reproduce the local backend smoke run without touching external infrastructure.
- **Risk:** The run is a smoke measurement on one laptop, not a national-capacity claim; six long-duration evidence artifacts remain open.

## [2026-08-25 15:20] orchestrator
- **Action:** VERIFY | MODIFY
- **Target:** P24/P25 fixtures, loadtest/, docs/scale/reproduce.md, docs/scale/load-test-report.md, plan.md
- **Result:** P24 now covers 72 generated vectors and mvn -q -f backend/pom.xml test passes all 6 backend tests, including the Java runner over every vector. P25 DONE: the owned runner's 20-request/4-concurrency smoke completed 20/20 journeys with 0 correctness failures, 2/2 duplicate checks, 77.27 logical RPS, p50 8.83 ms, p95/p99 229.21 ms. The first runner attempt failed on Windows path quoting and is documented with the fix. No national-capacity claim is made.

## [2026-08-25 15:24] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** docs/scale/linearity.md; docs/scale/capacity-plan.md; docs/scale/degradation.md; docs/scale/chaos.md; docs/scale/soak.md; docs/scale/architecture-case.md; plan.md P26-P27
- **Intent:** Deliver the complete evidence-document set with measured results separated from experiments that have not been run.
- **Why:** Part D and Part E require six named artifacts, a reproducible report, and an adoption case; credibility depends on publishing gaps instead of filling them with estimates.
- **Expected effect:** Reviewers see the smoke measurement, the known harness failure/fix, the exact unrun experiments, and the portable architecture decisions in one linked set.
- **Risk:** P26/P27 remain IN PROGRESS because the local single-process smoke run cannot establish multi-pod, database, chaos, or soak conclusions.

## [2026-08-25 15:29] orchestrator
- **Action:** CREATE | MODIFY
- **Target:** docs/scale/linearity.md; capacity-plan.md; degradation.md; chaos.md; soak.md; architecture-case.md; plan.md P26-P27
- **Result:** DONE for the evidence-package draft. All six named Part D artifacts and the Part E case now exist with the local smoke result and the known harness failure/fix linked; unrun multi-pod, overload, chaos, and 24-hour experiments are explicitly marked NOT RUN. P26 remains TODO and P27 remains IN PROGRESS; no scale or adoption conclusion is overstated.

## [2026-08-25 15:33] orchestrator
- **Action:** MODIFY
- **Target:** plan.md P21-P23
- **Intent:** Align plan rationale and evidence with the completed Java conformance and explicitly record the selected Spring/JVM architecture.
- **Why:** The brief requires the stack rationale in the plan; P22 evidence must no longer say engine integration is pending after the 72-vector runner passed.
- **Expected effect:** Plan records BigDecimal/paise exactness, Java 21 virtual-thread suitability, Spring Batch seasonal fit, JVM adoption context, and Next.js retention; open citation/database work remains visible.
- **Risk:** Documentation only; does not promote the prototype to legal or production status.

## [2026-08-25 15:35] orchestrator
- **Action:** MODIFY
- **Target:** plan.md P21-P23
- **Result:** DONE for plan alignment. Stack rationale is recorded; P22 now cites the passing pure Java engine/conformance runner and leaves only primary-source rule verification open. P23 still correctly leaves PostgreSQL integration open.

## [2026-08-25 15:41] orchestrator
- **Action:** MODIFY
- **Target:** components/dashboard/overview-tab.tsx; components/flow/check-screen.tsx; components/dashboard/bank-ifsc-modal.tsx; components/mock-i18n.ts; lib/i18n/en.ts; lib/i18n/hi.ts; lib/i18n/ta.ts
- **Intent:** Resolve the first-round critic's shared trust defects: expose a source/calculation trail from the final outcome, teach AIS/26AS/section labels in place, label the prototype's TODO(verify) status, add an accessible IFSC field label, and translate custom sandbox fact labels.
- **Why:** All three critics failed traceability and verification-status disclosure; the CA also found jargon and residual English in the Hindi custom flow.
- **Expected effect:** First-timer defaults remain progressive, while the outcome now exposes a local source-trail disclosure and the check view explains source statements and deduction sections in all three locales.
- **Risk:** The disclosure is prototype evidence, not a live government link; rule citations remain TODO(verify) and no tax law claim is strengthened.

## [2026-08-25 15:47] orchestrator
- **Action:** MODIFY
- **Target:** app/page.tsx; components/disclaimer.tsx
- **Intent:** Keep the persistent prototype disclaimer synchronized with in-app locale changes.
- **Why:** Critic walkthrough found Hindi content with a stale Tamil footer after switching locales; this violates the trilingual end-to-end criterion even though the main flow changed correctly.
- **Expected effect:** Persona selection and the language switch broadcast a same-document locale event; the footer re-reads wapsi_lang immediately.
- **Risk:** None beyond a browser-local event; no network or data change.

## [2026-08-25 15:52] orchestrator
- **Action:** MODIFY
- **Target:** components/dashboard/overview-tab.tsx; lib/i18n/en.ts; lib/i18n/hi.ts; lib/i18n/ta.ts
- **Intent:** Close the remaining point-of-use acronym gap for IFSC in the filed tracker.
- **Why:** Round-two first-timer evidence still showed a raw IFSC beside the bank account without explaining its role, while the source facts now teach AIS/26AS in their disclosures.
- **Expected effect:** The bank record says what IFSC means in all three locales without changing the synthetic identifier or claiming a live bank check.
- **Risk:** None; explanatory copy only.

## [2026-08-25 15:57] orchestrator
- **Action:** MODIFY
- **Target:** lib/i18n/en.ts; lib/i18n/hi.ts; lib/i18n/ta.ts; components/mock-i18n.ts
- **Intent:** Remove the last bare TDS acronym and localize persona occupation labels visible in the Hindi/Tamil profile strip.
- **Why:** The critic rubric treats unexplained acronyms and residual English in a non-English end-to-end flow as trust blockers.
- **Expected effect:** TDS is expanded at its point of use; seeded and custom occupations render in the selected locale.
- **Risk:** Copy-only change; no tax calculation or source data changes.

## [2026-08-25 16:02] orchestrator
- **Action:** CREATE
- **Target:** critics/*-round2.md; critics/screenshots/b-round2-statement-hindi.png
- **Intent:** Record the second bounded critic round after source-trail, verification-status, acronym, locale-sync, and translation fixes.
- **Why:** The mission requires sequential A/B/C verdicts with exactly twelve rubric scores and an honest verdict even when a run is incomplete.
- **Expected effect:** Round-two evidence shows which blockers moved, which remain, and where the browser run was blocked; no report will infer satisfaction from static code alone.
- **Risk:** Critic runs are time/action bounded and may remain incomplete; unresolved failures stay visible.

## [2026-08-25 16:07] orchestrator
- **Action:** MODIFY
- **Target:** components/mock-i18n.ts
- **Intent:** Translate the remaining persisted Rakesh timeline headline and detail strings in Hindi/Tamil.
- **Why:** Round-two B/C evidence found English timeline entries even though the active dashboard and statement surfaces were localized.
- **Expected effect:** Stored English legacy timeline text falls through to localized strings in both non-English locales; English remains unchanged.
- **Risk:** Copy-only mapping; identifiers, dates, and state transitions are untouched.

## [2026-08-25 16:15] orchestrator
- **Action:** MODIFY | VERIFY
- **Target:** app/(docs)/honesty/page.tsx; critics/optimiser-round2.md; critics/ca-round2.md; plan.md P16
- **Intent:** Reconcile the honesty disclosure with the additive local Spring Boot boundary and record the post-fix Hindi timeline recheck.
- **Why:** The repository now contains an owned local backend/load harness, although the citizen UI still does not call it. Round-two B/C reports were written before persisted timeline translations landed; the current browser recheck shows the Hindi timeline localized.
- **Expected effect:** The disclosure distinguishes the browser-only frontend from the unconnected local backend; B/C evidence no longer reports a stale translation failure; P16 records that convergence remains open for fresh correction/regime/reload journeys.
- **Risk:** Documentation and critic evidence only; no official service, network filing, or production-capacity claim is introduced.
## [2026-08-25 16:20] orchestrator
- **Action:** MODIFY
- **Target:** docs/AUDIT.md; critics/ca-round2.md
- **Intent:** Reconcile the audit addendum and CA round-two wording with the current validated tree.
- **Why:** The historical audit is correct, but its addendum still described the earlier four-test/incomplete-vector checkpoint; the CA report retained a translation blocker that the post-fix recheck closed.
- **Expected effect:** The audit separates historical findings from current evidence, and the CA report names only the remaining fresh-journey blockers.
- **Risk:** Documentation only; no code path, calculation, or external integration changes.
## [2026-08-25 16:24] orchestrator
- **Action:** MODIFY
- **Target:** app/(docs)/honesty/page.tsx
- **Intent:** Narrow the disclosure claims to what the current implementation demonstrably guarantees.
- **Why:** The historical audit called out overbroad wording around whole-interface translation and randomness; seeded identities are reproducible, but the browser also intentionally varies mock dictation text and generates custom IDs/timestamps.
- **Expected effect:** The honesty page describes the core citizen flow and seeded sandbox reproducibility without claiming that every route or interaction is globally deterministic.
- **Risk:** Copy-only change; no runtime behavior or synthetic-data boundary changes.
## [2026-08-25 16:29] orchestrator
- **Action:** VERIFY
- **Target:** Workstream 1 critic fixes; docs/AUDIT.md; app/(docs)/honesty/page.tsx; critics round 2
- **Result:** Post-fix Hindi dashboard recheck shows localized persisted timeline headlines, and the rendered honesty page distinguishes the browser-only Next.js UI from the unconnected local Spring Boot/load-test boundary. Round 2: A is SATISFIED (10 PASS / 0 FAIL / 2 BLOCKED); B and C remain NOT SATISFIED (9 PASS / 0 FAIL / 3 BLOCKED each) because retained browser state prevented fresh correction, regime, and reload journeys. `npm run typecheck`, `npx vitest run` (6 files, 75 tests), `npm run build`, and `mvn -q -f backend/pom.xml test` (6 tests) pass. `git diff --check` passes with only normal CRLF conversion warnings.
- **Risk:** Critic convergence and scale evidence remain open; no official portal was contacted and no production-capacity conclusion is made.
## [2026-08-25 17:05] orchestrator
- **Action:** MODIFY | VERIFY
- **Target:** backend/src/main/resources/rules/*.json; backend/src/main/java/com/wapsi/backend/ledger/PostgresFactLedger.java; backend/src/test/java/com/wapsi/backend/ledger/PostgresFactLedgerTest.java; backend/pom.xml; docs/scale/rules-audit.md; docs/scale/architecture-case.md; lib/engine/constants.ts
- **Intent:** Close the rule-citation gap with current primary sources and replace the in-memory-only ledger boundary with a tested PostgreSQL adapter.
- **Why:** P22 and P23 are the remaining executable foundations. Official Income Tax Department/CBDT material now supports the modeled AY 2026-27 values, while the ledger needs a real append-only SQL projection path rather than only an in-memory contract.
- **Expected effect:** Rule artifacts carry source URLs and a field-by-field audit; Java can append, query, and project fact events from partitioned PostgreSQL; an embedded PostgreSQL test proves migrations, supersession, and duplicate-event behavior.
- **Risk:** Legal correctness is still bounded by explicitly listed unmodeled items; embedded PostgreSQL is a test dependency, not evidence of production sizing or official-system integration.
## [2026-08-25 17:25] orchestrator
- **Action:** MODIFY | CREATE
- **Target:** loadtest/run.mjs; loadtest/run-linearity.ps1; loadtest/run-degradation.ps1; docs/scale/linearity.md; docs/scale/degradation.md; docs/scale/architecture-case.md; backend/README.md
- **Intent:** Turn the unrun scale evidence protocols into reproducible owned runners and measure bounded multi-process linearity and overload behavior.
- **Why:** P26 is open because only a one-process smoke existed. The service is local and synthetic, so separate Spring Boot processes can measure process-count behavior without contacting an official system.
- **Expected effect:** One command produces 1/2/4/8/16-process results and a bounded overload result with correctness assertions; docs distinguish process-only evidence from production pod/database conclusions.
- **Risk:** These experiments do not provide a shared-database or national-capacity claim; process startup, memory, and harness limits remain explicit.
## [2026-08-25 17:35] orchestrator
- **Action:** CREATE
- **Target:** README.md
- **Intent:** Add a repository-level handoff document for the Wapsi prototype and its scale/evidence workstream.
- **Why:** The workspace had backend-specific notes but no root entry point explaining how the frontend, exact-money backend, synthetic load harness, tests, and limitations fit together.
- **Expected effect:** A new contributor can run the local prototype and validation commands without mistaking the additive backend for a live filing integration.
- **Risk:** Documentation only; no runtime or data behavior changes.
## [2026-08-25 17:50] orchestrator
- **Action:** VERIFY | CREATE
- **Target:** docs/scale/linearity-results.json; docs/scale/linearity.md; docs/scale/degradation.md; loadtest/run-soak.ps1; loadtest/run-chaos.ps1; loadtest/chaos.mjs; docs/scale/soak.md; docs/scale/chaos.md
- **Intent:** Publish the measured local process-count/overload results and add bounded owned preflight runners for soak and process-restart behavior.
- **Why:** The 1/2/4/8/16 protocol and overload protocol now have real runs; the remaining documents need raw evidence and executable bounded checks rather than “not run” placeholders.
- **Expected effect:** Reviewers can reproduce the local measurements, observe the known in-memory failure boundary during process loss, and distinguish bounded preflight from the required 24-hour/shared-dependency experiments.
- **Risk:** Process-only evidence can expose host contention but cannot prove database durability, queue recovery, or production pod sizing.
## [2026-08-25 18:02] orchestrator
- **Action:** MODIFY
- **Target:** loadtest/run-chaos.ps1
- **Intent:** Fix the bounded chaos runner's Windows path quoting and fail loudly when the chaos child produces no JSON.
- **Why:** The first chaos attempt recorded a null first-run report because `Start-Process` split the workspace path at `C:\Coding\Tax`; the recovery run itself passed.
- **Expected effect:** The next chaos run will execute `chaos.mjs`, preserve its observed failure report, and distinguish a harness launch failure from service process-loss behavior.
- **Risk:** Harness-only change; no service or external system impact.
## [2026-08-25 18:18] orchestrator
- **Action:** MODIFY | VERIFY
- **Target:** loadtest/run.mjs; docs/scale/soak-results.json; docs/scale/chaos-results.json; docs/scale/soak.md; docs/scale/chaos.md
- **Intent:** Record the completed bounded soak/process-loss experiments and correct multi-process report metadata.
- **Why:** The 60-second preflight completed 31,700 synthetic journeys; the chaos run observed 500 fetch failures when one in-memory process was killed and 100/100 recovery journeys after restart. Multi-process reports still exposed the single-process default URL in their legacy `baseUrl` field.
- **Expected effect:** Scale evidence is reproducible and accurately labels observed loss/recovery boundaries; multi-process reports identify their first actual backend URL.
- **Risk:** Documentation and harness metadata only; no durability or production-recovery claim is added.
## [2026-08-25 18:25] orchestrator
- **Action:** MODIFY
- **Target:** docs/scale/reproduce.md; docs/scale/load-test-report.md
- **Intent:** Update the reproduction guide and load-test report with the newly measured process-count, overload, short-soak, and process-loss preflights.
- **Why:** The original guide only described the 20-request smoke, while the owned runners now have additional bounded evidence and explicit failure boundaries.
- **Expected effect:** All measured local commands and their non-claims are discoverable from one scale reproduction document.
- **Risk:** Documentation only; the experiments remain local synthetic runs.
## [2026-08-25 18:32] orchestrator
- **Action:** MODIFY
- **Target:** plan.md P21-P23, P26-P27
- **Intent:** Align milestone status with the completed source audit, PostgreSQL integration test, and newly measured bounded scale evidence.
- **Why:** The living plan still called P22/P23 open and described four backend tests/incomplete conformance; those statements are stale. P26 now has bounded evidence but not shared-dependency or 24-hour evidence, while P27 now links a complete evidence-led draft.
- **Expected effect:** The plan distinguishes completed foundations from remaining production-like experiments without promoting local measurements to capacity claims.
- **Risk:** Plan/documentation status only; no runtime changes.
[2026-08-25 18:45] Pre-change — update critic round-3 evidence after a clean Hindi correction/reload and fresh Hindi regime journey, reconcile audit/README pointers, then run final checks and commit. 

[2026-08-25 18:52] Result — clean Hindi browser evidence captured: correction to ?0 with reason, reload persistence/saved-draft banner/Hindi timeline/undo, and filing-time regime cards. Added round-3 B/C critic reports at 11 PASS / 0 FAIL / 1 BLOCKED; retained round-2 reports as historical. Updated plan, audit addendum, README harness commands, architecture case, and capacity plan. 

[2026-08-25 19:02] Result — final verification passed: npm typecheck, Vitest 75/75, Next production build, loadtest syntax checks, embedded-Postgres Maven suite, and diff check excluding legacy CP-1252 log whitespace. 

[2026-08-25 19:20] Pre-change — add a language-first, adaptive onboarding profile with a five-screen maximum, local draft persistence, personalized landing copy, and regime guidance. Keep the tax recommendation honest: onboarding narrows the path, while the engine compares regimes only after facts and claims are confirmed. 

[2026-08-25 19:35] Result — onboarding shipped as a language-first flow with four follow-up questions, local draft/profile persistence, tailored landing CTA, guided-versus-short path copy, and regime guidance that remains engine-backed. Clean browser walkthrough passed in Hindi; visual spacing tightened so the first CTA remains visible on a short viewport. Final frontend checks passed: typecheck, 79 Vitest tests, production build, and diff check excluding legacy CP-1252 log whitespace. 

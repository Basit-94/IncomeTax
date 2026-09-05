# Wapsi — Agentic Mode Implementation Plan

**Revised:** 2026-09-05, Codex. Audited on `dev-2`, HEAD `9d29bf0`, including the existing uncommitted working tree. Follow-up research adds the user's ChatGPT Work-style layout, fixed toggle, tax knowledge/applicability architecture, adaptive planning, and conversation contract (§5.6–§6).
**Status:** ANALYSIS COMPLETE — implementation has not started and is not authorized by this planning task.
**Replaces:** the 2026-09-03 agentic pivot proposal. This is a proposed implementation sequence, not an instruction to start automatically.
**Read first:** `docs/CONTEXT.md`, then this file. CONTEXT currently describes an older tree; the verified differences below take precedence for this proposal.

## 1. Intended experience

Use a simplified ChatGPT Work-style workspace with persistent left navigation, a central conversation/manual workspace, and Progress / Outputs / Sources at the top right. The user's follow-up explicitly authorizes this shared-shell layout change. Preserve working manual components, the existing vault service, return behavior, and all 23 languages. The Agentic / Manual toggle occupies exactly the same header location in both modes. Explain your situation, see a personalized plan, watch document checks and calculations, answer only necessary questions, review the result, and explicitly confirm any simulated filing or payment.

The agent checks the citizen's existing vault before requesting documents. It can retrieve a supported stored document, extract relevant facts, cite its source, reconcile discrepancies, and compute using the existing engine. Chat history, resumable work, outputs, and user-controlled memory remain part of the original vision.

All filing, payments, external status, and authority-issued documents remain prototype simulations. A saved file and a successful model response do not establish a government filing.

## 2. What exists today and what changes the old plan

| Area | Verified implementation | Updated decision |
|---|---|---|
| Branch | `dev-2`, with substantial existing uncommitted UI work | Preserve it; no branch switch, merge, commit, or push |
| Vault | `lib/vault/vault-store.ts`, `/api/vault`, `citizen-vault-modal.tsx` | Extend this vault; do not create a competing vault or mandatory `/vault` page |
| Document contents | `VaultDocument` contains metadata only; no bytes or storage reference. New `vault-document-preview.tsx` draws explicitly synthetic replicas from vault statistics | Add persistent originals and extraction records; retain replicas as clearly synthetic demo previews |
| Database | `pg` dependency, `lib/db/postgres.ts`, `tax_vault_users` with JSONB | Extend PostgreSQL; remove SQLite and `/tmp` persistence from this plan |
| Supabase | `lib/db/supabase.ts` detects configuration and wraps PostgreSQL calls; it does not implement bucket uploads, RLS policies, or application encryption | Verify deployment capabilities before relying on them; comments are not evidence of configured infrastructure |
| Authentication | Java-backed PAN/OTP path exists, with mock fallback. New vault registration mints a client-side `vault_session_*` marked mock | Retain the UI, establish server-verifiable ownership before persistent agent access; do not blindly add the old username/password gate |
| Vault authorization | `/api/vault` GET accepts PAN; POST accepts identity data without session ownership checks | Secure the existing route before exposing it to an autonomous workflow |
| Agentic mode | Header already has Agentic/Manual; `AgenticModeModal.tsx` contains scripted scenarios | Replace the scripted experience; use the requested shared navigation shell while preserving working manual content |
| Existing copilot | `/api/agent` has Gemini function calling and a four-question cap; `components/agent/agent-panel.tsx` is the UI | Reuse formatting and valid engine tools; introduce a shared runtime rather than a second divergent registry |
| Agent documents | `list_documents` reads Java `/api/v1/documents`; `fetch_document` is a client action without an implemented handler | Point both modes at the same vault document service |
| Java document store | Owner-scoped metadata and byte storage already exist under `backend/.../document/` | Keep an adapter/import path for existing Java records; do not silently mix them with frontend vault metadata |
| Copilot writes | `executeReconcileFact` returns an event-shaped object but does not persist a correction | A completed action must mean a real shared state mutation succeeded |
| Returns | Browser-owned `ReturnState`, correction history, `upstreamSync`, reconciliation context | Reuse these contracts and extract shared commands; avoid independent agent balances |
| Filing | `handleFileCommit` continues after non-2xx HTTP responses; exception fallback is synthetic | Fix shared outcome handling before exposing filing to the harness |
| PDF extraction | `pdfExtract.ts` now has async FlateDecode/CMap handling plus raw-text extraction | Reuse and test current parser; the old assertion that all compressed PDFs fail is obsolete. OCR is still separate |
| Manual tools | Portal Hub and file, optimizer, record matching, pay, notices, status/history, calendar modals already exist | Integrate these capabilities instead of rebuilding the old tile grid |
| Modes | `wapsi_user_mode` coexists with `wapsi_ui_mode` and onboarding v2 `simple/full` | Separate interaction mode from detail preference; preserve existing selections during migration |
| Verification | Typecheck passed; **193/193 tests in 18 files** passed during this analysis | Replace old 182-test assumptions; gates do not establish live service readiness |

No production database, bucket, model endpoint, or Java deployment was contacted in this analysis. Live configuration, authorization, durability, and deployment limits remain implementation preflight checks. No secret environment values were printed.

## 3. Architecture and boundaries

Proposed flow:

```text
Existing portal and Tax Vault          Agentic workspace (/app)
              |                                 |
              +------ shared return commands ---+
              |                                 |
       versioned ReturnState             authenticated run API
              |                                 |
       upstreamSync projection          bounded workflow harness
              |                          |       |       |
       TaxReturnContext                vault   engine   outputs
                                        |
                              existing PostgreSQL adapter
                          documents / extractions / runs / events
```

### 3.1 One document service

Introduce a server-side `VaultRepository` behind the existing vault API, with owner-scoped operations to list metadata, retrieve bytes, read extraction results, upload, and delete. Agent tools call this service directly; they do not fetch arbitrary URLs or use a client-supplied PAN as authorization.

Default initial storage: PostgreSQL metadata and capped encrypted file bytes in a separate document table, using the current `pg` connection. This avoids assuming a Supabase bucket exists. Keep a storage interface so verified private object storage can replace byte storage later. Do not introduce two simultaneous authoritative stores. Existing Java documents are exposed through an explicit legacy adapter where authenticated access is available, with source-qualified IDs and deduplication on import.

Keep the vault modal and its four-tab organization. Existing preview behavior remains for synthetic records; actual uploaded files open their original bytes. Add only the controls and statuses required by retrieval, upload, extraction, and memory.

### 3.2 Identity before retrieval

Implement one server-side session resolver used by vault, runs, outputs, memory, and shared return APIs. Keep current PAN/document onboarding screens. A PAN extracted from a document identifies its subject; it does not prove account ownership.

Reuse verified Java authentication for real backend sessions, exchanging it for a server-managed HttpOnly session through a verified bridge. The backend currently needs a suitable authenticated identity verification contract; implement that deliberately, not by trusting a token prefix or a body field. For standalone demonstrations, issue server-managed demo sessions isolated to synthetic fixture data. Existing client-minted tokens cannot authorize access to real vault records.

For newly uploaded personal records, require a verified account before durable private access. Account claiming and any standalone production auth provider are prerequisites if the Java identity service is unavailable; do not make the demo registration path a substitute for ownership verification.

Owner checks belong in every data operation. A root `proxy.ts`, if useful for redirects, is not the authorization boundary. This matches the installed Next.js guides; the old `middleware.ts` instruction is obsolete.

### 3.3 One return mutation path

Extract behavior from `app/page.tsx` into framework-independent return commands and a shared provider/service before connecting agent writes. Commands include import proposed facts, confirm, correct, revert, choose regime, record a simulated payment, stage revision, and finalize a simulated filing.

Preserve `baselinePersona`, `effectivePersona`, correction history, feedback codes, confirmations, and `buildSyncPayload`. Use canonical persona fact IDs; aggregate reconciliation IDs such as `salary` cannot select one of several employers without an explicit mapping.

Persist one server-owned return snapshot per owner and assessment year for durable agent sessions, with a separate monotonic revision for concurrency. Existing `ReturnState.version` is a serialization version, not a concurrency counter. Manual and Agentic use the same commands and snapshot; reconciliation remains a projection, with mutable actions bridged back through commands. Preserve its payments, additional claims, revision state, and undo semantics during extraction.

A command carries an expected revision and idempotency key. A stale write returns a conflict, refreshes the view, and invalidates affected calculations and review cards. An agent must not overwrite a newer manual edit. Vault statistics are derived summaries, never a competing financial authority.

## 4. Extending the existing vault

### 4.1 Data additions

Use migrations rather than creating tables opportunistically in every request. Preserve existing `tax_vault_users` rows and vault IDs.

| Record | Required information |
|---|---|
| Document | Stable ID, owner, assessment year, type, filename, MIME type, byte length, hash, storage reference/bytes, issuer, source, timestamps, retention/deletion state |
| Document provenance | `uploaded`, `legacy_backend`, `synthetic`, or `generated_output`; version and supersession relationship |
| Extraction | Document/version/hash, parser version, status, structured fields, field locator where available, validation issues, review state |
| Source-backed fact | Field value, document ID, source field/location, assessment year, issuer/employer, confirmation status; identity fields kept outside model context |
| Access audit | Owner, actor, run/tool, document ID, operation, result, timestamp; no raw document text or secrets |
| Run / events | Owner, return ID and revision, task, workflow state, ordered events, pending question/review, budget usage, timestamps |
| Outputs | Owner, run, reviewed snapshot revision/hash, kind, stored bytes/reference, synthetic status |
| Memory | Typed key/value, source run, validity year where needed, timestamp, deletion state |

Scope document identity by owner, not by current `doc_f16`-style seed ID alone. Deduplicate uploads by content hash per owner; matching titles are not proof of identical contents. Store multiple employers and multiple years.

### 4.2 Migration and truthful status

- Existing metadata records migrate as `metadata_only`; preserve their title, issuer, and dates. Mark known persona fixtures `synthetic`.
- An original file that was never saved cannot be recovered from metadata or regenerated from vault totals. Ask once for re-upload when the original is necessary; remember the missing-source state during the run.
- Migrate cached data only after matching it to the verified owner and year. Never assign every unsuffixed localStorage record to the first person who signs in.
- Preserve current keys during a versioned migration: `wapsi_citizen_vault_active`, `wapsi_citizen_vaults_all`, `wapsi_active_data`, `wapsi_reconciliation`, session, onboarding, and mode keys. New private caches must be owner-scoped; sign-out removes the active private view.
- Treat seeded `verified`, `syncedToPostgres`, and bank status flags as demo data, not evidence of actual verification or successful persistence.
- The current code stores identity fields as ordinary database text/localStorage JSON despite encryption claims. Add actual protected storage/key handling and accurate disclosures; do not carry forward an unsupported “zero-knowledge” claim for a service that decrypts documents for processing.

### 4.3 Retrieval and extraction policy

For each required fact: check accepted current-return facts and their source versions, then relevant vault extraction records, then stored originals needing extraction, then ask for the missing information or file. Do not ask for information already supported by current, usable evidence.

Automatic retrieval of the signed-in citizen's relevant vault documents is part of the workflow; no repeated permission prompt. Log “Found two salary statements for this year” only after a successful lookup. A metadata match means “record found; original unavailable,” not “document read.”

Validate owner, year, subject identity when present, document type, size, signature/MIME, extraction completeness, and duplicate/version relationships. Begin with the current PDF parser and a 5 MB original-file cap; also bound decompressed size, execution time, and extracted text. Images and scans can be stored but require manual figures until OCR is separately implemented and verified. Unsupported or password-protected files produce a recoverable request, never invented fields.

Extracted values are proposals. Keep disagreements between Form 16, AIS, 26AS, and user answers visible; do not overwrite whichever arrived first or sum the same salary reported in three sources. For multiple employers, preserve separate salary/TDS entries and let the engine apply its annual rules. Zero, absent, unreadable, not applicable, and declined are distinct states. A “14 lakh package” is not automatically taxable gross salary; PF is not automatically employer NPS.

Private vault lookup begins with owner/year/type/issuer and structured fields. The public tax-law corpus uses the separate hybrid retrieval system in §5.6; the earlier decision against a vector index applied only to basic private-file lookup, not legal research. Additional formats use explicit extraction adapters; “any document” means authorized retrieval of supported stored files, not a promise to understand every format.

## 5. Harness, tools, history, and memory

### 5.1 Workflow

`classify → plan → gather → resolve gaps/conflicts → compute → review → confirm → simulated action → outputs`

Support `running`, `waiting_for_input`, `waiting_for_review`, `completed`, `cancelled`, and `failed`, with explicit recoverable failure reasons. The server owns transitions, prerequisites, validation, and tool permissions. The model classifies intent, proposes eligible next steps, and explains results in the selected language. It cannot bypass missing evidence or completion gates.

Use bounded action schemas, not fixed interviews or canned tax plans. The planner composes a per-user dependency graph from the goal, applicable rules, verified facts, document availability, deadlines, and tool capabilities. It may omit resolved work, reorder independent steps, and ask the question that resolves the most consequential uncertainty. The server validates every proposed action and prerequisite. Replan when facts change, preserving completed work and explaining the practical change. Start with validated coverage for salary-return preparation, regime comparison, reconciliation, and demo loading; expand coverage by category. Unsupported cases return a supported next action rather than claiming completion.

### 5.2 Shared tools

Adapt `lib/agent/tools.ts` into a runtime-validated registry shared by legacy chat and Agentic. Reuse `computeForPersona`, `compareForPersona`, engine constants, compliance modules, and existing return adapters. Retire duplicated calculations and misleading result contracts where they differ from the shared implementation.

Tools: `list_vault_documents`, `read_document_fields`, `open_vault_document`, `get_current_return`, `propose_fact_updates`, `apply_return_command`, `compute_current_tax`, `compare_regimes`, `review_return`, `prepare_filing`, `confirm_simulated_filing`, `prepare_simulated_payment`, `get_filing_history`, `draft_notice_response`, and typed memory operations.

Routine scoped reads and calculations run automatically. Proposed financial changes remain reviewable and reversible; ambiguous changes ask a targeted question. Filing/payment confirmation is mandatory and bound to the exact current snapshot, amount, owner, and year. Remove the old production-facing `AGENT_REQUIRE_CONFIRMATION=false` shortcut. Do not treat a model tool call as user confirmation.

### 5.3 Model boundary and limits

The server builds allowlisted context; it does not trust client-posted facts for final actions. The model sees opaque references, relevant financial figures, approved non-sensitive attributes, and sanitized source descriptions. Names, PAN, Aadhaar, bank details, tokens, filenames containing identifiers, and unrestricted document text stay out of prompts/tool summaries.

Redact free-text messages before model transmission and persistence; secure identity inputs bypass chat. Documents and extracted text are untrusted data, never tool instructions. Prompt wording supplements schema validation and server authorization; it does not replace them.

Keep Gemini configuration-driven. Verify configured model availability/capabilities during implementation; do not assume the old hard-coded primary/fallback IDs remain valid. Use bounded timeouts, retries, tool calls, and per-user/run/day budgets. The current route does not enforce the documented daily-token budget. Replace the four-question limit for authenticated agent workflows with real server-enforced budgets, while preserving legacy public-chat limits. Model failure falls back to explicit deterministic questions for supported tasks, not guessed intent or unchecked actions.

### 5.4 Durable runs and streaming

Add owner-scoped run creation, message/answer submission, confirmation, cancellation, history, event replay, and output endpoints. Persist each transition/event before streaming it. Every event has `runId`, monotonic `seq`, timestamp, type, and a validated redacted payload.

Events cover plan/step updates, factual activity, source lookup, tool outcome, questions, messages, review cards, outputs, and status. Activity describes observable work; do not expose private model reasoning or label invented text as “thinking.”

Use fetch-streamed SSE with cursor replay/poll fallback. Run execution is a bounded step per request with a persisted checkpoint, not a process that must stay alive until the entire interview finishes. After disconnect or process restart, resume from the checkpoint; do not rely on unawaited background work. Enforce one writer per owner/return through a lease or optimistic lock and idempotent actions. A replay re-renders events; it never re-executes a payment or filing.

Reopened history restores the latest valid question, plan, sources, and outputs. A changed return/document version invalidates stale reviews. Deleting a chat removes its conversational data and run-owned outputs subject to documented retention; it does not erase the return's correction audit or source documents. Keep shared generated-document references consistent and disclose any retained filing record.

### 5.5 Memory

Store explicit typed facts such as preferred language or employment category, with user visibility and deletion. Do not use arbitrary model-authored free text with regex filtering as the privacy guarantee. Financial amounts and identifiers belong to protected facts, not memory. Annual facts expire or require reconfirmation; deleting memory excludes it from future model context, including reconstructed context in ongoing runs.

### 5.6 Tax knowledge: RAG plus executable applicability rules

**Research-backed recommendation:** build a versioned tax knowledge system, not a model expected to memorize all legislation. RAG supplies current evidence at inference time; fine-tuning is an optional later tool for task behavior, extraction, or conversational consistency. OpenAI's [accuracy guidance](https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy) distinguishes these uses. A [preregistered legal-AI study](https://arxiv.org/abs/2405.20362) found errors in retrieval-based legal products; this is evidence against treating RAG as a correctness guarantee, not a measured error rate for Indian taxation or Wapsi.

Maintain two access-separated corpora:

- **Public tax knowledge:** legislation, Finance Acts/amendments, notified Rules and forms, CBDT notifications/circulars, official filing schemas/validation rules and departmental guidance. Add scheme-specific official authorities where necessary. Case law requiring interpretation is separately curated with jurisdiction and precedent status.
- **Private evidence:** the current owner's vault documents and confirmed answers. Private content never enters a shared legal index, another user's context, or training data by default.

Each legal provision carries Act/version, section and subsection, income period, AY/TY, effective interval, notification/publication date, jurisdiction, taxpayer-category tags, source URL, exact locator, content hash, superseded-by links, reviewer, and review date. Keep definitions, provisos, exceptions, schedules, and amendment relationships with their parent provision. A keyword match on a deduction section without its exceptions is insufficient evidence.

**Critical transition case:** the Department states that FY 2025–26 income / AY 2026–27 remains under the 1961 Act; FY 2026–27 income / Tax Year 2026–27 falls under the 2025 Act. Do not equate either Act with the old/new tax-regime choice. Store these as separate dimensions and include the transition in every regression release. See the Department's [transition FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/objective-and-scope-new-act-faq).

Retrieval pipeline: identify task and applicable period → filter legal version/jurisdiction → exact section and keyword search plus multilingual semantic retrieval → rerank → expand linked definitions/exceptions → validate applicability → supply an evidence bundle. Missing taxpayer attributes must retain candidate rules and trigger questions, rather than filter them away. Date/attribute filtering before semantic search is a documented retrieval capability ([reference](https://developers.openai.com/api/docs/guides/retrieval)).

Encode consequential eligibility rules as reviewed, testable predicates with three outcomes: **eligible / ineligible / insufficient information**. Inputs may include taxpayer entity, tax residency and relevant dates, age, income heads, employment/business status, turnover/receipts, asset type/acquisition/transfer dates, ownership/payment relationships, deductions, prior elections, filing history, deadline, and supporting evidence. Ask only task-relevant attributes; category labels alone do not establish eligibility.

Example: salary-only and salary-plus-business taxpayers must not receive the same regime-switching workflow merely because their totals match. The Department's [Form 10-IEA manual](https://www.incometax.gov.in/iec/foportal/newformpage/forms/form10-iea-UM?mobile-app=1) documents additional election requirements for business/professional income. Implement the relevant year's complete election conditions and history before recommending an executable switch; this source example is not a substitute for the full rule.

The existing engine computes only after eligibility and supported coverage are established. Every recommendation records: relevant user facts, eligible alternatives, disqualified alternatives and reasons, rule versions, engine result, missing evidence, and feasible next steps. “Best” means a lawful supported option under the user's goal and constraints, considering tax, required paperwork, deadlines, liquidity, and any future election consequences. Do not equate maximum deduction with the best financial decision, invent expenditure, or claim global optimality beyond tested coverage.

### 5.7 Models, updates, and accuracy release gates

| Approach | Suggested use | Trade-off |
|---|---|---|
| General model with prompts alone | Baseline evaluation only | Cannot serve as the authoritative source for current rules |
| Hybrid RAG + reviewed applicability rules + deterministic engine | Recommended production architecture | More curation and tests, but decisions can be traced and reproduced |
| Fine-tuned model layered onto that architecture | Later, if held-out tests reveal persistent behavior/extraction problems | Requires licensed/de-identified examples and repeated regression tests; does not replace law updates |

For a concrete retrieval baseline, evaluate PostgreSQL text search plus a vector extension if the deployment supports it; otherwise use a private compatible index. Benchmark a multilingual embedding candidate such as [BGE-M3](https://arxiv.org/abs/2402.03216) against an approved managed embedding service. Its paper describes multilingual and multiple retrieval modes; it does not establish accuracy for all 23 Wapsi languages. Benchmark query translation and native multilingual retrieval on the actual tax corpus. Add a reranker only if it improves held-out results. No provider/model is selected solely by marketing benchmarks or number of supported languages.

Keep generation provider-independent. Evaluate the configured Gemini against an available alternative on identical evidence bundles, category cases, tool calls, and language/style tasks before choosing. Verify current model IDs, licensing, data retention, hosting region, latency, and cost at implementation. Public research here does not change the configured provider or authorize sending citizen data to a new provider.

Create a legal-content release process: fetch approved sources → detect changes → stage a diff → qualified Indian tax reviewer validates applicability → update executable rules and tests → publish an immutable knowledge release. Record effective dates separately from publication dates; support retrospective changes. A reviewed precedence/conflict policy distinguishes legislation, delegated instruments, departmental guidance, and judicial interpretation. Do not resolve conflicts by whichever snippet has the higher similarity score or newer webpage date.

Proposed operational cadence: daily checks of official updates, prioritized review around filing deadlines, and an immediate affected-rule hold when a material unreviewed change is detected. This is an implementation requirement, not an automation created by this planning task. Each run pins its knowledge release; a material update invalidates affected pending approvals and requests recalculation before execution. Keep prior snapshots for audit.

Establish a reviewer-maintained coverage matrix by year, entity, residency, income head, regime, deduction/scheme, and workflow. Broad legal-reference coverage does not imply autonomous filing coverage. Expand the current limited engine deliberately: surcharge, interest/fees, full eligibility/exemption conditions, return-form selection, schema validations, and supported special cases must be implemented and tested before accepting affected returns.

Proposed release gates (targets, not achieved performance):

- Every executable legal decision has an approved rule version and retrievable supporting provision; every tax figure matches the versioned engine snapshot.
- Zero unresolved critical errors across a maintained expert-reviewed blocking suite: wrong year/Act, ineligible deductions, duplicate credits, invalid elections, unauthorized action, or unsupported filing. Passing finite tests is not a guarantee of zero production errors.
- Measure retrieval recall, source entailment, eligibility precision/recall, calculation parity, appropriate refusal/clarification, and end-to-end completion separately, by category and language. Do not hide a failing group in an aggregate score.
- Include threshold boundaries, negative eligibility examples, conflicting documents, misleading premises, amended/repealed rules, and equivalent cases in all 23 languages. Separate training, tuning, and held-out cases; include review of real-world diversity and adversarial inputs.
- Use qualified human review for disputed interpretations and unsupported/high-consequence cases. A second model can detect issues but is not the legal authority or release approver.
- In production, track corrections and incidents, pin model/prompt/retriever versions, support rollback, and pause only affected capabilities when possible. Never advertise 100% accuracy or turn embedding similarity into an invented “confidence percentage.”

### 5.8 Conversation and trust contract

The goal is ChatGPT-like clarity, warmth, and responsiveness, not an assertion that Wapsi reproduces ChatGPT's private prompts, training, or an undisclosed psychological formula. Official [model guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.2) documents configurable verbosity; the sources consulted do not establish one universal ChatGPT word/character cap. Different tasks need different amounts of explanation.

Replace the current rigid one-or-two-sentence/no-context policy with adaptive responses. These are **proposed Wapsi English-language starting ranges**, to validate with users, not OpenAI specifications:

| Situation | Starting response shape |
|---|---|
| Simple question | Direct answer and necessary qualification, usually 30–80 words |
| Missing information | One focused question and a short reason, usually 15–45 words |
| Progress | One factual sentence; batch small tool events in the activity area |
| Recommendation | Decision, user-specific reason, evidence, and next action, usually 80–180 words |
| Complex comparison or final review | Compact table/card with a short explanation, typically 150–300 words; expandable detail |
| Requested explanation | As long as needed to answer accurately; no artificial character ceiling |

Use these ranges softly. Never truncate a material condition to satisfy a limit. Do not apply English word counts mechanically to Indic scripts; test readability and task success per language. Preserve amounts, dates, identifiers, and source references through translation. New legal translations need terminology review, not just a model-language setting.

Lead with the useful answer. Explain why it applies to this citizen. Ask one important question at a time when an answer is necessary. Avoid stock praise, repeated greetings, legal jargon before plain meaning, sales language, and reassurance unsupported by evidence. Mention uncertainty at the exact unresolved point. Say “I found,” “I suggest,” “I prepared,” and “I completed” only when their corresponding events exist.

Illustrative response after a verified lookup: “I found both salary statements in your vault. I'll combine them and check the tax already deducted. Did you receive any freelance income during the same year?” The question appears only if that fact is unknown and relevant. Do not hard-code that sequence for every taxpayer.

Failure example: “The file is saved, but I couldn't read the salary figure. You can enter it here or upload a clearer copy.” Give a usable recovery action without claiming success or burying the problem in a generic disclaimer.

Use the model to phrase validated facts and next steps naturally. Deterministic validators protect amounts, citations, conditions, action status, and required disclosures; they do not force every reply into identical sentences. Start with a versioned style prompt and a human-reviewed example set; consider fine-tuning only after evaluation demonstrates a need.

Test comprehension, perceived helpfulness, ability to spot an intentionally wrong suggestion in a controlled study, correction success, and unnecessary question count. Optimize appropriate trust rather than how confidently the assistant sounds. [Microsoft's human–AI interaction research](https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/) supports evaluating behavior across normal use, failures, and changes over time; exact wording/length choices above are Wapsi design hypotheses.

## 6. Agentic surface and supported scope

Use `/app` for the dedicated agent workspace and `/` for Manual, inside one persistent application shell. Extract the shared return provider first so navigation does not reset the draft. Preserve `/reconcile`, existing vault functionality, manual controls and calculations, and visual tokens while simplifying the navigation as explicitly requested. This replaces the earlier proposal to preserve the entire existing outer header layout.

**Required layout:**

```text
+-------------------+-------------------------------------------------------+
| Wapsi             | [Agentic | Manual]                Progress Outputs Sources |
| New chat          +-----------------------------------+-------------------+
| Search chats      |                                   | Current chat      |
| Tax Vault         | Conversation / manual workspace   | inspector         |
| My return         |                                   | (collapsible)     |
| Filing history    |                                   |                   |
| ----------------- |                                   |                   |
| Recent chats      |                                   |                   |
| ...               |                                   |                   |
| ----------------- |                                   |                   |
| Account/settings  | Composer / current manual action  |                   |
+-------------------+-----------------------------------+-------------------+
```

- **Left sidebar:** New chat, search, Tax Vault, My return/manual tools, filing history, and persisted chats. Account, language, theme, memory/preferences live at the bottom or under settings. Avoid duplicating the same navigation across the canvas and header. Vault access uses the same records/service; an in-shell view may reuse the existing modal's content.
- **Fixed mode toggle:** one shared `ModeSwitch` in a reserved header slot immediately to the right of the sidebar boundary. It must have the same anchor, order, dimensions, and accessible labels in Agentic and Manual. Switching mode changes central content only; it cannot move the control from right to left or mount it in another header. Sidebar collapse and responsive changes follow identical rules in both modes.
- **Top right:** stable `Progress`, `Outputs`, and `Sources` controls open one inspector beneath them. Sources means the documents, confirmed answers, assumptions, and legal references actually used in this chat, not every item in the vault. Use “Sources” as the simple visible label; sections distinguish “Your documents,” “Information you provided,” and “Tax rules.” Display source versions, used facts, verification state, and a link to the exact page/provision where available. Changing chats changes the inspector's contents.
- **Center:** calm whitespace, readable transcript, one composer, lightweight tool activity, and focused review/input cards. No promotional feature pillars, scripted claims, duplicate chat bubbles, or permanent dense dashboard grid in Agentic. Keep pending question and next action obvious.
- **Progress:** show meaningful steps and current blockers, never fake percentages or a token-by-token thought feed. Outputs appear only after storage succeeds. Empty controls retain their location and show an honest empty state; their appearance does not push the toggle around.
- **Responsive:** left navigation becomes a drawer; the same mode toggle remains in the same reserved header position for both modes at that viewport. Top-right inspector controls can collapse to one stable button opening tabs. Preserve keyboard focus, selected chat, scroll, pending input, language, theme, and return state when switching. Mode switch pauses new agent writes; a currently committing action resolves and synchronizes before Manual edits proceed. Resume is explicit.
- **Acceptance:** at identical viewport/sidebar settings, screenshot and bounding-box tests confirm the toggle has identical position/size before and after mode switches. Test empty/loading/active/failed/completed chats, long localized labels, both themes, keyboard use, and narrow screens. The user should not need to rediscover a control after switching modes.

Official [ChatGPT Work guidance](https://learn.chatgpt.com/docs/get-started-with-work) confirms a workflow involving files, tools, progress, questions, and approval of important actions. It does not establish a universal pixel specification for every rollout. The exact left-sidebar/top-right arrangement above is the user's explicit Wapsi requirement; validate visual fidelity against the user's available reference during design rather than inventing unseen ChatGPT screens. Keep Wapsi branding.

Preserve language and theme across mode switches. Keep Simple/Full as an internal detail preference rather than destructively rewriting it to interaction mode. Persist onboarding completion once per verified account, reuse the existing form, and preserve current users' preferences. New accounts can default to Agentic after onboarding; existing users are not silently switched. Separate `/signin` and `/welcome` pages are not necessary for the initial release.

All new fixed interface strings, errors, questions, and review actions must support all 23 dictionaries. Preserve existing locale options and number formatting; model-language output is supplementary to translated deterministic templates. Voice reuses `lib/speech.ts` with a supported-browser fallback and truthful provider disclosure; lack of voice must not block a task.

| Capability | Release treatment |
|---|---|
| Salaried return, including multiple employers | First complete vertical slice, within current engine coverage |
| Regime comparison and fact reconciliation | First release, engine and ledger backed |
| Demo personas | First release; isolated synthetic vault and return data |
| Notice assistance | Next slice; cited document-based draft, no submission or invented legal citations |
| Tax payment / refund status / history | Reuse existing flows and records; clearly label simulations and unavailable live data |
| ITR JSON / ITR-V | Versioned Wapsi prototype exports tied to reviewed snapshot; no claim of valid government-schema upload unless separately validated |
| Business benefits / presumptive filing | Deferred: existing “business income” input is not a complete eligibility/rules implementation |
| HRA, advanced tax helpers, additional manual tiles | Separate follow-up only where absent; no grid rebuild |
| DigiLocker | Optional later source adapter; never a dependency for using the existing vault |
| OCR / arbitrary document reasoning | Follow-up with bounded extraction and verification |
| Real filing, real payments, real e-verification | Out of scope |

## 7. Implementation sequence and acceptance gates

| Phase | Work | Done when |
|---|---|---|
| A — Contracts and ownership | Capture manual UI baselines; verify deployment/DB; define session resolver and owner mapping; migrations; protect existing vault access; isolate demo records | Cross-user reads/writes fail; mock tokens cannot access private data; migrations preserve current records |
| B — Usable existing vault | Original bytes, hashes, versions, extraction/provenance, upload/download, legacy metadata migration, read audit | Upload a PDF once, reload, reopen identical bytes, and retrieve its supported fields through an owner-scoped service; metadata-only records remain honest |
| C — Shared return actions | Extract provider/commands from page handlers; versioned server snapshot; existing manual/context adapters; idempotent payments and filing outcome handling | Manual, Agentic fixtures, and reconciliation show identical figures; corrections/undo survive switching and reload; non-2xx never produces filed status |
| K — Tax knowledge and applicability | Approved source registry, legal period/version mapping, hybrid retrieval benchmark, reviewed eligibility predicates, category coverage matrix and blocking test suite | First supported tasks resolve the correct law/period, cite supporting provisions, reject ineligible actions, and ask for consequential missing facts; reviewer signs off supported scope |
| D — First complete agent workflow | Shared validated tools, dynamic dependency planning under deterministic guards, knowledge/engine integration, model adapter, bounded budgets, durable events, adaptive response policy | Existing documents are retrieved automatically; only material gaps are asked; task plans differ appropriately by user; calculation and review derive from accepted facts and eligible rules |
| E — Working interface | Shared ChatGPT Work-style shell, left navigation/history/vault, fixed mode toggle, top-right inspectors; streamed transcript; history/resume; language/theme continuity | Complete and resume a workflow; toggle does not move on switching; manual functions remain intact; all 23 locales have interface copy |
| F — Completion and broader tasks | Snapshot-bound confirm, simulated filing/payment, durable exports; notices/status integrations; typed memory controls | Repeat confirmation cannot duplicate actions; files match the approved snapshot; source links work; memory/history deletion works |
| G — Hardening and documentation | Failure/restart/concurrency checks; legal and language evaluations, user comprehension studies, full regression; deployment verification; update CONTEXT, MODES, disclosures, env docs and README | Technical and expert-reviewed coverage gates pass, persistence survives restart, supported scope is accurate, all limitations are documented |

Build each phase behind an agentic feature flag until integrated. The first end-to-end milestone is: **two stored salary statements → automatic retrieval → source review → engine comparison → human-confirmed simulated filing → matching outputs → resume history → identical Manual return.**

Phase K is required before the first rule-based recommendations in D. Shared-shell wireframes and the style evaluation set can be designed during A, then connected in E. Do not start with a generic scripted interview or a second vault. Complete and validate the first slice, then expand supported taxpayer categories against the same rules and evaluation process. Broad all-category coverage remains the product objective, not a claim that the current prototype already supports every return.

Real filing remains a separate production program: official integration/access, current validated submission schemas, credential and identity controls, filing acknowledgement/status reconciliation, incident response, and operational/legal review must be established before enabling it. Neither this research nor a passing prototype demo enables government filing automatically.

## 8. Required verification

- Existing engine/golden vectors, corrections, persistence migrations, reconciliation, challan, notice, status/history, and calendar tests remain green.
- New tests cover ownership, forged/expired sessions, metadata-only documents, wrong owner/year, missing bytes, duplicate content, multiple employers, conflicting sources, stale extraction, scans/encrypted PDFs, explicit zero, and failed uploads.
- Shared-state tests cover old/new regime parity, age/capital-gains metadata, disputed facts, additional claims, one credit per challan, undo, and manual edits during a waiting run.
- Workflow tests cover invalid tool arguments, unknown tasks, model failures, budget exhaustion, secret redaction, document prompt injection, expired approval, concurrent commands, event replay after restart, cancellation, and repeat confirmation.
- Filing tests explicitly reject non-2xx responses and distinguish accepted, pending, failed, and simulated outcomes. A response lost after acceptance is resolved via idempotency/status lookup; it does not trigger a new simulated submission.
- Outputs use an immutable reviewed snapshot and are retrieved through owner checks. A model-generated receipt string is not a cryptographic hash or stored artifact.
- Browser verification: requested shared shell, preserved Manual/Vault functionality, Agentic workflow, fixed-toggle geometry on mode round-trips, per-chat top-right sources, mobile, both themes, keyboard/focus, language persistence, and all 23 locale selections. No jsdom assumption.
- Knowledge verification: temporal/category retrieval, Act-versus-regime separation, reviewed eligibility predicates, citations that actually support claims, rule-update invalidation, unsupported-case handling, and the §5.7 expert-reviewed gates.
- Conversation verification: fact/action-state fidelity, localized readability, adaptive length, useful recovery, absence of repeated/unnecessary questions, and controlled comprehension/appropriate-trust testing. A pleasing answer cannot compensate for a wrong filing decision.
- Per meaningful implementation phase: typecheck, relevant tests, build, and browser verification for changed surfaces. Broaden to the full suite before completion.

**Analysis baseline:** `npm run typecheck` passed; `npm test` passed 193/193 in 18 files. Build, browser, Java, model, and live database checks were not rerun for this documentation-only task. Prior log entries report a passing build, but that is not a fresh verification here.

## 9. Resume and scope rules

All phases A–G and K are **proposed / not started**. This task changes planning documentation only. Implementation begins only after a subsequent user instruction.

On implementation, read current instructions and inspect the working tree first; this audit includes other uncommitted work which must be preserved. Update phase status only after its acceptance criteria pass. Append each change and verification result to `log.md`; update `docs/CONTEXT.md` when actual contracts change. Do not schedule wakeups, deploy, commit, push, or merge as a consequence of this plan.

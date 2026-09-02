# Wapsi (वापसी)

Wapsi is a synthetic, trilingual prototype for a simpler Indian income-tax
filing journey. Its core idea is that every number is a fact awaiting
confirmation: each fact carries its source, plain-language meaning, and one
citizen action—confirm or correct.

This repository contains two deliberately separate parts:

- The Next.js citizen-facing prototype. It runs locally, persists demo state in
  the browser, and does not contact the Income Tax Department, UIDAI, banks,
  CBDT, or any other official system.
- An additive Spring Boot / Java 21 engineering boundary under `backend/`.
  It demonstrates exact-paise money, versioned rules, an append-only
  PostgreSQL ledger adapter, and an asynchronous idempotent submission API.
  The Next.js UI **does** call this backend where one is reachable — it signs in
  against `/api/v1/auth/*` (`lib/auth-client.ts`), reads filing history, and
  POSTs `/api/v1/returns/submit` before the UI ever says "filed"
  (`app/page.tsx`). With no backend running, sign-in falls back to a session
  flagged `isMock: true` and the demo continues locally. Either way the backend
  does not submit a real return to any official system.

## Run the frontend

Requirements: Node.js and npm.

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The app includes seeded synthetic personas,
English, Hindi, and Tamil UI states, a reviewer sandbox, and the disclosure
pages at `/honesty` and `/architecture`.

On a new browser, Wapsi starts with a short onboarding profile. Language is
asked first, followed by intent, work situation, rough income, filing history,
and the tax topics that may matter. The answers are saved locally and tailor
the starting path, dashboard destination, next action, and amount of
explanation. Unfiled returns remain facts-first; filed users open on the
refund tracker, reported facts, or pending actions that match their intent.
The answers narrow the journey; the actual regime comparison still uses
confirmed facts and claims.

## Verify the frontend

```powershell
npm run typecheck
npx vitest run
npm run build
```

The TypeScript engine and return-state tests are the product contract. The
golden-vector export under `fixtures/golden/` is also consumed by the Java
engine; see [fixtures/golden/README.md](fixtures/golden/README.md).

## Run the backend checks

The verified environment uses Temurin Java 21 and an isolated Maven 3.9.11
distribution. From the repository root:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
$mavenRoot = Join-Path $env:TEMP 'wapsi-maven\apache-maven-3.9.11'
$env:Path = "$env:JAVA_HOME\bin;$mavenRoot\bin;$env:Path"
mvn -q -f backend/pom.xml test
```

The test suite covers integer-paise arithmetic, the Java/TypeScript golden
vectors, async submission idempotency, the in-memory ledger contract, and an
embedded PostgreSQL migration/history/projection test.

## Run the owned load harness

These commands exercise only locally owned Spring Boot processes with
deterministic synthetic `DEMP-` references:

```powershell
pwsh -File loadtest/run.ps1 -Requests 100 -Concurrency 8
pwsh -File loadtest/run-linearity.ps1
pwsh -File loadtest/run-degradation.ps1
pwsh -File loadtest/run-soak.ps1
pwsh -File loadtest/run-chaos.ps1
```

The first command is a small journey smoke. The other commands are bounded
local-process experiments; they are not evidence of official-portal capacity,
production pod sizing, or national-scale readiness.

## Evidence and design notes

- [Project context](docs/CONTEXT.md) — the one-stop brief for anyone (or any agent) joining the repo: architecture, state models, engine rules, personas, verification.
- [Capacity model](docs/scale/capacity-model.md) — published workload inputs and labeled assumptions.
- [Rule-source audit](docs/scale/rules-audit.md) — current primary-source mapping for modeled AY 2026–27 values and explicit scope gaps.
- [Architecture case](docs/scale/architecture-case.md) — evidence-led adoption case and limitations.
- [Scale reproduction](docs/scale/reproduce.md) — environment and commands.
- [Honesty disclosure](app/(docs)/honesty/page.tsx) — what is real, invented, stubbed, or not built.
- [Living plan](plan.md) — milestone status and remaining evidence work.

## Important limitations

The tax engine is not legal advice and is not a complete tax implementation.
Surcharge, special capital-gains rates, late-filing interest/fees, full 80GG
eligibility, residency conditions, durable outbox delivery, Redis/PgBouncer,
and production datasource/security operations remain outside this prototype.
The UI and all identifiers, people, figures, documents, bank names, and PANs
are synthetic.

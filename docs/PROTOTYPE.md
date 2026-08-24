# Wapsi (वापसी) — Prototype & Stack

**Status of this document:** every version number, file fact and feature claim below was verified
against the working tree and the npm registry on **23 August 2026**. Where something is installed but
not wired, or planned but not built, it says so. Nothing here is aspirational.

---

## 1. The problem

Of 8.39 crore returns filed for FY 2024-25, **5.58 crore — 66.5% — carried zero tax liability**.
Two-thirds of this portal's users owe the government nothing. They are **claimants waiting on their
own money**, and the portal still makes them compose a return from scratch, decode statutory language
alone, then wait behind `Under processing` with no stated reason and no estimated date.

Wapsi is an independent concept prototype that rebuilds that journey around three ideas:

| Principle | What it changes |
|---|---|
| **Confirm, don't compose** | The department already holds the salary, TDS, interest and dividend figures. The default state of every field is filled; the citizen's job is *yes* or *this is wrong*. |
| **Provenance removes fear** | Every figure names who reported it, under which identifier, and on what date. You are checking someone else's declaration, not swearing to your own. This is what makes "just tap yes" psychologically possible. |
| **Name the hold** | `Under processing` is replaced by a state machine that names what is blocking the refund and attaches the action that releases it. |

**Positioning:** independent concept prototype. Not affiliated with, endorsed by, or connected to the
Income Tax Department or the Government of India. Stated in a persistent banner on every screen, in
all three languages.

---

## 2. Tech stack — verified

### Runtime and build

| Package | Version | License | Notes |
|---|---|---|---|
| `next` | 16.3.2 | MIT | App Router, Turbopack |
| `react` / `react-dom` | 19.2.8 | MIT | |
| `typescript` | 7.0.2 | Apache-2.0 | `strict`, `noEmit`, `moduleResolution: bundler` |
| `tailwindcss` | 4.3.3 | MIT | via `@tailwindcss/postcss` |

### Wired and in use

| Package | Version | License | How it's used |
|---|---|---|---|
| `motion` | 13.1.1 | MIT | Imported as `motion/react` — `motion.*`, `AnimatePresence`, `LayoutGroup`. Modal transitions, view changes, shared layout on the provenance reveal. |
| `lucide-react` | 1.33.0 | ISC | Per-icon imports, no sprite sheet |

`motion` is the package formerly published as Framer Motion; `framer-motion@^13.1.1` is its
dependency. The import path is `motion/react`.

### Installed, not yet wired

| Package | Version | License | Intended use |
|---|---|---|---|
| `animejs` | 4.5.0 | MIT | `animejs/svg` → `createDrawable()` for the self-drawing refund state-machine spine. **Currently unreferenced.** Wire it or remove it before submission. |
| `zod` | 4.4.3 | MIT | Strict PAN / IFSC / TAN format parsing on the sandbox inputs. **Currently unreferenced.** |

### Deliberately not used

Component library (shadcn / Radix), CSS-in-JS, GSAP, Three.js, a state-machine library, a test
framework, an analytics SDK, a database, an ORM, an auth provider. Each is either replaced by
something above or is spectacle without citizen value.

### Typography

No webfonts. The stack in `app/globals.css` is:

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans",
  "Noto Sans Devanagari", "Noto Sans Tamil", sans-serif;
```

Zero font bytes over the wire, and it names the exact families Android ships for Devanagari and
Tamil. This is a bandwidth decision, not a shortcut.

---

## 3. Architecture — as built

**One route, fully client-side, no backend.**

- `app/page.tsx` — 1,865 lines, `"use client"` on line 1. The entire prototype: landing, OTP,
  dashboard, filing, notices, refund, reviewer console.
- `app/layout.tsx` — shell and the persistent "independent concept" banner.
- No `app/api` routes. No server actions. No database. No network calls of any kind.

**State and persistence:** React state, mirrored to `localStorage` under `wapsi_active_id`,
`wapsi_active_data` and `wapsi_lang`. A `Reset local cache` control calls `localStorage.clear()`.

The reason there is no database is **reviewer isolation**: multiple judges will open the same live
link against the same three demo personas at the same time. Shared server state would mean one
reviewer watching another's refund advance. Per-browser storage is the correct answer here, not the
cheap one.

**Honest consequence of the single-route design:** nothing meaningful is server-rendered, and the full
bundle must download and hydrate before anything responds. For a product whose thesis is budget
Android on 4G, splitting the acts into real routes is the highest-value remaining improvement — see
§7.

### Data layer

| File | Lines | Contents |
|---|---|---|
| `lib/types.ts` | 250 | Domain model — `Persona`, `IncomeFact`, `Notice`, `Claim`, `RefundHold`, `BankAccount`, `Lang` |
| `lib/personas.ts` | 664 | Three seeded citizens with full AIS/TIS rows, notices, holds, timelines. `TODAY = "2026-08-22"` anchors every relative date. |
| `lib/money.ts` | 64 | `formatMoney`, `formatAmount`, `formatDate`, `formatDayMonth` — `Intl` with `en-IN`/`hi-IN`/`ta-IN` and `numberingSystem: "latn"`, so lakh/crore grouping is correct for free |
| `lib/i18n/` | 488 | `en.ts` / `hi.ts` / `ta.ts` + index. `Dict` is derived as `typeof en`, so Hindi and Tamil are **compile-time enforced complete**. Interpolated strings are functions, not templates, because Hindi and Tamil place verbs and postpositions differently. |

---

## 4. What works today

### Entry — two paths

**Reviewer sandbox.** Three one-tap persona logins, credentials printed on the page. Reviewers cannot
fail at login.

| Persona | Situation | Demonstrates |
|---|---|---|
| **Sunita Devi**, Tiruppur | Salary ₹4.2L, ₹8,400 TDS wrongly deducted, owes zero | Confirm-don't-compose filing, Tamil UI |
| **Rakesh Kumar**, Lucknow | s.143(1)(a) adjustment from a mis-tagged intraday trade, plus a s.245 set-off against a 2019 demand he never received | Notice decoding, guided dispute |
| **Priya Sharma**, Pune | Filed 71 days ago, still `Under processing` — actually a rent-receipt hold and a stale IFSC after a bank merger | The refund state machine |

**Custom sandbox.** Generates a synthetic identity on login and exposes live sliders for freelance
income and savings interest, recalculating the outcome in real time.

### Verification
Mock OTP screen. The code is printed on screen and labelled as mock.

### Filing
Provenance badge under every income row naming the reporting entity and filing date
(*"Chettinad Textiles Pvt Ltd reported this on 12 May 2026"*). Every figure carries an inline
**"No, this is wrong"** which opens an animated popover to edit the amount and state a reason.

### Refund
Vertical timeline of the state machine. Named holds with the releasing action attached — correcting a
stale IFSC resolves the hold and advances the timeline; a dummy receipt upload clears the rent claim.

### Notices
Statutory language rendered as consequence: *"If you say nothing by 10 September, ₹34,300 comes out of
your refund."* DIN banner. Agree / Disagree, with an auto-drafted reply.

### Language
Full UI in English, हिन्दी and தமிழ், switchable at any point without losing state. Choice persists
across reloads. Not a bolted-on chatbot — the entire interface is translated.

### Reviewer console
Drawer with instant persona switching, a dependency-failure trigger for resilience testing, the
income sliders, and a one-click cache reset.

### Accessibility
`prefers-reduced-motion: reduce` is respected in `app/globals.css`.

---

## 5. Synthetic data — every identifier is fake by construction

- **All demo PANs begin `DEMP`** — `DEMPS4417K`, `DEMPK8823R`, `DEMPS9052M`. The fourth character is
  where a real PAN encodes holder type, so `DEMP` is a deliberate tell that cannot occur naturally.
- **The custom-sandbox generator is constrained to the same prefix** (`DEMP` + letter + 4 digits +
  letter), so a generated identity can never collide with a real person's PAN.
- **IFSC-shaped codes are format-valid but reference no real bank branch** — `KAVC0001183`,
  `GOMT0000714`, `GODG0004417`, `DECU0834471`.
- **No Aadhaar numbers anywhere.** No real TANs, account numbers, OTPs, payment details or health
  data. Mobile numbers use a `90000 000NN` pattern.
- Nothing in this prototype contacts a government system, a live API, or any network endpoint.

---

## 6. Compliance against the brief

| Requirement | Status |
|---|---|
| Works at 375px, mobile-first | ✅ built for it |
| No real Aadhaar / PAN / OTP / payment data | ✅ all synthetic, `DEMP`-tagged |
| No government logos or implied endorsement | ✅ persistent banner, all three languages |
| Mock credentials on the page itself | ✅ printed on the persona cards |
| Live link opens with no access request | ⚠️ **not yet deployed** |
| Every mocked dependency disclosed | ⚠️ in-page honesty content exists; no `/honesty` route |
| Does not touch a live government system | ✅ zero network calls |
| Video ≤ 2:00 | ⚠️ composition authored, audio locked at 118.166 s, **not rendered** |
| Summary under 250 words | ⚠️ draft in §8 |

---

## 7. Not built — stated plainly

This section exists so the `/honesty` page can be written from it directly.

**Not implemented:**
- **Voice input.** No `SpeechRecognition` anywhere. This was planned as a first-class feature. Worth
  knowing before reinstating it: MDN is explicit that Chrome's implementation is **server-based** —
  audio is uploaded for recognition and it does not work offline — so it is a zero-key choice, not a
  low-bandwidth one. Support is **0% full / 87.55% partial** globally (caniuse, July 2026): works on
  Chrome Android and Samsung Internet, unsupported on Opera Mini and Firefox Android. If reinstated it
  must feature-detect and fall back to typing.
- **`animejs` and `zod`** — installed, unreferenced.
- **No AI.** No LLM, no OpenAI model, no Vercel AI Gateway. Notice explanations and dispute drafts are
  deterministic templates. *(The hackathon brief asks for Codex involvement or an OpenAI-powered
  prototype; as built, this submission satisfies neither. AI Gateway is the cheapest mitigation — one
  key, OpenAI models, no token markup — but it needs a server route to hold the key and a Vercel
  account.)*
- **`/architecture`** — absent. This is one of the six scoring axes.
- **`/honesty`** as a route — content exists in-page only.

**Known weaknesses:**
- Single monolithic client route; no meaningful SSR.
- `motion/react` is imported directly, which carries a 34 kB floor. `m` + `LazyMotion` would cut first
  paint to ~4.6 kB, but this matters less than splitting the routes.
- `Math.random()` at `app/page.tsx` lines 110, 111, 112, 189 and 524 makes the demo
  **non-reproducible** — a reload yields a different identity, and the video cannot be re-shot
  identically. Needs seeding.
- `"Aadhaar OTP Verified"` (`app/page.tsx:1253`) and `"Aadhaar OTP, 4 minutes after filing"`
  (`lib/personas.ts:574`) assert a UIDAI interaction that never happened. No Aadhaar numbers are
  involved, so the risk is low, but `"OTP verified"` reads the same and claims nothing.

---

## 8. Remaining work, ordered by value

1. **Deploy to Vercel**, protection off. Highest risk item — a link that doesn't open is a silent
   disqualifier, and there is currently no link. `npm i -g vercel` first.
2. **Split into real routes** — `/file`, `/notices`, `/refund`, `/architecture`, `/honesty`. Buys two
   scoring axes, makes the acts deep-linkable for judges, and is the genuine performance fix.
3. **Seed the randomness** and soften the two Aadhaar strings. ~25 minutes combined.
4. **Wire `zod`** to the PAN and IFSC inputs: `/^DEMP[A-Z][0-9]{4}[A-Z]$/` and
   `/^[A-Z]{4}0[A-Z0-9]{6}$/`.
5. **Decide `animejs`** — wire `createDrawable()` to the refund spine, or uninstall.
6. **Render the video.** `video/wapsi-plan/index.html` is authored (893 lines) against a locked
   118.166 s master. Needs Node ≥ 22 and ffmpeg on PATH; see `video/NEXT.md`.
7. **`m` + `LazyMotion`** — last, and optional. If skipped, the writeup simply says `motion/react`.

### Draft summary (232 words)

> Two-thirds of India's income tax filers owe nothing. For FY 2024-25, 5.58 crore of 8.39 crore
> returns carried zero liability. These people are not taxpayers in any meaningful sense — they are
> claimants waiting on their own money. The portal still asks them to choose among seven forms,
> compose a return from scratch, decode statutory notices alone, and then wait behind the words
> `Under processing` with no reason given and no date offered.
>
> Wapsi rebuilds that journey around one idea: **confirm, don't compose.** The department already
> holds your salary, your TDS, your interest. So every figure arrives filled in, and every figure
> names who reported it and when — your employer, under this TAN, on 12 May. You are checking someone
> else's declaration rather than swearing to your own, which is what makes a single tap safe.
>
> When something comes back, we translate it. Not "prima facie adjustment under section 143(1)(a)" but
> "if you say nothing by 10 September, ₹34,300 comes out of your refund." And while you wait, the
> refund names its own blocker and hands you the button that clears it.
>
> Whole interface in English, हिन्दी and தமிழ். Built for a budget Android phone on a slow
> connection. Three reviewer logins, all data synthetic, every mock disclosed.
>
> An independent concept prototype. Not affiliated with the Income Tax Department.

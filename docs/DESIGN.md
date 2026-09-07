# Wapsi — Design Direction 13 "Composite"

**The chosen visual language.** Written 2026-08-28 so the direction survives context loss.
Source file: `docs/design-directions/13-composite.html` (~50 KB, self-contained).
Companion docs: `docs/COPY.md` (language), `docs/ISSUES.md` (U1–U10), `docs/PLAN.md` (order of work).

> This file is the specification. If the HTML and this document ever disagree, **this document
> states the intent** — but re-read the HTML before acting, since it is the running artefact.

---

## 0. Redesign 2026-09-06 — "Sunrise/Lilac" + "Navy & Coral", Munshi ji (supersedes the D13 palette below)

Source: `docs/redesign/README.md` (the design handoff: `Wapsi App Redesign.dc.html` is the screen-by-screen
reference, `Wapsi Landing Directions.dc.html` turn 5 option **5a** is the landing). Direction 13's *rules*
below (one task one control, read-then-confirm, honest empty states, the ITR-V stays paper-white) still hold;
its *look* — graph paper, index cards, hard offset shadows, Space Grotesk + Source Serif — is replaced.

**How it was applied (so the next person can extend it):** the Tailwind token names in `app/globals.css`
were kept and remapped, so every component recoloured at once; `app/d13.css` is untouched and its variables
are remapped unlayered at the top of `globals.css`; the few surfaces the handoff redraws structurally were
edited by hand: `header-frame.tsx` (64 px bar, 150 px brand box with the avatar), `mode-switch.tsx` (glass
pill, ink active segment with a 20 px Munshi ji), `workspace.tsx` (Munshi ji on every turn, ink bubbles,
glass question card with the 1.5 px soft border, accent-bordered review card, glass composer with the
primary "Ask/Send"), `app-shell.tsx` + `inspector.tsx` (glass sidebar and controls), `landing.tsx`,
`auth-portal.tsx` + `app/signin/page.tsx` (glass card, ink story column, segmented tabs, mono PAN input,
primary button), `components/marketing/landing-page.tsx` (5a). **Hub + dashboard (second pass, same day):**
D13's verbatim classes (`.ch .split .bar .card .pin .badge .amt .margin .sheet .rail .ro .finish .file .seg
.divider .thread`) are reshaped unlayered in `globals.css` — glass 22–24 px, pill badges, Outfit 800 money,
accent-soft callouts, the Simple/Full `.seg` as a pill with an ink active segment — so the headline channels,
fact cards, working sheet, rail and finish panel follow the handoff without touching their markup;
`landing.tsx` (hero with Munshi ji 120 px, accent-soft starting-path callout, ink active-session strip with
the mint dot, glass guest strip; the ticker marquee and the 3D-tilt card wrapper are gone — the handoff has
neither), `landing-action-grid.tsx` (Card 01 glass with the 1.5 px accent border, ok/accent option tiles,
dashed accent drop tile, six glass capability cards with tinted icon squares), `personalized-dashboard.tsx`
(Munshi ji 72 px, primary CTA), `tab-bar.tsx` (glass pill, ink active, red count), `fact-row.tsx` (Munshi ji
24 px on the "what this means" note, ink/glass buttons), `statement-tab.tsx` (ink sign-off card with Munshi
ji 56 px), `overview-tab.tsx` (ink refund card with the mint figure, glass bank rows, accent timeline),
`actions-tab.tsx`, `portal-header.tsx` (glass Hub/My-return switcher with ink active), `portal-footer.tsx`
(banner ink). **Third pass (same day):** wizard `components/flow/*` (glass stepper with accent bars, question cards with Munshi ji 30 px and ink "Yes, claim it", regime cards accent-soft/ok with the primary Accept, check sheet with ok/bad figures, filing step with Munshi ji and the accent-soft final figure, Munshi ji 96 px on "Filed"), onboarding (accent-soft selected rows, accent progress, primary Continue). The CA portal, reconcile page, vault modal, hub modals, PDF dropzone and ITR-V buttons were moved onto the tokens by a palette map (`scratchpad retoken_palette.py`, recorded in the log): navy → ink surface, emerald/green → ok, teal → accent, slate/gray → ink shades and glass, tailwind amber → accent pair, rose/red → bad, blue family → tertiary, dark-mode palette overrides dropped, `bg-white` → input fill. Their layouts are unchanged; the handoff's worksheet grid for the CA review and the row grid for reconcile are not rebuilt.

**Fourth pass (2026-09-07) — CA worksheet and reconcile rows to artboards 7b / 8a; dark is the default.**
`app/ca/page.tsx`: the six fact-sheet tabs are gone; the review is a sticky client strip (initials, PAN pill,
"Client PIN verified", before → after position, Exit / Send review), step pills (Income ✓ · Deductions ✓ ·
Regime · Notes & send, derived: Notes becomes current once typed), three glass worksheets with the
`Line · Section · Client filed · CA revised · Δ` grid (Income s.17/56/111A-112A/22, Deductions 80C/80D/80CCD(1B)/
10(13A)/24(b), Taxes already paid s.192; the revised input turns ok-soft when it differs from what the client
filed, Δ is an ok pill going up and a warn pill going down, Munshi ji's Caveat note under Deductions names the
rows the CA added), a Notes-to-the-client card (stamp line, insert chips), and a sticky 340 px rail: ink
"Recommend a regime" (segmented New/Old, two tax tiles with the Saves pill on the cheaper one, taxable/tax/TDS
rows, mint balance), glass Client vs CA, glass Audit trail (derived from the diff, section in the mono column),
read-only note. `components/InteractiveTaxDashboard.tsx`: one row per AIS/26AS line on a
`minmax(0,1.6fr) 1fr 1fr auto` grid (glass pending, ok-soft confirmed, warn-soft modified; Reported / You say
columns; ink Confirm + ghost Flag, or a ✓/✎ status pill), the dispute drawer attached below the row (amount ·
CBDT code · reason · Save & recalculate in one line), and the bottom dock replaced by the sticky rail: ink
"Live · both regimes" (tiles double as the regime switch, mint net figure, the file/pay CTA with the same
payable rule), Progress bar, Munshi ji note. The header carries Munshi ji 44 px and the 30 px title. **Theme:**
every page now starts dark (`dark dark-mode` on `<html>`, state defaults, `/reconcile` reads the key as
"not light"); a saved `wapsi_theme` of `light` still wins. **Bare `<nav>`:** d13.css styles the element
(sticky bar, 2 px rule, blue links), which boxed and word-wrapped the marketing header links; `header > nav`
is reset unlayered right after the d13 import in `globals.css`.

**Fifth pass (2026-09-07) — Tax Vault and every modal to the handoff (artboards 9v-a…e, 9c–9f).** The
modals share one frame: overlay `rgba(27,17,64,.55)`, panel 26 px on `paper` with the 40/80 drop shadow, an
ink header (42 px `bg-white/10` icon tile, 17/800 title, 12.5 px `#CDBDFF` subtitle, close button on the
ink), lilac body, 46 px ghost + primary buttons, and Munshi ji's one-line honesty note where the handoff has
one. `citizen-vault-modal.tsx`: 22 px panel, gradient ink header with the soft shield tile, ok-soft SECURED
pill, mint Sovereign-Cloud pill, four underline tabs (accent active, ink-3 rest), PAN card on the
`#1B1140 → #3B2B7A` gradient with lilac labels and the soft PAN, tricolour Aadhaar card, glass contact /
bank / document / database panels, Munshi ji on the documents note and in the footer. `Challan280Modal.tsx`
(9c): two columns — challan face as glass rows with the accent-soft Amount payable tile, UPI panel with the
150 px QR, payee VPA and countdown, UPI / Net banking pills — Munshi ji's mock-boundary line, Cancel +
"Simulate payment of ₹x →". `dispute-modal.tsx` (9f): ink header, Munshi ji 34 px intro ("What's wrong
with this figure?" + reporter and amount), accent-bordered amount input, the four CBDT choices as radio rows.
The eight `components/modals/*` and the small dashboard modals (bank IFSC, notice reply, edit income, quick
edit) take the frame through their shells only; bodies keep the tokens from pass 3.

**Sixth pass (2026-09-07) — handoff 2: the rebuilt sign-in, onboarding for new users, the mobile UI, the last
of the old palette, the mascot audit.** `auth-portal.tsx` (1a–1p): two tabs Citizen · Chartered Accountant
(40 px segmented, ink active), Munshi ji's ink story on the left ("Namaste, I'm Munshi ji.", three checks with
accent/tertiary/ok dots, vault badge, AY pill; on phones a 56 px mascot strip), Citizen = PAN (mono 20 px,
54 px, accent focus ring) → primary → "New here? Create your account with your PAN" → OR → dashed document
row → QUICK DEMO PAN pills → footer; CA = code + PIN mono, stamp 2-col, "Open client return →", "No code?
Load a demo review"; sub-views Create account (1d–1f), document (1g–1k/1o: dashed 22 px dropzone, accent +
ring while dragging, ok-soft success, glass no-PAN note + manual PAN), demo citizens (1p). `otp-screen.tsx`
(1l–1n): glass 24 px card, Munshi ji 96, 48×56 mono boxes (accent focus, bad ring on error), glass prototype
note, ghost Back + ink Verify. `/ca` login (1c/m8b) on the same card. Onboarding (§2): Munshi ji 64 asks in a
bubble, h1 26/32, 5 px bars and a pinned Continue on phones; it now runs for new users on `/signin` and on the
manual page's onboarding step. Mobile (M1–M10): see docs/CONTEXT.md §12 — 56 px headers, compact pill,
drawer, inspector sheet, bottom tab bar, pinned CTAs, composer fade with a 42 px send square, bottom-sheet
modals, untilted fact cards, compact CA worksheet rows, ink live-regime strip first on reconcile. Palette
leftovers retokened: workspace (CA banner, ITR-V output card, challan block, choices), inspector, shell
sidebar, `AuditRiskRadar`, `DefectiveNoticeCard`, the manual page's wizard CTAs, `agent-panel.tsx`, the CA
comparison/share modals, the mode-select cards. Mascot: every robot/monogram placeholder is Munshi ji
(mode-select card, Agentic-mode modal ×2, CA header, CA login, onboarding, dashboard hero on phones).

**Seventh pass (2026-09-07) — onboarding v3 and the yearly intake, on the same tokens.** `components/onboarding.tsx`
keeps the §2 shell (glass 24 px card, Munshi ji 64 asking in a bubble, h1 26/32, accent progress bars, accent-soft
selected rows, pinned Continue on phones) with three screens: a consent card (glass-flat, accent shield) for the
DigiLocker link, the locked identity row with a `Lock` pill on `paper-3`, editable contact fields (46 px, mono for
numbers), the refund-account rows and the Simple/Full rows as ChoiceButtons, a collapsed "anything standing"
disclosure. On the Manual facts step, `year-papers-card.tsx` (glass card, Munshi ji 34 explaining, amber-bg consent
card, ok-soft result tile with mono figure rows) sits above the fact cards and `year-gap-form.tsx` (chips with the
accent-soft "on" state, mono figure inputs, the amber "same as last year" pill) sits under the radar. In the
workspace, `FormFields` gained the same chips for `multi`/short `choice` fields. Munshi ji's voice moved into the
model's instructions (`MUNSHI_VOICE`, `lib/agentic/model.ts`); templates remain the fallback.

| Token | Light (5a) | Dark (P5) |
|---|---|---|
| bg / paper | `#F3EEFF` | `#0B1424` |
| glass · edge | `rgba(255,255,255,.62)` · `rgba(255,255,255,.95)` | `rgba(255,255,255,.07)` · `rgba(255,255,255,.14)` |
| ink / ink-2 / ink-3 | `#2A1B4A` / `#4A3580` / `#7562A8` | `#EEF4FF` / `#B6C6E6` / `#7A8DB3` |
| ink-surface / on-ink (dark cards, bubbles, ink buttons) | `#2A1B4A` / `#F3EEFF` | `#14213A` / `#EEF4FF` |
| accent (`money`) / accent-soft (`amber-bg`, text `amber-ink`) | `#FF7A1A` / `#FFE3C9` (`#9A3C00`) | `#FF6B5B` (text on it = bg) / `#3A1C17` (`#FFB3A8`) |
| soft (eyebrows on ink, question-card border) | `#FFC08A` | `#FFB3A8` |
| ok / ok-soft / ok-ink | `#1E9E70` / `#DDF5EA` / `#0F6B48` | `#2ECF9A` / `#0F3329` / `#7FEBC6` |
| bad / bad-soft (`alarm`) | `#D9403A` / `#FBE3E1` | `#FF7A7A` / `#3A1B1B` |
| warn / warn-soft | `#B87A00` / `#FFF1D6` | `#E6B03A` / `#382A0C` |
| tertiary (earned/stayed bar) | `#8B6CF0` | `#4F8DFF` |
| line | `rgba(74,53,128,.16)` | `rgba(255,255,255,.12)` |
| banner | `#1B1140` / `#CDBDFF` | `#060C18` / `#B6C6E6` |
| shadows | glass `0 24px 50px -28px rgba(42,27,74,.35)`; glow `0 12px 30px -8px rgba(255,122,26,.55)` | glass on black; glow coral |

Type: Outfit 400–800 everywhere (h1 84/60/50/40 at 800, −.03 to −.04em), JetBrains Mono for PAN, DIN,
hashes and 11–12 px eyebrows, Caveat for Munshi ji's handwritten notes. Shape: cards 24 px, tiles 20–22,
controls 14, chips 999. Buttons 46 px (50 full-width primary, 38 compact). Munshi ji: 38 px in the brand
box, 34 on every assistant turn and card, 20 in the mode switch, 96 on empty states, 150 peeking behind
the composers; loop nod 5 s / blink 4.5 s / wave 2.6 s, off under reduced motion. Voice stays as
`docs/VOICE.md` — the mascot is the face; the sentences are still the model's, checked.

## 1. What this is and where it came from

Direction 13 is not a fourteenth idea. It is the synthesis of the three directions the user
selected elements from, after reviewing twelve:

| From | What was taken | Why it was kept |
|------|----------------|-----------------|
| **12 · Case File** | Graph-paper ground, pinned index cards, provenance badges, pencil margin notes, hand-drawn dividers, the read-then-confirm flow | "Every part looks great." The confirmation flow makes reading easy *and* unavoidable. |
| **6 · Flow** | Three headline figures in separate boxes, the proportion bar beneath them, drifting particles | Puts the most necessary information first, so nobody scrolls to learn what they paid. |
| **5 · Instrument** | Expandable computation trace, owed-vs-paid meter, refund sparkline, source links on every figure | The power-user view: a CA can see the arithmetic and open the document behind any number. |

**The one structural change the user asked for:** Case File stacked its cards in a single
column, forcing too much scrolling. Cards now run **two to a row**, and the margin notes
**collapse**. Board height fell ~1,400 px → ~1,020 px, and each card is 79 px shorter closed.

---

## 2. Design tokens

Three-state theming, exactly as every other direction: light on bare `:root`, dark repeated in
**both** `@media (prefers-color-scheme:dark){:root:not([data-theme="light"])}` **and**
`:root[data-theme="dark"]`, so an explicit choice wins in either direction.

### 2.1 Light (the default; "graph paper on a desk")

```
--paper #F2EFE4   --grid  #D9D2B9   --card  #FBF9F1   --card-2 #F4F1E6
--ink   #1C2233   --ink-2 #4A4E5C   --ink-3 #7C8090
--edge  #1C2233   --hair  #D9D2B9
--pin-a #F5867A   --pin-b #C6331D
--shadow 4px 6px 0 rgba(28,34,51,.13)   --shadow-hi 6px 9px 0 rgba(28,34,51,.16)
--motes-blend multiply
```

### 2.2 Dark

```
--paper #12141A   --grid  #232833   --card  #1A1E27   --card-2 #171B23
--ink   #E9ECF2   --ink-2 #B0B6C4   --ink-3 #7C8494
--edge  #333B4B   --hair  #282E3A
--blue  #7FA9D8 / bg #1B2A3C     --amber #DFA855 / bg #2E2413
--brick #E08471 / bg #331F1B     --green #77BC90 / bg #16281D
--in    #7FA9D8   --out   #E08471  --keep  #149B67 → #77BC90
--shadow 4px 6px 0 rgba(0,0,0,.45)   --motes-blend screen
```

### 2.3 ⚠ The colour split — the most important rule in this file

The first light palette was muted and the user asked for brighter. Measuring the candidates
against the actual cream backgrounds showed why it is not a free change:

| Candidate | blue | red | green | Verdict |
|-----------|------|-----|-------|---------|
| Brightest | 3.44 | 3.41 | **2.54** | Unreadable. Rejected. |
| Bright | 4.53 | 4.19 | **3.37** | Fails 4.5:1 for small text. |
| Measured/muted | 6.13 | 5.41 | 5.82 | Legible but drab. |

**Resolution: split the tokens by job.** One set can be bright because nothing small is set in
it; the other must stay legible.

**Fill shades** — bars, meters, pins, chevrons, motes, confetti, and numerals ≥24 px bold.
Gate is 3:1 (large text / non-text).

```
--in   #1A6FE0   /* earned · what stays yours */   4.53:1 on card
--out  #DE4025   /* went to tax */                 4.09:1
--keep #149B67   /* comes back */                  3.37:1
```

**Text shades** — badges, stat numbers, legends, links, small copy. Gate is 4.5:1 on **both**
the card *and* the badge's own tint. The tints were lightened to let the colours stay bright.

| Token | Colour | Tint | on card | on tint |
|-------|--------|------|---------|---------|
| `--blue` | `#1361C7` | `#DEEAFB` | 5.59 | 4.85 |
| `--brick` | `#C6331D` | `#FCE6E1` | 5.12 | 4.51 |
| `--green` | `#107A50` | `#E0F2E8` | 5.08 | 4.60 |
| `--amber` | `#8C5D08` | `#FAEBCE` | 5.41 | 4.84 |

**Scrollbars are themed, never browser-default grey** (user rule, 2026-08-28): standard
`scrollbar-color` + `::-webkit-scrollbar` fallback. The app uses its theme tokens (thumb
`--subtle-color`, track `--bg-color`); the prototypes get translucent `rgba(128,128,128,…)`
via theme.js because thirteen palettes share no token. Any new page follows suit.

**Never set small text in `--in` / `--out` / `--keep`, and never use `--blue` / `--brick` /
`--green` for a large fill.** Any future palette change must re-run this measurement.

---

## 3. The three headline figures — the top of the page

Placed above everything else, per the user: *"keep the most important things separated at the
absolute top."* Three boxes, then one proportion bar.

| Box | Figure | Share | Token |
|-----|--------|-------|-------|
| You earned | ₹12,43,480 | 100% | `--in` |
| Went to tax | ₹91,520 | 7.4% | `--out` |
| You overpaid | ₹6,400 | 0.5% | `--keep` |

**The proportion bar** splits the year three ways, and the parts sum exactly:

```
never left you  ₹11,45,560   92.13%   --in
tax you owed    ₹   91,520    7.36%   --out
coming back     ₹    6,400    0.51%   --keep
                ─────────────────────
                ₹12,43,480  100.00%   ✓
```

Two honesty rules embedded here, both worth preserving:

1. **The bar fills are the real percentages**, not flattering ones. Direction 6 used `.74` and
   `.05` because they looked good; those were invented. The tiny tax sliver is the true story —
   and it reinforces the message that most of the money was always yours.
2. **The 0.5% refund slice is drawn wider than 0.5%** (`min-width:7px`) or it would be invisible
   — and *the page says so*: "The refund slice is drawn a little wider than 0.5% so you can still
   see it." A chart that silently distorts scale is the thing this product exists to oppose.

---

## 4. Layout

### Layer stack (bottom to top)

```
-2  .paper    graph-paper gradients + --paper       (fixed)
-1  #sketch   p5 ambient motes, mix-blend-mode      (fixed, pointer-events:none)
-1  .veil     radial fade so motes recede           (fixed)
     content
50  nav       sticky
60  .tag      direction label
70  #pop      confetti canvas — MUST be above the panels
```

The graph paper sits on its own fixed layer so the motes can blend into it (`multiply` in light,
`screen` in dark) without a background painted over them.

### Grid and breakpoints

| Region | Rule |
|--------|------|
| Channels (3 boxes) | 3 columns; 1 column ≤760 px |
| Board (cards) | 2 columns ≥880 px; 1 column below. `align-items:start` — ragged bottoms suit a pinboard |
| Working | `1fr 330px` ≥980 px; stacked below. Trace spans full width (`grid-column:1/-1; order:3`) |
| Page | `max-width:1080px` |

### Typography

| Face | Role |
|------|------|
| **Space Grotesk** 500/600/700 | Headings, badges, buttons, nav |
| **Source Serif 4** 400/600 | Body and explanatory copy — the serif is what makes it read as a document |
| **JetBrains Mono** 400/500/700 | Every number, every label-caps run. `font-variant-numeric: tabular-nums` **always** |
| **Caveat** 600/700 | Margin-note labels only — the pencil voice |

---

## 5. The cards

Five index cards, each one fact. Structure, in order:

```
.pin            push-pin; turns green when confirmed
.no             CARD 01 · REPORTED 14 JUN 2026        (mono)
h3              Salary received
.who            who reported it · document · [Full detail: TAN / section / form no.]
.badges         provenance: reported-by / we-applied / you-entered / looks-wrong
.amt            ₹12,40,000                            (mono, tabular)
details.margin  collapsible pencil note — the plain-words explanation
.links (pro)    open the document ↗ · this looks wrong ↗
.confirmline    the current instruction to the user
```

**Badges carry provenance, which is the product's core idea made visible:**
`Reported by employer` · `Reported by bank` · `We applied this for you` · `You entered this` ·
`Matches your bank's statement` · `This looks wrong` · `Proof missing`.

---

## 6. The two modes

`data-view="simple" | "full"` on `<html>`, set before paint to avoid a flash, persisted to
`localStorage` under `wapsi-design-view`. CSS does the switching:

```css
:root[data-view="simple"] .pro  { display:none !important }
:root[data-view="full"]   .lite { display:none !important }
```

| | **Simple** | **Full detail** |
|---|---|---|
| Cards | Tap-to-confirm gate | Reading matter; `cursor:default`, no confirm line |
| Explanation | Plain-words margin note | **Hidden entirely** — see below |
| Arithmetic | 4 lines + a callout | Full computation trace, every row opens |
| Rail | Refund + "one figure is in question" | Refund, owed-vs-paid meter, regime comparison |
| Gate | Pin all five cards | **One** sign-off declaration |
| Button when gated | "Pin 3 more cards" | "Sign off first" |

### The margin notes are Simple-only

`:root[data-view="full"] .margin{display:none}` — the pencil notes do not render in Full detail
at all. (User directive, 2026-08-28.)

The note exists to explain a figure in plain words to someone who cannot read a computation
trace. A CA reading the trace already has that information in professional form: the source
links, the section references, and the line-by-line arithmetic. Showing both means saying the
same thing twice and charging the reader vertical space for it — measured at **−55 px per card
(315 → 260 px) and −276 px across the five-card board**, isolating the rule so the figure is not
confused with the `.pro` source links that Full detail adds.

This is the same reasoning that removed the tap-to-confirm gate in Full detail, and it is the
mode separation working as intended: not a density slider, but two coherent products. Anything
whose only job is to explain tax vocabulary belongs in Simple and should be absent from Full
detail — not merely smaller.

### The gating rule — the thing most likely to be broken by a later edit

Simple mode makes you open a card's explanation **before** you can confirm it: the first tap
opens the note, the second pins it. Gating is on **has been read** (`card.dataset.read`), not
on *is currently open* — collapsing a note you already read must not re-lock the card.

**Full detail has no gate**, by explicit user directive:

> "A CA would not just click confirm without actually checking; the feature is only targeting
> the people who don't actually see what they are confirming to."

Instead it takes one declaration: *"I have read the computation trace and checked it against the
source documents. The figures above are correct and complete."* A declaration is **signed, not
crossed off** — `#solo.done .txt` keeps full ink and no strike-through.

---

## 7. Interaction details worth preserving

- **Count-ups** on every figure, ease-out cubic, ~1.5 s, triggered by `IntersectionObserver`.
  Visible work reads as trustworthy work. All respect `prefers-reduced-motion`.
- **The checklist is a second door to the same state** — ticking a row pins its card and back.
- **Checklist terms are links** (`.jump`) to the card they name: scrolls, opens that card's note,
  marks it read, and flashes a ring around it. Must `stopPropagation` or it ticks its own row.
- **Filing** takes ~1.9 s with a progress bar, then confetti. Weight proportional to stakes.
- **Source links `stopPropagation`** so opening a document never pins a card.
- **Cards are `tabindex="0"`** with Enter/Space handling.

---

## 8. Code patterns worth reusing

**Theme-aware canvas.** Read CSS custom properties into RGB, and re-read on theme change —
otherwise the canvas keeps the old palette when the user toggles.

```js
function rgbOf(name){
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const d = document.createElement('span'); d.style.color = v; document.body.appendChild(d);
  const m = getComputedStyle(d).color.match(/\d+/g); d.remove();
  return m ? m.slice(0,3).map(Number) : [128,128,128];
}
new MutationObserver(readTheme).observe(document.documentElement,
  {attributes:true, attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readTheme);
```

**Idle canvas costs nothing.** The confetti sketch runs `noLoop()` until a burst, and stops
again when the last particle dies: `if (!conf.length) s.noLoop();`

**Chevron without a glyph.** Two borders and a rotation — no font coverage, nothing to escape.
This replaced a CSS escape that had been mangled into `C2 83 41` and drew a tofu box:

```css
.margin summary::after{content:"";width:7px;height:7px;
  border-right:2px solid var(--ink-2);border-bottom:2px solid var(--ink-2);
  transform:translateY(-2px) rotate(45deg);transition:transform .22s}
.margin[open] summary::after{transform:translateY(2px) rotate(-135deg)}
```

**In-page links must move focus.** Calling `.click()` (or a real click on an off-screen anchor)
focuses it, and the browser scrolls a focused element into view — which fought the scroll and
overshot by ~1,259 px. Move focus to the destination, and open any disclosure *before* aiming:

```js
if (note && !isFull()){ note.open = true; card.dataset.read = '1'; line(card); }
card.focus({preventScroll:true});
card.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'center'});
```

---

## 9. Known open defects — **deferred by the user, do not lose these**

Recorded 2026-08-28. Scheduled as `T7.1`/`T7.2` in `docs/PLAN.md`.

**9.1 · Nav anchors do not scroll — RESOLVED as a preview-pane artifact (2026-08-28).** The
console error was literally "Not allowed to navigate top frame to data URL … #facts": the
in-app preview renders `file://` pages as `data:` snapshots, where fragment navigation is
blocked. Nothing to fix in the page; confirm once in a real browser. ~~ `COVER / THE FACTS / WORKING / BEFORE FILING` are
`href="#id"` links that do nothing in the preview. Likely the same focus/scroll interaction
diagnosed in §8, or the preview's `data:` URL blocking fragment navigation — a console error
`Not allowed to navigate top frame to data URL … #facts` was observed. **Must be re-tested from
a real `file://` or `http://` origin before concluding it is a page bug.**

**9.2 · No light/dark toggle — RESOLVED, same artifact (2026-08-28).** The `data:` snapshot
cannot load the relative `<script src="theme.js">`, so nothing injected the toggle. Proven by
inlining theme.js into a staged copy: the toggle appears and works. In any real browser the
external script loads normally. ~~ `theme.js` injects a bottom-right toggle on
`DOMContentLoaded`, and the page does load it — but it was not visible in the user's session.
Check that `theme.js` resolves next to the HTML wherever it is being opened from; the toggle is
appended to `document.body` and could also be sitting under the `.tag` or the `#pop` layer
(z-index 70) — `theme.js` sets `z-index:9999`, so overlap is unlikely but ordering should be
confirmed.

**9.3 · Negative space in Full detail at wide viewports.** The working section is
`1fr 330px`; the left "What you were paid" panel is short while the right rail is tall, leaving
a large empty block below the left panel before the full-width trace. Options: let the trace
occupy the left column instead of spanning, move the stat row into the rail, or make the left
column sticky. Needs a design decision, not just a CSS tweak.

**9.4 · Confetti reported as blue-only — analysis, unresolved.**
The user reported seeing only blue. **The palette in the file is correct** — verified
2026-08-28:

```js
const CONFETTI = [[26,111,224],[78,155,255],   // blue  · azure
                  [222,64,37], [255,107,74],   // red   · coral
                  [20,155,103],[53,211,146],   // green · mint
                  [232,163,23]];               // gold
```

Colour is chosen uniformly at random per particle, and a screenshot taken after the change
clearly showed red, green, gold and coral. Two candidate explanations, in order of likelihood:

1. **A stale page load.** The user was viewing `C:/Claude/_preview/13-composite.html` — a
   staging copy that has since been deleted. A browser tab opened before the palette change
   would still be running the old four-entry cycle, which was `[keep, in, out, keep]` and did
   skew blue/green.
2. **They were describing the ambient motes, not the burst.** This one is *real and by design*:
   the background motes are split `r < .74 ? 'in' : (r < .93 ? 'out' : 'keep')` — **74% blue**,
   19% red, 7% green, mirroring how little of the money actually leaves. So the drifting
   background genuinely is overwhelmingly blue.

**RESOLVED 2026-08-28 — it was (2), and my reading of the request was wrong.** The user meant
**both** layers: the click-burst *and* the drifting background. The burst palette is already
correct and needs no change. The background is the real work, and the cause is explanation (2)
above: the motes are ~74% blue because the lane split encodes how little money actually leaves.

**Action (PLAN.md T7.2):** rebalance the ambient motes toward a visibly multi-coloured field.
The tension to resolve — the lane split is *meaningful*, not decorative, so an even 33/33/33
would misstate the proportions. Two ways to get colour without lying:

- keep the lane proportions but **tint within each lane** (the burst's azure / coral / mint
  partners), so each lane reads as a colour family rather than one flat hue; or
- keep the lanes and raise the minority-lane opacity/size so red and green *read* more strongly
  than their count suggests, without changing the counts.

Prefer the first. Whichever is chosen, the three hues must still map to earned / tax / returned,
because that mapping is what makes the background worth having at all.

---

## 9A. One task, one control — a hard rule

*User directive, 2026-08-28.*

**No page may offer the same task twice.** If a control does a job, no second control anywhere
else on that page may do the same job.

The case that produced the rule: a new visitor lands in onboarding, whose first screen is a
language chooser — while the top bar also carries a language switcher. Same task, same page,
two controls, in two different corners.

**How it was resolved, and the principle to reuse:** *the page that owns the task keeps the
control; every other surface yields.* Onboarding keeps its language step, because a reader who
cannot read English needs that choice to be prominent on first contact, not tucked into a corner.
So `PortalHeader` takes `showLanguage` and hides its menu during onboarding. Everywhere else the
header menu is the single control.

Note what was *not* done: deleting onboarding's language step. Removing the front-and-centre
choice would have satisfied the rule while making the product worse for the exact users the
multilingual support exists for. **The rule forbids duplication, not prominence** — resolve it by
deciding which surface owns the task, not by deleting the better-placed control.

Check this before locking any page (it belongs with the §4B self-checks in `PLAN.md`):
list every control, name its job, and confirm no job appears twice.

---

## 10. Verified behaviour (observed, not assumed)

Checked in-browser on 2026-08-28:

- View switch correct across six transitions, including sign-off state surviving a mode round-trip.
- Pin gate correct: "Pin 5 more cards" → "File this return", correct singular/plural at 1 card.
- Two-tap flow: tap 1 opens the note only; tap 2 pins; collapsing a read note does not re-lock.
- Jump links: land the card fully in view, focused, note open, **without** ticking their own row.
- Trace rows expand to `display:table-row`.
- Both themes resolve correctly (`--paper` → `#F2EFE4` light / `#12141A` dark).
- Layout at 1280 px: channels 3-up, board 2×506 px, working 682+330.
- All 13 tag types balanced; zero control characters; no console errors from the page itself.

---

## 11. Copy

Governed by `docs/COPY.md`. The rules that shaped this direction:

- **Never leave an acronym bare.** Plain words lead, the official term trails in parentheses for
  the people who will meet it on the government site: *"the quarterly tax return your employer
  files · TDS, Form 26AS"* — and the official half appears **only in Full detail**.
- **Money is the user's.** "Refund due to you", not "net position".
- **A control says what will happen.** "Sign off first", "Pin 3 more cards", "File this return".
- **Disputing must feel cheap.** "This looks wrong", never "I dispute this".
- **Tell them what to expect.** Every filing confirmation ends "refund in 2–5 weeks", never on a
  bare reference number. ⚠ **That window is placeholder copy, not a sourced service level** —
  see `PLAN.md` §5.1. It must be replaced with real data or softened before any real user sees it.
- **Register varies by direction; vocabulary does not.**

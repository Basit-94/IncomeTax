# Wapsi — Design Direction 13 "Composite"

**The chosen visual language.** Written 2026-08-28 so the direction survives context loss.
Source file: `docs/design-directions/13-composite.html` (~50 KB, self-contained).
Companion docs: `docs/COPY.md` (language), `docs/ISSUES.md` (U1–U10), `docs/PLAN.md` (order of work).

> This file is the specification. If the HTML and this document ever disagree, **this document
> states the intent** — but re-read the HTML before acting, since it is the running artefact.

---

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

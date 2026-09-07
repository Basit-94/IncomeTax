# Munshi ji — mascot and motion contract

The identity master supplied by the user is `Munsi ji/Munshi ji.png`. Its purple backdrop and message
bubble are presentation elements and are not part of the mascot. The production character is rebuilt
as editable SVG paths in `components/brand/munshi-art.tsx`; the React wrapper in
`components/brand/munshi.tsx` is the only component application code should import.

## Identity locks

- One warm, broad, egg-shaped head/body with no neck or legs.
- Comb-back brown hair, central widow peak, grey temples, large round purple wire spectacles.
- Friendly inward-attentive brown eyes, upward brows, round nose, rosy cheeks and a full tidy moustache.
- Cream short-sleeve kurta, orange pocket pen and slim brown ledger.
- Softly shaded vector treatment. No purple background, message bubble, tie, suit, calculator,
  religious marker, exaggerated teeth or glossy emoji lighting.

## Rig and states

The SVG exposes named groups for body, eyes/pupils, eyebrows, spectacles, moustache, mouth, arm,
ledger, document and glasses-adjusting hand. `MunshiState` currently provides:

| State | Use |
|---|---|
| `idle` | Quiet brand/logo placements |
| `welcome` | Landing and empty states; two waves then rest |
| `listening` | User question/input |
| `explaining` | Assistant reply or expanded fact explanation |
| `working` | Agent execution: retrieve document, read across it, adjust spectacles, return it |
| `reading` | Review and confirmation cards |
| `uploading` | Document upload and extraction |
| `happy` | User selected the higher engine-computed signed net outcome |
| `concerned` | User selected the lower outcome; gentle, never shaming |
| `success` | Filing/result state already reports success |
| `error` | Existing error state; adjacent UI owns explanation and recovery |
| `waiting` | Refund or CA-review queue without implying a deadline |
| `secure` | Consent/OTP moment; decorative and never a security claim |

Regime emotion compares signed engine outcomes: more refund is higher, and less tax due is also higher.
It never parses formatted copy, guesses with incomplete data or reacts on a tie. The expression changes
only after the user selects. It does not change the recommendation or block either choice.

## Motion and accessibility

`components/brand/munshi.css` owns CSS-only, transform-and-opacity animation. The working loop is six
seconds: retrieve, read, adjust, return. Motion never gates state, copy, figures or controls. Operating
system reduced-motion preference stops all loops and settles Munshi ji into a readable pose with the
wave down. Print and explicit static exports also stop animation.

## Export kit

Run `node scripts/export-munshi.cjs` after changing the rig or motion. It writes the standalone kit to
`public/brand/munshi/`: animated and static SVGs, avatar PNGs from 20–512 px, primary/full/silhouette
marks, vector and PNG character sheets, and `index.html`, an interactive animation studio. The zip is
packaged separately as `munshi-kit.zip`. The illustrated six-pose reference remains a raster art guide;
the live character and animation exports use the shared editable vector source.

## Placements (audit 2026-09-07)

Every production surface renders the shared component; no placeholder art, `_kit.js` copy or generic robot
icon remains where the assistant's identity is meant. States follow the product state through
`lib/munshi-state.ts` (`agentReaction` for the workspace status strip, `regimeReaction` for the regime step).

| Surface | Component · size | State |
|---|---|---|
| Brand box (every header), marketing header, CA portal header | `MunshiAvatar` 38 / 40 / 38 | `idle` |
| Mode switch active segment | `MunshiAvatar` 20 | `idle` |
| Marketing landing composer, Agentic home composer (150 desktop / 112 phones) | `Munshi` | `welcome` (`working` while busy) |
| Sign-in ink story (56 phones, 72 desktop), demo-citizen list | `Munshi` | `welcome` |
| OTP card | `Munshi` 96 | `secure` / `working` / `error` |
| Onboarding question bubble (64 desktop, 52 phones) | `Munshi` | `listening`, `happy` on the ready screen |
| Mode-select "Agentic" card, Agentic-mode modal header and sample turn | `MunshiAvatar` 52 / 36 / 28 | `explaining` |
| Workspace status strip, every assistant turn, question and review cards | `MunshiAvatar` 34 | `agentReaction(...)`, `listening` / `uploading` / `secure`, `reading` |
| Workspace running indicator, legacy agent panel thinking | `Munshi` 72 / 64 | `working` |
| CA-review-complete banner | `MunshiAvatar` 28 | `happy` |
| Hub hero (120 / 72 phones), dashboard hero (72 / 40 phones), empty workspace | `Munshi` | `welcome`, `waiting` once filed |
| Fact-card "what this means" | `MunshiAvatar` 24 | `idle` → `explaining` → `happy` |
| Refund timeline | `MunshiAvatar` 34 | `waiting` / `concerned` (holds) / `success` |
| Deductions question cards, wizard file step, filed screen | `MunshiAvatar` 30 / 36, `Munshi` 96 | `idle`, `reading` / `working` / `error`, `success` |
| CA login card, CA worksheet note, CA sign-off | `Munshi` 56, `MunshiAvatar` 24, `Munshi` 56 | `secure` / `working` / `concerned`, `idle` |
| Reconcile header and Munshi note, Challan 280, dispute sheet, notice reply, vault header/docs/footer | `MunshiAvatar` 44 / 36 / 26 / 34 / 26 / 38 / 24 / 22 | `idle`, vault header `secure` / `working` |

Intentional generic icons that stay: the `MessageCircle` share icon in the CA share modal (WhatsApp), the
`UserCheck` tab icons in the file-return and match-records modals (they label the citizen's own PAN, not
the assistant), and lucide status glyphs inside pills.

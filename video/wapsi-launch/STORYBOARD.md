---
format: 1920x1080
duration: 7.9s
message: "Filing your taxes in India should not be intimidating - Wapsi makes it something an ordinary citizen can actually understand"
arc: Problem (the wall of words) -> Answer (the name that means coming back)
audience: everyday Indian taxpayers - salaried people who dread filing and assume the process is not built for them
mode: autonomous
music: none
---

## Frame 1 — The wall of words

- status: animated
- src: compositions/frames/01-wall-of-words.html
- duration: 4.2s
- transition_in: cut
- scene: A single plain sentence about filing is slowly buried under a swarm of real tax jargon until it cannot be read.
- voiceover: "Income tax filing in India has always been intimidating and that confuses everyday citizens."
- poster: 3.4
- blueprint: overwhelm-surround (density-accumulation idea only; the full 6-9s shape does not fit 4.2s)
- asset_candidates: []

The problem beat, argued with the vocabulary itself. The screen does not show a
confused person or a stack of paper; it shows **the words the system actually
uses**, accumulating until a plain sentence is unreadable underneath them. The
jargon is real and verifiable - ITR-1, 26AS, 80C, 87A, 115BAC, u/s 139(1) - which
is what makes the beat land rather than caricature.

Ends fully crowded. Nothing resolves inside this frame.

### Shot sequence

- **Scene 1 - 0.00-0.90** - "Income tax filing in India". Ground: paper canvas with
  the preset's permanent hairline graph grid, static. One plain sentence sits centred
  at ~46% height in the body face, ink, ~52px: *"Filing your taxes in India."*
  It fades up over 0.35s and holds. Camera static for the whole frame - this beat is
  built by accumulation, never by a push.
  Layout: single centred text block, generous margins, nothing else on screen.
  Motion: opacity 0->1 plus y +12px->0, ease-out. Rule: `spring-pop-entrance` (smooth-settle register).
- **Scene 2 - 0.90-1.78** - "has always been". First jargon chips arrive, sparse and
  polite: 5-6 mono chips (JetBrains Mono 400, 38-52px, uppercase, 0.08em tracking,
  1.5px hairline border, 0 radius, card fill #FBF9F1) drop in around the sentence - ITR-1, FORM 16,
  26AS, 80C, TDS. Staggered ~90ms apart, entering from off-frame edges toward
  their resting positions. They do not yet occlude the sentence.
  Motion: staggered entry, each settling onto its resting scale. Rule: `waterfall-entry`.
- **Scene 3 - 1.78-2.68** - **"intimidating"** (word lands at 1.78). The beat turns.
  Density roughly triples on the stress: ~18 more chips arrive fast from all compass
  points, several rotated -6deg..+7deg, a few in brick ink to break the calm -
  87A, 115BAC, u/s 139(1), SCHEDULE CG, 234B, AIS, TAN, CHALLAN 280,
  SAHAJ, 44AD, ITR-V, TIS, 80GG, 80D, DIN, 26QB, 194-IA, SCHEDULE S.
  The sentence beneath begins to be overlapped. One hard accent on the stress syllable.
  Motion: radial staggered close-in from all sides plus a single scale accent on the beat.
  Rules: `kinetic-beat-slam` (the 1.78 accent), `depth-scatter-assemble` (the radial arrival).
- **Scene 4 - 2.68-4.20** - "and that confuses everyday citizens". Maximum density.
  Remaining chips fill every gap until the original sentence is only fractionally
  visible through the gaps; the whole field carries a low-amplitude drift so it reads
  as live pressure rather than a frozen collage. From 3.66 the field **holds**
  crowded - no new arrivals, just the drift - so the cut at 4.20 lands on a held state.
  Motion: final fill, then low-amplitude float on the whole field. Rule: `sine-wave-loop`
  (low-amplitude register, composed onto each chip's resting transform).
- **handoff_out** - chip-field: full-frame swarm, ~30 chips, opacity 1, scale 1,
  centre of mass at frame centre, drifting at low amplitude (+/-3px, ~0.2Hz). The buried
  sentence sits at 46% height, opacity 1 but ~70% occluded. Camera at rest, scale 1.

## Frame 2 — Wapsi

- status: animated
- src: compositions/frames/02-wapsi.html
- duration: 3.7s
- transition_in: cut
- scene: The jargon is swept to the edges and gone; the name lands in the clear space it left behind.
- voiceover: "So this is Wapsi, a citizen-first tax intelligence platform built for the people of India."
- poster: 2.6
- blueprint: titlecard-reveal (Social_Proof variant - busy field swept away to reveal a clean lockup)
- asset_candidates: []

The answer beat. The clearing **is** the argument: the same screen, the same grid,
with the noise removed. The name lands on its own word at 4.56 and then simply
holds - low motion is the payload here, deliberately, against Frame 1's churn.

"Wapsi" is Hindi for *return / coming back*, which is the product's whole thesis,
so the Devanagari sits with the Latin rather than being decoration.

### Shot sequence

- **handoff_in** - chip-field: arrives exactly as Frame 1 left it - ~30 chips,
  opacity 1, scale 1, centred, drifting +/-3px at ~0.2Hz; buried sentence at 46% height,
  opacity 1, ~70% occluded. Camera at rest, scale 1. Consumed immediately by Scene 1.
- **Scene 1 - 4.20-4.56** - "So this is". The sweep. Every chip accelerates outward
  from frame centre toward the nearest edge and fades as it goes; the buried sentence
  fades with them. 0.36s, ease-in (they leave faster than they arrived - relief, not
  another event). By 4.56 the frame is clean paper plus grid.
  Motion: outward radial exit plus fade. Rule: `center-outward-expansion` (outward vector).
  The chips leave on transform plus opacity only - no streak, no blur.
- **Scene 2 - 4.56-5.10** - **"Wapsi"** (word lands at 4.56). The wordmark arrives in
  the space the noise vacated: Wapsi in the display face, ink, ~150px, centred at
  ~44% height; वापसी directly beneath in the body/serif face, ~54px, in accent
  cobalt. Enters 0->1 opacity with a 96%->100% settle - one restrained move, no bounce.
  A hairline accent rule (2px, cobalt) draws left-to-right beneath the lockup over
  0.30s, then stops.
  Motion: single settle plus a drawn rule. Rule: `press-release-spring` (the settle).
  The hairline draws with a plain scaleX 0->1 from its left edge, ease-out, no gradient.
- **Scene 3 - 5.10-6.50** - "a citizen-first tax intelligence platform". One mono line
  fades up beneath the rule, ~22px uppercase, letter-spaced ~0.16em, ink-2:
  *"A CITIZEN-FIRST TAX INTELLIGENCE PLATFORM"*. Word-group build in three chunks
  paced to the VO (citizen-first ~5.10, tax intelligence ~5.48, platform ~6.06)
  so the line finishes with the phrase rather than ahead of it.
  Motion: chunked opacity build, no movement. Rule: `discrete-text-sequence`.
- **Scene 4 - 6.50-7.90** - "built for the people of India". Final line fades up
  beneath in the body face, ~26px, ink-2: *"Built for the people of India."*
  At 6.90 a small mono disclaimer settles at the lower edge, ~13px, ink-3:
  *"INDEPENDENT PROTOTYPE"* - small, permanent, unmissable-if-looked-for. Everything
  holds still from 7.20 to 7.90; the last 0.7s are deliberately motionless.
  Motion: two fades, then a full stop. Rule: `spring-pop-entrance` (smooth-settle register).

## Video direction

**Ground.** One continuous surface for the whole 7.9s: the preset's paper canvas
with its permanent hairline graph grid. The grid never changes, never moves, and is
never cut away - it is what makes Frame 1 and Frame 2 read as the *same room* with
the noise removed, which is the entire argument of the piece. No vignette, no
gradient wash, no dark mode.

**Colour discipline.** Ink for content, cobalt accent reserved for exactly two
things - the Devanagari वापसी and the hairline rule under the lockup - so the
accent reads as arrival rather than decoration. Brick appears only inside Frame 1's
swarm, on at most a fifth of the chips. No green anywhere: in this product's system
green means money-kept/confirmed and would make a claim the video has not earned.

**Type.** Display face for the wordmark only. Body face for the two plain sentences.
Mono, uppercase and letter-spaced, for every jargon chip and every chrome line - the
mono *is* the bureaucratic voice, which is why the payoff lines step out of it.

**Motion doctrine.** Frame 1 accumulates and never pushes the camera; Frame 2 removes
and never adds. The camera is static for all 7.9s - every sensation of pressure or
relief comes from elements arriving or leaving, never from a zoom. Frame 1's exits are
faster than its entrances. The piece ends on 0.7s of complete stillness.

**Chip scale (as built).** The chips are 38-52px, NOT the ~15px this storyboard
originally specified - 15px sits below frame.md's legibility floor at 1920x1080.
Frame 01 is authoritative: 30 chips, centre of mass (977, 513), bounds x 117-1790 /
y 116-894, drift +/-3px at ~0.21Hz, buried sentence 76.5% occluded at the cut. The
per-chip resting positions are the inline left/top on each .wow-slot in
compositions/frames/01-wall-of-words.html.

**Fonts.** No fonts were staged in the project, so each frame embeds its own
base64 @font-face subsets under frame-scoped family names - self-contained, no
network at render. Frame 02 additionally needs a Devanagari-capable face for वापसी.

**Timing.** Every reveal is pinned to a measured word start from audio/vo-words.json
(small.en, word-level). The two beats cut at 4.20s, inside the 0.28s breath between
"citizens." (ends 3.92) and "So" (starts 4.20) - the cut lands in silence, not over a word.

**Audio.** One authored audio track carries audio/vo.wav across the whole piece,
starting at 0.00 on Frame 1's timeline. No BGM and no SFX: the project is marked
music: none with no SCRIPT.md, so the audio step generates nothing and the recorded
voiceover is the only sound.

**Honesty.** No government emblem, seal, tricolour-as-officialdom, or wording implying
official status. No mocked-up product UI - this is no-capture mode and the video must
not imply a shipped interface. The "INDEPENDENT PROTOTYPE" line is not optional.

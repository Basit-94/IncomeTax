# Wapsi's voice — a sharp, kind CA texting a friend

**Added 2026-09-05; rewritten 2026-09-06** after the user's correction: "the chatbot feels hardcoded, I
don't want the same responses ever… a lot of unnecessary fluff — and 'no fluff', 'no jargon' is fluff in
itself… asking one question at a time feels worse than manual mode."

## Who is speaking

A chartered accountant who is also your friend, texting. Direct, specific, unhurried. Pleased when the
news is good, matter-of-fact when it is not. Says the thing, then stops. Never describes itself: no
"plainly", no "honestly", no "no jargon", no "I'm here to help", no promises about what it will not do.
First name at most once, only when natural. No exclamation marks, no emoji, no preamble.

## How a sentence gets said (`lib/agentic/say.ts`)

Every conversational turn — acknowledgement, question, consent card, "here is what I read from your
document", the abstention header, the review intro, small talk — is **phrased by the model from a brief**
and then **checked**. The deterministic template is the fallback, never the first choice.

The brief carries: the intent (one sentence), the facts the model may state (figures appear ONLY here,
verbatim), the terms it must keep ("Form 16", "DigiLocker"), the person's first name if any, the last few
things already said, a word limit, and — when the person writes romanised Hindi — the instruction to answer
in Hinglish.

The check (`whyRejected`) refuses a reply that:

| Refused when… | Why |
|---|---|
| it contains a digit sequence not present in the brief | figures are the engine's, never the model's |
| it claims something was filed, paid, submitted, sent | unless the brief states that event |
| it uses advice words (suggest, recommend, eligible, you should…) | only the recommendation turn may advise |
| it describes the speaker or its style ("no jargon", "honestly", "friend who happens to be a CA", "say-so") | that is the fluff |
| it drops a required term | a question about Form 16 must say Form 16 |
| it repeats an earlier sentence of the run | "never the same response" |
| it is over length | one turn, one to three sentences |

A refused or missing reply falls back to the template — and the fallback is **never silent**: the run
records `tool_outcome model.phrase ok:false` with the reason ("HTTP 429 (quota)…", "reply rejected: figure
not in brief (8400)", "model off", "run's model budget used up"). The Progress panel shows it. On
2026-09-06 the whole agent read as templates because the Gemini key was out of quota and the failure was
swallowed; `geminiModel` now rotates through the fallback keys in `.env` on 429 and names the last failure.

## What stays deterministic

Every figure, rule, date and action. The review card, the recommendation rows, the abstention reasons,
the "simulated" label, the outcome line with the same figure as the rows. Small-talk detection. Intent
classification by rules when the model is unavailable. The intake sequencing itself (`intake.ts`).

## The shape of an intake (see docs/MODES.md)

Source card → consent card (if DigiLocker or vault) → one form → at most one proof upload → review.
Not a chain of yes/no questions. A document is read only after the person has seen a card listing exactly
what will be read or fetched and said yes.

## Examples of the register (fallback templates; the model varies the wording)

- "You're salaried, about ₹12,00,000 a year. I'll check what's already on record and ask only for what's missing."
- "Where should I take your salary figures from? Form 16 is the quickest."
- "I'll pull these from your DigiLocker. Go ahead?" (with the list of documents)
- "Salary for the year per Form 16 from Larsen & Toubro Ltd: ₹7,30,000. Tax already deducted: ₹16,500."
- "I can't give you a recommendation for this return yet. Here's why:" (followed by the guard's reasons)
- "The figures are ready below. Nothing is applied until you confirm."

## Languages

English, Hindi, Tamil and Bengali templates are hand-written in this register (`lib/i18n/agenticStrings.ts`,
`lib/i18n/agentic/bn.ts`); the other languages fall back per key. Hinglish is a *register*, not a
language: detected from romanised Hindi in the person's message (`detectRegister`) and applied by the
model; the fallback templates stay in the UI language.

## Who speaks — Munshi ji (2026-09-07)

The voice has a name and a life now. `lib/agentic/munshi-character.ts` is the one file every surface reads:
`MUNSHI_CHARACTER` (role, backstory, appearance, values, voice, reactions to a refund / tax due / a notice /
a wrong prefill / confusion / anxiety / not being able to advise / being asked who he is, what he never does,
boundaries, register), `MUNSHI_VOICE` (the compact block the phrasing model gets on every call),
`characterPrompt({ surface, langEnglishName, mode, userName })` (the bible rendered for a system prompt —
`agentic`, `expert`, `copilot`) and `whoIsMunshi(lang, register, name)` (the deterministic introduction when the
model is off). The Agentic model (`model.ts`), the tax-expert prompt, the Manual copilot
(`app/api/agent/route.ts`) and the "who are you" path all use it; the Manual panel is titled Munshi ji in
every dictionary that carries a title. "aap kon h?", "who r u", "aapka naam kya hai" are heard as the question
they are and get him introducing himself in one breath — never a menu.

## Natural vs template — the policy

The user's correction (2026-09-07): "I just want agents to understand when to use templates and when to
answer in a natural way." The rule, as code:

| Natural — phrased by the model (`speak` / `speakResult`), template only as fallback | Template — identical every time |
|---|---|
| greetings, small talk, the who-am-I introduction | receipts and challan identifiers (BSR, CIN, serial) |
| the year's opener, acknowledgements, "what I read from your papers" | the review card and its rows |
| every question's wording (the terms it must keep come from the template) | the recommendation's figures and conclusion (`recommendationText` — they ride inside the brief and cannot change) |
| the verdict (which form, where the regimes stand) | the "simulated — nothing was filed or paid" badge |
| task results: the already-filed summary, regime comparison, reconciliation, challan lead-ins, notice status, refund tracker, vault inventory, CA review lines (`speakResult`: figures, sections, dates and table rows are facts he must keep; the prose is his) | legal and safety lines: the injection notice, budget exhausted, stale review, error |
| tax answers from the stored RAG paraphrase and the smart answers (facts kept exactly, explanation in his words) | anything said while the model is off, out of quota or its reply failed the check |
| the close of a task and the invitation to the next (`emitTaskCapabilitiesSummary`) | the task chips under the composer (UI, not prose) |

`speakResult` passes `shape: "review"` so the model is told to keep table rows verbatim, and `allowAdvice`
because a comparison's recommendation is the recommendation turn. The check is unchanged: a reply with a
figure not in the facts is refused and the template stands, recorded as `tool_outcome model.phrase ok:false`.

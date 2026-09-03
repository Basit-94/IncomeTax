import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How this would be built for real — Wapsi",
  description:
    "The infrastructure design behind the prototype: a canonical income-facts store, an idempotent payment saga, per-dependency circuit breakers, and an explicit refund state machine.",
};

/* -------------------------------------------------------------------------- */

/** A monospace diagram. Scrolls rather than wraps — a broken box drawing is worse than a scrollbar. */
function Diagram({ children, caption }: { children: string; caption: string }) {
  return (
    <figure className="mt-6">
      <div className="overflow-x-auto rounded-card border border-line bg-paper-2 p-4">
        <pre className="font-mono text-[0.72rem] leading-[1.65] text-ink-2">
          {children}
        </pre>
      </div>
      <figcaption className="mt-2 text-[0.8rem] leading-relaxed text-ink-3">
        {caption}
      </figcaption>
    </figure>
  );
}

function Decision({
  n,
  title,
  problem,
  children,
}: {
  n: string;
  title: string;
  problem: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-line pt-8 first:border-t-0">
      <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-3">
        Decision {n}
      </p>
      <h2 className="mt-2.5 text-[1.4rem] font-semibold leading-snug tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-4 border-l-2 border-alarm/40 pl-4 text-[0.95rem] leading-relaxed text-ink-2">
        <span className="font-semibold text-ink">The failure it prevents.</span>{" "}
        {problem}
      </p>
      <div className="mt-5 space-y-4 text-[0.98rem] leading-[1.7] text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}

/** A cost admitted out loud. Every decision below carries one. */
function Cost({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-card bg-paper-2 px-4 py-3 text-[0.9rem] leading-relaxed text-ink-2">
      <span className="font-semibold text-ink">What it costs.</span> {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */

export default function ArchitecturePage() {
  return (
    <main>
      <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-3">
        Engineering
      </p>
      <h1 className="mt-3 text-hero font-semibold text-ink">
        How this would be built for real
      </h1>
      <p className="mt-4 max-w-[64ch] text-[1.02rem] leading-relaxed text-ink-2">
        Six decisions. Each one exists because of a specific, documented way the
        current system fails a citizen — not because it is good practice in the
        abstract. Together they are the argument that the portal&apos;s problems
        are structural rather than cosmetic, and that a redesign which does not
        change the data model underneath would regress within a year.
      </p>

      <div className="mt-7 rounded-card border border-warn/25 bg-warn-soft/70 p-5">
        <p className="text-[0.95rem] leading-relaxed text-warn">
          <strong className="font-semibold">None of this is running.</strong>{" "}
          The prototype you clicked through has no server and makes no network
          calls. This page is a design, written to be argued with.
        </p>
      </div>

      <Decision
        n="01"
        title="One canonical store of income facts, with provenance as a column"
        problem="A citizen sees a prefilled figure they believe is wrong and has no way to tell whose mistake it is. So they either accept a number they don't trust, or they abandon the return. The correction channel exists on a different site, behind a different login."
      >
        <p>
          Everything good about this prototype descends from a single structural
          choice, and it is not a UI choice. Instead of treating prefill as a
          convenience layer assembled at request time, treat every reported
          figure as a <strong>fact record</strong> that is immutable once
          written, and that carries with it the identity of whoever asserted it.
        </p>
        <Diagram caption="A fact is never edited. A correction is a new record that supersedes an old one, so the history of a disputed figure is reconstructible years later — which is exactly what an appeal needs.">{`IncomeFact
  ├─ subject         PAN of the person the fact is about
  ├─ kind            salary | interest | dividend | capital_gain | tax_deducted
  ├─ amount          in paise, integer — never a float
  ├─ period          the assessment year it belongs to
  ├─ asserted_by     the reporting entity's registered identifier (TAN, IFSC, SEBI reg)
  ├─ asserted_on     the date THEY filed it, not the date we ingested it
  ├─ ingested_at     ours, kept separately because the gap is diagnostic
  ├─ supersedes      → prior fact id, if this is a correction
  └─ disputed_by     → citizen assertion id, if the subject says it is wrong`}</Diagram>
        <p>
          Two consequences fall out immediately. The interface can always answer{" "}
          <em>who told you this?</em> — which is what makes a one-tap
          confirmation psychologically safe, because the citizen is checking
          someone else&apos;s declaration rather than swearing to their own. And
          a disagreement becomes a <strong>first-class record attached to the
          fact</strong> rather than a support ticket in a separate system: the
          dispute travels with the figure into assessment, appeal, and audit.
        </p>
        <Cost>
          Storage grows monotonically and nothing can be deleted, which makes
          retention policy a legal question rather than an engineering one.
          Reads need a &quot;current view&quot; projection, because the raw table
          is an append-only log and no screen should query it directly.
        </Cost>
      </Decision>

      <Decision
        n="02"
        title="Prefill degrades to stale-with-a-date, never to a blank form"
        problem="When an upstream reporting system is slow or down, the portal today serves an empty or partial return. The citizen cannot distinguish 'you earned nothing from interest' from 'we could not reach the bank', and files a return that is wrong through no fault of their own."
      >
        <p>
          Prefill has many upstream dependencies and they do not fail together.
          The correct behaviour when one is unreachable is not to retry until
          the request times out, and certainly not to render zero. It is to
          serve the last known good projection and{" "}
          <strong>say how old it is, on the screen, next to the number.</strong>
        </p>
        <Diagram caption="The 'as of' date is not a diagnostic detail hidden in a tooltip. It is part of the figure, because a citizen deciding whether to confirm needs it.">{`request prefill(PAN, year)
       │
       ├─ projection cache HIT, fresh  ──────────►  serve, no banner
       │
       ├─ projection cache HIT, stale  ──────────►  serve + "as of 18 July"
       │                                            + "one source is behind;
       │                                               you can file, or wait"
       │
       └─ MISS and upstream unreachable ────────►  do NOT render an empty form
                                                   name the missing source,
                                                   offer a notification when
                                                   it lands`}</Diagram>
        <p>
          Each upstream sits behind its own{" "}
          <strong>circuit breaker</strong>, tripped per dependency rather than
          globally. A broker feed being down must not make salary figures
          unavailable, because the two have nothing to do with each other and
          most filers only need one of them.
        </p>
        <Cost>
          Someone can file on a stale figure that a later correction contradicts.
          That is a real risk and the reason decision 01 exists — the superseding
          record makes the discrepancy visible and attributable instead of
          looking like citizen error.
        </Cost>
      </Decision>

      <Decision
        n="03"
        title="The refund is an explicit state machine, and the citizen sees the same one we do"
        problem="'Under processing' is one word covering nine distinct situations, several of which the citizen could clear in a minute if anyone told them what was wrong. The variance is what generates grievance volume — identical returns settling in a week or in three months, with no explanation for either."
      >
        <p>
          There are nine states and the transitions between them are enumerable.
          The failure is not that the pipeline is complex; it is that the
          complexity is hidden and then apologised for.
        </p>
        <Diagram caption="Held states are named, not aggregated. 'Waiting on a rent receipt' and 'waiting on a bank code that no longer routes' are different problems with different buttons.">{`not_filed → filed_unverified → verified → in_queue → under_review
                                                          │
                                    ┌─────────────────────┤
                                    ▼                     ▼
                             HELD: evidence        HELD: set-off
                             HELD: bank invalid    HELD: mismatch
                                    │                     │
                                    └─────────┬───────────┘
                                              ▼
                                          determined → sent_to_bank
                                                            │
                                                  ┌─────────┴────────┐
                                                  ▼                  ▼
                                              credited            failed
                                                                     │
                                                        ▼ new account, re-queue`}</Diagram>
        <p>
          Two rules make it useful rather than decorative.{" "}
          <strong>Every hold names the action that releases it</strong> — if we
          cannot state what the citizen should do, the hold is an internal
          problem and should not be surfaced as though it were theirs.{" "}
          <strong>Every wait carries a range, not an average</strong>: returns
          filed in the same week as yours are settling in ten to fourteen days.
          A stated range is honest about variance in a way a single number never
          is, and variance is the thing people actually find intolerable.
        </p>
        <Cost>
          Publishing the machine means committing to it. You can no longer
          quietly add a tenth state, and internal holds that were never meant to
          be citizen-visible have to be either named or removed.
        </Cost>
      </Decision>

      <Decision
        n="04"
        title="Payments are a saga with an idempotency key, and there is a third outcome"
        problem="A citizen pays, the bank confirms, the portal does not, and the money is gone with nothing to show for it. The forum remedy is to pay again — which is how people end up with two challans and a refund claim to recover the duplicate."
      >
        <p>
          Any payment crossing a system boundary has three outcomes, not two:
          succeeded, failed, and <strong>we do not yet know</strong>. Most of the
          damage comes from software that has no vocabulary for the third and so
          reports it as the second.
        </p>
        <Diagram caption="The key is derived from the citizen, the assessment year and the amount — so a double-tap, a page refresh, or a retry after a timeout all collapse onto the same intent.">{`idempotency_key = hash(PAN, assessment_year, amount_paise, intent_nonce)

  initiated ──► pending_at_bank ──► confirmed ──► reconciled
                     │                  │
                     │                  └─► "Payment received,
                     │                       receipt pending" ◄── the third state
                     │                            the citizen sees this,
                     │                            and is told not to pay again
                     ▼
                  unknown ──► reconciliation job, every 15 min
                              never a user-facing "failed" until it settles`}</Diagram>
        <p>
          The user-visible half matters as much as the mechanism.{" "}
          <em>Payment received, receipt pending</em> is a state the current
          portal cannot express, so it shows an error instead — and an error is
          an instruction to try again.
        </p>
        <Cost>
          Reconciliation is a permanent background job with real operational
          burden, and some payments genuinely sit in the unknown state for hours.
          The compensating honesty is that nobody is told to pay twice.
        </Cost>
      </Decision>

      <Decision
        n="05"
        title="A verification session outlives the code it is waiting for"
        problem="The single most-cited complaint about the portal: a one-time code arrives late, the session has already expired, and a form filled over forty minutes is gone. The citizen is punished for a delay in someone else's SMS gateway."
      >
        <p>
          Draft state and authentication state have different lifetimes and
          should never share a timer. A draft is durable and belongs to the
          citizen; a session token is short-lived and belongs to the transport.
          Conflating them means an infrastructure hiccup destroys user work.
        </p>
        <p>
          So: the draft is <strong>persisted on every meaningful change</strong>,
          keyed to the citizen rather than to the session. An outstanding
          verification code holds its challenge open, and the interface says so
          in as many words — <em>take your time, nothing you have entered will
          be lost.</em> Resend is offered after fifteen seconds instead of
          hidden, because a code that has not arrived in fifteen seconds usually
          is not coming.
        </p>
        <Cost>
          A longer-lived challenge is a slightly larger window for a replay
          attempt, which is why the challenge is single-use and bound to the
          draft it authorises rather than to the browser session.
        </Cost>
      </Decision>

      <Decision
        n="06"
        title="Language is a build-time contract, not a runtime lookup"
        problem="Partially translated interfaces are worse than untranslated ones. A citizen navigating in Tamil hits an English string at the exact moment of consequence — the confirmation, the deadline, the warning — because a fallback quietly filled the gap and no test failed."
      >
        <p>
          The dictionary type is <strong>derived from the English source file</strong>,
          not hand-maintained alongside it. A missing Hindi or Tamil key is a
          compile error, so the build fails rather than the user. There is no
          runtime fallback chain, because a fallback chain is a mechanism for
          shipping exactly this bug quietly.
        </p>
        <p>
          Interpolated strings are <strong>functions, not templates with
          placeholders</strong>. Hindi and Tamil place the verb and the
          postposition differently from English, and a{" "}
          <code className="rounded bg-paper-3 px-1 py-0.5 font-mono text-[0.85em] text-ink">
            {"{reporter} reported this on {date}"}
          </code>{" "}
          template silently imposes English word order on both. Number and date
          formatting go through the platform&apos;s own locale support, so lakh
          and crore grouping is correct by construction rather than by a regular
          expression someone wrote once.
        </p>
        <Cost>
          Adding a citizen-facing string means touching three files and cannot be
          deferred. That friction is deliberate — it is the mechanism, not a side
          effect of it.
        </Cost>
      </Decision>

      <section className="mt-16 rounded-card border border-line bg-paper-2 p-6">
        <h2 className="text-[1.15rem] font-semibold tracking-tight text-ink">
          What is deliberately absent
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">
          No message queue between the citizen and their own figures. No
          microservice boundary that turns one screen into six network calls. No
          machine learning anywhere near an assessment decision — a figure that
          determines what someone owes must be attributable to a named reporter,
          and a model output is not. The hard part of this system is
          record-keeping and honesty about failure, and neither is solved by
          adding infrastructure.
        </p>
      </section>

      <p className="mt-12 border-t border-line pt-6 text-[0.9rem] leading-relaxed text-ink-3">
        Every decision above has a cost stated next to it. A design document
        without those is a sales pitch.
      </p>
    </main>
  );
}

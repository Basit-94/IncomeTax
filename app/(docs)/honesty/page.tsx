import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's real and what's mocked — Wapsi",
  description:
    "An itemised account of which parts of this prototype actually work, which data is invented, and which dependencies are never contacted.",
};

/* -------------------------------------------------------------------------- */

type State = "real" | "invented" | "stubbed" | "absent";

const STATE_META: Record<State, { label: string; chip: string; dot: string }> = {
  real: {
    label: "Works",
    chip: "bg-money-soft text-money-deep",
    dot: "bg-money",
  },
  invented: {
    label: "Invented",
    chip: "bg-warn-soft text-warn",
    dot: "bg-warn",
  },
  stubbed: {
    label: "Never contacted",
    chip: "bg-paper-3 text-ink-2",
    dot: "bg-ink-3",
  },
  absent: {
    label: "Not built",
    chip: "bg-alarm-soft text-alarm",
    dot: "bg-alarm",
  },
};

/**
 * One claim, one state, one explanation. The state is carried by a text label
 * as well as a colour — a reviewer reading this on a bad screen, or with a
 * colour vision deficiency, must get the same information.
 */
function Row({
  state,
  what,
  detail,
}: {
  state: State;
  what: string;
  detail: string;
}) {
  const meta = STATE_META[state];
  return (
    <li className="grid gap-x-4 gap-y-1.5 border-b border-line py-4 last:border-b-0 sm:grid-cols-[8.5rem_1fr]">
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider ${meta.chip}`}
        >
          <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden />
          {meta.label}
        </span>
      </div>
      <div>
        <p className="font-medium text-ink">{what}</p>
        <p className="mt-1 text-[0.9rem] leading-relaxed text-ink-2">{detail}</p>
      </div>
    </li>
  );
}

function Section({
  n,
  title,
  lede,
  children,
}: {
  n: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="flex items-baseline gap-3 text-[1.35rem] font-semibold tracking-tight text-ink">
        <span className="font-mono text-[0.8rem] font-medium text-ink-3">
          {n}
        </span>
        {title}
      </h2>
      {lede ? (
        <p className="mt-2.5 max-w-[62ch] text-[0.95rem] leading-relaxed text-ink-2">
          {lede}
        </p>
      ) : null}
      <ul className="mt-5">{children}</ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export default function HonestyPage() {
  return (
    <main>
      <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-3">
        Disclosure
      </p>
      <h1 className="mt-3 text-hero font-semibold text-ink">
        What&apos;s real here, and what&apos;s made up
      </h1>
      <p className="mt-4 max-w-[64ch] text-[1.02rem] leading-relaxed text-ink-2">
        This is a concept prototype, so a good deal of it is theatre. Below is
        the itemised version — what genuinely works, what data is invented, and
        which real systems we deliberately never touch. We would rather you
        found this page than found the seams yourself.
      </p>

      <div className="mt-7 rounded-card border border-money/20 bg-money-soft/60 p-5">
        <p className="text-[0.95rem] leading-relaxed text-money-deep">
          <strong className="font-semibold">
            The single most important line on this page:
          </strong>{" "}
          the citizen-facing browser prototype makes no network requests of any
          kind. Not to the Income Tax Department, not to UIDAI, not to a bank,
          and not to us. Everything in that UI is computed in your own browser
          from invented data compiled into the page. An additive local Spring
          Boot service and load harness exist for owned engineering evidence;
          the UI does not call them, and they do not contact official systems.
        </p>
      </div>

      <Section
        n="01"
        title="What actually works"
        lede="Not simulated — this is real code doing the real thing, and it would behave the same way against live data."
      >
        <Row
          state="real"
          what="The core citizen flow in English, हिन्दी and தமிழ்"
          detail="The filing path, its facts, status messages, and the main dashboard surfaces use the typed dictionary rather than a translated veneer over an English skeleton. A missing Hindi or Tamil key fails the build; the separate engineering disclosures remain English by declared design. Your choice survives a reload."
        />
        <Row
          state="real"
          what="Indian number formatting"
          detail="Lakh and crore grouping via the platform's own Intl support with en-IN, hi-IN and ta-IN locales, forced to Latin digits. ₹4,20,000 groups correctly in all three languages — we did not hand-roll this."
        />
        <Row
          state="real"
          what="The refund state machine"
          detail="An actual state machine with named holds. Clearing a hold advances the state through legal transitions only; you cannot reach 'credited' with an unresolved bank failure. This is the part of the product we most want judged."
        />
        <Row
          state="real"
          what="Provenance on every figure"
          detail="Each income fact carries its reporting entity, that entity's registered identifier, and the date it was filed. The data behind it is invented; the modelling of it is not, and it is the structure the real portal is missing."
        />
        <Row
          state="real"
          what="Your progress surviving a closed tab"
          detail="Journey state is mirrored into your browser's local storage under wapsi_active_id, wapsi_active_data and wapsi_lang. Close the tab, come back, and you are where you left off. The reviewer console can clear it."
        />
        <Row
          state="real"
          what="Dictation, where the browser has it"
          detail="The microphone on the dispute and reply fields uses the browser's own speech recognition, in Indian English, Hindi or Tamil to match your chosen language, with text appearing as you speak. Where the browser has no recognition — Firefox for Android, Opera Mini, roughly one browser in eight — it falls back to a worked example and says on screen that what you are seeing is an example rather than your voice. Worth knowing: Chrome's implementation sends audio to a remote service, so this is a no-API-key choice, not an offline one."
        />
        <Row
          state="real"
          what="A reproducible demo"
          detail="Sandbox identities come from a seeded generator, so the same seed produces the same person, figures, and bank details — a reviewer's identity screenshot can match ours. Mock dictation text and browser event IDs are intentionally interaction-local, not evidence of a live service."
        />
        <Row
          state="real"
          what="Reduced-motion and keyboard support"
          detail="prefers-reduced-motion: reduce collapses every animation. Focus is visibly outlined throughout."
        />
      </Section>

      <Section
        n="02"
        title="What is invented"
        lede="All of it, and by construction rather than by accident. Nothing here was scraped, copied, or derived from a real person's records."
      >
        <Row
          state="invented"
          what="Every PAN begins DEMP"
          detail="The fourth character of a real PAN encodes the holder's type, so DEMP cannot occur naturally. The custom sandbox generator is constrained to the same prefix, which means an auto-generated identity can never collide with a real person's PAN."
        />
        <Row
          state="invented"
          what="Bank routing codes"
          detail="Format-valid IFSC strings that correspond to no real branch — KAVC0001183, GOMT0000714, GODG0004417, DECU0834471. Bank names are real institutions because the scenario needs to be recognisable; no account number, real or masked, belongs to anyone."
        />
        <Row
          state="invented"
          what="The three people"
          detail="Sunita Devi, Rakesh Kumar and Priya Sharma do not exist. Their employers, brokers, salaries, notices and grievances are written to embody documented failure modes — a mis-tagged intraday trade, a set-off against a demand never served, a stale routing code after a bank merger."
        />
        <Row
          state="invented"
          what="Verification codes and reference numbers"
          detail="The one-time code is printed on screen because there is nothing to send it to. Document reference numbers are invented but correctly shaped, because the fact that a letter without one is officially void is a real and under-known protection."
        />
        <Row
          state="invented"
          what="No Aadhaar number appears anywhere"
          detail="Not a real one, not a fake one, not a masked one. Mobile numbers use a reserved-looking 90000 000NN pattern. No payment details and no health data."
        />
      </Section>

      <Section
        n="03"
        title="Systems we never touch"
        lede="Each of these is a real dependency the live portal has. We model the shape of the interaction and the ways it fails. We do not call any of them, and could not."
      >
        <Row
          state="stubbed"
          what="UIDAI — identity verification"
          detail="Real e-verification uses an Aadhaar one-time code or a bank-issued electronic verification code. We show the flow, the waiting state, and the crucial fix: the session is held open while a code is outstanding instead of expiring underneath you."
        />
        <Row
          state="stubbed"
          what="TRACES and the reporting chain"
          detail="The annual information statement, the taxpayer information summary and the tax-credit statement are where prefilled figures actually come from. Ours are compiled into the page."
        />
        <Row
          state="stubbed"
          what="NPCI — bank account validation"
          detail="Whether an account can receive a refund is a live check against the banking network. We simulate both outcomes, including the one the real portal handles worst: a branch absorbed by a merger, leaving a routing code that validates but cannot be paid."
        />
        <Row
          state="stubbed"
          what="Notice issuance and the reference registry"
          detail="Letters are modelled, not fetched. Nothing we display was issued by anyone."
        />
      </Section>

      <Section
        n="04"
        title="Not built"
        lede="Things we planned, said we would do, or that a reviewer might reasonably expect. Listing them costs us something, which is rather the point of the page."
      >
        <Row
          state="absent"
          what="Voice anywhere except the two free-text fields"
          detail="Dictation works on the dispute reason and the notice reply. It does not fill in an amount, navigate a screen, or complete a return end to end by voice — which is what a citizen who cannot read the form would actually need, and is the largest single gap between this prototype and the product it argues for."
        />
        <Row
          state="absent"
          what="Any language model"
          detail="Notice explanations and draft replies are deterministic templates written by hand, not generated. The code puts them behind a single interface so a model could be dropped in without touching a screen, but today there is no model, no key and no inference."
        />
        <Row
          state="absent"
          what="A connected production server, database, or account"
          detail="The citizen UI is deliberately browser-only: its demo return state lives in per-browser storage, so reviewers cannot watch one another's refund advance. An additive local Spring Boot service and load harness now live under backend/ and loadtest/ for exact-money, asynchronous submission, idempotency, and owned-load evidence. They are not connected to this Next.js UI, do not persist production data, and do not contact official systems."
        />
        <Row
          state="absent"
          what="Real filing, in any sense"
          detail="Nothing is submitted anywhere. Sending a return in this prototype writes a value to your own browser."
        />
      </Section>

      <Section
        n="05"
        title="What making it real would take"
        lede="Not a rewrite. The gap is access and assurance, not architecture — which is the argument the next page makes in detail."
      >
        <Row
          state="stubbed"
          what="A canonical store of income facts, with provenance as a first-class field"
          detail="The department already holds every figure it asks citizens to retype. What is missing is one authoritative record per fact carrying who reported it, under which identifier, when, and which correction supersedes it. Almost everything this prototype does well follows from that one structure."
        />
        <Row
          state="stubbed"
          what="Authorised intermediary status"
          detail="Identity verification, account validation and return submission are all gated. This is a permissions and audit problem, not an engineering one."
        />
        <Row
          state="stubbed"
          what="Consent, retention and audit obligations"
          detail="Handling real records means a lawful basis for processing under the Digital Personal Data Protection Act, defined retention, and an audit trail per access. None of that is modelled here, because we hold no one's data."
        />
      </Section>

      <p className="mt-14 border-t border-line pt-6 text-[0.9rem] leading-relaxed text-ink-3">
        If you find something on this page that turns out to be wrong, that is a
        bug of the worst kind and we would want to know. An honest account of a
        prototype is worth more than a flattering one.
      </p>
    </main>
  );
}

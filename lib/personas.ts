/**
 * The three seeded citizens.
 *
 * Reviewers get three one-tap logins instead of one demo account, because each
 * one stands in a different act of the same journey and each embodies a
 * *documented* failure of the real portal rather than an invented one.
 *
 * Everything below is synthetic. PANs are structurally valid — five letters,
 * four digits, one letter, with `P` in the fourth position for an individual —
 * but every one begins `DEMP`, which is the deliberate tell. Employers, banks,
 * brokers and their TAN/IFSC/SEBI identifiers are invented too, so the
 * disclaimer in the footer ("every name, PAN, amount and document here is
 * invented") is literally true and not just approximately true.
 *
 * Mobile numbers use a repeating 90000-000NN pattern for the same reason: any
 * realistic-looking Indian mobile number is somebody's, and India has no
 * reserved fiction range the way +1 has 555.
 *
 * Amounts are whole rupees. Dates are ISO, and are anchored to a "today" of
 * 22 August 2026 so the elapsed-day figures in Act 3 are real arithmetic
 * rather than a hardcoded number.
 */

import type { Persona, PersonaId } from "./types";

/** The demo's frame of reference. Every "days ago" in the seed derives from it. */
export const TODAY = "2026-08-22";

/* -------------------------------------------------------------------------- */
/* Act 1 — Sunita Devi. Owes nothing. Has not filed. Should not have to.      */
/* -------------------------------------------------------------------------- */

const sunita: Persona = {
  id: "sunita",
  name: "Sunita Devi",
  age: 34,
  city: "Tiruppur",
  state: "Tamil Nadu",
  occupation: "Supervisor, garment unit",
  pan: "DEMPS4417K",
  mobile: "90000 00001",
  preferredLang: "ta",
  situation:
    "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.",
  act: 1,
  actLabel: "Confirm, don't compose",
  embodies:
    "66.5% of filers had zero tax liability in FY 2024-25. The portal still makes them choose a form, then compose a return from scratch — on a desktop, in English.",
  assessmentYear: "2026-27",

  facts: [
    {
      id: "sunita-salary",
      label: "Your pay last year",
      amount: 420000,
      kind: "salary",
      provenance: {
        reporter: "Chettinad Textiles Pvt Ltd",
        reporterKind: "employer",
        identifier: "TAN CMBC12874E",
        filedOn: "2026-05-12",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
    {
      id: "sunita-interest",
      label: "Interest your savings account earned",
      amount: 1240,
      kind: "interest",
      provenance: {
        reporter: "Kaveri Cooperative Bank",
        reporterKind: "bank",
        identifier: "IFSC KAVC0001183",
        filedOn: "2026-05-30",
        statement: "AIS",
        onlyReporterCanFix: true,
      },
    },
  ],

  taxPaid: [
    {
      id: "sunita-tds-192",
      label: "Tax already taken out of your pay",
      amount: 8400,
      section: "192",
      provenance: {
        reporter: "Chettinad Textiles Pvt Ltd",
        reporterKind: "employer",
        identifier: "TAN CMBC12874E",
        filedOn: "2026-05-12",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
  ],

  /**
   * Deliberately empty. Her zero liability comes from the slab alone, which
   * makes Act 1 a single clean decision: the money was taken by mistake, and
   * nothing needs to be claimed to get it back.
   */
  claims: [],

  banks: [
    {
      id: "sunita-bank-1",
      bank: "Kaveri Cooperative Bank",
      maskedNumber: "•••• •••• 1183",
      ifsc: "KAVC0001183",
      status: "validated",
      nominatedForRefund: true,
    },
  ],

  refund: {
    state: "not_filed",
    amount: 8400,
    holds: [],
    timeline: [],
  },

  notices: [],
};

/* -------------------------------------------------------------------------- */
/* Act 2 — Rakesh Kumar. Two letters arrived. Neither says what it means.     */
/* -------------------------------------------------------------------------- */

const rakesh: Persona = {
  id: "rakesh",
  name: "Rakesh Kumar",
  age: 41,
  city: "Lucknow",
  state: "Uttar Pradesh",
  occupation: "Operations manager; trades equity on the side",
  pan: "DEMPK8823R",
  mobile: "90000 00002",
  preferredLang: "hi",
  situation:
    "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.",
  act: 2,
  actLabel: "When something comes back",
  embodies:
    "Broker feeds report gross sale value, which prefill mis-tags as gains. Say nothing and silence counts as consent. CAG Report 14/2024 found 7,341 duplicate demands overstating ₹15,652 crore — the set-off machinery runs on records like those.",
  assessmentYear: "2026-27",

  facts: [
    {
      id: "rakesh-salary",
      label: "Your pay last year",
      amount: 1860000,
      kind: "salary",
      provenance: {
        reporter: "Aurelia Systems Pvt Ltd",
        reporterKind: "employer",
        identifier: "TAN LKNA07731C",
        filedOn: "2026-05-28",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
    {
      id: "rakesh-interest",
      label: "Interest your accounts earned",
      amount: 22400,
      kind: "interest",
      provenance: {
        reporter: "Gomti Commercial Bank",
        reporterKind: "bank",
        identifier: "IFSC GOMT0000714",
        filedOn: "2026-06-04",
        statement: "AIS",
        onlyReporterCanFix: true,
      },
    },
    {
      id: "rakesh-dividend",
      label: "Dividend your shares paid out",
      amount: 9150,
      kind: "dividend",
      provenance: {
        reporter: "Trident Registry Services",
        reporterKind: "registrar",
        identifier: "SEBI INR000094412",
        filedOn: "2026-06-18",
        statement: "AIS",
        onlyReporterCanFix: true,
      },
    },
    {
      /**
       * The whole of Act 2 hangs off this one row. The broker reported the
       * gross value of everything sold; prefill read it as profit. `dispute`
       * is left unset on purpose — the reviewer performs the correction. The
       * pre-written truth lives on the notice item instead.
       */
      id: "rakesh-capital-gains",
      label: "Money from selling shares",
      amount: 110000,
      kind: "capital_gains",
      // Listed shares sold within the year, STT paid → STCG u/s 111A at 20%.
      capitalGains: { assetClass: "equity_stt", holding: "short" },
      provenance: {
        reporter: "Meridian Securities Pvt Ltd",
        reporterKind: "broker",
        identifier: "SEBI INZ000123456",
        filedOn: "2026-06-30",
        statement: "AIS",
        onlyReporterCanFix: true,
      },
    },
  ],

  taxPaid: [
    {
      id: "rakesh-tds-192",
      label: "Tax already taken out of your pay",
      amount: 284600,
      section: "192",
      provenance: {
        reporter: "Aurelia Systems Pvt Ltd",
        reporterKind: "employer",
        identifier: "TAN LKNA07731C",
        filedOn: "2026-05-28",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
    {
      id: "rakesh-tds-194a",
      label: "Tax the bank withheld on your interest",
      amount: 2240,
      section: "194A",
      provenance: {
        reporter: "Gomti Commercial Bank",
        reporterKind: "bank",
        identifier: "IFSC GOMT0000714",
        filedOn: "2026-06-04",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
  ],

  claims: [
    {
      id: "rakesh-80c",
      section: "80C",
      label: "Provident fund, insurance and your daughter's tuition",
      amount: 150000,
      evidenceAttached: true,
    },
    {
      id: "rakesh-80d",
      section: "80D",
      label: "Health cover for the family",
      amount: 25000,
      evidenceAttached: true,
    },
  ],

  banks: [
    {
      id: "rakesh-bank-1",
      bank: "Gomti Commercial Bank",
      maskedNumber: "•••• •••• 0714",
      ifsc: "GOMT0000714",
      status: "validated",
      nominatedForRefund: true,
    },
  ],

  refund: {
    state: "under_review",
    amount: 94118,
    filedOn: "2026-07-14",
    verifiedOn: "2026-07-14",
    cohortWeekOf: "2026-07-13",
    cohortWindowDays: [12, 18],
    holds: [
      {
        id: "rakesh-hold-ais",
        kind: "ais_mismatch",
        headline: "One figure doesn't match what your broker reported.",
        detail:
          "Meridian Securities reported ₹1,10,000 from share sales. The department's copy of your return does not show it yet — the figures here already include it, taxed at the short-term rate. Answering the notice clears the mismatch; until then the refund waits.",
        action: { label: "Look at what they reported", href: "/notices" },
        clearsInDays: 6,
        resolved: false,
      },
      {
        id: "rakesh-hold-setoff",
        kind: "demand_setoff",
        headline: "₹18,740 of this is being held against an old bill.",
        detail:
          "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.",
        action: { label: "Read the 2019 demand", href: "/notices" },
        clearsInDays: 9,
        resolved: false,
      },
    ],
    timeline: [
      {
        id: "rakesh-tl-1",
        on: "2026-07-14",
        state: "filed_unverified",
        headline: "You sent your return in.",
        actor: "citizen",
      },
      {
        id: "rakesh-tl-2",
        on: "2026-07-14",
        state: "verified",
        headline: "You confirmed it was you. The return counts from here.",
        actor: "citizen",
      },
      {
        id: "rakesh-tl-3",
        on: "2026-07-26",
        state: "in_queue",
        headline: "In the queue with everything else filed that week.",
        actor: "department",
      },
      {
        id: "rakesh-tl-4",
        on: "2026-08-11",
        state: "under_review",
        headline: "Someone is looking at one figure.",
        actor: "department",
        detail:
          "A share-sale row your broker filed doesn't line up with your return.",
      },
    ],
  },

  notices: [
    {
      id: "rakesh-notice-143",
      kind: "143_1_a",
      /**
       * A communication without a valid DIN is deemed never to have been
       * issued (CBDT Circular 19/2019). So we print it, and let the citizen
       * check it — that is a real right almost nobody knows they hold.
       */
      din: "ITBA/AST/S/143(1)(a)/2026-27/1078342219(1)",
      issuedOn: "2026-08-11",
      respondBy: "2026-09-10",
      headline: "The department thinks you left out ₹1,10,000 of share profit.",
      consequence:
        "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.",
      amountAtStake: 34300,
      status: "open",
      items: [
        {
          id: "rakesh-notice-143-item-1",
          claim:
            "You sold shares for ₹1,10,000 and didn't declare the profit on them.",
          amount: 110000,
          basis: {
            reporter: "Meridian Securities Pvt Ltd",
            reporterKind: "broker",
            identifier: "SEBI INZ000123456",
            filedOn: "2026-06-30",
            statement: "AIS",
            onlyReporterCanFix: true,
          },
          citizenTruth:
            "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.",
        },
      ],
    },
    {
      id: "rakesh-notice-245",
      kind: "245_setoff",
      din: "ITBA/COM/F/17/2026-27/1079914462(1)",
      issuedOn: "2026-08-04",
      respondBy: "2026-09-03",
      headline:
        "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.",
      consequence:
        "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.",
      amountAtStake: 18740,
      status: "open",
      items: [
        {
          id: "rakesh-notice-245-item-1",
          claim:
            "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.",
          amount: 18740,
          basis: {
            reporter: "Income Tax Department",
            reporterKind: "department",
            filedOn: "2019-11-22",
            statement: "self",
            onlyReporterCanFix: false,
          },
          citizenTruth:
            "I never received any notice of this demand. I have no order, no email and no post for it, and I want it verified before anything is taken from my refund.",
        },
      ],
      setOff: {
        assessmentYear: "2019-20",
        raisedOn: "2019-11-22",
        originalOrder: "ITBA/AST/S/143(1)/2019-20/1023117845(1)",
        amount: 18740,
        noticeEverReceived: false,
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Act 3 — Priya Sharma. 71 days. Two words.                                  */
/* -------------------------------------------------------------------------- */

const priya: Persona = {
  id: "priya",
  name: "Priya Sharma",
  age: 28,
  city: "Pune",
  state: "Maharashtra",
  occupation: "Junior architect; first time filing",
  pan: "DEMPS9052M",
  mobile: "90000 00003",
  preferredLang: "en",
  situation:
    "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.",
  act: 3,
  actLabel: "The wait, made legible",
  embodies:
    "Refund *variance* drives grievance volume — seven days for one return, three months for an identical one. Meanwhile the Revalidate button on a failed bank account does not work, and forums pass around delete-and-re-add as the fix.",
  assessmentYear: "2026-27",

  facts: [
    {
      id: "priya-salary",
      label: "Your pay last year",
      amount: 980000,
      kind: "salary",
      provenance: {
        reporter: "Kalyani Design Collective LLP",
        reporterKind: "employer",
        identifier: "TAN PNEK04412B",
        filedOn: "2026-05-19",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
    {
      id: "priya-interest",
      label: "Interest your savings account earned",
      amount: 6700,
      kind: "interest",
      provenance: {
        reporter: "Godavari Gramin Bank",
        reporterKind: "bank",
        identifier: "IFSC GODG0004417",
        filedOn: "2026-06-02",
        statement: "AIS",
        onlyReporterCanFix: true,
      },
    },
  ],

  taxPaid: [
    {
      id: "priya-tds-192",
      label: "Tax already taken out of your pay",
      amount: 34800,
      section: "192",
      provenance: {
        reporter: "Kalyani Design Collective LLP",
        reporterKind: "employer",
        identifier: "TAN PNEK04412B",
        filedOn: "2026-05-19",
        statement: "26AS",
        onlyReporterCanFix: true,
      },
    },
  ],

  claims: [
    {
      id: "priya-80c",
      section: "80C",
      label: "Provident fund and your insurance premium",
      amount: 48000,
      evidenceAttached: true,
    },
    {
      /** No receipt attached — this is what trips the NUDGE-style hold. */
      id: "priya-80gg",
      section: "80GG",
      label: "Rent you paid, with no house-rent allowance from your employer",
      amount: 60000,
      evidenceAttached: false,
    },
  ],

  banks: [
    {
      /**
       * The nominated account is dead, and the reason is invisible on the real
       * portal: a regional bank was amalgamated into its sponsor, account
       * numbers survived, IFSC series did not.
       */
      id: "priya-bank-1",
      bank: "Godavari Gramin Bank",
      maskedNumber: "•••• •••• 4417",
      ifsc: "GODG0004417",
      status: "failed",
      failure: "stale_ifsc",
      supersededBy: {
        bank: "Deccan Union Bank",
        ifsc: "DECU0834471",
        mergerNote:
          "Godavari Gramin Bank was merged into Deccan Union Bank on 1 April 2025. Your account number stayed the same, but the code that routes money to it changed.",
      },
      nominatedForRefund: true,
    },
    {
      id: "priya-bank-2",
      bank: "Deccan Union Bank",
      maskedNumber: "•••• •••• 6620",
      ifsc: "DECU0834471",
      status: "validated",
      nominatedForRefund: false,
    },
  ],

  refund: {
    state: "under_review",
    amount: 34800,
    filedOn: "2026-06-12",
    verifiedOn: "2026-06-12",
    cohortWeekOf: "2026-06-08",
    cohortWindowDays: [10, 14],
    holds: [
      {
        id: "priya-hold-nudge",
        kind: "nudge_deduction",
        headline: "Waiting on one thing: a receipt for your rent claim.",
        detail:
          "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.",
        action: { label: "Add the receipt", href: "/refund/rent" },
        clearsInDays: 4,
        resolved: false,
      },
      {
        id: "priya-hold-bank",
        kind: "bank_invalid",
        headline: "The account you chose can't receive the money.",
        detail:
          "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.",
        action: { label: "Point it at the right account", href: "/refund/bank" },
        clearsInDays: 2,
        resolved: false,
      },
    ],
    timeline: [
      {
        id: "priya-tl-1",
        on: "2026-06-12",
        state: "filed_unverified",
        headline: "You sent your return in.",
        actor: "citizen",
      },
      {
        id: "priya-tl-2",
        on: "2026-06-12",
        state: "verified",
        headline: "You confirmed it was you. The return counts from here.",
        actor: "citizen",
        detail: "OTP verified, 4 minutes after filing.",
      },
      {
        id: "priya-tl-3",
        on: "2026-06-19",
        state: "in_queue",
        headline: "In the queue with everything else filed that week.",
        actor: "department",
      },
      {
        id: "priya-tl-4",
        on: "2026-07-03",
        state: "under_review",
        headline: "Held: your rent claim needs a receipt.",
        actor: "department",
        detail:
          "₹60,000 claimed under 80GG with nothing attached to support it.",
      },
      {
        id: "priya-tl-5",
        on: "2026-07-09",
        state: "under_review",
        headline: "Your bank account was checked and failed.",
        actor: "bank",
        detail:
          "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.",
      },
    ],
  },

  notices: [
    {
      id: "priya-notice-nudge",
      kind: "ais_campaign",
      din: "ITBA/CMP/F/NUDGE/2026-27/1081226703(1)",
      issuedOn: "2026-07-03",
      respondBy: "2026-09-30",
      headline: "The department is asking you to look again at your rent claim.",
      consequence:
        "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.",
      amountAtStake: 18600,
      status: "open",
      items: [
        {
          id: "priya-notice-nudge-item-1",
          claim:
            "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.",
          amount: 60000,
          basis: {
            reporter: "Income Tax Department",
            reporterKind: "department",
            filedOn: "2026-07-03",
            statement: "self",
            onlyReporterCanFix: false,
          },
          citizenTruth:
            "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.",
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */

export const PERSONAS: Record<PersonaId, Persona> = {
  sunita,
  rakesh,
  priya,
};

/** Landing-page order: act 1, then 2, then 3. */
export const PERSONA_ORDER: PersonaId[] = ["sunita", "rakesh", "priya"];

export const PERSONA_LIST: Persona[] = PERSONA_ORDER.map((id) => PERSONAS[id]);

export function getPersona(id: string): Persona | undefined {
  return (PERSONAS as Record<string, Persona>)[id];
}

/** Resolve a login attempt by PAN, case-insensitively. */
export function findPersonaByPan(pan: string): Persona | undefined {
  const needle = pan.trim().toUpperCase();
  return PERSONA_LIST.find((p) => p.pan === needle);
}

/** Whole days between two ISO dates. Used for "filed 71 days ago". */
export function daysBetween(fromIso: string, toIso: string = TODAY): number {
  const ms = Date.parse(toIso) - Date.parse(fromIso);
  return Math.round(ms / 86_400_000);
}

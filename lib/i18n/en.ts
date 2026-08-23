/**
 * English source dictionary. This is the shape every other language must match
 * — `Dict` is derived from it, so a missing Hindi or Tamil key is a type error
 * rather than a silent English fallback in front of a user who can't read it.
 *
 * Two rules the copy here is held to, from the simplification contract:
 *
 *   - Never name a form. No "ITR-1", no "Sahaj", no "Gross Total Income",
 *     no "Schedule S". If a string here contains a form name, it's a bug.
 *   - Consequence, not rule. No section numbers in citizen-facing copy.
 *     "If you stop here it is as though you never filed" — not "e-verify
 *     within 30 days u/s 139".
 *
 * Interpolated strings are functions, not templates with placeholders, because
 * Hindi and Tamil put the verb and the postposition in different places than
 * English does. A `{reporter} reported this on {date}` template would force
 * English word order onto both.
 */

export const en = {
  langName: "English",
  /** The language's own name, for the switcher. Never translated. */
  langNativeName: "English",
  dir: "ltr",

  common: {
    continue: "Continue",
    back: "Back",
    yesThatsRight: "Yes, that's right",
    noThisIsWrong: "No, this is wrong",
    iDontUnderstand: "I don't understand this",
    close: "Close",
    /** Never "Submit". The button says what happens. */
    saveAndGoOn: "Save and go on",
    loading: "Just a moment",
  },

  landing: {
    question: "Is the Income Tax Department holding money that's yours?",
    subtext:
      "Most people who use this have nothing to pay. They are owed. Put in your PAN and we'll tell you what's there.",
    panLabel: "Your PAN",
    panHelp: "Ten characters, from your PAN card",
    check: "Check what's owed to me",
    orTryAs: "Or look around as one of three people",
    honestyLink: "What's real here and what's made up",
  },

  login: {
    otpSentTo: (mobile: string) => `We sent a code to ${mobile}`,
    otpLabel: "The six-digit code",
    /** Answers the single most-cited complaint: OTP delay killed the session. */
    weWillWait:
      "Take your time. Nothing you've entered will be lost while you wait for the code.",
    resend: "Send it again",
    resendIn: (seconds: number) => `You can ask for another in ${seconds}s`,
    mockNotice:
      "This is a prototype, so the code is shown on screen. No real message is sent.",
  },

  file: {
    /** Rule 4: money first, tax second. This is the entry point, not "File your return". */
    heading: (amount: string) => `${amount} of yours is sitting with the department`,
    subheading:
      "Almost everything below was already reported about you. Read it, and tell us if anything is wrong.",

    checkThis: "Check this — you don't have to fill it in",
    /** Rule 3: provenance is what makes "just confirm" psychologically possible. */
    reportedBy: (reporter: string, date: string) =>
      `${reporter} reported this to the department on ${date}`,
    underIdentifier: (identifier: string) => `Registered as ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `If this is wrong, only ${reporter} can change it at the source. We'll tell you exactly what to ask them for.`,

    whatYouEarned: "What you earned",
    whatWasDeducted: "Tax already taken out",
    whereMoneyGoes: "Where the money goes",
    whoYouAre: "Who you are",

    disputeHeading: "What should it say?",
    disputeAmountLabel: "The right amount",
    disputeReasonLabel: "Why it's wrong",
    disputeSave: "Flag this as wrong",

    /** Rule 10: one number at the end. */
    outcomeOwesNothing: "You owe nothing.",
    outcomeRefund: (amount: string) => `${amount} comes back to you.`,
    outcomeOwes: (amount: string) => `There is ${amount} left to pay.`,
    confirmAndFile: "Send this in",

    /** Rule 6: the 30-day cliff stated as consequence, not as a silent timer. */
    verifyHeading: "One step left, or this doesn't count.",
    verifyBody:
      "Until you confirm it's you, your return isn't filed — it's as though you never sent it. This takes about twenty seconds.",
    verifyAction: "Confirm it's me",

    voicePrompt: "Or just say it",
    voiceListening: "Listening",
    voiceUnsupported:
      "This phone's browser can't listen yet. You can type instead — nothing is lost.",
  },

  refund: {
    heading: (amount: string) => `${amount} is on its way to you`,
    filedDaysAgo: (days: number) => `You filed ${days} days ago`,

    /** Rule 7: never a dead end. Every hold names its own release. */
    holdsHeading: (n: number) =>
      n === 1 ? "Waiting on one thing" : `Waiting on ${n} things`,
    clearsInDays: (days: number) =>
      days === 1 ? "About a day once that's done" : `About ${days} days once that's done`,

    /** A stated range beats a good average — variance is what enrages people. */
    cohortWindow: (from: number, to: number) =>
      `Returns filed the same week as yours are being processed now. Expect ${from} to ${to} days.`,

    states: {
      not_filed: "Not sent in yet",
      filed_unverified: "Sent in, waiting for you to confirm it's you",
      verified: "Confirmed by you",
      in_queue: "In the queue",
      under_review: "Someone is looking at it",
      determined: "Decided",
      sent_to_bank: "Sent to your bank",
      credited: "In your account",
      failed: "Couldn't reach your account",
    },

    bankFailedHeading: "The account you chose can't receive the money.",
    bankMergedInto: (bank: string) => `That branch is now part of ${bank}`,
    useThisAccount: "Send it here instead",
  },

  notices: {
    heading: "Letters from the department",
    none: "Nothing has come back. That's the good outcome.",
    respondBy: (date: string) => `Answer by ${date}`,
    /** Consequence in money and days, never "failing which". */
    ifYouDoNothing: "If you do nothing",
    basedOn: "What this is based on",
    theCatch: "What they've got wrong",
    agree: "That's right",
    disagree: "That's wrong",
    /** A communication without a valid DIN is deemed never issued. Almost nobody knows this. */
    dinLabel: "Reference number on this letter",
    dinExplain:
      "Every letter from the department must carry one of these. Without it, the letter officially doesn't exist.",
    neverReceived: "I never received notice of this",
  },

  footer: {
    prototype: "Independent concept prototype.",
    notAffiliated:
      "Not affiliated with, endorsed by, or connected to the Income Tax Department, CBDT, or the Government of India. Every name, PAN, amount and document here is invented. No live government system is contacted.",
    honestyLink: "See exactly what is real and what is mocked",
  },
};

/**
 * The contract every language file satisfies. Derived from `en` rather than
 * hand-written so the two can never drift.
 */
export type Dict = typeof en;

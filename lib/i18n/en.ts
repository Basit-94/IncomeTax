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
    logOut: "Log out",
    undo: "Undo",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "A clearer way to check and file",
    independent: "Independent prototype",
    taxYear: "Tax year 2026-27",
    language: "Language",
    light: "Light",
    dark: "Dark",
    sandbox: "Review tools",
  },

  /**
   * Validation messages. Held to the same rule as everything else: an error
   * names what is wrong and what would be right. "Invalid PAN" is banned — it
   * tells someone they failed without telling them how to stop failing.
   */
  validate: {
    panTooShort: (n: number) => `That's ${n} characters so far. A PAN has 10.`,
    panShape:
      "A PAN is five letters, then four digits, then one letter — like DEMPS4417K.",
    panSandboxHint:
      "Nothing you type here leaves your browser. Every PAN in this prototype starts with DEMP, so a real one can't be looked up by accident.",
    ifscTooShort: (n: number) => `That's ${n} characters. A bank code has 11.`,
    ifscShape:
      "A bank code is four letters, then a zero, then six more — like DECU0834471.",
  },

  landing: {
    question: "Is the Income Tax Department holding money that's yours?",
    subtext:
      "Most people who use this have nothing to pay. They are owed. Put in your PAN and we'll tell you what's there.",
    panLabel: "Your PAN",
    panHelp: "Ten characters, from your PAN card",
    panPlaceholder: "For example, DEMPS4417K",
    check: "Check what's owed to me",
    orTryAs: "Or look around as one of three people",
    honestyLink: "What's real here and what's made up",
    architectureLink: "Technical architecture",
    badge: "Simplified tax return, proven live",
    brandTitle: "refund engine.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  /**
   * The four cards on the landing page. Numbered because these genuinely are
   * sequential moments in one journey — filing, then a letter, then the wait —
   * not decoration. Names are proper nouns and stay untranslated.
   *
   * Note what these strings do *not* say. Not "S.245 set-off", not "IFSC", not
   * "ITR". A reviewer choosing a person to be should not need to already know
   * the vocabulary the product exists to remove.
   */
  personas: {
    sunita: {
      phase: "Filing",
      blurb:
        "₹8,400 was taken out of her pay. She owes nothing, hasn't filed, and school fees are due.",
      action: "Confirm what's already known",
    },
    rakesh: {
      phase: "A letter came",
      blurb:
        "A letter says he hid ₹1,10,000 of share profit. His refund is being kept back against an old demand he was never told about.",
      action: "Read it and disagree",
    },
    priya: {
      phase: "The wait",
      blurb:
        "Filed 71 days ago. Still says under processing. Two things are actually holding it, and nobody told her which.",
      action: "See what's holding it",
    },
    custom: {
      phase: "Try your own",
      blurbTitle: "Someone made up",
      blurb:
        "Build a person from scratch — their pay, what they claim, what was deducted — and watch the tax work itself out.",
      action: "Make someone up",
    },
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
    portalHeading: "e-Filing verification",
    incorrectCode: "That code doesn't match. Check the six digits and try again.",
    prototypeBox: "Prototype OTP validation",
    mockCodeLabel: "Mock code",
    autoFill: "Fill it in for me",
    verifyEnter: "Verify and go in",
    /** Shown when a saved draft was found and reopened. */
    draftRestored: (time: string) => `Your draft was restored from ${time}. Nothing was lost.`,
  },

  file: {
    /** Rule 4: money first, tax second. This is the entry point, not "File your return". */
    heading: (amount: string) => `${amount} of yours is sitting with the department`,
    subheading:
      "Almost everything below was already reported about you. Read it, and tell us if anything is wrong.",

    checkThis: "Check this — you don't have to fill it in",
    factMeaning: "This is a reported fact, not a tax rule. It feeds the calculation below.",
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
    selfReported: "You",
    returnLabel: "Your return",

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
    /** Shown when we fall back to a canned line. Saying so is the whole point. */
    voiceSimulated: "This browser can't listen, so this is an example, not your voice.",
    voiceError: "That didn't come through. You can type instead — nothing is lost.",
    dictate: "Dictate (voice)",
    disputePlaceholder: "Say or type why this figure is wrong.",
    disputeDefaultReason: "The reported figure is wrong",
  },

  /**
   * The filing flow's step names and review-screen furniture. Steps are named
   * for the citizen's intent ("Your money"), never the portal's structure
   * ("PART A/B/C", schedule numbers).
   */
  flow: {
    facts: "Your money",
    deductions: "Money you can claim",
    regime: "Old or new",
    check: "Check it",
    file: "Send it in",
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    confirmedCount: (done: number, total: number) => `${done} of ${total} confirmed`,
    allConfirmed: "Everything checks out.",
    undoOne: "Take this correction back",
    correctedTo: (amount: string) => `You say it should be ${amount}`,
  },

  groups: {
    moneyIn: "Money coming in",
    taxPaid: "Tax already paid for you",
    deductionsClaimed: "Deductions you claim",
    fromWhere: "Where this came from",
    addIncome: "Add income",
  },

  deductions: {
    heading: "Money you can claim",
    sub: "These don't happen by themselves. You say yes — but only if they're true.",
    claimedHeading: "Already in your return",
    worthUpTo: (amount: string) => `Worth up to ${amount} off your taxable income`,
    worthWhatYouPaid: "Worth what you actually paid — claim the real figure",
    askRentQ: "Did you pay rent for where you live?",
    askRentWhy:
      "If you pay rent and your employer doesn't give you a house-rent allowance, part of it can come off your taxable income.",
    askHealthQ: "Do you pay for health insurance that covers your family?",
    askHealthWhy:
      "What you pay to keep your family insured can come off your taxable income.",
    ask80cQ: "Do you put money into provident fund, life insurance, or school tuition?",
    ask80cWhy:
      "Long-term savings like these count towards one combined limit, and whatever you put in comes off your taxable income.",
    claimIt: "Yes — claim this",
    skipIt: "No — skip this one",
    amountLabel: "How much",
    evidenceAttached: "Evidence attached",
    evidenceMissing: "Evidence missing",
    newRegimeNoEffect:
      "Under the new regime this claim changes nothing — it isn't allowed there.",
    oldRegimeSaves: (amount: string) =>
      `Under the old regime it would cut your tax by about ${amount}.`,
  },

  regime: {
    heading: "There are two ways to be taxed. One is better for you.",
    newRegimeName: "New regime",
    oldRegimeName: "Old regime",
    refundLabel: "Comes back to you",
    dueLabel: "Left to pay",
    recommendedBadge: "Better for you",
    reasoningOldDeductions: (x: string, y: string) =>
      `Your deductions come to ${x}, so the old regime saves you about ${y}.`,
    reasoningNewDefault: (y: string) =>
      `Your deductions wouldn't help much either way, so the new regime's lower rates save you about ${y}.`,
    acceptRecommendation: "Go with what's better for me",
    overrideNote: "You can pick either one. Nothing here is hidden or locked.",
  },

  check: {
    heading: "The whole return, on one page",
    sub: "Every number came from somewhere. Open any line to see exactly where.",
    grossIncome: "Everything that came in",
    standardDeduction: "Standard deduction",
    deductionsLine: "Claims you made",
    taxableIncome: "Income tax actually applies to",
    slabTax: "Tax before any relief",
    rebate87A: "Rebate cancelling some of it",
    cess: "Health-and-education addition",
    totalTax: "Total tax for the year",
    tdsCredits: "Already taken from you",
    refundDue: "Comes back to you",
    balanceDue: "Left to pay",
    openLine: "Show where this came from",
    closeLine: "Hide",
    calculationStatus: "Prototype calculation — rule inputs still need primary-source verification (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} is calculated from the confirmed facts and tax credits below. The source records are synthetic in this prototype.`,
    showCalculationTrail: "Show source and calculation trail",
    hideCalculationTrail: "Hide source and calculation trail",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · reported ${date}`,
    sourceIdentifier: (identifier: string) => `Record ${identifier}`,
    selfReportedSource: "Reported by you in this return",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "Annual Information Statement: information received from reporting entities."
        : statement === "26AS"
        ? "Form 26AS: a tax-credit statement showing tax reported against your PAN."
        : "A source record attached to this fact.",
    sectionMeaning: (section: string) =>
      `${section} is a deduction section. It is counted only when this regime allows it.`,
    explainGross: "Added up from the facts you reviewed and confirmed.",
    explainStd: (amount: string) =>
      `Everyone with salary income gets ${amount} off without claiming anything.`,
    explainDeductions: "Only claims this regime allows are counted.",
    explainDisallowed: (section: string) =>
      `${section} isn't allowed under this regime, so it does nothing here.`,
    explainTaxable: "What came in, minus the standard deduction and your claims.",
    explainSlab: "Tax works in slices — each slice of income at its own rate.",
    explainRebate: (amount: string) =>
      `Below a threshold most of the tax is cancelled — ${amount} of it here.`,
    explainCess: "A small percentage added on top, after every relief.",
    explainTds: "TDS means tax deducted at source: whoever paid you withheld this before the money reached you.",
    fromFacts: "From these facts:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "Ready to send this in?",
    sub: "Once it's gone, a change means filing again. Look once more, then send.",
    stepChecking: "Checking arithmetic…",
    stepSealing: "Sealing figures…",
    stepFiled: "Filed.",
    ackHeading: "It's in.",
    ackBody:
      "Your return counts from today. One step remains: confirming it's really you when asked. Until then it counts as unsent.",
    ackNext:
      "After that, the tracker shows exactly where your money is and what could hold it up.",
    errorCause: "The checking step failed because the sandbox fault switch is on.",
    errorAction:
      "Turn off 'Trigger API Gateway Timeout' in the reviewer drawer, then send again. Nothing was lost.",
    retry: "Try sending again",
  },

  timeline: {
    filed: "You sent your return in.",
    verified: "You confirmed it was you. The return counts from here.",
    in_queue: "In the queue with everything else filed that week.",
    under_review: "Someone is looking at it now.",
    determined: "Decided — this is what comes back.",
    sent_to_bank: "Sent to your bank.",
    credited: "In your account.",
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
    resolvedHold: "Sorted — this no longer holds anything up.",
    stampFiled: "FILED",
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
  },

  dashboard: {
    userDashboard: "User Dashboard",
    taxPrefills: "Tax Prefills (AIS/26AS)",
    pendingActions: "Pending Actions",
    returnSummary: "Return Summary AY 2026-27",
    reviewPrefill: "Review the prefilled details in the Tax Prefills tab, then confirm to file.",
    filingSubmitted: "Your e-filing return is submitted. Check progress on the timeline.",
    verifiedBanks: "Verified Bank Accounts for Refund",
    primaryRefundAccount: "Primary Refund Account",
    backupAccount: "Backup Account",
    ifscMeaning: "IFSC is the 11-character bank routing code used to send a refund.",
    refundTimeline: "Refund Timeline",
    filingSubmittedTimeline: "Filing Submitted",
    identityVerifiedTimeline: "Identity Verified",
    assessmentProcessingTimeline: "Assessment Processing",
    refundApprovedTimeline: "Refund Approved",
    refundCreditedTimeline: "Refund Credited",
    holdActive: "Hold active: Resolve actions in Action tab",
    successCheckApp: "Success! Check your banking app.",
    outstandingNotices: "Outstanding Compliance Notices",
    noPendingActions: "No Pending Actions",
    accountCompliant: "Your account is fully compliant with no outstanding notices or tax demands.",
    actionableHolds: "Actionable Assessment Holds",
    uploadRent: "Upload Rent Agreement / Receipts",
    landlordName: "Landlord Name",
    landlordPan: "Landlord PAN (10 Digits)",
    selectPdfJpg: "Select PDF/JPG",
    submitReceipt: "Submit Receipt",
    responsePosition: "Response Position",
    agreeDept: "I Agree with Department",
    disagreeProof: "I Disagree (Submit Proof)",
    responseDraft: "Response Statement (Draft)",
    dictateStatement: "Dictate Statement",
    sendResponse: "Send Response",
    filingStatusLabel: "Filing status",
    bankValidated: "Validated",
    bankUnderProcess: "Under process",
    bankFailed: "Failed",
    staleIfscHold: "This bank code stopped routing.",
    switchToNewIfsc: (ifsc: string) => `Switch to the new code (${ifsc})`,
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

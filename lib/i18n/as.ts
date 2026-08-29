/**
 * অসমীয়া (Assamese). Typed against the English source, so this file cannot
 * fall behind it.
 *
 * This translation is model-generated and has NOT yet been reviewed by a
 * native Assamese speaker with tax vocabulary. Review is project task T0.5 —
 * until it lands, treat this file as a working draft, not shipping copy.
 *
 * Exported as `asDict` (not `as`) because `as` clashes with the TypeScript
 * import-rename keyword.
 *
 * Digits stay Latin. Money must be instantly legible, so ₹ amounts and every
 * other number use 0-9.
 */

import type { Dict } from "./en";

export const asDict: Dict = {
  langName: "Assamese",
  langNativeName: "অসমীয়া",
  dir: "ltr",

  common: {
    modeSimple: "সৰল",
    modeDetailed: "বিতং",
    continue: "আগবাঢ়ক",
    back: "পিছলৈ",
    yesThatsRight: "হয়, এইটো শুদ্ধ",
    noThisIsWrong: "নহয়, এইটো ভুল",
    iDontUnderstand: "মই এইটো বুজি পোৱা নাই",
    close: "বন্ধ কৰক",
    saveAndGoOn: "ছেভ কৰি আগবাঢ়ক",
    loading: "অলপ ৰ'ব",
    logOut: "লগ আউট",
    undo: "ঘূৰাই লওক",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ৱাপছি",
    subtitle: "পৰীক্ষা আৰু ফাইল কৰাৰ সহজ উপায়",
    independent: "স্বতন্ত্ৰ প্ৰ'ট'টাইপ",
    taxYear: "কৰ বৰ্ষ 2026-27",
    language: "ভাষা",
    light: "লাইট",
    dark: "ডাৰ্ক",
    sandbox: "ৰিভিউ টুল",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "মূল বিষয়বস্তুলৈ যাওক",
  },

  validate: {
    panTooShort: (n: number) => `এতিয়ালৈকে ${n}টা আখৰ। PAN-ত 10টা থাকে।`,
    panShape:
      "PAN-ত প্ৰথমে পাঁচটা আখৰ, তাৰ পিছত চাৰিটা সংখ্যা, শেষত এটা আখৰ থাকে — যেনে DEMPS4417K।",
    panSandboxHint:
      "আপুনি ইয়াত যি লিখে সেয়া আপোনাৰ ব্ৰাউজাৰৰ বাহিৰলৈ নাযায়। এই প্ৰ'ট'টাইপত প্ৰতিটো PAN DEMP-ৰে আৰম্ভ হয়, সেয়ে ভুলতে কোনো আচল PAN বিচাৰিব নোৱাৰি।",
    ifscTooShort: (n: number) => `এতিয়ালৈকে ${n}টা আখৰ। বেংক ক'ডত 11টা থাকে।`,
    ifscShape:
      "বেংক ক'ডত প্ৰথমে চাৰিটা আখৰ, তাৰ পিছত এটা শূন্য, তাৰ পিছত আৰু ছটা — যেনে DECU0834471।",
  },

  landing: {
    question: "আয়কৰ বিভাগৰ হাতত আপোনাৰ টকা আটকি আছে নেকি?",
    subtext:
      "ইয়ালৈ অহা বেছিভাগ মানুহৰে একো দিবলগীয়া নাথাকে — বৰং পাবলগীয়া থাকে। আপোনাৰ PAN দিয়ক, কি আছে আমি কৈ দিম।",
    panLabel: "আপোনাৰ PAN",
    panHelp: "দহটা আখৰ, আপোনাৰ PAN কাৰ্ডৰ পৰা",
    panPlaceholder: "যেনে, DEMPS4417K",
    check: "মোৰ কিমান পাবলগীয়া আছে চাওক",
    orTryAs: "নাইবা তিনিজনৰ যিকোনো এজন হৈ চাই লওক",
    honestyLink: "ইয়াত কি আচল আৰু কি সজোৱা",
    architectureLink: "কাৰিকৰী গঠন",
    badge: "সৰল ৰিটাৰ্ণ, প্ৰমাণিত",
    brandTitle: "আপোনাৰ টকা, উভতি অহাৰ পথত।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ফাইল কৰা",
      blurb:
        "তেওঁৰ দৰমহাৰ পৰা ₹8,400 কাটি লোৱা হৈছিল। তেওঁৰ একো দিবলগীয়া নাই, তেওঁ ফাইল কৰা নাই, আৰু স্কুলৰ মাচুল দিয়াৰ সময় হৈছে।",
      action: "যি আগৰে পৰা জনা, তাক নিশ্চিত কৰক",
    },
    rakesh: {
      phase: "এখন চিঠি আহিল",
      blurb:
        "চিঠিখনে কয় তেওঁ শ্বেয়াৰৰ ₹1,10,000 লাভ লুকুৱাইছিল। এটা পুৰণি দাবীৰ বিনিময়ত তেওঁৰ ঘূৰাই পাবলগীয়া টকা ৰখা হৈছে, যাৰ কথা তেওঁক কেতিয়াও জনোৱাই হোৱা নাছিল।",
      action: "পঢ়ক আৰু অসন্মতি জনাওক",
    },
    priya: {
      phase: "অপেক্ষা",
      blurb:
        "71 দিনৰ আগতে ফাইল কৰিছিল। এতিয়াও লিখা আছে প্ৰক্ৰিয়া চলি আছে। আচলতে দুটা কথাই আটকাই ৰাখিছে, আৰু কোনটো বুলি কোনেও কোৱা নাই।",
      action: "কিহে আটকাই ৰাখিছে চাওক",
    },
    custom: {
      phase: "নিজে সাজি চাওক",
      blurbTitle: "সজা এজন",
      blurb:
        "শূন্যৰ পৰা এজন মানুহ সাজক — তেওঁৰ উপাৰ্জন, তেওঁৰ দাবী, কিমান কৰ কটা হ'ল — আৰু চাওক হিচাপ নিজে নিজে কেনেকৈ মিলি যায়।",
      action: "কাৰোবাক সাজি লওক",
    },
  },

  login: {
    authVerifying: "ছাৰ্ভাৰৰ সৈতে পৰীক্ষা চলি আছে…",
    authUnreachable:
      "ছাইন-ইন ছাৰ্ভাৰ পোৱা নগ'ল। আপুনি লিখা একো হেৰোৱা নাই — অলপ পিছত আকৌ চেষ্টা কৰক।",
    authRejected: (detail: string) => `ছাৰ্ভাৰে ছাইন ইন কৰিবলৈ নিদিলে: ${detail}`,
    signedInAs: "ছাইন ইন হ'ল — ছেশ্বন সক্ৰিয়",
    otpSentTo: (mobile: string) => `আমি ${mobile} নম্বৰলৈ এটা ক'ড পঠিয়াইছোঁ`,
    otpLabel: "ছটা সংখ্যাৰ ক'ড",
    weWillWait:
      "খৰখেদা নাই। ক'ডৰ বাবে অপেক্ষা কৰি থাকোঁতে আপুনি লিখা একো নেহেৰায়।",
    resend: "আকৌ পঠিয়াওক",
    resendIn: (seconds: number) => `${seconds} ছেকেণ্ডৰ পিছত আকৌ খুজিব পাৰিব`,
    mockNotice:
      "এইটো এটা প্ৰ'ট'টাইপ, সেয়ে ক'ডটো স্ক্ৰীণতে দেখুওৱা হৈছে। কোনো আচল বাৰ্তা পঠিওৱা নহয়।",
    portalHeading: "ই-ফাইলিং সত্যাপন",
    incorrectCode: "এই ক'ড মিলা নাই। ছটা সংখ্যা আকৌ চাই চেষ্টা কৰক।",
    prototypeBox: "প্ৰ'ট'টাইপ OTP সত্যাপন",
    mockCodeLabel: "মক ক'ড",
    autoFill: "মোৰ হৈ ভৰাই দিয়ক",
    verifyEnter: "সত্যাপন কৰি ভিতৰলৈ যাওক",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "ছয় অংকৰ সত্যাপন ক'ড",
    otpDigitLabel: (position: number, total: number) =>
      `অংক ${position}, মুঠ ${total}ৰ ভিতৰত`,
    draftRestored: (time: string) =>
      `${time}-ত ছেভ হোৱা আপোনাৰ খচৰা ঘূৰাই অনা হ'ল। একো হেৰোৱা নাই।`,
  },

  file: {
    heading: (amount: string) => `আপোনাৰ ${amount} বিভাগৰ হাতত পৰি আছে`,
    subheading:
      "তলৰ প্ৰায় সকলোবোৰ আপোনাৰ বিষয়ে আগৰে পৰা জনোৱা হৈছে। পঢ়ক, আৰু কিবা ভুল থাকিলে আমাক কওক।",

    checkThis: "এইটো মিলাই চাওক — ভৰাব নালাগে",
    factMeaning:
      "এইটো আগৰে পৰা জনোৱা এটা তথ্য, কৰৰ নিয়ম নহয়। তলৰ হিচাপ ইয়াৰ পৰাই হয়।",
    factMeaningByKind: {
      salary:
        "আপোনাৰ হাতত পৰা দৰমহাৰ পৰা আপোনাৰ নিয়োগকৰ্তাই এইটো জনাইছে। তলৰ সকলো হিচাপ ইয়াৰ পৰাই আৰম্ভ হয়।",
      interest:
        "বেংকে বছৰত এবাৰ আপোনাৰ একাউণ্টে পোৱা সুত জনায়। সৰু ধনো আয়েই।",
      dividend:
        "কোম্পানীৰ ৰেজিষ্ট্ৰাৰে জনাইছে আপোনাৰ শ্বেয়াৰে কিমান দিলে। যি বছৰত পোৱা, সেই বছৰৰ আয় হিচাপে ধৰা হয়।",
      capital_gains:
        "আপোনাৰ ব্ৰ'কাৰে শ্বেয়াৰ বেচি পোৱা টকা জনাইছে। কৰ লাগে লাভৰ ওপৰত — হাৰ নিৰ্ভৰ কৰে কি বেচিলে আৰু কিমান দিন ৰাখিলে তাৰ ওপৰত।",
      rent:
        "পোৱা ভাড়া আয়; দিয়া ভাড়াই কৰ কমাব পাৰে। দুয়োটাই সিটো পক্ষই জনোৱা হিচাপৰ সৈতে মিলিব লাগিব।",
      other:
        "এনে জনোৱা আয় যি আন কোনো শিতানত নপৰে। ইয়োও তলৰ হিচাপত যোগ হয়।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter}-এ ${date} তাৰিখে বিভাগক এইটো জনাইছিল`,
    underIdentifier: (identifier: string) => `পঞ্জীয়ন ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `এইটো ভুল হ'লে মূল ঠাইত কেৱল ${reporter}-হে সলনি কৰিব পাৰে। তেওঁলোকক ঠিক কি খুজিব লাগে, আমি কৈ দিম।`,

    whatYouEarned: "আপুনি কিমান উপাৰ্জন কৰিলে",
    whatWasDeducted: "কৰ আগতেই কিমান কটা হ'ল",
    whereMoneyGoes: "টকা ক'লৈ যাব",
    whoYouAre: "আপুনি কোন",

    disputeHeading: "ইয়াত কি লিখা থাকিব লাগিছিল?",
    disputeAmountLabel: "শুদ্ধ পৰিমাণ",
    disputeReasonLabel: "কিয় ভুল",
    disputeSave: "এইটোক ভুল বুলি চিহ্নিত কৰক",
    selfReported: "আপুনি",
    returnLabel: "আপোনাৰ ৰিটাৰ্ণ",

    outcomeOwesNothing: "আপোনাৰ একো দিবলগীয়া নাই।",
    outcomeRefund: (amount: string) => `${amount} আপোনাৰ ওচৰলৈ ঘূৰি আহিব।`,
    outcomeOwes: (amount: string) => `${amount} দিবলৈ বাকী আছে।`,
    confirmAndFile: "এইটো পঠিয়াই দিয়ক",

    verifyHeading: "আৰু এটা খোজ বাকী, নহ'লে এইটো গণ্য নহ'ব।",
    verifyBody:
      "এয়া আপুনিয়েই বুলি নিশ্চিত নকৰালৈকে আপোনাৰ ৰিটাৰ্ণ দাখিল হোৱা নাই — যেন পঠিওৱাই হোৱা নাই। ইয়াত প্ৰায় বিছ ছেকেণ্ড লাগে।",
    verifyAction: "নিশ্চিত কৰক এয়া ময়েই",

    voicePrompt: "নাইবা মুখেৰে কওক",
    voiceListening: "শুনি আছোঁ",
    voiceUnsupported:
      "এই ফোনৰ ব্ৰাউজাৰে এতিয়াও শুনিব নোৱাৰে। আপুনি লিখিও জনাব পাৰে — একো নেহেৰায়।",
    voiceSimulated:
      "এই ব্ৰাউজাৰে শুনিব নোৱাৰে, সেয়ে এইটো এটা উদাহৰণ, আপোনাৰ মাত নহয়।",
    voiceError: "শুনা নগ'ল। আপুনি লিখিও জনাব পাৰে — একো নেহেৰায়।",
    dictate: "মুখেৰে কওক (ভইচ)",
    disputePlaceholder: "এই সংখ্যাটো কিয় ভুল — লিখক বা কওক।",
    disputeDefaultReason: "জনোৱা সংখ্যাটো ভুল",
  },

  flow: {
    facts: "আপোনাৰ টকা",
    deductions: "যি টকা আপুনি দাবী কৰিব পাৰে",
    regime: "পুৰণি নে নতুন",
    check: "মিলাই চাওক",
    file: "পঠিয়াই দিয়ক",
    stepOf: (n: number, total: number) => `খোজ ${n}, মুঠ ${total}`,
    confirmedCount: (done: number, total: number) =>
      `${total}টাৰ ভিতৰত ${done}টা নিশ্চিত`,
    allConfirmed: "সকলো ঠিকেই আছে।",
    undoOne: "এই শুধৰণি ঘূৰাই লওক",
    correctedTo: (amount: string) => `আপুনি কয় এইটো ${amount} হ'ব লাগে`,
  },

  groups: {
    moneyIn: "সোমোৱা টকা",
    taxPaid: "আপোনাৰ হৈ আগতেই দিয়া কৰ",
    deductionsClaimed: "আপুনি দাবী কৰা ৰেহাই",
    fromWhere: "এইটো ক'ৰ পৰা আহিল",
    addIncome: "আয় যোগ কৰক",
  },

  deductions: {
    notAllowedNewRegime: "নতুন ব্যৱস্থাত গণনা নহয় — আপোনাৰ ৰেকৰ্ডত ৰখা আছে।",
    startedAtCap: (amount: string) =>
      `আমি এইটো ${amount}-ৰ সীমাৰ পৰা আৰম্ভ কৰিছোঁ — প্ৰকৃততে যি দিছে সেয়া “কিমান”-ত লিখক।`,
    heading: "যি টকা আপুনি দাবী কৰিব পাৰে",
    sub: "এইবোৰ নিজে নিজে নহয়। আপুনি হয় বুলি ক'ব লাগে — কিন্তু সঁচা হ'লেহে।",
    claimedHeading: "আপোনাৰ ৰিটাৰ্ণত আগৰে পৰা আছে",
    worthUpTo: (amount: string) =>
      `আপোনাৰ কৰযোগ্য আয়ৰ পৰা ${amount} লৈকে কমাব পাৰে`,
    worthWhatYouPaid: "যিমান সঁচাকৈ দিছে সিমানেই — প্ৰকৃত পৰিমাণটো দাবী কৰক",
    askRentQ: "আপুনি থকা ঠাইৰ ভাড়া দিয়ে নেকি?",
    askRentWhy:
      "আপুনি ভাড়া দিয়ে আৰু নিয়োগকৰ্তাৰ পৰা ঘৰ-ভাড়া ভাট্টা নাপায় যদি, তাৰ এটা অংশ আপোনাৰ কৰযোগ্য আয়ৰ পৰা কমিব পাৰে।",
    askHealthQ: "পৰিয়ালৰ স্বাস্থ্য বীমাৰ টকা আপুনি দিয়ে নেকি?",
    askHealthWhy:
      "পৰিয়ালৰ বীমা চলাই ৰাখিবলৈ আপুনি যি দিয়ে, সেয়া আপোনাৰ কৰযোগ্য আয়ৰ পৰা কমিব পাৰে।",
    ask80cQ: "আপুনি প্ৰভিডেণ্ট ফাণ্ড, জীৱন বীমা বা স্কুলৰ টিউচন মাচুলত টকা ভৰায় নেকি?",
    ask80cWhy:
      "এনে দীঘলীয়া ম্যাদৰ সঞ্চয় এটা মিলিত সীমাত গণনা হয়, আৰু যিমান ভৰায় সিমান আপোনাৰ কৰযোগ্য আয়ৰ পৰা কমে।",
    claimIt: "হয় — এইটো দাবী কৰিম",
    skipIt: "নহয় — এইটো বাদ দিয়ক",
    amountLabel: "কিমান",
    evidenceAttached: "প্ৰমাণ সংলগ্ন আছে",
    evidenceMissing:
      "এতিয়ালৈকে কোনো প্ৰমাণ যোগ হোৱা নাই — আপাতত ঠিকেই আছে। ৰচিদবোৰ ৰাখি থওক; বিভাগে পিছত খুজিব পাৰে।",
    newRegimeNoEffect:
      "নতুন ব্যৱস্থাত এই দাবীৰে একো সলনি নহয় — তাত ই গ্ৰহণযোগ্য নহয়।",
    oldRegimeSaves: (amount: string) =>
      `পুৰণি ব্যৱস্থাত ই আপোনাৰ কৰ প্ৰায় ${amount} কমাই দিলেহেঁতেন।`,
  },

  regime: {
    heading: "কৰ দিয়াৰ দুটা পথ আছে। এটা আপোনাৰ বাবে ভাল।",
    newRegimeName: "নতুন ব্যৱস্থা",
    oldRegimeName: "পুৰণি ব্যৱস্থা",
    refundLabel: "আপোনালৈ ঘূৰি আহিব",
    dueLabel: "দিবলৈ বাকী",
    recommendedBadge: "আপোনাৰ বাবে ভাল",
    reasoningOldDeductions: (x: string, y: string) =>
      `আপোনাৰ ৰেহাই মুঠতে ${x}, সেয়ে পুৰণি ব্যৱস্থাই আপোনাক প্ৰায় ${y} ৰাহি কৰায়।`,
    reasoningNewDefault: (y: string) =>
      `আপোনাৰ ৰেহাইয়ে ইয়াত বিশেষ সহায় নকৰিলেহেঁতেন, সেয়ে নতুন ব্যৱস্থাৰ কম হাৰে আপোনাক প্ৰায় ${y} ৰাহি কৰায়।`,
    acceptRecommendation: "মোৰ বাবে যিটো ভাল, সেইটোৱে লওক",
    overrideNote: "আপুনি যিকোনো এটা বাছিব পাৰে। ইয়াত একো লুকুৱা বা বন্ধ কৰা নাই।",
  },

  check: {
    newRegimeClaimsZero:
      "আপোনাৰ দাবীবোৰ তালিকাত আছে আৰু সুৰক্ষিত — নতুন ব্যৱস্থাই সেইবোৰ গ্ৰহণ নকৰে বাবেই এই শাৰীটো ₹0।",
    badgeReportedBy: (reporter: string) => `${reporter}-এ জনাইছে`,
    badgeYouEntered: "আপুনি লিখিছে",
    badgeWeApplied: "আমি আপোনাৰ হৈ প্ৰয়োগ কৰিছোঁ",
    heading: "গোটেই ৰিটাৰ্ণ, এখন পৃষ্ঠাত",
    sub: "প্ৰতিটো সংখ্যা ক'ৰবাৰ পৰা আহিছে। যিকোনো শাৰী খুলি চাওক ঠিক ক'ৰ পৰা।",
    grossIncome: "যি যি আহিল",
    standardDeduction: "ষ্টেণ্ডাৰ্ড ৰেহাই",
    deductionsLine: "আপুনি কৰা দাবী",
    taxableIncome: "যি আয়ৰ ওপৰত সঁচাকৈ কৰ লাগে",
    slabTax: "কোনো সকাহৰ আগৰ কৰ",
    rebate87A: "যি সকাহে ইয়াৰ কিছু অংশ বাতিল কৰে",
    cess: "স্বাস্থ্য আৰু শিক্ষা উপকৰ",
    totalTax: "বছৰটোৰ মুঠ কৰ",
    tdsCredits: "আপোনাৰ পৰা আগতেই কটা হৈছে",
    refundDue: "আপোনালৈ ঘূৰি আহিব",
    balanceDue: "দিবলৈ বাকী",
    openLine: "এইটো ক'ৰ পৰা আহিল চাওক",
    closeLine: "লুকুৱাওক",
    calculationStatus:
      "এইটো প্ৰ'ট'টাইপৰ হিচাপ — নিয়মৰ উৎস এতিয়াও প্ৰাথমিক উৎসৰ পৰা পৰীক্ষা কৰা বাকী (TODO(verify))।",
    calculationTrail: (amount: string) =>
      `${amount} তলৰ নিশ্চিত কৰা তথ্য আৰু কৰ ক্ৰেডিটৰ পৰা হিচাপ কৰা হৈছে। এই প্ৰ'ট'টাইপত উৎস ৰেকৰ্ডবোৰ সজোৱা।`,
    showCalculationTrail: "উৎস আৰু হিচাপৰ শৃংখল চাওক",
    hideCalculationTrail: "উৎস আৰু হিচাপৰ শৃংখল লুকুৱাওক",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} তাৰিখে জনোৱা`,
    sourceIdentifier: (identifier: string) => `ৰেকৰ্ড ${identifier}`,
    selfReportedSource: "এই ৰিটাৰ্ণত আপুনি নিজে জনোৱা",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: প্ৰতিবেদন দিয়া প্ৰতিষ্ঠানবোৰৰ পৰা পোৱা তথ্যৰ বাৰ্ষিক বিৱৰণী।"
        : statement === "26AS"
        ? "Form 26AS: আপোনাৰ PAN-ৰ বিপৰীতে জনোৱা কৰ ক্ৰেডিটৰ বিৱৰণী।"
        : "এই তথ্যৰ লগত সংলগ্ন এটা উৎস ৰেকৰ্ড।",
    sectionMeaning: (section: string) =>
      `${section} কৰ-ৰেহাইৰ এটা ধাৰা। এই ব্যৱস্থাই অনুমতি দিলেহে ই গণনা হয়।`,
    explainGross: "আপুনি চাই নিশ্চিত কৰা তথ্যবোৰ যোগ কৰি।",
    explainStd: (amount: string) =>
      `দৰমহাৰ আয় থকা প্ৰতিজনে একো দাবী নকৰাকৈয়ে ${amount} ৰেহাই পায়।`,
    explainDeductions: "কেৱল এই ব্যৱস্থাই অনুমোদন কৰা দাবীবোৰহে গণনা হয়।",
    explainDisallowed: (section: string) =>
      `${section} এই ব্যৱস্থাত অনুমোদিত নহয়, সেয়ে ইয়াত ইয়াৰ কোনো প্ৰভাৱ নাই।`,
    explainTaxable: "যি আহিল, তাৰ পৰা ষ্টেণ্ডাৰ্ড ৰেহাই আৰু আপোনাৰ দাবীবোৰ বাদ দি।",
    explainSlab: "কৰ খাপে খাপে লাগে — আয়ৰ প্ৰতিটো খাপত তাৰ নিজৰ হাৰ।",
    explainRebate: (amount: string) =>
      `এটা সীমাৰ তলত বেছিভাগ কৰ বাতিল হৈ যায় — ইয়াত তাৰ ${amount}।`,
    explainCess: "প্ৰতিটো সকাহৰ পিছত ওপৰত যোগ হোৱা সৰু শতাংশ এটা।",
    explainTds:
      "TDS মানে উৎসতে কটা কৰ: যিয়ে আপোনাক টকা দিলে, তেওঁ টকা আপোনাৰ হাত পোৱাৰ আগতেই এইখিনি ৰাখি থৈছিল।",
    fromFacts: "এই তথ্যবোৰৰ পৰা:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "পঠিয়াবলৈ সাজু নেকি?",
    sub: "এবাৰ গ'লে সলনি কৰিবলৈ আকৌ ফাইল কৰিব লাগে। আৰু এবাৰ চাই লওক, তাৰ পিছত পঠিয়াওক।",
    stepChecking: "হিচাপ পৰীক্ষা কৰি আছোঁ…",
    stepSealing: "সংখ্যাবোৰ ছীল কৰি আছোঁ…",
    stepFiled: "দাখিল হ'ল।",
    ackHeading: "জমা হ'ল।",
    ackBody:
      "আপোনাৰ ৰিটাৰ্ণ আজিৰ পৰা গণ্য হ'ব। এটা খোজ বাকী: সোধা হ'লে এয়া সঁচাকৈয়ে আপুনিয়েই বুলি নিশ্চিত কৰা। তেতিয়ালৈকে ই নপঠিওৱা বুলিয়েই ধৰা হ'ব।",
    ackNext:
      "তাৰ পিছত ট্ৰেকাৰে ঠিক ঠিক দেখুৱাব আপোনাৰ টকা ক'ত আছে আৰু কিহে তাক আটকাব পাৰে।",
    errorCause: "চেণ্ডবক্সৰ fault ছুইচ অন থকাৰ বাবে পৰীক্ষাৰ খোজটো ৰৈ গ'ল।",
    errorAction:
      "ৰিভিউৱাৰ ড্ৰৱাৰত 'Trigger API Gateway Timeout' বন্ধ কৰক, তাৰ পিছত আকৌ পঠিয়াওক। একো হেৰোৱা নাই।",
    errorCauseNetwork: "আপোনাৰ ৰিটাৰ্ণ ছাৰ্ভাৰ পোৱা নগ'ল।",
    errorActionNetwork:
      "একো দাখিল হোৱা নাই, একো হেৰোৱাও নাই। সংযোগ চাই লৈ আকৌ পঠিয়াওক।",
    retry: "আকৌ পঠিওৱাৰ চেষ্টা কৰক",
  },

  wizard: {
    identityNextHint: "আগবাঢ়িবলৈ আপোনাৰ সম্পূৰ্ণ নাম আৰু 10 আখৰৰ PAN লিখক।",
    employmentConfirmHint:
      "আপোনাৰ আগৰ উত্তৰৰ পৰা — সলনি হৈছে যদি বেলেগ বিকল্পত টিপক।",
    tdsZeroWarning:
      "দৰমহাৰ চাকৰিত প্ৰায় সদায় কৰ আগৰে পৰা কটা থাকে — সেয়া আপোনাৰ ফৰ্ম 16 বা দৰমহাৰ শ্লিপত আছে। ইয়াত 0 লিখাৰ অৰ্থ প্ৰায়ে নিজৰ ঘূৰাই পাবলগীয়া টকা এৰি দিয়া।",
  },

  timeline: {
    filed: "আপুনি আপোনাৰ ৰিটাৰ্ণ পঠিয়াই দিলে।",
    verified: "আপুনি নিশ্চিত কৰিলে এয়া আপুনিয়েই। ৰিটাৰ্ণ ইয়াৰ পৰাই গণ্য হ'ব।",
    in_queue: "সেই সপ্তাহত দাখিল হোৱা আন সকলোবোৰৰ সৈতে শাৰীত।",
    under_review: "এতিয়া কোনোবাই এইটো চাই আছে।",
    determined: "সিদ্ধান্ত হ'ল — এইখিনিয়েই ঘূৰি আহিব।",
    sent_to_bank: "আপোনাৰ বেংকলৈ পঠিওৱা হ'ল।",
    credited: "আপোনাৰ একাউণ্টত।",
  },

  refund: {
    heading: (amount: string) => `${amount} আপোনাৰ পথত আহি আছে`,
    filedDaysAgo: (days: number) => `আপুনি ${days} দিনৰ আগতে ফাইল কৰিছিল`,

    holdsHeading: (n: number) =>
      n === 1 ? "এটা কথাৰ অপেক্ষা" : `${n}টা কথাৰ অপেক্ষা`,
    clearsInDays: (days: number) =>
      days === 1
        ? "সেয়া হোৱাৰ পিছত প্ৰায় এদিন"
        : `সেয়া হোৱাৰ পিছত প্ৰায় ${days} দিন`,

    cohortWindow: (from: number, to: number) =>
      `আপোনাৰ সপ্তাহতে দাখিল হোৱা ৰিটাৰ্ণবোৰ এতিয়া প্ৰক্ৰিয়াত আছে। ${from}-ৰ পৰা ${to} দিন লাগিব পাৰে।`,

    states: {
      not_filed: "এতিয়াও পঠিওৱা হোৱা নাই",
      filed_unverified: "পঠিওৱা হ'ল, আপোনাৰ নিশ্চিতিৰ অপেক্ষাত",
      verified: "আপুনি নিশ্চিত কৰিলে",
      in_queue: "শাৰীত আছে",
      under_review: "কোনোবাই এইটো চাই আছে",
      determined: "সিদ্ধান্ত হ'ল",
      sent_to_bank: "আপোনাৰ বেংকলৈ পঠিওৱা হ'ল",
      credited: "আপোনাৰ একাউণ্টত সোমাল",
      failed: "আপোনাৰ একাউণ্ট পোৱা নগ'ল",
    },

    bankFailedHeading: "আপুনি বাছি লোৱা একাউণ্টটোৱে টকা ল'ব পৰা নাই।",
    bankMergedInto: (bank: string) => `সেই শাখা এতিয়া ${bank}-ৰ অংশ`,
    useThisAccount: "তাৰ সলনি ইয়ালৈ পঠিয়াওক",
    resolvedHold: "মিটি গ'ল — ই আৰু একো আটকাই ৰখা নাই।",
    stampFiled: "দাখিল",
  },

  notices: {
    heading: "বিভাগৰ পৰা অহা চিঠি",
    none: "একো ঘূৰি অহা নাই। এইটোৱেই ভাল খবৰ।",
    respondBy: (date: string) => `${date}-ৰ ভিতৰত উত্তৰ দিয়ক`,
    ifYouDoNothing: "আপুনি একো নকৰিলে",
    basedOn: "এইটো কিহৰ ভিত্তিত",
    theCatch: "তেওঁলোকে ক'ত ভুল কৰিছে",
    agree: "এইটো শুদ্ধ",
    disagree: "এইটো ভুল",
    dinLabel: "এই চিঠিৰ প্ৰসংগ নম্বৰ",
    dinExplain:
      "বিভাগৰ প্ৰতিখন চিঠিত এই নম্বৰ থকাটো বাধ্যতামূলক। ই নথকাকৈ চিঠিখনৰ চৰকাৰীভাৱে কোনো অস্তিত্ব নাই।",
  },

  dashboard: {
    serverFilings: "ছাৰ্ভাৰত নথিভুক্ত",
    serverFilingsEmpty:
      "লাইভ ছাৰ্ভাৰত এই PAN-ৰ কোনো দাখিল ৰিটাৰ্ণ নাই — ওপৰৰ প্ৰাপ্তি-স্বীকাৰটো সজোৱা কাহিনীৰ অংশ। এই এপৰ পৰা দাখিল কৰিলে আচল ৰচিদ ইয়ালৈ আহিব।",
    greetingLabel: "আপোনাৰ ছাইন-ইন বাক্য",
    greetingWhy:
      "একাউণ্ট খোলাৰ সময়ত আপুনি এই বাক্যটো বাছি লৈছিল। যি পৃষ্ঠাই ইয়াক দেখুৱাব নোৱাৰে, সেয়া আমি নহওঁ।",
    userDashboard: "ইউজাৰ ডেশ্ববৰ্ড",
    taxPrefills: "কৰৰ তথ্য (AIS/26AS)",
    pendingActions: "বাকী থকা কাম",
    returnSummary: "ৰিটাৰ্ণৰ সাৰাংশ AY 2026-27",
    reviewPrefill:
      "কৰৰ তথ্য টেবত আগৰে পৰা ভৰোৱা বিৱৰণ চাই লওক, তাৰ পিছত দাখিলৰ বাবে নিশ্চিত কৰক।",
    filingSubmitted:
      "আপোনাৰ ই-ফাইলিং ৰিটাৰ্ণ জমা হ'ল। টাইমলাইনত অগ্ৰগতি চাওক।",
    verifiedBanks: "ৰিফাণ্ডৰ বাবে সত্যাপিত বেংক একাউণ্ট",
    primaryRefundAccount: "মুখ্য ৰিফাণ্ড একাউণ্ট",
    backupAccount: "বেকআপ একাউণ্ট",
    ifscMeaning: "IFSC হ'ল ৰিফাণ্ড পঠিয়াবলৈ ব্যৱহাৰ হোৱা 11 আখৰৰ বেংক ৰাউটিং ক'ড।",
    refundTimeline: "ৰিফাণ্ডৰ টাইমলাইন",
    filingSubmittedTimeline: "ৰিটাৰ্ণ জমা হ'ল",
    identityVerifiedTimeline: "পৰিচয় সত্যাপিত",
    assessmentProcessingTimeline: "মূল্যায়ন চলি আছে",
    refundApprovedTimeline: "ৰিফাণ্ড মঞ্জুৰ",
    refundCreditedTimeline: "ৰিফাণ্ড জমা হ'ল",
    holdActive: "হ'ল্ড সক্ৰিয়: একচন টেবত কামবোৰ সম্পূৰ্ণ কৰক",
    successCheckApp: "সফল! আপোনাৰ বেংকিং এপ চাওক।",
    outstandingNotices: "বাকী থকা কমপ্লায়েন্স জাননী",
    noPendingActions: "কোনো কাম বাকী নাই",
    accountCompliant:
      "আপোনাৰ একাউণ্ট সম্পূৰ্ণ নিয়ম-মতে আছে — কোনো বাকী জাননী বা কৰৰ দাবী নাই।",
    actionableHolds: "কাম কৰিব পৰা মূল্যায়ন-হ'ল্ড",
    uploadRent: "ভাড়াৰ চুক্তি / ৰচিদ আপল'ড কৰক",
    landlordName: "ঘৰৰ মালিকৰ নাম",
    landlordPan: "ঘৰৰ মালিকৰ PAN (10 সংখ্যা)",
    selectPdfJpg: "PDF/JPG বাছক",
    submitReceipt: "ৰচিদ জমা দিয়ক",
    responsePosition: "উত্তৰৰ স্থিতি",
    agreeDept: "মই বিভাগৰ সৈতে একমত",
    disagreeProof: "মই একমত নহয় (প্ৰমাণ জমা দিয়ক)",
    responseDraft: "উত্তৰৰ বিবৃতি (খচৰা)",
    dictateStatement: "মুখেৰে কৈ লিখাওক",
    sendResponse: "উত্তৰ পঠিয়াওক",
    filingStatusLabel: "ফাইলিঙৰ স্থিতি",
    bankValidated: "সত্যাপিত",
    bankUnderProcess: "প্ৰক্ৰিয়া চলি আছে",
    bankFailed: "বিফল",
    staleIfscHold: "এই বেংক ক'ড আৰু ক'লৈকো নাযায়।",
    switchToNewIfsc: (ifsc: string) => `নতুন ক'ডলৈ সলনি কৰক (${ifsc})`,
    personalized: {
      eyebrow: "আপোনাৰ ডেশ্ববৰ্ড",
      headingFiled: "আপোনাৰ ৰিটাৰ্ণ জমা হৈ গ'ল — এয়া তাৰ স্থিতি",
      heading: {
        file_return: "আহক আপোনাৰ ৰিটাৰ্ণ সাজু কৰোঁ",
        check_refund: "আহক চাওঁ কি ঘূৰি আহিব পাৰে",
        understand_notice: "আহক মন দিবলগীয়া কামখিনি চোৱা যাওক",
        correct_prefill: "আহক জনোৱা তথ্যখিনি চাই লওঁ",
      },
      guidedBody: "প্ৰতিটো সংখ্যা নিশ্চিত কৰাৰ আগতে আমি তাৰ অৰ্থ বুজাই দিম।",
      quickBody: "পথ চুটি ৰাখিম আৰু পৰৱৰ্তী সিদ্ধান্তটো আগত ৰাখিম।",
      unfiledBody: "প্ৰথমে, আপোনাৰ বিষয়ে আগৰে পৰা জনোৱা তথ্য নিশ্চিত কৰক।",
      filedBody:
        "আপুনি যি কামলৈ আহিছে, তাৰ লগত আটাইতকৈ মিলা অংশটোৱেই আমি খুলি দিছোঁ।",
      primaryAction: {
        facts: "মোৰ জনোৱা তথ্য চাম",
        overview: "মোৰ ৰিফাণ্ড ট্ৰেকাৰ দেখুৱাওক",
        statement: "জনোৱা তথ্য চাওক",
        actions: "কি মন দিব লাগে দেখুৱাওক",
      },
      focusLabel: "আমি যিবোৰলৈ চকু ৰাখিম",
      profileLabels: {
        work: "কাম",
        income: "আনুমানিক মুঠ আয়",
        history: "ফাইলিঙৰ অভিজ্ঞতা",
      },
    },
  },

  onboarding: {
    eyebrow: "আৰম্ভৰ আগতে",
    title: "আহক এইটো আপোনাৰ বাবে সজাই লওঁ।",
    intro:
      "পাঁচটা চুটি উত্তৰে আমাক শুদ্ধ ভাষা, গতি আৰু কৰৰ প্ৰশ্ন বাছি লোৱাত সহায় কৰিব। পিছত এইবোৰ সলনি কৰিব পাৰিব।",
    languageQuestion: "আমি কোনটো ভাষাত কথা পাতিম?",
    languageHelp: "এইটোৱেই আমাৰ প্ৰথম প্ৰশ্ন। ভাষা আপুনি যিকোনো সময়তে সলনি কৰিব পাৰে।",
    intentQuestion: "আজি আপুনি কিয় আহিছে?",
    intentHelp: "সেই কামটোৱেই আমি আটাইতকৈ আগত ৰাখিম।",
    intentOptions: {
      file_return: {
        label: "এই বছৰৰ ৰিটাৰ্ণ ফাইল কৰিম",
        detail: "আপোনাৰ বিষয়ে যি আগৰে পৰা জনা, তাৰ পৰাই আৰম্ভ কৰক।",
      },
      check_refund: {
        label: "মোৰ টকা পাবলগীয়া আছে নেকি চাম",
        detail: "কি জনোৱা হ'ল, কি দিয়া হ'ল, আৰু কি ঘূৰি আহিব পাৰে, চাওক।",
      },
      understand_notice: {
        label: "এখন চিঠি বা জাননী বুজিম",
        detail: "তাত কি লিখা আছে, কি বিপদত আছে, আৰু ইয়াৰ পিছত কি কৰিব লাগে, চাওক।",
      },
      correct_prefill: {
        label: "ভুল যেন লগা কিবা শুধৰাম",
        detail: "সংখ্যাটোৰ উৎস বিচাৰক আৰু কি সলনি হ'ব লাগে লিখি থওক।",
      },
    },
    intentCta: {
      file_return: "মোৰ ৰিটাৰ্ণ আৰম্ভ কৰক",
      check_refund: "মোৰ কিমান পাবলগীয়া চাওক",
      understand_notice: "মোক দেখুৱাওক কি কৰিব লাগে",
      correct_prefill: "জনোৱা তথ্য চাই লওক",
    },
    situationQuestion: "আপোনাৰ কৰৰ জীৱনৰ বিষয়ে কওক।",
    situationHelp: "ইয়াত দুটা চুটি উত্তৰেই যথেষ্ট।",
    professionLabel: "আপোনাৰ কামক কোনটোৱে আটাইতকৈ ভালকৈ বুজায়?",
    professionOptions: {
      salaried: "দৰমহাৰ চাকৰি",
      self_employed: "ফ্ৰীলান্স বা নিজা কাম",
      business_owner: "ব্যৱসায়ৰ মালিক",
      student: "ছাত্ৰ বা ছাত্ৰী",
      retired: "অৱসৰপ্ৰাপ্ত",
      investor: "বিনিয়োগকাৰী",
      other: "আন কিবা",
    },
    filingHistoryLabel: "আগতে কেতিয়াবা আয়কৰ ৰিটাৰ্ণ ফাইল কৰিছে নেকি?",
    filingHistoryOptions: {
      never: "নাই, এইবাৰেই প্ৰথম",
      once: "এবাৰ-দুবাৰ",
      every_year: "প্ৰতি বছৰে",
    },
    incomeQuestion: "সকলো উৎস মিলাই আপোনাৰ মুঠ আয় প্ৰায় কিমান আছিল?",
    incomeHelp: "এটা সীমা ক'লেই হ'ব। এতিয়াই সঠিক সংখ্যা নালাগে।",
    incomeOptions: {
      none: "কোনো আয় নাই",
      under_4: "₹4 লাখতকৈ কম",
      "4_to_8": "₹4-ৰ পৰা ₹8 লাখ",
      "8_to_12": "₹8-ৰ পৰা ₹12 লাখ",
      "12_to_25": "₹12-ৰ পৰা ₹25 লাখ",
      over_25: "₹25 লাখতকৈ বেছি",
    },
    modeQuestion: "আপুনি কিমানখিনি চাব বিচাৰে?",
    modeHelp: "ই কেৱল আৰম্ভণিটো ঠিক কৰে। যিকোনো সময়তে সলনি কৰিব পাৰিব।",
    modeOptions: {
      simple: {
        label: "মোৰ হৈ কৰি দিয়ক",
        detail: "সৰল কথা, এবাৰত এটা খোজ। বাকীখিনি আমি চাম।",
      },
      full: {
        label: "মোক সকলো দেখুৱাওক",
        detail: "প্ৰতিটো সংখ্যা, প্ৰতিটো নিয়ম, প্ৰতিটো হিচাপ — আৰম্ভণিৰ পৰাই।",
      },
    },
    focusQuestion: "ইয়াৰে কোনবোৰলৈ আমি মন দিম?",
    focusHelp: "আপোনাৰ লগত মিলাবোৰ সকলো বাছক। নিশ্চিত নহ'লে সেয়াও ক'ব পাৰি।",
    focusOptions: {
      salary: "দৰমহা বা পেঞ্চন",
      freelance: "ফ্ৰীলান্স কাম",
      business: "ব্যৱসায়ৰ আয়",
      rent: "মই দিয়া বা পোৱা ভাড়া",
      interest: "বেংকৰ সুত",
      investments: "শ্বেয়াৰ বা বিনিয়োগ",
      deductions: "সঞ্চয়, বীমা, হোম ল'ন বা NPS",
      not_sure: "এতিয়াও নিশ্চিত নহয়",
    },
    chooseOne: "এটা বাছক",
    chooseAtLeastOne: "কমেও এটা বাছক",
    questionsLabel: "খৰতকীয়া ছেটআপ",
    questionsProgress: (current: number, total: number) =>
      `${total}টাৰ ভিতৰত ${current}`,
    savedLocally: "এই প্ৰ'ট'টাইপত আপোনাৰ উত্তৰবোৰ এই ব্ৰাউজাৰতে ছেভ হৈ থাকে।",
    readyTitle: "ইমানেই যথেষ্ট — এতিয়া ই আপোনাৰ নিজৰ দৰে হ'ব।",
    readyBody:
      "এই উত্তৰবোৰেৰে আমি ঠিক কৰিম আপোনাক প্ৰথমে কি দেখুৱাম। ব্যৱস্থাৰ চূড়ান্ত বাছনি হ'ব আপুনি নিশ্চিত কৰা তথ্য আৰু দাবীৰ ভিত্তিতেই।",
    guidedLabel: "আমি কেনেকৈ বুজাম",
    guidedValue: "গৈ থাকোঁতে আমি শব্দবোৰ বুজাই দিম।",
    quickValue: "আমি পথ চুটি ৰাখিম।",
    regimeLabel: "দুয়োটা ব্যৱস্থাক লৈ আমাৰ পথ",
    claimsRegimeValue: "ব্যৱস্থা বাছি লোৱাৰ আগতে আপোনাৰ দাবীবোৰ পৰীক্ষা কৰিম।",
    compareRegimeValue: "তথ্য নিশ্চিত হোৱাৰ পিছত দুয়োটা ব্যৱস্থা তুলনা কৰিম।",
    focusLabel: "প্ৰথমে কিহলৈ মন",
    startPath: "মোৰ পথেৰে আৰম্ভ কৰক",
    changeAnswers: "উত্তৰ সলনি কৰক",
    tailoredBadge: "আপোনাৰ আৰম্ভণিৰ পথ",
    tailoredGuided: "বুজাই বুজাই আগবঢ়া",
    tailoredQuick: "চুটি পথ",
    tailoredRegimeClaims: "ব্যৱস্থাৰ আগতে দাবীৰ পৰীক্ষা",
    tailoredRegimeCompare: "তথ্যৰ পিছত দুয়োটা ব্যৱস্থাৰ তুলনা",
    tailoredIntent: (intent: string) => `প্ৰথমে: ${intent}`,
  },

  checklist: {
    divider: "ফাইল কৰাৰ আগতে",
    itemBefore: "“",
    itemAfter: "” নিশ্চিত কৰক — সন্দেহ থাকিলে কাৰ্ডটো খুলক।",
    stdRow: "আপোনাৰ হৈ আমি প্ৰয়োগ কৰা ষ্টেণ্ডাৰ্ড ৰেহাইটো নিশ্চিত কৰক।",
    noteLocked: "ওপৰৰ প্ৰতিটো শাৰীত টিক দিয়ক, তেতিয়াহে এই বুটাম খুলিব।",
    noteReady: "ওপৰৰ সকলোবোৰ নিশ্চিত হ'ল। সাজু হ'লে ফাইল কৰক।",
    fileBtn: "এই ৰিটাৰ্ণ ফাইল কৰক",
    lockedBtn: (n: number) =>
      n === 1 ? "আগতে আৰু 1টা শাৰীত টিক দিয়ক" : `আগতে আৰু ${n}টা শাৰীত টিক দিয়ক`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `কাৰ্ড ${String(n).padStart(2, "0")} · জনোৱা ${date}`,
    whatThisMeans: "ইয়াৰ অৰ্থ কি",
    readFirst: "প্ৰথমে “ইয়াৰ অৰ্থ কি” খুলক — তাৰ পিছত নিশ্চিত কৰক।",
    readyToConfirm: "পঢ়িলে? তলত নিশ্চিত কৰক।",
  },

  signoff: {
    title: "চূড়ান্ত স্বাক্ষৰ",
    declaration:
      "মই ওপৰৰ সংখ্যাবোৰ পঢ়িছোঁ আৰু উৎস নথিৰ সৈতে মিলাই চাইছোঁ। এইবোৰ শুদ্ধ আৰু সম্পূৰ্ণ।",
    action: "এই সংখ্যাবোৰত স্বাক্ষৰ কৰক",
    signed: "স্বাক্ষৰ হ'ল — ওপৰৰ প্ৰতিটো সংখ্যা নিশ্চিত।",
    hint: "এটা ঘোষণাই ওপৰৰ সকলোবোৰ সামৰি লয়। কোনো সংখ্যাত আপত্তি থাকিলে স্বাক্ষৰৰ আগতে “নহয়, এইটো ভুল” বাছক।",
  },

  channels: {
    sectionLabel: "এক নজৰত বছৰটো",
    earned: "আপুনি উপাৰ্জন কৰিলে",
    toTax: "কৰলৈ গ'ল",
    overpaid: "আপুনি বেছিকৈ দিলে",
    stillToPay: "এতিয়াও দিব লাগিব",
    stayed: "আপোনাৰ পৰা যোৱাই নাই",
    kept: "যিমান কৰ আপোনাৰ হৈছিল",
    back: "আপোনালৈ ঘূৰি আহি আছে",
    yoursInEnd: "শেষত আপোনাৰ",
    collected: "আগতেই সংগ্ৰহ হ'ল",
    ofYear: "বছৰটোৰ টকাৰ",
    sliceNote:
      "চকুত নপৰা সৰু অংশক অলপ বহলকৈ অঁকা হৈছে — কাষৰ সংখ্যাবোৰ একেবাৰে শুদ্ধ।",
    whereItWent: "আপোনাৰ উপাৰ্জনৰ প্ৰতিটো টকা ক'লৈ গ'ল",
    earnedDesc: "দৰমহা, সুত আৰু বাকী সকলো — আপোনাক টকা দিয়াসকলে জনোৱা মতে।",
    toTaxDesc: "পাবলগীয়া প্ৰতিটো ৰেহাইৰ পিছত আপোনাৰ প্ৰকৃততে যিমান কৰ হ'ল।",
    backDesc:
      "আপোনাৰ দৰমহাৰ পৰা লোৱা হৈছিল কিন্তু কেতিয়াও দিবলগীয়া নাছিল। এয়া আপোনালৈ ঘূৰি আহিব।",
    dueDesc: "যি সংগ্ৰহ হ'ল তাৰ বাহিৰৰ বাকী। এয়া এতিয়াও দিব লাগিব।",
    howToRead:
      "ইয়াক এনেদৰে পঢ়ক: ইয়াত একো আমি সজা নাই। প্ৰতিটো সংখ্যা আহিছে কোনোবাই দাখিল কৰা নথিৰ পৰা, নাইবা আপুনি নিজে লিখাৰ পৰা। পেঞ্চিলৰ টোকাবোৰে বুজাই দিয়ে প্ৰতিটোৰ আচল অৰ্থ — সৰল কথাৰে, কৰৰ ভাষাৰে নহয়।",
    meterCap: "যিমান কৰ হ'ল বনাম যি আগতেই সংগ্ৰহ হ'ল",
  },

  agent: {
    title: "ৱাপছি সহায়ক",
    open: "সহায়ক খুলক",
    close: "বন্ধ কৰক",
    placeholder: "পৰীক্ষা, বুজাই দিয়া বা ফাইল কৰিবলৈ কওক…",
    send: "পঠিয়াওক",
    thinking: "কাম চলি আছে…",
    toolRan: "কৰা হ'ল:",
    confirmTitle: "ফাইল কৰিবলৈ সাজু — সংখ্যাবোৰ নিশ্চিত কৰক",
    confirmBody: "আপুনি নিশ্চিত নকৰালৈকে একো ফাইল নহয়। এইখিনিয়েই জমা হ'ব:",
    confirmTotalTax: "মুঠ কৰ",
    confirmRefund: "আপুনি পাবলগীয়া ৰিফাণ্ড",
    confirmDue: "দিবলগীয়া বাকী",
    confirmTaxable: "কৰযোগ্য আয়",
    confirmButton: "নিশ্চিত কৰি ফাইল কৰক",
    cancelButton: "বাতিল কৰক",
    filingDismissed: "ঠিক আছে — একো ফাইল হোৱা নাই।",
    error:
      "সহায়কক পোৱা নগ'ল। আপোনাৰ ৰিটাৰ্ণ যেনেকৈ আছিল তেনেকৈয়ে আছে — আকৌ চেষ্টা কৰক।",
    intro:
      "মই আপোনাৰ ৰিটাৰ্ণ পৰীক্ষা কৰিব পাৰোঁ, যিকোনো সংখ্যা বুজাই দিব পাৰোঁ, নানা সম্ভাৱনাৰ হিচাপ কৰিব পাৰোঁ আৰু ফাইলিঙৰ প্ৰস্তুতি কৰিব পাৰোঁ। কিবা ফাইল হোৱাৰ আগতে সদায় আপুনিয়েই নিশ্চিত কৰিব।",
    sample: "80C-ত ₹1,50,000 ভৰালে মোৰ কিমান ৰাহি হ'লহেঁতেন?",
  },

  footer: {
    prototype: "স্বতন্ত্ৰ ধাৰণা-প্ৰ'ট'টাইপ।",
    notAffiliated:
      "ই আয়কৰ বিভাগ, CBDT বা ভাৰত চৰকাৰৰ সৈতে জড়িত নহয়, তেওঁলোকৰ দ্বাৰা অনুমোদিতও নহয়, সম্পৰ্কিতও নহয়। ইয়াৰ প্ৰতিটো নাম, PAN, পৰিমাণ আৰু নথি সজোৱা। কোনো চৰকাৰী চিষ্টেমৰ সৈতে যোগাযোগ কৰা নহয়।",
    honestyLink: "চাওক ঠিক কি আচল আৰু কি মক",
  },
};

/**
 * Assamese values for the ~90 English keys in LOCALIZED_MOCK_STRINGS
 * (components/mock-i18n.ts). Keys must stay byte-identical to the English
 * strings there. Model-generated; awaiting native-speaker review (T0.5).
 */
export const asMock: Record<string, string> = {
  "Your pay last year": "যোৱা বছৰ আপোনাৰ দৰমহা",
  "Interest your savings account earned": "আপোনাৰ সঞ্চয় একাউণ্টে পোৱা সুত",
  "Interest your accounts earned": "আপোনাৰ একাউণ্টবোৰে পোৱা সুত",
  "Your primary contract income": "আপোনাৰ মুখ্য চুক্তিৰ আয়",
  "Savings interest": "সঞ্চয়ৰ সুত",
  "Tax withheld (TDS)": "আগতে কটা কৰ (TDS)",
  "Provident Fund / ELSS Mutual Funds": "প্ৰভিডেণ্ট ফাণ্ড / ELSS মিউচুৱেল ফাণ্ড",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "তেওঁৰ দৰমহাৰ পৰা ₹8,400 কাটি লোৱা হৈছিল। তেওঁৰ একো দিবলগীয়া নাই। তেওঁ এতিয়াও ফাইল কৰা নাই, আৰু স্কুলৰ মাচুল দিয়াৰ সময় হৈছে।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "দুখন জাননী। এখনে কয় তেওঁ ₹1,10,000 শ্বেয়াৰ-লাভ লুকুৱাইছিল — আচলতে তেওঁৰ ₹4,200 লোকচান হৈছিল। আনখনে 2019-ৰ এনে এটা বিলৰ বাবে তেওঁৰ ৰিফাণ্ডৰ এটা অংশ ৰাখিব বিচাৰে, যাৰ কথা তেওঁ কেতিয়াও শুনাই নাছিল।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 দিনৰ আগতে ফাইল কৰিছিল। প'ৰ্টেলত কেৱল ‘প্ৰক্ৰিয়া চলি আছে’ বুলিহে লিখা আছে, আন একো নাই। আচলতে দুটা বেলেগ কথাই তেওঁৰ ₹34,800 আটকাই ৰাখিছে।",
  "Tax already taken out of your pay": "দৰমহাৰ পৰা আগতেই কটা কৰ (TDS)",
  "Dividend your shares paid out": "আপোনাৰ শ্বেয়াৰৰ পৰা পোৱা লভ্যাংশ",
  "Money from selling shares": "শ্বেয়াৰ বেচি পোৱা টকা",
  "Tax the bank withheld on your interest": "সুতৰ ওপৰত বেংকে কটা কৰ (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "প্ৰভিডেণ্ট ফাণ্ড (PF), বীমা আৰু জীয়েকৰ টিউচন মাচুল",
  "Provident fund and your insurance premium":
    "প্ৰভিডেণ্ট ফাণ্ড (PF) আৰু আপোনাৰ বীমাৰ প্ৰিমিয়াম",
  "Health cover for the family": "পৰিয়ালৰ স্বাস্থ্য বীমা",
  "Rent you paid, with no house-rent allowance from your employer":
    "আপুনি দিয়া ভাড়া, নিয়োগকৰ্তাৰ ঘৰ-ভাড়া ভাট্টা নোহোৱাকৈ",
  "One figure doesn't match what your broker reported.":
    "এটা সংখ্যা আপোনাৰ ব্ৰ'কাৰে জনোৱা হিচাপৰ সৈতে মিলা নাই।",
  "₹18,740 of this is being held against an old bill.":
    "ইয়াৰ ₹18,740 এটা পুৰণি বিলৰ বিনিময়ত আটকাই ৰখা হৈছে।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "বিভাগে ভাবিছে আপুনি ₹1,10,000 শ্বেয়াৰ-লাভ বাদ দিছে।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019-ৰ এটা বিল মিটাবলৈ বিভাগে আপোনাৰ ৰিফাণ্ডৰ পৰা ₹18,740 ৰাখিব বিচাৰে।",
  "Waiting on one thing: a receipt for your rent claim.":
    "এটা কথাৰ অপেক্ষা: আপোনাৰ ভাড়াৰ দাবীৰ এখন ৰচিদ।",
  "The account you chose can't receive the money.":
    "আপুনি বাছি লোৱা একাউণ্টটোৱে টকা ল'ব পৰা নাই।",
  "Held: your rent claim needs a receipt.":
    "আটকি আছে: আপোনাৰ ভাড়াৰ দাবীৰ বাবে ৰচিদ লাগে।",
  "Your bank account was checked and failed.":
    "আপোনাৰ বেংক একাউণ্ট পৰীক্ষা কৰা হৈছিল আৰু সেয়া বিফল হ'ল।",
  "The department is asking you to look again at your rent claim.":
    "বিভাগে আপোনাক ভাড়াৰ দাবীটো আকৌ চাবলৈ কৈছে।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities-এ শ্বেয়াৰ বিক্ৰীৰ পৰা ₹1,10,000 জনাইছে। আপোনাৰ ৰিটাৰ্ণত সেয়া নাই। সেয়া নিমিটালৈকে ৰিফাণ্ড য'ত আছে ত'তেই থাকিব।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20-ৰ এটা দাবী এই বছৰৰ ৰিফাণ্ডৰ সৈতে সমাযোজন কৰা হৈছে। আপুনি ইয়াৰ বিৰোধ কৰিব পাৰে, আৰু 3 তাৰিখৰ আগতে ইয়াক পঢ়ি লোৱা উচিত।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 ছেপ্টেম্বৰৰ ভিতৰত একো নক'লে ₹1,10,000 আপোনাৰ আয়ত যোগ হ'ব আৰু আপোনাৰ ৰিফাণ্ডৰ পৰা প্ৰায় ₹34,300 ওলাই যাব।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 ছেপ্টেম্বৰৰ ভিতৰত একো নক'লে আপোনাৰ ৰিফাণ্ডৰ পৰা ₹18,740 কাটি লোৱা হ'ব আৰু বিষয়টো বন্ধ বুলি ধৰা হ'ব।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "আপুনি ₹1,10,000-ৰ শ্বেয়াৰ বেচিলে আৰু তাৰ লাভ ঘোষণা নকৰিলে।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 হ'ল মই বেচা সকলোবোৰৰ মুঠ মূল্য, মোৰ লাভ নহয়। সেই বেহাবোৰত মোৰ ₹4,200 লোকচান হৈছিল। বছৰটোৰ মোৰ ব্ৰ'কাৰৰ বিৱৰণীত কিনা দাম দেখা যায়।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 বছৰৰ ₹18,740 এতিয়াও আপোনাৰ বাকী আছে, সেয়ে সেয়া এই বছৰৰ ৰিফাণ্ডৰ পৰা লোৱা হ'ব।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "আপুনি ₹60,000 ভাড়াৰ দাবী কৰিছিল। দেখুৱাবলৈ একো সংলগ্ন কৰা নাছিল। এখন ৰচিদ বা ঘৰৰ মালিকৰ নাম আৰু PAN যোগ কৰক, তেতিয়াই এইটো আগবাঢ়িব।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank যোৱা বছৰ Deccan Union Bank-ৰ অংশ হ'ল। একাউণ্টটো এতিয়াও আছে — কিন্তু তালৈ টকা পঠিওৱা ক'ডটো (IFSC) নাই।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "আপুনি 80GG-ৰ অধীনত ₹60,000 ভাড়াৰ দাবী কৰিছিল, সমৰ্থনত একো সংলগ্ন নাছিল।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "মই সঁচাকৈয়ে এই ভাড়া দিছোঁ। ঘৰৰ মালিকৰ পৰা পোৱা মাহেকীয়া ৰচিদ মোৰ ওচৰত আছে, আৰু তেওঁৰ নাম আৰু PAN দিব পাৰোঁ।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "এইটো কোনো অভিযোগ নহয় আৰু এতিয়াও কোনো জৰিমনা নাই। কিন্তু দাবীটোৰ প্ৰমাণ নিদিয়ালৈকে বা তুলি নোলোৱালৈকে আপোনাৰ ₹34,800 য'ত আছে ত'তেই থাকিব।",
  "Look at what they reported": "তেওঁলোকে কি জনালে চাওক",
  "Read the 2019 demand": "2019-ৰ দাবীটো পঢ়ক",
  "Add the receipt": "ৰচিদখন যোগ কৰক",
  "Point it at the right account": "শুদ্ধ একাউণ্টলৈ ঘূৰাই দিয়ক",
  "Supervisor, garment unit": "চুপাৰভাইজাৰ, কাপোৰৰ কাৰখানা",
  "Operations manager; trades equity on the side":
    "অপাৰেশ্বনছ মেনেজাৰ; লগতে শ্বেয়াৰত বেহা কৰে",
  "Junior architect; first time filing": "কনিষ্ঠ স্থপতি; প্ৰথমবাৰ ফাইল কৰিছে",
  "Independent Consultant": "স্বতন্ত্ৰ পৰামৰ্শদাতা",
  "Primary School Teacher": "প্ৰাথমিক বিদ্যালয়ৰ শিক্ষয়িত্ৰী",
  "Retired bank clerk": "অৱসৰপ্ৰাপ্ত বেংক কেৰাণী",
  "Retired": "অৱসৰপ্ৰাপ্ত",
  "Teacher": "শিক্ষক",
  "You sent your return in.": "আপুনি আপোনাৰ ৰিটাৰ্ণ পঠিয়াই দিলে।",
  "You confirmed it was you. The return counts from here.":
    "আপুনি নিশ্চিত কৰিলে এয়া আপুনিয়েই। ৰিটাৰ্ণ ইয়াৰ পৰাই গণ্য হ'ব।",
  "In the queue with everything else filed that week.":
    "সেই সপ্তাহত দাখিল হোৱা আন সকলোবোৰৰ সৈতে শাৰীত।",
  "Someone is looking at one figure.": "কোনোবাই এটা সংখ্যা চাই আছে।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "আপোনাৰ ব্ৰ'কাৰে দাখিল কৰা শ্বেয়াৰ-বিক্ৰীৰ এটা শাৰী আপোনাৰ ৰিটাৰ্ণৰ সৈতে মিলা নাই।",
  "OTP verified, 4 minutes after filing.":
    "OTP সত্যাপন হ'ল, ফাইল কৰাৰ 4 মিনিটৰ পিছত।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG-ৰ অধীনত ₹60,000 দাবী কৰা হৈছে, সমৰ্থনত একো সংলগ্ন নাই।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank-এ পৰীক্ষাটো ঘূৰাই দিলে: IFSC GODG0004417 আৰু ক'লৈকো নাযায়।",
  "OTP Verification Complete": "OTP সত্যাপন সম্পূৰ্ণ",
  "Outstanding Compliance Notices": "বাকী থকা কমপ্লায়েন্স জাননী",
  "Draft Legal Response": "আইনী উত্তৰৰ খচৰা কৰক",
  "No Pending Actions": "কোনো কাম বাকী নাই",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "আপোনাৰ একাউণ্ট সম্পূৰ্ণ নিয়ম-মতে আছে — কোনো বাকী জাননী বা কৰৰ দাবী নাই।",
  "Actionable Assessment Holds": "কাম কৰিব পৰা মূল্যায়ন-হ'ল্ড",
  "Upload Rent Agreement / Receipts": "ভাড়াৰ চুক্তি / ৰচিদ আপল'ড কৰক",
  "Landlord Name": "ঘৰৰ মালিকৰ নাম",
  "Landlord PAN (10 Digits)": "ঘৰৰ মালিকৰ PAN (10 সংখ্যা)",
  "Select PDF/JPG": "PDF/JPG বাছক",
  "Submit Receipt": "ৰচিদ জমা দিয়ক",
  "Response Position": "উত্তৰৰ স্থিতি",
  "I Agree with Department": "মই বিভাগৰ সৈতে একমত",
  "I Disagree (Submit Proof)": "মই একমত নহয় (প্ৰমাণ জমা দিয়ক)",
  "Response Statement (Draft)": "উত্তৰৰ বিবৃতি (খচৰা)",
  "Dictate Statement": "মুখেৰে কৈ লিখাওক",
  "Listening...": "শুনি আছোঁ...",
  "Explain your disagreement or agreement...":
    "আপোনাৰ সন্মতি বা অসন্মতি বুজাই লিখক...",
  "Send Response": "উত্তৰ পঠিয়াওক",
  "Cancel": "বাতিল কৰক",
  "Validate Bank Code": "বেংক ক'ড পৰীক্ষা কৰক",
  "Update Bank IFSC": "বেংক IFSC আপডেট কৰক",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "বেংকৰ বিৱৰণ সত্যাপন কৰিবলৈ 11 সংখ্যাৰ বেংক ৰাউটিং ক'ড (IFSC) পৰীক্ষা কৰক।",
  "IFSC Code": "IFSC ক'ড",
};

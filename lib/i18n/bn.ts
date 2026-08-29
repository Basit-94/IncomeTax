/**
 * বাংলা (Bengali). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and has NOT yet been reviewed by a
 * native Bengali speaker with tax vocabulary. Review is project task T0.5 —
 * until it lands, treat this file as a working draft, not shipping copy.
 *
 * Digits stay Latin. Bengali numerals are correct but money must be
 * instantly legible, so ₹ amounts and every other number use 0-9.
 */

import type { Dict } from "./en";

export const bn: Dict = {
  langName: "Bengali",
  langNativeName: "বাংলা",
  dir: "ltr",

  common: {
    modeSimple: "সহজ",
    modeDetailed: "বিস্তারিত",
    continue: "এগিয়ে যান",
    back: "পিছনে",
    yesThatsRight: "হ্যাঁ, এটা ঠিক",
    noThisIsWrong: "না, এটা ভুল",
    iDontUnderstand: "আমি এটা বুঝতে পারছি না",
    close: "বন্ধ করুন",
    saveAndGoOn: "সংরক্ষণ করে এগিয়ে যান",
    loading: "এক মুহূর্ত",
    logOut: "লগ আউট",
    undo: "ফিরিয়ে নিন",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ওয়াপসি",
    subtitle: "যাচাই আর ফাইল করার সহজ উপায়",
    independent: "স্বাধীন প্রোটোটাইপ",
    taxYear: "কর বছর 2026-27",
    language: "ভাষা",
    light: "লাইট",
    dark: "ডার্ক",
    sandbox: "রিভিউ টুল",
  },

  validate: {
    panTooShort: (n: number) => `এখন পর্যন্ত ${n}টি অক্ষর। PAN-এ থাকে 10টি।`,
    panShape:
      "PAN-এ প্রথমে পাঁচটি অক্ষর, তারপর চারটি সংখ্যা, শেষে একটি অক্ষর — যেমন DEMPS4417K।",
    panSandboxHint:
      "আপনি এখানে যা লেখেন তা আপনার ব্রাউজারের বাইরে যায় না। এই প্রোটোটাইপে প্রতিটি PAN DEMP দিয়ে শুরু হয়, তাই ভুল করে কোনো আসল PAN খোঁজা সম্ভব নয়।",
    ifscTooShort: (n: number) => `এখন পর্যন্ত ${n}টি অক্ষর। ব্যাংক কোডে থাকে 11টি।`,
    ifscShape:
      "ব্যাংক কোডে প্রথমে চারটি অক্ষর, তারপর একটি শূন্য, তারপর আরও ছয়টি — যেমন DECU0834471।",
  },

  landing: {
    question: "আয়কর বিভাগের কাছে কি আপনার টাকা আটকে আছে?",
    subtext:
      "এখানে যাঁরা আসেন তাঁদের বেশিরভাগেরই কিছু দেওয়ার নেই — বরং পাওনা আছে। আপনার PAN দিন, আমরা বলে দেব কী আছে।",
    panLabel: "আপনার PAN",
    panHelp: "দশটি অক্ষর, আপনার PAN কার্ড থেকে",
    panPlaceholder: "যেমন, DEMPS4417K",
    check: "দেখুন আমার কত পাওনা",
    orTryAs: "অথবা তিনজনের কারও একজন হয়ে ঘুরে দেখুন",
    honestyLink: "এখানে কোনটা আসল আর কোনটা বানানো",
    architectureLink: "প্রযুক্তিগত গঠন",
    badge: "সরল রিটার্ন, প্রমাণিত",
    brandTitle: "আপনার টাকা, ফেরার পথে।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ফাইল করা",
      blurb:
        "তাঁর বেতন থেকে ₹8,400 কেটে নেওয়া হয়েছে। তাঁর কিছু দেওয়ার নেই, তিনি ফাইল করেননি, আর স্কুলের ফি দেওয়ার সময় এসে গেছে।",
      action: "যা আগে থেকেই জানা, তা নিশ্চিত করুন",
    },
    rakesh: {
      phase: "একটা চিঠি এসেছে",
      blurb:
        "চিঠিতে লেখা তিনি শেয়ারের ₹1,10,000 মুনাফা লুকিয়েছেন। এক পুরোনো দাবির বদলে তাঁর ফেরত আটকে রাখা হয়েছে, যার কথা তাঁকে কখনও জানানোই হয়নি।",
      action: "পড়ুন আর দ্বিমত জানান",
    },
    priya: {
      phase: "অপেক্ষা",
      blurb:
        "71 দিন আগে ফাইল করেছেন। এখনও লেখা প্রক্রিয়াধীন। আসলে দুটো জিনিস আটকে রেখেছে, আর কেউ বলেনি কোনগুলো।",
      action: "দেখুন কী আটকে রেখেছে",
    },
    custom: {
      phase: "নিজে বানিয়ে দেখুন",
      blurbTitle: "বানানো একজন",
      blurb:
        "শূন্য থেকে একজন মানুষ তৈরি করুন — তাঁর আয়, তাঁর দাবি, কত কর কাটা হয়েছে — আর দেখুন হিসাব নিজে থেকেই মিলে যায়।",
      action: "কাউকে বানিয়ে নিন",
    },
  },

  login: {
    authVerifying: "সার্ভারের সঙ্গে যাচাই চলছে…",
    authUnreachable:
      "সাইন-ইন সার্ভারে পৌঁছানো গেল না। আপনার লেখা কিছুই হারায়নি — একটু পরে আবার চেষ্টা করুন।",
    authRejected: (detail: string) => `সার্ভার সাইন ইন করতে দেয়নি: ${detail}`,
    signedInAs: "সাইন ইন হয়েছে — সেশন চালু",
    otpSentTo: (mobile: string) => `আমরা ${mobile} নম্বরে একটি কোড পাঠিয়েছি`,
    otpLabel: "ছয় অঙ্কের কোড",
    weWillWait:
      "তাড়াহুড়োর কিছু নেই। কোডের অপেক্ষায় থাকার সময় আপনার লেখা কিছুই হারাবে না।",
    resend: "আবার পাঠান",
    resendIn: (seconds: number) => `${seconds} সেকেন্ড পরে আবার চাইতে পারবেন`,
    mockNotice:
      "এটি একটি প্রোটোটাইপ, তাই কোডটি স্ক্রিনেই দেখানো হয়েছে। কোনো আসল বার্তা পাঠানো হয় না।",
    portalHeading: "ই-ফাইলিং যাচাই",
    incorrectCode: "এই কোড মিলছে না। ছয়টি অঙ্ক আবার দেখে চেষ্টা করুন।",
    prototypeBox: "প্রোটোটাইপ OTP যাচাই",
    mockCodeLabel: "মক কোড",
    autoFill: "আমার হয়ে ভরে দাও",
    verifyEnter: "যাচাই করে ভিতরে যান",
    draftRestored: (time: string) =>
      `${time}-এ সংরক্ষিত আপনার খসড়া ফিরিয়ে আনা হয়েছে। কিছুই হারায়নি।`,
  },

  file: {
    heading: (amount: string) => `আপনার ${amount} বিভাগের কাছে পড়ে আছে`,
    subheading:
      "নিচের প্রায় সবকিছুই আপনার সম্পর্কে আগে থেকেই জানানো আছে। পড়ুন, আর কিছু ভুল থাকলে আমাদের বলুন।",

    checkThis: "এটা মিলিয়ে দেখুন — ভরতে হবে না",
    factMeaning:
      "এটি আগে থেকে জানানো একটি তথ্য, করের নিয়ম নয়। নিচের হিসাব এটি থেকেই তৈরি হয়।",
    factMeaningByKind: {
      salary:
        "আপনার কাছে পৌঁছানো বেতন থেকে আপনার নিয়োগকর্তা এটি জানিয়েছেন। নিচের সব হিসাব এখান থেকেই শুরু।",
      interest:
        "ব্যাংক বছরে একবার আপনার অ্যাকাউন্টের অর্জিত সুদ জানায়। ছোট অঙ্কও আয়।",
      dividend:
        "কোম্পানির রেজিস্ট্রার জানিয়েছেন আপনার শেয়ার কত দিয়েছে। যে বছরে পাওয়া, সেই বছরের আয় হিসেবে গোনা হয়।",
      capital_gains:
        "আপনার ব্রোকার শেয়ার বিক্রির টাকা জানিয়েছেন। কর লাগে লাভের ওপর — হার নির্ভর করে কী বেচেছেন আর কত দিন ধরে রেখেছিলেন তার ওপর।",
      rent:
        "পাওয়া ভাড়া আয়; দেওয়া ভাড়া কর কমাতে পারে। দুটোই অন্য পক্ষের জানানো হিসাবের সঙ্গে মিলতে হবে।",
      other:
        "এমন জানানো আয় যা অন্য কোনো ঘরে পড়ে না। এটিও নিচের হিসাবে যোগ হয়।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ${date} তারিখে বিভাগকে এটি জানিয়েছে`,
    underIdentifier: (identifier: string) => `নিবন্ধন ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `এটি ভুল হলে মূল জায়গায় কেবল ${reporter}-ই বদলাতে পারে। তাদের কাছে ঠিক কী চাইতে হবে, আমরা বলে দেব।`,

    whatYouEarned: "আপনি কত আয় করেছেন",
    whatWasDeducted: "কর আগেই কত কাটা হয়েছে",
    whereMoneyGoes: "টাকা কোথায় যাবে",
    whoYouAre: "আপনি কে",

    disputeHeading: "এখানে কী লেখা থাকা উচিত?",
    disputeAmountLabel: "সঠিক অঙ্ক",
    disputeReasonLabel: "কেন ভুল",
    disputeSave: "এটিকে ভুল বলে চিহ্নিত করুন",
    selfReported: "আপনি",
    returnLabel: "আপনার রিটার্ন",

    outcomeOwesNothing: "আপনার কিছু দেওয়ার নেই।",
    outcomeRefund: (amount: string) => `${amount} আপনার কাছে ফিরে আসবে।`,
    outcomeOwes: (amount: string) => `${amount} দেওয়া বাকি আছে।`,
    confirmAndFile: "এটি পাঠিয়ে দিন",

    verifyHeading: "আর একটি ধাপ বাকি, নইলে এটি গোনা হবে না।",
    verifyBody:
      "আপনি যে আপনিই, তা নিশ্চিত না করা পর্যন্ত আপনার রিটার্ন দাখিল হয়নি — যেন পাঠানোই হয়নি। এতে প্রায় কুড়ি সেকেন্ড লাগে।",
    verifyAction: "নিশ্চিত করুন এটা আমি",

    voicePrompt: "অথবা মুখে বলুন",
    voiceListening: "শুনছি",
    voiceUnsupported:
      "এই ফোনের ব্রাউজার এখনও শুনতে পারে না। আপনি লিখেও জানাতে পারেন — কিছুই হারাবে না।",
    voiceSimulated:
      "এই ব্রাউজার শুনতে পারে না, তাই এটি একটি উদাহরণ, আপনার কণ্ঠ নয়।",
    voiceError: "শোনা গেল না। আপনি লিখেও জানাতে পারেন — কিছুই হারাবে না।",
    dictate: "মুখে বলুন (ভয়েস)",
    disputePlaceholder: "এই অঙ্কটি কেন ভুল — লিখুন বা বলুন।",
    disputeDefaultReason: "জানানো অঙ্কটি ভুল",
  },

  flow: {
    facts: "আপনার টাকা",
    deductions: "যে টাকা আপনি দাবি করতে পারেন",
    regime: "পুরোনো না নতুন",
    check: "মিলিয়ে নিন",
    file: "পাঠিয়ে দিন",
    stepOf: (n: number, total: number) => `ধাপ ${n}, মোট ${total}`,
    confirmedCount: (done: number, total: number) =>
      `${total}টির মধ্যে ${done}টি নিশ্চিত`,
    allConfirmed: "সব ঠিকঠাক আছে।",
    undoOne: "এই সংশোধন ফিরিয়ে নিন",
    correctedTo: (amount: string) => `আপনি বলছেন এটি হওয়া উচিত ${amount}`,
  },

  groups: {
    moneyIn: "যে টাকা আসছে",
    taxPaid: "আপনার হয়ে আগেই দেওয়া কর",
    deductionsClaimed: "আপনার দাবি করা ছাড়",
    fromWhere: "এটি কোথা থেকে এল",
    addIncome: "আয় যোগ করুন",
  },

  deductions: {
    notAllowedNewRegime: "নতুন ব্যবস্থায় গোনা হয় না — আপনার রেকর্ডে রাখা আছে।",
    startedAtCap: (amount: string) =>
      `আমরা এটি ${amount}-এর সীমা থেকে শুরু করেছি — আসলে যা দিয়েছেন তা “কত” ঘরে লিখুন।`,
    heading: "যে টাকা আপনি দাবি করতে পারেন",
    sub: "এগুলো নিজে থেকে হয় না। আপনাকে হ্যাঁ বলতে হয় — তবে কেবল সত্যি হলে।",
    claimedHeading: "আপনার রিটার্নে আগে থেকেই আছে",
    worthUpTo: (amount: string) =>
      `আপনার করযোগ্য আয় থেকে ${amount} পর্যন্ত কমাতে পারে`,
    worthWhatYouPaid: "যতটা সত্যিই দিয়েছেন ততটাই — আসল অঙ্কটি দাবি করুন",
    askRentQ: "আপনি কি থাকার জন্য ভাড়া দেন?",
    askRentWhy:
      "আপনি ভাড়া দিলে আর নিয়োগকর্তার কাছ থেকে বাড়িভাড়া ভাতা না পেলে, তার একটি অংশ আপনার করযোগ্য আয় থেকে কমতে পারে।",
    askHealthQ: "পরিবারের স্বাস্থ্যবিমার টাকা কি আপনি দেন?",
    askHealthWhy:
      "পরিবারের বিমা চালু রাখতে আপনি যা দেন, তা আপনার করযোগ্য আয় থেকে কমতে পারে।",
    ask80cQ: "আপনি কি প্রভিডেন্ট ফান্ড, জীবনবিমা বা স্কুলের টিউশন ফি-তে টাকা রাখেন?",
    ask80cWhy:
      "এমন দীর্ঘমেয়াদি সঞ্চয় একটি মিলিত সীমায় গোনা হয়, আর যতটা রাখেন ততটা আপনার করযোগ্য আয় থেকে কমে।",
    claimIt: "হ্যাঁ — এটি দাবি করব",
    skipIt: "না — এটি বাদ দিন",
    amountLabel: "কত",
    evidenceAttached: "প্রমাণ যুক্ত আছে",
    evidenceMissing:
      "এখনও কোনো প্রমাণ যোগ হয়নি — আপাতত ঠিক আছে। রসিদগুলো রেখে দিন; বিভাগ পরে চাইতে পারে।",
    newRegimeNoEffect:
      "নতুন ব্যবস্থায় এই দাবিতে কিছু বদলায় না — সেখানে এটি ধরা হয় না।",
    oldRegimeSaves: (amount: string) =>
      `পুরোনো ব্যবস্থায় এটি আপনার কর প্রায় ${amount} কমিয়ে দিত।`,
  },

  regime: {
    heading: "কর দেওয়ার দুটি পথ আছে। একটি আপনার জন্য ভালো।",
    newRegimeName: "নতুন ব্যবস্থা",
    oldRegimeName: "পুরোনো ব্যবস্থা",
    refundLabel: "আপনার কাছে ফিরবে",
    dueLabel: "দেওয়া বাকি",
    recommendedBadge: "আপনার জন্য ভালো",
    reasoningOldDeductions: (x: string, y: string) =>
      `আপনার ছাড় মিলিয়ে ${x}, তাই পুরোনো ব্যবস্থা আপনাকে প্রায় ${y} বাঁচায়।`,
    reasoningNewDefault: (y: string) =>
      `আপনার ছাড়ে এখানে বিশেষ লাভ হত না, তাই নতুন ব্যবস্থার কম হারে আপনার প্রায় ${y} বাঁচে।`,
    acceptRecommendation: "আমার জন্য যেটা ভালো, সেটাই নিন",
    overrideNote: "আপনি যেকোনোটি বেছে নিতে পারেন। এখানে কিছুই লুকানো বা আটকানো নেই।",
  },

  check: {
    newRegimeClaimsZero:
      "আপনার দাবিগুলো তালিকায় আছে আর নিরাপদ — নতুন ব্যবস্থা সেগুলো ধরে না বলেই এই লাইনটি ₹0।",
    badgeReportedBy: (reporter: string) => `${reporter} জানিয়েছে`,
    badgeYouEntered: "আপনি লিখেছেন",
    badgeWeApplied: "আমরা আপনার হয়ে প্রয়োগ করেছি",
    heading: "পুরো রিটার্ন, এক পাতায়",
    sub: "প্রতিটি সংখ্যা কোথাও না কোথাও থেকে এসেছে। যেকোনো লাইন খুলে দেখুন ঠিক কোথা থেকে।",
    grossIncome: "যা কিছু এসেছে",
    standardDeduction: "স্ট্যান্ডার্ড ছাড়",
    deductionsLine: "আপনার করা দাবি",
    taxableIncome: "যে আয়ের ওপর সত্যিই কর লাগে",
    slabTax: "কোনো রেহাইয়ের আগের কর",
    rebate87A: "যে রেহাই এর কিছুটা বাতিল করে দেয়",
    cess: "স্বাস্থ্য ও শিক্ষা উপকর",
    totalTax: "বছরের মোট কর",
    tdsCredits: "আপনার কাছ থেকে আগেই কাটা হয়েছে",
    refundDue: "আপনার কাছে ফিরবে",
    balanceDue: "দেওয়া বাকি",
    openLine: "দেখুন এটি কোথা থেকে এল",
    closeLine: "লুকান",
    calculationStatus:
      "এটি প্রোটোটাইপের হিসাব — নিয়মের উৎস এখনও প্রাথমিক উৎস থেকে যাচাই বাকি (TODO(verify))।",
    calculationTrail: (amount: string) =>
      `${amount} নিচের নিশ্চিত করা তথ্য আর কর ক্রেডিট থেকে হিসাব করা হয়েছে। এই প্রোটোটাইপে উৎস রেকর্ডগুলো বানানো।`,
    showCalculationTrail: "উৎস আর হিসাবের ধারা দেখুন",
    hideCalculationTrail: "উৎস আর হিসাবের ধারা লুকান",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} তারিখে জানানো`,
    sourceIdentifier: (identifier: string) => `রেকর্ড ${identifier}`,
    selfReportedSource: "এই রিটার্নে আপনি নিজে জানিয়েছেন",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: রিপোর্টকারী সংস্থাগুলোর কাছ থেকে পাওয়া তথ্যের বার্ষিক বিবরণী।"
        : statement === "26AS"
        ? "Form 26AS: আপনার PAN-এর বিপরীতে জানানো কর ক্রেডিটের বিবরণী।"
        : "এই তথ্যের সঙ্গে যুক্ত একটি উৎস রেকর্ড।",
    sectionMeaning: (section: string) =>
      `${section} একটি কর-ছাড়ের ধারা। এই ব্যবস্থা অনুমতি দিলে তবেই এটি গোনা হয়।`,
    explainGross: "আপনার দেখে নিশ্চিত করা তথ্যগুলো যোগ করে।",
    explainStd: (amount: string) =>
      `বেতনের আয় থাকা প্রত্যেকে কিছু দাবি না করেই ${amount} ছাড় পান।`,
    explainDeductions: "কেবল এই ব্যবস্থায় অনুমোদিত দাবিগুলোই গোনা হয়।",
    explainDisallowed: (section: string) =>
      `${section} এই ব্যবস্থায় অনুমোদিত নয়, তাই এখানে এর কোনো প্রভাব নেই।`,
    explainTaxable: "যা এসেছে, তা থেকে স্ট্যান্ডার্ড ছাড় আর আপনার দাবিগুলো বাদ দিয়ে।",
    explainSlab: "কর ধাপে ধাপে লাগে — আয়ের প্রতিটি ধাপে তার নিজের হার।",
    explainRebate: (amount: string) =>
      `একটি সীমার নিচে বেশিরভাগ কর বাতিল হয়ে যায় — এখানে তার ${amount}।`,
    explainCess: "প্রতিটি রেহাইয়ের পরে ওপরে যোগ হওয়া ছোট একটি শতাংশ।",
    explainTds:
      "TDS মানে উৎসে কাটা কর: যিনি আপনাকে টাকা দিয়েছেন, তিনি টাকা আপনার কাছে পৌঁছানোর আগেই এটি কেটে রেখেছেন।",
    fromFacts: "এই তথ্যগুলো থেকে:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "পাঠানোর জন্য তৈরি?",
    sub: "একবার চলে গেলে বদলাতে হলে আবার ফাইল করতে হয়। আর একবার দেখে নিন, তারপর পাঠান।",
    stepChecking: "হিসাব মিলিয়ে দেখা হচ্ছে…",
    stepSealing: "সংখ্যাগুলো সিল করা হচ্ছে…",
    stepFiled: "দাখিল হয়ে গেছে।",
    ackHeading: "জমা পড়ে গেছে।",
    ackBody:
      "আপনার রিটার্ন আজ থেকে গোনা হবে। একটি ধাপ বাকি: জিজ্ঞেস করা হলে নিশ্চিত করা যে এটা সত্যিই আপনি। তার আগে পর্যন্ত এটি না-পাঠানো হিসেবেই ধরা হবে।",
    ackNext:
      "তারপর ট্র্যাকার ঠিকঠাক দেখাবে আপনার টাকা কোথায় আছে আর কী তা আটকাতে পারে।",
    errorCause: "স্যান্ডবক্সের fault সুইচ চালু থাকায় যাচাইয়ের ধাপ আটকে গেছে।",
    errorAction:
      "রিভিউয়ার ড্রয়ারে 'Trigger API Gateway Timeout' বন্ধ করুন, তারপর আবার পাঠান। কিছুই হারায়নি।",
    errorCauseNetwork: "আপনার রিটার্ন সার্ভারে পৌঁছায়নি।",
    errorActionNetwork:
      "কিছুই দাখিল হয়নি, কিছুই হারায়নি। সংযোগ দেখে নিয়ে আবার পাঠান।",
    retry: "আবার পাঠানোর চেষ্টা করুন",
  },

  wizard: {
    identityNextHint: "এগোতে আপনার পুরো নাম আর 10 অক্ষরের PAN লিখুন।",
    employmentConfirmHint: "আপনার আগের উত্তর থেকে — বদলে থাকলে অন্য বিকল্পে চাপ দিন।",
    tdsZeroWarning:
      "বেতনের চাকরিতে প্রায় সবসময়ই কর আগে থেকে কাটা থাকে — আপনার ফর্ম 16 বা বেতনের স্লিপে তা আছে। এখানে 0 লেখা মানে প্রায়ই নিজের ফেরত ছেড়ে দেওয়া।",
  },

  timeline: {
    filed: "আপনি আপনার রিটার্ন পাঠিয়ে দিয়েছেন।",
    verified: "আপনি নিশ্চিত করেছেন এটা আপনিই। রিটার্ন এখান থেকেই গোনা হবে।",
    in_queue: "সেই সপ্তাহে দাখিল হওয়া আর সবকিছুর সঙ্গে সারিতে।",
    under_review: "এখন কেউ এটি দেখছেন।",
    determined: "সিদ্ধান্ত হয়ে গেছে — এটিই ফিরে আসছে।",
    sent_to_bank: "আপনার ব্যাংকে পাঠানো হয়েছে।",
    credited: "আপনার অ্যাকাউন্টে।",
  },

  refund: {
    heading: (amount: string) => `${amount} আপনার পথে আসছে`,
    filedDaysAgo: (days: number) => `আপনি ${days} দিন আগে ফাইল করেছেন`,

    holdsHeading: (n: number) =>
      n === 1 ? "একটি জিনিসের অপেক্ষা" : `${n}টি জিনিসের অপেক্ষা`,
    clearsInDays: (days: number) =>
      days === 1 ? "সেটা হয়ে গেলে প্রায় এক দিন" : `সেটা হয়ে গেলে প্রায় ${days} দিন`,

    cohortWindow: (from: number, to: number) =>
      `আপনার সপ্তাহেই দাখিল হওয়া রিটার্নগুলো এখন প্রক্রিয়ায় আছে। ${from} থেকে ${to} দিন লাগতে পারে।`,

    states: {
      not_filed: "এখনও পাঠানো হয়নি",
      filed_unverified: "পাঠানো হয়েছে, আপনার নিশ্চিত করার অপেক্ষায়",
      verified: "আপনি নিশ্চিত করেছেন",
      in_queue: "সারিতে আছে",
      under_review: "কেউ এটি দেখছেন",
      determined: "সিদ্ধান্ত হয়ে গেছে",
      sent_to_bank: "আপনার ব্যাংকে পাঠানো হয়েছে",
      credited: "আপনার অ্যাকাউন্টে ঢুকে গেছে",
      failed: "আপনার অ্যাকাউন্টে পৌঁছাতে পারেনি",
    },

    bankFailedHeading: "আপনার বেছে নেওয়া অ্যাকাউন্টটি টাকা নিতে পারছে না।",
    bankMergedInto: (bank: string) => `সেই শাখা এখন ${bank}-এর অংশ`,
    useThisAccount: "বরং এখানে পাঠান",
    resolvedHold: "মিটে গেছে — এটি আর কিছু আটকে রাখছে না।",
    stampFiled: "দাখিল",
  },

  notices: {
    heading: "বিভাগ থেকে আসা চিঠি",
    none: "কিছুই ফেরত আসেনি। এটাই ভালো খবর।",
    respondBy: (date: string) => `${date}-এর মধ্যে উত্তর দিন`,
    ifYouDoNothing: "আপনি কিছু না করলে",
    basedOn: "এটি কীসের ভিত্তিতে",
    theCatch: "তারা কোথায় ভুল করেছে",
    agree: "এটা ঠিক",
    disagree: "এটা ভুল",
    dinLabel: "এই চিঠির রেফারেন্স নম্বর",
    dinExplain:
      "বিভাগের প্রতিটি চিঠিতে এই নম্বর থাকা বাধ্যতামূলক। এটি ছাড়া চিঠিটি আনুষ্ঠানিকভাবে অস্তিত্বহীন।",
  },

  dashboard: {
    serverFilings: "সার্ভারে নথিভুক্ত",
    serverFilingsEmpty:
      "লাইভ সার্ভারে এই PAN-এর কোনো দাখিল রিটার্ন নেই — ওপরের প্রাপ্তিস্বীকারটি সাজানো গল্পের অংশ। এই অ্যাপ থেকে দাখিল করলে আসল রসিদ এখানে আসবে।",
    greetingLabel: "আপনার সাইন-ইন বাক্য",
    greetingWhy:
      "অ্যাকাউন্ট খোলার সময় আপনি এই বাক্যটি বেছেছিলেন। যে পাতা এটি দেখাতে পারে না, সেটি আমরা নই।",
    userDashboard: "ইউজার ড্যাশবোর্ড",
    taxPrefills: "করের তথ্য (AIS/26AS)",
    pendingActions: "বাকি কাজ",
    returnSummary: "রিটার্ন সারসংক্ষেপ AY 2026-27",
    reviewPrefill:
      "করের তথ্য ট্যাবে আগে থেকে ভরা বিবরণ দেখে নিন, তারপর দাখিলের জন্য নিশ্চিত করুন।",
    filingSubmitted:
      "আপনার ই-ফাইলিং রিটার্ন জমা পড়েছে। টাইমলাইনে অগ্রগতি দেখুন।",
    verifiedBanks: "ফেরতের জন্য যাচাই করা ব্যাংক অ্যাকাউন্ট",
    primaryRefundAccount: "মূল ফেরতের অ্যাকাউন্ট",
    backupAccount: "ব্যাকআপ অ্যাকাউন্ট",
    ifscMeaning: "IFSC হল ফেরত পাঠাতে ব্যবহৃত 11 অক্ষরের ব্যাংক রাউটিং কোড।",
    refundTimeline: "ফেরতের টাইমলাইন",
    filingSubmittedTimeline: "রিটার্ন জমা পড়েছে",
    identityVerifiedTimeline: "পরিচয় যাচাই হয়েছে",
    assessmentProcessingTimeline: "মূল্যায়ন চলছে",
    refundApprovedTimeline: "ফেরত মঞ্জুর হয়েছে",
    refundCreditedTimeline: "ফেরত জমা পড়েছে",
    holdActive: "আটক চালু: অ্যাকশন ট্যাবে কাজগুলো সারুন",
    successCheckApp: "সফল! আপনার ব্যাংকিং অ্যাপ দেখুন।",
    outstandingNotices: "বকেয়া কমপ্লায়েন্স নোটিশ",
    noPendingActions: "কোনো কাজ বাকি নেই",
    accountCompliant:
      "আপনার অ্যাকাউন্ট পুরোপুরি নিয়ম মেনে আছে — কোনো বকেয়া নোটিশ বা করের দাবি নেই।",
    actionableHolds: "যেসব মূল্যায়ন-আটক নিয়ে কাজ করা যায়",
    uploadRent: "ভাড়ার চুক্তি / রসিদ আপলোড করুন",
    landlordName: "বাড়িওয়ালার নাম",
    landlordPan: "বাড়িওয়ালার PAN (10 অঙ্ক)",
    selectPdfJpg: "PDF/JPG বেছে নিন",
    submitReceipt: "রসিদ জমা দিন",
    responsePosition: "জবাবের অবস্থান",
    agreeDept: "আমি বিভাগের সঙ্গে একমত",
    disagreeProof: "আমি একমত নই (প্রমাণ জমা দিন)",
    responseDraft: "জবাবের বিবৃতি (খসড়া)",
    dictateStatement: "মুখে বলে লেখান",
    sendResponse: "জবাব পাঠান",
    filingStatusLabel: "ফাইলিংয়ের অবস্থা",
    bankValidated: "যাচাই হয়েছে",
    bankUnderProcess: "প্রক্রিয়া চলছে",
    bankFailed: "ব্যর্থ",
    staleIfscHold: "এই ব্যাংক কোড আর কোথাও যায় না।",
    switchToNewIfsc: (ifsc: string) => `নতুন কোডে বদলান (${ifsc})`,
    personalized: {
      eyebrow: "আপনার ড্যাশবোর্ড",
      headingFiled: "আপনার রিটার্ন জমা পড়ে গেছে — এই যে তার অবস্থা",
      heading: {
        file_return: "চলুন আপনার রিটার্ন তৈরি করি",
        check_refund: "চলুন দেখি কী ফিরে আসতে পারে",
        understand_notice: "চলুন যা নজর দরকার তা সামলাই",
        correct_prefill: "চলুন জানানো তথ্যগুলো দেখে নিই",
      },
      guidedBody: "প্রতিটি সংখ্যা নিশ্চিত করার আগে আমরা তার মানে বুঝিয়ে দেব।",
      quickBody: "পথ ছোট রাখব আর পরের সিদ্ধান্তটাই আগে রাখব।",
      unfiledBody: "প্রথমে, আপনার সম্পর্কে আগে থেকে জানানো তথ্য নিশ্চিত করুন।",
      filedBody: "আপনি যে কাজে এসেছেন, তার সঙ্গে সবচেয়ে মেলে এমন অংশটাই আমরা খুলে দিয়েছি।",
      primaryAction: {
        facts: "আমার জানানো তথ্য দেখব",
        overview: "আমার ফেরতের ট্র্যাকার দেখান",
        statement: "জানানো তথ্য দেখুন",
        actions: "কী নজর দরকার দেখান",
      },
      focusLabel: "আমরা যেদিকে নজর রাখব",
      profileLabels: {
        work: "কাজ",
        income: "আনুমানিক মোট আয়",
        history: "ফাইলিংয়ের অভিজ্ঞতা",
      },
    },
  },

  onboarding: {
    eyebrow: "শুরুর আগে",
    title: "চলুন এটি আপনার জন্য সাজিয়ে নিই।",
    intro:
      "পাঁচটি ছোট উত্তর আমাদের সঠিক ভাষা, গতি আর করের প্রশ্ন বেছে নিতে সাহায্য করবে। পরে এগুলো বদলাতে পারবেন।",
    languageQuestion: "আমরা কোন ভাষায় কথা বলব?",
    languageHelp: "এটাই আমাদের প্রথম প্রশ্ন। ভাষা আপনি যেকোনো সময় বদলাতে পারেন।",
    intentQuestion: "আজ আপনি কী কারণে এসেছেন?",
    intentHelp: "সেই কাজটাই আমরা সবার আগে রাখব।",
    intentOptions: {
      file_return: {
        label: "এ বছরের রিটার্ন ফাইল করব",
        detail: "আপনার সম্পর্কে যা আগে থেকে জানা, সেখান থেকেই শুরু করুন।",
      },
      check_refund: {
        label: "দেখব আমার কোনো টাকা পাওনা কি না",
        detail: "কী জানানো হয়েছে, কী দেওয়া হয়েছে, আর কী ফিরে আসতে পারে, দেখুন।",
      },
      understand_notice: {
        label: "একটি চিঠি বা নোটিশ বুঝব",
        detail: "তাতে কী লেখা, কী ঝুঁকিতে আছে, আর এরপর কী করতে হবে, দেখুন।",
      },
      correct_prefill: {
        label: "ভুল দেখাচ্ছে এমন কিছু ঠিক করব",
        detail: "সংখ্যাটির উৎস খুঁজুন আর কী বদলানো উচিত তা লিখে রাখুন।",
      },
    },
    intentCta: {
      file_return: "আমার রিটার্ন শুরু করুন",
      check_refund: "দেখুন আমার কত পাওনা",
      understand_notice: "আমাকে দেখান কী করতে হবে",
      correct_prefill: "জানানো তথ্য দেখে নিন",
    },
    situationQuestion: "আপনার করের জীবন সম্পর্কে বলুন।",
    situationHelp: "এখানে দুটি ছোট উত্তরই যথেষ্ট।",
    professionLabel: "আপনার কাজকে কোনটি সবচেয়ে ভালো বোঝায়?",
    professionOptions: {
      salaried: "বেতনের চাকরি",
      self_employed: "ফ্রিল্যান্স বা স্বনিযুক্ত",
      business_owner: "ব্যবসার মালিক",
      student: "ছাত্র বা ছাত্রী",
      retired: "অবসরপ্রাপ্ত",
      investor: "বিনিয়োগকারী",
      other: "অন্য কিছু",
    },
    filingHistoryLabel: "আগে কি কখনও আয়কর রিটার্ন ফাইল করেছেন?",
    filingHistoryOptions: {
      never: "না, এই প্রথম",
      once: "এক-দুবার",
      every_year: "প্রতি বছর",
    },
    incomeQuestion: "সব উৎস মিলিয়ে আপনার মোট আয় মোটামুটি কত ছিল?",
    incomeHelp: "একটা সীমা বললেই চলবে। এখনই সঠিক সংখ্যা লাগবে না।",
    incomeOptions: {
      none: "কোনো আয় নেই",
      under_4: "₹4 লাখের কম",
      "4_to_8": "₹4 থেকে ₹8 লাখ",
      "8_to_12": "₹8 থেকে ₹12 লাখ",
      "12_to_25": "₹12 থেকে ₹25 লাখ",
      over_25: "₹25 লাখের বেশি",
    },
    modeQuestion: "আপনি কতটা দেখতে চান?",
    modeHelp: "এটি শুধু শুরুটা ঠিক করে। যেকোনো সময় বদলাতে পারবেন।",
    modeOptions: {
      simple: {
        label: "আমার হয়ে করে দাও",
        detail: "সহজ কথা, একবারে এক ধাপ। বাকিটা আমরা সামলাব।",
      },
      full: {
        label: "আমাকে সব দেখাও",
        detail: "প্রতিটি সংখ্যা, প্রতিটি নিয়ম, প্রতিটি হিসাব — শুরু থেকেই।",
      },
    },
    focusQuestion: "এর মধ্যে কোনগুলোতে আমরা নজর দেব?",
    focusHelp: "যেগুলো আপনার সঙ্গে মেলে সব বেছে নিন। নিশ্চিত না হলে সেটা বলাও ঠিক আছে।",
    focusOptions: {
      salary: "বেতন বা পেনশন",
      freelance: "ফ্রিল্যান্স কাজ",
      business: "ব্যবসার আয়",
      rent: "আমার দেওয়া বা পাওয়া ভাড়া",
      interest: "ব্যাংকের সুদ",
      investments: "শেয়ার বা বিনিয়োগ",
      deductions: "সঞ্চয়, বিমা, হোম লোন বা NPS",
      not_sure: "এখনও নিশ্চিত নই",
    },
    chooseOne: "একটি বেছে নিন",
    chooseAtLeastOne: "অন্তত একটি বেছে নিন",
    questionsLabel: "দ্রুত সেটআপ",
    questionsProgress: (current: number, total: number) => `${total}টির মধ্যে ${current}`,
    savedLocally: "এই প্রোটোটাইপে আপনার উত্তরগুলো এই ব্রাউজারেই সংরক্ষিত থাকে।",
    readyTitle: "এটুকুই যথেষ্ট — এবার এটি আপনার নিজের মতো হবে।",
    readyBody:
      "এই উত্তরগুলো দিয়ে আমরা ঠিক করব আপনাকে প্রথমে কী দেখাব। ব্যবস্থার চূড়ান্ত বাছাই হবে আপনার নিশ্চিত করা তথ্য আর দাবির ভিত্তিতেই।",
    guidedLabel: "আমরা কীভাবে বোঝাব",
    guidedValue: "চলতে চলতে আমরা শব্দগুলো বুঝিয়ে দেব।",
    quickValue: "আমরা পথ ছোট রাখব।",
    regimeLabel: "দুই ব্যবস্থা নিয়ে আমাদের পথ",
    claimsRegimeValue: "ব্যবস্থা বাছার আগে আপনার দাবিগুলো যাচাই করব।",
    compareRegimeValue: "তথ্য নিশ্চিত হওয়ার পর দুটি ব্যবস্থাই তুলনা করব।",
    focusLabel: "প্রথমে কীসে নজর",
    startPath: "আমার পথ ধরে শুরু করুন",
    changeAnswers: "উত্তর বদলান",
    tailoredBadge: "আপনার শুরুর পথ",
    tailoredGuided: "বুঝিয়ে বুঝিয়ে এগোনো",
    tailoredQuick: "ছোট পথ",
    tailoredRegimeClaims: "ব্যবস্থা বাছার আগে দাবির যাচাই",
    tailoredRegimeCompare: "তথ্যের পরে দুই ব্যবস্থার তুলনা",
    tailoredIntent: (intent: string) => `প্রথমে: ${intent}`,
  },

  checklist: {
    divider: "ফাইল করার আগে",
    itemBefore: "“",
    itemAfter: "” নিশ্চিত করুন — নিশ্চিত না হলে কার্ডটি খুলুন।",
    stdRow: "আপনার হয়ে আমরা যে স্ট্যান্ডার্ড ছাড় প্রয়োগ করেছি, তা নিশ্চিত করুন।",
    noteLocked: "ওপরের প্রতিটি লাইনে টিক দিন, তবেই এই বোতাম খুলবে।",
    noteReady: "ওপরের সবকিছু নিশ্চিত হয়ে গেছে। তৈরি হলে ফাইল করুন।",
    fileBtn: "এই রিটার্ন ফাইল করুন",
    lockedBtn: (n: number) =>
      n === 1 ? "আগে আর 1টি লাইনে টিক দিন" : `আগে আর ${n}টি লাইনে টিক দিন`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `কার্ড ${String(n).padStart(2, "0")} · জানানো ${date}`,
    whatThisMeans: "এর মানে কী",
    readFirst: "আগে “এর মানে কী” খুলুন — তারপর নিশ্চিত করুন।",
    readyToConfirm: "পড়া হয়েছে? নিচে নিশ্চিত করুন।",
  },

  signoff: {
    title: "চূড়ান্ত সই",
    declaration:
      "আমি ওপরের সংখ্যাগুলো পড়েছি এবং উৎস নথির সঙ্গে মিলিয়ে দেখেছি। এগুলো সঠিক ও সম্পূর্ণ।",
    action: "এই সংখ্যাগুলোতে সই করুন",
    signed: "সই হয়ে গেছে — ওপরের প্রতিটি সংখ্যা নিশ্চিত।",
    hint: "একটি ঘোষণাই ওপরের সবকিছু ঢেকে দেয়। কোনো সংখ্যায় আপত্তি থাকলে সই করার আগে “না, এটা ভুল” বেছে নিন।",
  },

  channels: {
    sectionLabel: "এক নজরে বছরটা",
    earned: "আপনি আয় করেছেন",
    toTax: "করে গেছে",
    overpaid: "আপনি বেশি দিয়েছেন",
    stillToPay: "এখনও দিতে হবে",
    stayed: "আপনার কাছ থেকে যায়ইনি",
    kept: "যত কর আপনার হয়েছিল",
    back: "আপনার কাছে ফিরে আসছে",
    yoursInEnd: "শেষমেশ আপনার",
    collected: "আগেই আদায় হয়েছে",
    ofYear: "বছরের টাকার",
    sliceNote:
      "চোখে পড়ার মতো নয় এমন সরু অংশকে একটু চওড়া করে আঁকা হয়েছে — পাশের সংখ্যাগুলো একদম সঠিক।",
    whereItWent: "আপনার আয়ের প্রতিটি টাকা কোথায় গেল",
    earnedDesc:
      "বেতন, সুদ আর বাকি সবকিছু — যাঁরা আপনাকে টাকা দিয়েছেন তাঁদের জানানো হিসাবমতো।",
    toTaxDesc: "প্রাপ্য প্রতিটি ছাড়ের পরে আপনার সত্যিকারের যত কর হয়েছে।",
    backDesc:
      "আপনার বেতন থেকে নেওয়া হয়েছিল কিন্তু কখনও প্রাপ্য ছিল না। এটি আপনার কাছে ফিরে আসবে।",
    dueDesc: "যা আদায় হয়েছে তার বাইরে বকেয়া। এটি এখনও দিতে হবে।",
    howToRead:
      "এটি এভাবে পড়ুন: এখানে কিছুই আমরা বানাইনি। প্রতিটি সংখ্যা এসেছে কারও দাখিল করা নথি থেকে, নয়তো আপনার নিজের লেখা থেকে। পেনসিলের নোটগুলো বুঝিয়ে দেয় প্রতিটির আসল মানে — সহজ কথায়, করের ভাষায় নয়।",
    meterCap: "যত কর হয়েছিল বনাম যা আগেই আদায় হয়েছে",
  },

  agent: {
    title: "ওয়াপসি সহায়ক",
    open: "সহায়ক খুলুন",
    close: "বন্ধ করুন",
    placeholder: "যাচাই, ব্যাখ্যা বা ফাইল করতে বলুন…",
    send: "পাঠান",
    thinking: "কাজ চলছে…",
    toolRan: "করা হয়েছে:",
    confirmTitle: "ফাইল করার জন্য তৈরি — সংখ্যাগুলো নিশ্চিত করুন",
    confirmBody: "আপনার নিশ্চিত করা ছাড়া কিছুই ফাইল হবে না। এটিই জমা পড়বে:",
    confirmTotalTax: "মোট কর",
    confirmRefund: "আপনার প্রাপ্য ফেরত",
    confirmDue: "দেয় বাকি",
    confirmTaxable: "করযোগ্য আয়",
    confirmButton: "নিশ্চিত করে ফাইল করুন",
    cancelButton: "বাতিল করুন",
    filingDismissed: "ঠিক আছে — কিছুই ফাইল হয়নি।",
    error: "সহায়কের কাছে পৌঁছানো গেল না। আপনার রিটার্নে হাত পড়েনি — আবার চেষ্টা করুন।",
    intro:
      "আমি আপনার রিটার্ন যাচাই করতে পারি, যেকোনো সংখ্যা বুঝিয়ে দিতে পারি, নানা সম্ভাবনার হিসাব চালাতে পারি আর ফাইলের প্রস্তুতি নিতে পারি। কিছু ফাইল হওয়ার আগে সবসময় আপনি নিশ্চিত করবেন।",
    sample: "80C-তে ₹1,50,000 রাখলে আমার কত বাঁচত?",
  },

  footer: {
    prototype: "স্বাধীন ধারণা-প্রোটোটাইপ।",
    notAffiliated:
      "এটি আয়কর বিভাগ, CBDT বা ভারত সরকারের সঙ্গে যুক্ত নয়, তাদের অনুমোদিত নয়, তাদের সঙ্গে সম্পর্কিতও নয়। এখানকার প্রতিটি নাম, PAN, অঙ্ক আর নথি বানানো। কোনো সরকারি সিস্টেমের সঙ্গে যোগাযোগ করা হয় না।",
    honestyLink: "দেখুন ঠিক কোনটা আসল আর কোনটা মক",
  },
};

/**
 * Bengali values for the ~90 English keys in LOCALIZED_MOCK_STRINGS
 * (components/mock-i18n.ts). Keys must stay byte-identical to the English
 * strings there. Model-generated; awaiting native-speaker review (T0.5).
 */
export const bnMock: Record<string, string> = {
  "Your pay last year": "গত বছর আপনার বেতন",
  "Interest your savings account earned": "আপনার সঞ্চয়ী অ্যাকাউন্টের অর্জিত সুদ",
  "Interest your accounts earned": "আপনার অ্যাকাউন্টগুলোর অর্জিত সুদ",
  "Your primary contract income": "আপনার মূল চুক্তির আয়",
  "Savings interest": "সঞ্চয়ের সুদ",
  "Tax withheld (TDS)": "আগে কাটা কর (TDS)",
  "Provident Fund / ELSS Mutual Funds": "প্রভিডেন্ট ফান্ড / ELSS মিউচুয়াল ফান্ড",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "তাঁর বেতন থেকে ₹8,400 কেটে নেওয়া হয়েছে। তাঁর কিছু দেওয়ার নেই। তিনি এখনও ফাইল করেননি, আর স্কুলের ফি দেওয়ার সময় হয়ে গেছে।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "দুটি নোটিশ। একটি বলছে তিনি ₹1,10,000 শেয়ার-মুনাফা লুকিয়েছেন — আসলে তাঁর ₹4,200 লোকসান হয়েছিল। অন্যটি 2019-এর এমন এক বিলের জন্য তাঁর ফেরতের একাংশ রেখে দিতে চায়, যার কথা তিনি কখনও শোনেনইনি।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 দিন আগে ফাইল করেছেন। পোর্টালে শুধু লেখা ‘প্রক্রিয়াধীন’, আর কিছু নয়। আসলে দুটি আলাদা জিনিস তাঁর ₹34,800 আটকে রেখেছে।",
  "Tax already taken out of your pay": "বেতন থেকে আগেই কাটা কর (TDS)",
  "Dividend your shares paid out": "আপনার শেয়ার থেকে পাওয়া ডিভিডেন্ড",
  "Money from selling shares": "শেয়ার বিক্রির টাকা",
  "Tax the bank withheld on your interest": "সুদের ওপর ব্যাংকের কাটা কর (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "প্রভিডেন্ট ফান্ড (PF), বিমা আর মেয়ের টিউশন ফি",
  "Provident fund and your insurance premium":
    "প্রভিডেন্ট ফান্ড (PF) আর আপনার বিমার প্রিমিয়াম",
  "Health cover for the family": "পরিবারের স্বাস্থ্যবিমা",
  "Rent you paid, with no house-rent allowance from your employer":
    "আপনার দেওয়া ভাড়া, নিয়োগকর্তার বাড়িভাড়া ভাতা ছাড়া",
  "One figure doesn't match what your broker reported.":
    "একটি সংখ্যা আপনার ব্রোকারের জানানো হিসাবের সঙ্গে মিলছে না।",
  "₹18,740 of this is being held against an old bill.":
    "এর মধ্যে ₹18,740 একটি পুরোনো বিলের বদলে আটকে রাখা হচ্ছে।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "বিভাগ মনে করছে আপনি ₹1,10,000 শেয়ার-মুনাফা বাদ দিয়েছেন।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019-এর একটি বিল মেটাতে বিভাগ আপনার ফেরত থেকে ₹18,740 রেখে দিতে চায়।",
  "Waiting on one thing: a receipt for your rent claim.":
    "একটি জিনিসের অপেক্ষা: আপনার ভাড়ার দাবির একটি রসিদ।",
  "The account you chose can't receive the money.":
    "আপনার বেছে নেওয়া অ্যাকাউন্টটি টাকা নিতে পারছে না।",
  "Held: your rent claim needs a receipt.":
    "আটকে আছে: আপনার ভাড়ার দাবির জন্য রসিদ দরকার।",
  "Your bank account was checked and failed.":
    "আপনার ব্যাংক অ্যাকাউন্ট যাচাই করা হয়েছিল এবং তা ব্যর্থ হয়েছে।",
  "The department is asking you to look again at your rent claim.":
    "বিভাগ আপনাকে ভাড়ার দাবিটি আবার দেখতে বলছে।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities শেয়ার বিক্রি থেকে ₹1,10,000 জানিয়েছে। আপনার রিটার্নে তা নেই। এটি না মেটা পর্যন্ত ফেরত যেখানে আছে সেখানেই থাকবে।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20-এর একটি দাবি এ বছরের ফেরতের সঙ্গে সমন্বয় করা হচ্ছে। আপনি আপত্তি জানাতে পারেন, আর 3 তারিখের আগে এটি পড়ে নেওয়া উচিত।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 সেপ্টেম্বরের মধ্যে কিছু না বললে ₹1,10,000 আপনার আয়ে যোগ হবে আর আপনার ফেরত থেকে প্রায় ₹34,300 চলে যাবে।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 সেপ্টেম্বরের মধ্যে কিছু না বললে আপনার ফেরত থেকে ₹18,740 কেটে নেওয়া হবে আর বিষয়টি বন্ধ বলে ধরা হবে।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "আপনি ₹1,10,000-এর শেয়ার বেচেছেন আর তার মুনাফা ঘোষণা করেননি।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 হল আমার বেচা সবকিছুর মোট মূল্য, আমার লাভ নয়। ওই লেনদেনগুলোতে আমার ₹4,200 লোকসান হয়েছে। বছরের ব্রোকার স্টেটমেন্টে কেনা দাম দেখা যায়।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 বছরের ₹18,740 এখনও আপনার বকেয়া, তাই তা এ বছরের ফেরত থেকে নেওয়া হবে।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "আপনি ₹60,000 ভাড়ার দাবি করেছিলেন। তা দেখানোর মতো কিছু যুক্ত ছিল না। একটি রসিদ বা বাড়িওয়ালার নাম ও PAN যোগ করুন, তাহলেই এটি এগোবে।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank গত বছর Deccan Union Bank-এর অংশ হয়ে গেছে। অ্যাকাউন্টটি এখনও আছে — কিন্তু সেখানে টাকা পাঠানোর কোডটি (IFSC) আর নেই।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "আপনি 80GG-এর অধীনে ₹60,000 ভাড়ার দাবি করেছিলেন, সমর্থনে কিছুই যুক্ত ছিল না।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "আমি সত্যিই এই ভাড়া দিয়েছি। বাড়িওয়ালার কাছ থেকে মাসিক রসিদ আমার কাছে আছে, আর তাঁর নাম ও PAN দিতে পারি।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "এটি কোনো অভিযোগ নয়, এখনও কোনো জরিমানাও নেই। কিন্তু দাবিটি প্রমাণ না করা বা তুলে না নেওয়া পর্যন্ত আপনার ₹34,800 যেখানে আছে সেখানেই থাকবে।",
  "Look at what they reported": "দেখুন তারা কী জানিয়েছে",
  "Read the 2019 demand": "2019-এর দাবিটি পড়ুন",
  "Add the receipt": "রসিদটি যোগ করুন",
  "Point it at the right account": "সঠিক অ্যাকাউন্টে ঘুরিয়ে দিন",
  "Supervisor, garment unit": "সুপারভাইজার, পোশাক কারখানা",
  "Operations manager; trades equity on the side":
    "অপারেশনস ম্যানেজার; পাশাপাশি শেয়ারে লেনদেন করেন",
  "Junior architect; first time filing": "জুনিয়র আর্কিটেক্ট; প্রথমবার ফাইল করছেন",
  "Independent Consultant": "স্বাধীন পরামর্শদাতা",
  "Primary School Teacher": "প্রাথমিক বিদ্যালয়ের শিক্ষিকা",
  "Retired bank clerk": "অবসরপ্রাপ্ত ব্যাংক কেরানি",
  "Retired": "অবসরপ্রাপ্ত",
  "Teacher": "শিক্ষক",
  "You sent your return in.": "আপনি আপনার রিটার্ন পাঠিয়ে দিয়েছেন।",
  "You confirmed it was you. The return counts from here.":
    "আপনি নিশ্চিত করেছেন এটা আপনিই। রিটার্ন এখান থেকেই গোনা হবে।",
  "In the queue with everything else filed that week.":
    "সেই সপ্তাহে দাখিল হওয়া আর সবকিছুর সঙ্গে সারিতে।",
  "Someone is looking at one figure.": "কেউ একটি সংখ্যা দেখছেন।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "আপনার ব্রোকারের দাখিল করা শেয়ার-বিক্রির একটি সারি আপনার রিটার্নের সঙ্গে মিলছে না।",
  "OTP verified, 4 minutes after filing.": "OTP যাচাই হয়েছে, ফাইল করার 4 মিনিট পরে।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG-এর অধীনে ₹60,000 দাবি করা হয়েছে, সমর্থনে কিছুই যুক্ত নেই।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank যাচাই ফিরিয়ে দিয়েছে: IFSC GODG0004417 আর কোথাও যায় না।",
  "OTP Verification Complete": "OTP যাচাই সম্পূর্ণ",
  "Outstanding Compliance Notices": "বকেয়া কমপ্লায়েন্স নোটিশ",
  "Draft Legal Response": "আইনি জবাবের খসড়া তৈরি করুন",
  "No Pending Actions": "কোনো কাজ বাকি নেই",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "আপনার অ্যাকাউন্ট পুরোপুরি নিয়ম মেনে আছে — কোনো বকেয়া নোটিশ বা করের দাবি নেই।",
  "Actionable Assessment Holds": "যেসব মূল্যায়ন-আটক নিয়ে কাজ করা যায়",
  "Upload Rent Agreement / Receipts": "ভাড়ার চুক্তি / রসিদ আপলোড করুন",
  "Landlord Name": "বাড়িওয়ালার নাম",
  "Landlord PAN (10 Digits)": "বাড়িওয়ালার PAN (10 অঙ্ক)",
  "Select PDF/JPG": "PDF/JPG বেছে নিন",
  "Submit Receipt": "রসিদ জমা দিন",
  "Response Position": "জবাবের অবস্থান",
  "I Agree with Department": "আমি বিভাগের সঙ্গে একমত",
  "I Disagree (Submit Proof)": "আমি একমত নই (প্রমাণ জমা দিন)",
  "Response Statement (Draft)": "জবাবের বিবৃতি (খসড়া)",
  "Dictate Statement": "মুখে বলে লেখান",
  "Listening...": "শুনছি...",
  "Explain your disagreement or agreement...": "আপনার সম্মতি বা আপত্তি বুঝিয়ে লিখুন...",
  "Send Response": "জবাব পাঠান",
  "Cancel": "বাতিল করুন",
  "Validate Bank Code": "ব্যাংক কোড যাচাই করুন",
  "Update Bank IFSC": "ব্যাংক IFSC আপডেট করুন",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "ব্যাংকের বিবরণ যাচাই করতে 11 অঙ্কের ব্যাংক রাউটিং কোড (IFSC) যাচাই করুন।",
  "IFSC Code": "IFSC কোড",
};

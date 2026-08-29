/**
 * डोगरी (Dogri), written in Devanagari.
 *
 * This translation is model-generated and awaits review by a native Dogri
 * speaker who knows tax vocabulary (project task T0.5). Be candid about the
 * limitation: model coverage of Dogri is much thinner than for Hindi or
 * Punjabi, and Dogri sits close enough to both that a machine draft can
 * drift into "Hindi with Punjabi colour" without noticing. The intent here
 * is genuine Dogri — दा/दी/दे genitives, गी datives, कन्नै/थमां postpositions,
 * ऐ/न copulas, घल्लना/दस्सना/दिक्खना verbs — with the plain, warm, spoken
 * register of hi.ts: consequence, not rule; never the name of a tax form.
 *
 * Digits stay Latin, ₹ stays ₹, and PAN / TDS / IFSC / OTP / AIS / 26AS /
 * section codes / persona and bank names stay untranslated, matching hi.ts.
 */

import type { Dict } from "./en";

export const doi: Dict = {
  langName: "Dogri",
  langNativeName: "डोगरी",
  dir: "ltr",

  common: {
    modeSimple: "सादा",
    modeDetailed: "ब्योरेदार",
    continue: "अग्गें बधो",
    back: "पिच्छें",
    yesThatsRight: "आहो, एह् ठीक ऐ",
    noThisIsWrong: "नेईं, एह् गलत ऐ",
    iDontUnderstand: "मिगी एह् समझ नेईं आया",
    close: "बंद करो",
    saveAndGoOn: "सांभियै अग्गें बधो",
    loading: "इक पल",
    logOut: "लॉग आउट",
    undo: "वापस लैओ",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "जांच ते फाइलिंग दा सौखा तरीका",
    independent: "आजाद प्रोटोटाइप",
    taxYear: "कर ब'रा 2026-27",
    language: "भाशा",
    light: "लाइट",
    dark: "डार्क",
    sandbox: "रिव्यू टूल",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "मुक्ख सामग्री पर जाओ",
  },

  validate: {
    panTooShort: (n: number) => `हून तगर ${n} अक्खर न। PAN च 10 होंदे न।`,
    panShape:
      "PAN च पैह्लें पंज अक्खर, फ्ही चार अंक, फ्ही इक अक्खर होंदा ऐ — जिआं DEMPS4417K।",
    panSandboxHint:
      "तुस इत्थें जेह्ड़ा किश लिखदे ओ, ओह् तुंदे ब्राउज़र थमां बाह्र नेईं जंदा। इस प्रोटोटाइप च हर PAN DEMP कन्नै शुरू होंदा ऐ, इस करी कोई असली PAN गलती कन्नै नेईं लब्भी सकदा।",
    ifscTooShort: (n: number) => `हून तगर ${n} अक्खर न। बैंक कोड च 11 होंदे न।`,
    ifscShape:
      "बैंक कोड च पैह्लें चार अक्खर, फ्ही इक सिफर, फ्ही छे होर — जिआं DECU0834471।",
  },

  landing: {
    question: "केह् आमदनी कर महकमे कोल तुंदा पैसा रुकेदा ऐ?",
    subtext:
      "इत्थें औने आह्ले मते लोकें कोल देने गी किश नेईं होंदा — उनेंगी मिलना होंदा ऐ। अपना PAN पाओ, अस दस्सगे जे केह् रुकेदा ऐ।",
    panLabel: "तुंदा PAN",
    panHelp: "दस अक्खर, तुंदे PAN कार्ड थमां",
    panPlaceholder: "जिआं, DEMPS4417K",
    check: "दिक्खो मिगी केह् मिलना ऐ",
    orTryAs: "जां त्रौं लोकें चा किसे इक दे रूप च दिक्खो",
    honestyLink: "इत्थें केह् असली ऐ ते केह् बनाया दा",
    architectureLink: "तकनीकी बनावट",
    badge: "सादा कर रिटर्न, साबत कीता दा",
    brandTitle: "तुंदा पैसा, वापसी दे रस्तें पर।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "फाइल करना",
      blurb:
        "उंदी तनखाह् चा ₹8,400 कट्टे गे। उंदे कोल देने गी किश नेईं, उनें फाइल नेईं कीता, ते स्कूलै दी फीस देनी ऐ।",
      action: "जेह्ड़ा पैह्लें गै पता ऐ उसगी पक्का करो",
    },
    rakesh: {
      phase: "इक चिट्ठी आई",
      blurb:
        "चिट्ठी आखदी ऐ जे उनें शेयरें दा ₹1,10,000 दा मुनाफा लकोया। उंदा पैसा इक पुराने मंगे दे बदले रोकेआ गेदा ऐ, जिसदी उनेंगी कदें खबर गै नेईं दित्ती गेई।",
      action: "पढ़ो ते असहमति दस्सो",
    },
    priya: {
      phase: "उडीक",
      blurb:
        "71 देंह् पैह्लें फाइल कीता। हून बी लिखेआ ऐ जे कार्रवाई चली दी ऐ। असल च दो चीजां रोका दियां न, ते किसे नेईं दस्सेआ जे केह्ड़ियां।",
      action: "दिक्खो केह् रोका दा ऐ",
    },
    custom: {
      phase: "अपना बनाओ",
      blurbTitle: "बनाया दा कोई",
      blurb:
        "शुरू थमां इक माह्नू बनाओ — उंदी कमाई, उंदे दावे, उस थमां कट्टेआ कर — ते दिक्खो जे हिसाब आपूं किआं बनदा ऐ।",
      action: "कोई बनाई लैओ",
    },
  },

  login: {
    authVerifying: "सर्वर कन्नै जांच होआ करदी ऐ…",
    authUnreachable:
      "साइन-इन सर्वर तगर पुज्जी नेईं सके। तुंदा भरेआ दा किश बी नेईं गेआ — थोह्ड़ी देर बाद फ्ही कोशश करो।",
    authRejected: (detail: string) => `सर्वरै साइन-इन नेईं होन दित्ता: ${detail}`,
    signedInAs: "साइन-इन होई गेआ — सत्र चालू ऐ",
    otpSentTo: (mobile: string) => `असें ${mobile} पर इक कोड घल्लेआ ऐ`,
    otpLabel: "छे अंकें दा कोड",
    weWillWait:
      "कोई काह्ली नेईं। कोड दी उडीक च तुंदा भरेआ दा किश बी नेईं जाग।",
    resend: "दोबारा घल्लो",
    resendIn: (seconds: number) => `${seconds} सेकंड बाद दोबारा मंगी सकदे ओ`,
    mockNotice:
      "एह् इक प्रोटोटाइप ऐ, इस करी कोड स्क्रीन पर गै दस्सेआ गेदा ऐ। कोई असली सनेहा नेईं घल्लेआ जंदा।",
    portalHeading: "ई-फाइलिंग तसदीक",
    incorrectCode: "एह् कोड मेल नेईं खंदा। छे अंक फ्ही दिक्खो ते दोबारा कोशश करो।",
    prototypeBox: "प्रोटोटाइप OTP तसदीक",
    mockCodeLabel: "मॉक कोड",
    autoFill: "मेरे आस्तै भरी देओ",
    verifyEnter: "तसदीक करियै अंदर जाओ",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "छे अंकें दा तसदीक कोड",
    otpDigitLabel: (position: number, total: number) =>
      `अंक ${position}, कुल ${total} चा`,
    draftRestored: (time: string) =>
      `तुंदा ड्राफ्ट ${time} थमां वापस आनी दित्ता गेआ। किश बी नेईं गेआ।`,
  },

  file: {
    heading: (amount: string) => `तुंदे ${amount} महकमे कोल पेदे न`,
    subheading:
      "थल्लें लिखी दी तकरीबन हर गल्ल तुंदे बारै पैह्लें गै दस्सी दित्ती गेदी ऐ। इसगी पढ़ो, ते किश गलत होऐ तां असेंगी दस्सो।",

    checkThis: "इसगी दिक्खी लैओ — भरना नेईं ऐ",
    factMeaning:
      "एह् पैह्लें दस्सी दी गल्ल ऐ, करै दा नियम नेईं। थल्लें दा हिसाब इस्सै थमां बनदा ऐ।",
    factMeaningByKind: {
      salary:
        "तुंदे मालकै तुसें तगर पुज्जी दी तनखाह् थमां एह् दर्ज कीता। थल्लें दा हर हिसाब इत्थुआं गै शुरू होंदा ऐ।",
      interest:
        "बैंक ब'रे च इक बारी तुंदे खातें दा ब्याज दर्ज करदे न। निक्की रकम बी आमदनी ऐ।",
      dividend:
        "कंपनी दे रजिस्ट्रारै दर्ज कीता जे तुंदे शेयरें केह् दित्ता। जिस ब'रे च मिलेआ, उस्सै ब'रे दी आमदनी ऐ।",
      capital_gains:
        "तुंदे ब्रोकरै शेयर बेचने कन्नै मिलेदा पैसा दर्ज कीता। कर मुनाफे पर लगदा ऐ — दर इस पर निर्भर ऐ जे केह् बेचेआ ते कि'न्ना चिर रक्खेआ।",
      rent:
        "मिलेदा किराया आमदनी ऐ; दित्ता दा किराया तुंदा कर घटाई सकदा ऐ। दौनें हालतें च दूई बक्खी दे दर्ज कीते दे कन्नै मेल खाना चाहिदा।",
      other:
        "एह्दे च ओह् दर्ज आमदनी ऐ जेह्ड़ी किसे होर खाने च नेईं औंदी। एह् बी थल्लें दे हिसाब च जुड़दी ऐ।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} नै ${date} गी महकमे गी एह् दस्सेआ`,
    underIdentifier: (identifier: string) => `रजिस्टर्ड ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `जे एह् गलत ऐ तां इसगी असली थाह्रा पर सिर्फ ${reporter} गै बदली सकदे न। अस ठीक-ठीक दस्सगे जे उंदे शा केह् मंगना ऐ।`,

    whatYouEarned: "तुसें कि'न्ना कमाया",
    whatWasDeducted: "कर पैह्लें गै कि'न्ना कट्टेआ",
    whereMoneyGoes: "पैसा कुत्थें जाग",
    whoYouAre: "तुस कु'न ओ",

    disputeHeading: "इस च केह् लिखेआ दा होना चाहिदा हा?",
    disputeAmountLabel: "सही रकम",
    disputeReasonLabel: "एह् गलत कीह् ऐ",
    disputeSave: "इसगी गलत दस्सो",
    selfReported: "तुस",
    returnLabel: "तुंदा रिटर्न",

    outcomeOwesNothing: "तुंदे कोल देने गी किश नेईं।",
    outcomeRefund: (amount: string) => `${amount} तुसेंगी वापस मिलङन।`,
    outcomeOwes: (amount: string) => `${amount} देने बाकी न।`,
    confirmAndFile: "इसगी घल्ली देओ",

    verifyHeading: "बस इक कदम बाकी ऐ, नेईं ते एह् गिनेआ नेईं जाग।",
    verifyBody:
      "जदूं तगर तुस पक्का नेईं करदे जे एह् तुस गै ओ, तुंदा रिटर्न दाखल नेईं मन्नेआ जंदा — जिआं तुसें घल्लेआ गै नेईं। इस च कोई वीह् सेकंड लगदे न।",
    verifyAction: "पक्का करो जे एह् अऊं आं",

    voicePrompt: "जां बस बोली करियै दस्सो",
    voiceListening: "सुना करदे आं",
    voiceUnsupported:
      "इस फोनै दा ब्राउज़र हाली सुनी नेईं सकदा। तुस लिखियै दस्सी सकदे ओ — किश बी नेईं जाग।",
    voiceSimulated:
      "एह् ब्राउज़र सुनी नेईं सकदा, इस करी एह् इक मसाल ऐ, तुंदी आवाज नेईं।",
    voiceError: "एह् सुनाई नेईं दित्ता। तुस लिखियै दस्सी सकदे ओ — किश बी नेईं जाग।",
    dictate: "बोलियै दस्सो",
    disputePlaceholder: "एह् अंकड़ा गलत कीह् ऐ — लिखो जां बोलो।",
    disputeDefaultReason: "दस्सेआ दा अंकड़ा गलत ऐ",
  },

  flow: {
    facts: "तुंदा पैसा",
    deductions: "ओह् पैसा जेह्ड़ा तुस मंगी सकदे ओ",
    regime: "पुराना जां नमां",
    check: "जांची लैओ",
    file: "घल्ली देओ",
    stepOf: (n: number, total: number) => `कदम ${n}, कुल ${total}`,
    confirmedCount: (done: number, total: number) => `${total} चा ${done} पक्के`,
    allConfirmed: "सब ठीक-ठाक ऐ।",
    undoOne: "एह् सुधार वापस लैओ",
    correctedTo: (amount: string) => `तुस आखदे ओ जे एह् ${amount} होना चाहिदा`,
  },

  groups: {
    moneyIn: "औने आह्ला पैसा",
    taxPaid: "तुंदे आस्तै पैह्लें गै कट्टेआ दा कर",
    deductionsClaimed: "तुंदे दावे",
    fromWhere: "एह् कुत्थुआं आया",
    addIncome: "आमदनी जोड़ो",
  },

  deductions: {
    notAllowedNewRegime: "नमीं व्यवस्था च नेईं गिनेआ जंदा — तुंदे रिकार्ड च सांभेआ दा।",
    startedAtCap: (amount: string) =>
      `असें इसगी ${amount} दी हद थमां शुरू कीता — “कि'न्ना” च ओह् रकम पाओ जेह्ड़ी तुसें सच्चें दित्ती।`,
    heading: "ओह् पैसा जेह्ड़ा तुस मंगी सकदे ओ",
    sub: "एह् आपूं नेईं होंदे। तुसेंगी हां आखनी पौंदी ऐ — पर तदूं गै, जिसलै सच्च होऐ।",
    claimedHeading: "तुंदे रिटर्न च पैह्लें शा गै",
    worthUpTo: (amount: string) =>
      `तुंदी कर-जोग आमदनी चा ${amount} तगर घट्ट होई सकदा ऐ`,
    worthWhatYouPaid: "उन्ना गै जि'न्ना तुसें सच्चें दित्ता — सही रकम भरो",
    askRentQ: "केह् तुस रौह्ने दा किराया दिंदे ओ?",
    askRentWhy:
      "जे तुस किराया दिंदे ओ ते तुंदे मालकै थमां घरै दे किराये दा भत्ता नेईं मिलदा, तां उसदा किश हिस्सा तुंदी कर-जोग आमदनी चा घट्ट होई सकदा ऐ।",
    askHealthQ: "केह् तुस परवारै दा सेह्त बीमा आप भरदे ओ?",
    askHealthWhy:
      "परवारै गी बीमे च रक्खने आस्तै तुस जेह्ड़ा भरदे ओ, ओह् तुंदी कर-जोग आमदनी चा घट्ट होई सकदा ऐ।",
    ask80cQ: "केह् तुस भविष्य निधि, जीवन बीमे जां स्कूलै दी फीस च पैसा पांदे ओ?",
    ask80cWhy:
      "इस चाल्ली दी लम्मी बचत इक सांझी हद च गिनी जंदी ऐ, ते जि'न्ना तुस पांदे ओ उन्ना तुंदी कर-जोग आमदनी चा घटदा ऐ।",
    claimIt: "आहो — एह् मंगना ऐ",
    skipIt: "नेईं — एह् छोड़ी देओ",
    amountLabel: "कि'न्ना",
    evidenceAttached: "सबूत लाया दा",
    evidenceMissing:
      "हाली कोई सबूत नेईं लाया — इसलै आस्तै ठीक ऐ। रसीदां सांभी रक्खो; महकमा बाद च मंगी सकदा ऐ।",
    newRegimeNoEffect:
      "नमीं व्यवस्था च इस दावे कन्नै किश नेईं बदलदा — ओत्थें एह् मन्नेआ गै नेईं जंदा।",
    oldRegimeSaves: (amount: string) =>
      `पुरानी व्यवस्था च एह् तुंदा कर कोई ${amount} घटाई दिंदा हा।`,
  },

  regime: {
    heading: "कर दो चाल्ली लग्गी सकदा ऐ। इक तुंदे आस्तै बेह्तर ऐ।",
    newRegimeName: "नमीं व्यवस्था",
    oldRegimeName: "पुरानी व्यवस्था",
    refundLabel: "तुसेंगी वापस मिलग",
    dueLabel: "देना बाकी",
    recommendedBadge: "तुंदे आस्तै बेह्तर",
    reasoningOldDeductions: (x: string, y: string) =>
      `तुंदे दावे कुल ${x} दे न, इस करी पुरानी व्यवस्था तुंदे कोई ${y} बचांदी ऐ।`,
    reasoningNewDefault: (y: string) =>
      `तुंदे दावें कन्नै इत्थें मता फर्क नेईं पौंदा, इस करी नमीं व्यवस्था दियां घट्ट दरां तुंदे कोई ${y} बचांदियां न।`,
    acceptRecommendation: "जेह्ड़ी मेरे आस्तै बेह्तर ऐ, ओह्दे कन्नै चलो",
    overrideNote: "तुस कोई बी चुनी सकदे ओ। इत्थें किश बी लकोया दा जां बंद नेईं ऐ।",
  },

  check: {
    newRegimeClaimsZero:
      "तुंदे दावे दर्ज ते सांभे दे न — नमीं व्यवस्था उनेंगी बस मन्नदी नेईं, इस्सै करी एह् लाइन ₹0 ऐ।",
    badgeReportedBy: (reporter: string) => `${reporter} नै दर्ज कीता`,
    badgeYouEntered: "तुसें दर्ज कीता",
    badgeWeApplied: "असें तुंदे आस्तै लागू कीता",
    heading: "पूरा रिटर्न, इक्कै सफे पर",
    sub: "हर अंकड़ा कुतें थमां आया ऐ। कोई बी लाइन खोह्लो ते ठीक-ठीक दिक्खो जे कुत्थुआं।",
    grossIncome: "जेह्ड़ा किश आया",
    standardDeduction: "मानक कटौती",
    deductionsLine: "तुंदे कीते दे दावे",
    taxableIncome: "जिस पर कर सच्चें लगदा ऐ",
    slabTax: "कुसै बी राहत थमां पैह्लें दा कर",
    rebate87A: "छूट जेह्ड़ी इसदा किश हिस्सा रद्द करदी ऐ",
    cess: "सेह्त ते शिक्षा दा उपकर",
    totalTax: "ब'रे दा कुल कर",
    tdsCredits: "पैह्लें गै तुंदे शा कट्टेआ गेदा",
    refundDue: "तुसेंगी वापस मिलग",
    balanceDue: "देना बाकी",
    openLine: "दिक्खो एह् कुत्थुआं आया",
    closeLine: "लकाओ",
    calculationStatus:
      "एह् प्रोटोटाइपै दा हिसाब ऐ — नियमें दे इनपुटें दी हाली मूल स्रोत थमां जांच बाकी ऐ (TODO(verify))।",
    calculationTrail: (amount: string) =>
      `${amount} थल्लें दित्ते दे पक्के कीते दे तथ्यें ते कर क्रेडिटें थमां निकलेआ ऐ। इस प्रोटोटाइप च स्रोत रिकार्ड बनाए दे न।`,
    showCalculationTrail: "स्रोत ते हिसाबै दी लड़ी दिक्खो",
    hideCalculationTrail: "स्रोत ते हिसाबै दी लड़ी लकाओ",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} गी दर्ज कीता गेआ`,
    sourceIdentifier: (identifier: string) => `रिकार्ड ${identifier}`,
    selfReportedSource: "इस रिटर्न च तुंदे आपूं दस्से दा",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: रिपोर्ट करने आह्लियें संस्थाएं थमां मिली दी जानकारी दा सालाना ब्योरा।"
        : statement === "26AS"
        ? "Form 26AS: तुंदे PAN पर दर्ज कर क्रेडिटै दा ब्योरा।"
        : "इस तथ्यै कन्नै जुड़ेदा स्रोत रिकार्ड।",
    sectionMeaning: (section: string) =>
      `${section} कटौती दा इक सेक्शन ऐ। एह् तदूं गै गिनेआ जंदा ऐ जिसलै एह् व्यवस्था इसदी इजाजत देऐ।`,
    explainGross: "तुंदे जांचे दे ते पक्के कीते दे तथ्यें गी जोड़ियै।",
    explainStd: (amount: string) =>
      `तनखाह् आह्ले हर माह्नू गी ${amount} बिना मंगे गै घट्ट होई जंदे न।`,
    explainDeductions: "सिर्फ ओह् दावे गिने जंदे न जेह्ड़े इस व्यवस्था च मन्ने जंदे न।",
    explainDisallowed: (section: string) =>
      `${section} इस व्यवस्था च मन्नेआ नेईं जंदा, इस करी इत्थें इसदा कोई असर नेईं।`,
    explainTaxable: "जेह्ड़ा आया, उस चा मानक कटौती ते तुंदे दावे घटाइयै।",
    explainSlab: "कर टुकड़ें च लगदा ऐ — आमदनी दे हर टुकड़े पर अपनी दर।",
    explainRebate: (amount: string) =>
      `इक हद थमां थल्लें मता कर रद्द होई जंदा ऐ — इत्थें उसदा ${amount}।`,
    explainCess: "हर राहतै दे बाद उप्परा थमां लग्गने आह्ला निक्का प्रतिशत।",
    explainTds:
      "TDS दा मतलब ऐ स्रोतै पर कट्टेआ दा कर: जिसनै तुसेंगी पैसा दित्ता, उसनै तुंदे तगर पुज्जने थमां पैह्लें गै एह् रोकी लैता।",
    fromFacts: "इनें तथ्यें थमां:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "घल्लने आस्तै तैयार?",
    sub: "इक बारी चली गेआ तां बदलने दा रस्ता ऐ दोबारा फाइल करना। इक बारी होर दिक्खी लैओ, फ्ही घल्लो।",
    stepChecking: "हिसाब जांचे करदे आं…",
    stepSealing: "अंकड़े सील करा करदे आं…",
    stepFiled: "दाखल होई गेआ।",
    ackHeading: "पुज्जी गेआ।",
    ackBody:
      "तुंदा रिटर्न अज्जै थमां गिनेआ जाग। इक कदम बाकी ऐ: जिसलै पुच्छेआ जा, पक्का करना जे एह् तुस गै ओ। तदूं तगर एह् घल्लेआ दा नेईं मन्नेआ जाग।",
    ackNext:
      "उसदे बाद ट्रैकर ठीक-ठीक दस्सग जे तुंदा पैसा कुत्थें ऐ ते केह् उसगी रोकी सकदा ऐ।",
    errorCause: "जांच दा कदम इस करी रुकेआ की जे सैंडबाक्सै दा fault स्विच चालू ऐ।",
    errorAction:
      "रिव्यूअर ड्रॉर च 'Trigger API Gateway Timeout' बंद करो, फ्ही दोबारा घल्लो। किश बी नेईं गेआ।",
    errorCauseNetwork: "तुंदा रिटर्न सर्वर तगर नेईं पुज्जेआ।",
    errorActionNetwork:
      "किश बी दाखल नेईं होआ ते किश बी नेईं गेआ। कनेक्शन जांचो, फ्ही दोबारा घल्लो।",
    retry: "फ्ही घल्लने दी कोशश करो",
  },

  wizard: {
    identityNextHint: "अग्गें बधने आस्तै अपना पूरा नांऽ ते 10 अक्खरें दा PAN भरो।",
    employmentConfirmHint:
      "तुंदे पैह्ले जवाबै थमां — जे बदली गेदा होऐ तां दूआ विकल्प चुनो।",
    tdsZeroWarning:
      "तनखाह् आह्ली नौकरी च कर तकरीबन हमेशां पैह्लें गै कट्टेआ दा होंदा ऐ — एह् तुंदे Form 16 जां तनखाह् पर्ची पर ऐ। इत्थें 0 लिखने दा मतलब अक्सर अपना रिफंड छोड़ी देना होंदा ऐ।",
  },

  timeline: {
    filed: "तुसें अपना रिटर्न घल्ली दित्ता।",
    verified: "तुसें पक्का कीता जे एह् तुस गै ओ। रिटर्न इत्थुआं गै गिनेआ जाग।",
    in_queue: "उस हफ्ते दाखल होई दी बाकी सब्भै चीजें कन्नै कतार च।",
    under_review: "हून कोई इसगी दिक्खा करदा ऐ।",
    determined: "तै होई गेआ — इन्ना तुसेंगी वापस मिलग।",
    sent_to_bank: "तुंदे बैंकै गी घल्ली दित्ता।",
    credited: "तुंदे खाते च।",
  },

  refund: {
    heading: (amount: string) => `${amount} तुंदे कोल आवा करदे न`,
    filedDaysAgo: (days: number) => `तुसें ${days} देंह् पैह्लें घल्लेआ हा`,

    holdsHeading: (n: number) =>
      n === 1 ? "इक चीजै दी उडीक ऐ" : `${n} चीजें दी उडीक ऐ`,
    clearsInDays: (days: number) =>
      days === 1
        ? "ओह् होंदे गै कोई इक देंह्"
        : `ओह् होंदे गै कोई ${days} देंह्`,

    cohortWindow: (from: number, to: number) =>
      `तुंदे गै हफ्ते च घल्ले दे रिटर्न हून दिक्खे जा करदे न। ${from} थमां ${to} देंह् लग्गी सकदे न।`,

    states: {
      not_filed: "हाली घल्लेआ नेईं",
      filed_unverified: "घल्ली दित्ता, तुंदी तसदीक बाकी ऐ",
      verified: "तुसें पक्का करी दित्ता",
      in_queue: "कतार च",
      under_review: "कोई इसगी दिक्खा करदा ऐ",
      determined: "तै होई गेआ",
      sent_to_bank: "तुंदे बैंकै गी घल्ली दित्ता",
      credited: "तुंदे खाते च आई गेआ",
      failed: "तुंदे खाते तगर नेईं पुज्जी सकेआ",
    },

    bankFailedHeading: "तुसें जेह्ड़ा खाता चुनेआ ऐ, उस च पैसा नेईं जाई सकदा।",
    bankMergedInto: (bank: string) => `ओह् शाखा हून ${bank} दा हिस्सा ऐ`,
    useThisAccount: "इसदे बजाए इत्थें घल्लो",
    resolvedHold: "निबड़ी गेआ — हून किश नेईं रोकदा।",
    stampFiled: "दाखल",
  },

  notices: {
    heading: "महकमे थमां आइयां चिट्ठियां",
    none: "किश वापस नेईं आया। एह्ई खरी गल्ल ऐ।",
    respondBy: (date: string) => `${date} तगर जवाब देओ`,
    ifYouDoNothing: "जे तुस किश नेईं करदे",
    basedOn: "एह् किस आधारै पर ऐ",
    theCatch: "उंदे शा केह् चूक होई ऐ",
    agree: "एह् ठीक ऐ",
    disagree: "एह् गलत ऐ",
    dinLabel: "इस चिट्ठिया दा हवाला नंबर",
    dinExplain:
      "महकमे दी हर चिट्ठिया पर एह् नंबर होना जरूरी ऐ। इसदे बगैर चिट्ठिया दी सरकारी तौरा पर कोई हस्ती गै नेईं।",
  },

  dashboard: {
    serverFilings: "सर्वरै पर दर्ज",
    serverFilingsEmpty:
      "लाइव सर्वरै पर इस PAN दा कोई दाखल रिटर्न नेईं — उप्पर दी रसीद बनाई दी कहानिया दा हिस्सा ऐ। इस ऐपै थमां दाखल करगे ओ तां असली रसीद इत्थें औग।",
    greetingLabel: "तुंदा साइन-इन वाक्य",
    greetingWhy:
      "एह् वाक्य तुसें खाता बनांदे बेल्लै चुनेआ हा। जेह्ड़ा सफा इसगी नेईं दस्सी सकै, ओह् अस नेईं आं।",
    userDashboard: "यूजर डैशबोर्ड",
    taxPrefills: "कर जानकारी (AIS/26AS)",
    pendingActions: "बाकी कार्रवाइयां",
    returnSummary: "रिटर्न सार AY 2026-27",
    reviewPrefill:
      "कर जानकारी टैब च पैह्लें शा भरे दे ब्योरे दिक्खो, फ्ही फाइल करने दी तसदीक करो।",
    filingSubmitted:
      "तुंदा ई-फाइलिंग रिटर्न जमा होई गेआ ऐ। टाइमलाइनै पर प्रगति दिक्खो।",
    verifiedBanks: "रिफंडै आस्तै तसदीक कीते दे बैंक खाते",
    primaryRefundAccount: "मुक्ख रिफंड खाता",
    backupAccount: "बैकअप खाता",
    ifscMeaning: "IFSC ओह् 11 अक्खरें दा बैंक रूटिंग कोड ऐ जिस कन्नै रिफंड घल्लेआ जंदा ऐ।",
    refundTimeline: "रिफंड टाइमलाइन",
    filingSubmittedTimeline: "रिटर्न जमा होआ",
    identityVerifiedTimeline: "पन्छान तसदीक होई",
    assessmentProcessingTimeline: "आकलन चली दा ऐ",
    refundApprovedTimeline: "रिफंड मंजूर",
    refundCreditedTimeline: "रिफंड जमा होई गेआ",
    holdActive: "रोक चालू ऐ: एक्शन टैब च कार्रवाई पूरी करो",
    successCheckApp: "होई गेआ! अपनी बैंकिंग ऐप दिक्खो।",
    outstandingNotices: "बाकी अनुपालन नोटिस",
    noPendingActions: "कोई कार्रवाई बाकी नेईं",
    accountCompliant:
      "तुंदा खाता पूरी चाल्ली नियमें मताबक ऐ, कोई बाकी नोटिस जां करै दी मंग नेईं।",
    actionableHolds: "कार्रवाई जोग आकलन रोकां",
    uploadRent: "किराया समझौता / रसीदां अपलोड करो",
    landlordName: "मकान मालकै दा नांऽ",
    landlordPan: "मकान मालकै दा PAN (10 अंक)",
    selectPdfJpg: "PDF/JPG चुनो",
    submitReceipt: "रसीद जमा करो",
    responsePosition: "जवाबै दी स्थिति",
    agreeDept: "अऊं महकमे कन्नै सहमत आं",
    disagreeProof: "अऊं असहमत आं (सबूत जमा करो)",
    responseDraft: "जवाबै दा बयान (ड्राफ्ट)",
    dictateStatement: "बोलियै दर्ज करो",
    sendResponse: "जवाब घल्लो",
    filingStatusLabel: "फाइलिंग स्थिति",
    bankValidated: "तसदीक होआ",
    bankUnderProcess: "जांच चली दी ऐ",
    bankFailed: "फेल",
    staleIfscHold: "एह् बैंक कोड हून कुतें नेईं जंदा।",
    switchToNewIfsc: (ifsc: string) => `नमें कोडै पर बदलो (${ifsc})`,
    personalized: {
      eyebrow: "तुंदा डैशबोर्ड",
      headingFiled: "तुंदा रिटर्न जमा होई गेदा ऐ — एह् ऐ उसदी स्थिति",
      heading: {
        file_return: "औओ, तुंदा रिटर्न तैयार करचै",
        check_refund: "औओ, दिक्खचै जे केह् पैसा वापस आई सकदा ऐ",
        understand_notice: "औओ, जरूरी कार्रवाई समझचै",
        correct_prefill: "औओ, दस्सी दी जानकारी जांचचै",
      },
      guidedBody: "हर अंकड़े दी तसदीक थमां पैह्लें अस उसदा मतलब समझागे।",
      quickBody: "रस्ता छोटा रौह्ग ते अगला जरूरी फैसला पैह्लें दिक्खग।",
      unfiledBody: "पैह्लें, तुंदे बारै पैह्लें शा दर्ज जानकारिया गी पक्का करो।",
      filedBody: "तुस जिस कम्मै आस्तै आए ओ, उसदे मताबक असें सही हिस्सा पैह्लें खोह्लेआ ऐ।",
      primaryAction: {
        facts: "दर्ज जानकारी दिक्खो",
        overview: "रिफंड ट्रैकर दिक्खो",
        statement: "दस्सी दी जानकारी जांचो",
        actions: "जरूरी कार्रवाई दिक्खो",
      },
      focusLabel: "अस इनें गल्लें पर ध्यान देगे",
      profileLabels: {
        work: "कम्म",
        income: "कुल अंदाजन आमदनी",
        history: "फाइलिंग दा तजरबा",
      },
    },
  },

  onboarding: {
    eyebrow: "शुरू करने थमां पैह्लें",
    title: "इसगी तुंदे आस्तै तैयार करचै।",
    intro:
      "पंज निक्के जवाब असेंगी सही भाशा, चाल ते करै दे सुआल चुनने च मदद करङन। तुस इनेंगी बाद च बदली सकदे ओ।",
    languageQuestion: "अस केह्ड़ी भाशा च गल्ल करचै?",
    languageHelp: "सारें शा पैह्लें एह्ई सुआल ऐ। भाशा तुस कदें बी बदली सकदे ओ।",
    intentQuestion: "अज्ज तुस इत्थें कीह् आए ओ?",
    intentHelp: "अस उस्सै कम्मै गी सारें शा पैह्लें रक्खगे।",
    intentOptions: {
      file_return: {
        label: "इस ब'रे दा रिटर्न फाइल करना ऐ",
        detail: "तुंदे बारै जेह्ड़ा पैह्लें गै पता ऐ, ओत्थुआं गै शुरू करगे।",
      },
      check_refund: {
        label: "दिक्खना ऐ जे पैसा वापस मिलना ऐ जां नेईं",
        detail: "केह् दस्सेआ गेआ, कि'न्ना कर कट्टेआ ते केह् वापस आई सकदा ऐ, एह् दिक्खो।",
      },
      understand_notice: {
        label: "चिट्ठी जां नोटिस समझना ऐ",
        detail: "इस च केह् लिखेआ ऐ, कि'न्ना दाऽ पर ऐ ते अग्गें केह् करना ऐ, एह् दिक्खो।",
      },
      correct_prefill: {
        label: "गलत लब्भा करदी गल्ल ठीक करनी ऐ",
        detail: "अंकड़ा कुत्थुआं आया एह् लब्भो, ते केह् बदलना चाहिदा एह् दर्ज करो।",
      },
    },
    intentCta: {
      file_return: "मेरा रिटर्न शुरू करो",
      check_refund: "दिक्खो मिगी केह् मिलना ऐ",
      understand_notice: "दस्सो मैं केह् करना ऐ",
      correct_prefill: "जेह्ड़ा दस्सेआ गेदा ऐ उसगी जांचो",
    },
    situationQuestion: "अपनी करै दी हालत बारै दस्सो।",
    situationHelp: "इत्थें दो निक्के जवाब काफी न।",
    professionLabel: "तुंदे कम्मै गी इनें चा केह्ड़ा सब्भनें शा ठीक दसदा ऐ?",
    professionOptions: {
      salaried: "तनखाह् आह्ली नौकरी",
      self_employed: "फ्रीलांस जां अपना कम्म",
      business_owner: "कारोबारी",
      student: "विद्यार्थी",
      retired: "रिटायर",
      investor: "निवेशक",
      other: "किश होर",
    },
    filingHistoryLabel: "केह् तुसें पैह्लें कदें आमदनी करै दा रिटर्न फाइल कीता ऐ?",
    filingHistoryOptions: {
      never: "नेईं, एह् पैह्ली बारी ऐ",
      once: "इक-दो बारी",
      every_year: "हर ब'रे",
    },
    incomeQuestion: "सब्भनें स्रोतें थमां तुंदी कुल आमदनी तकरीबन कि'न्नी ही?",
    incomeHelp: "इक दायरा गै काफी ऐ। सही रकम बाद च दिक्खगे।",
    incomeOptions: {
      none: "कोई आमदनी नेईं",
      under_4: "₹4 लक्खै शा घट्ट",
      "4_to_8": "₹4 थमां ₹8 लक्ख",
      "8_to_12": "₹8 थमां ₹12 लक्ख",
      "12_to_25": "₹12 थमां ₹25 लक्ख",
      over_25: "₹25 लक्खै शा मता",
    },
    modeQuestion: "तुस कि'न्ना ब्योरा दिक्खना चांह्दे ओ?",
    modeHelp: "एह् सिर्फ शुरुआत तै करदा ऐ। तुस कदें बी बदली सकदे ओ।",
    modeOptions: {
      simple: {
        label: "मेरे आस्तै करी देओ",
        detail: "सादी भाशा, इक बेल्लै इक कदम। बाकी अस सांभगे।",
      },
      full: {
        label: "मिगी सब किश दस्सो",
        detail: "हर अंकड़ा, हर नियम, हर हिसाब — शुरुआ थमां गै।",
      },
    },
    focusQuestion: "इनें चा किनें गल्लें पर अस ध्यान देचै?",
    focusHelp: "जेह्ड़ियां तुंदे पर लागू होन, सब्भै चुनो। पक्का नेईं ऐ तां पता नेईं चुनो।",
    focusOptions: {
      salary: "तनखाह् जां पेंशन",
      freelance: "फ्रीलांस कम्म",
      business: "कारोबारै दी कमाई",
      rent: "दित्ता जां मिलेदा किराया",
      interest: "बैंकै दा ब्याज",
      investments: "शेयर जां निवेश",
      deductions: "बचत, बीमा, होम लोन जां NPS",
      not_sure: "हाली पक्का नेईं पता",
    },
    chooseOne: "इक चुनो",
    chooseAtLeastOne: "घट्टो-घट्ट इक चुनो",
    questionsLabel: "निक्की तैयारी",
    questionsProgress: (current: number, total: number) => `${total} चा ${current}`,
    savedLocally: "इस प्रोटोटाइप च तुंदे जवाब इस्सै ब्राउज़र च सांभे जंदे न।",
    readyTitle: "इन्ना इसगी तुंदे आस्तै बनाने गी काफी ऐ।",
    readyBody:
      "इनें जवाबें कन्नै अस तै करगे जे तुसेंगी पैह्लें केह् दस्सना ऐ। व्यवस्था दा आखरी फैसला तुंदे पक्के कीते दे तथ्यें ते दावें पर गै होग।",
    guidedLabel: "अस किआं समझागे",
    guidedValue: "अस चलदे-चलदे शब्द समझागे।",
    quickValue: "अस रस्ता छोटा रक्खगे।",
    regimeLabel: "व्यवस्थाएं कन्नै साढ़ा तरीका",
    claimsRegimeValue: "व्यवस्था चुनने थमां पैह्लें तुंदे दावे जांचगे।",
    compareRegimeValue: "तथ्य पक्के होने परैंत दौनें व्यवस्थाएं दी तुलना करगे।",
    focusLabel: "पैह्लें किस पर ध्यान होग",
    startPath: "मेरे रस्ते कन्नै शुरू करो",
    changeAnswers: "जवाब बदलो",
    tailoredBadge: "तुंदा शुरुआती रस्ता",
    tailoredGuided: "समझाइयै अग्गें बधगे",
    tailoredQuick: "छोटा रस्ता",
    tailoredRegimeClaims: "व्यवस्था थमां पैह्लें दावें दी जांच",
    tailoredRegimeCompare: "तथ्यें परैंत दौनें व्यवस्थाएं दी तुलना",
    tailoredIntent: (intent: string) => `पैह्लें: ${intent}`,
  },

  checklist: {
    divider: "फाइल करने थमां पैह्लें",
    itemBefore: "“",
    itemAfter: "” गी पक्का करो — शक होऐ तां कार्ड खोह्लो।",
    stdRow: "असें तुंदे आस्तै जेह्ड़ी मानक कटौती लागू कीती, उसगी पक्का करो।",
    noteLocked: "उप्पर दी हर लाइनी पर टिक करो, तदूं गै एह् बटन खुल्लग।",
    noteReady: "उप्पर सब किश पक्का ऐ। तैयार ओ तां फाइल करो।",
    fileBtn: "एह् रिटर्न फाइल करो",
    lockedBtn: (n: number) =>
      n === 1 ? "पैह्लें 1 लाइनी पर होर टिक करो" : `पैह्लें ${n} लाइनियें पर होर टिक करो`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `कार्ड ${String(n).padStart(2, "0")} · दर्ज ${date}`,
    whatThisMeans: "इसदा मतलब केह् ऐ",
    readFirst: "पैह्लें “इसदा मतलब केह् ऐ” खोह्लो — फ्ही पक्का करो।",
    readyToConfirm: "पढ़ी लैता? थल्लें पक्का करो।",
  },

  signoff: {
    title: "दस्तखत तसदीक",
    declaration:
      "मैं उप्पर दित्ते दे अंकड़े पढ़े न ते स्रोत दस्तावेजें कन्नै मलाए न। एह् सही ते पूरे न।",
    action: "इनें अंकड़ें पर दस्तखत करो",
    signed: "दस्तखत होई गे — उप्पर दा हर अंकड़ा पक्का ऐ।",
    hint:
      "इक घोशना उप्पर दे सब्भनें अंकड़ें पर लागू होंदी ऐ। कुसै अंकड़े पर एतराज होऐ तां पैह्लें “नेईं, एह् गलत ऐ” चुनो।",
  },

  channels: {
    sectionLabel: "ब'रा इक नजरी च",
    earned: "तुसें कमाया",
    toTax: "करै च गेआ",
    overpaid: "तुसें मता दित्ता",
    stillToPay: "हाली देना ऐ",
    stayed: "तुंदे शा कदें गेआ गै नेईं",
    kept: "जेह्ड़ा कर बनदा हा",
    back: "तुंदे कोल वापस आवा करदा ऐ",
    yoursInEnd: "आखर च तुंदा",
    collected: "पैह्लें गै कट्टी लैता",
    ofYear: "ब'रे भर दे पैसे दा",
    sliceNote:
      "जेह्ड़ा हिस्सा दिक्खने जोग नेईं, उसगी थोह्ड़ा चौड़ा बनाया गेदा ऐ — कन्नै लिखे दे अंकड़े बिल्कुल सही न।",
    whereItWent: "तुंदी कमाई दा हर रपेआ कुत्थें गेआ",
    earnedDesc: "तनखाह्, ब्याज ते बाकी सब — जिआं तुसेंगी पैसा देने आह्लें दर्ज कीता।",
    toTaxDesc: "हर हकदार कटौतिया दे बाद तुंदे पर सच्चें जेह्ड़ा कर बनेआ।",
    backDesc: "तुंदी तनखाह् चा लैता गेआ पर कदें बनदा गै नेईं हा। एह् तुंदे कोल वापस औग।",
    dueDesc: "जेह्ड़ा कट्टेआ गेआ उस शा अग्गें दा बाकी। एह् हाली देना ऐ।",
    howToRead:
      "इसगी इआं पढ़ो: इत्थें किश बी असें नेईं घड़ेआ। हर अंकड़ा कुसै दाखल दस्तावेजै थमां आया ऐ जां तुसें आपूं दर्ज कीता ऐ। पैंसलै दे नोट दसदे न जे हर इकै दा असल मतलब केह् ऐ — सिद्धे शब्दें च, करै दे शब्दें च नेईं।",
    meterCap: "जेह्ड़ा कर बनदा हा बनाम जेह्ड़ा पैह्लें गै कट्टेआ गेआ",
  },

  agent: {
    title: "वापसी सहायक",
    open: "सहायक खोह्लो",
    close: "बंद करो",
    placeholder: "जांचने, समझाने जां फाइल करने गी आखो…",
    send: "घल्लो",
    thinking: "कम्म चल्लै दा ऐ…",
    toolRan: "कीता:",
    confirmTitle: "फाइल करने गी तैयार — अंकड़े जांचो",
    confirmBody: "तुंदी तसदीक दे बगैर किश दाखल नेईं होग। एह् जमा होग:",
    confirmTotalTax: "कुल कर",
    confirmRefund: "तुसेंगी मिलने आह्ला रिफंड",
    confirmDue: "देने आह्ली रकम",
    confirmTaxable: "कर-जोग आमदनी",
    confirmButton: "तसदीक करियै फाइल करो",
    cancelButton: "रद्द करो",
    filingDismissed: "ठीक ऐ — किश दाखल नेईं होआ।",
    error: "सहायकै तगर पुज्जी नेईं सके। तुंदा रिटर्न जिआं दा तिआं ऐ — फ्ही कोशश करो।",
    intro:
      "अऊं तुंदा रिटर्न जांची सकना, कोई बी अंकड़ा समझाई सकना, जे-करां आह्ले हिसाब लाई सकना ते फाइल करने दी तैयारी करी सकना। दाखल हमेशां तुंदी तसदीक परैंत गै होंदा ऐ।",
    sample: "80C च ₹1,50,000 लाने पर मेरी कि'न्नी बचत होग?",
  },

  footer: {
    prototype: "आजाद विचार-प्रोटोटाइप।",
    notAffiliated:
      "एह् आमदनी कर महकमे, CBDT जां भारत सरकारा कन्नै जुड़ेदा, उंदे कोला मंजूर जां उंदे कन्नै संबंधत नेईं ऐ। इत्थें दा हर नांऽ, PAN, रकम ते दस्तावेज बनाया दा ऐ। कुसै बी असली सरकारी सिस्टमा कन्नै संपर्क नेईं कीता जंदा।",
    honestyLink: "दिक्खो केह् असली ऐ ते केह् बनाया दा",
  },
};

/**
 * Dogri renderings of the mock-data strings in
 * components/mock-i18n.ts (LOCALIZED_MOCK_STRINGS). Keys are the byte-exact
 * English strings; same review caveat as the dictionary above.
 */
export const doiMock: Record<string, string> = {
  "Your pay last year": "पिछले ब'रे दी तुंदी तनखाह्",
  "Interest your savings account earned": "बचत खाते नै कमाया दा ब्याज",
  "Interest your accounts earned": "तुंदे खातें नै कमाया दा ब्याज",
  "Your primary contract income": "तुंदी मुक्ख कांट्रैक्ट आमदनी",
  "Savings interest": "बचत खाते दा ब्याज",
  "Tax withheld (TDS)": "पैह्लें कट्टेआ दा कर (TDS)",
  "Provident Fund / ELSS Mutual Funds": "भविष्य निधि / ELSS म्यूचुअल फंड",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "उंदी तनखाह् चा ₹8,400 कट्टे गे। उंदे कोल देने गी किश नेईं। उनें हाली फाइल नेईं कीता, ते स्कूलै दी फीस देनी ऐ।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "दो नोटिस। इक आखदा ऐ जे उनें ₹1,10,000 दा शेयर मुनाफा लकोया — असल च उंदा ₹4,200 दा घाटा होआ। दूआ 2019 दे इक बिलै आस्तै उंदे रिफंडै दा हिस्सा रोकना चांह्दा ऐ, जिसदे बारै उनें कदें सुनेआ गै नेईं हा।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 देंह् पैह्लें फाइल कीता। पोर्टल सिर्फ 'कार्रवाई च' दसदा ऐ, होर किश नेईं। असल च दो बक्ख-बक्ख चीजां उंदे ₹34,800 रोका दियां न।",
  "Tax already taken out of your pay": "तुंदी तनखाह् चा पैह्लें गै कट्टेआ दा कर",
  "Dividend your shares paid out": "तुंदे शेयरें दित्ता दा लाभांश",
  "Money from selling shares": "शेयर बेचने कन्नै मिलेदा पैसा",
  "Tax the bank withheld on your interest": "ब्याजै पर बैंकै कट्टेआ दा कर",
  "Provident fund, insurance and your daughter's tuition":
    "भविष्य निधि, बीमा ते तुंदी धिया दी ट्यूशन फीस",
  "Provident fund and your insurance premium": "भविष्य निधि ते तुंदा बीमा प्रीमियम",
  "Health cover for the family": "परवारै आस्तै सेह्त बीमा",
  "Rent you paid, with no house-rent allowance from your employer":
    "तुंदा दित्ता दा किराया — मालकै थमां घरै दे किराये दा भत्ता नेईं",
  "One figure doesn't match what your broker reported.":
    "इक अंकड़ा तुंदे ब्रोकरै दे दर्ज कीते दे कन्नै मेल नेईं खंदा।",
  "₹18,740 of this is being held against an old bill.":
    "इस चा ₹18,740 इक पुराने बिलै दे बदले रोके दे न।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "महकमे दा मन्नना ऐ जे तुसें ₹1,10,000 दा शेयर मुनाफा छोड़ी दित्ता।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "महकमा 2019 दे इक बिलै दा निबेड़ा करने आस्तै तुंदे रिफंडै चा ₹18,740 रखना चांह्दा ऐ।",
  "Waiting on one thing: a receipt for your rent claim.":
    "इक चीजै दी उडीक ऐ: तुंदे किराये दे दावे दी रसीद।",
  "The account you chose can't receive the money.":
    "तुसें जेह्ड़ा खाता चुनेआ, उस च पैसा नेईं आई सकदा।",
  "Held: your rent claim needs a receipt.":
    "रुकेदा: तुंदे किराये दे दावे गी रसीद चाहिदी।",
  "Your bank account was checked and failed.":
    "तुंदे बैंक खाते दी जांच होई ते ओह् फेल होई गेआ।",
  "The department is asking you to look again at your rent claim.":
    "महकमा तुसेंगी अपने किराये दा दावा दोबारा दिक्खने गी आखा दा ऐ।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities नै शेयर बिक्री थमां ₹1,10,000 दर्ज कीते। तुंदा रिटर्न एह् नेईं दसदा। जदूं तगर एह् निबड़दा नेईं, रिफंड उत्थें गै रौह्ग।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 दी इक मंग इस ब'रे दे रिफंडै कन्नै समायोजत कीती जा करदी ऐ। तुस इसदा विरोध करी सकदे ओ, ते तुसेंगी 3 तरीका थमां पैह्लें एह् पढ़नी चाहिदी।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "जे तुस 10 सितंबर तगर किश नेईं आखदे, तां ₹1,10,000 तुंदी आमदनी च जोड़ी दित्ते जाङन ते तुंदे रिफंडै चा कोई ₹34,300 कट्टे जाङन।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "जे तुस 3 सितंबर तगर किश नेईं आखदे, तां तुंदे रिफंडै चा ₹18,740 कड्ढी लैते जाङन ते मामला बंद मन्नी लैता जाग।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "तुसें ₹1,10,000 दे शेयर बेचे ते उंदे पर होए दे मुनाफे दी घोशना नेईं कीती।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 मेरे बेचे दे सब किश दी कुल कीमत ऐ, मेरा मुनाफा नेईं। उनें सौदें च मेरा ₹4,200 दा घाटा होआ। ब'रे दा मेरे ब्रोकरै दा ब्योरा खरीदा दी कीमतां दसदा ऐ।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 ब'रे दे तुंदे उप्पर हाली ₹18,740 बाकी न, इस करी एह् इस ब'रे दे रिफंडै चा लैते जाङन।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "तुसें ₹60,000 किराये दा दावा कीता। इसगी दस्सने आस्तै किश बी नेईं लाया हा। इक रसीद जां मकान मालकै दा नांऽ ते PAN जोड़ो, ते एह् अग्गें बधग।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank पिछले ब'रे Deccan Union Bank दा हिस्सा बनी गेआ। खाता हाली बी ऐ — पर उस च पैसा घल्लने आह्ला कोड हून नेईं ऐ।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "तुसें 80GG दे तैह्त ₹60,000 किराये दा दावा कीता, पर उसदे समर्थन च किश बी नेईं लाया।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "मैं एह् किराया सच्चें दित्ता ऐ। मेरे कोल मकान मालकै दियां म्हीनेवार रसीदां न ते अऊं उंदा नांऽ ते PAN देई सकना।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "एह् कोई इल्जाम नेईं ऐ ते हाली कोई जुर्माना नेईं। पर तुंदे ₹34,800 उत्थें गै रौह्ङन जदूं तगर तुस दावे दा सबूत नेईं दिंदे जां उसगी वापस नेईं लैंदे।",
  "Look at what they reported": "दिक्खो उनें केह् दर्ज कीता",
  "Read the 2019 demand": "2019 दी मंग पढ़ो",
  "Add the receipt": "रसीद जोड़ो",
  "Point it at the right account": "इसगी सही खाते पर लाओ",
  "Supervisor, garment unit": "सुपरवाइजर, गारमेंट यूनिट",
  "Operations manager; trades equity on the side":
    "ऑपरेशंस मैनेजर; कन्नै-कन्नै शेयरें दा लैन-देन",
  "Junior architect; first time filing":
    "जूनियर आर्किटेक्ट; पैह्ली बारी फाइल करा दी ऐ",
  "Independent Consultant": "आजाद सलाहकार",
  "Primary School Teacher": "प्राइमरी स्कूल अध्यापक",
  "Retired bank clerk": "रिटायर बैंक क्लर्क",
  "Retired": "रिटायर",
  "Teacher": "अध्यापक",
  "You sent your return in.": "तुसें अपना रिटर्न घल्ली दित्ता।",
  "You confirmed it was you. The return counts from here.":
    "तुसें पक्का कीता जे एह् तुस गै ओ। रिटर्न इत्थुआं गै गिनेआ जाग।",
  "In the queue with everything else filed that week.":
    "उस हफ्ते दाखल होई दी बाकी सब्भै चीजें कन्नै कतार च।",
  "Someone is looking at one figure.": "कोई इक अंकड़े गी दिक्खा करदा ऐ।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "तुंदे ब्रोकरै दी दाखल कीती दी शेयर-बिक्री दी इक लाइन तुंदे रिटर्नै कन्नै मेल नेईं खंदी।",
  "OTP verified, 4 minutes after filing.":
    "OTP तसदीक होआ, फाइल करने दे 4 मिंट बाद।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG दे तैह्त ₹60,000 दा दावा, समर्थन च किश बी नेईं लाया दा।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank नै जांच वापस करी दित्ती: IFSC GODG0004417 हून कुतें नेईं जंदा।",
  "OTP Verification Complete": "OTP तसदीक पूरी",
  "Outstanding Compliance Notices": "बाकी अनुपालन नोटिस",
  "Draft Legal Response": "कानूनी जवाबै दा ड्राफ्ट बनाओ",
  "No Pending Actions": "कोई कार्रवाई बाकी नेईं",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "तुंदा खाता पूरी चाल्ली नियमें मताबक ऐ, कोई बाकी नोटिस जां करै दी मंग नेईं।",
  "Actionable Assessment Holds": "कार्रवाई जोग आकलन रोकां",
  "Upload Rent Agreement / Receipts": "किराया समझौता / रसीदां अपलोड करो",
  "Landlord Name": "मकान मालकै दा नांऽ",
  "Landlord PAN (10 Digits)": "मकान मालकै दा PAN (10 अंक)",
  "Select PDF/JPG": "PDF/JPG चुनो",
  "Submit Receipt": "रसीद जमा करो",
  "Response Position": "जवाबै दी स्थिति",
  "I Agree with Department": "अऊं महकमे कन्नै सहमत आं",
  "I Disagree (Submit Proof)": "अऊं असहमत आं (सबूत जमा करो)",
  "Response Statement (Draft)": "जवाबै दा बयान (ड्राफ्ट)",
  "Dictate Statement": "बोलियै दर्ज करो",
  "Listening...": "सुना करदे आं...",
  "Explain your disagreement or agreement...":
    "अपनी सहमति जां असहमति समझाओ...",
  "Send Response": "जवाब घल्लो",
  "Cancel": "रद्द करो",
  "Validate Bank Code": "बैंक कोड तसदीक करो",
  "Update Bank IFSC": "बैंक IFSC अपडेट करो",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "बैंक ब्योरे तसदीक करने आस्तै 11 अंकें दा बैंक रूटिंग कोड (IFSC) जांचो।",
  "IFSC Code": "IFSC कोड",
};

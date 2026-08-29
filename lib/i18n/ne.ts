/**
 * नेपाली (Nepali). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and awaits review by a native Nepali
 * speaker who knows tax vocabulary (project task T0.5). That is a real
 * limitation, disclosed rather than hidden.
 *
 * Digits stay Latin. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes,
 * example codes and proper nouns stay untranslated, following hi.ts precedent.
 */

import type { Dict } from "./en";

export const ne: Dict = {
  langName: "Nepali",
  langNativeName: "नेपाली",
  dir: "ltr",

  common: {
    modeSimple: "सरल",
    modeDetailed: "विस्तृत",
    continue: "अगाडि बढ्नुहोस्",
    back: "पछाडि",
    yesThatsRight: "हो, यो ठीक हो",
    noThisIsWrong: "होइन, यो गलत हो",
    iDontUnderstand: "मैले यो बुझिनँ",
    close: "बन्द गर्नुहोस्",
    saveAndGoOn: "सुरक्षित गरेर अगाडि बढ्नुहोस्",
    loading: "एकछिन है",
    logOut: "लग आउट",
    undo: "फिर्ता लिनुहोस्",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "जाँच्ने र फाइल गर्ने सजिलो बाटो",
    independent: "स्वतन्त्र प्रोटोटाइप",
    taxYear: "कर वर्ष 2026-27",
    language: "भाषा",
    light: "उज्यालो",
    dark: "अँध्यारो",
    sandbox: "समीक्षा उपकरण",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "मुख्य सामग्रीमा जानुहोस्",
  },

  validate: {
    panTooShort: (n: number) => `अहिलेसम्म ${n} अक्षर भयो। PAN मा 10 हुन्छन्।`,
    panShape:
      "PAN मा पहिले पाँच अक्षर, अनि चार अङ्क, अनि एउटा अक्षर हुन्छ — जस्तै DEMPS4417K।",
    panSandboxHint:
      "तपाईंले यहाँ लेखेको कुरा तपाईंको ब्राउजरबाट बाहिर जाँदैन। यस प्रोटोटाइपमा हरेक PAN DEMP बाट सुरु हुन्छ, त्यसैले कुनै वास्तविक PAN भूलवश खोजिन सक्दैन।",
    ifscTooShort: (n: number) => `अहिलेसम्म ${n} अक्षर भयो। बैंक कोडमा 11 हुन्छन्।`,
    ifscShape:
      "बैंक कोडमा पहिले चार अक्षर, अनि एउटा शून्य, अनि अरू छवटा हुन्छन् — जस्तै DECU0834471।",
  },

  landing: {
    question: "के आयकर विभागसँग तपाईंको पैसा रोकिएर बसेको छ?",
    subtext:
      "यहाँ आउने धेरैजसो मानिसले केही तिर्नुपर्दैन — उल्टै पाउनुपर्ने हुन्छ। आफ्नो PAN हाल्नुहोस्, त्यहाँ के छ हामी भनिदिन्छौँ।",
    panLabel: "तपाईंको PAN",
    panHelp: "दस अक्षर, तपाईंको PAN कार्डबाट",
    panPlaceholder: "जस्तै, DEMPS4417K",
    check: "मैले पाउनुपर्ने के छ, हेर्छु",
    orTryAs: "वा तीन जनामध्ये कुनै एक बनेर हेर्नुहोस्",
    honestyLink: "यहाँ के साँचो हो र के बनाइएको",
    architectureLink: "प्राविधिक संरचना",
    badge: "सरल कर विवरण, प्रत्यक्ष प्रमाणित",
    brandTitle: "तपाईंको पैसा, फर्किंदै।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "फाइल गर्दै",
      blurb:
        "उनको तलबबाट ₹8,400 काटियो। उनले केही तिर्नुपर्दैन, फाइल गरेकी छैनन्, र स्कूलको शुल्क तिर्ने बेला भएको छ।",
      action: "पहिल्यै थाहा भएको कुरा पक्का गर्नुहोस्",
    },
    rakesh: {
      phase: "एउटा चिठी आयो",
      blurb:
        "चिठीले भन्छ उनले सेयरको ₹1,10,000 नाफा लुकाए। उनको फिर्ता रकम एउटा पुरानो मागविरुद्ध रोकिएको छ, जसबारे उनलाई कहिल्यै भनिएन।",
      action: "पढेर असहमति जनाउनुहोस्",
    },
    priya: {
      phase: "पर्खाइ",
      blurb:
        "71 दिनअघि फाइल गरिन्। अझै 'प्रक्रियामा छ' मात्र देखिन्छ। वास्तवमा दुईवटा कुराले रोकेका छन्, र कुन-कुनले भनेर कसैले भनेन।",
      action: "केले रोकेको छ, हेर्नुहोस्",
    },
    custom: {
      phase: "आफ्नै बनाउनुहोस्",
      blurbTitle: "कल्पनाको व्यक्ति",
      blurb:
        "सुरुदेखि एउटा व्यक्ति बनाउनुहोस् — उसको कमाइ, उसका दाबी, कति कर काटियो — र हिसाब आफैँ मिलेको हेर्नुहोस्।",
      action: "कोही बनाउनुहोस्",
    },
  },

  login: {
    authVerifying: "सर्भरसँग जाँच हुँदै छ…",
    authUnreachable: "साइन-इन सर्भरसम्म पुग्न सकिएन। तपाईंले भरेको केही पनि हराएको छैन — एकछिनमा फेरि प्रयास गर्नुहोस्।",
    authRejected: (detail: string) => `सर्भरले साइन-इन गर्न दिएन: ${detail}`,
    signedInAs: "साइन-इन भयो — सत्र सक्रिय छ",
    otpSentTo: (mobile: string) => `हामीले ${mobile} मा एउटा कोड पठाएका छौँ`,
    otpLabel: "छ अङ्कको कोड",
    weWillWait:
      "हतार छैन। कोड पर्खंदा तपाईंले भरेको केही पनि हराउने छैन।",
    resend: "फेरि पठाउनुहोस्",
    resendIn: (seconds: number) => `${seconds} सेकेन्डपछि फेरि माग्न सक्नुहुन्छ`,
    mockNotice:
      "यो प्रोटोटाइप हो, त्यसैले कोड स्क्रिनमै देखाइएको छ। कुनै वास्तविक सन्देश पठाइँदैन।",
    portalHeading: "ई-फाइलिङ प्रमाणीकरण",
    incorrectCode: "यो कोड मिलेन। छवटा अङ्क फेरि जाँचेर पुनः प्रयास गर्नुहोस्।",
    prototypeBox: "प्रोटोटाइप OTP प्रमाणीकरण",
    mockCodeLabel: "नमूना कोड",
    autoFill: "मेरा लागि भरिदेऊ",
    verifyEnter: "प्रमाणित गरेर भित्र जानुहोस्",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "छ अंकको प्रमाणीकरण कोड",
    otpDigitLabel: (position: number, total: number) =>
      `अंक ${position}, जम्मा ${total} मध्ये`,
    draftRestored: (time: string) => `${time} बजेको तपाईंको ड्राफ्ट फिर्ता ल्याइयो। केही पनि हराएन।`,
  },

  file: {
    heading: (amount: string) => `तपाईंको ${amount} विभागसँग थन्किएर बसेको छ`,
    subheading:
      "तलका प्रायः सबै कुरा तपाईंका बारेमा पहिल्यै बताइसकिएका छन्। पढ्नुहोस्, र केही गलत छ भने हामीलाई भन्नुहोस्।",

    checkThis: "यो जाँच्नुहोस् — भर्नुपर्दैन",
    factMeaning: "यो पहिल्यै बताइएको तथ्य हो, करको नियम होइन। तलको हिसाब यसैबाट बन्छ।",
    factMeaningByKind: {
      salary: "तपाईंसम्म पुगेको तलबबाट तपाईंको रोजगारदाताले यो दर्ता गरे। तलको हरेक हिसाब यहीँबाट सुरु हुन्छ।",
      interest: "बैंकहरूले तपाईंका खाताले कमाएको ब्याज वर्षमा एकपटक दर्ता गर्छन्। सानो रकम पनि आम्दानी नै हो।",
      dividend: "कम्पनी रजिस्ट्रारले तपाईंका सेयरले दिएको रकम दर्ता गरे। जुन वर्ष पाइयो, त्यही वर्षको आम्दानी हो।",
      capital_gains: "तपाईंको ब्रोकरले सेयर बेच्दा आएको पैसा दर्ता गरे। कर नाफामा लाग्छ — दर के बेचियो र कति समय राखियो भन्नेमा भर पर्छ।",
      rent: "पाएको भाडा आम्दानी हो; तिरेको भाडाले कर घटाउन सक्छ। दुवै अर्को पक्षले दर्ता गरेको अङ्कसँग मिल्नुपर्छ।",
      other: "अरू कुनै खण्डमा नअटाउने दर्ता भएको आम्दानी। यो पनि तलको हिसाबमा जोडिन्छ।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ले ${date} मा विभागलाई यो बताए`,
    underIdentifier: (identifier: string) => `दर्ता ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `यो गलत छ भने स्रोतमा यसलाई ${reporter} ले मात्र बदल्न सक्छन्। उनीहरूसँग ठ्याक्कै के माग्ने, हामी भनिदिन्छौँ।`,

    whatYouEarned: "तपाईंले के कमाउनुभयो",
    whatWasDeducted: "पहिल्यै काटिएको कर",
    whereMoneyGoes: "पैसा कहाँ जान्छ",
    whoYouAre: "तपाईं को हुनुहुन्छ",

    disputeHeading: "यहाँ के लेखिएको हुनुपर्थ्यो?",
    disputeAmountLabel: "सही रकम",
    disputeReasonLabel: "यो किन गलत हो",
    disputeSave: "यसलाई गलत भन्नुहोस्",
    selfReported: "तपाईं",
    returnLabel: "तपाईंको रिटर्न",

    outcomeOwesNothing: "तपाईंले केही तिर्नुपर्दैन।",
    outcomeRefund: (amount: string) => `${amount} तपाईंलाई फिर्ता आउँछ।`,
    outcomeOwes: (amount: string) => `${amount} तिर्न बाँकी छ।`,
    confirmAndFile: "यो पठाइदिनुहोस्",

    verifyHeading: "एउटा कदम बाँकी छ, नत्र यो गनिँदैन।",
    verifyBody:
      "यो तपाईं नै हो भनी पक्का नगरेसम्म तपाईंको रिटर्न दाखिल भएको मानिँदैन — पठाउँदै नपठाएजस्तै। यसमा लगभग बीस सेकेन्ड लाग्छ।",
    verifyAction: "यो म नै हुँ भनी पक्का गर्छु",

    voicePrompt: "वा बोलेरै भन्नुहोस्",
    voiceListening: "सुन्दै छौँ",
    voiceUnsupported:
      "यो फोनको ब्राउजरले अहिले सुन्न सक्दैन। लेखेर भन्न सक्नुहुन्छ — केही हराउँदैन।",
    voiceSimulated:
      "यो ब्राउजरले सुन्न सक्दैन, त्यसैले यो एउटा उदाहरण हो, तपाईंको आवाज होइन।",
    voiceError: "त्यो सुनिएन। लेखेर भन्न सक्नुहुन्छ — केही हराउँदैन।",
    dictate: "बोलेर भन्नुहोस्",
    disputePlaceholder: "यो अङ्क किन गलत हो — लेख्नुहोस् वा बोल्नुहोस्।",
    disputeDefaultReason: "बताइएको अङ्क गलत छ",
  },

  flow: {
    facts: "तपाईंको पैसा",
    deductions: "तपाईंले दाबी गर्न मिल्ने पैसा",
    regime: "पुरानो कि नयाँ",
    check: "जाँच्नुहोस्",
    file: "पठाउनुहोस्",
    stepOf: (n: number, total: number) => `${total} मध्ये चरण ${n}`,
    confirmedCount: (done: number, total: number) => `${total} मध्ये ${done} पक्का भयो`,
    allConfirmed: "सबै ठीक छ।",
    undoOne: "यो सच्याइ फिर्ता लिनुहोस्",
    correctedTo: (amount: string) => `तपाईं भन्नुहुन्छ यो ${amount} हुनुपर्छ`,
  },

  groups: {
    moneyIn: "भित्र आउने पैसा",
    taxPaid: "तपाईंका लागि पहिल्यै तिरिएको कर",
    deductionsClaimed: "तपाईंले गरेका दाबी",
    fromWhere: "यो कहाँबाट आयो",
    addIncome: "आम्दानी थप्नुहोस्",
  },

  deductions: {
    notAllowedNewRegime: "नयाँ व्यवस्थामा गनिँदैन — तपाईंको अभिलेखमा सुरक्षित।",
    startedAtCap: (amount: string) => `हामीले यसलाई ${amount} को सीमाबाट सुरु गरेका छौँ — “कति” मा गएर तपाईंले वास्तवमै तिरेको रकम राख्नुहोस्।`,
    heading: "तपाईंले दाबी गर्न मिल्ने पैसा",
    sub: "यी आफैँ हुँदैनन्। तपाईंले हो भन्नुपर्छ — तर साँचो भए मात्र।",
    claimedHeading: "तपाईंको रिटर्नमा पहिल्यै",
    worthUpTo: (amount: string) => `तपाईंको करयोग्य आम्दानीबाट ${amount} सम्म घट्न सक्छ`,
    worthWhatYouPaid: "जति तिर्नुभयो त्यति नै — वास्तविक रकम दाबी गर्नुहोस्",
    askRentQ: "के तपाईं बस्ने ठाउँको भाडा तिर्नुहुन्छ?",
    askRentWhy:
      "भाडा तिर्नुहुन्छ र रोजगारदाताबाट घरभाडा भत्ता पाउनुहुन्न भने, त्यसको केही हिस्सा तपाईंको करयोग्य आम्दानीबाट घट्न सक्छ।",
    askHealthQ: "के तपाईं परिवारलाई ढाक्ने स्वास्थ्य बिमाको पैसा तिर्नुहुन्छ?",
    askHealthWhy:
      "परिवारको बिमा कायम राख्न तिर्ने रकम तपाईंको करयोग्य आम्दानीबाट घट्न सक्छ।",
    ask80cQ: "के तपाईं सञ्चय कोष, जीवन बिमा वा स्कूलको शुल्कमा पैसा हाल्नुहुन्छ?",
    ask80cWhy:
      "यस्ता दीर्घकालीन बचत एउटै साझा सीमामा गनिन्छन्, र जति हाल्नुहुन्छ त्यति करयोग्य आम्दानीबाट घट्छ।",
    claimIt: "हो — यो दाबी गर्छु",
    skipIt: "होइन — यो छोड्नुहोस्",
    amountLabel: "कति",
    evidenceAttached: "प्रमाण संलग्न छ",
    evidenceMissing: "अहिलेसम्म कुनै प्रमाण जोडिएको छैन — अहिलेलाई ठीकै छ। रसिदहरू सम्हालेर राख्नुहोस्; विभागले पछि माग्न सक्छ।",
    newRegimeNoEffect:
      "नयाँ व्यवस्थामा यो दाबीले केही बदल्दैन — त्यहाँ यो मान्य छैन।",
    oldRegimeSaves: (amount: string) =>
      `पुरानो व्यवस्थामा यसले तपाईंको कर लगभग ${amount} घटाउँथ्यो।`,
  },

  regime: {
    heading: "कर लाग्ने दुई तरिका छन्। एउटा तपाईंका लागि राम्रो छ।",
    newRegimeName: "नयाँ व्यवस्था",
    oldRegimeName: "पुरानो व्यवस्था",
    refundLabel: "तपाईंलाई फिर्ता आउँछ",
    dueLabel: "तिर्न बाँकी",
    recommendedBadge: "तपाईंका लागि राम्रो",
    reasoningOldDeductions: (x: string, y: string) =>
      `तपाईंका दाबी जम्मा ${x} पुग्छन्, त्यसैले पुरानो व्यवस्थाले तपाईंलाई लगभग ${y} बचाउँछ।`,
    reasoningNewDefault: (y: string) =>
      `तपाईंका दाबीले यहाँ खासै फरक पार्दैनन्, त्यसैले नयाँ व्यवस्थाका कम दरहरूले तपाईंलाई लगभग ${y} बचाउँछन्।`,
    acceptRecommendation: "मेरा लागि जुन राम्रो छ, त्यही रोज्नुहोस्",
    overrideNote: "तपाईं जुनसुकै रोज्न सक्नुहुन्छ। यहाँ केही लुकेको वा बन्द छैन।",
  },

  check: {
    newRegimeClaimsZero: "तपाईंका दाबी सूचीबद्ध र सुरक्षित छन् — नयाँ व्यवस्थाले तिनलाई मान्दैन, त्यसैले यो पङ्क्ति ₹0 छ।",
    badgeReportedBy: (reporter: string) => `${reporter} ले दर्ता गरे`,
    badgeYouEntered: "तपाईंले हाल्नुभयो",
    badgeWeApplied: "हामीले तपाईंका लागि लागू गरेका छौँ",
    heading: "पूरै रिटर्न, एउटै पानामा",
    sub: "हरेक अङ्क कतैबाट आएको हो। कुनै पनि पङ्क्ति खोलेर ठ्याक्कै कहाँबाट भनेर हेर्नुहोस्।",
    grossIncome: "जति आयो सबै",
    standardDeduction: "मानक कटौती",
    deductionsLine: "तपाईंले गरेका दाबी",
    taxableIncome: "जसमा साँच्चै कर लाग्छ",
    slabTax: "कुनै राहतअघिको कर",
    rebate87A: "यसको केही भाग रद्द गर्ने छुट",
    cess: "स्वास्थ्य र शिक्षा थप",
    totalTax: "वर्षभरको कुल कर",
    tdsCredits: "तपाईंबाट पहिल्यै काटिएको",
    refundDue: "तपाईंलाई फिर्ता आउँछ",
    balanceDue: "तिर्न बाँकी",
    openLine: "यो कहाँबाट आयो, हेर्नुहोस्",
    closeLine: "लुकाउनुहोस्",
    calculationStatus: "प्रोटोटाइपको हिसाब — नियमका स्रोतहरू अझै प्राथमिक स्रोतबाट जाँच्न बाँकी छ (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} तल दिइएका पक्का गरिएका तथ्य र कर क्रेडिटबाट निकालिएको हो। यस प्रोटोटाइपमा स्रोत अभिलेखहरू कृत्रिम छन्।`,
    showCalculationTrail: "स्रोत र हिसाबको सिलसिला देखाउनुहोस्",
    hideCalculationTrail: "स्रोत र हिसाबको सिलसिला लुकाउनुहोस्",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} मा दर्ता गरिएको`,
    sourceIdentifier: (identifier: string) => `अभिलेख ${identifier}`,
    selfReportedSource: "यस रिटर्नमा तपाईं आफैँले बताउनुभएको",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: दर्ता गर्ने निकायहरूबाट प्राप्त जानकारीको वार्षिक विवरण।"
        : statement === "26AS"
        ? "Form 26AS: तपाईंको PAN मा दर्ता गरिएको कर क्रेडिटको विवरण।"
        : "यस तथ्यसँग जोडिएको स्रोत अभिलेख।",
    sectionMeaning: (section: string) =>
      `${section} कटौतीको एउटा खण्ड हो। यो व्यवस्थाले अनुमति दिएमा मात्र गनिन्छ।`,
    explainGross: "तपाईंले जाँचेर पक्का गरेका तथ्यहरू जोडेर।",
    explainStd: (amount: string) =>
      `तलब आम्दानी हुने हरेकले केही नमागीकनै ${amount} घटाउन पाउँछन्।`,
    explainDeductions: "यो व्यवस्थाले मान्ने दाबीहरू मात्र गनिन्छन्।",
    explainDisallowed: (section: string) =>
      `${section} यो व्यवस्थामा मान्य छैन, त्यसैले यहाँ यसको कुनै असर छैन।`,
    explainTaxable: "जति आयो, त्यसबाट मानक कटौती र तपाईंका दाबी घटाएर।",
    explainSlab: "कर तह-तह गरेर लाग्छ — आम्दानीको हरेक तहमा आ-आफ्नै दर।",
    explainRebate: (amount: string) =>
      `एउटा सीमामुनि अधिकांश कर रद्द हुन्छ — यहाँ त्यसको ${amount}।`,
    explainCess: "हरेक राहतपछि माथिबाट थपिने सानो प्रतिशत।",
    explainTds: "TDS भनेको स्रोतमै काटिएको कर हो: तपाईंलाई पैसा दिनेले तपाईंसम्म पुग्नुअघि नै यो रोकेर राखे।",
    fromFacts: "यिनै तथ्यहरूबाट:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "पठाउन तयार हुनुहुन्छ?",
    sub: "एकपटक गएपछि बदल्नु भनेको फेरि फाइल गर्नु हो। एकपटक फेरि हेर्नुहोस्, अनि पठाउनुहोस्।",
    stepChecking: "हिसाब जाँच्दै…",
    stepSealing: "अङ्कहरू सिल गर्दै…",
    stepFiled: "दाखिल भयो।",
    ackHeading: "पुग्यो।",
    ackBody:
      "तपाईंको रिटर्न आजदेखि गनिन्छ। एउटा कदम बाँकी छ: सोधिएपछि यो साँच्चै तपाईं नै हो भनी पक्का गर्ने। त्यतिबेलासम्म यो नपठाएसरह गनिन्छ।",
    ackNext:
      "त्यसपछि ट्र्याकरले तपाईंको पैसा ठ्याक्कै कहाँ छ र केले रोक्न सक्छ, देखाउँछ।",
    errorCause: "जाँच्ने चरण असफल भयो किनभने स्यान्डबक्सको fault स्विच खुला छ।",
    errorAction:
      "रिभ्युअर ड्रअरमा 'Trigger API Gateway Timeout' बन्द गर्नुहोस्, अनि फेरि पठाउनुहोस्। केही पनि हराएन।",
    errorCauseNetwork: "तपाईंको रिटर्न सर्भरसम्म पुगेन।",
    errorActionNetwork:
      "केही पनि दाखिल भएन र केही पनि हराएन। कनेक्सन जाँचेर फेरि पठाउनुहोस्।",
    retry: "फेरि पठाई हेर्नुहोस्",
  },

  wizard: {
    identityNextHint: "अगाडि बढ्न आफ्नो पूरा नाम र 10 अक्षरको PAN हाल्नुहोस्।",
    employmentConfirmHint: "तपाईंको अघिल्लो जवाफबाट — बदलिएको भए अर्को विकल्प रोज्नुहोस्।",
    tdsZeroWarning:
      "तलबको जागिरमा प्रायः कर पहिल्यै काटिएको हुन्छ — यो तपाईंको फारम 16 वा तलब पर्चीमा हुन्छ। यहाँ 0 लेख्नु भनेको प्रायः आफ्नो फिर्ता रकम छोड्नु हो।",
  },

  timeline: {
    filed: "तपाईंले आफ्नो रिटर्न पठाउनुभयो।",
    verified: "यो तपाईं नै हो भनी पक्का गर्नुभयो। रिटर्न यहीँदेखि गनिन्छ।",
    in_queue: "त्यही हप्ता दाखिल भएका अरू सबैसँगै लाइनमा।",
    under_review: "अहिले कसैले यसलाई हेर्दै छ।",
    determined: "टुङ्गो लाग्यो — यति फिर्ता आउँछ।",
    sent_to_bank: "तपाईंको बैंकमा पठाइयो।",
    credited: "तपाईंको खातामा।",
  },

  refund: {
    heading: (amount: string) => `${amount} तपाईंतिर आउँदै छ`,
    filedDaysAgo: (days: number) => `तपाईंले ${days} दिनअघि फाइल गर्नुभयो`,

    holdsHeading: (n: number) =>
      n === 1 ? "एउटा कुराको पर्खाइ छ" : `${n} कुराको पर्खाइ छ`,
    clearsInDays: (days: number) =>
      days === 1 ? "त्यो भएपछि लगभग एक दिन" : `त्यो भएपछि लगभग ${days} दिन`,

    cohortWindow: (from: number, to: number) =>
      `तपाईंकै हप्तामा फाइल भएका रिटर्नहरू अहिले प्रक्रियामा छन्। ${from} देखि ${to} दिन लाग्न सक्छ।`,

    states: {
      not_filed: "अझै पठाइएको छैन",
      filed_unverified: "पठाइयो, तपाईंको पुष्टि पर्खंदै",
      verified: "तपाईंले पुष्टि गर्नुभयो",
      in_queue: "लाइनमा",
      under_review: "कसैले हेर्दै छ",
      determined: "टुङ्गो लाग्यो",
      sent_to_bank: "तपाईंको बैंकमा पठाइयो",
      credited: "तपाईंको खातामा आयो",
      failed: "तपाईंको खातासम्म पुग्न सकेन",
    },

    bankFailedHeading: "तपाईंले रोजेको खाताले पैसा लिन सक्दैन।",
    bankMergedInto: (bank: string) => `त्यो शाखा अब ${bank} को हिस्सा हो`,
    useThisAccount: "बरु यहाँ पठाउनुहोस्",
    resolvedHold: "मिल्यो — अब यसले केही रोक्दैन।",
    stampFiled: "दाखिल",
  },

  notices: {
    heading: "विभागबाट आएका चिठीहरू",
    none: "केही फर्केर आएको छैन। यही राम्रो नतिजा हो।",
    respondBy: (date: string) => `${date} भित्र जवाफ दिनुहोस्`,
    ifYouDoNothing: "केही नगरे के हुन्छ",
    basedOn: "यो केमा आधारित छ",
    theCatch: "उनीहरूले के बिराएका छन्",
    agree: "यो ठीक हो",
    disagree: "यो गलत हो",
    dinLabel: "यस चिठीको सन्दर्भ नम्बर",
    dinExplain:
      "विभागको हरेक चिठीमा यो नम्बर हुनैपर्छ। यो बिनाको चिठी आधिकारिक रूपमा अस्तित्वमै छैन।",
  },

  dashboard: {
    serverFilings: "सर्भरमा दर्ता",
    serverFilingsEmpty: "LIVE सर्भरमा यस PAN को कुनै दाखिला छैन — माथिको भरपाई नमूना कथाको हिस्सा हो। यही एपबाट फाइल गर्नुभयो भने वास्तविक रसिद यहाँ आउँछ।",
    greetingLabel: "तपाईंको साइन-इन वाक्यांश",
    greetingWhy: "खाता बनाउँदा तपाईंले यो वाक्यांश रोज्नुभएको थियो। यसलाई देखाउन नसक्ने पेज हामी होइनौँ।",
    userDashboard: "प्रयोगकर्ता ड्यासबोर्ड",
    taxPrefills: "कर विवरण (AIS/26AS)",
    pendingActions: "बाँकी कारबाही",
    returnSummary: "रिटर्न सारांश AY 2026-27",
    reviewPrefill: "कर विवरण ट्याबमा पहिल्यै भरिएका विवरण जाँच्नुहोस्, अनि फाइल गर्न पुष्टि गर्नुहोस्।",
    filingSubmitted: "तपाईंको ई-फाइलिङ रिटर्न बुझाइयो। समयरेखामा प्रगति हेर्नुहोस्।",
    verifiedBanks: "फिर्ताका लागि प्रमाणित बैंक खाता",
    primaryRefundAccount: "मुख्य फिर्ता खाता",
    backupAccount: "वैकल्पिक खाता",
    ifscMeaning: "IFSC भनेको फिर्ता रकम पठाउन प्रयोग हुने 11 अक्षरको बैंक रुटिङ कोड हो।",
    refundTimeline: "फिर्ताको समयरेखा",
    filingSubmittedTimeline: "रिटर्न बुझाइयो",
    identityVerifiedTimeline: "पहिचान प्रमाणित",
    assessmentProcessingTimeline: "मूल्याङ्कन प्रक्रियामा",
    refundApprovedTimeline: "फिर्ता स्वीकृत",
    refundCreditedTimeline: "फिर्ता खातामा जम्मा",
    holdActive: "रोक सक्रिय: कारबाही ट्याबमा काम पूरा गर्नुहोस्",
    successCheckApp: "सफल! आफ्नो बैंकिङ एप हेर्नुहोस्।",
    outstandingNotices: "बाँकी अनुपालन सूचनाहरू",
    noPendingActions: "कुनै कारबाही बाँकी छैन",
    accountCompliant: "तपाईंको खाता पूर्ण रूपमा अनुपालनमा छ, कुनै बाँकी सूचना वा कर माग छैन।",
    actionableHolds: "कारबाही गर्न मिल्ने मूल्याङ्कन रोकहरू",
    uploadRent: "भाडा सम्झौता / रसिदहरू अपलोड गर्नुहोस्",
    landlordName: "घरधनीको नाम",
    landlordPan: "घरधनीको PAN (10 अङ्क)",
    selectPdfJpg: "PDF/JPG रोज्नुहोस्",
    submitReceipt: "रसिद बुझाउनुहोस्",
    responsePosition: "जवाफको अडान",
    agreeDept: "म विभागसँग सहमत छु",
    disagreeProof: "म असहमत छु (प्रमाण बुझाउनुहोस्)",
    responseDraft: "जवाफको बयान (मस्यौदा)",
    dictateStatement: "बोलेर लेखाउनुहोस्",
    sendResponse: "जवाफ पठाउनुहोस्",
    filingStatusLabel: "फाइलिङ स्थिति",
    bankValidated: "प्रमाणित",
    bankUnderProcess: "प्रक्रियामा",
    bankFailed: "असफल",
    staleIfscHold: "यो बैंक कोड अब कतै जाँदैन।",
    switchToNewIfsc: (ifsc: string) => `नयाँ कोडमा बदल्नुहोस् (${ifsc})`,
    personalized: {
      eyebrow: "तपाईंको ड्यासबोर्ड",
      headingFiled: "तपाईंको रिटर्न बुझाइसकियो — यो रह्यो त्यसको स्थिति",
      heading: {
        file_return: "आउनुहोस्, तपाईंको रिटर्न तयार पारौँ",
        check_refund: "आउनुहोस्, के फिर्ता आउन सक्छ हेरौँ",
        understand_notice: "आउनुहोस्, ध्यान चाहिने कुरा मिलाऔँ",
        correct_prefill: "आउनुहोस्, दर्ता भएको जानकारी जाँचौँ",
      },
      guidedBody: "हरेक अङ्क पक्का गर्नुअघि हामी त्यसको अर्थ बुझाउँछौँ।",
      quickBody: "बाटो छोटो राख्छौँ र अर्को निर्णय पहिले देखाउँछौँ।",
      unfiledBody: "पहिले, तपाईंका बारेमा पहिल्यै दर्ता भएको जानकारी पक्का गर्नुहोस्।",
      filedBody: "तपाईं जुन कामका लागि आउनुभयो, त्यसैसँग मिल्ने दृश्य हामीले खोलेका छौँ।",
      primaryAction: {
        facts: "मेरो दर्ता विवरण हेर्नुहोस्",
        overview: "मेरो फिर्ता ट्र्याकर देखाउनुहोस्",
        statement: "दर्ता विवरण जाँच्नुहोस्",
        actions: "ध्यान चाहिने कुरा देखाउनुहोस्",
      },
      focusLabel: "हामी यीमा नजर राख्छौँ",
      profileLabels: {
        work: "काम",
        income: "अनुमानित कुल आम्दानी",
        history: "फाइलिङको अनुभव",
      },
    },
  },

  onboarding: {
    eyebrow: "सुरु गर्नुअघि",
    title: "यसलाई तपाईंकै लागि मिलाऔँ।",
    intro:
      "पाँच छोटा जवाफले हामीलाई सही भाषा, गति र करका प्रश्न रोज्न मद्दत गर्छन्। पछि बदल्न सकिन्छ।",
    languageQuestion: "हामी कुन भाषामा कुरा गरौँ?",
    languageHelp: "सबैभन्दा पहिलो प्रश्न यही हो। भाषा जहिले पनि बदल्न सकिन्छ।",
    intentQuestion: "आज तपाईं यहाँ केका लागि आउनुभयो?",
    intentHelp: "त्यही कामलाई हामी सबैभन्दा पहिले राख्छौँ।",
    intentOptions: {
      file_return: {
        label: "यस वर्षको रिटर्न फाइल गर्ने",
        detail: "तपाईंका बारेमा पहिल्यै थाहा भएको कुराबाट सुरु गर्छौँ।",
      },
      check_refund: {
        label: "मैले पैसा फिर्ता पाउने हो कि, हेर्ने",
        detail: "के दर्ता भयो, कति तिरियो र के फिर्ता आउन सक्छ, हेर्नुहोस्।",
      },
      understand_notice: {
        label: "चिठी वा सूचना बुझ्ने",
        detail: "त्यसमा के लेखिएको छ, के दाउमा छ र अब के गर्ने, हेर्नुहोस्।",
      },
      correct_prefill: {
        label: "गलत देखिएको कुरा सच्याउने",
        detail: "अङ्कको स्रोत पत्ता लगाएर के बदलिनुपर्छ, दर्ता गर्नुहोस्।",
      },
    },
    intentCta: {
      file_return: "मेरो रिटर्न सुरु गर्नुहोस्",
      check_refund: "मैले पाउनुपर्ने के छ, हेर्नुहोस्",
      understand_notice: "मैले के गर्ने, देखाउनुहोस्",
      correct_prefill: "दर्ता भएको कुरा जाँच्नुहोस्",
    },
    situationQuestion: "आफ्नो करको अवस्थाबारे बताउनुहोस्।",
    situationHelp: "यहाँ दुई छोटा जवाफ नै पर्याप्त छन्।",
    professionLabel: "तपाईंको कामलाई कुनले सबैभन्दा ठीक बताउँछ?",
    professionOptions: {
      salaried: "तलबको जागिर",
      self_employed: "फ्रिल्यान्स वा आफ्नै काम",
      business_owner: "व्यवसायी",
      student: "विद्यार्थी",
      retired: "सेवानिवृत्त",
      investor: "लगानीकर्ता",
      other: "अरू केही",
    },
    filingHistoryLabel: "के तपाईंले पहिले आयकर रिटर्न फाइल गर्नुभएको छ?",
    filingHistoryOptions: {
      never: "छैन, यो पहिलो पटक हो",
      once: "एक-दुई पटक",
      every_year: "हरेक वर्ष",
    },
    incomeQuestion: "सबै स्रोतबाट तपाईंको कुल आम्दानी लगभग कति थियो?",
    incomeHelp: "अनुमान भए पुग्छ। ठ्याक्कै अङ्क अहिले चाहिँदैन।",
    incomeOptions: {
      none: "कुनै आम्दानी छैन",
      under_4: "₹4 लाखभन्दा कम",
      "4_to_8": "₹4 देखि ₹8 लाख",
      "8_to_12": "₹8 देखि ₹12 लाख",
      "12_to_25": "₹12 देखि ₹25 लाख",
      over_25: "₹25 लाखभन्दा बढी",
    },
    modeQuestion: "तपाईं कति विवरण हेर्न चाहनुहुन्छ?",
    modeHelp: "यसले सुरुवात मात्र तय गर्छ। जहिले पनि बदल्न सकिन्छ।",
    modeOptions: {
      simple: {
        label: "मेरा लागि गरिदेऊ",
        detail: "सरल शब्द, एकपटकमा एक कदम। बाँकी हामी सम्हाल्छौँ।",
      },
      full: {
        label: "मलाई सबै देखाऊ",
        detail: "हरेक अङ्क, हरेक नियम, हरेक हिसाब — सुरुदेखि नै।",
      },
    },
    focusQuestion: "यीमध्ये केमा हामीले ध्यान दिने?",
    focusHelp: "तपाईंलाई मिल्ने सबै रोज्नुहोस्। पक्का छैन भने 'थाहा छैन' रोज्दा पनि हुन्छ।",
    focusOptions: {
      salary: "तलब वा पेन्सन",
      freelance: "फ्रिल्यान्स काम",
      business: "व्यवसायको आम्दानी",
      rent: "मैले तिर्ने वा पाउने भाडा",
      interest: "बैंकको ब्याज",
      investments: "सेयर वा लगानी",
      deductions: "बचत, बिमा, घर कर्जा वा NPS",
      not_sure: "अझै पक्का छैन",
    },
    chooseOne: "एउटा रोज्नुहोस्",
    chooseAtLeastOne: "कम्तीमा एउटा रोज्नुहोस्",
    questionsLabel: "छोटो तयारी",
    questionsProgress: (current: number, total: number) => `${total} मध्ये ${current}`,
    savedLocally: "यस प्रोटोटाइपमा तपाईंका जवाफ यही ब्राउजरमा सुरक्षित हुन्छन्।",
    readyTitle: "यसलाई तपाईंकै बनाउन यति नै पर्याप्त छ।",
    readyBody:
      "यी जवाफबाट हामी के पहिले देखाउने भनेर तय गर्छौँ। व्यवस्थाको अन्तिम छनोट भने तपाईंले पक्का गरेका तथ्य र दाबीबाटै हुन्छ।",
    guidedLabel: "हामी कसरी बुझाउँछौँ",
    guidedValue: "जाँदाजाँदै शब्दहरू बुझाउँदै जान्छौँ।",
    quickValue: "बाटो छोटो राख्छौँ।",
    regimeLabel: "व्यवस्थाहरूसँग हाम्रो तरिका",
    claimsRegimeValue: "व्यवस्था रोज्नुअघि तपाईंका दाबी जाँच्छौँ।",
    compareRegimeValue: "तथ्य पक्का भएपछि दुवै व्यवस्था तुलना गर्छौँ।",
    focusLabel: "पहिले केमा ध्यान दिन्छौँ",
    startPath: "मेरो बाटोबाट सुरु गर्नुहोस्",
    changeAnswers: "जवाफ बदल्नुहोस्",
    tailoredBadge: "तपाईंको सुरुवाती बाटो",
    tailoredGuided: "बुझाउँदै अगाडि",
    tailoredQuick: "छोटो बाटो",
    tailoredRegimeClaims: "व्यवस्था रोज्नुअघि दाबीको जाँच",
    tailoredRegimeCompare: "तथ्यपछि दुवै व्यवस्थाको तुलना",
    tailoredIntent: (intent: string) => `पहिले: ${intent}`,
  },

  checklist: {
    divider: "फाइल गर्नुअघि",
    itemBefore: "“",
    itemAfter: "” पक्का गर्नुहोस् — शङ्का लागे कार्ड खोल्नुहोस्।",
    stdRow: "हामीले तपाईंका तर्फबाट लागू गरेको मानक कटौती पक्का गर्नुहोस्।",
    noteLocked: "माथिका हरेक पङ्क्तिमा चिनो लगाउनुहोस्, अनि मात्र यो बटन खुल्छ।",
    noteReady: "माथिका सबै कुरा पक्का भइसके। तयार हुनुहुन्छ भने फाइल गर्नुहोस्।",
    fileBtn: "यो रिटर्न फाइल गर्नुहोस्",
    lockedBtn: (n: number) => n === 1 ? "पहिले 1 वटा पङ्क्तिमा चिनो लगाउनुहोस्" : `पहिले अरू ${n} पङ्क्तिमा चिनो लगाउनुहोस्`,
  },

  factCard: {
    cardNo: (n: number, date: string) => `कार्ड ${String(n).padStart(2, "0")} · दर्ता ${date}`,
    whatThisMeans: "यसको अर्थ के हो",
    readFirst: "पहिले “यसको अर्थ के हो” खोल्नुहोस् — अनि पक्का गर्नुहोस्।",
    readyToConfirm: "पढ्नुभयो? तल पक्का गर्नुहोस्।",
  },

  signoff: {
    title: "हस्ताक्षर पुष्टि",
    declaration:
      "मैले माथिका अङ्कहरू पढेँ र स्रोत कागजातसँग भिडाएँ। यी सही र पूर्ण छन्।",
    action: "यी अङ्कहरूमा हस्ताक्षर गर्नुहोस्",
    signed: "हस्ताक्षर भयो — माथिको हरेक अङ्क पक्का भयो।",
    hint: "एउटै घोषणाले माथिका सबै अङ्क समेट्छ। कुनै अङ्कमा आपत्ति भए हस्ताक्षरअघि “होइन, यो गलत हो” रोज्नुहोस्।",
  },

  channels: {
    sectionLabel: "वर्ष एक नजरमा",
    earned: "तपाईंले कमाउनुभयो",
    toTax: "करमा गयो",
    overpaid: "तपाईंले बढी तिर्नुभयो",
    stillToPay: "अझै तिर्न बाँकी",
    stayed: "तपाईंबाट कहिल्यै गएन",
    kept: "तिर्नुपर्ने कर",
    back: "तपाईंकहाँ फर्किंदै",
    yoursInEnd: "अन्त्यमा तपाईंकै",
    collected: "पहिल्यै असुल भइसकेको",
    ofYear: "वर्षभरको पैसाको",
    sliceNote: "देखिनै नसक्ने पातलो हिस्सालाई साँचो भागभन्दा अलिक चौडा बनाइएको छ — छेउका अङ्क भने ठ्याक्कै सही छन्।",
    whereItWent: "तपाईंले कमाएको हरेक रुपैयाँ कहाँ गयो",
    earnedDesc: "तलब, ब्याज र बाँकी सबै — तपाईंलाई तिर्नेहरूले दर्ता गरेअनुसार।",
    toTaxDesc: "तपाईंले पाउने हरेक कटौतीपछि साँच्चै तिर्नुपर्ने कर।",
    backDesc: "तपाईंको तलबबाट लगियो तर तिर्नुपर्ने थिएन। यो तपाईंकहाँ फर्किन्छ।",
    dueDesc: "पहिल्यै असुल भएकोभन्दा बढीको बाँकी। यो अझै तिर्नुपर्छ।",
    howToRead: "यसलाई यसरी पढ्नुहोस्: यहाँ केही पनि हामीले बनाएका होइनौँ। हरेक अङ्क कसैले दाखिल गरेको कागजातबाट आएको हो, वा तपाईं आफैँले हाल्नुभएको हो। पेन्सिल टिप्पणीहरूले हरेकको साँचो अर्थ बुझाउँछन् — सरल शब्दमा, करका शब्दमा होइन।",
    meterCap: "तिर्नुपर्ने कर बनाम पहिल्यै असुल भएको",
  },

  agent: {
    title: "वापसी सहायक",
    open: "सहायक खोल्नुहोस्",
    close: "बन्द गर्नुहोस्",
    placeholder: "जाँच्न, बुझाउन वा फाइल गर्न भन्नुहोस्…",
    send: "पठाउनुहोस्",
    thinking: "काम हुँदै छ…",
    toolRan: "गरियो:",
    confirmTitle: "फाइल गर्न तयार — अङ्कहरू पक्का गर्नुहोस्",
    confirmBody: "तपाईंको पुष्टिविना केही फाइल हुँदैन। यही बुझाइनेछ:",
    confirmTotalTax: "कुल कर",
    confirmRefund: "तपाईंले पाउने फिर्ता",
    confirmDue: "तिर्न बाँकी रकम",
    confirmTaxable: "करयोग्य आम्दानी",
    confirmButton: "पक्का गरेर फाइल गर्नुहोस्",
    cancelButton: "रद्द गर्नुहोस्",
    filingDismissed: "हुन्छ — केही फाइल भएन।",
    error: "सहायकसम्म पुग्न सकिएन। तपाईंको रिटर्न जस्ताको तस्तै छ — फेरि प्रयास गर्नुहोस्।",
    intro: "म तपाईंको रिटर्न जाँच्न, कुनै पनि अङ्क बुझाउन, के-हुन्छ-भने हिसाब गर्न र फाइलिङको तयारी गर्न सक्छु। फाइल सधैँ तपाईंको पुष्टिपछि मात्र हुन्छ।",
    sample: "80C मा ₹1,50,000 लगानी गरे मेरो कति बच्थ्यो?",
  },

  footer: {
    prototype: "स्वतन्त्र अवधारणा प्रोटोटाइप।",
    notAffiliated:
      "यो आयकर विभाग, CBDT वा भारत सरकारसँग आबद्ध, समर्थित वा जोडिएको छैन। यहाँका हरेक नाम, PAN, रकम र कागजात बनाइएका हुन्। कुनै पनि सरकारी प्रणालीसँग सम्पर्क गरिँदैन।",
    honestyLink: "के साँचो हो र के नक्कली, हेर्नुहोस्",
  },
};

/**
 * Nepali translations of the localized mock strings. Keys are the byte-exact
 * English strings from LOCALIZED_MOCK_STRINGS. Model-generated; awaits native
 * review (T0.5).
 */
export const neMock: Record<string, string> = {
  "Your pay last year": "गत वर्षको तपाईंको तलब",
  "Interest your savings account earned": "बचत खाताले कमाएको ब्याज",
  "Interest your accounts earned": "तपाईंका खाताले कमाएको ब्याज",
  "Your primary contract income": "तपाईंको मुख्य करार आम्दानी",
  "Savings interest": "बचत खाताको ब्याज",
  "Tax withheld (TDS)": "पहिल्यै काटिएको कर (TDS)",
  "Provident Fund / ELSS Mutual Funds": "सञ्चय कोष / ELSS म्युचुअल फन्ड",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "उनको तलबबाट ₹8,400 काटियो। उनले केही तिर्नुपर्दैन। उनले अझै फाइल गरेकी छैनन्, र स्कूलको शुल्क तिर्ने बेला भएको छ।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "दुईवटा सूचना छन्। एउटाले भन्छ उनले ₹1,10,000 को सेयर नाफा लुकाए — वास्तवमा उनलाई ₹4,200 घाटा भयो। अर्कोले उनले कहिल्यै नसुनेको 2019 को बिलबापत उनको फिर्ता रकमको केही हिस्सा राख्न खोज्छ।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 दिनअघि फाइल गरिन्। पोर्टलमा 'प्रक्रियामा' बाहेक केही देखिँदैन। वास्तवमा दुई अलग-अलग कुराले उनको ₹34,800 रोकेका छन्।",
  "Tax already taken out of your pay": "तलबबाट पहिल्यै काटिएको कर (TDS)",
  "Dividend your shares paid out": "सेयरबाट पाएको लाभांश",
  "Money from selling shares": "सेयर बेचेर आएको पैसा",
  "Tax the bank withheld on your interest": "ब्याजमा बैंकले काटेको कर (TDS)",
  "Provident fund, insurance and your daughter's tuition": "सञ्चय कोष (PF), बिमा र छोरीको ट्युसन शुल्क",
  "Provident fund and your insurance premium": "सञ्चय कोष (PF) र तपाईंको बिमा प्रिमियम",
  "Health cover for the family": "परिवारका लागि स्वास्थ्य बिमा",
  "Rent you paid, with no house-rent allowance from your employer":
    "तपाईंले तिरेको भाडा, रोजगारदाताबाट घरभाडा भत्ता नपाईकन",
  "One figure doesn't match what your broker reported.": "एउटा अङ्क तपाईंको ब्रोकरले दर्ता गरेको अङ्कसँग मिल्दैन।",
  "₹18,740 of this is being held against an old bill.": "यसमध्ये ₹18,740 एउटा पुरानो बिलबापत रोकिएको छ।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "विभागलाई लाग्छ तपाईंले ₹1,10,000 को सेयर नाफा छुटाउनुभयो।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019 को बिल मिलाउन विभाग तपाईंको फिर्ता रकमबाट ₹18,740 राख्न चाहन्छ।",
  "Waiting on one thing: a receipt for your rent claim.": "एउटा कुराको पर्खाइ: तपाईंको भाडा दाबीको रसिद।",
  "The account you chose can't receive the money.": "तपाईंले रोजेको खाताले पैसा लिन सक्दैन।",
  "Held: your rent claim needs a receipt.": "रोकियो: तपाईंको भाडा दाबीलाई रसिद चाहिन्छ।",
  "Your bank account was checked and failed.": "तपाईंको बैंक खाता जाँचियो र असफल भयो।",
  "The department is asking you to look again at your rent claim.":
    "विभागले तपाईंलाई आफ्नो भाडा दाबी फेरि हेर्न भनेको छ।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities ले सेयर बिक्रीबाट ₹1,10,000 दर्ता गर्यो। तपाईंको रिटर्नमा यो देखिँदैन। यो नमिलेसम्म फिर्ता रकम जहाँ छ त्यहीँ रहन्छ।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 को एउटा माग यस वर्षको फिर्ता रकमसँग कट्टा गरिँदै छ। तपाईं यसको विरोध गर्न सक्नुहुन्छ, र 3 तारिखअघि नै पढ्नु राम्रो।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 सेप्टेम्बरसम्म केही नभने ₹1,10,000 तपाईंको आम्दानीमा जोडिन्छ र तपाईंको फिर्ता रकमबाट लगभग ₹34,300 घट्छ।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 सेप्टेम्बरसम्म केही नभने तपाईंको फिर्ता रकमबाट ₹18,740 काटिन्छ र मामिला बन्द भएको मानिन्छ।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "तपाईंले ₹1,10,000 का सेयर बेच्नुभयो र त्यसको नाफा घोषणा गर्नुभएन।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 मैले बेचेका सबै चीजको कुल मूल्य हो, मैले कमाएको होइन। ती कारोबारमा मलाई ₹4,200 घाटा भयो। वर्षभरको मेरो ब्रोकर विवरणले किनेको मूल्य देखाउँछ।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "तपाईंको 2019-20 वर्षको ₹18,740 अझै बाँकी छ, त्यसैले यो यस वर्षको फिर्ता रकमबाट लिइनेछ।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "तपाईंले ₹60,000 भाडाको दाबी गर्नुभयो। देखाउन केही पनि जोडिएको थिएन। रसिद वा घरधनीको नाम र PAN थप्नुहोस्, अनि यो अगाडि बढ्छ।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank गत वर्ष Deccan Union Bank को हिस्सा बन्यो। खाता अझै छ — तर त्यसमा पैसा पठाउने कोड अब छैन।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "तपाईंले 80GG अन्तर्गत ₹60,000 भाडाको दाबी गर्नुभयो, तर पुष्टि गर्न केही पनि जोडिएको थिएन।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "मैले यो भाडा साँच्चै तिरेको हुँ। मसँग घरधनीका मासिक रसिदहरू छन् र उनको नाम र PAN दिन सक्छु।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "यो कुनै आरोप होइन र अहिलेसम्म कुनै जरिवाना छैन। तर तपाईंले दाबीको प्रमाण नदिएसम्म वा दाबी फिर्ता नलिएसम्म तपाईंको ₹34,800 जहाँ छ त्यहीँ रहन्छ।",
  "Look at what they reported": "उनीहरूले के दर्ता गरे, हेर्नुहोस्",
  "Read the 2019 demand": "2019 को माग पढ्नुहोस्",
  "Add the receipt": "रसिद थप्नुहोस्",
  "Point it at the right account": "सही खातातिर फर्काउनुहोस्",
  "Supervisor, garment unit": "सुपरभाइजर, गार्मेन्ट युनिट",
  "Operations manager; trades equity on the side": "अपरेसन म्यानेजर; साथसाथै सेयर कारोबार गर्छन्",
  "Junior architect; first time filing": "जुनियर आर्किटेक्ट; पहिलोपटक फाइल गर्दै",
  "Independent Consultant": "स्वतन्त्र परामर्शदाता",
  "Primary School Teacher": "प्राथमिक विद्यालय शिक्षिका",
  "Retired bank clerk": "सेवानिवृत्त बैंक कर्मचारी",
  "Retired": "सेवानिवृत्त",
  "Teacher": "शिक्षक",
  "You sent your return in.": "तपाईंले आफ्नो रिटर्न पठाउनुभयो।",
  "You confirmed it was you. The return counts from here.":
    "यो तपाईं नै हो भनी पक्का गर्नुभयो। रिटर्न यहीँदेखि गनिन्छ।",
  "In the queue with everything else filed that week.": "त्यही हप्ता दाखिल भएका अरू सबैसँगै लाइनमा।",
  "Someone is looking at one figure.": "कसैले एउटा अङ्क हेर्दै छ।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "तपाईंको ब्रोकरले दाखिल गरेको सेयर-बिक्रीको एउटा पङ्क्ति तपाईंको रिटर्नसँग मिल्दैन।",
  "OTP verified, 4 minutes after filing.": "OTP प्रमाणित, फाइल गरेको 4 मिनेटपछि।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG अन्तर्गत ₹60,000 दाबी गरिएको, पुष्टि गर्न केही पनि जोडिएको छैन।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank ले जाँच फर्कायो: IFSC GODG0004417 अब कतै जाँदैन।",
  "OTP Verification Complete": "OTP प्रमाणीकरण पूरा",
  "Outstanding Compliance Notices": "बाँकी अनुपालन सूचनाहरू",
  "Draft Legal Response": "कानुनी जवाफको मस्यौदा",
  "No Pending Actions": "कुनै कारबाही बाँकी छैन",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "तपाईंको खाता पूर्ण रूपमा अनुपालनमा छ, कुनै बाँकी सूचना वा कर माग छैन।",
  "Actionable Assessment Holds": "कारबाही गर्न मिल्ने मूल्याङ्कन रोकहरू",
  "Upload Rent Agreement / Receipts": "भाडा सम्झौता / रसिदहरू अपलोड गर्नुहोस्",
  "Landlord Name": "घरधनीको नाम",
  "Landlord PAN (10 Digits)": "घरधनीको PAN (10 अङ्क)",
  "Select PDF/JPG": "PDF/JPG रोज्नुहोस्",
  "Submit Receipt": "रसिद बुझाउनुहोस्",
  "Response Position": "जवाफको अडान",
  "I Agree with Department": "म विभागसँग सहमत छु",
  "I Disagree (Submit Proof)": "म असहमत छु (प्रमाण बुझाउनुहोस्)",
  "Response Statement (Draft)": "जवाफको बयान (मस्यौदा)",
  "Dictate Statement": "बोलेर लेखाउनुहोस्",
  "Listening...": "सुन्दै छु...",
  "Explain your disagreement or agreement...": "आफ्नो सहमति वा असहमति बुझाउनुहोस्...",
  "Send Response": "जवाफ पठाउनुहोस्",
  "Cancel": "रद्द गर्नुहोस्",
  "Validate Bank Code": "बैंक कोड प्रमाणित गर्नुहोस्",
  "Update Bank IFSC": "बैंक IFSC अद्यावधिक गर्नुहोस्",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "बैंक विवरण प्रमाणित गर्न 11 अङ्कको बैंक रुटिङ कोड (IFSC) जाँच्नुहोस्।",
  "IFSC Code": "IFSC कोड",
};

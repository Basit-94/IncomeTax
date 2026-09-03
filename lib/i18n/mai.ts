/**
 * मैथिली (Maithili). Typed against the English source, so this file cannot
 * fall behind it.
 *
 * This translation is model-generated and awaits review by a native Maithili
 * speaker who knows tax vocabulary (project task T0.5). That is a real
 * limitation, disclosed rather than hidden. Written in Devanagari, using
 * Maithili's own pronouns (अहाँ/हम), verb forms (अछि/छी/करू) and honorifics —
 * not Hindi with substitutions.
 *
 * Digits stay Latin. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes,
 * example codes and proper nouns stay untranslated, following hi.ts precedent.
 */

import type { Dict } from "./en";

export const mai: Dict = {
  langName: "Maithili",
  langNativeName: "मैथिली",
  dir: "ltr",

  common: {
    modeAgentic: "Agentic",
    modeManual: "Manual",
    continue: "आगू बढ़ू",
    back: "पाछू",
    yesThatsRight: "हँ, ई ठीक अछि",
    noThisIsWrong: "नहि, ई गलत अछि",
    iDontUnderstand: "हमरा ई नहि बुझाएल",
    close: "बन्द करू",
    saveAndGoOn: "सहेजि कऽ आगू बढ़ू",
    loading: "एक क्षण",
    logOut: "लॉग आउट",
    undo: "वापस लिअ",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "जाँच आ फाइल करबाक आसान बाट",
    independent: "स्वतंत्र प्रोटोटाइप",
    taxYear: "कर वर्ष 2026-27",
    language: "भाषा",
    light: "इजोत",
    dark: "अन्हार",
    sandbox: "समीक्षा उपकरण",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "मुख्य सामग्री पर जाउ",
  },

  validate: {
    panTooShort: (n: number) => `एखन धरि ${n} अक्षर अछि। PAN मे 10 होइत अछि।`,
    panShape:
      "PAN मे पहिने पाँच अक्षर, फेर चारि अंक, फेर एकटा अक्षर होइत अछि — जेना DEMPS4417K।",
    panSandboxHint:
      "अहाँ एतय जे लिखैत छी से अहाँक ब्राउज़र सँ बाहर नहि जाइत अछि। एहि प्रोटोटाइप मे हरेक PAN DEMP सँ शुरू होइत अछि, तेँ कोनो असली PAN भूल सँ नहि ताकल जा सकैत अछि।",
    ifscTooShort: (n: number) => `एखन धरि ${n} अक्षर अछि। बैंक कोड मे 11 होइत अछि।`,
    ifscShape:
      "बैंक कोड मे पहिने चारि अक्षर, फेर एकटा शून्य, फेर छह आओर — जेना DECU0834471।",
  },

  landing: {
    question: "की आयकर विभाग लग अहाँक पाइ रुकल अछि?",
    subtext:
      "एतय अबैत अधिकांश लोक केँ किछु देबाक नहि रहैत छनि — हुनका उनटे भेटबाक रहैत छनि। अपन PAN दिअ, ओतय की अछि से हम कहि देब।",
    panLabel: "अहाँक PAN",
    panHelp: "दस अक्षर, अहाँक PAN कार्ड सँ",
    panPlaceholder: "जेना, DEMPS4417K",
    check: "देखू हमरा कतेक भेटबाक अछि",
    orTryAs: "वा तीन लोक मे सँ कोनो एक बनि कऽ देखू",
    honestyLink: "एतय की असली अछि आ की बनाओल",
    architectureLink: "तकनीकी बनावट",
    badge: "सरल कर रिटर्न, प्रत्यक्ष प्रमाणित",
    brandTitle: "अहाँक पाइ, वापसीक बाट पर।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "फाइल करब",
      blurb:
        "हुनक दरमाहा सँ ₹8,400 काटि लेल गेल। हुनका किछु देबाक नहि छनि, फाइल नहि केने छथि, आ स्कूलक फीस देबाक अछि।",
      action: "जे पहिने सँ बूझल अछि से पक्का करू",
    },
    rakesh: {
      phase: "एकटा चिट्ठी आयल",
      blurb:
        "चिट्ठी कहैत अछि जे ओ शेयरक ₹1,10,000 मुनाफा नुकओलनि। हुनक वापसीक पाइ एकटा पुरान माँगक बदला रोकि लेल गेल अछि, जकर खबरि हुनका कहियो नहि देल गेलनि।",
      action: "पढ़ू आ असहमति जनाउ",
    },
    priya: {
      phase: "प्रतीक्षा",
      blurb:
        "71 दिन पहिने फाइल केलनि। एखनो 'प्रक्रिया मे अछि' टा लिखल अछि। असल मे दूटा बात रोकने अछि, आ कोन-कोन से किनको नहि कहल गेलनि।",
      action: "देखू की रोकने अछि",
    },
    custom: {
      phase: "अपन बनाउ",
      blurbTitle: "गढ़ल लोक",
      blurb:
        "शुरू सँ एकटा लोक बनाउ — हुनक कमाई, हुनक दावा, कतेक कर कटलनि — आ देखू जे हिसाब अपने कोना बैसैत अछि।",
      action: "कियो बना लिअ",
    },
  },

  login: {
    authVerifying: "सर्वर सँ जाँच भऽ रहल अछि…",
    authUnreachable: "साइन-इन सर्वर धरि नहि पहुँचल जा सकल। अहाँक भरल किछु नहि हराएल — कनी काल मे फेर प्रयास करू।",
    authRejected: (detail: string) => `सर्वर साइन-इन नहि होअय देलक: ${detail}`,
    signedInAs: "साइन-इन भऽ गेल — सत्र सक्रिय अछि",
    otpSentTo: (mobile: string) => `हम ${mobile} पर एकटा कोड पठौने छी`,
    otpLabel: "छह अंकक कोड",
    weWillWait:
      "कोनो हड़बड़ी नहि। कोडक प्रतीक्षा मे अहाँक भरल किछु नहि जायत।",
    resend: "फेर पठाउ",
    resendIn: (seconds: number) => `${seconds} सेकेंड बाद फेर माँगि सकैत छी`,
    mockNotice:
      "ई एकटा प्रोटोटाइप अछि, तेँ कोड स्क्रीने पर देखाओल गेल अछि। कोनो असली संदेश नहि पठाओल जाइत अछि।",
    portalHeading: "ई-फाइलिंग सत्यापन",
    incorrectCode: "ई कोड नहि मिलैत अछि। छहो अंक फेर जाँचि कऽ दोबारा प्रयास करू।",
    prototypeBox: "प्रोटोटाइप OTP सत्यापन",
    mockCodeLabel: "नमूना कोड",
    autoFill: "हमरा लेल भरि दिअ",
    verifyEnter: "सत्यापित करू आ भीतर जाउ",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "छह अंकक सत्यापन कोड",
    otpDigitLabel: (position: number, total: number) =>
      `अंक ${position}, कुल ${total} मे सँ`,
    draftRestored: (time: string) => `${time} बजेक अहाँक ड्राफ्ट घुरा देल गेल। किछु नहि हराएल।`,
  },

  file: {
    heading: (amount: string) => `अहाँक ${amount} विभाग लग पड़ल अछि`,
    subheading:
      "नीचाँ लिखल लगभग सभ बात अहाँक बारे मे पहिने सँ बताओल जा चुकल अछि। पढ़ू, आ किछु गलत हो तँ हमरा कहू।",

    checkThis: "एकरा जाँचि लिअ — भरबाक नहि अछि",
    factMeaning: "ई पहिने सँ बताओल गेल तथ्य अछि, करक नियम नहि। नीचाँक हिसाब एही सँ बनैत अछि।",
    factMeaningByKind: {
      salary: "अहाँ धरि पहुँचल दरमाहा सँ अहाँक नियोक्ता ई दर्ज केलनि। नीचाँक हरेक गणना एतहि सँ शुरू होइत अछि।",
      interest: "बैंक साल मे एक बेर अहाँक खाताक ब्याज दर्ज करैत अछि। छोट रकम सेहो आमदनी थिक।",
      dividend: "कंपनी रजिस्ट्रार अहाँक शेयर सँ भेटल भुगतान दर्ज केलनि। जाहि साल भेटल, ओही सालक आमदनी थिक।",
      capital_gains: "अहाँक ब्रोकर शेयर बेचला सँ आयल पाइ दर्ज केलनि। कर लाभ पर लगैत अछि — दर एहि पर निर्भर अछि जे की बेचल गेल आ कतेक दिन राखल गेल।",
      rent: "भेटल भाड़ा आमदनी थिक; देल भाड़ा कर घटा सकैत अछि। दुनू दोसर पक्षक दर्ज कएल अंक सँ मिलबाक चाही।",
      other: "एहन दर्ज आमदनी जे कोनो आन खाना मे नहि अटैत अछि। इहो नीचाँक गणना मे जुड़ैत अछि।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ${date} केँ विभाग केँ ई बतओलनि`,
    underIdentifier: (identifier: string) => `पंजीकरण ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `ई गलत अछि तँ मूल जगह पर एकरा खाली ${reporter} टा बदलि सकैत छथि। हुनका सँ ठीक-ठीक की माँगब से हम कहि देब।`,

    whatYouEarned: "अहाँ कतेक कमेलहुँ",
    whatWasDeducted: "कर पहिने कतेक कटल",
    whereMoneyGoes: "पाइ कतय जायत",
    whoYouAre: "अहाँ के छी",

    disputeHeading: "एहि मे की लिखल हेबाक चाही?",
    disputeAmountLabel: "सही रकम",
    disputeReasonLabel: "ई गलत किएक अछि",
    disputeSave: "एकरा गलत कहू",
    selfReported: "अहाँ",
    returnLabel: "अहाँक रिटर्न",

    outcomeOwesNothing: "अहाँ केँ किछु देबाक नहि अछि।",
    outcomeRefund: (amount: string) => `${amount} अहाँ केँ वापस भेटत।`,
    outcomeOwes: (amount: string) => `${amount} देबाक बाँकी अछि।`,
    confirmAndFile: "एकरा पठा दिअ",

    verifyHeading: "बस एकटा डेग बाँकी अछि, नहि तँ ई नहि गनल जायत।",
    verifyBody:
      "जा धरि अहाँ पक्का नहि करब जे ई अहीं छी, ता धरि अहाँक रिटर्न दाखिल नहि मानल जायत — जेना अहाँ पठेबे नहि केलहुँ। एहि मे लगभग बीस सेकेंड लगैत अछि।",
    verifyAction: "पक्का करू जे ई हमहीं छी",

    voicePrompt: "वा बाजि कऽ कहू",
    voiceListening: "सुनि रहल छी",
    voiceUnsupported:
      "एहि फोनक ब्राउज़र एखन नहि सुनि सकैत अछि। अहाँ लिखि कऽ कहि सकैत छी — किछु नहि जायत।",
    voiceSimulated:
      "ई ब्राउज़र नहि सुनि सकैत अछि, तेँ ई एकटा उदाहरण थिक, अहाँक अवाज नहि।",
    voiceError: "से नहि सुनाएल। अहाँ लिखि कऽ कहि सकैत छी — किछु नहि जायत।",
    dictate: "बाजि कऽ कहू",
    disputePlaceholder: "ई अंक किएक गलत अछि — लिखू वा बाजू।",
    disputeDefaultReason: "बताओल गेल अंक गलत अछि",
  },

  flow: {
    facts: "अहाँक पाइ",
    deductions: "जे पाइ अहाँ माँगि सकैत छी",
    regime: "पुरान की नव",
    check: "जाँचि लिअ",
    file: "पठा दिअ",
    stepOf: (n: number, total: number) => `${total} मे सँ डेग ${n}`,
    confirmedCount: (done: number, total: number) => `${total} मे सँ ${done} पक्का`,
    allConfirmed: "सभ ठीक अछि।",
    undoOne: "ई सुधार वापस लिअ",
    correctedTo: (amount: string) => `अहाँ कहैत छी जे ई ${amount} हेबाक चाही`,
  },

  groups: {
    moneyIn: "अबैत पाइ",
    taxPaid: "अहाँ लेल पहिने कटल कर",
    deductionsClaimed: "अहाँक दावा",
    fromWhere: "ई कतय सँ आयल",
    addIncome: "आमदनी जोड़ू",
  },

  deductions: {
    notAllowedNewRegime: "नव व्यवस्था मे नहि गनल जाइत अछि — अहाँक रिकॉर्ड मे सुरक्षित।",
    startedAtCap: (amount: string) => `हम एकरा ${amount} क सीमा सँ शुरू केलहुँ — “कतेक” मे जा कऽ अपन असली रकम दिअ।`,
    heading: "जे पाइ अहाँ माँगि सकैत छी",
    sub: "ई अपने नहि होइत अछि। अहाँ केँ हँ कहय पड़त — मुदा तखने, जखन सत्य हो।",
    claimedHeading: "अहाँक रिटर्न मे पहिने सँ",
    worthUpTo: (amount: string) => `अहाँक कर-योग्य आमदनी सँ ${amount} धरि घटि सकैत अछि`,
    worthWhatYouPaid: "जतेक अहाँ सच मे देलहुँ ततबे — सही रकम भरू",
    askRentQ: "की अहाँ रहबाक भाड़ा दैत छी?",
    askRentWhy:
      "जँ अहाँ भाड़ा दैत छी आ नियोक्ता सँ घर-भाड़ा भत्ता नहि भेटैत अछि, तँ ओकर किछु हिस्सा अहाँक कर-योग्य आमदनी सँ घटि सकैत अछि।",
    askHealthQ: "की अहाँ परिवारक स्वास्थ्य बीमाक पाइ दैत छी?",
    askHealthWhy:
      "परिवारक बीमा चालू रखबा लेल अहाँ जे दैत छी, से अहाँक कर-योग्य आमदनी सँ घटि सकैत अछि।",
    ask80cQ: "की अहाँ भविष्य निधि, जीवन बीमा वा स्कूलक फीस मे पाइ लगबैत छी?",
    ask80cWhy:
      "एहन दीर्घकालिक बचत एकटा संयुक्त सीमा मे गनल जाइत अछि, आ जतेक अहाँ दैत छी ततेक कर-योग्य आमदनी सँ घटैत अछि।",
    claimIt: "हँ — ई माँगब",
    skipIt: "नहि — एकरा छोड़ू",
    amountLabel: "कतेक",
    evidenceAttached: "प्रमाण संलग्न अछि",
    evidenceMissing: "एखन धरि कोनो प्रमाण नहि जुड़ल — एखन लेल ठीके अछि। रसीद सम्हारि कऽ राखू; विभाग बाद मे माँगि सकैत अछि।",
    newRegimeNoEffect:
      "नव व्यवस्था मे एहि दावा सँ किछु नहि बदलैत अछि — ओतय ई मान्य नहि अछि।",
    oldRegimeSaves: (amount: string) =>
      `पुरान व्यवस्था मे ई अहाँक कर लगभग ${amount} घटा दैत।`,
  },

  regime: {
    heading: "कर लगबाक दू तरीका अछि। एकटा अहाँ लेल नीक अछि।",
    newRegimeName: "नव व्यवस्था",
    oldRegimeName: "पुरान व्यवस्था",
    refundLabel: "अहाँ केँ वापस भेटत",
    dueLabel: "देबाक बाँकी",
    recommendedBadge: "अहाँ लेल नीक",
    reasoningOldDeductions: (x: string, y: string) =>
      `अहाँक दावा कुल ${x} होइत अछि, तेँ पुरान व्यवस्था अहाँक लगभग ${y} बचबैत अछि।`,
    reasoningNewDefault: (y: string) =>
      `अहाँक दावा एतय बेसी अंतर नहि अनैत अछि, तेँ नव व्यवस्थाक कम दर अहाँक लगभग ${y} बचबैत अछि।`,
    acceptRecommendation: "हमरा लेल जे नीक अछि, सैह चुनू",
    overrideNote: "अहाँ कोनो चुनि सकैत छी। एतय किछु नुकाएल वा बन्द नहि अछि।",
  },

  check: {
    newRegimeClaimsZero: "अहाँक दावा सूचीबद्ध आ सुरक्षित अछि — नव व्यवस्था ओकरा मान्य नहि करैत अछि, तेँ ई पाँती ₹0 अछि।",
    badgeReportedBy: (reporter: string) => `${reporter} दर्ज केलनि`,
    badgeYouEntered: "अहाँ दर्ज केलहुँ",
    badgeWeApplied: "हम अहाँ लेल लागू केलहुँ",
    heading: "पूरा रिटर्न, एकहि पन्ना पर",
    sub: "हरेक अंक कतहु सँ आयल अछि। कोनो पाँती खोलू आ ठीक-ठीक देखू जे कतय सँ।",
    grossIncome: "जे किछु आयल",
    standardDeduction: "मानक कटौती",
    deductionsLine: "अहाँक दावा",
    taxableIncome: "जाहि पर कर सच मे लगैत अछि",
    slabTax: "कोनो राहति सँ पहिनेक कर",
    rebate87A: "छूट जे एकर किछु हिस्सा रद्द करैत अछि",
    cess: "स्वास्थ्य आ शिक्षा जोड़",
    totalTax: "सालक कुल कर",
    tdsCredits: "पहिने अहाँ सँ कटि चुकल",
    refundDue: "अहाँ केँ वापस भेटत",
    balanceDue: "देबाक बाँकी",
    openLine: "देखू ई कतय सँ आयल",
    closeLine: "नुकाउ",
    calculationStatus: "ई प्रोटोटाइपक हिसाब अछि — नियमक स्रोतक जाँच एखन प्राथमिक स्रोत सँ बाँकी अछि (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} नीचाँ देल पक्का कएल तथ्य आ कर क्रेडिट सँ निकालल गेल अछि। एहि प्रोटोटाइप मे स्रोत रिकॉर्ड कृत्रिम अछि।`,
    showCalculationTrail: "स्रोत आ हिसाबक कड़ी देखू",
    hideCalculationTrail: "स्रोत आ हिसाबक कड़ी नुकाउ",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} केँ दर्ज`,
    sourceIdentifier: (identifier: string) => `रिकॉर्ड ${identifier}`,
    selfReportedSource: "एहि रिटर्न मे अहाँक अपने बताओल",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: रिपोर्ट करयवला संस्था सभ सँ भेटल जानकारीक वार्षिक विवरण।"
        : statement === "26AS"
        ? "Form 26AS: अहाँक PAN पर दर्ज कर क्रेडिटक विवरण।"
        : "एहि तथ्य सँ जुड़ल स्रोत रिकॉर्ड।",
    sectionMeaning: (section: string) =>
      `${section} कटौतीक एकटा खण्ड थिक। ई तखने गनल जाइत अछि जखन ई व्यवस्था एकर अनुमति दैत अछि।`,
    explainGross: "अहाँक जाँचल-पक्का कएल तथ्य सभ केँ जोड़ि कऽ।",
    explainStd: (amount: string) =>
      `दरमाहा वला हरेक लोक केँ बिनु माँगनहि ${amount} घटैत अछि।`,
    explainDeductions: "खाली वैह दावा गनल जाइत अछि जे एहि व्यवस्था मे मान्य अछि।",
    explainDisallowed: (section: string) =>
      `${section} एहि व्यवस्था मे मान्य नहि अछि, तेँ एतय एकर कोनो असरि नहि।`,
    explainTaxable: "जे आयल, ताहि मे सँ मानक कटौती आ अहाँक दावा घटा कऽ।",
    explainSlab: "कर तह-तह मे लगैत अछि — आमदनीक हरेक तह पर अपन दर।",
    explainRebate: (amount: string) =>
      `एकटा सीमा सँ नीचाँ अधिकांश कर रद्द भऽ जाइत अछि — एतय ओकर ${amount}।`,
    explainCess: "हरेक राहतिक बाद ऊपर सँ लागयवला छोट प्रतिशत।",
    explainTds: "TDS क माने अछि स्रोतहि पर काटल कर: जे अहाँ केँ पाइ देलक, से अहाँ धरि पहुँचबा सँ पहिनहि एकरा रोकि लेलक।",
    fromFacts: "एही तथ्य सभ सँ:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "पठेबा लेल तैयार छी?",
    sub: "एक बेर गेला पर बदलबाक बाट अछि फेर सँ फाइल करब। एक बेर आओर देखि लिअ, फेर पठाउ।",
    stepChecking: "हिसाब जाँचि रहल छी…",
    stepSealing: "अंक सील कऽ रहल छी…",
    stepFiled: "दाखिल भऽ गेल।",
    ackHeading: "जमा भऽ गेल।",
    ackBody:
      "अहाँक रिटर्न आइ सँ गनल जायत। एकटा डेग बाँकी अछि: पुछला पर ई पक्का करब जे ई सच मे अहीं छी। ता धरि ई नहि पठाओल जकाँ गनल जायत।",
    ackNext:
      "ओकर बाद ट्रैकर ठीक-ठीक देखाओत जे अहाँक पाइ कतय अछि आ ओकरा की रोकि सकैत अछि।",
    errorCause: "जाँचक डेग एहि लेल रुकल जे सैंडबॉक्सक fault स्विच चालू अछि।",
    errorAction:
      "रिव्यूअर ड्रॉअर मे 'Trigger API Gateway Timeout' बन्द करू, फेर दोबारा पठाउ। किछु नहि गेल।",
    errorCauseNetwork: "अहाँक रिटर्न सर्वर धरि नहि पहुँचल।",
    errorActionNetwork:
      "किछु दाखिल नहि भेल आ किछु हराएल नहि। कनेक्शन जाँचू, फेर दोबारा पठाउ।",
    retry: "फेर पठेबाक प्रयास करू",
  },

  wizard: {
    identityNextHint: "आगू बढ़बा लेल अपन पूरा नाम आ 10 अक्षरक PAN दिअ।",
    employmentConfirmHint: "अहाँक पहिलुक जवाब सँ — बदलि गेल हो तँ दोसर विकल्प चुनू।",
    tdsZeroWarning:
      "दरमाहा वला नोकरी मे लगभग सदिखन कर पहिने सँ कटल रहैत अछि — ई अहाँक फॉर्म 16 वा दरमाहा पर्ची पर अछि। एतय 0 लिखबाक माने प्रायः अपन रिफंड छोड़ि देब होइत अछि।",
  },

  timeline: {
    filed: "अहाँ अपन रिटर्न पठा देलहुँ।",
    verified: "अहाँ पक्का केलहुँ जे ई अहीं छी। रिटर्न एतहि सँ गनल जायत।",
    in_queue: "ओही सप्ताह दाखिल भेल आन सभ संगे कतार मे।",
    under_review: "एखन कियो एकरा देखि रहल छथि।",
    determined: "तय भऽ गेल — एतबा अहाँ केँ वापस भेटत।",
    sent_to_bank: "अहाँक बैंक केँ पठा देल गेल।",
    credited: "अहाँक खाता मे।",
  },

  refund: {
    heading: (amount: string) => `${amount} अहाँ दिस आबि रहल अछि`,
    filedDaysAgo: (days: number) => `अहाँ ${days} दिन पहिने पठेने छलहुँ`,

    holdsHeading: (n: number) =>
      n === 1 ? "एकटा बातक प्रतीक्षा अछि" : `${n} बातक प्रतीक्षा अछि`,
    clearsInDays: (days: number) =>
      days === 1 ? "से भेला पर लगभग एक दिन" : `से भेला पर लगभग ${days} दिन`,

    cohortWindow: (from: number, to: number) =>
      `अहींक सप्ताह मे पठाओल रिटर्न सभ एखन देखल जा रहल अछि। ${from} सँ ${to} दिन लागि सकैत अछि।`,

    states: {
      not_filed: "एखन नहि पठाओल गेल",
      filed_unverified: "पठा देल गेल, अहाँक पुष्टि बाँकी",
      verified: "अहाँ पुष्टि कऽ देलहुँ",
      in_queue: "कतार मे",
      under_review: "कियो देखि रहल छथि",
      determined: "तय भऽ गेल",
      sent_to_bank: "अहाँक बैंक केँ पठाओल गेल",
      credited: "अहाँक खाता मे आबि गेल",
      failed: "अहाँक खाता धरि नहि पहुँचि सकल",
    },

    bankFailedHeading: "अहाँ जे खाता चुनलहुँ, ताहि मे पाइ नहि जा सकैत अछि।",
    bankMergedInto: (bank: string) => `ओ शाखा आब ${bank} क हिस्सा थिक`,
    useThisAccount: "एकर बदला एतय पठाउ",
    resolvedHold: "सोझरा गेल — आब किछु नहि रोकैत अछि।",
    stampFiled: "दाखिल",
  },

  notices: {
    heading: "विभाग सँ आयल चिट्ठी सभ",
    none: "किछु घुरि कऽ नहि आयल अछि। इएह नीक बात थिक।",
    respondBy: (date: string) => `${date} धरि जवाब दिअ`,
    ifYouDoNothing: "जँ अहाँ किछु नहि करब",
    basedOn: "ई कोन आधार पर अछि",
    theCatch: "एहि मे हुनका सभ सँ की चूक भेलनि",
    agree: "ई ठीक अछि",
    disagree: "ई गलत अछि",
    dinLabel: "एहि चिट्ठीक संदर्भ नंबर",
    dinExplain:
      "विभागक हरेक चिट्ठी पर ई नंबर हेबाक चाही। एकरा बिना चिट्ठीक कोनो अस्तित्वे नहि मानल जाइत अछि।",
  },

  dashboard: {
    serverFilings: "सर्वर पर दर्ज",
    serverFilingsEmpty: "LIVE सर्वर पर एहि PAN क कोनो दाखिल रिटर्न नहि — ऊपरक पावती नमूना कथाक हिस्सा थिक। एही एप सँ फाइल करू तँ असली रसीद एतय आओत।",
    greetingLabel: "अहाँक साइन-इन वाक्य",
    greetingWhy: "खाता बनबैत काल अहाँ ई वाक्य चुनने छलहुँ। जे पेज एकरा नहि देखा सकय, से हम नहि छी।",
    userDashboard: "यूज़र डैशबोर्ड",
    taxPrefills: "कर जानकारी (AIS/26AS)",
    pendingActions: "बाँकी कारबाई",
    returnSummary: "रिटर्न सारांश AY 2026-27",
    reviewPrefill: "कर जानकारी टैब मे पहिने सँ भरल विवरण जाँचू, फेर फाइल करबाक पुष्टि करू।",
    filingSubmitted: "अहाँक ई-फाइलिंग रिटर्न जमा भऽ गेल। समय-रेखा पर प्रगति देखू।",
    verifiedBanks: "रिफंड लेल सत्यापित बैंक खाता",
    primaryRefundAccount: "मुख्य रिफंड खाता",
    backupAccount: "बैकअप खाता",
    ifscMeaning: "IFSC रिफंड पठेबा मे प्रयोग होबयवला 11 अक्षरक बैंक रूटिंग कोड थिक।",
    refundTimeline: "रिफंडक समय-रेखा",
    filingSubmittedTimeline: "रिटर्न जमा भेल",
    identityVerifiedTimeline: "पहचान सत्यापित",
    assessmentProcessingTimeline: "आकलन प्रक्रिया मे",
    refundApprovedTimeline: "रिफंड स्वीकृत",
    refundCreditedTimeline: "रिफंड खाता मे जमा",
    holdActive: "रोक सक्रिय: एक्शन टैब मे कारबाई पूरा करू",
    successCheckApp: "सफलता! अपन बैंकिंग एप देखू।",
    outstandingNotices: "बाँकी अनुपालन सूचना सभ",
    noPendingActions: "कोनो कारबाई बाँकी नहि",
    accountCompliant: "अहाँक खाता पूरा तरहेँ अनुपालन मे अछि, कोनो बाँकी सूचना वा कर माँग नहि।",
    actionableHolds: "कारबाई योग्य आकलन रोक",
    uploadRent: "भाड़ा समझौता / रसीद अपलोड करू",
    landlordName: "मकान मालिकक नाम",
    landlordPan: "मकान मालिकक PAN (10 अंक)",
    selectPdfJpg: "PDF/JPG चुनू",
    submitReceipt: "रसीद जमा करू",
    responsePosition: "जवाबक पक्ष",
    agreeDept: "हम विभाग सँ सहमत छी",
    disagreeProof: "हम असहमत छी (प्रमाण जमा करू)",
    responseDraft: "जवाबक बयान (मसौदा)",
    dictateStatement: "बाजि कऽ लिखाउ",
    sendResponse: "जवाब पठाउ",
    filingStatusLabel: "फाइलिंग स्थिति",
    bankValidated: "सत्यापित",
    bankUnderProcess: "प्रक्रिया मे",
    bankFailed: "असफल",
    staleIfscHold: "ई बैंक कोड आब कतहु नहि जाइत अछि।",
    switchToNewIfsc: (ifsc: string) => `नव कोड पर बदलू (${ifsc})`,
    personalized: {
      eyebrow: "अहाँक डैशबोर्ड",
      headingFiled: "अहाँक रिटर्न जमा भऽ चुकल अछि — ई रहल ओकर स्थिति",
      heading: {
        file_return: "आउ, अहाँक रिटर्न तैयार करी",
        check_refund: "आउ, देखी जे की पाइ वापस आबि सकैत अछि",
        understand_notice: "आउ, धियान माँगयवला बात सम्हारी",
        correct_prefill: "आउ, बताओल गेल जानकारी जाँची",
      },
      guidedBody: "हरेक अंकक पुष्टि सँ पहिने हम ओकर माने बुझायब।",
      quickBody: "बाट छोट राखब आ अगिला जरूरी निर्णय पहिने देखायब।",
      unfiledBody: "पहिने, अहाँक बारे मे पहिने सँ दर्ज जानकारीक पुष्टि करू।",
      filedBody: "अहाँ जाहि काज लेल एलहुँ, ताही सँ मिलैत दृश्य हम पहिने खोलने छी।",
      primaryAction: {
        facts: "हमर दर्ज विवरण देखू",
        overview: "हमर रिफंड ट्रैकर देखाउ",
        statement: "दर्ज विवरण जाँचू",
        actions: "धियान माँगयवला बात देखाउ",
      },
      focusLabel: "हम एहि सभ पर नजरि राखब",
      profileLabels: {
        work: "काज",
        income: "अनुमानित कुल आमदनी",
        history: "फाइलिंगक अनुभव",
      },
    },
  },

  onboarding: {
    eyebrow: "शुरू करबा सँ पहिने",
    title: "एकरा अहाँक लेल तैयार करी।",
    intro:
      "पाँचटा छोट जवाब हमरा सही भाषा, गति आ करक प्रश्न चुनबा मे मदति करत। अहाँ एकरा बाद मे बदलि सकैत छी।",
    languageQuestion: "हम कोन भाषा मे गप करी?",
    languageHelp: "सभ सँ पहिने इएह प्रश्न अछि। भाषा अहाँ कखनो बदलि सकैत छी।",
    intentQuestion: "आइ अहाँ एतय किएक एलहुँ?",
    intentHelp: "ओही काज केँ हम सभ सँ पहिने राखब।",
    intentOptions: {
      file_return: {
        label: "एहि सालक रिटर्न फाइल करबाक अछि",
        detail: "अहाँक बारे मे जे पहिने सँ बूझल अछि, ओतहि सँ शुरू करब।",
      },
      check_refund: {
        label: "देखबाक अछि जे पाइ वापस भेटत की नहि",
        detail: "की बताओल गेल, कतेक कर कटल आ की वापस आबि सकैत अछि, से देखू।",
      },
      understand_notice: {
        label: "चिट्ठी वा नोटिस बुझबाक अछि",
        detail: "एहि मे की लिखल अछि, कतेक दाँव पर अछि आ आगू की करबाक अछि, से देखू।",
      },
      correct_prefill: {
        label: "गलत लगैत बात ठीक करबाक अछि",
        detail: "अंकक स्रोत ताकू आ की बदलबाक चाही से दर्ज करू।",
      },
    },
    intentCta: {
      file_return: "हमर रिटर्न शुरू करू",
      check_refund: "देखू हमरा की भेटबाक अछि",
      understand_notice: "कहू हमरा की करबाक अछि",
      correct_prefill: "जे बताओल गेल अछि से जाँचू",
    },
    situationQuestion: "अपन करक स्थितिक बारे मे कहू।",
    situationHelp: "एतय दूटा छोट जवाब बहुत अछि।",
    professionLabel: "अहाँक काज केँ एहि मे सँ के सभ सँ ठीक कहैत अछि?",
    professionOptions: {
      salaried: "नोकरी",
      self_employed: "फ्रीलांस वा अपन काज",
      business_owner: "व्यवसायी",
      student: "विद्यार्थी",
      retired: "सेवानिवृत्त",
      investor: "निवेशक",
      other: "किछु आओर",
    },
    filingHistoryLabel: "की अहाँ पहिने आयकर रिटर्न फाइल केने छी?",
    filingHistoryOptions: {
      never: "नहि, ई पहिल बेर अछि",
      once: "एक-दू बेर",
      every_year: "हर साल",
    },
    incomeQuestion: "सभ स्रोत सँ अहाँक कुल कमाई लगभग कतेक छल?",
    incomeHelp: "एकटा अनुमान बहुत अछि। ठीक-ठीक अंक एखन नहि चाही।",
    incomeOptions: {
      none: "कोनो कमाई नहि",
      under_4: "₹4 लाख सँ कम",
      "4_to_8": "₹4 सँ ₹8 लाख",
      "8_to_12": "₹8 सँ ₹12 लाख",
      "12_to_25": "₹12 सँ ₹25 लाख",
      over_25: "₹25 लाख सँ बेसी",
    },
    modeQuestion: "अहाँ कतेक विवरण देखय चाहैत छी?",
    modeHelp: "ई खाली शुरुआत तय करैत अछि। अहाँ कखनो बदलि सकैत छी।",
    modeOptions: {
      simple: {
        label: "हमरा लेल कऽ दिअ",
        detail: "सरल भाषा, एक बेर मे एक डेग। बाँकी हम सम्हारब।",
      },
      full: {
        label: "हमरा सभ किछु देखाउ",
        detail: "हरेक अंक, हरेक नियम, हरेक गणना — शुरुए सँ।",
      },
    },
    focusQuestion: "एहि मे सँ कोन बात पर हम धियान दी?",
    focusHelp: "जे अहाँ पर लागू हो, सभ चुनू। पक्का नहि हो तँ 'पता नहि' चुनू।",
    focusOptions: {
      salary: "दरमाहा वा पेंशन",
      freelance: "फ्रीलांस काज",
      business: "व्यवसायक कमाई",
      rent: "देल वा भेटल भाड़ा",
      interest: "बैंकक ब्याज",
      investments: "शेयर वा निवेश",
      deductions: "बचत, बीमा, होम लोन वा NPS",
      not_sure: "एखन पक्का नहि",
    },
    chooseOne: "एकटा चुनू",
    chooseAtLeastOne: "कम सँ कम एकटा चुनू",
    questionsLabel: "छोट तैयारी",
    questionsProgress: (current: number, total: number) => `${total} मे सँ ${current}`,
    savedLocally: "एहि प्रोटोटाइप मे अहाँक जवाब एही ब्राउज़र मे सहेजल जाइत अछि।",
    readyTitle: "एकरा अहाँक अपन बनेबा लेल एतबा बहुत अछि।",
    readyBody:
      "एही जवाब सभ सँ हम तय करब जे अहाँ केँ पहिने की देखाबी। व्यवस्थाक अंतिम चुनाव तँ अहाँक पक्का कएल तथ्य आ दावे पर होयत।",
    guidedLabel: "हम कोना बुझायब",
    guidedValue: "चलैत-चलैत शब्द बुझबैत जायब।",
    quickValue: "बाट छोट राखब।",
    regimeLabel: "व्यवस्था सभक संग हमर तरीका",
    claimsRegimeValue: "व्यवस्था चुनबा सँ पहिने अहाँक दावा जाँचब।",
    compareRegimeValue: "तथ्य पक्का भेला पर दुनू व्यवस्थाक तुलना करब।",
    focusLabel: "पहिने कोन बात पर धियान",
    startPath: "हमर बाट सँ शुरू करू",
    changeAnswers: "जवाब बदलू",
    tailoredBadge: "अहाँक शुरुआती बाट",
    tailoredGuided: "बुझबैत आगू बढ़ब",
    tailoredQuick: "छोट बाट",
    tailoredRegimeClaims: "व्यवस्था सँ पहिने दावाक जाँच",
    tailoredRegimeCompare: "तथ्यक बाद दुनू व्यवस्थाक तुलना",
    tailoredIntent: (intent: string) => `पहिने: ${intent}`,
  },

  checklist: {
    divider: "फाइल करबा सँ पहिने",
    itemBefore: "“",
    itemAfter: "” क पुष्टि करू — शंका हो तँ कार्ड खोलू।",
    stdRow: "हम अहाँक दिस सँ जे मानक कटौती लागू केलहुँ, ओकर पुष्टि करू।",
    noteLocked: "ऊपरक हरेक पाँती पर सही लगाउ, तखने ई बटन खुजत।",
    noteReady: "ऊपरक सभ बात पक्का भऽ गेल। तैयार होइ तँ फाइल करू।",
    fileBtn: "ई रिटर्न फाइल करू",
    lockedBtn: (n: number) => n === 1 ? "पहिने 1 टा आओर पाँती पर सही लगाउ" : `पहिने ${n} टा आओर पाँती पर सही लगाउ`,
  },

  factCard: {
    cardNo: (n: number, date: string) => `कार्ड ${String(n).padStart(2, "0")} · दर्ज ${date}`,
    whatThisMeans: "एकर माने की",
    readFirst: "पहिने “एकर माने की” खोलू — फेर पुष्टि करू।",
    readyToConfirm: "पढ़ि लेलहुँ? नीचाँ पुष्टि करू।",
  },

  signoff: {
    title: "हस्ताक्षर पुष्टि",
    declaration:
      "हम ऊपरक अंक सभ पढ़लहुँ आ स्रोत कागज सँ मिलओलहुँ। ई सही आ पूर्ण अछि।",
    action: "एहि अंक सभ पर हस्ताक्षर करू",
    signed: "हस्ताक्षर भऽ गेल — ऊपरक हरेक अंक पक्का अछि।",
    hint: "एकटा घोषणा ऊपरक सभ अंक पर लागू होइत अछि। कोनो अंक पर आपत्ति हो तँ हस्ताक्षर सँ पहिने “नहि, ई गलत अछि” चुनू।",
  },

  channels: {
    sectionLabel: "साल एक नजरि मे",
    earned: "अहाँ कमेलहुँ",
    toTax: "कर मे गेल",
    overpaid: "अहाँ बेसी देलहुँ",
    stillToPay: "एखन देबाक अछि",
    stayed: "अहाँ सँ कहियो गेबे नहि कएल",
    kept: "जे कर बनैत छल",
    back: "अहाँ लग वापस आबि रहल अछि",
    yoursInEnd: "अंत मे अहाँक",
    collected: "पहिने कटि चुकल",
    ofYear: "साल भरिक पाइक",
    sliceNote: "जे हिस्सा देखबा जोग नहि अछि, ओकरा अपन असली भाग सँ कनी चौड़ा बनाओल गेल अछि — संग लिखल अंक एकदम सही अछि।",
    whereItWent: "अहाँक कमाईक हरेक टाका कतय गेल",
    earnedDesc: "दरमाहा, ब्याज आ बाँकी सभ — जेना पाइ देनिहार सभ दर्ज केलनि।",
    toTaxDesc: "हरेक हकक कटौतीक बाद अहाँ पर सच मे जे कर बनल।",
    backDesc: "अहाँक दरमाहा सँ लेल गेल मुदा कहियो बनिते नहि छल। ई अहाँ लग घुरत।",
    dueDesc: "जे कटि चुकल ताहि सँ आगूक बकाया। ई एखन देबाक अछि।",
    howToRead: "एकरा एना पढ़ू: एतय किछु हम नहि गढ़लहुँ। हरेक अंक कोनो दाखिल कागज सँ आयल अछि वा अहाँ अपने दर्ज केलहुँ। पेंसिल नोट बुझबैत अछि जे हरेक अंकक असली माने की — सोझ शब्द मे, करक शब्द मे नहि।",
    meterCap: "जे कर बनल बनाम जे पहिने कटि चुकल",
  },

  agent: {
    title: "वापसी सहायक",
    open: "सहायक खोलू",
    close: "बन्द करू",
    placeholder: "जाँचय, बुझाबय वा फाइल करय लेल कहू…",
    send: "पठाउ",
    thinking: "काज चलि रहल अछि…",
    toolRan: "केलहुँ:",
    confirmTitle: "फाइल करबा लेल तैयार — अंक जाँचू",
    confirmBody: "अहाँक पुष्टि बिना किछु फाइल नहि होयत। ई जमा होयत:",
    confirmTotalTax: "कुल कर",
    confirmRefund: "अहाँ केँ भेटयवला रिफंड",
    confirmDue: "देय राशि",
    confirmTaxable: "कर योग्य आमदनी",
    confirmButton: "पुष्टि कऽ फाइल करू",
    cancelButton: "रद्द करू",
    filingDismissed: "ठीक अछि — किछु फाइल नहि भेल।",
    error: "सहायक धरि नहि पहुँचल जा सकल। अहाँक रिटर्न जहिना छल तहिना अछि — फेर प्रयास करू।",
    intro: "हम अहाँक रिटर्न जाँचि सकैत छी, कोनो अंक बुझा सकैत छी, जँ-तँ क हिसाब लगा सकैत छी आ फाइल करबाक तैयारी कऽ सकैत छी। फाइल सदिखन अहाँक पुष्टिक बादे होइत अछि।",
    sample: "80C मे ₹1,50,000 लगेला पर हमर कतेक बचत होयत?",
  },

  footer: {
    prototype: "स्वतंत्र अवधारणा प्रोटोटाइप।",
    notAffiliated:
      "ई आयकर विभाग, CBDT वा भारत सरकार सँ जुड़ल, समर्थित वा सम्बद्ध नहि अछि। एतय देल हरेक नाम, PAN, रकम आ कागज बनाओल गेल अछि। कोनो सरकारी सिस्टम सँ संपर्क नहि कएल जाइत अछि।",
    honestyLink: "देखू की असली अछि आ की बनाओल",
  },
};

/**
 * Maithili translations of the localized mock strings. Keys are the byte-exact
 * English strings from LOCALIZED_MOCK_STRINGS. Model-generated; awaits native
 * review (T0.5).
 */
export const maiMock: Record<string, string> = {
  "Your pay last year": "पछिला सालक अहाँक दरमाहा",
  "Interest your savings account earned": "बचत खाता सँ कमाएल ब्याज",
  "Interest your accounts earned": "अहाँक खाता सभ सँ कमाएल ब्याज",
  "Your primary contract income": "अहाँक मुख्य कॉन्ट्रैक्ट आमदनी",
  "Savings interest": "बचत खाताक ब्याज",
  "Tax withheld (TDS)": "पहिने काटल कर (TDS)",
  "Provident Fund / ELSS Mutual Funds": "भविष्य निधि / ELSS म्यूचुअल फंड",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "हुनक दरमाहा सँ ₹8,400 काटि लेल गेल। हुनका किछु देबाक नहि छनि। ओ एखन फाइल नहि केने छथि, आ स्कूलक फीस देबाक अछि।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "दूटा नोटिस अछि। एकटा कहैत अछि जे ओ ₹1,10,000 क शेयर मुनाफा नुकओलनि — असल मे हुनका ₹4,200 क घाटा भेलनि। दोसर ओहि 2019 क बिल लेल हुनक रिफंडक किछु हिस्सा रोकय चाहैत अछि जकर खबरि हुनका कहियो नहि छलनि।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 दिन पहिने फाइल केलनि। पोर्टल पर 'प्रक्रिया मे' छोड़ि किछु नहि लिखल अछि। असल मे दूटा अलग-अलग बात हुनक ₹34,800 रोकने अछि।",
  "Tax already taken out of your pay": "दरमाहा सँ पहिनहि काटल कर (TDS)",
  "Dividend your shares paid out": "शेयर सँ भेटल लाभांश",
  "Money from selling shares": "शेयर बेचला सँ भेटल पाइ",
  "Tax the bank withheld on your interest": "ब्याज पर बैंकक काटल कर (TDS)",
  "Provident fund, insurance and your daughter's tuition": "भविष्य निधि (PF), बीमा आ बेटीक ट्यूशन फीस",
  "Provident fund and your insurance premium": "भविष्य निधि (PF) आ अहाँक बीमा प्रीमियम",
  "Health cover for the family": "परिवार लेल स्वास्थ्य बीमा",
  "Rent you paid, with no house-rent allowance from your employer":
    "अहाँक देल भाड़ा, नियोक्ता सँ घर-भाड़ा भत्ता बिना",
  "One figure doesn't match what your broker reported.": "एकटा अंक अहाँक ब्रोकरक दर्ज कएल अंक सँ नहि मिलैत अछि।",
  "₹18,740 of this is being held against an old bill.": "एहि मे सँ ₹18,740 एकटा पुरान बिलक बदला रोकल जा रहल अछि।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "विभाग केँ लगैत छै जे अहाँ ₹1,10,000 क शेयर मुनाफा छोड़ि देलहुँ।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019 क बिल सोझरेबा लेल विभाग अहाँक रिफंड सँ ₹18,740 राखय चाहैत अछि।",
  "Waiting on one thing: a receipt for your rent claim.": "एकटा बातक प्रतीक्षा: अहाँक भाड़ा दावाक रसीद।",
  "The account you chose can't receive the money.": "अहाँ जे खाता चुनलहुँ, ताहि मे पाइ नहि जा सकैत अछि।",
  "Held: your rent claim needs a receipt.": "रोकल गेल: अहाँक भाड़ा दावा लेल रसीद चाही।",
  "Your bank account was checked and failed.": "अहाँक बैंक खाताक जाँच भेल आ से असफल रहल।",
  "The department is asking you to look again at your rent claim.":
    "विभाग अहाँ सँ अपन भाड़ा दावा फेर देखबा लेल कहि रहल अछि।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities शेयर बिक्री सँ ₹1,10,000 दर्ज केलक। अहाँक रिटर्न ई नहि देखबैत अछि। जा धरि ई नहि सोझराइत अछि, रिफंड जतय अछि ओतहि रहत।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 क एकटा माँग एहि सालक रिफंड सँ समायोजित कएल जा रहल अछि। अहाँ एकर विरोध कऽ सकैत छी, आ 3 तारीख सँ पहिने एकरा पढ़ि लिअ।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "जँ अहाँ 10 सितम्बर धरि किछु नहि कहब, तँ ₹1,10,000 अहाँक आमदनी मे जोड़ल जायत आ अहाँक रिफंड सँ लगभग ₹34,300 काटल जायत।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "जँ अहाँ 3 सितम्बर धरि किछु नहि कहब, तँ अहाँक रिफंड सँ ₹18,740 काटल जायत आ मामला बन्द मानल जायत।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "अहाँ ₹1,10,000 क शेयर बेचलहुँ आ ओहि पर भेल मुनाफाक घोषणा नहि केलहुँ।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 हमर बेचल सभ वस्तुक कुल मूल्य थिक, हमर मुनाफा नहि। ओहि सभ सौदा मे हमरा ₹4,200 क घाटा भेल। सालक हमर ब्रोकर विवरण कीनल मूल्य देखबैत अछि।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "अहाँ पर 2019-20 सालक ₹18,740 एखनो बाँकी अछि, तेँ ई एहि सालक रिफंड सँ लेल जायत।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "अहाँ ₹60,000 भाड़ाक दावा केलहुँ। देखेबा लेल किछु नहि जोड़ल छल। रसीद वा मकान मालिकक नाम आ PAN जोड़ू, आ ई आगू बढ़त।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank पछिला साल Deccan Union Bank क हिस्सा बनि गेल। खाता एखनो अछि — मुदा ओहि मे पाइ पठाबयवला कोड आब नहि अछि।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "अहाँ 80GG क अंतर्गत ₹60,000 भाड़ाक दावा केलहुँ, मुदा समर्थन मे किछु नहि जोड़ल छल।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "हम ई भाड़ा सचमुच देने छी। हमरा लग मकान मालिकक मासिक रसीद अछि आ हम हुनक नाम आ PAN दऽ सकैत छी।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "ई कोनो आरोप नहि थिक आ एखन धरि कोनो जुर्माना नहि अछि। मुदा जा धरि अहाँ दावाक प्रमाण नहि देब वा दावा वापस नहि लेब, ता धरि अहाँक ₹34,800 जतय अछि ओतहि रहत।",
  "Look at what they reported": "देखू ओ सभ की दर्ज केलनि",
  "Read the 2019 demand": "2019 क माँग पढ़ू",
  "Add the receipt": "रसीद जोड़ू",
  "Point it at the right account": "एकरा सही खाता दिस घुमाउ",
  "Supervisor, garment unit": "सुपरवाइजर, गारमेंट यूनिट",
  "Operations manager; trades equity on the side": "ऑपरेशंस मैनेजर; संगहि शेयर मे कारोबार करैत छथि",
  "Junior architect; first time filing": "जूनियर आर्किटेक्ट; पहिल बेर फाइल कऽ रहल छथि",
  "Independent Consultant": "स्वतंत्र सलाहकार",
  "Primary School Teacher": "प्राथमिक विद्यालयक शिक्षिका",
  "Retired bank clerk": "सेवानिवृत्त बैंक क्लर्क",
  "Retired": "सेवानिवृत्त",
  "Teacher": "शिक्षक",
  "You sent your return in.": "अहाँ अपन रिटर्न पठा देलहुँ।",
  "You confirmed it was you. The return counts from here.":
    "अहाँ पक्का केलहुँ जे ई अहीं छी। रिटर्न एतहि सँ गनल जायत।",
  "In the queue with everything else filed that week.": "ओही सप्ताह दाखिल भेल आन सभ संगे कतार मे।",
  "Someone is looking at one figure.": "कियो एकटा अंक देखि रहल छथि।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "अहाँक ब्रोकरक दाखिल कएल शेयर-बिक्रीक एकटा पाँती अहाँक रिटर्न सँ नहि मिलैत अछि।",
  "OTP verified, 4 minutes after filing.": "OTP सत्यापित, फाइल केलाक 4 मिनट बाद।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG क अंतर्गत ₹60,000 क दावा, समर्थन मे किछु नहि जोड़ल।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank जाँच घुरा देलक: IFSC GODG0004417 आब कतहु नहि जाइत अछि।",
  "OTP Verification Complete": "OTP सत्यापन पूर्ण",
  "Outstanding Compliance Notices": "बाँकी अनुपालन नोटिस",
  "Draft Legal Response": "कानूनी जवाबक मसौदा",
  "No Pending Actions": "कोनो कारबाई बाँकी नहि",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "अहाँक खाता पूरा तरहेँ अनुपालन मे अछि, कोनो बाँकी नोटिस वा कर माँग नहि।",
  "Actionable Assessment Holds": "कारबाई योग्य आकलन रोक",
  "Upload Rent Agreement / Receipts": "भाड़ा समझौता / रसीद अपलोड करू",
  "Landlord Name": "मकान मालिकक नाम",
  "Landlord PAN (10 Digits)": "मकान मालिकक PAN (10 अंक)",
  "Select PDF/JPG": "PDF/JPG चुनू",
  "Submit Receipt": "रसीद जमा करू",
  "Response Position": "जवाबक पक्ष",
  "I Agree with Department": "हम विभाग सँ सहमत छी",
  "I Disagree (Submit Proof)": "हम असहमत छी (प्रमाण जमा करू)",
  "Response Statement (Draft)": "जवाबक बयान (मसौदा)",
  "Dictate Statement": "बाजि कऽ लिखाउ",
  "Listening...": "सुनि रहल छी...",
  "Explain your disagreement or agreement...": "अपन सहमति वा असहमति बुझाउ...",
  "Send Response": "जवाब पठाउ",
  "Cancel": "रद्द करू",
  "Validate Bank Code": "बैंक कोड सत्यापित करू",
  "Update Bank IFSC": "बैंक IFSC अपडेट करू",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "बैंक विवरण सत्यापित करबा लेल 11 अंकक बैंक रूटिंग कोड (IFSC) जाँचू।",
  "IFSC Code": "IFSC कोड",
};

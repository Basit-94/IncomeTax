/**
 * बड़ो (Bodo / Boro), written in Devanagari.
 *
 * This translation is model-generated and awaits review by a native Bodo
 * speaker who knows tax vocabulary (project task T0.5). Be candid about the
 * limitation: model coverage of Bodo is much thinner than for Hindi or Tamil,
 * so grammatical case endings, verb aspect markers and the choice between a
 * Boro coinage and an Assamese/Hindi loan all need a native eye even more
 * than usual. The intent throughout is genuine Boro (a Tibeto-Burman
 * language, SOV, agglutinative) — not Assamese or Hindi in Boro clothing —
 * with the plain, warm, spoken register of hi.ts: consequence, not rule;
 * never the name of a tax form.
 *
 * Digits stay Latin, ₹ stays ₹, and PAN / TDS / IFSC / OTP / AIS / 26AS /
 * section codes / persona and bank names stay untranslated, matching hi.ts.
 */

import type { Dict } from "./en";

export const brx: Dict = {
  langName: "Bodo",
  langNativeName: "बड़ो",
  dir: "ltr",

  common: {
    modeSimple: "गोरलै",
    modeDetailed: "गुवारै",
    continue: "सिगांथिं थां",
    back: "उनथिं",
    yesThatsRight: "नंगौ, बेयो थार",
    noThisIsWrong: "नङा, बेयो गोरोन्थि",
    iDontUnderstand: "आं बेखौ बुजियाखै",
    close: "बन्द खालाम",
    saveAndGoOn: "दोनथ'ना सिगांथिं थां",
    loading: "एसे सम हो",
    logOut: "लग आउट",
    undo: "गिदिंना लाफिन",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "नायबिजिरनाय आरो गथायनायनि गोरलै लामा",
    independent: "उदां प्रट'टाइप",
    taxYear: "खाजोना बोसोर 2026-27",
    language: "राव",
    light: "लाइट",
    dark: "डार्क",
    sandbox: "रिभिउ टुल",
  },

  validate: {
    panTooShort: (n: number) => `दासिम ${n} हांखो जाबाय। PAN-आव 10 थायो।`,
    panShape:
      "PAN-आव गिबियाव बा हांखो, उनाव ब्रै अनजिमा, जोबथायाव मोनसे हांखो थायो — जेरै DEMPS4417K।",
    panSandboxHint:
      "नों बेयाव मा लिरो बेयो नोंनि ब्राउजारनिफ्राय बायजोयाव थांआ। बे प्रट'टाइपआव गासै PAN-आ DEMP-जों जागायो, बेखायनो थार PAN-खौ गोरोन्थियै नागिरनो हाया।",
    ifscTooShort: (n: number) => `दासिम ${n} हांखो जाबाय। बेंक क'डआव 11 थायो।`,
    ifscShape:
      "बेंक क'डआव गिबियाव ब्रै हांखो, उनाव मोनसे सुन्या, उनाव आरो द' थायो — जेरै DECU0834471।",
  },

  landing: {
    question: "आयखाजोना बिफाननि आखायाव नोंनि रां दोनथुमना दं नामा?",
    subtext:
      "बेखौ बाहायग्रा बांसिन सुबुंफोरनि जेबो होनो गैया — बिसोरनोसो मोननो गोनां। नोंनि PAN-खौ हो, बेयाव मा दं जों बुंगोन।",
    panLabel: "नोंनि PAN",
    panHelp: "जि हांखो, नोंनि PAN कार्डनिफ्राय",
    panPlaceholder: "जेरै, DEMPS4417K",
    check: "आंनो मा मोननो गोनां नाय",
    orTryAs: "एबा थाम सुबुंनि गेजेराव सासेनि महरै नायना ला",
    honestyLink: "बेयाव मा थार आरो मा बानायनाय",
    architectureLink: "टेकनिकेल बानाय",
    badge: "गोरलै खाजोना रिटार्न, थार महराव दिन्थिनाय",
    brandTitle: "नोंनि रां, फैफिनगासिनो दं।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "गथायनाय",
      blurb:
        "बिनि बेथननिफ्राय ₹8,400 दाननाय जाबाय। बिनि जेबो होनो गैया, बियो गथायाखै, आरो फरायसालिनि मासुल होनो सम जाबाय।",
      action: "सिगांनो मिथिनायखौ रोखा खालाम",
    },
    rakesh: {
      phase: "लाइजाम मोनसे फैबाय",
      blurb:
        "लाइजामआ बुङो, बियो शेयरनिफ्राय मोननाय ₹1,10,000 मुलाम्फाखौ दोनखोमादों। बिनि फैफिननो गोनां रांखौ मोनसे गोजाम दाबिनि थाखाय होबथाना दोननाय जादों — बै दाबिनि सोमोन्दै बिनो माब्लाबाबो मिथिहोयाखैमोन।",
      action: "फरायना गोरोबा होन्ना बुं",
    },
    priya: {
      phase: "नेनाय",
      blurb:
        "71 सान सिगां गथायबाय। दासिमबो लिरनाय दं: जाहोगासिनो। थारैनो मोननै बाथ्राया होबथाना दोनदों, नाथाय बबे बबे — सोरबो बुंआखै।",
      action: "मा होबथादों नाय",
    },
    custom: {
      phase: "गावनिखौ बानाय",
      blurbTitle: "बानायनाय सासे सुबुं",
      blurb:
        "गिबिनिफ्राय सासे सुबुं बानाय — बिनि बेथन, बिनि दाबिफोर, बिनिफ्राय दाननाय खाजोना — आरो हिसाबआ गावनो गाव माबोरै जायो नाय।",
      action: "सासे बानायना ला",
    },
  },

  login: {
    authVerifying: "सार्भारजों आनजाद जागासिनो दं…",
    authUnreachable:
      "साइन-इन सार्भारसिम सौहैनो हायाखै। नों सोनाय जेबो गोमाखै — एसे उनाव फिन नाजा।",
    authRejected: (detail: string) => `सार्भारआ साइन-इन होआखै: ${detail}`,
    signedInAs: "साइन-इन जाबाय — सेसनआ सोलिगासिनो दं",
    otpSentTo: (mobile: string) => `जों ${mobile}-आव मोनसे क'ड दैथाय हरबाय`,
    otpLabel: "द' अनजिमानि क'ड",
    weWillWait:
      "थाबैनि थाखाय गैया। क'डखौ नेनाय समाव नों सोनाय जेबो गोमाया।",
    resend: "फिन दैथाय हर",
    resendIn: (seconds: number) => `${seconds} सेकेन्डनि उनाव फिन बिनो हागोन`,
    mockNotice:
      "बेयो मोनसे प्रट'टाइप, बेखायनो क'डखौ स्क्रिनआवनो दिन्थिनाय जादों। थार खौरां जेबो दैथाय हरनाय जाया।",
    portalHeading: "इ-फाइलिं रोखा खालामनाय",
    incorrectCode: "बे क'डआ गोरोबा। द' अनजिमाखौ फिन नायना फिन नाजा।",
    prototypeBox: "प्रट'टाइप OTP आनजाद",
    mockCodeLabel: "मक क'ड",
    autoFill: "आंनि थाखाय सोना हो",
    verifyEnter: "रोखा खालामना सिं हाबो",
    draftRestored: (time: string) =>
      `नोंनि ड्राफ्टखौ ${time}-निफ्राय लाबोफिननाय जाबाय। जेबो गोमाखै।`,
  },

  file: {
    heading: (amount: string) => `नोंनि ${amount} बिफाननि आखायाव दोनथुमना दं`,
    subheading:
      "गाहायाव थानाय गासै बाथ्राया नोंनि सोमोन्दै सिगांनो फोरमायजानाय। बेखौ फराय, आरो जेबो गोरोन्थि थाब्ला जोंनो बुं।",

    checkThis: "बेखौ नायना ला — नोंनो सोनो नाङा",
    factMeaning:
      "बेयो सिगांनो फोरमायजानाय बाथ्रा, खाजोनानि नेम नङा। गाहायनि हिसाबआ बेनिफ्रायनो जायो।",
    factMeaningByKind: {
      salary:
        "नोंनि हाबा होग्राया नोंनो सौहैनाय बेथननिफ्राय बेखौ फोरमायदों। गाहायनि गासै हिसाबआ बेनिफ्रायनो जागायो।",
      interest:
        "बेंकफोरा बोसोराव खेबसे नोंनि एकाउन्टफोरा मोननाय सुदखौ फोरमायो। फिसा बिबांआबो आयनो।",
      dividend:
        "कम्पानिनि रेजिस्ट्रारआ नोंनि शेयरफोरा होनाय रांखौ फोरमायदों। जाय बोसोराव मोनदों, बै बोसोरनि आय महरै साननाय जायो।",
      capital_gains:
        "नोंनि ब्र'कारआ शेयर फाननायनिफ्राय मोननाय रांखौ फोरमायदों। खाजोनाया मुलाम्फानि सायावसो नायो — हारआ मा फाननाय आरो बेसेबां सम दोननाय बेनि सायाव जायो।",
      rent:
        "मोननाय भाराया आय; होनाय भाराया नोंनि खाजोनाखौ खमायनो हायो। मोननैयावबो गुबुन फारसेआ फोरमायनायजों गोरोबनांगौ।",
      other:
        "गुबुन जायगायाव गोरोबै फोरमायजानाय आय। बेबो गाहायनि हिसाबआव सोफायो।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter}-आ ${date}-आव बिफानखौ बेखौ फोरमायदों`,
    underIdentifier: (identifier: string) => `रेजिस्टार्ड ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `बेयो गोरोन्थि जाब्ला, गुबै जायगायाव खालि ${reporter}-आसो बेखौ सोलायनो हायो। बिसोरनिफ्राय थि मा बिनो नांगौ, जों रोखायै बुंगोन।`,

    whatYouEarned: "नों मा आरजादों",
    whatWasDeducted: "सिगांनो दानजानाय खाजोना",
    whereMoneyGoes: "रांआ बबेयाव थांगोन",
    whoYouAre: "नों सोर",

    disputeHeading: "बेयाव मा लिरनाय थानांगौमोन?",
    disputeAmountLabel: "थार बिबां",
    disputeReasonLabel: "मानो गोरोन्थि",
    disputeSave: "बेखौ गोरोन्थि होन्ना लिर",
    selfReported: "नों",
    returnLabel: "नोंनि रिटार्न",

    outcomeOwesNothing: "नोंनि जेबो होनो गैया।",
    outcomeRefund: (amount: string) => `${amount} नोंनिसिम फैफिनगोन।`,
    outcomeOwes: (amount: string) => `${amount} होनो बाकि दं।`,
    confirmAndFile: "बेखौ दैथाय हर",

    verifyHeading: "मोनसे खालाम बाकि, नङाब्ला बेयो साननाय जाया।",
    verifyBody:
      "नोंनो नोंनो होन्ना रोखा खालामैसिम नोंनि रिटार्नआ गथायनाय जाया — दैथाय हरैनि बादिनो। बेयाव नैजि सेकेन्डसो लागो।",
    verifyAction: "आंनो होन्ना रोखा खालाम",

    voicePrompt: "एबा खालि बुंना हो",
    voiceListening: "खोनासोंगासिनो",
    voiceUnsupported:
      "बे फ'ननि ब्राउजारआ दासिम खोनासोंनो हाया। नों लिरनानै होनो हायो — जेबो गोमाया।",
    voiceSimulated:
      "बे ब्राउजारआ खोनासोंनो हाया, बेखायनो बेयो मोनसे बिदिन्थिल', नोंनि रावनिफ्राय नङा।",
    voiceError: "बेयो खोनाजायाखै। नों लिरनानै होनो हायो — जेबो गोमाया।",
    dictate: "बुंना हो (राव)",
    disputePlaceholder: "बे अनजिमाया मानो गोरोन्थि — लिर एबा बुं।",
    disputeDefaultReason: "फोरमायजानाय अनजिमाया गोरोन्थि",
  },

  flow: {
    facts: "नोंनि रां",
    deductions: "नों दाबि खालामनो हानाय रां",
    regime: "गोजाम एबा गोदान",
    check: "नायना ला",
    file: "दैथाय हर",
    stepOf: (n: number, total: number) => `खालाम ${n}, गासै ${total}`,
    confirmedCount: (done: number, total: number) =>
      `${total}-नि गेजेराव ${done} रोखा जाबाय`,
    allConfirmed: "गासैबो गोरोबबाय।",
    undoOne: "बे सोलायनायखौ लाफिन",
    correctedTo: (amount: string) => `नों बुङो, बेयो ${amount} जानांगौ`,
  },

  groups: {
    moneyIn: "फैनाय रां",
    taxPaid: "नोंनि थाखाय सिगांनो होजानाय खाजोना",
    deductionsClaimed: "नों खालामनाय दाबिफोर",
    fromWhere: "बेयो बबेनिफ्राय फैदों",
    addIncome: "आय दाजाब हो",
  },

  deductions: {
    notAllowedNewRegime:
      "गोदान नेमाव साननाय जाया — नोंनि रेकर्डआव दोनथनाय।",
    startedAtCap: (amount: string) =>
      `जों बेखौ ${amount} सिमानिफ्राय जागायबाय — “बेसेबां”-आव नों थारैनो होनाय बिबांखौ सो।`,
    heading: "नों दाबि खालामनो हानाय रां",
    sub: "बेफोर गावनो गाव जाया। नोंनो नंगौ बुंनांगौ — नाथाय थार जाब्लासो।",
    claimedHeading: "नोंनि रिटार्नआव सिगांनो दं",
    worthUpTo: (amount: string) =>
      `नोंनि खाजोना होनां आयनिफ्राय ${amount} सिम खमानो हायो`,
    worthWhatYouPaid: "नों थारैनो होनाय बिबांसो — थार बिबांखौनो दाबि खालाम",
    askRentQ: "नों थानाय न'नि भारा होयो नामा?",
    askRentWhy:
      "नों भारा होयोब्ला आरो नोंनि हाबा होग्राया न' भारा भाथा होआब्ला, बेनि एसे बाहागोआ नोंनि खाजोना होनां आयनिफ्राय खमानो हायो।",
    askHealthQ: "नों नोखोरनि थाखाय स्वास्थ्य बीमानि रां होयो नामा?",
    askHealthWhy:
      "नोखोरखौ बीमायाव दोननो नों मा होयो, बेयो नोंनि खाजोना होनां आयनिफ्राय खमानो हायो।",
    ask80cQ:
      "नों प्रभिडेन्ट फान्ड, जिउ बीमा एबा फरायसालिनि मासुलआव रां होयो नामा?",
    ask80cWhy:
      "बेफोर बायदि गोलाव समनि दोनथुमनाया मोनसे खौसे सिमायाव साननाय जायो, आरो नों बेसेबां होयो बेसेबां नोंनि खाजोना होनां आयनिफ्राय खमायो।",
    claimIt: "नंगौ — बेखौ दाबि खालामगोन",
    skipIt: "नङा — बेखौ नागार",
    amountLabel: "बेसेबां",
    evidenceAttached: "फोरमान होनाय दं",
    evidenceMissing:
      "दासिम जेबो फोरमान होनाय गैया — दानि थाखाय मोजां। रसिदफोरखौ दोनथ'; बिफानआ उनाव बिनो हागोन।",
    newRegimeNoEffect:
      "गोदान नेमाव बे दाबिया जेबो सोलाया — बेयाव बेखौ गनायनाय जाया।",
    oldRegimeSaves: (amount: string) =>
      `गोजाम नेमाव बेयो नोंनि खाजोनाखौ ${amount}-नि बादियै खमाय होगोनमोन।`,
  },

  regime: {
    heading: "खाजोना लानाय मोननै लामा दं। मोनसेया नोंनि थाखाय मोजांसिन।",
    newRegimeName: "गोदान नेम",
    oldRegimeName: "गोजाम नेम",
    refundLabel: "नोंनिसिम फैफिनगोन",
    dueLabel: "होनो बाकि",
    recommendedBadge: "नोंनि थाखाय मोजांसिन",
    reasoningOldDeductions: (x: string, y: string) =>
      `नोंनि दाबिफोरा गासै ${x} जायो, बेखायनो गोजाम नेमआ नोंनि खाजोनाखौ ${y}-नि बादियै खमायो।`,
    reasoningNewDefault: (y: string) =>
      `नोंनि दाबिफोरा बेयाव गोबां फाहाम होआ, बेखायनो गोदान नेमनि खम हारफोरा नोंनि खाजोनाखौ ${y}-नि बादियै खमायो।`,
    acceptRecommendation: "आंनि थाखाय जाय मोजांसिन, बेखौनो ला",
    overrideNote:
      "नों जायखि जाया मोनसेखौ बासिखनो हायो। बेयाव जेबो दोनखोमानाय एबा खोबनाय गैया।",
  },

  check: {
    newRegimeClaimsZero:
      "नोंनि दाबिफोरा लिरनाय आरो रैखाथियाव दं — गोदान नेमआ बेफोरखौ गनाया, बेखायनो बे सारिया ₹0।",
    badgeReportedBy: (reporter: string) => `${reporter}-आ फोरमायनाय`,
    badgeYouEntered: "नों सोनाय",
    badgeWeApplied: "जों नोंनि थाखाय बाहायनाय",
    heading: "गासै रिटार्नआ, मोनसे बिलाइयावनो",
    sub: "मोनफ्रोम अनजिमाया बबेनिफ्रायबा फैदों। जायखि जाया सारिखौ खेवना रोखायै नाय, बबेनिफ्राय।",
    grossIncome: "गासै फैनाय",
    standardDeduction: "स्टेन्डार्ड खमानाय",
    deductionsLine: "नों खालामनाय दाबिफोर",
    taxableIncome: "खाजोना थारैनो लानाय आय",
    slabTax: "जेबो खमानायनि सिगांनि खाजोना",
    rebate87A: "बेनि बाहागोखौ रद खालामग्रा रिबेट",
    cess: "स्वास्थ्य आरो सोलोंथाइनि सेस",
    totalTax: "बोसोरनि गासै खाजोना",
    tdsCredits: "नोंनिफ्राय सिगांनो लाजानाय",
    refundDue: "नोंनिसिम फैफिनगोन",
    balanceDue: "होनो बाकि",
    openLine: "बेयो बबेनिफ्राय फैदों दिन्थि",
    closeLine: "दोनखोमा",
    calculationStatus:
      "प्रट'टाइपनि हिसाब — नेमनि इनपुटफोरखौ दासिमबो गुबै फुंखानिफ्राय आनजाद खालामनो बाकि (TODO(verify))।",
    calculationTrail: (amount: string) =>
      `${amount}-खौ गाहायनि रोखा खालामजानाय बाथ्रा आरो खाजोना क्रेडिटफोरनिफ्राय हिसाब खालामनाय। बे प्रट'टाइपआव फुंखा रेकर्डफोरा बानायनायल'।`,
    showCalculationTrail: "फुंखा आरो हिसाबनि लामा दिन्थि",
    hideCalculationTrail: "फुंखा आरो हिसाबनि लामा दोनखोमा",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date}-आव फोरमायनाय`,
    sourceIdentifier: (identifier: string) => `रेकर्ड ${identifier}`,
    selfReportedSource: "बे रिटार्नआव नों गावनो फोरमायनाय",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: फोरमायग्रा फसंथानफोरनिफ्राय मोननाय खौरांनि बोसोरारि बिलाइ।"
        : statement === "26AS"
        ? "Form 26AS: नोंनि PAN-नि सायाव फोरमायजानाय खाजोना क्रेडिटखौ दिन्थिग्रा बिलाइ।"
        : "बे बाथ्राजों नांजाब थानाय फुंखा रेकर्ड।",
    sectionMeaning: (section: string) =>
      `${section}-आ खमानायनि मोनसे सेक्सन। बे नेमआ गनायोब्लासो बेखौ साननाय जायो।`,
    explainGross: "नों नायना रोखा खालामनाय बाथ्राफोरखौ दाजाबना।",
    explainStd: (amount: string) =>
      `बेथन मोनग्रा गासैबो ${amount} जेबो दाबि खालामालाबानो खमानाय मोनो।`,
    explainDeductions: "बे नेमआ गनायनाय दाबिफोरखौल' साननाय जायो।",
    explainDisallowed: (section: string) =>
      `${section}-खौ बे नेमआव गनायनाय जाया, बेखायनो बेयाव बेनि जेबो हाबा गैया।`,
    explainTaxable:
      "गासै फैनायनिफ्राय स्टेन्डार्ड खमानाय आरो नोंनि दाबिफोरखौ खमाना।",
    explainSlab: "खाजोनाया थाखो थाखोयै लायो — मोनफ्रोम थाखोआव गावनि हार।",
    explainRebate: (amount: string) =>
      `मोनसे सिमानि सिङाव बांसिन खाजोनाया रद जायो — बेयाव बेनि ${amount}।`,
    explainCess: "गासै खमानायनि उनाव सायाव दाजाबनाय फिसा प्रतिशत।",
    explainTds:
      "TDS-नि ओंथिया फुंखायावनो दाननाय खाजोना: नोंनो रां होग्राया, रांआ नोंनिसिम सौहैनायनि सिगांनो बेखौ दानना दोनदों।",
    fromFacts: "बे बाथ्राफोरनिफ्राय:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "दैथाय हरनो थियार नामा?",
    sub: "खेबसे थांबायब्ला, सोलायनो थाखाय फिन गथायनांगोन। खेबसे आरो नायना ला, बेनि उनाव दैथाय हर।",
    stepChecking: "हिसाब आनजाद जागासिनो…",
    stepSealing: "अनजिमाफोरखौ सिल खालामगासिनो…",
    stepFiled: "गथाय जाबाय।",
    ackHeading: "सौहैबाय।",
    ackBody:
      "नोंनि रिटार्नआ दिनैनिफ्राय साननाय जागोन। मोनसे खालाम बाकि: सोंनाय समाव नोंनो नोंनो होन्ना रोखा खालामनाय। बेसिम बेयो दैथाय हरैनि बादियै साननाय जागोन।",
    ackNext:
      "बेनि उनाव ट्रेकारआ रोखायै दिन्थिगोन — नोंनि रांआ बबेयाव दं आरो माया बेखौ होबथानो हागोन।",
    errorCause:
      "आनजाद खालामनाय खालामआ फेल जाबाय, मानोना सेन्डबक्सनि fault सुइचआ अन दं।",
    errorAction:
      "रिभिउवार ड्रयारआव 'Trigger API Gateway Timeout'-खौ अफ खालाम, बेनि उनाव फिन दैथाय हर। जेबो गोमाखै।",
    errorCauseNetwork: "नोंनि रिटार्नआ सार्भारसिम सौहैयाखै।",
    errorActionNetwork:
      "जेबो गथायजायाखै आरो जेबो गोमाखै। नोंनि कानेक्सनखौ नायना, फिन दैथाय हर।",
    retry: "फिन दैथाय हरनो नाजा",
  },

  wizard: {
    identityNextHint:
      "सिगांथिं थांनो नोंनि आबुं मुं आरो 10 हांखोनि PAN-खौ सो।",
    employmentConfirmHint:
      "नोंनि सिगांनि फिननायनिफ्राय — सोलायबायब्ला गुबुन मोनसेखौ बासिख।",
    tdsZeroWarning:
      "बेथन मोनग्रा हाबायाव खाजोनाया जोबोर बांसिनयै सिगांनो दानजानानै थायो — बेयो नोंनि Form 16 एबा बेथन स्लिपआव दं। बेयाव 0 सोनाया गोबां समाव गावनि रिफान्डखौ नागारनायनि रोखोम।",
  },

  timeline: {
    filed: "नों नोंनि रिटार्नखौ दैथाय हरबाय।",
    verified: "नों रोखा खालामबाय, बेयो नोंनो। रिटार्नआ बेनिफ्रायनो साननाय जायो।",
    in_queue: "बै सप्ताहआव गथायजानाय गुबुनफोरजों लोगोसे सारियाव।",
    under_review: "दा सोरबा बेखौ नायगासिनो दं।",
    determined: "थि जाबाय — बेसो फैफिनगोन।",
    sent_to_bank: "नोंनि बेंकआव दैथाय हरबाय।",
    credited: "नोंनि एकाउन्टआव।",
  },

  refund: {
    heading: (amount: string) => `${amount} नोंनिसिम फैगासिनो दं`,
    filedDaysAgo: (days: number) => `नों ${days} सान सिगां गथायदोंमोन`,

    holdsHeading: (n: number) =>
      n === 1 ? "मोनसे बाथ्रानि थाखाय नेगासिनो" : `${n} बाथ्रानि थाखाय नेगासिनो`,
    clearsInDays: (days: number) =>
      days === 1
        ? "बेयो जोबब्ला सानसेनि बादियै"
        : `बेयो जोबब्ला ${days} साननि बादियै`,

    cohortWindow: (from: number, to: number) =>
      `नोंनि सप्ताहआवनो गथायजानाय रिटार्नफोरखौ दा नायगासिनो दं। ${from}-निफ्राय ${to} सान लागोनो हागोन।`,

    states: {
      not_filed: "दासिम दैथाय हरै",
      filed_unverified: "दैथाय हरबाय, नोंनि रोखा खालामनाय बाकि",
      verified: "नों रोखा खालामबाय",
      in_queue: "सारियाव",
      under_review: "सोरबा बेखौ नायगासिनो",
      determined: "थि जाबाय",
      sent_to_bank: "नोंनि बेंकआव दैथाय हरबाय",
      credited: "नोंनि एकाउन्टआव सौबाय",
      failed: "नोंनि एकाउन्टसिम सौहैनो हायाखै",
    },

    bankFailedHeading: "नों बासिखनाय एकाउन्टआ रांखौ मोननो हाया।",
    bankMergedInto: (bank: string) => `बै ब्रान्सआ दा ${bank}-नि बाहागो`,
    useThisAccount: "बेनि सोलायै बेयाव दैथाय हर",
    resolvedHold: "जोबबाय — दा बेयो जेबो होबथाया।",
    stampFiled: "गथायनाय",
  },

  notices: {
    heading: "बिफाननिफ्राय फैनाय लाइजामफोर",
    none: "जेबो फैफिनाखै। बेयो मोजां खौरां।",
    respondBy: (date: string) => `${date}-नि सिगां फिन हो`,
    ifYouDoNothing: "नों जेबो खालामाब्ला",
    basedOn: "बेयो मानि सायाव थानाय",
    theCatch: "बिसोर मा गोरोन्थि खालामदों",
    agree: "बेयो थार",
    disagree: "बेयो गोरोन्थि",
    dinLabel: "बे लाइजामनि रेफारेन्स नाम्बार",
    dinExplain:
      "बिफाननि मोनफ्रोम लाइजामआव बेयो थानांगौ। बेयो गैयाब्ला, लाइजामखौ माब्लाबाबो होजायै बादियै साननाय जायो।",
  },

  dashboard: {
    serverFilings: "सार्भाराव दर्जा थानाय",
    serverFilingsEmpty:
      "लाइभ सार्भाराव बे PAN-नि जेबो गथायनाय गैया — गोजौनि रसिदआ बानायनाय सल'नि बाहागो। बे एपनिफ्राय गथायोब्ला थार रसिदआ बेयावनो फैगोन।",
    greetingLabel: "नोंनि साइन-इन बाथ्रा",
    greetingWhy:
      "एकाउन्ट बानायनाय समाव नों बे बाथ्राखौ बासिखदोंमोन। जाय बिलाइया बेखौ दिन्थिनो हाया, बेयो जों नङा।",
    userDashboard: "इउजार ड्याशब'र्ड",
    taxPrefills: "खाजोना खौरां (AIS/26AS)",
    pendingActions: "बाकि थानाय हाबाफोर",
    returnSummary: "रिटार्न सारांश AY 2026-27",
    reviewPrefill:
      "खाजोना खौरां टेबआव सिगांनो सोजानाय खौरांखौ नायना ला, बेनि उनाव गथायनो रोखा खालाम।",
    filingSubmitted:
      "नोंनि इ-फाइलिं रिटार्नआ गथाय जाबाय। टाइमलाइनआव सिगांथिं थांनायखौ नाय।",
    verifiedBanks: "रिफान्डनि थाखाय रोखा खालामजानाय बेंक एकाउन्टफोर",
    primaryRefundAccount: "गाहाइ रिफान्ड एकाउन्ट",
    backupAccount: "बेकआप एकाउन्ट",
    ifscMeaning:
      "IFSC-आ रिफान्ड दैथाय हरनाय 11 हांखोनि बेंक रुटिं क'ड।",
    refundTimeline: "रिफान्ड टाइमलाइन",
    filingSubmittedTimeline: "रिटार्न गथायनाय",
    identityVerifiedTimeline: "सिनायथि रोखा जानाय",
    assessmentProcessingTimeline: "आनजाद सोलिगासिनो",
    refundApprovedTimeline: "रिफान्ड गनायजानाय",
    refundCreditedTimeline: "रिफान्ड एकाउन्टआव सौबाय",
    holdActive: "होबथानाय दं: एक्सन टेबआव हाबाखौ फोजोब",
    successCheckApp: "जाबाय! नोंनि बेंकिं एपखौ नाय।",
    outstandingNotices: "बाकि थानाय कमप्लायेन्स नटिसफोर",
    noPendingActions: "जेबो हाबा बाकि गैया",
    accountCompliant:
      "नोंनि एकाउन्टआ आबुंयै नेम मानगासिनो दं, जेबो बाकि नटिस एबा खाजोना दाबि गैया।",
    actionableHolds: "हाबा खालामनो गोनां आनजाद होबथानायफोर",
    uploadRent: "भारा गोरोबथा / रसिदफोर आपल'ड खालाम",
    landlordName: "न' गिरिनि मुं",
    landlordPan: "न' गिरिनि PAN (10 हांखो)",
    selectPdfJpg: "PDF/JPG बासिख",
    submitReceipt: "रसिद गथाय",
    responsePosition: "फिननायनि थासारि",
    agreeDept: "आं बिफानजों गोरोबो",
    disagreeProof: "आं गोरोबा (फोरमान गथाय)",
    responseDraft: "फिननाय बिबुंथि (ड्राफ्ट)",
    dictateStatement: "बुंना लिरहो",
    sendResponse: "फिननाय दैथाय हर",
    filingStatusLabel: "गथायनायनि थासारि",
    bankValidated: "रोखा जानाय",
    bankUnderProcess: "आनजाद सोलिगासिनो",
    bankFailed: "फेल जानाय",
    staleIfscHold: "बे बेंक क'डआ दा सोलिया।",
    switchToNewIfsc: (ifsc: string) => `गोदान क'डआव सोलाय (${ifsc})`,
    personalized: {
      eyebrow: "नोंनि ड्याशब'र्ड",
      headingFiled: "नोंनि रिटार्नआ गथाय जाबाय — बेयो दा बेयाव दं",
      heading: {
        file_return: "फै, नोंनि रिटार्नखौ थियार खालामनि",
        check_refund: "फै, मा फैफिननो हागोन नायनि",
        understand_notice: "फै, नांगौ हाबाखौ नायनि",
        correct_prefill: "फै, फोरमायजानाय खौरांखौ नायनि",
      },
      guidedBody:
        "मोनफ्रोम अनजिमाखौ रोखा खालामनायनि सिगां जों बेनि ओंथि फोरमायगोन।",
      quickBody:
        "जों लामाखौ गुसुं दोनगोन आरो उननि थि खालामनायखौ गिबियाव दोनगोन।",
      unfiledBody:
        "गिबियाव, नोंनि सोमोन्दै सिगांनो फोरमायजानाय खौरांखौ रोखा खालाम।",
      filedBody:
        "नों मानि थाखाय फैदों, बेजों गोरोबनाय बाहागोखौ जों सिगां खेवबाय।",
      primaryAction: {
        facts: "फोरमायजानाय खौरांखौ नाय",
        overview: "रिफान्ड ट्रेकार दिन्थि",
        statement: "फोरमायजानाय खौरां नाय",
        actions: "मा नांगौ दिन्थि",
      },
      focusLabel: "जों बेफोरखौ नायगोन",
      profileLabels: {
        work: "हाबा",
        income: "गासै आय (बादियै)",
        history: "गथायनायनि गियान",
      },
    },
  },

  onboarding: {
    eyebrow: "जागायनायनि सिगां",
    title: "बेखौ नोंनि थाखाय थियार खालामनि।",
    intro:
      "बा गुसुं फिननाया जोंनो थार राव, गति आरो खाजोनानि सोंथि बासिखनो हेफाजाब होयो। नों बेफोरखौ उनाव सोलायनो हायो।",
    languageQuestion: "जों बबे रावआव रायज्लायगोन?",
    languageHelp: "बेयो गिबि सोंथि। रावखौ नों माब्लाबाबो सोलायनो हायो।",
    intentQuestion: "दिनै नों मानि थाखाय फैदों?",
    intentHelp: "जों बै हाबाखौनो गिबियाव दोनगोन।",
    intentOptions: {
      file_return: {
        label: "बे बोसोरनि रिटार्न गथायनो",
        detail: "नोंनि सोमोन्दै सिगांनो मिथिनायनिफ्रायनो जागायगोन।",
      },
      check_refund: {
        label: "आंनो रां फैफिननो गोनां नामा नायनो",
        detail: "मा फोरमायजादों, मा होजादों आरो मा फैफिननो हागोन — नाय।",
      },
      understand_notice: {
        label: "लाइजाम एबा नटिसखौ बुजिनो",
        detail: "बेयाव मा लिरनाय, मा जानो हागोन आरो उनाव मा खालामनो — नाय।",
      },
      correct_prefill: {
        label: "गोरोन्थि नुजानाय बाथ्राखौ थार खालामनो",
        detail: "अनजिमाया बबेनिफ्राय फैदों नागिरना, मा सोलायनांगौ लिर।",
      },
    },
    intentCta: {
      file_return: "आंनि रिटार्न जागाय",
      check_refund: "आंनो मा मोननो गोनां नाय",
      understand_notice: "आंनो मा खालामनांगौ दिन्थि",
      correct_prefill: "फोरमायजानायखौ नायना ला",
    },
    situationQuestion: "नोंनि खाजोनानि थासारिखौ बुं।",
    situationHelp: "बेयाव गुसुं फिननाय मोननैल'सो जायो।",
    professionLabel: "नोंनि हाबाखौ बबेया मोजाङै फोरमायो?",
    professionOptions: {
      salaried: "बेथन मोनग्रा हाबा",
      self_employed: "फ्रिलान्स एबा गावनि हाबा",
      business_owner: "फालांगि गिरि",
      student: "फरायसा",
      retired: "रिटायार्ड",
      investor: "रां लगायग्रा",
      other: "गुबुन मोनसेबा",
    },
    filingHistoryLabel: "नों सिगां इनकाम टेक्स रिटार्न गथायदों नामा?",
    filingHistoryOptions: {
      never: "गथायाखै, बेयो गिबि खेब",
      once: "खेबसे एबा खेबनै",
      every_year: "बोसोरफ्रोमबो",
    },
    incomeQuestion: "गासै फुंखानिफ्राय नोंनि गासै आयआ बादियै बेसेबां मोन?",
    incomeHelp: "मोनसे सिमानाल'बो जायो। थार अनजिमाखौ उनाव नायगोन।",
    incomeOptions: {
      none: "आय गैया",
      under_4: "₹4 लाखनिफ्राय खम",
      "4_to_8": "₹4-निफ्राय ₹8 लाख",
      "8_to_12": "₹8-निफ्राय ₹12 लाख",
      "12_to_25": "₹12-निफ्राय ₹25 लाख",
      over_25: "₹25 लाखनिफ्राय बांसिन",
    },
    modeQuestion: "नों बेसेबां नुनो लुबैयो?",
    modeHelp: "बेयो खालि जागायनायखौल' थि खालामो। नों माब्लाबाबो सोलायनो हायो।",
    modeOptions: {
      simple: {
        label: "आंनि थाखाय खालामना हो",
        detail: "गोरलै राव, खेबसेयाव मोनसे खालाम। गुबुनखौ जों नायगोन।",
      },
      full: {
        label: "आंनो गासैबो दिन्थि",
        detail: "मोनफ्रोम अनजिमा, नेम आरो हिसाब — गिबिनिफ्रायनो।",
      },
    },
    focusQuestion: "बेफोरनि गेजेराव जों बबेखौ नायनांगौ?",
    focusHelp:
      "नोंजों गोरोबनाय गासैखौ बासिख। रोखा गैयाब्ला 'रोखा मिथिया' बासिखनाया मोजां।",
    focusOptions: {
      salary: "बेथन एबा पेनसन",
      freelance: "फ्रिलान्स हाबा",
      business: "फालांगिनि आय",
      rent: "आं होनाय एबा मोननाय भारा",
      interest: "बेंकनि सुद",
      investments: "शेयर एबा इनभेस्टमेन्ट",
      deductions: "दोनथुमनाय, बीमा, ह'म ल'न एबा NPS",
      not_sure: "आं दासिम रोखा मिथिया",
    },
    chooseOne: "मोनसे बासिख",
    chooseAtLeastOne: "खमैबो मोनसे बासिख",
    questionsLabel: "गुसुं थियारि",
    questionsProgress: (current: number, total: number) =>
      `${total}-नि गेजेराव ${current}`,
    savedLocally:
      "बे प्रट'टाइपआव नोंनि फिननायफोरा बे ब्राउजारआवनो थानाय जायो।",
    readyTitle: "नोंनि थाखाय बेखौ खालामनो बेसो जायो।",
    readyBody:
      "बे फिननायफोरजों जों थि खालामगोन, नोंनो गिबियाव मा दिन्थिगोन। नेमनि जोबथा बासिखआ नों रोखा खालामनाय बाथ्रा आरो दाबिफोरनि सायावनो जागोन।",
    guidedLabel: "जों माबोरै फोरमायगोन",
    guidedValue: "जों थांनाय लोगो लोगो सोदोबफोरखौ फोरमायगोन।",
    quickValue: "जों लामाखौ गुसुं दोनगोन।",
    regimeLabel: "नेम मोननैजों जोंनि खान्थि",
    claimsRegimeValue: "नेम बासिखनायनि सिगां जों नोंनि दाबिफोरखौ आनजाद खालामगोन।",
    compareRegimeValue: "बाथ्राफोर रोखा जानायनि उनाव जों मोननैखौबो रुजुगोन।",
    focusLabel: "गिबियाव मा दोनगोन",
    startPath: "आंनि लामाजों जागाय",
    changeAnswers: "फिननाय सोलाय",
    tailoredBadge: "नोंनि जागायनाय लामा",
    tailoredGuided: "फोरमायना लांनाय",
    tailoredQuick: "गुसुं लामा",
    tailoredRegimeClaims: "नेम बासिखनायनि सिगां दाबि आनजाद",
    tailoredRegimeCompare: "बाथ्रानि उनाव नेम मोननैखौ रुजुनाय",
    tailoredIntent: (intent: string) => `गिबियाव: ${intent}`,
  },

  checklist: {
    divider: "गथायनायनि सिगां",
    itemBefore: "“",
    itemAfter: "”-खौ रोखा खालाम — रोखा गैयाब्ला कार्डखौ खेव।",
    stdRow: "जों नोंनि थाखाय बाहायनाय स्टेन्डार्ड खमानायखौ रोखा खालाम।",
    noteLocked:
      "गोजौनि मोनफ्रोम सारियाव टिक हो, बेनि उनावसो बे बुथामआ खेवजागोन।",
    noteReady: "गोजौनि गासैबो रोखा जाबाय। थियार जाब्ला गथाय।",
    fileBtn: "बे रिटार्नखौ गथाय",
    lockedBtn: (n: number) =>
      n === 1 ? "सिगां आरो 1 सारियाव टिक हो" : `सिगां आरो ${n} सारियाव टिक हो`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `कार्ड ${String(n).padStart(2, "0")} · फोरमायनाय ${date}`,
    whatThisMeans: "बेनि ओंथि मा",
    readFirst: "गिबियाव “बेनि ओंथि मा” खेव — बेनि उनाव रोखा खालाम।",
    readyToConfirm: "फरायबाय? गाहायाव रोखा खालाम।",
  },

  signoff: {
    title: "सहि हो",
    declaration:
      "आं गोजौनि अनजिमाफोरखौ फरायबाय आरो फुंखा दलिलफोरजों रुजुबाय। बेफोर थार आरो आबुं।",
    action: "बे अनजिमाफोराव सहि हो",
    signed: "सहि जाबाय — गोजौनि मोनफ्रोम अनजिमाया रोखा जाबाय।",
    hint:
      "गोजौनि गासैनि थाखाय मोनसेल' बिबुंथि। जायखि जाया अनजिमायाव गोरोबाब्ला, सहि होनायनि सिगां “नङा, बेयो गोरोन्थि” बासिख।",
  },

  channels: {
    sectionLabel: "बोसोरखौ खेबसेयाव नायनाय",
    earned: "नों आरजादों",
    toTax: "खाजोनायाव थांबाय",
    overpaid: "नों बांसिन होबाय",
    stillToPay: "दासिमबो होनांगौ",
    stayed: "नोंनिफ्राय माब्लाबाबो थांआखै",
    kept: "नोंनि होनां खाजोना",
    back: "नोंनिसिम फैफिनगासिनो",
    yoursInEnd: "जोबथायाव नोंनि",
    collected: "सिगांनो लाजाबाय",
    ofYear: "बोसोरनि रांनि",
    sliceNote:
      "जाय बाहागोआ नुनो हायै फिसा, बेखौ थारनिफ्राय एसे गुवारै दिन्थिनाय जादों — खाथिनि अनजिमाफोरा थार।",
    whereItWent: "नों आरजानाय मोनफ्रोम रांआ बबेयाव थांदों",
    earnedDesc:
      "बेथन, सुद आरो गुबुन गासैबो — नोंनो रां होग्राफोरा फोरमायनाय बादियै।",
    toTaxDesc:
      "नों मोननो गोनां गासै खमानायनि उनाव नोंनि थारैनो होनां खाजोना।",
    backDesc:
      "नोंनि बेथननिफ्राय लाजादोंमोन नाथाय होनां जायैमोन। बेयो नोंनिसिम फैफिनगोन।",
    dueDesc:
      "सिगांनो लाजानायनिफ्राय बांसिन होनांगौ। बेखौ दासिमबो होनो बाकि।",
    howToRead:
      "बेखौ माबोरै फरायगोन: बेयाव जेबो जों बानायाखै। मोनफ्रोम अनजिमाया सोरबा गथायनाय दलिलनिफ्राय फैदों, एबा नों गावनो सोनाय। पेनसिल न'टफोरा फोरमायो, मोनफ्रोमनि थार ओंथि मा — गोरलै रावजों, खाजोनानि रावजों नङा।",
    meterCap: "नोंनि होनां खाजोना आरो सिगांनो लाजानाय",
  },

  agent: {
    title: "वापसी हेफाजाब होग्रा",
    open: "हेफाजाब होग्राखौ खेव",
    close: "बन्द खालाम",
    placeholder: "आनजाद, फोरमाय एबा गथायनो बुं…",
    send: "दैथाय हर",
    thinking: "खामानि सोलिगासिनो…",
    toolRan: "खालामबाय:",
    confirmTitle: "गथायनो थियार — अनजिमाफोरखौ रोखा खालाम",
    confirmBody: "नों रोखा खालामैसिम जेबो गथायनाय जाया। बेयो गथायनाय जागोन:",
    confirmTotalTax: "गासै खाजोना",
    confirmRefund: "नोंनो मोननो गोनां रिफान्ड",
    confirmDue: "होनो गोनां बिबां",
    confirmTaxable: "खाजोना होनां आय",
    confirmButton: "रोखा खालामना गथाय",
    cancelButton: "बातिल खालाम",
    filingDismissed: "मोजां — जेबो गथायजायाखै।",
    error:
      "हेफाजाब होग्रासिम सौहैनो हायाखै। नोंनि रिटार्नखौ जेबो खालामाखै — फिन नाजा।",
    intro:
      "आं नोंनि रिटार्नखौ आनजाद खालामनो, जायखि जाया अनजिमाखौ फोरमायनो, 'जुदि-मा' नायनो आरो गथायनायखौ थियार खालामनो हायो। जेबो गथायनायनि सिगां नोंनो जेब्लायबो रोखा खालामनांगौ।",
    sample: "80C-आव ₹1,50,000 लगायोब्ला आंनि खाजोनाया बेसेबां खमागोनमोन?",
  },

  footer: {
    prototype: "उदां सानथौनि प्रट'टाइप।",
    notAffiliated:
      "बेयो आयखाजोना बिफान, CBDT एबा भारत सरकारजों नांजाब गैया, बिसोरनि गनायथि मोनाखै आरो बिसोरजों सोमोन्दो गैया। बेयाव थानाय मोनफ्रोम मुं, PAN, बिबां आरो दलिलआ बानायनायल'। जायखि जाया थार सरकारि सिस्टेमजों सोमोन्दो खालामनाय जाया।",
    honestyLink: "नाय, मा थार आरो मा बानायनाय",
  },
};

/**
 * Bodo renderings of the mock-data strings in
 * components/mock-i18n.ts (LOCALIZED_MOCK_STRINGS). Keys are the byte-exact
 * English strings; same review caveat as the dictionary above.
 */
export const brxMock: Record<string, string> = {
  "Your pay last year": "थांनाय बोसोरनि नोंनि बेथन",
  "Interest your savings account earned": "नोंनि दोनथुमनाय एकाउन्टआ मोननाय सुद",
  "Interest your accounts earned": "नोंनि एकाउन्टफोरा मोननाय सुद",
  "Your primary contract income": "नोंनि गाहाइ कन्ट्राक्ट आय",
  "Savings interest": "दोनथुमनाय एकाउन्टनि सुद",
  "Tax withheld (TDS)": "सिगांनो दानजानाय खाजोना (TDS)",
  "Provident Fund / ELSS Mutual Funds": "प्रभिडेन्ट फान्ड / ELSS मिउचुयेल फान्ड",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "बिनि बेथननिफ्राय ₹8,400 दाननाय जाबाय। बिनि जेबो होनो गैया। बियो दासिम गथायाखै, आरो फरायसालिनि मासुल होनो सम जाबाय।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "नटिस मोननै। मोनसेया बुङो, बियो ₹1,10,000 शेयर मुलाम्फाखौ दोनखोमादों — थारैनो बिनि ₹4,200 खहा जादोंमोन। गुबुनआ 2019-नि मोनसे बिलनि थाखाय बिनि रिफान्डनि बाहागोखौ दोनथ'नो लुबैयो — बै बिलनि सोमोन्दै बियो माब्लाबाबो खोनायाखैमोन।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 सान सिगां गथायबाय। पर्टालआ खालि 'जाहोगासिनो' होन्नासो दिन्थियो, गुबुन जेबो नङा। थारैनो मोननै आलादा बाथ्राया बिनि ₹34,800-खौ होबथाना दोनदों।",
  "Tax already taken out of your pay": "नोंनि बेथननिफ्राय सिगांनो दानजानाय खाजोना",
  "Dividend your shares paid out": "नोंनि शेयरफोरा होनाय डिभिडेन्ड",
  "Money from selling shares": "शेयर फाननायनिफ्राय मोननाय रां",
  "Tax the bank withheld on your interest": "नोंनि सुदआव बेंकआ दानना दोननाय खाजोना",
  "Provident fund, insurance and your daughter's tuition":
    "प्रभिडेन्ट फान्ड, बीमा आरो नोंनि फिसाजोनि फरायसालि मासुल",
  "Provident fund and your insurance premium": "प्रभिडेन्ट फान्ड आरो नोंनि बीमा प्रिमियाम",
  "Health cover for the family": "नोखोरनि थाखाय स्वास्थ्य बीमा",
  "Rent you paid, with no house-rent allowance from your employer":
    "नों होनाय भारा — हाबा होग्रानिफ्राय न' भारा भाथा मोनै",
  "One figure doesn't match what your broker reported.":
    "मोनसे अनजिमाया नोंनि ब्र'कारआ फोरमायनायजों गोरोबा।",
  "₹18,740 of this is being held against an old bill.":
    "बेनि ₹18,740-खौ मोनसे गोजाम बिलनि थाखाय होबथाना दोननाय जादों।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "बिफानआ सानो, नों ₹1,10,000 शेयर मुलाम्फाखौ नागारना दोनदों।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019-नि मोनसे बिल फोजोबनो बिफानआ नोंनि रिफान्डनिफ्राय ₹18,740 दोनथ'नो लुबैयो।",
  "Waiting on one thing: a receipt for your rent claim.":
    "मोनसे बाथ्रानि थाखाय नेगासिनो: नोंनि भारा दाबिनि रसिद।",
  "The account you chose can't receive the money.":
    "नों बासिखनाय एकाउन्टआ रांखौ मोननो हाया।",
  "Held: your rent claim needs a receipt.":
    "होबथानाय: नोंनि भारा दाबिनि थाखाय रसिद नांगौ।",
  "Your bank account was checked and failed.":
    "नोंनि बेंक एकाउन्टखौ आनजाद खालामनाय जादोंमोन आरो फेल जाबाय।",
  "The department is asking you to look again at your rent claim.":
    "बिफानआ नोंनि भारा दाबिखौ फिन नायनो बिदों।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities-आ शेयर फाननायनिफ्राय ₹1,10,000 फोरमायदों। नोंनि रिटार्नआ बेखौ दिन्थिया। बेयो फोजोबजासिम रिफान्डआ बेयावनो थागोन।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20-नि मोनसे दाबिखौ बे बोसोरनि रिफान्डनिफ्राय दाननाय जागासिनो दं। नों बेखौ गोरोबा होन्ना बुंनो हायो, आरो 3 खालारनि सिगां बेखौ फरायनांगौ।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 सेप्टेम्बरसिम नों जेबो बुंआब्ला, ₹1,10,000-खौ नोंनि आयआव दाजाबनाय जागोन आरो नोंनि रिफान्डनिफ्राय ₹34,300-नि बादियै दाननाय जागोन।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 सेप्टेम्बरसिम नों जेबो बुंआब्ला, नोंनि रिफान्डनिफ्राय ₹18,740 लानाय जागोन आरो बाथ्राखौ जोबनाय बादियै साननाय जागोन।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "नों ₹1,10,000-नि शेयर फानदों नाथाय बेनि मुलाम्फाखौ फोरमायाखै।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000-आ आं फाननाय गासैनि गासै बेसेन, आंनि मुलाम्फा नङा। बै फालांगिफोराव आंनि ₹4,200 खहा जादोंमोन। बोसोरनि आंनि ब्र'कार बिबुंथिया बायनाय बेसेनखौ दिन्थियो।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 बोसोरनिफ्राय नोंनि दासिमबो ₹18,740 होनो बाकि दं, बेखायनो बेखौ बे बोसोरनि रिफान्डनिफ्राय लानाय जागोन।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "नों ₹60,000 भारानि दाबि खालामदों। बेखौ दिन्थिनो जेबो होजायाखै। मोनसे रसिद एबा न' गिरिनि मुं आरो PAN दाजाब हो, बेयो सिगांथिं थांगोन।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank-आ थांनाय बोसोर Deccan Union Bank-नि बाहागो जाबाय। एकाउन्टआ दासिमबो दं — नाथाय बेयाव रां दैथाय हरग्रा क'डआ दा गैला।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "नों 80GG-नि सिङाव ₹60,000 भारानि दाबि खालामदों, नाथाय बेखौ हेफाजाब होग्रा जेबो होजायाखै।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "आं बे भाराखौ थारैनो होदोंमोन। आंहा न' गिरिनिफ्राय दानफ्रोमारि रसिद दं, आरो बिनि मुं आरो PAN होनो हागोन।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "बेयो दाय होनाय नङा आरो दासिम जेबो जरिमाना गैया। नाथाय नों दाबिखौ फोरमानजों हेफाजाब होैसिम एबा बेखौ गिदिंना लाफिनैसिम, नोंनि ₹34,800-आ बेयावनो थागोन।",
  "Look at what they reported": "बिसोर मा फोरमायदों नाय",
  "Read the 2019 demand": "2019-नि दाबिखौ फराय",
  "Add the receipt": "रसिद दाजाब हो",
  "Point it at the right account": "बेखौ थार एकाउन्टआव दैथाय",
  "Supervisor, garment unit": "सुपारभाइजार, गारमेन्ट इउनिट",
  "Operations manager; trades equity on the side":
    "अपारेसन मेनेजार; लोगोसे शेयर फालांगि खालामो",
  "Junior architect; first time filing":
    "जुनियर आर्किटेक्ट; गिबि खेब गथायगासिनो",
  "Independent Consultant": "उदां कनसाल्टेन्ट",
  "Primary School Teacher": "प्राइमारि फरायसालिनि फोरोंगिरि",
  "Retired bank clerk": "रिटायार्ड बेंक क्लार्क",
  "Retired": "रिटायार्ड",
  "Teacher": "फोरोंगिरि",
  "You sent your return in.": "नों नोंनि रिटार्नखौ दैथाय हरबाय।",
  "You confirmed it was you. The return counts from here.":
    "नों रोखा खालामबाय, बेयो नोंनो। रिटार्नआ बेनिफ्रायनो साननाय जायो।",
  "In the queue with everything else filed that week.":
    "बै सप्ताहआव गथायजानाय गुबुनफोरजों लोगोसे सारियाव।",
  "Someone is looking at one figure.": "सोरबा मोनसे अनजिमाखौ नायगासिनो दं।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "नोंनि ब्र'कारआ गथायनाय शेयर-फाननाय सारिया नोंनि रिटार्नजों गोरोबा।",
  "OTP verified, 4 minutes after filing.":
    "OTP रोखा जाबाय, गथायनायनि 4 मिनिट उनाव।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG-नि सिङाव ₹60,000 दाबि खालामनाय, नाथाय हेफाजाब होग्रा जेबो होजायाखै।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank-आ आनजादखौ गिदिंना होफिनबाय: IFSC GODG0004417-आ दा जायगायावबो सोलिया।",
  "OTP Verification Complete": "OTP रोखा खालामनाय आबुं जाबाय",
  "Outstanding Compliance Notices": "बाकि थानाय कमप्लायेन्स नटिसफोर",
  "Draft Legal Response": "आइनि फिननायनि ड्राफ्ट बानाय",
  "No Pending Actions": "जेबो हाबा बाकि गैया",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "नोंनि एकाउन्टआ आबुंयै नेम मानगासिनो दं, जेबो बाकि नटिस एबा खाजोना दाबि गैया।",
  "Actionable Assessment Holds": "हाबा खालामनो गोनां आनजाद होबथानायफोर",
  "Upload Rent Agreement / Receipts": "भारा गोरोबथा / रसिदफोर आपल'ड खालाम",
  "Landlord Name": "न' गिरिनि मुं",
  "Landlord PAN (10 Digits)": "न' गिरिनि PAN (10 हांखो)",
  "Select PDF/JPG": "PDF/JPG बासिख",
  "Submit Receipt": "रसिद गथाय",
  "Response Position": "फिननायनि थासारि",
  "I Agree with Department": "आं बिफानजों गोरोबो",
  "I Disagree (Submit Proof)": "आं गोरोबा (फोरमान गथाय)",
  "Response Statement (Draft)": "फिननाय बिबुंथि (ड्राफ्ट)",
  "Dictate Statement": "बुंना लिरहो",
  "Listening...": "खोनासोंगासिनो...",
  "Explain your disagreement or agreement...":
    "नोंनि गोरोबनाय एबा गोरोबै जानायखौ फोरमाय...",
  "Send Response": "फिननाय दैथाय हर",
  "Cancel": "बातिल खालाम",
  "Validate Bank Code": "बेंक क'ड रोखा खालाम",
  "Update Bank IFSC": "बेंक IFSC आपडेट खालाम",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "बेंकनि खौरां रोखा खालामनो 11 हांखोनि बेंक रुटिं क'ड (IFSC)-खौ आनजाद खालाम।",
  "IFSC Code": "IFSC क'ड",
};

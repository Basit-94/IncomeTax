/**
 * संस्कृतम् (Sanskrit). Typed against the English source, so this file cannot
 * fall behind it.
 *
 * This translation is model-generated and awaits review by a native-fluent
 * Sanskrit reviewer who knows tax vocabulary (project task T0.5). That is a
 * real limitation, disclosed rather than hidden. The register is deliberately
 * comprehensible modern-standard Sanskrit prose — simple sandhi, everyday
 * vocabulary where it exists — not ornate verse.
 *
 * Digits stay Latin. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes,
 * example codes and proper nouns stay untranslated, following hi.ts precedent.
 */

import type { Dict } from "./en";

export const sa: Dict = {
  langName: "Sanskrit",
  langNativeName: "संस्कृतम्",
  dir: "ltr",

  common: {
    modeSimple: "सरलम्",
    modeDetailed: "विस्तृतम्",
    continue: "अग्रे गच्छतु",
    back: "पृष्ठतः",
    yesThatsRight: "आम्, एतत् सम्यक् अस्ति",
    noThisIsWrong: "न, एतत् अशुद्धम् अस्ति",
    iDontUnderstand: "एतत् मया न अवगतम्",
    close: "पिधीयताम्",
    saveAndGoOn: "रक्षित्वा अग्रे गच्छतु",
    loading: "क्षणं प्रतीक्षताम्",
    logOut: "निर्गच्छतु",
    undo: "पूर्ववत् करोतु",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "परीक्षितुं प्रेषयितुं च सुगमः मार्गः",
    independent: "स्वतन्त्रं प्रतिरूपम्",
    taxYear: "करवर्षम् 2026-27",
    language: "भाषा",
    light: "उज्ज्वलम्",
    dark: "श्यामम्",
    sandbox: "समीक्षा-साधनानि",
  },

  validate: {
    panTooShort: (n: number) => `इदानीं ${n} अक्षराणि सन्ति। PAN-मध्ये 10 भवन्ति।`,
    panShape:
      "PAN-मध्ये आदौ पञ्च अक्षराणि, ततः चत्वारः अङ्काः, ततः एकम् अक्षरम् — यथा DEMPS4417K।",
    panSandboxHint:
      "अत्र यत् लिखति तत् भवतः ब्राउज़र्-तः बहिः न गच्छति। अस्मिन् प्रतिरूपे प्रत्येकं PAN DEMP-इत्यनेन आरभते, अतः वास्तविकं PAN प्रमादेन अन्वेष्टुं न शक्यते।",
    ifscTooShort: (n: number) => `इदानीं ${n} अक्षराणि सन्ति। बैंक-कोड्-मध्ये 11 भवन्ति।`,
    ifscShape:
      "बैंक-कोड्-मध्ये आदौ चत्वारि अक्षराणि, ततः एकं शून्यम्, ततः षड् अन्यानि — यथा DECU0834471।",
  },

  landing: {
    question: "किम् आयकरविभागस्य समीपे भवतः धनं स्थगितम् अस्ति?",
    subtext:
      "अत्र आगच्छतां अधिकानां जनानां किमपि देयं न भवति — तेभ्यः एव प्राप्तव्यं भवति। स्वस्य PAN लिखतु, तत्र किम् अस्ति इति वयं वदामः।",
    panLabel: "भवतः PAN",
    panHelp: "दश अक्षराणि, भवतः PAN-पत्रात्",
    panPlaceholder: "यथा, DEMPS4417K",
    check: "मम किं प्राप्तव्यम् इति पश्यामि",
    orTryAs: "अथवा त्रयाणां जनानाम् एकः इव पश्यतु",
    honestyLink: "अत्र किं सत्यं किं च कल्पितम्",
    architectureLink: "तान्त्रिकी रचना",
    badge: "सरलं करविवरणम्, प्रत्यक्षं प्रमाणितम्",
    brandTitle: "भवतः धनं, प्रतिनिवर्तमानम्।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "प्रेषणम्",
      blurb:
        "तस्याः वेतनात् ₹8,400 गृहीतम्। तया किमपि देयं नास्ति, सा अद्यापि न प्रेषितवती, विद्यालयशुल्कं च दातव्यम् अस्ति।",
      action: "यत् पूर्वम् एव ज्ञातं तत् दृढीकरोतु",
    },
    rakesh: {
      phase: "एकं पत्रम् आगतम्",
      blurb:
        "पत्रं वदति यत् सः अंशलाभस्य ₹1,10,000 गोपितवान्। तस्य प्रतिदेयं धनम् एकस्याः पुरातन्याः माङ्गायाः कृते स्थगितम्, यस्याः विषये सः कदापि न सूचितः।",
      action: "पठित्वा असहमतिं वदतु",
    },
    priya: {
      phase: "प्रतीक्षा",
      blurb:
        "71 दिनेभ्यः पूर्वं प्रेषितम्। अद्यापि 'प्रक्रिया चलति' इति एव दृश्यते। वस्तुतः द्वे वस्तुनी तत् रुन्धतः, कतमे इति च न केनापि उक्तम्।",
      action: "किं रुणद्धि इति पश्यतु",
    },
    custom: {
      phase: "स्वयं रचयतु",
      blurbTitle: "कल्पितः जनः",
      blurb:
        "आरम्भात् एकं जनं रचयतु — तस्य आयः, तस्य याचनाः, कियान् करः गृहीतः — गणना च स्वयमेव कथं सिध्यति इति पश्यतु।",
      action: "कमपि रचयतु",
    },
  },

  login: {
    authVerifying: "सर्वर्-इत्यनेन सह परीक्षा चलति…",
    authUnreachable: "साइन्-इन्-सर्वर् प्राप्तुं न शक्यते। भवता लिखितं किमपि न नष्टम् — क्षणानन्तरं पुनः प्रयत्नं करोतु।",
    authRejected: (detail: string) => `सर्वर् साइन्-इन् न अनुमतवान्: ${detail}`,
    signedInAs: "साइन्-इन् जातम् — सत्रं सक्रियम् अस्ति",
    otpSentTo: (mobile: string) => `वयं ${mobile} इत्यत्र एकं कोड् प्रेषितवन्तः`,
    otpLabel: "षडङ्कः कोड्",
    weWillWait:
      "त्वरा नास्ति। कोड्-प्रतीक्षायां भवता पूरितं किमपि न नश्यति।",
    resend: "पुनः प्रेषयतु",
    resendIn: (seconds: number) => `${seconds} सेकेण्ड्-अनन्तरं पुनः याचितुं शक्नोति`,
    mockNotice:
      "इदं प्रतिरूपम्, अतः कोड् पटले एव दर्शितः। वास्तविकः सन्देशः न प्रेष्यते।",
    portalHeading: "ई-फाइलिङ्ग्-सत्यापनम्",
    incorrectCode: "एषः कोड् न मिलति। षड् अङ्कान् पुनः परीक्ष्य पुनः प्रयत्नं करोतु।",
    prototypeBox: "प्रतिरूप-OTP-सत्यापनम्",
    mockCodeLabel: "नमूना-कोड्",
    autoFill: "मम कृते पूरयतु",
    verifyEnter: "सत्यापय्य अन्तः गच्छतु",
    draftRestored: (time: string) => `${time} समयस्य भवतः प्रारूपं प्रत्यानीतम्। किमपि न नष्टम्।`,
  },

  file: {
    heading: (amount: string) => `भवतः ${amount} विभागस्य समीपे स्थितम् अस्ति`,
    subheading:
      "अधः लिखितं प्रायः सर्वं भवतः विषये पूर्वम् एव निवेदितम्। पठतु, किमपि अशुद्धं चेत् अस्मान् वदतु।",

    checkThis: "एतत् परीक्षतु — पूरयितव्यं नास्ति",
    factMeaning: "इदं पूर्वनिवेदितं तथ्यम्, न करनियमः। अधः गणना अनेन एव भवति।",
    factMeaningByKind: {
      salary: "भवत्समीपं प्राप्तात् वेतनात् भवतः नियोक्ता एतत् निवेदितवान्। अधः सर्वा गणना अतः एव आरभते।",
      interest: "बैंकाः वर्षे एकवारं भवतः खातानां व्याजं निवेदयन्ति। अल्पा राशिः अपि आयः एव।",
      dividend: "कम्पनी-रजिस्ट्रार् भवतः अंशानां लाभांशं निवेदितवान्। यस्मिन् वर्षे प्राप्तः तस्मिन् एव वर्षे आयः गण्यते।",
      capital_gains: "भवतः ब्रोकर् अंशविक्रयात् प्राप्तं धनं निवेदितवान्। करः लाभे भवति — दरः किं विक्रीतं कियत्कालं च धृतम् इति उपरि निर्भरति।",
      rent: "प्राप्तं भाटकम् आयः; दत्तं भाटकं करं न्यूनीकर्तुं शक्नोति। द्वयम् अपि परपक्षेण निवेदितेन सह मेलनीयम्।",
      other: "अन्यत्र क्वापि न युज्यमानः निवेदितः आयः। एषः अपि अधः गणनायां योज्यते।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ${date} दिनाङ्के विभागाय एतत् निवेदितवान्`,
    underIdentifier: (identifier: string) => `पञ्जीकरणम् ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `एतत् अशुद्धं चेत् मूलस्थाने केवलं ${reporter} एव परिवर्तयितुं शक्नोति। तेभ्यः किं याचनीयम् इति वयं स्पष्टं वदामः।`,

    whatYouEarned: "भवता किम् अर्जितम्",
    whatWasDeducted: "पूर्वम् एव गृहीतः करः",
    whereMoneyGoes: "धनं कुत्र गच्छति",
    whoYouAre: "भवान् कः",

    disputeHeading: "अत्र किं लिखितं भवितव्यम्?",
    disputeAmountLabel: "शुद्धा राशिः",
    disputeReasonLabel: "किमर्थम् अशुद्धम्",
    disputeSave: "इदम् अशुद्धम् इति अङ्कयतु",
    selfReported: "भवान्",
    returnLabel: "भवतः विवरणम्",

    outcomeOwesNothing: "भवता किमपि देयं नास्ति।",
    outcomeRefund: (amount: string) => `${amount} भवते प्रतिनिवर्तते।`,
    outcomeOwes: (amount: string) => `${amount} दातव्यम् अवशिष्टम् अस्ति।`,
    confirmAndFile: "एतत् प्रेषयतु",

    verifyHeading: "एकं सोपानम् अवशिष्टम्, अन्यथा एतत् न गण्यते।",
    verifyBody:
      "एषः अहम् एव इति यावत् न दृढीकरोति, तावत् भवतः विवरणं प्रेषितं न मन्यते — यथा कदापि न प्रेषितम्। एतस्मै प्रायः विंशतिः सेकेण्ड् अपेक्ष्यन्ते।",
    verifyAction: "अहम् एव इति दृढीकरोमि",

    voicePrompt: "अथवा वाचा एव वदतु",
    voiceListening: "शृण्वन्तः स्मः",
    voiceUnsupported:
      "अस्य दूरवाणीयन्त्रस्य ब्राउज़र् इदानीं श्रोतुं न शक्नोति। लिखित्वा वक्तुं शक्नोति — किमपि न नश्यति।",
    voiceSimulated:
      "एषः ब्राउज़र् श्रोतुं न शक्नोति, अतः इदम् उदाहरणम्, न भवतः स्वरः।",
    voiceError: "तत् न श्रुतम्। लिखित्वा वक्तुं शक्नोति — किमपि न नश्यति।",
    dictate: "वाचा वदतु",
    disputePlaceholder: "एषा सङ्ख्या किमर्थम् अशुद्धा — लिखतु वा वदतु।",
    disputeDefaultReason: "निवेदिता सङ्ख्या अशुद्धा अस्ति",
  },

  flow: {
    facts: "भवतः धनम्",
    deductions: "यत् धनं भवान् याचितुं शक्नोति",
    regime: "पुरातनं नवं वा",
    check: "परीक्षतु",
    file: "प्रेषयतु",
    stepOf: (n: number, total: number) => `${total} मध्ये सोपानम् ${n}`,
    confirmedCount: (done: number, total: number) => `${total} मध्ये ${done} दृढीकृतम्`,
    allConfirmed: "सर्वं सम्यक् अस्ति।",
    undoOne: "एतत् संशोधनं प्रतिनिवर्तयतु",
    correctedTo: (amount: string) => `भवान् वदति एतत् ${amount} भवितव्यम् इति`,
  },

  groups: {
    moneyIn: "आगच्छत् धनम्",
    taxPaid: "भवतः कृते पूर्वम् एव दत्तः करः",
    deductionsClaimed: "भवतः याचनाः",
    fromWhere: "इदं कुतः आगतम्",
    addIncome: "आयं योजयतु",
  },

  deductions: {
    notAllowedNewRegime: "नवव्यवस्थायां न गण्यते — भवतः अभिलेखे सुरक्षितम्।",
    startedAtCap: (amount: string) => `वयम् एतत् ${amount} इति सीमातः आरब्धवन्तः — “कियत्” इत्यत्र वास्तवतः दत्तां राशिं लिखतु।`,
    heading: "यत् धनं भवान् याचितुं शक्नोति",
    sub: "एतानि स्वयं न भवन्ति। भवता 'आम्' इति वक्तव्यम् — किन्तु सत्यं चेत् एव।",
    claimedHeading: "भवतः विवरणे पूर्वम् एव",
    worthUpTo: (amount: string) => `भवतः करयोग्यात् आयात् ${amount} पर्यन्तं न्यूनीभवितुम् अर्हति`,
    worthWhatYouPaid: "यावत् वस्तुतः दत्तं तावत् एव — वास्तविकीं राशिं याचतु",
    askRentQ: "किं भवान् निवासस्य भाटकं ददाति?",
    askRentWhy:
      "भाटकं ददाति, नियोक्तुः च गृहभाटक-भत्तां न लभते चेत्, तस्य अंशः भवतः करयोग्यात् आयात् न्यूनीभवितुम् अर्हति।",
    askHealthQ: "किं भवान् कुटुम्बस्य स्वास्थ्यबीमायै धनं ददाति?",
    askHealthWhy:
      "कुटुम्बस्य बीमार्थं यत् ददाति, तत् भवतः करयोग्यात् आयात् न्यूनीभवितुम् अर्हति।",
    ask80cQ: "किं भवान् भविष्यनिधौ, जीवनबीमायां, विद्यालयशुल्के वा धनं स्थापयति?",
    ask80cWhy:
      "एतादृशाः दीर्घकालिकाः सञ्चयाः एकस्यां संयुक्तायां सीमायां गण्यन्ते, यावत् स्थापयति तावत् करयोग्यात् आयात् न्यूनीभवति।",
    claimIt: "आम् — एतत् याचे",
    skipIt: "न — एतत् त्यजतु",
    amountLabel: "कियत्",
    evidenceAttached: "प्रमाणं संलग्नम्",
    evidenceMissing: "अद्यापि किमपि प्रमाणं न संलग्नम् — इदानीं चिन्ता नास्ति। पत्रकाणि रक्षतु; विभागः पश्चात् याचितुं शक्नोति।",
    newRegimeNoEffect:
      "नवव्यवस्थायाम् अनया याचनया किमपि न परिवर्तते — तत्र एषा न अनुमता।",
    oldRegimeSaves: (amount: string) =>
      `पुरातनव्यवस्थायाम् एषा भवतः करं प्रायः ${amount} न्यूनीकुर्यात्।`,
  },

  regime: {
    heading: "करः द्वाभ्यां प्रकाराभ्यां भवितुम् अर्हति। एकः भवते श्रेयान्।",
    newRegimeName: "नवव्यवस्था",
    oldRegimeName: "पुरातनव्यवस्था",
    refundLabel: "भवते प्रतिनिवर्तते",
    dueLabel: "दातव्यम् अवशिष्टम्",
    recommendedBadge: "भवते श्रेयान्",
    reasoningOldDeductions: (x: string, y: string) =>
      `भवतः याचनाः समग्रं ${x} भवन्ति, अतः पुरातनव्यवस्था भवतः प्रायः ${y} रक्षति।`,
    reasoningNewDefault: (y: string) =>
      `भवतः याचनाः अत्र विशेषं न फलन्ति, अतः नवव्यवस्थायाः न्यूनाः दराः भवतः प्रायः ${y} रक्षन्ति।`,
    acceptRecommendation: "यत् मम कृते श्रेयः तत् एव चिनोतु",
    overrideNote: "भवान् यत् किमपि चेतुं शक्नोति। अत्र किमपि गुप्तं पिहितं वा नास्ति।",
  },

  check: {
    newRegimeClaimsZero: "भवतः याचनाः सूचिताः सुरक्षिताः च — नवव्यवस्था ताः न अनुमन्यते, अतः एषा पङ्क्तिः ₹0 अस्ति।",
    badgeReportedBy: (reporter: string) => `${reporter} इत्यनेन निवेदितम्`,
    badgeYouEntered: "भवता लिखितम्",
    badgeWeApplied: "वयं भवतः कृते प्रयुक्तवन्तः",
    heading: "सम्पूर्णं विवरणम्, एकस्मिन् एव पृष्ठे",
    sub: "प्रत्येका सङ्ख्या कुतश्चित् आगता। कामपि पङ्क्तिम् उद्घाट्य कुतः इति स्पष्टं पश्यतु।",
    grossIncome: "यत् सर्वम् आगतम्",
    standardDeduction: "मानक-न्यूनता",
    deductionsLine: "भवतः याचनाः",
    taxableIncome: "यस्मिन् करः वस्तुतः भवति",
    slabTax: "सर्वेभ्यः अनुग्रहेभ्यः पूर्वं करः",
    rebate87A: "अस्य अंशं निरस्यन् अनुग्रहः",
    cess: "स्वास्थ्य-शिक्षा-अधिभारः",
    totalTax: "वर्षस्य समग्रः करः",
    tdsCredits: "भवतः पूर्वम् एव गृहीतम्",
    refundDue: "भवते प्रतिनिवर्तते",
    balanceDue: "दातव्यम् अवशिष्टम्",
    openLine: "इदं कुतः आगतम् इति पश्यतु",
    closeLine: "गोपयतु",
    calculationStatus: "प्रतिरूपस्य गणना — नियमानां स्रोतांसि अद्यापि मूलस्रोतेभ्यः परीक्षणीयानि (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} अधः दत्तेभ्यः दृढीकृतेभ्यः तथ्येभ्यः करक्रेडिट्-भ्यः च गणितम्। अस्मिन् प्रतिरूपे स्रोतोऽभिलेखाः कृत्रिमाः सन्ति।`,
    showCalculationTrail: "स्रोतः गणनामार्गं च दर्शयतु",
    hideCalculationTrail: "स्रोतः गणनामार्गं च गोपयतु",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} दिनाङ्के निवेदितम्`,
    sourceIdentifier: (identifier: string) => `अभिलेखः ${identifier}`,
    selfReportedSource: "अस्मिन् विवरणे भवता स्वयं निवेदितम्",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: निवेदक-संस्थाभ्यः प्राप्तायाः सूचनायाः वार्षिकं विवरणम्।"
        : statement === "26AS"
        ? "Form 26AS: भवतः PAN-उपरि निवेदितस्य करक्रेडिट्-स्य विवरणम्।"
        : "अनेन तथ्येन सह बद्धः स्रोतोऽभिलेखः।",
    sectionMeaning: (section: string) =>
      `${section} इति न्यूनतायाः एकः खण्डः। एषा व्यवस्था अनुमन्यते चेत् एव सः गण्यते।`,
    explainGross: "भवता परीक्षितानि दृढीकृतानि च तथ्यानि योजयित्वा।",
    explainStd: (amount: string) =>
      `वेतन-आयवते सर्वस्मै विना याचनया एव ${amount} न्यूनीभवति।`,
    explainDeductions: "एषा व्यवस्था याः याचनाः अनुमन्यते ताः एव गण्यन्ते।",
    explainDisallowed: (section: string) =>
      `${section} अस्यां व्यवस्थायां न अनुमतम्, अतः अत्र तस्य किमपि फलं नास्ति।`,
    explainTaxable: "यत् आगतं, ततः मानक-न्यूनतां भवतः याचनाः च अपनीय।",
    explainSlab: "करः स्तरेषु भवति — आयस्य प्रत्येकः स्तरः स्वस्य दरेण।",
    explainRebate: (amount: string) =>
      `एकस्याः सीमायाः अधः अधिकांशः करः निरस्यते — अत्र तस्य ${amount}।`,
    explainCess: "सर्वेषाम् अनुग्रहाणाम् अनन्तरम् उपरि योज्यमानः लघुः प्रतिशतः।",
    explainTds: "TDS इत्यस्य अर्थः स्रोतसि एव गृहीतः करः: यः भवते धनं दत्तवान्, सः भवत्समीपं प्राप्तेः पूर्वम् एव एतत् धृतवान्।",
    fromFacts: "एभ्यः तथ्येभ्यः:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "प्रेषयितुं सज्जः वा?",
    sub: "एकवारं गतं चेत् परिवर्तनार्थं पुनः प्रेषणम् एव मार्गः। एकवारं पुनः पश्यतु, ततः प्रेषयतु।",
    stepChecking: "गणना परीक्ष्यते…",
    stepSealing: "सङ्ख्याः मुद्र्यन्ते…",
    stepFiled: "प्रेषितम्।",
    ackHeading: "प्राप्तम्।",
    ackBody:
      "भवतः विवरणम् अद्यतः गण्यते। एकं सोपानम् अवशिष्टम्: पृष्टे सति एषः अहम् एव इति दृढीकरणम्। तावत् एतत् अप्रेषितम् इव गण्यते।",
    ackNext:
      "तदनन्तरं ट्रैकर् भवतः धनं कुत्र अस्ति किं च तत् रोद्धुं शक्नोति इति स्पष्टं दर्शयति।",
    errorCause: "परीक्षा-सोपानं विफलम्, यतः सैंडबॉक्स्-स्य fault-स्विच् चालितम् अस्ति।",
    errorAction:
      "समीक्षक-पेटिकायां 'Trigger API Gateway Timeout' निष्क्रियं कृत्वा पुनः प्रेषयतु। किमपि न नष्टम्।",
    errorCauseNetwork: "भवतः विवरणं सर्वर्-पर्यन्तं न प्राप्तम्।",
    errorActionNetwork:
      "किमपि न प्रेषितं किमपि च न नष्टम्। संयोगं परीक्ष्य पुनः प्रेषयतु।",
    retry: "पुनः प्रेषयितुं प्रयततु",
  },

  wizard: {
    identityNextHint: "अग्रे गन्तुं स्वस्य पूर्णं नाम 10-अक्षरं PAN च लिखतु।",
    employmentConfirmHint: "भवतः पूर्वोत्तरात् — परिवर्तितं चेत् अन्यं विकल्पं चिनोतु।",
    tdsZeroWarning:
      "वेतनयुक्ते कार्ये प्रायः सर्वदा करः पूर्वम् एव गृहीतः भवति — तत् भवतः Form 16 इत्यत्र वेतनपत्रे वा अस्ति। अत्र 0 इति लेखनं प्रायः स्वप्रतिदेयस्य त्यागः एव।",
  },

  timeline: {
    filed: "भवान् स्वविवरणं प्रेषितवान्।",
    verified: "एषः अहम् एव इति भवान् दृढीकृतवान्। विवरणम् इतः गण्यते।",
    in_queue: "तस्मिन् सप्ताहे प्रेषितैः अन्यैः सह पङ्क्तौ।",
    under_review: "इदानीं कश्चित् एतत् पश्यति।",
    determined: "निश्चितम् — एतावत् प्रतिनिवर्तते।",
    sent_to_bank: "भवतः बैंकं प्रति प्रेषितम्।",
    credited: "भवतः खाते।",
  },

  refund: {
    heading: (amount: string) => `${amount} भवत्समीपम् आगच्छत् अस्ति`,
    filedDaysAgo: (days: number) => `भवान् ${days} दिनेभ्यः पूर्वं प्रेषितवान्`,

    holdsHeading: (n: number) =>
      n === 1 ? "एकस्य विषयस्य प्रतीक्षा" : `${n} विषयाणां प्रतीक्षा`,
    clearsInDays: (days: number) =>
      days === 1 ? "तत् सिद्धे प्रायः एकं दिनम्" : `तत् सिद्धे प्रायः ${days} दिनानि`,

    cohortWindow: (from: number, to: number) =>
      `भवतः सप्ताहे एव प्रेषितानि विवरणानि इदानीं प्रक्रियायां सन्ति। ${from} तः ${to} दिनानि अपेक्षताम्।`,

    states: {
      not_filed: "अद्यापि न प्रेषितम्",
      filed_unverified: "प्रेषितम्, भवतः दृढीकरणं प्रतीक्षते",
      verified: "भवता दृढीकृतम्",
      in_queue: "पङ्क्तौ",
      under_review: "कश्चित् पश्यति",
      determined: "निश्चितम्",
      sent_to_bank: "भवतः बैंकं प्रति प्रेषितम्",
      credited: "भवतः खाते आगतम्",
      failed: "भवतः खातं प्राप्तुं न शक्तम्",
    },

    bankFailedHeading: "भवता चितं खातं धनं ग्रहीतुं न शक्नोति।",
    bankMergedInto: (bank: string) => `सा शाखा इदानीं ${bank} इत्यस्य भागः`,
    useThisAccount: "तस्य स्थाने अत्र प्रेषयतु",
    resolvedHold: "समाहितम् — इदानीम् एतत् किमपि न रुणद्धि।",
    stampFiled: "प्रेषितम्",
  },

  notices: {
    heading: "विभागात् आगतानि पत्राणि",
    none: "किमपि प्रत्यागतं नास्ति। एतत् एव शुभं फलम्।",
    respondBy: (date: string) => `${date} पर्यन्तम् उत्तरं ददातु`,
    ifYouDoNothing: "भवान् किमपि न करोति चेत्",
    basedOn: "इदं कस्य आधारेण",
    theCatch: "तैः किम् अशुद्धं कृतम्",
    agree: "एतत् सम्यक्",
    disagree: "एतत् अशुद्धम्",
    dinLabel: "अस्य पत्रस्य सन्दर्भसङ्ख्या",
    dinExplain:
      "विभागस्य प्रत्येकस्मिन् पत्रे एषा सङ्ख्या भवितव्या। तया विना पत्रस्य आधिकारिकी सत्ता एव नास्ति।",
  },

  dashboard: {
    serverFilings: "सर्वरि पञ्जीकृतम्",
    serverFilingsEmpty: "LIVE सर्वरि अस्य PAN-स्य किमपि प्रेषितं विवरणं नास्ति — उपरि स्थिता स्वीकृतिः कल्पितकथायाः भागः। अस्मात् एव app-तः प्रेषयतु, वास्तविकं पत्रकम् अत्र आगमिष्यति।",
    greetingLabel: "भवतः साइन्-इन्-वाक्यम्",
    greetingWhy: "खातनिर्माणसमये भवान् एतत् वाक्यं चितवान्। यत् पृष्ठम् एतत् दर्शयितुं न शक्नोति, तत् वयं न स्मः।",
    userDashboard: "उपयोक्तृ-फलकम्",
    taxPrefills: "कर-विवरणानि (AIS/26AS)",
    pendingActions: "अवशिष्टानि कार्याणि",
    returnSummary: "विवरण-सारांशः AY 2026-27",
    reviewPrefill: "कर-विवरण-अनुभागे पूर्वपूरितान् विवरणान् परीक्ष्य, ततः प्रेषणाय दृढीकरोतु।",
    filingSubmitted: "भवतः ई-फाइलिङ्ग्-विवरणं समर्पितम्। समयरेखायां प्रगतिं पश्यतु।",
    verifiedBanks: "प्रतिदानार्थं सत्यापितानि बैंक-खातानि",
    primaryRefundAccount: "मुख्यं प्रतिदान-खातम्",
    backupAccount: "वैकल्पिकं खातम्",
    ifscMeaning: "IFSC इति प्रतिदानप्रेषणाय प्रयुज्यमानः 11-अक्षरः बैंक-मार्गकोडः।",
    refundTimeline: "प्रतिदानस्य समयरेखा",
    filingSubmittedTimeline: "विवरणं समर्पितम्",
    identityVerifiedTimeline: "परिचयः सत्यापितः",
    assessmentProcessingTimeline: "मूल्याङ्कनं प्रचलति",
    refundApprovedTimeline: "प्रतिदानम् अनुमोदितम्",
    refundCreditedTimeline: "प्रतिदानं खाते निक्षिप्तम्",
    holdActive: "अवरोधः सक्रियः: कार्य-अनुभागे कार्याणि समापयतु",
    successCheckApp: "सफलम्! स्वस्य बैंकिङ्ग्-app पश्यतु।",
    outstandingNotices: "अवशिष्टाः अनुपालन-सूचनाः",
    noPendingActions: "किमपि कार्यम् अवशिष्टं नास्ति",
    accountCompliant: "भवतः खातं पूर्णतया अनुपालने अस्ति, कापि अवशिष्टा सूचना करमाङ्गा वा नास्ति।",
    actionableHolds: "कार्यसाध्याः मूल्याङ्कन-अवरोधाः",
    uploadRent: "भाटक-सन्धिपत्रं / पत्रकाणि अपलोड् करोतु",
    landlordName: "गृहस्वामिनः नाम",
    landlordPan: "गृहस्वामिनः PAN (10 अङ्काः)",
    selectPdfJpg: "PDF/JPG चिनोतु",
    submitReceipt: "पत्रकं समर्पयतु",
    responsePosition: "उत्तरस्य पक्षः",
    agreeDept: "अहं विभागेन सह सहमतः अस्मि",
    disagreeProof: "अहम् असहमतः अस्मि (प्रमाणं समर्पयतु)",
    responseDraft: "उत्तर-कथनम् (प्रारूपम्)",
    dictateStatement: "वाचा लेखयतु",
    sendResponse: "उत्तरं प्रेषयतु",
    filingStatusLabel: "प्रेषणस्य स्थितिः",
    bankValidated: "सत्यापितम्",
    bankUnderProcess: "प्रक्रियायाम्",
    bankFailed: "विफलम्",
    staleIfscHold: "एषः बैंक-कोडः इदानीं कुत्रापि न नयति।",
    switchToNewIfsc: (ifsc: string) => `नवं कोडं प्रति परिवर्तयतु (${ifsc})`,
    personalized: {
      eyebrow: "भवतः फलकम्",
      headingFiled: "भवतः विवरणं समर्पितम् — एषा तस्य स्थितिः",
      heading: {
        file_return: "आगच्छतु, भवतः विवरणं सज्जीकुर्मः",
        check_refund: "आगच्छतु, किं प्रतिनिवर्तेत इति पश्यामः",
        understand_notice: "आगच्छतु, अवधानार्हं कार्यं साधयामः",
        correct_prefill: "आगच्छतु, निवेदितां सूचनां परीक्षामहे",
      },
      guidedBody: "प्रत्येकस्याः सङ्ख्यायाः दृढीकरणात् पूर्वं वयं तस्याः अर्थं व्याख्यास्यामः।",
      quickBody: "मार्गं लघुं रक्षामः, अग्रिमं निर्णयं च प्रथमं स्थापयामः।",
      unfiledBody: "प्रथमं, भवतः विषये पूर्वनिवेदितां सूचनां दृढीकरोतु।",
      filedBody: "भवान् यदर्थम् आगतः तदनुरूपं दृश्यं वयम् उद्घाटितवन्तः।",
      primaryAction: {
        facts: "मम निवेदितान् विवरणान् पश्यामि",
        overview: "मम प्रतिदान-ट्रैकरं दर्शयतु",
        statement: "निवेदितान् विवरणान् परीक्षतु",
        actions: "अवधानार्हं दर्शयतु",
      },
      focusLabel: "वयम् एतेषु अवधानं दास्यामः",
      profileLabels: {
        work: "कार्यम्",
        income: "अनुमानिकः समग्रः आयः",
        history: "प्रेषणस्य अनुभवः",
      },
    },
  },

  onboarding: {
    eyebrow: "आरम्भात् पूर्वम्",
    title: "एतत् भवतः कृते सज्जीकुर्मः।",
    intro:
      "पञ्च लघूनि उत्तराणि अस्मान् उचितां भाषां, गतिं, करप्रश्नान् च चेतुं साहाय्यं कुर्वन्ति। पश्चात् परिवर्तयितुं शक्यते।",
    languageQuestion: "वयं कया भाषया वदाम?",
    languageHelp: "एषः एव प्रथमः प्रश्नः। भाषां कदापि परिवर्तयितुं शक्नोति।",
    intentQuestion: "अद्य भवान् किमर्थम् अत्र आगतः?",
    intentHelp: "तत् एव कार्यं वयं प्रथमं स्थापयामः।",
    intentOptions: {
      file_return: {
        label: "अस्य वर्षस्य विवरणं प्रेषयितुम्",
        detail: "भवतः विषये यत् पूर्वम् एव ज्ञातं ततः आरभामहे।",
      },
      check_refund: {
        label: "मह्यं धनं प्रतिदेयं वा इति द्रष्टुम्",
        detail: "किं निवेदितं, किं दत्तं, किं च प्रतिनिवर्तेत इति पश्यतु।",
      },
      understand_notice: {
        label: "पत्रं सूचनां वा अवगन्तुम्",
        detail: "तत् किं वदति, किं पणे अस्ति, अग्रे किं करणीयम् इति पश्यतु।",
      },
      correct_prefill: {
        label: "अशुद्धं दृश्यमानं शोधयितुम्",
        detail: "सङ्ख्यायाः स्रोतः अन्विष्य किं परिवर्तनीयम् इति लिखतु।",
      },
    },
    intentCta: {
      file_return: "मम विवरणम् आरभताम्",
      check_refund: "मम किं प्राप्तव्यम् इति पश्यतु",
      understand_notice: "मया किं करणीयम् इति दर्शयतु",
      correct_prefill: "निवेदितं परीक्षतु",
    },
    situationQuestion: "स्वस्य करजीवनस्य विषये वदतु।",
    situationHelp: "अत्र द्वे लघुनी उत्तरे पर्याप्ते।",
    professionLabel: "भवतः कार्यं किं सम्यक् वर्णयति?",
    professionOptions: {
      salaried: "वेतनयुक्तं कार्यम्",
      self_employed: "स्वतन्त्रं स्वकार्यं वा",
      business_owner: "व्यापारस्वामी",
      student: "छात्रः",
      retired: "निवृत्तः",
      investor: "निवेशकः",
      other: "अन्यत् किमपि",
    },
    filingHistoryLabel: "किं भवान् पूर्वम् आयकरविवरणं प्रेषितवान्?",
    filingHistoryOptions: {
      never: "न, इदं प्रथमवारम्",
      once: "एकवारं द्विवारं वा",
      every_year: "प्रतिवर्षम्",
    },
    incomeQuestion: "सर्वेभ्यः स्रोतोभ्यः भवतः समग्रः आयः प्रायः कियान् आसीत्?",
    incomeHelp: "अनुमानं पर्याप्तम्। सटीका सङ्ख्या इदानीं न अपेक्षिता।",
    incomeOptions: {
      none: "आयः नास्ति",
      under_4: "₹4 लक्षतः न्यूनम्",
      "4_to_8": "₹4 तः ₹8 लक्षम्",
      "8_to_12": "₹8 तः ₹12 लक्षम्",
      "12_to_25": "₹12 तः ₹25 लक्षम्",
      over_25: "₹25 लक्षतः अधिकम्",
    },
    modeQuestion: "भवान् कियत् द्रष्टुम् इच्छति?",
    modeHelp: "एतत् केवलम् आरम्भं निश्चिनोति। कदापि परिवर्तयितुं शक्यते।",
    modeOptions: {
      simple: {
        label: "मम कृते कुरुत",
        detail: "सरलाः शब्दाः, एकस्मिन् समये एकं सोपानम्। शेषं वयं पश्यामः।",
      },
      full: {
        label: "मह्यं सर्वं दर्शयत",
        detail: "प्रत्येका सङ्ख्या, प्रत्येकः नियमः, प्रत्येका गणना — आरम्भात् एव।",
      },
    },
    focusQuestion: "एतेषु केषु वयम् अवधानं दद्मः?",
    focusHelp: "यत् भवते युज्यते तत् सर्वं चिनोतु। निश्चयः नास्ति चेत् 'न जाने' इति अपि चेतुं शक्यते।",
    focusOptions: {
      salary: "वेतनं निवृत्तिवेतनं वा",
      freelance: "स्वतन्त्रं कार्यम्",
      business: "व्यापारस्य आयः",
      rent: "मया दत्तं प्राप्तं वा भाटकम्",
      interest: "बैंकस्य व्याजम्",
      investments: "अंशाः निवेशाः वा",
      deductions: "सञ्चयः, बीमा, गृहऋणं, NPS वा",
      not_sure: "अद्यापि निश्चयः नास्ति",
    },
    chooseOne: "एकं चिनोतु",
    chooseAtLeastOne: "न्यूनातिन्यूनम् एकं चिनोतु",
    questionsLabel: "लघु-सज्जता",
    questionsProgress: (current: number, total: number) => `${total} मध्ये ${current}`,
    savedLocally: "अस्मिन् प्रतिरूपे भवतः उत्तराणि अस्मिन् एव ब्राउज़रे रक्ष्यन्ते।",
    readyTitle: "एतत् भवतः कृते वैयक्तिकं कर्तुं पर्याप्तम्।",
    readyBody:
      "एभिः उत्तरैः वयं प्रथमं किं दर्शनीयम् इति निश्चिनुमः। व्यवस्थायाः अन्तिमः चयनः तु भवता दृढीकृतैः तथ्यैः याचनाभिः च एव भवति।",
    guidedLabel: "वयं कथं व्याख्यास्यामः",
    guidedValue: "गच्छन्तः एव शब्दान् व्याख्यास्यामः।",
    quickValue: "मार्गं लघुं रक्षिष्यामः।",
    regimeLabel: "व्यवस्थाभ्यां सह अस्माकं रीतिः",
    claimsRegimeValue: "व्यवस्थाचयनात् पूर्वं भवतः याचनाः परीक्षिष्यामहे।",
    compareRegimeValue: "तथ्येषु दृढीकृतेषु द्वे अपि व्यवस्थे तोलयिष्यामः।",
    focusLabel: "प्रथमं कस्मिन् अवधानम्",
    startPath: "मम मार्गेण आरभताम्",
    changeAnswers: "उत्तराणि परिवर्तयतु",
    tailoredBadge: "भवतः आरम्भ-मार्गः",
    tailoredGuided: "व्याख्यां कुर्वन्तः अग्रे",
    tailoredQuick: "लघुः मार्गः",
    tailoredRegimeClaims: "व्यवस्थाचयनात् पूर्वं याचनानां परीक्षा",
    tailoredRegimeCompare: "तथ्यानाम् अनन्तरं द्वयोः व्यवस्थयोः तुलना",
    tailoredIntent: (intent: string) => `प्रथमम्: ${intent}`,
  },

  checklist: {
    divider: "प्रेषणात् पूर्वम्",
    itemBefore: "“",
    itemAfter: "” इति दृढीकरोतु — सन्देहः चेत् पत्रकम् उद्घाटयतु।",
    stdRow: "वयं भवतः कृते यां मानक-न्यूनतां प्रयुक्तवन्तः तां दृढीकरोतु।",
    noteLocked: "उपरि प्रत्येकां पङ्क्तिं चिह्नयतु, तदा एव एतत् बटनम् उद्घाट्यते।",
    noteReady: "उपरि सर्वं दृढीकृतम्। सज्जः चेत् प्रेषयतु।",
    fileBtn: "एतत् विवरणं प्रेषयतु",
    lockedBtn: (n: number) => n === 1 ? "प्रथमम् एकाम् अधिकां पङ्क्तिं चिह्नयतु" : `प्रथमम् ${n} अधिकाः पङ्क्तीः चिह्नयतु`,
  },

  factCard: {
    cardNo: (n: number, date: string) => `कार्ड् ${String(n).padStart(2, "0")} · निवेदितम् ${date}`,
    whatThisMeans: "अस्य कः अर्थः",
    readFirst: "प्रथमं “अस्य कः अर्थः” इति उद्घाटयतु — ततः दृढीकरोतु।",
    readyToConfirm: "पठितम्? अधः दृढीकरोतु।",
  },

  signoff: {
    title: "हस्ताक्षर-दृढीकरणम्",
    declaration:
      "मया उपरि दत्ताः सङ्ख्याः पठिताः, मूलपत्रैः सह च मेलिताः। ताः शुद्धाः पूर्णाः च सन्ति।",
    action: "एतासु सङ्ख्यासु हस्ताक्षरं करोतु",
    signed: "हस्ताक्षरं जातम् — उपरि प्रत्येका सङ्ख्या दृढीकृता।",
    hint: "एका घोषणा उपरि सर्वाः सङ्ख्याः आवृणोति। कस्याञ्चित् सङ्ख्यायाम् आपत्तिः चेत् हस्ताक्षरात् पूर्वं “न, एतत् अशुद्धम् अस्ति” इति चिनोतु।",
  },

  channels: {
    sectionLabel: "वर्षम् एकस्मिन् दृष्टिपाते",
    earned: "भवता अर्जितम्",
    toTax: "करं गतम्",
    overpaid: "भवता अधिकं दत्तम्",
    stillToPay: "अद्यापि देयम्",
    stayed: "भवत्तः कदापि न गतम्",
    kept: "यः करः देयः आसीत्",
    back: "भवत्समीपं प्रतिनिवर्तमानम्",
    yoursInEnd: "अन्ते भवतः एव",
    collected: "पूर्वम् एव गृहीतम्",
    ofYear: "वर्षस्य धनस्य",
    sliceNote: "यः अंशः द्रष्टुम् अतिसूक्ष्मः, सः स्वस्य वास्तविकात् भागात् किञ्चित् विस्तीर्णः चित्रितः — पार्श्वे लिखिताः सङ्ख्याः तु सटीकाः।",
    whereItWent: "भवता अर्जितः प्रत्येकः रूप्यकः कुत्र गतः",
    earnedDesc: "वेतनं, व्याजम्, अन्यत् सर्वं च — भवते दातृभिः निवेदितम् अनुसृत्य।",
    toTaxDesc: "भवतः सर्वाधिकारयुक्तानां न्यूनतानाम् अनन्तरं वस्तुतः देयः करः।",
    backDesc: "भवतः वेतनात् गृहीतं किन्तु कदापि देयं न आसीत्। एतत् भवते प्रतिनिवर्तते।",
    dueDesc: "पूर्वगृहीतात् अधिकं देयम्। एतत् अद्यापि दातव्यम्।",
    howToRead: "एवं पठतु: अत्र किमपि अस्माभिः न कल्पितम्। प्रत्येका सङ्ख्या केनचित् समर्पितात् पत्रात् आगता, अथवा भवता स्वयं लिखिता। पेन्सिल्-टिप्पण्यः प्रत्येकस्याः वास्तविकम् अर्थं व्याख्यान्ति — सरलैः शब्दैः, न करशब्दैः।",
    meterCap: "देयः करः प्रति पूर्वगृहीतम्",
  },

  agent: {
    title: "वापसी-सहायकः",
    open: "सहायकम् उद्घाटयतु",
    close: "पिधीयताम्",
    placeholder: "परीक्षितुं, व्याख्यातुं, प्रेषयितुं वा वदतु…",
    send: "प्रेषयतु",
    thinking: "कार्यं प्रचलति…",
    toolRan: "कृतम्:",
    confirmTitle: "प्रेषणाय सज्जम् — सङ्ख्याः दृढीकरोतु",
    confirmBody: "भवतः दृढीकरणं विना किमपि न प्रेष्यते। एतत् समर्पयिष्यते:",
    confirmTotalTax: "समग्रः करः",
    confirmRefund: "भवते देयं प्रतिदानम्",
    confirmDue: "देया राशिः",
    confirmTaxable: "करयोग्यः आयः",
    confirmButton: "दृढीकृत्य प्रेषयतु",
    cancelButton: "निरस्यतु",
    filingDismissed: "अस्तु — किमपि न प्रेषितम्।",
    error: "सहायकः प्राप्तुं न शक्यते। भवतः विवरणं यथावत् अस्ति — पुनः प्रयत्नं करोतु।",
    intro: "अहं भवतः विवरणं परीक्षितुं, कामपि सङ्ख्यां व्याख्यातुं, 'यदि-तर्हि' गणनां कर्तुं, प्रेषणस्य सज्जतां च कर्तुं शक्नोमि। प्रेषणं सर्वदा भवतः दृढीकरणानन्तरम् एव भवति।",
    sample: "80C-मध्ये ₹1,50,000 निवेशे मम कियती रक्षा भवेत्?",
  },

  footer: {
    prototype: "स्वतन्त्रं परिकल्पना-प्रतिरूपम्।",
    notAffiliated:
      "इदम् आयकरविभागेन, CBDT-इत्यनेन, भारतसर्वकारेण वा न सम्बद्धं, न समर्थितं, न च संयुक्तम्। अत्रत्यं प्रत्येकं नाम, PAN, राशिः, पत्रं च कल्पितम्। कोऽपि वास्तविकः सर्वकारीयः तन्त्रांशः न सम्पर्क्यते।",
    honestyLink: "किं सत्यं किं च कृत्रिमम् इति पश्यतु",
  },
};

/**
 * Sanskrit translations of the localized mock strings. Keys are the byte-exact
 * English strings from LOCALIZED_MOCK_STRINGS. Model-generated; awaits review
 * (T0.5).
 */
export const saMock: Record<string, string> = {
  "Your pay last year": "गतवर्षस्य भवतः वेतनम्",
  "Interest your savings account earned": "सञ्चयखातेन अर्जितं व्याजम्",
  "Interest your accounts earned": "भवतः खातैः अर्जितं व्याजम्",
  "Your primary contract income": "भवतः मुख्यः अनुबन्ध-आयः",
  "Savings interest": "सञ्चयखातस्य व्याजम्",
  "Tax withheld (TDS)": "पूर्वं गृहीतः करः (TDS)",
  "Provident Fund / ELSS Mutual Funds": "भविष्यनिधिः / ELSS म्यूचुअल्-फण्ड्",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "तस्याः वेतनात् ₹8,400 गृहीतम्। तया किमपि देयं नास्ति। सा अद्यापि विवरणं न प्रेषितवती, विद्यालयशुल्कं च दातव्यम् अस्ति।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "द्वे सूचने स्तः। एका वदति यत् सः ₹1,10,000 अंशलाभं गोपितवान् — वस्तुतः सः ₹4,200 हानिं प्राप्तवान्। अपरा 2019-वर्षस्य तस्य अश्रुतस्य देयकस्य कृते तस्य प्रतिदानस्य अंशं धर्तुम् इच्छति।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 दिनेभ्यः पूर्वं प्रेषितम्। पोर्टल्-मध्ये 'प्रक्रिया चलति' इति एव दृश्यते, अन्यत् किमपि न। वस्तुतः द्वे पृथक् वस्तुनी तस्याः ₹34,800 रुन्धतः।",
  "Tax already taken out of your pay": "वेतनात् पूर्वम् एव गृहीतः करः (TDS)",
  "Dividend your shares paid out": "भवतः अंशेभ्यः प्राप्तः लाभांशः",
  "Money from selling shares": "अंशविक्रयात् प्राप्तं धनम्",
  "Tax the bank withheld on your interest": "व्याजे बैंकेन गृहीतः करः (TDS)",
  "Provident fund, insurance and your daughter's tuition": "भविष्यनिधिः (PF), बीमा, पुत्र्याः शिक्षणशुल्कं च",
  "Provident fund and your insurance premium": "भविष्यनिधिः (PF) भवतः बीमा-प्रीमियम् च",
  "Health cover for the family": "कुटुम्बस्य स्वास्थ्यबीमा",
  "Rent you paid, with no house-rent allowance from your employer":
    "भवता दत्तं भाटकम्, नियोक्तुः गृहभाटक-भत्तां विना",
  "One figure doesn't match what your broker reported.": "एका सङ्ख्या भवतः ब्रोकरेण निवेदितेन सह न मिलति।",
  "₹18,740 of this is being held against an old bill.": "अस्मात् ₹18,740 एकस्य पुरातनस्य देयकस्य कृते धृतम् अस्ति।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "विभागः मन्यते यत् भवान् ₹1,10,000 अंशलाभं त्यक्तवान्।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019-वर्षस्य देयकं समाधातुं विभागः भवतः प्रतिदानात् ₹18,740 धर्तुम् इच्छति।",
  "Waiting on one thing: a receipt for your rent claim.": "एकस्य विषयस्य प्रतीक्षा: भवतः भाटक-याचनायाः पत्रकम्।",
  "The account you chose can't receive the money.": "भवता चितं खातं धनं ग्रहीतुं न शक्नोति।",
  "Held: your rent claim needs a receipt.": "धृतम्: भवतः भाटक-याचनायै पत्रकम् आवश्यकम्।",
  "Your bank account was checked and failed.": "भवतः बैंक-खातं परीक्षितं, विफलं च जातम्।",
  "The department is asking you to look again at your rent claim.":
    "विभागः भवन्तं स्वस्य भाटक-याचनां पुनः द्रष्टुं याचते।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities अंशविक्रयात् ₹1,10,000 निवेदितवती। भवतः विवरणं तत् न दर्शयति। यावत् तत् न समाहितं तावत् प्रतिदानं यथास्थानम् एव तिष्ठति।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 वर्षस्य एका माङ्गा अस्य वर्षस्य प्रतिदानेन सह समायोज्यते। भवान् तां निराकर्तुं शक्नोति, 3 दिनाङ्कात् पूर्वं च तां पठतु।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 सितम्बर-पर्यन्तं किमपि न वदति चेत्, ₹1,10,000 भवतः आये योज्यते, भवतः प्रतिदानात् च प्रायः ₹34,300 गृह्यते।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 सितम्बर-पर्यन्तं किमपि न वदति चेत्, भवतः प्रतिदानात् ₹18,740 गृह्यते, विषयः च समाप्तः इति मन्यते।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "भवान् ₹1,10,000 मूल्यस्य अंशान् विक्रीतवान्, तेषां लाभं च न घोषितवान्।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 इति मया विक्रीतस्य सर्वस्य समग्रं मूल्यम्, न तु मम लाभः। तेषु व्यवहारेषु मम ₹4,200 हानिः जाता। वर्षस्य मम ब्रोकर-विवरणं क्रयमूल्यानि दर्शयति।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 वर्षस्य ₹18,740 अद्यापि भवता देयम्, अतः तत् अस्य वर्षस्य प्रतिदानात् गृह्यते।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "भवान् ₹60,000 भाटकं याचितवान्। तत् दर्शयितुं किमपि न संलग्नम्। पत्रकं गृहस्वामिनः नाम PAN च वा योजयतु, एतत् च अग्रे गच्छति।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank गतवर्षे Deccan Union Bank इत्यस्य भागः जातः। खातम् अद्यापि अस्ति — किन्तु तस्मै धनं नयन् कोडः इदानीं नास्ति।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "भवान् 80GG-अन्तर्गतं ₹60,000 भाटकं याचितवान्, समर्थनार्थं च किमपि न संलग्नम्।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "मया एतत् भाटकं वस्तुतः दत्तम्। मम समीपे गृहस्वामिनः मासिकानि पत्रकाणि सन्ति, तस्य नाम PAN च दातुं शक्नोमि।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "इदं न आरोपः, अद्यापि च कोऽपि दण्डः नास्ति। किन्तु यावत् भवान् याचनायाः प्रमाणं न ददाति तां वा न प्रत्याहरति, तावत् भवतः ₹34,800 यथास्थानम् एव तिष्ठति।",
  "Look at what they reported": "तैः किं निवेदितम् इति पश्यतु",
  "Read the 2019 demand": "2019-वर्षस्य माङ्गां पठतु",
  "Add the receipt": "पत्रकं योजयतु",
  "Point it at the right account": "एतत् शुद्धं खातं प्रति निर्दिशतु",
  "Supervisor, garment unit": "पर्यवेक्षिका, वस्त्रनिर्माण-एककम्",
  "Operations manager; trades equity on the side": "सञ्चालन-प्रबन्धकः; पार्श्वे अंशेषु व्यवहरति",
  "Junior architect; first time filing": "कनिष्ठा वास्तुकारा; प्रथमवारं प्रेषयति",
  "Independent Consultant": "स्वतन्त्रः परामर्शदाता",
  "Primary School Teacher": "प्राथमिकविद्यालयस्य शिक्षिका",
  "Retired bank clerk": "निवृत्तः बैंक-लिपिकः",
  "Retired": "निवृत्तः",
  "Teacher": "शिक्षकः",
  "You sent your return in.": "भवान् स्वविवरणं प्रेषितवान्।",
  "You confirmed it was you. The return counts from here.":
    "एषः अहम् एव इति भवान् दृढीकृतवान्। विवरणम् इतः गण्यते।",
  "In the queue with everything else filed that week.": "तस्मिन् सप्ताहे प्रेषितैः अन्यैः सह पङ्क्तौ।",
  "Someone is looking at one figure.": "कश्चित् एकां सङ्ख्यां पश्यति।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "भवतः ब्रोकरेण समर्पिता अंशविक्रय-पङ्क्तिः भवतः विवरणेन सह न मिलति।",
  "OTP verified, 4 minutes after filing.": "OTP सत्यापितम्, प्रेषणात् 4 निमेषानन्तरम्।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG-अन्तर्गतं ₹60,000 याचितम्, समर्थनार्थं किमपि न संलग्नम्।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank परीक्षां प्रत्यागमितवती: IFSC GODG0004417 इदानीं कुत्रापि न नयति।",
  "OTP Verification Complete": "OTP-सत्यापनं सम्पूर्णम्",
  "Outstanding Compliance Notices": "अवशिष्टाः अनुपालन-सूचनाः",
  "Draft Legal Response": "विधिक-उत्तरस्य प्रारूपम्",
  "No Pending Actions": "किमपि कार्यम् अवशिष्टं नास्ति",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "भवतः खातं पूर्णतया अनुपालने अस्ति, कापि अवशिष्टा सूचना करमाङ्गा वा नास्ति।",
  "Actionable Assessment Holds": "कार्यसाध्याः मूल्याङ्कन-अवरोधाः",
  "Upload Rent Agreement / Receipts": "भाटक-सन्धिपत्रं / पत्रकाणि अपलोड् करोतु",
  "Landlord Name": "गृहस्वामिनः नाम",
  "Landlord PAN (10 Digits)": "गृहस्वामिनः PAN (10 अङ्काः)",
  "Select PDF/JPG": "PDF/JPG चिनोतु",
  "Submit Receipt": "पत्रकं समर्पयतु",
  "Response Position": "उत्तरस्य पक्षः",
  "I Agree with Department": "अहं विभागेन सह सहमतः अस्मि",
  "I Disagree (Submit Proof)": "अहम् असहमतः अस्मि (प्रमाणं समर्पयतु)",
  "Response Statement (Draft)": "उत्तर-कथनम् (प्रारूपम्)",
  "Dictate Statement": "वाचा लेखयतु",
  "Listening...": "शृणोमि...",
  "Explain your disagreement or agreement...": "स्वस्य सहमतिम् असहमतिं वा व्याख्यातु...",
  "Send Response": "उत्तरं प्रेषयतु",
  "Cancel": "निरस्यतु",
  "Validate Bank Code": "बैंक-कोडं सत्यापयतु",
  "Update Bank IFSC": "बैंक-IFSC नवीकरोतु",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "बैंक-विवरणानां सत्यापनार्थं 11-अङ्कं बैंक-मार्गकोडं (IFSC) परीक्षतु।",
  "IFSC Code": "IFSC कोडः",
};

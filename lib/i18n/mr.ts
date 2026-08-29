/**
 * मराठी (Marathi). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and awaits review by a native Marathi
 * speaker who knows tax vocabulary (project task T0.5). That limitation is
 * disclosed on /honesty rather than hidden.
 *
 * Digits stay Latin. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes
 * and proper nouns stay untranslated, following the hi.ts precedents.
 */

import type { Dict } from "./en";

export const mr: Dict = {
  langName: "Marathi",
  langNativeName: "मराठी",
  dir: "ltr",

  common: {
    modeSimple: "सोपे",
    modeDetailed: "सविस्तर",
    continue: "पुढे जा",
    back: "मागे",
    yesThatsRight: "हो, हे बरोबर आहे",
    noThisIsWrong: "नाही, हे चुकीचे आहे",
    iDontUnderstand: "मला हे समजले नाही",
    close: "बंद करा",
    saveAndGoOn: "जतन करा आणि पुढे जा",
    loading: "एक क्षण",
    logOut: "लॉग आउट",
    undo: "मागे घ्या",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "तपासणी आणि फाइलिंगचा सोपा मार्ग",
    independent: "स्वतंत्र प्रोटोटाइप",
    taxYear: "कर वर्ष 2026-27",
    language: "भाषा",
    light: "लाइट",
    dark: "डार्क",
    sandbox: "रिव्ह्यू साधने",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "मुख्य मजकुरावर जा",
  },

  validate: {
    panTooShort: (n: number) => `आत्तापर्यंत ${n} अक्षरे झाली. PAN मध्ये 10 असतात.`,
    panShape:
      "PAN मध्ये आधी पाच अक्षरे, मग चार अंक, मग एक अक्षर असते — जसे DEMPS4417K.",
    panSandboxHint:
      "तुम्ही इथे जे टाइप करता ते तुमच्या ब्राउझरबाहेर जात नाही. या प्रोटोटाइपमधला प्रत्येक PAN DEMP ने सुरू होतो, त्यामुळे खरा PAN चुकूनही शोधला जाऊ शकत नाही.",
    ifscTooShort: (n: number) => `आत्तापर्यंत ${n} अक्षरे झाली. बँक कोडमध्ये 11 असतात.`,
    ifscShape:
      "बँक कोडमध्ये आधी चार अक्षरे, मग एक शून्य, मग आणखी सहा — जसे DECU0834471.",
  },

  landing: {
    question: "आयकर विभागाकडे तुमचे पैसे अडकले आहेत का?",
    subtext:
      "इथे येणाऱ्या बहुतेक लोकांना काही भरायचे नसते — त्यांना मिळायचे असते. तुमचा PAN टाका, काय अडकले आहे ते आम्ही सांगू.",
    panLabel: "तुमचा PAN",
    panHelp: "दहा अक्षरे, तुमच्या PAN कार्डवरून",
    panPlaceholder: "उदाहरणार्थ, DEMPS4417K",
    check: "माझे किती येणे आहे ते पाहा",
    orTryAs: "किंवा तीन व्यक्तींपैकी एक बनून पाहा",
    honestyLink: "इथे काय खरे आहे आणि काय बनवलेले",
    architectureLink: "तांत्रिक रचना",
    badge: "सोपे रिटर्न, प्रत्यक्ष सिद्ध",
    brandTitle: "तुमचे पैसे, परतीच्या वाटेवर.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "फाइल करणे",
      blurb:
        "तिच्या पगारातून ₹8,400 कापले गेले. तिला काही देणे नाही, तिने फाइल केलेले नाही, आणि शाळेची फी भरायची आहे.",
      action: "आधीच माहीत असलेले पक्के करा",
    },
    rakesh: {
      phase: "एक पत्र आले",
      blurb:
        "पत्र म्हणते की त्याने शेअरमधला ₹1,10,000 चा नफा लपवला. त्याचा रिफंड एका जुन्या मागणीपोटी अडवला गेला आहे, जिची त्याला कधी कल्पनाच दिली गेली नव्हती.",
      action: "वाचा आणि असहमती नोंदवा",
    },
    priya: {
      phase: "प्रतीक्षा",
      blurb:
        "71 दिवसांपूर्वी फाइल केले. अजूनही 'प्रक्रिया चालू आहे' असेच दिसते. खरे तर दोन गोष्टी अडवून आहेत, आणि कोणत्या ते कोणीही सांगितले नाही.",
      action: "काय अडवते आहे ते पाहा",
    },
    custom: {
      phase: "स्वतः तयार करा",
      blurbTitle: "काल्पनिक कोणीतरी",
      blurb:
        "सुरुवातीपासून एक व्यक्ती तयार करा — तिची कमाई, तिचे दावे, कापला गेलेला कर — आणि हिशेब आपोआप कसा जुळतो ते पाहा.",
      action: "कोणीतरी तयार करा",
    },
  },

  login: {
    authVerifying: "सर्व्हरकडे तपासत आहोत…",
    authUnreachable:
      "साइन-इन सर्व्हरपर्यंत पोहोचता आले नाही. तुम्ही भरलेले काहीही गेलेले नाही — थोड्या वेळाने पुन्हा प्रयत्न करा.",
    authRejected: (detail: string) => `सर्व्हरने साइन-इन नाकारले: ${detail}`,
    signedInAs: "साइन-इन झाले — सत्र सुरू आहे",
    otpSentTo: (mobile: string) => `आम्ही ${mobile} वर एक कोड पाठवला आहे`,
    otpLabel: "सहा अंकी कोड",
    weWillWait:
      "सावकाश करा. कोडची वाट पाहताना तुम्ही भरलेले काहीही जाणार नाही.",
    resend: "पुन्हा पाठवा",
    resendIn: (seconds: number) => `${seconds} सेकंदांनी पुन्हा मागू शकता`,
    mockNotice:
      "हा प्रोटोटाइप आहे, म्हणून कोड स्क्रीनवरच दाखवला आहे. कोणताही खरा संदेश पाठवला जात नाही.",
    portalHeading: "ई-फाइलिंग पडताळणी",
    incorrectCode: "हा कोड जुळत नाही. सहा अंक पुन्हा तपासा आणि पुन्हा प्रयत्न करा.",
    prototypeBox: "प्रोटोटाइप OTP पडताळणी",
    mockCodeLabel: "मॉक कोड",
    autoFill: "माझ्यासाठी भरून द्या",
    verifyEnter: "पडताळा आणि आत जा",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "सहा अंकी पडताळणी कोड",
    otpDigitLabel: (position: number, total: number) =>
      `अंक ${position}, एकूण ${total} पैकी`,
    draftRestored: (time: string) => `तुमचा ${time} चा मसुदा परत आणला आहे. काहीही गेलेले नाही.`,
  },

  file: {
    heading: (amount: string) => `तुमचे ${amount} विभागाकडे पडून आहेत`,
    subheading:
      "खाली दिलेली जवळपास प्रत्येक गोष्ट तुमच्याबद्दल आधीच नोंदवली गेली आहे. ती वाचा, आणि काही चुकीचे असेल तर आम्हाला सांगा.",

    checkThis: "हे फक्त तपासा — भरायचे नाही",
    factMeaning: "ही आधीच नोंदवलेली माहिती आहे, कराचा नियम नाही. खालचा हिशेब यावरूनच होतो.",
    factMeaningByKind: {
      salary: "तुमच्या नियोक्त्याने तुमच्यापर्यंत पोहोचलेल्या पगारावरून हे नोंदवले. खालचा सगळा हिशेब इथूनच सुरू होतो.",
      interest: "बँका वर्षातून एकदा तुमच्या खात्यांना मिळालेले व्याज नोंदवतात. छोटी रक्कमही उत्पन्नच असते.",
      dividend: "कंपनी रजिस्ट्रारने तुमच्या शेअर्सनी दिलेली रक्कम नोंदवली. ज्या वर्षी मिळाली त्याच वर्षीचे ते उत्पन्न धरले जाते.",
      capital_gains: "तुमच्या ब्रोकरने शेअर विकून आलेले पैसे नोंदवले. कर नफ्यावर लागतो — दर काय विकले आणि किती काळ ठेवले यावर अवलंबून असतो.",
      rent: "मिळालेले भाडे उत्पन्न आहे; दिलेले भाडे तुमचा कर कमी करू शकते. दोन्ही बाजूंच्या नोंदी जुळायला हव्यात.",
      other: "इतर कुठल्याही गटात न बसणारे नोंदवलेले उत्पन्न. तेही खालच्या हिशेबात धरले जाते.",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} यांनी ${date} रोजी विभागाला हे कळवले`,
    underIdentifier: (identifier: string) => `नोंदणी ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `हे चुकीचे असेल तर मूळ जागी फक्त ${reporter} च बदलू शकतात. त्यांच्याकडे नेमके काय मागायचे ते आम्ही सांगू.`,

    whatYouEarned: "तुम्ही किती कमावले",
    whatWasDeducted: "आधीच कापलेला कर",
    whereMoneyGoes: "पैसे कुठे जातील",
    whoYouAre: "तुम्ही कोण आहात",

    disputeHeading: "इथे काय लिहिलेले असायला हवे?",
    disputeAmountLabel: "बरोबर रक्कम",
    disputeReasonLabel: "हे चुकीचे का आहे",
    disputeSave: "हे चुकीचे म्हणून नोंदवा",
    selfReported: "तुम्ही",
    returnLabel: "तुमचे रिटर्न",

    outcomeOwesNothing: "तुम्हाला काहीही देणे नाही.",
    outcomeRefund: (amount: string) => `${amount} तुम्हाला परत मिळतील.`,
    outcomeOwes: (amount: string) => `${amount} भरायचे बाकी आहेत.`,
    confirmAndFile: "हे पाठवून द्या",

    verifyHeading: "एकच पाऊल उरले आहे, नाहीतर हे गणलेच जाणार नाही.",
    verifyBody:
      "हे तुम्हीच आहात याची पुष्टी करेपर्यंत तुमचे रिटर्न दाखल धरले जात नाही — जणू तुम्ही पाठवलेच नाही. याला साधारण वीस सेकंद लागतात.",
    verifyAction: "हा मीच आहे याची पुष्टी करा",

    voicePrompt: "किंवा नुसते बोलून सांगा",
    voiceListening: "ऐकत आहोत",
    voiceUnsupported:
      "या फोनचा ब्राउझर अजून ऐकू शकत नाही. तुम्ही टाइप करू शकता — काहीही जाणार नाही.",
    voiceSimulated: "हा ब्राउझर ऐकू शकत नाही, म्हणून हे एक उदाहरण आहे, तुमचा आवाज नाही.",
    voiceError: "ते ऐकू आले नाही. तुम्ही टाइप करू शकता — काहीही जाणार नाही.",
    dictate: "बोलून सांगा",
    disputePlaceholder: "हा आकडा चुकीचा का आहे — बोला किंवा टाइप करा.",
    disputeDefaultReason: "नोंदवलेला आकडा चुकीचा आहे",
  },

  flow: {
    facts: "तुमचे पैसे",
    deductions: "तुम्ही मागू शकता ते पैसे",
    regime: "जुनी की नवी",
    check: "तपासा",
    file: "पाठवा",
    stepOf: (n: number, total: number) => `पाऊल ${n}, एकूण ${total}`,
    confirmedCount: (done: number, total: number) => `${total} पैकी ${done} पक्के`,
    allConfirmed: "सगळे नीट आहे.",
    undoOne: "ही दुरुस्ती मागे घ्या",
    correctedTo: (amount: string) => `तुमच्या म्हणण्यानुसार हे ${amount} असायला हवे`,
  },

  groups: {
    moneyIn: "येणारे पैसे",
    taxPaid: "तुमच्यासाठी आधीच भरलेला कर",
    deductionsClaimed: "तुमचे दावे",
    fromWhere: "हे कुठून आले",
    addIncome: "उत्पन्न जोडा",
  },

  deductions: {
    notAllowedNewRegime: "नव्या प्रणालीत धरले जात नाही — नोंदीत मात्र जपून ठेवले आहे.",
    startedAtCap: (amount: string) =>
      `आम्ही याची सुरुवात ${amount} च्या मर्यादेपासून केली आहे — तुम्ही प्रत्यक्ष जे भरले ते “किती” मध्ये टाका.`,
    heading: "तुम्ही मागू शकता ते पैसे",
    sub: "हे आपोआप होत नाही. तुम्हाला हो म्हणावे लागते — पण फक्त खरे असेल तरच.",
    claimedHeading: "तुमच्या रिटर्नमध्ये आधीच",
    worthUpTo: (amount: string) => `तुमच्या करपात्र उत्पन्नातून ${amount} पर्यंत कमी होऊ शकते`,
    worthWhatYouPaid: "तुम्ही प्रत्यक्ष जितके भरले तितकेच — खरी रक्कम भरा",
    askRentQ: "तुम्ही राहत्या जागेचे भाडे देता का?",
    askRentWhy:
      "तुम्ही भाडे देत असाल आणि नियोक्त्याकडून घरभाडे भत्ता मिळत नसेल, तर त्याचा काही भाग तुमच्या करपात्र उत्पन्नातून कमी होऊ शकतो.",
    askHealthQ: "कुटुंबाचा आरोग्य विमा तुम्ही स्वतः भरता का?",
    askHealthWhy:
      "कुटुंबाचा विमा चालू ठेवण्यासाठी तुम्ही जे भरता ते तुमच्या करपात्र उत्पन्नातून कमी होऊ शकते.",
    ask80cQ: "तुम्ही भविष्य निर्वाह निधी, आयुर्विमा किंवा शाळेच्या फीमध्ये पैसे घालता का?",
    ask80cWhy:
      "अशा दीर्घकालीन बचती एका एकत्रित मर्यादेत मोजल्या जातात, आणि तुम्ही जितके घालता तितके करपात्र उत्पन्नातून कमी होते.",
    claimIt: "हो — हा दावा करा",
    skipIt: "नाही — हे वगळा",
    amountLabel: "किती",
    evidenceAttached: "पुरावा जोडला आहे",
    evidenceMissing:
      "अजून कोणताही पुरावा जोडलेला नाही — सध्या हरकत नाही. पावत्या जपून ठेवा; विभाग नंतर मागू शकतो.",
    newRegimeNoEffect:
      "नव्या प्रणालीत या दाव्याने काही बदलत नाही — तिथे तो चालतच नाही.",
    oldRegimeSaves: (amount: string) =>
      `जुन्या प्रणालीत यामुळे तुमचा कर साधारण ${amount} ने कमी झाला असता.`,
  },

  regime: {
    heading: "कर लागण्याचे दोन मार्ग आहेत. एक तुमच्यासाठी चांगला आहे.",
    newRegimeName: "नवी प्रणाली",
    oldRegimeName: "जुनी प्रणाली",
    refundLabel: "तुम्हाला परत मिळेल",
    dueLabel: "भरायचे बाकी",
    recommendedBadge: "तुमच्यासाठी चांगली",
    reasoningOldDeductions: (x: string, y: string) =>
      `तुमचे दावे एकूण ${x} चे आहेत, त्यामुळे जुनी प्रणाली तुमचे साधारण ${y} वाचवते.`,
    reasoningNewDefault: (y: string) =>
      `तुमच्या दाव्यांनी इथे फारसा फरक पडत नाही, त्यामुळे नव्या प्रणालीचे कमी दर तुमचे साधारण ${y} वाचवतात.`,
    acceptRecommendation: "माझ्यासाठी जे चांगले आहे तेच निवडा",
    overrideNote: "तुम्ही कोणतीही निवडू शकता. इथे काहीही लपवलेले किंवा बंद नाही.",
  },

  check: {
    newRegimeClaimsZero:
      "तुमचे दावे नोंदलेले आणि सुरक्षित आहेत — नवी प्रणाली त्यांना परवानगीच देत नाही, म्हणून ही ओळ ₹0 आहे.",
    badgeReportedBy: (reporter: string) => `${reporter} यांनी नोंदवले`,
    badgeYouEntered: "तुम्ही भरले",
    badgeWeApplied: "आम्ही तुमच्यासाठी लागू केले",
    heading: "संपूर्ण रिटर्न, एकाच पानावर",
    sub: "प्रत्येक आकडा कुठूनतरी आला आहे. कोणतीही ओळ उघडा आणि नेमके कुठून ते पाहा.",
    grossIncome: "जे जे आले ते सगळे",
    standardDeduction: "प्रमाणित वजावट",
    deductionsLine: "तुम्ही केलेले दावे",
    taxableIncome: "ज्यावर कर प्रत्यक्ष लागतो ते उत्पन्न",
    slabTax: "कोणत्याही सवलतीआधीचा कर",
    rebate87A: "यातला काही भाग रद्द करणारी सूट",
    cess: "आरोग्य-शिक्षण अधिभार",
    totalTax: "वर्षाचा एकूण कर",
    tdsCredits: "आधीच तुमच्याकडून कापलेले",
    refundDue: "तुम्हाला परत मिळेल",
    balanceDue: "भरायचे बाकी",
    openLine: "हे कुठून आले ते दाखवा",
    closeLine: "लपवा",
    calculationStatus:
      "हा प्रोटोटाइपचा हिशेब आहे — नियमांच्या स्रोतांची प्राथमिक स्रोतांशी पडताळणी अजून बाकी आहे (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} हे खाली दिलेल्या पक्क्या केलेल्या माहितीवरून आणि कर जमांवरून काढले आहे. या प्रोटोटाइपमधल्या मूळ नोंदी कृत्रिम आहेत.`,
    showCalculationTrail: "स्रोत आणि हिशेबाची साखळी दाखवा",
    hideCalculationTrail: "स्रोत आणि हिशेबाची साखळी लपवा",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} रोजी नोंदवले`,
    sourceIdentifier: (identifier: string) => `नोंद ${identifier}`,
    selfReportedSource: "या रिटर्नमध्ये तुम्ही स्वतः नोंदवलेले",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: नोंद करणाऱ्या संस्थांकडून मिळालेल्या माहितीचे वार्षिक विवरण."
        : statement === "26AS"
        ? "Form 26AS: तुमच्या PAN वर नोंदवलेल्या कर जमांचे विवरण."
        : "या माहितीशी जोडलेली मूळ नोंद.",
    sectionMeaning: (section: string) =>
      `${section} हे वजावटीचे एक कलम आहे. ही प्रणाली परवानगी देते तेव्हाच ते धरले जाते.`,
    explainGross: "तुम्ही तपासून पक्क्या केलेल्या नोंदींची बेरीज.",
    explainStd: (amount: string) =>
      `पगारी उत्पन्न असलेल्या प्रत्येकाला काहीही न मागता ${amount} ची वजावट मिळते.`,
    explainDeductions: "ही प्रणाली परवानगी देते तेच दावे धरले जातात.",
    explainDisallowed: (section: string) =>
      `${section} या प्रणालीत चालत नाही, म्हणून इथे त्याचा काही उपयोग नाही.`,
    explainTaxable: "जे आले, त्यातून प्रमाणित वजावट आणि तुमचे दावे वजा करून.",
    explainSlab: "कर टप्प्याटप्प्याने लागतो — उत्पन्नाच्या प्रत्येक टप्प्याला त्याचा त्याचा दर.",
    explainRebate: (amount: string) =>
      `एका मर्यादेखाली बहुतेक कर रद्द होतो — इथे त्यातले ${amount}.`,
    explainCess: "प्रत्येक सवलतीनंतर वर लागणारी छोटी टक्केवारी.",
    explainTds:
      "TDS म्हणजे मुळावरच कापलेला कर: ज्याने तुम्हाला पैसे दिले, त्याने ते तुमच्यापर्यंत पोहोचण्याआधीच हे कापून ठेवले.",
    fromFacts: "या नोंदींवरून:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "पाठवायला तयार?",
    sub: "एकदा गेले की बदलायचे म्हणजे पुन्हा फाइल करायचे. आणखी एकदा नजर टाका, मग पाठवा.",
    stepChecking: "हिशेब तपासत आहोत…",
    stepSealing: "आकडे सील करत आहोत…",
    stepFiled: "दाखल झाले.",
    ackHeading: "पोहोचले.",
    ackBody:
      "तुमचे रिटर्न आजपासून गणले जाईल. एक पाऊल उरले आहे: विचारले जाईल तेव्हा हे खरेच तुम्ही आहात याची पुष्टी करणे. तोपर्यंत ते न पाठवल्यासारखेच धरले जाते.",
    ackNext:
      "त्यानंतर ट्रॅकर नेमके दाखवेल की तुमचे पैसे कुठे आहेत आणि त्यांना काय अडवू शकते.",
    errorCause: "सँडबॉक्सचा fault स्विच चालू असल्यामुळे तपासणीचे पाऊल अडले.",
    errorAction:
      "रिव्ह्यूअर ड्रॉवरमधले 'Trigger API Gateway Timeout' बंद करा, मग पुन्हा पाठवा. काहीही गेलेले नाही.",
    errorCauseNetwork: "तुमचे रिटर्न सर्व्हरपर्यंत पोहोचले नाही.",
    errorActionNetwork:
      "काहीही दाखल झाले नाही आणि काहीही गेले नाही. कनेक्शन तपासा, मग पुन्हा पाठवा.",
    retry: "पुन्हा पाठवून पाहा",
  },

  wizard: {
    identityNextHint: "पुढे जाण्यासाठी तुमचे पूर्ण नाव आणि 10 अक्षरी PAN भरा.",
    employmentConfirmHint: "तुमच्या आधीच्या उत्तरावरून — बदल झाला असेल तर दुसरा पर्याय निवडा.",
    tdsZeroWarning:
      "पगारी नोकरीत जवळपास नेहमीच कर आधी कापलेला असतो — तो तुमच्या फॉर्म 16 वर किंवा पगार स्लिपवर असतो. इथे 0 लिहिणे म्हणजे बहुधा स्वतःचा रिफंड सोडून देणे.",
  },

  timeline: {
    filed: "तुम्ही तुमचे रिटर्न पाठवले.",
    verified: "हे तुम्हीच आहात याची तुम्ही पुष्टी केली. रिटर्न इथूनच गणले जाते.",
    in_queue: "त्या आठवड्यात दाखल झालेल्या इतर सगळ्यांसोबत रांगेत.",
    under_review: "आत्ता कोणीतरी ते पाहत आहे.",
    determined: "ठरले — एवढे परत मिळणार.",
    sent_to_bank: "तुमच्या बँकेकडे पाठवले.",
    credited: "तुमच्या खात्यात.",
  },

  refund: {
    heading: (amount: string) => `${amount} तुमच्याकडे येत आहेत`,
    filedDaysAgo: (days: number) => `तुम्ही ${days} दिवसांपूर्वी फाइल केले`,

    holdsHeading: (n: number) =>
      n === 1 ? "एका गोष्टीची वाट आहे" : `${n} गोष्टींची वाट आहे`,
    clearsInDays: (days: number) =>
      days === 1 ? "ते झाले की साधारण एक दिवस" : `ते झाले की साधारण ${days} दिवस`,

    cohortWindow: (from: number, to: number) =>
      `तुमच्याच आठवड्यात दाखल झालेली रिटर्न आत्ता तपासली जात आहेत. ${from} ते ${to} दिवस धरा.`,

    states: {
      not_filed: "अजून पाठवलेले नाही",
      filed_unverified: "पाठवले, तुमच्या पुष्टीची वाट",
      verified: "तुम्ही पुष्टी केली",
      in_queue: "रांगेत",
      under_review: "कोणीतरी पाहत आहे",
      determined: "ठरले",
      sent_to_bank: "तुमच्या बँकेकडे पाठवले",
      credited: "तुमच्या खात्यात जमा",
      failed: "तुमच्या खात्यापर्यंत पोहोचू शकले नाही",
    },

    bankFailedHeading: "तुम्ही निवडलेल्या खात्यात पैसे जाऊ शकत नाहीत.",
    bankMergedInto: (bank: string) => `ती शाखा आता ${bank} चा भाग आहे`,
    useThisAccount: "त्याऐवजी इथे पाठवा",
    resolvedHold: "मिटले — आता हे काहीही अडवत नाही.",
    stampFiled: "दाखल",
  },

  notices: {
    heading: "विभागाकडून आलेली पत्रे",
    none: "काहीही परत आलेले नाही. हेच चांगले लक्षण.",
    respondBy: (date: string) => `${date} पर्यंत उत्तर द्या`,
    ifYouDoNothing: "तुम्ही काहीच केले नाही तर",
    basedOn: "हे कशाच्या आधारावर आहे",
    theCatch: "त्यांचे काय चुकले आहे",
    agree: "हे बरोबर आहे",
    disagree: "हे चुकीचे आहे",
    dinLabel: "या पत्रावरचा संदर्भ क्रमांक",
    dinExplain:
      "विभागाच्या प्रत्येक पत्रावर हा क्रमांक असावाच लागतो. तो नसेल तर ते पत्र अधिकृतपणे अस्तित्वातच नाही.",
  },

  dashboard: {
    serverFilings: "सर्व्हरवर नोंदलेले",
    serverFilingsEmpty:
      "लाइव्ह सर्व्हरवर या PAN चे अजून कोणतेही फाइलिंग नाही — वरची पोच नमुना कथेचा भाग आहे. या ॲपमधून फाइल करा म्हणजे खरी पावती इथे येईल.",
    greetingLabel: "तुमचे साइन-इन वाक्य",
    greetingWhy: "खाते तयार करताना तुम्ही हे वाक्य निवडले होते. जे पान हे दाखवू शकत नाही, ते आम्ही नाही.",
    userDashboard: "यूझर डॅशबोर्ड",
    taxPrefills: "कर माहिती (AIS/26AS)",
    pendingActions: "प्रलंबित कामे",
    returnSummary: "रिटर्न सारांश AY 2026-27",
    reviewPrefill: "कर माहिती टॅबमध्ये आधीच भरलेले तपशील तपासा, मग फाइल करण्याची पुष्टी करा.",
    filingSubmitted: "तुमचे ई-फाइलिंग रिटर्न जमा झाले आहे. टाइमलाइनवर प्रगती पाहा.",
    verifiedBanks: "रिफंडसाठी पडताळलेली बँक खाती",
    primaryRefundAccount: "मुख्य रिफंड खाते",
    backupAccount: "पर्यायी खाते",
    ifscMeaning: "IFSC हा रिफंड पाठवण्यासाठी वापरला जाणारा 11 अक्षरी बँक कोड आहे.",
    refundTimeline: "रिफंड टाइमलाइन",
    filingSubmittedTimeline: "रिटर्न जमा झाले",
    identityVerifiedTimeline: "ओळख पडताळली",
    assessmentProcessingTimeline: "आकारणी प्रक्रियेत",
    refundApprovedTimeline: "रिफंड मंजूर",
    refundCreditedTimeline: "रिफंड जमा झाला",
    holdActive: "अडथळा सुरू: ॲक्शन टॅबमधली कामे पूर्ण करा",
    successCheckApp: "झाले! तुमचे बँकिंग ॲप तपासा.",
    outstandingNotices: "प्रलंबित अनुपालन नोटिसा",
    noPendingActions: "कोणतेही काम प्रलंबित नाही",
    accountCompliant: "तुमचे खाते पूर्णपणे नियमांत आहे — कोणतीही प्रलंबित नोटीस किंवा कर मागणी नाही.",
    actionableHolds: "कारवाई करण्याजोगे आकारणी अडथळे",
    uploadRent: "भाडे करार / पावत्या अपलोड करा",
    landlordName: "घरमालकाचे नाव",
    landlordPan: "घरमालकाचा PAN (10 अंक)",
    selectPdfJpg: "PDF/JPG निवडा",
    submitReceipt: "पावती जमा करा",
    responsePosition: "उत्तराची भूमिका",
    agreeDept: "मी विभागाशी सहमत आहे",
    disagreeProof: "मी असहमत आहे (पुरावा जमा करा)",
    responseDraft: "उत्तराचे निवेदन (मसुदा)",
    dictateStatement: "बोलून नोंदवा",
    sendResponse: "उत्तर पाठवा",
    filingStatusLabel: "फाइलिंग स्थिती",
    bankValidated: "पडताळले",
    bankUnderProcess: "प्रक्रियेत",
    bankFailed: "अयशस्वी",
    staleIfscHold: "हा बँक कोड आता कुठेही जात नाही.",
    switchToNewIfsc: (ifsc: string) => `नव्या कोडवर बदला (${ifsc})`,
    personalized: {
      eyebrow: "तुमचा डॅशबोर्ड",
      headingFiled: "तुमचे रिटर्न जमा झाले आहे — त्याची स्थिती अशी आहे",
      heading: {
        file_return: "चला, तुमचे रिटर्न तयार करू",
        check_refund: "चला, काय परत येऊ शकते ते पाहू",
        understand_notice: "चला, लक्ष द्यायच्या गोष्टी हाताळू",
        correct_prefill: "चला, नोंदवलेली माहिती तपासू",
      },
      guidedBody: "प्रत्येक आकड्याची पुष्टी करण्याआधी आम्ही तो समजावून सांगू.",
      quickBody: "आम्ही मार्ग छोटा ठेवू आणि पुढचा निर्णय आधी दाखवू.",
      unfiledBody: "आधी, तुमच्याबद्दल आधीच नोंदवलेल्या माहितीची पुष्टी करा.",
      filedBody: "तुम्ही ज्या कामासाठी आलात, त्याला साजेसा भाग आम्ही आधी उघडला आहे.",
      primaryAction: {
        facts: "माझी नोंदवलेली माहिती पाहा",
        overview: "माझा रिफंड ट्रॅकर दाखवा",
        statement: "नोंदवलेली माहिती तपासा",
        actions: "लक्ष द्यायच्या गोष्टी दाखवा",
      },
      focusLabel: "आम्ही यावर लक्ष ठेवू",
      profileLabels: {
        work: "काम",
        income: "अंदाजे एकूण उत्पन्न",
        history: "फाइलिंगचा अनुभव",
      },
    },
  },

  onboarding: {
    eyebrow: "सुरुवात करण्याआधी",
    title: "हे तुमच्यासाठी जुळवून घेऊ.",
    intro:
      "पाच छोटी उत्तरे आम्हाला योग्य भाषा, गती आणि कराचे प्रश्न निवडायला मदत करतात. ती नंतर बदलता येतात.",
    languageQuestion: "आपण कोणत्या भाषेत बोलू?",
    languageHelp: "हाच पहिला प्रश्न. भाषा तुम्ही कधीही बदलू शकता.",
    intentQuestion: "आज तुम्ही इथे कशासाठी आलात?",
    intentHelp: "तेच काम आम्ही सगळ्यात आधी ठेवू.",
    intentOptions: {
      file_return: {
        label: "या वर्षीचे रिटर्न फाइल करायचे आहे",
        detail: "तुमच्याबद्दल जे आधीच माहीत आहे तिथून सुरुवात करू.",
      },
      check_refund: {
        label: "मला पैसे परत मिळणार आहेत का ते पाहायचे आहे",
        detail: "काय नोंदवले गेले, किती भरले गेले आणि काय परत येऊ शकते ते पाहा.",
      },
      understand_notice: {
        label: "एखादे पत्र किंवा नोटीस समजून घ्यायची आहे",
        detail: "त्यात काय लिहिले आहे, काय पणाला लागले आहे आणि पुढे काय करायचे ते पाहा.",
      },
      correct_prefill: {
        label: "चुकीचे वाटणारे काहीतरी दुरुस्त करायचे आहे",
        detail: "आकडा कुठून आला ते शोधा आणि काय बदलायला हवे ते नोंदवा.",
      },
    },
    intentCta: {
      file_return: "माझे रिटर्न सुरू करा",
      check_refund: "माझे किती येणे आहे ते पाहा",
      understand_notice: "काय करायचे ते दाखवा",
      correct_prefill: "नोंदवलेले तपासा",
    },
    situationQuestion: "तुमच्या कराच्या परिस्थितीबद्दल सांगा.",
    situationHelp: "इथे दोन छोटी उत्तरे पुरेशी आहेत.",
    professionLabel: "तुमच्या कामाला यातले कोणते वर्णन सगळ्यात जवळचे?",
    professionOptions: {
      salaried: "पगारी नोकरी",
      self_employed: "फ्रीलान्स किंवा स्वयंरोजगार",
      business_owner: "व्यवसाय मालक",
      student: "विद्यार्थी",
      retired: "निवृत्त",
      investor: "गुंतवणूकदार",
      other: "आणखी काही",
    },
    filingHistoryLabel: "तुम्ही याआधी आयकर रिटर्न फाइल केले आहे का?",
    filingHistoryOptions: {
      never: "नाही, ही पहिलीच वेळ",
      once: "एक-दोन वेळा",
      every_year: "दरवर्षी",
    },
    incomeQuestion: "सगळ्या स्रोतांतून मिळून तुमचे एकूण उत्पन्न साधारण किती होते?",
    incomeHelp: "अंदाज पुरेसा आहे. नेमका आकडा आत्ता नको.",
    incomeOptions: {
      none: "उत्पन्न नाही",
      under_4: "₹4 लाखांपेक्षा कमी",
      "4_to_8": "₹4 ते ₹8 लाख",
      "8_to_12": "₹8 ते ₹12 लाख",
      "12_to_25": "₹12 ते ₹25 लाख",
      over_25: "₹25 लाखांपेक्षा जास्त",
    },
    modeQuestion: "तुम्हाला किती तपशील पाहायचा आहे?",
    modeHelp: "हे फक्त सुरुवात ठरवते. तुम्ही कधीही बदलू शकता.",
    modeOptions: {
      simple: {
        label: "माझ्यासाठी करून द्या",
        detail: "साधे शब्द, एका वेळी एक पाऊल. बाकीचे आम्ही सांभाळू.",
      },
      full: {
        label: "मला सगळे दाखवा",
        detail: "प्रत्येक आकडा, प्रत्येक नियम, प्रत्येक हिशेब — सुरुवातीपासूनच.",
      },
    },
    focusQuestion: "यातल्या कोणत्या गोष्टींकडे आम्ही लक्ष द्यावे?",
    focusHelp: "तुम्हाला लागू होणारे सगळे निवडा. खात्री नसेल तर 'नक्की माहीत नाही' निवडायलाही हरकत नाही.",
    focusOptions: {
      salary: "पगार किंवा पेन्शन",
      freelance: "फ्रीलान्स काम",
      business: "व्यवसायाचे उत्पन्न",
      rent: "दिलेले किंवा मिळालेले भाडे",
      interest: "बँकेचे व्याज",
      investments: "शेअर्स किंवा गुंतवणूक",
      deductions: "बचत, विमा, गृहकर्ज किंवा NPS",
      not_sure: "अजून नक्की माहीत नाही",
    },
    chooseOne: "एक निवडा",
    chooseAtLeastOne: "किमान एक निवडा",
    questionsLabel: "झटपट तयारी",
    questionsProgress: (current: number, total: number) => `${total} पैकी ${current}`,
    savedLocally: "या प्रोटोटाइपमध्ये तुमची उत्तरे याच ब्राउझरमध्ये साठवली जातात.",
    readyTitle: "हे तुमच्यासाठी खास बनवायला एवढे पुरेसे आहे.",
    readyBody:
      "या उत्तरांवरून आम्ही ठरवू की तुम्हाला आधी काय दाखवायचे. प्रणालीची अंतिम निवड मात्र तुम्ही पक्क्या केलेल्या नोंदी आणि दाव्यांवरच होते.",
    guidedLabel: "आम्ही कसे समजावू",
    guidedValue: "वाटेत येणारे शब्द आम्ही समजावत जाऊ.",
    quickValue: "आम्ही मार्ग छोटा ठेवू.",
    regimeLabel: "प्रणालींबाबत आमची पद्धत",
    claimsRegimeValue: "प्रणाली निवडण्याआधी आम्ही तुमचे दावे तपासू.",
    compareRegimeValue: "नोंदी पक्क्या झाल्यावर आम्ही दोन्ही प्रणालींची तुलना करू.",
    focusLabel: "आधी कशावर लक्ष असेल",
    startPath: "माझ्या मार्गाने सुरुवात करा",
    changeAnswers: "उत्तरे बदला",
    tailoredBadge: "तुमचा सुरुवातीचा मार्ग",
    tailoredGuided: "समजावत पुढे जाऊ",
    tailoredQuick: "छोटा मार्ग",
    tailoredRegimeClaims: "प्रणालीआधी दाव्यांची तपासणी",
    tailoredRegimeCompare: "नोंदींनंतर दोन्ही प्रणालींची तुलना",
    tailoredIntent: (intent: string) => `आधी: ${intent}`,
  },

  checklist: {
    divider: "फाइल करण्याआधी",
    itemBefore: "“",
    itemAfter: "” ची पुष्टी करा — खात्री नसेल तर कार्ड उघडा.",
    stdRow: "आम्ही तुमच्या वतीने लावलेल्या प्रमाणित वजावटीची पुष्टी करा.",
    noteLocked: "वरच्या प्रत्येक ओळीवर खूण करा, मगच हे बटण उघडेल.",
    noteReady: "वरचे सगळे पक्के झाले आहे. तयार असाल तेव्हा फाइल करा.",
    fileBtn: "हे रिटर्न फाइल करा",
    lockedBtn: (n: number) =>
      n === 1 ? "आधी आणखी 1 ओळीवर खूण करा" : `आधी आणखी ${n} ओळींवर खूण करा`,
  },

  factCard: {
    cardNo: (n: number, date: string) => `कार्ड ${String(n).padStart(2, "0")} · नोंद ${date}`,
    whatThisMeans: "याचा अर्थ काय",
    readFirst: "आधी “याचा अर्थ काय” उघडा — मग पुष्टी करा.",
    readyToConfirm: "वाचले? खाली पुष्टी करा.",
  },

  signoff: {
    title: "स्वाक्षरी",
    declaration:
      "मी वरचे आकडे वाचले असून ते मूळ कागदपत्रांशी ताडून पाहिले आहेत. ते बरोबर आणि पूर्ण आहेत.",
    action: "या आकड्यांवर स्वाक्षरी करा",
    signed: "स्वाक्षरी झाली — वरचा प्रत्येक आकडा पक्का आहे.",
    hint: "एकच घोषणा वरच्या सगळ्यांना लागू होते. एखाद्या आकड्यावर आक्षेप असेल तर स्वाक्षरीआधी “नाही, हे चुकीचे आहे” निवडा.",
  },

  channels: {
    sectionLabel: "वर्ष एका नजरेत",
    earned: "तुम्ही कमावले",
    toTax: "करात गेले",
    overpaid: "तुम्ही जास्त भरले",
    stillToPay: "अजून भरायचे",
    stayed: "तुमच्याकडून कधी गेलेच नाही",
    kept: "जो कर देय होता",
    back: "तुमच्याकडे परत येत आहे",
    yoursInEnd: "शेवटी तुमचे",
    collected: "आधीच वसूल झाले",
    ofYear: "वर्षभराच्या पैशांपैकी",
    sliceNote: "दिसण्याइतका बारीक नसलेला भाग खऱ्या वाट्यापेक्षा किंचित रुंद काढला आहे — शेजारचे आकडे मात्र अचूक आहेत.",
    whereItWent: "तुम्ही कमावलेला प्रत्येक रुपया कुठे गेला",
    earnedDesc: "पगार, व्याज आणि बाकी सगळे — तुम्हाला पैसे देणाऱ्यांनी नोंदवल्याप्रमाणे.",
    toTaxDesc: "तुमच्या हक्काच्या प्रत्येक वजावटीनंतर तुम्हाला प्रत्यक्ष लागलेला कर.",
    backDesc: "तुमच्या पगारातून घेतले गेले पण कधी देयच नव्हते. हे तुम्हाला परत मिळते.",
    dueDesc: "आधीच वसूल झाल्यापेक्षा जास्तीचे देणे. हे अजून भरायचे आहे.",
    howToRead:
      "हे असे वाचा: इथले काहीही आम्ही रचलेले नाही. प्रत्येक आकडा कोणीतरी दाखल केलेल्या कागदपत्रातून आला आहे किंवा तुम्ही स्वतः भरला आहे. पेन्सिल टिपा प्रत्येक आकड्याचा खरा अर्थ सांगतात — साध्या शब्दांत, कराच्या भाषेत नाही.",
    meterCap: "देय कर विरुद्ध आधीच वसूल झालेला",
  },

  agent: {
    title: "वापसी सहायक",
    open: "सहायक उघडा",
    close: "बंद करा",
    placeholder: "तपासायला, समजावायला किंवा फाइल करायला सांगा…",
    send: "पाठवा",
    thinking: "काम चालू आहे…",
    toolRan: "केले:",
    confirmTitle: "फाइल करायला तयार — आकडे तपासा",
    confirmBody: "तुमच्या पुष्टीशिवाय काहीही फाइल होत नाही. हे जमा होईल:",
    confirmTotalTax: "एकूण कर",
    confirmRefund: "तुम्हाला येणे असलेला रिफंड",
    confirmDue: "देय रक्कम",
    confirmTaxable: "करपात्र उत्पन्न",
    confirmButton: "पुष्टी करून फाइल करा",
    cancelButton: "रद्द करा",
    filingDismissed: "ठीक आहे — काहीही फाइल झाले नाही.",
    error: "सहायकापर्यंत पोहोचता आले नाही. तुमच्या रिटर्नला धक्काही लागलेला नाही — पुन्हा प्रयत्न करा.",
    intro:
      "मी तुमचे रिटर्न तपासू शकतो, कोणताही आकडा समजावू शकतो, जर-तरचे हिशेब करू शकतो आणि फाइलिंगची तयारी करू शकतो. फाइल होण्याआधी पुष्टी नेहमी तुम्हीच करता.",
    sample: "80C मध्ये ₹1,50,000 गुंतवले तर माझे किती वाचतील?",
  },

  footer: {
    prototype: "स्वतंत्र संकल्पना प्रोटोटाइप.",
    notAffiliated:
      "आयकर विभाग, CBDT किंवा भारत सरकार यांच्याशी संलग्न नाही, त्यांची मान्यता नाही, त्यांच्याशी संबंध नाही. इथले प्रत्येक नाव, PAN, रक्कम आणि कागदपत्र बनवलेले आहे. कोणत्याही खऱ्या सरकारी यंत्रणेशी संपर्क होत नाही.",
    honestyLink: "काय खरे आणि काय मॉक ते नेमके पाहा",
  },
};

export const mrMock: Record<string, string> = {
  "Your pay last year": "गेल्या वर्षीचा तुमचा पगार",
  "Interest your savings account earned": "बचत खात्याला मिळालेले व्याज",
  "Interest your accounts earned": "तुमच्या खात्यांना मिळालेले व्याज",
  "Your primary contract income": "तुमचे मुख्य कॉन्ट्रॅक्ट उत्पन्न",
  "Savings interest": "बचत खात्याचे व्याज",
  "Tax withheld (TDS)": "आधी कापलेला कर (TDS)",
  "Provident Fund / ELSS Mutual Funds": "भविष्य निर्वाह निधी / ELSS म्युच्युअल फंड",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "तिच्या पगारातून ₹8,400 कापले गेले. तिला काहीही देणे नाही. तिने अजून फाइल केलेले नाही, आणि शाळेची फी भरायची आहे.",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "दोन नोटिसा. एक म्हणते की त्याने ₹1,10,000 चा शेअर नफा लपवला — प्रत्यक्षात त्याला ₹4,200 चा तोटा झाला. दुसरीला, त्याने कधी ऐकलेही नसलेल्या 2019 च्या बिलापोटी त्याच्या रिफंडचा काही भाग ठेवायचा आहे.",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 दिवसांपूर्वी फाइल केले. पोर्टलवर 'प्रक्रिया चालू आहे' याशिवाय काहीही दिसत नाही. प्रत्यक्षात दोन वेगळ्या गोष्टी तिचे ₹34,800 अडवून आहेत.",
  "Tax already taken out of your pay": "पगारातून आधीच कापलेला कर (TDS)",
  "Dividend your shares paid out": "तुमच्या शेअर्सनी दिलेला लाभांश",
  "Money from selling shares": "शेअर विकून आलेले पैसे",
  "Tax the bank withheld on your interest": "व्याजावर बँकेने कापलेला कर (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "भविष्य निर्वाह निधी (PF), विमा आणि मुलीची ट्यूशन फी",
  "Provident fund and your insurance premium": "भविष्य निर्वाह निधी (PF) आणि तुमचा विमा हप्ता",
  "Health cover for the family": "कुटुंबासाठी आरोग्य विमा",
  "Rent you paid, with no house-rent allowance from your employer":
    "तुम्ही दिलेले भाडे, घरभाडे भत्ता न मिळता",
  "One figure doesn't match what your broker reported.":
    "एक आकडा तुमच्या ब्रोकरने नोंदवलेल्या आकड्याशी जुळत नाही.",
  "₹18,740 of this is being held against an old bill.":
    "यातले ₹18,740 एका जुन्या बिलापोटी रोखले जात आहेत.",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "विभागाला वाटते की तुम्ही ₹1,10,000 चा शेअर नफा वगळला आहे.",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019 च्या बिलाची भरपाई करण्यासाठी विभागाला तुमच्या रिफंडमधले ₹18,740 ठेवायचे आहेत.",
  "Waiting on one thing: a receipt for your rent claim.":
    "एका गोष्टीची वाट: तुमच्या भाडे दाव्याची पावती.",
  "The account you chose can't receive the money.":
    "तुम्ही निवडलेल्या खात्यात पैसे जाऊ शकत नाहीत.",
  "Held: your rent claim needs a receipt.": "रोखले: तुमच्या भाडे दाव्याला पावती हवी आहे.",
  "Your bank account was checked and failed.":
    "तुमचे बँक खाते तपासले गेले आणि ते अयशस्वी ठरले.",
  "The department is asking you to look again at your rent claim.":
    "विभाग तुम्हाला तुमचा भाडे दावा पुन्हा पाहायला सांगत आहे.",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities ने शेअर विक्रीतून ₹1,10,000 नोंदवले. तुमचे रिटर्न ते दाखवत नाही. ते मिटेपर्यंत रिफंड जिथे आहे तिथेच राहतो.",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 ची एक मागणी या वर्षीच्या रिफंडमधून वळती केली जात आहे. तुम्ही तिला आक्षेप घेऊ शकता, आणि 3 तारखेआधी ती वाचायला हवी.",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 सप्टेंबरपर्यंत तुम्ही काही म्हटले नाही, तर ₹1,10,000 तुमच्या उत्पन्नात जोडले जातात आणि तुमच्या रिफंडमधून सुमारे ₹34,300 जातात.",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 सप्टेंबरपर्यंत तुम्ही काही म्हटले नाही, तर तुमच्या रिफंडमधून ₹18,740 काढले जातात आणि प्रकरण बंद मानले जाते.",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "तुम्ही ₹1,10,000 चे शेअर विकले आणि त्यावरचा नफा जाहीर केला नाही.",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 ही मी विकलेल्या सगळ्याची एकूण किंमत आहे, माझा नफा नाही. त्या व्यवहारांत मला ₹4,200 चा तोटा झाला. माझ्या ब्रोकरच्या वर्षभराच्या विवरणात खरेदी किमती दिसतात.",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 वर्षाचे तुमचे अजूनही ₹18,740 देणे आहे, म्हणून ते या वर्षीच्या रिफंडमधून घेतले जाईल.",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "तुम्ही ₹60,000 भाड्याचा दावा केला. ते दाखवायला काहीही जोडलेले नव्हते. पावती किंवा घरमालकाचे नाव आणि PAN जोडा, म्हणजे हे पुढे सरकेल.",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank गेल्या वर्षी Deccan Union Bank चा भाग बनली. खाते अजूनही आहे — पण त्यात पैसे पाठवणारा कोड आता नाही.",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "तुम्ही 80GG खाली ₹60,000 भाड्याचा दावा केला, पण त्याच्या पुष्ट्यर्थ काहीही जोडलेले नव्हते.",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "मी हे भाडे खरेच दिले आहे. माझ्याकडे घरमालकाच्या मासिक पावत्या आहेत आणि मी त्यांचे नाव व PAN देऊ शकतो.",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "हा आरोप नाही आणि अजून कोणताही दंड नाही. पण तुम्ही दाव्याला पुरावा देईपर्यंत किंवा तो मागे घेईपर्यंत तुमचे ₹34,800 जिथे आहेत तिथेच राहतात.",
  "Look at what they reported": "त्यांनी काय नोंदवले ते पाहा",
  "Read the 2019 demand": "2019 ची मागणी वाचा",
  "Add the receipt": "पावती जोडा",
  "Point it at the right account": "योग्य खात्याकडे वळवा",
  "Supervisor, garment unit": "पर्यवेक्षक, गारमेंट युनिट",
  "Operations manager; trades equity on the side": "ऑपरेशन्स मॅनेजर; जोडीला शेअर व्यवहार",
  "Junior architect; first time filing": "ज्युनियर आर्किटेक्ट; पहिल्यांदाच फाइल करत आहे",
  "Independent Consultant": "स्वतंत्र सल्लागार",
  "Primary School Teacher": "प्राथमिक शाळेतील शिक्षिका",
  "Retired bank clerk": "निवृत्त बँक कारकून",
  "Retired": "निवृत्त",
  "Teacher": "शिक्षक",
  "You sent your return in.": "तुम्ही तुमचे रिटर्न पाठवले.",
  "You confirmed it was you. The return counts from here.":
    "हे तुम्हीच आहात याची तुम्ही पुष्टी केली. रिटर्न इथूनच गणले जाते.",
  "In the queue with everything else filed that week.":
    "त्या आठवड्यात दाखल झालेल्या इतर सगळ्यांसोबत रांगेत.",
  "Someone is looking at one figure.": "कोणीतरी एका आकड्याकडे पाहत आहे.",
  "A share-sale row your broker filed doesn't line up with your return.":
    "तुमच्या ब्रोकरने दाखल केलेली शेअर-विक्रीची एक नोंद तुमच्या रिटर्नशी जुळत नाही.",
  "OTP verified, 4 minutes after filing.": "OTP पडताळला, फाइल केल्यानंतर 4 मिनिटांनी.",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG खाली ₹60,000 चा दावा, पुष्ट्यर्थ काहीही जोडलेले नाही.",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank ने तपासणी परत पाठवली: IFSC GODG0004417 आता कुठेही जात नाही.",
  "OTP Verification Complete": "OTP पडताळणी पूर्ण",
  "Outstanding Compliance Notices": "प्रलंबित अनुपालन नोटिसा",
  "Draft Legal Response": "कायदेशीर उत्तराचा मसुदा",
  "No Pending Actions": "कोणतेही काम प्रलंबित नाही",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "तुमचे खाते पूर्णपणे नियमांत आहे — कोणतीही प्रलंबित नोटीस किंवा कर मागणी नाही.",
  "Actionable Assessment Holds": "कारवाई करण्याजोगे आकारणी अडथळे",
  "Upload Rent Agreement / Receipts": "भाडे करार / पावत्या अपलोड करा",
  "Landlord Name": "घरमालकाचे नाव",
  "Landlord PAN (10 Digits)": "घरमालकाचा PAN (10 अंक)",
  "Select PDF/JPG": "PDF/JPG निवडा",
  "Submit Receipt": "पावती जमा करा",
  "Response Position": "उत्तराची भूमिका",
  "I Agree with Department": "मी विभागाशी सहमत आहे",
  "I Disagree (Submit Proof)": "मी असहमत आहे (पुरावा जमा करा)",
  "Response Statement (Draft)": "उत्तराचे निवेदन (मसुदा)",
  "Dictate Statement": "बोलून नोंदवा",
  "Listening...": "ऐकत आहे...",
  "Explain your disagreement or agreement...": "तुमची सहमती किंवा असहमती स्पष्ट करा...",
  "Send Response": "उत्तर पाठवा",
  "Cancel": "रद्द करा",
  "Validate Bank Code": "बँक कोड पडताळा",
  "Update Bank IFSC": "बँक IFSC अपडेट करा",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "बँक तपशील पडताळण्यासाठी 11 अंकी बँक कोड (IFSC) तपासा.",
  "IFSC Code": "IFSC कोड",
};

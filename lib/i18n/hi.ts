/**
 * हिन्दी. Typed against the English source, so this file cannot fall behind it.
 *
 * These translations are mine, not a native speaker's. That is a real
 * limitation and it is disclosed on /honesty rather than hidden: a government
 * service shipping machine-adjacent Hindi to someone who reads only Hindi is
 * its own kind of exclusion. For a prototype the point being proved is that
 * the *whole interface* speaks the language — not a chatbot bolted onto an
 * English form.
 *
 * Digits stay Latin. Devanagari numerals are correct but almost nobody in
 * India reads money in them, and money is the one thing that must be
 * instantly legible.
 */

import type { Dict } from "./en";

export const hi: Dict = {
  langName: "Hindi",
  langNativeName: "हिन्दी",
  dir: "ltr",

  common: {
    continue: "आगे बढ़ें",
    back: "पीछे",
    yesThatsRight: "हाँ, यह सही है",
    noThisIsWrong: "नहीं, यह ग़लत है",
    iDontUnderstand: "मुझे यह समझ नहीं आया",
    close: "बंद करें",
    saveAndGoOn: "सहेजें और आगे बढ़ें",
    loading: "एक पल",
    logOut: "लॉग आउट",
    undo: "वापस लें",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "जाँच और फाइलिंग का आसान तरीका",
    independent: "स्वतंत्र प्रोटोटाइप",
    taxYear: "कर वर्ष 2026-27",
    language: "भाषा",
    light: "लाइट",
    dark: "डार्क",
    sandbox: "रिव्यू टूल",
  },

  validate: {
    panTooShort: (n: number) => `अभी ${n} अक्षर हैं। PAN में 10 होते हैं।`,
    panShape:
      "PAN में पहले पाँच अक्षर, फिर चार अंक, फिर एक अक्षर होता है — जैसे DEMPS4417K।",
    panSandboxHint:
      "आप जो लिखते हैं वह आपके ब्राउज़र से बाहर नहीं जाता। इस प्रोटोटाइप में हर PAN DEMP से शुरू होता है, इसलिए कोई असली PAN ग़लती से नहीं खोजा जा सकता।",
    ifscTooShort: (n: number) => `अभी ${n} अक्षर हैं। बैंक कोड में 11 होते हैं।`,
    ifscShape:
      "बैंक कोड में पहले चार अक्षर, फिर एक शून्य, फिर छह और — जैसे DECU0834471।",
  },

  landing: {
    question: "क्या आयकर विभाग के पास आपका पैसा रुका हुआ है?",
    subtext:
      "यहाँ आने वाले ज़्यादातर लोगों को कुछ देना नहीं होता — उन्हें मिलना होता है। अपना PAN डालें, हम बता देंगे कि क्या रुका है।",
    panLabel: "आपका PAN",
    panHelp: "दस अक्षर, आपके PAN कार्ड से",
    panPlaceholder: "जैसे, DEMPS4417K",
    check: "देखें मेरा कितना बाकी है",
    orTryAs: "या तीन लोगों में से किसी एक की तरह देखें",
    honestyLink: "यहाँ क्या असली है और क्या बनाया हुआ",
    architectureLink: "तकनीकी बनावट",
    badge: "सरल रिटर्न, प्रमाणित",
    brandTitle: "refund engine.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "फाइल करना",
      blurb:
        "उसकी तनख़्वाह से ₹8,400 काट लिए गए। उसे कुछ देना नहीं है, उसने फाइल नहीं किया, और स्कूल की फीस देनी है।",
      action: "जो पहले से पता है उसे पक्का करें",
    },
    rakesh: {
      phase: "एक चिट्ठी आई",
      blurb:
        "चिट्ठी कहती है कि उसने शेयर से हुआ ₹1,10,000 का मुनाफ़ा छिपाया। उसका पैसा एक पुरानी मांग के बदले रोक लिया गया है, जिसकी उसे कभी ख़बर नहीं दी गई।",
      action: "पढ़ें और असहमत हों",
    },
    priya: {
      phase: "इंतज़ार",
      blurb:
        "71 दिन पहले फाइल किया। अब भी लिखा है कि जाँच चल रही है। असल में दो चीज़ें रोक रही हैं, और किसी ने नहीं बताया कौन सी।",
      action: "देखें क्या रोक रहा है",
    },
    custom: {
      phase: "अपना बनाएँ",
      blurbTitle: "बनाया हुआ कोई",
      blurb:
        "शुरू से एक व्यक्ति बनाएँ — उसकी कमाई, उसके दावे, उससे कटा टैक्स — और देखें कि हिसाब अपने आप कैसे बैठता है।",
      action: "कोई बना लें",
    },
  },

  login: {
    otpSentTo: (mobile: string) => `हमने ${mobile} पर एक कोड भेजा है`,
    otpLabel: "छह अंकों का कोड",
    weWillWait:
      "जल्दी की कोई बात नहीं। कोड का इंतज़ार करते हुए आपका भरा हुआ कुछ भी नहीं जाएगा।",
    resend: "दोबारा भेजें",
    resendIn: (seconds: number) => `${seconds} सेकंड बाद दोबारा माँग सकते हैं`,
    mockNotice:
      "यह एक प्रोटोटाइप है, इसलिए कोड स्क्रीन पर ही दिखाया गया है। कोई असली संदेश नहीं भेजा जाता।",
    portalHeading: "ई-फाइलिंग सत्यापन",
    incorrectCode: "यह कोड मेल नहीं खाता। छह अंक फिर जाँचें और दोबारा कोशिश करें।",
    prototypeBox: "प्रोटोटाइप OTP सत्यापन",
    mockCodeLabel: "मॉक कोड",
    autoFill: "मेरे लिए भर दें",
    verifyEnter: "सत्यापित करें और अंदर जाएँ",
    draftRestored: (time: string) => `आपका पूर्व-सहेजा ड्राफ़्ट ${time} बजे का लौटा दिया गया। कुछ नहीं गया।`,
  },

  file: {
    heading: (amount: string) => `आपके ${amount} विभाग के पास पड़े हैं`,
    subheading:
      "नीचे लिखी लगभग हर बात आपके बारे में पहले ही बता दी गई है। इसे पढ़ें, और कुछ ग़लत हो तो हमें बताएँ।",

    checkThis: "इसे जाँच लें — भरना नहीं है",
    factMeaning: "यह पहले से बताई गई बात है, टैक्स का नियम नहीं। इसी से नीचे का हिसाब बनेगा।",
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ने ${date} को विभाग को यह बताया`,
    underIdentifier: (identifier: string) => `पंजीकरण ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `यह ग़लत है तो इसे मूल जगह पर सिर्फ़ ${reporter} ही बदल सकते हैं। हम बता देंगे कि उनसे ठीक क्या माँगना है।`,

    whatYouEarned: "आपने कितना कमाया",
    whatWasDeducted: "कर पहले ही कितना कटा",
    whereMoneyGoes: "पैसा कहाँ जाएगा",
    whoYouAre: "आप कौन हैं",

    disputeHeading: "इसमें क्या लिखा होना चाहिए?",
    disputeAmountLabel: "सही रकम",
    disputeReasonLabel: "यह ग़लत क्यों है",
    disputeSave: "इसे ग़लत बताएँ",
    selfReported: "आप",
    returnLabel: "आपका रिटर्न",

    outcomeOwesNothing: "आपको कुछ नहीं देना है।",
    outcomeRefund: (amount: string) => `${amount} आपको वापस मिलेंगे।`,
    outcomeOwes: (amount: string) => `${amount} देना बाकी है।`,
    confirmAndFile: "इसे भेज दें",

    verifyHeading: "बस एक कदम बाकी है, वरना यह गिना नहीं जाएगा।",
    verifyBody:
      "जब तक आप पुष्टि नहीं करते कि यह आप ही हैं, आपका रिटर्न दाखिल नहीं माना जाता — जैसे आपने भेजा ही नहीं। इसमें करीब बीस सेकंड लगते हैं।",
    verifyAction: "पुष्टि करें कि यह मैं हूँ",

    voicePrompt: "या बोलकर बता दें",
    voiceListening: "सुन रहे हैं",
    voiceUnsupported:
      "इस फ़ोन का ब्राउज़र अभी सुन नहीं सकता। आप लिखकर बता सकते हैं — कुछ नहीं जाएगा।",
    voiceSimulated:
      "यह ब्राउज़र सुन नहीं सकता, इसलिए यह एक उदाहरण है, आपकी आवाज़ नहीं।",
    voiceError: "यह सुनाई नहीं दिया। आप लिखकर बता सकते हैं — कुछ नहीं जाएगा।",
    dictate: "बोलकर बताएँ",
    disputePlaceholder: "यह आंकड़ा ग़लत क्यों है — लिखें या बोलें।",
    disputeDefaultReason: "बताया गया आंकड़ा ग़लत है",
  },

  flow: {
    facts: "आपका पैसा",
    deductions: "वो पैसा जो आप माँग सकते हैं",
    regime: "पुराना या नया",
    check: "जाँच लें",
    file: "भेज दें",
    stepOf: (n: number, total: number) => `कदम ${n}, कुल ${total}`,
    confirmedCount: (done: number, total: number) => `${total} में से ${done} पक्के`,
    allConfirmed: "सब ठीक-ठाक है।",
    undoOne: "यह सुधार वापस लें",
    correctedTo: (amount: string) => `आप कहते हैं यह ${amount} होना चाहिए`,
  },

  groups: {
    moneyIn: "आने वाला पैसा",
    taxPaid: "आपके लिए पहले ही कटा टैक्स",
    deductionsClaimed: "आपके दावे",
    fromWhere: "यह कहाँ से आया",
    addIncome: "आय जोड़ें",
  },

  deductions: {
    heading: "वो पैसा जो आप माँग सकते हैं",
    sub: "ये अपने आप नहीं होते। आपको हाँ कहनी पड़ती है — पर तभी, जब सच हो।",
    claimedHeading: "आपके रिटर्न में पहले से",
    worthUpTo: (amount: string) => `आपकी कर-योग्य आय में से ${amount} तक कम हो सकता है`,
    worthWhatYouPaid: "उतना ही जितना आपने असल में दिया — सही रकम भरें",
    askRentQ: "क्या आप रहने का किराया देते हैं?",
    askRentWhy:
      "अगर आप किराया देते हैं और आपके नियोक्ता से मकान किराया भत्ता नहीं मिलता, तो उसका कुछ हिस्सा आपकी कर-योग्य आय में से घट सकता है।",
    askHealthQ: "क्या आप परिवार का स्वास्थ्य बीमा ख़ुद चुकाते हैं?",
    askHealthWhy:
      "परिवार का बीमा रखने के लिए आप जो चुकाते हैं, वह आपकी कर-योग्य आय में से घट सकता है।",
    ask80cQ: "क्या आप भविष्य निधि, जीवन बीमा या स्कूल की फीस में पैसा लगाते हैं?",
    ask80cWhy:
      "ऐसी दीर्घकालिक बचत एक संयुक्त सीमा में गिनी जाती है, और जितना आप डालते हैं उतना कर-योग्य आय में से घटता है।",
    claimIt: "हाँ — यह माँगूँगा/माँगूँगी",
    skipIt: "नहीं — छोड़ दें",
    amountLabel: "कितना",
    evidenceAttached: "साक्ष्य संलग्न",
    evidenceMissing: "साक्ष्य ग़ायब",
    newRegimeNoEffect:
      "नए रेजीम में इस दावे से कुछ नहीं बदलता — वहाँ यह मान्य नहीं है।",
    oldRegimeSaves: (amount: string) =>
      `पुराने रेजीम में यह आपका टैक्स करीब ${amount} घटा देता।`,
  },

  regime: {
    heading: "टैक्स दो तरह से लग सकता है। एक आपके लिए बेहतर है।",
    newRegimeName: "नया रेजीम",
    oldRegimeName: "पुराना रेजीम",
    refundLabel: "आपको वापस मिलेगा",
    dueLabel: "देना बाकी",
    recommendedBadge: "आपके लिए बेहतर",
    reasoningOldDeductions: (x: string, y: string) =>
      `आपके दावे कुल ${x} के हैं, इसलिए पुराना रेजीम आपको करीब ${y} बचा देता है।`,
    reasoningNewDefault: (y: string) =>
      `आपके दावे यहाँ ज़्यादा फ़र्क़ नहीं लाते, इसलिए नए रेजीम की कम दरें आपको करीब ${y} बचा देती हैं।`,
    acceptRecommendation: "मेरे लिए जो बेहतर है, वही चुनें",
    overrideNote: "आप कोई भी चुन सकते हैं। यहाँ कुछ छिपा या बंद नहीं है।",
  },

  check: {
    heading: "पूरा रिटर्न, एक ही पन्ने पर",
    sub: "हर आंकड़ा कहीं से आया है। कोई भी पंक्ति खोलें और ठीक-ठीक देखें कि कहाँ से।",
    grossIncome: "जो कुछ आया",
    standardDeduction: "मानक कटौती",
    deductionsLine: "आपके दावे",
    taxableIncome: "जिस पर टैक्स असल में लगता है",
    slabTax: "किसी राहत से पहले का टैक्स",
    rebate87A: "छूट जो इसका कुछ हिस्सा रद्द करती है",
    cess: "स्वास्थ्य और शिक्षा उपकर",
    totalTax: "साल का कुल टैक्स",
    tdsCredits: "पहले ही आपसे कट चुका",
    refundDue: "आपको वापस मिलेगा",
    balanceDue: "देना बाकी",
    openLine: "देखें यह कहाँ से आया",
    closeLine: "छिपाएँ",
    calculationStatus: "यह प्रोटोटाइप का हिसाब है — नियमों के स्रोत की अभी प्राथमिक स्रोत से जाँच बाकी है (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} नीचे दिए गए पक्के किए गए तथ्यों और टैक्स क्रेडिट से निकला है। इस प्रोटोटाइप में स्रोत रिकॉर्ड कृत्रिम हैं।`,
    showCalculationTrail: "स्रोत और हिसाब की कड़ी देखें",
    hideCalculationTrail: "स्रोत और हिसाब की कड़ी छिपाएँ",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} को रिपोर्ट किया गया`,
    sourceIdentifier: (identifier: string) => `रिकॉर्ड ${identifier}`,
    selfReportedSource: "इस रिटर्न में आपके द्वारा बताया गया",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: रिपोर्ट करने वाली संस्थाओं से मिली जानकारी का वार्षिक विवरण।"
        : statement === "26AS"
        ? "Form 26AS: आपके PAN पर रिपोर्ट किए गए टैक्स क्रेडिट का विवरण।"
        : "इस तथ्य से जुड़ा स्रोत रिकॉर्ड।",
    sectionMeaning: (section: string) =>
      `${section} कटौती का एक सेक्शन है। इसे तभी गिना जाता है जब यह रेजीम इसकी अनुमति दे।`,
    explainGross: "आपके द्वारा जाँचे-पक्के किए गए तथ्यों को जोड़कर।",
    explainStd: (amount: string) =>
      `वेतनभोगी हर व्यक्ति को ${amount} बिना माँगे ही घटने मिलते हैं।`,
    explainDeductions: "सिर्फ़ वही दावे गिने जाते हैं जो इस रेजीम में मान्य हैं।",
    explainDisallowed: (section: string) =>
      `${section} इस रेजीम में मान्य नहीं है, इसलिए यहाँ इसका कुछ असर नहीं।`,
    explainTaxable: "जो आया, उसमें से मानक कटौती और आपके दावे घटाकर।",
    explainSlab: "टैक्स फालियों में लगता है — हर फाल पर अपनी दर।",
    explainRebate: (amount: string) =>
      `एक सीमा तक ज़्यादातर टैक्स रद्द हो जाता है — यहाँ ${amount}।`,
    explainCess: "हर राहत के बाद ऊपर से लगने वाला छोटा प्रतिशत।",
    explainTds: "TDS का मतलब है स्रोत पर काटा गया टैक्स: जिसने पैसा दिया, उसने आपके पास पहुँचने से पहले इसे रोक लिया।",
    fromFacts: "इन्हीं तथ्यों से:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "भेजने के लिए तैयार?",
    sub: "एक बार चला गया तो बदलने का रास्ता है दोबारा फाइल करना। एक बार और देख लें, फिर भेजें।",
    stepChecking: "हिसाब जाँच रहे हैं…",
    stepSealing: "आंकड़े सील कर रहे हैं…",
    stepFiled: "दाखिल हो गया।",
    ackHeading: "जमा हो गया।",
    ackBody:
      "आपका रिटर्न आज से गिना जाएगा। एक कदम बाकी है: पुष्टि करना कि यह आप ही हैं। तब तक यह भेजा हुआ नहीं गिना जाएगा।",
    ackNext:
      "उसके बाद ट्रैकर ठीक-ठीक दिखाएगा कि आपका पैसा कहाँ है और क्या उसे रोक सकता है।",
    errorCause: "जाँच का कदम इसलिए रुका क्योंकि सैंडबॉक्स का fault स्विच चालू है।",
    errorAction:
      "रिव्यूअर ड्रॉअर में 'Trigger API Gateway Timeout' बंद करें, फिर दोबारा भेजें। कुछ नहीं गया।",
    retry: "फिर भेजने की कोशिश करें",
  },

  timeline: {
    filed: "आपने अपना रिटर्न भेज दिया।",
    verified: "आपने पुष्टि की कि यह आप ही हैं। रिटर्न यहीं से गिना जाएगा।",
    in_queue: "उस सप्ताह दाखिल हुई बाकी सब चीज़ों के साथ कतार में।",
    under_review: "अभी कोई इसे देख रहा है।",
    determined: "तय हो गया — इतना आपको वापस मिलेगा।",
    sent_to_bank: "आपके बैंक को भेज दिया।",
    credited: "आपके खाते में।",
  },

  refund: {
    heading: (amount: string) => `${amount} आपके पास आ रहे हैं`,
    filedDaysAgo: (days: number) => `आपने ${days} दिन पहले भेजा था`,

    holdsHeading: (n: number) =>
      n === 1 ? "एक चीज़ का इंतज़ार है" : `${n} चीज़ों का इंतज़ार है`,
    clearsInDays: (days: number) =>
      days === 1 ? "वह होते ही करीब एक दिन" : `वह होते ही करीब ${days} दिन`,

    cohortWindow: (from: number, to: number) =>
      `आपके ही हफ़्ते में भेजे गए रिटर्न अभी देखे जा रहे हैं। ${from} से ${to} दिन लग सकते हैं।`,

    states: {
      not_filed: "अभी भेजा नहीं गया",
      filed_unverified: "भेज दिया, आपकी पुष्टि बाकी है",
      verified: "आपने पुष्टि कर दी",
      in_queue: "कतार में",
      under_review: "कोई इसे देख रहा है",
      determined: "तय हो गया",
      sent_to_bank: "आपके बैंक को भेज दिया",
      credited: "आपके खाते में आ गया",
      failed: "आपके खाते तक नहीं पहुँच सका",
    },

    bankFailedHeading: "आपने जो खाता चुना है, उसमें पैसा नहीं जा सकता।",
    bankMergedInto: (bank: string) => `वह शाखा अब ${bank} का हिस्सा है`,
    useThisAccount: "इसके बजाय यहाँ भेजें",
    resolvedHold: "निपट गया — अब कुछ नहीं रोकता।",
    stampFiled: "दाखिल",
  },

  notices: {
    heading: "विभाग से आई चिट्ठियाँ",
    none: "कुछ वापस नहीं आया। यही अच्छी बात है।",
    respondBy: (date: string) => `${date} तक जवाब दें`,
    ifYouDoNothing: "अगर आप कुछ नहीं करते",
    basedOn: "यह किस आधार पर है",
    theCatch: "इसमें उनसे क्या चूक हुई है",
    agree: "यह सही है",
    disagree: "यह ग़लत है",
    dinLabel: "इस चिट्ठी का संदर्भ नंबर",
    dinExplain:
      "विभाग की हर चिट्ठी पर यह नंबर होना ज़रूरी है। इसके बिना चिट्ठी का कोई अस्तित्व नहीं माना जाता।",
  },

  dashboard: {
    userDashboard: "यूज़र डैशबोर्ड",
    taxPrefills: "टैक्स जानकारी (AIS/26AS)",
    pendingActions: "बाकी कार्रवाइयां",
    returnSummary: "रिटर्न सारांश AY 2026-27",
    reviewPrefill: "टैक्स जानकारी टैब में पहले से भरे विवरण की समीक्षा करें, फिर फाइल करने की पुष्टि करें।",
    filingSubmitted: "आपका ई-फाइलिंग रिटर्न जमा हो गया है। समय-सीमा पर प्रगति की जाँच करें।",
    verifiedBanks: "रिफंड के लिए सत्यापित बैंक खाते",
    primaryRefundAccount: "प्राथमिक रिफंड खाता",
    backupAccount: "बैकअप खाता",
    ifscMeaning: "IFSC रिफंड भेजने के लिए इस्तेमाल होने वाला 11-अक्षरों का बैंक रूटिंग कोड है।",
    refundTimeline: "रिफंड की समय-सीमा",
    filingSubmittedTimeline: "रिटर्न जमा किया गया",
    identityVerifiedTimeline: "पहचान सत्यापित",
    assessmentProcessingTimeline: "आकलन प्रक्रिया में",
    refundApprovedTimeline: "रिफंड स्वीकृत",
    refundCreditedTimeline: "रिफंड जमा हो गया",
    holdActive: "रुकावट सक्रिय: एक्शन टैब में कार्रवाई पूरी करें",
    successCheckApp: "सफलता! अपने बैंकिंग ऐप की जाँच करें।",
    outstandingNotices: "बकाया अनुपालन सूचनाएं",
    noPendingActions: "कोई कार्रवाई बाकी नहीं है",
    accountCompliant: "आपका खाता पूरी तरह से अनुपालन में है, कोई बकाया सूचना या टैक्स मांग नहीं है।",
    actionableHolds: "सक्रिय आकलन रुकावटें",
    uploadRent: "किराया समझौता / रसीदें अपलोड करें",
    landlordName: "मकान मालिक का नाम",
    landlordPan: "मकान मालिक का PAN (10 अंक)",
    selectPdfJpg: "PDF/JPG चुनें",
    submitReceipt: "रसीद जमा करें",
    responsePosition: "जवाब की स्थिति",
    agreeDept: "मैं विभाग से सहमत हूँ",
    disagreeProof: "मैं असहमत हूँ (सबूत जमा करें)",
    responseDraft: "जवाब का बयान (प्रारूप)",
    dictateStatement: "बोलकर दर्ज करें",
    sendResponse: "जवाब भेजें",
    filingStatusLabel: "फाइलिंग स्थिति",
    bankValidated: "सत्यापित",
    bankUnderProcess: "जाँच चल रही है",
    bankFailed: "असफल",
    staleIfscHold: "यह बैंक कोड अब कहीं नहीं जाता।",
    switchToNewIfsc: (ifsc: string) => `नए कोड पर बदलें (${ifsc})`,
    personalized: {
      eyebrow: "आपका डैशबोर्ड",
      heading: {
        file_return: "आइए आपका रिटर्न तैयार करते हैं",
        check_refund: "आइए देखें क्या पैसा वापस आ सकता है",
        understand_notice: "आइए ज़रूरी कार्रवाई समझते हैं",
        correct_prefill: "आइए बताई गई जानकारी जाँचते हैं",
      },
      guidedBody: "हर संख्या की पुष्टि से पहले हम उसका मतलब समझाएंगे।",
      quickBody: "रास्ता छोटा रहेगा और अगला ज़रूरी फैसला पहले दिखेगा।",
      unfiledBody: "पहले आपके बारे में पहले से दर्ज जानकारी की पुष्टि करें।",
      filedBody: "आपके आने के कारण के मुताबिक हमने सही हिस्सा पहले खोला है।",
      primaryAction: {
        facts: "दर्ज जानकारी देखें",
        overview: "रिफंड ट्रैकर देखें",
        statement: "बताई गई जानकारी जाँचें",
        actions: "ज़रूरी कार्रवाई देखें",
      },
      focusLabel: "हम इन बातों पर ध्यान देंगे",
      profileLabels: {
        work: "काम",
        income: "कुल अनुमानित आय",
        history: "फाइलिंग का अनुभव",
      },
    },
  },

  onboarding: {
    eyebrow: "शुरू करने से पहले",
    title: "इसे आपके लिए तैयार करते हैं।",
    intro:
      "पाँच छोटे जवाब हमें सही भाषा, गति और टैक्स के सवाल चुनने में मदद करेंगे। आप इन्हें बाद में बदल सकते हैं।",
    languageQuestion: "हम किस भाषा में बात करें?",
    languageHelp: "सबसे पहले यही सवाल है। भाषा आप कभी भी बदल सकते हैं।",
    intentQuestion: "आज आप यहाँ क्यों आए हैं?",
    intentHelp: "हम उसी काम को सबसे पहले रखेंगे।",
    intentOptions: {
      file_return: {
        label: "इस साल का रिटर्न फाइल करना है",
        detail: "आपके बारे में जो पहले से पता है, वहीं से शुरू करेंगे।",
      },
      check_refund: {
        label: "देखना है कि पैसा वापस मिलना है या नहीं",
        detail: "क्या बताया गया, कितना टैक्स कटा और क्या वापस आ सकता है, यह देखें।",
      },
      understand_notice: {
        label: "चिट्ठी या नोटिस समझना है",
        detail: "इसमें क्या लिखा है, कितना दाँव पर है और आगे क्या करना है, यह देखें।",
      },
      correct_prefill: {
        label: "ग़लत दिख रही बात ठीक करनी है",
        detail: "किसने रकम बताई और क्या बदलना है, यह दर्ज करें।",
      },
    },
    intentCta: {
      file_return: "मेरा रिटर्न शुरू करें",
      check_refund: "देखें मुझे क्या मिलना है",
      understand_notice: "बताएँ मुझे क्या करना है",
      correct_prefill: "जो बताया गया है उसे जाँचें",
    },
    situationQuestion: "आपकी टैक्स की स्थिति कैसी है?",
    situationHelp: "यहाँ दो छोटे जवाब काफ़ी हैं।",
    professionLabel: "आपके काम को इनमें से कौन सबसे ठीक बताता है?",
    professionOptions: {
      salaried: "नौकरी",
      self_employed: "फ्रीलांस या अपना काम",
      business_owner: "व्यवसाय",
      student: "छात्र या छात्रा",
      retired: "रिटायर्ड",
      investor: "निवेशक",
      other: "कुछ और",
    },
    filingHistoryLabel: "क्या आपने पहले इनकम टैक्स रिटर्न फाइल किया है?",
    filingHistoryOptions: {
      never: "नहीं, पहली बार",
      once: "एक या दो बार",
      every_year: "हर साल",
    },
    incomeQuestion: "सभी स्रोतों से आपकी कुल कमाई लगभग कितनी थी?",
    incomeHelp: "अभी सिर्फ़ एक दायरा काफ़ी है। सही रकम बाद में देखेंगे।",
    incomeOptions: {
      none: "कोई कमाई नहीं",
      under_4: "₹4 लाख से कम",
      "4_to_8": "₹4 से ₹8 लाख",
      "8_to_12": "₹8 से ₹12 लाख",
      "12_to_25": "₹12 से ₹25 लाख",
      over_25: "₹25 लाख से ज़्यादा",
    },
    focusQuestion: "इनमें से किन बातों पर ध्यान दें?",
    focusHelp: "जो आप पर लागू हो, सब चुनें। पक्का न हो तो पता नहीं चुनें।",
    focusOptions: {
      salary: "तनख़्वाह या पेंशन",
      freelance: "फ्रीलांस काम",
      business: "व्यवसाय की कमाई",
      rent: "दिया या मिला हुआ किराया",
      interest: "बैंक का ब्याज",
      investments: "शेयर या निवेश",
      deductions: "बचत, बीमा, होम लोन या NPS",
      not_sure: "अभी पक्का नहीं पता",
    },
    chooseOne: "एक चुनें",
    chooseAtLeastOne: "कम से कम एक चुनें",
    questionsLabel: "छोटी तैयारी",
    questionsProgress: (current: number, total: number) => `${current} में से ${total}`,
    savedLocally: "इस प्रोटोटाइप में आपके जवाब इसी ब्राउज़र में सेव होते हैं।",
    readyTitle: "इतना हमें इसे आपके लिए बनाने के लिए काफ़ी है।",
    readyBody:
      "इन जवाबों से हम तय करेंगे कि आपको पहले क्या दिखाना है। रेजीम का आख़िरी चुनाव आपके पक्के किए हुए तथ्यों और दावों पर होगा।",
    guidedLabel: "हम कैसे समझाएँगे",
    guidedValue: "हम चलते-चलते शब्द समझाएँगे।",
    quickValue: "हम रास्ता छोटा रखेंगे।",
    regimeLabel: "रेजीम के साथ हमारा तरीका",
    claimsRegimeValue: "रेजीम चुनने से पहले आपके दावे जाँचेंगे।",
    compareRegimeValue: "तथ्य पक्के होने के बाद दोनों रेजीम की तुलना करेंगे।",
    focusLabel: "पहले किस पर ध्यान होगा",
    startPath: "मेरे रास्ते से शुरू करें",
    changeAnswers: "जवाब बदलें",
    tailoredBadge: "आपका शुरुआती रास्ता",
    tailoredGuided: "समझाकर आगे बढ़ेंगे",
    tailoredQuick: "छोटा रास्ता",
    tailoredRegimeClaims: "रेजीम से पहले दावों की जाँच",
    tailoredRegimeCompare: "तथ्यों के बाद दोनों रेजीम की तुलना",
    tailoredIntent: (intent: string) => `पहले: ${intent}`,
  },

  footer: {
    prototype: "स्वतंत्र अवधारणा प्रोटोटाइप।",
    notAffiliated:
      "यह आयकर विभाग, CBDT या भारत सरकार से जुड़ा हुआ, इनके द्वारा समर्थित या इनसे संबंधित नहीं है। यहाँ दिया गया हर नाम, PAN, रकम और दस्तावेज़ बनाया हुआ है। किसी भी सरकारी सिस्टम से संपर्क नहीं किया जाता।",
    honestyLink: "देखें क्या असली है और क्या बनाया हुआ",
  },
};

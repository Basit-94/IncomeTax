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
    check: "देखें मेरा कितना बाकी है",
    orTryAs: "या तीन लोगों में से किसी एक की तरह देखें",
    honestyLink: "यहाँ क्या असली है और क्या बनाया हुआ",
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
  },

  file: {
    heading: (amount: string) => `आपके ${amount} विभाग के पास पड़े हैं`,
    subheading:
      "नीचे लिखी लगभग हर बात आपके बारे में पहले ही बता दी गई है। इसे पढ़ें, और कुछ ग़लत हो तो हमें बताएँ।",

    checkThis: "इसे जाँच लें — भरना नहीं है",
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
  },

  footer: {
    prototype: "स्वतंत्र अवधारणा प्रोटोटाइप।",
    notAffiliated:
      "यह आयकर विभाग, CBDT या भारत सरकार से जुड़ा हुआ, इनके द्वारा समर्थित या इनसे संबंधित नहीं है। यहाँ दिया गया हर नाम, PAN, रकम और दस्तावेज़ बनाया हुआ है। किसी भी सरकारी सिस्टम से संपर्क नहीं किया जाता।",
    honestyLink: "देखें क्या असली है और क्या बनाया हुआ",
  },
};

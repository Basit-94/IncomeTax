/**
 * سنڌي (Sindhi, Perso-Arabic script). Typed against the English source, so
 * this file cannot fall behind it.
 *
 * This translation is model-generated and awaits review by a native Sindhi
 * speaker who knows tax vocabulary (project task T0.5). That limitation is
 * real and is disclosed rather than hidden.
 *
 * dir is "rtl". Digits stay Latin (0-9), never Arabic-Indic numerals — money
 * must be instantly legible. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS,
 * section codes and persona/bank names stay in Latin script; they render as
 * embedded LTR runs, which is expected. hi.ts precedent is followed for what
 * stays untranslated.
 */

import type { Dict } from "./en";

export const sd: Dict = {
  langName: "Sindhi",
  langNativeName: "سنڌي",
  dir: "rtl",

  common: {
    modeSimple: "سادو",
    modeDetailed: "تفصيلي",
    continue: "اڳتي وڌو",
    back: "پوئتي",
    yesThatsRight: "ها، اهو صحيح آهي",
    noThisIsWrong: "نه، اهو غلط آهي",
    iDontUnderstand: "مون کي اها ڳالهه سمجهه ۾ نه آئي",
    close: "بند ڪريو",
    saveAndGoOn: "محفوظ ڪريو ۽ اڳتي وڌو",
    loading: "هڪ پل",
    logOut: "لاگ آئوٽ",
    undo: "واپس وٺو",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "واپسي",
    subtitle: "جانچڻ ۽ فائل ڪرڻ جو سولو طريقو",
    independent: "آزاد پروٽوٽائپ",
    taxYear: "ٽيڪس سال 2026-27",
    language: "ٻولي",
    light: "لائيٽ",
    dark: "ڊارڪ",
    sandbox: "جائزي جا اوزار",
  },

  validate: {
    panTooShort: (n: number) => `هن مهل ${n} اکر آهن۔ PAN ۾ 10 هوندا آهن۔`,
    panShape:
      "PAN ۾ پهرين پنج اکر، پوءِ چار انگ، پوءِ هڪ اکر هوندو آهي — جيئن DEMPS4417K۔",
    panSandboxHint:
      "توهان هتي جيڪو به لکو ٿا سو توهان جي برائوزر کان ٻاهر نٿو وڃي۔ هن پروٽوٽائپ ۾ هر PAN DEMP سان شروع ٿئي ٿو، ان ڪري ڪو اصلي PAN غلطيءَ سان ڳولي نٿو سگهجي۔",
    ifscTooShort: (n: number) => `هن مهل ${n} اکر آهن۔ بئنڪ ڪوڊ ۾ 11 هوندا آهن۔`,
    ifscShape:
      "بئنڪ ڪوڊ ۾ پهرين چار اکر، پوءِ هڪ ٻُڙي، پوءِ ڇهه وڌيڪ — جيئن DECU0834471۔",
  },

  landing: {
    question: "ڇا انڪم ٽيڪس کاتي وٽ توهان جا پئسا رڪيل آهن؟",
    subtext:
      "هتي ايندڙ گهڻن ماڻهن کي ڪجهه ڏيڻو نه هوندو آهي — انهن کي ملڻو هوندو آهي۔ پنهنجو PAN وجهو، اسان ٻڌائينداسين ته ڇا رڪيل آهي۔",
    panLabel: "توهان جو PAN",
    panHelp: "ڏهه اکر، توهان جي PAN ڪارڊ تان",
    panPlaceholder: "مثال طور، DEMPS4417K",
    check: "ڏسو منهنجو ڪيترو بڻجي ٿو",
    orTryAs: "يا ٽن ماڻهن مان ڪنهن هڪ وانگر ڏسو",
    honestyLink: "هتي ڇا اصلي آهي ۽ ڇا ٺاهيل",
    architectureLink: "ٽيڪنيڪل جوڙجڪ",
    badge: "سادي رٽرن، آزمايل",
    brandTitle: "توهان جا پئسا، واپسيءَ جي واٽ تي۔",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "فائل ڪرڻ",
      blurb:
        "سندس پگهار مان ₹8,400 ڪٽيا ويا۔ کيس ڪجهه ڏيڻو ناهي، فائل نه ڪيو اٿس، ۽ اسڪول جي في ڏيڻي آهي۔",
      action: "جيڪو اڳ ۾ ئي معلوم آهي ان جي تصديق ڪريو",
    },
    rakesh: {
      phase: "هڪ خط آيو",
      blurb:
        "خط چوي ٿو ته هن شيئرن جو ₹1,10,000 جو نفعو لڪايو۔ سندس رفنڊ هڪ پراڻي گهُر جي بدلي روڪيو ويو آهي، جنهن بابت کيس ڪڏهن ٻڌايو ئي نه ويو۔",
      action: "پڙهو ۽ اختلاف ڪريو",
    },
    priya: {
      phase: "انتظار",
      blurb:
        "71 ڏينهن اڳ فائل ڪيائين۔ اڃا به لکيل آهي ته ڪارروائي هلي رهي آهي۔ اصل ۾ ٻه شيون روڪي رهيون آهن، ۽ ڪنهن به نه ٻڌايو ته ڪهڙيون۔",
      action: "ڏسو ڇا روڪي رهيو آهي",
    },
    custom: {
      phase: "پنهنجو ٺاهيو",
      blurbTitle: "ٺاهيل ڪو ماڻهو",
      blurb:
        "شروع کان هڪ ماڻهو ٺاهيو — سندس ڪمائي، سندس دعوائون، کانئس ڪٽيل ٽيڪس — ۽ ڏسو ته حساب پاڻمرادو ڪيئن ٿو بڻجي۔",
      action: "ڪو ٺاهي وٺو",
    },
  },

  login: {
    authVerifying: "سرور سان جانچ ٿي رهي آهي…",
    authUnreachable:
      "سائن اِن سرور تائين پهچ نه ٿي سگهي۔ توهان جو ڀريل ڪجهه به نه ويو آهي — ٿوري دير کان پوءِ ٻيهر ڪوشش ڪريو۔",
    authRejected: (detail: string) => `سرور سائن اِن ٿيڻ نه ڏنو: ${detail}`,
    signedInAs: "سائن اِن ٿي ويا — سيشن هلندڙ آهي",
    otpSentTo: (mobile: string) => `اسان ${mobile} تي هڪ ڪوڊ موڪليو آهي`,
    otpLabel: "ڇهن انگن جو ڪوڊ",
    weWillWait:
      "ڪا تڪڙ ناهي۔ ڪوڊ جي انتظار دوران توهان جو ڀريل ڪجهه به نه ويندو۔",
    resend: "ٻيهر موڪليو",
    resendIn: (seconds: number) => `${seconds} سيڪنڊن کان پوءِ ٻيهر گهري سگهو ٿا`,
    mockNotice:
      "هي هڪ پروٽوٽائپ آهي، ان ڪري ڪوڊ اسڪرين تي ئي ڏيکاريل آهي۔ ڪو اصلي پيغام نٿو موڪليو وڃي۔",
    portalHeading: "اي-فائلنگ تصديق",
    incorrectCode: "هي ڪوڊ نٿو ملي۔ ڇهه انگ ٻيهر جانچيو ۽ وري ڪوشش ڪريو۔",
    prototypeBox: "پروٽوٽائپ OTP تصديق",
    mockCodeLabel: "نموني وارو ڪوڊ",
    autoFill: "منهنجي لاءِ ڀري ڇڏيو",
    verifyEnter: "تصديق ڪريو ۽ اندر وڃو",
    draftRestored: (time: string) =>
      `توهان جو ${time} وارو مسودو واپس آندو ويو۔ ڪجهه به نه ويو آهي۔`,
  },

  file: {
    heading: (amount: string) => `توهان جا ${amount} کاتي وٽ پيل آهن`,
    subheading:
      "هيٺ لکيل لڳ ڀڳ هر ڳالهه توهان بابت اڳ ۾ ئي ٻڌائي وئي آهي۔ ان کي پڙهو، ۽ ڪجهه غلط هجي ته اسان کي ٻڌايو۔",

    checkThis: "هن کي جانچي وٺو — ڀرڻو نه پوندو",
    factMeaning:
      "هيءَ اڳ ۾ ٻڌايل ڳالهه آهي، ٽيڪس جو قاعدو نه۔ ان مان ئي هيٺيون حساب بڻجي ٿو۔",
    factMeaningByKind: {
      salary:
        "توهان جي نوڪري ڏيندڙ توهان تائين پهتل پگهار مان هي درج ڪيو۔ هيٺيون سمورو حساب هتان ئي شروع ٿئي ٿو۔",
      interest:
        "بئنڪ سال ۾ هڪ ڀيرو توهان جي اڪائونٽن جو وياج درج ڪندا آهن۔ ننڍي رقم به آمدني آهي۔",
      dividend:
        "ڪمپنيءَ جي رجسٽرار درج ڪيو ته توهان جي شيئرن ڇا ڏنو۔ جنهن سال مليو، ان ئي سال جي آمدني ڳڻي ويندي آهي۔",
      capital_gains:
        "توهان جي بروڪر شيئر وڪڻڻ مان مليل پئسا درج ڪيا۔ ٽيڪس نفعي تي لڳي ٿو — شرح ان تي منحصر آهي ته ڇا وڪيو ۽ ڪيترو وقت رکيو۔",
      rent:
        "مليل مسواڙ آمدني آهي؛ ڏنل مسواڙ ٽيڪس گهٽائي سگهي ٿي۔ ٻنهي صورتن ۾ اها ٻئي پاسي جي درج انگ سان ملڻ گهرجي۔",
      other:
        "اهڙي درج ٿيل آمدني جيڪا ڪنهن ٻئي خاني ۾ نٿي اچي۔ اها به هيٺين حساب ۾ شامل ٿئي ٿي۔",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ${date} تي کاتي کي اها ڄاڻ ڏني`,
    underIdentifier: (identifier: string) => `رجسٽريشن ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `جيڪڏهن هي غلط آهي ته اصل جاءِ تي ان کي رڳو ${reporter} ئي بدلائي سگهن ٿا۔ اسان ٻڌائينداسين ته انهن کان بلڪل ڇا گهرڻو آهي۔`,

    whatYouEarned: "توهان ڪيترو ڪمايو",
    whatWasDeducted: "ٽيڪس اڳ ۾ ئي ڪيترو ڪٽيو ويو",
    whereMoneyGoes: "پئسا ڪيڏانهن ويندا",
    whoYouAre: "توهان ڪير آهيو",

    disputeHeading: "هن ۾ ڇا لکيل هجڻ گهرجي؟",
    disputeAmountLabel: "صحيح رقم",
    disputeReasonLabel: "هي غلط ڇو آهي",
    disputeSave: "هن کي غلط ٻڌايو",
    selfReported: "توهان",
    returnLabel: "توهان جي رٽرن",

    outcomeOwesNothing: "توهان کي ڪجهه به ڏيڻو ناهي۔",
    outcomeRefund: (amount: string) => `${amount} توهان کي واپس ملندا۔`,
    outcomeOwes: (amount: string) => `${amount} ڏيڻا باقي آهن۔`,
    confirmAndFile: "هن کي موڪلي ڇڏيو",

    verifyHeading: "بس هڪ قدم باقي آهي، نه ته هيءَ ڳڻي نه ويندي۔",
    verifyBody:
      "جيستائين توهان تصديق نٿا ڪريو ته هي توهان ئي آهيو، توهان جي رٽرن داخل ٿيل نٿي ليکجي — ڄڻ توهان موڪلي ئي ناهي۔ ان ۾ لڳ ڀڳ ويهه سيڪنڊ لڳن ٿا۔",
    verifyAction: "تصديق ڪريو ته هي مان آهيان",

    voicePrompt: "يا ڳالهائي ٻڌايو",
    voiceListening: "ٻڌي رهيا آهيون",
    voiceUnsupported:
      "هن فون جو برائوزر اڃا ٻڌي نٿو سگهي۔ توهان لکي ٻڌائي سگهو ٿا — ڪجهه به نه ويندو۔",
    voiceSimulated:
      "هي برائوزر ٻڌي نٿو سگهي، ان ڪري هي هڪ مثال آهي، توهان جو آواز نه۔",
    voiceError: "اهو ٻڌڻ ۾ نه آيو۔ توهان لکي ٻڌائي سگهو ٿا — ڪجهه به نه ويندو۔",
    dictate: "ڳالهائي ٻڌايو",
    disputePlaceholder: "هي انگ غلط ڇو آهي — لکو يا ڳالهايو۔",
    disputeDefaultReason: "ٻڌايل انگ غلط آهي",
  },

  flow: {
    facts: "توهان جا پئسا",
    deductions: "اهي پئسا جيڪي توهان گهري سگهو ٿا",
    regime: "پراڻو يا نئون",
    check: "جانچي وٺو",
    file: "موڪلي ڇڏيو",
    stepOf: (n: number, total: number) => `قدم ${n}، ڪل ${total}`,
    confirmedCount: (done: number, total: number) => `${total} مان ${done} پڪا`,
    allConfirmed: "سڀ ڪجهه ٺيڪ ٺاڪ آهي۔",
    undoOne: "هيءَ درستي واپس وٺو",
    correctedTo: (amount: string) => `توهان چئو ٿا ته اهو ${amount} هجڻ گهرجي`,
  },

  groups: {
    moneyIn: "ايندڙ پئسا",
    taxPaid: "توهان لاءِ اڳ ۾ ئي ڪٽيل ٽيڪس",
    deductionsClaimed: "توهان جون دعوائون",
    fromWhere: "هي ڪٿان آيو",
    addIncome: "آمدني شامل ڪريو",
  },

  deductions: {
    notAllowedNewRegime:
      "نئين نظام ۾ نٿو ڳڻيو وڃي — توهان جي رڪارڊ ۾ محفوظ آهي۔",
    startedAtCap: (amount: string) =>
      `اسان ان کي ${amount} جي حد کان شروع ڪيو — ”ڪيترو“ ۾ اها رقم وجهو جيڪا توهان اصل ۾ ڏني۔`,
    heading: "اهي پئسا جيڪي توهان گهري سگهو ٿا",
    sub: "اهي پاڻمرادو نه ٿيندا آهن۔ توهان کي ها چوڻي پوندي آهي — پر تڏهن، جڏهن سچ هجي۔",
    claimedHeading: "توهان جي رٽرن ۾ اڳ کان",
    worthUpTo: (amount: string) =>
      `توهان جي ٽيڪس لائق آمدنيءَ مان ${amount} تائين گهٽجي سگهي ٿو`,
    worthWhatYouPaid: "اوترو ئي جيترو توهان اصل ۾ ڏنو — صحيح رقم ڀريو",
    askRentQ: "ڇا توهان رهائش جي مسواڙ ڏيو ٿا؟",
    askRentWhy:
      "جيڪڏهن توهان مسواڙ ڏيو ٿا ۽ نوڪري ڏيندڙ کان گهر جي مسواڙ جو الائونس نٿو ملي، ته ان جو ڪجهه حصو توهان جي ٽيڪس لائق آمدنيءَ مان گهٽجي سگهي ٿو۔",
    askHealthQ: "ڇا توهان پنهنجي ڪٽنب جي صحت جو انشورنس پاڻ ڀريو ٿا؟",
    askHealthWhy:
      "ڪٽنب جو انشورنس رکڻ لاءِ جيڪو توهان ڀريو ٿا، سو توهان جي ٽيڪس لائق آمدنيءَ مان گهٽجي سگهي ٿو۔",
    ask80cQ: "ڇا توهان پراويڊنٽ فنڊ، جيون انشورنس يا اسڪول جي فيءَ ۾ پئسا وجهو ٿا؟",
    ask80cWhy:
      "اهڙي ڊگهي مدي واري بچت هڪ گڏيل حد ۾ ڳڻي ويندي آهي، ۽ جيترو توهان وجهو ٿا اوترو ٽيڪس لائق آمدنيءَ مان گهٽجي ٿو۔",
    claimIt: "ها — هي گهرڻو آهي",
    skipIt: "نه — هي ڇڏي ڏيو",
    amountLabel: "ڪيترو",
    evidenceAttached: "ثبوت شامل آهي",
    evidenceMissing:
      "اڃا ڪو ثبوت شامل ناهي — في الحال ٺيڪ آهي۔ رسيدون سنڀالي رکو؛ کاتو پوءِ گهري سگهي ٿو۔",
    newRegimeNoEffect:
      "نئين نظام ۾ هن دعويٰ سان ڪجهه نٿو بدلجي — اتي اها قبول ناهي۔",
    oldRegimeSaves: (amount: string) =>
      `پراڻي نظام ۾ اها توهان جو ٽيڪس لڳ ڀڳ ${amount} گهٽائي ڇڏي ها۔`,
  },

  regime: {
    heading: "ٽيڪس ٻن طريقن سان لڳي سگهي ٿو۔ هڪ توهان لاءِ بهتر آهي۔",
    newRegimeName: "نئون نظام",
    oldRegimeName: "پراڻو نظام",
    refundLabel: "توهان کي واپس ملندو",
    dueLabel: "ڏيڻو باقي",
    recommendedBadge: "توهان لاءِ بهتر",
    reasoningOldDeductions: (x: string, y: string) =>
      `توهان جون دعوائون ڪل ${x} جون آهن، ان ڪري پراڻو نظام توهان جا لڳ ڀڳ ${y} بچائي ٿو۔`,
    reasoningNewDefault: (y: string) =>
      `توهان جون دعوائون هتي گهڻو فرق نٿيون وجهن، ان ڪري نئين نظام جون گهٽ شرحون توهان جا لڳ ڀڳ ${y} بچائين ٿيون۔`,
    acceptRecommendation: "جيڪو مون لاءِ بهتر آهي، اهو ئي چونڊيو",
    overrideNote: "توهان ڪو به چونڊي سگهو ٿا۔ هتي ڪجهه به لڪيل يا بند ناهي۔",
  },

  check: {
    newRegimeClaimsZero:
      "توهان جون دعوائون درج ۽ محفوظ آهن — نئون نظام انهن جي اجازت نٿو ڏئي، ان ڪري هيءَ سٽ ₹0 آهي۔",
    badgeReportedBy: (reporter: string) => `${reporter} درج ڪيو`,
    badgeYouEntered: "توهان درج ڪيو",
    badgeWeApplied: "اسان توهان لاءِ لاڳو ڪيو",
    heading: "پوري رٽرن، هڪ ئي صفحي تي",
    sub: "هر انگ ڪٿان نه ڪٿان آيو آهي۔ ڪا به سٽ کوليو ۽ چٽيءَ طرح ڏسو ته ڪٿان۔",
    grossIncome: "جيڪو ڪجهه آيو",
    standardDeduction: "معياري ڪٽوتي",
    deductionsLine: "توهان جون دعوائون",
    taxableIncome: "جنهن تي ٽيڪس اصل ۾ لڳي ٿو",
    slabTax: "ڪنهن به رعايت کان اڳ جو ٽيڪس",
    rebate87A: "ڇوٽ جيڪا ان جو ڪجهه حصو رد ڪري ٿي",
    cess: "صحت ۽ تعليم جو واڌارو",
    totalTax: "سال جو ڪل ٽيڪس",
    tdsCredits: "اڳ ۾ ئي توهان کان ڪٽجي چڪو",
    refundDue: "توهان کي واپس ملندو",
    balanceDue: "ڏيڻو باقي",
    openLine: "ڏسو هي ڪٿان آيو",
    closeLine: "لڪايو",
    calculationStatus:
      "هي پروٽوٽائپ جو حساب آهي — قاعدن جي ماخذن جي اڃا بنيادي ماخذ کان جانچ باقي آهي (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} هيٺ ڏنل پڪين ڪيل حقيقتن ۽ ٽيڪس ڪريڊٽن مان نڪتو آهي۔ هن پروٽوٽائپ ۾ ماخذ رڪارڊ ٺاهيل آهن۔`,
    showCalculationTrail: "ماخذ ۽ حساب جي ڪڙي ڏسو",
    hideCalculationTrail: "ماخذ ۽ حساب جي ڪڙي لڪايو",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} تي درج ٿيو`,
    sourceIdentifier: (identifier: string) => `رڪارڊ ${identifier}`,
    selfReportedSource: "هن رٽرن ۾ توهان پاران ٻڌايل",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: رپورٽ ڪندڙ ادارن کان مليل ڄاڻ جو سالياني گوشوارو۔"
        : statement === "26AS"
        ? "Form 26AS: توهان جي PAN تي درج ٽيڪس ڪريڊٽ جو گوشوارو۔"
        : "هن حقيقت سان جڙيل ماخذ رڪارڊ۔",
    sectionMeaning: (section: string) =>
      `${section} ڪٽوتيءَ جو هڪ سيڪشن آهي۔ اهو تڏهن ئي ڳڻبو آهي جڏهن هي نظام ان جي اجازت ڏئي۔`,
    explainGross: "توهان جي جانچيل ۽ پڪين ڪيل حقيقتن کي گڏ ڪري۔",
    explainStd: (amount: string) =>
      `پگهار واري هر ماڻهوءَ کي ${amount} بنا گهرڻ جي ئي گهٽجي ويندا آهن۔`,
    explainDeductions: "رڳو اهي دعوائون ڳڻجن ٿيون جيڪي هن نظام ۾ قبول آهن۔",
    explainDisallowed: (section: string) =>
      `${section} هن نظام ۾ قبول ناهي، ان ڪري هتي ان جو ڪو اثر ناهي۔`,
    explainTaxable: "جيڪو آيو، ان مان معياري ڪٽوتي ۽ توهان جون دعوائون گهٽائي۔",
    explainSlab: "ٽيڪس تهن ۾ لڳندو آهي — آمدنيءَ جي هر تهه تي پنهنجي شرح۔",
    explainRebate: (amount: string) =>
      `هڪ حد کان هيٺ گهڻو ٽيڪس رد ٿي ويندو آهي — هتي ${amount}۔`,
    explainCess: "هر رعايت کان پوءِ مٿان لڳندڙ ننڍو سيڪڙو۔",
    explainTds:
      "TDS جو مطلب آهي ماخذ تي ڪٽيل ٽيڪس: جنهن پئسا ڏنا، تنهن توهان تائين پهچڻ کان اڳ اهو روڪي ورتو۔",
    fromFacts: "انهن ئي حقيقتن مان:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "موڪلڻ لاءِ تيار آهيو؟",
    sub: "هڪ ڀيرو ويو ته بدلائڻ جو مطلب آهي ٻيهر فائل ڪرڻ۔ هڪ ڀيرو وڌيڪ ڏسي وٺو، پوءِ موڪليو۔",
    stepChecking: "حساب جانچي رهيا آهيون…",
    stepSealing: "انگ سيل ڪري رهيا آهيون…",
    stepFiled: "داخل ٿي ويو۔",
    ackHeading: "جمع ٿي ويو۔",
    ackBody:
      "توهان جي رٽرن اڄ کان ڳڻبي۔ هڪ قدم باقي آهي: پڇڻ تي تصديق ڪرڻ ته هي واقعي توهان ئي آهيو۔ تيستائين اها موڪليل نٿي ليکجي۔",
    ackNext:
      "ان کان پوءِ ٽريڪر چٽيءَ طرح ڏيکاريندو ته توهان جا پئسا ڪٿي آهن ۽ ڇا انهن کي روڪي سگهي ٿو۔",
    errorCause: "جانچ جو قدم ان ڪري رڪيو جو سينڊباڪس جو fault سوئچ آن آهي۔",
    errorAction:
      "ريويوئر دراز ۾ 'Trigger API Gateway Timeout' بند ڪريو، پوءِ ٻيهر موڪليو۔ ڪجهه به نه ويو آهي۔",
    errorCauseNetwork: "توهان جي رٽرن سرور تائين نه پهتي۔",
    errorActionNetwork:
      "ڪجهه به داخل نه ٿيو ۽ ڪجهه به نه ويو آهي۔ ڪنيڪشن جانچيو، پوءِ ٻيهر موڪليو۔",
    retry: "ٻيهر موڪلڻ جي ڪوشش ڪريو",
  },

  wizard: {
    identityNextHint: "اڳتي وڌڻ لاءِ پنهنجو پورو نالو ۽ 10 اکرن جو PAN درج ڪريو۔",
    employmentConfirmHint: "توهان جي اڳئين جواب مان — بدلجي ويو هجي ته ٻيو اختيار چونڊيو۔",
    tdsZeroWarning:
      "پگهار واري نوڪريءَ ۾ لڳ ڀڳ هميشه ٽيڪس اڳ ۾ ئي ڪٽيل هوندو آهي — اهو توهان جي فارم 16 يا پگهار جي پرچيءَ تي هوندو آهي۔ هتي 0 لکڻ جو مطلب اڪثر پنهنجو رفنڊ ڇڏي ڏيڻ هوندو آهي۔",
  },

  timeline: {
    filed: "توهان پنهنجي رٽرن موڪلي ڇڏي۔",
    verified: "توهان تصديق ڪئي ته هي توهان ئي آهيو۔ رٽرن هتان کان ڳڻبي۔",
    in_queue: "ان هفتي داخل ٿيل باقي سڀني سان گڏ قطار ۾۔",
    under_review: "هاڻي ڪو ان کي ڏسي رهيو آهي۔",
    determined: "فيصلو ٿي ويو — ايترو واپس ايندو۔",
    sent_to_bank: "توهان جي بئنڪ ڏانهن موڪليو ويو۔",
    credited: "توهان جي اڪائونٽ ۾۔",
  },

  refund: {
    heading: (amount: string) => `${amount} توهان ڏانهن اچي رهيا آهن`,
    filedDaysAgo: (days: number) => `توهان ${days} ڏينهن اڳ موڪليو هو`,

    holdsHeading: (n: number) =>
      n === 1 ? "هڪ شيءِ جو انتظار آهي" : `${n} شين جو انتظار آهي`,
    clearsInDays: (days: number) =>
      days === 1 ? "اهو ٿيندي ئي لڳ ڀڳ هڪ ڏينهن" : `اهو ٿيندي ئي لڳ ڀڳ ${days} ڏينهن`,

    cohortWindow: (from: number, to: number) =>
      `توهان جي ئي هفتي ۾ موڪليل رٽرنون هاڻي ڏٺيون پيون وڃن۔ ${from} کان ${to} ڏينهن لڳي سگهن ٿا۔`,

    states: {
      not_filed: "اڃا نه موڪليو ويو",
      filed_unverified: "موڪلي ڇڏي، توهان جي تصديق باقي آهي",
      verified: "توهان تصديق ڪري ڇڏي",
      in_queue: "قطار ۾",
      under_review: "ڪو ان کي ڏسي رهيو آهي",
      determined: "فيصلو ٿي ويو",
      sent_to_bank: "توهان جي بئنڪ ڏانهن موڪليو ويو",
      credited: "توهان جي اڪائونٽ ۾ اچي ويو",
      failed: "توهان جي اڪائونٽ تائين نه پهچي سگهيو",
    },

    bankFailedHeading: "توهان جيڪو اڪائونٽ چونڊيو آهي، ان ۾ پئسا وڃي نٿا سگهن۔",
    bankMergedInto: (bank: string) => `اها برانچ هاڻي ${bank} جو حصو آهي`,
    useThisAccount: "ان جي بدران هتي موڪليو",
    resolvedHold: "نبري ويو — هاڻي ڪجهه به نٿو روڪي۔",
    stampFiled: "داخل",
  },

  notices: {
    heading: "کاتي کان آيل خط",
    none: "ڪجهه به واپس نه آيو آهي۔ اها ئي سٺي ڳالهه آهي۔",
    respondBy: (date: string) => `${date} تائين جواب ڏيو`,
    ifYouDoNothing: "جيڪڏهن توهان ڪجهه نٿا ڪريو",
    basedOn: "هي ڪهڙي بنياد تي آهي",
    theCatch: "انهن کان ڇا غلط ٿيو آهي",
    agree: "اهو صحيح آهي",
    disagree: "اهو غلط آهي",
    dinLabel: "هن خط جو حوالو نمبر",
    dinExplain:
      "کاتي جي هر خط تي هي نمبر هجڻ ضروري آهي۔ ان کان سواءِ خط جو سرڪاري طور ڪو وجود ناهي۔",
  },

  dashboard: {
    serverFilings: "سرور تي درج",
    serverFilingsEmpty:
      "لائيو سرور تي هن PAN جي ڪا داخل رٽرن ناهي — مٿين رسيد ٺاهيل ڪهاڻيءَ جو حصو آهي۔ هن ايپ مان داخل ڪريو ته اصلي رسيد هتي ايندي۔",
    greetingLabel: "توهان جو سائن اِن جملو",
    greetingWhy:
      "هي جملو توهان اڪائونٽ ٺاهڻ وقت چونڊيو هو۔ جيڪو صفحو اهو ڏيکاري نه سگهي، سو اسان نه آهيون۔",
    userDashboard: "يوزر ڊيش بورڊ",
    taxPrefills: "ٽيڪس ڄاڻ (AIS/26AS)",
    pendingActions: "باقي ڪارروائيون",
    returnSummary: "رٽرن جو تت AY 2026-27",
    reviewPrefill:
      "ٽيڪس ڄاڻ واري ٽيب ۾ اڳ ۾ ڀريل تفصيل جانچيو، پوءِ فائل ڪرڻ جي تصديق ڪريو۔",
    filingSubmitted:
      "توهان جي اي-فائلنگ رٽرن جمع ٿي وئي آهي۔ ٽائيم لائين تي پيش رفت ڏسو۔",
    verifiedBanks: "رفنڊ لاءِ تصديق ٿيل بئنڪ اڪائونٽ",
    primaryRefundAccount: "بنيادي رفنڊ اڪائونٽ",
    backupAccount: "بيڪ اپ اڪائونٽ",
    ifscMeaning: "IFSC رفنڊ موڪلڻ لاءِ استعمال ٿيندڙ 11 اکرن جو بئنڪ روٽنگ ڪوڊ آهي۔",
    refundTimeline: "رفنڊ جي ٽائيم لائين",
    filingSubmittedTimeline: "رٽرن جمع ٿي",
    identityVerifiedTimeline: "سڃاڻپ جي تصديق ٿي",
    assessmentProcessingTimeline: "جائزو هلندڙ",
    refundApprovedTimeline: "رفنڊ منظور",
    refundCreditedTimeline: "رفنڊ جمع ٿي ويو",
    holdActive: "رڪاوٽ هلندڙ: ايڪشن ٽيب ۾ ڪارروائي پوري ڪريو",
    successCheckApp: "ٿي ويو! پنهنجي بئنڪنگ ايپ ڏسو۔",
    outstandingNotices: "رهيل تعميلي نوٽيس",
    noPendingActions: "ڪا ڪارروائي باقي ناهي",
    accountCompliant:
      "توهان جو اڪائونٽ مڪمل طور درست آهي — ڪو رهيل نوٽيس يا ٽيڪس جي گهُر ناهي۔",
    actionableHolds: "ڪارروائي گهرندڙ جائزي جون رڪاوٽون",
    uploadRent: "مسواڙ نامو / رسيدون اپلوڊ ڪريو",
    landlordName: "گهر ڌڻيءَ جو نالو",
    landlordPan: "گهر ڌڻيءَ جو PAN (10 انگ)",
    selectPdfJpg: "PDF/JPG چونڊيو",
    submitReceipt: "رسيد جمع ڪريو",
    responsePosition: "جواب جو موقف",
    agreeDept: "مان کاتي سان متفق آهيان",
    disagreeProof: "مان متفق نه آهيان (ثبوت جمع ڪريو)",
    responseDraft: "جواب جو بيان (مسودو)",
    dictateStatement: "ڳالهائي درج ڪريو",
    sendResponse: "جواب موڪليو",
    filingStatusLabel: "فائلنگ جي حالت",
    bankValidated: "تصديق ٿيل",
    bankUnderProcess: "جانچ هلي رهي آهي",
    bankFailed: "ناڪام",
    staleIfscHold: "هي بئنڪ ڪوڊ هاڻي ڪيڏانهن به نٿو وڃي۔",
    switchToNewIfsc: (ifsc: string) => `نئين ڪوڊ تي بدلايو (${ifsc})`,
    personalized: {
      eyebrow: "توهان جو ڊيش بورڊ",
      headingFiled: "توهان جي رٽرن جمع ٿي چڪي آهي — هيءَ رهي ان جي حالت",
      heading: {
        file_return: "اچو ته توهان جي رٽرن تيار ڪريون",
        check_refund: "اچو ته ڏسون ڇا پئسا واپس اچي سگهن ٿا",
        understand_notice: "اچو ته ضروري ڪم سنڀاليون",
        correct_prefill: "اچو ته ٻڌايل ڄاڻ جانچيون",
      },
      guidedBody: "هر انگ جي تصديق کان اڳ اسان ان جو مطلب سمجهائينداسين۔",
      quickBody: "رستو ننڍو رهندو ۽ ايندڙ ضروري فيصلو پهرين نظر ايندو۔",
      unfiledBody: "پهرين، توهان بابت اڳ ۾ درج ڄاڻ جي تصديق ڪريو۔",
      filedBody: "توهان جي اچڻ جي مقصد مطابق اسان صحيح حصو پهرين کوليو آهي۔",
      primaryAction: {
        facts: "منهنجي درج ڄاڻ ڏسو",
        overview: "منهنجو رفنڊ ٽريڪر ڏيکاريو",
        statement: "درج ڄاڻ جانچيو",
        actions: "ڏيکاريو ڪهڙي ڳالهه تي ڌيان گهرجي",
      },
      focusLabel: "اسان انهن تي نظر رکنداسين",
      profileLabels: {
        work: "ڪم",
        income: "ڪل اندازي مطابق آمدني",
        history: "فائلنگ جو تجربو",
      },
    },
  },

  onboarding: {
    eyebrow: "شروع ڪرڻ کان اڳ",
    title: "اچو ته هي توهان لاءِ تيار ڪريون۔",
    intro:
      "پنج ننڍا جواب اسان کي صحيح ٻولي، رفتار ۽ ٽيڪس جا سوال چونڊڻ ۾ مدد ڏيندا۔ توهان انهن کي پوءِ بدلائي سگهو ٿا۔",
    languageQuestion: "اسان ڪهڙي ٻوليءَ ۾ ڳالهايون؟",
    languageHelp: "سڀ کان پهرين اهو ئي سوال آهي۔ ٻولي توهان ڪڏهن به بدلائي سگهو ٿا۔",
    intentQuestion: "اڄ توهان هتي ڇو آيا آهيو؟",
    intentHelp: "اسان ان ئي ڪم کي سڀ کان پهرين رکنداسين۔",
    intentOptions: {
      file_return: {
        label: "هن سال جي رٽرن فائل ڪرڻي آهي",
        detail: "توهان بابت جيڪو اڳ ۾ ئي معلوم آهي، اتان کان شروع ڪنداسين۔",
      },
      check_refund: {
        label: "ڏسڻو آهي ته پئسا واپس ملڻا آهن يا نه",
        detail: "ڇا ٻڌايو ويو، ڪيترو ٽيڪس ڪٽيو ۽ ڇا واپس اچي سگهي ٿو، اهو ڏسو۔",
      },
      understand_notice: {
        label: "خط يا نوٽيس سمجهڻو آهي",
        detail: "ان ۾ ڇا لکيل آهي، ڪيترو داءَ تي آهي ۽ اڳتي ڇا ڪرڻو آهي، اهو ڏسو۔",
      },
      correct_prefill: {
        label: "غلط لڳندڙ ڳالهه درست ڪرڻي آهي",
        detail: "انگ جو ماخذ ڳوليو ۽ درج ڪريو ته ڇا بدلجڻ گهرجي۔",
      },
    },
    intentCta: {
      file_return: "منهنجي رٽرن شروع ڪريو",
      check_refund: "ڏسو منهنجو ڇا بڻجي ٿو",
      understand_notice: "ٻڌايو مون کي ڇا ڪرڻو آهي",
      correct_prefill: "جيڪو ٻڌايو ويو آهي ان کي جانچيو",
    },
    situationQuestion: "پنهنجي ٽيڪس واري حالت بابت ٻڌايو۔",
    situationHelp: "هتي ٻه ننڍا جواب ڪافي آهن۔",
    professionLabel: "توهان جي ڪم کي انهن مان ڪهڙو سڀ کان صحيح ٿو ٻڌائي؟",
    professionOptions: {
      salaried: "نوڪري",
      self_employed: "فري لانس يا پنهنجو ڪم",
      business_owner: "ڪاروباري",
      student: "شاگرد",
      retired: "رٽائرڊ",
      investor: "سيڙپڪار",
      other: "ٻيو ڪجهه",
    },
    filingHistoryLabel: "ڇا توهان اڳ ۾ انڪم ٽيڪس رٽرن فائل ڪئي آهي؟",
    filingHistoryOptions: {
      never: "نه، پهريون ڀيرو",
      once: "هڪ يا ٻه ڀيرا",
      every_year: "هر سال",
    },
    incomeQuestion: "سڀني ذريعن مان توهان جي ڪل آمدني لڳ ڀڳ ڪيتري هئي؟",
    incomeHelp: "هن مهل رڳو هڪ اندازو ڪافي آهي۔ صحيح رقم جي اڃا ضرورت ناهي۔",
    incomeOptions: {
      none: "ڪا آمدني ناهي",
      under_4: "₹4 لک کان گهٽ",
      "4_to_8": "₹4 کان ₹8 لک",
      "8_to_12": "₹8 کان ₹12 لک",
      "12_to_25": "₹12 کان ₹25 لک",
      over_25: "₹25 لک کان وڌيڪ",
    },
    modeQuestion: "توهان ڪيترو تفصيل ڏسڻ چاهيو ٿا؟",
    modeHelp: "هي رڳو شروعات طئي ڪري ٿو۔ توهان ڪڏهن به بدلائي سگهو ٿا۔",
    modeOptions: {
      simple: {
        label: "منهنجي لاءِ ڪري ڇڏيو",
        detail: "سادي ٻولي، هڪ وقت ۾ هڪ قدم۔ باقي اسان سنڀالينداسين۔",
      },
      full: {
        label: "مون کي سڀ ڪجهه ڏيکاريو",
        detail: "هر انگ، هر قاعدو، هر حساب — شروع کان ئي۔",
      },
    },
    focusQuestion: "انهن مان ڪهڙين ڳالهين تي ڌيان ڏيون؟",
    focusHelp: "جيڪي توهان تي لاڳو ٿين، سڀ چونڊيو۔ پڪ نه هجي ته پڪ ناهي چونڊيو۔",
    focusOptions: {
      salary: "پگهار يا پينشن",
      freelance: "فري لانس ڪم",
      business: "ڪاروبار جي ڪمائي",
      rent: "ڏنل يا مليل مسواڙ",
      interest: "بئنڪ جو وياج",
      investments: "شيئر يا سيڙپڪاري",
      deductions: "بچت، انشورنس، هوم لون يا NPS",
      not_sure: "اڃا پڪ ناهي",
    },
    chooseOne: "هڪ چونڊيو",
    chooseAtLeastOne: "گهٽ ۾ گهٽ هڪ چونڊيو",
    questionsLabel: "ننڍي تياري",
    questionsProgress: (current: number, total: number) => `${total} مان ${current}`,
    savedLocally: "هن پروٽوٽائپ ۾ توهان جا جواب هن ئي برائوزر ۾ محفوظ ٿين ٿا۔",
    readyTitle: "ايترو هن کي توهان مطابق ٺاهڻ لاءِ ڪافي آهي۔",
    readyBody:
      "انهن جوابن سان اسان طئي ڪنداسين ته توهان کي پهرين ڇا ڏيکارڻو آهي۔ نظام جي آخري چونڊ پوءِ به توهان جي پڪين ڪيل حقيقتن ۽ دعوائن تي ٿيندي۔",
    guidedLabel: "اسان ڪيئن سمجهائينداسين",
    guidedValue: "اسان هلندي هلندي اصطلاح سمجهائيندا هلنداسين۔",
    quickValue: "اسان رستو ننڍو رکنداسين۔",
    regimeLabel: "نظامن سان اسان جو طريقو",
    claimsRegimeValue: "نظام چونڊڻ کان اڳ اسان توهان جون دعوائون جانچينداسين۔",
    compareRegimeValue: "حقيقتون پڪيون ٿيڻ کان پوءِ ٻنهي نظامن جي ڀيٽ ڪنداسين۔",
    focusLabel: "پهرين ڪهڙي ڳالهه تي ڌيان هوندو",
    startPath: "منهنجي واٽ کان شروع ڪريو",
    changeAnswers: "جواب بدلايو",
    tailoredBadge: "توهان جي شروعاتي واٽ",
    tailoredGuided: "سمجهائي اڳتي وڌنداسين",
    tailoredQuick: "ننڍي واٽ",
    tailoredRegimeClaims: "نظام جي چونڊ کان اڳ دعوائن جي جانچ",
    tailoredRegimeCompare: "حقيقتن کان پوءِ ٻنهي نظامن جي ڀيٽ",
    tailoredIntent: (intent: string) => `پهرين: ${intent}`,
  },

  checklist: {
    divider: "داخل ڪرڻ کان اڳ",
    itemBefore: "”",
    itemAfter: "“ جي تصديق ڪريو — شڪ هجي ته ڪارڊ کوليو۔",
    stdRow: "اسان توهان لاءِ جيڪا معياري ڪٽوتي لاڳو ڪئي، ان جي تصديق ڪريو۔",
    noteLocked: "مٿي هر سٽ تي نشان لڳايو، تڏهن ئي هي بٽڻ کلندو۔",
    noteReady: "مٿي سڀ ڪجهه پڪو آهي۔ تيار هجو ته داخل ڪريو۔",
    fileBtn: "هيءَ رٽرن داخل ڪريو",
    lockedBtn: (n: number) =>
      n === 1 ? "پهرين 1 وڌيڪ سٽ تي نشان لڳايو" : `پهرين ${n} وڌيڪ سٽن تي نشان لڳايو`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `ڪارڊ ${String(n).padStart(2, "0")} · درج ${date}`,
    whatThisMeans: "هن جو مطلب ڇا آهي",
    readFirst: "پهرين ”هن جو مطلب ڇا آهي“ کوليو — پوءِ تصديق ڪريو۔",
    readyToConfirm: "پڙهي ورتو؟ هيٺ تصديق ڪريو۔",
  },

  signoff: {
    title: "صحيءَ جي تصديق",
    declaration:
      "مون مٿي ڏنل انگ پڙهيا آهن ۽ ماخذ دستاويزن سان ڀيٽايا آهن۔ اهي صحيح ۽ مڪمل آهن۔",
    action: "انهن انگن تي صحي ڪريو",
    signed: "صحي ٿي وئي — مٿيون هر انگ پڪو آهي۔",
    hint: "هڪ اقرار مٿين سڀني انگن تي لاڳو ٿئي ٿو۔ ڪنهن انگ تي اعتراض هجي ته پهرين ”نه، اهو غلط آهي“ چونڊيو۔",
  },

  channels: {
    sectionLabel: "سال هڪ نظر ۾",
    earned: "توهان ڪمايو",
    toTax: "ٽيڪس ۾ ويو",
    overpaid: "توهان وڌيڪ ڏنو",
    stillToPay: "اڃا ڏيڻو آهي",
    stayed: "توهان کان ڪڏهن ويو ئي نه",
    kept: "جيڪو ٽيڪس بڻبو هو",
    back: "توهان ڏانهن واپس اچي رهيو آهي",
    yoursInEnd: "آخر ۾ توهان جو",
    collected: "اڳ ۾ ئي ڪٽجي چڪو",
    ofYear: "سڄي سال جي پئسن جو",
    sliceNote:
      "جيڪو حصو ڏسڻ جيترو ناهي، ان کي ٿورو ويڪرو ٺاهيو ويو آهي — ڀرسان لکيل انگ بلڪل صحيح آهن۔",
    whereItWent: "توهان جي ڪمائيءَ جو هر روپيو ڪيڏانهن ويو",
    earnedDesc: "پگهار، وياج ۽ باقي سڀ — جيئن ادائيگي ڪندڙن درج ڪيو۔",
    toTaxDesc: "هر حقدار ڪٽوتيءَ کان پوءِ توهان تي اصل ۾ جيڪو ٽيڪس بڻيو۔",
    backDesc:
      "توهان جي پگهار مان ورتو ويو پر ڪڏهن بڻبو ئي نه هو۔ اهو توهان ڏانهن واپس ايندو۔",
    dueDesc: "جيڪو ڪٽجي چڪو ان کان اڳتي جو رهيل۔ اهو اڃا ڏيڻو آهي۔",
    howToRead:
      "هن کي ائين پڙهو: هتي ڪجهه به اسان نه گهڙيو آهي۔ هر انگ ڪنهن داخل ٿيل دستاويز مان آيو آهي يا توهان پاڻ درج ڪيو آهي۔ پينسل نوٽ سمجهائين ٿا ته هر انگ جو اصل مطلب ڇا آهي — سڌن لفظن ۾، ٽيڪس جي لفظن ۾ نه۔",
    meterCap: "جيڪو ٽيڪس بڻيو ڀيٽ ۾ جيڪو اڳ ۾ ئي ڪٽجي چڪو",
  },

  agent: {
    title: "واپسي مددگار",
    open: "مددگار کوليو",
    close: "بند ڪريو",
    placeholder: "جانچڻ، سمجهائڻ يا داخل ڪرڻ لاءِ چئو…",
    send: "موڪليو",
    thinking: "ڪم هلي رهيو آهي…",
    toolRan: "ڪيو:",
    confirmTitle: "داخل ڪرڻ لاءِ تيار — انگ جانچيو",
    confirmBody: "توهان جي تصديق کان سواءِ ڪجهه به داخل نه ٿيندو۔ هي جمع ٿيندو:",
    confirmTotalTax: "ڪل ٽيڪس",
    confirmRefund: "توهان کي ملندڙ رفنڊ",
    confirmDue: "ڏيڻ جوڳي رقم",
    confirmTaxable: "ٽيڪس لائق آمدني",
    confirmButton: "تصديق ڪريو ۽ داخل ڪريو",
    cancelButton: "رد ڪريو",
    filingDismissed: "ٺيڪ آهي — ڪجهه به داخل نه ٿيو۔",
    error: "مددگار تائين پهچ نه ٿي سگهي۔ توهان جي رٽرن جيئن جو تيئن آهي — ٻيهر ڪوشش ڪريو۔",
    intro:
      "مان توهان جي رٽرن جانچي سگهان ٿو، ڪو به انگ سمجهائي سگهان ٿو، جيڪڏهن-ائين وارا حساب لڳائي سگهان ٿو ۽ داخلي جي تياري ڪري سگهان ٿو۔ داخلا هميشه توهان جي تصديق کان پوءِ ئي ٿيندي آهي۔",
    sample: "80C ۾ ₹1,50,000 وجهڻ سان منهنجي ڪيتري بچت ٿيندي؟",
  },

  footer: {
    prototype: "آزاد تصوراتي پروٽوٽائپ۔",
    notAffiliated:
      "هي انڪم ٽيڪس کاتي، CBDT يا ڀارت سرڪار سان لاڳاپيل، انهن پاران منظور ٿيل يا انهن سان واسطو رکندڙ ناهي۔ هتي ڏنل هر نالو، PAN، رقم ۽ دستاويز ٺاهيل آهي۔ ڪنهن به سرڪاري سسٽم سان رابطو نٿو ڪيو وڃي۔",
    honestyLink: "ڏسو ڇا اصلي آهي ۽ ڇا ٺاهيل",
  },
};

/**
 * Sindhi values for the mock-screen strings in
 * components/mock-i18n.ts (LOCALIZED_MOCK_STRINGS). Keys are the byte-exact
 * English strings. Model-generated; awaits native-speaker review (T0.5).
 */
export const sdMock: Record<string, string> = {
  "Your pay last year": "گذريل سال توهان جي پگهار",
  "Interest your savings account earned": "بچت اڪائونٽ مان ڪمايل وياج",
  "Interest your accounts earned": "توهان جي اڪائونٽن مان ڪمايل وياج",
  "Your primary contract income": "توهان جي بنيادي ڪانٽريڪٽ آمدني",
  "Savings interest": "بچت اڪائونٽ جو وياج",
  "Tax withheld (TDS)": "اڳ ۾ ڪٽيل ٽيڪس (TDS)",
  "Provident Fund / ELSS Mutual Funds": "پراويڊنٽ فنڊ / ELSS ميوچل فنڊ",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "سندس پگهار مان ₹8,400 ڪٽيا ويا۔ کيس ڪجهه به ڏيڻو ناهي۔ اڃا فائل نه ڪيو اٿس، ۽ اسڪول جي في ڏيڻي آهي۔",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "ٻه نوٽيس آهن۔ هڪ چوي ٿو ته هن ₹1,10,000 جو شيئر نفعو لڪايو — اصل ۾ کيس ₹4,200 جو نقصان ٿيو۔ ٻيو 2019 جي ان بل لاءِ رفنڊ جو حصو رکڻ چاهي ٿو جنهن بابت کيس ڪڏهن خبر ئي نه هئي۔",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 ڏينهن اڳ فائل ڪيائين۔ پورٽل تي 'ڪارروائي هلندڙ' کان سواءِ ڪجهه نٿو ڏسجي۔ اصل ۾ ٻه ڌار ڌار شيون سندس ₹34,800 روڪي رهيون آهن۔",
  "Tax already taken out of your pay": "پگهار مان اڳ ۾ ئي ڪٽيل ٽيڪس (TDS)",
  "Dividend your shares paid out": "شيئرن مان مليل ڊيويڊنڊ",
  "Money from selling shares": "شيئر وڪڻڻ مان مليل پئسا",
  "Tax the bank withheld on your interest": "وياج تي بئنڪ پاران ڪٽيل ٽيڪس (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "پراويڊنٽ فنڊ (PF)، انشورنس ۽ ڌيءَ جي ٽيوشن في",
  "Provident fund and your insurance premium":
    "پراويڊنٽ فنڊ (PF) ۽ توهان جو انشورنس پريميئم",
  "Health cover for the family": "ڪٽنب لاءِ صحت جو انشورنس",
  "Rent you paid, with no house-rent allowance from your employer":
    "توهان جي ڏنل مسواڙ (نوڪري ڏيندڙ کان گهر مسواڙ الائونس کان سواءِ)",
  "One figure doesn't match what your broker reported.":
    "هڪ انگ توهان جي بروڪر جي درج ڪيل انگ سان نٿو ملي۔",
  "₹18,740 of this is being held against an old bill.":
    "ان مان ₹18,740 هڪ پراڻي بل جي بدلي روڪيا پيا وڃن۔",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "کاتو سمجهي ٿو ته توهان ₹1,10,000 جو شيئر نفعو ڇڏي ڏنو آهي۔",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "کاتو 2019 جي بل جي نبيري لاءِ توهان جي رفنڊ مان ₹18,740 رکڻ چاهي ٿو۔",
  "Waiting on one thing: a receipt for your rent claim.":
    "هڪ شيءِ جو انتظار آهي: توهان جي مسواڙ واري دعويٰ جي رسيد۔",
  "The account you chose can't receive the money.":
    "توهان جي چونڊيل اڪائونٽ ۾ پئسا وڃي نٿا سگهن۔",
  "Held: your rent claim needs a receipt.":
    "روڪيل: توهان جي مسواڙ واري دعويٰ لاءِ رسيد گهرجي۔",
  "Your bank account was checked and failed.":
    "توهان جي بئنڪ اڪائونٽ جي جانچ ٿي ۽ اها ناڪام وئي۔",
  "The department is asking you to look again at your rent claim.":
    "کاتو توهان کان پنهنجي مسواڙ واري دعويٰ ٻيهر ڏسڻ لاءِ چئي رهيو آهي۔",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities شيئرن جي وڪري مان ₹1,10,000 درج ڪيا۔ توهان جي رٽرن اهو نٿي ڏيکاري۔ جيستائين اهو نبري نٿو، رفنڊ اتي ئي رهندو۔",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 جي هڪ گهُر هن سال جي رفنڊ مان ڪٽي پئي وڃي۔ توهان ان تي اعتراض ڪري سگهو ٿا، ۽ 3 تاريخ کان اڳ اهو پڙهي وٺڻ گهرجي۔",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "جيڪڏهن توهان 10 سيپٽمبر تائين ڪجهه نٿا چئو، ته ₹1,10,000 توهان جي آمدنيءَ ۾ شامل ٿي ويندا ۽ توهان جي رفنڊ مان لڳ ڀڳ ₹34,300 ڪٽجي ويندا۔",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "جيڪڏهن توهان 3 سيپٽمبر تائين ڪجهه نٿا چئو، ته توهان جي رفنڊ مان ₹18,740 ڪٽيا ويندا ۽ معاملو بند ليکيو ويندو۔",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "توهان ₹1,10,000 جا شيئر وڪيا ۽ انهن تي ٿيل نفعو ظاهر نه ڪيو۔",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 منهنجي وڪيل هر شيءِ جي ڪل قيمت آهي، منهنجو نفعو نه۔ انهن سودن ۾ مون کي ₹4,200 جو نقصان ٿيو۔ سال جو منهنجو بروڪر گوشوارو خريد جون قيمتون ڏيکاري ٿو۔",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "توهان تي 2019-20 جا ₹18,740 اڃا رهيل آهن، ان ڪري اهي هن سال جي رفنڊ مان ورتا ويندا۔",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "توهان ₹60,000 جي مسواڙ جي دعويٰ ڪئي۔ ان کي ڏيکارڻ لاءِ ڪجهه به شامل نه هو۔ رسيد يا گهر ڌڻيءَ جو نالو ۽ PAN شامل ڪريو، ته هي اڳتي وڌندو۔",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank گذريل سال Deccan Union Bank جو حصو بڻجي ويو۔ اڪائونٽ اڃا موجود آهي — پر ان تائين پئسا پهچائيندڙ ڪوڊ نه۔",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "توهان 80GG هيٺ ₹60,000 جي مسواڙ جي دعويٰ ڪئي، پر ثابتيءَ لاءِ ڪجهه به شامل نه ڪيو۔",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "مون اها مسواڙ ڏني آهي۔ مون وٽ گهر ڌڻيءَ جون مهيني وار رسيدون آهن ۽ مان سندن نالو ۽ PAN ڏئي سگهان ٿو/ٿي۔",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "هي ڪو الزام ناهي ۽ اڃا ڪو ڏنڊ به ناهي۔ پر توهان جا ₹34,800 اتي ئي رهندا جيستائين توهان دعويٰ جو ثبوت نٿا ڏيو يا ان کي واپس نٿا وٺو۔",
  "Look at what they reported": "ڏسو انهن ڇا درج ڪيو",
  "Read the 2019 demand": "2019 جي گهُر پڙهو",
  "Add the receipt": "رسيد شامل ڪريو",
  "Point it at the right account": "ان کي صحيح اڪائونٽ ڏانهن موڙيو",
  "Supervisor, garment unit": "سپروائيزر، گارمينٽ يونٽ",
  "Operations manager; trades equity on the side":
    "آپريشنز مئنيجر؛ ساڻ ساڻ شيئرن جو ڏي وٺ",
  "Junior architect; first time filing":
    "جونيئر آرڪيٽيڪٽ؛ پهريون ڀيرو فائل ڪري رهي آهي",
  "Independent Consultant": "آزاد صلاحڪار",
  "Primary School Teacher": "پرائمري اسڪول استاد",
  "Retired bank clerk": "رٽائرڊ بئنڪ ڪلارڪ",
  "Retired": "رٽائرڊ",
  "Teacher": "استاد",
  "You sent your return in.": "توهان پنهنجي رٽرن موڪلي ڇڏي۔",
  "You confirmed it was you. The return counts from here.":
    "توهان تصديق ڪئي ته هي توهان ئي آهيو۔ رٽرن هتان کان ڳڻبي۔",
  "In the queue with everything else filed that week.":
    "ان هفتي داخل ٿيل باقي سڀني سان گڏ قطار ۾۔",
  "Someone is looking at one figure.": "ڪو هڪ انگ کي ڏسي رهيو آهي۔",
  "A share-sale row your broker filed doesn't line up with your return.":
    "توهان جي بروڪر جي داخل ڪيل شيئر وڪري جي هڪ سٽ توهان جي رٽرن سان نٿي ملي۔",
  "OTP verified, 4 minutes after filing.": "OTP تصديق ٿيو، داخل ڪرڻ کان 4 منٽ پوءِ۔",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG هيٺ ₹60,000 جي دعويٰ، ثابتيءَ لاءِ ڪجهه به شامل ناهي۔",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank جانچ واپس موٽائي: IFSC GODG0004417 هاڻي ڪيڏانهن به نٿو وڃي۔",
  "OTP Verification Complete": "OTP تصديق مڪمل",
  "Outstanding Compliance Notices": "رهيل تعميلي نوٽيس",
  "Draft Legal Response": "قانوني جواب جو مسودو ٺاهيو",
  "No Pending Actions": "ڪا ڪارروائي باقي ناهي",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "توهان جو اڪائونٽ مڪمل طور درست آهي — ڪو رهيل نوٽيس يا ٽيڪس جي گهُر ناهي۔",
  "Actionable Assessment Holds": "ڪارروائي گهرندڙ جائزي جون رڪاوٽون",
  "Upload Rent Agreement / Receipts": "مسواڙ نامو / رسيدون اپلوڊ ڪريو",
  "Landlord Name": "گهر ڌڻيءَ جو نالو",
  "Landlord PAN (10 Digits)": "گهر ڌڻيءَ جو PAN (10 انگ)",
  "Select PDF/JPG": "PDF/JPG چونڊيو",
  "Submit Receipt": "رسيد جمع ڪريو",
  "Response Position": "جواب جو موقف",
  "I Agree with Department": "مان کاتي سان متفق آهيان",
  "I Disagree (Submit Proof)": "مان متفق نه آهيان (ثبوت جمع ڪريو)",
  "Response Statement (Draft)": "جواب جو بيان (مسودو)",
  "Dictate Statement": "ڳالهائي بيان لکرايو",
  "Listening...": "ٻڌي رهيا آهيون...",
  "Explain your disagreement or agreement...": "پنهنجي اتفاق يا اختلاف جي وضاحت ڪريو...",
  "Send Response": "جواب موڪليو",
  "Cancel": "رد ڪريو",
  "Validate Bank Code": "بئنڪ ڪوڊ جي تصديق ڪريو",
  "Update Bank IFSC": "بئنڪ IFSC اپڊيٽ ڪريو",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "بئنڪ تفصيلن جي تصديق لاءِ 11 اکرن جو بئنڪ روٽنگ ڪوڊ (IFSC) جانچيو۔",
  "IFSC Code": "IFSC ڪوڊ",
};

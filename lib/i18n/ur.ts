/**
 * اردو (Urdu). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and awaits review by a native Urdu
 * speaker who knows tax vocabulary (project task T0.5). That limitation is
 * real and is disclosed rather than hidden.
 *
 * dir is "rtl". Digits stay Latin (0-9), never Arabic-Indic numerals — money
 * must be instantly legible, and Indian users read amounts in Latin digits.
 * ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes and persona/bank
 * names stay in Latin script; they render as embedded LTR runs, which is
 * expected. hi.ts precedent is followed for what stays untranslated.
 */

import type { Dict } from "./en";

export const ur: Dict = {
  langName: "Urdu",
  langNativeName: "اردو",
  dir: "rtl",

  common: {
    modeSimple: "سادہ",
    modeDetailed: "تفصیلی",
    continue: "آگے بڑھیں",
    back: "پیچھے",
    yesThatsRight: "ہاں، یہ ٹھیک ہے",
    noThisIsWrong: "نہیں، یہ غلط ہے",
    iDontUnderstand: "مجھے یہ سمجھ نہیں آیا",
    close: "بند کریں",
    saveAndGoOn: "محفوظ کریں اور آگے بڑھیں",
    loading: "ذرا ٹھہریے",
    logOut: "لاگ آؤٹ",
    undo: "واپس لیں",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "واپسی",
    subtitle: "جانچنے اور فائل کرنے کا آسان طریقہ",
    independent: "آزاد پروٹوٹائپ",
    taxYear: "ٹیکس سال 2026-27",
    language: "زبان",
    light: "لائٹ",
    dark: "ڈارک",
    sandbox: "جائزہ ٹولز",
  },

  validate: {
    panTooShort: (n: number) => `ابھی ${n} حروف ہیں۔ PAN میں 10 ہوتے ہیں۔`,
    panShape:
      "PAN میں پہلے پانچ حروف، پھر چار ہندسے، پھر ایک حرف ہوتا ہے — جیسے DEMPS4417K۔",
    panSandboxHint:
      "آپ یہاں جو بھی لکھتے ہیں وہ آپ کے براؤزر سے باہر نہیں جاتا۔ اس پروٹوٹائپ میں ہر PAN DEMP سے شروع ہوتا ہے، اس لیے کوئی اصلی PAN غلطی سے تلاش نہیں ہو سکتا۔",
    ifscTooShort: (n: number) => `ابھی ${n} حروف ہیں۔ بینک کوڈ میں 11 ہوتے ہیں۔`,
    ifscShape:
      "بینک کوڈ میں پہلے چار حروف، پھر ایک صفر، پھر چھ اور — جیسے DECU0834471۔",
  },

  landing: {
    question: "کیا محکمہ انکم ٹیکس کے پاس آپ کا پیسہ رکا ہوا ہے؟",
    subtext:
      "یہاں آنے والے زیادہ تر لوگوں کو کچھ دینا نہیں ہوتا — انہیں ملنا ہوتا ہے۔ اپنا PAN ڈالیں، ہم بتا دیں گے کہ کیا رکا ہے۔",
    panLabel: "آپ کا PAN",
    panHelp: "دس حروف، آپ کے PAN کارڈ سے",
    panPlaceholder: "مثلاً، DEMPS4417K",
    check: "دیکھیں میرا کتنا بنتا ہے",
    orTryAs: "یا تین لوگوں میں سے کسی ایک کی طرح دیکھیں",
    honestyLink: "یہاں کیا اصلی ہے اور کیا بنایا ہوا",
    architectureLink: "تکنیکی بناوٹ",
    badge: "سادہ ریٹرن، آزمایا ہوا",
    brandTitle: "آپ کا پیسہ، واپسی کی راہ پر۔",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "فائل کرنا",
      blurb:
        "اس کی تنخواہ سے ₹8,400 کاٹ لیے گئے۔ اسے کچھ دینا نہیں، اس نے فائل نہیں کیا، اور اسکول کی فیس دینی ہے۔",
      action: "جو پہلے سے معلوم ہے اس کی تصدیق کریں",
    },
    rakesh: {
      phase: "ایک خط آیا",
      blurb:
        "خط کہتا ہے کہ اس نے شیئرز کا ₹1,10,000 کا منافع چھپایا۔ اس کا ریفنڈ ایک پرانے مطالبے کے بدلے روک لیا گیا ہے، جس کی اسے کبھی خبر ہی نہیں دی گئی۔",
      action: "پڑھیں اور اختلاف کریں",
    },
    priya: {
      phase: "انتظار",
      blurb:
        "71 دن پہلے فائل کیا۔ اب بھی لکھا ہے کہ کارروائی جاری ہے۔ اصل میں دو چیزیں روک رہی ہیں، اور کسی نے نہیں بتایا کون سی۔",
      action: "دیکھیں کیا روک رہا ہے",
    },
    custom: {
      phase: "اپنا بنائیں",
      blurbTitle: "بنایا ہوا کوئی",
      blurb:
        "شروع سے ایک شخص بنائیں — اس کی کمائی، اس کے دعوے، اس سے کٹا ٹیکس — اور دیکھیں کہ حساب خود بخود کیسے بنتا ہے۔",
      action: "کوئی بنا لیں",
    },
  },

  login: {
    authVerifying: "سرور سے جانچ ہو رہی ہے…",
    authUnreachable:
      "سائن اِن سرور تک رسائی نہیں ہو سکی۔ آپ کا بھرا ہوا کچھ بھی ضائع نہیں ہوا — تھوڑی دیر بعد پھر کوشش کریں۔",
    authRejected: (detail: string) => `سرور نے سائن اِن نہیں ہونے دیا: ${detail}`,
    signedInAs: "سائن اِن ہو گئے — سیشن فعال ہے",
    otpSentTo: (mobile: string) => `ہم نے ${mobile} پر ایک کوڈ بھیجا ہے`,
    otpLabel: "چھ ہندسوں کا کوڈ",
    weWillWait:
      "کوئی جلدی نہیں۔ کوڈ کے انتظار کے دوران آپ کا بھرا ہوا کچھ بھی ضائع نہیں ہوگا۔",
    resend: "دوبارہ بھیجیں",
    resendIn: (seconds: number) => `${seconds} سیکنڈ بعد دوبارہ مانگ سکتے ہیں`,
    mockNotice:
      "یہ ایک پروٹوٹائپ ہے، اس لیے کوڈ اسکرین پر ہی دکھایا گیا ہے۔ کوئی اصلی پیغام نہیں بھیجا جاتا۔",
    portalHeading: "ای-فائلنگ تصدیق",
    incorrectCode: "یہ کوڈ نہیں ملتا۔ چھ ہندسے پھر جانچیں اور دوبارہ کوشش کریں۔",
    prototypeBox: "پروٹوٹائپ OTP تصدیق",
    mockCodeLabel: "فرضی کوڈ",
    autoFill: "میرے لیے بھر دیں",
    verifyEnter: "تصدیق کریں اور اندر جائیں",
    draftRestored: (time: string) =>
      `آپ کا ${time} والا مسودہ واپس لایا گیا۔ کچھ بھی ضائع نہیں ہوا۔`,
  },

  file: {
    heading: (amount: string) => `آپ کے ${amount} محکمے کے پاس پڑے ہیں`,
    subheading:
      "نیچے لکھی تقریباً ہر بات آپ کے بارے میں پہلے ہی بتائی جا چکی ہے۔ اسے پڑھیں، اور کچھ غلط ہو تو ہمیں بتائیں۔",

    checkThis: "اسے جانچ لیں — بھرنا نہیں پڑے گا",
    factMeaning:
      "یہ پہلے سے بتائی گئی بات ہے، ٹیکس کا قاعدہ نہیں۔ اسی سے نیچے کا حساب بنتا ہے۔",
    factMeaningByKind: {
      salary:
        "آپ کے آجر نے آپ تک پہنچی تنخواہ سے یہ درج کیا۔ نیچے کا سارا حساب یہیں سے شروع ہوتا ہے۔",
      interest:
        "بینک سال میں ایک بار آپ کے کھاتوں کا سود درج کرتے ہیں۔ چھوٹی رقم بھی آمدنی ہے۔",
      dividend:
        "کمپنی کے رجسٹرار نے درج کیا کہ آپ کے شیئرز نے کیا دیا۔ جس سال ملا، اسی سال کی آمدنی گنا جاتا ہے۔",
      capital_gains:
        "آپ کے بروکر نے شیئر بیچنے سے ملا پیسہ درج کیا۔ ٹیکس منافع پر لگتا ہے — شرح اس پر منحصر ہے کہ کیا بیچا اور کتنے عرصے رکھا۔",
      rent:
        "ملا ہوا کرایہ آمدنی ہے؛ دیا ہوا کرایہ ٹیکس گھٹا سکتا ہے۔ دونوں صورتوں میں یہ دوسری طرف کے درج اعداد سے ملنا چاہیے۔",
      other:
        "ایسی درج آمدنی جو کسی اور خانے میں نہیں آتی۔ یہ بھی نیچے کے حساب میں شامل ہوتی ہے۔",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} نے ${date} کو محکمے کو یہ بتایا`,
    underIdentifier: (identifier: string) => `رجسٹریشن ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `اگر یہ غلط ہے تو اصل جگہ پر اسے صرف ${reporter} ہی بدل سکتے ہیں۔ ہم بتا دیں گے کہ ان سے بالکل کیا مانگنا ہے۔`,

    whatYouEarned: "آپ نے کتنا کمایا",
    whatWasDeducted: "ٹیکس پہلے ہی کتنا کٹا",
    whereMoneyGoes: "پیسہ کہاں جائے گا",
    whoYouAre: "آپ کون ہیں",

    disputeHeading: "اس میں کیا لکھا ہونا چاہیے؟",
    disputeAmountLabel: "صحیح رقم",
    disputeReasonLabel: "یہ غلط کیوں ہے",
    disputeSave: "اسے غلط بتائیں",
    selfReported: "آپ",
    returnLabel: "آپ کا ریٹرن",

    outcomeOwesNothing: "آپ کو کچھ نہیں دینا۔",
    outcomeRefund: (amount: string) => `${amount} آپ کو واپس ملیں گے۔`,
    outcomeOwes: (amount: string) => `${amount} دینا باقی ہے۔`,
    confirmAndFile: "اسے بھیج دیں",

    verifyHeading: "بس ایک قدم باقی ہے، ورنہ یہ گنا نہیں جائے گا۔",
    verifyBody:
      "جب تک آپ تصدیق نہیں کرتے کہ یہ آپ ہی ہیں، آپ کا ریٹرن داخل نہیں مانا جاتا — جیسے آپ نے بھیجا ہی نہیں۔ اس میں تقریباً بیس سیکنڈ لگتے ہیں۔",
    verifyAction: "تصدیق کریں کہ یہ میں ہوں",

    voicePrompt: "یا بول کر بتا دیں",
    voiceListening: "سن رہے ہیں",
    voiceUnsupported:
      "اس فون کا براؤزر ابھی سن نہیں سکتا۔ آپ لکھ کر بتا سکتے ہیں — کچھ ضائع نہیں ہوگا۔",
    voiceSimulated:
      "یہ براؤزر سن نہیں سکتا، اس لیے یہ ایک مثال ہے، آپ کی آواز نہیں۔",
    voiceError: "یہ سنائی نہیں دیا۔ آپ لکھ کر بتا سکتے ہیں — کچھ ضائع نہیں ہوگا۔",
    dictate: "بول کر بتائیں",
    disputePlaceholder: "یہ عدد غلط کیوں ہے — لکھیں یا بولیں۔",
    disputeDefaultReason: "بتایا گیا عدد غلط ہے",
  },

  flow: {
    facts: "آپ کا پیسہ",
    deductions: "وہ پیسہ جو آپ مانگ سکتے ہیں",
    regime: "پرانا یا نیا",
    check: "جانچ لیں",
    file: "بھیج دیں",
    stepOf: (n: number, total: number) => `قدم ${n}، کل ${total}`,
    confirmedCount: (done: number, total: number) => `${total} میں سے ${done} پکے`,
    allConfirmed: "سب کچھ ٹھیک ٹھاک ہے۔",
    undoOne: "یہ اصلاح واپس لیں",
    correctedTo: (amount: string) => `آپ کہتے ہیں یہ ${amount} ہونا چاہیے`,
  },

  groups: {
    moneyIn: "آنے والا پیسہ",
    taxPaid: "آپ کے لیے پہلے ہی کٹا ٹیکس",
    deductionsClaimed: "آپ کے دعوے",
    fromWhere: "یہ کہاں سے آیا",
    addIncome: "آمدنی شامل کریں",
  },

  deductions: {
    notAllowedNewRegime:
      "نئے نظام میں نہیں گنا جاتا — آپ کے ریکارڈ میں محفوظ ہے۔",
    startedAtCap: (amount: string) =>
      `ہم نے اسے ${amount} کی حد سے شروع کیا — ”کتنا“ میں وہ رقم ڈالیں جو آپ نے اصل میں دی۔`,
    heading: "وہ پیسہ جو آپ مانگ سکتے ہیں",
    sub: "یہ خود بخود نہیں ہوتے۔ آپ کو ہاں کہنی پڑتی ہے — مگر تبھی، جب سچ ہو۔",
    claimedHeading: "آپ کے ریٹرن میں پہلے سے",
    worthUpTo: (amount: string) =>
      `آپ کی قابلِ ٹیکس آمدنی میں سے ${amount} تک کم ہو سکتا ہے`,
    worthWhatYouPaid: "اتنا ہی جتنا آپ نے اصل میں دیا — صحیح رقم بھریں",
    askRentQ: "کیا آپ رہائش کا کرایہ دیتے ہیں؟",
    askRentWhy:
      "اگر آپ کرایہ دیتے ہیں اور آجر سے مکان کے کرائے کا الاؤنس نہیں ملتا، تو اس کا کچھ حصہ آپ کی قابلِ ٹیکس آمدنی میں سے گھٹ سکتا ہے۔",
    askHealthQ: "کیا آپ اپنے خاندان کا ہیلتھ انشورنس خود ادا کرتے ہیں؟",
    askHealthWhy:
      "خاندان کا انشورنس رکھنے کے لیے جو آپ ادا کرتے ہیں، وہ آپ کی قابلِ ٹیکس آمدنی میں سے گھٹ سکتا ہے۔",
    ask80cQ: "کیا آپ پراویڈنٹ فنڈ، لائف انشورنس یا اسکول کی فیس میں پیسہ لگاتے ہیں؟",
    ask80cWhy:
      "ایسی طویل مدتی بچت ایک مشترکہ حد میں گنی جاتی ہے، اور جتنا آپ ڈالتے ہیں اتنا قابلِ ٹیکس آمدنی میں سے گھٹتا ہے۔",
    claimIt: "ہاں — یہ مانگنا ہے",
    skipIt: "نہیں — یہ چھوڑ دیں",
    amountLabel: "کتنا",
    evidenceAttached: "ثبوت منسلک ہے",
    evidenceMissing:
      "ابھی کوئی ثبوت منسلک نہیں — فی الحال ٹھیک ہے۔ رسیدیں سنبھال کر رکھیں؛ محکمہ بعد میں مانگ سکتا ہے۔",
    newRegimeNoEffect:
      "نئے نظام میں اس دعوے سے کچھ نہیں بدلتا — وہاں یہ تسلیم نہیں کیا جاتا۔",
    oldRegimeSaves: (amount: string) =>
      `پرانے نظام میں یہ آپ کا ٹیکس تقریباً ${amount} گھٹا دیتا۔`,
  },

  regime: {
    heading: "ٹیکس دو طریقوں سے لگ سکتا ہے۔ ایک آپ کے لیے بہتر ہے۔",
    newRegimeName: "نیا نظام",
    oldRegimeName: "پرانا نظام",
    refundLabel: "آپ کو واپس ملے گا",
    dueLabel: "دینا باقی",
    recommendedBadge: "آپ کے لیے بہتر",
    reasoningOldDeductions: (x: string, y: string) =>
      `آپ کے دعوے کل ${x} کے ہیں، اس لیے پرانا نظام آپ کے تقریباً ${y} بچا دیتا ہے۔`,
    reasoningNewDefault: (y: string) =>
      `آپ کے دعوے یہاں زیادہ فرق نہیں ڈالتے، اس لیے نئے نظام کی کم شرحیں آپ کے تقریباً ${y} بچا دیتی ہیں۔`,
    acceptRecommendation: "جو میرے لیے بہتر ہے، وہی چنیں",
    overrideNote: "آپ کوئی بھی چن سکتے ہیں۔ یہاں کچھ چھپا یا بند نہیں ہے۔",
  },

  check: {
    newRegimeClaimsZero:
      "آپ کے دعوے درج اور محفوظ ہیں — نیا نظام ان کی اجازت نہیں دیتا، اسی لیے یہ سطر ₹0 ہے۔",
    badgeReportedBy: (reporter: string) => `${reporter} نے درج کیا`,
    badgeYouEntered: "آپ نے درج کیا",
    badgeWeApplied: "ہم نے آپ کے لیے لاگو کیا",
    heading: "پورا ریٹرن، ایک ہی صفحے پر",
    sub: "ہر عدد کہیں سے آیا ہے۔ کوئی بھی سطر کھولیں اور ٹھیک ٹھیک دیکھیں کہ کہاں سے۔",
    grossIncome: "جو کچھ آیا",
    standardDeduction: "معیاری کٹوتی",
    deductionsLine: "آپ کے دعوے",
    taxableIncome: "جس پر ٹیکس اصل میں لگتا ہے",
    slabTax: "کسی رعایت سے پہلے کا ٹیکس",
    rebate87A: "چھوٹ جو اس کا کچھ حصہ منسوخ کرتی ہے",
    cess: "صحت و تعلیم کا اضافہ",
    totalTax: "سال کا کل ٹیکس",
    tdsCredits: "پہلے ہی آپ سے کٹ چکا",
    refundDue: "آپ کو واپس ملے گا",
    balanceDue: "دینا باقی",
    openLine: "دیکھیں یہ کہاں سے آیا",
    closeLine: "چھپائیں",
    calculationStatus:
      "یہ پروٹوٹائپ کا حساب ہے — قواعد کے ماخذ کی ابھی بنیادی ماخذ سے جانچ باقی ہے (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} نیچے دیے گئے پکے کیے گئے حقائق اور ٹیکس کریڈٹس سے نکلا ہے۔ اس پروٹوٹائپ میں ماخذ ریکارڈ فرضی ہیں۔`,
    showCalculationTrail: "ماخذ اور حساب کی کڑی دیکھیں",
    hideCalculationTrail: "ماخذ اور حساب کی کڑی چھپائیں",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} کو درج ہوا`,
    sourceIdentifier: (identifier: string) => `ریکارڈ ${identifier}`,
    selfReportedSource: "اس ریٹرن میں آپ کی طرف سے بتایا گیا",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: رپورٹ کرنے والے اداروں سے ملی معلومات کا سالانہ گوشوارہ۔"
        : statement === "26AS"
        ? "Form 26AS: آپ کے PAN پر درج ٹیکس کریڈٹ کا گوشوارہ۔"
        : "اس حقیقت سے جڑا ماخذ ریکارڈ۔",
    sectionMeaning: (section: string) =>
      `${section} کٹوتی کا ایک سیکشن ہے۔ یہ تبھی گنا جاتا ہے جب یہ نظام اس کی اجازت دے۔`,
    explainGross: "آپ کے جانچے اور پکے کیے گئے حقائق کو جوڑ کر۔",
    explainStd: (amount: string) =>
      `تنخواہ والے ہر شخص کو ${amount} بغیر مانگے ہی گھٹ جاتے ہیں۔`,
    explainDeductions: "صرف وہی دعوے گنے جاتے ہیں جو اس نظام میں تسلیم ہوتے ہیں۔",
    explainDisallowed: (section: string) =>
      `${section} اس نظام میں تسلیم نہیں، اس لیے یہاں اس کا کوئی اثر نہیں۔`,
    explainTaxable: "جو آیا، اس میں سے معیاری کٹوتی اور آپ کے دعوے گھٹا کر۔",
    explainSlab: "ٹیکس تہوں میں لگتا ہے — آمدنی کی ہر تہ پر اپنی شرح۔",
    explainRebate: (amount: string) =>
      `ایک حد سے نیچے زیادہ تر ٹیکس منسوخ ہو جاتا ہے — یہاں ${amount}۔`,
    explainCess: "ہر رعایت کے بعد اوپر سے لگنے والا چھوٹا فیصد۔",
    explainTds:
      "TDS کا مطلب ہے ماخذ پر کٹا ٹیکس: جس نے پیسہ دیا، اس نے آپ تک پہنچنے سے پہلے یہ روک لیا۔",
    fromFacts: "انہی حقائق سے:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "بھیجنے کے لیے تیار ہیں؟",
    sub: "ایک بار چلا گیا تو بدلنے کا مطلب ہے دوبارہ فائل کرنا۔ ایک بار اور دیکھ لیں، پھر بھیجیں۔",
    stepChecking: "حساب جانچ رہے ہیں…",
    stepSealing: "اعداد سیل کر رہے ہیں…",
    stepFiled: "داخل ہو گیا۔",
    ackHeading: "جمع ہو گیا۔",
    ackBody:
      "آپ کا ریٹرن آج سے گنا جائے گا۔ ایک قدم باقی ہے: پوچھے جانے پر تصدیق کرنا کہ یہ واقعی آپ ہی ہیں۔ تب تک یہ بھیجا ہوا نہیں گنا جاتا۔",
    ackNext:
      "اس کے بعد ٹریکر ٹھیک ٹھیک دکھائے گا کہ آپ کا پیسہ کہاں ہے اور کیا اسے روک سکتا ہے۔",
    errorCause: "جانچ کا قدم اس لیے رکا کیونکہ سینڈباکس کا fault سوئچ آن ہے۔",
    errorAction:
      "ریویوئر دراز میں 'Trigger API Gateway Timeout' بند کریں، پھر دوبارہ بھیجیں۔ کچھ ضائع نہیں ہوا۔",
    errorCauseNetwork: "آپ کا ریٹرن سرور تک نہیں پہنچا۔",
    errorActionNetwork:
      "کچھ بھی داخل نہیں ہوا اور کچھ بھی ضائع نہیں ہوا۔ کنکشن جانچیں، پھر دوبارہ بھیجیں۔",
    retry: "پھر بھیجنے کی کوشش کریں",
  },

  wizard: {
    identityNextHint: "آگے بڑھنے کے لیے اپنا پورا نام اور 10 حروف کا PAN درج کریں۔",
    employmentConfirmHint: "آپ کے پہلے جواب سے — بدل گیا ہو تو دوسرا آپشن چنیں۔",
    tdsZeroWarning:
      "تنخواہ والی نوکری میں تقریباً ہمیشہ ٹیکس پہلے سے کٹا ہوتا ہے — یہ آپ کے فارم 16 یا تنخواہ کی پرچی پر ہوتا ہے۔ یہاں 0 لکھنے کا مطلب اکثر اپنا ریفنڈ چھوڑ دینا ہوتا ہے۔",
  },

  timeline: {
    filed: "آپ نے اپنا ریٹرن بھیج دیا۔",
    verified: "آپ نے تصدیق کی کہ یہ آپ ہی ہیں۔ ریٹرن یہیں سے گنا جائے گا۔",
    in_queue: "اس ہفتے داخل ہونے والے باقی سب کے ساتھ قطار میں۔",
    under_review: "اب کوئی اسے دیکھ رہا ہے۔",
    determined: "فیصلہ ہو گیا — اتنا واپس آئے گا۔",
    sent_to_bank: "آپ کے بینک کو بھیج دیا۔",
    credited: "آپ کے کھاتے میں۔",
  },

  refund: {
    heading: (amount: string) => `${amount} آپ کی طرف آ رہے ہیں`,
    filedDaysAgo: (days: number) => `آپ نے ${days} دن پہلے بھیجا تھا`,

    holdsHeading: (n: number) =>
      n === 1 ? "ایک چیز کا انتظار ہے" : `${n} چیزوں کا انتظار ہے`,
    clearsInDays: (days: number) =>
      days === 1 ? "وہ ہوتے ہی تقریباً ایک دن" : `وہ ہوتے ہی تقریباً ${days} دن`,

    cohortWindow: (from: number, to: number) =>
      `آپ ہی کے ہفتے میں بھیجے گئے ریٹرن اب دیکھے جا رہے ہیں۔ ${from} سے ${to} دن لگ سکتے ہیں۔`,

    states: {
      not_filed: "ابھی بھیجا نہیں گیا",
      filed_unverified: "بھیج دیا، آپ کی تصدیق باقی ہے",
      verified: "آپ نے تصدیق کر دی",
      in_queue: "قطار میں",
      under_review: "کوئی اسے دیکھ رہا ہے",
      determined: "فیصلہ ہو گیا",
      sent_to_bank: "آپ کے بینک کو بھیج دیا",
      credited: "آپ کے کھاتے میں آ گیا",
      failed: "آپ کے کھاتے تک نہیں پہنچ سکا",
    },

    bankFailedHeading: "آپ نے جو کھاتہ چنا ہے، اس میں پیسہ نہیں جا سکتا۔",
    bankMergedInto: (bank: string) => `وہ برانچ اب ${bank} کا حصہ ہے`,
    useThisAccount: "اس کے بجائے یہاں بھیجیں",
    resolvedHold: "نمٹ گیا — اب کچھ نہیں روکتا۔",
    stampFiled: "داخل",
  },

  notices: {
    heading: "محکمے سے آئے خطوط",
    none: "کچھ واپس نہیں آیا۔ یہی اچھی بات ہے۔",
    respondBy: (date: string) => `${date} تک جواب دیں`,
    ifYouDoNothing: "اگر آپ کچھ نہیں کرتے",
    basedOn: "یہ کس بنیاد پر ہے",
    theCatch: "ان سے کیا غلط ہوا ہے",
    agree: "یہ ٹھیک ہے",
    disagree: "یہ غلط ہے",
    dinLabel: "اس خط کا حوالہ نمبر",
    dinExplain:
      "محکمے کے ہر خط پر یہ نمبر ہونا ضروری ہے۔ اس کے بغیر خط کا سرکاری طور پر کوئی وجود نہیں۔",
  },

  dashboard: {
    serverFilings: "سرور پر درج",
    serverFilingsEmpty:
      "لائیو سرور پر اس PAN کا کوئی داخل ریٹرن نہیں — اوپر والی رسید بنائی ہوئی کہانی کا حصہ ہے۔ اس ایپ سے داخل کریں تو اصلی رسید یہاں آئے گی۔",
    greetingLabel: "آپ کا سائن اِن جملہ",
    greetingWhy:
      "یہ جملہ آپ نے کھاتہ بناتے وقت چنا تھا۔ جو صفحہ اسے نہ دکھا سکے، وہ ہم نہیں ہیں۔",
    userDashboard: "یوزر ڈیش بورڈ",
    taxPrefills: "ٹیکس معلومات (AIS/26AS)",
    pendingActions: "باقی کارروائیاں",
    returnSummary: "ریٹرن خلاصہ AY 2026-27",
    reviewPrefill:
      "ٹیکس معلومات ٹیب میں پہلے سے بھری تفصیلات جانچیں، پھر فائل کرنے کی تصدیق کریں۔",
    filingSubmitted:
      "آپ کا ای-فائلنگ ریٹرن جمع ہو گیا ہے۔ ٹائم لائن پر پیش رفت دیکھیں۔",
    verifiedBanks: "ریفنڈ کے لیے تصدیق شدہ بینک کھاتے",
    primaryRefundAccount: "بنیادی ریفنڈ کھاتہ",
    backupAccount: "بیک اپ کھاتہ",
    ifscMeaning: "IFSC ریفنڈ بھیجنے کے لیے استعمال ہونے والا 11 حروف کا بینک روٹنگ کوڈ ہے۔",
    refundTimeline: "ریفنڈ کی ٹائم لائن",
    filingSubmittedTimeline: "ریٹرن جمع ہوا",
    identityVerifiedTimeline: "شناخت کی تصدیق ہوئی",
    assessmentProcessingTimeline: "جائزہ جاری",
    refundApprovedTimeline: "ریفنڈ منظور",
    refundCreditedTimeline: "ریفنڈ جمع ہو گیا",
    holdActive: "رکاوٹ فعال: ایکشن ٹیب میں کارروائی مکمل کریں",
    successCheckApp: "ہو گیا! اپنی بینکنگ ایپ دیکھیں۔",
    outstandingNotices: "زیرِ التوا تعمیلی نوٹس",
    noPendingActions: "کوئی کارروائی باقی نہیں",
    accountCompliant:
      "آپ کا کھاتہ مکمل طور پر درست ہے — کوئی زیرِ التوا نوٹس یا ٹیکس مطالبہ نہیں۔",
    actionableHolds: "کارروائی طلب جائزہ رکاوٹیں",
    uploadRent: "کرایہ نامہ / رسیدیں اپ لوڈ کریں",
    landlordName: "مالکِ مکان کا نام",
    landlordPan: "مالکِ مکان کا PAN (10 ہندسے)",
    selectPdfJpg: "PDF/JPG چنیں",
    submitReceipt: "رسید جمع کریں",
    responsePosition: "جواب کا موقف",
    agreeDept: "میں محکمے سے متفق ہوں",
    disagreeProof: "میں متفق نہیں (ثبوت جمع کریں)",
    responseDraft: "جواب کا بیان (مسودہ)",
    dictateStatement: "بول کر درج کریں",
    sendResponse: "جواب بھیجیں",
    filingStatusLabel: "فائلنگ کی حالت",
    bankValidated: "تصدیق شدہ",
    bankUnderProcess: "جانچ جاری ہے",
    bankFailed: "ناکام",
    staleIfscHold: "یہ بینک کوڈ اب کہیں نہیں جاتا۔",
    switchToNewIfsc: (ifsc: string) => `نئے کوڈ پر بدلیں (${ifsc})`,
    personalized: {
      eyebrow: "آپ کا ڈیش بورڈ",
      headingFiled: "آپ کا ریٹرن جمع ہو چکا ہے — یہ رہی اس کی حالت",
      heading: {
        file_return: "آئیے آپ کا ریٹرن تیار کرتے ہیں",
        check_refund: "آئیے دیکھتے ہیں کیا پیسہ واپس آ سکتا ہے",
        understand_notice: "آئیے ضروری کام سنبھالتے ہیں",
        correct_prefill: "آئیے بتائی گئی معلومات جانچتے ہیں",
      },
      guidedBody: "ہر عدد کی تصدیق سے پہلے ہم اس کا مطلب سمجھائیں گے۔",
      quickBody: "راستہ چھوٹا رہے گا اور اگلا ضروری فیصلہ پہلے دکھے گا۔",
      unfiledBody: "پہلے، آپ کے بارے میں پہلے سے درج معلومات کی تصدیق کریں۔",
      filedBody: "آپ کے آنے کے مقصد کے مطابق ہم نے صحیح حصہ پہلے کھولا ہے۔",
      primaryAction: {
        facts: "میری درج معلومات دیکھیں",
        overview: "میرا ریفنڈ ٹریکر دکھائیں",
        statement: "درج معلومات جانچیں",
        actions: "دکھائیں کس پر توجہ چاہیے",
      },
      focusLabel: "ہم ان پر نظر رکھیں گے",
      profileLabels: {
        work: "کام",
        income: "کل اندازاً آمدنی",
        history: "فائلنگ کا تجربہ",
      },
    },
  },

  onboarding: {
    eyebrow: "شروع کرنے سے پہلے",
    title: "آئیے اسے آپ کے لیے تیار کرتے ہیں۔",
    intro:
      "پانچ چھوٹے جواب ہمیں صحیح زبان، رفتار اور ٹیکس کے سوال چننے میں مدد دیں گے۔ آپ انہیں بعد میں بدل سکتے ہیں۔",
    languageQuestion: "ہم کس زبان میں بات کریں؟",
    languageHelp: "سب سے پہلے یہی سوال ہے۔ زبان آپ کبھی بھی بدل سکتے ہیں۔",
    intentQuestion: "آج آپ یہاں کیوں آئے ہیں؟",
    intentHelp: "ہم اسی کام کو سب سے پہلے رکھیں گے۔",
    intentOptions: {
      file_return: {
        label: "اس سال کا ریٹرن فائل کرنا ہے",
        detail: "آپ کے بارے میں جو پہلے سے معلوم ہے، وہیں سے شروع کریں گے۔",
      },
      check_refund: {
        label: "دیکھنا ہے کہ پیسہ واپس ملنا ہے یا نہیں",
        detail: "کیا بتایا گیا، کتنا ٹیکس کٹا اور کیا واپس آ سکتا ہے، یہ دیکھیں۔",
      },
      understand_notice: {
        label: "خط یا نوٹس سمجھنا ہے",
        detail: "اس میں کیا لکھا ہے، کتنا داؤ پر ہے اور آگے کیا کرنا ہے، یہ دیکھیں۔",
      },
      correct_prefill: {
        label: "غلط لگتی بات ٹھیک کرنی ہے",
        detail: "عدد کا ماخذ ڈھونڈیں اور درج کریں کہ کیا بدلنا چاہیے۔",
      },
    },
    intentCta: {
      file_return: "میرا ریٹرن شروع کریں",
      check_refund: "دیکھیں میرا کیا بنتا ہے",
      understand_notice: "بتائیں مجھے کیا کرنا ہے",
      correct_prefill: "جو بتایا گیا ہے اسے جانچیں",
    },
    situationQuestion: "اپنی ٹیکس کی صورتحال کے بارے میں بتائیں۔",
    situationHelp: "یہاں دو چھوٹے جواب کافی ہیں۔",
    professionLabel: "آپ کے کام کو ان میں سے کون سب سے ٹھیک بیان کرتا ہے؟",
    professionOptions: {
      salaried: "ملازمت",
      self_employed: "فری لانس یا اپنا کام",
      business_owner: "کاروباری",
      student: "طالب علم",
      retired: "ریٹائرڈ",
      investor: "سرمایہ کار",
      other: "کچھ اور",
    },
    filingHistoryLabel: "کیا آپ نے پہلے انکم ٹیکس ریٹرن فائل کیا ہے؟",
    filingHistoryOptions: {
      never: "نہیں، پہلی بار",
      once: "ایک یا دو بار",
      every_year: "ہر سال",
    },
    incomeQuestion: "تمام ذرائع سے آپ کی کل آمدنی تقریباً کتنی تھی؟",
    incomeHelp: "ابھی صرف ایک اندازہ کافی ہے۔ صحیح رقم کی ابھی ضرورت نہیں۔",
    incomeOptions: {
      none: "کوئی آمدنی نہیں",
      under_4: "₹4 لاکھ سے کم",
      "4_to_8": "₹4 سے ₹8 لاکھ",
      "8_to_12": "₹8 سے ₹12 لاکھ",
      "12_to_25": "₹12 سے ₹25 لاکھ",
      over_25: "₹25 لاکھ سے زیادہ",
    },
    modeQuestion: "آپ کتنی تفصیل دیکھنا چاہتے ہیں؟",
    modeHelp: "یہ صرف شروعات طے کرتا ہے۔ آپ کبھی بھی بدل سکتے ہیں۔",
    modeOptions: {
      simple: {
        label: "میرے لیے کر دیں",
        detail: "سادہ زبان، ایک وقت میں ایک قدم۔ باقی ہم سنبھالیں گے۔",
      },
      full: {
        label: "مجھے سب کچھ دکھائیں",
        detail: "ہر عدد، ہر قاعدہ، ہر حساب — شروع سے ہی۔",
      },
    },
    focusQuestion: "ان میں سے کن باتوں پر توجہ دیں؟",
    focusHelp: "جو آپ پر لاگو ہو، سب چنیں۔ یقین نہ ہو تو معلوم نہیں چن لیں۔",
    focusOptions: {
      salary: "تنخواہ یا پنشن",
      freelance: "فری لانس کام",
      business: "کاروبار کی آمدنی",
      rent: "دیا یا ملا ہوا کرایہ",
      interest: "بینک کا سود",
      investments: "شیئرز یا سرمایہ کاری",
      deductions: "بچت، انشورنس، ہوم لون یا NPS",
      not_sure: "ابھی یقین نہیں",
    },
    chooseOne: "ایک چنیں",
    chooseAtLeastOne: "کم از کم ایک چنیں",
    questionsLabel: "مختصر تیاری",
    questionsProgress: (current: number, total: number) => `${total} میں سے ${current}`,
    savedLocally: "اس پروٹوٹائپ میں آپ کے جواب اسی براؤزر میں محفوظ ہوتے ہیں۔",
    readyTitle: "اتنا اسے آپ کے مطابق بنانے کے لیے کافی ہے۔",
    readyBody:
      "ان جوابوں سے ہم طے کریں گے کہ آپ کو پہلے کیا دکھانا ہے۔ نظام کا آخری انتخاب پھر بھی آپ کے پکے کیے گئے حقائق اور دعووں پر ہوگا۔",
    guidedLabel: "ہم کیسے سمجھائیں گے",
    guidedValue: "ہم چلتے چلتے اصطلاحیں سمجھاتے جائیں گے۔",
    quickValue: "ہم راستہ چھوٹا رکھیں گے۔",
    regimeLabel: "نظاموں کے ساتھ ہمارا طریقہ",
    claimsRegimeValue: "نظام چننے سے پہلے ہم آپ کے دعوے جانچیں گے۔",
    compareRegimeValue: "حقائق پکے ہونے کے بعد دونوں نظاموں کا موازنہ کریں گے۔",
    focusLabel: "پہلے کس پر توجہ ہوگی",
    startPath: "میرے راستے سے شروع کریں",
    changeAnswers: "جواب بدلیں",
    tailoredBadge: "آپ کا ابتدائی راستہ",
    tailoredGuided: "سمجھا کر آگے بڑھیں گے",
    tailoredQuick: "چھوٹا راستہ",
    tailoredRegimeClaims: "نظام کے انتخاب سے پہلے دعووں کی جانچ",
    tailoredRegimeCompare: "حقائق کے بعد دونوں نظاموں کا موازنہ",
    tailoredIntent: (intent: string) => `پہلے: ${intent}`,
  },

  checklist: {
    divider: "داخل کرنے سے پہلے",
    itemBefore: "”",
    itemAfter: "“ کی تصدیق کریں — شک ہو تو کارڈ کھولیں۔",
    stdRow: "ہم نے آپ کے لیے جو معیاری کٹوتی لاگو کی، اس کی تصدیق کریں۔",
    noteLocked: "اوپر کی ہر سطر پر نشان لگائیں، تبھی یہ بٹن کھلے گا۔",
    noteReady: "اوپر سب کچھ پکا ہے۔ تیار ہوں تو داخل کریں۔",
    fileBtn: "یہ ریٹرن داخل کریں",
    lockedBtn: (n: number) =>
      n === 1 ? "پہلے 1 اور سطر پر نشان لگائیں" : `پہلے ${n} اور سطروں پر نشان لگائیں`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `کارڈ ${String(n).padStart(2, "0")} · درج ${date}`,
    whatThisMeans: "اس کا مطلب کیا ہے",
    readFirst: "پہلے ”اس کا مطلب کیا ہے“ کھولیں — پھر تصدیق کریں۔",
    readyToConfirm: "پڑھ لیا؟ نیچے تصدیق کریں۔",
  },

  signoff: {
    title: "دستخطی تصدیق",
    declaration:
      "میں نے اوپر دیے گئے اعداد پڑھے ہیں اور ماخذ دستاویزات سے ملائے ہیں۔ یہ صحیح اور مکمل ہیں۔",
    action: "ان اعداد پر دستخط کریں",
    signed: "دستخط ہو گئے — اوپر کا ہر عدد پکا ہے۔",
    hint: "ایک اقرار اوپر کے تمام اعداد پر لاگو ہوتا ہے۔ کسی عدد پر اعتراض ہو تو پہلے ”نہیں، یہ غلط ہے“ چنیں۔",
  },

  channels: {
    sectionLabel: "سال ایک نظر میں",
    earned: "آپ نے کمایا",
    toTax: "ٹیکس میں گیا",
    overpaid: "آپ نے زیادہ دیا",
    stillToPay: "ابھی دینا ہے",
    stayed: "آپ سے کبھی گیا ہی نہیں",
    kept: "جو ٹیکس بنتا تھا",
    back: "آپ کے پاس واپس آ رہا ہے",
    yoursInEnd: "آخر میں آپ کا",
    collected: "پہلے ہی کٹ چکا",
    ofYear: "سال بھر کے پیسے کا",
    sliceNote:
      "جو حصہ دکھنے لائق نہیں، اسے تھوڑا چوڑا بنایا گیا ہے — ساتھ لکھے اعداد بالکل درست ہیں۔",
    whereItWent: "آپ کی کمائی کا ہر روپیہ کہاں گیا",
    earnedDesc: "تنخواہ، سود اور باقی سب — جیسے ادائیگی کرنے والوں نے درج کیا۔",
    toTaxDesc: "ہر جائز کٹوتی کے بعد آپ پر اصل میں جو ٹیکس بنا۔",
    backDesc:
      "آپ کی تنخواہ سے لیا گیا مگر کبھی بنتا نہیں تھا۔ یہ آپ کے پاس واپس آئے گا۔",
    dueDesc: "جو کٹ چکا اس سے آگے کا بقایا۔ یہ ابھی دینا ہے۔",
    howToRead:
      "اسے یوں پڑھیں: یہاں کچھ بھی ہم نے نہیں گھڑا۔ ہر عدد کسی داخل شدہ دستاویز سے آیا ہے یا آپ نے خود درج کیا ہے۔ پنسل نوٹ سمجھاتے ہیں کہ ہر عدد کا اصل مطلب کیا ہے — سیدھے لفظوں میں، ٹیکس کے لفظوں میں نہیں۔",
    meterCap: "جو ٹیکس بنا بمقابلہ جو پہلے ہی کٹ چکا",
  },

  agent: {
    title: "واپسی معاون",
    open: "معاون کھولیں",
    close: "بند کریں",
    placeholder: "جانچنے، سمجھانے یا داخل کرنے کو کہیں…",
    send: "بھیجیں",
    thinking: "کام جاری ہے…",
    toolRan: "کیا:",
    confirmTitle: "داخل کرنے کے لیے تیار — اعداد جانچیں",
    confirmBody: "آپ کی تصدیق کے بغیر کچھ داخل نہیں ہوگا۔ یہ جمع ہوگا:",
    confirmTotalTax: "کل ٹیکس",
    confirmRefund: "آپ کو واجب ریفنڈ",
    confirmDue: "واجب الادا رقم",
    confirmTaxable: "قابلِ ٹیکس آمدنی",
    confirmButton: "تصدیق کریں اور داخل کریں",
    cancelButton: "منسوخ کریں",
    filingDismissed: "ٹھیک ہے — کچھ داخل نہیں ہوا۔",
    error: "معاون تک رسائی نہیں ہو سکی۔ آپ کا ریٹرن جوں کا توں ہے — پھر کوشش کریں۔",
    intro:
      "میں آپ کا ریٹرن جانچ سکتا ہوں، کوئی بھی عدد سمجھا سکتا ہوں، اگر مگر کے حساب لگا سکتا ہوں اور داخلے کی تیاری کر سکتا ہوں۔ داخلہ ہمیشہ آپ کی تصدیق کے بعد ہی ہوتا ہے۔",
    sample: "80C میں ₹1,50,000 لگانے پر میری کتنی بچت ہوگی؟",
  },

  footer: {
    prototype: "آزاد تصوراتی پروٹوٹائپ۔",
    notAffiliated:
      "یہ محکمہ انکم ٹیکس، CBDT یا حکومتِ ہند سے وابستہ، ان کی طرف سے منظور شدہ یا ان سے متعلق نہیں ہے۔ یہاں دیا گیا ہر نام، PAN، رقم اور دستاویز فرضی ہے۔ کسی سرکاری سسٹم سے رابطہ نہیں کیا جاتا۔",
    honestyLink: "دیکھیں کیا اصلی ہے اور کیا بنایا ہوا",
  },
};

/**
 * Urdu values for the mock-screen strings in
 * components/mock-i18n.ts (LOCALIZED_MOCK_STRINGS). Keys are the byte-exact
 * English strings. Model-generated; awaits native-speaker review (T0.5).
 */
export const urMock: Record<string, string> = {
  "Your pay last year": "پچھلے سال آپ کی تنخواہ",
  "Interest your savings account earned": "بچت کھاتے سے کمایا گیا سود",
  "Interest your accounts earned": "آپ کے کھاتوں سے کمایا گیا سود",
  "Your primary contract income": "آپ کی بنیادی کنٹریکٹ آمدنی",
  "Savings interest": "بچت کھاتے کا سود",
  "Tax withheld (TDS)": "پہلے کاٹا گیا ٹیکس (TDS)",
  "Provident Fund / ELSS Mutual Funds": "پراویڈنٹ فنڈ / ELSS میوچل فنڈز",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "اس کی تنخواہ سے ₹8,400 کاٹے گئے۔ اسے کچھ دینا نہیں۔ اس نے ابھی فائل نہیں کیا، اور اسکول کی فیس دینی ہے۔",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "دو نوٹس ہیں۔ ایک کہتا ہے کہ اس نے ₹1,10,000 کا شیئر منافع چھپایا — اصل میں اسے ₹4,200 کا نقصان ہوا۔ دوسرا 2019 کے اس بل کے لیے ریفنڈ کا حصہ رکھنا چاہتا ہے جس کی اسے کبھی خبر ہی نہیں تھی۔",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 دن پہلے فائل کیا۔ پورٹل پر 'کارروائی جاری' کے سوا کچھ نہیں دکھتا۔ اصل میں دو الگ الگ چیزیں اس کے ₹34,800 روک رہی ہیں۔",
  "Tax already taken out of your pay": "تنخواہ سے پہلے ہی کٹا ٹیکس (TDS)",
  "Dividend your shares paid out": "شیئرز سے ملا منافع منقسمہ",
  "Money from selling shares": "شیئر بیچنے سے ملا پیسہ",
  "Tax the bank withheld on your interest": "سود پر بینک کا کاٹا گیا ٹیکس (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "پراویڈنٹ فنڈ (PF)، انشورنس اور بیٹی کی ٹیوشن فیس",
  "Provident fund and your insurance premium":
    "پراویڈنٹ فنڈ (PF) اور آپ کا انشورنس پریمیم",
  "Health cover for the family": "خاندان کے لیے ہیلتھ انشورنس",
  "Rent you paid, with no house-rent allowance from your employer":
    "آپ کا دیا ہوا کرایہ (آجر سے مکان کرایہ الاؤنس کے بغیر)",
  "One figure doesn't match what your broker reported.":
    "ایک عدد آپ کے بروکر کے درج کردہ عدد سے نہیں ملتا۔",
  "₹18,740 of this is being held against an old bill.":
    "اس میں سے ₹18,740 ایک پرانے بل کے بدلے روکے جا رہے ہیں۔",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "محکمہ سمجھتا ہے کہ آپ نے ₹1,10,000 کا شیئر منافع چھوڑ دیا ہے۔",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "محکمہ 2019 کے بل کے تصفیے کے لیے آپ کے ریفنڈ میں سے ₹18,740 رکھنا چاہتا ہے۔",
  "Waiting on one thing: a receipt for your rent claim.":
    "ایک چیز کا انتظار ہے: آپ کے کرائے کے دعوے کی رسید۔",
  "The account you chose can't receive the money.":
    "آپ کے چنے ہوئے کھاتے میں پیسہ نہیں جا سکتا۔",
  "Held: your rent claim needs a receipt.":
    "روکا گیا: آپ کے کرائے کے دعوے کے لیے رسید چاہیے۔",
  "Your bank account was checked and failed.":
    "آپ کے بینک کھاتے کی جانچ ہوئی اور وہ ناکام رہی۔",
  "The department is asking you to look again at your rent claim.":
    "محکمہ آپ سے اپنے کرائے کے دعوے کو دوبارہ دیکھنے کو کہہ رہا ہے۔",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities نے شیئرز کی فروخت سے ₹1,10,000 درج کیے۔ آپ کا ریٹرن یہ نہیں دکھاتا۔ جب تک یہ نمٹتا نہیں، ریفنڈ وہیں رہے گا۔",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 کا ایک مطالبہ اس سال کے ریفنڈ سے منہا کیا جا رہا ہے۔ آپ اس پر اعتراض کر سکتے ہیں، اور 3 تاریخ سے پہلے اسے پڑھ لینا چاہیے۔",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "اگر آپ 10 ستمبر تک کچھ نہیں کہتے، تو ₹1,10,000 آپ کی آمدنی میں شامل ہو جائیں گے اور آپ کے ریفنڈ سے تقریباً ₹34,300 کٹ جائیں گے۔",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "اگر آپ 3 ستمبر تک کچھ نہیں کہتے، تو آپ کے ریفنڈ سے ₹18,740 کاٹ لیے جائیں گے اور معاملہ بند سمجھا جائے گا۔",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "آپ نے ₹1,10,000 کے شیئر بیچے اور ان کا منافع ظاہر نہیں کیا۔",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 میری بیچی ہوئی ہر چیز کی کل قیمت ہے، میرا منافع نہیں۔ ان سودوں میں مجھے ₹4,200 کا نقصان ہوا۔ سال کا میرا بروکر گوشوارہ خرید کی قیمتیں دکھاتا ہے۔",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "آپ پر 2019-20 کے ₹18,740 اب بھی واجب ہیں، اس لیے یہ اس سال کے ریفنڈ سے لیے جائیں گے۔",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "آپ نے ₹60,000 کے کرائے کا دعویٰ کیا۔ اسے دکھانے کے لیے کچھ منسلک نہیں تھا۔ رسید یا مالکِ مکان کا نام اور PAN شامل کریں، تو یہ آگے بڑھے گا۔",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank پچھلے سال Deccan Union Bank کا حصہ بن گیا۔ کھاتہ اب بھی موجود ہے — مگر اس تک پیسہ پہنچانے والا کوڈ نہیں۔",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "آپ نے 80GG کے تحت ₹60,000 کے کرائے کا دعویٰ کیا، مگر تائید میں کچھ منسلک نہیں کیا۔",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "میں نے یہ کرایہ دیا ہے۔ میرے پاس مالکِ مکان کی ماہانہ رسیدیں ہیں اور میں ان کا نام اور PAN دے سکتا/سکتی ہوں۔",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "یہ کوئی الزام نہیں ہے اور ابھی کوئی جرمانہ نہیں۔ مگر آپ کے ₹34,800 وہیں رہیں گے جب تک آپ دعوے کا ثبوت نہیں دیتے یا اسے واپس نہیں لیتے۔",
  "Look at what they reported": "دیکھیں انہوں نے کیا درج کیا",
  "Read the 2019 demand": "2019 کا مطالبہ پڑھیں",
  "Add the receipt": "رسید شامل کریں",
  "Point it at the right account": "اسے صحیح کھاتے کی طرف موڑیں",
  "Supervisor, garment unit": "سپروائزر، گارمنٹ یونٹ",
  "Operations manager; trades equity on the side":
    "آپریشنز منیجر؛ ساتھ ساتھ شیئرز کا لین دین",
  "Junior architect; first time filing":
    "جونیئر آرکیٹیکٹ؛ پہلی بار فائل کر رہی ہیں",
  "Independent Consultant": "آزاد مشیر",
  "Primary School Teacher": "پرائمری اسکول ٹیچر",
  "Retired bank clerk": "ریٹائرڈ بینک کلرک",
  "Retired": "ریٹائرڈ",
  "Teacher": "استاد",
  "You sent your return in.": "آپ نے اپنا ریٹرن بھیج دیا۔",
  "You confirmed it was you. The return counts from here.":
    "آپ نے تصدیق کی کہ یہ آپ ہی ہیں۔ ریٹرن یہیں سے گنا جائے گا۔",
  "In the queue with everything else filed that week.":
    "اس ہفتے داخل ہونے والے باقی سب کے ساتھ قطار میں۔",
  "Someone is looking at one figure.": "کوئی ایک عدد کو دیکھ رہا ہے۔",
  "A share-sale row your broker filed doesn't line up with your return.":
    "آپ کے بروکر کی درج کردہ شیئر فروخت کی ایک سطر آپ کے ریٹرن سے نہیں ملتی۔",
  "OTP verified, 4 minutes after filing.": "OTP تصدیق ہوا، داخل کرنے کے 4 منٹ بعد۔",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG کے تحت ₹60,000 کا دعویٰ، تائید میں کچھ بھی منسلک نہیں۔",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank نے جانچ واپس لوٹا دی: IFSC GODG0004417 اب کہیں نہیں جاتا۔",
  "OTP Verification Complete": "OTP تصدیق مکمل",
  "Outstanding Compliance Notices": "زیرِ التوا تعمیلی نوٹس",
  "Draft Legal Response": "قانونی جواب کا مسودہ بنائیں",
  "No Pending Actions": "کوئی کارروائی باقی نہیں",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "آپ کا کھاتہ مکمل طور پر درست ہے — کوئی زیرِ التوا نوٹس یا ٹیکس مطالبہ نہیں۔",
  "Actionable Assessment Holds": "کارروائی طلب جائزہ رکاوٹیں",
  "Upload Rent Agreement / Receipts": "کرایہ نامہ / رسیدیں اپ لوڈ کریں",
  "Landlord Name": "مالکِ مکان کا نام",
  "Landlord PAN (10 Digits)": "مالکِ مکان کا PAN (10 ہندسے)",
  "Select PDF/JPG": "PDF/JPG چنیں",
  "Submit Receipt": "رسید جمع کریں",
  "Response Position": "جواب کا موقف",
  "I Agree with Department": "میں محکمے سے متفق ہوں",
  "I Disagree (Submit Proof)": "میں متفق نہیں (ثبوت جمع کریں)",
  "Response Statement (Draft)": "جواب کا بیان (مسودہ)",
  "Dictate Statement": "بول کر بیان لکھوائیں",
  "Listening...": "سن رہے ہیں...",
  "Explain your disagreement or agreement...": "اپنے اتفاق یا اختلاف کی وضاحت کریں...",
  "Send Response": "جواب بھیجیں",
  "Cancel": "منسوخ کریں",
  "Validate Bank Code": "بینک کوڈ کی تصدیق کریں",
  "Update Bank IFSC": "بینک IFSC اپ ڈیٹ کریں",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "بینک تفصیلات کی تصدیق کے لیے 11 حروف کا بینک روٹنگ کوڈ (IFSC) جانچیں۔",
  "IFSC Code": "IFSC کوڈ",
};

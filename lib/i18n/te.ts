/**
 * తెలుగు (Telugu). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and awaits review by a native Telugu
 * speaker who knows tax vocabulary (project task T0.5). Until that review
 * lands, treat every string here as provisional — the limitation is disclosed
 * on /honesty rather than papered over.
 *
 * Digits stay Latin, for the same reason as in Hindi and Tamil — money must be
 * legible at a glance before anything else on the screen is.
 */

import type { Dict } from "./en";

export const te: Dict = {
  langName: "Telugu",
  langNativeName: "తెలుగు",
  dir: "ltr",

  common: {
    modeAgentic: "Agentic",
    modeManual: "Manual",
    continue: "కొనసాగించండి",
    back: "వెనక్కి",
    yesThatsRight: "అవును, ఇది సరైనదే",
    noThisIsWrong: "కాదు, ఇది తప్పు",
    iDontUnderstand: "ఇది నాకు అర్థం కాలేదు",
    close: "మూసివేయి",
    saveAndGoOn: "సేవ్ చేసి కొనసాగండి",
    loading: "ఒక్క క్షణం",
    logOut: "లాగ్ అవుట్",
    undo: "వెనక్కి తీసుకో",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "వాప్సీ",
    subtitle: "సరిచూసుకుని ఫైల్ చేయడానికి స్పష్టమైన దారి",
    independent: "స్వతంత్ర ప్రోటోటైప్",
    taxYear: "పన్ను సంవత్సరం 2026-27",
    language: "భాష",
    light: "వెలుతురు",
    dark: "చీకటి",
    sandbox: "సమీక్ష సాధనాలు",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "ప్రధాన కంటెంట్‌కు వెళ్లండి",
  },

  validate: {
    panTooShort: (n: number) => `ఇప్పటివరకు ${n} అక్షరాలు. PAN‌లో 10 ఉంటాయి.`,
    panShape:
      "PAN అంటే ఐదు అక్షరాలు, తర్వాత నాలుగు అంకెలు, చివర ఒక అక్షరం — DEMPS4417K లాగా.",
    panSandboxHint:
      "మీరు ఇక్కడ టైప్ చేసేది మీ బ్రౌజర్ దాటి బయటకు వెళ్లదు. ఈ నమూనాలో ప్రతి PAN కూడా DEMP‌తో మొదలవుతుంది, కాబట్టి నిజమైన PAN పొరపాటున కూడా వెతకబడదు.",
    ifscTooShort: (n: number) =>
      `ఇప్పటివరకు ${n} అక్షరాలు. బ్యాంకు కోడ్‌లో 11 ఉంటాయి.`,
    ifscShape:
      "బ్యాంకు కోడ్ అంటే నాలుగు అక్షరాలు, తర్వాత ఒక సున్నా, ఆపై మరో ఆరు — DECU0834471 లాగా.",
  },

  landing: {
    question: "ఆదాయపు పన్ను శాఖ దగ్గర మీ డబ్బు ఆగి ఉందా?",
    subtext:
      "ఇది వాడేవారిలో చాలామందికి కట్టాల్సింది ఏమీ ఉండదు — వారికే తిరిగి రావాలి. మీ PAN ఇవ్వండి, అక్కడ ఏముందో చెబుతాం.",
    panLabel: "మీ PAN",
    panHelp: "మీ PAN కార్డుపై ఉన్న పది అక్షరాలు",
    panPlaceholder: "ఉదాహరణకు, DEMPS4417K",
    check: "నాకు ఎంత రావాలో చూడండి",
    orTryAs: "లేదా ముగ్గురు వ్యక్తుల్లో ఒకరిగా చూడండి",
    honestyLink: "ఇందులో ఏది నిజం, ఏది కల్పితం",
    architectureLink: "సాంకేతిక నిర్మాణం",
    badge: "సరళీకృత పన్ను రిటర్న్, ప్రత్యక్షంగా నిరూపితం",
    brandTitle: "మీ డబ్బు, తిరిగి వస్తోంది.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ఫైలింగ్",
      blurb:
        "ఆమె జీతం నుంచి ₹8,400 తీసేశారు. ఆమె కట్టాల్సింది ఏమీ లేదు, ఇంకా ఫైల్ చేయలేదు, స్కూలు ఫీజు కట్టాల్సి ఉంది.",
      action: "ఇప్పటికే తెలిసినదాన్ని నిర్ధారించండి",
    },
    rakesh: {
      phase: "ఒక ఉత్తరం వచ్చింది",
      blurb:
        "₹1,10,000 షేర్ల లాభాన్ని దాచాడని ఉత్తరం అంటోంది. అతనికి ఎప్పుడూ చెప్పని ఒక పాత డిమాండ్ కోసం అతని రీఫండ్ ఆపి ఉంచారు.",
      action: "చదివి, విభేదించండి",
    },
    priya: {
      phase: "నిరీక్షణ",
      blurb:
        "71 రోజుల క్రితం ఫైల్ చేసింది. ఇంకా ప్రాసెసింగ్‌లో ఉంది అనే చూపిస్తోంది. నిజానికి రెండు విషయాలు దాన్ని ఆపి ఉంచాయి — ఏవో ఎవరూ చెప్పలేదు.",
      action: "ఏది ఆపుతోందో చూడండి",
    },
    custom: {
      phase: "మీరే ప్రయత్నించండి",
      blurbTitle: "కల్పిత వ్యక్తి",
      blurb:
        "ఒక వ్యక్తిని మొదటి నుంచి తయారు చేయండి — జీతం, క్లెయిమ్‌లు, మినహాయింపులు — పన్ను లెక్క దానంతట అదే సర్దుకోవడం చూడండి.",
      action: "ఒకరిని సృష్టించండి",
    },
  },

  login: {
    authVerifying: "సర్వర్‌తో సరిచూస్తున్నాం…",
    authUnreachable:
      "సైన్-ఇన్ సర్వర్‌ను చేరుకోలేకపోయాం. మీరు నమోదు చేసినదేదీ పోలేదు — కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
    authRejected: (detail: string) => `సర్వర్ సైన్-ఇన్ అనుమతించలేదు: ${detail}`,
    signedInAs: "సైన్-ఇన్ అయ్యారు — సెషన్ యాక్టివ్‌గా ఉంది",
    otpSentTo: (mobile: string) => `${mobile} నంబర్‌కు ఒక కోడ్ పంపాం`,
    otpLabel: "ఆరు అంకెల కోడ్",
    weWillWait:
      "తొందరేమీ లేదు. కోడ్ కోసం వేచి ఉన్నంతసేపు మీరు నమోదు చేసినదేదీ పోదు.",
    resend: "మళ్లీ పంపండి",
    resendIn: (seconds: number) => `${seconds} సెకన్లలో మళ్లీ అడగవచ్చు`,
    mockNotice:
      "ఇది ఒక నమూనా, కాబట్టి కోడ్ తెరపైనే చూపిస్తున్నాం. నిజమైన సందేశం ఏదీ పంపబడదు.",
    portalHeading: "ఇ-ఫైలింగ్ ధృవీకరణ",
    incorrectCode:
      "ఈ కోడ్ సరిపోలడం లేదు. ఆరు అంకెలు సరిచూసి మళ్లీ ప్రయత్నించండి.",
    prototypeBox: "ప్రోటోటైప్ OTP ధృవీకరణ",
    mockCodeLabel: "నమూనా కోడ్",
    autoFill: "నా కోసం నింపండి",
    verifyEnter: "ధృవీకరించి లోపలికి వెళ్లండి",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "ఆరు అంకెల ధృవీకరణ కోడ్",
    otpDigitLabel: (position: number, total: number) =>
      `అంకె ${position}, మొత్తం ${total}`,
    draftRestored: (time: string) =>
      `${time} నాటి మీ డ్రాఫ్ట్ తిరిగి తెచ్చాం. ఏదీ పోలేదు.`,
  },

  file: {
    heading: (amount: string) => `మీ ${amount} శాఖ దగ్గర ఆగి ఉంది`,
    subheading:
      "కింద ఉన్నదంతా దాదాపు మీ గురించి ఇప్పటికే నివేదించినదే. చదవండి, ఏదైనా తప్పుగా ఉంటే చెప్పండి.",

    checkThis: "ఇది సరిచూడండి — మీరు నింపాల్సిన అవసరం లేదు",
    factMeaning:
      "ఇది నివేదించబడిన వాస్తవం, పన్ను నియమం కాదు. కింది లెక్క దీన్ని వాడుతుంది.",
    factMeaningByKind: {
      salary:
        "మీకు అందిన జీతం నుంచి మీ యజమాని దీన్ని నివేదించారు. కింద ఉన్నదంతా ఇక్కడి నుంచే మొదలవుతుంది.",
      interest:
        "మీ ఖాతాలు సంపాదించిన వడ్డీని బ్యాంకులు ఏడాదికి ఒకసారి నివేదిస్తాయి. చిన్న మొత్తాలు కూడా ఆదాయమే.",
      dividend:
        "మీ షేర్లు చెల్లించిన డివిడెండ్‌ను కంపెనీ రిజిస్ట్రార్ నివేదించారు. చెల్లించిన సంవత్సరపు ఆదాయంగా ఇది లెక్కలోకి వస్తుంది.",
      capital_gains:
        "షేర్లు అమ్మగా వచ్చిన డబ్బును మీ బ్రోకర్ నివేదించారు. పన్ను పడేది లాభంపైనే — ఏది అమ్మారు, ఎంతకాలం ఉంచుకున్నారు అనే దాన్ని బట్టి రేటు ఉంటుంది.",
      rent:
        "వచ్చిన అద్దె ఆదాయం; కట్టిన అద్దె మీ పన్నును తగ్గించవచ్చు. ఏదైనా సరే, అవతలి వైపు నివేదించినదానితో సరిపోలాలి.",
      other:
        "మరే విభాగంలోకీ రాని నివేదిత ఆదాయం. ఇది కూడా కింది లెక్కలో చేరుతుంది.",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} దీన్ని ${date} న శాఖకు నివేదించారు`,
    underIdentifier: (identifier: string) => `నమోదు ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `ఇది తప్పు అయితే, మూలంలో దీన్ని మార్చగలిగేది ${reporter} మాత్రమే. వారిని ఏమి అడగాలో మేం సరిగ్గా చెబుతాం.`,

    whatYouEarned: "మీరు సంపాదించినది",
    whatWasDeducted: "ఇప్పటికే తీసేసిన పన్ను",
    whereMoneyGoes: "డబ్బు ఎక్కడికి వెళ్తుంది",
    whoYouAre: "మీరు ఎవరు",

    disputeHeading: "ఇందులో ఏమి ఉండాలి?",
    disputeAmountLabel: "సరైన మొత్తం",
    disputeReasonLabel: "ఇది ఎందుకు తప్పు",
    disputeSave: "ఇది తప్పు అని గుర్తించండి",
    selfReported: "మీరు",
    returnLabel: "మీ రిటర్న్",

    outcomeOwesNothing: "మీరు కట్టాల్సింది ఏమీ లేదు.",
    outcomeRefund: (amount: string) => `${amount} మీకు తిరిగి వస్తుంది.`,
    outcomeOwes: (amount: string) => `ఇంకా ${amount} కట్టాల్సి ఉంది.`,
    confirmAndFile: "దీన్ని పంపండి",

    verifyHeading: "ఇంకా ఒక్క అడుగు — లేకపోతే ఇది లెక్కలోకి రాదు.",
    verifyBody:
      "ఇది మీరే అని నిర్ధారించే వరకు మీ రిటర్న్ ఫైల్ అయినట్టు కాదు — అసలు పంపనట్టే. దీనికి సుమారు ఇరవై సెకన్లు చాలు.",
    verifyAction: "ఇది నేనే అని నిర్ధారిస్తున్నాను",

    voicePrompt: "లేదా మాటల్లోనే చెప్పండి",
    voiceListening: "వింటున్నాం",
    voiceUnsupported:
      "ఈ ఫోన్ బ్రౌజర్ ఇంకా వినలేదు. మీరు టైప్ చేసి చెప్పవచ్చు — ఏదీ పోదు.",
    voiceSimulated:
      "ఈ బ్రౌజర్ వినలేదు, కాబట్టి ఇది ఒక ఉదాహరణ మాత్రమే, మీ గొంతు కాదు.",
    voiceError: "అది వినిపించలేదు. మీరు టైప్ చేసి చెప్పవచ్చు — ఏదీ పోదు.",
    dictate: "మాట్లాడి చెప్పండి (వాయిస్)",
    disputePlaceholder: "ఈ సంఖ్య ఎందుకు తప్పో చెప్పండి లేదా టైప్ చేయండి.",
    disputeDefaultReason: "నివేదించిన సంఖ్య తప్పు",
  },

  flow: {
    facts: "మీ డబ్బు",
    deductions: "మీరు క్లెయిమ్ చేయగలిగేది",
    regime: "పాతదా కొత్తదా",
    check: "సరిచూడండి",
    file: "పంపండి",
    stepOf: (n: number, total: number) => `దశ ${n} / ${total}`,
    confirmedCount: (done: number, total: number) =>
      `${total}లో ${done} నిర్ధారించారు`,
    allConfirmed: "అంతా సరిగ్గా ఉంది.",
    undoOne: "ఈ సవరణను వెనక్కి తీసుకోండి",
    correctedTo: (amount: string) =>
      `ఇది ${amount} అయి ఉండాలని మీరు అంటున్నారు`,
  },

  groups: {
    moneyIn: "వస్తున్న డబ్బు",
    taxPaid: "మీ తరఫున ఇప్పటికే కట్టిన పన్ను",
    deductionsClaimed: "మీరు క్లెయిమ్ చేసే మినహాయింపులు",
    fromWhere: "ఇది ఎక్కడి నుంచి వచ్చింది",
    addIncome: "ఆదాయం జోడించండి",
  },

  deductions: {
    notAllowedNewRegime:
      "కొత్త విధానంలో లెక్కలోకి రాదు — మీ రికార్డులో భద్రంగా ఉంది.",
    startedAtCap: (amount: string) =>
      `దీన్ని ${amount} పరిమితి వద్ద మొదలుపెట్టాం — మీరు నిజంగా కట్టినది “ఎంత”లో పెట్టండి.`,
    heading: "మీరు క్లెయిమ్ చేయగలిగే డబ్బు",
    sub: "ఇవి వాటంతట అవే జరగవు. నిజమైతేనే — అవును అని మీరు చెప్పాలి.",
    claimedHeading: "మీ రిటర్న్‌లో ఇప్పటికే ఉన్నవి",
    worthUpTo: (amount: string) =>
      `మీ పన్ను పడే ఆదాయం నుంచి ${amount} వరకు తగ్గుతుంది`,
    worthWhatYouPaid:
      "మీరు నిజంగా కట్టినంతే విలువ — నిజమైన మొత్తాన్నే క్లెయిమ్ చేయండి",
    askRentQ: "మీరు ఉంటున్న ఇంటికి అద్దె కడుతున్నారా?",
    askRentWhy:
      "మీరు అద్దె కడుతూ, మీ యజమాని ఇంటి అద్దె అలవెన్స్ ఇవ్వకపోతే, అందులో కొంత భాగం మీ పన్ను పడే ఆదాయం నుంచి తగ్గుతుంది.",
    askHealthQ: "మీ కుటుంబానికి ఆరోగ్య బీమా మీరే కడుతున్నారా?",
    askHealthWhy:
      "కుటుంబాన్ని బీమాలో ఉంచడానికి మీరు కట్టేది మీ పన్ను పడే ఆదాయం నుంచి తగ్గుతుంది.",
    ask80cQ:
      "ప్రావిడెంట్ ఫండ్, జీవిత బీమా లేదా స్కూలు ట్యూషన్‌లో డబ్బు పెడుతున్నారా?",
    ask80cWhy:
      "ఇలాంటి దీర్ఘకాలిక పొదుపులన్నీ ఒకే ఉమ్మడి పరిమితిలో లెక్కకు వస్తాయి; మీరు పెట్టినంత మీ పన్ను పడే ఆదాయం నుంచి తగ్గుతుంది.",
    claimIt: "అవును — దీన్ని క్లెయిమ్ చేయండి",
    skipIt: "కాదు — దీన్ని వదిలేయండి",
    amountLabel: "ఎంత",
    evidenceAttached: "రుజువు జతచేశారు",
    evidenceMissing:
      "ఇంకా రుజువు జతచేయలేదు — ప్రస్తుతానికి ఫర్వాలేదు. రసీదులు భద్రంగా ఉంచండి; శాఖ తర్వాత అడగవచ్చు.",
    newRegimeNoEffect:
      "కొత్త విధానంలో ఈ క్లెయిమ్ వల్ల ఏమీ మారదు — అక్కడ ఇది అనుమతించబడదు.",
    oldRegimeSaves: (amount: string) =>
      `పాత విధానంలో ఇది మీ పన్నును సుమారు ${amount} తగ్గిస్తుంది.`,
  },

  regime: {
    heading: "పన్ను కట్టడానికి రెండు దారులు ఉన్నాయి. ఒకటి మీకు మెరుగైనది.",
    newRegimeName: "కొత్త విధానం",
    oldRegimeName: "పాత విధానం",
    refundLabel: "మీకు తిరిగి వస్తుంది",
    dueLabel: "కట్టాల్సింది",
    recommendedBadge: "మీకు మెరుగైనది",
    reasoningOldDeductions: (x: string, y: string) =>
      `మీ మినహాయింపులు మొత్తం ${x} అవుతున్నాయి, కాబట్టి పాత విధానం మీకు సుమారు ${y} ఆదా చేస్తుంది.`,
    reasoningNewDefault: (y: string) =>
      `మీ మినహాయింపులు ఎటూ పెద్దగా ఉపయోగపడవు, కాబట్టి కొత్త విధానపు తక్కువ రేట్లు సుమారు ${y} ఆదా చేస్తాయి.`,
    acceptRecommendation: "నాకు మెరుగైనదాన్నే ఎంచుకోండి",
    overrideNote:
      "రెండింటిలో ఏదైనా ఎంచుకోవచ్చు. ఇక్కడ ఏదీ దాచలేదు, లాక్ చేయలేదు.",
  },

  check: {
    newRegimeClaimsZero:
      "మీ క్లెయిమ్‌లు నమోదై భద్రంగా ఉన్నాయి — కొత్త విధానం వాటిని అనుమతించదు కాబట్టే ఈ లైన్ ₹0 గా ఉంది.",
    badgeReportedBy: (reporter: string) => `${reporter} నివేదించారు`,
    badgeYouEntered: "మీరు నమోదు చేశారు",
    badgeWeApplied: "మీ కోసం మేమే వర్తింపజేశాం",
    heading: "మొత్తం రిటర్న్, ఒకే పేజీలో",
    sub: "ప్రతి సంఖ్యా ఎక్కడి నుంచో వచ్చింది. ఏ లైన్‌నైనా తెరిచి, అది ఎక్కడి నుంచి వచ్చిందో చూడండి.",
    grossIncome: "వచ్చినదంతా",
    standardDeduction: "ప్రామాణిక మినహాయింపు",
    deductionsLine: "మీరు చేసిన క్లెయిమ్‌లు",
    taxableIncome: "పన్ను నిజంగా పడే ఆదాయం",
    slabTax: "ఏ మినహాయింపుకూ ముందు పన్ను",
    rebate87A: "ఇందులో కొంతని రద్దు చేసే రిబేట్",
    cess: "ఆరోగ్య-విద్యా అదనపు మొత్తం",
    totalTax: "ఈ ఏడాది మొత్తం పన్ను",
    tdsCredits: "మీ నుంచి ఇప్పటికే తీసుకున్నది",
    refundDue: "మీకు తిరిగి వస్తుంది",
    balanceDue: "కట్టాల్సింది",
    openLine: "ఇది ఎక్కడి నుంచి వచ్చిందో చూపించండి",
    closeLine: "దాచండి",
    calculationStatus:
      "ఇది ప్రోటోటైప్ లెక్క — నియమాల ఇన్‌పుట్‌లకు ఇంకా ప్రాథమిక-మూలం ధృవీకరణ కావాలి (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} కింద ఉన్న నిర్ధారిత వాస్తవాలు, పన్ను క్రెడిట్ల నుంచి లెక్కించబడింది. ఈ నమూనాలో మూల రికార్డులు కృత్రిమమైనవి.`,
    showCalculationTrail: "మూలం, లెక్కల జాడ చూపించండి",
    hideCalculationTrail: "మూలం, లెక్కల జాడ దాచండి",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} న నివేదించారు`,
    sourceIdentifier: (identifier: string) => `రికార్డు ${identifier}`,
    selfReportedSource: "ఈ రిటర్న్‌లో మీరు నివేదించినది",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS (వార్షిక సమాచార నివేదిక): నివేదించే సంస్థల నుంచి అందిన సమాచారం."
        : statement === "26AS"
        ? "Form 26AS: మీ PAN పై నివేదించిన పన్నును చూపే పన్ను-క్రెడిట్ నివేదిక."
        : "ఈ వాస్తవానికి జతచేసిన మూల రికార్డు.",
    sectionMeaning: (section: string) =>
      `${section} ఒక మినహాయింపు సెక్షన్. ఈ విధానం అనుమతిస్తేనే ఇది లెక్కలోకి వస్తుంది.`,
    explainGross: "మీరు సరిచూసి నిర్ధారించిన వాస్తవాలను కూడి వచ్చినది.",
    explainStd: (amount: string) =>
      `జీతం ఆదాయం ఉన్న ప్రతి ఒక్కరికీ, ఏమీ క్లెయిమ్ చేయకుండానే ${amount} తగ్గుతుంది.`,
    explainDeductions: "ఈ విధానం అనుమతించే క్లెయిమ్‌లే లెక్కలోకి వస్తాయి.",
    explainDisallowed: (section: string) =>
      `${section} ఈ విధానంలో అనుమతించబడదు, కాబట్టి ఇక్కడ దీని వల్ల ఏమీ జరగదు.`,
    explainTaxable:
      "వచ్చినదాని నుంచి ప్రామాణిక మినహాయింపు, మీ క్లెయిమ్‌లు తీసేసిన తర్వాత మిగిలేది.",
    explainSlab:
      "పన్ను ముక్కలుగా పడుతుంది — ఆదాయపు ఒక్కో ముక్కకు దాని సొంత రేటు.",
    explainRebate: (amount: string) =>
      `ఒక పరిమితి కంటే తక్కువైతే పన్నులో చాలా భాగం రద్దవుతుంది — ఇక్కడ ${amount}.`,
    explainCess: "ప్రతి మినహాయింపు తర్వాత, పైన కలిపే చిన్న శాతం.",
    explainTds:
      "TDS అంటే మూలం వద్దే తీసేసిన పన్ను: డబ్బు మీకు చేరక ముందే, చెల్లించినవారు దీన్ని పట్టుకున్నారు.",
    fromFacts: "ఈ వాస్తవాల నుంచి:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "పంపడానికి సిద్ధమేనా?",
    sub: "ఒకసారి వెళ్లాక, మార్చాలంటే మళ్లీ ఫైల్ చేయాల్సిందే. మరోసారి చూసి, ఆపై పంపండి.",
    stepChecking: "లెక్కలు సరిచూస్తున్నాం…",
    stepSealing: "సంఖ్యలను సీలు చేస్తున్నాం…",
    stepFiled: "ఫైల్ అయింది.",
    ackHeading: "వెళ్లిపోయింది.",
    ackBody:
      "మీ రిటర్న్ ఈరోజు నుంచి లెక్కలోకి వస్తుంది. ఒక్క అడుగు మిగిలింది: అడిగినప్పుడు ఇది నిజంగా మీరే అని నిర్ధారించడం. అప్పటివరకు ఇది పంపనట్టుగానే లెక్క.",
    ackNext:
      "ఆ తర్వాత, మీ డబ్బు ఎక్కడ ఉందో, దాన్ని ఏది ఆపగలదో ట్రాకర్ కచ్చితంగా చూపిస్తుంది.",
    errorCause: "సరిచూసే దశ విఫలమైంది — sandbox fault switch ఆన్‌లో ఉంది.",
    errorAction:
      "రివ్యూయర్ డ్రాయర్‌లో 'Trigger API Gateway Timeout' ఆఫ్ చేసి, మళ్లీ పంపండి. ఏదీ పోలేదు.",
    errorCauseNetwork: "మీ రిటర్న్ సర్వర్‌ను చేరలేదు.",
    errorActionNetwork:
      "ఏదీ ఫైల్ కాలేదు, ఏదీ పోలేదు. మీ కనెక్షన్ చూసుకుని, మళ్లీ పంపండి.",
    retry: "మళ్లీ పంపే ప్రయత్నం చేయండి",
  },

  wizard: {
    identityNextHint:
      "కొనసాగడానికి మీ పూర్తి పేరు, 10 అక్షరాల PAN నమోదు చేయండి.",
    employmentConfirmHint:
      "మీ మునుపటి జవాబు నుంచి — ఇది మారితే వేరే ఎంపికను నొక్కండి.",
    tdsZeroWarning:
      "జీతం ఉద్యోగంలో దాదాపు ఎప్పుడూ పన్ను ముందే తీసేసి ఉంటుంది — అది మీ Form 16 లేదా జీతం స్లిప్‌లో ఉంటుంది. ఇక్కడ 0 అని రాయడం అంటే చాలాసార్లు మీ రీఫండ్‌ను వదులుకోవడమే.",
  },

  timeline: {
    filed: "మీ రిటర్న్ పంపేశారు.",
    verified:
      "ఇది మీరే అని నిర్ధారించారు. రిటర్న్ ఇక్కడి నుంచి లెక్కలోకి వస్తుంది.",
    in_queue: "ఆ వారంలో ఫైల్ అయిన మిగతా వాటితో పాటు వరుసలో.",
    under_review: "ఇప్పుడు ఎవరో దీన్ని చూస్తున్నారు.",
    determined: "నిర్ణయమైంది — ఇంతే తిరిగి వస్తుంది.",
    sent_to_bank: "మీ బ్యాంకుకు పంపారు.",
    credited: "మీ ఖాతాలో.",
  },

  refund: {
    heading: (amount: string) => `${amount} మీ దగ్గరకు వస్తోంది`,
    filedDaysAgo: (days: number) => `మీరు ${days} రోజుల క్రితం ఫైల్ చేశారు`,

    holdsHeading: (n: number) =>
      n === 1 ? "ఒక్క విషయం కోసం ఆగి ఉంది" : `${n} విషయాల కోసం ఆగి ఉంది`,
    clearsInDays: (days: number) =>
      days === 1
        ? "అది అయిపోయాక సుమారు ఒక రోజు"
        : `అది అయిపోయాక సుమారు ${days} రోజులు`,

    cohortWindow: (from: number, to: number) =>
      `మీరు ఫైల్ చేసిన అదే వారంలో వచ్చిన రిటర్న్‌లు ఇప్పుడు ప్రాసెస్ అవుతున్నాయి. ${from} నుంచి ${to} రోజులు పట్టవచ్చు.`,

    states: {
      not_filed: "ఇంకా పంపలేదు",
      filed_unverified: "పంపారు, ఇది మీరే అన్న నిర్ధారణ కోసం వేచి ఉంది",
      verified: "మీరు నిర్ధారించారు",
      in_queue: "వరుసలో",
      under_review: "ఎవరో చూస్తున్నారు",
      determined: "నిర్ణయమైంది",
      sent_to_bank: "మీ బ్యాంకుకు పంపారు",
      credited: "మీ ఖాతాలో పడింది",
      failed: "మీ ఖాతాను చేరలేకపోయింది",
    },

    bankFailedHeading: "మీరు ఎంచుకున్న ఖాతా ఈ డబ్బును అందుకోలేకపోతోంది.",
    bankMergedInto: (bank: string) => `ఆ శాఖ ఇప్పుడు ${bank}లో భాగం`,
    useThisAccount: "బదులుగా ఇక్కడికి పంపండి",
    resolvedHold: "సర్దుకుంది — ఇక ఇది దేన్నీ ఆపదు.",
    stampFiled: "ఫైల్ అయింది",
  },

  notices: {
    heading: "శాఖ నుంచి వచ్చిన ఉత్తరాలు",
    none: "ఏదీ తిరిగి రాలేదు. అదే మంచి ఫలితం.",
    respondBy: (date: string) => `${date} లోపు జవాబివ్వండి`,
    ifYouDoNothing: "మీరు ఏమీ చేయకపోతే",
    basedOn: "ఇది దేని ఆధారంగా",
    theCatch: "వారు తప్పుగా అనుకున్నది",
    agree: "ఇది సరైనదే",
    disagree: "ఇది తప్పు",
    dinLabel: "ఈ ఉత్తరంపై ఉన్న రిఫరెన్స్ నంబరు",
    dinExplain:
      "శాఖ నుంచి వచ్చే ప్రతి ఉత్తరంపైనా ఇది ఉండాలి. అది లేకపోతే, ఆ ఉత్తరం అధికారికంగా లేనట్టే.",
  },

  dashboard: {
    serverFilings: "సర్వర్‌లో నమోదైనవి",
    serverFilingsEmpty:
      "ఈ PAN కు LIVE బ్యాక్‌ఎండ్‌లో ఇంకా ఫైలింగ్‌లు లేవు — పైన ఉన్న అక్నాలెడ్జ్‌మెంట్ సీడ్ చేసిన కథలో భాగం. ఈ యాప్ నుంచి ఫైల్ చేస్తే నిజమైన రసీదు ఇక్కడ కనిపిస్తుంది.",
    greetingLabel: "మీ సైన్-ఇన్ పదబంధం",
    greetingWhy:
      "ఖాతా సృష్టించినప్పుడు ఈ పదబంధాన్ని మీరే ఎంచుకున్నారు. దీన్ని చూపించలేని పేజీ మేము కాదు.",
    userDashboard: "యూజర్ డ్యాష్‌బోర్డ్",
    taxPrefills: "పన్ను ప్రీఫిల్స్ (AIS/26AS)",
    pendingActions: "పెండింగ్ చర్యలు",
    returnSummary: "రిటర్న్ సారాంశం AY 2026-27",
    reviewPrefill:
      "పన్ను ప్రీఫిల్స్ ట్యాబ్‌లోని ముందుగా నింపిన వివరాలను సరిచూసి, ఫైల్ చేయడానికి నిర్ధారించండి.",
    filingSubmitted:
      "మీ ఇ-ఫైలింగ్ రిటర్న్ సమర్పించబడింది. టైమ్‌లైన్‌లో పురోగతి చూడండి.",
    verifiedBanks: "రీఫండ్ కోసం ధృవీకరించిన బ్యాంకు ఖాతాలు",
    primaryRefundAccount: "ప్రధాన రీఫండ్ ఖాతా",
    backupAccount: "బ్యాకప్ ఖాతా",
    ifscMeaning:
      "IFSC అంటే రీఫండ్ పంపడానికి వాడే 11 అక్షరాల బ్యాంకు రూటింగ్ కోడ్.",
    refundTimeline: "రీఫండ్ టైమ్‌లైన్",
    filingSubmittedTimeline: "ఫైలింగ్ సమర్పించారు",
    identityVerifiedTimeline: "గుర్తింపు ధృవీకరించారు",
    assessmentProcessingTimeline: "అసెస్‌మెంట్ ప్రాసెసింగ్",
    refundApprovedTimeline: "రీఫండ్ ఆమోదించారు",
    refundCreditedTimeline: "రీఫండ్ ఖాతాలో పడింది",
    holdActive: "హోల్డ్ ఉంది: యాక్షన్ ట్యాబ్‌లోని చర్యలను పూర్తి చేయండి",
    successCheckApp: "విజయవంతం! మీ బ్యాంకింగ్ యాప్ చూడండి.",
    outstandingNotices: "పెండింగ్‌లో ఉన్న కంప్లయన్స్ నోటీసులు",
    noPendingActions: "పెండింగ్ చర్యలు లేవు",
    accountCompliant:
      "మీ ఖాతా పూర్తిగా అనుకూలంగా ఉంది; పెండింగ్ నోటీసులు గానీ పన్ను డిమాండ్లు గానీ లేవు.",
    actionableHolds: "చర్య తీసుకోగల అసెస్‌మెంట్ హోల్డ్‌లు",
    uploadRent: "అద్దె ఒప్పందం / రసీదులు అప్‌లోడ్ చేయండి",
    landlordName: "ఇంటి యజమాని పేరు",
    landlordPan: "ఇంటి యజమాని PAN (10 అంకెలు)",
    selectPdfJpg: "PDF/JPG ఎంచుకోండి",
    submitReceipt: "రసీదు సమర్పించండి",
    responsePosition: "జవాబు వైఖరి",
    agreeDept: "నేను శాఖతో ఏకీభవిస్తున్నాను",
    disagreeProof: "నేను ఏకీభవించడం లేదు (రుజువు సమర్పిస్తాను)",
    responseDraft: "జవాబు ప్రకటన (డ్రాఫ్ట్)",
    dictateStatement: "మాట్లాడి రాయించండి",
    sendResponse: "జవాబు పంపండి",
    filingStatusLabel: "ఫైలింగ్ స్థితి",
    bankValidated: "ధృవీకరించారు",
    bankUnderProcess: "ప్రాసెస్‌లో ఉంది",
    bankFailed: "విఫలమైంది",
    staleIfscHold: "ఈ బ్యాంకు కోడ్ ఇక పనిచేయడం లేదు.",
    switchToNewIfsc: (ifsc: string) => `కొత్త కోడ్‌కు మారండి (${ifsc})`,
    personalized: {
      eyebrow: "మీ డ్యాష్‌బోర్డ్",
      headingFiled: "మీ రిటర్న్ వెళ్లిపోయింది — ఇప్పుడు అది ఎక్కడ ఉందో ఇదిగో",
      heading: {
        file_return: "మీ రిటర్న్‌ను సిద్ధం చేద్దాం",
        check_refund: "ఎంత తిరిగి రావచ్చో చూద్దాం",
        understand_notice: "శ్రద్ధ కావాల్సిన విషయాన్ని చూసుకుందాం",
        correct_prefill: "నివేదించిన వివరాలను సరిచూద్దాం",
      },
      guidedBody: "ప్రతి సంఖ్యనూ మీరు నిర్ధారించే ముందు దాన్ని వివరిస్తాం.",
      quickBody: "దారిని పొట్టిగా ఉంచి, తర్వాతి నిర్ణయాన్ని ముందుంచుతాం.",
      unfiledBody:
        "ముందుగా, మీ గురించి ఇప్పటికే నివేదించిన సమాచారాన్ని నిర్ధారించండి.",
      filedBody: "మీరు వచ్చిన పనికి బాగా సరిపోయే వీక్షణను తెరిచాం.",
      primaryAction: {
        facts: "నా నివేదిత వివరాలు చూస్తాను",
        overview: "నా రీఫండ్ ట్రాకర్ చూపించండి",
        statement: "నివేదిత వివరాలు సరిచూడండి",
        actions: "శ్రద్ధ కావాల్సినవి చూపించండి",
      },
      focusLabel: "మేము వీటిపై కన్నేసి ఉంచుతాం",
      profileLabels: {
        work: "పని",
        income: "సుమారు మొత్తం ఆదాయం",
        history: "ఫైలింగ్ చరిత్ర",
      },
    },
  },

  onboarding: {
    eyebrow: "మొదలుపెట్టే ముందు",
    title: "దీన్ని మీ కోసం అమర్చుకుందాం.",
    intro:
      "ఐదు చిన్న జవాబులు సరైన భాష, వేగం, పన్ను ప్రశ్నలను ఎంచుకోవడంలో సాయపడతాయి. తర్వాత మార్చుకోవచ్చు.",
    languageQuestion: "ఏ భాష వాడాలి?",
    languageHelp: "మొదట అడిగేది ఇదే. ఎప్పుడైనా మార్చుకోవచ్చు.",
    intentQuestion: "ఈరోజు మీరు ఎందుకు వచ్చారు?",
    intentHelp: "ఆ పనినే ముందుంచుతాం.",
    intentOptions: {
      file_return: {
        label: "ఈ ఏడాది రిటర్న్ ఫైల్ చేయడానికి",
        detail: "మీ గురించి ఇప్పటికే తెలిసిన దానితో మొదలుపెడదాం.",
      },
      check_refund: {
        label: "నాకు డబ్బు రావాలా అని చూడటానికి",
        detail: "ఏమి నివేదించారో, ఏమి కట్టారో, ఏమి తిరిగి రావచ్చో చూడండి.",
      },
      understand_notice: {
        label: "ఉత్తరం లేదా నోటీసును అర్థం చేసుకోవడానికి",
        detail: "అది ఏమంటుందో, ఏమి ప్రమాదంలో ఉందో, తర్వాత ఏమి చేయాలో చూడండి.",
      },
      correct_prefill: {
        label: "తప్పుగా కనిపించేదాన్ని సరిచేయడానికి",
        detail: "సంఖ్య మూలాన్ని కనుక్కుని, ఏమి మారాలో నమోదు చేయండి.",
      },
    },
    intentCta: {
      file_return: "నా రిటర్న్ మొదలుపెట్టండి",
      check_refund: "నాకు రావాల్సింది చూడండి",
      understand_notice: "ఏమి చేయాలో చూపించండి",
      correct_prefill: "నివేదించినవి సరిచూడండి",
    },
    situationQuestion: "మీ పన్ను జీవితం గురించి చెప్పండి.",
    situationHelp: "ఇక్కడ రెండు చిన్న జవాబులు చాలు.",
    professionLabel: "మీ పనిని ఏది బాగా వర్ణిస్తుంది?",
    professionOptions: {
      salaried: "జీతం ఉద్యోగం",
      self_employed: "ఫ్రీలాన్స్ లేదా సొంత వృత్తి",
      business_owner: "వ్యాపార యజమాని",
      student: "విద్యార్థి",
      retired: "పదవీ విరమణ పొందారు",
      investor: "పెట్టుబడిదారు",
      other: "మరేదో",
    },
    filingHistoryLabel: "ఇంతకుముందు ఆదాయపు పన్ను రిటర్న్ ఫైల్ చేశారా?",
    filingHistoryOptions: {
      never: "లేదు, ఇదే మొదటిసారి",
      once: "ఒకటి రెండు సార్లు",
      every_year: "ప్రతి ఏటా",
    },
    incomeQuestion: "అన్ని మార్గాల నుంచి మీ మొత్తం ఆదాయం, సుమారుగా ఎంత?",
    incomeHelp: "ఒక శ్రేణి చాలు. ఇప్పుడే కచ్చితమైన సంఖ్య అవసరం లేదు.",
    incomeOptions: {
      none: "ఆదాయం లేదు",
      under_4: "₹4 లక్షల లోపు",
      "4_to_8": "₹4 నుంచి ₹8 లక్షలు",
      "8_to_12": "₹8 నుంచి ₹12 లక్షలు",
      "12_to_25": "₹12 నుంచి ₹25 లక్షలు",
      over_25: "₹25 లక్షల పైన",
    },
    modeQuestion: "ఎంత వివరంగా చూడాలనుకుంటున్నారు?",
    modeHelp:
      "ఇది మొదలుపెట్టే చోటును మాత్రమే నిర్ణయిస్తుంది. ఎప్పుడైనా మార్చవచ్చు.",
    modeOptions: {
      simple: {
        label: "నా కోసం చేసేయండి",
        detail:
          "సులభమైన మాటలు, ఒక్కోసారి ఒక్క అడుగు. మిగతాది మేము చూసుకుంటాం.",
      },
      full: {
        label: "అంతా చూపించండి",
        detail: "ప్రతి సంఖ్య, ప్రతి నియమం, ప్రతి లెక్క — మొదటి నుంచే.",
      },
    },
    focusQuestion: "వీటిలో దేనిపై శ్రద్ధ పెట్టాలి?",
    focusHelp:
      "మీకు సరిపోయేవన్నీ ఎంచుకోండి. ఇంకా తెలియదు అనుకున్నా ఫర్వాలేదు.",
    focusOptions: {
      salary: "జీతం లేదా పింఛను",
      freelance: "ఫ్రీలాన్స్ పని",
      business: "వ్యాపార ఆదాయం",
      rent: "నేను కట్టే లేదా అందుకునే అద్దె",
      interest: "బ్యాంకు వడ్డీ",
      investments: "షేర్లు లేదా పెట్టుబడులు",
      deductions: "పొదుపు, బీమా, గృహ రుణం లేదా NPS",
      not_sure: "ఇంకా నాకు తెలియదు",
    },
    chooseOne: "ఒకటి ఎంచుకోండి",
    chooseAtLeastOne: "కనీసం ఒకటి ఎంచుకోండి",
    questionsLabel: "త్వరిత సెటప్",
    questionsProgress: (current: number, total: number) =>
      `${current} / ${total}`,
    savedLocally: "ఈ నమూనాలో మీ జవాబులు ఈ బ్రౌజర్‌లోనే భద్రమవుతాయి.",
    readyTitle: "దీన్ని మీకు అనుగుణంగా చేయడానికి ఇది చాలు.",
    readyBody:
      "మీకు మొదట ఏమి చూపించాలో ఈ జవాబులు నిర్ణయిస్తాయి. తుది విధాన ఎంపిక మాత్రం మీరు నిర్ధారించే వాస్తవాలు, క్లెయిమ్‌ల ఆధారంగానే జరుగుతుంది.",
    guidedLabel: "మేము ఎలా వివరిస్తాం",
    guidedValue: "వెళ్తూ వెళ్తూ పదాలను వివరిస్తాం.",
    quickValue: "దారిని పొట్టిగా ఉంచుతాం.",
    regimeLabel: "విధానాలను ఎలా చూస్తాం",
    claimsRegimeValue: "విధానం ఎంచుకునే ముందు మీ క్లెయిమ్‌లను సరిచూస్తాం.",
    compareRegimeValue: "మీ వాస్తవాలు నిర్ధారించాక రెండింటినీ పోల్చుతాం.",
    focusLabel: "ముందుగా చూసేది",
    startPath: "నా దారితో మొదలుపెట్టండి",
    changeAnswers: "జవాబులు మార్చండి",
    tailoredBadge: "మీ ప్రారంభ దారి",
    tailoredGuided: "వివరణలతో మార్గదర్శనం",
    tailoredQuick: "పొట్టి దారి",
    tailoredRegimeClaims: "విధాన ఎంపికకు ముందు క్లెయిమ్‌ల సరిచూపు",
    tailoredRegimeCompare: "వాస్తవాల తర్వాత రెండు విధానాల పోలిక",
    tailoredIntent: (intent: string) => `మొదట: ${intent}`,
  },

  checklist: {
    divider: "ఫైల్ చేసే ముందు",
    itemBefore: "“",
    itemAfter: "” నిర్ధారించండి — అనుమానం ఉంటే కార్డును తెరవండి.",
    stdRow: "మీ తరఫున మేము వర్తింపజేసిన ప్రామాణిక మినహాయింపును నిర్ధారించండి.",
    noteLocked: "పైన ఉన్న ప్రతి లైనూ టిక్ చేస్తే, ఈ బటన్ తెరుచుకుంటుంది.",
    noteReady: "పైవన్నీ నిర్ధారితమయ్యాయి. సిద్ధమైనప్పుడు ఫైల్ చేయండి.",
    fileBtn: "ఈ రిటర్న్ ఫైల్ చేయండి",
    lockedBtn: (n: number) =>
      n === 1
        ? "ముందు ఇంకా 1 లైన్ టిక్ చేయండి"
        : `ముందు ఇంకా ${n} లైన్లు టిక్ చేయండి`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `కార్డు ${String(n).padStart(2, "0")} · నివేదించింది ${date}`,
    whatThisMeans: "దీని అర్థం ఏమిటి",
    readFirst: "ముందుగా “దీని అర్థం ఏమిటి” తెరవండి — ఆ తర్వాత నిర్ధారించండి.",
    readyToConfirm: "చదివారా? కింద నిర్ధారించండి.",
  },

  signoff: {
    title: "సంతకం",
    declaration:
      "పైన ఉన్న సంఖ్యలను చదివి, మూల పత్రాలతో సరిచూశాను. అవి సరైనవి, పూర్తి అయినవి.",
    action: "ఈ సంఖ్యలపై సంతకం చేయండి",
    signed: "సంతకం అయింది — పైన ఉన్న ప్రతి సంఖ్యా నిర్ధారితమైంది.",
    hint: "ఒక్క ప్రకటన పైవన్నింటినీ కవర్ చేస్తుంది. ఏదైనా సంఖ్య తప్పు అనిపిస్తే, సంతకానికి ముందు “కాదు, ఇది తప్పు” ఎంచుకోండి.",
  },

  channels: {
    sectionLabel: "ఏడాది ఒక్క చూపులో",
    earned: "మీరు సంపాదించారు",
    toTax: "పన్నుకు వెళ్లింది",
    overpaid: "మీరు ఎక్కువ కట్టారు",
    stillToPay: "ఇంకా కట్టాల్సింది",
    stayed: "మీ దగ్గరే ఉండిపోయింది",
    kept: "మీరు కట్టాల్సిన పన్ను",
    back: "మీకు తిరిగి వస్తోంది",
    yoursInEnd: "చివరికి మీదే",
    collected: "ఇప్పటికే వసూలైంది",
    ofYear: "ఏడాది డబ్బులో",
    sliceNote:
      "కంటికి కనబడనంత సన్నని ముక్కను దాని అసలు వాటా కంటే కొంచెం వెడల్పుగా గీశాం — పక్కనున్న సంఖ్యలు కచ్చితమైనవే.",
    whereItWent: "మీరు సంపాదించిన ప్రతి రూపాయి ఎక్కడికి వెళ్లింది",
    earnedDesc:
      "జీతం, వడ్డీ, మిగతావన్నీ — మీకు చెల్లించినవారు నివేదించినట్టుగా.",
    toTaxDesc:
      "మీకు అర్హమైన ప్రతి మినహాయింపు తర్వాత, మీరు నిజంగా కట్టాల్సింది.",
    backDesc:
      "మీ జీతం నుంచి తీసేశారు, కానీ కట్టాల్సింది కాదు. ఇది మీకు తిరిగి వస్తుంది.",
    dueDesc: "ఇప్పటికే వసూలైన దానికి మించి కట్టాల్సింది. ఇది ఇంకా చెల్లించాలి.",
    howToRead:
      "దీన్ని ఎలా చదవాలి: ఇక్కడ ఏదీ మేము కల్పించలేదు. ప్రతి సంఖ్యా ఎవరో ఫైల్ చేసిన పత్రం నుంచో, మీరే నమోదు చేసిన దాని నుంచో వచ్చింది. పెన్సిల్ గమనికలు ఒక్కోదాని అసలు అర్థాన్ని — పన్ను పదాల్లో కాక, సాదా మాటల్లో — వివరిస్తాయి.",
    meterCap: "మీరు కట్టాల్సిన పన్ను vs ఇప్పటికే వసూలైంది",
  },

  agent: {
    title: "వాప్సీ అసిస్టెంట్",
    open: "అసిస్టెంట్‌ను తెరవండి",
    close: "మూసివేయి",
    placeholder: "సరిచూడమని, వివరించమని, ఫైల్ చేయమని అడగండి…",
    send: "పంపండి",
    thinking: "పనిలో ఉన్నాం…",
    toolRan: "చేసింది:",
    confirmTitle: "ఫైల్ చేయడానికి సిద్ధం — సంఖ్యలను నిర్ధారించండి",
    confirmBody: "మీరు నిర్ధారించే వరకు ఏదీ ఫైల్ కాదు. సమర్పించబోయేది ఇది:",
    confirmTotalTax: "మొత్తం పన్ను",
    confirmRefund: "మీకు రావాల్సిన రీఫండ్",
    confirmDue: "చెల్లించాల్సిన బాకీ",
    confirmTaxable: "పన్ను పడే ఆదాయం",
    confirmButton: "నిర్ధారించి ఫైల్ చేయండి",
    cancelButton: "రద్దు చేయండి",
    filingDismissed: "సరే — ఏదీ ఫైల్ కాలేదు.",
    error:
      "అసిస్టెంట్‌ను చేరుకోలేకపోయాం. మీ రిటర్న్‌ను ముట్టుకోలేదు — మళ్లీ ప్రయత్నించండి.",
    intro:
      "నేను మీ రిటర్న్ సరిచూడగలను, ఏ సంఖ్యనైనా వివరించగలను, ఏమైతే-ఏమవుతుంది లెక్కలు వేయగలను, ఫైలింగ్ సిద్ధం చేయగలను. ఏదైనా ఫైల్ అయ్యే ముందు నిర్ధారణ ఎప్పుడూ మీదే.",
    sample: "80C కింద ₹1,50,000 పెట్టుబడి పెడితే నాకు ఎంత ఆదా అవుతుంది?",
  },

  footer: {
    prototype: "స్వతంత్ర భావన నమూనా.",
    notAffiliated:
      "ఇది ఆదాయపు పన్ను శాఖతో, CBDTతో, భారత ప్రభుత్వంతో సంబంధం ఉన్నది కాదు, వారి ఆమోదం పొందినదీ కాదు. ఇక్కడి ప్రతి పేరు, PAN, మొత్తం, పత్రం కల్పితమే. ఏ ప్రత్యక్ష ప్రభుత్వ వ్యవస్థతోనూ సంప్రదింపు జరగదు.",
    honestyLink: "ఏది నిజమో, ఏది మాక్ చేసిందో సరిగ్గా చూడండి",
  },
};

/**
 * Telugu translations for the mock/demo strings surfaced through
 * LOCALIZED_MOCK_STRINGS. Model-generated, awaiting native-speaker review
 * (project task T0.5). Keys must stay byte-identical to the English strings
 * in components/mock-i18n.ts.
 */
export const teMock: Record<string, string> = {
  "Your pay last year": "గత ఏడాది మీ జీతం",
  "Interest your savings account earned": "మీ పొదుపు ఖాతా సంపాదించిన వడ్డీ",
  "Interest your accounts earned": "మీ ఖాతాలు సంపాదించిన వడ్డీ",
  "Your primary contract income": "మీ ప్రధాన కాంట్రాక్టు ఆదాయం",
  "Savings interest": "పొదుపు ఖాతా వడ్డీ",
  "Tax withheld (TDS)": "ముందే తీసేసిన పన్ను (TDS)",
  "Provident Fund / ELSS Mutual Funds":
    "ప్రావిడెంట్ ఫండ్ / ELSS మ్యూచువల్ ఫండ్స్",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "ఆమె జీతం నుంచి ₹8,400 తీసేశారు. ఆమె కట్టాల్సింది ఏమీ లేదు. ఇంకా ఫైల్ చేయలేదు; స్కూలు ఫీజు కట్టాల్సి ఉంది.",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "రెండు నోటీసులు. ఒకటి అతను ₹1,10,000 షేర్ల లాభాన్ని దాచాడని అంటోంది — నిజానికి అతనికి ₹4,200 నష్టం వచ్చింది. మరొకటి అతను ఎప్పుడూ వినని 2019 బిల్లు కోసం రీఫండ్‌లో కొంత భాగం ఉంచుకోవాలనుకుంటోంది.",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 రోజుల క్రితం ఫైల్ చేసింది. పోర్టల్ ‘ప్రాసెసింగ్‌లో ఉంది’ అని తప్ప ఇంకేమీ చెప్పడం లేదు. నిజానికి రెండు వేర్వేరు విషయాలు ఆమె ₹34,800ని ఆపి ఉంచాయి.",
  "Tax already taken out of your pay":
    "మీ జీతం నుంచి ఇప్పటికే తీసేసిన పన్ను (TDS)",
  "Dividend your shares paid out": "మీ షేర్లు చెల్లించిన డివిడెండ్",
  "Money from selling shares": "షేర్లు అమ్మగా వచ్చిన డబ్బు",
  "Tax the bank withheld on your interest":
    "మీ వడ్డీపై బ్యాంకు తీసేసిన పన్ను (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "ప్రావిడెంట్ ఫండ్ (PF), బీమా, మీ కూతురి ట్యూషన్ ఫీజు",
  "Provident fund and your insurance premium":
    "ప్రావిడెంట్ ఫండ్ (PF), మీ బీమా ప్రీమియం",
  "Health cover for the family": "కుటుంబానికి ఆరోగ్య బీమా",
  "Rent you paid, with no house-rent allowance from your employer":
    "మీరు కట్టిన అద్దె — యజమాని నుంచి ఇంటి అద్దె అలవెన్స్ లేకుండా",
  "One figure doesn't match what your broker reported.":
    "ఒక సంఖ్య మీ బ్రోకర్ నివేదించినదానితో సరిపోలడం లేదు.",
  "₹18,740 of this is being held against an old bill.":
    "ఇందులో ₹18,740 ఒక పాత బిల్లు కోసం ఆపి ఉంచారు.",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "మీరు ₹1,10,000 షేర్ల లాభాన్ని వదిలేశారని శాఖ అనుకుంటోంది.",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019 బిల్లును సర్దుబాటు చేయడానికి మీ రీఫండ్‌లో ₹18,740 ఉంచుకోవాలని శాఖ అనుకుంటోంది.",
  "Waiting on one thing: a receipt for your rent claim.":
    "ఒక్క విషయం కోసం ఆగి ఉంది: మీ అద్దె క్లెయిమ్‌కు రసీదు.",
  "The account you chose can't receive the money.":
    "మీరు ఎంచుకున్న ఖాతా ఈ డబ్బును అందుకోలేకపోతోంది.",
  "Held: your rent claim needs a receipt.":
    "ఆగింది: మీ అద్దె క్లెయిమ్‌కు రసీదు కావాలి.",
  "Your bank account was checked and failed.":
    "మీ బ్యాంకు ఖాతాను సరిచూశారు — అది విఫలమైంది.",
  "The department is asking you to look again at your rent claim.":
    "మీ అద్దె క్లెయిమ్‌ను మరోసారి చూడమని శాఖ అడుగుతోంది.",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities షేర్ల అమ్మకాల నుంచి ₹1,10,000 నివేదించింది. మీ రిటర్న్ దాన్ని చూపడం లేదు. అది తేలే వరకు రీఫండ్ అక్కడే ఆగి ఉంటుంది.",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 నాటి ఒక డిమాండ్‌ను ఈ ఏడాది రీఫండ్‌లో సర్దుబాటు చేస్తున్నారు. మీరు దీన్ని వ్యతిరేకించవచ్చు; 3వ తేదీలోపు దీన్ని చదవండి.",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "సెప్టెంబర్ 10లోపు మీరు ఏమీ చెప్పకపోతే, ₹1,10,000 మీ ఆదాయంలో కలుస్తుంది, మీ రీఫండ్ నుంచి సుమారు ₹34,300 పోతుంది.",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "సెప్టెంబర్ 3లోపు మీరు ఏమీ చెప్పకపోతే, మీ రీఫండ్ నుంచి ₹18,740 తీసేసి, విషయం ముగిసినట్టుగా భావిస్తారు.",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "మీరు ₹1,10,000కి షేర్లు అమ్మి, వాటిపై లాభాన్ని ప్రకటించలేదు.",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 అనేది నేను అమ్మిన వాటన్నింటి మొత్తం విలువ, నా లాభం కాదు. ఆ లావాదేవీలలో నాకు ₹4,200 నష్టం వచ్చింది. నా బ్రోకర్ వార్షిక స్టేట్‌మెంట్ కొన్న ధరలను చూపిస్తుంది.",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 సంవత్సరానికి మీరు ఇంకా ₹18,740 బాకీ ఉన్నారు, కాబట్టి అది ఈ ఏడాది రీఫండ్ నుంచి తీసుకుంటారు.",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "మీరు ₹60,000 అద్దె క్లెయిమ్ చేశారు. దాన్ని చూపేందుకు ఏదీ జతచేయలేదు. రసీదు లేదా మీ ఇంటి యజమాని పేరు, PAN జోడిస్తే ఇది ముందుకు కదులుతుంది.",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank గత ఏడాది Deccan Union Bankలో భాగమైంది. ఖాతా ఇంకా ఉంది — కానీ దానికి డబ్బు పంపే కోడ్ (IFSC) ఇప్పుడు లేదు.",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "మీరు 80GG కింద ₹60,000 అద్దె క్లెయిమ్ చేశారు, మద్దతుగా ఏదీ జతచేయలేదు.",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "నేను ఈ అద్దె నిజంగా కట్టాను. నా ఇంటి యజమాని ఇచ్చిన నెలవారీ రసీదులు నా దగ్గర ఉన్నాయి; వారి పేరు, PAN ఇవ్వగలను.",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "ఇది నింద కాదు, ఇప్పటివరకు జరిమానా ఏమీ లేదు. కానీ మీరు క్లెయిమ్‌కు రుజువు ఇచ్చే వరకో, దాన్ని వెనక్కి తీసుకునే వరకో మీ ₹34,800 అక్కడే ఉంటుంది.",
  "Look at what they reported": "వారు నివేదించినది చూడండి",
  "Read the 2019 demand": "2019 డిమాండ్ చదవండి",
  "Add the receipt": "రసీదు జోడించండి",
  "Point it at the right account": "సరైన ఖాతాకు మార్చండి",
  "Supervisor, garment unit": "సూపర్‌వైజర్, గార్మెంట్ యూనిట్",
  "Operations manager; trades equity on the side":
    "ఆపరేషన్స్ మేనేజర్; పక్కగా షేర్లలో ట్రేడింగ్ చేస్తారు",
  "Junior architect; first time filing":
    "జూనియర్ ఆర్కిటెక్ట్; మొదటిసారి ఫైల్ చేస్తున్నారు",
  "Independent Consultant": "స్వతంత్ర కన్సల్టెంట్",
  "Primary School Teacher": "ప్రాథమిక పాఠశాల టీచర్",
  "Retired bank clerk": "పదవీ విరమణ పొందిన బ్యాంకు క్లర్క్",
  "Retired": "పదవీ విరమణ పొందారు",
  "Teacher": "టీచర్",
  "You sent your return in.": "మీ రిటర్న్ పంపేశారు.",
  "You confirmed it was you. The return counts from here.":
    "ఇది మీరే అని నిర్ధారించారు. రిటర్న్ ఇక్కడి నుంచి లెక్కలోకి వస్తుంది.",
  "In the queue with everything else filed that week.":
    "ఆ వారంలో ఫైల్ అయిన మిగతా వాటితో పాటు వరుసలో ఉంది.",
  "Someone is looking at one figure.": "ఒక సంఖ్యను ఎవరో చూస్తున్నారు.",
  "A share-sale row your broker filed doesn't line up with your return.":
    "మీ బ్రోకర్ ఫైల్ చేసిన ఒక షేర్ల-అమ్మకం వరుస మీ రిటర్న్‌తో సరిపోలడం లేదు.",
  "OTP verified, 4 minutes after filing.":
    "OTP ధృవీకరించారు, ఫైల్ చేసిన 4 నిమిషాలకు.",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG కింద ₹60,000 క్లెయిమ్ చేశారు, మద్దతుగా ఏదీ జతచేయలేదు.",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank తనిఖీని వెనక్కి పంపింది: IFSC GODG0004417 ఇక ఎక్కడికీ చేరదు.",
  "OTP Verification Complete": "OTP ధృవీకరణ పూర్తయింది",
  "Outstanding Compliance Notices": "పెండింగ్‌లో ఉన్న కంప్లయన్స్ నోటీసులు",
  "Draft Legal Response": "చట్టపరమైన జవాబు డ్రాఫ్ట్ చేయండి",
  "No Pending Actions": "పెండింగ్ చర్యలు లేవు",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "మీ ఖాతా పూర్తిగా అనుకూలంగా ఉంది; పెండింగ్ నోటీసులు గానీ పన్ను డిమాండ్లు గానీ లేవు.",
  "Actionable Assessment Holds": "చర్య తీసుకోగల అసెస్‌మెంట్ హోల్డ్‌లు",
  "Upload Rent Agreement / Receipts": "అద్దె ఒప్పందం / రసీదులు అప్‌లోడ్ చేయండి",
  "Landlord Name": "ఇంటి యజమాని పేరు",
  "Landlord PAN (10 Digits)": "ఇంటి యజమాని PAN (10 అంకెలు)",
  "Select PDF/JPG": "PDF/JPG ఎంచుకోండి",
  "Submit Receipt": "రసీదు సమర్పించండి",
  "Response Position": "జవాబు వైఖరి",
  "I Agree with Department": "నేను శాఖతో ఏకీభవిస్తున్నాను",
  "I Disagree (Submit Proof)": "నేను ఏకీభవించడం లేదు (రుజువు సమర్పిస్తాను)",
  "Response Statement (Draft)": "జవాబు ప్రకటన (డ్రాఫ్ట్)",
  "Dictate Statement": "మాట్లాడి రాయించండి",
  "Listening...": "వింటున్నాం...",
  "Explain your disagreement or agreement...":
    "మీ అంగీకారాన్ని లేదా అభ్యంతరాన్ని వివరించండి...",
  "Send Response": "జవాబు పంపండి",
  "Cancel": "రద్దు చేయండి",
  "Validate Bank Code": "బ్యాంకు కోడ్ (IFSC) సరిచూడండి",
  "Update Bank IFSC": "బ్యాంకు IFSC నవీకరించండి",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "బ్యాంకు వివరాలను ధృవీకరించడానికి 11 అంకెల బ్యాంకు రూటింగ్ కోడ్ (IFSC) సరిచూడండి.",
  "IFSC Code": "IFSC కోడ్",
};

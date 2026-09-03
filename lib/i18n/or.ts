/**
 * ଓଡ଼ିଆ (Odia). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and awaits review by a native Odia
 * speaker who knows tax vocabulary (project task T0.5). That limitation is
 * disclosed on /honesty rather than hidden.
 *
 * Digits stay Latin. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes
 * and proper nouns stay untranslated, following the hi.ts precedents.
 */

import type { Dict } from "./en";

export const or: Dict = {
  langName: "Odia",
  langNativeName: "ଓଡ଼ିଆ",
  dir: "ltr",

  common: {
    modeAgentic: "Agentic",
    modeManual: "Manual",
    continue: "ଆଗକୁ ଯାଆନ୍ତୁ",
    back: "ପଛକୁ",
    yesThatsRight: "ହଁ, ଏହା ଠିକ୍ ଅଛି",
    noThisIsWrong: "ନା, ଏହା ଭୁଲ୍ ଅଛି",
    iDontUnderstand: "ମୁଁ ଏହା ବୁଝିପାରିଲି ନାହିଁ",
    close: "ବନ୍ଦ କରନ୍ତୁ",
    saveAndGoOn: "ସାଇତି ଆଗକୁ ଯାଆନ୍ତୁ",
    loading: "ଟିକିଏ ଅପେକ୍ଷା କରନ୍ତୁ",
    logOut: "ଲଗ୍ ଆଉଟ୍",
    undo: "ପଛକୁ ନିଅନ୍ତୁ",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ୱାପସୀ",
    subtitle: "ଯାଞ୍ଚ ଓ ଦାଖଲର ସହଜ ବାଟ",
    independent: "ସ୍ୱାଧୀନ ପ୍ରୋଟୋଟାଇପ୍",
    taxYear: "କର ବର୍ଷ 2026-27",
    language: "ଭାଷା",
    light: "ଲାଇଟ୍",
    dark: "ଡାର୍କ",
    sandbox: "ରିଭ୍ୟୁ ଉପକରଣ",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "ମୁଖ୍ୟ ବିଷୟବସ୍ତୁକୁ ଯାଆନ୍ତୁ",
  },

  validate: {
    panTooShort: (n: number) => `ଏପର୍ଯ୍ୟନ୍ତ ${n} ଅକ୍ଷର ହେଲା। PAN ରେ 10ଟି ଥାଏ।`,
    panShape:
      "PAN ରେ ପ୍ରଥମେ ପାଞ୍ଚଟି ଅକ୍ଷର, ତା'ପରେ ଚାରିଟି ଅଙ୍କ, ତା'ପରେ ଗୋଟିଏ ଅକ୍ଷର ଥାଏ — ଯେମିତି DEMPS4417K।",
    panSandboxHint:
      "ଆପଣ ଏଠାରେ ଯାହା ଟାଇପ୍ କରନ୍ତି ତାହା ଆପଣଙ୍କ ବ୍ରାଉଜରରୁ ବାହାରକୁ ଯାଏ ନାହିଁ। ଏହି ପ୍ରୋଟୋଟାଇପ୍‌ର ପ୍ରତ୍ୟେକ PAN DEMP ରୁ ଆରମ୍ଭ ହୁଏ, ତେଣୁ ଅସଲ PAN ଭୁଲରେ ବି ଖୋଜା ଯାଇପାରିବ ନାହିଁ।",
    ifscTooShort: (n: number) => `ଏପର୍ଯ୍ୟନ୍ତ ${n} ଅକ୍ଷର ହେଲା। ବ୍ୟାଙ୍କ କୋଡ୍‌ରେ 11ଟି ଥାଏ।`,
    ifscShape:
      "ବ୍ୟାଙ୍କ କୋଡ୍‌ରେ ପ୍ରଥମେ ଚାରିଟି ଅକ୍ଷର, ତା'ପରେ ଗୋଟିଏ ଶୂନ୍ୟ, ତା'ପରେ ଆଉ ଛଅଟି — ଯେମିତି DECU0834471।",
  },

  landing: {
    question: "ଆୟକର ବିଭାଗ ପାଖରେ ଆପଣଙ୍କ ଟଙ୍କା ଅଟକି ରହିଛି କି?",
    subtext:
      "ଏଠାକୁ ଆସୁଥିବା ଅଧିକାଂଶ ଲୋକଙ୍କୁ କିଛି ଦେବାକୁ ନଥାଏ — ବରଂ ପାଇବାକୁ ଥାଏ। ଆପଣଙ୍କ PAN ଦିଅନ୍ତୁ, କ'ଣ ଅଟକିଛି ଆମେ କହିଦେବୁ।",
    panLabel: "ଆପଣଙ୍କ PAN",
    panHelp: "ଦଶଟି ଅକ୍ଷର, ଆପଣଙ୍କ PAN କାର୍ଡ଼ରୁ",
    panPlaceholder: "ଉଦାହରଣ ସ୍ୱରୂପ, DEMPS4417K",
    check: "ମୋର କେତେ ପାଇବାର ଅଛି ଦେଖନ୍ତୁ",
    orTryAs: "କିମ୍ବା ତିନି ଜଣଙ୍କ ମଧ୍ୟରୁ ଜଣେ ହୋଇ ଦେଖନ୍ତୁ",
    honestyLink: "ଏଠାରେ କ'ଣ ଅସଲ ଓ କ'ଣ ତିଆରି",
    architectureLink: "ଯାନ୍ତ୍ରିକ ଗଠନ",
    badge: "ସରଳ ରିଟର୍ନ, ପ୍ରତ୍ୟକ୍ଷ ପ୍ରମାଣିତ",
    brandTitle: "ଆପଣଙ୍କ ଟଙ୍କା, ଫେରିବା ବାଟରେ।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ଦାଖଲ କରିବା",
      blurb:
        "ତାଙ୍କ ଦରମାରୁ ₹8,400 କଟିଗଲା। ତାଙ୍କର କିଛି ଦେବାର ନାହିଁ, ସେ ଦାଖଲ କରିନାହାନ୍ତି, ଆଉ ସ୍କୁଲ ଫି ଦେବାର ଅଛି।",
      action: "ଯାହା ଆଗରୁ ଜଣା ତାହା ପକ୍କା କରନ୍ତୁ",
    },
    rakesh: {
      phase: "ଏକ ଚିଠି ଆସିଲା",
      blurb:
        "ଚିଠି କହୁଛି ସେ ସେୟାରର ₹1,10,000 ଲାଭ ଲୁଚାଇଛନ୍ତି। ତାଙ୍କ ରିଫଣ୍ଡ ଏକ ପୁରୁଣା ଦାବି ବଦଳରେ ଅଟକାଯାଇଛି, ଯାହା ବିଷୟରେ ତାଙ୍କୁ କେବେ ଜଣାଇ ଦିଆଯାଇ ନଥିଲା।",
      action: "ପଢ଼ନ୍ତୁ ଓ ଅସହମତି ଜଣାନ୍ତୁ",
    },
    priya: {
      phase: "ଅପେକ୍ଷା",
      blurb:
        "71 ଦିନ ତଳେ ଦାଖଲ କରିଥିଲେ। ଏବେ ବି 'ପ୍ରକ୍ରିୟା ଚାଲିଛି' ବୋଲି ଦେଖାଉଛି। ଅସଲରେ ଦୁଇଟି ଜିନିଷ ଅଟକାଇ ରଖିଛି, ଆଉ କେଉଁଟି ତାହା କେହି କହିନାହାନ୍ତି।",
      action: "କ'ଣ ଅଟକାଉଛି ଦେଖନ୍ତୁ",
    },
    custom: {
      phase: "ନିଜେ ତିଆରି କରନ୍ତୁ",
      blurbTitle: "କାଳ୍ପନିକ କେହି ଜଣେ",
      blurb:
        "ଆରମ୍ଭରୁ ଜଣେ ବ୍ୟକ୍ତି ତିଆରି କରନ୍ତୁ — ତାଙ୍କ ରୋଜଗାର, ତାଙ୍କ ଦାବି, କଟିଥିବା କର — ଆଉ ହିସାବ ନିଜେ କେମିତି ମେଳ ଖାଏ ଦେଖନ୍ତୁ।",
      action: "କାହାକୁ ତିଆରି କରନ୍ତୁ",
    },
  },

  login: {
    authVerifying: "ସର୍ଭରରେ ଯାଞ୍ଚ ଚାଲିଛି…",
    authUnreachable:
      "ସାଇନ୍-ଇନ୍ ସର୍ଭର ପର୍ଯ୍ୟନ୍ତ ପହଞ୍ଚି ହେଲା ନାହିଁ। ଆପଣ ଭରିଥିବା କିଛି ହଜିନାହିଁ — ଟିକିଏ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    authRejected: (detail: string) => `ସର୍ଭର ସାଇନ୍-ଇନ୍ ହେବାକୁ ଦେଲା ନାହିଁ: ${detail}`,
    signedInAs: "ସାଇନ୍-ଇନ୍ ହୋଇଗଲା — ସେସନ୍ ଚାଲୁ ଅଛି",
    otpSentTo: (mobile: string) => `ଆମେ ${mobile} କୁ ଏକ କୋଡ୍ ପଠାଇଛୁ`,
    otpLabel: "ଛଅ ଅଙ୍କର କୋଡ୍",
    weWillWait:
      "ଧୀରେ ସୁସ୍ଥେ କରନ୍ତୁ। କୋଡ୍ ଅପେକ୍ଷାରେ ଥିବା ବେଳେ ଆପଣ ଭରିଥିବା କିଛି ହଜିବ ନାହିଁ।",
    resend: "ପୁଣି ପଠାନ୍ତୁ",
    resendIn: (seconds: number) => `${seconds} ସେକେଣ୍ଡ ପରେ ଆଉ ଥରେ ମାଗିପାରିବେ`,
    mockNotice:
      "ଏହା ଏକ ପ୍ରୋଟୋଟାଇପ୍, ତେଣୁ କୋଡ୍ ସ୍କ୍ରିନ୍‌ରେ ହିଁ ଦେଖାଯାଉଛି। କୌଣସି ଅସଲ ମେସେଜ୍ ପଠାଯାଉ ନାହିଁ।",
    portalHeading: "ଇ-ଫାଇଲିଂ ଯାଞ୍ଚ",
    incorrectCode: "ଏହି କୋଡ୍ ମେଳ ଖାଉ ନାହିଁ। ଛଅଟି ଅଙ୍କ ପୁଣି ଦେଖି ଆଉ ଥରେ ଚେଷ୍ଟା କରନ୍ତୁ।",
    prototypeBox: "ପ୍ରୋଟୋଟାଇପ୍ OTP ଯାଞ୍ଚ",
    mockCodeLabel: "ମକ୍ କୋଡ୍",
    autoFill: "ମୋ ପାଇଁ ଭରିଦିଅନ୍ତୁ",
    verifyEnter: "ଯାଞ୍ଚ କରି ଭିତରକୁ ଯାଆନ୍ତୁ",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "ଛଅ ଅଙ୍କର ଯାଞ୍ଚ କୋଡ୍",
    otpDigitLabel: (position: number, total: number) =>
      `ଅଙ୍କ ${position}, ମୋଟ ${total} ମଧ୍ୟରୁ`,
    draftRestored: (time: string) => `ଆପଣଙ୍କ ${time}ର ଡ୍ରାଫ୍ଟ ଫେରାଇ ଅଣାଗଲା। କିଛି ହଜିନାହିଁ।`,
  },

  file: {
    heading: (amount: string) => `ଆପଣଙ୍କ ${amount} ବିଭାଗ ପାଖରେ ପଡ଼ି ରହିଛି`,
    subheading:
      "ତଳେ ଥିବା ପ୍ରାୟ ପ୍ରତ୍ୟେକ କଥା ଆପଣଙ୍କ ବିଷୟରେ ଆଗରୁ ଜଣାଇ ଦିଆଯାଇଛି। ତାହା ପଢ଼ନ୍ତୁ, ଆଉ କିଛି ଭୁଲ୍ ଥିଲେ ଆମକୁ କୁହନ୍ତୁ।",

    checkThis: "ଏହା କେବଳ ଦେଖନ୍ତୁ — ଭରିବାର ନାହିଁ",
    factMeaning: "ଏହା ଆଗରୁ ଜଣାଯାଇଥିବା ତଥ୍ୟ, କରର ନିୟମ ନୁହେଁ। ତଳର ହିସାବ ଏଥିରୁ ହିଁ ହୁଏ।",
    factMeaningByKind: {
      salary: "ଆପଣଙ୍କ ପାଖରେ ପହଞ୍ଚିଥିବା ଦରମାରୁ ଆପଣଙ୍କ ନିଯୁକ୍ତିଦାତା ଏହା ଜଣାଇଛନ୍ତି। ତଳର ସମସ୍ତ ହିସାବ ଏଠାରୁ ହିଁ ଆରମ୍ଭ ହୁଏ।",
      interest: "ବ୍ୟାଙ୍କ ବର୍ଷକୁ ଥରେ ଆପଣଙ୍କ ଖାତାରେ ମିଳିଥିବା ସୁଧ ଜଣାନ୍ତି। ଛୋଟ ଅଙ୍କ ବି ଆୟ ହିଁ।",
      dividend: "କମ୍ପାନୀ ରେଜିଷ୍ଟ୍ରାର୍ ଆପଣଙ୍କ ସେୟାର ଦେଇଥିବା ଟଙ୍କା ଜଣାଇଛନ୍ତି। ଯେଉଁ ବର୍ଷ ମିଳିଛି ସେହି ବର୍ଷର ଆୟ ବୋଲି ଧରାଯାଏ।",
      capital_gains: "ଆପଣଙ୍କ ବ୍ରୋକର୍ ସେୟାର ବିକ୍ରିରୁ ମିଳିଥିବା ଟଙ୍କା ଜଣାଇଛନ୍ତି। କର ଲାଭ ଉପରେ ଲାଗେ — ହାର ନିର୍ଭର କରେ କ'ଣ ବିକ୍ରି ହେଲା ଓ କେତେ ଦିନ ରଖାଯାଇଥିଲା ତା' ଉପରେ।",
      rent: "ମିଳିଥିବା ଭଡ଼ା ଆୟ; ଦିଆଯାଇଥିବା ଭଡ଼ା ଆପଣଙ୍କ କର କମାଇ ପାରେ। ଦୁଇ ପଟର ନଥି ମେଳ ଖାଇବା ଦରକାର।",
      other: "ଅନ୍ୟ କୌଣସି ଭାଗରେ ନ ପଡ଼ୁଥିବା ଜଣାଯାଇଥିବା ଆୟ। ତାହା ବି ତଳର ହିସାବରେ ଧରାଯାଏ।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ${date} ଦିନ ବିଭାଗକୁ ଏହା ଜଣାଇଥିଲେ`,
    underIdentifier: (identifier: string) => `ପଞ୍ଜୀକରଣ ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `ଏହା ଭୁଲ୍ ଥିଲେ ମୂଳ ଜାଗାରେ କେବଳ ${reporter} ହିଁ ବଦଳାଇ ପାରିବେ। ସେମାନଙ୍କୁ ଠିକ୍ କ'ଣ ମାଗିବେ ଆମେ କହିଦେବୁ।`,

    whatYouEarned: "ଆପଣ କେତେ ରୋଜଗାର କଲେ",
    whatWasDeducted: "ଆଗରୁ କଟିଥିବା କର",
    whereMoneyGoes: "ଟଙ୍କା କେଉଁଆଡ଼େ ଯିବ",
    whoYouAre: "ଆପଣ କିଏ",

    disputeHeading: "ଏଥିରେ କ'ଣ ଲେଖା ଥିବା ଉଚିତ୍?",
    disputeAmountLabel: "ଠିକ୍ ରାଶି",
    disputeReasonLabel: "ଏହା କାହିଁକି ଭୁଲ୍",
    disputeSave: "ଏହାକୁ ଭୁଲ୍ ବୋଲି ଚିହ୍ନଟ କରନ୍ତୁ",
    selfReported: "ଆପଣ",
    returnLabel: "ଆପଣଙ୍କ ରିଟର୍ନ",

    outcomeOwesNothing: "ଆପଣଙ୍କର କିଛି ଦେବାର ନାହିଁ।",
    outcomeRefund: (amount: string) => `${amount} ଆପଣଙ୍କୁ ଫେରି ମିଳିବ।`,
    outcomeOwes: (amount: string) => `${amount} ଦେବାର ବାକି ଅଛି।`,
    confirmAndFile: "ଏହାକୁ ପଠାଇ ଦିଅନ୍ତୁ",

    verifyHeading: "ଆଉ ଗୋଟିଏ ପାହାଚ ବାକି, ନଚେତ୍ ଏହା ଗଣା ହେବ ନାହିଁ।",
    verifyBody:
      "ଏହା ଆପଣ ହିଁ ବୋଲି ନିଶ୍ଚିତ ନ କରିବା ପର୍ଯ୍ୟନ୍ତ ଆପଣଙ୍କ ରିଟର୍ନ ଦାଖଲ ହୋଇଛି ବୋଲି ଧରାଯାଏ ନାହିଁ — ଯେମିତି ଆପଣ ପଠାଇ ହିଁ ନାହାନ୍ତି। ଏଥିରେ ପ୍ରାୟ କୋଡ଼ିଏ ସେକେଣ୍ଡ ଲାଗେ।",
    verifyAction: "ଏହା ମୁଁ ହିଁ ବୋଲି ନିଶ୍ଚିତ କରନ୍ତୁ",

    voicePrompt: "କିମ୍ବା କେବଳ କହିଦିଅନ୍ତୁ",
    voiceListening: "ଶୁଣୁଛୁ",
    voiceUnsupported:
      "ଏହି ଫୋନ୍‌ର ବ୍ରାଉଜର ଏବେ ଶୁଣି ପାରୁନାହିଁ। ଆପଣ ଟାଇପ୍ କରିପାରିବେ — କିଛି ହଜିବ ନାହିଁ।",
    voiceSimulated: "ଏହି ବ୍ରାଉଜର ଶୁଣି ପାରେ ନାହିଁ, ତେଣୁ ଏହା ଏକ ଉଦାହରଣ, ଆପଣଙ୍କ ସ୍ୱର ନୁହେଁ।",
    voiceError: "ତାହା ଶୁଣାଗଲା ନାହିଁ। ଆପଣ ଟାଇପ୍ କରିପାରିବେ — କିଛି ହଜିବ ନାହିଁ।",
    dictate: "କହି ଲେଖାନ୍ତୁ",
    disputePlaceholder: "ଏହି ଅଙ୍କ କାହିଁକି ଭୁଲ୍ — କୁହନ୍ତୁ କିମ୍ବା ଟାଇପ୍ କରନ୍ତୁ।",
    disputeDefaultReason: "ଜଣାଯାଇଥିବା ଅଙ୍କ ଭୁଲ୍ ଅଛି",
  },

  flow: {
    facts: "ଆପଣଙ୍କ ଟଙ୍କା",
    deductions: "ଆପଣ ମାଗିପାରିବା ଟଙ୍କା",
    regime: "ପୁରୁଣା ନା ନୂଆ",
    check: "ଦେଖିନିଅନ୍ତୁ",
    file: "ପଠାଇ ଦିଅନ୍ତୁ",
    stepOf: (n: number, total: number) => `ଧାପ ${n}, ମୋଟ ${total}`,
    confirmedCount: (done: number, total: number) => `${total} ମଧ୍ୟରୁ ${done} ପକ୍କା`,
    allConfirmed: "ସବୁ ଠିକ୍ ଅଛି।",
    undoOne: "ଏହି ସଂଶୋଧନ ପଛକୁ ନିଅନ୍ତୁ",
    correctedTo: (amount: string) => `ଆପଣଙ୍କ ମତେ ଏହା ${amount} ହେବା ଉଚିତ୍`,
  },

  groups: {
    moneyIn: "ଆସୁଥିବା ଟଙ୍କା",
    taxPaid: "ଆପଣଙ୍କ ପାଇଁ ଆଗରୁ ଦିଆଯାଇଥିବା କର",
    deductionsClaimed: "ଆପଣଙ୍କ ଦାବି",
    fromWhere: "ଏହା କେଉଁଠୁ ଆସିଲା",
    addIncome: "ଆୟ ଯୋଡ଼ନ୍ତୁ",
  },

  deductions: {
    notAllowedNewRegime: "ନୂଆ ପ୍ରଣାଳୀରେ ଗଣା ହୁଏ ନାହିଁ — ତଥାପି ଆପଣଙ୍କ ନଥିରେ ରଖାଯାଇଛି।",
    startedAtCap: (amount: string) =>
      `ଆମେ ଏହାକୁ ${amount}ର ସୀମାରୁ ଆରମ୍ଭ କରିଛୁ — ଆପଣ ପ୍ରକୃତରେ ଯେତେ ଦେଇଛନ୍ତି ତାହା “କେତେ” ରେ ଦିଅନ୍ତୁ।`,
    heading: "ଆପଣ ମାଗିପାରିବା ଟଙ୍କା",
    sub: "ଏସବୁ ନିଜେ ନିଜେ ହୁଏ ନାହିଁ। ଆପଣଙ୍କୁ ହଁ କହିବାକୁ ପଡ଼େ — କିନ୍ତୁ କେବଳ ସତ ହେଲେ ହିଁ।",
    claimedHeading: "ଆପଣଙ୍କ ରିଟର୍ନରେ ଆଗରୁ ଅଛି",
    worthUpTo: (amount: string) => `ଆପଣଙ୍କ କରଯୋଗ୍ୟ ଆୟରୁ ${amount} ପର୍ଯ୍ୟନ୍ତ କମିପାରେ`,
    worthWhatYouPaid: "ଆପଣ ପ୍ରକୃତରେ ଯେତେ ଦେଇଛନ୍ତି ସେତିକି ହିଁ — ଅସଲ ରାଶି ଦିଅନ୍ତୁ",
    askRentQ: "ଆପଣ ରହୁଥିବା ଜାଗାର ଭଡ଼ା ଦିଅନ୍ତି କି?",
    askRentWhy:
      "ଆପଣ ଭଡ଼ା ଦେଉଥିଲେ ଓ ନିଯୁକ୍ତିଦାତାଙ୍କଠାରୁ ଘର ଭଡ଼ା ଭତ୍ତା ନ ମିଳୁଥିଲେ, ତାହାର କିଛି ଅଂଶ ଆପଣଙ୍କ କରଯୋଗ୍ୟ ଆୟରୁ କମିପାରେ।",
    askHealthQ: "ପରିବାରର ସ୍ୱାସ୍ଥ୍ୟ ବୀମା ଆପଣ ନିଜେ ଦିଅନ୍ତି କି?",
    askHealthWhy:
      "ପରିବାରର ବୀମା ଚାଲୁ ରଖିବା ପାଇଁ ଆପଣ ଯାହା ଦିଅନ୍ତି ତାହା ଆପଣଙ୍କ କରଯୋଗ୍ୟ ଆୟରୁ କମିପାରେ।",
    ask80cQ: "ଆପଣ ଭବିଷ୍ୟ ନିଧି, ଜୀବନ ବୀମା କିମ୍ବା ସ୍କୁଲ ଫିରେ ଟଙ୍କା ରଖନ୍ତି କି?",
    ask80cWhy:
      "ଏଭଳି ଦୀର୍ଘକାଳୀନ ସଞ୍ଚୟ ଏକ ମିଳିତ ସୀମା ଭିତରେ ଗଣାଯାଏ, ଆଉ ଆପଣ ଯେତେ ରଖନ୍ତି ସେତିକି କରଯୋଗ୍ୟ ଆୟରୁ କମେ।",
    claimIt: "ହଁ — ଏହା ଦାବି କରନ୍ତୁ",
    skipIt: "ନା — ଏହା ଛାଡ଼ନ୍ତୁ",
    amountLabel: "କେତେ",
    evidenceAttached: "ପ୍ରମାଣ ଯୋଡ଼ାଯାଇଛି",
    evidenceMissing:
      "ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପ୍ରମାଣ ଯୋଡ଼ାଯାଇ ନାହିଁ — ଏବେ ପାଇଁ ଅସୁବିଧା ନାହିଁ। ରସିଦ ସାଇତି ରଖନ୍ତୁ; ବିଭାଗ ପରେ ମାଗିପାରେ।",
    newRegimeNoEffect:
      "ନୂଆ ପ୍ରଣାଳୀରେ ଏହି ଦାବିରେ କିଛି ବଦଳେ ନାହିଁ — ସେଠାରେ ଏହା ଚଳେ ହିଁ ନାହିଁ।",
    oldRegimeSaves: (amount: string) =>
      `ପୁରୁଣା ପ୍ରଣାଳୀରେ ଏହା ଆପଣଙ୍କ କର ପ୍ରାୟ ${amount} କମାଇ ଦେଇଥାନ୍ତା।`,
  },

  regime: {
    heading: "କର ଲାଗିବାର ଦୁଇଟି ବାଟ ଅଛି। ଗୋଟିଏ ଆପଣଙ୍କ ପାଇଁ ଭଲ।",
    newRegimeName: "ନୂଆ ପ୍ରଣାଳୀ",
    oldRegimeName: "ପୁରୁଣା ପ୍ରଣାଳୀ",
    refundLabel: "ଆପଣଙ୍କୁ ଫେରି ମିଳିବ",
    dueLabel: "ଦେବାର ବାକି",
    recommendedBadge: "ଆପଣଙ୍କ ପାଇଁ ଭଲ",
    reasoningOldDeductions: (x: string, y: string) =>
      `ଆପଣଙ୍କ ଦାବି ମୋଟ ${x}ର, ତେଣୁ ପୁରୁଣା ପ୍ରଣାଳୀ ଆପଣଙ୍କର ପ୍ରାୟ ${y} ବଞ୍ଚାଏ।`,
    reasoningNewDefault: (y: string) =>
      `ଆପଣଙ୍କ ଦାବିରେ ଏଠାରେ ବିଶେଷ ଫରକ ପଡ଼େ ନାହିଁ, ତେଣୁ ନୂଆ ପ୍ରଣାଳୀର କମ୍ ହାର ଆପଣଙ୍କର ପ୍ରାୟ ${y} ବଞ୍ଚାଏ।`,
    acceptRecommendation: "ମୋ ପାଇଁ ଯାହା ଭଲ ତାହା ହିଁ ବାଛନ୍ତୁ",
    overrideNote: "ଆପଣ ଯେକୌଣସିଟି ବାଛିପାରିବେ। ଏଠାରେ କିଛି ଲୁଚା କି ବନ୍ଦ ନାହିଁ।",
  },

  check: {
    newRegimeClaimsZero:
      "ଆପଣଙ୍କ ଦାବି ଲିପିବଦ୍ଧ ଓ ସୁରକ୍ଷିତ ଅଛି — ନୂଆ ପ୍ରଣାଳୀ ସେସବୁକୁ ଅନୁମତି ହିଁ ଦିଏ ନାହିଁ, ସେଥିପାଇଁ ଏହି ଧାଡ଼ି ₹0।",
    badgeReportedBy: (reporter: string) => `${reporter} ଜଣାଇଛନ୍ତି`,
    badgeYouEntered: "ଆପଣ ଭରିଛନ୍ତି",
    badgeWeApplied: "ଆମେ ଆପଣଙ୍କ ପାଇଁ ଲଗାଇଛୁ",
    heading: "ପୁରା ରିଟର୍ନ, ଗୋଟିଏ ପୃଷ୍ଠାରେ",
    sub: "ପ୍ରତ୍ୟେକ ଅଙ୍କ କେଉଁଠୁ ନା କେଉଁଠୁ ଆସିଛି। ଯେକୌଣସି ଧାଡ଼ି ଖୋଲି ଠିକ୍ କେଉଁଠୁ ତାହା ଦେଖନ୍ତୁ।",
    grossIncome: "ଯାହା ଯାହା ଆସିଲା ସବୁ",
    standardDeduction: "ମାନକ ଛାଡ଼",
    deductionsLine: "ଆପଣ କରିଥିବା ଦାବି",
    taxableIncome: "ଯାହା ଉପରେ କର ପ୍ରକୃତରେ ଲାଗେ",
    slabTax: "କୌଣସି ରିହାତି ପୂର୍ବର କର",
    rebate87A: "ଏଥିରୁ କିଛି ଅଂଶ ରଦ୍ଦ କରୁଥିବା ଛାଡ଼",
    cess: "ସ୍ୱାସ୍ଥ୍ୟ ଓ ଶିକ୍ଷା ଅତିରିକ୍ତ",
    totalTax: "ବର୍ଷର ମୋଟ କର",
    tdsCredits: "ଆଗରୁ ଆପଣଙ୍କଠାରୁ କଟିଯାଇଛି",
    refundDue: "ଆପଣଙ୍କୁ ଫେରି ମିଳିବ",
    balanceDue: "ଦେବାର ବାକି",
    openLine: "ଏହା କେଉଁଠୁ ଆସିଲା ଦେଖାନ୍ତୁ",
    closeLine: "ଲୁଚାନ୍ତୁ",
    calculationStatus:
      "ଏହା ପ୍ରୋଟୋଟାଇପ୍‌ର ହିସାବ — ନିୟମର ଇନ୍‌ପୁଟ୍ ଏବେ ବି ମୂଳ ଉତ୍ସରୁ ଯାଞ୍ଚ ହେବା ବାକି (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} ତଳେ ଥିବା ପକ୍କା କରାଯାଇଥିବା ତଥ୍ୟ ଓ କର ଜମାରୁ ବାହାର କରାଯାଇଛି। ଏହି ପ୍ରୋଟୋଟାଇପ୍‌ର ମୂଳ ନଥିଗୁଡ଼ିକ କୃତ୍ରିମ।`,
    showCalculationTrail: "ଉତ୍ସ ଓ ହିସାବର ଶୃଙ୍ଖଳା ଦେଖାନ୍ତୁ",
    hideCalculationTrail: "ଉତ୍ସ ଓ ହିସାବର ଶୃଙ୍ଖଳା ଲୁଚାନ୍ତୁ",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} ଦିନ ଜଣାଯାଇଥିଲା`,
    sourceIdentifier: (identifier: string) => `ନଥି ${identifier}`,
    selfReportedSource: "ଏହି ରିଟର୍ନରେ ଆପଣ ନିଜେ ଜଣାଇଛନ୍ତି",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: ରିପୋର୍ଟ କରୁଥିବା ସଂସ୍ଥାମାନଙ୍କଠାରୁ ମିଳିଥିବା ସୂଚନାର ବାର୍ଷିକ ବିବରଣୀ।"
        : statement === "26AS"
        ? "Form 26AS: ଆପଣଙ୍କ PAN ଉପରେ ଜଣାଯାଇଥିବା କର ଜମାର ବିବରଣୀ।"
        : "ଏହି ତଥ୍ୟ ସହ ଯୋଡ଼ାଯାଇଥିବା ମୂଳ ନଥି।",
    sectionMeaning: (section: string) =>
      `${section} ହେଉଛି ଛାଡ଼ର ଏକ ଧାରା। ଏହି ପ୍ରଣାଳୀ ଅନୁମତି ଦେଲେ ହିଁ ଏହା ଗଣାଯାଏ।`,
    explainGross: "ଆପଣ ଦେଖି ପକ୍କା କରିଥିବା ତଥ୍ୟଗୁଡ଼ିକର ଯୋଗଫଳ।",
    explainStd: (amount: string) =>
      `ଦରମା ଆୟ ଥିବା ପ୍ରତ୍ୟେକଙ୍କୁ କିଛି ନ ମାଗି ହିଁ ${amount}ର ଛାଡ଼ ମିଳେ।`,
    explainDeductions: "ଏହି ପ୍ରଣାଳୀ ଅନୁମତି ଦେଉଥିବା ଦାବି ହିଁ ଗଣାଯାଏ।",
    explainDisallowed: (section: string) =>
      `${section} ଏହି ପ୍ରଣାଳୀରେ ଚଳେ ନାହିଁ, ତେଣୁ ଏଠାରେ ଏହାର କିଛି କାମ ନାହିଁ।`,
    explainTaxable: "ଯାହା ଆସିଲା, ତାହାରୁ ମାନକ ଛାଡ଼ ଓ ଆପଣଙ୍କ ଦାବି ବାଦ ଦେଇ।",
    explainSlab: "କର ଭାଗ ଭାଗ କରି ଲାଗେ — ଆୟର ପ୍ରତ୍ୟେକ ଭାଗ ଉପରେ ତାହାର ନିଜ ହାର।",
    explainRebate: (amount: string) =>
      `ଏକ ସୀମା ତଳେ ଅଧିକାଂଶ କର ରଦ୍ଦ ହୋଇଯାଏ — ଏଠାରେ ତାହାର ${amount}।`,
    explainCess: "ପ୍ରତ୍ୟେକ ରିହାତି ପରେ ଉପରୁ ଲାଗୁଥିବା ଏକ ଛୋଟ ପ୍ରତିଶତ।",
    explainTds:
      "TDS ଅର୍ଥ ମୂଳରୁ କଟିଥିବା କର: ଯିଏ ଆପଣଙ୍କୁ ଟଙ୍କା ଦେଇଥିଲେ, ସେ ତାହା ଆପଣଙ୍କ ପାଖରେ ପହଞ୍ଚିବା ପୂର୍ବରୁ ହିଁ ଏହା ରଖି ନେଇଥିଲେ।",
    fromFacts: "ଏହି ତଥ୍ୟଗୁଡ଼ିକରୁ:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "ପଠାଇବାକୁ ପ୍ରସ୍ତୁତ?",
    sub: "ଥରେ ଚାଲିଗଲେ ବଦଳାଇବା ମାନେ ପୁଣି ଦାଖଲ କରିବା। ଆଉ ଥରେ ଦେଖିନିଅନ୍ତୁ, ତା'ପରେ ପଠାନ୍ତୁ।",
    stepChecking: "ହିସାବ ଯାଞ୍ଚ ହେଉଛି…",
    stepSealing: "ଅଙ୍କଗୁଡ଼ିକ ସିଲ୍ କରାଯାଉଛି…",
    stepFiled: "ଦାଖଲ ହୋଇଗଲା।",
    ackHeading: "ପହଞ୍ଚିଗଲା।",
    ackBody:
      "ଆପଣଙ୍କ ରିଟର୍ନ ଆଜିଠାରୁ ଗଣା ହେବ। ଆଉ ଗୋଟିଏ ପାହାଚ ବାକି: ପଚରାଯିବା ବେଳେ ଏହା ପ୍ରକୃତରେ ଆପଣ ହିଁ ବୋଲି ନିଶ୍ଚିତ କରିବା। ସେ ପର୍ଯ୍ୟନ୍ତ ଏହା ନ ପଠାଇବା ପରି ଧରାଯାଏ।",
    ackNext:
      "ତା'ପରେ ଟ୍ରାକର୍ ଠିକ୍ ଦେଖାଇବ ଆପଣଙ୍କ ଟଙ୍କା କେଉଁଠି ଅଛି ଆଉ କ'ଣ ତାହାକୁ ଅଟକାଇ ପାରେ।",
    errorCause: "ସାଣ୍ଡବକ୍ସର fault ସୁଇଚ୍ ଚାଲୁ ଥିବାରୁ ଯାଞ୍ଚ ପାହାଚ ଅଟକିଗଲା।",
    errorAction:
      "ରିଭ୍ୟୁଅର୍ ଡ୍ରୟରରେ ଥିବା 'Trigger API Gateway Timeout' ବନ୍ଦ କରନ୍ତୁ, ତା'ପରେ ପୁଣି ପଠାନ୍ତୁ। କିଛି ହଜିନାହିଁ।",
    errorCauseNetwork: "ଆପଣଙ୍କ ରିଟର୍ନ ସର୍ଭର ପର୍ଯ୍ୟନ୍ତ ପହଞ୍ଚିଲା ନାହିଁ।",
    errorActionNetwork:
      "କିଛି ଦାଖଲ ହୋଇନାହିଁ ଆଉ କିଛି ହଜିନାହିଁ। ସଂଯୋଗ ଦେଖନ୍ତୁ, ତା'ପରେ ପୁଣି ପଠାନ୍ତୁ।",
    retry: "ପୁଣି ପଠାଇ ଦେଖନ୍ତୁ",
  },

  wizard: {
    identityNextHint: "ଆଗକୁ ଯିବା ପାଇଁ ଆପଣଙ୍କ ପୁରା ନାମ ଓ 10 ଅକ୍ଷରର PAN ଭରନ୍ତୁ।",
    employmentConfirmHint: "ଆପଣଙ୍କ ପୂର୍ବ ଉତ୍ତରରୁ — ବଦଳିଥିଲେ ଅନ୍ୟ ବିକଳ୍ପ ବାଛନ୍ତୁ।",
    tdsZeroWarning:
      "ଦରମା ଚାକିରିରେ ପ୍ରାୟ ସବୁବେଳେ କର ଆଗରୁ କଟିଥାଏ — ତାହା ଆପଣଙ୍କ ଫର୍ମ 16 କିମ୍ବା ଦରମା ସ୍ଲିପ୍‌ରେ ଥାଏ। ଏଠାରେ 0 ଲେଖିବା ମାନେ ପ୍ରାୟତଃ ନିଜ ରିଫଣ୍ଡ ଛାଡ଼ି ଦେବା।",
  },

  timeline: {
    filed: "ଆପଣ ଆପଣଙ୍କ ରିଟର୍ନ ପଠାଇ ଦେଲେ।",
    verified: "ଏହା ଆପଣ ହିଁ ବୋଲି ଆପଣ ନିଶ୍ଚିତ କଲେ। ରିଟର୍ନ ଏଠାରୁ ହିଁ ଗଣା ହୁଏ।",
    in_queue: "ସେହି ସପ୍ତାହରେ ଦାଖଲ ହୋଇଥିବା ଅନ୍ୟ ସବୁ ସହ ଧାଡ଼ିରେ।",
    under_review: "ଏବେ କେହି ଜଣେ ଏହା ଦେଖୁଛନ୍ତି।",
    determined: "ସ୍ଥିର ହେଲା — ଏତିକି ଫେରି ମିଳିବ।",
    sent_to_bank: "ଆପଣଙ୍କ ବ୍ୟାଙ୍କକୁ ପଠାଗଲା।",
    credited: "ଆପଣଙ୍କ ଖାତାରେ।",
  },

  refund: {
    heading: (amount: string) => `${amount} ଆପଣଙ୍କ ପାଖକୁ ଆସୁଛି`,
    filedDaysAgo: (days: number) => `ଆପଣ ${days} ଦିନ ତଳେ ଦାଖଲ କରିଥିଲେ`,

    holdsHeading: (n: number) =>
      n === 1 ? "ଗୋଟିଏ ଜିନିଷର ଅପେକ୍ଷା" : `${n}ଟି ଜିନିଷର ଅପେକ୍ଷା`,
    clearsInDays: (days: number) =>
      days === 1 ? "ତାହା ହୋଇଗଲେ ପ୍ରାୟ ଦିନେ" : `ତାହା ହୋଇଗଲେ ପ୍ରାୟ ${days} ଦିନ`,

    cohortWindow: (from: number, to: number) =>
      `ଆପଣଙ୍କ ସପ୍ତାହରେ ହିଁ ଦାଖଲ ହୋଇଥିବା ରିଟର୍ନ ଏବେ ଦେଖାଯାଉଛି। ${from} ରୁ ${to} ଦିନ ଧରନ୍ତୁ।`,

    states: {
      not_filed: "ଏପର୍ଯ୍ୟନ୍ତ ପଠାଯାଇ ନାହିଁ",
      filed_unverified: "ପଠାଗଲା, ଆପଣଙ୍କ ନିଶ୍ଚିତିର ଅପେକ୍ଷା",
      verified: "ଆପଣ ନିଶ୍ଚିତ କରିଛନ୍ତି",
      in_queue: "ଧାଡ଼ିରେ",
      under_review: "କେହି ଜଣେ ଦେଖୁଛନ୍ତି",
      determined: "ସ୍ଥିର ହେଲା",
      sent_to_bank: "ଆପଣଙ୍କ ବ୍ୟାଙ୍କକୁ ପଠାଗଲା",
      credited: "ଆପଣଙ୍କ ଖାତାରେ ଜମା",
      failed: "ଆପଣଙ୍କ ଖାତା ପର୍ଯ୍ୟନ୍ତ ପହଞ୍ଚି ପାରିଲା ନାହିଁ",
    },

    bankFailedHeading: "ଆପଣ ବାଛିଥିବା ଖାତାରେ ଟଙ୍କା ଯାଇପାରିବ ନାହିଁ।",
    bankMergedInto: (bank: string) => `ସେହି ଶାଖା ଏବେ ${bank}ର ଅଂଶ`,
    useThisAccount: "ତାହା ବଦଳରେ ଏଠାକୁ ପଠାନ୍ତୁ",
    resolvedHold: "ମିଟିଗଲା — ଏବେ ଏହା କିଛି ଅଟକାଉ ନାହିଁ।",
    stampFiled: "ଦାଖଲ",
  },

  notices: {
    heading: "ବିଭାଗରୁ ଆସିଥିବା ଚିଠି",
    none: "କିଛି ଫେରି ଆସିନାହିଁ। ଏହା ହିଁ ଭଲ ଲକ୍ଷଣ।",
    respondBy: (date: string) => `${date} ସୁଦ୍ଧା ଉତ୍ତର ଦିଅନ୍ତୁ`,
    ifYouDoNothing: "ଆପଣ କିଛି ନ କଲେ",
    basedOn: "ଏହା କାହା ଆଧାରରେ",
    theCatch: "ସେମାନଙ୍କର କ'ଣ ଭୁଲ୍ ହୋଇଛି",
    agree: "ଏହା ଠିକ୍ ଅଛି",
    disagree: "ଏହା ଭୁଲ୍ ଅଛି",
    dinLabel: "ଏହି ଚିଠିର ସନ୍ଦର୍ଭ ନମ୍ବର",
    dinExplain:
      "ବିଭାଗର ପ୍ରତ୍ୟେକ ଚିଠିରେ ଏହି ନମ୍ବର ଥିବା ବାଧ୍ୟତାମୂଳକ। ତାହା ନ ଥିଲେ ଚିଠିଟି ସରକାରୀ ଭାବେ ଅସ୍ତିତ୍ୱ ହିଁ ରଖେ ନାହିଁ।",
  },

  dashboard: {
    serverFilings: "ସର୍ଭରରେ ଲିପିବଦ୍ଧ",
    serverFilingsEmpty:
      "ଲାଇଭ୍ ସର୍ଭରରେ ଏହି PAN ପାଇଁ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଦାଖଲ ନାହିଁ — ଉପରର ପ୍ରାପ୍ତି ସୂଚନା ନମୁନା କାହାଣୀର ଅଂଶ। ଏହି ଆପ୍‌ରୁ ଦାଖଲ କଲେ ଅସଲ ରସିଦ ଏଠାରେ ଆସିବ।",
    greetingLabel: "ଆପଣଙ୍କ ସାଇନ୍-ଇନ୍ ବାକ୍ୟ",
    greetingWhy: "ଖାତା ତିଆରି ବେଳେ ଆପଣ ଏହି ବାକ୍ୟ ବାଛିଥିଲେ। ଯେଉଁ ପୃଷ୍ଠା ଏହା ଦେଖାଇ ପାରିବ ନାହିଁ, ତାହା ଆମେ ନୁହେଁ।",
    userDashboard: "ୟୁଜର୍ ଡ୍ୟାସବୋର୍ଡ",
    taxPrefills: "କର ସୂଚନା (AIS/26AS)",
    pendingActions: "ବାକି ଥିବା କାମ",
    returnSummary: "ରିଟର୍ନ ସାରାଂଶ AY 2026-27",
    reviewPrefill: "କର ସୂଚନା ଟ୍ୟାବ୍‌ରେ ଆଗରୁ ଭରାଯାଇଥିବା ବିବରଣୀ ଦେଖନ୍ତୁ, ତା'ପରେ ଦାଖଲ ପାଇଁ ନିଶ୍ଚିତ କରନ୍ତୁ।",
    filingSubmitted: "ଆପଣଙ୍କ ଇ-ଫାଇଲିଂ ରିଟର୍ନ ଜମା ହୋଇଛି। ଟାଇମଲାଇନ୍‌ରେ ଅଗ୍ରଗତି ଦେଖନ୍ତୁ।",
    verifiedBanks: "ରିଫଣ୍ଡ ପାଇଁ ଯାଞ୍ଚ ହୋଇଥିବା ବ୍ୟାଙ୍କ ଖାତା",
    primaryRefundAccount: "ମୁଖ୍ୟ ରିଫଣ୍ଡ ଖାତା",
    backupAccount: "ବିକଳ୍ପ ଖାତା",
    ifscMeaning: "IFSC ହେଉଛି ରିଫଣ୍ଡ ପଠାଇବା ପାଇଁ ବ୍ୟବହୃତ 11 ଅକ୍ଷରର ବ୍ୟାଙ୍କ କୋଡ୍।",
    refundTimeline: "ରିଫଣ୍ଡ ଟାଇମଲାଇନ୍",
    filingSubmittedTimeline: "ରିଟର୍ନ ଜମା ହେଲା",
    identityVerifiedTimeline: "ପରିଚୟ ଯାଞ୍ଚ ହେଲା",
    assessmentProcessingTimeline: "ନିର୍ଦ୍ଧାରଣ ପ୍ରକ୍ରିୟାରେ",
    refundApprovedTimeline: "ରିଫଣ୍ଡ ମଞ୍ଜୁର",
    refundCreditedTimeline: "ରିଫଣ୍ଡ ଜମା ହେଲା",
    holdActive: "ଅଟକ ଚାଲୁ: ଆକ୍ସନ୍ ଟ୍ୟାବ୍‌ର କାମ ସାରନ୍ତୁ",
    successCheckApp: "ହୋଇଗଲା! ଆପଣଙ୍କ ବ୍ୟାଙ୍କିଂ ଆପ୍ ଦେଖନ୍ତୁ।",
    outstandingNotices: "ବାକି ଥିବା ଅନୁପାଳନ ନୋଟିସ୍",
    noPendingActions: "କୌଣସି କାମ ବାକି ନାହିଁ",
    accountCompliant: "ଆପଣଙ୍କ ଖାତା ପୁରାପୁରି ନିୟମ ଭିତରେ ଅଛି — କୌଣସି ବାକି ନୋଟିସ୍ କି କର ଦାବି ନାହିଁ।",
    actionableHolds: "କାର୍ଯ୍ୟ ଯୋଗ୍ୟ ନିର୍ଦ୍ଧାରଣ ଅଟକ",
    uploadRent: "ଭଡ଼ା ଚୁକ୍ତି / ରସିଦ ଅପଲୋଡ୍ କରନ୍ତୁ",
    landlordName: "ଘର ମାଲିକଙ୍କ ନାମ",
    landlordPan: "ଘର ମାଲିକଙ୍କ PAN (10 ଅଙ୍କ)",
    selectPdfJpg: "PDF/JPG ବାଛନ୍ତୁ",
    submitReceipt: "ରସିଦ ଜମା କରନ୍ତୁ",
    responsePosition: "ଉତ୍ତରର ଅବସ୍ଥାନ",
    agreeDept: "ମୁଁ ବିଭାଗ ସହ ସହମତ",
    disagreeProof: "ମୁଁ ଅସହମତ (ପ୍ରମାଣ ଜମା କରନ୍ତୁ)",
    responseDraft: "ଉତ୍ତରର ବିବରଣୀ (ଡ୍ରାଫ୍ଟ)",
    dictateStatement: "କହି ଲେଖାନ୍ତୁ",
    sendResponse: "ଉତ୍ତର ପଠାନ୍ତୁ",
    filingStatusLabel: "ଦାଖଲ ସ୍ଥିତି",
    bankValidated: "ଯାଞ୍ଚ ହୋଇଛି",
    bankUnderProcess: "ପ୍ରକ୍ରିୟାରେ",
    bankFailed: "ବିଫଳ",
    staleIfscHold: "ଏହି ବ୍ୟାଙ୍କ କୋଡ୍ ଏବେ କେଉଁଆଡ଼େ ଯାଏ ନାହିଁ।",
    switchToNewIfsc: (ifsc: string) => `ନୂଆ କୋଡ୍‌କୁ ବଦଳାନ୍ତୁ (${ifsc})`,
    personalized: {
      eyebrow: "ଆପଣଙ୍କ ଡ୍ୟାସବୋର୍ଡ",
      headingFiled: "ଆପଣଙ୍କ ରିଟର୍ନ ଜମା ହୋଇଛି — ତାହାର ସ୍ଥିତି ଏହିପରି",
      heading: {
        file_return: "ଆସନ୍ତୁ, ଆପଣଙ୍କ ରିଟର୍ନ ପ୍ରସ୍ତୁତ କରିବା",
        check_refund: "ଆସନ୍ତୁ, କ'ଣ ଫେରି ଆସିପାରେ ଦେଖିବା",
        understand_notice: "ଆସନ୍ତୁ, ଧ୍ୟାନ ଦେବାର କଥାଗୁଡ଼ିକ ସମ୍ଭାଳିବା",
        correct_prefill: "ଆସନ୍ତୁ, ଜଣାଯାଇଥିବା ସୂଚନା ଦେଖିବା",
      },
      guidedBody: "ପ୍ରତ୍ୟେକ ଅଙ୍କ ନିଶ୍ଚିତ କରିବା ପୂର୍ବରୁ ଆମେ ତାହା ବୁଝାଇ ଦେବୁ।",
      quickBody: "ଆମେ ବାଟ ଛୋଟ ରଖିବୁ ଓ ପରବର୍ତ୍ତୀ ନିଷ୍ପତ୍ତି ଆଗରେ ରଖିବୁ।",
      unfiledBody: "ପ୍ରଥମେ, ଆପଣଙ୍କ ବିଷୟରେ ଆଗରୁ ଜଣାଯାଇଥିବା ସୂଚନା ନିଶ୍ଚିତ କରନ୍ତୁ।",
      filedBody: "ଆପଣ ଯେଉଁ କାମ ପାଇଁ ଆସିଛନ୍ତି, ତାହା ସହ ମେଳ ଖାଉଥିବା ଭାଗ ଆମେ ଆଗରେ ଖୋଲିଛୁ।",
      primaryAction: {
        facts: "ମୋ ବିଷୟରେ ଜଣାଯାଇଥିବା ସୂଚନା ଦେଖନ୍ତୁ",
        overview: "ମୋର ରିଫଣ୍ଡ ଟ୍ରାକର୍ ଦେଖାନ୍ତୁ",
        statement: "ଜଣାଯାଇଥିବା ସୂଚନା ଦେଖନ୍ତୁ",
        actions: "ଧ୍ୟାନ ଦେବାର କଥା ଦେଖାନ୍ତୁ",
      },
      focusLabel: "ଆମେ ଏଥିପ୍ରତି ଧ୍ୟାନ ଦେବୁ",
      profileLabels: {
        work: "କାମ",
        income: "ଆନୁମାନିକ ମୋଟ ଆୟ",
        history: "ଦାଖଲର ଅଭିଜ୍ଞତା",
      },
    },
  },

  onboarding: {
    eyebrow: "ଆରମ୍ଭ କରିବା ପୂର୍ବରୁ",
    title: "ଏହାକୁ ଆପଣଙ୍କ ପାଇଁ ସଜାଇ ଦେବା।",
    intro:
      "ପାଞ୍ଚଟି ଛୋଟ ଉତ୍ତର ଆମକୁ ଠିକ୍ ଭାଷା, ଗତି ଓ କରର ପ୍ରଶ୍ନ ବାଛିବାରେ ସାହାଯ୍ୟ କରେ। ସେସବୁ ପରେ ବଦଳାଇ ପାରିବେ।",
    languageQuestion: "ଆମେ କେଉଁ ଭାଷାରେ କଥା ହେବା?",
    languageHelp: "ଏହା ହିଁ ପ୍ରଥମ ପ୍ରଶ୍ନ। ଭାଷା ଆପଣ ଯେକୌଣସି ସମୟରେ ବଦଳାଇ ପାରିବେ।",
    intentQuestion: "ଆଜି ଆପଣ ଏଠାକୁ କାହିଁକି ଆସିଛନ୍ତି?",
    intentHelp: "ସେହି କାମ ହିଁ ଆମେ ସବୁଠାରୁ ଆଗରେ ରଖିବୁ।",
    intentOptions: {
      file_return: {
        label: "ଏ ବର୍ଷର ରିଟର୍ନ ଦାଖଲ କରିବାର ଅଛି",
        detail: "ଆପଣଙ୍କ ବିଷୟରେ ଯାହା ଆଗରୁ ଜଣା, ସେଠାରୁ ଆରମ୍ଭ କରିବା।",
      },
      check_refund: {
        label: "ମୋତେ ଟଙ୍କା ଫେରି ମିଳିବ କି ଦେଖିବାର ଅଛି",
        detail: "କ'ଣ ଜଣାଗଲା, କେତେ ଦିଆଗଲା ଆଉ କ'ଣ ଫେରି ଆସିପାରେ ଦେଖନ୍ତୁ।",
      },
      understand_notice: {
        label: "ଏକ ଚିଠି କି ନୋଟିସ୍ ବୁଝିବାର ଅଛି",
        detail: "ସେଥିରେ କ'ଣ ଲେଖା ଅଛି, କ'ଣ ଝୁଙ୍କରେ ଅଛି ଓ ଆଗକୁ କ'ଣ କରିବାର ଦେଖନ୍ତୁ।",
      },
      correct_prefill: {
        label: "ଭୁଲ୍ ଦିଶୁଥିବା କିଛି ଠିକ୍ କରିବାର ଅଛି",
        detail: "ଅଙ୍କଟି କେଉଁଠୁ ଆସିଲା ଖୋଜନ୍ତୁ ଓ କ'ଣ ବଦଳିବା ଉଚିତ୍ ତାହା ଲେଖନ୍ତୁ।",
      },
    },
    intentCta: {
      file_return: "ମୋର ରିଟର୍ନ ଆରମ୍ଭ କରନ୍ତୁ",
      check_refund: "ମୋର କେତେ ପାଇବାର ଅଛି ଦେଖନ୍ତୁ",
      understand_notice: "କ'ଣ କରିବାର ତାହା ଦେଖାନ୍ତୁ",
      correct_prefill: "ଜଣାଯାଇଥିବା ସୂଚନା ଦେଖନ୍ତୁ",
    },
    situationQuestion: "ଆପଣଙ୍କ କର ସମ୍ବନ୍ଧୀୟ ଅବସ୍ଥା ବିଷୟରେ କୁହନ୍ତୁ।",
    situationHelp: "ଏଠାରେ ଦୁଇଟି ଛୋଟ ଉତ୍ତର ଯଥେଷ୍ଟ।",
    professionLabel: "ଆପଣଙ୍କ କାମକୁ ଏଥିମଧ୍ୟରୁ କେଉଁଟି ସବୁଠାରୁ ଭଲ ବୁଝାଏ?",
    professionOptions: {
      salaried: "ଦରମା ଚାକିରି",
      self_employed: "ଫ୍ରିଲାନ୍ସ କିମ୍ବା ନିଜ କାମ",
      business_owner: "ବ୍ୟବସାୟ ମାଲିକ",
      student: "ଛାତ୍ର କି ଛାତ୍ରୀ",
      retired: "ଅବସରପ୍ରାପ୍ତ",
      investor: "ନିବେଶକ",
      other: "ଆଉ କିଛି",
    },
    filingHistoryLabel: "ଆପଣ ଏହା ପୂର୍ବରୁ ଆୟକର ରିଟର୍ନ ଦାଖଲ କରିଛନ୍ତି କି?",
    filingHistoryOptions: {
      never: "ନା, ଏହା ପ୍ରଥମ ଥର",
      once: "ଥରେ କି ଦୁଇଥର",
      every_year: "ପ୍ରତି ବର୍ଷ",
    },
    incomeQuestion: "ସବୁ ଉତ୍ସରୁ ମିଶି ଆପଣଙ୍କ ମୋଟ ଆୟ ପ୍ରାୟ କେତେ ଥିଲା?",
    incomeHelp: "ଏକ ଆନୁମାନିକ ପରିସର ଯଥେଷ୍ଟ। ଏବେ ସଠିକ୍ ଅଙ୍କ ଦରକାର ନାହିଁ।",
    incomeOptions: {
      none: "କୌଣସି ଆୟ ନାହିଁ",
      under_4: "₹4 ଲକ୍ଷରୁ କମ୍",
      "4_to_8": "₹4 ରୁ ₹8 ଲକ୍ଷ",
      "8_to_12": "₹8 ରୁ ₹12 ଲକ୍ଷ",
      "12_to_25": "₹12 ରୁ ₹25 ଲକ୍ଷ",
      over_25: "₹25 ଲକ୍ଷରୁ ଅଧିକ",
    },
    modeQuestion: "ଆପଣ କେତେ ବିବରଣୀ ଦେଖିବାକୁ ଚାହାନ୍ତି?",
    modeHelp: "ଏହା କେବଳ ଆରମ୍ଭ ସ୍ଥିର କରେ। ଆପଣ ଯେକୌଣସି ସମୟରେ ବଦଳାଇ ପାରିବେ।",
    modeOptions: {
      simple: {
        label: "ମୋ ପାଇଁ କରିଦିଅନ୍ତୁ",
        detail: "ସରଳ ଶବ୍ଦ, ଥରକେ ଗୋଟିଏ ପାହାଚ। ବାକିଟା ଆମେ ସମ୍ଭାଳିବୁ।",
      },
      full: {
        label: "ମୋତେ ସବୁ ଦେଖାନ୍ତୁ",
        detail: "ପ୍ରତ୍ୟେକ ଅଙ୍କ, ପ୍ରତ୍ୟେକ ନିୟମ, ପ୍ରତ୍ୟେକ ହିସାବ — ଆରମ୍ଭରୁ ହିଁ।",
      },
    },
    focusQuestion: "ଏଥିମଧ୍ୟରୁ କେଉଁ କଥାଗୁଡ଼ିକ ପ୍ରତି ଆମେ ଧ୍ୟାନ ଦେବୁ?",
    focusHelp: "ଆପଣଙ୍କ ପାଇଁ ଯାହା ଲାଗୁ ହୁଏ ସବୁ ବାଛନ୍ତୁ। ନିଶ୍ଚିତ ନ ଥିଲେ 'ଏବେ ପକ୍କା ଜାଣିନାହିଁ' ବାଛିଲେ ବି ଅସୁବିଧା ନାହିଁ।",
    focusOptions: {
      salary: "ଦରମା କିମ୍ବା ପେନସନ",
      freelance: "ଫ୍ରିଲାନ୍ସ କାମ",
      business: "ବ୍ୟବସାୟର ଆୟ",
      rent: "ଦିଆଯାଇଥିବା କି ମିଳିଥିବା ଭଡ଼ା",
      interest: "ବ୍ୟାଙ୍କର ସୁଧ",
      investments: "ସେୟାର କିମ୍ବା ନିବେଶ",
      deductions: "ସଞ୍ଚୟ, ବୀମା, ଗୃହ ଋଣ କିମ୍ବା NPS",
      not_sure: "ଏବେ ପକ୍କା ଜାଣିନାହିଁ",
    },
    chooseOne: "ଗୋଟିଏ ବାଛନ୍ତୁ",
    chooseAtLeastOne: "ଅନ୍ତତଃ ଗୋଟିଏ ବାଛନ୍ତୁ",
    questionsLabel: "ଝଟପଟ ପ୍ରସ୍ତୁତି",
    questionsProgress: (current: number, total: number) => `${total} ମଧ୍ୟରୁ ${current}`,
    savedLocally: "ଏହି ପ୍ରୋଟୋଟାଇପ୍‌ରେ ଆପଣଙ୍କ ଉତ୍ତର ଏହି ବ୍ରାଉଜରରେ ହିଁ ସାଇତା ହୁଏ।",
    readyTitle: "ଏହାକୁ ଆପଣଙ୍କ ପାଇଁ ଖାସ୍ କରିବାକୁ ଏତିକି ଯଥେଷ୍ଟ।",
    readyBody:
      "ଏହି ଉତ୍ତରରୁ ଆମେ ସ୍ଥିର କରିବୁ ଆପଣଙ୍କୁ ଆଗରେ କ'ଣ ଦେଖାଇବା। ପ୍ରଣାଳୀର ଅନ୍ତିମ ପସନ୍ଦ ତଥାପି ଆପଣ ପକ୍କା କରିଥିବା ତଥ୍ୟ ଓ ଦାବି ଉପରେ ହିଁ ହୁଏ।",
    guidedLabel: "ଆମେ କେମିତି ବୁଝାଇବୁ",
    guidedValue: "ବାଟରେ ଆସୁଥିବା ଶବ୍ଦ ଆମେ ବୁଝାଇ ଚାଲିବୁ।",
    quickValue: "ଆମେ ବାଟ ଛୋଟ ରଖିବୁ।",
    regimeLabel: "ପ୍ରଣାଳୀ ପାଇଁ ଆମର ପଦ୍ଧତି",
    claimsRegimeValue: "ପ୍ରଣାଳୀ ବାଛିବା ପୂର୍ବରୁ ଆମେ ଆପଣଙ୍କ ଦାବି ଦେଖିବୁ।",
    compareRegimeValue: "ତଥ୍ୟ ପକ୍କା ହେଲା ପରେ ଆମେ ଦୁଇ ପ୍ରଣାଳୀର ତୁଳନା କରିବୁ।",
    focusLabel: "ଆଗରେ କାହା ଉପରେ ଧ୍ୟାନ ରହିବ",
    startPath: "ମୋ ବାଟରୁ ଆରମ୍ଭ କରନ୍ତୁ",
    changeAnswers: "ଉତ୍ତର ବଦଳାନ୍ତୁ",
    tailoredBadge: "ଆପଣଙ୍କ ଆରମ୍ଭର ବାଟ",
    tailoredGuided: "ବୁଝାଇ ଆଗକୁ ଯିବୁ",
    tailoredQuick: "ଛୋଟ ବାଟ",
    tailoredRegimeClaims: "ପ୍ରଣାଳୀ ପୂର୍ବରୁ ଦାବିର ଯାଞ୍ଚ",
    tailoredRegimeCompare: "ତଥ୍ୟ ପରେ ଦୁଇ ପ୍ରଣାଳୀର ତୁଳନା",
    tailoredIntent: (intent: string) => `ଆଗରେ: ${intent}`,
  },

  checklist: {
    divider: "ଦାଖଲ କରିବା ପୂର୍ବରୁ",
    itemBefore: "“",
    itemAfter: "” ନିଶ୍ଚିତ କରନ୍ତୁ — ସନ୍ଦେହ ଥିଲେ କାର୍ଡ଼ ଖୋଲନ୍ତୁ।",
    stdRow: "ଆମେ ଆପଣଙ୍କ ତରଫରୁ ଲଗାଇଥିବା ମାନକ ଛାଡ଼ ନିଶ୍ଚିତ କରନ୍ତୁ।",
    noteLocked: "ଉପରର ପ୍ରତ୍ୟେକ ଧାଡ଼ିରେ ଟିକ୍ କରନ୍ତୁ, ତାପରେ ହିଁ ଏହି ବଟନ୍ ଖୋଲିବ।",
    noteReady: "ଉପରର ସବୁ ପକ୍କା ହୋଇଛି। ପ୍ରସ୍ତୁତ ଥିଲେ ଦାଖଲ କରନ୍ତୁ।",
    fileBtn: "ଏହି ରିଟର୍ନ ଦାଖଲ କରନ୍ତୁ",
    lockedBtn: (n: number) =>
      n === 1 ? "ଆଗେ ଆଉ 1ଟି ଧାଡ଼ିରେ ଟିକ୍ କରନ୍ତୁ" : `ଆଗେ ଆଉ ${n}ଟି ଧାଡ଼ିରେ ଟିକ୍ କରନ୍ତୁ`,
  },

  factCard: {
    cardNo: (n: number, date: string) => `କାର୍ଡ଼ ${String(n).padStart(2, "0")} · ଜଣାଗଲା ${date}`,
    whatThisMeans: "ଏହାର ଅର୍ଥ କ'ଣ",
    readFirst: "ଆଗେ “ଏହାର ଅର୍ଥ କ'ଣ” ଖୋଲନ୍ତୁ — ତା'ପରେ ନିଶ୍ଚିତ କରନ୍ତୁ।",
    readyToConfirm: "ପଢ଼ିଲେ? ତଳେ ନିଶ୍ଚିତ କରନ୍ତୁ।",
  },

  signoff: {
    title: "ଦସ୍ତଖତ",
    declaration:
      "ମୁଁ ଉପରର ଅଙ୍କଗୁଡ଼ିକ ପଢ଼ିଛି ଏବଂ ମୂଳ କାଗଜପତ୍ର ସହ ମିଳାଇ ଦେଖିଛି। ସେସବୁ ଠିକ୍ ଓ ସମ୍ପୂର୍ଣ୍ଣ।",
    action: "ଏହି ଅଙ୍କଗୁଡ଼ିକରେ ଦସ୍ତଖତ କରନ୍ତୁ",
    signed: "ଦସ୍ତଖତ ହୋଇଗଲା — ଉପରର ପ୍ରତ୍ୟେକ ଅଙ୍କ ପକ୍କା।",
    hint: "ଗୋଟିଏ ଘୋଷଣା ଉପରର ସବୁକୁ ଲାଗୁ ହୁଏ। କୌଣସି ଅଙ୍କ ଉପରେ ଆପତ୍ତି ଥିଲେ ଦସ୍ତଖତ ପୂର୍ବରୁ “ନା, ଏହା ଭୁଲ୍ ଅଛି” ବାଛନ୍ତୁ।",
  },

  channels: {
    sectionLabel: "ବର୍ଷଟି ଏକ ନଜରରେ",
    earned: "ଆପଣ ରୋଜଗାର କଲେ",
    toTax: "କରକୁ ଗଲା",
    overpaid: "ଆପଣ ଅଧିକ ଦେଲେ",
    stillToPay: "ଏବେ ବି ଦେବାର",
    stayed: "ଆପଣଙ୍କଠାରୁ କେବେ ଗଲା ନାହିଁ",
    kept: "ଯେଉଁ କର ଦେୟ ଥିଲା",
    back: "ଆପଣଙ୍କ ପାଖକୁ ଫେରୁଛି",
    yoursInEnd: "ଶେଷରେ ଆପଣଙ୍କର",
    collected: "ଆଗରୁ ଆଦାୟ ହୋଇଛି",
    ofYear: "ବର୍ଷର ଟଙ୍କା ମଧ୍ୟରୁ",
    sliceNote: "ଦେଖିବା ପାଇଁ ଅତି ପତଳା ଥିବା ଭାଗଟିକୁ ତାହାର ପ୍ରକୃତ ଅଂଶଠାରୁ ଟିକିଏ ଚଉଡ଼ା କରି ଆଙ୍କାଯାଇଛି — ପାଖରେ ଥିବା ଅଙ୍କ କିନ୍ତୁ ଠିକ୍।",
    whereItWent: "ଆପଣ ରୋଜଗାର କରିଥିବା ପ୍ରତ୍ୟେକ ଟଙ୍କା କେଉଁଆଡ଼େ ଗଲା",
    earnedDesc: "ଦରମା, ସୁଧ ଓ ବାକି ସବୁ — ଆପଣଙ୍କୁ ଟଙ୍କା ଦେଉଥିବା ଲୋକେ ଯେମିତି ଜଣାଇଛନ୍ତି।",
    toTaxDesc: "ଆପଣଙ୍କ ହକର ପ୍ରତ୍ୟେକ ଛାଡ଼ ପରେ ଆପଣଙ୍କ ଉପରେ ପ୍ରକୃତରେ ଲାଗିଥିବା କର।",
    backDesc: "ଆପଣଙ୍କ ଦରମାରୁ ନିଆଗଲା କିନ୍ତୁ କେବେ ଦେୟ ହିଁ ନଥିଲା। ଏହା ଆପଣଙ୍କୁ ଫେରି ମିଳେ।",
    dueDesc: "ଆଗରୁ ଆଦାୟ ହୋଇଥିବାଠାରୁ ଅଧିକ ଦେୟ। ଏହା ଏବେ ବି ଦେବାର ଅଛି।",
    howToRead:
      "ଏହାକୁ ଏମିତି ପଢ଼ନ୍ତୁ: ଏଠାରେ କିଛି ଆମେ ଗଢ଼ିନାହୁଁ। ପ୍ରତ୍ୟେକ ଅଙ୍କ କେହି ଦାଖଲ କରିଥିବା କାଗଜରୁ ଆସିଛି କିମ୍ବା ଆପଣ ନିଜେ ଭରିଛନ୍ତି। ପେନସିଲ ଟିପ୍ପଣୀ ପ୍ରତ୍ୟେକ ଅଙ୍କର ଅସଲ ଅର୍ଥ କୁହେ — ସରଳ ଶବ୍ଦରେ, କରର ଭାଷାରେ ନୁହେଁ।",
    meterCap: "ଦେୟ କର ବନାମ ଆଗରୁ ଆଦାୟ ହୋଇଥିବା",
  },

  agent: {
    title: "ୱାପସୀ ସହାୟକ",
    open: "ସହାୟକ ଖୋଲନ୍ତୁ",
    close: "ବନ୍ଦ କରନ୍ତୁ",
    placeholder: "ଦେଖିବାକୁ, ବୁଝାଇବାକୁ କି ଦାଖଲ କରିବାକୁ କୁହନ୍ତୁ…",
    send: "ପଠାନ୍ତୁ",
    thinking: "କାମ ଚାଲିଛି…",
    toolRan: "କଲି:",
    confirmTitle: "ଦାଖଲ କରିବାକୁ ପ୍ରସ୍ତୁତ — ଅଙ୍କଗୁଡ଼ିକ ଦେଖନ୍ତୁ",
    confirmBody: "ଆପଣଙ୍କ ନିଶ୍ଚିତି ବିନା କିଛି ଦାଖଲ ହୁଏ ନାହିଁ। ଏହା ଜମା ହେବ:",
    confirmTotalTax: "ମୋଟ କର",
    confirmRefund: "ଆପଣଙ୍କୁ ମିଳିବାକୁ ଥିବା ରିଫଣ୍ଡ",
    confirmDue: "ଦେୟ ରାଶି",
    confirmTaxable: "କରଯୋଗ୍ୟ ଆୟ",
    confirmButton: "ନିଶ୍ଚିତ କରି ଦାଖଲ କରନ୍ତୁ",
    cancelButton: "ବାତିଲ୍ କରନ୍ତୁ",
    filingDismissed: "ଠିକ୍ ଅଛି — କିଛି ଦାଖଲ ହୋଇନାହିଁ।",
    error: "ସହାୟକ ପର୍ଯ୍ୟନ୍ତ ପହଞ୍ଚି ହେଲା ନାହିଁ। ଆପଣଙ୍କ ରିଟର୍ନରେ ହାତ ବି ଲାଗିନାହିଁ — ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    intro:
      "ମୁଁ ଆପଣଙ୍କ ରିଟର୍ନ ଦେଖିପାରିବି, ଯେକୌଣସି ଅଙ୍କ ବୁଝାଇ ପାରିବି, ଯଦି-ତେବେ ହିସାବ କରିପାରିବି ଆଉ ଦାଖଲର ପ୍ରସ୍ତୁତି କରିପାରିବି। ଦାଖଲ ହେବା ପୂର୍ବରୁ ନିଶ୍ଚିତି ସବୁବେଳେ ଆପଣ ହିଁ କରନ୍ତି।",
    sample: "80C ରେ ₹1,50,000 ନିବେଶ କଲେ ମୋର କେତେ ବଞ୍ଚିବ?",
  },

  footer: {
    prototype: "ସ୍ୱାଧୀନ ଧାରଣା ପ୍ରୋଟୋଟାଇପ୍।",
    notAffiliated:
      "ଆୟକର ବିଭାଗ, CBDT କିମ୍ବା ଭାରତ ସରକାରଙ୍କ ସହ ସଂଯୁକ୍ତ ନୁହେଁ, ସେମାନଙ୍କ ଅନୁମୋଦନ ନାହିଁ, ସେମାନଙ୍କ ସହ ସମ୍ପର୍କ ନାହିଁ। ଏଠାରେ ଥିବା ପ୍ରତ୍ୟେକ ନାମ, PAN, ରାଶି ଓ କାଗଜପତ୍ର ତିଆରି। କୌଣସି ଅସଲ ସରକାରୀ ବ୍ୟବସ୍ଥା ସହ ଯୋଗାଯୋଗ କରାଯାଏ ନାହିଁ।",
    honestyLink: "କ'ଣ ଅସଲ ଓ କ'ଣ ମକ୍ ତାହା ଠିକ୍ ଦେଖନ୍ତୁ",
  },
};

export const orMock: Record<string, string> = {
  "Your pay last year": "ଗତ ବର୍ଷର ଆପଣଙ୍କ ଦରମା",
  "Interest your savings account earned": "ସଞ୍ଚୟ ଖାତାରେ ମିଳିଥିବା ସୁଧ",
  "Interest your accounts earned": "ଆପଣଙ୍କ ଖାତାରେ ମିଳିଥିବା ସୁଧ",
  "Your primary contract income": "ଆପଣଙ୍କ ମୁଖ୍ୟ କଣ୍ଟ୍ରାକ୍ଟ ଆୟ",
  "Savings interest": "ସଞ୍ଚୟ ଖାତାର ସୁଧ",
  "Tax withheld (TDS)": "ଆଗରୁ କଟିଥିବା କର (TDS)",
  "Provident Fund / ELSS Mutual Funds": "ଭବିଷ୍ୟ ନିଧି / ELSS ମ୍ୟୁଚୁଆଲ୍ ଫଣ୍ଡ",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "ତାଙ୍କ ଦରମାରୁ ₹8,400 କଟିଗଲା। ତାଙ୍କର କିଛି ଦେବାର ନାହିଁ। ସେ ଏପର୍ଯ୍ୟନ୍ତ ଦାଖଲ କରିନାହାନ୍ତି, ଆଉ ସ୍କୁଲ ଫି ଦେବାର ଅଛି।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "ଦୁଇଟି ନୋଟିସ୍। ଗୋଟିଏ କହୁଛି ସେ ₹1,10,000 ସେୟାର ଲାଭ ଲୁଚାଇଛନ୍ତି — ପ୍ରକୃତରେ ତାଙ୍କର ₹4,200 କ୍ଷତି ହୋଇଥିଲା। ଆଉ ଗୋଟିଏ, ସେ କେବେ ଶୁଣି ନ ଥିବା 2019ର ଏକ ବିଲ୍ ପାଇଁ ତାଙ୍କ ରିଫଣ୍ଡର କିଛି ଅଂଶ ରଖିବାକୁ ଚାହୁଁଛି।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 ଦିନ ତଳେ ଦାଖଲ କରିଥିଲେ। ପୋର୍ଟାଲରେ 'ପ୍ରକ୍ରିୟା ଚାଲିଛି' ଛଡ଼ା ଆଉ କିଛି ଦେଖାଯାଉ ନାହିଁ। ପ୍ରକୃତରେ ଦୁଇଟି ଅଲଗା କାରଣ ତାଙ୍କ ₹34,800 ଅଟକାଇ ରଖିଛି।",
  "Tax already taken out of your pay": "ଦରମାରୁ ଆଗରୁ କଟିଥିବା କର (TDS)",
  "Dividend your shares paid out": "ଆପଣଙ୍କ ସେୟାର ଦେଇଥିବା ଲାଭାଂଶ",
  "Money from selling shares": "ସେୟାର ବିକ୍ରିରୁ ମିଳିଥିବା ଟଙ୍କା",
  "Tax the bank withheld on your interest": "ସୁଧ ଉପରେ ବ୍ୟାଙ୍କ କାଟିଥିବା କର (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "ଭବିଷ୍ୟ ନିଧି (PF), ବୀମା ଓ ଝିଅର ଟ୍ୟୁସନ ଫି",
  "Provident fund and your insurance premium": "ଭବିଷ୍ୟ ନିଧି (PF) ଓ ଆପଣଙ୍କ ବୀମା ପ୍ରିମିୟମ୍",
  "Health cover for the family": "ପରିବାର ପାଇଁ ସ୍ୱାସ୍ଥ୍ୟ ବୀମା",
  "Rent you paid, with no house-rent allowance from your employer":
    "ଆପଣ ଦେଇଥିବା ଭଡ଼ା, ନିଯୁକ୍ତିଦାତାଙ୍କଠାରୁ ଘର ଭଡ଼ା ଭତ୍ତା ନ ପାଇ",
  "One figure doesn't match what your broker reported.":
    "ଗୋଟିଏ ଅଙ୍କ ଆପଣଙ୍କ ବ୍ରୋକର୍ ଜଣାଇଥିବା ଅଙ୍କ ସହ ମେଳ ଖାଉ ନାହିଁ।",
  "₹18,740 of this is being held against an old bill.":
    "ଏଥିରୁ ₹18,740 ଏକ ପୁରୁଣା ବିଲ୍ ବଦଳରେ ଅଟକାଯାଉଛି।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "ବିଭାଗ ଭାବୁଛି ଆପଣ ସେୟାରର ₹1,10,000 ଲାଭ ଛାଡ଼ି ଦେଇଛନ୍ତି।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019ର ଏକ ବିଲ୍ ମେଣ୍ଟାଇବା ପାଇଁ ବିଭାଗ ଆପଣଙ୍କ ରିଫଣ୍ଡରୁ ₹18,740 ରଖିବାକୁ ଚାହୁଁଛି।",
  "Waiting on one thing: a receipt for your rent claim.":
    "ଗୋଟିଏ ଜିନିଷର ଅପେକ୍ଷା: ଆପଣଙ୍କ ଭଡ଼ା ଦାବିର ରସିଦ।",
  "The account you chose can't receive the money.":
    "ଆପଣ ବାଛିଥିବା ଖାତାରେ ଟଙ୍କା ଯାଇପାରିବ ନାହିଁ।",
  "Held: your rent claim needs a receipt.": "ଅଟକାଗଲା: ଆପଣଙ୍କ ଭଡ଼ା ଦାବି ପାଇଁ ରସିଦ ଦରକାର।",
  "Your bank account was checked and failed.":
    "ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତା ଯାଞ୍ଚ ହେଲା ଓ ତାହା ବିଫଳ ହେଲା।",
  "The department is asking you to look again at your rent claim.":
    "ବିଭାଗ ଆପଣଙ୍କୁ ଆପଣଙ୍କ ଭଡ଼ା ଦାବି ପୁଣି ଦେଖିବାକୁ କହୁଛି।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities ସେୟାର ବିକ୍ରିରୁ ₹1,10,000 ଜଣାଇଥିଲେ। ଆପଣଙ୍କ ରିଟର୍ନ ତାହା ଦେଖାଉ ନାହିଁ। ତାହା ମେଣ୍ଟିବା ପର୍ଯ୍ୟନ୍ତ ରିଫଣ୍ଡ ଯେଉଁଠି ଅଛି ସେଠି ହିଁ ରହିବ।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20ର ଏକ ଦାବି ଏ ବର୍ଷର ରିଫଣ୍ଡରୁ ସମନ୍ୱୟ କରାଯାଉଛି। ଆପଣ ଏଥିରେ ଆପତ୍ତି କରିପାରିବେ, ଆଉ 3 ତାରିଖ ପୂର୍ବରୁ ଏହା ପଢ଼ିବା ଉଚିତ୍।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "10 ସେପ୍ଟେମ୍ବର ସୁଦ୍ଧା ଆପଣ କିଛି ନ କହିଲେ, ₹1,10,000 ଆପଣଙ୍କ ଆୟରେ ଯୋଡ଼ାଯିବ ଆଉ ଆପଣଙ୍କ ରିଫଣ୍ଡରୁ ପ୍ରାୟ ₹34,300 ଚାଲିଯିବ।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "3 ସେପ୍ଟେମ୍ବର ସୁଦ୍ଧା ଆପଣ କିଛି ନ କହିଲେ, ଆପଣଙ୍କ ରିଫଣ୍ଡରୁ ₹18,740 ନିଆଯିବ ଆଉ ମାମଲାଟି ବନ୍ଦ ବୋଲି ଧରାଯିବ।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "ଆପଣ ₹1,10,000ର ସେୟାର ବିକ୍ରି କଲେ ଆଉ ତା' ଉପରର ଲାଭ ଘୋଷଣା କଲେ ନାହିଁ।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 ହେଉଛି ମୁଁ ବିକ୍ରି କରିଥିବା ସବୁର ମୋଟ ମୂଲ୍ୟ, ମୋର ଲାଭ ନୁହେଁ। ସେହି କାରବାରଗୁଡ଼ିକରେ ମୋର ₹4,200 କ୍ଷତି ହୋଇଥିଲା। ମୋ ବ୍ରୋକରଙ୍କ ବର୍ଷର ବିବରଣୀରେ କିଣା ଦର ଦେଖାଯାଉଛି।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20 ବର୍ଷର ଆପଣଙ୍କ ଏବେ ବି ₹18,740 ଦେବାର ଅଛି, ତେଣୁ ତାହା ଏ ବର୍ଷର ରିଫଣ୍ଡରୁ ନିଆଯିବ।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "ଆପଣ ₹60,000 ଭଡ଼ାର ଦାବି କରିଥିଲେ। ତାହା ଦେଖାଇବାକୁ କିଛି ଯୋଡ଼ାଯାଇ ନଥିଲା। ଏକ ରସିଦ କିମ୍ବା ଘର ମାଲିକଙ୍କ ନାମ ଓ PAN ଯୋଡ଼ନ୍ତୁ, ତା'ପରେ ଏହା ଆଗକୁ ବଢ଼ିବ।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank ଗତ ବର୍ଷ Deccan Union Bankର ଅଂଶ ହୋଇଗଲା। ଖାତା ଏବେ ବି ଅଛି — କିନ୍ତୁ ସେଥିକୁ ଟଙ୍କା ପଠାଉଥିବା କୋଡ୍ ଆଉ ନାହିଁ।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "ଆପଣ 80GG ତଳେ ₹60,000 ଭଡ଼ାର ଦାବି କରିଥିଲେ, କିନ୍ତୁ ତାହାର ସମର୍ଥନରେ କିଛି ଯୋଡ଼ାଯାଇ ନଥିଲା।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "ମୁଁ ଏହି ଭଡ଼ା ପ୍ରକୃତରେ ଦେଇଛି। ମୋ ପାଖରେ ଘର ମାଲିକଙ୍କ ମାସିକ ରସିଦ ଅଛି ଆଉ ମୁଁ ତାଙ୍କ ନାମ ଓ PAN ଦେଇପାରିବି।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "ଏହା ଅଭିଯୋଗ ନୁହେଁ ଆଉ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଜୋରିମାନା ନାହିଁ। କିନ୍ତୁ ଆପଣ ଦାବିର ପ୍ରମାଣ ନ ଦେବା କି ତାହା ପ୍ରତ୍ୟାହାର ନ କରିବା ପର୍ଯ୍ୟନ୍ତ ଆପଣଙ୍କ ₹34,800 ଯେଉଁଠି ଅଛି ସେଠି ହିଁ ରହିବ।",
  "Look at what they reported": "ସେମାନେ କ'ଣ ଜଣାଇଥିଲେ ଦେଖନ୍ତୁ",
  "Read the 2019 demand": "2019ର ଦାବି ପଢ଼ନ୍ତୁ",
  "Add the receipt": "ରସିଦ ଯୋଡ଼ନ୍ତୁ",
  "Point it at the right account": "ଠିକ୍ ଖାତା ଆଡ଼କୁ ମୋଡ଼ନ୍ତୁ",
  "Supervisor, garment unit": "ସୁପରଭାଇଜର୍, ଗାରମେଣ୍ଟ ୟୁନିଟ୍",
  "Operations manager; trades equity on the side": "ଅପରେସନ୍ସ ମ୍ୟାନେଜର୍; ସାଙ୍ଗକୁ ସେୟାର କାରବାର",
  "Junior architect; first time filing": "ଜୁନିୟର ଆର୍କିଟେକ୍ଟ; ପ୍ରଥମ ଥର ଦାଖଲ କରୁଛନ୍ତି",
  "Independent Consultant": "ସ୍ୱାଧୀନ ପରାମର୍ଶଦାତା",
  "Primary School Teacher": "ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ ଶିକ୍ଷୟିତ୍ରୀ",
  "Retired bank clerk": "ଅବସରପ୍ରାପ୍ତ ବ୍ୟାଙ୍କ କିରାଣୀ",
  "Retired": "ଅବସରପ୍ରାପ୍ତ",
  "Teacher": "ଶିକ୍ଷକ",
  "You sent your return in.": "ଆପଣ ଆପଣଙ୍କ ରିଟର୍ନ ପଠାଇ ଦେଲେ।",
  "You confirmed it was you. The return counts from here.":
    "ଏହା ଆପଣ ହିଁ ବୋଲି ଆପଣ ନିଶ୍ଚିତ କଲେ। ରିଟର୍ନ ଏଠାରୁ ହିଁ ଗଣା ହୁଏ।",
  "In the queue with everything else filed that week.":
    "ସେହି ସପ୍ତାହରେ ଦାଖଲ ହୋଇଥିବା ଅନ୍ୟ ସବୁ ସହ ଧାଡ଼ିରେ।",
  "Someone is looking at one figure.": "କେହି ଜଣେ ଗୋଟିଏ ଅଙ୍କକୁ ଦେଖୁଛନ୍ତି।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "ଆପଣଙ୍କ ବ୍ରୋକର୍ ଦାଖଲ କରିଥିବା ଏକ ସେୟାର-ବିକ୍ରି ଧାଡ଼ି ଆପଣଙ୍କ ରିଟର୍ନ ସହ ମେଳ ଖାଉ ନାହିଁ।",
  "OTP verified, 4 minutes after filing.": "OTP ଯାଞ୍ଚ ହେଲା, ଦାଖଲର 4 ମିନିଟ୍ ପରେ।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG ତଳେ ₹60,000ର ଦାବି, ସମର୍ଥନରେ କିଛି ଯୋଡ଼ାଯାଇ ନାହିଁ।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank ଯାଞ୍ଚ ଫେରାଇ ଦେଲା: IFSC GODG0004417 ଆଉ କେଉଁଆଡ଼େ ଯାଏ ନାହିଁ।",
  "OTP Verification Complete": "OTP ଯାଞ୍ଚ ସମ୍ପୂର୍ଣ୍ଣ",
  "Outstanding Compliance Notices": "ବାକି ଥିବା ଅନୁପାଳନ ନୋଟିସ୍",
  "Draft Legal Response": "ଆଇନଗତ ଉତ୍ତରର ଡ୍ରାଫ୍ଟ",
  "No Pending Actions": "କୌଣସି କାମ ବାକି ନାହିଁ",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "ଆପଣଙ୍କ ଖାତା ପୁରାପୁରି ନିୟମ ଭିତରେ ଅଛି — କୌଣସି ବାକି ନୋଟିସ୍ କି କର ଦାବି ନାହିଁ।",
  "Actionable Assessment Holds": "କାର୍ଯ୍ୟ ଯୋଗ୍ୟ ନିର୍ଦ୍ଧାରଣ ଅଟକ",
  "Upload Rent Agreement / Receipts": "ଭଡ଼ା ଚୁକ୍ତି / ରସିଦ ଅପଲୋଡ୍ କରନ୍ତୁ",
  "Landlord Name": "ଘର ମାଲିକଙ୍କ ନାମ",
  "Landlord PAN (10 Digits)": "ଘର ମାଲିକଙ୍କ PAN (10 ଅଙ୍କ)",
  "Select PDF/JPG": "PDF/JPG ବାଛନ୍ତୁ",
  "Submit Receipt": "ରସିଦ ଜମା କରନ୍ତୁ",
  "Response Position": "ଉତ୍ତରର ଅବସ୍ଥାନ",
  "I Agree with Department": "ମୁଁ ବିଭାଗ ସହ ସହମତ",
  "I Disagree (Submit Proof)": "ମୁଁ ଅସହମତ (ପ୍ରମାଣ ଜମା କରନ୍ତୁ)",
  "Response Statement (Draft)": "ଉତ୍ତରର ବିବରଣୀ (ଡ୍ରାଫ୍ଟ)",
  "Dictate Statement": "କହି ଲେଖାନ୍ତୁ",
  "Listening...": "ଶୁଣୁଛି...",
  "Explain your disagreement or agreement...": "ଆପଣଙ୍କ ସହମତି କି ଅସହମତି ସ୍ପଷ୍ଟ କରନ୍ତୁ...",
  "Send Response": "ଉତ୍ତର ପଠାନ୍ତୁ",
  "Cancel": "ବାତିଲ୍ କରନ୍ତୁ",
  "Validate Bank Code": "ବ୍ୟାଙ୍କ କୋଡ୍ ଯାଞ୍ଚ କରନ୍ତୁ",
  "Update Bank IFSC": "ବ୍ୟାଙ୍କ IFSC ଅପଡେଟ୍ କରନ୍ତୁ",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "ବ୍ୟାଙ୍କ ବିବରଣୀ ଯାଞ୍ଚ କରିବା ପାଇଁ 11 ଅଙ୍କର ବ୍ୟାଙ୍କ କୋଡ୍ (IFSC) ଦେଖନ୍ତୁ।",
  "IFSC Code": "IFSC କୋଡ୍",
};

/**
 * ਪੰਜਾਬੀ (Punjabi, Gurmukhi script). Typed against the English source, so this
 * file cannot fall behind it.
 *
 * This translation is model-generated and awaits review by a native Punjabi
 * speaker who knows tax vocabulary (project task T0.5). That limitation is
 * real and is disclosed rather than hidden.
 *
 * Digits stay Latin. ₹ stays ₹. PAN, TDS, IFSC, OTP, AIS, 26AS, section codes
 * and persona/bank names stay untranslated, following hi.ts precedent.
 */

import type { Dict } from "./en";

export const pa: Dict = {
  langName: "Punjabi",
  langNativeName: "ਪੰਜਾਬੀ",
  dir: "ltr",

  common: {
    modeSimple: "ਸਰਲ",
    modeDetailed: "ਵਿਸਥਾਰ ਨਾਲ",
    continue: "ਅੱਗੇ ਵਧੋ",
    back: "ਪਿੱਛੇ",
    yesThatsRight: "ਹਾਂ, ਇਹ ਸਹੀ ਹੈ",
    noThisIsWrong: "ਨਹੀਂ, ਇਹ ਗ਼ਲਤ ਹੈ",
    iDontUnderstand: "ਮੈਨੂੰ ਇਹ ਸਮਝ ਨਹੀਂ ਆਇਆ",
    close: "ਬੰਦ ਕਰੋ",
    saveAndGoOn: "ਸੰਭਾਲੋ ਤੇ ਅੱਗੇ ਵਧੋ",
    loading: "ਇੱਕ ਪਲ",
    logOut: "ਲੌਗ ਆਊਟ",
    undo: "ਵਾਪਸ ਲਓ",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ਵਾਪਸੀ",
    subtitle: "ਜਾਂਚਣ ਤੇ ਫਾਈਲ ਕਰਨ ਦਾ ਸੌਖਾ ਤਰੀਕਾ",
    independent: "ਸੁਤੰਤਰ ਪ੍ਰੋਟੋਟਾਈਪ",
    taxYear: "ਟੈਕਸ ਸਾਲ 2026-27",
    language: "ਭਾਸ਼ਾ",
    light: "ਲਾਈਟ",
    dark: "ਡਾਰਕ",
    sandbox: "ਰਿਵਿਊ ਟੂਲ",
  },

  validate: {
    panTooShort: (n: number) => `ਹੁਣ ਤੱਕ ${n} ਅੱਖਰ ਹਨ। PAN ਵਿੱਚ 10 ਹੁੰਦੇ ਹਨ।`,
    panShape:
      "PAN ਵਿੱਚ ਪਹਿਲਾਂ ਪੰਜ ਅੱਖਰ, ਫਿਰ ਚਾਰ ਅੰਕ, ਫਿਰ ਇੱਕ ਅੱਖਰ ਹੁੰਦਾ ਹੈ — ਜਿਵੇਂ DEMPS4417K।",
    panSandboxHint:
      "ਤੁਸੀਂ ਇੱਥੇ ਜੋ ਵੀ ਲਿਖਦੇ ਹੋ, ਉਹ ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਤੋਂ ਬਾਹਰ ਨਹੀਂ ਜਾਂਦਾ। ਇਸ ਪ੍ਰੋਟੋਟਾਈਪ ਵਿੱਚ ਹਰ PAN DEMP ਨਾਲ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ, ਇਸ ਲਈ ਕੋਈ ਅਸਲੀ PAN ਗ਼ਲਤੀ ਨਾਲ ਨਹੀਂ ਲੱਭਿਆ ਜਾ ਸਕਦਾ।",
    ifscTooShort: (n: number) => `ਹੁਣ ${n} ਅੱਖਰ ਹਨ। ਬੈਂਕ ਕੋਡ ਵਿੱਚ 11 ਹੁੰਦੇ ਹਨ।`,
    ifscShape:
      "ਬੈਂਕ ਕੋਡ ਵਿੱਚ ਪਹਿਲਾਂ ਚਾਰ ਅੱਖਰ, ਫਿਰ ਇੱਕ ਸਿਫ਼ਰ, ਫਿਰ ਛੇ ਹੋਰ — ਜਿਵੇਂ DECU0834471।",
  },

  landing: {
    question: "ਕੀ ਆਮਦਨ ਕਰ ਵਿਭਾਗ ਕੋਲ ਤੁਹਾਡਾ ਪੈਸਾ ਰੁਕਿਆ ਪਿਆ ਹੈ?",
    subtext:
      "ਇੱਥੇ ਆਉਣ ਵਾਲੇ ਬਹੁਤੇ ਲੋਕਾਂ ਨੇ ਕੁਝ ਦੇਣਾ ਨਹੀਂ ਹੁੰਦਾ — ਉਨ੍ਹਾਂ ਨੇ ਲੈਣਾ ਹੁੰਦਾ ਹੈ। ਆਪਣਾ PAN ਪਾਓ, ਅਸੀਂ ਦੱਸ ਦਿਆਂਗੇ ਕਿ ਕੀ ਰੁਕਿਆ ਹੈ।",
    panLabel: "ਤੁਹਾਡਾ PAN",
    panHelp: "ਦਸ ਅੱਖਰ, ਤੁਹਾਡੇ PAN ਕਾਰਡ ਤੋਂ",
    panPlaceholder: "ਜਿਵੇਂ, DEMPS4417K",
    check: "ਵੇਖੋ ਮੇਰਾ ਕਿੰਨਾ ਬਣਦਾ ਹੈ",
    orTryAs: "ਜਾਂ ਤਿੰਨ ਲੋਕਾਂ ਵਿੱਚੋਂ ਕਿਸੇ ਇੱਕ ਵਾਂਗ ਵੇਖੋ",
    honestyLink: "ਇੱਥੇ ਕੀ ਅਸਲੀ ਹੈ ਤੇ ਕੀ ਬਣਾਇਆ ਹੋਇਆ",
    architectureLink: "ਤਕਨੀਕੀ ਬਣਤਰ",
    badge: "ਸਰਲ ਰਿਟਰਨ, ਪਰਖਿਆ ਹੋਇਆ",
    brandTitle: "ਤੁਹਾਡਾ ਪੈਸਾ, ਵਾਪਸੀ ਦੇ ਰਾਹ 'ਤੇ।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ਫਾਈਲ ਕਰਨਾ",
      blurb:
        "ਉਸਦੀ ਤਨਖ਼ਾਹ ਵਿੱਚੋਂ ₹8,400 ਕੱਟ ਲਏ ਗਏ। ਉਸਨੇ ਕੁਝ ਦੇਣਾ ਨਹੀਂ, ਫਾਈਲ ਨਹੀਂ ਕੀਤਾ, ਤੇ ਸਕੂਲ ਦੀ ਫ਼ੀਸ ਦੇਣੀ ਹੈ।",
      action: "ਜੋ ਪਹਿਲਾਂ ਹੀ ਪਤਾ ਹੈ, ਉਸਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
    },
    rakesh: {
      phase: "ਇੱਕ ਚਿੱਠੀ ਆਈ",
      blurb:
        "ਚਿੱਠੀ ਕਹਿੰਦੀ ਹੈ ਕਿ ਉਸਨੇ ਸ਼ੇਅਰਾਂ ਦਾ ₹1,10,000 ਦਾ ਮੁਨਾਫ਼ਾ ਲੁਕਾਇਆ। ਉਸਦਾ ਰਿਫੰਡ ਇੱਕ ਪੁਰਾਣੀ ਮੰਗ ਬਦਲੇ ਰੋਕ ਲਿਆ ਗਿਆ ਹੈ, ਜਿਸ ਬਾਰੇ ਉਸਨੂੰ ਕਦੇ ਦੱਸਿਆ ਹੀ ਨਹੀਂ ਗਿਆ।",
      action: "ਪੜ੍ਹੋ ਤੇ ਅਸਹਿਮਤ ਹੋਵੋ",
    },
    priya: {
      phase: "ਉਡੀਕ",
      blurb:
        "71 ਦਿਨ ਪਹਿਲਾਂ ਫਾਈਲ ਕੀਤਾ। ਹਾਲੇ ਵੀ ਲਿਖਿਆ ਹੈ ਕਿ ਕਾਰਵਾਈ ਚੱਲ ਰਹੀ ਹੈ। ਅਸਲ ਵਿੱਚ ਦੋ ਚੀਜ਼ਾਂ ਰੋਕ ਰਹੀਆਂ ਹਨ, ਤੇ ਕਿਸੇ ਨੇ ਨਹੀਂ ਦੱਸਿਆ ਕਿਹੜੀਆਂ।",
      action: "ਵੇਖੋ ਕੀ ਰੋਕ ਰਿਹਾ ਹੈ",
    },
    custom: {
      phase: "ਆਪਣਾ ਬਣਾਓ",
      blurbTitle: "ਬਣਾਇਆ ਹੋਇਆ ਕੋਈ",
      blurb:
        "ਸ਼ੁਰੂ ਤੋਂ ਇੱਕ ਬੰਦਾ ਬਣਾਓ — ਉਸਦੀ ਕਮਾਈ, ਉਸਦੇ ਦਾਅਵੇ, ਉਸ ਤੋਂ ਕੱਟਿਆ ਟੈਕਸ — ਤੇ ਵੇਖੋ ਕਿ ਹਿਸਾਬ ਆਪਣੇ ਆਪ ਕਿਵੇਂ ਬਣਦਾ ਹੈ।",
      action: "ਕੋਈ ਬਣਾ ਲਓ",
    },
  },

  login: {
    authVerifying: "ਸਰਵਰ ਨਾਲ ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ…",
    authUnreachable:
      "ਸਾਈਨ-ਇਨ ਸਰਵਰ ਤੱਕ ਪਹੁੰਚ ਨਹੀਂ ਹੋ ਸਕੀ। ਤੁਹਾਡਾ ਭਰਿਆ ਹੋਇਆ ਕੁਝ ਵੀ ਗੁਆਚਿਆ ਨਹੀਂ — ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    authRejected: (detail: string) => `ਸਰਵਰ ਨੇ ਸਾਈਨ-ਇਨ ਨਹੀਂ ਹੋਣ ਦਿੱਤਾ: ${detail}`,
    signedInAs: "ਸਾਈਨ-ਇਨ ਹੋ ਗਏ — ਸੈਸ਼ਨ ਚਾਲੂ ਹੈ",
    otpSentTo: (mobile: string) => `ਅਸੀਂ ${mobile} 'ਤੇ ਇੱਕ ਕੋਡ ਭੇਜਿਆ ਹੈ`,
    otpLabel: "ਛੇ ਅੰਕਾਂ ਦਾ ਕੋਡ",
    weWillWait:
      "ਕੋਈ ਕਾਹਲੀ ਨਹੀਂ। ਕੋਡ ਦੀ ਉਡੀਕ ਦੌਰਾਨ ਤੁਹਾਡਾ ਭਰਿਆ ਹੋਇਆ ਕੁਝ ਵੀ ਨਹੀਂ ਜਾਵੇਗਾ।",
    resend: "ਦੁਬਾਰਾ ਭੇਜੋ",
    resendIn: (seconds: number) => `${seconds} ਸਕਿੰਟ ਬਾਅਦ ਦੁਬਾਰਾ ਮੰਗ ਸਕਦੇ ਹੋ`,
    mockNotice:
      "ਇਹ ਇੱਕ ਪ੍ਰੋਟੋਟਾਈਪ ਹੈ, ਇਸ ਲਈ ਕੋਡ ਸਕ੍ਰੀਨ 'ਤੇ ਹੀ ਵਿਖਾਇਆ ਗਿਆ ਹੈ। ਕੋਈ ਅਸਲੀ ਸੁਨੇਹਾ ਨਹੀਂ ਭੇਜਿਆ ਜਾਂਦਾ।",
    portalHeading: "ਈ-ਫਾਈਲਿੰਗ ਤਸਦੀਕ",
    incorrectCode: "ਇਹ ਕੋਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦਾ। ਛੇ ਅੰਕ ਫਿਰ ਜਾਂਚੋ ਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    prototypeBox: "ਪ੍ਰੋਟੋਟਾਈਪ OTP ਤਸਦੀਕ",
    mockCodeLabel: "ਮੌਕ ਕੋਡ",
    autoFill: "ਮੇਰੇ ਲਈ ਭਰ ਦਿਓ",
    verifyEnter: "ਤਸਦੀਕ ਕਰੋ ਤੇ ਅੰਦਰ ਜਾਓ",
    draftRestored: (time: string) =>
      `ਤੁਹਾਡਾ ${time} ਵਾਲਾ ਡਰਾਫਟ ਵਾਪਸ ਲਿਆਂਦਾ ਗਿਆ। ਕੁਝ ਵੀ ਨਹੀਂ ਗੁਆਚਿਆ।`,
  },

  file: {
    heading: (amount: string) => `ਤੁਹਾਡੇ ${amount} ਵਿਭਾਗ ਕੋਲ ਪਏ ਹਨ`,
    subheading:
      "ਹੇਠਾਂ ਲਿਖੀ ਲਗਭਗ ਹਰ ਗੱਲ ਤੁਹਾਡੇ ਬਾਰੇ ਪਹਿਲਾਂ ਹੀ ਦੱਸੀ ਜਾ ਚੁੱਕੀ ਹੈ। ਇਸਨੂੰ ਪੜ੍ਹੋ, ਤੇ ਕੁਝ ਗ਼ਲਤ ਹੋਵੇ ਤਾਂ ਸਾਨੂੰ ਦੱਸੋ।",

    checkThis: "ਇਸਨੂੰ ਜਾਂਚ ਲਓ — ਭਰਨਾ ਨਹੀਂ ਪੈਣਾ",
    factMeaning:
      "ਇਹ ਪਹਿਲਾਂ ਦੱਸੀ ਹੋਈ ਗੱਲ ਹੈ, ਟੈਕਸ ਦਾ ਨਿਯਮ ਨਹੀਂ। ਇਸੇ ਤੋਂ ਹੇਠਾਂ ਦਾ ਹਿਸਾਬ ਬਣਦਾ ਹੈ।",
    factMeaningByKind: {
      salary:
        "ਤੁਹਾਡੇ ਮਾਲਕ ਨੇ ਤੁਹਾਡੇ ਤੱਕ ਪਹੁੰਚੀ ਤਨਖ਼ਾਹ ਤੋਂ ਇਹ ਦਰਜ ਕੀਤਾ। ਹੇਠਾਂ ਦਾ ਸਾਰਾ ਹਿਸਾਬ ਇੱਥੋਂ ਹੀ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ।",
      interest:
        "ਬੈਂਕ ਸਾਲ ਵਿੱਚ ਇੱਕ ਵਾਰ ਤੁਹਾਡੇ ਖਾਤਿਆਂ ਦਾ ਵਿਆਜ ਦਰਜ ਕਰਦੇ ਹਨ। ਛੋਟੀ ਰਕਮ ਵੀ ਆਮਦਨ ਹੈ।",
      dividend:
        "ਕੰਪਨੀ ਦੇ ਰਜਿਸਟਰਾਰ ਨੇ ਦਰਜ ਕੀਤਾ ਕਿ ਤੁਹਾਡੇ ਸ਼ੇਅਰਾਂ ਨੇ ਕੀ ਦਿੱਤਾ। ਜਿਸ ਸਾਲ ਮਿਲਿਆ, ਉਸੇ ਸਾਲ ਦੀ ਆਮਦਨ ਗਿਣਿਆ ਜਾਂਦਾ ਹੈ।",
      capital_gains:
        "ਤੁਹਾਡੇ ਬ੍ਰੋਕਰ ਨੇ ਸ਼ੇਅਰ ਵੇਚਣ ਤੋਂ ਮਿਲਿਆ ਪੈਸਾ ਦਰਜ ਕੀਤਾ। ਟੈਕਸ ਲਾਭ 'ਤੇ ਲੱਗਦਾ ਹੈ — ਦਰ ਇਸ 'ਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ ਕਿ ਕੀ ਵੇਚਿਆ ਤੇ ਕਿੰਨਾ ਚਿਰ ਰੱਖਿਆ।",
      rent:
        "ਮਿਲਿਆ ਕਿਰਾਇਆ ਆਮਦਨ ਹੈ; ਦਿੱਤਾ ਕਿਰਾਇਆ ਟੈਕਸ ਘਟਾ ਸਕਦਾ ਹੈ। ਦੋਵੇਂ ਹਾਲਤਾਂ ਵਿੱਚ ਇਹ ਦੂਜੇ ਪਾਸੇ ਦੇ ਦਰਜ ਅੰਕੜੇ ਨਾਲ ਮੇਲ ਖਾਣਾ ਚਾਹੀਦਾ ਹੈ।",
      other:
        "ਅਜਿਹੀ ਦਰਜ ਆਮਦਨ ਜੋ ਕਿਸੇ ਹੋਰ ਖਾਨੇ ਵਿੱਚ ਨਹੀਂ ਆਉਂਦੀ। ਇਹ ਵੀ ਹੇਠਾਂ ਦੇ ਹਿਸਾਬ ਵਿੱਚ ਜੁੜਦੀ ਹੈ।",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ਨੇ ${date} ਨੂੰ ਵਿਭਾਗ ਨੂੰ ਇਹ ਦੱਸਿਆ`,
    underIdentifier: (identifier: string) => `ਰਜਿਸਟਰੇਸ਼ਨ ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `ਜੇ ਇਹ ਗ਼ਲਤ ਹੈ, ਤਾਂ ਇਸਨੂੰ ਅਸਲ ਥਾਂ 'ਤੇ ਸਿਰਫ਼ ${reporter} ਹੀ ਬਦਲ ਸਕਦੇ ਹਨ। ਅਸੀਂ ਦੱਸ ਦਿਆਂਗੇ ਕਿ ਉਨ੍ਹਾਂ ਤੋਂ ਠੀਕ ਕੀ ਮੰਗਣਾ ਹੈ।`,

    whatYouEarned: "ਤੁਸੀਂ ਕਿੰਨਾ ਕਮਾਇਆ",
    whatWasDeducted: "ਟੈਕਸ ਪਹਿਲਾਂ ਹੀ ਕਿੰਨਾ ਕੱਟਿਆ ਗਿਆ",
    whereMoneyGoes: "ਪੈਸਾ ਕਿੱਥੇ ਜਾਵੇਗਾ",
    whoYouAre: "ਤੁਸੀਂ ਕੌਣ ਹੋ",

    disputeHeading: "ਇਸ ਵਿੱਚ ਕੀ ਲਿਖਿਆ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ?",
    disputeAmountLabel: "ਸਹੀ ਰਕਮ",
    disputeReasonLabel: "ਇਹ ਗ਼ਲਤ ਕਿਉਂ ਹੈ",
    disputeSave: "ਇਸਨੂੰ ਗ਼ਲਤ ਦੱਸੋ",
    selfReported: "ਤੁਸੀਂ",
    returnLabel: "ਤੁਹਾਡਾ ਰਿਟਰਨ",

    outcomeOwesNothing: "ਤੁਸੀਂ ਕੁਝ ਨਹੀਂ ਦੇਣਾ।",
    outcomeRefund: (amount: string) => `${amount} ਤੁਹਾਨੂੰ ਵਾਪਸ ਮਿਲਣਗੇ।`,
    outcomeOwes: (amount: string) => `${amount} ਦੇਣੇ ਬਾਕੀ ਹਨ।`,
    confirmAndFile: "ਇਸਨੂੰ ਭੇਜ ਦਿਓ",

    verifyHeading: "ਬੱਸ ਇੱਕ ਕਦਮ ਬਾਕੀ ਹੈ, ਨਹੀਂ ਤਾਂ ਇਹ ਗਿਣਿਆ ਨਹੀਂ ਜਾਵੇਗਾ।",
    verifyBody:
      "ਜਦ ਤੱਕ ਤੁਸੀਂ ਪੁਸ਼ਟੀ ਨਹੀਂ ਕਰਦੇ ਕਿ ਇਹ ਤੁਸੀਂ ਹੀ ਹੋ, ਤੁਹਾਡਾ ਰਿਟਰਨ ਦਾਖਲ ਨਹੀਂ ਮੰਨਿਆ ਜਾਂਦਾ — ਜਿਵੇਂ ਤੁਸੀਂ ਭੇਜਿਆ ਹੀ ਨਹੀਂ। ਇਸ ਵਿੱਚ ਕਰੀਬ ਵੀਹ ਸਕਿੰਟ ਲੱਗਦੇ ਹਨ।",
    verifyAction: "ਪੁਸ਼ਟੀ ਕਰੋ ਕਿ ਇਹ ਮੈਂ ਹਾਂ",

    voicePrompt: "ਜਾਂ ਬੋਲ ਕੇ ਦੱਸ ਦਿਓ",
    voiceListening: "ਸੁਣ ਰਹੇ ਹਾਂ",
    voiceUnsupported:
      "ਇਸ ਫ਼ੋਨ ਦਾ ਬ੍ਰਾਊਜ਼ਰ ਹਾਲੇ ਸੁਣ ਨਹੀਂ ਸਕਦਾ। ਤੁਸੀਂ ਲਿਖ ਕੇ ਦੱਸ ਸਕਦੇ ਹੋ — ਕੁਝ ਨਹੀਂ ਜਾਵੇਗਾ।",
    voiceSimulated:
      "ਇਹ ਬ੍ਰਾਊਜ਼ਰ ਸੁਣ ਨਹੀਂ ਸਕਦਾ, ਇਸ ਲਈ ਇਹ ਇੱਕ ਮਿਸਾਲ ਹੈ, ਤੁਹਾਡੀ ਆਵਾਜ਼ ਨਹੀਂ।",
    voiceError: "ਇਹ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤਾ। ਤੁਸੀਂ ਲਿਖ ਕੇ ਦੱਸ ਸਕਦੇ ਹੋ — ਕੁਝ ਨਹੀਂ ਜਾਵੇਗਾ।",
    dictate: "ਬੋਲ ਕੇ ਦੱਸੋ",
    disputePlaceholder: "ਇਹ ਅੰਕੜਾ ਗ਼ਲਤ ਕਿਉਂ ਹੈ — ਲਿਖੋ ਜਾਂ ਬੋਲੋ।",
    disputeDefaultReason: "ਦੱਸਿਆ ਗਿਆ ਅੰਕੜਾ ਗ਼ਲਤ ਹੈ",
  },

  flow: {
    facts: "ਤੁਹਾਡਾ ਪੈਸਾ",
    deductions: "ਉਹ ਪੈਸਾ ਜੋ ਤੁਸੀਂ ਮੰਗ ਸਕਦੇ ਹੋ",
    regime: "ਪੁਰਾਣਾ ਜਾਂ ਨਵਾਂ",
    check: "ਜਾਂਚ ਲਓ",
    file: "ਭੇਜ ਦਿਓ",
    stepOf: (n: number, total: number) => `ਕਦਮ ${n}, ਕੁੱਲ ${total}`,
    confirmedCount: (done: number, total: number) => `${total} ਵਿੱਚੋਂ ${done} ਪੱਕੇ`,
    allConfirmed: "ਸਭ ਕੁਝ ਠੀਕ-ਠਾਕ ਹੈ।",
    undoOne: "ਇਹ ਸੁਧਾਰ ਵਾਪਸ ਲਓ",
    correctedTo: (amount: string) => `ਤੁਸੀਂ ਕਹਿੰਦੇ ਹੋ ਇਹ ${amount} ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ`,
  },

  groups: {
    moneyIn: "ਆਉਣ ਵਾਲਾ ਪੈਸਾ",
    taxPaid: "ਤੁਹਾਡੇ ਲਈ ਪਹਿਲਾਂ ਹੀ ਕੱਟਿਆ ਟੈਕਸ",
    deductionsClaimed: "ਤੁਹਾਡੇ ਦਾਅਵੇ",
    fromWhere: "ਇਹ ਕਿੱਥੋਂ ਆਇਆ",
    addIncome: "ਆਮਦਨ ਜੋੜੋ",
  },

  deductions: {
    notAllowedNewRegime:
      "ਨਵੀਂ ਰਿਜੀਮ ਵਿੱਚ ਨਹੀਂ ਗਿਣਿਆ ਜਾਂਦਾ — ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਵਿੱਚ ਸੰਭਾਲਿਆ ਹੋਇਆ ਹੈ।",
    startedAtCap: (amount: string) =>
      `ਅਸੀਂ ਇਸਨੂੰ ${amount} ਦੀ ਹੱਦ ਤੋਂ ਸ਼ੁਰੂ ਕੀਤਾ — “ਕਿੰਨਾ” ਵਿੱਚ ਉਹ ਰਕਮ ਪਾਓ ਜੋ ਤੁਸੀਂ ਅਸਲ ਵਿੱਚ ਦਿੱਤੀ।`,
    heading: "ਉਹ ਪੈਸਾ ਜੋ ਤੁਸੀਂ ਮੰਗ ਸਕਦੇ ਹੋ",
    sub: "ਇਹ ਆਪਣੇ ਆਪ ਨਹੀਂ ਹੁੰਦੇ। ਤੁਹਾਨੂੰ ਹਾਂ ਕਹਿਣੀ ਪੈਂਦੀ ਹੈ — ਪਰ ਤਦੇ, ਜਦੋਂ ਸੱਚ ਹੋਵੇ।",
    claimedHeading: "ਤੁਹਾਡੇ ਰਿਟਰਨ ਵਿੱਚ ਪਹਿਲਾਂ ਤੋਂ",
    worthUpTo: (amount: string) =>
      `ਤੁਹਾਡੀ ਟੈਕਸ-ਯੋਗ ਆਮਦਨ ਵਿੱਚੋਂ ${amount} ਤੱਕ ਘਟ ਸਕਦਾ ਹੈ`,
    worthWhatYouPaid: "ਓਨਾ ਹੀ ਜਿੰਨਾ ਤੁਸੀਂ ਅਸਲ ਵਿੱਚ ਦਿੱਤਾ — ਸਹੀ ਰਕਮ ਭਰੋ",
    askRentQ: "ਕੀ ਤੁਸੀਂ ਰਹਿਣ ਲਈ ਕਿਰਾਇਆ ਦਿੰਦੇ ਹੋ?",
    askRentWhy:
      "ਜੇ ਤੁਸੀਂ ਕਿਰਾਇਆ ਦਿੰਦੇ ਹੋ ਤੇ ਤੁਹਾਡੇ ਮਾਲਕ ਤੋਂ ਮਕਾਨ-ਕਿਰਾਇਆ ਭੱਤਾ ਨਹੀਂ ਮਿਲਦਾ, ਤਾਂ ਉਸਦਾ ਕੁਝ ਹਿੱਸਾ ਤੁਹਾਡੀ ਟੈਕਸ-ਯੋਗ ਆਮਦਨ ਵਿੱਚੋਂ ਘਟ ਸਕਦਾ ਹੈ।",
    askHealthQ: "ਕੀ ਤੁਸੀਂ ਪਰਿਵਾਰ ਦਾ ਸਿਹਤ ਬੀਮਾ ਆਪ ਭਰਦੇ ਹੋ?",
    askHealthWhy:
      "ਪਰਿਵਾਰ ਦਾ ਬੀਮਾ ਰੱਖਣ ਲਈ ਜੋ ਤੁਸੀਂ ਭਰਦੇ ਹੋ, ਉਹ ਤੁਹਾਡੀ ਟੈਕਸ-ਯੋਗ ਆਮਦਨ ਵਿੱਚੋਂ ਘਟ ਸਕਦਾ ਹੈ।",
    ask80cQ: "ਕੀ ਤੁਸੀਂ ਪ੍ਰਾਵੀਡੈਂਟ ਫੰਡ, ਜੀਵਨ ਬੀਮਾ ਜਾਂ ਸਕੂਲ ਦੀ ਫ਼ੀਸ ਵਿੱਚ ਪੈਸਾ ਲਾਉਂਦੇ ਹੋ?",
    ask80cWhy:
      "ਅਜਿਹੀ ਲੰਮੇ ਸਮੇਂ ਦੀ ਬੱਚਤ ਇੱਕ ਸਾਂਝੀ ਹੱਦ ਵਿੱਚ ਗਿਣੀ ਜਾਂਦੀ ਹੈ, ਤੇ ਜਿੰਨਾ ਤੁਸੀਂ ਪਾਉਂਦੇ ਹੋ ਓਨਾ ਟੈਕਸ-ਯੋਗ ਆਮਦਨ ਵਿੱਚੋਂ ਘਟਦਾ ਹੈ।",
    claimIt: "ਹਾਂ — ਇਹ ਮੰਗਣਾ ਹੈ",
    skipIt: "ਨਹੀਂ — ਇਹ ਛੱਡ ਦਿਓ",
    amountLabel: "ਕਿੰਨਾ",
    evidenceAttached: "ਸਬੂਤ ਨੱਥੀ ਹੈ",
    evidenceMissing:
      "ਹਾਲੇ ਕੋਈ ਸਬੂਤ ਨਹੀਂ ਜੁੜਿਆ — ਹੁਣ ਲਈ ਠੀਕ ਹੈ। ਰਸੀਦਾਂ ਸੰਭਾਲ ਕੇ ਰੱਖੋ; ਵਿਭਾਗ ਬਾਅਦ ਵਿੱਚ ਮੰਗ ਸਕਦਾ ਹੈ।",
    newRegimeNoEffect:
      "ਨਵੀਂ ਰਿਜੀਮ ਵਿੱਚ ਇਸ ਦਾਅਵੇ ਨਾਲ ਕੁਝ ਨਹੀਂ ਬਦਲਦਾ — ਉੱਥੇ ਇਹ ਮੰਨਿਆ ਨਹੀਂ ਜਾਂਦਾ।",
    oldRegimeSaves: (amount: string) =>
      `ਪੁਰਾਣੀ ਰਿਜੀਮ ਵਿੱਚ ਇਹ ਤੁਹਾਡਾ ਟੈਕਸ ਕਰੀਬ ${amount} ਘਟਾ ਦਿੰਦਾ।`,
  },

  regime: {
    heading: "ਟੈਕਸ ਦੋ ਤਰੀਕਿਆਂ ਨਾਲ ਲੱਗ ਸਕਦਾ ਹੈ। ਇੱਕ ਤੁਹਾਡੇ ਲਈ ਬਿਹਤਰ ਹੈ।",
    newRegimeName: "ਨਵੀਂ ਰਿਜੀਮ",
    oldRegimeName: "ਪੁਰਾਣੀ ਰਿਜੀਮ",
    refundLabel: "ਤੁਹਾਨੂੰ ਵਾਪਸ ਮਿਲੇਗਾ",
    dueLabel: "ਦੇਣਾ ਬਾਕੀ",
    recommendedBadge: "ਤੁਹਾਡੇ ਲਈ ਬਿਹਤਰ",
    reasoningOldDeductions: (x: string, y: string) =>
      `ਤੁਹਾਡੇ ਦਾਅਵੇ ਕੁੱਲ ${x} ਦੇ ਹਨ, ਇਸ ਲਈ ਪੁਰਾਣੀ ਰਿਜੀਮ ਤੁਹਾਡੇ ਕਰੀਬ ${y} ਬਚਾਉਂਦੀ ਹੈ।`,
    reasoningNewDefault: (y: string) =>
      `ਤੁਹਾਡੇ ਦਾਅਵੇ ਇੱਥੇ ਬਹੁਤਾ ਫ਼ਰਕ ਨਹੀਂ ਪਾਉਂਦੇ, ਇਸ ਲਈ ਨਵੀਂ ਰਿਜੀਮ ਦੀਆਂ ਘੱਟ ਦਰਾਂ ਤੁਹਾਡੇ ਕਰੀਬ ${y} ਬਚਾਉਂਦੀਆਂ ਹਨ।`,
    acceptRecommendation: "ਜੋ ਮੇਰੇ ਲਈ ਬਿਹਤਰ ਹੈ, ਉਹੀ ਚੁਣੋ",
    overrideNote: "ਤੁਸੀਂ ਕੋਈ ਵੀ ਚੁਣ ਸਕਦੇ ਹੋ। ਇੱਥੇ ਕੁਝ ਲੁਕਿਆ ਜਾਂ ਬੰਦ ਨਹੀਂ ਹੈ।",
  },

  check: {
    newRegimeClaimsZero:
      "ਤੁਹਾਡੇ ਦਾਅਵੇ ਦਰਜ ਤੇ ਸੁਰੱਖਿਅਤ ਹਨ — ਨਵੀਂ ਰਿਜੀਮ ਇਨ੍ਹਾਂ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਦਿੰਦੀ, ਇਸੇ ਲਈ ਇਹ ਲਾਈਨ ₹0 ਹੈ।",
    badgeReportedBy: (reporter: string) => `${reporter} ਨੇ ਦਰਜ ਕੀਤਾ`,
    badgeYouEntered: "ਤੁਸੀਂ ਦਰਜ ਕੀਤਾ",
    badgeWeApplied: "ਅਸੀਂ ਤੁਹਾਡੇ ਲਈ ਲਾਗੂ ਕੀਤਾ",
    heading: "ਪੂਰਾ ਰਿਟਰਨ, ਇੱਕੋ ਸਫ਼ੇ 'ਤੇ",
    sub: "ਹਰ ਅੰਕੜਾ ਕਿਤਿਓਂ ਆਇਆ ਹੈ। ਕੋਈ ਵੀ ਲਾਈਨ ਖੋਲ੍ਹੋ ਤੇ ਠੀਕ-ਠੀਕ ਵੇਖੋ ਕਿ ਕਿੱਥੋਂ।",
    grossIncome: "ਜੋ ਕੁਝ ਆਇਆ",
    standardDeduction: "ਸਟੈਂਡਰਡ ਕਟੌਤੀ",
    deductionsLine: "ਤੁਹਾਡੇ ਦਾਅਵੇ",
    taxableIncome: "ਜਿਸ 'ਤੇ ਟੈਕਸ ਅਸਲ ਵਿੱਚ ਲੱਗਦਾ ਹੈ",
    slabTax: "ਕਿਸੇ ਰਾਹਤ ਤੋਂ ਪਹਿਲਾਂ ਦਾ ਟੈਕਸ",
    rebate87A: "ਛੋਟ ਜੋ ਇਸਦਾ ਕੁਝ ਹਿੱਸਾ ਰੱਦ ਕਰਦੀ ਹੈ",
    cess: "ਸਿਹਤ ਤੇ ਸਿੱਖਿਆ ਵਾਧਾ",
    totalTax: "ਸਾਲ ਦਾ ਕੁੱਲ ਟੈਕਸ",
    tdsCredits: "ਪਹਿਲਾਂ ਹੀ ਤੁਹਾਡੇ ਤੋਂ ਕੱਟਿਆ ਗਿਆ",
    refundDue: "ਤੁਹਾਨੂੰ ਵਾਪਸ ਮਿਲੇਗਾ",
    balanceDue: "ਦੇਣਾ ਬਾਕੀ",
    openLine: "ਵੇਖੋ ਇਹ ਕਿੱਥੋਂ ਆਇਆ",
    closeLine: "ਲੁਕਾਓ",
    calculationStatus:
      "ਇਹ ਪ੍ਰੋਟੋਟਾਈਪ ਦਾ ਹਿਸਾਬ ਹੈ — ਨਿਯਮਾਂ ਦੇ ਸਰੋਤਾਂ ਦੀ ਹਾਲੇ ਮੁੱਢਲੇ ਸਰੋਤ ਤੋਂ ਜਾਂਚ ਬਾਕੀ ਹੈ (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} ਹੇਠਾਂ ਦਿੱਤੇ ਪੱਕੇ ਕੀਤੇ ਤੱਥਾਂ ਤੇ ਟੈਕਸ ਕ੍ਰੈਡਿਟਾਂ ਤੋਂ ਨਿਕਲਿਆ ਹੈ। ਇਸ ਪ੍ਰੋਟੋਟਾਈਪ ਵਿੱਚ ਸਰੋਤ ਰਿਕਾਰਡ ਬਣਾਏ ਹੋਏ ਹਨ।`,
    showCalculationTrail: "ਸਰੋਤ ਤੇ ਹਿਸਾਬ ਦੀ ਕੜੀ ਵੇਖੋ",
    hideCalculationTrail: "ਸਰੋਤ ਤੇ ਹਿਸਾਬ ਦੀ ਕੜੀ ਲੁਕਾਓ",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} ਨੂੰ ਦਰਜ ਹੋਇਆ`,
    sourceIdentifier: (identifier: string) => `ਰਿਕਾਰਡ ${identifier}`,
    selfReportedSource: "ਇਸ ਰਿਟਰਨ ਵਿੱਚ ਤੁਹਾਡੇ ਵੱਲੋਂ ਦੱਸਿਆ ਗਿਆ",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: ਰਿਪੋਰਟ ਕਰਨ ਵਾਲੀਆਂ ਸੰਸਥਾਵਾਂ ਤੋਂ ਮਿਲੀ ਜਾਣਕਾਰੀ ਦਾ ਸਾਲਾਨਾ ਵੇਰਵਾ।"
        : statement === "26AS"
        ? "Form 26AS: ਤੁਹਾਡੇ PAN 'ਤੇ ਦਰਜ ਟੈਕਸ ਕ੍ਰੈਡਿਟ ਦਾ ਵੇਰਵਾ।"
        : "ਇਸ ਤੱਥ ਨਾਲ ਜੁੜਿਆ ਸਰੋਤ ਰਿਕਾਰਡ।",
    sectionMeaning: (section: string) =>
      `${section} ਕਟੌਤੀ ਦਾ ਇੱਕ ਸੈਕਸ਼ਨ ਹੈ। ਇਹ ਤਦੇ ਗਿਣਿਆ ਜਾਂਦਾ ਹੈ ਜਦੋਂ ਇਹ ਰਿਜੀਮ ਇਸਦੀ ਇਜਾਜ਼ਤ ਦੇਵੇ।`,
    explainGross: "ਤੁਹਾਡੇ ਵੱਲੋਂ ਜਾਂਚੇ ਤੇ ਪੱਕੇ ਕੀਤੇ ਤੱਥਾਂ ਨੂੰ ਜੋੜ ਕੇ।",
    explainStd: (amount: string) =>
      `ਤਨਖ਼ਾਹ ਵਾਲੇ ਹਰ ਬੰਦੇ ਨੂੰ ${amount} ਬਿਨਾਂ ਮੰਗਿਆਂ ਹੀ ਘਟ ਜਾਂਦੇ ਹਨ।`,
    explainDeductions: "ਸਿਰਫ਼ ਉਹੀ ਦਾਅਵੇ ਗਿਣੇ ਜਾਂਦੇ ਹਨ ਜੋ ਇਸ ਰਿਜੀਮ ਵਿੱਚ ਮੰਨੇ ਜਾਂਦੇ ਹਨ।",
    explainDisallowed: (section: string) =>
      `${section} ਇਸ ਰਿਜੀਮ ਵਿੱਚ ਮੰਨਿਆ ਨਹੀਂ ਜਾਂਦਾ, ਇਸ ਲਈ ਇੱਥੇ ਇਸਦਾ ਕੋਈ ਅਸਰ ਨਹੀਂ।`,
    explainTaxable: "ਜੋ ਆਇਆ, ਉਸ ਵਿੱਚੋਂ ਸਟੈਂਡਰਡ ਕਟੌਤੀ ਤੇ ਤੁਹਾਡੇ ਦਾਅਵੇ ਘਟਾ ਕੇ।",
    explainSlab: "ਟੈਕਸ ਪਰਤਾਂ ਵਿੱਚ ਲੱਗਦਾ ਹੈ — ਆਮਦਨ ਦੀ ਹਰ ਪਰਤ 'ਤੇ ਆਪਣੀ ਦਰ।",
    explainRebate: (amount: string) =>
      `ਇੱਕ ਹੱਦ ਤੋਂ ਹੇਠਾਂ ਬਹੁਤਾ ਟੈਕਸ ਰੱਦ ਹੋ ਜਾਂਦਾ ਹੈ — ਇੱਥੇ ${amount}।`,
    explainCess: "ਹਰ ਰਾਹਤ ਤੋਂ ਬਾਅਦ ਉੱਪਰੋਂ ਲੱਗਣ ਵਾਲਾ ਛੋਟਾ ਫ਼ੀਸਦ।",
    explainTds:
      "TDS ਦਾ ਮਤਲਬ ਹੈ ਸਰੋਤ 'ਤੇ ਕੱਟਿਆ ਟੈਕਸ: ਜਿਸਨੇ ਪੈਸਾ ਦਿੱਤਾ, ਉਸਨੇ ਤੁਹਾਡੇ ਤੱਕ ਪਹੁੰਚਣ ਤੋਂ ਪਹਿਲਾਂ ਇਹ ਰੋਕ ਲਿਆ।",
    fromFacts: "ਇਨ੍ਹਾਂ ਤੱਥਾਂ ਤੋਂ:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "ਭੇਜਣ ਲਈ ਤਿਆਰ ਹੋ?",
    sub: "ਇੱਕ ਵਾਰ ਚਲਾ ਗਿਆ ਤਾਂ ਬਦਲਣ ਦਾ ਮਤਲਬ ਹੈ ਦੁਬਾਰਾ ਫਾਈਲ ਕਰਨਾ। ਇੱਕ ਵਾਰ ਹੋਰ ਵੇਖ ਲਓ, ਫਿਰ ਭੇਜੋ।",
    stepChecking: "ਹਿਸਾਬ ਜਾਂਚ ਰਹੇ ਹਾਂ…",
    stepSealing: "ਅੰਕੜੇ ਸੀਲ ਕਰ ਰਹੇ ਹਾਂ…",
    stepFiled: "ਦਾਖਲ ਹੋ ਗਿਆ।",
    ackHeading: "ਜਮ੍ਹਾਂ ਹੋ ਗਿਆ।",
    ackBody:
      "ਤੁਹਾਡਾ ਰਿਟਰਨ ਅੱਜ ਤੋਂ ਗਿਣਿਆ ਜਾਵੇਗਾ। ਇੱਕ ਕਦਮ ਬਾਕੀ ਹੈ: ਪੁੱਛੇ ਜਾਣ 'ਤੇ ਪੁਸ਼ਟੀ ਕਰਨੀ ਕਿ ਇਹ ਸੱਚਮੁੱਚ ਤੁਸੀਂ ਹੀ ਹੋ। ਓਦੋਂ ਤੱਕ ਇਹ ਭੇਜਿਆ ਹੋਇਆ ਨਹੀਂ ਗਿਣਿਆ ਜਾਂਦਾ।",
    ackNext:
      "ਉਸ ਤੋਂ ਬਾਅਦ ਟ੍ਰੈਕਰ ਠੀਕ-ਠੀਕ ਵਿਖਾਏਗਾ ਕਿ ਤੁਹਾਡਾ ਪੈਸਾ ਕਿੱਥੇ ਹੈ ਤੇ ਕੀ ਉਸਨੂੰ ਰੋਕ ਸਕਦਾ ਹੈ।",
    errorCause: "ਜਾਂਚ ਦਾ ਕਦਮ ਇਸ ਲਈ ਰੁਕਿਆ ਕਿਉਂਕਿ ਸੈਂਡਬਾਕਸ ਦਾ fault ਸਵਿੱਚ ਚਾਲੂ ਹੈ।",
    errorAction:
      "ਰਿਵਿਊਅਰ ਡ੍ਰਾਅਰ ਵਿੱਚ 'Trigger API Gateway Timeout' ਬੰਦ ਕਰੋ, ਫਿਰ ਦੁਬਾਰਾ ਭੇਜੋ। ਕੁਝ ਨਹੀਂ ਗੁਆਚਿਆ।",
    errorCauseNetwork: "ਤੁਹਾਡਾ ਰਿਟਰਨ ਸਰਵਰ ਤੱਕ ਨਹੀਂ ਪਹੁੰਚਿਆ।",
    errorActionNetwork:
      "ਕੁਝ ਵੀ ਦਾਖਲ ਨਹੀਂ ਹੋਇਆ ਤੇ ਕੁਝ ਵੀ ਗੁਆਚਿਆ ਨਹੀਂ। ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ, ਫਿਰ ਦੁਬਾਰਾ ਭੇਜੋ।",
    retry: "ਫਿਰ ਭੇਜਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
  },

  wizard: {
    identityNextHint: "ਅੱਗੇ ਵਧਣ ਲਈ ਆਪਣਾ ਪੂਰਾ ਨਾਂ ਤੇ 10 ਅੱਖਰਾਂ ਦਾ PAN ਦਰਜ ਕਰੋ।",
    employmentConfirmHint: "ਤੁਹਾਡੇ ਪਹਿਲੇ ਜਵਾਬ ਤੋਂ — ਜੇ ਬਦਲ ਗਿਆ ਹੋਵੇ ਤਾਂ ਹੋਰ ਚੋਣ ਚੁਣੋ।",
    tdsZeroWarning:
      "ਤਨਖ਼ਾਹ ਵਾਲੀ ਨੌਕਰੀ ਵਿੱਚ ਲਗਭਗ ਹਮੇਸ਼ਾ ਟੈਕਸ ਪਹਿਲਾਂ ਹੀ ਕੱਟਿਆ ਹੁੰਦਾ ਹੈ — ਇਹ ਤੁਹਾਡੇ ਫਾਰਮ 16 ਜਾਂ ਤਨਖ਼ਾਹ ਪਰਚੀ 'ਤੇ ਹੁੰਦਾ ਹੈ। ਇੱਥੇ 0 ਲਿਖਣ ਦਾ ਮਤਲਬ ਅਕਸਰ ਆਪਣਾ ਰਿਫੰਡ ਛੱਡ ਦੇਣਾ ਹੁੰਦਾ ਹੈ।",
  },

  timeline: {
    filed: "ਤੁਸੀਂ ਆਪਣਾ ਰਿਟਰਨ ਭੇਜ ਦਿੱਤਾ।",
    verified: "ਤੁਸੀਂ ਪੁਸ਼ਟੀ ਕੀਤੀ ਕਿ ਇਹ ਤੁਸੀਂ ਹੀ ਹੋ। ਰਿਟਰਨ ਇੱਥੋਂ ਗਿਣਿਆ ਜਾਵੇਗਾ।",
    in_queue: "ਉਸ ਹਫ਼ਤੇ ਦਾਖਲ ਹੋਏ ਬਾਕੀ ਸਭ ਨਾਲ ਕਤਾਰ ਵਿੱਚ।",
    under_review: "ਹੁਣ ਕੋਈ ਇਸਨੂੰ ਵੇਖ ਰਿਹਾ ਹੈ।",
    determined: "ਫ਼ੈਸਲਾ ਹੋ ਗਿਆ — ਇੰਨਾ ਵਾਪਸ ਆਵੇਗਾ।",
    sent_to_bank: "ਤੁਹਾਡੇ ਬੈਂਕ ਨੂੰ ਭੇਜ ਦਿੱਤਾ।",
    credited: "ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ।",
  },

  refund: {
    heading: (amount: string) => `${amount} ਤੁਹਾਡੇ ਵੱਲ ਆ ਰਹੇ ਹਨ`,
    filedDaysAgo: (days: number) => `ਤੁਸੀਂ ${days} ਦਿਨ ਪਹਿਲਾਂ ਭੇਜਿਆ ਸੀ`,

    holdsHeading: (n: number) =>
      n === 1 ? "ਇੱਕ ਚੀਜ਼ ਦੀ ਉਡੀਕ ਹੈ" : `${n} ਚੀਜ਼ਾਂ ਦੀ ਉਡੀਕ ਹੈ`,
    clearsInDays: (days: number) =>
      days === 1 ? "ਉਹ ਹੁੰਦੇ ਹੀ ਕਰੀਬ ਇੱਕ ਦਿਨ" : `ਉਹ ਹੁੰਦੇ ਹੀ ਕਰੀਬ ${days} ਦਿਨ`,

    cohortWindow: (from: number, to: number) =>
      `ਤੁਹਾਡੇ ਹੀ ਹਫ਼ਤੇ ਵਿੱਚ ਭੇਜੇ ਗਏ ਰਿਟਰਨ ਹੁਣ ਵੇਖੇ ਜਾ ਰਹੇ ਹਨ। ${from} ਤੋਂ ${to} ਦਿਨ ਲੱਗ ਸਕਦੇ ਹਨ।`,

    states: {
      not_filed: "ਹਾਲੇ ਭੇਜਿਆ ਨਹੀਂ",
      filed_unverified: "ਭੇਜ ਦਿੱਤਾ, ਤੁਹਾਡੀ ਪੁਸ਼ਟੀ ਬਾਕੀ ਹੈ",
      verified: "ਤੁਸੀਂ ਪੁਸ਼ਟੀ ਕਰ ਦਿੱਤੀ",
      in_queue: "ਕਤਾਰ ਵਿੱਚ",
      under_review: "ਕੋਈ ਇਸਨੂੰ ਵੇਖ ਰਿਹਾ ਹੈ",
      determined: "ਫ਼ੈਸਲਾ ਹੋ ਗਿਆ",
      sent_to_bank: "ਤੁਹਾਡੇ ਬੈਂਕ ਨੂੰ ਭੇਜ ਦਿੱਤਾ",
      credited: "ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਆ ਗਿਆ",
      failed: "ਤੁਹਾਡੇ ਖਾਤੇ ਤੱਕ ਨਹੀਂ ਪਹੁੰਚ ਸਕਿਆ",
    },

    bankFailedHeading: "ਤੁਸੀਂ ਜੋ ਖਾਤਾ ਚੁਣਿਆ ਹੈ, ਉਸ ਵਿੱਚ ਪੈਸਾ ਨਹੀਂ ਜਾ ਸਕਦਾ।",
    bankMergedInto: (bank: string) => `ਉਹ ਸ਼ਾਖਾ ਹੁਣ ${bank} ਦਾ ਹਿੱਸਾ ਹੈ`,
    useThisAccount: "ਇਸਦੀ ਥਾਂ ਇੱਥੇ ਭੇਜੋ",
    resolvedHold: "ਨਿੱਬੜ ਗਿਆ — ਹੁਣ ਕੁਝ ਨਹੀਂ ਰੋਕਦਾ।",
    stampFiled: "ਦਾਖਲ",
  },

  notices: {
    heading: "ਵਿਭਾਗ ਤੋਂ ਆਈਆਂ ਚਿੱਠੀਆਂ",
    none: "ਕੁਝ ਵਾਪਸ ਨਹੀਂ ਆਇਆ। ਇਹੀ ਚੰਗੀ ਗੱਲ ਹੈ।",
    respondBy: (date: string) => `${date} ਤੱਕ ਜਵਾਬ ਦਿਓ`,
    ifYouDoNothing: "ਜੇ ਤੁਸੀਂ ਕੁਝ ਨਹੀਂ ਕਰਦੇ",
    basedOn: "ਇਹ ਕਿਸ ਆਧਾਰ 'ਤੇ ਹੈ",
    theCatch: "ਉਨ੍ਹਾਂ ਤੋਂ ਕੀ ਗ਼ਲਤ ਹੋਇਆ ਹੈ",
    agree: "ਇਹ ਸਹੀ ਹੈ",
    disagree: "ਇਹ ਗ਼ਲਤ ਹੈ",
    dinLabel: "ਇਸ ਚਿੱਠੀ ਦਾ ਹਵਾਲਾ ਨੰਬਰ",
    dinExplain:
      "ਵਿਭਾਗ ਦੀ ਹਰ ਚਿੱਠੀ 'ਤੇ ਇਹ ਨੰਬਰ ਹੋਣਾ ਜ਼ਰੂਰੀ ਹੈ। ਇਸ ਤੋਂ ਬਿਨਾਂ ਚਿੱਠੀ ਦੀ ਅਧਿਕਾਰਤ ਤੌਰ 'ਤੇ ਕੋਈ ਹੋਂਦ ਨਹੀਂ।",
  },

  dashboard: {
    serverFilings: "ਸਰਵਰ 'ਤੇ ਦਰਜ",
    serverFilingsEmpty:
      "ਲਾਈਵ ਸਰਵਰ 'ਤੇ ਇਸ PAN ਦੀ ਕੋਈ ਦਾਖਲ ਰਿਟਰਨ ਨਹੀਂ — ਉੱਪਰ ਵਾਲੀ ਰਸੀਦ ਬਣਾਈ ਹੋਈ ਕਹਾਣੀ ਦਾ ਹਿੱਸਾ ਹੈ। ਇਸ ਐਪ ਤੋਂ ਦਾਖਲ ਕਰੋ ਤਾਂ ਅਸਲੀ ਰਸੀਦ ਇੱਥੇ ਆਵੇਗੀ।",
    greetingLabel: "ਤੁਹਾਡਾ ਸਾਈਨ-ਇਨ ਵਾਕ",
    greetingWhy:
      "ਇਹ ਵਾਕ ਤੁਸੀਂ ਖਾਤਾ ਬਣਾਉਣ ਵੇਲੇ ਚੁਣਿਆ ਸੀ। ਜੋ ਸਫ਼ਾ ਇਸਨੂੰ ਨਾ ਵਿਖਾ ਸਕੇ, ਉਹ ਅਸੀਂ ਨਹੀਂ ਹਾਂ।",
    userDashboard: "ਯੂਜ਼ਰ ਡੈਸ਼ਬੋਰਡ",
    taxPrefills: "ਟੈਕਸ ਜਾਣਕਾਰੀ (AIS/26AS)",
    pendingActions: "ਬਾਕੀ ਕਾਰਵਾਈਆਂ",
    returnSummary: "ਰਿਟਰਨ ਸਾਰ AY 2026-27",
    reviewPrefill:
      "ਟੈਕਸ ਜਾਣਕਾਰੀ ਟੈਬ ਵਿੱਚ ਪਹਿਲਾਂ ਤੋਂ ਭਰੇ ਵੇਰਵੇ ਜਾਂਚੋ, ਫਿਰ ਫਾਈਲ ਕਰਨ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
    filingSubmitted:
      "ਤੁਹਾਡਾ ਈ-ਫਾਈਲਿੰਗ ਰਿਟਰਨ ਜਮ੍ਹਾਂ ਹੋ ਗਿਆ ਹੈ। ਟਾਈਮਲਾਈਨ 'ਤੇ ਪ੍ਰਗਤੀ ਵੇਖੋ।",
    verifiedBanks: "ਰਿਫੰਡ ਲਈ ਤਸਦੀਕ ਹੋਏ ਬੈਂਕ ਖਾਤੇ",
    primaryRefundAccount: "ਮੁੱਖ ਰਿਫੰਡ ਖਾਤਾ",
    backupAccount: "ਬੈਕਅੱਪ ਖਾਤਾ",
    ifscMeaning: "IFSC ਰਿਫੰਡ ਭੇਜਣ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ 11 ਅੱਖਰਾਂ ਦਾ ਬੈਂਕ ਰੂਟਿੰਗ ਕੋਡ ਹੈ।",
    refundTimeline: "ਰਿਫੰਡ ਦੀ ਟਾਈਮਲਾਈਨ",
    filingSubmittedTimeline: "ਰਿਟਰਨ ਜਮ੍ਹਾਂ ਹੋਇਆ",
    identityVerifiedTimeline: "ਪਛਾਣ ਤਸਦੀਕ ਹੋਈ",
    assessmentProcessingTimeline: "ਮੁਲਾਂਕਣ ਜਾਰੀ",
    refundApprovedTimeline: "ਰਿਫੰਡ ਮਨਜ਼ੂਰ",
    refundCreditedTimeline: "ਰਿਫੰਡ ਜਮ੍ਹਾਂ ਹੋ ਗਿਆ",
    holdActive: "ਰੁਕਾਵਟ ਚਾਲੂ: ਐਕਸ਼ਨ ਟੈਬ ਵਿੱਚ ਕਾਰਵਾਈ ਪੂਰੀ ਕਰੋ",
    successCheckApp: "ਹੋ ਗਿਆ! ਆਪਣੀ ਬੈਂਕਿੰਗ ਐਪ ਵੇਖੋ।",
    outstandingNotices: "ਬਕਾਇਆ ਪਾਲਣਾ ਨੋਟਿਸ",
    noPendingActions: "ਕੋਈ ਕਾਰਵਾਈ ਬਾਕੀ ਨਹੀਂ",
    accountCompliant:
      "ਤੁਹਾਡਾ ਖਾਤਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਠੀਕ ਹੈ — ਕੋਈ ਬਕਾਇਆ ਨੋਟਿਸ ਜਾਂ ਟੈਕਸ ਮੰਗ ਨਹੀਂ।",
    actionableHolds: "ਕਾਰਵਾਈ ਮੰਗਦੀਆਂ ਮੁਲਾਂਕਣ ਰੁਕਾਵਟਾਂ",
    uploadRent: "ਕਿਰਾਇਆ ਇਕਰਾਰਨਾਮਾ / ਰਸੀਦਾਂ ਅੱਪਲੋਡ ਕਰੋ",
    landlordName: "ਮਕਾਨ ਮਾਲਕ ਦਾ ਨਾਂ",
    landlordPan: "ਮਕਾਨ ਮਾਲਕ ਦਾ PAN (10 ਅੰਕ)",
    selectPdfJpg: "PDF/JPG ਚੁਣੋ",
    submitReceipt: "ਰਸੀਦ ਜਮ੍ਹਾਂ ਕਰੋ",
    responsePosition: "ਜਵਾਬ ਦੀ ਸਥਿਤੀ",
    agreeDept: "ਮੈਂ ਵਿਭਾਗ ਨਾਲ ਸਹਿਮਤ ਹਾਂ",
    disagreeProof: "ਮੈਂ ਅਸਹਿਮਤ ਹਾਂ (ਸਬੂਤ ਜਮ੍ਹਾਂ ਕਰੋ)",
    responseDraft: "ਜਵਾਬ ਦਾ ਬਿਆਨ (ਡਰਾਫਟ)",
    dictateStatement: "ਬੋਲ ਕੇ ਦਰਜ ਕਰੋ",
    sendResponse: "ਜਵਾਬ ਭੇਜੋ",
    filingStatusLabel: "ਫਾਈਲਿੰਗ ਸਥਿਤੀ",
    bankValidated: "ਤਸਦੀਕ ਹੋਇਆ",
    bankUnderProcess: "ਜਾਂਚ ਜਾਰੀ ਹੈ",
    bankFailed: "ਅਸਫਲ",
    staleIfscHold: "ਇਹ ਬੈਂਕ ਕੋਡ ਹੁਣ ਕਿਤੇ ਨਹੀਂ ਜਾਂਦਾ।",
    switchToNewIfsc: (ifsc: string) => `ਨਵੇਂ ਕੋਡ 'ਤੇ ਬਦਲੋ (${ifsc})`,
    personalized: {
      eyebrow: "ਤੁਹਾਡਾ ਡੈਸ਼ਬੋਰਡ",
      headingFiled: "ਤੁਹਾਡਾ ਰਿਟਰਨ ਜਮ੍ਹਾਂ ਹੋ ਚੁੱਕਾ ਹੈ — ਇਹ ਰਹੀ ਉਸਦੀ ਸਥਿਤੀ",
      heading: {
        file_return: "ਆਓ ਤੁਹਾਡਾ ਰਿਟਰਨ ਤਿਆਰ ਕਰੀਏ",
        check_refund: "ਆਓ ਵੇਖੀਏ ਕੀ ਪੈਸਾ ਵਾਪਸ ਆ ਸਕਦਾ ਹੈ",
        understand_notice: "ਆਓ ਜ਼ਰੂਰੀ ਕੰਮ ਸੰਭਾਲੀਏ",
        correct_prefill: "ਆਓ ਦੱਸੀ ਗਈ ਜਾਣਕਾਰੀ ਜਾਂਚੀਏ",
      },
      guidedBody: "ਹਰ ਅੰਕੜੇ ਦੀ ਪੁਸ਼ਟੀ ਤੋਂ ਪਹਿਲਾਂ ਅਸੀਂ ਉਸਦਾ ਮਤਲਬ ਸਮਝਾਵਾਂਗੇ।",
      quickBody: "ਰਾਹ ਛੋਟਾ ਰਹੇਗਾ ਤੇ ਅਗਲਾ ਜ਼ਰੂਰੀ ਫ਼ੈਸਲਾ ਪਹਿਲਾਂ ਦਿਸੇਗਾ।",
      unfiledBody: "ਪਹਿਲਾਂ, ਤੁਹਾਡੇ ਬਾਰੇ ਪਹਿਲਾਂ ਤੋਂ ਦਰਜ ਜਾਣਕਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
      filedBody: "ਤੁਹਾਡੇ ਆਉਣ ਦੇ ਮਕਸਦ ਮੁਤਾਬਕ ਅਸੀਂ ਸਹੀ ਹਿੱਸਾ ਪਹਿਲਾਂ ਖੋਲ੍ਹਿਆ ਹੈ।",
      primaryAction: {
        facts: "ਮੇਰੀ ਦਰਜ ਜਾਣਕਾਰੀ ਵੇਖੋ",
        overview: "ਮੇਰਾ ਰਿਫੰਡ ਟ੍ਰੈਕਰ ਵਿਖਾਓ",
        statement: "ਦਰਜ ਜਾਣਕਾਰੀ ਜਾਂਚੋ",
        actions: "ਵਿਖਾਓ ਕਿਸ ਵੱਲ ਧਿਆਨ ਚਾਹੀਦਾ ਹੈ",
      },
      focusLabel: "ਅਸੀਂ ਇਨ੍ਹਾਂ 'ਤੇ ਨਜ਼ਰ ਰੱਖਾਂਗੇ",
      profileLabels: {
        work: "ਕੰਮ",
        income: "ਕੁੱਲ ਅੰਦਾਜ਼ਨ ਆਮਦਨ",
        history: "ਫਾਈਲਿੰਗ ਦਾ ਤਜਰਬਾ",
      },
    },
  },

  onboarding: {
    eyebrow: "ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ",
    title: "ਆਓ ਇਸਨੂੰ ਤੁਹਾਡੇ ਲਈ ਤਿਆਰ ਕਰੀਏ।",
    intro:
      "ਪੰਜ ਛੋਟੇ ਜਵਾਬ ਸਾਨੂੰ ਸਹੀ ਭਾਸ਼ਾ, ਰਫ਼ਤਾਰ ਤੇ ਟੈਕਸ ਦੇ ਸਵਾਲ ਚੁਣਨ ਵਿੱਚ ਮਦਦ ਕਰਨਗੇ। ਤੁਸੀਂ ਇਨ੍ਹਾਂ ਨੂੰ ਬਾਅਦ ਵਿੱਚ ਬਦਲ ਸਕਦੇ ਹੋ।",
    languageQuestion: "ਅਸੀਂ ਕਿਹੜੀ ਭਾਸ਼ਾ ਵਿੱਚ ਗੱਲ ਕਰੀਏ?",
    languageHelp: "ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਇਹੀ ਸਵਾਲ ਹੈ। ਭਾਸ਼ਾ ਤੁਸੀਂ ਕਦੇ ਵੀ ਬਦਲ ਸਕਦੇ ਹੋ।",
    intentQuestion: "ਅੱਜ ਤੁਸੀਂ ਇੱਥੇ ਕਿਉਂ ਆਏ ਹੋ?",
    intentHelp: "ਅਸੀਂ ਉਸੇ ਕੰਮ ਨੂੰ ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਰੱਖਾਂਗੇ।",
    intentOptions: {
      file_return: {
        label: "ਇਸ ਸਾਲ ਦਾ ਰਿਟਰਨ ਫਾਈਲ ਕਰਨਾ ਹੈ",
        detail: "ਤੁਹਾਡੇ ਬਾਰੇ ਜੋ ਪਹਿਲਾਂ ਹੀ ਪਤਾ ਹੈ, ਉੱਥੋਂ ਸ਼ੁਰੂ ਕਰਾਂਗੇ।",
      },
      check_refund: {
        label: "ਵੇਖਣਾ ਹੈ ਕਿ ਪੈਸਾ ਵਾਪਸ ਮਿਲਣਾ ਹੈ ਜਾਂ ਨਹੀਂ",
        detail: "ਕੀ ਦੱਸਿਆ ਗਿਆ, ਕਿੰਨਾ ਟੈਕਸ ਕੱਟਿਆ ਤੇ ਕੀ ਵਾਪਸ ਆ ਸਕਦਾ ਹੈ, ਇਹ ਵੇਖੋ।",
      },
      understand_notice: {
        label: "ਚਿੱਠੀ ਜਾਂ ਨੋਟਿਸ ਸਮਝਣਾ ਹੈ",
        detail: "ਇਸ ਵਿੱਚ ਕੀ ਲਿਖਿਆ ਹੈ, ਕਿੰਨਾ ਦਾਅ 'ਤੇ ਹੈ ਤੇ ਅੱਗੇ ਕੀ ਕਰਨਾ ਹੈ, ਇਹ ਵੇਖੋ।",
      },
      correct_prefill: {
        label: "ਗ਼ਲਤ ਲੱਗਦੀ ਗੱਲ ਠੀਕ ਕਰਨੀ ਹੈ",
        detail: "ਅੰਕੜੇ ਦਾ ਸਰੋਤ ਲੱਭੋ ਤੇ ਦਰਜ ਕਰੋ ਕਿ ਕੀ ਬਦਲਣਾ ਚਾਹੀਦਾ ਹੈ।",
      },
    },
    intentCta: {
      file_return: "ਮੇਰਾ ਰਿਟਰਨ ਸ਼ੁਰੂ ਕਰੋ",
      check_refund: "ਵੇਖੋ ਮੇਰਾ ਕੀ ਬਣਦਾ ਹੈ",
      understand_notice: "ਦੱਸੋ ਮੈਂ ਕੀ ਕਰਨਾ ਹੈ",
      correct_prefill: "ਜੋ ਦੱਸਿਆ ਗਿਆ ਹੈ ਉਸਨੂੰ ਜਾਂਚੋ",
    },
    situationQuestion: "ਆਪਣੀ ਟੈਕਸ ਦੀ ਹਾਲਤ ਬਾਰੇ ਦੱਸੋ।",
    situationHelp: "ਇੱਥੇ ਦੋ ਛੋਟੇ ਜਵਾਬ ਕਾਫ਼ੀ ਹਨ।",
    professionLabel: "ਤੁਹਾਡੇ ਕੰਮ ਨੂੰ ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਹੜਾ ਸਭ ਤੋਂ ਠੀਕ ਦੱਸਦਾ ਹੈ?",
    professionOptions: {
      salaried: "ਨੌਕਰੀ",
      self_employed: "ਫ੍ਰੀਲਾਂਸ ਜਾਂ ਆਪਣਾ ਕੰਮ",
      business_owner: "ਕਾਰੋਬਾਰੀ",
      student: "ਵਿਦਿਆਰਥੀ",
      retired: "ਰਿਟਾਇਰਡ",
      investor: "ਨਿਵੇਸ਼ਕ",
      other: "ਕੁਝ ਹੋਰ",
    },
    filingHistoryLabel: "ਕੀ ਤੁਸੀਂ ਪਹਿਲਾਂ ਇਨਕਮ ਟੈਕਸ ਰਿਟਰਨ ਫਾਈਲ ਕੀਤਾ ਹੈ?",
    filingHistoryOptions: {
      never: "ਨਹੀਂ, ਪਹਿਲੀ ਵਾਰ",
      once: "ਇੱਕ ਜਾਂ ਦੋ ਵਾਰ",
      every_year: "ਹਰ ਸਾਲ",
    },
    incomeQuestion: "ਸਾਰੇ ਸਰੋਤਾਂ ਤੋਂ ਤੁਹਾਡੀ ਕੁੱਲ ਕਮਾਈ ਲਗਭਗ ਕਿੰਨੀ ਸੀ?",
    incomeHelp: "ਹੁਣ ਲਈ ਸਿਰਫ਼ ਇੱਕ ਦਾਇਰਾ ਕਾਫ਼ੀ ਹੈ। ਸਹੀ ਰਕਮ ਦੀ ਹਾਲੇ ਲੋੜ ਨਹੀਂ।",
    incomeOptions: {
      none: "ਕੋਈ ਕਮਾਈ ਨਹੀਂ",
      under_4: "₹4 ਲੱਖ ਤੋਂ ਘੱਟ",
      "4_to_8": "₹4 ਤੋਂ ₹8 ਲੱਖ",
      "8_to_12": "₹8 ਤੋਂ ₹12 ਲੱਖ",
      "12_to_25": "₹12 ਤੋਂ ₹25 ਲੱਖ",
      over_25: "₹25 ਲੱਖ ਤੋਂ ਵੱਧ",
    },
    modeQuestion: "ਤੁਸੀਂ ਕਿੰਨਾ ਵੇਰਵਾ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
    modeHelp: "ਇਹ ਸਿਰਫ਼ ਸ਼ੁਰੂਆਤ ਤੈਅ ਕਰਦਾ ਹੈ। ਤੁਸੀਂ ਕਦੇ ਵੀ ਬਦਲ ਸਕਦੇ ਹੋ।",
    modeOptions: {
      simple: {
        label: "ਮੇਰੇ ਲਈ ਕਰ ਦਿਓ",
        detail: "ਸੌਖੀ ਭਾਸ਼ਾ, ਇੱਕ ਵੇਲੇ ਇੱਕ ਕਦਮ। ਬਾਕੀ ਅਸੀਂ ਸੰਭਾਲਾਂਗੇ।",
      },
      full: {
        label: "ਮੈਨੂੰ ਸਭ ਕੁਝ ਵਿਖਾਓ",
        detail: "ਹਰ ਅੰਕੜਾ, ਹਰ ਨਿਯਮ, ਹਰ ਹਿਸਾਬ — ਸ਼ੁਰੂ ਤੋਂ ਹੀ।",
      },
    },
    focusQuestion: "ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕਿਨ੍ਹਾਂ ਗੱਲਾਂ ਵੱਲ ਧਿਆਨ ਦੇਈਏ?",
    focusHelp: "ਜੋ ਤੁਹਾਡੇ 'ਤੇ ਢੁਕਦਾ ਹੋਵੇ, ਸਭ ਚੁਣੋ। ਪੱਕਾ ਨਾ ਹੋਵੇ ਤਾਂ ਪਤਾ ਨਹੀਂ ਚੁਣ ਲਓ।",
    focusOptions: {
      salary: "ਤਨਖ਼ਾਹ ਜਾਂ ਪੈਨਸ਼ਨ",
      freelance: "ਫ੍ਰੀਲਾਂਸ ਕੰਮ",
      business: "ਕਾਰੋਬਾਰ ਦੀ ਕਮਾਈ",
      rent: "ਦਿੱਤਾ ਜਾਂ ਮਿਲਿਆ ਕਿਰਾਇਆ",
      interest: "ਬੈਂਕ ਦਾ ਵਿਆਜ",
      investments: "ਸ਼ੇਅਰ ਜਾਂ ਨਿਵੇਸ਼",
      deductions: "ਬੱਚਤ, ਬੀਮਾ, ਹੋਮ ਲੋਨ ਜਾਂ NPS",
      not_sure: "ਹਾਲੇ ਪੱਕਾ ਪਤਾ ਨਹੀਂ",
    },
    chooseOne: "ਇੱਕ ਚੁਣੋ",
    chooseAtLeastOne: "ਘੱਟੋ-ਘੱਟ ਇੱਕ ਚੁਣੋ",
    questionsLabel: "ਛੋਟੀ ਤਿਆਰੀ",
    questionsProgress: (current: number, total: number) => `${total} ਵਿੱਚੋਂ ${current}`,
    savedLocally: "ਇਸ ਪ੍ਰੋਟੋਟਾਈਪ ਵਿੱਚ ਤੁਹਾਡੇ ਜਵਾਬ ਇਸੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਸੰਭਾਲੇ ਜਾਂਦੇ ਹਨ।",
    readyTitle: "ਇੰਨਾ ਇਸਨੂੰ ਤੁਹਾਡੇ ਮੁਤਾਬਕ ਬਣਾਉਣ ਲਈ ਕਾਫ਼ੀ ਹੈ।",
    readyBody:
      "ਇਨ੍ਹਾਂ ਜਵਾਬਾਂ ਨਾਲ ਅਸੀਂ ਤੈਅ ਕਰਾਂਗੇ ਕਿ ਤੁਹਾਨੂੰ ਪਹਿਲਾਂ ਕੀ ਵਿਖਾਉਣਾ ਹੈ। ਰਿਜੀਮ ਦੀ ਆਖ਼ਰੀ ਚੋਣ ਹਾਲੇ ਵੀ ਤੁਹਾਡੇ ਪੱਕੇ ਕੀਤੇ ਤੱਥਾਂ ਤੇ ਦਾਅਵਿਆਂ 'ਤੇ ਹੋਵੇਗੀ।",
    guidedLabel: "ਅਸੀਂ ਕਿਵੇਂ ਸਮਝਾਵਾਂਗੇ",
    guidedValue: "ਅਸੀਂ ਚੱਲਦੇ-ਚੱਲਦੇ ਸ਼ਬਦ ਸਮਝਾਵਾਂਗੇ।",
    quickValue: "ਅਸੀਂ ਰਾਹ ਛੋਟਾ ਰੱਖਾਂਗੇ।",
    regimeLabel: "ਰਿਜੀਮ ਨਾਲ ਸਾਡਾ ਤਰੀਕਾ",
    claimsRegimeValue: "ਰਿਜੀਮ ਚੁਣਨ ਤੋਂ ਪਹਿਲਾਂ ਅਸੀਂ ਤੁਹਾਡੇ ਦਾਅਵੇ ਜਾਂਚਾਂਗੇ।",
    compareRegimeValue: "ਤੱਥ ਪੱਕੇ ਹੋਣ ਤੋਂ ਬਾਅਦ ਦੋਵੇਂ ਰਿਜੀਮਾਂ ਦੀ ਤੁਲਨਾ ਕਰਾਂਗੇ।",
    focusLabel: "ਪਹਿਲਾਂ ਕਿਸ 'ਤੇ ਧਿਆਨ ਹੋਵੇਗਾ",
    startPath: "ਮੇਰੇ ਰਾਹ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ",
    changeAnswers: "ਜਵਾਬ ਬਦਲੋ",
    tailoredBadge: "ਤੁਹਾਡਾ ਸ਼ੁਰੂਆਤੀ ਰਾਹ",
    tailoredGuided: "ਸਮਝਾ ਕੇ ਅੱਗੇ ਵਧਾਂਗੇ",
    tailoredQuick: "ਛੋਟਾ ਰਾਹ",
    tailoredRegimeClaims: "ਰਿਜੀਮ ਦੀ ਚੋਣ ਤੋਂ ਪਹਿਲਾਂ ਦਾਅਵਿਆਂ ਦੀ ਜਾਂਚ",
    tailoredRegimeCompare: "ਤੱਥਾਂ ਤੋਂ ਬਾਅਦ ਦੋਵੇਂ ਰਿਜੀਮਾਂ ਦੀ ਤੁਲਨਾ",
    tailoredIntent: (intent: string) => `ਪਹਿਲਾਂ: ${intent}`,
  },

  checklist: {
    divider: "ਦਾਖਲ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ",
    itemBefore: "“",
    itemAfter: "” ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ — ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ ਕਾਰਡ ਖੋਲ੍ਹੋ।",
    stdRow: "ਅਸੀਂ ਤੁਹਾਡੇ ਲਈ ਜੋ ਸਟੈਂਡਰਡ ਕਟੌਤੀ ਲਾਗੂ ਕੀਤੀ, ਉਸਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",
    noteLocked: "ਉੱਪਰ ਦੀ ਹਰ ਲਾਈਨ 'ਤੇ ਟਿੱਕ ਕਰੋ, ਤਦੇ ਇਹ ਬਟਨ ਖੁੱਲ੍ਹੇਗਾ।",
    noteReady: "ਉੱਪਰ ਸਭ ਕੁਝ ਪੱਕਾ ਹੈ। ਤਿਆਰ ਹੋਵੋ ਤਾਂ ਦਾਖਲ ਕਰੋ।",
    fileBtn: "ਇਹ ਰਿਟਰਨ ਦਾਖਲ ਕਰੋ",
    lockedBtn: (n: number) =>
      n === 1 ? "ਪਹਿਲਾਂ 1 ਹੋਰ ਲਾਈਨ 'ਤੇ ਟਿੱਕ ਕਰੋ" : `ਪਹਿਲਾਂ ${n} ਹੋਰ ਲਾਈਨਾਂ 'ਤੇ ਟਿੱਕ ਕਰੋ`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `ਕਾਰਡ ${String(n).padStart(2, "0")} · ਦਰਜ ${date}`,
    whatThisMeans: "ਇਸਦਾ ਮਤਲਬ ਕੀ ਹੈ",
    readFirst: "ਪਹਿਲਾਂ “ਇਸਦਾ ਮਤਲਬ ਕੀ ਹੈ” ਖੋਲ੍ਹੋ — ਫਿਰ ਪੁਸ਼ਟੀ ਕਰੋ।",
    readyToConfirm: "ਪੜ੍ਹ ਲਿਆ? ਹੇਠਾਂ ਪੁਸ਼ਟੀ ਕਰੋ।",
  },

  signoff: {
    title: "ਦਸਤਖ਼ਤ ਪੁਸ਼ਟੀ",
    declaration:
      "ਮੈਂ ਉੱਪਰ ਦਿੱਤੇ ਅੰਕੜੇ ਪੜ੍ਹੇ ਹਨ ਤੇ ਸਰੋਤ ਦਸਤਾਵੇਜ਼ਾਂ ਨਾਲ ਮਿਲਾਏ ਹਨ। ਇਹ ਸਹੀ ਤੇ ਪੂਰੇ ਹਨ।",
    action: "ਇਨ੍ਹਾਂ ਅੰਕੜਿਆਂ 'ਤੇ ਦਸਤਖ਼ਤ ਕਰੋ",
    signed: "ਦਸਤਖ਼ਤ ਹੋ ਗਏ — ਉੱਪਰ ਦਾ ਹਰ ਅੰਕੜਾ ਪੱਕਾ ਹੈ।",
    hint: "ਇੱਕ ਐਲਾਨ ਉੱਪਰ ਦੇ ਸਾਰੇ ਅੰਕੜਿਆਂ 'ਤੇ ਲਾਗੂ ਹੁੰਦਾ ਹੈ। ਕਿਸੇ ਅੰਕੜੇ 'ਤੇ ਇਤਰਾਜ਼ ਹੋਵੇ ਤਾਂ ਪਹਿਲਾਂ “ਨਹੀਂ, ਇਹ ਗ਼ਲਤ ਹੈ” ਚੁਣੋ।",
  },

  channels: {
    sectionLabel: "ਸਾਲ ਇੱਕ ਨਜ਼ਰ ਵਿੱਚ",
    earned: "ਤੁਸੀਂ ਕਮਾਇਆ",
    toTax: "ਟੈਕਸ ਵਿੱਚ ਗਿਆ",
    overpaid: "ਤੁਸੀਂ ਵੱਧ ਦਿੱਤਾ",
    stillToPay: "ਹਾਲੇ ਦੇਣਾ ਹੈ",
    stayed: "ਤੁਹਾਡੇ ਕੋਲੋਂ ਕਦੇ ਗਿਆ ਹੀ ਨਹੀਂ",
    kept: "ਜੋ ਟੈਕਸ ਬਣਦਾ ਸੀ",
    back: "ਤੁਹਾਡੇ ਕੋਲ ਵਾਪਸ ਆ ਰਿਹਾ ਹੈ",
    yoursInEnd: "ਅਖ਼ੀਰ ਵਿੱਚ ਤੁਹਾਡਾ",
    collected: "ਪਹਿਲਾਂ ਹੀ ਕੱਟਿਆ ਜਾ ਚੁੱਕਾ",
    ofYear: "ਸਾਲ ਭਰ ਦੇ ਪੈਸੇ ਦਾ",
    sliceNote:
      "ਜੋ ਹਿੱਸਾ ਦਿਸਣ ਜੋਗਾ ਨਹੀਂ, ਉਸਨੂੰ ਥੋੜ੍ਹਾ ਚੌੜਾ ਬਣਾਇਆ ਗਿਆ ਹੈ — ਨਾਲ ਲਿਖੇ ਅੰਕੜੇ ਬਿਲਕੁਲ ਸਹੀ ਹਨ।",
    whereItWent: "ਤੁਹਾਡੀ ਕਮਾਈ ਦਾ ਹਰ ਰੁਪਈਆ ਕਿੱਥੇ ਗਿਆ",
    earnedDesc: "ਤਨਖ਼ਾਹ, ਵਿਆਜ ਤੇ ਬਾਕੀ ਸਭ — ਜਿਵੇਂ ਭੁਗਤਾਨ ਕਰਨ ਵਾਲਿਆਂ ਨੇ ਦਰਜ ਕੀਤਾ।",
    toTaxDesc: "ਹਰ ਹੱਕੀ ਕਟੌਤੀ ਤੋਂ ਬਾਅਦ ਤੁਹਾਡੇ 'ਤੇ ਅਸਲ ਵਿੱਚ ਜੋ ਟੈਕਸ ਬਣਿਆ।",
    backDesc:
      "ਤੁਹਾਡੀ ਤਨਖ਼ਾਹ ਵਿੱਚੋਂ ਲਿਆ ਗਿਆ ਪਰ ਕਦੇ ਬਣਦਾ ਨਹੀਂ ਸੀ। ਇਹ ਤੁਹਾਡੇ ਕੋਲ ਵਾਪਸ ਆਵੇਗਾ।",
    dueDesc: "ਜੋ ਕੱਟਿਆ ਜਾ ਚੁੱਕਾ, ਉਸ ਤੋਂ ਅੱਗੇ ਦਾ ਬਕਾਇਆ। ਇਹ ਹਾਲੇ ਦੇਣਾ ਹੈ।",
    howToRead:
      "ਇਸਨੂੰ ਇੰਝ ਪੜ੍ਹੋ: ਇੱਥੇ ਕੁਝ ਵੀ ਅਸੀਂ ਨਹੀਂ ਘੜਿਆ। ਹਰ ਅੰਕੜਾ ਕਿਸੇ ਦਾਖਲ ਦਸਤਾਵੇਜ਼ ਤੋਂ ਆਇਆ ਹੈ ਜਾਂ ਤੁਸੀਂ ਖ਼ੁਦ ਦਰਜ ਕੀਤਾ ਹੈ। ਪੈਨਸਿਲ ਨੋਟ ਸਮਝਾਉਂਦੇ ਹਨ ਕਿ ਹਰ ਅੰਕੜੇ ਦਾ ਅਸਲ ਮਤਲਬ ਕੀ ਹੈ — ਸਿੱਧੇ ਸ਼ਬਦਾਂ ਵਿੱਚ, ਟੈਕਸ ਦੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਨਹੀਂ।",
    meterCap: "ਜੋ ਟੈਕਸ ਬਣਿਆ ਬਨਾਮ ਜੋ ਪਹਿਲਾਂ ਹੀ ਕੱਟਿਆ ਗਿਆ",
  },

  agent: {
    title: "ਵਾਪਸੀ ਸਹਾਇਕ",
    open: "ਸਹਾਇਕ ਖੋਲ੍ਹੋ",
    close: "ਬੰਦ ਕਰੋ",
    placeholder: "ਜਾਂਚਣ, ਸਮਝਾਉਣ ਜਾਂ ਦਾਖਲ ਕਰਨ ਲਈ ਕਹੋ…",
    send: "ਭੇਜੋ",
    thinking: "ਕੰਮ ਚੱਲ ਰਿਹਾ ਹੈ…",
    toolRan: "ਕੀਤਾ:",
    confirmTitle: "ਦਾਖਲ ਕਰਨ ਲਈ ਤਿਆਰ — ਅੰਕੜੇ ਜਾਂਚੋ",
    confirmBody: "ਤੁਹਾਡੀ ਪੁਸ਼ਟੀ ਤੋਂ ਬਿਨਾਂ ਕੁਝ ਦਾਖਲ ਨਹੀਂ ਹੋਵੇਗਾ। ਇਹ ਜਮ੍ਹਾਂ ਹੋਵੇਗਾ:",
    confirmTotalTax: "ਕੁੱਲ ਟੈਕਸ",
    confirmRefund: "ਤੁਹਾਨੂੰ ਬਣਦਾ ਰਿਫੰਡ",
    confirmDue: "ਦੇਣਯੋਗ ਰਕਮ",
    confirmTaxable: "ਟੈਕਸ-ਯੋਗ ਆਮਦਨ",
    confirmButton: "ਪੁਸ਼ਟੀ ਕਰੋ ਤੇ ਦਾਖਲ ਕਰੋ",
    cancelButton: "ਰੱਦ ਕਰੋ",
    filingDismissed: "ਠੀਕ ਹੈ — ਕੁਝ ਦਾਖਲ ਨਹੀਂ ਹੋਇਆ।",
    error: "ਸਹਾਇਕ ਤੱਕ ਪਹੁੰਚ ਨਹੀਂ ਹੋ ਸਕੀ। ਤੁਹਾਡਾ ਰਿਟਰਨ ਜਿਵੇਂ ਦਾ ਤਿਵੇਂ ਹੈ — ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    intro:
      "ਮੈਂ ਤੁਹਾਡਾ ਰਿਟਰਨ ਜਾਂਚ ਸਕਦਾ ਹਾਂ, ਕੋਈ ਵੀ ਅੰਕੜਾ ਸਮਝਾ ਸਕਦਾ ਹਾਂ, ਜੇ-ਕਦੇ ਵਾਲੇ ਹਿਸਾਬ ਲਾ ਸਕਦਾ ਹਾਂ ਤੇ ਦਾਖਲੇ ਦੀ ਤਿਆਰੀ ਕਰ ਸਕਦਾ ਹਾਂ। ਦਾਖਲ ਹਮੇਸ਼ਾ ਤੁਹਾਡੀ ਪੁਸ਼ਟੀ ਤੋਂ ਬਾਅਦ ਹੀ ਹੁੰਦਾ ਹੈ।",
    sample: "80C ਵਿੱਚ ₹1,50,000 ਲਾਉਣ 'ਤੇ ਮੇਰੀ ਕਿੰਨੀ ਬੱਚਤ ਹੋਵੇਗੀ?",
  },

  footer: {
    prototype: "ਸੁਤੰਤਰ ਸੰਕਲਪ ਪ੍ਰੋਟੋਟਾਈਪ।",
    notAffiliated:
      "ਇਹ ਆਮਦਨ ਕਰ ਵਿਭਾਗ, CBDT ਜਾਂ ਭਾਰਤ ਸਰਕਾਰ ਨਾਲ ਜੁੜਿਆ, ਇਨ੍ਹਾਂ ਵੱਲੋਂ ਪ੍ਰਵਾਨਤ ਜਾਂ ਇਨ੍ਹਾਂ ਨਾਲ ਸੰਬੰਧਤ ਨਹੀਂ ਹੈ। ਇੱਥੇ ਦਿੱਤਾ ਹਰ ਨਾਂ, PAN, ਰਕਮ ਤੇ ਦਸਤਾਵੇਜ਼ ਬਣਾਇਆ ਹੋਇਆ ਹੈ। ਕਿਸੇ ਵੀ ਸਰਕਾਰੀ ਸਿਸਟਮ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਕੀਤਾ ਜਾਂਦਾ।",
    honestyLink: "ਵੇਖੋ ਕੀ ਅਸਲੀ ਹੈ ਤੇ ਕੀ ਬਣਾਇਆ ਹੋਇਆ",
  },
};

/**
 * Punjabi values for the mock-screen strings in
 * components/mock-i18n.ts (LOCALIZED_MOCK_STRINGS). Keys are the byte-exact
 * English strings. Model-generated; awaits native-speaker review (T0.5).
 */
export const paMock: Record<string, string> = {
  "Your pay last year": "ਪਿਛਲੇ ਸਾਲ ਤੁਹਾਡੀ ਤਨਖ਼ਾਹ",
  "Interest your savings account earned": "ਬੱਚਤ ਖਾਤੇ ਤੋਂ ਕਮਾਇਆ ਵਿਆਜ",
  "Interest your accounts earned": "ਤੁਹਾਡੇ ਖਾਤਿਆਂ ਤੋਂ ਕਮਾਇਆ ਵਿਆਜ",
  "Your primary contract income": "ਤੁਹਾਡੀ ਮੁੱਖ ਕੰਟਰੈਕਟ ਆਮਦਨ",
  "Savings interest": "ਬੱਚਤ ਖਾਤੇ ਦਾ ਵਿਆਜ",
  "Tax withheld (TDS)": "ਪਹਿਲਾਂ ਕੱਟਿਆ ਗਿਆ ਟੈਕਸ (TDS)",
  "Provident Fund / ELSS Mutual Funds": "ਪ੍ਰਾਵੀਡੈਂਟ ਫੰਡ / ELSS ਮਿਊਚੁਅਲ ਫੰਡ",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "ਉਸਦੀ ਤਨਖ਼ਾਹ ਵਿੱਚੋਂ ₹8,400 ਕੱਟੇ ਗਏ। ਉਸਨੇ ਕੁਝ ਦੇਣਾ ਨਹੀਂ। ਉਸਨੇ ਹਾਲੇ ਫਾਈਲ ਨਹੀਂ ਕੀਤਾ, ਤੇ ਸਕੂਲ ਦੀ ਫ਼ੀਸ ਦੇਣੀ ਹੈ।",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "ਦੋ ਨੋਟਿਸ ਹਨ। ਇੱਕ ਕਹਿੰਦਾ ਹੈ ਕਿ ਉਸਨੇ ₹1,10,000 ਦਾ ਸ਼ੇਅਰ ਮੁਨਾਫ਼ਾ ਲੁਕਾਇਆ — ਅਸਲ ਵਿੱਚ ਉਸਨੂੰ ₹4,200 ਦਾ ਘਾਟਾ ਪਿਆ। ਦੂਜਾ 2019 ਦੇ ਉਸ ਬਿੱਲ ਲਈ ਰਿਫੰਡ ਦਾ ਹਿੱਸਾ ਰੱਖਣਾ ਚਾਹੁੰਦਾ ਹੈ ਜਿਸ ਬਾਰੇ ਉਸਨੂੰ ਕਦੇ ਪਤਾ ਹੀ ਨਹੀਂ ਸੀ।",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 ਦਿਨ ਪਹਿਲਾਂ ਫਾਈਲ ਕੀਤਾ। ਪੋਰਟਲ 'ਤੇ 'ਕਾਰਵਾਈ ਜਾਰੀ' ਤੋਂ ਇਲਾਵਾ ਕੁਝ ਨਹੀਂ ਦਿਸਦਾ। ਅਸਲ ਵਿੱਚ ਦੋ ਵੱਖ-ਵੱਖ ਚੀਜ਼ਾਂ ਉਸਦੇ ₹34,800 ਰੋਕ ਰਹੀਆਂ ਹਨ।",
  "Tax already taken out of your pay": "ਤਨਖ਼ਾਹ ਵਿੱਚੋਂ ਪਹਿਲਾਂ ਹੀ ਕੱਟਿਆ ਟੈਕਸ (TDS)",
  "Dividend your shares paid out": "ਸ਼ੇਅਰਾਂ ਤੋਂ ਮਿਲਿਆ ਲਾਭਅੰਸ਼",
  "Money from selling shares": "ਸ਼ੇਅਰ ਵੇਚਣ ਤੋਂ ਮਿਲਿਆ ਪੈਸਾ",
  "Tax the bank withheld on your interest": "ਵਿਆਜ 'ਤੇ ਬੈਂਕ ਵੱਲੋਂ ਕੱਟਿਆ ਟੈਕਸ (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "ਪ੍ਰਾਵੀਡੈਂਟ ਫੰਡ (PF), ਬੀਮਾ ਤੇ ਧੀ ਦੀ ਟਿਊਸ਼ਨ ਫ਼ੀਸ",
  "Provident fund and your insurance premium":
    "ਪ੍ਰਾਵੀਡੈਂਟ ਫੰਡ (PF) ਤੇ ਤੁਹਾਡਾ ਬੀਮਾ ਪ੍ਰੀਮੀਅਮ",
  "Health cover for the family": "ਪਰਿਵਾਰ ਲਈ ਸਿਹਤ ਬੀਮਾ",
  "Rent you paid, with no house-rent allowance from your employer":
    "ਤੁਹਾਡਾ ਦਿੱਤਾ ਕਿਰਾਇਆ (ਮਾਲਕ ਤੋਂ ਮਕਾਨ-ਕਿਰਾਇਆ ਭੱਤੇ ਤੋਂ ਬਿਨਾਂ)",
  "One figure doesn't match what your broker reported.":
    "ਇੱਕ ਅੰਕੜਾ ਤੁਹਾਡੇ ਬ੍ਰੋਕਰ ਦੇ ਦਰਜ ਕੀਤੇ ਅੰਕੜੇ ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦਾ।",
  "₹18,740 of this is being held against an old bill.":
    "ਇਸ ਵਿੱਚੋਂ ₹18,740 ਇੱਕ ਪੁਰਾਣੇ ਬਿੱਲ ਬਦਲੇ ਰੋਕੇ ਜਾ ਰਹੇ ਹਨ।",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "ਵਿਭਾਗ ਸਮਝਦਾ ਹੈ ਕਿ ਤੁਸੀਂ ₹1,10,000 ਦਾ ਸ਼ੇਅਰ ਮੁਨਾਫ਼ਾ ਛੱਡ ਦਿੱਤਾ ਹੈ।",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "ਵਿਭਾਗ 2019 ਦੇ ਬਿੱਲ ਦੇ ਨਿਪਟਾਰੇ ਲਈ ਤੁਹਾਡੇ ਰਿਫੰਡ ਵਿੱਚੋਂ ₹18,740 ਰੱਖਣਾ ਚਾਹੁੰਦਾ ਹੈ।",
  "Waiting on one thing: a receipt for your rent claim.":
    "ਇੱਕ ਚੀਜ਼ ਦੀ ਉਡੀਕ ਹੈ: ਤੁਹਾਡੇ ਕਿਰਾਏ ਦੇ ਦਾਅਵੇ ਦੀ ਰਸੀਦ।",
  "The account you chose can't receive the money.":
    "ਤੁਹਾਡੇ ਚੁਣੇ ਖਾਤੇ ਵਿੱਚ ਪੈਸਾ ਨਹੀਂ ਜਾ ਸਕਦਾ।",
  "Held: your rent claim needs a receipt.":
    "ਰੋਕਿਆ ਗਿਆ: ਤੁਹਾਡੇ ਕਿਰਾਏ ਦੇ ਦਾਅਵੇ ਲਈ ਰਸੀਦ ਚਾਹੀਦੀ ਹੈ।",
  "Your bank account was checked and failed.":
    "ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਦੀ ਜਾਂਚ ਹੋਈ ਤੇ ਉਹ ਫੇਲ੍ਹ ਹੋ ਗਈ।",
  "The department is asking you to look again at your rent claim.":
    "ਵਿਭਾਗ ਤੁਹਾਨੂੰ ਆਪਣੇ ਕਿਰਾਏ ਦੇ ਦਾਅਵੇ ਨੂੰ ਦੁਬਾਰਾ ਵੇਖਣ ਲਈ ਕਹਿ ਰਿਹਾ ਹੈ।",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "Meridian Securities ਨੇ ਸ਼ੇਅਰ ਵਿਕਰੀ ਤੋਂ ₹1,10,000 ਦਰਜ ਕੀਤੇ। ਤੁਹਾਡਾ ਰਿਟਰਨ ਇਹ ਨਹੀਂ ਵਿਖਾਉਂਦਾ। ਜਦ ਤੱਕ ਇਹ ਨਿੱਬੜਦਾ ਨਹੀਂ, ਰਿਫੰਡ ਉੱਥੇ ਹੀ ਰਹੇਗਾ।",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20 ਦੀ ਇੱਕ ਮੰਗ ਇਸ ਸਾਲ ਦੇ ਰਿਫੰਡ ਨਾਲ ਸਮਾਯੋਜਿਤ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ। ਤੁਸੀਂ ਇਸਦਾ ਵਿਰੋਧ ਕਰ ਸਕਦੇ ਹੋ, ਤੇ 3 ਤਾਰੀਖ਼ ਤੋਂ ਪਹਿਲਾਂ ਇਸਨੂੰ ਪੜ੍ਹ ਲੈਣਾ ਚਾਹੀਦਾ ਹੈ।",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "ਜੇ ਤੁਸੀਂ 10 ਸਤੰਬਰ ਤੱਕ ਕੁਝ ਨਹੀਂ ਕਹਿੰਦੇ, ਤਾਂ ₹1,10,000 ਤੁਹਾਡੀ ਆਮਦਨ ਵਿੱਚ ਜੁੜ ਜਾਣਗੇ ਤੇ ਤੁਹਾਡੇ ਰਿਫੰਡ ਵਿੱਚੋਂ ਕਰੀਬ ₹34,300 ਕੱਟ ਲਏ ਜਾਣਗੇ।",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "ਜੇ ਤੁਸੀਂ 3 ਸਤੰਬਰ ਤੱਕ ਕੁਝ ਨਹੀਂ ਕਹਿੰਦੇ, ਤਾਂ ਤੁਹਾਡੇ ਰਿਫੰਡ ਵਿੱਚੋਂ ₹18,740 ਕੱਟ ਲਏ ਜਾਣਗੇ ਤੇ ਮਾਮਲਾ ਬੰਦ ਮੰਨ ਲਿਆ ਜਾਵੇਗਾ।",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "ਤੁਸੀਂ ₹1,10,000 ਦੇ ਸ਼ੇਅਰ ਵੇਚੇ ਤੇ ਉਨ੍ਹਾਂ ਦਾ ਮੁਨਾਫ਼ਾ ਦਰਜ ਨਹੀਂ ਕੀਤਾ।",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 ਮੇਰੇ ਵੇਚੇ ਹੋਏ ਸਭ ਕੁਝ ਦੀ ਕੁੱਲ ਕੀਮਤ ਹੈ, ਮੇਰਾ ਮੁਨਾਫ਼ਾ ਨਹੀਂ। ਉਨ੍ਹਾਂ ਸੌਦਿਆਂ ਵਿੱਚ ਮੈਨੂੰ ₹4,200 ਦਾ ਘਾਟਾ ਪਿਆ। ਸਾਲ ਦੀ ਮੇਰੀ ਬ੍ਰੋਕਰ ਸਟੇਟਮੈਂਟ ਖ਼ਰੀਦ ਕੀਮਤਾਂ ਵਿਖਾਉਂਦੀ ਹੈ।",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "ਤੁਹਾਡਾ 2019-20 ਦਾ ₹18,740 ਹਾਲੇ ਵੀ ਬਕਾਇਆ ਹੈ, ਇਸ ਲਈ ਇਹ ਇਸ ਸਾਲ ਦੇ ਰਿਫੰਡ ਵਿੱਚੋਂ ਲਿਆ ਜਾਵੇਗਾ।",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "ਤੁਸੀਂ ₹60,000 ਦੇ ਕਿਰਾਏ ਦਾ ਦਾਅਵਾ ਕੀਤਾ। ਇਸਨੂੰ ਵਿਖਾਉਣ ਲਈ ਕੁਝ ਨੱਥੀ ਨਹੀਂ ਸੀ। ਰਸੀਦ ਜਾਂ ਮਕਾਨ ਮਾਲਕ ਦਾ ਨਾਂ ਤੇ PAN ਜੋੜੋ, ਤਾਂ ਇਹ ਅੱਗੇ ਵਧੇਗਾ।",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank ਪਿਛਲੇ ਸਾਲ Deccan Union Bank ਦਾ ਹਿੱਸਾ ਬਣ ਗਿਆ। ਖਾਤਾ ਹਾਲੇ ਵੀ ਮੌਜੂਦ ਹੈ — ਪਰ ਉਸ ਤੱਕ ਪੈਸਾ ਪਹੁੰਚਾਉਣ ਵਾਲਾ ਕੋਡ ਨਹੀਂ।",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "ਤੁਸੀਂ 80GG ਹੇਠ ₹60,000 ਦੇ ਕਿਰਾਏ ਦਾ ਦਾਅਵਾ ਕੀਤਾ, ਪਰ ਸਮਰਥਨ ਲਈ ਕੁਝ ਨੱਥੀ ਨਹੀਂ ਕੀਤਾ।",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "ਮੈਂ ਇਹ ਕਿਰਾਇਆ ਦਿੱਤਾ ਹੈ। ਮੇਰੇ ਕੋਲ ਮਕਾਨ ਮਾਲਕ ਦੀਆਂ ਮਹੀਨੇਵਾਰ ਰਸੀਦਾਂ ਹਨ ਤੇ ਮੈਂ ਉਨ੍ਹਾਂ ਦਾ ਨਾਂ ਤੇ PAN ਦੇ ਸਕਦਾ/ਸਕਦੀ ਹਾਂ।",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "ਇਹ ਕੋਈ ਦੋਸ਼ ਨਹੀਂ ਹੈ ਤੇ ਹਾਲੇ ਕੋਈ ਜੁਰਮਾਨਾ ਨਹੀਂ। ਪਰ ਤੁਹਾਡੇ ₹34,800 ਉੱਥੇ ਹੀ ਰਹਿਣਗੇ ਜਦ ਤੱਕ ਤੁਸੀਂ ਦਾਅਵੇ ਦਾ ਸਬੂਤ ਨਹੀਂ ਦਿੰਦੇ ਜਾਂ ਇਸਨੂੰ ਵਾਪਸ ਨਹੀਂ ਲੈਂਦੇ।",
  "Look at what they reported": "ਵੇਖੋ ਉਨ੍ਹਾਂ ਨੇ ਕੀ ਦਰਜ ਕੀਤਾ",
  "Read the 2019 demand": "2019 ਦੀ ਮੰਗ ਪੜ੍ਹੋ",
  "Add the receipt": "ਰਸੀਦ ਜੋੜੋ",
  "Point it at the right account": "ਇਸਨੂੰ ਸਹੀ ਖਾਤੇ ਵੱਲ ਮੋੜੋ",
  "Supervisor, garment unit": "ਸੁਪਰਵਾਈਜ਼ਰ, ਗਾਰਮੈਂਟ ਯੂਨਿਟ",
  "Operations manager; trades equity on the side":
    "ਓਪਰੇਸ਼ਨਜ਼ ਮੈਨੇਜਰ; ਨਾਲ-ਨਾਲ ਸ਼ੇਅਰਾਂ ਵਿੱਚ ਲੈਣ-ਦੇਣ",
  "Junior architect; first time filing":
    "ਜੂਨੀਅਰ ਆਰਕੀਟੈਕਟ; ਪਹਿਲੀ ਵਾਰ ਫਾਈਲ ਕਰ ਰਹੀ ਹੈ",
  "Independent Consultant": "ਸੁਤੰਤਰ ਸਲਾਹਕਾਰ",
  "Primary School Teacher": "ਪ੍ਰਾਇਮਰੀ ਸਕੂਲ ਅਧਿਆਪਕਾ",
  "Retired bank clerk": "ਰਿਟਾਇਰਡ ਬੈਂਕ ਕਲਰਕ",
  "Retired": "ਰਿਟਾਇਰਡ",
  "Teacher": "ਅਧਿਆਪਕ",
  "You sent your return in.": "ਤੁਸੀਂ ਆਪਣਾ ਰਿਟਰਨ ਭੇਜ ਦਿੱਤਾ।",
  "You confirmed it was you. The return counts from here.":
    "ਤੁਸੀਂ ਪੁਸ਼ਟੀ ਕੀਤੀ ਕਿ ਇਹ ਤੁਸੀਂ ਹੀ ਹੋ। ਰਿਟਰਨ ਇੱਥੋਂ ਗਿਣਿਆ ਜਾਵੇਗਾ।",
  "In the queue with everything else filed that week.":
    "ਉਸ ਹਫ਼ਤੇ ਦਾਖਲ ਹੋਏ ਬਾਕੀ ਸਭ ਨਾਲ ਕਤਾਰ ਵਿੱਚ।",
  "Someone is looking at one figure.": "ਕੋਈ ਇੱਕ ਅੰਕੜੇ ਨੂੰ ਵੇਖ ਰਿਹਾ ਹੈ।",
  "A share-sale row your broker filed doesn't line up with your return.":
    "ਤੁਹਾਡੇ ਬ੍ਰੋਕਰ ਦੀ ਦਰਜ ਕੀਤੀ ਸ਼ੇਅਰ-ਵਿਕਰੀ ਦੀ ਇੱਕ ਕਤਾਰ ਤੁਹਾਡੇ ਰਿਟਰਨ ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ।",
  "OTP verified, 4 minutes after filing.": "OTP ਤਸਦੀਕ ਹੋਇਆ, ਦਾਖਲ ਕਰਨ ਤੋਂ 4 ਮਿੰਟ ਬਾਅਦ।",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG ਹੇਠ ₹60,000 ਦਾ ਦਾਅਵਾ, ਸਮਰਥਨ ਲਈ ਕੁਝ ਵੀ ਨੱਥੀ ਨਹੀਂ।",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank ਨੇ ਜਾਂਚ ਵਾਪਸ ਮੋੜ ਦਿੱਤੀ: IFSC GODG0004417 ਹੁਣ ਕਿਤੇ ਨਹੀਂ ਜਾਂਦਾ।",
  "OTP Verification Complete": "OTP ਤਸਦੀਕ ਪੂਰੀ",
  "Outstanding Compliance Notices": "ਬਕਾਇਆ ਪਾਲਣਾ ਨੋਟਿਸ",
  "Draft Legal Response": "ਕਾਨੂੰਨੀ ਜਵਾਬ ਦਾ ਡਰਾਫਟ ਬਣਾਓ",
  "No Pending Actions": "ਕੋਈ ਕਾਰਵਾਈ ਬਾਕੀ ਨਹੀਂ",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "ਤੁਹਾਡਾ ਖਾਤਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਠੀਕ ਹੈ — ਕੋਈ ਬਕਾਇਆ ਨੋਟਿਸ ਜਾਂ ਟੈਕਸ ਮੰਗ ਨਹੀਂ।",
  "Actionable Assessment Holds": "ਕਾਰਵਾਈ ਮੰਗਦੀਆਂ ਮੁਲਾਂਕਣ ਰੁਕਾਵਟਾਂ",
  "Upload Rent Agreement / Receipts": "ਕਿਰਾਇਆ ਇਕਰਾਰਨਾਮਾ / ਰਸੀਦਾਂ ਅੱਪਲੋਡ ਕਰੋ",
  "Landlord Name": "ਮਕਾਨ ਮਾਲਕ ਦਾ ਨਾਂ",
  "Landlord PAN (10 Digits)": "ਮਕਾਨ ਮਾਲਕ ਦਾ PAN (10 ਅੰਕ)",
  "Select PDF/JPG": "PDF/JPG ਚੁਣੋ",
  "Submit Receipt": "ਰਸੀਦ ਜਮ੍ਹਾਂ ਕਰੋ",
  "Response Position": "ਜਵਾਬ ਦੀ ਸਥਿਤੀ",
  "I Agree with Department": "ਮੈਂ ਵਿਭਾਗ ਨਾਲ ਸਹਿਮਤ ਹਾਂ",
  "I Disagree (Submit Proof)": "ਮੈਂ ਅਸਹਿਮਤ ਹਾਂ (ਸਬੂਤ ਜਮ੍ਹਾਂ ਕਰੋ)",
  "Response Statement (Draft)": "ਜਵਾਬ ਦਾ ਬਿਆਨ (ਡਰਾਫਟ)",
  "Dictate Statement": "ਬੋਲ ਕੇ ਬਿਆਨ ਲਿਖਵਾਓ",
  "Listening...": "ਸੁਣ ਰਹੇ ਹਾਂ...",
  "Explain your disagreement or agreement...": "ਆਪਣੀ ਸਹਿਮਤੀ ਜਾਂ ਅਸਹਿਮਤੀ ਸਮਝਾਓ...",
  "Send Response": "ਜਵਾਬ ਭੇਜੋ",
  "Cancel": "ਰੱਦ ਕਰੋ",
  "Validate Bank Code": "ਬੈਂਕ ਕੋਡ ਤਸਦੀਕ ਕਰੋ",
  "Update Bank IFSC": "ਬੈਂਕ IFSC ਅੱਪਡੇਟ ਕਰੋ",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "ਬੈਂਕ ਵੇਰਵੇ ਤਸਦੀਕ ਕਰਨ ਲਈ 11 ਅੱਖਰਾਂ ਦਾ ਬੈਂਕ ਰੂਟਿੰਗ ਕੋਡ (IFSC) ਜਾਂਚੋ।",
  "IFSC Code": "IFSC ਕੋਡ",
};

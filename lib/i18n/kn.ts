/**
 * ಕನ್ನಡ (Kannada). Typed against the English source, so this file cannot fall
 * behind it.
 *
 * This translation is model-generated and awaits review by a native Kannada
 * speaker who knows tax vocabulary (project task T0.5). Until that review
 * lands, treat every string here as provisional — the limitation is disclosed
 * on /honesty rather than papered over.
 *
 * Digits stay Latin, for the same reason as in Hindi and Tamil — money must be
 * legible at a glance before anything else on the screen is.
 */

import type { Dict } from "./en";

export const kn: Dict = {
  langName: "Kannada",
  langNativeName: "ಕನ್ನಡ",
  dir: "ltr",

  common: {
    modeSimple: "ಸರಳ",
    modeDetailed: "ವಿವರವಾಗಿ",
    continue: "ಮುಂದುವರಿಸಿ",
    back: "ಹಿಂದೆ",
    yesThatsRight: "ಹೌದು, ಇದು ಸರಿ",
    noThisIsWrong: "ಇಲ್ಲ, ಇದು ತಪ್ಪು",
    iDontUnderstand: "ಇದು ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ",
    close: "ಮುಚ್ಚಿ",
    saveAndGoOn: "ಉಳಿಸಿ ಮುಂದೆ ಸಾಗಿ",
    loading: "ಒಂದು ಕ್ಷಣ",
    logOut: "ಹೊರಬನ್ನಿ",
    undo: "ಹಿಂತೆಗೆದುಕೊಳ್ಳಿ",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ವಾಪಸಿ",
    subtitle: "ಪರಿಶೀಲಿಸಿ ಸಲ್ಲಿಸಲು ಒಂದು ಸ್ಪಷ್ಟ ದಾರಿ",
    independent: "ಸ್ವತಂತ್ರ ಮಾದರಿ",
    taxYear: "ತೆರಿಗೆ ವರ್ಷ 2026-27",
    language: "ಭಾಷೆ",
    light: "ಬೆಳಕು",
    dark: "ಕತ್ತಲು",
    sandbox: "ಪರಿಶೀಲನಾ ಸಾಧನಗಳು",
    /** WCAG 2.4.1: lets a keyboard user jump past the header chrome. */
    skipToContent: "ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ",
  },

  validate: {
    panTooShort: (n: number) => `ಇಲ್ಲಿಯವರೆಗೆ ${n} ಅಕ್ಷರಗಳು. PAN-ನಲ್ಲಿ 10 ಇರುತ್ತವೆ.`,
    panShape:
      "PAN ಎಂದರೆ ಐದು ಅಕ್ಷರಗಳು, ನಂತರ ನಾಲ್ಕು ಅಂಕಿಗಳು, ನಂತರ ಒಂದು ಅಕ್ಷರ — DEMPS4417K ಹಾಗೆ.",
    panSandboxHint:
      "ನೀವು ಇಲ್ಲಿ ಬರೆಯುವುದು ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಿಂದ ಹೊರಗೆ ಹೋಗುವುದಿಲ್ಲ. ಈ ಮಾದರಿಯಲ್ಲಿ ಪ್ರತಿ PAN ಕೂಡ DEMP ಇಂದ ಶುರುವಾಗುತ್ತದೆ, ಹಾಗಾಗಿ ನಿಜವಾದ PAN ಆಕಸ್ಮಿಕವಾಗಿ ಹುಡುಕಲ್ಪಡುವುದಿಲ್ಲ.",
    ifscTooShort: (n: number) =>
      `ಇಲ್ಲಿಯವರೆಗೆ ${n} ಅಕ್ಷರಗಳು. ಬ್ಯಾಂಕ್ ಕೋಡ್‌ನಲ್ಲಿ 11 ಇರುತ್ತವೆ.`,
    ifscShape:
      "ಬ್ಯಾಂಕ್ ಕೋಡ್ ಎಂದರೆ ನಾಲ್ಕು ಅಕ್ಷರಗಳು, ನಂತರ ಒಂದು ಸೊನ್ನೆ, ನಂತರ ಇನ್ನೂ ಆರು — DECU0834471 ಹಾಗೆ.",
  },

  landing: {
    question: "ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆಯಲ್ಲಿ ನಿಮ್ಮದೇ ಹಣ ನಿಂತಿದೆಯೇ?",
    subtext:
      "ಇದನ್ನು ಬಳಸುವವರಲ್ಲಿ ಹೆಚ್ಚಿನವರು ಏನನ್ನೂ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ — ಅವರಿಗೇ ಹಣ ಬರಬೇಕಿದೆ. ನಿಮ್ಮ PAN ಹಾಕಿ, ಅಲ್ಲಿ ಏನಿದೆ ಎಂದು ನಾವು ಹೇಳುತ್ತೇವೆ.",
    panLabel: "ನಿಮ್ಮ PAN",
    panHelp: "ನಿಮ್ಮ PAN ಕಾರ್ಡಿನ ಹತ್ತು ಅಕ್ಷರಗಳು",
    panPlaceholder: "ಉದಾಹರಣೆಗೆ, DEMPS4417K",
    check: "ನನಗೆ ಎಷ್ಟು ಬರಬೇಕು ಎಂದು ನೋಡಿ",
    orTryAs: "ಅಥವಾ ಮೂವರಲ್ಲಿ ಒಬ್ಬರಾಗಿ ಸುತ್ತಾಡಿ ನೋಡಿ",
    honestyLink: "ಇಲ್ಲಿ ಯಾವುದು ನಿಜ, ಯಾವುದು ಕಲ್ಪನೆ",
    architectureLink: "ತಾಂತ್ರಿಕ ರಚನೆ",
    badge: "ಸರಳಗೊಳಿಸಿದ ತೆರಿಗೆ ಸಲ್ಲಿಕೆ, ನೇರವಾಗಿ ಸಾಬೀತಾಗಿದೆ",
    brandTitle: "ನಿಮ್ಮ ಹಣ, ವಾಪಸ್ ಬರುತ್ತಿದೆ.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ಸಲ್ಲಿಕೆ",
      blurb:
        "ಅವರ ಸಂಬಳದಿಂದ ₹8,400 ಕಡಿತವಾಗಿದೆ. ಅವರು ಏನನ್ನೂ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ, ಇನ್ನೂ ಸಲ್ಲಿಸಿಲ್ಲ, ಶಾಲಾ ಶುಲ್ಕ ಕಟ್ಟಬೇಕಿದೆ.",
      action: "ಈಗಾಗಲೇ ಗೊತ್ತಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿ",
    },
    rakesh: {
      phase: "ಒಂದು ಪತ್ರ ಬಂತು",
      blurb:
        "ಷೇರು ಲಾಭ ₹1,10,000 ಅನ್ನು ಮುಚ್ಚಿಟ್ಟಿದ್ದಾರೆ ಎಂದು ಪತ್ರ ಹೇಳುತ್ತದೆ. ಅವರಿಗೆ ಎಂದೂ ತಿಳಿಸದ ಹಳೆಯ ಬೇಡಿಕೆಗಾಗಿ ಅವರಿಗೆ ಬರಬೇಕಾದ ಹಣ ತಡೆಹಿಡಿಯಲಾಗಿದೆ.",
      action: "ಓದಿ, ಒಪ್ಪದಿದ್ದರೆ ಹೇಳಿ",
    },
    priya: {
      phase: "ಕಾಯುವಿಕೆ",
      blurb:
        "71 ದಿನಗಳ ಹಿಂದೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ. ಇನ್ನೂ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ ಎಂದೇ ತೋರಿಸುತ್ತಿದೆ. ನಿಜಕ್ಕೂ ಎರಡು ವಿಷಯಗಳು ತಡೆದಿವೆ, ಯಾವುದು ಎಂದು ಯಾರೂ ಹೇಳಿಲ್ಲ.",
      action: "ಯಾವುದು ತಡೆದಿದೆ ಎಂದು ನೋಡಿ",
    },
    custom: {
      phase: "ನೀವೇ ಪ್ರಯತ್ನಿಸಿ",
      blurbTitle: "ಕಲ್ಪಿತ ವ್ಯಕ್ತಿ",
      blurb:
        "ಒಬ್ಬ ವ್ಯಕ್ತಿಯನ್ನು ಮೊದಲಿನಿಂದ ಕಟ್ಟಿ — ಸಂಬಳ, ಕೋರಿಕೆಗಳು, ಕಡಿತಗಳು — ಮತ್ತು ತೆರಿಗೆ ಲೆಕ್ಕ ತಾನೇ ಬಿಡಿಸಿಕೊಳ್ಳುವುದನ್ನು ನೋಡಿ.",
      action: "ಒಬ್ಬರನ್ನು ಸೃಷ್ಟಿಸಿ",
    },
  },

  login: {
    authVerifying: "ಸರ್ವರ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
    authUnreachable:
      "ಸೈನ್-ಇನ್ ಸರ್ವರ್ ತಲುಪಲು ಆಗಲಿಲ್ಲ. ನೀವು ಹಾಕಿದ್ದು ಏನೂ ಕಳೆದುಹೋಗಿಲ್ಲ — ಸ್ವಲ್ಪ ಹೊತ್ತಿನಲ್ಲಿ ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
    authRejected: (detail: string) => `ಸರ್ವರ್ ನಿಮ್ಮನ್ನು ಒಳಗೆ ಬಿಡಲಿಲ್ಲ: ${detail}`,
    signedInAs: "ಸೈನ್-ಇನ್ ಆಗಿದೆ — ಸೆಷನ್ ಚಾಲ್ತಿಯಲ್ಲಿದೆ",
    otpSentTo: (mobile: string) => `${mobile} ಸಂಖ್ಯೆಗೆ ಒಂದು ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ`,
    otpLabel: "ಆರು ಅಂಕಿಗಳ ಕೋಡ್",
    weWillWait:
      "ಆತುರವಿಲ್ಲ. ಕೋಡ್‌ಗಾಗಿ ಕಾಯುತ್ತಿರುವಾಗ ನೀವು ಹಾಕಿದ್ದು ಏನೂ ಕಳೆದುಹೋಗುವುದಿಲ್ಲ.",
    resend: "ಮತ್ತೆ ಕಳುಹಿಸಿ",
    resendIn: (seconds: number) => `${seconds}ಸೆ ನಂತರ ಇನ್ನೊಂದನ್ನು ಕೇಳಬಹುದು`,
    mockNotice:
      "ಇದು ಒಂದು ಮಾದರಿ, ಹಾಗಾಗಿ ಕೋಡ್ ಪರದೆಯ ಮೇಲೆಯೇ ತೋರಿಸಲಾಗಿದೆ. ನಿಜವಾದ ಸಂದೇಶ ಯಾವುದೂ ಹೋಗುವುದಿಲ್ಲ.",
    portalHeading: "ಇ-ಫೈಲಿಂಗ್ ಪರಿಶೀಲನೆ",
    incorrectCode: "ಈ ಕೋಡ್ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಆರು ಅಂಕಿಗಳನ್ನು ನೋಡಿ ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
    prototypeBox: "ಮಾದರಿ OTP ಪರಿಶೀಲನೆ",
    mockCodeLabel: "ಮಾದರಿ ಕೋಡ್",
    autoFill: "ನನಗಾಗಿ ತುಂಬಿಸಿ",
    verifyEnter: "ಪರಿಶೀಲಿಸಿ ಒಳಗೆ ಹೋಗಿ",
    /** Screen-reader labels for the six single-digit OTP boxes. */
    otpGroupLabel: "ಆರು ಅಂಕಿಗಳ ಪರಿಶೀಲನಾ ಕೋಡ್",
    otpDigitLabel: (position: number, total: number) =>
      `ಅಂಕಿ ${position}, ಒಟ್ಟು ${total}`,
    draftRestored: (time: string) =>
      `${time} ಸಮಯದ ನಿಮ್ಮ ಕರಡು ಮರಳಿ ತೆರೆಯಲಾಗಿದೆ. ಏನೂ ಕಳೆದುಹೋಗಿಲ್ಲ.`,
  },

  file: {
    heading: (amount: string) => `ನಿಮ್ಮದೇ ${amount} ಇಲಾಖೆಯಲ್ಲಿ ಕುಳಿತಿದೆ`,
    subheading:
      "ಕೆಳಗಿನ ಬಹುತೇಕ ಎಲ್ಲವನ್ನೂ ನಿಮ್ಮ ಬಗ್ಗೆ ಈಗಾಗಲೇ ವರದಿ ಮಾಡಲಾಗಿದೆ. ಓದಿ ನೋಡಿ, ಏನಾದರೂ ತಪ್ಪಿದ್ದರೆ ಹೇಳಿ.",

    checkThis: "ಇದನ್ನು ಪರಿಶೀಲಿಸಿ — ನೀವು ತುಂಬಿಸಬೇಕಾಗಿಲ್ಲ",
    factMeaning:
      "ಇದು ವರದಿಯಾದ ಸಂಗತಿ, ತೆರಿಗೆ ನಿಯಮವಲ್ಲ. ಕೆಳಗಿನ ಲೆಕ್ಕ ಇದನ್ನೇ ಬಳಸುತ್ತದೆ.",
    factMeaningByKind: {
      salary:
        "ನಿಮ್ಮ ಕೈಗೆ ಬಂದ ಸಂಬಳದಿಂದ ನಿಮ್ಮ ಮಾಲೀಕರು ಇದನ್ನು ವರದಿ ಮಾಡಿದ್ದಾರೆ. ಕೆಳಗಿನ ಎಲ್ಲದಕ್ಕೂ ಇದೇ ಆರಂಭ.",
      interest:
        "ನಿಮ್ಮ ಖಾತೆಗಳು ಗಳಿಸಿದ ಬಡ್ಡಿಯನ್ನು ಬ್ಯಾಂಕುಗಳು ವರ್ಷಕ್ಕೊಮ್ಮೆ ವರದಿ ಮಾಡುತ್ತವೆ. ಸಣ್ಣ ಮೊತ್ತವೂ ಆದಾಯವೇ.",
      dividend:
        "ನಿಮ್ಮ ಷೇರುಗಳು ಕೊಟ್ಟ ಡಿವಿಡೆಂಡ್ ಅನ್ನು ಕಂಪನಿಯ ರಿಜಿಸ್ಟ್ರಾರ್ ವರದಿ ಮಾಡಿದ್ದಾರೆ. ಅದು ಕೊಟ್ಟ ವರ್ಷದ ಆದಾಯವಾಗಿ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತದೆ.",
      capital_gains:
        "ಷೇರುಗಳನ್ನು ಮಾರಿ ಬಂದ ಹಣವನ್ನು ನಿಮ್ಮ ಬ್ರೋಕರ್ ವರದಿ ಮಾಡಿದ್ದಾರೆ. ತೆರಿಗೆ ಬೀಳುವುದು ಲಾಭಕ್ಕೆ ಮಾತ್ರ — ದರವು ಏನನ್ನು ಮಾರಿದಿರಿ, ಎಷ್ಟು ಕಾಲ ಇಟ್ಟುಕೊಂಡಿದ್ದಿರಿ ಎಂಬುದನ್ನು ಅವಲಂಬಿಸಿದೆ.",
      rent: "ಬಂದ ಬಾಡಿಗೆ ಆದಾಯ; ಕಟ್ಟಿದ ಬಾಡಿಗೆ ನಿಮ್ಮ ತೆರಿಗೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಬಹುದು. ಎರಡೂ ಆಚೆ ಕಡೆಯವರು ವರದಿ ಮಾಡಿದ್ದಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗಬೇಕು.",
      other:
        "ಬೇರೆ ಯಾವ ಗುಂಪಿಗೂ ಸೇರದ ವರದಿಯಾದ ಆದಾಯ. ಇದೂ ಕೆಳಗಿನ ಲೆಕ್ಕಕ್ಕೆ ಸೇರುತ್ತದೆ.",
    } as Record<string, string>,
    reportedBy: (reporter: string, date: string) =>
      `${reporter} ಇದನ್ನು ${date} ರಂದು ಇಲಾಖೆಗೆ ವರದಿ ಮಾಡಿದೆ`,
    underIdentifier: (identifier: string) => `${identifier} ಎಂದು ನೋಂದಾಯಿಸಲಾಗಿದೆ`,
    onlyTheyCanFix: (reporter: string) =>
      `ಇದು ತಪ್ಪಿದ್ದರೆ, ಮೂಲದಲ್ಲಿ ಇದನ್ನು ${reporter} ಮಾತ್ರ ಬದಲಿಸಬಹುದು. ಅವರಿಂದ ಏನನ್ನು ಕೇಳಬೇಕು ಎಂದು ನಾವು ನಿಖರವಾಗಿ ಹೇಳುತ್ತೇವೆ.`,

    whatYouEarned: "ನೀವು ಗಳಿಸಿದ್ದು",
    whatWasDeducted: "ಈಗಾಗಲೇ ಕಡಿತವಾದ ತೆರಿಗೆ",
    whereMoneyGoes: "ಹಣ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತದೆ",
    whoYouAre: "ನೀವು ಯಾರು",

    disputeHeading: "ಇಲ್ಲಿ ಏನಿರಬೇಕು?",
    disputeAmountLabel: "ಸರಿಯಾದ ಮೊತ್ತ",
    disputeReasonLabel: "ಇದು ಏಕೆ ತಪ್ಪು",
    disputeSave: "ಇದನ್ನು ತಪ್ಪು ಎಂದು ಗುರುತಿಸಿ",
    selfReported: "ನೀವು",
    returnLabel: "ನಿಮ್ಮ ರಿಟರ್ನ್",

    outcomeOwesNothing: "ನೀವು ಏನನ್ನೂ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ.",
    outcomeRefund: (amount: string) => `${amount} ನಿಮಗೆ ವಾಪಸ್ ಬರುತ್ತದೆ.`,
    outcomeOwes: (amount: string) => `ಇನ್ನೂ ${amount} ಕಟ್ಟಬೇಕಿದೆ.`,
    confirmAndFile: "ಇದನ್ನು ಕಳುಹಿಸಿ",

    verifyHeading: "ಇನ್ನೊಂದೇ ಹೆಜ್ಜೆ ಬಾಕಿ, ಇಲ್ಲದಿದ್ದರೆ ಇದು ಲೆಕ್ಕಕ್ಕೆ ಬರುವುದಿಲ್ಲ.",
    verifyBody:
      "ಇದು ನೀವೇ ಎಂದು ಖಚಿತಪಡಿಸುವವರೆಗೆ ನಿಮ್ಮ ರಿಟರ್ನ್ ಸಲ್ಲಿಕೆಯಾದಂತೆ ಅಲ್ಲ — ಕಳುಹಿಸದಿದ್ದಂತೆಯೇ. ಇದಕ್ಕೆ ಸುಮಾರು ಇಪ್ಪತ್ತು ಸೆಕೆಂಡು ಸಾಕು.",
    verifyAction: "ಇದು ನಾನೇ ಎಂದು ಖಚಿತಪಡಿಸಿ",

    voicePrompt: "ಅಥವಾ ಹೇಳಿಬಿಡಿ",
    voiceListening: "ಕೇಳುತ್ತಿದ್ದೇವೆ",
    voiceUnsupported:
      "ಈ ಫೋನಿನ ಬ್ರೌಸರ್‌ಗೆ ಇನ್ನೂ ಕೇಳಲು ಆಗುವುದಿಲ್ಲ. ನೀವು ಬರೆದೇ ಹೇಳಬಹುದು — ಏನೂ ಕಳೆದುಹೋಗುವುದಿಲ್ಲ.",
    voiceSimulated:
      "ಈ ಬ್ರೌಸರ್‌ಗೆ ಕೇಳಲು ಆಗುವುದಿಲ್ಲ, ಹಾಗಾಗಿ ಇದು ಒಂದು ಉದಾಹರಣೆ, ನಿಮ್ಮ ಧ್ವನಿಯಲ್ಲ.",
    voiceError:
      "ಅದು ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ನೀವು ಬರೆದೇ ಹೇಳಬಹುದು — ಏನೂ ಕಳೆದುಹೋಗುವುದಿಲ್ಲ.",
    dictate: "ಮಾತಿನಲ್ಲಿ ಹೇಳಿ",
    disputePlaceholder: "ಈ ಅಂಕಿ ಏಕೆ ತಪ್ಪು ಎಂದು ಹೇಳಿ ಅಥವಾ ಬರೆಯಿರಿ.",
    disputeDefaultReason: "ವರದಿಯಾದ ಅಂಕಿ ತಪ್ಪು",
  },

  flow: {
    facts: "ನಿಮ್ಮ ಹಣ",
    deductions: "ನೀವು ಕೋರಬಹುದಾದದ್ದು",
    regime: "ಹಳೆಯದೋ ಹೊಸದೋ",
    check: "ಪರಿಶೀಲಿಸಿ",
    file: "ಕಳುಹಿಸಿ",
    stepOf: (n: number, total: number) => `ಹೆಜ್ಜೆ ${n} / ${total}`,
    confirmedCount: (done: number, total: number) =>
      `${total} ರಲ್ಲಿ ${done} ಖಚಿತವಾಗಿದೆ`,
    allConfirmed: "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ.",
    undoOne: "ಈ ತಿದ್ದುಪಡಿಯನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಿ",
    correctedTo: (amount: string) => `ಇದು ${amount} ಆಗಿರಬೇಕು ಎನ್ನುತ್ತೀರಿ`,
  },

  groups: {
    moneyIn: "ಬರುತ್ತಿರುವ ಹಣ",
    taxPaid: "ನಿಮಗಾಗಿ ಈಗಾಗಲೇ ಕಟ್ಟಿದ ತೆರಿಗೆ",
    deductionsClaimed: "ನೀವು ಕೋರುವ ಕಡಿತಗಳು",
    fromWhere: "ಇದು ಎಲ್ಲಿಂದ ಬಂತು",
    addIncome: "ಆದಾಯ ಸೇರಿಸಿ",
  },

  deductions: {
    notAllowedNewRegime:
      "ಹೊಸ ಪದ್ಧತಿಯಲ್ಲಿ ಲೆಕ್ಕಕ್ಕೆ ಬರುವುದಿಲ್ಲ — ನಿಮ್ಮ ದಾಖಲೆಯಲ್ಲಿ ಉಳಿಸಿಕೊಂಡಿದ್ದೇವೆ.",
    startedAtCap: (amount: string) =>
      `ಇದನ್ನು ${amount} ಗರಿಷ್ಠ ಮಿತಿಯಲ್ಲಿ ಶುರು ಮಾಡಿದ್ದೇವೆ — ನೀವು ನಿಜವಾಗಿ ಕಟ್ಟಿದ್ದನ್ನು “ಎಷ್ಟು” ಎಂಬಲ್ಲಿ ಹಾಕಿ.`,
    heading: "ನೀವು ಕೋರಬಹುದಾದದ್ದು",
    sub: "ಇವು ತಾವಾಗಿಯೇ ಆಗುವುದಿಲ್ಲ. ನೀವು ಹೌದು ಎನ್ನಬೇಕು — ಆದರೆ ಅದು ನಿಜವಾಗಿದ್ದರೆ ಮಾತ್ರ.",
    claimedHeading: "ನಿಮ್ಮ ರಿಟರ್ನ್‌ನಲ್ಲಿ ಈಗಾಗಲೇ",
    worthUpTo: (amount: string) =>
      `ನಿಮ್ಮ ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯದಿಂದ ${amount} ವರೆಗೆ ಕಡಿಮೆಯಾಗುತ್ತದೆ`,
    worthWhatYouPaid: "ನೀವು ನಿಜವಾಗಿ ಕಟ್ಟಿದಷ್ಟೇ ಬೆಲೆ — ನಿಜವಾದ ಅಂಕಿಯನ್ನೇ ಕೋರಿ",
    askRentQ: "ನೀವು ವಾಸಿಸುವ ಜಾಗಕ್ಕೆ ಬಾಡಿಗೆ ಕಟ್ಟುತ್ತೀರಾ?",
    askRentWhy:
      "ನೀವು ಬಾಡಿಗೆ ಕಟ್ಟುತ್ತಿದ್ದು, ಕೆಲಸದ ಕಡೆಯಿಂದ ಮನೆ ಬಾಡಿಗೆ ಭತ್ಯೆ ಸಿಗದಿದ್ದರೆ, ಅದರ ಒಂದು ಭಾಗ ನಿಮ್ಮ ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯದಿಂದ ಕಡಿಮೆಯಾಗಬಹುದು.",
    askHealthQ: "ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಆರೋಗ್ಯ ವಿಮೆಯನ್ನು ನೀವೇ ಕಟ್ಟುತ್ತೀರಾ?",
    askHealthWhy:
      "ಕುಟುಂಬವನ್ನು ವಿಮೆಯಲ್ಲಿ ಇಡಲು ನೀವು ಕಟ್ಟುವುದು ನಿಮ್ಮ ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯದಿಂದ ಕಡಿಮೆಯಾಗಬಹುದು.",
    ask80cQ:
      "ಭವಿಷ್ಯ ನಿಧಿ, ಜೀವ ವಿಮೆ ಅಥವಾ ಶಾಲಾ ಶುಲ್ಕಕ್ಕೆ ನೀವು ಹಣ ಹಾಕುತ್ತೀರಾ?",
    ask80cWhy:
      "ಇಂಥ ದೀರ್ಘಾವಧಿ ಉಳಿತಾಯಗಳೆಲ್ಲ ಒಂದೇ ಒಟ್ಟು ಮಿತಿಯಲ್ಲಿ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತವೆ, ಮತ್ತು ನೀವು ಹಾಕಿದಷ್ಟು ನಿಮ್ಮ ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯದಿಂದ ಕಡಿಮೆಯಾಗುತ್ತದೆ.",
    claimIt: "ಹೌದು — ಇದನ್ನು ಕೋರಿ",
    skipIt: "ಇಲ್ಲ — ಇದನ್ನು ಬಿಟ್ಟುಬಿಡಿ",
    amountLabel: "ಎಷ್ಟು",
    evidenceAttached: "ಸಾಕ್ಷ್ಯ ಲಗತ್ತಿಸಲಾಗಿದೆ",
    evidenceMissing:
      "ಇನ್ನೂ ಯಾವ ಸಾಕ್ಷ್ಯವೂ ಲಗತ್ತಾಗಿಲ್ಲ — ಸದ್ಯಕ್ಕೆ ಪರವಾಗಿಲ್ಲ. ರಸೀದಿಗಳನ್ನು ಇಟ್ಟುಕೊಳ್ಳಿ; ಇಲಾಖೆ ಮುಂದೆ ಕೇಳಬಹುದು.",
    newRegimeNoEffect:
      "ಹೊಸ ಪದ್ಧತಿಯಲ್ಲಿ ಈ ಕೋರಿಕೆಯಿಂದ ಏನೂ ಬದಲಾಗುವುದಿಲ್ಲ — ಅಲ್ಲಿ ಇದಕ್ಕೆ ಅವಕಾಶವಿಲ್ಲ.",
    oldRegimeSaves: (amount: string) =>
      `ಹಳೆಯ ಪದ್ಧತಿಯಲ್ಲಿ ಇದು ನಿಮ್ಮ ತೆರಿಗೆಯನ್ನು ಸುಮಾರು ${amount} ಕಡಿಮೆ ಮಾಡುತ್ತಿತ್ತು.`,
  },

  regime: {
    heading: "ತೆರಿಗೆ ಕಟ್ಟಲು ಎರಡು ದಾರಿಗಳಿವೆ. ಒಂದು ನಿಮಗೆ ಒಳ್ಳೆಯದು.",
    newRegimeName: "ಹೊಸ ಪದ್ಧತಿ",
    oldRegimeName: "ಹಳೆಯ ಪದ್ಧತಿ",
    refundLabel: "ನಿಮಗೆ ವಾಪಸ್ ಬರುತ್ತದೆ",
    dueLabel: "ಕಟ್ಟಬೇಕಾದದ್ದು",
    recommendedBadge: "ನಿಮಗೆ ಒಳ್ಳೆಯದು",
    reasoningOldDeductions: (x: string, y: string) =>
      `ನಿಮ್ಮ ಕಡಿತಗಳು ಒಟ್ಟು ${x} ಆಗುತ್ತವೆ, ಹಾಗಾಗಿ ಹಳೆಯ ಪದ್ಧತಿ ನಿಮಗೆ ಸುಮಾರು ${y} ಉಳಿಸುತ್ತದೆ.`,
    reasoningNewDefault: (y: string) =>
      `ನಿಮ್ಮ ಕಡಿತಗಳಿಂದ ಎರಡೂ ಕಡೆ ಹೆಚ್ಚು ಪ್ರಯೋಜನವಿಲ್ಲ, ಹಾಗಾಗಿ ಹೊಸ ಪದ್ಧತಿಯ ಕಡಿಮೆ ದರಗಳು ನಿಮಗೆ ಸುಮಾರು ${y} ಉಳಿಸುತ್ತವೆ.`,
    acceptRecommendation: "ನನಗೆ ಒಳ್ಳೆಯದನ್ನೇ ಆರಿಸಿ",
    overrideNote:
      "ಎರಡರಲ್ಲಿ ಯಾವುದನ್ನಾದರೂ ಆರಿಸಬಹುದು. ಇಲ್ಲಿ ಏನನ್ನೂ ಮುಚ್ಚಿಟ್ಟಿಲ್ಲ, ಬೀಗ ಹಾಕಿಲ್ಲ.",
  },

  check: {
    newRegimeClaimsZero:
      "ನಿಮ್ಮ ಕೋರಿಕೆಗಳು ಪಟ್ಟಿಯಾಗಿವೆ, ಸುರಕ್ಷಿತವಾಗಿವೆ — ಹೊಸ ಪದ್ಧತಿ ಅವುಗಳಿಗೆ ಅವಕಾಶ ಕೊಡುವುದಿಲ್ಲ, ಅದಕ್ಕೇ ಈ ಸಾಲು ₹0 ಆಗಿದೆ.",
    badgeReportedBy: (reporter: string) => `${reporter} ವರದಿ ಮಾಡಿದೆ`,
    badgeYouEntered: "ಇದನ್ನು ನೀವು ಹಾಕಿದ್ದೀರಿ",
    badgeWeApplied: "ಇದನ್ನು ನಿಮಗಾಗಿ ನಾವು ಸೇರಿಸಿದ್ದೇವೆ",
    heading: "ಇಡೀ ರಿಟರ್ನ್, ಒಂದೇ ಪುಟದಲ್ಲಿ",
    sub: "ಪ್ರತಿ ಅಂಕಿಯೂ ಎಲ್ಲಿಂದಲೋ ಬಂದಿದೆ. ಯಾವ ಸಾಲನ್ನಾದರೂ ತೆರೆದು ಅದು ಎಲ್ಲಿಂದ ಬಂತು ಎಂದು ನೋಡಿ.",
    grossIncome: "ಬಂದದ್ದೆಲ್ಲ",
    standardDeduction: "ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕಡಿತ",
    deductionsLine: "ನೀವು ಮಾಡಿದ ಕೋರಿಕೆಗಳು",
    taxableIncome: "ತೆರಿಗೆ ನಿಜಕ್ಕೂ ಬೀಳುವ ಆದಾಯ",
    slabTax: "ಯಾವ ವಿನಾಯಿತಿಗೂ ಮೊದಲಿನ ತೆರಿಗೆ",
    rebate87A: "ಅದರ ಒಂದು ಭಾಗವನ್ನು ರದ್ದು ಮಾಡುವ ರಿಯಾಯಿತಿ",
    cess: "ಆರೋಗ್ಯ-ಶಿಕ್ಷಣ ಸೇರ್ಪಡೆ",
    totalTax: "ವರ್ಷದ ಒಟ್ಟು ತೆರಿಗೆ",
    tdsCredits: "ಈಗಾಗಲೇ ನಿಮ್ಮಿಂದ ತೆಗೆದದ್ದು",
    refundDue: "ನಿಮಗೆ ವಾಪಸ್ ಬರುತ್ತದೆ",
    balanceDue: "ಕಟ್ಟಬೇಕಾದದ್ದು",
    openLine: "ಇದು ಎಲ್ಲಿಂದ ಬಂತು ಎಂದು ತೋರಿಸಿ",
    closeLine: "ಮರೆಮಾಡಿ",
    calculationStatus:
      "ಇದು ಮಾದರಿ ಲೆಕ್ಕ — ನಿಯಮಗಳ ಮೂಲ ಆಧಾರದ ಪರಿಶೀಲನೆ ಇನ್ನೂ ಬಾಕಿ ಇದೆ (TODO(verify)).",
    calculationTrail: (amount: string) =>
      `${amount} ಅನ್ನು ಕೆಳಗಿನ ಖಚಿತಪಡಿಸಿದ ಸಂಗತಿಗಳು ಮತ್ತು ತೆರಿಗೆ ಕ್ರೆಡಿಟ್‌ಗಳಿಂದ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ. ಈ ಮಾದರಿಯಲ್ಲಿ ಮೂಲ ದಾಖಲೆಗಳು ಕೃತಕವಾದವು.`,
    showCalculationTrail: "ಮೂಲ ಮತ್ತು ಲೆಕ್ಕದ ಜಾಡನ್ನು ತೋರಿಸಿ",
    hideCalculationTrail: "ಮೂಲ ಮತ್ತು ಲೆಕ್ಕದ ಜಾಡನ್ನು ಮರೆಮಾಡಿ",
    sourceRecord: (reporter: string, statement: string, date: string) =>
      `${reporter} · ${statement} · ${date} ರಂದು ವರದಿ`,
    sourceIdentifier: (identifier: string) => `ದಾಖಲೆ ${identifier}`,
    selfReportedSource: "ಈ ರಿಟರ್ನ್‌ನಲ್ಲಿ ನೀವು ವರದಿ ಮಾಡಿದ್ದು",
    statementMeaning: (statement: string): string =>
      statement === "AIS"
        ? "AIS: ವರದಿ ಮಾಡುವ ಸಂಸ್ಥೆಗಳಿಂದ ಬಂದ ಮಾಹಿತಿಯ ವಾರ್ಷಿಕ ಪಟ್ಟಿ."
        : statement === "26AS"
        ? "Form 26AS: ನಿಮ್ಮ PAN ವಿರುದ್ಧ ವರದಿಯಾದ ತೆರಿಗೆಯನ್ನು ತೋರಿಸುವ ಕ್ರೆಡಿಟ್ ಹೇಳಿಕೆ."
        : "ಈ ಸಂಗತಿಗೆ ಲಗತ್ತಾದ ಒಂದು ಮೂಲ ದಾಖಲೆ.",
    sectionMeaning: (section: string) =>
      `${section} ಒಂದು ಕಡಿತದ ವಿಭಾಗ. ಈ ಪದ್ಧತಿ ಅವಕಾಶ ಕೊಟ್ಟರೆ ಮಾತ್ರ ಇದು ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತದೆ.`,
    explainGross: "ನೀವು ನೋಡಿ ಖಚಿತಪಡಿಸಿದ ಸಂಗತಿಗಳನ್ನು ಕೂಡಿಸಿ ಬಂದದ್ದು.",
    explainStd: (amount: string) =>
      `ಸಂಬಳದ ಆದಾಯ ಇರುವ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಕೋರದೆಯೇ ${amount} ಕಡಿತವಾಗುತ್ತದೆ.`,
    explainDeductions: "ಈ ಪದ್ಧತಿ ಅವಕಾಶ ಕೊಡುವ ಕೋರಿಕೆಗಳು ಮಾತ್ರ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತವೆ.",
    explainDisallowed: (section: string) =>
      `${section} ಈ ಪದ್ಧತಿಯಲ್ಲಿ ಅವಕಾಶವಿಲ್ಲ, ಹಾಗಾಗಿ ಇಲ್ಲಿ ಇದರಿಂದ ಏನೂ ಆಗುವುದಿಲ್ಲ.`,
    explainTaxable:
      "ಬಂದದ್ದರಿಂದ ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕಡಿತ ಮತ್ತು ನಿಮ್ಮ ಕೋರಿಕೆಗಳನ್ನು ಕಳೆದು ಉಳಿದದ್ದು.",
    explainSlab: "ತೆರಿಗೆ ಪದರ ಪದರವಾಗಿ ಬೀಳುತ್ತದೆ — ಪ್ರತಿ ಪದರಕ್ಕೂ ಅದರದೇ ದರ.",
    explainRebate: (amount: string) =>
      `ಒಂದು ಮಿತಿಯ ಕೆಳಗೆ ತೆರಿಗೆಯ ಬಹುಪಾಲು ರದ್ದಾಗುತ್ತದೆ — ಇಲ್ಲಿ ${amount} ರಷ್ಟು.`,
    explainCess: "ಎಲ್ಲ ವಿನಾಯಿತಿಗಳ ನಂತರ ಮೇಲೆ ಸೇರಿಸುವ ಸಣ್ಣ ಶೇಕಡಾವಾರು.",
    explainTds:
      "TDS ಎಂದರೆ ಮೂಲದಲ್ಲೇ ಕಡಿತವಾದ ತೆರಿಗೆ: ಹಣ ನಿಮ್ಮನ್ನು ತಲುಪುವ ಮೊದಲೇ ಕೊಟ್ಟವರು ಇದನ್ನು ಹಿಡಿದಿಟ್ಟಿದ್ದಾರೆ.",
    fromFacts: "ಈ ಸಂಗತಿಗಳಿಂದ:",
    ratePct: (rate: number) => {
      const pct = Math.round(rate * 1000) / 10;
      return `${pct}%`;
    },
  },

  filing: {
    heading: "ಇದನ್ನು ಕಳುಹಿಸಲು ಸಿದ್ಧರಾ?",
    sub: "ಒಮ್ಮೆ ಹೋದ ಮೇಲೆ ಬದಲಾವಣೆ ಎಂದರೆ ಮತ್ತೆ ಸಲ್ಲಿಸಬೇಕು. ಇನ್ನೊಮ್ಮೆ ನೋಡಿ, ಆಮೇಲೆ ಕಳುಹಿಸಿ.",
    stepChecking: "ಲೆಕ್ಕ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ…",
    stepSealing: "ಅಂಕಿಗಳಿಗೆ ಮುದ್ರೆ ಹಾಕುತ್ತಿದ್ದೇವೆ…",
    stepFiled: "ಸಲ್ಲಿಕೆಯಾಯಿತು.",
    ackHeading: "ಒಳಗೆ ಹೋಯಿತು.",
    ackBody:
      "ನಿಮ್ಮ ರಿಟರ್ನ್ ಇಂದಿನಿಂದ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತದೆ. ಇನ್ನೊಂದೇ ಹೆಜ್ಜೆ ಬಾಕಿ: ಕೇಳಿದಾಗ ಇದು ನಿಜಕ್ಕೂ ನೀವೇ ಎಂದು ಖಚಿತಪಡಿಸುವುದು. ಅಲ್ಲಿಯವರೆಗೆ ಇದು ಕಳುಹಿಸದಂತೆಯೇ ಲೆಕ್ಕ.",
    ackNext:
      "ಆ ನಂತರ, ನಿಮ್ಮ ಹಣ ಎಲ್ಲಿದೆ ಮತ್ತು ಯಾವುದು ಅದನ್ನು ತಡೆಯಬಹುದು ಎಂಬುದನ್ನು ಟ್ರ್ಯಾಕರ್ ನಿಖರವಾಗಿ ತೋರಿಸುತ್ತದೆ.",
    errorCause:
      "ಪರಿಶೀಲನೆಯ ಹೆಜ್ಜೆ ವಿಫಲವಾಯಿತು: sandbox fault switch ಚಾಲೂ ಇದೆ.",
    errorAction:
      "Reviewer drawer-ನಲ್ಲಿ 'Trigger API Gateway Timeout' ಅನ್ನು ಆಫ್ ಮಾಡಿ, ಮತ್ತೆ ಕಳುಹಿಸಿ. ಏನೂ ಕಳೆದುಹೋಗಿಲ್ಲ.",
    errorCauseNetwork: "ನಿಮ್ಮ ರಿಟರ್ನ್ ಸರ್ವರ್ ತಲುಪಲಿಲ್ಲ.",
    errorActionNetwork:
      "ಏನೂ ಸಲ್ಲಿಕೆಯಾಗಿಲ್ಲ, ಏನೂ ಕಳೆದುಹೋಗಿಲ್ಲ. ನಿಮ್ಮ ಸಂಪರ್ಕ ನೋಡಿ, ಮತ್ತೆ ಕಳುಹಿಸಿ.",
    retry: "ಮತ್ತೆ ಕಳುಹಿಸಲು ಪ್ರಯತ್ನಿಸಿ",
  },

  wizard: {
    identityNextHint:
      "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಮತ್ತು 10 ಅಕ್ಷರಗಳ PAN ಹಾಕಿ.",
    employmentConfirmHint:
      "ನಿಮ್ಮ ಹಿಂದಿನ ಉತ್ತರದಿಂದ — ಇದು ಬದಲಾಗಿದ್ದರೆ ಬೇರೆ ಆಯ್ಕೆಯನ್ನು ಒತ್ತಿ.",
    tdsZeroWarning:
      "ಸಂಬಳದ ಕೆಲಸದಲ್ಲಿ ತೆರಿಗೆ ಬಹುತೇಕ ಯಾವಾಗಲೂ ಈಗಾಗಲೇ ಕಡಿತವಾಗಿರುತ್ತದೆ — ಅದು ನಿಮ್ಮ Form 16 ಅಥವಾ ಸಂಬಳ ಚೀಟಿಯಲ್ಲಿದೆ. ಇಲ್ಲಿ 0 ಹಾಕುವುದೆಂದರೆ ಸಾಮಾನ್ಯವಾಗಿ ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣವನ್ನು ಬಿಟ್ಟುಕೊಟ್ಟಂತೆ.",
  },

  timeline: {
    filed: "ನಿಮ್ಮ ರಿಟರ್ನ್ ಕಳುಹಿಸಿದ್ದೀರಿ.",
    verified:
      "ಇದು ನೀವೇ ಎಂದು ಖಚಿತಪಡಿಸಿದ್ದೀರಿ. ರಿಟರ್ನ್ ಇಲ್ಲಿಂದ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತದೆ.",
    in_queue: "ಆ ವಾರ ಸಲ್ಲಿಕೆಯಾದ ಉಳಿದೆಲ್ಲದರ ಜೊತೆ ಸಾಲಿನಲ್ಲಿದೆ.",
    under_review: "ಈಗ ಯಾರೋ ಇದನ್ನು ನೋಡುತ್ತಿದ್ದಾರೆ.",
    determined: "ನಿರ್ಧಾರವಾಯಿತು — ಇಷ್ಟು ವಾಪಸ್ ಬರುತ್ತದೆ.",
    sent_to_bank: "ನಿಮ್ಮ ಬ್ಯಾಂಕಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.",
    credited: "ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿದೆ.",
  },

  refund: {
    heading: (amount: string) => `${amount} ನಿಮ್ಮ ಕಡೆಗೆ ಬರುತ್ತಿದೆ`,
    filedDaysAgo: (days: number) => `ನೀವು ${days} ದಿನಗಳ ಹಿಂದೆ ಸಲ್ಲಿಸಿದ್ದೀರಿ`,

    holdsHeading: (n: number) =>
      n === 1
        ? "ಒಂದೇ ಒಂದು ವಿಷಯಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ"
        : `${n} ವಿಷಯಗಳಿಗಾಗಿ ಕಾಯುತ್ತಿದೆ`,
    clearsInDays: (days: number) =>
      days === 1
        ? "ಅದು ಮುಗಿದ ಮೇಲೆ ಸುಮಾರು ಒಂದು ದಿನ"
        : `ಅದು ಮುಗಿದ ಮೇಲೆ ಸುಮಾರು ${days} ದಿನ`,

    cohortWindow: (from: number, to: number) =>
      `ನಿಮ್ಮದೇ ವಾರದಲ್ಲಿ ಸಲ್ಲಿಕೆಯಾದ ರಿಟರ್ನ್‌ಗಳು ಈಗ ಪರಿಶೀಲನೆಯಾಗುತ್ತಿವೆ. ${from} ರಿಂದ ${to} ದಿನ ಆಗಬಹುದು.`,

    states: {
      not_filed: "ಇನ್ನೂ ಕಳುಹಿಸಿಲ್ಲ",
      filed_unverified: "ಕಳುಹಿಸಿದೆ, ಇದು ನೀವೇ ಎಂಬ ಖಚಿತಪಡಿಸುವಿಕೆಗೆ ಕಾಯುತ್ತಿದೆ",
      verified: "ನೀವು ಖಚಿತಪಡಿಸಿದ್ದೀರಿ",
      in_queue: "ಸಾಲಿನಲ್ಲಿದೆ",
      under_review: "ಯಾರೋ ಇದನ್ನು ನೋಡುತ್ತಿದ್ದಾರೆ",
      determined: "ನಿರ್ಧಾರವಾಗಿದೆ",
      sent_to_bank: "ನಿಮ್ಮ ಬ್ಯಾಂಕಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
      credited: "ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿದೆ",
      failed: "ನಿಮ್ಮ ಖಾತೆಯನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ",
    },

    bankFailedHeading: "ನೀವು ಆರಿಸಿದ ಖಾತೆಗೆ ಹಣ ಬರಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    bankMergedInto: (bank: string) => `ಆ ಶಾಖೆ ಈಗ ${bank} ಒಂದು ಭಾಗ`,
    useThisAccount: "ಬದಲಿಗೆ ಇಲ್ಲಿಗೆ ಕಳುಹಿಸಿ",
    resolvedHold: "ಆಯಿತು — ಇನ್ನು ಇದು ಏನನ್ನೂ ತಡೆಯುವುದಿಲ್ಲ.",
    stampFiled: "ಸಲ್ಲಿಕೆಯಾಗಿದೆ",
  },

  notices: {
    heading: "ಇಲಾಖೆಯಿಂದ ಬಂದ ಪತ್ರಗಳು",
    none: "ಏನೂ ವಾಪಸ್ ಬಂದಿಲ್ಲ. ಅದೇ ಒಳ್ಳೆಯ ಸುದ್ದಿ.",
    respondBy: (date: string) => `${date} ಒಳಗೆ ಉತ್ತರಿಸಿ`,
    ifYouDoNothing: "ನೀವು ಏನೂ ಮಾಡದಿದ್ದರೆ",
    basedOn: "ಇದು ಯಾವುದರ ಆಧಾರದ ಮೇಲೆ",
    theCatch: "ಇದರಲ್ಲಿ ಅವರು ತಪ್ಪಾಗಿ ತಿಳಿದದ್ದು",
    agree: "ಇದು ಸರಿ",
    disagree: "ಇದು ತಪ್ಪು",
    dinLabel: "ಈ ಪತ್ರದ ಮೇಲಿನ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ",
    dinExplain:
      "ಇಲಾಖೆಯಿಂದ ಬರುವ ಪ್ರತಿ ಪತ್ರದಲ್ಲೂ ಇಂಥ ಒಂದು ಸಂಖ್ಯೆ ಇರಲೇಬೇಕು. ಅದಿಲ್ಲದಿದ್ದರೆ, ಆ ಪತ್ರ ಅಧಿಕೃತವಾಗಿ ಇಲ್ಲವೇ ಇಲ್ಲ.",
  },

  dashboard: {
    serverFilings: "ಸರ್ವರ್‌ನಲ್ಲಿ ದಾಖಲಾಗಿರುವುದು",
    serverFilingsEmpty:
      "LIVE ಬ್ಯಾಕೆಂಡ್‌ನಲ್ಲಿ ಈ PAN-ಗೆ ಇನ್ನೂ ಯಾವ ಸಲ್ಲಿಕೆಯೂ ಇಲ್ಲ — ಮೇಲಿನ ಸ್ವೀಕೃತಿ ಪೂರ್ವನಿಗದಿತ ಕಥೆಯ ಭಾಗ. ಈ ಆ್ಯಪ್‌ನಿಂದಲೇ ಸಲ್ಲಿಸಿದರೆ ನಿಜವಾದ ರಸೀದಿ ಇಲ್ಲಿ ಬರುತ್ತದೆ.",
    greetingLabel: "ನಿಮ್ಮ ಸೈನ್-ಇನ್ ನುಡಿ",
    greetingWhy:
      "ಖಾತೆ ತೆರೆದಾಗ ಈ ನುಡಿಯನ್ನು ನೀವೇ ಆರಿಸಿದ್ದೀರಿ. ಇದನ್ನು ತೋರಿಸಲಾಗದ ಪುಟ ನಾವಲ್ಲ.",
    userDashboard: "ಬಳಕೆದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    taxPrefills: "ತೆರಿಗೆ ಪೂರ್ವಭರ್ತಿ ಮಾಹಿತಿ (AIS/26AS)",
    pendingActions: "ಬಾಕಿ ಇರುವ ಕೆಲಸಗಳು",
    returnSummary: "ರಿಟರ್ನ್ ಸಾರಾಂಶ AY 2026-27",
    reviewPrefill:
      "ತೆರಿಗೆ ಪೂರ್ವಭರ್ತಿ ಟ್ಯಾಬ್‌ನಲ್ಲಿರುವ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ನಂತರ ಸಲ್ಲಿಸಲು ಖಚಿತಪಡಿಸಿ.",
    filingSubmitted:
      "ನಿಮ್ಮ ಇ-ಫೈಲಿಂಗ್ ರಿಟರ್ನ್ ಸಲ್ಲಿಕೆಯಾಗಿದೆ. ಪ್ರಗತಿಯನ್ನು ಕಾಲಸರಣಿಯಲ್ಲಿ ನೋಡಿ.",
    verifiedBanks: "ಹಣ ವಾಪಸಾತಿಗೆ ಪರಿಶೀಲಿಸಿದ ಬ್ಯಾಂಕ್ ಖಾತೆಗಳು",
    primaryRefundAccount: "ಮುಖ್ಯ ವಾಪಸಾತಿ ಖಾತೆ",
    backupAccount: "ಪರ್ಯಾಯ ಖಾತೆ",
    ifscMeaning:
      "IFSC ಎಂದರೆ ಹಣ ವಾಪಸ್ ಕಳುಹಿಸಲು ಬಳಸುವ 11 ಅಕ್ಷರಗಳ ಬ್ಯಾಂಕ್ ಮಾರ್ಗ ಸಂಕೇತ.",
    refundTimeline: "ವಾಪಸಾತಿ ಕಾಲಸರಣಿ",
    filingSubmittedTimeline: "ಸಲ್ಲಿಕೆಯಾಗಿದೆ",
    identityVerifiedTimeline: "ಗುರುತು ಪರಿಶೀಲನೆಯಾಗಿದೆ",
    assessmentProcessingTimeline: "ಮೌಲ್ಯಮಾಪನ ಪ್ರಕ್ರಿಯೆ",
    refundApprovedTimeline: "ವಾಪಸಾತಿ ಮಂಜೂರಾಗಿದೆ",
    refundCreditedTimeline: "ವಾಪಸಾತಿ ಖಾತೆಗೆ ಜಮೆಯಾಗಿದೆ",
    holdActive: "ತಡೆ ಇದೆ: ಕೆಲಸಗಳ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಸರಿಪಡಿಸಿ",
    successCheckApp: "ಆಯಿತು! ನಿಮ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ಆ್ಯಪ್ ನೋಡಿ.",
    outstandingNotices: "ಬಾಕಿ ಇರುವ ಅನುಸರಣೆ ಸೂಚನೆಗಳು",
    noPendingActions: "ಬಾಕಿ ಇರುವ ಕೆಲಸಗಳಿಲ್ಲ",
    accountCompliant:
      "ನಿಮ್ಮ ಖಾತೆ ಸಂಪೂರ್ಣವಾಗಿ ಸರಿಯಾಗಿದೆ; ಬಾಕಿ ಸೂಚನೆಗಳಾಗಲಿ ತೆರಿಗೆ ಬೇಡಿಕೆಗಳಾಗಲಿ ಇಲ್ಲ.",
    actionableHolds: "ಸರಿಪಡಿಸಬಹುದಾದ ಮೌಲ್ಯಮಾಪನ ತಡೆಗಳು",
    uploadRent: "ಬಾಡಿಗೆ ಒಪ್ಪಂದ / ರಸೀದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    landlordName: "ಮನೆ ಮಾಲೀಕರ ಹೆಸರು",
    landlordPan: "ಮನೆ ಮಾಲೀಕರ PAN (10 ಅಂಕಿ)",
    selectPdfJpg: "PDF/JPG ಆರಿಸಿ",
    submitReceipt: "ರಸೀದಿ ಸಲ್ಲಿಸಿ",
    responsePosition: "ಉತ್ತರದ ನಿಲುವು",
    agreeDept: "ನಾನು ಇಲಾಖೆಯೊಂದಿಗೆ ಒಪ್ಪುತ್ತೇನೆ",
    disagreeProof: "ನಾನು ಒಪ್ಪುವುದಿಲ್ಲ (ಸಾಕ್ಷ್ಯ ಸಲ್ಲಿಸಿ)",
    responseDraft: "ಉತ್ತರದ ಹೇಳಿಕೆ (ಕರಡು)",
    dictateStatement: "ಹೇಳಿಕೆಯನ್ನು ಮಾತಿನಲ್ಲಿ ಹೇಳಿ",
    sendResponse: "ಉತ್ತರ ಕಳುಹಿಸಿ",
    filingStatusLabel: "ಸಲ್ಲಿಕೆಯ ಸ್ಥಿತಿ",
    bankValidated: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    bankUnderProcess: "ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ",
    bankFailed: "ವಿಫಲವಾಗಿದೆ",
    staleIfscHold: "ಈ ಬ್ಯಾಂಕ್ ಕೋಡ್ ಇನ್ನು ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ.",
    switchToNewIfsc: (ifsc: string) => `ಹೊಸ ಕೋಡ್‌ಗೆ ಬದಲಿಸಿ (${ifsc})`,
    personalized: {
      eyebrow: "ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      headingFiled: "ನಿಮ್ಮ ರಿಟರ್ನ್ ಸಲ್ಲಿಕೆಯಾಗಿದೆ — ಈಗ ಎಲ್ಲಿದೆ ಎಂದು ಇಲ್ಲಿದೆ",
      heading: {
        file_return: "ನಿಮ್ಮ ರಿಟರ್ನ್ ಸಿದ್ಧಪಡಿಸೋಣ",
        check_refund: "ಎಷ್ಟು ವಾಪಸ್ ಬರಬಹುದು ಎಂದು ನೋಡೋಣ",
        understand_notice: "ಗಮನ ಬೇಕಾದದ್ದನ್ನು ನಾವು ನೋಡಿಕೊಳ್ಳೋಣ",
        correct_prefill: "ವರದಿಯಾದದ್ದನ್ನು ಪರಿಶೀಲಿಸೋಣ",
      },
      guidedBody: "ಪ್ರತಿ ಅಂಕಿಯನ್ನೂ ನೀವು ಖಚಿತಪಡಿಸುವ ಮೊದಲು ವಿವರಿಸುತ್ತೇವೆ.",
      quickBody: "ದಾರಿಯನ್ನು ಚಿಕ್ಕದಾಗಿ ಇಟ್ಟು ಮುಂದಿನ ನಿರ್ಧಾರವನ್ನೇ ಮೊದಲು ತೋರಿಸುತ್ತೇವೆ.",
      unfiledBody:
        "ಮೊದಲು, ನಿಮ್ಮ ಬಗ್ಗೆ ಈಗಾಗಲೇ ವರದಿಯಾದ ಮಾಹಿತಿಯನ್ನು ಖಚಿತಪಡಿಸಿ.",
      filedBody: "ನೀವು ಬಂದ ಉದ್ದೇಶಕ್ಕೆ ಸರಿಹೊಂದುವ ನೋಟವನ್ನೇ ತೆರೆದಿದ್ದೇವೆ.",
      primaryAction: {
        facts: "ವರದಿಯಾದ ನನ್ನ ವಿವರಗಳನ್ನು ನೋಡಿ",
        overview: "ನನ್ನ ವಾಪಸಾತಿ ಟ್ರ್ಯಾಕರ್ ತೋರಿಸಿ",
        statement: "ವರದಿಯಾದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
        actions: "ಗಮನ ಬೇಕಾದದ್ದನ್ನು ತೋರಿಸಿ",
      },
      focusLabel: "ನಾವು ಗಮನಿಸುವುದು",
      profileLabels: {
        work: "ಕೆಲಸ",
        income: "ಸರಿಸುಮಾರು ಒಟ್ಟು ಆದಾಯ",
        history: "ಸಲ್ಲಿಕೆಯ ಇತಿಹಾಸ",
      },
    },
  },

  onboarding: {
    eyebrow: "ಶುರು ಮಾಡುವ ಮೊದಲು",
    title: "ಇದನ್ನು ನಿಮಗಾಗಿ ಹೊಂದಿಸೋಣ.",
    intro:
      "ಐದು ಸಣ್ಣ ಉತ್ತರಗಳು ಸರಿಯಾದ ಭಾಷೆ, ವೇಗ ಮತ್ತು ತೆರಿಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಆರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ. ಮುಂದೆ ಬದಲಿಸಬಹುದು.",
    languageQuestion: "ಯಾವ ಭಾಷೆ ಬಳಸೋಣ?",
    languageHelp: "ಮೊದಲು ಕೇಳುವುದು ಇದನ್ನೇ. ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಿಸಬಹುದು.",
    intentQuestion: "ಇಂದು ನೀವು ಇಲ್ಲಿಗೆ ಬಂದದ್ದು ಏಕೆ?",
    intentHelp: "ಆ ಕೆಲಸವನ್ನೇ ಮೊದಲು ಇಡುತ್ತೇವೆ.",
    intentOptions: {
      file_return: {
        label: "ಈ ವರ್ಷದ ರಿಟರ್ನ್ ಸಲ್ಲಿಸಲು",
        detail: "ನಿಮ್ಮ ಬಗ್ಗೆ ಈಗಾಗಲೇ ಗೊತ್ತಿರುವುದರಿಂದ ಶುರು ಮಾಡೋಣ.",
      },
      check_refund: {
        label: "ನನಗೆ ಹಣ ಬರಬೇಕೇ ಎಂದು ನೋಡಲು",
        detail: "ಏನು ವರದಿಯಾಗಿದೆ, ಎಷ್ಟು ಕಟ್ಟಲಾಗಿದೆ, ಏನು ವಾಪಸ್ ಬರಬಹುದು ಎಂದು ನೋಡಿ.",
      },
      understand_notice: {
        label: "ಪತ್ರ ಅಥವಾ ಸೂಚನೆಯನ್ನು ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಲು",
        detail: "ಅದು ಏನು ಹೇಳುತ್ತದೆ, ಏನು ಪಣಕ್ಕಿದೆ, ಮುಂದೇನು ಮಾಡಬೇಕು ಎಂದು ನೋಡಿ.",
      },
      correct_prefill: {
        label: "ತಪ್ಪಾಗಿ ಕಾಣುವುದನ್ನು ಸರಿಪಡಿಸಲು",
        detail: "ಒಂದು ಅಂಕಿಯ ಮೂಲ ಹುಡುಕಿ, ಏನು ಬದಲಾಗಬೇಕು ಎಂದು ದಾಖಲಿಸಿ.",
      },
    },
    intentCta: {
      file_return: "ನನ್ನ ರಿಟರ್ನ್ ಶುರು ಮಾಡಿ",
      check_refund: "ನನಗೆ ಎಷ್ಟು ಬರಬೇಕು ಎಂದು ನೋಡಿ",
      understand_notice: "ನಾನು ಏನು ಮಾಡಬೇಕು ಎಂದು ತೋರಿಸಿ",
      correct_prefill: "ವರದಿಯಾದದ್ದನ್ನು ಪರಿಶೀಲಿಸಿ",
    },
    situationQuestion: "ನಿಮ್ಮ ತೆರಿಗೆ ಬದುಕಿನ ಬಗ್ಗೆ ಹೇಳಿ.",
    situationHelp: "ಇಲ್ಲಿ ಎರಡು ಸಣ್ಣ ಉತ್ತರಗಳು ಸಾಕು.",
    professionLabel: "ನಿಮ್ಮ ಕೆಲಸವನ್ನು ಯಾವುದು ಚೆನ್ನಾಗಿ ವಿವರಿಸುತ್ತದೆ?",
    professionOptions: {
      salaried: "ಸಂಬಳದ ಕೆಲಸ",
      self_employed: "ಫ್ರೀಲಾನ್ಸ್ ಅಥವಾ ಸ್ವಂತ ದುಡಿಮೆ",
      business_owner: "ವ್ಯಾಪಾರದ ಮಾಲೀಕ",
      student: "ವಿದ್ಯಾರ್ಥಿ",
      retired: "ನಿವೃತ್ತ",
      investor: "ಹೂಡಿಕೆದಾರ",
      other: "ಬೇರೆ ಏನೋ",
    },
    filingHistoryLabel: "ಈ ಹಿಂದೆ ಆದಾಯ ತೆರಿಗೆ ರಿಟರ್ನ್ ಸಲ್ಲಿಸಿದ್ದೀರಾ?",
    filingHistoryOptions: {
      never: "ಇಲ್ಲ, ಇದೇ ಮೊದಲ ಬಾರಿ",
      once: "ಒಂದೆರಡು ಬಾರಿ",
      every_year: "ಪ್ರತಿ ವರ್ಷ",
    },
    incomeQuestion: "ಎಲ್ಲ ಮೂಲಗಳಿಂದ ನಿಮ್ಮ ಒಟ್ಟು ಆದಾಯ ಸರಿಸುಮಾರು ಎಷ್ಟು?",
    incomeHelp: "ಒಂದು ವ್ಯಾಪ್ತಿ ಸಾಕು. ಈಗಲೇ ನಿಖರ ಅಂಕಿ ಬೇಕಿಲ್ಲ.",
    incomeOptions: {
      none: "ಆದಾಯ ಇಲ್ಲ",
      under_4: "₹4 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ",
      "4_to_8": "₹4 ರಿಂದ ₹8 ಲಕ್ಷ",
      "8_to_12": "₹8 ರಿಂದ ₹12 ಲಕ್ಷ",
      "12_to_25": "₹12 ರಿಂದ ₹25 ಲಕ್ಷ",
      over_25: "₹25 ಲಕ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು",
    },
    modeQuestion: "ನಿಮಗೆ ಎಷ್ಟು ನೋಡಬೇಕು?",
    modeHelp:
      "ಇದು ನೀವು ಎಲ್ಲಿಂದ ಶುರು ಮಾಡುತ್ತೀರಿ ಎಂಬುದನ್ನಷ್ಟೇ ನಿರ್ಧರಿಸುತ್ತದೆ. ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಿಸಬಹುದು.",
    modeOptions: {
      simple: {
        label: "ನನಗಾಗಿ ಮಾಡಿ",
        detail: "ಸರಳ ಮಾತು, ಒಮ್ಮೆಗೆ ಒಂದು ಹೆಜ್ಜೆ. ಉಳಿದದ್ದನ್ನು ನಾವು ನೋಡಿಕೊಳ್ಳುತ್ತೇವೆ.",
      },
      full: {
        label: "ಎಲ್ಲವನ್ನೂ ತೋರಿಸಿ",
        detail: "ಪ್ರತಿ ಅಂಕಿ, ಪ್ರತಿ ನಿಯಮ, ಪ್ರತಿ ಲೆಕ್ಕ — ಮೊದಲಿನಿಂದಲೇ.",
      },
    },
    focusQuestion: "ಇವುಗಳಲ್ಲಿ ಯಾವುದಕ್ಕೆ ನಾವು ಗಮನ ಕೊಡಬೇಕು?",
    focusHelp:
      "ನಿಮಗೆ ಹೊಂದುವ ಎಲ್ಲವನ್ನೂ ಆರಿಸಿ. ಖಚಿತವಿಲ್ಲ ಎಂದು ಆರಿಸಿದರೂ ಪರವಾಗಿಲ್ಲ.",
    focusOptions: {
      salary: "ಸಂಬಳ ಅಥವಾ ಪಿಂಚಣಿ",
      freelance: "ಫ್ರೀಲಾನ್ಸ್ ಕೆಲಸ",
      business: "ವ್ಯಾಪಾರದ ಆದಾಯ",
      rent: "ನಾನು ಕಟ್ಟುವ ಅಥವಾ ಪಡೆಯುವ ಬಾಡಿಗೆ",
      interest: "ಬ್ಯಾಂಕ್ ಬಡ್ಡಿ",
      investments: "ಷೇರುಗಳು ಅಥವಾ ಹೂಡಿಕೆಗಳು",
      deductions: "ಉಳಿತಾಯ, ವಿಮೆ, ಮನೆ ಸಾಲ ಅಥವಾ NPS",
      not_sure: "ನನಗೆ ಇನ್ನೂ ಖಚಿತವಿಲ್ಲ",
    },
    chooseOne: "ಒಂದನ್ನು ಆರಿಸಿ",
    chooseAtLeastOne: "ಕನಿಷ್ಠ ಒಂದನ್ನಾದರೂ ಆರಿಸಿ",
    questionsLabel: "ಸಣ್ಣ ಹೊಂದಾಣಿಕೆ",
    questionsProgress: (current: number, total: number) => `${current} / ${total}`,
    savedLocally: "ಈ ಮಾದರಿಯಲ್ಲಿ ನಿಮ್ಮ ಉತ್ತರಗಳು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಉಳಿಯುತ್ತವೆ.",
    readyTitle: "ಇದನ್ನು ನಿಮ್ಮದಾಗಿಸಲು ಇಷ್ಟು ಸಾಕು.",
    readyBody:
      "ಮೊದಲು ನಿಮಗೆ ಏನು ತೋರಿಸಬೇಕು ಎಂದು ಆರಿಸಲು ಈ ಉತ್ತರಗಳನ್ನು ಬಳಸುತ್ತೇವೆ. ಕೊನೆಯ ಪದ್ಧತಿಯ ಆಯ್ಕೆ ಮಾತ್ರ ನೀವು ಖಚಿತಪಡಿಸುವ ಸಂಗತಿಗಳು ಮತ್ತು ಕೋರಿಕೆಗಳ ಮೇಲೆಯೇ ನಿಂತಿರುತ್ತದೆ.",
    guidedLabel: "ನಾವು ಹೇಗೆ ವಿವರಿಸುತ್ತೇವೆ",
    guidedValue: "ಸಾಗುತ್ತಾ ಪದಗಳನ್ನು ವಿವರಿಸುತ್ತೇವೆ.",
    quickValue: "ದಾರಿಯನ್ನು ಚಿಕ್ಕದಾಗಿ ಇಡುತ್ತೇವೆ.",
    regimeLabel: "ಎರಡು ಪದ್ಧತಿಗಳನ್ನು ಹೇಗೆ ನೋಡುತ್ತೇವೆ",
    claimsRegimeValue:
      "ಎರಡರಲ್ಲಿ ಆರಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಕೋರಿಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ.",
    compareRegimeValue:
      "ನಿಮ್ಮ ಸಂಗತಿಗಳು ಖಚಿತವಾದ ಮೇಲೆ ಎರಡನ್ನೂ ಹೋಲಿಸುತ್ತೇವೆ.",
    focusLabel: "ಮೊದಲು ಇಡುವುದು",
    startPath: "ನನ್ನ ದಾರಿಯಲ್ಲಿ ಶುರು ಮಾಡಿ",
    changeAnswers: "ಉತ್ತರಗಳನ್ನು ಬದಲಿಸಿ",
    tailoredBadge: "ನಿಮ್ಮ ಆರಂಭದ ದಾರಿ",
    tailoredGuided: "ವಿವರಣೆಗಳೊಂದಿಗೆ ಮಾರ್ಗದರ್ಶನ",
    tailoredQuick: "ಚಿಕ್ಕ ದಾರಿ",
    tailoredRegimeClaims: "ಪದ್ಧತಿಯ ಆಯ್ಕೆಗೂ ಮೊದಲು ಕೋರಿಕೆಗಳ ಪರಿಶೀಲನೆ",
    tailoredRegimeCompare: "ಸಂಗತಿಗಳ ನಂತರ ಎರಡೂ ಪದ್ಧತಿಗಳ ಹೋಲಿಕೆ",
    tailoredIntent: (intent: string) => `ಮೊದಲು: ${intent}`,
  },

  checklist: {
    divider: "ಸಲ್ಲಿಸುವ ಮೊದಲು",
    itemBefore: "“",
    itemAfter:
      "” — ಎಂಬುದನ್ನು ಖಚಿತಪಡಿಸಿ; ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ ಕಾರ್ಡ್ ತೆರೆದು ನೋಡಿ.",
    stdRow: "ನಿಮಗಾಗಿ ನಾವು ಸೇರಿಸಿದ ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕಡಿತವನ್ನು ಖಚಿತಪಡಿಸಿ.",
    noteLocked: "ಮೇಲಿನ ಪ್ರತಿ ಸಾಲಿಗೂ ಗುರುತು ಹಾಕಿದರೆ ಈ ಬಟನ್ ತೆರೆದುಕೊಳ್ಳುತ್ತದೆ.",
    noteReady: "ಮೇಲಿನದೆಲ್ಲ ಖಚಿತವಾಗಿದೆ. ಸಿದ್ಧವಾದಾಗ ಸಲ್ಲಿಸಿ.",
    fileBtn: "ಈ ರಿಟರ್ನ್ ಸಲ್ಲಿಸಿ",
    lockedBtn: (n: number) =>
      n === 1
        ? "ಮೊದಲು ಇನ್ನೂ 1 ಸಾಲಿಗೆ ಗುರುತು ಹಾಕಿ"
        : `ಮೊದಲು ಇನ್ನೂ ${n} ಸಾಲುಗಳಿಗೆ ಗುರುತು ಹಾಕಿ`,
  },

  factCard: {
    cardNo: (n: number, date: string) =>
      `ಕಾರ್ಡ್ ${String(n).padStart(2, "0")} · ವರದಿ ${date}`,
    whatThisMeans: "ಇದರ ಅರ್ಥವೇನು",
    readFirst: "ಮೊದಲು “ಇದರ ಅರ್ಥವೇನು” ತೆರೆಯಿರಿ — ನಂತರ ಖಚಿತಪಡಿಸಿ.",
    readyToConfirm: "ಓದಿದಿರಾ? ಕೆಳಗೆ ಖಚಿತಪಡಿಸಿ.",
  },

  signoff: {
    title: "ಸಹಿ ಹಾಕಿ",
    declaration:
      "ಮೇಲಿನ ಅಂಕಿಗಳನ್ನು ನಾನು ಓದಿದ್ದೇನೆ ಮತ್ತು ಮೂಲ ದಾಖಲೆಗಳೊಂದಿಗೆ ತಾಳೆ ನೋಡಿದ್ದೇನೆ. ಅವು ಸರಿಯಾಗಿವೆ ಮತ್ತು ಪೂರ್ಣವಾಗಿವೆ.",
    action: "ಈ ಅಂಕಿಗಳಿಗೆ ಸಹಿ ಹಾಕಿ",
    signed: "ಸಹಿ ಆಯಿತು — ಮೇಲಿನ ಪ್ರತಿ ಅಂಕಿಯೂ ಖಚಿತವಾಗಿದೆ.",
    hint: "ಒಂದೇ ಘೋಷಣೆ ಮೇಲಿನದೆಲ್ಲಕ್ಕೂ ಅನ್ವಯಿಸುತ್ತದೆ. ಯಾವುದಾದರೂ ಒಂದು ಅಂಕಿ ತಪ್ಪೆನಿಸಿದರೆ ಸಹಿ ಹಾಕುವ ಮೊದಲು “ಇಲ್ಲ, ಇದು ತಪ್ಪು” ಎಂದು ಗುರುತಿಸಿ.",
  },

  channels: {
    sectionLabel: "ವರ್ಷ ಒಂದೇ ನೋಟದಲ್ಲಿ",
    earned: "ನೀವು ಗಳಿಸಿದ್ದು",
    toTax: "ತೆರಿಗೆಗೆ ಹೋದದ್ದು",
    overpaid: "ನೀವು ಹೆಚ್ಚು ಕಟ್ಟಿದ್ದು",
    stillToPay: "ಇನ್ನೂ ಕಟ್ಟಬೇಕಾದದ್ದು",
    stayed: "ನಿಮ್ಮನ್ನು ಬಿಟ್ಟು ಹೋಗಲೇ ಇಲ್ಲ",
    kept: "ನೀವು ಕಟ್ಟಬೇಕಿದ್ದ ತೆರಿಗೆ",
    back: "ನಿಮಗೆ ವಾಪಸ್ ಬರುತ್ತಿರುವುದು",
    yoursInEnd: "ಕೊನೆಗೆ ನಿಮ್ಮದೇ",
    collected: "ಈಗಾಗಲೇ ಸಂಗ್ರಹವಾದದ್ದು",
    ofYear: "ವರ್ಷದ ಹಣದಲ್ಲಿ",
    sliceNote:
      "ಕಣ್ಣಿಗೆ ಕಾಣದಷ್ಟು ತೆಳುವಾದ ಪಾಲನ್ನು ಅದರ ನಿಜವಾದ ಪಾಲಿಗಿಂತ ಸ್ವಲ್ಪ ಅಗಲವಾಗಿ ಬಿಡಿಸಲಾಗಿದೆ — ಪಕ್ಕದ ಅಂಕಿಗಳು ನಿಖರವಾಗಿವೆ.",
    whereItWent: "ನೀವು ಗಳಿಸಿದ ಪ್ರತಿ ರೂಪಾಯಿಯೂ ಎಲ್ಲಿಗೆ ಹೋಯಿತು",
    earnedDesc:
      "ಸಂಬಳ, ಬಡ್ಡಿ ಮತ್ತು ಉಳಿದೆಲ್ಲವೂ — ನಿಮಗೆ ಹಣ ಕೊಟ್ಟವರು ವರದಿ ಮಾಡಿದಂತೆ.",
    toTaxDesc:
      "ನಿಮಗೆ ಸಿಗಬೇಕಾದ ಪ್ರತಿ ಕಡಿತದ ನಂತರ ನೀವು ನಿಜಕ್ಕೂ ಕಟ್ಟಬೇಕಿದ್ದದ್ದು.",
    backDesc:
      "ನಿಮ್ಮ ಸಂಬಳದಿಂದ ತೆಗೆದದ್ದು, ಆದರೆ ಕಟ್ಟಬೇಕಿರಲಿಲ್ಲ. ಇದು ನಿಮಗೆ ವಾಪಸ್ ಬರುತ್ತದೆ.",
    dueDesc:
      "ಈಗಾಗಲೇ ಸಂಗ್ರಹವಾದದ್ದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಬಾಕಿ. ಇದನ್ನು ಇನ್ನೂ ಕಟ್ಟಬೇಕು.",
    howToRead:
      "ಇದನ್ನು ಓದುವ ಬಗೆ: ಇಲ್ಲಿ ಯಾವುದನ್ನೂ ನಾವು ಕಲ್ಪಿಸಿಲ್ಲ. ಪ್ರತಿ ಅಂಕಿಯೂ ಯಾರೋ ಸಲ್ಲಿಸಿದ ದಾಖಲೆಯಿಂದ ಬಂದದ್ದು, ಇಲ್ಲವೇ ನೀವೇ ಹಾಕಿದ್ದು. ಪಕ್ಕದ ಪೆನ್ಸಿಲ್ ಟಿಪ್ಪಣಿಗಳು ಪ್ರತಿಯೊಂದರ ನಿಜವಾದ ಅರ್ಥವನ್ನು ಸರಳ ಮಾತಿನಲ್ಲಿ ಹೇಳುತ್ತವೆ — ತೆರಿಗೆ ಪದಗಳಲ್ಲಿ ಅಲ್ಲ.",
    meterCap: "ನೀವು ಕಟ್ಟಬೇಕಿದ್ದ ತೆರಿಗೆ vs ಈಗಾಗಲೇ ಸಂಗ್ರಹವಾದದ್ದು",
  },

  agent: {
    title: "ವಾಪಸಿ ಸಹಾಯಕ",
    open: "ಸಹಾಯಕನನ್ನು ತೆರೆಯಿರಿ",
    close: "ಮುಚ್ಚಿ",
    placeholder: "ಪರಿಶೀಲಿಸಲು, ವಿವರಿಸಲು ಅಥವಾ ಸಲ್ಲಿಸಲು ಹೇಳಿ…",
    send: "ಕಳುಹಿಸಿ",
    thinking: "ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ…",
    toolRan: "ಮಾಡಿದ್ದು:",
    confirmTitle: "ಸಲ್ಲಿಸಲು ಸಿದ್ಧ — ಅಂಕಿಗಳನ್ನು ಖಚಿತಪಡಿಸಿ",
    confirmBody:
      "ನೀವು ಖಚಿತಪಡಿಸುವವರೆಗೆ ಏನೂ ಸಲ್ಲಿಕೆಯಾಗುವುದಿಲ್ಲ. ಸಲ್ಲಿಕೆಯಾಗುವುದು ಇದೇ:",
    confirmTotalTax: "ಒಟ್ಟು ತೆರಿಗೆ",
    confirmRefund: "ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣ",
    confirmDue: "ಕಟ್ಟಬೇಕಾದ ಬಾಕಿ",
    confirmTaxable: "ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯ",
    confirmButton: "ಖಚಿತಪಡಿಸಿ ಸಲ್ಲಿಸಿ",
    cancelButton: "ರದ್ದು",
    filingDismissed: "ಆಯಿತು — ಏನೂ ಸಲ್ಲಿಕೆಯಾಗಿಲ್ಲ.",
    error:
      "ಸಹಾಯಕನನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ರಿಟರ್ನ್ ಅನ್ನು ಮುಟ್ಟಿಲ್ಲ — ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
    intro:
      "ನಾನು ನಿಮ್ಮ ರಿಟರ್ನ್ ಪರಿಶೀಲಿಸಬಲ್ಲೆ, ಯಾವ ಅಂಕಿಯನ್ನಾದರೂ ವಿವರಿಸಬಲ್ಲೆ, ಹೀಗಾದರೆ ಏನು ಎಂದು ಲೆಕ್ಕ ಹಾಕಬಲ್ಲೆ, ಸಲ್ಲಿಕೆಗೆ ಸಿದ್ಧಪಡಿಸಬಲ್ಲೆ. ಏನೇ ಸಲ್ಲಿಕೆಯಾಗುವ ಮೊದಲು ಖಚಿತಪಡಿಸುವವರು ಯಾವಾಗಲೂ ನೀವೇ.",
    sample: "80C ಅಡಿಯಲ್ಲಿ ₹1,50,000 ಹೂಡಿದರೆ ನನಗೆ ಎಷ್ಟು ಉಳಿಯುತ್ತದೆ?",
  },

  footer: {
    prototype: "ಸ್ವತಂತ್ರ ಪರಿಕಲ್ಪನಾ ಮಾದರಿ.",
    notAffiliated:
      "ಇದು ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ, CBDT ಅಥವಾ ಭಾರತ ಸರ್ಕಾರದೊಂದಿಗೆ ಸಂಬಂಧ ಹೊಂದಿಲ್ಲ, ಅವರ ಅನುಮೋದನೆಯೂ ಇಲ್ಲ. ಇಲ್ಲಿನ ಪ್ರತಿ ಹೆಸರು, PAN, ಮೊತ್ತ ಮತ್ತು ದಾಖಲೆ ಕಲ್ಪಿತವಾದದ್ದು. ಯಾವ ನಿಜವಾದ ಸರ್ಕಾರಿ ವ್ಯವಸ್ಥೆಯನ್ನೂ ಸಂಪರ್ಕಿಸುವುದಿಲ್ಲ.",
    honestyLink: "ಯಾವುದು ನಿಜ, ಯಾವುದು ಮಾದರಿ ಎಂದು ನಿಖರವಾಗಿ ನೋಡಿ",
  },
};

/**
 * Kannada translations for the mock/demo strings surfaced through
 * LOCALIZED_MOCK_STRINGS. Model-generated, awaiting native-speaker review
 * (project task T0.5). Keys must stay byte-identical to the English strings
 * in components/mock-i18n.ts.
 */
export const knMock: Record<string, string> = {
  "Your pay last year": "ಕಳೆದ ವರ್ಷದ ನಿಮ್ಮ ಸಂಬಳ",
  "Interest your savings account earned": "ನಿಮ್ಮ ಉಳಿತಾಯ ಖಾತೆ ಗಳಿಸಿದ ಬಡ್ಡಿ",
  "Interest your accounts earned": "ನಿಮ್ಮ ಖಾತೆಗಳು ಗಳಿಸಿದ ಬಡ್ಡಿ",
  "Your primary contract income": "ನಿಮ್ಮ ಮುಖ್ಯ ಗುತ್ತಿಗೆ ಆದಾಯ",
  "Savings interest": "ಉಳಿತಾಯ ಖಾತೆಯ ಬಡ್ಡಿ",
  "Tax withheld (TDS)": "ಮೊದಲೇ ಕಡಿತವಾದ ತೆರಿಗೆ (TDS)",
  "Provident Fund / ELSS Mutual Funds":
    "ಭವಿಷ್ಯ ನಿಧಿ / ELSS ಮ್ಯೂಚುವಲ್ ಫಂಡ್‌ಗಳು",
  "₹8,400 was taken out of her pay. She owes nothing. She has not filed, and school fees are due.":
    "ಅವರ ಸಂಬಳದಿಂದ ₹8,400 ಕಡಿತವಾಗಿದೆ. ಅವರು ಏನನ್ನೂ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ. ಇನ್ನೂ ಸಲ್ಲಿಸಿಲ್ಲ, ಶಾಲಾ ಶುಲ್ಕ ಕಟ್ಟಬೇಕಿದೆ.",
  "Two notices. One says he hid ₹1,10,000 of share profit — he actually lost ₹4,200. The other wants to keep part of his refund for a 2019 bill he never heard about.":
    "ಎರಡು ಸೂಚನೆಗಳು. ಒಂದು ಅವರು ₹1,10,000 ಷೇರು ಲಾಭವನ್ನು ಮುಚ್ಚಿಟ್ಟರು ಎನ್ನುತ್ತದೆ — ನಿಜಕ್ಕೂ ಅವರಿಗೆ ₹4,200 ನಷ್ಟವಾಗಿತ್ತು. ಇನ್ನೊಂದು, ಅವರಿಗೆ ಎಂದೂ ಗೊತ್ತಿಲ್ಲದ 2019ರ ಬಾಕಿಗಾಗಿ ಅವರಿಗೆ ಬರಬೇಕಾದ ಹಣದ ಒಂದು ಭಾಗವನ್ನು ಇಟ್ಟುಕೊಳ್ಳಲು ಬಯಸುತ್ತದೆ.",
  "Filed 71 days ago. The portal says 'Under processing' and nothing else. Two separate things are actually holding her ₹34,800.":
    "71 ದಿನಗಳ ಹಿಂದೆ ಸಲ್ಲಿಸಿದ್ದಾರೆ. ಪೋರ್ಟಲ್ ‘ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ’ ಎಂದಷ್ಟೇ ಹೇಳುತ್ತದೆ, ಇನ್ನೇನೂ ಇಲ್ಲ. ನಿಜಕ್ಕೂ ಎರಡು ಬೇರೆ ಬೇರೆ ವಿಷಯಗಳು ಅವರ ₹34,800 ಅನ್ನು ತಡೆದಿವೆ.",
  "Tax already taken out of your pay": "ನಿಮ್ಮ ಸಂಬಳದಿಂದ ಈಗಾಗಲೇ ಕಡಿತವಾದ ತೆರಿಗೆ (TDS)",
  "Dividend your shares paid out": "ನಿಮ್ಮ ಷೇರುಗಳು ಕೊಟ್ಟ ಡಿವಿಡೆಂಡ್",
  "Money from selling shares": "ಷೇರುಗಳನ್ನು ಮಾರಿ ಬಂದ ಹಣ",
  "Tax the bank withheld on your interest": "ನಿಮ್ಮ ಬಡ್ಡಿಯ ಮೇಲೆ ಬ್ಯಾಂಕ್ ಕಡಿತ ಮಾಡಿದ ತೆರಿಗೆ (TDS)",
  "Provident fund, insurance and your daughter's tuition":
    "ಭವಿಷ್ಯ ನಿಧಿ (PF), ವಿಮೆ ಮತ್ತು ನಿಮ್ಮ ಮಗಳ ಶಾಲಾ ಶುಲ್ಕ",
  "Provident fund and your insurance premium":
    "ಭವಿಷ್ಯ ನಿಧಿ (PF) ಮತ್ತು ನಿಮ್ಮ ವಿಮಾ ಕಂತು",
  "Health cover for the family": "ಕುಟುಂಬಕ್ಕೆ ಆರೋಗ್ಯ ವಿಮೆ",
  "Rent you paid, with no house-rent allowance from your employer":
    "ನೀವು ಕಟ್ಟಿದ ಬಾಡಿಗೆ — ಮಾಲೀಕರಿಂದ ಮನೆ ಬಾಡಿಗೆ ಭತ್ಯೆ ಇಲ್ಲದೆ",
  "One figure doesn't match what your broker reported.":
    "ಒಂದು ಅಂಕಿ ನಿಮ್ಮ ಬ್ರೋಕರ್ ವರದಿ ಮಾಡಿದ್ದಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
  "₹18,740 of this is being held against an old bill.":
    "ಇದರಲ್ಲಿ ₹18,740 ಅನ್ನು ಹಳೆಯ ಬಾಕಿಯ ವಿರುದ್ಧ ತಡೆಹಿಡಿಯಲಾಗುತ್ತಿದೆ.",
  "The department thinks you left out ₹1,10,000 of share profit.":
    "ನೀವು ₹1,10,000 ಷೇರು ಲಾಭವನ್ನು ಬಿಟ್ಟುಬಿಟ್ಟಿದ್ದೀರಿ ಎಂದು ಇಲಾಖೆ ಭಾವಿಸಿದೆ.",
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.":
    "2019ರ ಒಂದು ಬಾಕಿಯನ್ನು ತೀರಿಸಲು ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣದಲ್ಲಿ ₹18,740 ಅನ್ನು ಇಟ್ಟುಕೊಳ್ಳಲು ಇಲಾಖೆ ಬಯಸುತ್ತದೆ.",
  "Waiting on one thing: a receipt for your rent claim.":
    "ಒಂದೇ ವಿಷಯಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ: ನಿಮ್ಮ ಬಾಡಿಗೆ ಕೋರಿಕೆಗೆ ಒಂದು ರಸೀದಿ.",
  "The account you chose can't receive the money.":
    "ನೀವು ಆರಿಸಿದ ಖಾತೆಗೆ ಹಣ ಬರಲು ಸಾಧ್ಯವಿಲ್ಲ.",
  "Held: your rent claim needs a receipt.":
    "ತಡೆಹಿಡಿಯಲಾಗಿದೆ: ನಿಮ್ಮ ಬಾಡಿಗೆ ಕೋರಿಕೆಗೆ ರಸೀದಿ ಬೇಕು.",
  "Your bank account was checked and failed.":
    "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಯಿತು, ಅದು ವಿಫಲವಾಯಿತು.",
  "The department is asking you to look again at your rent claim.":
    "ನಿಮ್ಮ ಬಾಡಿಗೆ ಕೋರಿಕೆಯನ್ನು ಮತ್ತೊಮ್ಮೆ ನೋಡುವಂತೆ ಇಲಾಖೆ ಕೇಳುತ್ತಿದೆ.",
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.":
    "ಷೇರು ಮಾರಾಟದಿಂದ ₹1,10,000 ಬಂದಿದೆ ಎಂದು Meridian Securities ವರದಿ ಮಾಡಿದೆ. ನಿಮ್ಮ ರಿಟರ್ನ್ ಅದನ್ನು ತೋರಿಸುತ್ತಿಲ್ಲ. ಇದು ಬಗೆಹರಿಯುವವರೆಗೆ ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣ ಅಲ್ಲೇ ಉಳಿಯುತ್ತದೆ.",
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.":
    "2019-20ರ ಒಂದು ಹಳೆಯ ಬೇಡಿಕೆಯನ್ನು ಈ ವರ್ಷ ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣದಿಂದ ಕಳೆಯಲಾಗುತ್ತಿದೆ. ಇದನ್ನು ನೀವು ಪ್ರಶ್ನಿಸಬಹುದು, 3ನೇ ತಾರೀಖಿನ ಮೊದಲು ಓದಿ ನೋಡಿ.",
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.":
    "ಸೆಪ್ಟೆಂಬರ್ 10ರೊಳಗೆ ನೀವು ಏನೂ ಹೇಳದಿದ್ದರೆ, ₹1,10,000 ನಿಮ್ಮ ಆದಾಯಕ್ಕೆ ಸೇರುತ್ತದೆ ಮತ್ತು ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣದಿಂದ ಸುಮಾರು ₹34,300 ಹೋಗುತ್ತದೆ.",
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.":
    "ಸೆಪ್ಟೆಂಬರ್ 3ರೊಳಗೆ ನೀವು ಏನೂ ಹೇಳದಿದ್ದರೆ, ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣದಿಂದ ₹18,740 ತೆಗೆಯಲಾಗುತ್ತದೆ ಮತ್ತು ವಿಷಯ ಮುಗಿದಂತೆ ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.",
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.":
    "ನೀವು ₹1,10,000 ಮೌಲ್ಯದ ಷೇರುಗಳನ್ನು ಮಾರಿದ್ದೀರಿ ಮತ್ತು ಅದರ ಲಾಭವನ್ನು ಘೋಷಿಸಿಲ್ಲ.",
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.":
    "₹1,10,000 ಎಂಬುದು ನಾನು ಮಾರಿದ ಎಲ್ಲದರ ಒಟ್ಟು ಮೌಲ್ಯ, ನಾನು ಗಳಿಸಿದ ಲಾಭ ಅಲ್ಲ. ಆ ವಹಿವಾಟುಗಳಲ್ಲಿ ನನಗೆ ₹4,200 ನಷ್ಟವಾಗಿದೆ. ವರ್ಷದ ನನ್ನ ಬ್ರೋಕರ್ ಹೇಳಿಕೆ ಕೊಂಡ ಬೆಲೆಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.",
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.":
    "2019-20ರ ವರ್ಷದಿಂದ ನಿಮ್ಮ ಮೇಲೆ ಇನ್ನೂ ₹18,740 ಬಾಕಿ ಇದೆ, ಹಾಗಾಗಿ ಅದನ್ನು ಈ ವರ್ಷ ನಿಮಗೆ ಬರಬೇಕಾದ ಹಣದಿಂದ ತೆಗೆಯಲಾಗುತ್ತದೆ.",
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.":
    "ನೀವು ₹60,000 ಬಾಡಿಗೆ ಕೋರಿದ್ದೀರಿ. ಅದನ್ನು ತೋರಿಸಲು ಏನೂ ಲಗತ್ತಾಗಿಲ್ಲ. ಒಂದು ರಸೀದಿ ಅಥವಾ ನಿಮ್ಮ ಮನೆ ಮಾಲೀಕರ ಹೆಸರು ಮತ್ತು PAN ಸೇರಿಸಿ, ಆಗ ಇದು ಮುಂದೆ ಸಾಗುತ್ತದೆ.",
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.":
    "Godavari Gramin Bank ಕಳೆದ ವರ್ಷ Deccan Union Bank ಜೊತೆ ಸೇರಿತು. ಖಾತೆ ಈಗಲೂ ಇದೆ — ಆದರೆ ಅದಕ್ಕೆ ಹಣ ಕಳುಹಿಸುವ ಕೋಡ್ ಇಲ್ಲ.",
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.":
    "80GG ಅಡಿಯಲ್ಲಿ ನೀವು ₹60,000 ಬಾಡಿಗೆ ಕೋರಿದ್ದೀರಿ, ಆದರೆ ಅದಕ್ಕೆ ಆಧಾರವಾಗಿ ಏನೂ ಲಗತ್ತಾಗಿಲ್ಲ.",
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.":
    "ನಾನು ಈ ಬಾಡಿಗೆಯನ್ನು ಕಟ್ಟಿದ್ದೇನೆ. ನನ್ನ ಮನೆ ಮಾಲೀಕರಿಂದ ಮಾಸಿಕ ರಸೀದಿಗಳು ನನ್ನ ಬಳಿ ಇವೆ, ಅವರ ಹೆಸರು ಮತ್ತು PAN ಕೊಡಬಲ್ಲೆ.",
  "This is not an accusation and there is no penalty yet. But your ₹34,800 stays where it is until you either back the claim up or withdraw it.":
    "ಇದು ಆರೋಪವಲ್ಲ, ಇನ್ನೂ ಯಾವ ದಂಡವೂ ಇಲ್ಲ. ಆದರೆ ನೀವು ಕೋರಿಕೆಗೆ ಆಧಾರ ಕೊಡುವವರೆಗೆ ಅಥವಾ ಅದನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳುವವರೆಗೆ ನಿಮ್ಮ ₹34,800 ಅಲ್ಲೇ ಉಳಿಯುತ್ತದೆ.",
  "Look at what they reported": "ಅವರು ವರದಿ ಮಾಡಿದ್ದನ್ನು ನೋಡಿ",
  "Read the 2019 demand": "2019ರ ಬೇಡಿಕೆಯನ್ನು ಓದಿ",
  "Add the receipt": "ರಸೀದಿಯನ್ನು ಸೇರಿಸಿ",
  "Point it at the right account": "ಸರಿಯಾದ ಖಾತೆಗೆ ತಿರುಗಿಸಿ",
  "Supervisor, garment unit": "ಮೇಲ್ವಿಚಾರಕಿ, ಗಾರ್ಮೆಂಟ್ ಘಟಕ",
  "Operations manager; trades equity on the side":
    "ಕಾರ್ಯಾಚರಣೆ ವ್ಯವಸ್ಥಾಪಕ; ಜೊತೆಗೆ ಷೇರು ವಹಿವಾಟು",
  "Junior architect; first time filing":
    "ಕಿರಿಯ ವಾಸ್ತುಶಿಲ್ಪಿ; ಮೊದಲ ಬಾರಿ ಸಲ್ಲಿಸುತ್ತಿದ್ದಾರೆ",
  "Independent Consultant": "ಸ್ವತಂತ್ರ ಸಲಹೆಗಾರ",
  "Primary School Teacher": "ಪ್ರಾಥಮಿಕ ಶಾಲಾ ಶಿಕ್ಷಕಿ",
  "Retired bank clerk": "ನಿವೃತ್ತ ಬ್ಯಾಂಕ್ ಗುಮಾಸ್ತ",
  "Retired": "ನಿವೃತ್ತ",
  "Teacher": "ಶಿಕ್ಷಕ",
  "You sent your return in.": "ನಿಮ್ಮ ರಿಟರ್ನ್ ಕಳುಹಿಸಿದ್ದೀರಿ.",
  "You confirmed it was you. The return counts from here.":
    "ಇದು ನೀವೇ ಎಂದು ಖಚಿತಪಡಿಸಿದ್ದೀರಿ. ರಿಟರ್ನ್ ಇಲ್ಲಿಂದ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತದೆ.",
  "In the queue with everything else filed that week.":
    "ಆ ವಾರ ಸಲ್ಲಿಕೆಯಾದ ಉಳಿದೆಲ್ಲದರ ಜೊತೆ ಸಾಲಿನಲ್ಲಿದೆ.",
  "Someone is looking at one figure.": "ಯಾರೋ ಒಂದು ಅಂಕಿಯನ್ನು ನೋಡುತ್ತಿದ್ದಾರೆ.",
  "A share-sale row your broker filed doesn't line up with your return.":
    "ನಿಮ್ಮ ಬ್ರೋಕರ್ ಸಲ್ಲಿಸಿದ ಷೇರು ಮಾರಾಟದ ಒಂದು ಸಾಲು ನಿಮ್ಮ ರಿಟರ್ನ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.",
  "OTP verified, 4 minutes after filing.":
    "ಸಲ್ಲಿಸಿದ 4 ನಿಮಿಷಗಳ ನಂತರ OTP ಪರಿಶೀಲನೆಯಾಯಿತು.",
  "₹60,000 claimed under 80GG with nothing attached to support it.":
    "80GG ಅಡಿಯಲ್ಲಿ ₹60,000 ಕೋರಲಾಗಿದೆ, ಆದರೆ ಅದಕ್ಕೆ ಆಧಾರವಾಗಿ ಏನೂ ಲಗತ್ತಾಗಿಲ್ಲ.",
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.":
    "Godavari Gramin Bank ಪರಿಶೀಲನೆಯನ್ನು ವಾಪಸ್ ಕಳುಹಿಸಿತು: IFSC GODG0004417 ಈಗ ಎಲ್ಲಿಗೂ ದಾರಿ ತೋರಿಸುವುದಿಲ್ಲ.",
  "OTP Verification Complete": "OTP ಪರಿಶೀಲನೆ ಪೂರ್ಣವಾಗಿದೆ",
  "Outstanding Compliance Notices": "ಬಾಕಿ ಇರುವ ಅನುಸರಣೆ ಸೂಚನೆಗಳು",
  "Draft Legal Response": "ಕಾನೂನು ಉತ್ತರದ ಕರಡು ಸಿದ್ಧಪಡಿಸಿ",
  "No Pending Actions": "ಬಾಕಿ ಇರುವ ಕೆಲಸಗಳಿಲ್ಲ",
  "Your account is fully compliant with no outstanding notices or tax demands.":
    "ನಿಮ್ಮ ಖಾತೆ ಸಂಪೂರ್ಣವಾಗಿ ಸರಿಯಾಗಿದೆ; ಬಾಕಿ ಸೂಚನೆಗಳಾಗಲಿ ತೆರಿಗೆ ಬೇಡಿಕೆಗಳಾಗಲಿ ಇಲ್ಲ.",
  "Actionable Assessment Holds": "ಸರಿಪಡಿಸಬಹುದಾದ ಮೌಲ್ಯಮಾಪನ ತಡೆಗಳು",
  "Upload Rent Agreement / Receipts": "ಬಾಡಿಗೆ ಒಪ್ಪಂದ / ರಸೀದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
  "Landlord Name": "ಮನೆ ಮಾಲೀಕರ ಹೆಸರು",
  "Landlord PAN (10 Digits)": "ಮನೆ ಮಾಲೀಕರ PAN (10 ಅಂಕಿ)",
  "Select PDF/JPG": "PDF/JPG ಆರಿಸಿ",
  "Submit Receipt": "ರಸೀದಿ ಸಲ್ಲಿಸಿ",
  "Response Position": "ಉತ್ತರದ ನಿಲುವು",
  "I Agree with Department": "ನಾನು ಇಲಾಖೆಯೊಂದಿಗೆ ಒಪ್ಪುತ್ತೇನೆ",
  "I Disagree (Submit Proof)": "ನಾನು ಒಪ್ಪುವುದಿಲ್ಲ (ಸಾಕ್ಷ್ಯ ಸಲ್ಲಿಸಿ)",
  "Response Statement (Draft)": "ಉತ್ತರದ ಹೇಳಿಕೆ (ಕರಡು)",
  "Dictate Statement": "ಹೇಳಿಕೆಯನ್ನು ಮಾತಿನಲ್ಲಿ ಹೇಳಿ",
  "Listening...": "ಕೇಳುತ್ತಿದೆ...",
  "Explain your disagreement or agreement...":
    "ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಅಥವಾ ಅಸಮ್ಮತಿಯನ್ನು ವಿವರಿಸಿ...",
  "Send Response": "ಉತ್ತರ ಕಳುಹಿಸಿ",
  "Cancel": "ರದ್ದು",
  "Validate Bank Code": "ಬ್ಯಾಂಕ್ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ",
  "Update Bank IFSC": "ಬ್ಯಾಂಕ್ IFSC ನವೀಕರಿಸಿ",
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.":
    "ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ದೃಢಪಡಿಸಲು 11 ಅಂಕಿಗಳ ಬ್ಯಾಂಕ್ ಮಾರ್ಗ ಸಂಕೇತವನ್ನು (IFSC) ಪರಿಶೀಲಿಸಿ.",
  "IFSC Code": "IFSC ಕೋಡ್",
};

/**
 * ᱥᱟᱱᱛᱟᱲᱤ (Santali). Typed against the English source dictionary.
 * Native Santali translation for CBDT AY 2026-27 compliance engine.
 */

import type { Dict } from "./en";
import { en } from "./en";

export const sat: Dict = {
  ...en,
  langName: "Santali",
  langNativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
  dir: "ltr",

  common: {
    modeSimple: "ᱟᱞᱜᱟ",
    modeDetailed: "ᱵᱤᱥᱛᱟᱹᱨ",
    continue: "ᱞᱟᱦᱟᱜ ᱢᱮ",
    back: "ᱛᱟᱭᱚᱢ",
    yesThatsRight: "ᱦᱮᱸ, ᱱᱚᱣᱟ ᱴᱷᱤᱠ ᱜᱮᱭᱟ",
    noThisIsWrong: "ᱵᱟᱝ, ᱱᱚᱣᱟ ᱵᱷᱩᱞ ᱜᱮᱭᱟ",
    iDontUnderstand: "ᱤᱧ ᱵᱟᱹᱧ ᱵᱩᱡᱷᱟᱹᱣ ᱞᱮᱫᱟ",
    close: "ᱵᱚᱸᱫᱽ ᱢᱮ",
    saveAndGoOn: "ᱥᱟᱸᱪᱟᱣ ᱠᱟᱛᱮ ᱞᱟᱦᱟᱜ ᱢᱮ",
    loading: "ᱢᱤᱫ ᱜᱷᱟᱹᱲᱤᱠ",
    logOut: "ᱞᱚᱜᱽ ᱟᱣᱩᱴ",
    undo: "ᱨᱩᱣᱟᱹᱲ",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ᱣᱟᱯᱥᱤ",
    subtitle: "ᱴᱮᱠᱥ ᱧᱮᱞ ᱟᱨ ᱯᱷᱟᱭᱤᱞ ᱨᱮᱱᱟᱜ ᱟᱞᱜᱟ ᱰᱟᱦᱟᱨ",
    independent: "ᱯᱷᱩᱨᱜᱟᱹᱞ ᱯᱨᱚᱴᱚᱴᱟᱭᱤᱯ",
    taxYear: "ᱴᱮᱠᱥ ᱥᱮᱨᱢᱟ 2026-27",
    language: "ᱯᱟᱹᱨᱥᱤ",
    light: "ᱞᱟᱭᱤᱴ",
    dark: "ᱰᱟᱨᱠ",
    sandbox: "ᱨᱤᱵᱷᱤᱣ ᱥᱟᱫᱷᱚᱱ",
    skipToContent: "ᱢᱩᱬᱩᱛ ᱡᱤᱱᱤᱥ ᱛᱮ ᱪᱟᱞᱟᱜ ᱢᱮ",
  },

  validate: {
    panTooShort: (n: number) => `ᱱᱤᱛᱚᱜ ${n} ᱟᱠᱷᱚᱨ ᱢᱮᱱᱟᱜ-ᱟ᱾ PAN ᱨᱮ 10 ᱛᱟᱦᱮᱸᱱᱟ᱾`,
    panShape: "PAN ᱨᱮ ᱯᱩᱭᱞᱩ ᱢᱚᱬᱮ ᱜᱚᱴᱟᱝ ᱟᱠᱷᱚᱨ, ᱛᱟᱭᱚᱢ ᱯᱩᱱᱭᱟᱹ ᱮᱞ ᱟᱨ ᱢᱤᱫ ᱟᱠᱷᱚᱨ — ᱡᱮᱞᱮᱠ DEMPS4417K.",
    panSandboxHint: "ᱟᱢᱟᱜ ᱰᱮᱴᱟ ᱵᱽᱨᱟᱣᱡᱚᱨ ᱠᱷᱚᱱ ᱵᱟᱦᱨᱮ ᱵᱟᱝ ᱪᱟᱞᱟᱜ-ᱟ᱾",
    ifscTooShort: (n: number) => `ᱱᱤᱛᱚᱜ ${n} ᱟᱠᱷᱚᱨ ᱢᱮᱱᱟᱜ-ᱟ᱾ IFSC ᱨᱮ 11 ᱛᱟᱦᱮᱸᱱᱟ᱾`,
    ifscShape: "IFSC ᱨᱮ ᱯᱩᱭᱞᱩ ᱯᱩᱱᱭᱟᱹ ᱟᱠᱷᱚᱨ, ᱢᱤᱫ ᱥᱩᱱ, ᱛᱟᱭᱚᱢ ᱛᱩᱨᱩᱭ ᱮᱞ — ᱡᱮᱞᱮᱠ DECU0834471.",
  },

  landing: {
    question: "ᱪᱮᱫ ᱤᱱᱠᱚᱢ ᱴᱮᱠᱥ ᱰᱤᱯᱟᱨᱴᱢᱮᱱᱴ ᱴᱷᱮᱱ ᱟᱢᱟᱜ ᱴᱟᱠᱟ ᱵᱟᱹᱠᱤ ᱢᱮᱱᱟᱜ-ᱟ?",
    subtext: "ᱱᱚᱸᱰᱮ ᱦᱤᱡᱩᱜ ᱠᱟᱱ ᱵᱟᱹᱲᱛᱤ ᱦᱚᱲ ᱫᱚ ᱴᱮᱠᱥ ᱮᱢ ᱵᱟᱝ ᱦᱩᱭᱩᱜ-ᱟ — ᱩᱱᱠᱩ ᱫᱚ ᱨᱤᱯᱷᱟᱸᱰ ᱧᱟᱢᱟ᱾ ᱟᱢᱟᱜ PAN ᱮᱢ ᱢᱮ᱾",
    panLabel: "ᱟᱢᱟᱜ PAN",
    panHelp: "ᱜᱮᱞ ᱜᱚᱴᱟᱝ ᱟᱠᱷᱚᱨ, PAN ᱠᱟᱨᱰ ᱠᱷᱚᱱ",
    panPlaceholder: "ᱡᱮᱞᱮᱠ, DEMPS4417K",
    check: "ᱤᱧᱟᱜ ᱨᱤᱯᱷᱟᱸᱰ ᱧᱮᱞ ᱢᱮ",
    orTryAs: "ᱥᱮ ᱯᱮᱭᱟ ᱦᱚᱲ ᱢᱩᱫᱽ ᱨᱮ ᱢᱤᱫ ᱦᱚᱲ ᱞᱮᱠᱟ ᱧᱮᱞ ᱢᱮ",
    honestyLink: "ᱱᱚᱸᱰᱮ ᱪᱮᱫ ᱥᱟᱹᱨᱤ ᱟᱨ ᱪᱮᱫ ᱯᱨᱚᱴᱚᱴᱟᱭᱤᱯ",
    architectureLink: "ᱴᱮᱠᱱᱤᱠᱟᱞ ᱨᱩᱯ",
    badge: "ᱟᱞᱜᱟ ᱨᱤᱴᱚᱨᱱ, ᱯᱩᱥᱴᱟᱹᱣ",
    brandTitle: "ᱟᱢᱟᱜ ᱴᱟᱠᱟ, ᱨᱩᱣᱟᱹᱲ ᱦᱤᱡᱩᱜ ᱨᱮᱱᱟᱜ ᱰᱟᱦᱟᱨ᱾",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  login: {
    ...en.login,
    authVerifying: "ᱥᱚᱨᱵᱷᱚᱨ ᱠᱷᱚᱱ ᱧᱮᱞ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ…",
    authUnreachable: "ᱥᱟᱭᱤᱱ-ᱤᱱ ᱥᱚᱨᱵᱷᱚᱨ ᱥᱟᱶ ᱡᱚᱲᱟᱣ ᱵᱟᱝ ᱦᱩᱭ ᱞᱮᱱᱟ᱾ ᱛᱟᱭᱚᱢ ᱛᱮ ᱪᱮᱥᱴᱟᱭ ᱢᱮ᱾",
    authRejected: (detail: string) => `ᱥᱚᱨᱵᱷᱚᱨ ᱵᱟᱭ ᱵᱟᱛᱟᱣ ᱞᱮᱫᱟ: ${detail}`,
    signedInAs: "ᱥᱟᱭᱤᱱ-ᱤᱱ ᱦᱩᱭᱮᱱᱟ — ᱥᱮᱥᱚᱱ ᱪᱟᱹᱞᱩ ᱢᱮᱱᱟᱜ-ᱟ",
    otpSentTo: (mobile: string) => `ᱟᱞᱮ ${mobile} ᱨᱮ ᱢᱤᱫ ᱠᱳᱰ ᱞᱮ ᱠᱩᱞ ᱠᱮᱫᱟ`,
    otpLabel: "ᱛᱩᱨᱩᱭ ᱮᱞᱟᱱ OTP ᱠᱳᱰ",
    weWillWait: "ᱩᱥᱟᱹᱨᱟ ᱵᱟᱹᱱᱩᱜ-ᱟ᱾ ᱠᱳᱰ ᱛᱟᱺᱜᱤ ᱚᱠᱛᱚ ᱟᱢᱟᱜ ᱰᱮᱴᱟ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱟᱦᱮᱸᱱᱟ᱾",
    resend: "ᱟᱨᱦᱚᱸ ᱠᱩᱞ ᱢᱮ",
    resendIn: (seconds: number) => `${seconds} ᱥᱮᱠᱮᱸᱰ ᱛᱟᱭᱚᱢ ᱟᱨᱦᱚᱸ ᱠᱚᱭ ᱫᱟᱲᱮᱭᱟᱜ-ᱟᱢ`,
    mockNotice: "ᱱᱚᱣᱟ ᱫᱚ ᱯᱨᱚᱴᱚᱴᱟᱭᱤᱯ ᱠᱟᱱᱟ, ᱠᱳᱰ ᱫᱚ ᱥᱠᱨᱤᱱ ᱨᱮᱜᱮ ᱢᱮᱱᱟᱜ-ᱟ (949494)᱾",
    portalHeading: "ᱤ-ᱯᱷᱟᱭᱤᱞᱤᱝ ᱯᱩᱥᱴᱟᱹᱣ",
  },
};

export const satMock: Record<string, string> = {};

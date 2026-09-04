/**
 * মৈতৈলোন্ (Manipuri). Typed against the English source dictionary.
 * Native Manipuri translation for CBDT AY 2026-27 compliance engine.
 */

import type { Dict } from "./en";
import { en } from "./en";

export const mni: Dict = {
  ...en,
  langName: "Manipuri",
  langNativeName: "মৈতৈলোন্",
  dir: "ltr",

  common: {
    modeSimple: "লাইবা",
    modeDetailed: "অকুপ্পা",
    continue: "মখা চত্থবা",
    back: "হন্দোকপা",
    yesThatsRight: "হোই, অসি অচুম্বনি",
    noThisIsWrong: "নত্তে, অসি লাল্লি",
    iDontUnderstand: "ঐহাক খঙদে",
    close: "থিংলাগনু / থিংজিনবা",
    saveAndGoOn: "শেভ তৌদুনা মখা চত্থবা",
    loading: "খরা ঙাইবিয়ু",
    logOut: "লোগ আউত",
    undo: "অমুক হঞ্জিনবা",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "ৱাপসী",
    subtitle: "তেক্স যেংবা অমসুং ফাইল তৌবগী লাইবা পাম্বৈ",
    independent: "ইন্দিপেন্দেন্ত প্রোতোটাইপ",
    taxYear: "তেক্স চহি 2026-27",
    language: "লোল",
    light: "লাইত",
    dark: "দার্ক",
    sandbox: "রিভিউ তুলস",
    skipToContent: "মরুওইবা ৱাফমদা চত্থবা",
  },

  validate: {
    panTooShort: (n: number) => `হৌজিক ফাওবদা ময়েক ${n} সুরি। PAN দা 10 লৈ।`,
    panShape: "PAN দা অহানবা ময়েক মঙা, মদুগী মতুংদা মশীং মরি অমসুং ময়েক অমা য়াওই — খুদম DEMPS4417K.",
    panSandboxHint: "নহাক্না ইরিবশিং অসি ব্রাউজরদগী মপান্দা চত্থদে। প্রোতোটাইপ অসিদা PAN খুদিংমক DEMP না হৌই।",
    ifscTooShort: (n: number) => `ময়েক ${n} সুরি। বেঙ্ক কোদতা 11 য়াওগদবনি।`,
    ifscShape: "IFSC কোদতা অহানবা ময়েক মরি, 0 অমা অমসুং মশীং তরুক য়াওই — খুদম DECU0834471.",
  },

  landing: {
    question: "ইনকম তেক্স দিপার্তমেন্ততা নহাক্কী শেল লৈহৌরব্রা?",
    subtext: "মফমসিদা লাক্লিবা মীওই কয়ামরুমদি তেক্স থীগদবা লৈতে — রিফন্দ ফংগদবনি। নহাক্কী PAN চংহনবীয়ু, ঐখোয়না তাক্কনি।",
    panLabel: "নহাক্কী PAN",
    panHelp: "ময়েক তরা, নহাক্কী PAN কার্দতগী",
    panPlaceholder: "খুদম, DEMPS4417K",
    check: "ঐহাক্কী রিফন্দ য়েংবা",
    orTryAs: "নত্রগা মীওই অহুমগী মনুংদগী অমা ওইনা য়েংবা",
    honestyLink: "মফমসিদা করি অচুম্বনো করি প্রোতোটাইপনো",
    architectureLink: "তেক্নিকেল আর্কিতেকচর",
    badge: "লাইবা রিতর্ন, ভেরিফাই তৌরবা",
    brandTitle: "নহাক্কী শেল, অমুক হল্লকপগী লম্বীদা।",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  login: {
    ...en.login,
    authVerifying: "সর্ভরদগী ভেরিফাই তৌরি…",
    authUnreachable: "সাইন-ইন সর্ভরদা য়ৌবা ঙমদ্রে। খরা লৈরাগ অমুক হোৎনবীয়ু।",
    authRejected: (detail: string) => `সর্ভরনা সাইন-ইন য়াদে: ${detail}`,
    signedInAs: "সাইন-ইন তৌরে — সেসন হৌরে",
    otpSentTo: (mobile: string) => `ঐখোয়না ${mobile} দা কোদ অমা থারক্লে`,
    otpLabel: "মশীং তরুক্কী OTP কোদ",
    weWillWait: "ৱাবা লৈতে। কোদ ঙাইরিঙৈদা নহাক্কী দেতা মাংলোই।",
    resend: "অমুক থারকউ",
    resendIn: (seconds: number) => `সেকেন্দ ${seconds} গী মতুংদা অমুক থাবা য়াগনি`,
    mockNotice: "মসি প্রোতোটাইপ অমনি, কোদ অসি স্ক্রিন্দা উবা ফংই (949494)।",
    portalHeading: "ই-ফাইলিং ভেরিফিকেসন",
  },
};

export const mniMock: Record<string, string> = {};

/**
 * کٲشُر (Kashmiri). Typed against the English source dictionary.
 * Native Kashmiri translation for CBDT AY 2026-27 compliance engine.
 */

import type { Dict } from "./en";
import { en } from "./en";

export const ks: Dict = {
  ...en,
  langName: "Kashmiri",
  langNativeName: "کٲشُر",
  dir: "rtl",

  common: {
    modeSimple: "سادہ",
    modeDetailed: "تفصیلی",
    continue: "بروٛنہہ گژھِو",
    back: "واپس",
    yesThatsRight: "اہن، یہ چھُ پۆز",
    noThisIsWrong: "نہٕ، یہ چھُ غلط",
    iDontUnderstand: "میہ نہٕ آو یہ سمجھ",
    close: "بند کٔرِو",
    saveAndGoOn: "محفوظ کٔرِو تہٕ بروٛنہہ گژھِو",
    loading: "اکھ لمہٕ",
    logOut: "لاگ آوٹ",
    undo: "پھِرِتھ ہِیوٚو",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "واپسی",
    subtitle: "ٹیکس جانچ تہٕ فائلنگُک آسان طریقہٕ",
    independent: "آزاد پروٹوٹائپ",
    taxYear: "ٹیکس وری 2026-27",
    language: "زبان",
    light: "لائٹ",
    dark: "ڈارک",
    sandbox: "ریویو ٹولز",
    skipToContent: "اہم موادس پؠٹھ گژھِو",
  },

  validate: {
    panTooShort: (n: number) => `از تام چھِ ${n} اکھر۔ PAN مَنٛز چھِ آسان 10۔`,
    panShape: "PAN مَنٛز چھِ گوڈٕنِکی پٲنژھ اکھر، پتہٕ ژور نمبر، تہٕ اکھ اکھر — مِثال DEMPS4417K۔",
    panSandboxHint: "تُہُند ڈیٹا چھُ برٛاؤزرس مَنٛز ہی محفوظ روزان۔",
    ifscTooShort: (n: number) => `از تام چھِ ${n} اکھر۔ IFSC مَنٛز چھِ 11 آسان۔`,
    ifscShape: "IFSC مَنٛز چھِ گوڈٕ ژور اکھر، اکھ زیرو، تہٕ پتہٕ شیٚہ نمبر — مِثال DECU0834471۔",
  },

  landing: {
    question: "کیا انکم ٹیکس محکمَس نِش چھا تُہُند پونٛسہٕ رُکتھ؟",
    subtext: "یتین ینہٕ والیٚن زیٛادٕ تر لوکن چھُ نہٕ کینٛہہ دیُن آسان — تمن چھُ ریفنڈ مِلان۔ پنُن PAN دَرٕج کٔرِو۔",
    panLabel: "تُہُند PAN",
    panHelp: "دَہ اکھر، تُہندِس PAN کارڈ پؠٹھٕ",
    panPlaceholder: "مِثال، DEMPS4417K",
    check: "میون ریفنڈ وُچھِو",
    orTryAs: "یا ترٛؠن نمونہٕ لوکن مَنٛز اکھ بنِتھ وُچھِو",
    honestyLink: "یتین کیا چھُ پۆز تہٕ کیا پروٹوٹائپ",
    architectureLink: "تکنیکی خاکہٕ",
    badge: "سادہ ریٹرن، تصدیق شُدہ",
    brandTitle: "تُہُند پونٛسہٕ، واپس یِنُک سفر۔",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  login: {
    ...en.login,
    authVerifying: "سرور تصدیق چالو چھِ…",
    authUnreachable: "سرورس سٟتؠ رابطہٕ نہٕ گوٚو۔ واریاہ کالس پتہٕ کوشش کٔرِو۔",
    authRejected: (detail: string) => `سرورَن کٔر رد: ${detail}`,
    signedInAs: "سائن اِن سپد — سیشن چالو چھُ",
    otpSentTo: (mobile: string) => `اسہِ سوز ${mobile} پؠٹھ اکھ کوڈ`,
    otpLabel: "شیٚن ہِندن ہُنٛد OTP کوڈ",
    weWillWait: "کانٛہہ جلدی چھانہٕ۔ تُہنٛز معلومات چھِ محفوظ۔",
    resend: "دوبارہ سوزِو",
    resendIn: (seconds: number) => `${seconds} سیکنڈ پتہٕ ہؠکِو دوبارہ منٛگِتھ`,
    mockNotice: "یہ چھُ اکھ پروٹوٹائپ، کوڈ چھُ سکرینَس پؠٹھ (949494)۔",
    portalHeading: "ای-فائلنگ تصدیق",
  },
};

export const ksMock: Record<string, string> = {};

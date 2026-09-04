/**
 * कोंकणी (Konkani). Typed against the English source dictionary.
 * Native Konkani translation for CBDT AY 2026-27 compliance engine.
 */

import type { Dict } from "./en";
import { en } from "./en";

export const kok: Dict = {
  ...en,
  langName: "Konkani",
  langNativeName: "कोंकणी",
  dir: "ltr",

  common: {
    modeSimple: "सोपें",
    modeDetailed: "विस्तारीत",
    continue: "फुडें वचा",
    back: "फाटीં",
    yesThatsRight: "हय, हें सारकें आसा",
    noThisIsWrong: "ना, हें चूक आसा",
    iDontUnderstand: "म्हाका हें समजलें ना",
    close: "बंद करात",
    saveAndGoOn: "सांबाळात आनी फुडें वचात",
    loading: "एक खीण",
    logOut: "लॉग आउट",
    undo: "फाटीं घेयात",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "वापसी",
    subtitle: "तपासणी आनी फायलिंगाची सोपी वाट",
    independent: "स्वतंत्र प्रोटोटायप",
    taxYear: "कर वर्स 2026-27",
    language: "भास",
    light: "लाईट",
    dark: "डार्क",
    sandbox: "रिव्ह्यू साधनांक",
    skipToContent: "मुख्यांत वचात",
  },

  validate: {
    panTooShort: (n: number) => `आतां ${n} अक्षरां आसात. PAN मध्ये 10 आसतात.`,
    panShape: "PAN मध्ये पयलीं पांच अक्षरां, उपरांत चार आंकडे आनी एक अक्षर आसता — जशें DEMPS4417K.",
    panSandboxHint: "तुम्ही बरयतात तें तुमच्या ब्राउझरा भायर वचना. ह्या प्रोटोटायपांत दरेक PAN DEMP ने सुरू जाता.",
    ifscTooShort: (n: number) => `आतां ${n} अक्षरां आसात. बँक कोडात 11 आसतात.`,
    ifscShape: "बँक कोडांत पयलीं चार अक्षरां, एक शून्य आनी स आंकडे आसतात — जशें DECU0834471.",
  },

  landing: {
    question: "आयकर विभागा कडेन तुमचे पयशे उरल्यात?",
    subtext: "हांगा येवपी चडशा लोकांक कर भरचो पडना — तांकाં रिफंड मेळटा. तुमचो PAN घालाત, आमी हिशोब दाखयतले.",
    panLabel: "तुमचो PAN",
    panHelp: "धा अक्षरां, तुमच्या PAN कार्डा वयलीं",
    panPlaceholder: "जशें, DEMPS4417K",
    check: "म्हाका कितલો रिफंड मेळटलो तें पळयात",
    orTryAs: "किंवा तीन डेमो व्यक्तींपैकी एक म्हणून पळयात",
    honestyLink: "हांगा कितें खरें आसा आनी कितें प्रोटोटायप",
    architectureLink: "तांत्रिक रचणूक",
    badge: "सोपें रिटर्न, प्रमाणित",
    brandTitle: "तुमचे पयशे, परतून येवपाच्या मार्गार.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  login: {
    ...en.login,
    authVerifying: "सर्व्हर तपासणी चालू आसा…",
    authUnreachable: "सर्व्हराक जोडप जावंक ना. थोड्या वेळान परतून यत्न करात.",
    authRejected: (detail: string) => `सर्व्हरान साईन-ईन न्हयकारलें: ${detail}`,
    signedInAs: "साईन-ईन जालें — सत्र सुरू आसा",
    otpSentTo: (mobile: string) => `आमी ${mobile} चेર एक कोड धाडला`,
    otpLabel: "स आंकड्यांचो OTP कोड",
    weWillWait: "कागाळ ना. कोड येसर तुमची माहिती सुरक्षीत आसा.",
    resend: "परतून धाडाત",
    resendIn: (seconds: number) => `${seconds} सेकंदां उपरांत परतून मागूં येता`,
    mockNotice: "हो प्रोटोटायप आसा, देखून कोड स्क्रिनारच दाखयला (949494).",
    portalHeading: "ई-फायलिंग पडताळणी",
  },
};

export const kokMock: Record<string, string> = {};

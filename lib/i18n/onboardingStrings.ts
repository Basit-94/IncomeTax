/**
 * Strings for the v3 onboarding — the three screens that ask only what never changes
 * (2026-09-07). English and Hindi are written by hand; the other 21 languages fall through
 * to English until translated, the same arrangement `portalTranslations.ts` uses for the
 * rebuilt sign-in. The legacy `t.onboarding` keys stay in every dictionary untouched.
 */

import type { Lang } from "../types";

export interface OnboardingStrings {
  eyebrow: string;
  stepOf: (current: number, total: number) => string;
  // O1
  languageQuestion: string;
  languageHelp: string;
  // O2
  identityBubble: string;
  identityTitle: string;
  identityHelp: string;
  linkDigiLocker: string;
  linkDigiLockerDetail: string;
  fillMyself: string;
  fillMyselfDetail: string;
  consentTitle: string;
  consentItems: string[];
  consentYes: string;
  consentNo: string;
  reading: string;
  readFailed: string;
  fromPanRecord: string;
  /** Shown under the name when the locker answered: nobody types their legal name (user, 2026-09-09). */
  nameFromDigiLocker: string;
  fromAadhaar: string;
  fromSignUp: string;
  locked: string;
  edit: string;
  addressLabel: string;
  mobileLabel: string;
  emailLabel: string;
  residencyLabel: string;
  residencyResident: string;
  residencyNri: string;
  residencyRnor: string;
  thatsMe: string;
  sampleNote: string;
  // O3
  refundBubble: string;
  refundTitle: string;
  refundHelp: string;
  refundAccountLabel: string;
  preValidated: string;
  noAccounts: string;
  addAccount: string;
  bankNameLabel: string;
  accountLast4Label: string;
  ifscLabel: string;
  detailLabel: string;
  modeSimple: string;
  modeSimpleDetail: string;
  modeFull: string;
  modeFullDetail: string;
  standingToggle: string;
  standingHelp: string;
  representativeLabel: string;
  representativeNameLabel: string;
  representativeCapacityLabel: string;
  disabilityLabel: string;
  disabilityNone: string;
  disability40: string;
  disability80: string;
  saveProfile: string;
  savedLocally: string;
  nothingYearly: string;
  back: string;
  continue: string;
}

const en: OnboardingStrings = {
  eyebrow: "Your profile",
  stepOf: (c, t) => `${c} of ${t}`,
  languageQuestion: "Which language should we use?",
  languageHelp: "You can switch it any time from the header.",
  identityBubble: "Pehle aap ko pehchaan loon. DigiLocker se PAN aur Aadhaar ki details le loon? Sirf yeh — is saal ke kaagaz baad mein, aapki permission se.",
  identityTitle: "This is you",
  identityHelp: "Your PAN record is the one thing typed. Everything else here is read once and never asked again.",
  linkDigiLocker: "Link DigiLocker and read my PAN record",
  linkDigiLockerDetail: "Name · date of birth · masked Aadhaar · address — nothing else today",
  fillMyself: "I'll fill address and contact myself",
  fillMyselfDetail: "Name and PAN still come from your record",
  consentTitle: "Read these from DigiLocker?",
  consentItems: ["PAN record — name, date of birth", "Aadhaar — masked number, address", "Pre-validated bank accounts"],
  consentYes: "Yes, read them",
  consentNo: "Not now",
  reading: "Reading your record…",
  readFailed: "DigiLocker did not answer. Your PAN record is filled in; add the rest yourself.",
  fromPanRecord: "PAN record",
  nameFromDigiLocker: "Your full legal name, read from your PAN record in DigiLocker — you never have to type it.",
  fromAadhaar: "Aadhaar",
  fromSignUp: "Sign-up",
  locked: "Locked",
  edit: "Edit",
  addressLabel: "Address",
  mobileLabel: "Mobile",
  emailLabel: "Email",
  residencyLabel: "Resident of India for tax",
  residencyResident: "Yes, resident",
  residencyNri: "Non-resident (NRI)",
  residencyRnor: "Resident but not ordinarily resident",
  thatsMe: "That's me",
  sampleNote: "Sample record from the DigiLocker mock, not your real data.",
  refundBubble: "Refund kahan bhejna hai, aur main kitna detail mein baat karoon?",
  refundTitle: "Refunds, and how you like to work",
  refundHelp: "Both stay the same year after year. Each April, Munshi ji only checks the account is still right.",
  refundAccountLabel: "Refund account",
  preValidated: "pre-validated",
  noAccounts: "No pre-validated account on record yet.",
  addAccount: "Add another account",
  bankNameLabel: "Bank",
  accountLast4Label: "Last 4 digits",
  ifscLabel: "IFSC",
  detailLabel: "How much do you want to see?",
  modeSimple: "Do it for me",
  modeSimpleDetail: "Plain words, one step at a time.",
  modeFull: "Show me everything",
  modeFullDetail: "Every figure, every rule, every calculation, up front.",
  standingToggle: "Anything standing about you?",
  standingHelp: "Rare, and valid for years: filing for someone else, or a disability certificate.",
  representativeLabel: "I file as someone's representative",
  representativeNameLabel: "Whose return",
  representativeCapacityLabel: "In what capacity",
  disabilityLabel: "Disability certificate",
  disabilityNone: "None",
  disability40: "40% to 79%",
  disability80: "80% or more",
  saveProfile: "Save my profile",
  savedLocally: "Kept in this browser in this prototype; nothing here has a tax year attached.",
  nothingYearly: "Employer, salary, rent, deductions and the regime are this year's business — Munshi ji asks about them when you start the return.",
  back: "Back",
  continue: "Continue",
};

const hi: Partial<OnboardingStrings> = {
  eyebrow: "आपकी प्रोफ़ाइल",
  stepOf: (c, t) => `${t} में ${c}`,
  languageQuestion: "कौन-सी भाषा इस्तेमाल करें?",
  languageHelp: "हेडर से कभी भी बदल सकते हैं।",
  identityTitle: "यह आप हैं",
  identityHelp: "PAN रिकॉर्ड ही एक चीज़ है जो टाइप की गई। बाकी सब एक बार पढ़ा जाता है और फिर कभी नहीं पूछा जाता।",
  linkDigiLocker: "DigiLocker जोड़ें और मेरा PAN रिकॉर्ड पढ़ें",
  linkDigiLockerDetail: "नाम · जन्मतिथि · मास्क्ड आधार · पता — आज बस इतना",
  fillMyself: "पता और संपर्क मैं खुद भरूँगा",
  fillMyselfDetail: "नाम और PAN फिर भी आपके रिकॉर्ड से आएंगे",
  consentTitle: "DigiLocker से ये पढ़ें?",
  consentItems: ["PAN रिकॉर्ड — नाम, जन्मतिथि", "आधार — मास्क्ड नंबर, पता", "पूर्व-सत्यापित बैंक खाते"],
  consentYes: "हाँ, पढ़ें",
  consentNo: "अभी नहीं",
  reading: "आपका रिकॉर्ड पढ़ रहे हैं…",
  readFailed: "DigiLocker से जवाब नहीं आया। PAN रिकॉर्ड भर दिया है; बाकी आप खुद जोड़ दें।",
  fromPanRecord: "PAN रिकॉर्ड",
  nameFromDigiLocker: "आपका पूरा कानूनी नाम, DigiLocker में आपके PAN रिकॉर्ड से लिया गया — टाइप करने की ज़रूरत नहीं।",
  fromAadhaar: "आधार",
  fromSignUp: "साइन-अप",
  locked: "लॉक",
  edit: "बदलें",
  addressLabel: "पता",
  mobileLabel: "मोबाइल",
  emailLabel: "ईमेल",
  residencyLabel: "कर के लिए भारत के निवासी",
  residencyResident: "हाँ, निवासी",
  residencyNri: "अनिवासी (NRI)",
  residencyRnor: "निवासी पर सामान्यतः निवासी नहीं",
  thatsMe: "यह मैं हूँ",
  sampleNote: "DigiLocker मॉक का नमूना रिकॉर्ड, आपका असली डेटा नहीं।",
  refundTitle: "रिफंड, और आप कैसे काम करना चाहते हैं",
  refundHelp: "दोनों साल-दर-साल वही रहते हैं। हर अप्रैल मुंशी जी बस खाता जाँच लेते हैं।",
  refundAccountLabel: "रिफंड खाता",
  preValidated: "पूर्व-सत्यापित",
  noAccounts: "अभी कोई पूर्व-सत्यापित खाता रिकॉर्ड में नहीं।",
  addAccount: "दूसरा खाता जोड़ें",
  bankNameLabel: "बैंक",
  accountLast4Label: "अंतिम 4 अंक",
  ifscLabel: "IFSC",
  detailLabel: "आप कितना देखना चाहते हैं?",
  modeSimple: "मेरे लिए कर दो",
  modeSimpleDetail: "सादे शब्द, एक-एक कदम।",
  modeFull: "सब दिखाओ",
  modeFullDetail: "हर आंकड़ा, हर नियम, हर गणना, सामने।",
  standingToggle: "आपके बारे में कुछ स्थायी?",
  standingHelp: "दुर्लभ, और सालों तक मान्य: किसी और के लिए फाइल करना, या दिव्यांगता प्रमाणपत्र।",
  representativeLabel: "मैं किसी के प्रतिनिधि के रूप में फाइल करता हूँ",
  representativeNameLabel: "किसका रिटर्न",
  representativeCapacityLabel: "किस हैसियत से",
  disabilityLabel: "दिव्यांगता प्रमाणपत्र",
  disabilityNone: "नहीं",
  disability40: "40% से 79%",
  disability80: "80% या अधिक",
  saveProfile: "प्रोफ़ाइल सहेजें",
  savedLocally: "इस प्रोटोटाइप में इसी ब्राउज़र में रखा गया; यहाँ किसी चीज़ पर कर-वर्ष नहीं है।",
  nothingYearly: "नियोक्ता, वेतन, किराया, कटौतियाँ और व्यवस्था इस साल की बातें हैं — रिटर्न शुरू करते ही मुंशी जी पूछेंगे।",
  back: "पीछे",
  continue: "आगे",
};

const BY_LANG: Partial<Record<Lang, Partial<OnboardingStrings>>> = { hi };

export function getOnboardingStrings(lang: Lang): OnboardingStrings {
  return { ...en, ...(BY_LANG[lang] ?? {}) };
}

/** Languages whose onboarding copy is written, not inherited from English. */
export const ONBOARDING_STRINGS_WRITTEN: readonly Lang[] = ["en", "hi"];

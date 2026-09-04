/**
 * ગુજરાતી (Gujarati). Typed against the English source dictionary.
 *
 * Full native Gujarati translation for CBDT AY 2026-27 compliance engine.
 * Digits stay Latin for monetary legibility across India.
 */

import type { Dict } from "./en";
import { en } from "./en";

export const gu: Dict = {
  ...en,
  langName: "Gujarati",
  langNativeName: "ગુજરાતી",
  dir: "ltr",

  common: {
    modeSimple: "સરળ",
    modeDetailed: "વિગતવાર",
    continue: "આગળ વધો",
    back: "પાછા",
    yesThatsRight: "હા, આ સાચું છે",
    noThisIsWrong: "ના, આ ખોટું છે",
    iDontUnderstand: "મને આ સમજાયું નથી",
    close: "બંધ કરો",
    saveAndGoOn: "સાચવો અને આગળ વધો",
    loading: "એક ક્ષણ",
    logOut: "લૉગ આઉટ",
    undo: "પૂર્વવત કરો",
  },

  shell: {
    productName: "Wapsi",
    productNativeName: "વાપસી",
    subtitle: "તપાસ અને ફાઇલિંગની સરળ રીત",
    independent: "સ્વતંત્ર પ્રોટોટાઇપ",
    taxYear: "કર વર્ષ 2026-27",
    language: "ભાષા",
    light: "લાઇટ",
    dark: "ડાર્ક",
    sandbox: "રિવ્યૂ ટૂલ્સ",
    skipToContent: "મુખ્ય સામગ્રી પર જાઓ",
  },

  validate: {
    panTooShort: (n: number) => `અત્યારે ${n} અક્ષરો છે. PAN માં 10 હોય છે.`,
    panShape: "PAN માં પહેલા પાંચ અક્ષરો, પછી ચાર અંકો અને છેલ્લે એક અક્ષર હોય છે — જેમ કે DEMPS4417K.",
    panSandboxHint: "તમે જે દાખલ કરો છો તે તમારા બ્રાઉઝરની બહાર જતું નથી. આ પ્રોટોટાઇપમાં દરેક PAN DEMP થી શરૂ થાય છે.",
    ifscTooShort: (n: number) => `અત્યારે ${n} અક્ષરો છે. બેંક કોડમાં 11 હોય છે.`,
    ifscShape: "બેંક IFSC કોડમાં પહેલા ચાર અક્ષરો, પછી એક શૂન્ય અને છ અંકો હોય છે — જેમ કે DECU0834471.",
  },

  landing: {
    question: "શું આવકવેરા વિભાગ પાસે તમારા નાણાં અટવાયેલા છે?",
    subtext: "અહીં આવતા મોટાભાગના કરદાતાઓએ કંઈ ચૂકવવાનું હોતું નથી — તેમને રિફંડ મળવાનું હોય છે. તમારો PAN દાખલ કરો, અમે ગણતરી બતાવીશું.",
    panLabel: "તમારો PAN",
    panHelp: "દસ અક્ષરો, તમારા PAN કાર્ડ પરથી",
    panPlaceholder: "જેમ કે, DEMPS4417K",
    check: "મારું કેટલું રિફંડ બાકી છે તે જુઓ",
    orTryAs: "અથવા ત્રણ ડેમો કરદાતાઓમાંથી એક તરીકે જુઓ",
    honestyLink: "અહીં શું વાસ્તવિક છે અને શું સિમ્યુલેટેડ",
    architectureLink: "ટેકનિકલ માળખું",
    badge: "સરળ રિટર્ન, પ્રમાણિત",
    brandTitle: "તમારા નાણાં, પરત આવવાની રાહ પર.",
    lensCaption: "LENS / WAVEFORM SIMULATION v4.5.0",
  },

  personas: {
    sunita: {
      phase: "ફાઇલ કરવું",
      blurb: "તેમના પગારમાંથી ₹8,400 TDS કપાયો હતો. કોઈ વધારાનો કર બાકી નથી, હજુ રિટર્ન ફાઇલ કર્યું નથી.",
      action: "પહેલેથી ઉપલબ્ધ વિગતો ચકાસો",
    },
    rakesh: {
      phase: "નોટિસ પ્રાપ્ત થઈ",
      blurb: "શેર બજારના નફા અંગે વિસંગતતા નોટિસ આવી છે. જૂની માંગણી સામે રિફંડ રોકવામાં આવ્યું છે.",
      action: "વાંચો અને અસંમતિ નોંધાવો",
    },
    priya: {
      phase: "પ્રતીક્ષા",
      blurb: "71 દિવસ પહેલા ફાઇલ કર્યું હતું. હજુ પણ પ્રક્રિયા હેઠળ બતાવે છે. વિસંગતતાનું નિરાકરણ જરૂરી છે.",
      action: "અટકેલું કારણ શોધો",
    },
    custom: {
      phase: "કસ્ટમ પ્રોફાઇલ",
      blurbTitle: "નવી પ્રોફાઇલ",
      blurb: "શરૂઆતથી નવો કરદાતા બનાવો — આવક, કપાતો અને કપાયેલ TDS દાખલ કરી ગણતરી જુઓ.",
      action: "નવો ડ્રાફ્ટ બનાવો",
    },
  },

  login: {
    ...en.login,
    authVerifying: "સર્વર ચકાસણી ચાલુ છે…",
    authUnreachable: "ઓથેન્ટિકેશન સર્વરનો સંપર્ક થઈ શક્યો નથી. થોડી વારમાં પુનઃ પ્રયાસ કરો.",
    authRejected: (detail: string) => `સર્વરે સાઇન-ઇન સ્વીકાર્યું નથી: ${detail}`,
    signedInAs: "સફળ સાઇન-ઇન — સત્ર સક્રિય છે",
    otpSentTo: (mobile: string) => `અમે ${mobile} પર વેરિફિકેશન કોડ મોકલ્યો છે`,
    otpLabel: "છ-અંકનો OTP કોડ",
    weWillWait: "કોઈ ઉતાવળ નથી. OTP ની રાહ જોતી વખતે તમારી વિગતો સુરક્ષિત છે.",
    resend: "ફરીથી મોકલો",
    resendIn: (seconds: number) => `${seconds} સેકન્ડ પછી ફરીથી વિનંતી કરી શકશો`,
    mockNotice: "આ ડેમો પ્રોટોટાઇપ છે, તેથી કોડ સ્ક્રીન પર જ દર્શાવેલ છે (949494).",
    portalHeading: "ઈ-ફાઇલિંગ સત્યાપન પોર્ટલ",
  },

  onboarding: {
    ...en.onboarding,
    eyebrow: "શરૂ કરતા પહેલા",
    title: "અમે આને તમારા માટે ગોઠવી આપીએ.",
    intro: "પાંચ સરળ પ્રશ્નો અમને સાચી ભાષા, ગતિ અને પ્રશ્નો પસંદ કરવામાં મદદ કરશે. તમે તેને પછી પણ બદલી શકો છો.",
    languageQuestion: "કઈ ભાષા પસંદ કરશો?",
    languageHelp: "આ સૌથી પહેલો પ્રશ્ન છે. તમે તેને ગમે ત્યારે બદલી શકો છો.",
    intentQuestion: "આજે તમારો મુખ્ય ઉદ્દેશ્ય શું છે?",
    intentHelp: "અમે તે કામને સૌથી આગળ રાખીશું.",
    intentOptions: {
      file_return: {
        label: "આ વર્ષનું રિટર્ન ફાઇલ કરવું છે",
        detail: "તમારી ઉપલબ્ધ વિગતો ચકાસીને AY 2026-27 નું રિટર્ન સબમિટ કરવું છે.",
      },
      check_refund: {
        label: "રિફંડ મળવાપાત્ર છે કે નહીં તે જોવું છે",
        detail: "કેટલો ટેક્સ કપાયો અને શું પાછું આવી શકે છે તે જુઓ.",
      },
      understand_notice: {
        label: "નોટિસ કે પત્ર સમજવો છે",
        detail: "કલમ 143(1) અથવા 139(9) હેઠળ શું કાર્યવાહી કરવી તે જાણો.",
      },
      correct_prefill: {
        label: "ખોટી વિગત સુધારવી છે",
        detail: "આવક કે TDS ની વિસંગતતા નોંધી સુધારો કરો.",
      },
    },
    intentCta: {
      file_return: "રિટર્ન ફાઇલિંગ શરૂ કરો",
      check_refund: "રિફંડ તપાસો",
      understand_notice: "નોટિસ તપાસો",
      correct_prefill: "વિગતો ચકાસો",
    },
    professionLabel: "તમારો વ્યવસાય કેવો છે?",
    professionOptions: {
      salaried: "નોકરી",
      self_employed: "ફ્રીલાન્સ કે સ્વરોજગાર",
      business_owner: "વેપાર / બિઝનેસ",
      student: "વિદ્યાર્થી",
      retired: "નિવૃત્ત",
      investor: "રોકાણકાર",
      other: "અન્ય",
    },
    filingHistoryLabel: "શું તમે પહેલાં ઇન્કમ ટેક્સ રિટર્ન ફાઇલ કર્યું છે?",
    filingHistoryOptions: {
      never: "ના, પ્રથમ વખત",
      once: "એક કે બે વાર",
      every_year: "દર વર્ષે",
    },
  },

  footer: {
    prototype: "સ્વતંત્ર પ્રોટોટાઇપ.",
    notAffiliated: "આવકવેરા વિભાગ, CBDT અથવા ભારત સરકાર સાથે જોડાયેલ નથી. અહીંની તમામ માહિતી ડેમો હેતુ માટે છે. કોઈ લાઈવ સરકારી સિસ્ટમનો સંપર્ક થતો નથી.",
    honestyLink: "વાસ્તવિક અને મોક વચ્ચેનો તફાવત જુઓ",
  },
};

export const guMock: Record<string, string> = {};

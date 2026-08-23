/**
 * தமிழ். Typed against the English source, so this file cannot fall behind it.
 *
 * Same caveat as Hindi, and it matters more here: Sunita is the persona whose
 * whole story is that the real portal never spoke to her. Shipping her
 * approximate Tamil would be a smaller version of the same failure, so the
 * limitation is stated on /honesty instead of being papered over.
 *
 * Digits stay Latin, for the same reason as in Hindi — money must be legible
 * at a glance before anything else on the screen is.
 */

import type { Dict } from "./en";

export const ta: Dict = {
  langName: "Tamil",
  langNativeName: "தமிழ்",
  dir: "ltr",

  common: {
    continue: "தொடரவும்",
    back: "பின்செல்",
    yesThatsRight: "ஆம், இது சரி",
    noThisIsWrong: "இல்லை, இது தவறு",
    iDontUnderstand: "இது எனக்குப் புரியவில்லை",
    close: "மூடு",
    saveAndGoOn: "சேமித்துத் தொடரவும்",
    loading: "ஒரு நிமிடம்",
  },

  landing: {
    question: "வருமான வரித் துறையில் உங்கள் பணம் நிற்கிறதா?",
    subtext:
      "இங்கு வருபவர்களில் பெரும்பாலானோர் எதுவும் செலுத்த வேண்டியதில்லை — அவர்களுக்குத்தான் திரும்பக் கிடைக்க வேண்டும். உங்கள் PAN-ஐ உள்ளிடுங்கள், என்ன நிற்கிறது என்று சொல்கிறோம்.",
    panLabel: "உங்கள் PAN",
    panHelp: "உங்கள் PAN அட்டையில் உள்ள பத்து எழுத்துகள்",
    check: "எனக்கு எவ்வளவு வர வேண்டும் என்று பாருங்கள்",
    orTryAs: "அல்லது மூன்று நபர்களில் ஒருவராகப் பார்க்கலாம்",
    honestyLink: "இதில் எது உண்மை, எது கற்பனை",
  },

  login: {
    otpSentTo: (mobile: string) =>
      `${mobile} எண்ணுக்கு ஒரு குறியீட்டை அனுப்பியுள்ளோம்`,
    otpLabel: "ஆறு இலக்கக் குறியீடு",
    weWillWait:
      "அவசரம் இல்லை. குறியீட்டுக்குக் காத்திருக்கும்போது நீங்கள் நிரப்பியது எதுவும் அழியாது.",
    resend: "மீண்டும் அனுப்பு",
    resendIn: (seconds: number) => `${seconds} வினாடிகளில் மீண்டும் கேட்கலாம்`,
    mockNotice:
      "இது ஒரு முன்மாதிரி, எனவே குறியீடு திரையிலேயே காட்டப்படுகிறது. உண்மையான தகவல் எதுவும் அனுப்பப்படுவதில்லை.",
  },

  file: {
    heading: (amount: string) => `உங்களுடைய ${amount} துறையில் நிற்கிறது`,
    subheading:
      "கீழே உள்ள கிட்டத்தட்ட எல்லாமே உங்களைப் பற்றி ஏற்கனவே தெரிவிக்கப்பட்டவை. படித்துப் பாருங்கள், தவறு இருந்தால் சொல்லுங்கள்.",

    checkThis: "இதைச் சரிபாருங்கள் — நிரப்ப வேண்டியதில்லை",
    reportedBy: (reporter: string, date: string) =>
      `${reporter} இதை ${date} அன்று துறைக்குத் தெரிவித்தது`,
    underIdentifier: (identifier: string) => `பதிவு ${identifier}`,
    onlyTheyCanFix: (reporter: string) =>
      `இது தவறாக இருந்தால், மூலப் பதிவில் ${reporter} மட்டுமே இதை மாற்ற முடியும். அவர்களிடம் என்ன கேட்க வேண்டும் என்று நாங்கள் சொல்கிறோம்.`,

    whatYouEarned: "நீங்கள் ஈட்டியது",
    whatWasDeducted: "ஏற்கனவே பிடித்த வரி",
    whereMoneyGoes: "பணம் எங்கு செல்லும்",
    whoYouAre: "நீங்கள் யார்",

    disputeHeading: "இதில் என்ன இருக்க வேண்டும்?",
    disputeAmountLabel: "சரியான தொகை",
    disputeReasonLabel: "இது ஏன் தவறு",
    disputeSave: "இதைத் தவறு என்று குறியிடு",

    outcomeOwesNothing: "நீங்கள் எதுவும் செலுத்த வேண்டியதில்லை.",
    outcomeRefund: (amount: string) =>
      `${amount} உங்களுக்குத் திரும்பக் கிடைக்கும்.`,
    outcomeOwes: (amount: string) => `${amount} செலுத்த வேண்டியிருக்கிறது.`,
    confirmAndFile: "இதை அனுப்பு",

    verifyHeading: "இன்னும் ஒரு படி மட்டும் — இல்லையெனில் இது கணக்கில் வராது.",
    verifyBody:
      "இது நீங்கள்தான் என்று உறுதிப்படுத்தும் வரை உங்கள் அறிக்கை தாக்கல் செய்யப்பட்டதாகக் கருதப்படாது — அனுப்பாததற்குச் சமம். இதற்கு சுமார் இருபது வினாடிகள் மட்டுமே.",
    verifyAction: "இது நான்தான் என உறுதிப்படுத்து",

    voicePrompt: "அல்லது பேசியே சொல்லுங்கள்",
    voiceListening: "கேட்கிறோம்",
    voiceUnsupported:
      "இந்த ஃபோனின் உலாவி இன்னும் கேட்க முடியாது. நீங்கள் எழுதியே சொல்லலாம் — எதுவும் அழியாது.",
  },

  refund: {
    heading: (amount: string) => `${amount} உங்களை நோக்கி வருகிறது`,
    filedDaysAgo: (days: number) =>
      `நீங்கள் ${days} நாட்களுக்கு முன்பு அனுப்பினீர்கள்`,

    holdsHeading: (n: number) =>
      n === 1
        ? "ஒரே ஒரு விஷயத்திற்குக் காத்திருக்கிறது"
        : `${n} விஷயங்களுக்குக் காத்திருக்கிறது`,
    clearsInDays: (days: number) =>
      days === 1
        ? "அது முடிந்ததும் சுமார் ஒரு நாள்"
        : `அது முடிந்ததும் சுமார் ${days} நாட்கள்`,

    cohortWindow: (from: number, to: number) =>
      `உங்கள் அதே வாரத்தில் அனுப்பப்பட்ட அறிக்கைகள் இப்போது பரிசீலிக்கப்படுகின்றன. ${from} முதல் ${to} நாட்கள் ஆகலாம்.`,

    states: {
      not_filed: "இன்னும் அனுப்பப்படவில்லை",
      filed_unverified: "அனுப்பப்பட்டது, உங்கள் உறுதிப்படுத்தல் பாக்கி",
      verified: "நீங்கள் உறுதிப்படுத்திவிட்டீர்கள்",
      in_queue: "வரிசையில்",
      under_review: "ஒருவர் இதைப் பார்க்கிறார்",
      determined: "தீர்மானிக்கப்பட்டது",
      sent_to_bank: "உங்கள் வங்கிக்கு அனுப்பப்பட்டது",
      credited: "உங்கள் கணக்கில் வந்துவிட்டது",
      failed: "உங்கள் கணக்கை அடைய முடியவில்லை",
    },

    bankFailedHeading: "நீங்கள் தேர்ந்தெடுத்த கணக்கில் பணம் வர முடியாது.",
    bankMergedInto: (bank: string) => `அந்தக் கிளை இப்போது ${bank}-இன் பகுதி`,
    useThisAccount: "இதற்குப் பதிலாக இங்கு அனுப்பு",
  },

  notices: {
    heading: "துறையிலிருந்து வந்த கடிதங்கள்",
    none: "எதுவும் திரும்பி வரவில்லை. அதுவே நல்லது.",
    respondBy: (date: string) => `${date} வரை பதில் அளிக்கவும்`,
    ifYouDoNothing: "நீங்கள் எதுவும் செய்யாவிட்டால்",
    basedOn: "இது எதன் அடிப்படையில்",
    theCatch: "இதில் அவர்கள் தவறவிட்டது",
    agree: "இது சரி",
    disagree: "இது தவறு",
    dinLabel: "இந்தக் கடிதத்தின் குறிப்பு எண்",
    dinExplain:
      "துறையின் ஒவ்வொரு கடிதத்திலும் இந்த எண் இருக்க வேண்டும். அது இல்லாவிட்டால் அந்தக் கடிதம் அதிகாரப்பூர்வமாக இல்லாததாகவே கருதப்படும்.",
    neverReceived: "இதைப் பற்றி எனக்கு எந்த அறிவிப்பும் வரவில்லை",
  },

  footer: {
    prototype: "தனிப்பட்ட கருத்து முன்மாதிரி.",
    notAffiliated:
      "இது வருமான வரித் துறை, CBDT அல்லது இந்திய அரசுடன் தொடர்புடையது அல்ல, அவர்களால் அனுமதிக்கப்பட்டதும் அல்ல. இங்குள்ள ஒவ்வொரு பெயர், PAN, தொகை மற்றும் ஆவணமும் கற்பனையானது. எந்த அரசு அமைப்புடனும் தொடர்பு கொள்ளப்படுவதில்லை.",
    honestyLink: "எது உண்மை, எது கற்பனை என்று பாருங்கள்",
  },
};

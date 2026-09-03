import type { Lang } from "./types";

export interface LandingActionCard {
  id: "file_return" | "match_records" | "tax_optimizer" | "pay_tax" | "notices" | "status_history" | "tax_calendar";
  number: string;
  title: string;
  subtitle: string;
  replaces: string;
  badge: string;
  highlight?: boolean;
}

export function getLandingCards(lang: Lang): LandingActionCard[] {
  if (lang === "hi") {
    return [
      {
        id: "file_return",
        number: "01",
        title: "रिटर्न दाखिल या समीक्षा करें",
        subtitle: "सटीक तथ्यों के साथ रिटर्न तैयार करने और दाखिल करने की एकीकृत प्रणाली।",
        replaces: "फॉर्म 16 आयात और रिटर्न दाखिल",
        badge: "ITR-1 / फॉर्म 16",
      },
      {
        id: "match_records",
        number: "02",
        title: "सरकारी रिकॉर्ड का मिलान करें",
        subtitle: "CBDT फीडबैक कोड के साथ फॉर्म 16, 26AS और AIS डेटा का पूर्ण मिलान।",
        replaces: "AIS, 26AS और TDS मिलान",
        badge: "AIS · 26AS · TDS",
      },
      {
        id: "tax_optimizer",
        number: "03",
        title: "टैक्स और रिजीम ऑप्टिमाइज़र",
        subtitle: "धारा 87A मार्जिनल रिलीफ के साथ पुरानी बनाम नई कर व्यवस्था की त्वरित गणना।",
        replaces: "पुरानी बनाम नई कर व्यवस्था",
        badge: "New vs Old · 87A",
        highlight: true,
      },
      {
        id: "pay_tax",
        number: "04",
        title: "बकाया टैक्स का भुगतान करें",
        subtitle: "तुरंत UPI QR कोड के साथ धारा 140A के तहत स्व-निर्धारण कर भुगतान।",
        replaces: "चालान 280 और ई-पे टैक्स",
        badge: "चालान 280 · UPI",
      },
      {
        id: "notices",
        number: "05",
        title: "नोटिस और त्रुटि निवारण",
        subtitle: "धारा 143(1)(a) और 139(9) के नोटिसों के लिए स्वचालित कानूनी उत्तर।",
        replaces: "ई-प्रोसीडिंग्स और नोटिस उत्तर",
        badge: "धारा 143(1) व 139(9)",
      },
      {
        id: "status_history",
        number: "06",
        title: "रिटर्न स्थिति और इतिहास",
        subtitle: "दाखिल रिटर्न, ई-वेरिफिकेशन और रिफंड क्रेडिट का एकीकृत लाइफसाइकिल ट्रैकर।",
        replaces: "रिफंड स्थिति और ITR-V",
        badge: "रिफंड · ITR-V",
      },
      {
        id: "tax_calendar",
        number: "07",
        title: "टैक्स कैलेंडर और समय सीमा",
        subtitle: "अग्रिम कर की किस्तों, अंतिम तारीखों और ब्याज दंडों का समयबद्ध ट्रैकर।",
        replaces: "अग्रिम कर और महत्वपूर्ण तिथियां",
        badge: "अग्रिम कर · समय सीमा",
        highlight: true,
      },
    ];
  }

  return [
    {
      id: "file_return",
      number: "01",
      title: "File or Review Return",
      subtitle: "Unified facts-first return builder and submission pipeline.",
      replaces: "File return, Form 16 ingestion",
      badge: "ITR-1 / Form 16",
    },
    {
      id: "match_records",
      number: "02",
      title: "Match Official Records",
      subtitle: "Reconciles Form 16, 26AS, and AIS data with CBDT feedback codes.",
      replaces: "Match records, TDS match, AIS/26AS",
      badge: "AIS · 26AS · TDS",
    },
    {
      id: "tax_optimizer",
      number: "03",
      title: "Tax & Regime Optimizer",
      subtitle: "Real-time reactive calculation with Section 87A marginal relief.",
      replaces: "Tax calc, Old vs. New, HRA",
      badge: "Old vs. New · 87A",
      highlight: true,
    },
    {
      id: "pay_tax",
      number: "04",
      title: "Pay Tax Due",
      subtitle: "Self-assessment payment u/s 140A with instant simulated UPI QR codes.",
      replaces: "Challan 280, e-Pay Tax",
      badge: "Challan 280 · UPI",
    },
    {
      id: "notices",
      number: "05",
      title: "Notices & Defect Resolver",
      subtitle: "Automated defense drafter for Section 143(1)(a) and 139(9) notices.",
      replaces: "Respond to a letter, e-Proceedings",
      badge: "Sec 143(1)(a) & 139(9)",
    },
    {
      id: "status_history",
      number: "06",
      title: "Return Status & History",
      subtitle: "Unified lifecycle tracker for past filings, verification, and refunds.",
      replaces: "Refund status, e-Verify, ITR-V, History",
      badge: "Refund & ITR-V",
    },
    {
      id: "tax_calendar",
      number: "07",
      title: "Tax Calendar & Deadlines",
      subtitle: "Integrated milestone tracker for statutory dates and penalty cutoffs.",
      replaces: "Tax calendar, Advance-tax dates",
      badge: "Advance Tax · Cutoffs",
      highlight: true,
    },
  ];
}

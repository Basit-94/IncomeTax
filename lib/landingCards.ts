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

type CardDictionary = Record<
  LandingActionCard["id"],
  {
    title: string;
    subtitle: string;
    replaces: string;
    badge: string;
  }
>;

const CARDS_BY_LANG: Partial<Record<Lang, CardDictionary>> = {
  hi: {
    file_return: {
      title: "रिटर्न दाखिल या समीक्षा करें",
      subtitle: "सटीक तथ्यों के साथ रिटर्न तैयार करने और दाखिल करने की एकीकृत प्रणाली।",
      replaces: "फॉर्म 16 आयात और रिटर्न दाखिल",
      badge: "ITR-1 / फॉर्म 16",
    },
    match_records: {
      title: "सरकारी रिकॉर्ड का मिलान करें",
      subtitle: "CBDT फीडबैक कोड के साथ फॉर्म 16, 26AS और AIS डेटा का पूर्ण मिलान।",
      replaces: "AIS, 26AS और TDS मिलान",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "टैक्स और रिजीम ऑप्टिमाइज़र",
      subtitle: "धारा 87A मार्जिनल रिलीफ के साथ पुरानी बनाम नई कर व्यवस्था की त्वरित गणना।",
      replaces: "पुरानी बनाम नई कर व्यवस्था",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "बकाया टैक्स का भुगतान करें",
      subtitle: "तुरंत UPI QR कोड के साथ धारा 140A के तहत स्व-निर्धारण कर भुगतान।",
      replaces: "चालान 280 और ई-पे टैक्स",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "नोटिस और त्रुटि निवारण",
      subtitle: "धारा 143(1)(a) और 139(9) के नोटिसों के लिए स्वचालित कानूनी उत्तर।",
      replaces: "ई-प्रोसीडिंग्स और नोटिस उत्तर",
      badge: "धारा 143(1) व 139(9)",
    },
    status_history: {
      title: "रिटर्न स्थिति और इतिहास",
      subtitle: "दाखिल रिटर्न, ई-वेरिफिकेशन और रिफंड क्रेडिट का एकीकृत लाइफसाइकिल ट्रैकर।",
      replaces: "रिफंड स्थिति और ITR-V",
      badge: "रिफंड · ITR-V",
    },
    tax_calendar: {
      title: "टैक्स कैलेंडर और समय सीमा",
      subtitle: "अग्रिम कर की किस्तों, अंतिम तारीखों और ब्याज दंडों का समयबद्ध ट्रैकर।",
      replaces: "अग्रिम कर और महत्वपूर्ण तिथियां",
      badge: "अग्रिम कर · समय सीमा",
    },
  },
  gu: {
    file_return: {
      title: "રિટર્ન ફાઇલ અથવા સમીક્ષા કરો",
      subtitle: "ચોક્કસ તથ્યો સાથે રિટર્ન તૈયાર કરવા અને દાખલ કરવાની એકીકૃત સિસ્ટમ.",
      replaces: "ફોર્મ 16 આયાત અને રિટર્ન ફાઇલિંગ",
      badge: "ITR-1 / ફોર્મ 16",
    },
    match_records: {
      title: "સત્તાવાર સરકારી રેકોર્ડ્સ સરખાવો",
      subtitle: "CBDT ફીડબેક કોડ્સ સાથે ફોર્મ 16, 26AS અને AIS ડેટાનું સંપૂર્ણ સમાધાન.",
      replaces: "AIS, 26AS અને TDS મિલાન",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "કર અને કર વ્યવસ્થા ઑપ્ટિમાઇઝર",
      subtitle: "કલમ 87A રિલીફ સાથે જૂની વિરુદ્ધ નવી કર વ્યવસ્થાની તુલના.",
      replaces: "જૂની vs નવી વ્યવસ્થા",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "બાકી કર ચૂકવો",
      subtitle: "ઇન્સ્ટન્ટ UPI QR કોડ સાથે કલમ 140A હેઠળ સ્વ-આકારણી કર ચુકવણી.",
      replaces: "ચલણ 280 અને e-Pay Tax",
      badge: "ચલણ 280 · UPI",
    },
    notices: {
      title: "નોટિસ અને ખામી નિવારણ",
      subtitle: "કલમ 143(1)(a) અને 139(9) ની નોટિસો માટે કાયદાકીય પ્રત્યુત્તર.",
      replaces: "ઈ-કાર્યવાહી અને નોટિસ ઉત્તર",
      badge: "કલમ 143(1) & 139(9)",
    },
    status_history: {
      title: "રિટર્ન સ્થિતિ અને ઇતિહાસ",
      subtitle: "ફાઇલ કરેલ રિટર્ન, ઈ-વેરિફિકેશન અને રિફંડ ટ્રેકર.",
      replaces: "રિફંડ સ્થિતિ અને ITR-V",
      badge: "રિફંડ · ITR-V",
    },
    tax_calendar: {
      title: "કર કેલેન્ડર અને અંતિમ મુદતો",
      subtitle: "એડવાન્સ ટેક્સ હપ્તાઓ અને કાયદાકીય સમયમર્યાદાઓનું ટ્રેકર.",
      replaces: "એડવાન્સ ટેક્સ મુદત",
      badge: "એડવાન્સ ટેક્સ · કટઓફ",
    },
  },
  ta: {
    file_return: {
      title: "வரி தாக்கல் & மதிப்பாய்வு",
      subtitle: "துல்லியமான உண்மைகளுடன் வருமான வரி படிவம் தயாரிக்கும் ஒருங்கிணைந்த தளம்.",
      replaces: "படிவம் 16 இறக்குமதி & தாக்கல்",
      badge: "ITR-1 / படிவம் 16",
    },
    match_records: {
      title: "அரசு பதிவுகளை ஒப்பிடுக",
      subtitle: "படிவம் 16, 26AS மற்றும் AIS பதிவுகளை துல்லியமாக சரிபார்க்கவும்.",
      replaces: "AIS, 26AS & TDS ஒப்பீடு",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "வரி & விதிமுறை உகப்பாக்கி",
      subtitle: "பிரிவு 87A தள்ளுபடியுடன் பழைய மற்றும் புதிய வரி திட்ட ஒப்பீடு.",
      replaces: "பழைய vs புதிய முறை",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "நிலுவை வரி செலுத்துக",
      subtitle: "உடனடி UPI QR குறியீடு மூலம் பிரிவு 140A சுய மதிப்பீட்டு வரி செலுத்துதல்.",
      replaces: "சலான் 280 & e-Pay Tax",
      badge: "சலான் 280 · UPI",
    },
    notices: {
      title: "அறிவிப்புகள் & குறைபாடுகள்",
      subtitle: "பிரிவு 143(1)(a) மற்றும் 139(9) அறிவிப்புகளுக்கு தன்னியக்க பதில்.",
      replaces: "மின் நடவடிக்கைகள் & பதில்கள்",
      badge: "பிரிவு 143(1) & 139(9)",
    },
    status_history: {
      title: "தாக்கல் நிலை & வரலாறு",
      subtitle: "தாக்கல் செய்யப்பட்ட வரி, மின் சரிபார்ப்பு மற்றும் ரீஃபண்ட் நிலை கண்காணிப்பு.",
      replaces: "ரீஃபண்ட் நிலை & ITR-V",
      badge: "ரீஃபண்ட் · ITR-V",
    },
    tax_calendar: {
      title: "வரி நாட்காட்டி & காலக்கெடு",
      subtitle: "முன்பண வரி தவணைகள் மற்றும் சட்டப்பூர்வ தேதிகள் கண்காணிப்பு.",
      replaces: "முன்பண வரி தேதிகள்",
      badge: "முன்பண வரி · காலக்கெடு",
    },
  },
  te: {
    file_return: {
      title: "రిటర్న్ దాఖలు లేదా సమీక్షించండి",
      subtitle: "ఖచ్చితమైన వివరాలతో పన్ను రిటర్న్ సిద్ధం చేసుకునే సమీకృత వ్యవస్థ.",
      replaces: "ఫారమ్ 16 & రిటర్న్ దాఖలు",
      badge: "ITR-1 / ఫారమ్ 16",
    },
    match_records: {
      title: "ప్రభుత్వ రికార్డులను సరిపోల్చండి",
      subtitle: "ఫారమ్ 16, 26AS మరియు AIS డేటాను CBDT ఫీడ్‌బ్యాక్‌తో సరిపోల్చండి.",
      replaces: "AIS, 26AS & TDS సరిపోలిక",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "పన్ను విధాన ఆప్టిమైజర్",
      subtitle: "సెక్షన్ 87A ఉపశమనంతో పాత vs కొత్త పన్ను విధానాల తక్షణ గణన.",
      replaces: "పాత vs కొత్త విధానం",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "పన్ను బకాయి చెల్లించండి",
      subtitle: "తక్షణ UPI QR కోడ్‌తో సెక్షన్ 140A స్వయం-అంచనా పన్ను చెల్లింపు.",
      replaces: "చలాన్ 280 & ఇ-పే టాక్స్",
      badge: "చలాన్ 280 · UPI",
    },
    notices: {
      title: "నోటీసులు & లోపాల పరిష్కారం",
      subtitle: "సెక్షన్ 143(1)(a) మరియు 139(9) నోటీసులకు చట్టపరమైన సమాధానాలు.",
      replaces: "ఇ-ప్రొసీడింగ్స్ & సమాధానాలు",
      badge: "సెక్షన్ 143(1) & 139(9)",
    },
    status_history: {
      title: "రిటర్న్ స్థితి & చరిత్ర",
      subtitle: "దాఖలు చేసిన రిటర్న్, ఇ-ధృవీకరణ మరియు రీఫండ్ క్రెడిట్ ట్రాకర్.",
      replaces: "రీఫండ్ స్థితి & ITR-V",
      badge: "రీఫండ్ · ITR-V",
    },
    tax_calendar: {
      title: "పన్ను క్యాలెండర్ & గడువులు",
      subtitle: "అడ్వాన్స్ టాక్స్ వాయిదాలు మరియు కీలక తేదీల ట్రాకర్.",
      replaces: "అడ్వాన్స్ టాక్స్ గడువులు",
      badge: "అడ్వాన్స్ టాక్స్ · గడువులు",
    },
  },
  bn: {
    file_return: {
      title: "রিটার্ন দাখিল বা পর্যালোচনা করুন",
      subtitle: "সঠিক তথ্যের সাথে রিটার্ন তৈরি ও জমা দেওয়ার সমন্বিত ব্যবস্থা।",
      replaces: "ফর্ম 16 আমদানি ও রিটার্ন দাখিল",
      badge: "ITR-1 / ফর্ম 16",
    },
    match_records: {
      title: "সরকারি রেকর্ড মেলান",
      subtitle: "ফর্ম 16, 26AS এবং AIS তথ্যের পূর্ণ সমন্বয় ও যাচাইকরণ।",
      replaces: "AIS, 26AS ও TDS মিলান",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ট্যাক্স ও রেজিম অপটিমাইজার",
      subtitle: "ধারা 87A ছাড় সহ পুরনো বনাম নতুন কর ব্যবস্থার তাৎক্ষণিক তুলনা।",
      replaces: "পুরনো vs নতুন কর ব্যবস্থা",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "বকেয়া কর পরিশোধ করুন",
      subtitle: "তাৎক্ষণিক UPI QR কোড সহ ধারা 140A স্ব-নির্ধারণী কর প্রদান।",
      replaces: "চালান 280 ও ই-পে ট্যাক্স",
      badge: "চালান 280 · UPI",
    },
    notices: {
      title: "নোটিশ ও ত্রুটি নিষ্পত্তি",
      subtitle: "ধারা 143(1)(a) এবং 139(9) নোটিশের স্বয়ংক্রিয় আইনি উত্তর।",
      replaces: "ই-কার্যপ্রণালী ও উত্তর",
      badge: "ধারা 143(1) ও 139(9)",
    },
    status_history: {
      title: "রিটার্ন স্থিতি ও ইতিহাস",
      subtitle: "দাখিলকৃত রিটার্ন, ই-ভেরিফিকেশন ও রিফান্ড ট্র্যাকার।",
      replaces: "রিফান্ড স্থিতি ও ITR-V",
      badge: "রিফান্ড · ITR-V",
    },
    tax_calendar: {
      title: "ট্যাক্স ক্যালেন্ডার ও সময়সীমা",
      subtitle: "অগ্রিম করের কিস্তি ও বিধিবদ্ধ তারিখসমূহের নির্দেশক।",
      replaces: "অগ্রিম করের তারিখ",
      badge: "অগ্রিম কর · সময়সীমা",
    },
  },
  mr: {
    file_return: {
      title: "रिटर्न दाखल किंवा पुनरावलोकन करा",
      subtitle: "अचूक तथ्यांसह रिटर्न तयार करण्याची आणि सादर करण्याची एकात्मिक प्रणाली.",
      replaces: "फॉर्म 16 आयात आणि रिटर्न दाखल",
      badge: "ITR-1 / फॉर्म 16",
    },
    match_records: {
      title: "अधिकृत सरकारी नोंदींची पडताळणी",
      subtitle: "फॉर्म 16, 26AS आणि AIS डेटाचे CBDT कोडसह अचूक जुळवणी.",
      replaces: "AIS, 26AS आणि TDS जुळवणी",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "कर आणि करप्रणाली ऑप्टिमायझर",
      subtitle: "कलम 87A सूट सह जुनी विरुद्ध नवीन करप्रणालीची त्वरित तुलना.",
      replaces: "जुनी vs नवीन करप्रणाली",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "थकबाकी कर भरा",
      subtitle: "त्वरित UPI QR कोडद्वारे कलम 140A अन्वये स्व-मूल्यांकन कर भरणा.",
      replaces: "चलन 280 आणि ई-पे टॅक्स",
      badge: "चलन 280 · UPI",
    },
    notices: {
      title: "नोटीस आणि त्रुटी निवारण",
      subtitle: "कलम 143(1)(a) आणि 139(9) च्या नोटिसांना कायदेशीर उत्तरे.",
      replaces: "ई-कार्यवाही आणि उत्तरे",
      badge: "कलम 143(1) & 139(9)",
    },
    status_history: {
      title: "रिटर्न स्थिती आणि इतिहास",
      subtitle: "दाखल केलेले रिटर्न, ई-पडताळणी आणि परतावा ट्रॅकर.",
      replaces: "परतावा स्थिती आणि ITR-V",
      badge: "परतावा · ITR-V",
    },
    tax_calendar: {
      title: "कर दिनदर्शिका आणि अंतिम मुदत",
      subtitle: "आगाऊ कर हप्ते आणि कायदेशीर तारखांचा वेळापत्रक ट्रॅकर.",
      replaces: "आगाऊ कर अंतिम मुदत",
      badge: "आगाऊ कर · मुदत",
    },
  },
  kn: {
    file_return: {
      title: "ರಿಟರ್ನ್ ಸಲ್ಲಿಸಿ ಅಥವಾ ಪರಿಶೀಲಿಸಿ",
      subtitle: "ನಿಖರವಾದ ವಿವರಗಳೊಂದಿಗೆ ಆದಾಯ ತೆರಿಗೆ ರಿಟರ್ನ್ ಸಿದ್ಧಪಡಿಸುವ ಸಮಗ್ರ ವ್ಯವಸ್ಥೆ.",
      replaces: "ಫಾರ್ಮ್ 16 ಆಮದು & ಸಲ್ಲಿಕೆ",
      badge: "ITR-1 / ಫಾರ್ಮ್ 16",
    },
    match_records: {
      title: "ಸರ್ಕಾರಿ ದಾಖಲೆಗಳನ್ನು ತಾಳೆ ನೋಡಿ",
      subtitle: "ಫಾರ್ಮ್ 16, 26AS ಮತ್ತು AIS ದಾಖಲೆಗಳನ್ನು ನಿಖರವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
      replaces: "AIS, 26AS & TDS ಹೊಂದಾಣಿಕೆ",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ತೆರಿಗೆ & ನಿಯಮ ಆಪ್ಟಿಮೈಜರ್",
      subtitle: "ಸೆಕ್ಷನ್ 87A ರಿಯಾಯಿತಿಯೊಂದಿಗೆ ಹಳೆಯ vs ಹೊಸ ತೆರಿಗೆ ಪದ್ಧತಿಗಳ ಹೋಲಿಕೆ.",
      replaces: "ಹಳೆಯ vs ಹೊಸ ಪದ್ಧತಿ",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "ಬಾಕಿ ತೆರಿಗೆ ಪಾವತಿಸಿ",
      subtitle: "ತ್ವರಿತ UPI QR ಕೋಡ್ ಮೂಲಕ ಸೆಕ್ಷನ್ 140A ಸ್ವಯಂ-ಮೌಲ್ಯಮಾಪನ ತೆರಿಗೆ ಪಾವತಿ.",
      replaces: "ಚಲನ್ 280 & ಇ-ಪೇ ಟ್ಯಾಕ್ಸ್",
      badge: "ಚಲನ್ 280 · UPI",
    },
    notices: {
      title: "ನೋಟಿಸ್ & ದೋಷ ಪರಿಹಾರ",
      subtitle: "ಸೆಕ್ಷನ್ 143(1)(a) ಮತ್ತು 139(9) ನೋಟಿಸ್‌ಗಳಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಕಾನೂನು ಉತ್ತರ.",
      replaces: "ಇ-ನಡಾವಳಿಗಳು & ಉತ್ತರಗಳು",
      badge: "ಸೆಕ್ಷನ್ 143(1) & 139(9)",
    },
    status_history: {
      title: "ರಿಟರ್ನ್ ಸ್ಥಿತಿ & ಇತಿಹಾಸ",
      subtitle: "ಸಲ್ಲಿಸಿದ ರಿಟರ್ನ್, ಇ-ಪರಿಶೀಲನೆ ಮತ್ತು ಮರುಪಾವತಿ ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕರ್.",
      replaces: "ಮರುಪಾವತಿ ಸ್ಥಿತಿ & ITR-V",
      badge: "ಮರುಪಾವತಿ · ITR-V",
    },
    tax_calendar: {
      title: "ತೆರಿಗೆ ಕ್ಯಾಲೆಂಡರ್ & ಗಡುವುಗಳು",
      subtitle: "ಮುಂಗಡ ತೆರಿಗೆ ಕಂತುಗಳು ಮತ್ತು ಶಾಸನಬದ್ಧ ದಿನಾಂಕಗಳ ಟ್ರ್ಯಾಕರ್.",
      replaces: "ಮುಂಗಡ ತೆರಿಗೆ ಗಡುವು",
      badge: "ಮುಂಗಡ ತೆರಿಗೆ · ಗಡುವು",
    },
  },
  ml: {
    file_return: {
      title: "റിട്ടേൺ സമർപ്പിക്കുക അല്ലെങ്കിൽ പരിശോധിക്കുക",
      subtitle: "കൃത്യമായ വിവരങ്ങളോടെ റിട്ടേൺ തയ്യാറാക്കാനും ഫയൽ ചെയ്യാനുമുള്ള സംവിധാനം.",
      replaces: "ഫോം 16 ഇറക്കുമതിയും ഫയലിംഗും",
      badge: "ITR-1 / ഫോം 16",
    },
    match_records: {
      title: "ഔദ്യോഗിക രേഖകൾ ഒത്തുനോക്കുക",
      subtitle: "ഫോം 16, 26AS, AIS വിവരങ്ങൾ കൃത്യമായി പരിശോധിക്കുക.",
      replaces: "AIS, 26AS, TDS പൊരുത്തപ്പെടുത്തൽ",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "നികുതി വ്യവസ്ഥ ഒപ്റ്റിമൈസർ",
      subtitle: "വകുപ്പ് 87A ഇളവോടെ പഴയതും പുതിയതുമായ നികുതി വ്യവസ്ഥകൾ താരതമ്യം ചെയ്യുക.",
      replaces: "പഴയ vs പുതിയ വ്യവസ്ഥ",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "കുടിശ്ശിക നികുതി അടയ്ക്കുക",
      subtitle: "തത്സമയ UPI QR കോഡ് ഉപയോഗിച്ച് സെക്ഷൻ 140A സ്വയം നിർണ്ണയ നികുതി പേയ്മെന്റ്.",
      replaces: "ചെല്ലാൻ 280, ഇ-പേ ടാക്സ്",
      badge: "ചെല്ലാൻ 280 · UPI",
    },
    notices: {
      title: "നോട്ടീസുകളും തകരാർ പരിഹാരവും",
      subtitle: "സെക്ഷൻ 143(1)(a), 139(9) നോട്ടീസുകൾക്കുള്ള നിയമപരമായ മറുപടികൾ.",
      replaces: "ഇ-നടപടികളും മറുപടിയും",
      badge: "സെക്ഷൻ 143(1) & 139(9)",
    },
    status_history: {
      title: "റിട്ടേൺ നിലയും ചരിത്രവും",
      subtitle: "ഫയൽ ചെയ്ത റിട്ടേൺ, ഇ-സ്ഥിരീകരണം, റീഫണ്ട് നില ട്രാക്കർ.",
      replaces: "റീഫണ്ട് നിലയും ITR-V യും",
      badge: "റീഫണ്ട് · ITR-V",
    },
    tax_calendar: {
      title: "ടാക്സ് കലണ്ടറും സമയപരിധികളും",
      subtitle: "മുൻകൂർ നികുതി ഗഡുക്കളും നിയമപരമായ തീയതികളും അറിയുക.",
      replaces: "മുൻകൂർ നികുതി തീയതികൾ",
      badge: "മുൻകൂർ നികുതി · സമയപരിധി",
    },
  },
  pa: {
    file_return: {
      title: "ਰਿਟਰਨ ਦਾਖਲ ਜਾਂ ਸਮੀਖਿਆ ਕਰੋ",
      subtitle: "ਸਹੀ ਤੱਥਾਂ ਨਾਲ ਰਿਟਰਨ ਤਿਆਰ ਅਤੇ ਜਮ੍ਹਾਂ ਕਰਨ ਦੀ ਸੁਚੱਜੀ ਪ੍ਰਣਾਲੀ।",
      replaces: "ਫਾਰਮ 16 ਆਯਾਤ ਅਤੇ ਫਾਈਲਿੰਗ",
      badge: "ITR-1 / ਫਾਰਮ 16",
    },
    match_records: {
      title: "ਸਰਕਾਰੀ ਰਿਕਾਰਡਾਂ ਦਾ ਮਿਲਾਨ ਕਰੋ",
      subtitle: "ਫਾਰਮ 16, 26AS ਅਤੇ AIS ਡੇਟਾ ਦਾ ਪੂਰਾ ਮਿਲਾਨ ਅਤੇ ਪੜਤਾਲ।",
      replaces: "AIS, 26AS ਅਤੇ TDS ਮਿਲਾਨ",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ਟੈਕਸ ਅਤੇ ਪ੍ਰਣਾਲੀ ਆਪਟੀਮਾਈਜ਼ਰ",
      subtitle: "ਧਾਰਾ 87A ਛੋਟ ਨਾਲ ਪੁਰਾਣੀ ਬਨਾਮ ਨਵੀਂ ਟੈਕਸ ਪ੍ਰਣਾਲੀ ਦੀ ਤੁਲਨਾ।",
      replaces: "ਪੁਰਾਣੀ vs ਨਵੀਂ ਪ੍ਰਣਾਲੀ",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "ਬਕਾਇਆ ਟੈਕਸ ਦਾ ਭੁਗਤਾਨ ਕਰੋ",
      subtitle: "ਤਤਕਾਲ UPI QR ਕੋਡ ਨਾਲ ਧਾਰਾ 140A ਅਧੀਨ ਸਵੈ-ਮੁਲਾਂਕਣ ਟੈਕਸ ਭੁਗਤਾਨ।",
      replaces: "ਚਲਾਨ 280 ਅਤੇ ਈ-ਪੇ ਟੈਕਸ",
      badge: "ਚਲਾਨ 280 · UPI",
    },
    notices: {
      title: "ਨੋਟਿਸ ਅਤੇ ਨੁਕਸ ਨਿਵਾਰਨ",
      subtitle: "ਧਾਰਾ 143(1)(a) ਅਤੇ 139(9) ਨੋਟਿਸਾਂ ਲਈ ਸਵੈਚਾਲਿਤ ਕਾਨੂੰਨੀ ਜਵਾਬ।",
      replaces: "ਈ-ਕਾਰਵਾਈ ਅਤੇ ਜਵਾਬ",
      badge: "ਧਾਰਾ 143(1) & 139(9)",
    },
    status_history: {
      title: "ਰਿਟਰਨ ਸਥਿਤੀ ਅਤੇ ਇਤਿਹਾਸ",
      subtitle: "ਦਾਖਲ ਰਿਟਰਨ, ਈ-ਵੈਰੀਫਿਕੇਸ਼ਨ ਅਤੇ ਰਿਫੰਡ ਸਥਿਤੀ ਟ੍ਰੈਕਰ।",
      replaces: "ਰਿਫੰਡ ਸਥਿਤੀ ਅਤੇ ITR-V",
      badge: "ਰਿਫੰਡ · ITR-V",
    },
    tax_calendar: {
      title: "ਟੈਕਸ ਕੈਲੰਡਰ ਅਤੇ ਆਖਰੀ ਮਿਤੀਆਂ",
      subtitle: "ਐਡਵਾਂਸ ਟੈਕਸ ਦੀਆਂ ਕਿਸ਼ਤਾਂ ਅਤੇ ਆਖਰੀ ਮਿਤੀਆਂ ਦਾ ਟ੍ਰੈਕਰ।",
      replaces: "ਐਡਵਾਂਸ ਟੈਕਸ ਮਿਤੀਆਂ",
      badge: "ਐਡਵਾਂਸ ਟੈਕਸ · ਮਿਤੀਆਂ",
    },
  },
  or: {
    file_return: {
      title: "ରିଟର୍ଣ୍ଣ ଦାଖଲ କିମ୍ବା ସମୀକ୍ଷା କରନ୍ତୁ",
      subtitle: "ସଠିକ୍ ତଥ୍ୟ ସହିତ ରିଟର୍ଣ୍ଣ ପ୍ରସ୍ତୁତ ଓ ଦାଖଲ କରିବାର ସୁବିଧା।",
      replaces: "ଫର୍ମ 16 ଆମଦାନୀ ଓ ଫାଇଲିଂ",
      badge: "ITR-1 / ଫର୍ମ 16",
    },
    match_records: {
      title: "ସରକାରୀ ରେକର୍ଡ ମେଳାନ୍ତୁ",
      subtitle: "ଫର୍ମ 16, 26AS ଏବଂ AIS ତଥ୍ୟର ସମ୍ପୂର୍ଣ୍ଣ ଯାଞ୍ଚ ଓ ସମାଧାନ।",
      replaces: "AIS, 26AS ଏବଂ TDS ମେଳକ",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ଟ୍ୟାକ୍ସ ଏବଂ ବ୍ୟବସ୍ଥା ଅପ୍ଟିମାଇଜର",
      subtitle: "ଧାରା 87A ରିହାତି ସହିତ ପୁରୁଣା ବନାମ ନୂତନ କର ବ୍ୟବସ୍ଥାର ତୁଳନା।",
      replaces: "ପୁରୁଣା vs ନୂତନ ବ୍ୟବସ୍ଥା",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "ବକେୟା ଟ୍ୟାକ୍ସ ପୈଠ କରନ୍ତୁ",
      subtitle: "ତୁରନ୍ତ UPI QR କୋଡ୍ ସହିତ ଧାରା 140A ସ୍ୱ-ମୂଲ୍ୟାଙ୍କନ କର ପୈଠ।",
      replaces: "ଚାଲାଣ 280 ଏବଂ ଇ-ପେ ଟ୍ୟାକ୍ସ",
      badge: "ଚାଲାଣ 280 · UPI",
    },
    notices: {
      title: "ନୋଟିସ୍ ଓ ତ୍ରୁଟି ନିରାକରଣ",
      subtitle: "ଧାରା 143(1)(a) ଏବଂ 139(9) ନୋଟିସ୍ ପାଇଁ ଆଇନଗତ ଉତ୍ତର।",
      replaces: "ଇ-କାର୍ଯ୍ୟାନୁଷ୍ଠାନ ଓ ଉତ୍ତର",
      badge: "ଧାରା 143(1) ଓ 139(9)",
    },
    status_history: {
      title: "ରିଟର୍ଣ୍ଣ ସ୍ଥିତି ଏବଂ ଇତିହାସ",
      subtitle: "ଦାଖଲ ରିଟର୍ଣ୍ଣ, ଇ-ଯାଞ୍ଚ ଏବଂ ରିଫଣ୍ଡ ସ୍ଥିତି ଟ୍ରାକର୍।",
      replaces: "ରିଫଣ୍ଡ ସ୍ଥିତି ଓ ITR-V",
      badge: "ରିଫଣ୍ଡ · ITR-V",
    },
    tax_calendar: {
      title: "ଟ୍ୟାକ୍ସ କ୍ୟାଲେଣ୍ଡର ଓ ସମୟସୀମା",
      subtitle: "ଅଗ୍ରିମ କର କିସ୍ତି ଏବଂ ନିର୍ଦ୍ଧାରିତ ତାରିଖର ଟ୍ରାକର୍।",
      replaces: "ଅଗ୍ରିମ କର ତାରିଖ",
      badge: "ଅଗ୍ରିମ କର · ସମୟସୀମା",
    },
  },
  as: {
    file_return: {
      title: "ৰিটাৰ্ণ দাখিল বা পৰ্যালোচনা কৰক",
      subtitle: "সঠিক তথ্যৰ সৈতে আয়কৰ ৰিটাৰ্ণ প্ৰস্তুত আৰু দাখিল কৰাৰ ব্যৱস্থা।",
      replaces: "ফৰ্ম 16 আমদানি আৰু দাখিল",
      badge: "ITR-1 / ফৰ্ম 16",
    },
    match_records: {
      title: "চৰকাৰী নথি মিলাই চাওক",
      subtitle: "ফৰ্ম 16, 26AS আৰু AIS তথ্যৰ সম্পূৰ্ণ মিল আৰু সত্যাপন।",
      replaces: "AIS, 26AS আৰু TDS মিলান",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "কৰ ব্যৱস্থা অনুকূলন",
      subtitle: "ধাৰা 87A ৰেহাইৰ সৈতে পুৰণি আৰু নতুন কৰ ব্যৱস্থাৰ তুলনা।",
      replaces: "পুৰণি vs নতুন ব্যৱস্থা",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "বাকী থকা কৰ পৰিশোধ কৰক",
      subtitle: "তাৎক্ষণিক UPI QR ক'ডৰে ধাৰা 140A অধীনত স্ব-নিৰ্ধাৰিত কৰ আদায়।",
      replaces: "চালান 280 আৰু ই-পে কৰ",
      badge: "চালান 280 · UPI",
    },
    notices: {
      title: "জাননী আৰু ত্ৰুটি সমাধান",
      subtitle: "ধাৰা 143(1)(a) আৰু 139(9) জাননীৰ বাবে আইনী প্ৰত্যুত্তৰ।",
      replaces: "ই-কাৰ্যক্ৰম আৰু উত্তৰ",
      badge: "ধাৰা 143(1) আৰু 139(9)",
    },
    status_history: {
      title: "ৰিটাৰ্ণৰ স্থিতি আৰু ইতিহাস",
      subtitle: "দাখিল কৰা ৰিটাৰ্ণ, ই-যাচাই আৰু ৰিফাণ্ডৰ স্থিতি নিৰীক্ষণ।",
      replaces: "ৰিফাণ্ড স্থিতি আৰু ITR-V",
      badge: "ৰিফাণ্ড · ITR-V",
    },
    tax_calendar: {
      title: "কৰ কেলেণ্ডাৰ আৰু সময়সীমা",
      subtitle: "আগতীয়া কৰ আৰু গুৰুত্বপূৰ্ণ তাৰিখসমূহৰ তালিকা।",
      replaces: "আগতীয়া কৰৰ সময়সীমা",
      badge: "আগতীয়া কৰ · সময়সীমা",
    },
  },
  ur: {
    file_return: {
      title: "ریٹرن فائل یا جائزہ لیں",
      subtitle: "درست حقائق کے ساتھ انکم ٹیکس ریٹرن تیار اور جمع کرنے کا نظام۔",
      replaces: "فارم 16 امپورٹ اور فائلنگ",
      badge: "ITR-1 / فارم 16",
    },
    match_records: {
      title: "سرکاری ریکارڈز کا موازنہ کریں",
      subtitle: "فارم 16، 26AS اور AIS ڈیٹا کا مکمل ملاپ اور تصدیق۔",
      replaces: "AIS، 26AS اور TDS ملاپ",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ٹیکس و نظام آپٹیمائزر",
      subtitle: "سیکشن 87A ریلیف کے ساتھ پرانے بمقابلہ نئے ٹیکس نظام کا موازنہ۔",
      replaces: "پرانا vs نیا نظام",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "واجب الادا ٹیکس ادا کریں",
      subtitle: "فوری UPI QR کوڈ کے ساتھ دفعہ 140A کے تحت سیلف اسیسمنٹ ٹیکس ادائیگی۔",
      replaces: "چالان 280 اور ای-پے ٹیکس",
      badge: "چالان 280 · UPI",
    },
    notices: {
      title: "نوٹس اور نقائص کا حل",
      subtitle: "دفعہ 143(1)(a) اور 139(9) کے نوٹسز کا قانونی جواب۔",
      replaces: "ای-کارروائی اور نوٹس جواب",
      badge: "دفعہ 143(1) اور 139(9)",
    },
    status_history: {
      title: "ریٹرن کی صورتحال اور تاریخ",
      subtitle: "فائل شدہ ریٹرن، ای-تصدیق اور ریفنڈ ٹریکر۔",
      replaces: "ریفنڈ اسٹیٹس اور ITR-V",
      badge: "ریفنڈ · ITR-V",
    },
    tax_calendar: {
      title: "ٹیکس کیلنڈر اور آخری تاریخیں",
      subtitle: "ایڈوانس ٹیکس اقसाط اور قانونی تاریخوں کا ٹریکر۔",
      replaces: "ایڈوانس ٹیکس تواریخ",
      badge: "ایڈوانس ٹیکس · میعاد",
    },
  },
  brx: {
    file_return: {
      title: "रिथार्न दाखिला खालाम एबा नायबिजिर",
      subtitle: "थार खारिजों रिथार्न थियारि खालामनाय आरो गथायनायनि मोनसे लामा।",
      replaces: "फर्म 16 लाबोनाय आरो रिथार्न",
      badge: "ITR-1 / फर्म 16",
    },
    match_records: {
      title: "सोरखारि रेकर्डफोरखौ रुजु",
      subtitle: "CBDT फिदबेक कोडजों फर्म 16, 26AS आरो AIS डाटाखौ थारै रुजुनाय।",
      replaces: "AIS, 26AS आरो TDS रुजुनाय",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "खाजोना आरो नेम अप्टिमाइजार",
      subtitle: "दफा 87A रेहायजों गोदोनि आरो गोदान खाजोना नेमनि रुजुनाय।",
      replaces: "गोदो vs गोदान खाजोना",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "बाखि खाजोनाखौ होनाय",
      subtitle: "थाब UPI QR कोडजों दफा 140A नि सिङाव गावनि खाजोना होनाय।",
      replaces: "चालान 280 आरो ई-पे टैक्स",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "नोटिस आरो गोरोन्थि सुस्रांनाय",
      subtitle: "दफा 143(1)(a) आरो 139(9) नोटिसफोरनि आयनारि फिन।",
      replaces: "ई-प्रसिडिंस आरो नोटिस फिन",
      badge: "दफा 143(1) आरो 139(9)",
    },
    status_history: {
      title: "रिथार्ननि थासारि आरो जारौ",
      subtitle: "गथायनाय रिथार्न, ई-भेरीफिकेसन आरो रिफान्ड थासारि दिन्थिग्रा।",
      replaces: "रिफान्ड आरो ITR-V",
      badge: "रिफान्ड · ITR-V",
    },
    tax_calendar: {
      title: "खाजोना केलेंडार आरो सम-सीमा",
      subtitle: "सिगां खाजोना आरो गोनांथार अक्ट'फोरनि थासारि।",
      replaces: "सिगां खाजोना सम-सीमा",
      badge: "सिगां खाजोना · अक्ट'",
    },
  },
  doi: {
    file_return: {
      title: "रिटर्न दाखिल करो या समीक्षा करो",
      subtitle: "सच्चे तथ्यें कन्ने रिटर्न त्यार ते दाखिल करने दी एकीकृत प्रणाली।",
      replaces: "फार्म 16 आयात ते रिटर्न दाखिल",
      badge: "ITR-1 / फार्म 16",
    },
    match_records: {
      title: "सरकारी रिकार्ड दा मिलान करो",
      subtitle: "CBDT फीडबैक कोड कन्ने फार्म 16, 26AS ते AIS डाटा दा पूरा मिलान।",
      replaces: "AIS, 26AS ते TDS मिलान",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "टैक्स ते रिजीम ऑप्टिमाइजर",
      subtitle: "धारा 87A छूट कन्ने पुरानी बनाम नमीं कर व्यवस्था दी तुलना।",
      replaces: "पुरानी vs नमीं व्यवस्था",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "बकाया टैक्स दा भुगतान करो",
      subtitle: "तुरंत UPI QR कोड कन्ने धारा 140A तहत स्व-निर्धारण कर भुगतान।",
      replaces: "चालान 280 ते e-Pay Tax",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "नोटिस ते त्रुटी निवारण",
      subtitle: "धारा 143(1)(a) ते 139(9) नोटिसें आस्तै कानूनी जवाब।",
      replaces: "ई-कार्यवाही ते नोटिस जवाब",
      badge: "धारा 143(1) ते 139(9)",
    },
    status_history: {
      title: "रिटर्न स्थिति ते इतिहास",
      subtitle: "दाखिल रिटर्न, ई-वेरिफिकेशन ते रिफंड दा पूरा ट्रैकर।",
      replaces: "रिफंड स्थिति ते ITR-V",
      badge: "रिफंड · ITR-V",
    },
    tax_calendar: {
      title: "टैक्स कैलेंडर ते समें सीमा",
      subtitle: "एडवांस टैक्स किश्तें ते जरूरी तरीकें दा ट्रैकर।",
      replaces: "एडवांस टैक्स समें सीमा",
      badge: "एडवांस टैक्स · सीमा",
    },
  },
  ks: {
    file_return: {
      title: "ریٹرن دٲخل یا جائزہ تُلِو",
      subtitle: "صحیح حقائقن سیت ریٹرن تیار تہٕ دٲخل کرنک نظام۔",
      replaces: "فارم 16 تہٕ ریٹرن",
      badge: "ITR-1 / فارم 16",
    },
    match_records: {
      title: "سرکٲرؠ ریکارڈن ہند مقابلو کرِو",
      subtitle: "فارم 16، 26AS تہٕ AIS ڈیٹا ہند مکمل رلاو۔",
      replaces: "AIS، 26AS تہٕ TDS میل",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ٹیکس تہٕ نظام آپٹیمائزر",
      subtitle: "دفعہ 87A ریلیف سیت پرانہِ بنام نوِ ٹیکس نظامک موازنہٕ۔",
      replaces: "پرون vs نوٚو نظام",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "باقی ٹیکس ادا کرِو",
      subtitle: "فوری UPI QR کوڈ سیت دفعہ 140A تحت ٹیکس ادائیگی۔",
      replaces: "چالان 280 تہٕ ای-پے ٹیکس",
      badge: "چالان 280 · UPI",
    },
    notices: {
      title: "نوٹس تہٕ نقص حل کرُن",
      subtitle: "دفعہ 143(1)(a) تہٕ 139(9) نوٹس ہند قانونی جواب۔",
      replaces: "ای-پروسیڈنگز تہٕ نوٹس جواب",
      badge: "دفعہ 143(1) تہٕ 139(9)",
    },
    status_history: {
      title: "ریٹرن حالت تہٕ توٲریخ",
      subtitle: "دٲخل کٔرمژ ریٹرن، ای-تصدیق تہٕ ریفنڈ ٹریکر۔",
      replaces: "ریفنڈ حالت تہٕ ITR-V",
      badge: "ریفنڈ · ITR-V",
    },
    tax_calendar: {
      title: "ٹیکس کیلنڈر تہٕ مدت",
      subtitle: "ایڈوانس ٹیکس قسطن تہٕ قانونی تٲریخن ہند ٹریکر۔",
      replaces: "ایڈوانس ٹیکس تٲریخ",
      badge: "ایڈوانس ٹیکس · مدت",
    },
  },
  kok: {
    file_return: {
      title: "रिटर्न दाखल वा तपासणी करा",
      subtitle: "योग्य तथ्यां सयत रिटर्न तयार आनी दाखल करपाची एकात्मिक पद्धत.",
      replaces: "फॉर्म 16 आयात आनी रिटर्न",
      badge: "ITR-1 / फॉर्म 16",
    },
    match_records: {
      title: "सरकारी नोंदी ताळो करा",
      subtitle: "CBDT फीडबॅक कोडां सयत फॉर्म 16, 26AS आनी AIS डेटाचो पूर्ण ताळो.",
      replaces: "AIS, 26AS आनी TDS ताळो",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "कर आनी रिजीम ऑप्टिमायझर",
      subtitle: "कलम 87A रिलीफ सयत पोरणी विरुद्ध नवी कर रचनेची तुलना.",
      replaces: "पोरणी vs नवी रचना",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "उरिल्लो कर फारीक करा",
      subtitle: "रोखडेच UPI QR कोडा सयत कलम 140A खाला स्व-आकारणी कर भरणा.",
      replaces: "चालान 280 आनी ई-पे टॅक्स",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "नोटीस आनी त्रुटी निवारण",
      subtitle: "कलम 143(1)(a) आनी 139(9) नोटिशींक कायदेशीर जाप.",
      replaces: "ई-कार्यवाही आनी जाप",
      badge: "कलम 143(1) आनी 139(9)",
    },
    status_history: {
      title: "रिटर्न स्थिती आनी इतिहास",
      subtitle: "दाखल रिटर्न, ई-वेरिफिकेशन आनी परतावो ट्रॅकर.",
      replaces: "परतावो आनी ITR-V",
      badge: "परतावो · ITR-V",
    },
    tax_calendar: {
      title: "कर दिनदर्शिका आनी मुदत",
      subtitle: "अगाऊ कर हप्ते आनी म्हत्वाच्यो तारखो ट्रॅकर.",
      replaces: "अगाऊ कर मुदत",
      badge: "अगाऊ कर · मुदत",
    },
  },
  mai: {
    file_return: {
      title: "रिटर्न दाखिल अथवा समीक्षा करू",
      subtitle: "सटीक तथ्यक संग रिटर्न तैयार आ दाखिल करबाक एकीकृत प्रणाली।",
      replaces: "फॉर्म 16 आयात आ रिटर्न",
      badge: "ITR-1 / फॉर्म 16",
    },
    match_records: {
      title: "सरकारी रेकॉर्डक मिलान करू",
      subtitle: "CBDT फीडबैक कोडक संग फॉर्म 16, 26AS आ AIS डेटाक पूर्ण मिलान।",
      replaces: "AIS, 26AS आ TDS मिलान",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "टैक्स आ रिजीम ऑप्टिमाइजर",
      subtitle: "धारा 87A छूटक संग पुरान बनाम नव कर व्यवस्थाक तुलना।",
      replaces: "पुरान vs नव व्यवस्था",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "बकाया टैक्सक भुगतान करू",
      subtitle: "तुरंत UPI QR कोडक संग धारा 140A तहत स्व-निर्धारण कर भुगतान।",
      replaces: "चालान 280 आ ई-पे टैक्स",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "नोटिस आ त्रुटि निवारण",
      subtitle: "धारा 143(1)(a) आ 139(9) नोटिसक लेल कानूनी उत्तर।",
      replaces: "ई-कार्यवाही आ उत्तर",
      badge: "धारा 143(1) आ 139(9)",
    },
    status_history: {
      title: "रिटर्न स्थिति आ इतिहास",
      subtitle: "दाखिल रिटर्न, ई-वेरिफिकेशन आ रिफंडक लाइफसाइकिल ट्रैकर।",
      replaces: "रिफंड स्थिति आ ITR-V",
      badge: "रिफंड · ITR-V",
    },
    tax_calendar: {
      title: "टैक्स कैलेंडर आ समय सीमा",
      subtitle: "अग्रिम करक किस्त आ महत्वपूर्ण तिथिक ट्रैकर।",
      replaces: "अग्रिम कर समय सीमा",
      badge: "अग्रिम कर · सीमा",
    },
  },
  mni: {
    file_return: {
      title: "রিতর্ন ফাইল নত্রগা য়েংশিনবিউ",
      subtitle: "অচুম্বা ৱাফমশিংগা লোয়ননা রিতর্ন শেম্বা অমসুং ফাইল তৌবগী পথাপ।",
      replaces: "ফোর্ম 16 অমসুং রিতর্ন",
      badge: "ITR-1 / ফোর্ম 16",
    },
    match_records: {
      title: "লৈঙাক্কী রেকোর্দশিং য়েংশিনবিউ",
      subtitle: "CBDT ফীদবেক কোদকা লোয়ননা ফোর্ম 16, 26AS অমসুং AIS য়েংশিনবা।",
      replaces: "AIS, 26AS অমসুং TDS",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "তেক্স অমসুং রেজীম ওপ্তিমিজর",
      subtitle: "সেক্সন 87A রিলিফকা লোয়ননা অরিবা অমসুং অনৌবা তেক্স পথাপ য়েংনবা।",
      replaces: "অরিবা vs অনৌবা পথাপ",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "লেমহৌবা তেক্স পীথোকউ",
      subtitle: "UPI QR কোদকা লোয়ননা সেক্সন 140A গী মখাদা তেক্স পীথোকপা।",
      replaces: "চালান 280 অমসুং তেক্স",
      badge: "চালান 280 · UPI",
    },
    notices: {
      title: "নোতিস অমসুং অশোয়বা শেমদোকপা",
      subtitle: "সেক্সন 143(1)(a) অমসুং 139(9) গী নোতিসশিংগী আইন্না য়াবা পাউখুম।",
      replaces: "ই-প্রসিদিংস অমসুং পাউখুম",
      badge: "সেক্সন 143(1) & 139(9)",
    },
    status_history: {
      title: "রিতর্নগী ফিভম অমসুং পুৱারি",
      subtitle: "ফাইল তৌরবা রিতর্ন, ই-ভেরিফিকেসন অমসুং রিফন্দ ত্রেক তৌবা।",
      replaces: "রিফন্দ অমসুং ITR-V",
      badge: "রিফন্দ · ITR-V",
    },
    tax_calendar: {
      title: "তেক্স কেলেন্দর অমসুং মতম",
      subtitle: "এদভান্স তেক্স অমসুং মরুওইবা তারিখশিংগী ত্রেকার।",
      replaces: "এদভান্স তেক্স মতম",
      badge: "এদভান্স তেক্স · মতম",
    },
  },
  ne: {
    file_return: {
      title: "रिटर्न फाइल वा समीक्षा गर्नुहोस्",
      subtitle: "सटीक तथ्यहरूको साथ रिटर्न तयार गर्न र पेश गर्न एकीकृत प्रणाली।",
      replaces: "फारम 16 आयात र रिटर्न",
      badge: "ITR-1 / फारम 16",
    },
    match_records: {
      title: "सरकारी रेकर्डहरू मिलाउनुहोस्",
      subtitle: "CBDT प्रतिक्रिया कोडहरूसँग फारम 16, 26AS र AIS डेटाको पूर्ण मिलान।",
      replaces: "AIS, 26AS र TDS मिलान",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "कर र कर प्रणाली अप्टिमाइजर",
      subtitle: "दफा 87A छुटसँग पुरानो बनाम नयाँ कर प्रणालीको तुलना।",
      replaces: "पुरानो vs नयाँ प्रणाली",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "बाँकी कर भुक्तानी गर्नुहोस्",
      subtitle: "तत्काल UPI QR कोडसँग दफा 140A अन्तर्गत स्व-मूल्याङ्कन कर भुक्तानी।",
      replaces: "चालान 280 र ई-पे कर",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "सूचना र त्रुटि समाधान",
      subtitle: "दफा 143(1)(a) र 139(9) सूचनाहरूको लागि कानुनी जवाफ।",
      replaces: "ई-कार्यवाही र जवाफ",
      badge: "दफा 143(1) र 139(9)",
    },
    status_history: {
      title: "रिटर्न स्थिति र इतिहास",
      subtitle: "दाखिल रिटर्न, ई-प्रमाणीकरण र फिर्ता ट्र्याकर।",
      replaces: "फिर्ता स्थिति र ITR-V",
      badge: "फिर्ता · ITR-V",
    },
    tax_calendar: {
      title: "कर क्यालेन्डर र समयसीमा",
      subtitle: "अग्रिम कर किस्ता र महत्त्वपूर्ण मितिहरूको ट्र्याकर।",
      replaces: "अग्रिम कर समयसीमा",
      badge: "अग्रिम कर · सीमा",
    },
  },
  sa: {
    file_return: {
      title: "विवरणपत्रं समर्पयतु वा समीक्षताम्",
      subtitle: "सत्यतथ्यैः सह विवरणपत्रं सज्जीकर्तुं समर्पयितुं चैकीकृता व्यवस्था।",
      replaces: "प्रपत्रम् 16 आयात विवरणपत्रं च",
      badge: "ITR-1 / प्रपत्रम् 16",
    },
    match_records: {
      title: "शासकीयलेख्यानां मेलनम्",
      subtitle: "CBDT प्रतिपुष्टि-सङ्केतैः सह प्रपत्रम् 16, 26AS तथा AIS दत्तांशस्य मेलनम्।",
      replaces: "AIS, 26AS तथा TDS मेलनम्",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "करः व्यवस्था च अनुकूलीकारकम्",
      subtitle: "धारा 87A उपशमेन सह पुरातन-नूतनकरव्यवस्थयोः तुलना।",
      replaces: "पुरातन vs नूतन व्यवस्था",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "अवशिष्टं करं शोधयतु",
      subtitle: "झटिति UPI QR सङ्केतेन धारा 140A अन्तर्गतं स्वमूल्याङ्कनकरशोधनम्।",
      replaces: "चालान 280 ई-पे करः च",
      badge: "चालान 280 · UPI",
    },
    notices: {
      title: "सूचना दोषनिवारणं च",
      subtitle: "धारा 143(1)(a) तथा 139(9) सूचनाभ्यः वैधानिकं प्रत्युत्तरम्।",
      replaces: "ई-प्रक्रिया प्रत्युत्तरं च",
      badge: "धारा 143(1) तथा 139(9)",
    },
    status_history: {
      title: "विवरणपत्रस्थितिः इतिहासः च",
      subtitle: "समर्पितविवरणपत्रं, ई-प्रमाणीकरणं प्रत्यर्पणस्थिति-अन्वेषकम्।",
      replaces: "प्रत्यर्पणस्थितिः ITR-V च",
      badge: "प्रत्यर्पणम् · ITR-V",
    },
    tax_calendar: {
      title: "करदिनदर्शिका समयसीमा च",
      subtitle: "अग्रिमकरस्य किस्ताः प्रमुखाः तिथयः च।",
      replaces: "अग्रिमकर समयसीमा",
      badge: "अग्रिमकरः · सीमा",
    },
  },
  sat: {
    file_return: {
      title: "ᱨᱤᱴᱟᱨᱱ ᱮᱢ ᱟᱨᱵᱟᱝ ᱧᱮᱞ ᱵᱤᱰᱟᱹᱣ",
      subtitle: "ᱥᱟᱹᱨᱤ ᱛᱚᱛᱛᱷᱚ ᱥᱟᱶᱛᱮ ᱨᱤᱴᱟᱨᱱ ᱛᱮᱭᱟᱨ ᱟᱨ ᱮᱢ ᱨᱮᱱᱟᱜ ᱵᱮᱵᱚᱥᱛᱷᱟ᱾",
      replaces: "ᱯᱷᱚᱨᱢ ᱑᱖ ᱟᱨ ᱨᱤᱴᱟᱨᱱ",
      badge: "ITR-1 / ᱯᱷᱚᱨᱢ ᱑᱖",
    },
    match_records: {
      title: "ᱥᱚᱨᱠᱟᱨᱤ ᱨᱮᱠᱚᱨᱰ ᱢᱤᱞᱟᱹᱣ",
      subtitle: "CBDT ᱠᱳᱰ ᱥᱟᱶ ᱯᱷᱚᱨᱢ ᱑᱖, ᱒᱖AS ᱟᱨ AIS ᱰᱮᱴᱟ ᱢᱤᱞᱟᱹᱣ᱾",
      replaces: "AIS, ᱒᱖AS ᱟᱨ TDS",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ᱴᱮᱠᱥ ᱟᱨ ᱱᱤᱭᱚᱢ ᱥᱟᱡᱟᱣ",
      subtitle: "ᱫᱷᱟᱨᱟ ᱘᱗A ਛੂᱴ ᱥᱟᱶ ᱢᱟᱨᱮ ᱟᱨ ᱱᱟᱣᱟ ᱵᱮᱵᱚᱥᱛᱷᱟ ᱛᱩᱞᱟᱹᱡᱚᱠᱷᱟ᱾",
      replaces: "ᱢᱟᱨᱮ vs ᱱᱟᱣᱟ ᱵᱮᱵᱚᱥᱛᱷᱟ",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "ᱵᱟᱹᱠᱤ ᱴᱮᱠᱥ ᱮᱢ",
      subtitle: "ᱞᱚᱜᱚᱱ UPI QR ᱠᱳᱰ ᱥᱟᱶ ᱫᱷᱟᱨᱟ ᱑᱔᱐A ᱦᱚᱛᱮᱛᱮ ᱴᱮᱠᱥ ᱮᱢ᱾",
      replaces: "ᱪᱟᱞᱟᱱ ᱒᱘᱐ ᱟᱨ ᱤ-ᱯᱮ ᱴᱮᱠᱥ",
      badge: "ᱪᱟᱞᱟᱱ ᱒᱘᱐ · UPI",
    },
    notices: {
      title: "ᱱᱳᱴᱤᱥ ᱟᱨ ᱵᱷᱩᱞ ᱥᱩᱫᱷᱨᱟᱹᱣ",
      subtitle: "ᱫᱷᱟᱨᱟ ᱑᱔᱓(᱑)(a) ᱟᱨ ᱑᱓᱙(᱙) ᱱᱳᱴᱤᱥ ᱨᱮᱱᱟᱜ ᱟᱹᱭᱤᱱ ᱞᱮᱠᱟᱛᱮ ᱛᱮᱞᱟ᱾",
      replaces: "ᱤ-ᱠᱟᱹᱢᱤᱦᱚᱨᱟ ᱟᱨ ᱛᱮᱞᱟ",
      badge: "ᱫᱷᱟᱨᱟ ᱑᱔᱓(᱑) & ᱑᱓᱙(᱙)",
    },
    status_history: {
      title: "ᱨᱤᱴᱟᱨᱱ ᱦᱟᱞᱚᱛ ᱟᱨ ᱱᱟᱜᱟᱢ",
      subtitle: "ᱮᱢ ᱟᱠᱟᱱ ᱨᱤᱴᱟᱨᱱ, ᱤ-ᱵᱷᱮᱨᱤᱯᱷᱤᱠᱮᱥᱚᱱ ᱟᱨ ᱨᱤᱯᱷᱟᱱᱰ ᱴᱨᱮᱠᱟᱨ᱾",
      replaces: "ᱨᱤᱯᱷᱟᱱᱰ ᱟᱨ ITR-V",
      badge: "ᱨᱤᱯᱷᱟᱱᱰ · ITR-V",
    },
    tax_calendar: {
      title: "ᱴᱮᱠᱥ ᱠᱮᱞᱮᱱᱰᱟᱨ ᱟᱨ ᱚᱠᱛᱚ ᱥᱤᱢᱟᱹ",
      subtitle: "ᱮᱰᱵᱷᱟᱱᱥ ᱴᱮᱠᱥ ᱟᱨ ᱡᱟᱹᱨᱩᱲ ᱢᱟᱹᱦᱤᱛ ᱨᱮᱱᱟᱜ ᱛᱟᱹᱞᱠᱟᱹ᱾",
      replaces: "ᱮᱰᱵᱷᱟᱱᱥ ᱴᱮᱠᱥ ᱥᱤᱢᱟᱹ",
      badge: "ᱮᱰᱵᱷᱟᱱᱥ ᱴᱮᱠᱥ · ᱢᱟᱹᱦᱤᱛ",
    },
  },
  sd: {
    file_return: {
      title: "رٽرن داخل يا نظرثاني ڪريو",
      subtitle: "صحيح حقيقتن سان گڏ ٽيڪس رٽرن تيار ۽ جمع ڪرائڻ جو گڏيل نظام.",
      replaces: "فارم 16 ۽ رٽرن فائلنگ",
      badge: "ITR-1 / فارم 16",
    },
    match_records: {
      title: "سرڪاري رڪارڊ جو مقابلو ڪريو",
      subtitle: "فارم 16، 26AS ۽ AIS ڊيٽا جي مڪمل تصديق ۽ ڀيٽ.",
      replaces: "AIS، 26AS ۽ TDS ميلاپ",
      badge: "AIS · 26AS · TDS",
    },
    tax_optimizer: {
      title: "ٽيڪس ۽ نظام جو بهتر بڻائيندڙ",
      subtitle: "سيڪشن 87A رليف سان پراڻي بمقابله نئين ٽيڪس نظام جو مقابلو.",
      replaces: "پراڻو vs نئون نظام",
      badge: "New vs Old · 87A",
    },
    pay_tax: {
      title: "رهيل ٽيڪس ادا ڪريو",
      subtitle: "فوري UPI QR ڪوڊ سان سيڪشن 140A تحت ٽيڪس ادائيگي.",
      replaces: "چالان 280 ۽ اي-پي ٽيڪس",
      badge: "چالان 280 · UPI",
    },
    notices: {
      title: "نوٽيس ۽ نقص جو حل",
      subtitle: "سيڪشن 143(1)(a) ۽ 139(9) نوٽيسن جو قانوني جواب.",
      replaces: "اي-ڪارروائي ۽ جواب",
      badge: "سيڪشن 143(1) ۽ 139(9)",
    },
    status_history: {
      title: "رٽرن جي صورتحال ۽ تاريخ",
      subtitle: "جمع ٿيل رٽرن، اي-تصديق ۽ واپسي ٽريڪر.",
      replaces: "واپسي ۽ ITR-V",
      badge: "واپسي · ITR-V",
    },
    tax_calendar: {
      title: "ٽيڪس ڪئلينڊر ۽ آخري تاريخون",
      subtitle: "ايڊوانس ٽيڪس قسطن ۽ ضروري تاريخن جو ٽريڪر.",
      replaces: "ايڊوانس ٽيڪس تاريخون",
      badge: "ايڊوانس ٽيڪس · ميعاد",
    },
  },
};

const ENGLISH_CARDS: CardDictionary = {
  file_return: {
    title: "File or Review Return",
    subtitle: "Unified facts-first return builder and submission pipeline.",
    replaces: "File return, Form 16 ingestion",
    badge: "ITR-1 / Form 16",
  },
  match_records: {
    title: "Match Official Records",
    subtitle: "Reconciles Form 16, 26AS, and AIS data with CBDT feedback codes.",
    replaces: "Match records, TDS match, AIS/26AS",
    badge: "AIS · 26AS · TDS",
  },
  tax_optimizer: {
    title: "Tax & Regime Optimizer",
    subtitle: "Real-time reactive calculation with Section 87A marginal relief.",
    replaces: "Tax calc, Old vs. New, HRA",
    badge: "Old vs. New · 87A",
  },
  pay_tax: {
    title: "Pay Tax Due",
    subtitle: "Self-assessment payment u/s 140A with instant simulated UPI QR codes.",
    replaces: "Challan 280, e-Pay Tax",
    badge: "Challan 280 · UPI",
  },
  notices: {
    title: "Notices & Defect Resolver",
    subtitle: "Automated defense drafter for Section 143(1)(a) and 139(9) notices.",
    replaces: "Respond to a letter, e-Proceedings",
    badge: "Sec 143(1)(a) & 139(9)",
  },
  status_history: {
    title: "Return Status & History",
    subtitle: "Unified lifecycle tracker for past filings, verification, and refunds.",
    replaces: "Refund status, e-Verify, ITR-V, History",
    badge: "Refund & ITR-V",
  },
  tax_calendar: {
    title: "Tax Calendar & Deadlines",
    subtitle: "Integrated milestone tracker for statutory dates and penalty cutoffs.",
    replaces: "Tax calendar, Advance-tax dates",
    badge: "Advance Tax · Cutoffs",
  },
};

const CARD_NUMBERS: Record<LandingActionCard["id"], string> = {
  file_return: "01",
  match_records: "02",
  tax_optimizer: "03",
  pay_tax: "04",
  notices: "05",
  status_history: "06",
  tax_calendar: "07",
};

const CARD_HIGHLIGHTS: Partial<Record<LandingActionCard["id"], boolean>> = {
  tax_optimizer: true,
  tax_calendar: true,
};

export function getLandingCards(lang: Lang): LandingActionCard[] {
  const dict = CARDS_BY_LANG[lang] || ENGLISH_CARDS;
  const cardIds: LandingActionCard["id"][] = [
    "file_return",
    "match_records",
    "tax_optimizer",
    "pay_tax",
    "notices",
    "status_history",
    "tax_calendar",
  ];

  return cardIds.map((id) => {
    const item = dict[id] || ENGLISH_CARDS[id];
    return {
      id,
      number: CARD_NUMBERS[id],
      title: item.title,
      subtitle: item.subtitle,
      replaces: item.replaces,
      badge: item.badge,
      highlight: CARD_HIGHLIGHTS[id],
    };
  });
}

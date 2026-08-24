"use client";

import React, { useState, useEffect, useRef } from "react";
import { LazyMotion, domMax, m, AnimatePresence, LayoutGroup, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { z } from "zod";
import { animate } from "animejs";
import { 
  Building2, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Check, 
  MessageSquare,
  Settings,
  Volume2,
  VolumeX,
  CreditCard,
  UserCheck,
  Sparkles,
  Info,
  BookOpen,
  Cpu,
  User,
  ShieldAlert,
  Calendar,
  Grid,
  FileCheck,
  AlertCircle,
  Sun,
  Moon
} from "lucide-react";

import { PERSONAS, TODAY } from "../lib/personas";
import type { Persona, PersonaId, Lang, IncomeFact, BankAccount, Notice, Claim, RefundHold } from "../lib/types";
import { formatMoney, formatAmount, formatDate, formatDayMonth } from "../lib/money";
import { dict, LANG_NATIVE, LANGS } from "../lib/i18n";

const LOCALIZED_MOCK_STRINGS: Record<string, Record<string, string>> = {
  "Your pay last year": {
    hi: "पिछले वर्ष आपका वेतन",
    ta: "கடந்த ஆண்டு உங்கள் ஊதியம்"
  },
  "Interest your savings account earned": {
    hi: "बचत खाते से कमाया गया ब्याज",
    ta: "சேமிப்புக் கணக்கு ஈட்டிய வட்டி"
  },
  "Interest your accounts earned": {
    hi: "बचत खाते से कमाया गया ब्याज",
    ta: "சேமிப்புக் கணக்கு ஈட்டிய வட்டி"
  },
  "Tax already taken out of your pay": {
    hi: "वेतन से पहले ही काटा गया टैक्स (TDS)",
    ta: "சம்பளத்தில் ஏற்கனவே பிடித்தம் செய்யப்பட்ட வரி (TDS)"
  },
  "Dividend your shares paid out": {
    hi: "शेयरों से मिला लाभांश",
    ta: "பங்குகள் வழங்கிய ஈவுத்தொகை"
  },
  "Money from selling shares": {
    hi: "शेयर बेचने से मिला पैसा",
    ta: "பங்குகள் விற்றதன் மூலம் கிடைத்த பணம்"
  },
  "Tax the bank withheld on your interest": {
    hi: "ब्याज पर बैंक द्वारा काटा गया टैक्स (TDS)",
    ta: "வட்டிக்காக வங்கி பிடித்தம் செய்த வரி (TDS)"
  },
  "Provident fund, insurance and your daughter's tuition": {
    hi: "भविष्य निधि (PF), बीमा और बेटी की ट्यूशन फीस",
    ta: "வருங்கால வைப்பு நிதி (PF), காப்பீடு மற்றும் மகள் கல்வி கட்டணம்"
  },
  "Provident fund and your insurance premium": {
    hi: "भविष्य निधि (PF) और आपका बीमा प्रीमियम",
    ta: "வருங்கால வைப்பு நிதி (PF) மற்றும் காப்பீட்டு பிரீமியம்"
  },
  "Health cover for the family": {
    hi: "परिवार के लिए स्वास्थ्य बीमा",
    ta: "குடும்பத்திற்கான மருத்துவக் காப்பீடு"
  },
  "Rent you paid, with no house-rent allowance from your employer": {
    hi: "आपके द्वारा चुकाया गया किराया (मकान किराया भत्ता के बिना)",
    ta: "செலுத்தப்பட்ட வாடகை (வீட்டு வாடகை அலவன்ஸ் இல்லாமல்)"
  },
  "One figure doesn't match what your broker reported.": {
    hi: "एक आंकड़ा आपके ब्रोकर द्वारा रिपोर्ट किए गए आंकड़े से मेल नहीं खाता।",
    ta: "ஒரு விவரம் உங்கள் புரோக்கர் தெரிவித்த விவரத்துடன் பொருந்தவில்லை."
  },
  "₹18,740 of this is being held against an old bill.": {
    hi: "₹18,740 की राशि एक पुराने बिल के एवज में रोकी जा रही है।",
    ta: "₹18,740 ஒரு பழைய வரித் தேவைக்காக நிறுத்தி வைக்கப்பட்டுள்ளது."
  },
  "The department thinks you left out ₹1,10,000 of share profit.": {
    hi: "विभाग का मानना है कि आपने शेयरों से हुए ₹1,10,000 के मुनाफे को छोड़ दिया है।",
    ta: "நீங்கள் பங்குகள் மூலம் கிடைத்த ₹1,10,000 லாபத்தை விட்டுவிட்டதாக துறை கருதுகிறது."
  },
  "The department wants to keep ₹18,740 of your refund to settle a 2019 bill.": {
    hi: "विभाग 2019 के बिल का निपटारा करने के लिए आपके रिफंड से ₹18,740 रखना चाहता है।",
    ta: "2019-ஆம் ஆண்டின் தேவையைச் சரிசெய்ய உங்கள் ரீஃபண்டிலிருந்து ₹18,740-ஐ வைத்துக்கொள்ளத் துறை விரும்புகிறது."
  },
  "Waiting on one thing: a receipt for your rent claim.": {
    hi: "एक चीज़ की प्रतीक्षा है: आपके किराए के दावे की रसीद।",
    ta: "ஒரே ஒரு விஷயத்திற்குக் காத்திருக்கிறது: உங்கள் வாடகைக் கோரிக்கைக்கான ரசிது."
  },
  "The account you chose can't receive the money.": {
    hi: "आपके द्वारा चुना गया खाता पैसा प्राप्त नहीं कर सकता।",
    ta: "நீங்கள் தேர்ந்தெடுத்த கணக்கில் பணத்தைப் பெற முடியாது."
  },
  "Held: your rent claim needs a receipt.": {
    hi: "रोका गया: आपके किराए के दावे के लिए रसीद की आवश्यकता है।",
    ta: "நிறுத்தப்பட்டுள்ளது: உங்கள் வாடகைக் கோரிக்கைக்கு ரசீது தேவை."
  },
  "Your bank account was checked and failed.": {
    hi: "आपके बैंक खाते की जाँच की गई और वह विफल रही।",
    ta: "உங்கள் வங்கிக் கணக்கு சரிபார்க்கப்பட்டு தோல்வியடைந்தது."
  },
  "The department is asking you to look again at your rent claim.": {
    hi: "विभाग आपसे अपने किराए के दावे को दोबारा देखने के लिए कह रहा है।",
    ta: "உங்கள் வாடகைக் கோரிக்கையை மீண்டும் பார்க்கும்படி துறை உங்களிடம் கேட்கிறது."
  },
  "Meridian Securities reported ₹1,10,000 from share sales. Your return doesn't show it. Until that's settled the refund stays where it is.": {
    hi: "मेरिडियन सिक्योरिटीज ने शेयर बिक्री से ₹1,10,000 की रिपोर्ट की। आपका रिटर्न इसे नहीं दिखाता है। जब तक यह तय नहीं हो जाता, रिफंड वहीं रहेगा।",
    ta: "மெரிடியன் செக்யூரிட்டீஸ் பங்கு விற்பனை மூலம் ₹1,10,000-ஐத் தெரிவித்தது. உங்கள் அறிக்கை காட்டவில்லை. இது முடியும் வரை ரீஃபண்ட் நிறுத்தி வைக்கப்படும்."
  },
  "A demand from 2019-20 is being set off against this year's refund. You can dispute it, and you should read it before the 3rd.": {
    hi: "वर्ष 2019-20 की एक मांग को इस वर्ष के रिफंड के साथ समायोजित किया जा रहा है। आप इसका विरोध कर सकते हैं, और आपको इसे 3 तारीख से पहले पढ़ना चाहिए।",
    ta: "2019-20 ஆம் ஆண்டின் பழைய வரித் தேவை இந்த ஆண்டு ரீஃபண்டில் கழிக்கப்படுகிறது. இதை நீங்கள் மறுக்கலாம், செப்டம்பர் 3-க்கு முன் படித்துப் பார்க்கவும்."
  },
  "If you say nothing by 10 September, ₹1,10,000 is added to your income and about ₹34,300 comes out of your refund.": {
    hi: "यदि आप 10 सितंबर तक कुछ नहीं कहते हैं, तो ₹1,10,000 आपकी आय में जोड़ दिया जाएगा और आपके रिफंड से लगभग ₹34,300 काट लिए जाएंगे।",
    ta: "செப்டம்பர் 10-க்குள் பதில் அளிக்காவிடில், ₹1,10,000 உங்கள் வருமானத்துடன் சேர்க்கப்பட்டு, உங்கள் ரீஃபண்டிலிருந்து சுமார் ₹34,300 பிடித்தம் செய்யப்படும்."
  },
  "If you say nothing by 3 September, ₹18,740 is taken out of your refund and the matter is treated as closed.": {
    hi: "यदि आप 3 सितंबर तक कुछ नहीं कहते हैं, तो आपके रिफंड से ₹18,740 काट लिए जाएंगे और मामला बंद मान लिया जाएगा।",
    ta: "செப்டம்பர் 3-க்குள் பதில் அளிக்காவிடில், உங்கள் ரீஃபண்டிலிருந்து ₹18,740 எடுக்கப்பட்டு, இப்பிரச்சினை முடித்து வைக்கப்படும்."
  },
  "You sold shares for ₹1,10,000 and didn't declare the profit on them.": {
    hi: "आपने ₹1,10,000 के शेयर बेचे और उन पर हुए मुनाफे की घोषणा नहीं की।",
    ta: "நீங்கள் ₹1,10,000 மதிப்புள்ள பங்குகளை விற்று அதன் லாபத்தைத் தெரிவிக்கவில்லை."
  },
  "₹1,10,000 is the total value of everything I sold, not what I made on it. Across those trades I lost ₹4,200. My broker's statement for the year shows the buy prices.": {
    hi: "₹1,10,000 मेरे द्वारा बेची गई सभी चीजों का कुल मूल्य है, न कि मेरा मुनाफा। उन ट्रेडों में मुझे ₹4,200 का नुकसान हुआ। साल का मेरा ब्रोकर विवरण खरीद मूल्य दिखाता है।",
    ta: "₹1,10,000 என்பது நான் விற்றவற்றின் மொத்த மதிப்பு, எனது லாபம் அல்ல. இந்த வர்த்தகங்களில் எனக்கு ₹4,200 நஷ்டம் ஏற்பட்டது. புரோக்கரின் அறிக்கை வாங்கிய விலையைக் காட்டுகிறது."
  },
  "You still owe ₹18,740 from the year 2019-20, so it will be taken from this year's refund.": {
    hi: "आपका अभी भी वर्ष 2019-20 से ₹18,740 बकाया है, इसलिए इसे इस वर्ष के रिफंड से लिया जाएगा।",
    ta: "உங்களுக்கு 2019-20-ஆம் ஆண்டிற்கான நிலுவை ₹18,740 உள்ளது, எனவே அது இந்த ஆண்டின் ரீஃபண்டிலிருந்து கழிக்கப்படும்."
  },
  "You claimed ₹60,000 of rent. Nothing was attached to show it. Add a receipt or your landlord's name and PAN, and this moves.": {
    hi: "आपने ₹60,000 के किराए का दावा किया था। इसे दिखाने के लिए कुछ भी संलग्न नहीं था। एक रसीद या अपने मकान मालिक का नाम और PAN जोड़ें, और यह आगे बढ़ेगा।",
    ta: "நீங்கள் ₹60,000 வாடகைக் கோரியுள்ளீர்கள். சான்றாக எதுவும் இணைக்கப்படவில்லை. ரசீது அல்லது வீட்டு உரிமையாளரின் பெயர், PAN-ஐச் சேர்த்தால் இது நகரும்."
  },
  "Godavari Gramin Bank became part of Deccan Union Bank last year. The account still exists — the code that routes money to it doesn't.": {
    hi: "गोदावरी ग्रामीण बैंक पिछले साल डेक्कन यूनियन बैंक का हिस्सा बन गया। खाता अभी भी मौजूद है — लेकिन इसमें पैसे भेजने वाला कोड (IFSC) मौजूद नहीं है।",
    ta: "கோதாவரி கிராமின் வங்கி கடந்த ஆண்டு டெக்கான் யூனியன் வங்கியுடன் இணைந்தது. கணக்கு இன்னும் உள்ளது, ஆனால் பணம் அனுப்பும் குறியீடு (IFSC) இப்போது இல்லை."
  },
  "You claimed ₹60,000 of rent under 80GG with nothing attached to support it.": {
    hi: "आपने 80GG के तहत ₹60,000 के किराए का दावा किया था, लेकिन इसके समर्थन में कुछ भी संलग्न नहीं था।",
    ta: "நீங்கள் 80GG-இன் கீழ் ₹60,000 வாடகைக் கோரியுள்ளீர்கள், ஆதரிக்க சான்றுகள் எதுவும் இணைக்கப்படவில்லை."
  },
  "I did pay this rent. I have monthly receipts from my landlord and can give their name and PAN.": {
    hi: "मैंने यह किराया चुकाया है। मेरे पास अपने मकान मालिक से मासिक रसीदें हैं और मैं उनका नाम और PAN दे सकता हूँ।",
    ta: "நான் இந்த வாடகையைச் செலுத்தினேன். வீட்டு உரிமையாளரின் மாதாந்திர ரசிதுகள் என்னிடம் உள்ளன, அவர்களின் பெயர், PAN-ஐ வழங்க முடியும்."
  },
  "This is not an accusation and there is no penalty yet. But your ₹28,400 stays where it is until you either back the claim up or withdraw it.": {
    hi: "यह कोई आरोप नहीं है और अभी तक कोई जुर्माना नहीं है। लेकिन आपके ₹28,400 वहीं रहेंगे जब तक कि आप दावे का समर्थन नहीं करते या इसे वापस नहीं लेते।",
    ta: "இது எந்தக் குற்றச்சாட்டும் அல்ல, அபராதமும் இல்லை. ஆனால் உங்கள் ₹28,400, நீங்கள் ஆதாரத்தைச் சமர்ப்பிக்கும் வரை அல்லது திரும்பப் பெறும் வரை அப்படியே இருக்கும்."
  },
  "Look at what they reported": {
    hi: "देखें उन्होंने क्या रिपोर्ट किया",
    ta: "அவர்கள் தெரிவித்ததைப் பாருங்கள்"
  },
  "Read the 2019 demand": {
    hi: "2019 की मांग पढ़ें",
    ta: "2019-ஆம் ஆண்டின் கோரிக்கையைப் படியுங்கள்"
  },
  "Add the receipt": {
    hi: "रसीद जोड़ें",
    ta: "ரசீதைச் சேர்க்கவும்"
  },
  "Point it at the right account": {
    hi: "इसे सही खाते पर इंगित करें",
    ta: "சரியான கணக்கிற்கு மாற்றவும்"
  },
  "Supervisor, garment unit": {
    hi: "पर्यवेक्षक, गारमेंट यूनिट",
    ta: "மேற்பார்வையாளர், ஆடை தயாரிப்பு நிறுவனம்"
  },
  "Primary School Teacher": {
    hi: "प्राथमिक विद्यालय शिक्षिका",
    ta: "தொடக்கப்பள்ளி ஆசிரியர்"
  },
  "Retired bank clerk": {
    hi: "सेवानिवृत्त बैंक क्लर्क",
    ta: "ஓய்வு பெற்ற வங்கி எழுத்தர்"
  },
  "Retired": {
    hi: "सेवानिवृत्त",
    ta: "ஓய்வு பெற்றவர்"
  },
  "Teacher": {
    hi: "शिक्षक",
    ta: "ஆசிரியர்"
  },
  "You sent your return in.": {
    hi: "आपने अपना रिटर्न भेज दिया।",
    ta: "உங்கள் வரி அறிக்கையை அனுப்பியுள்ளீர்கள்."
  },
  "You confirmed it was you. The return counts from here.": {
    hi: "आपने पुष्टि की कि यह आप ही हैं। रिटर्न यहीं से गिना जाएगा।",
    ta: "நீங்கள் உறுதிப்படுத்திவிட்டீர்கள். அறிக்கை இங்கிருந்து கணக்கிடப்படும்."
  },
  "In the queue with everything else filed that week.": {
    hi: "उस सप्ताह दाखिल की गई अन्य सभी चीजों के साथ कतार में।",
    ta: "அந்த வாரத்தில் அனுப்பப்பட்ட மற்ற அறிக்கைகளுடன் வரிசையில் உள்ளது."
  },
  "OTP verified, 4 minutes after filing.": {
    hi: "ओटीपी सत्यापित, दाखिल करने के 4 मिनट बाद।",
    ta: "OTP சரிபார்க்கப்பட்டது, தாக்கல் செய்த 4 நிமிடங்களுக்குப் பிறகு."
  },
  "₹60,000 claimed under 80GG with nothing attached to support it.": {
    hi: "80GG के तहत ₹60,000 का दावा किया गया है, जिसके समर्थन में कुछ भी संलग्न नहीं है।",
    ta: "80GG-இன் கீழ் ₹60,000 கோரப்பட்டுள்ளது, ஆதரிக்க சான்றுகள் எதுவும் இணைக்கப்படவில்லை."
  },
  "Godavari Gramin Bank returned the check: IFSC GODG0004417 no longer routes anywhere.": {
    hi: "गोदावरी ग्रामीण बैंक ने चेक वापस कर दिया: IFSC GODG0004417 अब कहीं नहीं जाता है।",
    ta: "கோதாவரி கிராமின் வங்கி திருப்பி அனுப்பியது: IFSC GODG0004417 இப்போது இல்லை."
  },
  "OTP Verification Complete": {
    hi: "ओटीपी सत्यापन पूर्ण",
    ta: "OTP சரிபார்ப்பு முடிந்தது"
  },
  "Outstanding Compliance Notices": {
    hi: "बकाया अनुपालन नोटिस",
    ta: "நிலுவையில் உள்ள இணக்க அறிவிப்புகள்"
  },
  "Draft Legal Response": {
    hi: "कानूनी जवाब का मसौदा तैयार करें",
    ta: "சட்டபூர்வ பதிலை உருவாக்கவும்"
  },
  "No Pending Actions": {
    hi: "कोई लंबित कार्रवाई नहीं",
    ta: "நிலுவையில் உள்ள பணிகள் எதுவும் இல்லை"
  },
  "Your account is fully compliant with no outstanding notices or tax demands.": {
    hi: "आपका खाता पूरी तरह से अनुपालन में है और कोई बकाया नोटिस या टैक्स मांग नहीं है।",
    ta: "உங்கள் கணக்கு मुख्यமாக இணங்குகிறது, நிலுவை அறிவிப்புகள் அல்லது வரித் தேவைகள் எதுவும் இல்லை."
  },
  "Actionable Assessment Holds": {
    hi: "कार्रवाई योग्य आकलन रोक",
    ta: "மதிப்பீட்டு நிறுத்தங்கள்"
  },
  "Upload Rent Agreement / Receipts": {
    hi: "किराया समझौता / रसीदें अपलोड करें",
    ta: "வாடகை ஒப்பந்தம் / रசீதுகளைப் பதிவேற்றவும்"
  },
  "Landlord Name": {
    hi: "मकान मालिक का नाम",
    ta: "வீட்டு உரிமையாளர் பெயர்"
  },
  "Landlord PAN (10 Digits)": {
    hi: "मकान मालिक का पैन (10 अंक)",
    ta: "வீட்டு உரிமையாளர் PAN (10 இலக்கங்கள்)"
  },
  "Select PDF/JPG": {
    hi: "PDF/JPG चुनें",
    ta: "PDF/JPG தேர்வு செய்யவும்"
  },
  "Submit Receipt": {
    hi: "रसीद जमा करें",
    ta: "ரசீதைச் சமர்ப்பிக்கவும்"
  },
  "Response Position": {
    hi: "प्रतिक्रिया की स्थिति",
    ta: "பதிலளிக்கும் நிலை"
  },
  "I Agree with Department": {
    hi: "मैं विभाग से सहमत हूँ",
    ta: "நான் துறையுடன் உடன்படுகிறேன்"
  },
  "I Disagree (Submit Proof)": {
    hi: "मैं असहमत हूँ (प्रमाण जमा करें)",
    ta: "நான் முரண்படுகிறேன் (சான்றைச் சமர்ப்பிக்கவும்)"
  },
  "Response Statement (Draft)": {
    hi: "प्रतिक्रिया विवरण (मसौदा)",
    ta: "பதில் அறிக்கை (வரைவு)"
  },
  "Dictate Statement": {
    hi: "विवरण बोलकर लिखें",
    ta: "அறிக்கையை ஆடியோவாகச் சொல்லுங்கள்"
  },
  "Listening...": {
    hi: "सुन रहा हूँ...",
    ta: "கேட்டுக்கொண்டிருக்கிறது..."
  },
  "Explain your disagreement or agreement...": {
    hi: "अपनी असहमति या सहमति स्पष्ट करें...",
    ta: "உங்கள் உடன்பாடு அல்லது முரண்பாட்டை விளக்கவும்..."
  },
  "Send Response": {
    hi: "प्रतिक्रिया भेजें",
    ta: "பதிலை அனுப்பவும்"
  },
  "Cancel": {
    hi: "रद्द करें",
    ta: "ரத்து செய்"
  },
  "Validate Bank Code": {
    hi: "बैंक कोड सत्यापित करें",
    ta: "வங்கி குறியீட்டைச் (IFSC) சரிபார்க்கவும்"
  },
  "Update Bank IFSC": {
    hi: "बैंक IFSC अपडेट करें",
    ta: "வங்கி IFSC குறியீட்டைப் புதுப்பிக்கவும்"
  },
  "Verify the 11-digit bank routing code (IFSC) to validate bank details.": {
    hi: "बैंक विवरण सत्यापित करने के लिए 11-अंकीय बैंक रूटिंग कोड (IFSC) सत्यापित करें।",
    ta: "வங்கி விவரங்களைச் சரிபார்க்க 11-இலக்க வங்கி ரூட்டிங் குறியீட்டைச் (IFSC) சரிபார்க்கவும்."
  },
  "IFSC Code": {
    hi: "IFSC कोड",
    ta: "IFSC குறியீடு"
  }
};

const localize = (str: string | undefined, lang: Lang): string => {
  if (!str) return "";
  if (lang === "en") return str;
  return LOCALIZED_MOCK_STRINGS[str.trim()]?.[lang] ?? str;
};

// --- ANIME.JS INTERACTIVE 3D LENS BACKGROUND ---
function AnimeLens() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const waveDotsRef = useRef<SVGPathElement>(null);
  const waveGridRef = useRef<SVGGElement>(null);

  useEffect(() => {
    // 1. Rotate the glowing outer rings
    if (ringRef.current) {
      animate(ringRef.current, {
        rotate: 360,
        duration: 15000,
        loop: true,
        easing: "linear",
      });
    }

    // 2. Animate the dotted waveform
    if (waveDotsRef.current) {
      animate(waveDotsRef.current, {
        strokeDashoffset: [0, -100],
        duration: 2000,
        loop: true,
        easing: "linear",
      });
    }

    // 3. Pulse grid lines
    if (waveGridRef.current) {
      const paths = waveGridRef.current.querySelectorAll("path");
      animate(paths, {
        opacity: [0.3, 0.8, 0.3],
        delay: (el, i) => (i ?? 0) * 100,
        duration: 2000,
        loop: true,
        easing: "easeInOutQuad",
      });
    }

    // 4. Cylinder breathing movement
    if (containerRef.current) {
      animate(containerRef.current, {
        translateY: [0, -12, 0],
        rotateZ: [0, 1.5, 0],
        duration: 6000,
        loop: true,
        easing: "easeInOutQuad",
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-[480px] aspect-square relative select-none">
      <svg
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient id="cylBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a3836" />
            <stop offset="30%" stopColor="#2c2a28" />
            <stop offset="70%" stopColor="#1e1d1c" />
            <stop offset="100%" stopColor="#121111" />
          </linearGradient>

          <linearGradient id="peachHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffb3a7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffd3b6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#252423" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="glowingRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />   {/* Green */}
            <stop offset="30%" stopColor="#f59e0b" />  {/* Yellow */}
            <stop offset="60%" stopColor="#ff4b4b" />  {/* Red */}
            <stop offset="85%" stopColor="#3b82f6" />  {/* Blue */}
            <stop offset="100%" stopColor="#10b981" /> {/* Green */}
          </linearGradient>

          <radialGradient id="lensInterior" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#221111" />
            <stop offset="80%" stopColor="#140d0d" />
            <stop offset="100%" stopColor="#0b0808" />
          </radialGradient>
        </defs>

        {/* Cylinder shadow */}
        <path
          d="M 120,380 L 350,150 L 520,270 L 290,500 Z"
          fill="#1c1a19"
          opacity="0.6"
          filter="blur(15px)"
        />

        {/* Cylinder Main Body */}
        <path
          d="M 105,335 C 75,395 115,465 195,495 C 275,525 360,505 390,445 L 530,305 C 560,245 520,175 440,145 C 360,115 275,135 245,195 Z"
          fill="url(#cylBodyGrad)"
          stroke="#4a4745"
          strokeWidth="2"
        />

        {/* Longitudinal details */}
        <path d="M 245,195 L 105,335" stroke="#121111" strokeWidth="3" />
        <path d="M 320,250 L 180,390" stroke="#121111" strokeWidth="2" />
        <path d="M 375,295 L 235,435" stroke="#121111" strokeWidth="2" />
        <path d="M 440,145 L 300,285" stroke="#121111" strokeWidth="3" />
        <path d="M 530,305 L 390,445" stroke="#121111" strokeWidth="3" />

        {/* Back cap ridge */}
        <path
          d="M 245,195 C 275,135 360,115 440,145 C 520,175 560,245 530,305"
          stroke="#5b5855"
          strokeWidth="3"
          fill="none"
          opacity="0.8"
        />
        
        {/* Shading/Highlights */}
        <path
          d="M 245,195 L 105,335 C 130,310 200,290 280,310 L 395,190 Z"
          fill="url(#peachHighlight)"
          opacity="0.75"
        />

        {/* Front collar and ridges */}
        <path
          d="M 115,325 C 145,265 230,245 310,275 C 390,305 430,375 400,435"
          stroke="#1a1918"
          strokeWidth="10"
          strokeDasharray="4 2"
          fill="none"
        />
        <path
          d="M 105,335 C 75,395 115,465 195,495 C 275,525 360,505 390,445 C 420,385 380,315 300,285 C 220,255 135,275 105,335 Z"
          fill="#1c1a19"
          stroke="#4a4745"
          strokeWidth="3"
        />

        {/* Lens Face */}
        <g transform="translate(247, 390) rotate(21.5)">
          <ellipse cx="0" cy="0" rx="145" ry="110" fill="#141312" stroke="#5b5855" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="138" ry="103" fill="#0f0e0d" stroke="#252423" strokeWidth="4" />

          {/* Rotating Neon Ring */}
          <g ref={ringRef}>
            <ellipse
              cx="0"
              cy="0"
              rx="130"
              ry="95"
              fill="none"
              stroke="url(#glowingRingGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
          </g>

          <ellipse cx="0" cy="0" rx="122" ry="87" fill="url(#lensInterior)" />

          {/* Red Waveform system */}
          <g ref={waveGridRef} opacity="0.65">
            <path d="M -40,-45 L 40,-45" stroke="#ff4b4b" strokeWidth="1" />
            <path d="M -60,-35 L 60,-35" stroke="#ff4b4b" strokeWidth="1" />
            <path d="M -80,-25 L 80,-25" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -95,-15 L 95,-15" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -105,-5 L 105,-5" stroke="#ff4b4b" strokeWidth="2" />
            <path d="M -108,5 L 108,5" stroke="#ff4b4b" strokeWidth="2" />
            <path d="M -100,15 L 100,15" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -85,25 L 85,25" stroke="#ff4b4b" strokeWidth="1.5" />
            <path d="M -65,35 L 65,35" stroke="#ff4b4b" strokeWidth="1" />
            <path d="M -45,45 L 45,45" stroke="#ff4b4b" strokeWidth="1" />
          </g>

          {/* Dotted Sine Wave */}
          <path
            ref={waveDotsRef}
            d="M -110,35 Q -70,-60 -20,-10 T 30,-30 T 80,10 T 110,-15"
            fill="none"
            stroke="#ff4b4b"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="1 10"
            strokeDashoffset="0"
          />

          <path
            d="M -100,0 C -50,60 50,-60 100,0"
            stroke="#ff6f6f"
            strokeWidth="0.75"
            strokeDasharray="2 4"
            opacity="0.4"
          />

          {/* Reflections */}
          <path
            d="M -105,-45 A 115 80 0 0 1 105,-45"
            stroke="#ffffff"
            strokeWidth="3"
            fill="none"
            opacity="0.15"
            strokeLinecap="round"
          />
          <path
            d="M -90,-50 A 105 70 0 0 1 90,-50"
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="none"
            opacity="0.1"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

// --- SCROLL SCATTER & GATHER 3D ANIMATION WRAPPER ---
function ScrollScatter3D({ 
  children, 
  xOffset = 0, 
  yOffset = 0, 
  zOffset = 0,
  rotateXOffset = 0,
  rotateYOffset = 0,
  rotateZOffset = 0
}: { 
  children: React.ReactNode; 
  xOffset?: number; 
  yOffset?: number; 
  zOffset?: number;
  rotateXOffset?: number;
  rotateYOffset?: number;
  rotateZOffset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [xOffset, 0, 0, -xOffset]);
  const y = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [yOffset, 0, 0, -yOffset]);
  const z = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [zOffset, 0, 0, -zOffset]);
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [rotateXOffset, 0, 0, -rotateXOffset]);
  const rotateY = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [rotateYOffset, 0, 0, -rotateYOffset]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [rotateZOffset, 0, 0, -rotateZOffset]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <m.div
      ref={ref}
      style={{ x, y, z, rotateX, rotateY, rotate: rotateZ, opacity }}
      className="will-change-transform"
    >
      {children}
    </m.div>
  );
}

// --- VALIDATION SCHEMAS (ZOD) ---
const panSchema = z.string().regex(/^(DEMP|[A-Z]{5})[0-9]{4}[A-Z]$/, {
  message: "Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)"
});

const ifscSchema = z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
  message: "Invalid IFSC format. Must be 11 characters (e.g. DECU0834471)"
});

// Random names & banks for custom sandbox generator
const MOCK_NAMES = ["Amit Patel", "Deepa Rao", "Vijay Nair", "Neha Sharma", "Rohan Gupta", "Sandhya Iyer"];
const MOCK_BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank"];

// --- DETERMINISTIC SEEDED RANDOM GENERATOR ---
function generateSeededUser(seedString: string, lang: Lang): Persona {
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i);
  }
  
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  const randomName = MOCK_NAMES[Math.floor(rand() * MOCK_NAMES.length)];
  const randomBank = MOCK_BANKS[Math.floor(rand() * MOCK_BANKS.length)];
  const randomPAN = `DEMP${String.fromCharCode(65 + Math.floor(rand() * 26))}${Math.floor(1000 + rand() * 9000)}${String.fromCharCode(65 + Math.floor(rand() * 26))}`;
  
  const salaryVal = Math.floor(450000 + rand() * 200000); // 4.5L to 6.5L
  const interestVal = Math.floor(2500 + rand() * 4000);   // 2.5K to 6.5K
  const tdsVal = Math.floor(12000 + rand() * 8000);

  return {
    id: "sunita", // placeholder
    name: randomName,
    age: 29,
    city: "Bengaluru",
    state: "Karnataka",
    occupation: "Independent Consultant",
    pan: randomPAN,
    mobile: "90000 00004",
    preferredLang: lang,
    situation: "Seeded Sandbox Profile: generated deterministically to ensure a reproducible reviewer demo.",
    act: 1,
    actLabel: "Confirm, don't compose",
    embodies: "Custom sandbox workspace.",
    assessmentYear: "2026-27",
    facts: [
      {
        id: "custom-salary",
        label: "Your primary contract income",
        amount: salaryVal,
        kind: "salary",
        provenance: {
          reporter: "Acme Tech Solutions LLP",
          reporterKind: "employer",
          identifier: "TAN ACME99812A",
          filedOn: "2026-05-18",
          statement: "26AS",
          onlyReporterCanFix: true,
        }
      },
      {
        id: "custom-interest",
        label: "Savings interest",
        amount: interestVal,
        kind: "interest",
        provenance: {
          reporter: "Deccan Union Bank",
          reporterKind: "bank",
          identifier: "IFSC DECU0834471",
          filedOn: "2026-06-05",
          statement: "AIS",
          onlyReporterCanFix: true,
        }
      }
    ],
    taxPaid: [
      {
        id: "custom-tds-192",
        label: "Tax withheld (TDS)",
        amount: tdsVal,
        section: "192",
        provenance: {
          reporter: "Acme Tech Solutions LLP",
          reporterKind: "employer",
          identifier: "TAN ACME99812A",
          filedOn: "2026-05-18",
          statement: "26AS",
          onlyReporterCanFix: true,
        }
      }
    ],
    claims: [
      {
        id: "custom-80c",
        section: "80C",
        label: "Provident Fund / ELSS Mutual Funds",
        amount: 50000,
        evidenceAttached: true,
      }
    ],
    banks: [
      {
        id: "custom-bank-1",
        bank: randomBank,
        maskedNumber: `•••• •••• ${Math.floor(1000 + rand() * 9000)}`,
        ifsc: "SBIN0001834",
        status: "validated",
        nominatedForRefund: true,
      }
    ],
    refund: {
      state: "not_filed",
      amount: tdsVal,
      holds: [],
      timeline: []
    },
    notices: []
  };
}

export default function WapsiPrototype() {
  // --- CORE UI STATES ---
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [step, setStep] = useState<"landing" | "otp" | "dashboard">("landing");
  const [activePersonaId, setActivePersonaId] = useState<PersonaId | "custom" | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  
  // Tab control inside dashboard (Actual portal feeling)
  const [activeTab, setActiveTab] = useState<"overview" | "statement" | "actions">("overview");

  const [scrollProgress, setScrollProgress] = useState(0);
  const [backgroundBills, setBackgroundBills] = useState<{ id: number; x: number; y: number; rotate: number; scale: number; speed: number }[]>([]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("wapsi_theme", nextTheme);
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const pct = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
        setScrollProgress(pct);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Generate stable random offsets for background money notes
    const bills = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotate: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.8,
      speed: 0.2 + Math.random() * 0.6
    }));
    setBackgroundBills(bills);
  }, []);
  
  // Custom user inputs for step 0
  const [customName, setCustomName] = useState("");
  const [customPan, setCustomPan] = useState("");
  const [panInput, setPanInput] = useState("");
  const [panInputError, setPanInputError] = useState<string | null>(null);
  
  // OTP input state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [autoFillCode, setAutoFillCode] = useState("949494");

  // Interaction Modals / Views
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [disputeAmount, setDisputeAmount] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState<string>("");
  
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [noticeResponseText, setNoticeResponseText] = useState<string>("");
  const [noticeAgreed, setNoticeAgreed] = useState<"agree" | "disagree" | null>(null);

  const [activeBankFixId, setActiveBankFixId] = useState<string | null>(null);
  const [ifscInput, setIfscInput] = useState("");
  const [ifscError, setIfscError] = useState<string | null>(null);

  const [rentFile, setRentFile] = useState<string | null>(null);
  const [rentLandlordName, setRentLandlordName] = useState("");
  const [rentLandlordPan, setRentLandlordPan] = useState("");

  const [isFiling, setIsFiling] = useState(false);
  const [isFiled, setIsFiled] = useState(false);
  const [stampFired, setStampFired] = useState(false);

  // Debug Console / Reviewer drawer
  const [showConsole, setShowConsole] = useState(false);
  const [simulatedDelay, setSimulatedDelay] = useState(false);
  const [simulatedError, setSimulatedError] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [speechText, setSpeechText] = useState("");

  // Refs for Anime.js SVG Timeline progress
  const progressPathRef = useRef<SVGLineElement>(null);
  const t = dict(lang);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPersonaId = localStorage.getItem("wapsi_active_id");
    const savedPersonaData = localStorage.getItem("wapsi_active_data");
    const savedLang = localStorage.getItem("wapsi_lang");
    const savedTheme = localStorage.getItem("wapsi_theme");

    if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "ta")) {
      setLang(savedLang as Lang);
    }

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme as "dark" | "light");
    }

    if (savedPersonaId && savedPersonaData) {
      try {
        setActivePersonaId(savedPersonaId as any);
        setPersona(JSON.parse(savedPersonaData));
        setStep("dashboard");
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  // Sync document root class with theme state
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
  }, [theme]);

  // Sync Anime.js timeline path animation on state update
  useEffect(() => {
    if (progressPathRef.current && persona && activeTab === "overview") {
      let targetPct = 0;
      const state = persona.refund.state;
      if (state === "credited") targetPct = 100;
      else if (state === "sent_to_bank") targetPct = 80;
      else if (state === "under_review") targetPct = 60;
      else if (state === "verified") targetPct = 40;
      else if (state === "filed_unverified") targetPct = 20;

      animate(progressPathRef.current, {
        y2: `${targetPct}%`,
        easing: "easeOutQuad",
        duration: 800,
      });
    }
  }, [persona?.refund.state, step, activeTab]);

  // Save state helper
  const saveState = (updatedPersona: Persona) => {
    setPersona(updatedPersona);
    localStorage.setItem("wapsi_active_data", JSON.stringify(updatedPersona));
  };

  // Generate deterministic Sandbox User based on name / PAN seed
  const handleCreateCustom = () => {
    const seed = customName || customPan || "DefaultSeed";
    const customUser = generateSeededUser(seed, lang);

    setActivePersonaId("custom");
    setPersona(customUser);
    setOtp(["9", "4", "9", "4", "9", "4"]); // prefill OTP
    setStep("otp");
  };

  // Select Persona
  const handleSelectPersona = (id: PersonaId) => {
    setActivePersonaId(id);
    const pData = JSON.parse(JSON.stringify(PERSONAS[id])); // deep clone
    setPersona(pData);
    setLang(pData.preferredLang); // Automatically switch to persona's preferred language
    localStorage.setItem("wapsi_lang", pData.preferredLang);
    setOtp(["1", "2", "3", "4", "5", "6"]); // standard OTP mock
    setAutoFillCode(id === "sunita" ? "111111" : id === "rakesh" ? "222222" : "333333");
    setStep("otp");
  };

  // Submit PAN directly
  const handlePanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPan = panInput.toUpperCase().trim();
    
    // Zod validation check
    const validationResult = panSchema.safeParse(cleanPan);
    if (!validationResult.success) {
      setPanInputError(validationResult.error.issues[0].message);
      return;
    }

    setPanInputError(null);
    
    // Check if matches preseeded personas
    const matched = Object.keys(PERSONAS).find(k => PERSONAS[k as PersonaId].pan.toUpperCase() === cleanPan);
    if (matched) {
      handleSelectPersona(matched as PersonaId);
    } else {
      setCustomPan(cleanPan);
      handleCreateCustom();
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // auto focus next box
    if (val !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (simulatedError) {
      setOtpError(true);
      return;
    }

    const typedCode = otp.join("");
    const correctCode = activePersonaId === "custom" ? "949494" : autoFillCode;

    if (typedCode === correctCode || typedCode === "949494" || activePersonaId === "custom") {
      setOtpError(false);
      if (persona) {
        localStorage.setItem("wapsi_active_id", activePersonaId as string);
        localStorage.setItem("wapsi_active_data", JSON.stringify(persona));
        
        // Simulating loader for premium UI
        if (simulatedDelay) {
          setIsFiling(true);
          setTimeout(() => {
            setIsFiling(false);
            setStep("dashboard");
            setActiveTab("overview");
          }, 3000);
        } else {
          setStep("dashboard");
          setActiveTab("overview");
        }
      }
    } else {
      setOtpError(true);
    }
  };

  // Log Out / Reset
  const handleLogOut = () => {
    localStorage.clear();
    setStep("landing");
    setActivePersonaId(null);
    setPersona(null);
    setPanInput("");
    setPanInputError(null);
    setOtp(["", "", "", "", "", ""]);
    setOtpError(false);
    setIsFiled(false);
    setStampFired(false);
  };

  // Change Language
  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("wapsi_lang", l);
  };

  // Calculate Refund Outcome dynamically
  const calculateRefund = () => {
    if (!persona) return 0;
    
    // Sum of Income
    const totalIncome = persona.facts.reduce((sum, item) => sum + item.amount, 0);
    // Deductions
    const totalDeductions = persona.claims.reduce((sum, item) => sum + item.amount, 0);
    // Net Taxable Income
    const taxable = Math.max(0, totalIncome - totalDeductions);
    
    // Simplified tax slab calculation under New Tax Regime FY 2026-27:
    // Net taxable income <= 7L gets a full Section 87A tax rebate (liability is 0)
    let liability = 0;
    if (taxable > 700000) {
      liability = Math.round((taxable - 700000) * 0.15);
    }
    
    const totalTds = persona.taxPaid.reduce((sum, item) => sum + item.amount, 0);
    return totalTds - liability;
  };

  // Live Inline Inputs (Direct dashboard edits)
  const handleFactAmountChange = (factId: string, val: string) => {
    if (!persona) return;
    const cleanVal = val.replace(/[^0-9]/g, "");
    const num = Number(cleanVal);
    
    const updatedFacts = persona.facts.map(f => {
      if (f.id === factId) {
        return { ...f, amount: isNaN(num) ? 0 : num };
      }
      return f;
    });
    
    saveState({ ...persona, facts: updatedFacts });
  };

  // Inline Claims Update
  const handleClaimAmountChange = (claimId: string, val: string) => {
    if (!persona) return;
    const cleanVal = val.replace(/[^0-9]/g, "");
    const num = Number(cleanVal);

    const updatedClaims = persona.claims.map(c => {
      if (c.id === claimId) {
        return { ...c, amount: isNaN(num) ? 0 : num };
      }
      return c;
    });

    saveState({ ...persona, claims: updatedClaims });
  };

  // --- INTERACTIVE FEATURES FOR PERSONAS ---

  // 1. Fact Dispute Popup
  const openDispute = (fact: IncomeFact) => {
    setActiveDisputeId(fact.id);
    setDisputeAmount(fact.dispute?.citizenAmount?.toString() || fact.amount.toString());
    setDisputeReason(fact.dispute?.reason || "");
  };

  const saveDispute = () => {
    if (!persona) return;
    
    const updatedFacts = persona.facts.map(f => {
      if (f.id === activeDisputeId) {
        return {
          ...f,
          dispute: {
            citizenAmount: Number(disputeAmount),
            reason: disputeReason || "Incorrectly reported figure"
          }
        };
      }
      return f;
    });

    const updatedPersona = { ...persona, facts: updatedFacts };
    
    // Rakesh mismatch notice resolution logic
    if (persona.id === "rakesh" && activeDisputeId === "rakesh-capital-gains") {
      if (Number(disputeAmount) === 0) {
        const updatedHolds = persona.refund.holds.map(h => 
          h.kind === "ais_mismatch" ? { ...h, resolved: true } : h
        );
        updatedPersona.refund.holds = updatedHolds;
      }
    }

    saveState(updatedPersona);
    setActiveDisputeId(null);
  };

  // 2. Bank IFSC Correction
  const handleFixBank = (bank: BankAccount) => {
    setActiveBankFixId(bank.id);
    setIfscInput(bank.supersededBy?.ifsc || "");
    setIfscError(null);
  };

  const saveBankFix = () => {
    if (!persona || !activeBankFixId) return;

    // Zod validation check
    const validationResult = ifscSchema.safeParse(ifscInput);
    if (!validationResult.success) {
      setIfscError(validationResult.error.issues[0].message);
      return;
    }

    const updatedBanks = persona.banks.map(b => {
      if (b.id === activeBankFixId) {
        return {
          ...b,
          ifsc: ifscInput,
          status: "validated" as const,
          bank: b.supersededBy?.bank || b.bank,
          supersededBy: undefined
        };
      }
      return b;
    });

    const updatedHolds = persona.refund.holds.map(h => 
      h.kind === "bank_invalid" ? { ...h, resolved: true } : h
    );

    const allResolved = updatedHolds.every(h => h.resolved);
    const updatedRefund = { 
      ...persona.refund, 
      holds: updatedHolds,
      state: allResolved ? ("sent_to_bank" as const) : persona.refund.state
    };

    saveState({ ...persona, banks: updatedBanks, refund: updatedRefund });
    setActiveBankFixId(null);

    // If all resolved, trigger automatic credited progression after a delay
    if (allResolved) {
      triggerTimelineProgress("sent_to_bank");
    }
  };

  // 3. Rent Receipt Verification
  const handleUploadRent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRentFile(e.target.files[0].name);
    }
  };

  const saveRentClaim = () => {
    if (!persona || !rentFile) return;

    const updatedHolds = persona.refund.holds.map(h => 
      h.kind === "nudge_deduction" ? { ...h, resolved: true } : h
    );

    const allResolved = updatedHolds.every(h => h.resolved);
    const updatedRefund = { 
      ...persona.refund, 
      holds: updatedHolds,
      state: allResolved ? ("sent_to_bank" as const) : persona.refund.state
    };

    saveState({ ...persona, refund: updatedRefund });
    setRentFile(null);

    // If all resolved, trigger automatic credited progression after a delay
    if (allResolved) {
      triggerTimelineProgress("sent_to_bank");
    }
  };

  // 4. Respond to Notice
  const handleNoticeClick = (notice: Notice) => {
    setSelectedNoticeId(notice.id);
    setNoticeAgreed(notice.items[0].position || null);
    setNoticeResponseText(notice.items[0].draftedResponse || notice.items[0].citizenTruth || "");
  };

  const saveNoticeResponse = () => {
    if (!persona || !selectedNoticeId) return;

    const updatedNotices = persona.notices.map(n => {
      if (n.id === selectedNoticeId) {
        return {
          ...n,
          status: "responded" as const,
          items: n.items.map(i => ({
            ...i,
            position: noticeAgreed || undefined,
            draftedResponse: noticeResponseText
          }))
        };
      }
      return n;
    });

    let updatedHolds = [...persona.refund.holds];
    if (selectedNoticeId === "rakesh-notice-143" && noticeAgreed === "disagree") {
      updatedHolds = updatedHolds.map(h => 
        h.kind === "ais_mismatch" ? { ...h, resolved: true } : h
      );
    }
    if (selectedNoticeId === "rakesh-notice-245" && noticeAgreed === "disagree") {
      updatedHolds = updatedHolds.map(h => 
        h.kind === "demand_setoff" ? { ...h, resolved: true } : h
      );
    }

    const allResolved = updatedHolds.every(h => h.resolved);
    const updatedRefund = { 
      ...persona.refund, 
      holds: updatedHolds,
      state: allResolved ? ("sent_to_bank" as const) : persona.refund.state
    };

    saveState({ 
      ...persona, 
      notices: updatedNotices, 
      refund: updatedRefund 
    });
    setSelectedNoticeId(null);

    // If all resolved, trigger automatic credited progression after a delay
    if (allResolved) {
      triggerTimelineProgress("sent_to_bank");
    }
  };

  // 5. Submit Filing (Trigger dynamic progress timer)
  const handleSendFiling = () => {
    if (!persona) return;
    setIsFiling(true);

    const delay = simulatedDelay ? 3000 : 1500;
    setTimeout(() => {
      setIsFiling(false);
      setIsFiled(true);
      
      const updatedRefund = {
        ...persona.refund,
        state: "filed_unverified" as const,
        filedOn: TODAY,
        timeline: [
          {
            id: "filing-timeline-1",
            on: TODAY,
            state: "filed_unverified" as const,
            headline: "Return filed successfully",
            actor: "citizen" as const
          }
        ]
      };

      saveState({ ...persona, refund: updatedRefund });
      setTimeout(() => setStampFired(true), 400);

      // Start automatic progression to Credited
      triggerTimelineProgress("filed_unverified");
    }, delay);
  };

  // --- AUTOMATIC TIMELINE PROGRESSION SAGA ---
  const triggerTimelineProgress = (startState: string) => {
    let currentState = startState;
    const statesOrder = ["filed_unverified", "verified", "under_review", "sent_to_bank", "credited"];
    let currentIndex = statesOrder.indexOf(currentState);
    
    if (currentIndex === -1) currentIndex = 0;
    
    const interval = setInterval(() => {
      const savedPersonaData = localStorage.getItem("wapsi_active_data");
      if (!savedPersonaData) {
        clearInterval(interval);
        return;
      }
      
      const currentPersonaObj: Persona = JSON.parse(savedPersonaData);
      
      if (currentIndex < statesOrder.length - 1) {
        currentIndex++;
        const nextState = statesOrder[currentIndex];
        
        const updatedTimeline = [...currentPersonaObj.refund.timeline];
        let headline = "";
        let actor: "citizen" | "department" | "bank" = "department";
        
        if (nextState === "verified") {
          headline = "Identity Verification Completed (via OTP)";
          actor = "citizen";
        } else if (nextState === "under_review") {
          headline = "Assessment and Tax Slabs Processed";
          actor = "department";
        } else if (nextState === "sent_to_bank") {
          headline = "Refund cleared & sent to bank gateway";
          actor = "department";
        } else if (nextState === "credited") {
          headline = "Refund credited into nominated account";
          actor = "bank";
        }
        
        updatedTimeline.push({
          id: `auto-tl-${Date.now()}-${nextState}`,
          on: TODAY,
          state: nextState as any,
          headline: headline,
          actor: actor
        });
        
        const updatedRefund = {
          ...currentPersonaObj.refund,
          state: nextState as any,
          timeline: updatedTimeline
        };
        
        saveState({ ...currentPersonaObj, refund: updatedRefund });
      } else {
        clearInterval(interval);
      }
    }, 1500); // Progresses one step every 1.5 seconds
  };

  // Voice recognition simulation (A11y dictation)
  const toggleSpeechMock = () => {
    if (isSpeechListening) {
      setIsSpeechListening(false);
      return;
    }

    setIsSpeechListening(true);
    setSpeechText("Listening...");

    setTimeout(() => {
      const texts = [
        "No, Meridian Securities reported the wrong share profit. The total amount sold was ₹1,10,000, but I made a loss.",
        "Godavari Gramin Bank merged into Deccan Union Bank. My new IFSC is DECU0834471.",
        "Please look at my tenant receipts, I paid the entire rent amount.",
      ];
      const selectedText = texts[Math.floor(Math.random() * texts.length)];
      setSpeechText(selectedText);
      
      if (activeDisputeId) {
        setDisputeReason(selectedText);
      } else if (selectedNoticeId) {
        setNoticeResponseText(selectedText);
      }
      setIsSpeechListening(false);
    }, 2000);
  };

  // Add Income Row (Interactive Sandbox Builder)
  const handleAddCustomIncome = () => {
    if (!persona || activePersonaId !== "custom") return;
    const newId = `custom-fact-${Date.now()}`;
    const newFact: IncomeFact = {
      id: newId,
      label: "Freelance consulting fee",
      amount: 45000,
      kind: "other",
      provenance: {
        reporter: "Self Reported",
        reporterKind: "self",
        filedOn: TODAY,
        statement: "self",
        onlyReporterCanFix: false
      }
    };
    saveState({ ...persona, facts: [...persona.facts, newFact] });
  };

  const handleIfscInputChange = (val: string) => {
    const cleanIfsc = val.toUpperCase().trim();
    setIfscInput(cleanIfsc);
    const parsed = ifscSchema.safeParse(cleanIfsc);
    if (!parsed.success) {
      setIfscError(parsed.error.issues[0].message);
    } else {
      setIfscError(null);
    }
  };

  const handlePanInputChange = (val: string) => {
    const cleanPan = val.toUpperCase().trim();
    setPanInput(cleanPan);
    const parsed = panSchema.safeParse(cleanPan);
    if (!parsed.success) {
      setPanInputError(parsed.error.issues[0].message);
    } else {
      setPanInputError(null);
    }
  };

  return (
    <LazyMotion features={domMax} strict>
      <div className={`flex-1 bg-paper text-ink selection:bg-money/20 relative overflow-x-hidden min-h-dvh flex flex-col ${theme === "light" ? "light-mode" : ""}`}>
        
        {/* Dotted Grid Background */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-40 z-0"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-border) 1px, transparent 1px)`,
            backgroundSize: "24px 24px"
          }}
        />

        {/* Fixed Anime.js Background Graphics */}
        <div className="fixed bottom-[-150px] right-[-150px] w-[500px] h-[500px] opacity-15 pointer-events-none z-0 lg:block hidden">
          <AnimeLens />
        </div>
        <div className="fixed bottom-[-100px] right-[-100px] w-[350px] h-[350px] opacity-10 pointer-events-none z-0 block lg:hidden">
          <AnimeLens />
        </div>

        {/* --- PORTAL HEADER --- */}
        <header className="border-b border-line bg-paper text-ink z-10 relative">
          {/* Top small banner */}
          <div className="bg-navy-dark px-4 py-1.5 text-[0.65rem] flex items-center justify-between font-mono text-ink-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-money rounded-full animate-pulse" />
              <span>GOVERNMENT OF INDIA &bull; INCOME TAX DEPARTMENT</span>
            </span>
            <span className="hidden md:inline">ASSESSMENT YEAR 2026-27</span>
          </div>
          
          <div className="px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center space-x-3">
              <div className="bg-paper-2 p-1.5 rounded-[4px] border border-line flex items-center justify-center">
                <span className="font-extrabold text-money text-lg tracking-tight font-sans">
                  e-Filing
                </span>
              </div>
              <div className="h-6 w-[1px] bg-line hidden md:block" />
              <div className="space-y-0.5">
                <h1 className="font-bold text-sm tracking-wide text-ink uppercase">WAPSI DIRECT PORTAL</h1>
                <p className="text-[0.65rem] text-ink-2 tracking-wider">SECURE PUBLIC SERVICE PLATFORM</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-auto">
              {/* Lang switcher */}
              <div className="flex bg-paper-2 border border-line rounded p-0.5 text-xs font-mono">
                {LANGS.map(l => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      lang === l ? "bg-money text-[#FFFFFF] font-semibold shadow-sm" : "text-ink-2 hover:bg-slate-200"
                    }`}
                  >
                    {LANG_NATIVE[l]}
                  </button>
                ))}
              </div>

              {/* Theme Toggler */}
              <button
                onClick={toggleTheme}
                className="p-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={14} className="text-money" />
                    <span>LIGHT</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-money" />
                    <span>DARK</span>
                  </>
                )}
              </button>

              {/* Reviewer Settings Gear */}
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="p-1.5 bg-paper-2 border border-line rounded text-ink-2 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              >
                <Settings size={14} className={showConsole ? "animate-spin" : ""} />
                <span>SANDBOX</span>
              </button>
            </div>
          </div>
        </header>

        {/* --- MAIN BODY --- */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 relative">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: LANDING */}
            {step === "landing" && (
              <m.div
                key="landing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid lg:grid-cols-12 gap-8 items-center min-h-[75vh]"
              >
                {/* LEFT COLUMN: TITLE, SUBTITLE, FORM, CITIZENS LIST */}
                <div className="lg:col-span-7 space-y-8 text-left z-10">
                  {/* HERO BLOCK */}
                  <div className="space-y-4">
                    <span className="text-[11px] font-mono text-money bg-money-soft border border-money/20 px-2.5 py-0.5 rounded uppercase tracking-[0.12em] font-semibold">
                      Simplified Tax Return POC
                    </span>
                    <h1 className="text-[3.2rem] lg:text-[4rem] font-bold tracking-tight text-ink leading-none font-sans lowercase">
                      refund engine.
                    </h1>
                    <h2 className="text-[1.6rem] lg:text-[2rem] font-bold tracking-tight text-ink leading-tight font-sans">
                      {t.landing.question}
                    </h2>
                    <p className="text-base text-ink-2 leading-relaxed max-w-xl">
                      {t.landing.subtext}
                    </p>
                  </div>

                  {/* DIRECT PAN LOGIN FORM */}
                  <form 
                    onSubmit={handlePanSubmit}
                    className="bg-paper-2 border border-line rounded-[12px] p-6 max-w-md shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-mono text-ink-2 uppercase tracking-wider mb-2">
                        {t.landing.panLabel}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={panInput}
                          onChange={(e) => handlePanInputChange(e.target.value)}
                          maxLength={10}
                          placeholder="e.g. DEMPS4417K"
                          className={`w-full bg-paper-3 border ${
                            panInputError ? "border-alarm animate-shake" : "border-line focus:border-money"
                          } text-lg font-mono tracking-widest px-4 py-3 rounded-[4px] focus:outline-none transition-colors text-center uppercase text-ink`}
                        />
                      </div>
                      {panInputError ? (
                        <span className="block text-xs text-alarm mt-1.5 font-medium">
                          {panInputError}
                        </span>
                      ) : (
                        <span className="block text-[0.7rem] text-ink-3 mt-1.5">
                          {t.landing.panHelp}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-money-soft hover:translate-y-[1px] hover:translate-x-[1px] text-money text-sm font-semibold py-3 px-4 rounded-[4px] border border-line transition-transform flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>{t.landing.check}</span>
                      <ChevronRight size={16} />
                    </button>
                  </form>

                  {/* PRE-LOADED MOCK CITIZENS GRID */}
                  <div className="space-y-4">
                    <span className="block text-xs font-mono text-ink-2 uppercase tracking-wider">
                      {t.landing.orTryAs}
                    </span>

                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                      {/* Sunita Devi */}
                      <m.div
                        whileHover={{ y: 2, x: 2 }}
                        onClick={() => handleSelectPersona("sunita")}
                        className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Sunita Devi</h3>
                            <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                              {t.personas.sunita.phase}
                            </span>
                          </div>
                          <p className="text-xs text-ink-2 leading-relaxed">
                            {t.personas.sunita.blurb}
                          </p>
                        </div>
                        <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                          <span>{t.personas.sunita.action}</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </m.div>

                      {/* Rakesh Kumar */}
                      <m.div
                        whileHover={{ y: 2, x: 2 }}
                        onClick={() => handleSelectPersona("rakesh")}
                        className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Rakesh Kumar</h3>
                            <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                              {t.personas.rakesh.phase}
                            </span>
                          </div>
                          <p className="text-xs text-ink-2 leading-relaxed">
                            {t.personas.rakesh.blurb}
                          </p>
                        </div>
                        <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                          <span>{t.personas.rakesh.action}</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </m.div>

                      {/* Priya Sharma */}
                      <m.div
                        whileHover={{ y: 2, x: 2 }}
                        onClick={() => handleSelectPersona("priya")}
                        className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-ink group-hover:text-money transition-colors">Priya Sharma</h3>
                            <span className="text-[0.7rem] font-mono bg-paper border border-line text-ink-3 px-2 py-0.5 rounded uppercase">
                              {t.personas.priya.phase}
                            </span>
                          </div>
                          <p className="text-xs text-ink-2 leading-relaxed">
                            {t.personas.priya.blurb}
                          </p>
                        </div>
                        <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                          <span>{t.personas.priya.action}</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </m.div>

                      {/* Seeded Custom Sandbox Mode Card */}
                      <m.div
                        whileHover={{ y: 2, x: 2 }}
                        onClick={handleCreateCustom}
                        className="bg-paper-2 border border-line rounded-[12px] p-5 hover:border-money hover:bg-paper-2/40 cursor-pointer transition-all flex flex-col justify-between space-y-4 group hover:shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-ink group-hover:text-money transition-colors flex items-center gap-1.5">
                              <Sparkles size={14} className="text-money animate-pulse" />
                              <span>{t.personas.custom.blurbTitle}</span>
                            </h3>
                            <span className="text-[0.65rem] font-mono bg-money-soft border border-money/20 text-money px-1.5 py-0.5 rounded uppercase">
                              {t.personas.custom.phase}
                            </span>
                          </div>
                          <p className="text-xs text-ink-2 leading-relaxed">
                            {t.personas.custom.blurb}
                          </p>
                        </div>
                        <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs font-mono text-money">
                          <span>{t.personas.custom.action}</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </m.div>
                    </div>
                  </div>

                  {/* Subfooter route links */}
                  <div className="flex items-center space-x-6 pt-6 border-t border-line/60 max-w-md">
                    <Link href="/architecture" className="text-xs text-ink-2 hover:text-[#FF4B4B] hover:underline flex items-center gap-1 font-mono">
                      <Cpu size={12} />
                      <span>Technical Architecture</span>
                    </Link>
                    <Link href="/honesty" className="text-xs text-ink-2 hover:text-[#FF4B4B] hover:underline flex items-center gap-1 font-mono">
                      <BookOpen size={12} />
                      <span>Honesty Disclosures</span>
                    </Link>
                  </div>
                </div>

                {/* RIGHT COLUMN: ANIMATED 3D CAMERA LENS GRAPHIC */}
                <div className="lg:col-span-5 hidden lg:flex items-center justify-center relative">
                  <div className="relative">
                    <AnimeLens />
                    <div className="absolute bottom-[-20px] right-4 text-[10px] font-mono text-ink-3">
                      LENS / WAVEFORM SIMULATION v4.5.0
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {/* STEP 2: VERIFICATION OTP */}
            {step === "otp" && (
              <m.div
                key="otp"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="max-w-md mx-auto space-y-8 mt-12 text-center"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-money-soft text-money rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserCheck size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-ink">e-Filing Verification</h2>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    OTP sent to registered mobile {persona?.mobile || "90000 00000"}
                  </p>
                </div>

                {/* Passcode Boxes */}
                <div className="space-y-4">
                  <div className="flex justify-center space-x-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && otp[idx] === "" && idx > 0) {
                            const prevInput = document.getElementById(`otp-${idx - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        className={`w-12 h-14 bg-paper-2 border ${
                          otpError ? "border-alarm" : "border-line focus:border-money"
                        } text-xl font-semibold text-center rounded-lg focus:outline-none transition-colors`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <span className="block text-xs text-alarm font-medium">
                      Incorrect mock verification code.
                    </span>
                  )}
                </div>

                <div className="bg-paper-2 border border-line rounded-lg p-4 space-y-2 text-left">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink">
                    <Sparkles size={12} className="text-money" />
                    <span>Prototype OTP Validation</span>
                  </div>
                  <p className="text-[0.7rem] text-ink-2 leading-relaxed">
                    This is an isolated, mock verification step. No actual SMS will be dispatched.
                  </p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[0.75rem] font-mono text-ink-3">
                      Mock Code: <strong className="text-money">{activePersonaId === "custom" ? "949494" : autoFillCode}</strong>
                    </span>
                    <button
                      onClick={() => {
                        const code = activePersonaId === "custom" ? "949494" : autoFillCode;
                        setOtp(code.split(""));
                        setOtpError(false);
                      }}
                      className="text-xs text-money hover:underline underline-offset-2 font-semibold"
                    >
                      Auto-fill
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setStep("landing")}
                    className="flex-1 border border-line text-ink-2 py-3 px-4 rounded-lg hover:bg-paper-2 transition-colors text-sm font-semibold flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft size={16} />
                    <span>{t.common.back}</span>
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    className="flex-1 bg-money hover:bg-money-deep text-paper py-3 px-4 rounded-lg transition-colors text-sm font-semibold"
                  >
                    Verify &amp; Enter Portal
                  </button>
                </div>
              </m.div>
            )}

            {/* STEP 3: DASHBOARD */}
            {step === "dashboard" && persona && (
              <m.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-left"
              >
                
                {/* ACTIVE PROFILE STRIP */}
                <div className="bg-white border border-line rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-slate-100 border border-line text-ink-2 px-2.5 py-0.5 rounded-full font-semibold">
                        PAN: {persona.pan}
                      </span>
                      <span className="text-xs font-bold text-ink leading-none">
                        {persona.name} ({localize(persona.occupation, lang)})
                      </span>
                    </div>
                    <p className="text-xs text-ink-2">
                      <strong>Filing Status AY 2026-27:</strong> {localize(persona.situation, lang)}
                    </p>
                  </div>

                  <button
                    onClick={handleLogOut}
                    className="text-xs border border-line bg-paper px-3 py-1.5 rounded hover:bg-paper-2 text-ink-2 hover:text-alarm transition-colors self-start md:self-auto flex items-center gap-1.5 font-mono font-semibold"
                  >
                    <RefreshCw size={12} />
                    <span>LOG OUT</span>
                  </button>
                </div>

                {/* THE PORTAL TAB CONTROL PANEL */}
                <div className="border-b border-line flex space-x-6 text-sm font-semibold text-ink-2">
                  <button 
                    onClick={() => setActiveTab("overview")}
                    className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === "overview" ? "border-navy text-navy font-bold" : "border-transparent hover:text-ink hover:border-line"
                    }`}
                  >
                    <Grid size={16} />
                    <span>{t.dashboard.userDashboard}</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("statement")}
                    className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === "statement" ? "border-navy text-navy font-bold" : "border-transparent hover:text-ink hover:border-line"
                    }`}
                  >
                    <FileText size={16} />
                    <span>{t.dashboard.taxPrefills}</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("actions")}
                    className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 relative ${
                      activeTab === "actions" ? "border-navy text-navy font-bold" : "border-transparent hover:text-ink hover:border-line"
                    }`}
                  >
                    <ShieldAlert size={16} />
                    <span>{t.dashboard.pendingActions}</span>
                    {persona.notices.length > 0 && (
                      <span className="absolute -top-1.5 -right-3 w-4 h-4 bg-alarm text-paper text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                        {persona.notices.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* TAB WINDOW ROUTER */}
                <m.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                  className="pt-2"
                >
                  
                  {/* TAB 1: OVERVIEW / DASHBOARD */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      
                      {/* REFUND TICKET BLOCK */}
                      <div className="bg-money-soft border border-money/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                        {isFiled && stampFired && (
                          <m.div 
                            initial={{ scale: 2.5, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 0.85, rotate: -12 }}
                            transition={{ type: "spring", stiffness: 100, damping: 10 }}
                            className="absolute right-10 top-2 font-mono text-[1.4rem] font-bold border-4 border-alarm text-alarm px-4 py-1.5 uppercase rounded tracking-widest pointer-events-none select-none z-10 bg-white/40 backdrop-blur-sm"
                          >
                            FILED {TODAY}
                          </m.div>
                        )}

                        <div className="space-y-2">
                          <span className="text-xs font-mono text-money uppercase tracking-wider font-semibold">
                            {t.dashboard.returnSummary}
                          </span>
                          <h2 className="text-3xl font-extrabold text-navy tracking-tight tabular">
                            {calculateRefund() > 0 
                              ? t.file.outcomeRefund(formatMoney(calculateRefund(), lang))
                              : calculateRefund() === 0
                              ? t.file.outcomeOwesNothing
                              : t.file.outcomeOwes(formatMoney(Math.abs(calculateRefund()), lang))
                            }
                          </h2>
                          <p className="text-xs text-ink-2">
                            {persona.refund.state === "not_filed" 
                              ? t.dashboard.reviewPrefill
                              : t.dashboard.filingSubmitted
                            }
                          </p>
                        </div>

                        {persona.refund.state === "not_filed" && (
                          <button
                            onClick={handleSendFiling}
                            disabled={isFiling}
                            className="bg-navy hover:bg-navy-light text-paper font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm z-20"
                          >
                            {isFiling ? (
                              <>
                                <RefreshCw className="animate-spin" size={16} />
                                <span>Filing with CPC...</span>
                              </>
                            ) : (
                              <>
                                <FileCheck size={16} />
                                <span>Send Return</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* DASHBOARD DETAILS GRID */}
                      <div className="grid lg:grid-cols-5 gap-6 items-start">
                        
                        {/* LEFT COLUMN: BANK LINKS */}
                        <div className="lg:col-span-3 space-y-6">
                          <div className="bg-white border border-line rounded-xl p-5 space-y-4">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
                              {t.dashboard.verifiedBanks}
                            </h3>

                            <div className="space-y-3">
                              {persona.banks.map((bank) => (
                                <div 
                                  key={bank.id}
                                  className={`bg-slate-50 border rounded-xl p-4 flex flex-col justify-between gap-3 text-left ${
                                    bank.status === "failed" ? "border-alarm bg-alarm-soft/10" : "border-line"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                                        <Building2 size={16} className="text-ink-2" />
                                        <span>{bank.bank}</span>
                                      </span>
                                      <span className="text-xs font-mono text-ink-2">
                                        {bank.maskedNumber} &bull; IFSC: <strong className="text-ink">{bank.ifsc}</strong>
                                      </span>
                                    </div>

                                    <div className="text-right">
                                      <span className={`text-[0.7rem] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                                        bank.status === "validated" 
                                          ? "bg-money-soft text-money"
                                          : bank.status === "under_process"
                                          ? "bg-warn-soft text-warn"
                                          : "bg-alarm-soft text-alarm"
                                      }`}>
                                        {bank.status}
                                      </span>
                                      <span className="block text-[0.65rem] text-ink-3 font-mono mt-1">
                                        {bank.nominatedForRefund ? t.dashboard.primaryRefundAccount : t.dashboard.backupAccount}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Bank Merger resolution trigger */}
                                  {bank.supersededBy && (
                                    <div className="border-t border-line/65 pt-3 space-y-2">
                                      <p className="text-xs text-alarm leading-normal">
                                        <strong>Stale IFSC hold:</strong> Godavari Gramin Bank merged into Deccan Union Bank. Code no longer routes.
                                      </p>
                                      <button
                                        onClick={() => handleFixBank(bank)}
                                        className="text-xs bg-alarm text-paper py-1.5 px-3 rounded font-semibold hover:bg-alarm-deep transition-colors"
                                      >
                                        Update to Deccan Union Bank IFSC ({bank.supersededBy.ifsc})
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: TIMELINE & HOLDS */}
                        <div className="lg:col-span-2 space-y-6">
                                    {/* TIMELINE */}
                          {persona.refund.state !== "not_filed" && (
                            <div className="bg-white border border-line rounded-xl p-5 space-y-6 shadow-sm">
                              <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
                                {t.dashboard.refundTimeline}
                              </h3>

                              <div className="relative pl-6 space-y-8">
                                {/* Vertical line container */}
                                <div className="absolute left-[7.5px] top-1 bottom-2 w-[2px] bg-line">
                                  <svg className="absolute left-[-0.5px] top-0 bottom-0 w-[3px] h-full overflow-visible pointer-events-none">
                                    <line
                                      ref={progressPathRef}
                                      x1="1.5"
                                      y1="0"
                                      x2="1.5"
                                      y2="0%"
                                      stroke="var(--color-money)"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>

                                {/* Timeline Step 1 */}
                                <div className="relative text-xs">
                                  <span className="absolute -left-[23px] w-4 h-4 rounded-full bg-money border-2 border-paper flex items-center justify-center text-paper">
                                    <Check size={8} />
                                  </span>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-ink">{t.dashboard.filingSubmittedTimeline}</span>
                                    <span className="block text-ink-3 font-mono text-[0.65rem]">{formatDate(persona.refund.filedOn || TODAY, lang)}</span>
                                  </div>
                                </div>

                                {/* Timeline Step 2 */}
                                <div className="relative text-xs">
                                  <span className="absolute -left-[23px] w-4 h-4 rounded-full bg-money border-2 border-paper flex items-center justify-center text-paper">
                                    <Check size={8} />
                                  </span>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-ink">{t.dashboard.identityVerifiedTimeline}</span>
                                    <span className="block text-ink-3 font-mono text-[0.65rem]">{localize("OTP Verification Complete", lang)}</span>
                                  </div>
                                </div>

                                {/* Timeline Step 3 */}
                                <div className="relative text-xs">
                                  <span className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 border-paper flex items-center justify-center ${
                                    persona.refund.state === "under_review" 
                                      ? "bg-warn text-paper animate-pulse" 
                                      : ["sent_to_bank", "credited"].includes(persona.refund.state)
                                      ? "bg-money text-paper" 
                                      : "bg-line text-ink-3"
                                  }`}>
                                    {["sent_to_bank", "credited"].includes(persona.refund.state) ? <Check size={8} /> : null}
                                  </span>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-ink">{t.dashboard.assessmentProcessingTimeline}</span>
                                    {persona.refund.state === "under_review" && (
                                      <span className="block text-warn font-semibold text-[0.7rem] pt-0.5">
                                        {t.dashboard.holdActive}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Timeline Step 4 */}
                                <div className="relative text-xs">
                                  <span className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 border-paper flex items-center justify-center ${
                                    persona.refund.state === "sent_to_bank"
                                      ? "bg-money text-paper animate-pulse" 
                                      : persona.refund.state === "credited"
                                      ? "bg-money text-paper"
                                      : "bg-line text-ink-3"
                                  }`}>
                                    {persona.refund.state === "credited" ? <Check size={8} /> : null}
                                  </span>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-ink">{t.dashboard.refundApprovedTimeline}</span>
                                  </div>
                                </div>

                                {/* Timeline Step 5 */}
                                <div className="relative text-xs">
                                  <span className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 border-paper flex items-center justify-center ${
                                    persona.refund.state === "credited"
                                      ? "bg-money text-paper animate-bounce" 
                                      : "bg-line text-ink-3"
                                  }`}>
                                    {persona.refund.state === "credited" ? <Check size={8} /> : null}
                                  </span>
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-ink">{t.dashboard.refundCreditedTimeline}</span>
                                    {persona.refund.state === "credited" && (
                                      <span className="block text-money font-semibold text-[0.7rem] pt-0.5">{t.dashboard.successCheckApp}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DETAILED TAX STATEMENT (AIS/26AS) */}
                  {activeTab === "statement" && (
                    <div className="space-y-6 relative pl-6" style={{ perspective: 1000 }}>
                      {/* Scroll-bound SVG Connector Line with Money Bundles */}
                      <div className="absolute left-[7px] top-4 bottom-4 w-[3px] pointer-events-none hidden md:block">
                        <svg className="absolute inset-0 w-full h-full overflow-visible">
                          {/* Background dashed line */}
                          <line
                            x1="1.5"
                            y1="0"
                            x2="1.5"
                            y2="100%"
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                          {/* Scroll-bound animated solid line */}
                          <line
                            x1="1.5"
                            y1="0"
                            x2="1.5"
                            y2={`${scrollProgress * 100}%`}
                            stroke="var(--color-money)"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />

                          {/* Money Bundle 1 (Front Runner) */}
                          <g transform={`translate(-10, ${scrollProgress * 100}%)`}>
                            {/* Back overlapping note */}
                            <rect x="2" y="-4" width="20" height="12" rx="2" fill="var(--color-money-deep)" transform="rotate(-6)" opacity="0.4" />
                            {/* Middle overlapping note */}
                            <rect x="-1" y="-7" width="20" height="12" rx="2" fill="var(--color-money)" transform="rotate(4)" opacity="0.7" />
                            {/* Front note with Rupee design */}
                            <g transform="translate(0, -6)">
                              <rect x="0" y="0" width="20" height="12" rx="2" fill="var(--color-money)" style={{ filter: "drop-shadow(0 2px 4px rgba(255,75,75,0.3))" }} />
                              <rect x="2" y="2" width="16" height="8" rx="1" fill="#ffb3a7" />
                              <text x="7" y="9.5" fontSize="8" fontWeight="bold" fill="#4b2a29" fontFamily="sans-serif">₹</text>
                            </g>
                          </g>

                          {/* Money Bundle 2 (Follower, active after 15% scroll) */}
                          {scrollProgress > 0.15 && (
                            <g transform={`translate(-10, ${(scrollProgress - 0.15) * 100}%)`}>
                              <rect x="2" y="-4" width="20" height="12" rx="2" fill="var(--color-money-deep)" transform="rotate(-6)" opacity="0.4" />
                              <rect x="-1" y="-7" width="20" height="12" rx="2" fill="var(--color-money)" transform="rotate(4)" opacity="0.7" />
                              <g transform="translate(0, -6)">
                                <rect x="0" y="0" width="20" height="12" rx="2" fill="var(--color-money)" style={{ filter: "drop-shadow(0 2px 4px rgba(255,75,75,0.3))" }} />
                                <rect x="2" y="2" width="16" height="8" rx="1" fill="#ffb3a7" />
                                <text x="7" y="9.5" fontSize="8" fontWeight="bold" fill="#4b2a29" fontFamily="sans-serif">₹</text>
                              </g>
                            </g>
                          )}

                          {/* Money Bundle 3 (Tail Follower, active after 30% scroll) */}
                          {scrollProgress > 0.3 && (
                            <g transform={`translate(-10, ${(scrollProgress - 0.3) * 100}%)`}>
                              <rect x="2" y="-4" width="20" height="12" rx="2" fill="var(--color-money-deep)" transform="rotate(-6)" opacity="0.4" />
                              <rect x="-1" y="-7" width="20" height="12" rx="2" fill="var(--color-money)" transform="rotate(4)" opacity="0.7" />
                              <g transform="translate(0, -6)">
                                <rect x="0" y="0" width="20" height="12" rx="2" fill="var(--color-money)" style={{ filter: "drop-shadow(0 2px 4px rgba(255,75,75,0.3))" }} />
                                <rect x="2" y="2" width="16" height="8" rx="1" fill="#ffb3a7" />
                                <text x="7" y="9.5" fontSize="8" fontWeight="bold" fill="#4b2a29" fontFamily="sans-serif">₹</text>
                              </g>
                            </g>
                          )}
                        </svg>
                      </div>
                      
                      {/* PART A: EARNED DETAILS */}
                      <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-line pb-2">
                          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 font-bold">
                            PART A &mdash; Income Facts &amp; Prefills
                          </h3>
                          {activePersonaId === "custom" && (
                            <button
                              onClick={handleAddCustomIncome}
                              className="text-xs text-money hover:text-money-deep font-semibold flex items-center space-x-1"
                            >
                              <Plus size={14} />
                              <span>Add Income Row</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {persona.facts.map((fact) => (
                            <div 
                              key={fact.id}
                              className="bg-slate-50 border border-line rounded-xl p-4 flex flex-col justify-between gap-3 text-left"
                            >
                              <div className="flex items-start justify-between gap-4 overflow-hidden">
                                <ScrollScatter3D xOffset={-100} yOffset={-20} zOffset={120} rotateXOffset={15} rotateYOffset={-20} rotateZOffset={-5}>
                                  <div className="space-y-1">
                                    <span className="text-sm font-semibold text-ink">
                                      {localize(fact.label, lang)}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-2 px-1.5 py-0.5 rounded">
                                        {fact.provenance.statement} Statement
                                      </span>
                                      <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-2 px-1.5 py-0.5 rounded">
                                        Source: {fact.provenance.reporter}
                                      </span>
                                    </div>
                                  </div>
                                </ScrollScatter3D>

                                <ScrollScatter3D xOffset={100} yOffset={20} zOffset={-120} rotateXOffset={-15} rotateYOffset={20} rotateZOffset={5}>
                                  <div className="text-right space-y-1">
                                    {activePersonaId === "custom" ? (
                                      <div className="flex items-center space-x-1 bg-white border border-line rounded px-2.5 py-1 max-w-[140px]">
                                        <span className="text-xs text-ink-2">₹</span>
                                        <input
                                          type="text"
                                          value={fact.amount}
                                          onChange={(e) => handleFactAmountChange(fact.id, e.target.value)}
                                          className="bg-transparent border-none text-xs font-mono font-bold text-ink w-full focus:outline-none text-right"
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-base font-bold text-ink tabular">
                                        {formatMoney(fact.amount, lang)}
                                      </span>
                                    )}

                                    {fact.dispute && (
                                      <span className="block text-[0.7rem] font-mono text-warn">
                                        Disputed: {formatMoney(fact.dispute.citizenAmount, lang)}
                                      </span>
                                    )}
                                  </div>
                                </ScrollScatter3D>
                              </div>

                              <ScrollScatter3D xOffset={0} yOffset={50} zOffset={80} rotateXOffset={25} rotateYOffset={0} rotateZOffset={0}>
                                <div className="border-t border-line/60 pt-2 flex items-center justify-between text-[0.7rem] text-ink-2 leading-relaxed">
                                  <span className="flex items-center gap-1">
                                    <Info size={12} className="text-ink-3" />
                                    <span>
                                      {t.file.reportedBy(fact.provenance.reporter, formatDate(fact.provenance.filedOn, lang))}
                                    </span>
                                  </span>

                                  {persona.refund.state === "not_filed" && (
                                    <button
                                      onClick={() => openDispute(fact)}
                                      className="text-money hover:underline font-semibold"
                                    >
                                      {fact.dispute ? "Edit Dispute" : t.common.noThisIsWrong}
                                    </button>
                                  )}
                                </div>
                              </ScrollScatter3D>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PART B: TDS CREDITS */}
                      <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
                          PART B &mdash; Tax Deducted at Source (TDS) u/s 192/194A
                        </h3>

                        <div className="space-y-3">
                          {persona.taxPaid.map((tds) => (
                            <div 
                              key={tds.id}
                              className="bg-slate-50 border border-line rounded-xl p-4 flex justify-between items-center text-left overflow-hidden"
                            >
                              <ScrollScatter3D xOffset={-90} yOffset={-15} zOffset={100} rotateXOffset={10} rotateYOffset={-15} rotateZOffset={-3}>
                                <div className="space-y-1">
                                  <span className="text-sm font-semibold text-ink">
                                    {localize(tds.label, lang)}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-3 px-1.5 py-0.5 rounded">
                                      Section {tds.section}
                                    </span>
                                    <span className="text-[0.65rem] font-mono text-ink-3">
                                      Deductor: {tds.provenance.reporter}
                                    </span>
                                  </div>
                                </div>
                              </ScrollScatter3D>

                              <ScrollScatter3D xOffset={90} yOffset={15} zOffset={-100} rotateXOffset={-10} rotateYOffset={15} rotateZOffset={3}>
                                <span className="text-base font-bold text-money tabular">
                                  {formatMoney(tds.amount, lang)}
                                </span>
                              </ScrollScatter3D>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PART C: CLAIMS */}
                      <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
                          PART C &mdash; Exemptions &amp; Chapter VI-A Deductions
                        </h3>

                        <div className="space-y-3">
                          {persona.claims.map((claim) => (
                            <div 
                              key={claim.id}
                              className="bg-slate-50 border border-line rounded-xl p-4 flex justify-between items-center text-left overflow-hidden"
                            >
                              <ScrollScatter3D xOffset={-90} yOffset={-15} zOffset={100} rotateXOffset={10} rotateYOffset={-15} rotateZOffset={-3}>
                                <div className="space-y-1 max-w-[90%]">
                                  <span className="text-sm font-semibold text-ink block leading-tight">
                                    {localize(claim.label, lang)}
                                  </span>
                                  <div className="flex items-center space-x-2 pt-1">
                                    <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-3 px-1.5 py-0.5 rounded">
                                      Section {claim.section}
                                    </span>
                                    <span className={`text-[0.65rem] font-mono px-1.5 py-0.5 rounded ${
                                      claim.evidenceAttached 
                                        ? "bg-money-soft text-money" 
                                        : "bg-warn-soft text-warn"
                                    }`}>
                                      {claim.evidenceAttached 
                                        ? (lang === "en" ? "Evidence Attached" : lang === "hi" ? "साक्ष्य संलग्न" : "சான்று இணைக்கப்பட்டுள்ளது") 
                                        : (lang === "en" ? "Evidence Missing" : lang === "hi" ? "साक्ष्य गायब" : "சான்று இல்லை")
                                      }
                                    </span>
                                  </div>
                                </div>
                              </ScrollScatter3D>

                              <ScrollScatter3D xOffset={90} yOffset={15} zOffset={-100} rotateXOffset={-10} rotateYOffset={15} rotateZOffset={3}>
                                {activePersonaId === "custom" ? (
                                  <div className="flex items-center space-x-1 bg-white border border-line rounded px-2.5 py-1 max-w-[140px]">
                                    <span className="text-xs text-ink-2">₹</span>
                                    <input
                                      type="text"
                                      value={claim.amount}
                                      onChange={(e) => handleClaimAmountChange(claim.id, e.target.value)}
                                      className="bg-transparent border-none text-xs font-mono font-bold text-ink w-full focus:outline-none text-right"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-base font-bold text-ink tabular">
                                    {formatMoney(claim.amount, lang)}
                                  </span>
                                )}
                              </ScrollScatter3D>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: PENDING ACTIONS / NOTICES */}
                  {activeTab === "actions" && (
                    <div className="space-y-6">
                      
                      {/* PENDING NOTICES */}
                      {persona.notices.length > 0 ? (
                        <div className="bg-white border border-line rounded-xl p-5 space-y-4 shadow-sm">
                          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-2 border-b border-line pb-2 font-bold">
                            {localize("Outstanding Compliance Notices", lang)}
                          </h3>

                          <div className="space-y-4">
                            {persona.notices.map((notice) => (
                              <div 
                                key={notice.id} 
                                className={`p-4 border rounded-xl space-y-3 text-left ${
                                  notice.status === "responded" 
                                    ? "border-line bg-slate-50" 
                                    : "border-alarm bg-alarm-soft/10"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-[0.65rem] font-mono bg-white border border-line text-ink-2 px-2 py-0.5 rounded">
                                    {localize("DIN Validated • CBDT Circular 19/2019", lang)}
                                  </span>
                                  <span className={`text-[0.65rem] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                                    notice.status === "responded" ? "bg-money-soft text-money" : "bg-alarm-soft text-alarm"
                                  }`}>
                                    {notice.status}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-ink leading-tight">
                                    {localize(notice.headline, lang)}
                                  </h4>
                                  <span className="block text-[0.65rem] text-ink-3 font-mono">
                                    DIN: {notice.din}
                                  </span>
                                </div>

                                <p className="text-[0.7rem] text-ink-2 leading-relaxed">
                                  {localize(notice.consequence, lang)}
                                </p>

                                {notice.status === "open" && (
                                  <button
                                    onClick={() => handleNoticeClick(notice)}
                                    className="text-xs bg-alarm text-paper py-1.5 px-3 rounded font-semibold hover:bg-alarm-deep transition-colors"
                                  >
                                    {localize("Draft Legal Response", lang)}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-line rounded-xl p-10 text-center space-y-3">
                          <CheckCircle2 size={36} className="text-money mx-auto" />
                          <h3 className="font-bold text-ink text-sm">{localize("No Pending Actions", lang)}</h3>
                          <p className="text-xs text-ink-2">{localize("Your account is fully compliant with no outstanding notices or tax demands.", lang)}</p>
                        </div>
                      )}

                      {/* ACTIVE HOLDS LIST */}
                      {persona.refund.state !== "not_filed" && persona.refund.holds.filter(h => !h.resolved).length > 0 && (
                        <div className="bg-warn-soft/40 border border-warn/30 rounded-xl p-5 space-y-4 text-left shadow-sm">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-warn font-bold flex items-center gap-1.5 border-b border-warn/25 pb-2">
                            <AlertTriangle size={14} />
                            <span>{localize("Actionable Assessment Holds", lang)} ({persona.refund.holds.filter(h => !h.resolved).length})</span>
                          </h4>

                          <div className="space-y-4">
                            {persona.refund.holds.filter(h => !h.resolved).map((hold) => (
                              <div key={hold.id} className="space-y-2">
                                <span className="block text-xs font-bold text-ink">
                                  {localize(hold.headline, lang)}
                                </span>
                                <p className="text-xs text-ink-2 leading-relaxed">
                                  {localize(hold.detail, lang)}
                                </p>

                                {/* Rent verification receipt upload form */}
                                {hold.kind === "nudge_deduction" && (
                                  <div className="bg-white border border-line rounded-lg p-3 space-y-3 mt-2">
                                    <span className="block text-xs font-mono text-ink-2">{localize("Upload Rent Agreement / Receipts", lang)}</span>
                                    
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <input 
                                          type="text" 
                                          placeholder={localize("Landlord Name", lang)} 
                                          value={rentLandlordName}
                                          onChange={(e) => setRentLandlordName(e.target.value)}
                                          className="flex-1 text-xs border border-line p-2 rounded focus:outline-none focus:border-money"
                                        />
                                        <input 
                                          type="text" 
                                          placeholder={localize("Landlord PAN (10 Digits)", lang)} 
                                          value={rentLandlordPan}
                                          onChange={(e) => setRentLandlordPan(e.target.value.toUpperCase())}
                                          className="flex-1 text-xs border border-line p-2 rounded focus:outline-none focus:border-money font-mono uppercase"
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between gap-2">
                                        <input 
                                          type="file" 
                                          id="rent-receipt-upload" 
                                          className="hidden" 
                                          onChange={handleUploadRent}
                                        />
                                        <label 
                                          htmlFor="rent-receipt-upload"
                                          className="bg-paper border border-line text-xs font-semibold py-1.5 px-3 rounded hover:bg-paper-2 cursor-pointer text-ink-2"
                                        >
                                          {rentFile ? (lang === "en" ? `Selected: ${rentFile.substring(0, 12)}...` : lang === "hi" ? `चयनित: ${rentFile.substring(0, 12)}...` : `தேர்வு செய்யப்பட்டது: ${rentFile.substring(0, 12)}...`) : localize("Select PDF/JPG", lang)}
                                        </label>

                                        <button
                                          onClick={saveRentClaim}
                                          disabled={!rentFile}
                                          className="bg-money text-paper text-xs font-semibold py-1.5 px-4 rounded hover:bg-money-deep transition-colors disabled:opacity-50"
                                        >
                                          {localize("Submit Receipt", lang)}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Stale Bank IFSC resolution button */}
                                {hold.kind === "bank_invalid" && (
                                  <button
                                    onClick={() => handleFixBank(persona.banks[0])}
                                    className="text-xs text-money font-semibold hover:underline flex items-center space-x-1"
                                  >
                                    <span>{localize(hold.action.label, lang)}</span>
                                    <ChevronRight size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </m.div>

              </m.div>
            )}

          </AnimatePresence>

        </main>

        {/* --- REVIEWER DEBUG DRAWER (SCHEDULE I) --- */}
        <AnimatePresence>
          {showConsole && (
            <m.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-paper-2 border-l border-line shadow-2xl z-50 p-6 flex flex-col justify-between text-left"
            >
              <div className="space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <Settings size={14} className="text-money" />
                    <span>Reviewer Sandbox</span>
                  </h3>
                  <button 
                    onClick={() => setShowConsole(false)}
                    className="text-xs text-ink-3 hover:text-ink font-mono font-semibold"
                  >
                    CLOSE
                  </button>
                </div>

                {/* Role Switcher */}
                <div className="space-y-3">
                  <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
                    Quick Switch Persona
                  </span>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => { handleSelectPersona("sunita"); setShowConsole(false); }}
                      className="w-full text-left text-xs bg-paper border border-line rounded p-2.5 hover:border-money transition-colors animate-fade"
                    >
                      <div className="font-semibold text-ink">Sunita Devi (Act 1)</div>
                      <span className="text-[0.65rem] text-ink-3 block">Salary Prefill / Zero Tax</span>
                    </button>
                    <button
                      onClick={() => { handleSelectPersona("rakesh"); setShowConsole(false); }}
                      className="w-full text-left text-xs bg-paper border border-line rounded p-2.5 hover:border-money transition-colors"
                    >
                      <div className="font-semibold text-ink">Rakesh Kumar (Act 2)</div>
                      <span className="text-[0.65rem] text-ink-3 block">Tax Notices &amp; Capital Gains Mismatch</span>
                    </button>
                    <button
                      onClick={() => { handleSelectPersona("priya"); setShowConsole(false); }}
                      className="w-full text-left text-xs bg-paper border border-line rounded p-2.5 hover:border-money transition-colors"
                    >
                      <div className="font-semibold text-ink">Priya Sharma (Act 3)</div>
                      <span className="text-[0.65rem] text-ink-3 block">Bank IFSC Stale / Rent Document Hold</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Latency / Failures */}
                <div className="space-y-4 pt-4 border-t border-line/60">
                  <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
                    Schedule I &mdash; Error Simulations
                  </span>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 text-xs text-ink-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simulatedError}
                        onChange={(e) => setSimulatedError(e.target.checked)}
                        className="rounded border-line text-money focus:ring-money focus:ring-offset-paper"
                      />
                      <span>Trigger API Gateway Timeout</span>
                    </label>

                    <label className="flex items-center space-x-3 text-xs text-ink-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simulatedDelay}
                        onChange={(e) => setSimulatedDelay(e.target.checked)}
                        className="rounded border-line text-money focus:ring-money focus:ring-offset-paper"
                      />
                      <span>Inject 3s Database Delay</span>
                    </label>
                  </div>
                </div>

                {/* Custom sandbox configuration adjustments */}
                {activePersonaId === "custom" && persona && (
                  <div className="space-y-4 pt-4 border-t border-line/60">
                    <span className="block text-[0.7rem] font-mono uppercase tracking-wider text-ink-2">
                      Custom Sandbox Editor
                    </span>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[0.65rem] font-mono text-ink-3 mb-1">Contract Income</label>
                        <div className="flex items-center justify-between bg-paper border border-line rounded p-1.5">
                          <button
                            onClick={() => handleFactAmountChange("custom-salary", (persona.facts[0].amount - 50000).toString())}
                            className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                          >
                            -50K
                          </button>
                          <span className="text-xs font-mono font-bold text-ink">
                            {formatAmount(persona.facts[0].amount, lang)}
                          </span>
                          <button
                            onClick={() => handleFactAmountChange("custom-salary", (persona.facts[0].amount + 50000).toString())}
                            className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                          >
                            +50K
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[0.65rem] font-mono text-ink-3 mb-1">Savings Interest</label>
                        <div className="flex items-center justify-between bg-paper border border-line rounded p-1.5">
                          <button
                            onClick={() => handleFactAmountChange("custom-interest", (persona.facts[1].amount - 500).toString())}
                            className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                          >
                            -500
                          </button>
                          <span className="text-xs font-mono font-bold text-ink">
                            {formatAmount(persona.facts[1].amount, lang)}
                          </span>
                          <button
                            onClick={() => handleFactAmountChange("custom-interest", (persona.facts[1].amount + 500).toString())}
                            className="bg-paper-2 hover:bg-paper-3 p-1 rounded font-bold text-xs"
                          >
                            +500
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Reset Session */}
              <div className="border-t border-line pt-4 space-y-2">
                <button
                  onClick={handleLogOut}
                  className="w-full bg-alarm hover:bg-alarm-deep text-paper py-2.5 rounded font-mono font-semibold text-xs transition-colors tracking-wide flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw size={12} />
                  <span>RESET LOCAL CACHE</span>
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* --- DYNAMIC DISPUTE MODAL (FRAMER MOTION) --- */}
        <AnimatePresence>
          {activeDisputeId && persona && (
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <m.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-paper border border-line max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 text-left"
              >
                <h3 className="text-lg font-bold text-ink border-b border-line pb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-money" />
                  <span>{t.file.disputeHeading}</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-2 mb-1.5">
                      {t.file.disputeAmountLabel} (₹)
                    </label>
                    <input
                      type="number"
                      value={disputeAmount}
                      onChange={(e) => setDisputeAmount(e.target.value)}
                      className="w-full bg-paper-2 border border-line text-base font-semibold px-3 py-2 rounded focus:outline-none focus:border-money"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-2 mb-1.5 flex justify-between items-center">
                      <span>{t.file.disputeReasonLabel}</span>
                      <button
                        onClick={toggleSpeechMock}
                        className={`text-xs flex items-center gap-1 font-semibold ${isSpeechListening ? "text-alarm animate-pulse" : "text-money hover:text-money-deep"}`}
                      >
                        {isSpeechListening ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>{isSpeechListening ? "Listening..." : "Dictate (Voice)"}</span>
                      </button>
                    </label>
                    <textarea
                      rows={3}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Explain why this prefill is incorrect."
                      className="w-full bg-paper-2 border border-line text-xs p-3 rounded focus:outline-none focus:border-money resize-none"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveDisputeId(null)}
                    className="flex-1 border border-line text-ink-2 py-2 rounded hover:bg-paper-2 text-sm font-semibold transition-colors"
                  >
                    {t.common.close}
                  </button>
                  <button
                    onClick={saveDispute}
                    className="flex-1 bg-money hover:bg-money-deep text-paper py-2 rounded text-sm font-semibold transition-colors"
                  >
                    {t.file.disputeSave}
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {/* --- DYNAMIC BANK IFSC UPDATE POPUP --- */}
        <AnimatePresence>
          {activeBankFixId && (
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <m.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-paper border border-line max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-ink border-b border-line pb-2 flex items-center gap-1.5">
                    <Building2 size={18} className="text-money" />
                    <span>{localize("Update Bank IFSC", lang)}</span>
                  </h3>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {localize("Verify the 11-digit bank routing code (IFSC) to validate bank details.", lang)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-2 mb-1">{localize("IFSC Code", lang)}</label>
                    <input
                      type="text"
                      value={ifscInput}
                      onChange={(e) => handleIfscInputChange(e.target.value)}
                      maxLength={11}
                      className={`w-full bg-paper-2 border ${
                        ifscError ? "border-alarm animate-shake" : "border-line focus:border-money"
                      } text-base font-mono font-semibold tracking-wider px-3 py-2 rounded focus:outline-none uppercase`}
                    />
                    {ifscError && (
                      <span className="block text-xs text-alarm mt-1 font-medium">
                        {ifscError}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveBankFixId(null)}
                    className="flex-1 border border-line text-ink-2 py-2 rounded hover:bg-paper-2 text-sm font-semibold transition-colors"
                  >
                    {localize("Cancel", lang)}
                  </button>
                  <button
                    onClick={saveBankFix}
                    className="flex-1 bg-money hover:bg-money-deep text-paper py-2 rounded text-sm font-semibold transition-colors"
                  >
                    {localize("Validate Bank Code", lang)}
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {/* --- DYNAMIC LEGAL NOTICE MODAL --- */}
        <AnimatePresence>
          {selectedNoticeId && persona && (
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <m.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-paper border border-line max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="space-y-2 border-b border-line pb-3">
                  <h3 className="text-base font-bold text-ink leading-tight">
                    {localize(persona.notices.find(n => n.id === selectedNoticeId)?.headline, lang)}
                  </h3>
                  <span className="block text-xs font-mono text-ink-3">
                    DIN &mdash; {persona.notices.find(n => n.id === selectedNoticeId)?.din}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Response Toggles */}
                  <div className="space-y-2">
                    <span className="block text-xs font-mono uppercase text-ink-2">{localize("Response Position", lang)}</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setNoticeAgreed("agree")}
                        className={`flex-1 py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          noticeAgreed === "agree" 
                            ? "bg-money-soft border-money text-money" 
                            : "border-line text-ink-2 hover:bg-paper-2"
                        }`}
                      >
                        <Check size={14} />
                        <span>{localize("I Agree with Department", lang)}</span>
                      </button>
                      
                      <button
                        onClick={() => setNoticeAgreed("disagree")}
                        className={`flex-1 py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          noticeAgreed === "disagree" 
                            ? "bg-alarm-soft border-alarm text-alarm" 
                            : "border-line text-ink-2 hover:bg-paper-2"
                        }`}
                      >
                        <VolumeX size={14} />
                        <span>{localize("I Disagree (Submit Proof)", lang)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reply text statement */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono text-ink-2">
                      <span>{localize("Response Statement (Draft)", lang)}</span>
                      <button
                        onClick={toggleSpeechMock}
                        className={`flex items-center gap-1 font-semibold ${isSpeechListening ? "text-alarm animate-pulse" : "text-money hover:text-money-deep"}`}
                      >
                        <Volume2 size={12} />
                        <span>{isSpeechListening ? localize("Listening...", lang) : localize("Dictate Statement", lang)}</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={noticeResponseText}
                      onChange={(e) => setNoticeResponseText(e.target.value)}
                      placeholder={localize("Explain your disagreement or agreement...", lang)}
                      className="w-full bg-paper-2 border border-line text-xs p-3 rounded focus:outline-none focus:border-money resize-none"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setSelectedNoticeId(null)}
                    className="flex-1 border border-line text-ink-2 py-2 rounded hover:bg-paper-2 text-sm font-semibold transition-colors"
                  >
                    {localize("Cancel", lang)}
                  </button>
                  <button
                    onClick={saveNoticeResponse}
                    disabled={!noticeAgreed || !noticeResponseText}
                    className="flex-1 bg-money hover:bg-money-deep text-paper py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {localize("Send Response", lang)}
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

      </div>
    </LazyMotion>
  );
}

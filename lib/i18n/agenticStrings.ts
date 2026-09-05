/**
 * Fixed strings for the Agentic workspace — shell, inspector, run statuses,
 * step labels, questions and review actions — in all 23 interface languages
 * (plan.md §6: "All new fixed interface strings, errors, questions, and review
 * actions must support all 23 dictionaries").
 *
 * English, Hindi and Tamil are written by hand. The remaining twenty follow
 * the repository's existing practice for lib/i18n/*.ts: model-generated
 * pending native review, disclosed on /honesty and in the language menu.
 * Digits stay Latin everywhere; money is formatted by lib/money.ts, never here.
 * `{n}`, `{regime}`, `{saving}`, `{id}` are substituted by lib/agentic/response.ts.
 */

import type { Lang } from "../types";

export interface AgenticStrings {
  // Shell
  newChat: string;
  searchChats: string;
  taxVault: string;
  myReturn: string;
  filingHistory: string;
  recentChats: string;
  noChats: string;
  settings: string;
  memory: string;
  memoryEmpty: string;
  forget: string;
  signOut: string;
  modeAgentic: string;
  modeManual: string;
  modeLabel: string;
  progress: string;
  outputs: string;
  sources: string;
  inspectorEmptyProgress: string;
  inspectorEmptyOutputs: string;
  inspectorEmptySources: string;
  sourcesDocuments: string;
  sourcesAnswers: string;
  sourcesRules: string;
  sourcesAssumptions: string;
  composerPlaceholder: string;
  send: string;
  confirm: string;
  cancel: string;
  answer: string;
  retry: string;
  openDocument: string;
  download: string;
  simulatedBadge: string;
  notDurable: string;
  signInPrompt: string;
  demoSignIn: string;
  welcomeTitle: string;
  welcomeBody: string;
  // Statuses
  statusRunning: string;
  statusWaitingInput: string;
  statusWaitingReview: string;
  statusCompleted: string;
  statusCancelled: string;
  statusFailed: string;
  // Steps
  stepClassify: string;
  stepPlan: string;
  stepGather: string;
  stepResolve: string;
  stepCompute: string;
  stepReview: string;
  stepConfirm: string;
  stepAct: string;
  stepOutputs: string;
  noteNothingToResolve: string;
  noteVaultUnavailable: string;
  noteNoAction: string;
  noteAlreadyFiled: string;
  // Tasks
  taskPrepareReturn: string;
  taskCompareRegimes: string;
  taskReconcile: string;
  taskLoadDemo: string;
  taskExplain: string;
  // Agent messages
  foundDocuments: string;
  noDocuments: string;
  metadataOnly: string;
  storageUnavailable: string;
  askOtherIncome: string;
  askOtherIncomeWhy: string;
  ask80C: string;
  ask80CWhy: string;
  ask80D: string;
  ask80DWhy: string;
  recommendRegime: string;
  regimesEqual: string;
  reviewFilingTitle: string;
  reviewRegimeTitle: string;
  reviewCorrectionsTitle: string;
  confirmFiling: string;
  confirmRegime: string;
  confirmCorrections: string;
  filedSimulated: string;
  regimeApplied: string;
  correctionsApplied: string;
  cancelledAction: string;
  staleReview: string;
  alreadyFiled: string;
  unsupportedTask: string;
  budgetExhausted: string;
  injectionNotice: string;
  errorGeneric: string;
  explainFallback: string;
  rowTaxableIncome: string;
  rowTotalTax: string;
  rowRefund: string;
  rowDue: string;
  rowRegime: string;
  rowSaving: string;
  yes: string;
  no: string;
}

const en: AgenticStrings = {
  newChat: "New chat",
  searchChats: "Search chats",
  taxVault: "Tax Vault",
  myReturn: "My return",
  filingHistory: "Filing history",
  recentChats: "Recent chats",
  noChats: "No chats yet. Ask about your return to start one.",
  settings: "Settings",
  memory: "What Wapsi remembers",
  memoryEmpty: "Nothing remembered yet. Only preferences are ever stored here — never amounts or identifiers.",
  forget: "Forget",
  signOut: "Sign out",
  modeAgentic: "Agentic",
  modeManual: "Manual",
  modeLabel: "Working mode",
  progress: "Progress",
  outputs: "Outputs",
  sources: "Sources",
  inspectorEmptyProgress: "No steps yet. Progress appears here once a task starts.",
  inspectorEmptyOutputs: "Nothing produced yet. Files appear here only after they are stored.",
  inspectorEmptySources: "Nothing used yet. The documents, answers and rules this chat relies on will be listed here.",
  sourcesDocuments: "Your documents",
  sourcesAnswers: "Information you provided",
  sourcesRules: "Tax rules",
  sourcesAssumptions: "Assumptions",
  composerPlaceholder: "Ask about your return, or say what you want done…",
  send: "Send",
  confirm: "Confirm",
  cancel: "Cancel",
  answer: "Answer",
  retry: "Try again",
  openDocument: "Open",
  download: "Download",
  simulatedBadge: "Simulated — nothing was filed or paid with any authority",
  notDurable: "Demo session: this history clears when the server restarts.",
  signInPrompt: "Sign in to start a chat about your return.",
  demoSignIn: "Try a demo citizen",
  welcomeTitle: "What would you like to do with your return?",
  welcomeBody: "I check your vault first, ask only what I cannot find, show every figure and its source, and never file or pay without your explicit confirmation.",
  statusRunning: "Working",
  statusWaitingInput: "Needs your answer",
  statusWaitingReview: "Ready for your review",
  statusCompleted: "Completed",
  statusCancelled: "Cancelled",
  statusFailed: "Stopped",
  stepClassify: "Understand the request",
  stepPlan: "Plan the work",
  stepGather: "Check your vault and return",
  stepResolve: "Fill the gaps",
  stepCompute: "Calculate",
  stepReview: "Prepare the review",
  stepConfirm: "Your confirmation",
  stepAct: "Carry out the confirmed action",
  stepOutputs: "Save the outputs",
  noteNothingToResolve: "Nothing missing — every figure is confirmed.",
  noteVaultUnavailable: "The document store could not be reached; only the return itself was read.",
  noteNoAction: "No action to carry out for this task.",
  noteAlreadyFiled: "This return is already filed; it cannot be filed again.",
  taskPrepareReturn: "Prepare my return",
  taskCompareRegimes: "Compare the two regimes",
  taskReconcile: "Check reported figures",
  taskLoadDemo: "Load a demo return",
  taskExplain: "A question",
  foundDocuments: "I found {n} document(s) in your vault for this year.",
  noDocuments: "Your vault has no documents for this year, so I am working from the return itself.",
  metadataOnly: "One record exists but its original file was never stored, so I cannot read figures from it.",
  storageUnavailable: "The document store is not configured in this deployment, so I could not check your vault. I am working from the return itself.",
  askOtherIncome: "Did you receive any other income this year — freelance, rent, or interest not already listed?",
  askOtherIncomeWhy: "Anything not reported by a third party has to come from you.",
  ask80C: "How much did you actually pay this year into PF, life insurance, ELSS or tuition (section 80C)? Enter 0 if nothing.",
  ask80CWhy: "Only under the old regime, and only what was actually paid, counts.",
  ask80D: "How much health-insurance premium did you pay this year (section 80D)? Enter 0 if none.",
  ask80DWhy: "It reduces tax under the old regime only.",
  recommendRegime: "The {regime} regime costs less for your figures, by {saving}.",
  regimesEqual: "Both regimes give the same tax for your figures.",
  reviewFilingTitle: "Ready to file — confirm the figures",
  reviewRegimeTitle: "Apply the {regime} regime",
  reviewCorrectionsTitle: "Apply these corrections",
  confirmFiling: "Confirm and file (simulated)",
  confirmRegime: "Apply this regime",
  confirmCorrections: "Apply corrections",
  filedSimulated: "I completed the simulated filing. Receipt {id}. Nothing was sent to any authority.",
  regimeApplied: "I applied the {regime} regime to your return.",
  correctionsApplied: "I applied the corrections to your return.",
  cancelledAction: "Okay — nothing was changed.",
  staleReview: "Your return changed since I prepared this review, so I have prepared it again.",
  alreadyFiled: "This return is already filed. I can explain it or compare regimes, but cannot file it again.",
  unsupportedTask: "I can prepare a salaried return, compare the two regimes, or check reported figures. For anything else, the manual portal has the tools.",
  budgetExhausted: "Today's limit for this account has been reached. Nothing was changed. Please continue tomorrow, or use the manual portal.",
  injectionNotice: "A document contained text that looked like instructions to me. I ignored it and treated the document as data only.",
  errorGeneric: "Something went wrong on my side. Your return was not changed.",
  explainFallback: "Here is what the engine computes for your return.",
  rowTaxableIncome: "Taxable income",
  rowTotalTax: "Total tax",
  rowRefund: "Refund due to you",
  rowDue: "Balance payable",
  rowRegime: "Regime",
  rowSaving: "Saving",
  yes: "Yes",
  no: "No",
};

const hi: AgenticStrings = {
  newChat: "नई बातचीत",
  searchChats: "बातचीत खोजें",
  taxVault: "कर वॉल्ट",
  myReturn: "मेरा रिटर्न",
  filingHistory: "दाखिल इतिहास",
  recentChats: "हाल की बातचीत",
  noChats: "अभी कोई बातचीत नहीं। अपने रिटर्न के बारे में पूछकर शुरू करें।",
  settings: "सेटिंग्स",
  memory: "वापसी क्या याद रखता है",
  memoryEmpty: "अभी कुछ याद नहीं। यहाँ केवल प्राथमिकताएँ रखी जाती हैं — कभी राशि या पहचान नहीं।",
  forget: "भूल जाएँ",
  signOut: "साइन आउट",
  modeAgentic: "एजेंटिक",
  modeManual: "मैनुअल",
  modeLabel: "काम करने का तरीका",
  progress: "प्रगति",
  outputs: "परिणाम",
  sources: "स्रोत",
  inspectorEmptyProgress: "अभी कोई चरण नहीं। काम शुरू होने पर प्रगति यहाँ दिखेगी।",
  inspectorEmptyOutputs: "अभी कुछ नहीं बना। फ़ाइलें सहेजे जाने के बाद ही यहाँ दिखती हैं।",
  inspectorEmptySources: "अभी कुछ प्रयोग नहीं हुआ। इस बातचीत में प्रयुक्त दस्तावेज़, उत्तर और नियम यहाँ सूचीबद्ध होंगे।",
  sourcesDocuments: "आपके दस्तावेज़",
  sourcesAnswers: "आपके द्वारा दी गई जानकारी",
  sourcesRules: "कर नियम",
  sourcesAssumptions: "मान्यताएँ",
  composerPlaceholder: "अपने रिटर्न के बारे में पूछें, या बताएँ क्या करना है…",
  send: "भेजें",
  confirm: "पुष्टि करें",
  cancel: "रद्द करें",
  answer: "उत्तर दें",
  retry: "फिर कोशिश करें",
  openDocument: "खोलें",
  download: "डाउनलोड",
  simulatedBadge: "अनुकरण — किसी प्राधिकरण को कुछ दाखिल या भुगतान नहीं किया गया",
  notDurable: "डेमो सत्र: सर्वर पुनः आरंभ होने पर यह इतिहास मिट जाता है।",
  signInPrompt: "अपने रिटर्न पर बातचीत शुरू करने के लिए साइन इन करें।",
  demoSignIn: "डेमो नागरिक आज़माएँ",
  welcomeTitle: "आप अपने रिटर्न के साथ क्या करना चाहेंगे?",
  welcomeBody: "मैं पहले आपका वॉल्ट देखता हूँ, केवल वही पूछता हूँ जो नहीं मिलता, हर आंकड़ा और उसका स्रोत दिखाता हूँ, और आपकी स्पष्ट पुष्टि के बिना कभी दाखिल या भुगतान नहीं करता।",
  statusRunning: "काम चल रहा है",
  statusWaitingInput: "आपके उत्तर की प्रतीक्षा",
  statusWaitingReview: "आपकी समीक्षा के लिए तैयार",
  statusCompleted: "पूर्ण",
  statusCancelled: "रद्द",
  statusFailed: "रुक गया",
  stepClassify: "अनुरोध समझना",
  stepPlan: "काम की योजना",
  stepGather: "वॉल्ट और रिटर्न जाँचना",
  stepResolve: "कमी पूरी करना",
  stepCompute: "गणना",
  stepReview: "समीक्षा तैयार करना",
  stepConfirm: "आपकी पुष्टि",
  stepAct: "पुष्ट कार्य करना",
  stepOutputs: "परिणाम सहेजना",
  noteNothingToResolve: "कुछ कमी नहीं — हर आंकड़ा पुष्ट है।",
  noteVaultUnavailable: "दस्तावेज़ भंडार तक नहीं पहुँच सके; केवल रिटर्न पढ़ा गया।",
  noteNoAction: "इस काम में करने योग्य कोई कार्य नहीं।",
  noteAlreadyFiled: "यह रिटर्न पहले ही दाखिल है; दोबारा दाखिल नहीं हो सकता।",
  taskPrepareReturn: "मेरा रिटर्न तैयार करें",
  taskCompareRegimes: "दोनों व्यवस्थाओं की तुलना",
  taskReconcile: "रिपोर्ट किए आंकड़े जाँचें",
  taskLoadDemo: "डेमो रिटर्न लोड करें",
  taskExplain: "एक प्रश्न",
  foundDocuments: "इस वर्ष के लिए आपके वॉल्ट में {n} दस्तावेज़ मिले।",
  noDocuments: "इस वर्ष के लिए आपके वॉल्ट में कोई दस्तावेज़ नहीं, इसलिए मैं रिटर्न से ही काम कर रहा हूँ।",
  metadataOnly: "एक रिकॉर्ड है पर उसकी मूल फ़ाइल कभी सहेजी नहीं गई, इसलिए उससे आंकड़े नहीं पढ़ सकता।",
  storageUnavailable: "इस परिनियोजन में दस्तावेज़ भंडार कॉन्फ़िगर नहीं है, इसलिए वॉल्ट नहीं जाँच सका। मैं रिटर्न से ही काम कर रहा हूँ।",
  askOtherIncome: "क्या इस वर्ष आपको कोई और आय मिली — फ्रीलांस, किराया, या ऐसा ब्याज जो सूची में नहीं है?",
  askOtherIncomeWhy: "जो किसी तीसरे पक्ष ने रिपोर्ट नहीं किया, वह आपसे ही आना है।",
  ask80C: "इस वर्ष आपने PF, जीवन बीमा, ELSS या ट्यूशन (धारा 80C) में वास्तव में कितना भरा? कुछ नहीं तो 0 लिखें।",
  ask80CWhy: "केवल पुरानी व्यवस्था में, और केवल वास्तव में भरी राशि गिनी जाती है।",
  ask80D: "इस वर्ष स्वास्थ्य बीमा प्रीमियम (धारा 80D) कितना भरा? नहीं तो 0 लिखें।",
  ask80DWhy: "यह केवल पुरानी व्यवस्था में कर घटाता है।",
  recommendRegime: "आपके आंकड़ों पर {regime} व्यवस्था में {saving} कम कर लगता है।",
  regimesEqual: "आपके आंकड़ों पर दोनों व्यवस्थाओं में कर समान है।",
  reviewFilingTitle: "दाखिल करने को तैयार — आंकड़े पुष्ट करें",
  reviewRegimeTitle: "{regime} व्यवस्था लागू करें",
  reviewCorrectionsTitle: "ये सुधार लागू करें",
  confirmFiling: "पुष्टि कर दाखिल करें (अनुकरण)",
  confirmRegime: "यह व्यवस्था लागू करें",
  confirmCorrections: "सुधार लागू करें",
  filedSimulated: "अनुकरणीय दाखिला पूर्ण। रसीद {id}। किसी प्राधिकरण को कुछ नहीं भेजा गया।",
  regimeApplied: "आपके रिटर्न पर {regime} व्यवस्था लागू कर दी।",
  correctionsApplied: "आपके रिटर्न पर सुधार लागू कर दिए।",
  cancelledAction: "ठीक है — कुछ नहीं बदला।",
  staleReview: "समीक्षा तैयार करने के बाद आपका रिटर्न बदल गया, इसलिए मैंने इसे दोबारा तैयार किया है।",
  alreadyFiled: "यह रिटर्न पहले ही दाखिल है। मैं समझा सकता हूँ या व्यवस्थाओं की तुलना कर सकता हूँ, पर दोबारा दाखिल नहीं कर सकता।",
  unsupportedTask: "मैं वेतन रिटर्न तैयार कर सकता हूँ, दोनों व्यवस्थाओं की तुलना कर सकता हूँ, या रिपोर्ट किए आंकड़े जाँच सकता हूँ। बाकी के लिए मैनुअल पोर्टल में उपकरण हैं।",
  budgetExhausted: "इस खाते की आज की सीमा पूरी हो गई। कुछ नहीं बदला। कृपया कल जारी रखें, या मैनुअल पोर्टल उपयोग करें।",
  injectionNotice: "एक दस्तावेज़ में ऐसा पाठ था जो मुझे निर्देश जैसा लगा। मैंने उसे अनदेखा किया और दस्तावेज़ को केवल डेटा माना।",
  errorGeneric: "मेरी ओर से कुछ गड़बड़ हुई। आपका रिटर्न नहीं बदला।",
  explainFallback: "आपके रिटर्न के लिए इंजन की गणना यह है।",
  rowTaxableIncome: "कर योग्य आय",
  rowTotalTax: "कुल कर",
  rowRefund: "आपको देय रिफंड",
  rowDue: "देय शेष",
  rowRegime: "व्यवस्था",
  rowSaving: "बचत",
  yes: "हाँ",
  no: "नहीं",
};

const ta: AgenticStrings = {
  newChat: "புதிய உரையாடல்",
  searchChats: "உரையாடல்களைத் தேடு",
  taxVault: "வரி பெட்டகம்",
  myReturn: "என் ரிட்டர்ன்",
  filingHistory: "தாக்கல் வரலாறு",
  recentChats: "சமீபத்திய உரையாடல்கள்",
  noChats: "இன்னும் உரையாடல் இல்லை. உங்கள் ரிட்டர்ன் பற்றி கேட்டு தொடங்குங்கள்.",
  settings: "அமைப்புகள்",
  memory: "வாப்சி நினைவில் வைத்திருப்பது",
  memoryEmpty: "இன்னும் எதுவும் நினைவில் இல்லை. விருப்பங்கள் மட்டுமே இங்கு சேமிக்கப்படும் — தொகைகளோ அடையாளங்களோ இல்லை.",
  forget: "மற",
  signOut: "வெளியேறு",
  modeAgentic: "ஏஜென்டிக்",
  modeManual: "கைமுறை",
  modeLabel: "வேலை முறை",
  progress: "முன்னேற்றம்",
  outputs: "வெளியீடுகள்",
  sources: "ஆதாரங்கள்",
  inspectorEmptyProgress: "இன்னும் படிகள் இல்லை. பணி தொடங்கியதும் முன்னேற்றம் இங்கு தோன்றும்.",
  inspectorEmptyOutputs: "இன்னும் எதுவும் உருவாக்கப்படவில்லை. கோப்புகள் சேமிக்கப்பட்ட பின்பே இங்கு தோன்றும்.",
  inspectorEmptySources: "இன்னும் எதுவும் பயன்படுத்தப்படவில்லை. இந்த உரையாடல் சார்ந்த ஆவணங்கள், பதில்கள், விதிகள் இங்கு பட்டியலிடப்படும்.",
  sourcesDocuments: "உங்கள் ஆவணங்கள்",
  sourcesAnswers: "நீங்கள் தந்த தகவல்",
  sourcesRules: "வரி விதிகள்",
  sourcesAssumptions: "அனுமானங்கள்",
  composerPlaceholder: "உங்கள் ரிட்டர்ன் பற்றி கேளுங்கள், அல்லது என்ன செய்ய வேண்டும் என்று சொல்லுங்கள்…",
  send: "அனுப்பு",
  confirm: "உறுதிப்படுத்து",
  cancel: "ரத்து",
  answer: "பதில்",
  retry: "மீண்டும் முயற்சி",
  openDocument: "திற",
  download: "பதிவிறக்கு",
  simulatedBadge: "உருவகப்படுத்தல் — எந்த அதிகாரத்திடமும் எதுவும் தாக்கல் செய்யவோ செலுத்தவோ இல்லை",
  notDurable: "டெமோ அமர்வு: சர்வர் மறுதொடக்கத்தில் இந்த வரலாறு அழியும்.",
  signInPrompt: "உங்கள் ரிட்டர்ன் பற்றிய உரையாடலைத் தொடங்க உள்நுழையவும்.",
  demoSignIn: "டெமோ குடிமகனை முயற்சிக்க",
  welcomeTitle: "உங்கள் ரிட்டர்னில் என்ன செய்ய விரும்புகிறீர்கள்?",
  welcomeBody: "முதலில் உங்கள் பெட்டகத்தைப் பார்க்கிறேன், கிடைக்காததை மட்டும் கேட்கிறேன், ஒவ்வொரு எண்ணையும் அதன் ஆதாரத்தையும் காட்டுகிறேன், உங்கள் தெளிவான உறுதிப்படுத்தல் இல்லாமல் ஒருபோதும் தாக்கல் செய்யவோ செலுத்தவோ மாட்டேன்.",
  statusRunning: "வேலை நடக்கிறது",
  statusWaitingInput: "உங்கள் பதில் தேவை",
  statusWaitingReview: "உங்கள் மதிப்பாய்வுக்கு தயார்",
  statusCompleted: "முடிந்தது",
  statusCancelled: "ரத்து செய்யப்பட்டது",
  statusFailed: "நிறுத்தப்பட்டது",
  stepClassify: "கோரிக்கையைப் புரிந்துகொள்ள",
  stepPlan: "வேலையைத் திட்டமிட",
  stepGather: "பெட்டகம் மற்றும் ரிட்டர்னைச் சரிபார்க்க",
  stepResolve: "இடைவெளிகளை நிரப்ப",
  stepCompute: "கணக்கிட",
  stepReview: "மதிப்பாய்வைத் தயாரிக்க",
  stepConfirm: "உங்கள் உறுதிப்படுத்தல்",
  stepAct: "உறுதிப்படுத்திய செயலைச் செய்ய",
  stepOutputs: "வெளியீடுகளைச் சேமிக்க",
  noteNothingToResolve: "எதுவும் விடுபடவில்லை — ஒவ்வொரு எண்ணும் உறுதிப்படுத்தப்பட்டது.",
  noteVaultUnavailable: "ஆவணக் களஞ்சியத்தை அணுக முடியவில்லை; ரிட்டர்ன் மட்டுமே படிக்கப்பட்டது.",
  noteNoAction: "இந்தப் பணிக்கு செய்ய வேண்டிய செயல் இல்லை.",
  noteAlreadyFiled: "இந்த ரிட்டர்ன் ஏற்கனவே தாக்கல் செய்யப்பட்டது; மீண்டும் தாக்கல் செய்ய முடியாது.",
  taskPrepareReturn: "என் ரிட்டர்னைத் தயாரிக்க",
  taskCompareRegimes: "இரு முறைகளையும் ஒப்பிட",
  taskReconcile: "அறிவிக்கப்பட்ட எண்களைச் சரிபார்க்க",
  taskLoadDemo: "டெமோ ரிட்டர்னை ஏற்ற",
  taskExplain: "ஒரு கேள்வி",
  foundDocuments: "இந்த ஆண்டுக்கு உங்கள் பெட்டகத்தில் {n} ஆவணம்(கள்) கண்டேன்.",
  noDocuments: "இந்த ஆண்டுக்கு உங்கள் பெட்டகத்தில் ஆவணங்கள் இல்லை, எனவே ரிட்டர்னிலிருந்தே வேலை செய்கிறேன்.",
  metadataOnly: "ஒரு பதிவு உள்ளது ஆனால் அதன் மூலக் கோப்பு சேமிக்கப்படவில்லை, அதனால் அதிலிருந்து எண்களைப் படிக்க முடியாது.",
  storageUnavailable: "இந்தப் பயன்பாட்டில் ஆவணக் களஞ்சியம் அமைக்கப்படவில்லை, அதனால் பெட்டகத்தைச் சரிபார்க்க முடியவில்லை. ரிட்டர்னிலிருந்தே வேலை செய்கிறேன்.",
  askOtherIncome: "இந்த ஆண்டு வேறு வருமானம் பெற்றீர்களா — ஃப்ரீலான்ஸ், வாடகை, அல்லது பட்டியலில் இல்லாத வட்டி?",
  askOtherIncomeWhy: "மூன்றாம் தரப்பினர் அறிவிக்காதது உங்களிடமிருந்தே வர வேண்டும்.",
  ask80C: "இந்த ஆண்டு PF, ஆயுள் காப்பீடு, ELSS அல்லது கல்விக் கட்டணத்தில் (பிரிவு 80C) உண்மையில் எவ்வளவு செலுத்தினீர்கள்? இல்லையெனில் 0.",
  ask80CWhy: "பழைய முறையில் மட்டும், உண்மையில் செலுத்தியது மட்டுமே கணக்கில் வரும்.",
  ask80D: "இந்த ஆண்டு சுகாதாரக் காப்பீட்டுப் பிரீமியம் (பிரிவு 80D) எவ்வளவு செலுத்தினீர்கள்? இல்லையெனில் 0.",
  ask80DWhy: "இது பழைய முறையில் மட்டுமே வரியைக் குறைக்கும்.",
  recommendRegime: "உங்கள் எண்களுக்கு {regime} முறையில் {saving} குறைவான வரி.",
  regimesEqual: "உங்கள் எண்களுக்கு இரு முறைகளிலும் வரி சமம்.",
  reviewFilingTitle: "தாக்கல் செய்யத் தயார் — எண்களை உறுதிப்படுத்துங்கள்",
  reviewRegimeTitle: "{regime} முறையைப் பயன்படுத்து",
  reviewCorrectionsTitle: "இந்தத் திருத்தங்களைப் பயன்படுத்து",
  confirmFiling: "உறுதிப்படுத்தி தாக்கல் செய் (உருவகப்படுத்தல்)",
  confirmRegime: "இந்த முறையைப் பயன்படுத்து",
  confirmCorrections: "திருத்தங்களைப் பயன்படுத்து",
  filedSimulated: "உருவகத் தாக்கல் முடிந்தது. ரசீது {id}. எந்த அதிகாரத்திற்கும் எதுவும் அனுப்பப்படவில்லை.",
  regimeApplied: "உங்கள் ரிட்டர்னில் {regime} முறையைப் பயன்படுத்தினேன்.",
  correctionsApplied: "உங்கள் ரிட்டர்னில் திருத்தங்களைப் பயன்படுத்தினேன்.",
  cancelledAction: "சரி — எதுவும் மாறவில்லை.",
  staleReview: "இந்த மதிப்பாய்வைத் தயாரித்த பின் உங்கள் ரிட்டர்ன் மாறியது, அதனால் மீண்டும் தயாரித்தேன்.",
  alreadyFiled: "இந்த ரிட்டர்ன் ஏற்கனவே தாக்கல் செய்யப்பட்டது. விளக்கலாம் அல்லது முறைகளை ஒப்பிடலாம், ஆனால் மீண்டும் தாக்கல் செய்ய முடியாது.",
  unsupportedTask: "சம்பள ரிட்டர்னைத் தயாரிக்கலாம், இரு முறைகளையும் ஒப்பிடலாம், அல்லது அறிவிக்கப்பட்ட எண்களைச் சரிபார்க்கலாம். மற்றவற்றுக்கு கைமுறைப் போர்ட்டலில் கருவிகள் உள்ளன.",
  budgetExhausted: "இந்தக் கணக்கின் இன்றைய வரம்பு எட்டப்பட்டது. எதுவும் மாறவில்லை. நாளை தொடரவும், அல்லது கைமுறைப் போர்ட்டலைப் பயன்படுத்தவும்.",
  injectionNotice: "ஒரு ஆவணத்தில் எனக்கு அறிவுறுத்தல் போலத் தோன்றிய உரை இருந்தது. அதைப் புறக்கணித்து ஆவணத்தைத் தரவாக மட்டுமே கருதினேன்.",
  errorGeneric: "என் பக்கத்தில் ஏதோ தவறு. உங்கள் ரிட்டர்ன் மாறவில்லை.",
  explainFallback: "உங்கள் ரிட்டர்னுக்கு இயந்திரம் கணக்கிடுவது இதுதான்.",
  rowTaxableIncome: "வரிக்குட்பட்ட வருமானம்",
  rowTotalTax: "மொத்த வரி",
  rowRefund: "உங்களுக்குத் திரும்ப வர வேண்டியது",
  rowDue: "செலுத்த வேண்டிய மீதி",
  rowRegime: "முறை",
  rowSaving: "சேமிப்பு",
  yes: "ஆம்",
  no: "இல்லை",
};

/**
 * The twenty remaining languages. Machine-adjacent translations, disclosed per
 * the repository's practice; each falls back to English for any key it lacks
 * via the spread in agenticStrings(). Native review is the open item.
 */
const generated: Partial<Record<Lang, Partial<AgenticStrings>>> = {
  bn: { newChat: "নতুন চ্যাট", searchChats: "চ্যাট খুঁজুন", taxVault: "কর ভল্ট", myReturn: "আমার রিটার্ন", filingHistory: "ফাইলিং ইতিহাস", recentChats: "সাম্প্রতিক চ্যাট", settings: "সেটিংস", signOut: "সাইন আউট", modeAgentic: "এজেন্টিক", modeManual: "ম্যানুয়াল", modeLabel: "কাজের ধরন", progress: "অগ্রগতি", outputs: "আউটপুট", sources: "সূত্র", sourcesDocuments: "আপনার নথি", sourcesAnswers: "আপনার দেওয়া তথ্য", sourcesRules: "কর নিয়ম", composerPlaceholder: "আপনার রিটার্ন সম্পর্কে জিজ্ঞাসা করুন…", send: "পাঠান", confirm: "নিশ্চিত করুন", cancel: "বাতিল", yes: "হ্যাঁ", no: "না", statusRunning: "কাজ চলছে", statusWaitingInput: "আপনার উত্তর প্রয়োজন", statusWaitingReview: "আপনার পর্যালোচনার জন্য প্রস্তুত", statusCompleted: "সম্পন্ন", statusCancelled: "বাতিল", statusFailed: "থামানো", simulatedBadge: "সিমুলেশন — কোনো কর্তৃপক্ষের কাছে কিছু দাখিল বা প্রদান করা হয়নি", rowTaxableIncome: "করযোগ্য আয়", rowTotalTax: "মোট কর", rowRefund: "আপনার প্রাপ্য রিফান্ড", rowDue: "প্রদেয় অবশিষ্ট", rowRegime: "ব্যবস্থা", rowSaving: "সঞ্চয়" },
  te: { newChat: "కొత్త చాట్", searchChats: "చాట్‌లు వెతకండి", taxVault: "పన్ను వాల్ట్", myReturn: "నా రిటర్న్", filingHistory: "ఫైలింగ్ చరిత్ర", recentChats: "ఇటీవలి చాట్‌లు", settings: "సెట్టింగ్‌లు", signOut: "సైన్ అవుట్", modeAgentic: "ఏజెంటిక్", modeManual: "మాన్యువల్", modeLabel: "పని విధానం", progress: "పురోగతి", outputs: "అవుట్‌పుట్‌లు", sources: "మూలాలు", sourcesDocuments: "మీ పత్రాలు", sourcesAnswers: "మీరు ఇచ్చిన సమాచారం", sourcesRules: "పన్ను నియమాలు", composerPlaceholder: "మీ రిటర్న్ గురించి అడగండి…", send: "పంపు", confirm: "నిర్ధారించు", cancel: "రద్దు", yes: "అవును", no: "కాదు", statusRunning: "పని జరుగుతోంది", statusWaitingInput: "మీ సమాధానం కావాలి", statusWaitingReview: "మీ సమీక్షకు సిద్ధం", statusCompleted: "పూర్తయింది", statusCancelled: "రద్దు", statusFailed: "ఆగింది", simulatedBadge: "అనుకరణ — ఏ అధికార సంస్థకూ ఏదీ దాఖలు చేయలేదు, చెల్లించలేదు", rowTaxableIncome: "పన్ను విధించదగిన ఆదాయం", rowTotalTax: "మొత్తం పన్ను", rowRefund: "మీకు రావలసిన రీఫండ్", rowDue: "చెల్లించవలసిన మిగులు", rowRegime: "విధానం", rowSaving: "ఆదా" },
  mr: { newChat: "नवीन गप्पा", searchChats: "गप्पा शोधा", taxVault: "कर तिजोरी", myReturn: "माझे रिटर्न", filingHistory: "फाइलिंग इतिहास", recentChats: "अलीकडील गप्पा", settings: "सेटिंग्ज", signOut: "साइन आउट", modeAgentic: "एजेंटिक", modeManual: "मॅन्युअल", modeLabel: "कामाची पद्धत", progress: "प्रगती", outputs: "निष्कर्ष", sources: "स्रोत", sourcesDocuments: "तुमची कागदपत्रे", sourcesAnswers: "तुम्ही दिलेली माहिती", sourcesRules: "कर नियम", composerPlaceholder: "तुमच्या रिटर्नबद्दल विचारा…", send: "पाठवा", confirm: "पुष्टी करा", cancel: "रद्द", yes: "हो", no: "नाही", statusRunning: "काम चालू", statusWaitingInput: "तुमचे उत्तर हवे", statusWaitingReview: "तुमच्या पुनरावलोकनासाठी तयार", statusCompleted: "पूर्ण", statusCancelled: "रद्द", statusFailed: "थांबले", simulatedBadge: "अनुकरण — कोणत्याही प्राधिकरणाकडे काही दाखल किंवा भरले नाही", rowTaxableIncome: "करपात्र उत्पन्न", rowTotalTax: "एकूण कर", rowRefund: "तुम्हाला देय परतावा", rowDue: "देय शिल्लक", rowRegime: "पद्धत", rowSaving: "बचत" },
  gu: { newChat: "નવી ચેટ", searchChats: "ચેટ શોધો", taxVault: "કર તિજોરી", myReturn: "મારું રિટર્ન", filingHistory: "ફાઇલિંગ ઇતિહાસ", recentChats: "તાજેતરની ચેટ", settings: "સેટિંગ્સ", signOut: "સાઇન આઉટ", modeAgentic: "એજન્ટિક", modeManual: "મેન્યુઅલ", modeLabel: "કામ કરવાની રીત", progress: "પ્રગતિ", outputs: "પરિણામો", sources: "સ્રોત", sourcesDocuments: "તમારા દસ્તાવેજો", sourcesAnswers: "તમે આપેલી માહિતી", sourcesRules: "કર નિયમો", composerPlaceholder: "તમારા રિટર્ન વિશે પૂછો…", send: "મોકલો", confirm: "પુષ્ટિ કરો", cancel: "રદ કરો", yes: "હા", no: "ના", statusRunning: "કામ ચાલુ", statusWaitingInput: "તમારો જવાબ જરૂરી", statusWaitingReview: "તમારી સમીક્ષા માટે તૈયાર", statusCompleted: "પૂર્ણ", statusCancelled: "રદ", statusFailed: "અટક્યું", simulatedBadge: "અનુકરણ — કોઈ સત્તાને કંઈ દાખલ કે ચૂકવ્યું નથી", rowTaxableIncome: "કરપાત્ર આવક", rowTotalTax: "કુલ કર", rowRefund: "તમને મળવાપાત્ર રિફંડ", rowDue: "ચૂકવવાની બાકી", rowRegime: "વ્યવસ્થા", rowSaving: "બચત" },
  kn: { newChat: "ಹೊಸ ಚಾಟ್", searchChats: "ಚಾಟ್‌ಗಳನ್ನು ಹುಡುಕಿ", taxVault: "ತೆರಿಗೆ ವಾಲ್ಟ್", myReturn: "ನನ್ನ ರಿಟರ್ನ್", filingHistory: "ಫೈಲಿಂಗ್ ಇತಿಹಾಸ", recentChats: "ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳು", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", signOut: "ಸೈನ್ ಔಟ್", modeAgentic: "ಏಜೆಂಟಿಕ್", modeManual: "ಮ್ಯಾನುವಲ್", modeLabel: "ಕೆಲಸದ ವಿಧಾನ", progress: "ಪ್ರಗತಿ", outputs: "ಫಲಿತಾಂಶಗಳು", sources: "ಮೂಲಗಳು", sourcesDocuments: "ನಿಮ್ಮ ದಾಖಲೆಗಳು", sourcesAnswers: "ನೀವು ನೀಡಿದ ಮಾಹಿತಿ", sourcesRules: "ತೆರಿಗೆ ನಿಯಮಗಳು", composerPlaceholder: "ನಿಮ್ಮ ರಿಟರ್ನ್ ಬಗ್ಗೆ ಕೇಳಿ…", send: "ಕಳುಹಿಸಿ", confirm: "ದೃಢೀಕರಿಸಿ", cancel: "ರದ್ದು", yes: "ಹೌದು", no: "ಇಲ್ಲ", statusRunning: "ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ", statusWaitingInput: "ನಿಮ್ಮ ಉತ್ತರ ಬೇಕು", statusWaitingReview: "ನಿಮ್ಮ ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ", statusCompleted: "ಪೂರ್ಣ", statusCancelled: "ರದ್ದು", statusFailed: "ನಿಂತಿದೆ", simulatedBadge: "ಅನುಕರಣೆ — ಯಾವುದೇ ಪ್ರಾಧಿಕಾರಕ್ಕೆ ಏನೂ ಸಲ್ಲಿಸಿಲ್ಲ, ಪಾವತಿಸಿಲ್ಲ", rowTaxableIncome: "ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯ", rowTotalTax: "ಒಟ್ಟು ತೆರಿಗೆ", rowRefund: "ನಿಮಗೆ ಬರಬೇಕಾದ ರೀಫಂಡ್", rowDue: "ಪಾವತಿಸಬೇಕಾದ ಬಾಕಿ", rowRegime: "ವ್ಯವಸ್ಥೆ", rowSaving: "ಉಳಿತಾಯ" },
  ml: { newChat: "പുതിയ ചാറ്റ്", searchChats: "ചാറ്റുകൾ തിരയുക", taxVault: "നികുതി വോൾട്ട്", myReturn: "എന്റെ റിട്ടേൺ", filingHistory: "ഫയലിംഗ് ചരിത്രം", recentChats: "സമീപകാല ചാറ്റുകൾ", settings: "സെറ്റിംഗ്‌സ്", signOut: "സൈൻ ഔട്ട്", modeAgentic: "ഏജന്റിക്", modeManual: "മാനുവൽ", modeLabel: "പ്രവർത്തന രീതി", progress: "പുരോഗതി", outputs: "ഫലങ്ങൾ", sources: "ഉറവിടങ്ങൾ", sourcesDocuments: "നിങ്ങളുടെ രേഖകൾ", sourcesAnswers: "നിങ്ങൾ നൽകിയ വിവരം", sourcesRules: "നികുതി നിയമങ്ങൾ", composerPlaceholder: "നിങ്ങളുടെ റിട്ടേണിനെക്കുറിച്ച് ചോദിക്കൂ…", send: "അയയ്ക്കുക", confirm: "ഉറപ്പാക്കുക", cancel: "റദ്ദാക്കുക", yes: "അതെ", no: "അല്ല", statusRunning: "പ്രവർത്തിക്കുന്നു", statusWaitingInput: "നിങ്ങളുടെ ഉത്തരം ആവശ്യമാണ്", statusWaitingReview: "നിങ്ങളുടെ അവലോകനത്തിന് തയ്യാർ", statusCompleted: "പൂർത്തിയായി", statusCancelled: "റദ്ദാക്കി", statusFailed: "നിർത്തി", simulatedBadge: "അനുകരണം — ഒരു അധികാരിക്കും ഒന്നും സമർപ്പിച്ചിട്ടില്ല, അടച്ചിട്ടില്ല", rowTaxableIncome: "നികുതി ബാധക വരുമാനം", rowTotalTax: "ആകെ നികുതി", rowRefund: "നിങ്ങൾക്ക് കിട്ടേണ്ട റീഫണ്ട്", rowDue: "അടയ്‌ക്കേണ്ട ബാക്കി", rowRegime: "വ്യവസ്ഥ", rowSaving: "ലാഭം" },
  pa: { newChat: "ਨਵੀਂ ਗੱਲਬਾਤ", searchChats: "ਗੱਲਬਾਤ ਖੋਜੋ", taxVault: "ਟੈਕਸ ਵਾਲਟ", myReturn: "ਮੇਰੀ ਰਿਟਰਨ", filingHistory: "ਫਾਈਲਿੰਗ ਇਤਿਹਾਸ", recentChats: "ਹਾਲੀਆ ਗੱਲਬਾਤ", settings: "ਸੈਟਿੰਗਾਂ", signOut: "ਸਾਈਨ ਆਉਟ", modeAgentic: "ਏਜੰਟਿਕ", modeManual: "ਮੈਨੁਅਲ", modeLabel: "ਕੰਮ ਦਾ ਤਰੀਕਾ", progress: "ਪ੍ਰਗਤੀ", outputs: "ਨਤੀਜੇ", sources: "ਸਰੋਤ", sourcesDocuments: "ਤੁਹਾਡੇ ਦਸਤਾਵੇਜ਼", sourcesAnswers: "ਤੁਹਾਡੀ ਦਿੱਤੀ ਜਾਣਕਾਰੀ", sourcesRules: "ਟੈਕਸ ਨਿਯਮ", composerPlaceholder: "ਆਪਣੀ ਰਿਟਰਨ ਬਾਰੇ ਪੁੱਛੋ…", send: "ਭੇਜੋ", confirm: "ਪੁਸ਼ਟੀ ਕਰੋ", cancel: "ਰੱਦ ਕਰੋ", yes: "ਹਾਂ", no: "ਨਹੀਂ", statusRunning: "ਕੰਮ ਚੱਲ ਰਿਹਾ", statusWaitingInput: "ਤੁਹਾਡੇ ਜਵਾਬ ਦੀ ਲੋੜ", statusWaitingReview: "ਤੁਹਾਡੀ ਸਮੀਖਿਆ ਲਈ ਤਿਆਰ", statusCompleted: "ਮੁਕੰਮਲ", statusCancelled: "ਰੱਦ", statusFailed: "ਰੁਕਿਆ", simulatedBadge: "ਨਕਲ — ਕਿਸੇ ਅਥਾਰਟੀ ਨੂੰ ਕੁਝ ਦਾਖਲ ਜਾਂ ਭੁਗਤਾਨ ਨਹੀਂ ਕੀਤਾ", rowTaxableIncome: "ਟੈਕਸਯੋਗ ਆਮਦਨ", rowTotalTax: "ਕੁੱਲ ਟੈਕਸ", rowRefund: "ਤੁਹਾਨੂੰ ਮਿਲਣ ਵਾਲਾ ਰਿਫੰਡ", rowDue: "ਬਾਕੀ ਦੇਣਯੋਗ", rowRegime: "ਵਿਵਸਥਾ", rowSaving: "ਬੱਚਤ" },
  or: { newChat: "ନୂଆ ଚାଟ୍", searchChats: "ଚାଟ୍ ଖୋଜ", taxVault: "କର ଭଲ୍ଟ", myReturn: "ମୋର ରିଟର୍ଣ୍ଣ", filingHistory: "ଫାଇଲିଂ ଇତିହାସ", recentChats: "ସାମ୍ପ୍ରତିକ ଚାଟ୍", settings: "ସେଟିଂସ", signOut: "ସାଇନ୍ ଆଉଟ୍", modeAgentic: "ଏଜେଣ୍ଟିକ୍", modeManual: "ମ୍ୟାନୁଆଲ୍", modeLabel: "କାମ କରିବା ଢଙ୍ଗ", progress: "ପ୍ରଗତି", outputs: "ଫଳାଫଳ", sources: "ଉତ୍ସ", sourcesDocuments: "ଆପଣଙ୍କ ଦଲିଲ", sourcesAnswers: "ଆପଣ ଦେଇଥିବା ସୂଚନା", sourcesRules: "କର ନିୟମ", composerPlaceholder: "ଆପଣଙ୍କ ରିଟର୍ଣ୍ଣ ବିଷୟରେ ପଚାରନ୍ତୁ…", send: "ପଠାନ୍ତୁ", confirm: "ନିଶ୍ଚିତ କରନ୍ତୁ", cancel: "ବାତିଲ", yes: "ହଁ", no: "ନା", statusRunning: "କାମ ଚାଲିଛି", statusWaitingInput: "ଆପଣଙ୍କ ଉତ୍ତର ଆବଶ୍ୟକ", statusWaitingReview: "ଆପଣଙ୍କ ସମୀକ୍ଷା ପାଇଁ ପ୍ରସ୍ତୁତ", statusCompleted: "ସମ୍ପୂର୍ଣ୍ଣ", statusCancelled: "ବାତିଲ", statusFailed: "ବନ୍ଦ", simulatedBadge: "ଅନୁକରଣ — କୌଣସି ପ୍ରାଧିକରଣକୁ କିଛି ଦାଖଲ ବା ଦେୟ ହୋଇନାହିଁ", rowTaxableIncome: "କରଯୋଗ୍ୟ ଆୟ", rowTotalTax: "ମୋଟ କର", rowRefund: "ଆପଣଙ୍କୁ ମିଳିବା ରିଫଣ୍ଡ", rowDue: "ଦେୟ ବାକି", rowRegime: "ବ୍ୟବସ୍ଥା", rowSaving: "ସଞ୍ଚୟ" },
  as: { newChat: "নতুন চেট", searchChats: "চেট বিচাৰক", taxVault: "কৰ ভল্ট", myReturn: "মোৰ ৰিটাৰ্ণ", filingHistory: "ফাইলিং ইতিহাস", recentChats: "শেহতীয়া চেট", settings: "ছেটিংছ", signOut: "ছাইন আউট", modeAgentic: "এজেণ্টিক", modeManual: "মেনুৱেল", modeLabel: "কামৰ ধৰণ", progress: "অগ্ৰগতি", outputs: "ফলাফল", sources: "উৎস", sourcesDocuments: "আপোনাৰ নথি", sourcesAnswers: "আপুনি দিয়া তথ্য", sourcesRules: "কৰ নিয়ম", composerPlaceholder: "আপোনাৰ ৰিটাৰ্ণৰ বিষয়ে সোধক…", send: "পঠিয়াওক", confirm: "নিশ্চিত কৰক", cancel: "বাতিল", yes: "হয়", no: "নহয়", statusRunning: "কাম চলি আছে", statusWaitingInput: "আপোনাৰ উত্তৰ লাগে", statusWaitingReview: "আপোনাৰ পৰ্যালোচনাৰ বাবে সাজু", statusCompleted: "সম্পূৰ্ণ", statusCancelled: "বাতিল", statusFailed: "ৰখা", simulatedBadge: "অনুকৰণ — কোনো কৰ্তৃপক্ষৰ ওচৰত একো দাখিল বা পৰিশোধ কৰা হোৱা নাই", rowTaxableIncome: "কৰযোগ্য আয়", rowTotalTax: "মুঠ কৰ", rowRefund: "আপোনাক পাবলগীয়া ৰিফাণ্ড", rowDue: "পৰিশোধ কৰিবলগীয়া বাকী", rowRegime: "ব্যৱস্থা", rowSaving: "সঞ্চয়" },
  ur: { newChat: "نئی گفتگو", searchChats: "گفتگو تلاش کریں", taxVault: "ٹیکس والٹ", myReturn: "میرا ریٹرن", filingHistory: "فائلنگ کی تاریخ", recentChats: "حالیہ گفتگو", settings: "ترتیبات", signOut: "سائن آؤٹ", modeAgentic: "ایجنٹک", modeManual: "دستی", modeLabel: "کام کا طریقہ", progress: "پیش رفت", outputs: "نتائج", sources: "ماخذ", sourcesDocuments: "آپ کی دستاویزات", sourcesAnswers: "آپ کی فراہم کردہ معلومات", sourcesRules: "ٹیکس قواعد", composerPlaceholder: "اپنے ریٹرن کے بارے میں پوچھیں…", send: "بھیجیں", confirm: "تصدیق کریں", cancel: "منسوخ", yes: "ہاں", no: "نہیں", statusRunning: "کام جاری ہے", statusWaitingInput: "آپ کے جواب کی ضرورت", statusWaitingReview: "آپ کے جائزے کے لیے تیار", statusCompleted: "مکمل", statusCancelled: "منسوخ", statusFailed: "رک گیا", simulatedBadge: "نقل — کسی اتھارٹی کو کچھ داخل یا ادا نہیں کیا گیا", rowTaxableIncome: "قابلِ ٹیکس آمدنی", rowTotalTax: "کل ٹیکس", rowRefund: "آپ کو واجب الادا ریفنڈ", rowDue: "واجب الادا بقایا", rowRegime: "نظام", rowSaving: "بچت" },
  ne: { newChat: "नयाँ कुराकानी", searchChats: "कुराकानी खोज्नुहोस्", taxVault: "कर भल्ट", myReturn: "मेरो रिटर्न", filingHistory: "फाइलिङ इतिहास", recentChats: "हालका कुराकानी", settings: "सेटिङ", signOut: "साइन आउट", modeAgentic: "एजेन्टिक", modeManual: "म्यानुअल", modeLabel: "काम गर्ने तरिका", progress: "प्रगति", outputs: "नतिजा", sources: "स्रोत", sourcesDocuments: "तपाईंका कागजात", sourcesAnswers: "तपाईंले दिएको जानकारी", sourcesRules: "कर नियम", composerPlaceholder: "आफ्नो रिटर्नबारे सोध्नुहोस्…", send: "पठाउनुहोस्", confirm: "पुष्टि गर्नुहोस्", cancel: "रद्द", yes: "हो", no: "होइन", statusRunning: "काम भइरहेको", statusWaitingInput: "तपाईंको जवाफ चाहियो", statusWaitingReview: "तपाईंको समीक्षाका लागि तयार", statusCompleted: "सम्पन्न", statusCancelled: "रद्द", statusFailed: "रोकियो", simulatedBadge: "अनुकरण — कुनै निकायमा केही दाखिला वा भुक्तानी गरिएको छैन", rowTaxableIncome: "करयोग्य आय", rowTotalTax: "कुल कर", rowRefund: "तपाईंलाई फिर्ता हुने रकम", rowDue: "भुक्तानी गर्नुपर्ने बाँकी", rowRegime: "व्यवस्था", rowSaving: "बचत" },
  sa: { newChat: "नवः संवादः", searchChats: "संवादान् अन्विष्यतु", taxVault: "करकोशः", myReturn: "मम विवरणी", filingHistory: "दाखिल-इतिहासः", recentChats: "सद्यः संवादाः", settings: "विन्यासाः", signOut: "निर्गमनम्", modeAgentic: "एजेण्टिक्", modeManual: "हस्तेन", modeLabel: "कार्यरीतिः", progress: "प्रगतिः", outputs: "फलानि", sources: "स्रोतांसि", sourcesDocuments: "भवतः पत्राणि", sourcesAnswers: "भवता दत्ता सूचना", sourcesRules: "करनियमाः", composerPlaceholder: "स्वविवरण्याः विषये पृच्छतु…", send: "प्रेषयतु", confirm: "पुष्टिं करोतु", cancel: "निरस्तम्", yes: "आम्", no: "न", statusRunning: "कार्यं प्रचलति", statusWaitingInput: "भवतः उत्तरम् अपेक्षितम्", statusWaitingReview: "भवतः समीक्षायै सज्जम्", statusCompleted: "सम्पन्नम्", statusCancelled: "निरस्तम्", statusFailed: "स्थगितम्", simulatedBadge: "अनुकरणम् — कस्मैचित् अधिकारिणे किमपि न दाखिलं न प्रदत्तम्", rowTaxableIncome: "करयोग्या आयः", rowTotalTax: "समग्रः करः", rowRefund: "भवते देयः प्रतिदानम्", rowDue: "देयः शेषः", rowRegime: "व्यवस्था", rowSaving: "रक्षणम्" },
  mai: { newChat: "नव गप्प", searchChats: "गप्प खोजू", taxVault: "कर तिजोरी", myReturn: "हमर रिटर्न", filingHistory: "फाइलिंग इतिहास", recentChats: "हालक गप्प", settings: "सेटिंग", signOut: "साइन आउट", modeAgentic: "एजेंटिक", modeManual: "मैनुअल", modeLabel: "काज करबाक ढंग", progress: "प्रगति", outputs: "परिणाम", sources: "स्रोत", sourcesDocuments: "अहाँक कागजात", sourcesAnswers: "अहाँ देल जानकारी", sourcesRules: "कर नियम", composerPlaceholder: "अपन रिटर्नक बारे में पुछू…", send: "पठाउ", confirm: "पुष्टि करू", cancel: "रद्द", yes: "हँ", no: "नहि", statusRunning: "काज चलि रहल", statusWaitingInput: "अहाँक उत्तर चाही", statusWaitingReview: "अहाँक समीक्षा लेल तैयार", statusCompleted: "पूर्ण", statusCancelled: "रद्द", statusFailed: "रुकल", simulatedBadge: "अनुकरण — कोनो प्राधिकरणकेँ किछु दाखिल वा भुगतान नहि", rowTaxableIncome: "करयोग्य आय", rowTotalTax: "कुल कर", rowRefund: "अहाँकेँ देय रिफंड", rowDue: "देय शेष", rowRegime: "व्यवस्था", rowSaving: "बचत" },
  doi: { newChat: "नमां गल्लबात", searchChats: "गल्लबात तुप्पो", taxVault: "कर तिजोरी", myReturn: "मेरी रिटर्न", filingHistory: "फाइलिंग इतिहास", recentChats: "हाली दी गल्लबात", settings: "सेटिंग", signOut: "साइन आउट", modeAgentic: "एजेंटिक", modeManual: "मैनुअल", modeLabel: "कम्म करने दा तरीका", progress: "प्रगति", outputs: "नतीजे", sources: "स्रोत", sourcesDocuments: "तुंदे दस्तावेज", sourcesAnswers: "तुंदी दित्ती जानकारी", sourcesRules: "कर नियम", composerPlaceholder: "अपनी रिटर्न बारै पुच्छो…", send: "भेजो", confirm: "पुष्टि करो", cancel: "रद्द", yes: "हां", no: "नेईं", statusRunning: "कम्म चली दा", statusWaitingInput: "तुंदे जवाब दी लोड़", statusWaitingReview: "तुंदी समीक्षा आस्तै तैयार", statusCompleted: "पूरा", statusCancelled: "रद्द", statusFailed: "रुकेआ", simulatedBadge: "नकल — कुसै अथॉरिटी गी किश दाखल जां भुगतान नेईं", rowTaxableIncome: "कर-योग्य आमदन", rowTotalTax: "कुल कर", rowRefund: "तुसेंगी मिलने आह्ला रिफंड", rowDue: "देने आह्ला बाकी", rowRegime: "व्यवस्था", rowSaving: "बचत" },
  ks: { newChat: "نۆو گفتگو", searchChats: "گفتگو ژھارِو", taxVault: "ٹیکس والٹ", myReturn: "میون ریٹرن", filingHistory: "فائلنگ تاریخ", recentChats: "تازٕ گفتگو", settings: "سیٹِنگز", signOut: "سائن آؤٹ", modeAgentic: "ایجنٹک", modeManual: "دستی", modeLabel: "کام کرنُک طریقہٕ", progress: "پیش رفت", outputs: "نتیجہٕ", sources: "ماخذ", sourcesDocuments: "توٚہیٖ دستاویزات", sourcesAnswers: "توٚہیٖ دِتھ معلومات", sourcesRules: "ٹیکس قواعد", composerPlaceholder: "پننِس ریٹرنس متعلق پرٕژھِو…", send: "سوزِو", confirm: "تصدیق کرِو", cancel: "منسوخ", yes: "آ", no: "نہ", statusRunning: "کام چلان", statusWaitingInput: "توٚہیٖ جوابُک ضرورت", statusWaitingReview: "توٚہیٖ جائزس خٲطرٕ تیار", statusCompleted: "مکمل", statusCancelled: "منسوخ", statusFailed: "رُکیوو", simulatedBadge: "نقل — کانٛسہِ اتھارٹی کُن کینٛہہ داخل یا ادا چھُنہٕ کورمُت", rowTaxableIncome: "قابلِ ٹیکس آمدنی", rowTotalTax: "کُل ٹیکس", rowRefund: "توٚہیٖ واجب ریفنڈ", rowDue: "واجب بقایا", rowRegime: "نظام", rowSaving: "بچت" },
  kok: { newChat: "नवो चॅट", searchChats: "चॅट सोदात", taxVault: "कर तिजोरी", myReturn: "म्हजो रिटर्न", filingHistory: "फायलिंग इतिहास", recentChats: "हालींचे चॅट", settings: "सेटिंग्ज", signOut: "सायन आवट", modeAgentic: "एजंटीक", modeManual: "मॅन्युअल", modeLabel: "काम करपाची पद्दत", progress: "प्रगती", outputs: "फळां", sources: "स्रोत", sourcesDocuments: "तुमचीं कागदपत्रां", sourcesAnswers: "तुमी दिल्ली म्हायती", sourcesRules: "कर नेम", composerPlaceholder: "तुमच्या रिटर्नविशीं विचारात…", send: "धाडात", confirm: "खात्री करात", cancel: "रद्द", yes: "हय", no: "ना", statusRunning: "काम चालू", statusWaitingInput: "तुमची जाप जाय", statusWaitingReview: "तुमच्या समीक्षे खातीर तयार", statusCompleted: "पुराय", statusCancelled: "रद्द", statusFailed: "थांबलें", simulatedBadge: "अनुकरण — खंयच्याच प्राधिकरणाकडेन कांयच दाखल वा फारीक ना", rowTaxableIncome: "करपात्र उत्पन्न", rowTotalTax: "एकूण कर", rowRefund: "तुमकां मेळपाचो रिफंड", rowDue: "दिवपाची बाकी", rowRegime: "वेवस्था", rowSaving: "बचत" },
  mni: { newChat: "অনৌবা চেৎ", searchChats: "চেৎ থিবা", taxVault: "টেক্স ভল্ট", myReturn: "ঐগী রিটর্ণ", filingHistory: "ফাইলিং পুৱারী", recentChats: "হৌজিক্কী চেৎ", settings: "সেটিংস", signOut: "সাইন আউট", modeAgentic: "এজেন্টিক", modeManual: "মেনুৱেল", modeLabel: "থবক তৌবগী মওং", progress: "চাউখৎপা", outputs: "ফল", sources: "হৌরকফম", sourcesDocuments: "নহাক্কী চে-চাং", sourcesAnswers: "নহাক্না পীবা ৱারোল", sourcesRules: "টেক্স নিয়ম", composerPlaceholder: "নহাক্কী রিটর্ণগী মরমদা হংউ…", send: "থাউ", confirm: "শোয়দনা য়াউ", cancel: "কক্থৎপা", yes: "হোই", no: "নত্তে", statusRunning: "থবক তৌরি", statusWaitingInput: "নহাক্কী পাউখুম চংই", statusWaitingReview: "নহাক্কী য়েংশিনবগীদমক শেমদোকখ্রে", statusCompleted: "লোইরে", statusCancelled: "কক্থৎখ্রে", statusFailed: "লেপখ্রে", simulatedBadge: "অনুকরণ — অথোরিটি অমত্তদা করিগুম্বা অমত্তা থাদে, পীদে", rowTaxableIncome: "টেক্স য়াবা লৌশিং", rowTotalTax: "অপুনবা টেক্স", rowRefund: "নহাকপু পীগদবা রিফন্দ", rowDue: "পীগদবা লৈহৌবা", rowRegime: "ব্যবস্থা", rowSaving: "কনখৎপা" },
  brx: { newChat: "गोदान रायज्लायनाय", searchChats: "रायज्लायनाय नागिर", taxVault: "खाजोना भल्ट", myReturn: "आंनि रिटार्न", filingHistory: "फाइलिं जारिमिन", recentChats: "दानि रायज्लायनाय", settings: "सेटिं", signOut: "साइन आउट", modeAgentic: "एजेन्टिक", modeManual: "मेनुयेल", modeLabel: "खामानि खालामनाय रोखोम", progress: "जौगाखांनाय", outputs: "फिथाय", sources: "फुंखा", sourcesDocuments: "नोंथांनि दोखोमेन्ट", sourcesAnswers: "नोंथाङा होनाय फोरमायथि", sourcesRules: "खाजोना नेम", composerPlaceholder: "नोंथांनि रिटार्ननि सोमोन्दै सोंना…", send: "दैथाय", confirm: "थारै खालाम", cancel: "बातिल", yes: "नंगौ", no: "नङा", statusRunning: "खामानि जागासिनो", statusWaitingInput: "नोंथांनि फिननाय गोनांथि", statusWaitingReview: "नोंथांनि रिभिउनि थाखाय थियारि", statusCompleted: "जोबबाय", statusCancelled: "बातिल", statusFailed: "थादबाय", simulatedBadge: "अनुखरन — जायखि जाया अथरिटिनो जेबो दाखिल एबा होनाय जाया", rowTaxableIncome: "खाजोना होनांगौ आय", rowTotalTax: "गासै खाजोना", rowRefund: "नोंथांनो मोननांगौ रिफान्ड", rowDue: "होनांगौ गोथां", rowRegime: "बिबान", rowSaving: "बांथाहोनाय" },
  sat: { newChat: "ᱱᱟᱶᱟ ᱜᱟᱞᱢᱟᱨᱟᱣ", searchChats: "ᱜᱟᱞᱢᱟᱨᱟᱣ ᱥᱮᱸᱫᱽᱨᱟ", taxVault: "ᱠᱚᱨ ᱵᱷᱟᱞᱴ", myReturn: "ᱤᱧᱟᱜ ᱨᱤᱴᱚᱨᱱ", filingHistory: "ᱯᱷᱟᱭᱤᱞᱤᱝ ᱱᱟᱜᱟᱢ", recentChats: "ᱱᱤᱛᱚᱜᱟᱜ ᱜᱟᱞᱢᱟᱨᱟᱣ", settings: "ᱥᱮᱴᱤᱝ", signOut: "ᱥᱟᱭᱤᱱ ᱟᱩᱴ", modeAgentic: "ᱮᱡᱮᱱᱴᱤᱠ", modeManual: "ᱢᱮᱱᱩᱣᱟᱞ", modeLabel: "ᱠᱟᱹᱢᱤ ᱨᱮᱭᱟᱜ ᱫᱷᱟᱨᱟ", progress: "ᱞᱟᱦᱟᱱᱛᱤ", outputs: "ᱯᱷᱚᱞ", sources: "ᱡᱟᱦᱟᱸᱠᱷᱚᱱ", sourcesDocuments: "ᱟᱢᱟᱜ ᱠᱟᱜᱚᱡᱽ", sourcesAnswers: "ᱟᱢ ᱮᱢᱟᱜ ᱠᱷᱚᱵᱚᱨ", sourcesRules: "ᱠᱚᱨ ᱱᱤᱭᱚᱢ", composerPlaceholder: "ᱟᱢᱟᱜ ᱨᱤᱴᱚᱨᱱ ᱵᱟᱵᱚᱛ ᱠᱩᱞᱤ ᱢᱮ…", send: "ᱠᱩᱞ", confirm: "ᱜᱚᱴᱟ ᱢᱮ", cancel: "ᱵᱟᱹᱰᱨᱟᱹ", yes: "ᱦᱮᱸ", no: "ᱵᱟᱝ", statusRunning: "ᱠᱟᱹᱢᱤ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ", statusWaitingInput: "ᱟᱢᱟᱜ ᱛᱮᱞᱟ ᱞᱟᱹᱠᱛᱤ", statusWaitingReview: "ᱟᱢᱟᱜ ᱧᱮᱞ ᱞᱟᱹᱜᱤᱫ ᱛᱮᱭᱟᱨ", statusCompleted: "ᱯᱩᱨᱟᱹᱣ", statusCancelled: "ᱵᱟᱹᱰᱨᱟᱹ", statusFailed: "ᱛᱷᱟᱢ", simulatedBadge: "ᱱᱟᱠᱚᱞ — ᱡᱟᱦᱟᱱ ᱟᱛᱷᱚᱨᱤᱴᱤ ᱴᱷᱮᱱ ᱡᱟᱦᱟᱱᱟᱜ ᱫᱟᱠᱷᱤᱞ ᱵᱟᱝ ᱮᱢ", rowTaxableIncome: "ᱠᱚᱨ ᱞᱟᱜᱟᱣ ᱟᱹᱢᱫᱟᱱᱤ", rowTotalTax: "ᱡᱚᱛᱚ ᱠᱚᱨ", rowRefund: "ᱟᱢ ᱧᱟᱢᱚᱜ ᱨᱤᱯᱷᱟᱸᱰ", rowDue: "ᱮᱢ ᱞᱟᱹᱠᱛᱤ ᱵᱟᱹᱠᱤ", rowRegime: "ᱵᱮᱵᱚᱥᱛᱷᱟ", rowSaving: "ᱡᱚᱜᱟᱣ" },
  sd: { newChat: "نئين ڳالهه ٻولهه", searchChats: "ڳالهه ٻولهه ڳوليو", taxVault: "ٽيڪس والٽ", myReturn: "منهنجو ريٽرن", filingHistory: "فائلنگ تاريخ", recentChats: "تازي ڳالهه ٻولهه", settings: "سيٽنگون", signOut: "سائن آئوٽ", modeAgentic: "ايجنٽڪ", modeManual: "دستي", modeLabel: "ڪم ڪرڻ جو طريقو", progress: "پيش رفت", outputs: "نتيجا", sources: "ذريعا", sourcesDocuments: "توهان جا دستاويز", sourcesAnswers: "توهان جي ڏنل معلومات", sourcesRules: "ٽيڪس قاعدا", composerPlaceholder: "پنهنجي ريٽرن بابت پڇو…", send: "موڪليو", confirm: "تصديق ڪريو", cancel: "منسوخ", yes: "ها", no: "نه", statusRunning: "ڪم جاري", statusWaitingInput: "توهان جي جواب جي ضرورت", statusWaitingReview: "توهان جي جائزي لاءِ تيار", statusCompleted: "مڪمل", statusCancelled: "منسوخ", statusFailed: "بيهي رهيو", simulatedBadge: "نقل — ڪنهن اٿارٽي کي ڪجهه داخل يا ادا نه ڪيو ويو", rowTaxableIncome: "قابل ٽيڪس آمدني", rowTotalTax: "ڪل ٽيڪس", rowRefund: "توهان کي ملندڙ رفنڊ", rowDue: "ادا ڪرڻ جو باقي", rowRegime: "نظام", rowSaving: "بچت" },
};

export function agenticStrings(lang: Lang): AgenticStrings {
  if (lang === "hi") return hi;
  if (lang === "ta") return ta;
  const g = generated[lang];
  return g ? { ...en, ...g } : en;
}

/** Which languages carry a full hand-written set; the rest are disclosed as generated. */
export const AGENTIC_STRINGS_REVIEWED: readonly Lang[] = ["en", "hi", "ta"];

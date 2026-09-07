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
  manualInspectorNote: string;
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
  noteRegimeNotExecuted: string;
  /** The shared guard found the return outside what this release can advise on; figures may still be shown. */
  noteAdviceUnavailable: string;
  /** The landing's submit button ("Ask →"). */
  ask: string;
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
  // Plain-English intake (2026-09-05)
  landingPlaceholder: string;
  intakeAckSalaried: string;
  intakeAckAmount: string;
  intakeAckGeneric: string;
  intakeNoteRentHomeLoan: string;
  intakeNoteCapitalGains: string;
  intakeBusinessUnsupported: string;
  askSalaryFigure: string;
  askSalaryFigureWhy: string;
  intakeSalaryReported: string;
  intakeSalaryStated: string;
  intakeNotSure: string;
  askForm16: string;
  askForm16Hint: string;
  askForm16Why: string;
  askPf: string;
  askPfWhy: string;
  askPfAmount: string;
  askProof: string;
  askProofWhy: string;
  askHealthInsurance: string;
  askHealthInsuranceWhy: string;
  askHealthAmount: string;
  dontHaveIt: string;
  skipForNow: string;
  uploadDocument: string;
  uploading: string;
  /** Answer bubble for a document the citizen uploaded. */
  uploaded: string;
  uploadFailed: string;
  intakeDocumentRecorded: string;
  intakeClaimSkipped: string;
  // Blank-return intake (2026-09-06): income source, residency, salary total; reviewer heads-up.
  askIncomeSource: string;
  askIncomeSourceWhy: string;
  incomeSourceSalary: string;
  incomeSourceBusiness: string;
  incomeSourceOther: string;
  askSalaryTotal: string;
  askSalaryTotalWhy: string;
  askResident: string;
  askResidentWhy: string;
  intakeOtherIncomeUnsupported: string;
  noteReviewPending: string;
  // Document-first intake (2026-09-06): source card, consent cards, the one form.
  askSource: string;
  askSourceWhy: string;
  sourceUpload: string;
  sourceUploadDetail: string;
  sourceDigiLocker: string;
  sourceDigiLockerDetail: string;
  sourceVault: string;
  sourceManual: string;
  askDigiLockerConsent: string;
  askDigiLockerConsentWhy: string;
  askVaultConsent: string;
  askVaultConsentWhy: string;
  askDetails: string;
  askDetailsWhy: string;
  fieldSalary: string;
  fieldSalaryHint: string;
  fieldPf: string;
  fieldPfHint: string;
  fieldHealth: string;
  fieldHealthHint: string;
  fieldInterest: string;
  fieldInterestHint: string;
  fieldResident: string;
  detailsEntered: string;
  formSubmit: string;
  fetchedFromDigiLocker: string;
  readFromVault: string;
  // Yearly intake (2026-09-07): the opener, the one form's groups, the verdict. Templates are fallbacks; the model phrases first.
  fetchingFromDigiLocker: string;
  openerFallback: string;
  openerFallbackNoAccount: string;
  sourceDigiLockerLinked: string;
  askHousing: string;
  housingRent: string;
  housingOwnSelf: string;
  housingOwnLetOut: string;
  housingFamily: string;
  askExtras: string;
  extraBusiness: string;
  extraSoldAssets: string;
  extraForeign: string;
  extraDirector: string;
  extraCrypto: string;
  extraAgri: string;
  extraDisability: string;
  extraFamilyPension: string;
  extraNone: string;
  askDeductionsHint: string;
  ded80C: string;
  ded80D: string;
  ded80CCD1B: string;
  ded80E: string;
  ded80G: string;
  ded24B: string;
  ded80GG: string;
  ded80EEB: string;
  fieldEmployerCategory: string;
  employerCentral: string;
  employerState: string;
  employerPsu: string;
  employerPensioner: string;
  employerOthers: string;
  verdictItr1: string;
  regimeNewLeads: string;
  regimeOldLeads: string;
  regimeOpen: string;
  verdictOtherForm: string;
  carriedFromLastYear: string;
  inspectorModelNotes: string;
  // The voice (docs/VOICE.md, 2026-09-05): small talk, lead-ins, warmth around the facts
  chatHello: string;
  chatHelloAnon: string;
  chatThanks: string;
  chatWho: string;
  chatHelp: string;
  chatHowAreYou: string;
  chatBye: string;
  chatByeAnon: string;
  leadFirst: string;
  leadNext1: string;
  leadNext2: string;
  leadNext3: string;
  leadDoc: string;
  reviewIntro: string;
  leadRecommendation: string;
  cheerRefund: string;
  cheerDue: string;
  cheerNil: string;
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
  manualInspectorNote: "Progress, outputs and sources belong to an Agentic chat. Switch to Agentic to see them for the current chat.",
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
  welcomeTitle: "Explain your situation",
  welcomeBody: "Tell me what's going on — a new job, a form you don't recognise, a refund you're waiting on. I'll check what's already on record, ask only what I can't find, show every figure with its source, and never file or pay without your say-so.",
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
  noteRegimeNotExecuted: "The old regime is cheaper for you — but it can only be chosen in a return filed by the due date, and I can't confirm that from here. So I've shown you the comparison and not switched. Confirm the filing date with a professional, or switch in Manual mode.",
  ask: "Ask",
  noteAdviceUnavailable: "I can't give you a recommendation for this return yet. Here's why:",
  taskPrepareReturn: "Prepare my return",
  taskCompareRegimes: "Compare the two regimes",
  taskReconcile: "Check reported figures",
  taskLoadDemo: "Load a demo return",
  taskExplain: "A question",
  foundDocuments: "I found {n} document(s) in your vault for this year.",
  noDocuments: "Your vault has nothing for this year yet — no problem, I'll work from the return itself.",
  metadataOnly: "One record exists but its original file was never stored, so I cannot read figures from it.",
  storageUnavailable: "The document store is not configured in this deployment, so I could not check your vault. I am working from the return itself.",
  askOtherIncome: "Did you receive any other income this year — freelance, rent, or interest not already listed?",
  askOtherIncomeWhy: "Anything not reported by a third party has to come from you.",
  ask80C: "How much did you actually pay this year into PF, life insurance, ELSS or tuition (section 80C)? Enter 0 if nothing.",
  ask80CWhy: "Only under the old regime, and only what was actually paid, counts.",
  ask80D: "How much health-insurance premium did you pay this year (section 80D)? Enter 0 if none.",
  ask80DWhy: "It reduces tax under the old regime only.",
  landingPlaceholder: "I got a job with a 12 LPA package and need to file my taxes",
  intakeAckSalaried: "You're salaried{amount}. I'll check what's already on record and ask only for what's missing.",
  intakeAckAmount: ", at about {amount} a year",
  intakeAckGeneric: "Let me check what's already on record for you.",
  intakeNoteRentHomeLoan: "You mentioned rent or a home loan. This release cannot compute house-rent allowance or home-loan interest yet, so I will leave those out and say so in the figures.",
  intakeNoteCapitalGains: "You mentioned shares, funds or a property sale. Capital gains need checks this release does not make, so I will show the rules but not a recommendation that depends on them.",
  intakeBusinessUnsupported: "You mentioned business or freelance income. This release prepares salaried returns only — I can answer questions about the rules (ask me about presumptive taxation or which ITR form applies), but I will not compute or file a business return here.",
  askSalaryFigure: "Your return already shows {reported} of salary reported by your employer. Your message mentions about {stated}. Which figure applies to this year?",
  askSalaryFigureWhy: "A new package usually starts mid-year; the return counts only what was actually paid in the year.",
  intakeSalaryReported: "Use the reported {amount}",
  intakeSalaryStated: "My figure — {amount}",
  intakeNotSure: "I'm not sure",
  askForm16: "Do you have a document called Form 16?",
  askForm16Hint: "It's the certificate your employer gives you around June — one or two pages showing your salary for the year and the tax already deducted from it. If you have it, upload it here; if not, tell me and we'll work from your salary figure instead.",
  askForm16Why: "It lets me use your employer's own numbers instead of asking you for them.",
  askPf: "Does your employer deduct Provident Fund (PF) from your salary? It shows on your salary slip as 'PF' or 'EPF'.",
  askPfWhy: "Your own PF contribution can reduce tax under the old regime.",
  askPfAmount: "Roughly how much PF was deducted from your salary over the whole year? Add up the monthly 'PF' line on your slips.",
  askProof: "Can you upload something that shows that amount — a salary slip, the PF passbook, or the policy receipt? If you skip, I'll compare the regimes without this deduction.",
  askProofWhy: "A deduction only counts once there is a record behind it.",
  askHealthInsurance: "Do you pay for a health insurance policy — for yourself, your family or your parents?",
  askHealthInsuranceWhy: "The premium can reduce tax under the old regime.",
  askHealthAmount: "How much premium did you pay this year, in total?",
  dontHaveIt: "I don't have it",
  skipForNow: "Skip for now",
  uploadDocument: "Upload the document",
  uploading: "Uploading…",
  uploaded: "Document uploaded",
  uploadFailed: "That upload was refused. Try a PDF or an image under 5 MB.",
  intakeDocumentRecorded: "Stored in your vault and read.",
  intakeClaimSkipped: "No worries — without a record behind it I've left the {section} amount out of the comparison. You can always add it later.",
  askIncomeSource: "First things first — where did your money come from this year?",
  askIncomeSourceWhy: "It decides which return applies and what I need to check.",
  incomeSourceSalary: "A salary from an employer",
  incomeSourceBusiness: "Business or freelance work",
  incomeSourceOther: "Something else — pension, interest, rent, or a mix",
  askSalaryTotal: "Roughly how much salary did you receive this year in total, before any deductions? Your offer letter or Form 16 has the figure.",
  askSalaryTotalWhy: "Nothing has been reported for you yet, so your figure is the starting point — I'll check it against Form 16 if you have one.",
  askResident: "Were you in India for 182 days or more between April 2025 and March 2026?",
  askResidentWhy: "It decides which rebates and exemptions apply to you.",
  intakeOtherIncomeUnsupported: "Thanks for telling me. This release prepares salaried returns only — pension, interest, rent and mixed incomes need checks it does not make yet. I'm happy to answer questions about the rules, but I won't compute a return for that here.",
  noteReviewPending: "This release hasn't been signed off by a tax reviewer yet, so I can gather your facts and explain the rules, but the final recommendation stays locked.",
  askSource: "Where should I take your salary figures from? Form 16 is the quickest.",
  askSourceWhy: "Your employer's own figures beat anything typed by hand.",
  sourceUpload: "Upload my Form 16",
  sourceUploadDetail: "PDF or image. The salary and tax-deducted figures are read from it.",
  sourceDigiLocker: "Fetch from DigiLocker",
  sourceDigiLockerDetail: "Mocked in this prototype. You'll see exactly what would be pulled before it happens.",
  sourceVault: "Use the Form 16 already in my vault",
  sourceManual: "I'll type the figures",
  askDigiLockerConsent: "I'll pull these from your DigiLocker. Go ahead?",
  askDigiLockerConsentWhy: "Nothing is fetched until you say yes.",
  askVaultConsent: "There's a Form 16 in your vault. Shall I read it for this return?",
  askVaultConsentWhy: "Your documents are read only when you say so.",
  askDetails: "A few figures for the year, all in one go. Enter 0 for anything that doesn't apply.",
  askDetailsWhy: "These are the things nobody reports on your behalf.",
  fieldSalary: "Total salary for the year",
  fieldSalaryHint: "Before any deductions. Your offer letter or Form 16 has it.",
  fieldPf: "PF deducted from your salary over the year",
  fieldPfHint: "The 'PF' or 'EPF' line on your salary slips, added up.",
  fieldHealth: "Health insurance premium paid",
  fieldHealthHint: "For yourself, your family or your parents.",
  fieldInterest: "Interest earned on savings or deposits",
  fieldInterestHint: "From your bank statements or AIS. Rent, freelance or business income isn't handled in this release.",
  fieldResident: "In India for 182 days or more between April 2025 and March 2026?",
  detailsEntered: "Figures entered",
  formSubmit: "Save these",
  fetchedFromDigiLocker: "Fetched from DigiLocker:",
  readFromVault: "Read from the Form 16 in your vault:",
  fetchingFromDigiLocker: "Fetching from DigiLocker:",
  openerFallback: "Namaste {name}. This is the AY 2026-27 return. Refunds go to {account} — still right? First, this year's papers.",
  openerFallbackNoAccount: "Namaste {name}. This is the AY 2026-27 return. First, this year's papers.",
  sourceDigiLockerLinked: "Linked at onboarding — one tap for this year's Form 16 and AIS",
  askHousing: "Where did you live this year?",
  housingRent: "Rented",
  housingOwnSelf: "Own it and live in it",
  housingOwnLetOut: "Own it and rent it out",
  housingFamily: "With family",
  askExtras: "Anything else this year? Pick everything that applies.",
  extraBusiness: "Freelance or business income",
  extraSoldAssets: "Sold property or shares",
  extraForeign: "Foreign income or assets",
  extraDirector: "Director, or unlisted shares",
  extraCrypto: "Crypto or lottery",
  extraAgri: "Farm income over ₹5,000",
  extraDisability: "Disability (self or dependant)",
  extraFamilyPension: "Family pension",
  extraNone: "None of these",
  askDeductionsHint: "Money you spent that the papers don't show. Enter 0 for anything that doesn't apply.",
  ded80C: "LIC, PPF, ELSS, tuition (80C)",
  ded80D: "Health insurance (80D)",
  ded80CCD1B: "Extra NPS (80CCD(1B))",
  ded80E: "Education loan interest (80E)",
  ded80G: "Donations (80G)",
  ded24B: "Home loan interest (24(b))",
  ded80GG: "Rent paid, no HRA (80GG)",
  ded80EEB: "Electric vehicle loan interest (80EEB)",
  fieldEmployerCategory: "Who do you work for?",
  employerCentral: "Central government",
  employerState: "State government",
  employerPsu: "Public sector undertaking",
  employerPensioner: "Pension",
  employerOthers: "A company or anyone else",
  verdictItr1: "ITR-1 fits: {heads}. {regime}",
  regimeNewLeads: "The new regime leads by {saving}, and no deduction you could add closes that gap.",
  regimeOldLeads: "The old regime leads by {saving} with what is on record.",
  regimeOpen: "The two regimes are close; what you spent this year will decide it.",
  verdictOtherForm: "This return needs {form}: {reasons}. ITR-1 stops here — a CA review takes everything read so far.",
  carriedFromLastYear: "Same as last year — tap to change",
  inspectorModelNotes: "Standard wording used on {n} turn(s) — why:",
  chatHello: "Hi {name}. What's going on with your taxes this year?",
  chatHelloAnon: "Hi. What's going on with your taxes this year?",
  chatThanks: "Anytime. Anything else to look at?",
  chatWho: "I'm Wapsi. I read what's already on record about you, ask for what's missing, show every figure with its source, and file nothing without your confirmation.",
  chatHelp: "Right now I can prepare a salaried return, compare the old and new regimes, check the figures reported about you, or answer a tax question. Where do you want to start?",
  chatHowAreYou: "All good here. What can I sort out for you?",
  chatBye: "Bye, {name}. Your return stays exactly as it is.",
  chatByeAnon: "Bye. Your return stays exactly as it is.",
  leadFirst: "Quick one to start:",
  leadNext1: "Thanks — that helps. Next:",
  leadNext2: "Got it. One more:",
  leadNext3: "Perfect. Now this:",
  leadDoc: "This one's about a piece of paper —",
  reviewIntro: "The figures are ready below. Nothing is applied until you confirm.",
  leadRecommendation: "Right, the numbers are in.",
  cheerRefund: "Good news: you paid {amount} more than you owed this year, and that comes back to you.",
  cheerDue: "There's {amount} still to pay — no drama, we'll line it up before anything is filed.",
  cheerNil: "You're square: nothing to pay, nothing coming back.",
  recommendRegime: "The {regime} regime works out cheaper for your figures — by {saving}.",
  regimesEqual: "Both regimes land on the same tax for your figures, so there's nothing to lose either way.",
  reviewFilingTitle: "Ready to file — confirm the figures",
  reviewRegimeTitle: "Apply the {regime} regime",
  reviewCorrectionsTitle: "Apply these corrections",
  confirmFiling: "Confirm and file (simulated)",
  confirmRegime: "Apply this regime",
  confirmCorrections: "Apply corrections",
  filedSimulated: "All done! Your simulated filing went through — receipt {id}. Nothing was sent to any real authority, so there's nothing to worry about.",
  regimeApplied: "Done — I've applied the {regime} regime to your return.",
  correctionsApplied: "Done — I've applied the corrections to your return.",
  cancelledAction: "No problem at all — I've left everything exactly as it was.",
  staleReview: "Heads up: your return changed while I was preparing this, so I've redone the review with the latest figures.",
  alreadyFiled: "Good news — this return is already filed! I can walk you through it or compare the regimes, but there's nothing more to file.",
  unsupportedTask: "That one's outside what I can do here — I can prepare a salaried return, compare the two regimes, or check reported figures. For anything else, the manual portal has the tools.",
  budgetExhausted: "We've hit today's limit for this account — nothing was changed. Let's pick this up tomorrow, or the manual portal is always open.",
  injectionNotice: "A document contained text that looked like instructions to me. I ignored it and treated the document as data only.",
  errorGeneric: "Something went wrong on my side. Your return is untouched; try again in a moment.",
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
  manualInspectorNote: "प्रगति, परिणाम और स्रोत एजेंटिक बातचीत के होते हैं। वर्तमान बातचीत के लिए इन्हें देखने हेतु एजेंटिक पर जाएँ।",
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
  welcomeTitle: "अपनी स्थिति बताइए",
  welcomeBody: "बताइए क्या चल रहा है — नई नौकरी, कोई फॉर्म जो समझ न आए, कोई रिफंड जिसका इंतज़ार है। मैं देखूँगा रिकॉर्ड में पहले से क्या है, केवल वही पूछूँगा जो न मिले, हर आंकड़ा उसके स्रोत के साथ दिखाऊँगा, और आपकी सहमति बिना कभी दाखिल या भुगतान नहीं करूँगा।",
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
  noteRegimeNotExecuted: "आपके लिए पुरानी व्यवस्था सस्ती है, पर उसे केवल नियत तारीख तक दाखिल रिटर्न में ही चुना जा सकता है, और यह मैं यहाँ पुष्ट नहीं कर सकता। मैंने तुलना दिखाई है, बदलाव नहीं किया — दाखिल करने की तारीख किसी पेशेवर से पुष्ट करें, या मैनुअल मोड में बदलें।",
  ask: "पूछें",
  noteAdviceUnavailable: "इस रिटर्न के लिए अभी सिफ़ारिश नहीं दे सकता। कारण:",
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
  landingPlaceholder: "मुझे 12 LPA पैकेज की नौकरी मिली है और टैक्स भरना है",
  intakeAckSalaried: "आप वेतनभोगी हैं{amount}। रिकॉर्ड में जो है वह देखूँगा और केवल छूटी हुई बातें पूछूँगा।",
  intakeAckAmount: ", लगभग {amount} सालाना",
  intakeAckGeneric: "देखता हूँ आपके रिकॉर्ड में पहले से क्या है।",
  intakeNoteRentHomeLoan: "आपने किराया या होम लोन बताया। यह रिलीज़ अभी HRA या होम-लोन ब्याज की गणना नहीं करता, इसलिए इन्हें छोड़कर आंकड़ों में स्पष्ट लिखूँगा।",
  intakeNoteCapitalGains: "आपने शेयर, फंड या प्रॉपर्टी बिक्री बताई। पूँजीगत लाभ के लिए जो जाँच चाहिए वह यह रिलीज़ नहीं करता, इसलिए नियम दिखाऊँगा पर उन पर निर्भर सिफ़ारिश नहीं।",
  intakeBusinessUnsupported: "आपने व्यवसाय या फ्रीलांस आय बताई। यह रिलीज़ केवल वेतन रिटर्न तैयार करता है — नियमों पर सवालों के जवाब दे सकता हूँ (अनुमानित कराधान या कौन-सा ITR फॉर्म), पर व्यवसाय रिटर्न की गणना या दाखिला यहाँ नहीं करूँगा।",
  askSalaryFigure: "आपके रिटर्न में नियोक्ता द्वारा रिपोर्ट किया वेतन {reported} पहले से है। आपके संदेश में लगभग {stated} का उल्लेख है। इस साल कौन-सा आंकड़ा लागू है?",
  askSalaryFigureWhy: "नया पैकेज अक्सर साल के बीच से शुरू होता है; रिटर्न में केवल इस साल वास्तव में मिला वेतन गिना जाता है।",
  intakeSalaryReported: "रिपोर्ट किया {amount} लें",
  intakeSalaryStated: "मेरा आंकड़ा — {amount}",
  intakeNotSure: "पक्का नहीं",
  askForm16: "क्या आपके पास फॉर्म 16 नाम का दस्तावेज़ है?",
  askForm16Hint: "यह वह प्रमाणपत्र है जो नियोक्ता जून के आसपास देता है — एक-दो पन्ने, जिनमें साल का वेतन और उससे कटा टैक्स लिखा होता है। हो तो यहाँ अपलोड करें; न हो तो बताइए, हम आपके वेतन आंकड़े से काम करेंगे।",
  askForm16Why: "इससे मैं आपसे पूछने के बजाय नियोक्ता के अपने आंकड़े इस्तेमाल कर सकता हूँ।",
  askPf: "क्या आपका नियोक्ता वेतन से भविष्य निधि (PF) काटता है? सैलरी स्लिप में यह 'PF' या 'EPF' के रूप में दिखता है।",
  askPfWhy: "आपका अपना PF अंशदान पुरानी व्यवस्था में कर घटा सकता है।",
  askPfAmount: "पूरे साल में वेतन से लगभग कितना PF कटा? स्लिप की मासिक 'PF' पंक्ति जोड़ लें।",
  askProof: "क्या आप वह रकम दिखाने वाला कोई दस्तावेज़ अपलोड कर सकते हैं — सैलरी स्लिप, PF पासबुक या पॉलिसी रसीद? छोड़ेंगे तो मैं इस कटौती के बिना तुलना करूँगा।",
  askProofWhy: "कटौती तभी गिनती है जब उसके पीछे कोई रिकॉर्ड हो।",
  askHealthInsurance: "क्या आप स्वास्थ्य बीमा पॉलिसी का प्रीमियम भरते हैं — अपने, परिवार या माता-पिता के लिए?",
  askHealthInsuranceWhy: "प्रीमियम पुरानी व्यवस्था में कर घटा सकता है।",
  askHealthAmount: "इस साल कुल कितना प्रीमियम भरा?",
  dontHaveIt: "मेरे पास नहीं है",
  skipForNow: "अभी छोड़ें",
  uploadDocument: "दस्तावेज़ अपलोड करें",
  uploading: "अपलोड हो रहा है…",
  uploaded: "दस्तावेज़ अपलोड किया",
  uploadFailed: "यह अपलोड अस्वीकार हुआ। 5 MB से छोटी PDF या छवि आज़माएँ।",
  intakeDocumentRecorded: "वॉल्ट में रखा और पढ़ लिया।",
  intakeClaimSkipped: "कोई बात नहीं — बिना रिकॉर्ड के मैंने {section} की रकम तुलना से बाहर रखी है। बाद में कभी भी जोड़ सकते हैं।",
  askIncomeSource: "सबसे पहले — इस साल आपकी कमाई कहाँ से आई?",
  askIncomeSourceWhy: "इससे तय होता है कि कौन-सा रिटर्न लागू है और मुझे क्या जाँचना है।",
  incomeSourceSalary: "किसी नियोक्ता से वेतन",
  incomeSourceBusiness: "व्यवसाय या फ्रीलांस काम",
  incomeSourceOther: "कुछ और — पेंशन, ब्याज, किराया, या मिला-जुला",
  askSalaryTotal: "इस साल कुल मिलाकर, किसी कटौती से पहले, लगभग कितना वेतन मिला? ऑफर लेटर या फॉर्म 16 में यह आंकड़ा होता है।",
  askSalaryTotalWhy: "आपके लिए अभी कुछ रिपोर्ट नहीं हुआ है, इसलिए आपका आंकड़ा शुरुआत है — फॉर्म 16 हो तो उससे मिला लूँगा।",
  askResident: "अप्रैल 2025 से मार्च 2026 के बीच क्या आप 182 दिन या उससे ज़्यादा भारत में थे?",
  askResidentWhy: "इससे तय होता है कि कौन-सी छूट और रियायतें आप पर लागू हैं।",
  intakeOtherIncomeUnsupported: "बताने के लिए धन्यवाद। यह रिलीज़ केवल वेतन वाले रिटर्न तैयार करता है — पेंशन, ब्याज, किराया और मिली-जुली आय के लिए ऐसी जाँचें चाहिए जो अभी नहीं होतीं। नियमों के सवालों का जवाब ख़ुशी से दूँगा, पर यहाँ उसका रिटर्न नहीं बनाऊँगा।",
  noteReviewPending: "इस रिलीज़ पर अभी कर समीक्षक की मुहर नहीं है, इसलिए तथ्य जुटा सकता हूँ और नियम बता सकता हूँ, पर अंतिम सिफ़ारिश बंद रहेगी।",
  askSource: "आपके वेतन के आंकड़े कहाँ से लूँ? फॉर्म 16 सबसे तेज़ है।",
  askSourceWhy: "नियोक्ता के अपने आंकड़े हाथ से लिखे आंकड़ों से बेहतर होते हैं।",
  sourceUpload: "मेरा फॉर्म 16 अपलोड करें",
  sourceUploadDetail: "PDF या फ़ोटो। वेतन और काटे गए कर के आंकड़े इससे पढ़े जाते हैं।",
  sourceDigiLocker: "DigiLocker से लें",
  sourceDigiLockerDetail: "इस प्रोटोटाइप में मॉक है। क्या लिया जाएगा, पहले दिखेगा।",
  sourceVault: "वॉल्ट में मौजूद फॉर्म 16 इस्तेमाल करें",
  sourceManual: "मैं आंकड़े लिख दूँगा",
  askDigiLockerConsent: "ये आपके DigiLocker से लूँगा। आगे बढ़ूँ?",
  askDigiLockerConsentWhy: "आपकी हाँ के बिना कुछ नहीं लिया जाता।",
  askVaultConsent: "आपके वॉल्ट में एक फॉर्म 16 है। इस रिटर्न के लिए पढ़ लूँ?",
  askVaultConsentWhy: "आपके दस्तावेज़ तभी पढ़े जाते हैं जब आप कहें।",
  askDetails: "साल के कुछ आंकड़े, एक साथ। जो लागू न हो उसमें 0 लिखें।",
  askDetailsWhy: "ये वे बातें हैं जो कोई आपकी तरफ़ से रिपोर्ट नहीं करता।",
  fieldSalary: "साल का कुल वेतन",
  fieldSalaryHint: "किसी कटौती से पहले। ऑफर लेटर या फॉर्म 16 में है।",
  fieldPf: "साल भर में वेतन से कटा PF",
  fieldPfHint: "सैलरी स्लिप की 'PF' या 'EPF' लाइन, जोड़कर।",
  fieldHealth: "स्वास्थ्य बीमा प्रीमियम",
  fieldHealthHint: "अपने, परिवार या माता-पिता के लिए।",
  fieldInterest: "बचत या जमा पर मिला ब्याज",
  fieldInterestHint: "बैंक स्टेटमेंट या AIS से। किराया, फ्रीलांस या व्यवसाय की आय इस रिलीज़ में नहीं है।",
  fieldResident: "अप्रैल 2025 से मार्च 2026 के बीच 182 दिन या ज़्यादा भारत में थे?",
  detailsEntered: "आंकड़े दर्ज",
  formSubmit: "सहेजें",
  fetchedFromDigiLocker: "DigiLocker से लिया:",
  readFromVault: "वॉल्ट के फॉर्म 16 से पढ़ा:",
  fetchingFromDigiLocker: "DigiLocker से ला रहा हूँ:",
  openerFallback: "नमस्ते {name}। यह AY 2026-27 का रिटर्न है। रिफंड {account} में जाएगा — सही है? पहले इस साल के कागज़।",
  openerFallbackNoAccount: "नमस्ते {name}। यह AY 2026-27 का रिटर्न है। पहले इस साल के कागज़।",
  sourceDigiLockerLinked: "ऑनबोर्डिंग में जोड़ा गया — इस साल का फॉर्म 16 और AIS एक टैप में",
  askHousing: "इस साल आप कहाँ रहे?",
  housingRent: "किराए पर",
  housingOwnSelf: "अपना घर, उसी में रहते हैं",
  housingOwnLetOut: "अपना घर, किराए पर दिया है",
  housingFamily: "परिवार के साथ",
  askExtras: "इस साल और कुछ? जो-जो लागू हो, सब चुनें।",
  extraBusiness: "फ्रीलांस या व्यवसाय की आय",
  extraSoldAssets: "प्रॉपर्टी या शेयर बेचे",
  extraForeign: "विदेशी आय या संपत्ति",
  extraDirector: "डायरेक्टर, या अनलिस्टेड शेयर",
  extraCrypto: "क्रिप्टो या लॉटरी",
  extraAgri: "₹5,000 से ज़्यादा खेती की आय",
  extraDisability: "दिव्यांगता (स्वयं या आश्रित)",
  extraFamilyPension: "फ़ैमिली पेंशन",
  extraNone: "इनमें से कुछ नहीं",
  askDeductionsHint: "जो खर्च कागज़ नहीं दिखाते। जो लागू न हो उसमें 0 लिखें।",
  ded80C: "LIC, PPF, ELSS, ट्यूशन (80C)",
  ded80D: "स्वास्थ्य बीमा (80D)",
  ded80CCD1B: "अतिरिक्त NPS (80CCD(1B))",
  ded80E: "एजुकेशन लोन का ब्याज (80E)",
  ded80G: "दान (80G)",
  ded24B: "होम लोन का ब्याज (24(b))",
  ded80GG: "किराया, बिना HRA (80GG)",
  ded80EEB: "इलेक्ट्रिक वाहन लोन का ब्याज (80EEB)",
  fieldEmployerCategory: "आप किसके लिए काम करते हैं?",
  employerCentral: "केंद्र सरकार",
  employerState: "राज्य सरकार",
  employerPsu: "सार्वजनिक उपक्रम",
  employerPensioner: "पेंशन",
  employerOthers: "कंपनी या कोई और",
  verdictItr1: "ITR-1 सही है: {heads}। {regime}",
  regimeNewLeads: "नई व्यवस्था {saving} से आगे है, और कोई भी कटौती यह अंतर नहीं भरती।",
  regimeOldLeads: "रिकॉर्ड के हिसाब से पुरानी व्यवस्था {saving} से आगे है।",
  regimeOpen: "दोनों व्यवस्थाएँ करीब हैं; इस साल के खर्च तय करेंगे।",
  verdictOtherForm: "इस रिटर्न के लिए {form} चाहिए: {reasons}। ITR-1 यहाँ रुकता है — CA समीक्षा में अब तक पढ़ा सब जाएगा।",
  carriedFromLastYear: "पिछले साल जैसा — बदलने के लिए टैप करें",
  inspectorModelNotes: "{n} बार मानक शब्द इस्तेमाल हुए — कारण:",
  chatHello: "नमस्ते {name}। इस साल टैक्स में क्या चल रहा है?",
  chatHelloAnon: "नमस्ते। इस साल टैक्स में क्या चल रहा है?",
  chatThanks: "कभी भी। और कुछ देखना है?",
  chatWho: "मैं वापसी हूँ। आपके रिकॉर्ड में जो है वह पढ़ता हूँ, जो छूटा है वह पूछता हूँ, हर आंकड़ा स्रोत के साथ दिखाता हूँ, और आपकी पुष्टि बिना कुछ दाखिल नहीं करता।",
  chatHelp: "अभी मैं वेतन का रिटर्न तैयार कर सकता हूँ, पुरानी-नई व्यवस्था की तुलना कर सकता हूँ, रिपोर्ट किए आंकड़े जाँच सकता हूँ, या टैक्स का सवाल बता सकता हूँ। कहाँ से शुरू करें?",
  chatHowAreYou: "सब ठीक। आपके लिए क्या करूँ?",
  chatBye: "फिर मिलते हैं, {name}। आपका रिटर्न जैसा है वैसा ही रहेगा।",
  chatByeAnon: "फिर मिलते हैं। आपका रिटर्न जैसा है वैसा ही रहेगा।",
  leadFirst: "शुरुआत एक छोटे सवाल से:",
  leadNext1: "शुक्रिया — इससे मदद मिली। अगला:",
  leadNext2: "समझ गया। एक और:",
  leadNext3: "बिल्कुल। अब यह:",
  leadDoc: "यह एक कागज़ के बारे में है —",
  reviewIntro: "आंकड़े नीचे तैयार हैं। आपकी पुष्टि तक कुछ लागू नहीं होता।",
  leadRecommendation: "ठीक है, आंकड़े आ गए।",
  cheerRefund: "अच्छी खबर: इस साल आपने {amount} ज़्यादा भरा, और वह आपको वापस मिलेगा।",
  cheerDue: "अभी {amount} और भरना बाकी है — कोई हड़बड़ी नहीं, दाखिल करने से पहले इसे ठीक से लगा लेंगे।",
  cheerNil: "आपका हिसाब बराबर है: न कुछ भरना, न कुछ वापस।",
  recommendRegime: "आपके आंकड़ों के लिए {regime} व्यवस्था सस्ती पड़ती है — {saving} से।",
  regimesEqual: "आपके आंकड़ों के लिए दोनों व्यवस्थाओं में एक ही कर बनता है, इसलिए किसी भी तरफ कोई नुकसान नहीं।",
  reviewFilingTitle: "दाखिल करने को तैयार — आंकड़े पुष्ट करें",
  reviewRegimeTitle: "{regime} व्यवस्था लागू करें",
  reviewCorrectionsTitle: "ये सुधार लागू करें",
  confirmFiling: "पुष्टि कर दाखिल करें (अनुकरण)",
  confirmRegime: "यह व्यवस्था लागू करें",
  confirmCorrections: "सुधार लागू करें",
  filedSimulated: "हो गया! आपका सिम्युलेटेड दाखिला पूरा — रसीद {id}। किसी असली प्राधिकरण को कुछ नहीं भेजा गया, इसलिए चिंता की कोई बात नहीं।",
  regimeApplied: "आपके रिटर्न पर {regime} व्यवस्था लागू कर दी।",
  correctionsApplied: "आपके रिटर्न पर सुधार लागू कर दिए।",
  cancelledAction: "बिल्कुल ठीक — सब कुछ वैसा ही छोड़ दिया जैसा था।",
  staleReview: "एक बात: यह तैयार करते-करते आपका रिटर्न बदल गया, इसलिए नए आंकड़ों के साथ समीक्षा दोबारा बनाई है।",
  alreadyFiled: "अच्छी खबर — यह रिटर्न पहले ही दाखिल है! मैं इसे समझा सकता हूँ या व्यवस्थाओं की तुलना कर सकता हूँ, पर दाखिल करने को अब कुछ नहीं बचा।",
  unsupportedTask: "मैं वेतन रिटर्न तैयार कर सकता हूँ, दोनों व्यवस्थाओं की तुलना कर सकता हूँ, या रिपोर्ट किए आंकड़े जाँच सकता हूँ। बाकी के लिए मैनुअल पोर्टल में उपकरण हैं।",
  budgetExhausted: "इस खाते की आज की सीमा पूरी हो गई। कुछ नहीं बदला। कृपया कल जारी रखें, या मैनुअल पोर्टल उपयोग करें।",
  injectionNotice: "एक दस्तावेज़ में ऐसा पाठ था जो मुझे निर्देश जैसा लगा। मैंने उसे अनदेखा किया और दस्तावेज़ को केवल डेटा माना।",
  errorGeneric: "मेरी तरफ़ कुछ गड़बड़ हुई। आपका रिटर्न अछूता है; थोड़ी देर में फिर कोशिश करें।",
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
  manualInspectorNote: "முன்னேற்றம், வெளியீடுகள், ஆதாரங்கள் ஏஜென்டிக் உரையாடலுக்கு உரியவை. தற்போதைய உரையாடலுக்கு அவற்றைக் காண ஏஜென்டிக்கிற்கு மாறுங்கள்.",
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
  welcomeTitle: "உங்கள் நிலையைச் சொல்லுங்கள்",
  welcomeBody: "என்ன நடக்கிறது என்று சொல்லுங்கள் — புதிய வேலை, புரியாத ஒரு படிவம், காத்திருக்கும் ரீஃபண்ட். பதிவில் இருப்பதைப் பார்த்து, கிடைக்காததை மட்டும் கேட்டு, ஒவ்வொரு எண்ணையும் மூலத்துடன் காட்டி, உங்கள் ஒப்புதல் இல்லாமல் ஒருபோதும் தாக்கல் செய்யவோ செலுத்தவோ மாட்டேன்.",
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
  noteRegimeNotExecuted: "உங்களுக்கு பழைய முறை குறைவான வரி, ஆனால் அதை உரிய தேதிக்குள் தாக்கல் செய்யும் ரிட்டர்னில் மட்டுமே தேர்வு செய்யலாம்; அதை நான் இங்கு உறுதிப்படுத்த முடியாது. ஒப்பீட்டைக் காட்டியுள்ளேன், மாற்றவில்லை — தாக்கல் தேதியை ஒரு நிபுணரிடம் உறுதிப்படுத்தவும், அல்லது கைமுறை பயன்முறையில் மாற்றவும்.",
  ask: "கேளுங்கள்",
  noteAdviceUnavailable: "இந்த ரிட்டர்னுக்கு இன்னும் பரிந்துரை தர முடியாது. காரணம்:",
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
  landingPlaceholder: "12 LPA பேக்கேஜில் வேலை கிடைத்தது, வரி தாக்கல் செய்ய வேண்டும்",
  intakeAckSalaried: "நீங்கள் சம்பளதாரர்{amount}. பதிவில் இருப்பதைப் பார்த்து, விடுபட்டதை மட்டும் கேட்பேன்.",
  intakeAckAmount: ", ஆண்டுக்கு சுமார் {amount}",
  intakeAckGeneric: "உங்கள் பதிவில் ஏற்கனவே என்ன இருக்கிறது என்று பார்க்கிறேன்.",
  intakeNoteRentHomeLoan: "வாடகை அல்லது வீட்டுக் கடனைக் குறிப்பிட்டீர்கள். இந்த வெளியீடு HRA அல்லது வீட்டுக் கடன் வட்டியைக் கணிக்காது; அவற்றை விட்டு, எண்களில் அதைத் தெளிவாகச் சொல்வேன்.",
  intakeNoteCapitalGains: "பங்குகள், நிதிகள் அல்லது சொத்து விற்பனையைக் குறிப்பிட்டீர்கள். மூலதன ஆதாயத்திற்குத் தேவையான சரிபார்ப்புகளை இந்த வெளியீடு செய்யாது; விதிகளைக் காட்டுவேன், ஆனால் அவற்றைச் சார்ந்த பரிந்துரை இல்லை.",
  intakeBusinessUnsupported: "வணிகம் அல்லது ஃப்ரீலான்ஸ் வருமானத்தைக் குறிப்பிட்டீர்கள். இந்த வெளியீடு சம்பள ரிட்டர்ன்களை மட்டுமே தயாரிக்கிறது — விதிகள் பற்றிய கேள்விகளுக்கு (ஊக வரிவிதிப்பு, எந்த ITR படிவம்) பதிலளிக்கலாம், ஆனால் வணிக ரிட்டர்னைக் கணிக்கவோ தாக்கல் செய்யவோ இங்கு மாட்டேன்.",
  askSalaryFigure: "உங்கள் ரிட்டர்னில் முதலாளி அறிவித்த சம்பளம் {reported} ஏற்கனவே உள்ளது. உங்கள் செய்தியில் சுமார் {stated} குறிப்பிடப்பட்டுள்ளது. இந்த ஆண்டிற்கு எந்த எண் பொருந்தும்?",
  askSalaryFigureWhy: "புதிய பேக்கேஜ் பெரும்பாலும் ஆண்டின் நடுவில் தொடங்கும்; ரிட்டர்னில் இந்த ஆண்டு உண்மையில் பெற்றது மட்டுமே கணக்கிடப்படும்.",
  intakeSalaryReported: "அறிவிக்கப்பட்ட {amount} பயன்படுத்து",
  intakeSalaryStated: "என் எண் — {amount}",
  intakeNotSure: "உறுதியாகத் தெரியவில்லை",
  askForm16: "படிவம் 16 என்ற ஆவணம் உங்களிடம் உள்ளதா?",
  askForm16Hint: "இது ஜூன் மாதத்தில் முதலாளி தரும் சான்றிதழ் — ஆண்டின் சம்பளமும் அதிலிருந்து பிடித்த வரியும் உள்ள ஒன்று அல்லது இரண்டு பக்கங்கள். இருந்தால் இங்கே பதிவேற்றுங்கள்; இல்லையென்றால் சொல்லுங்கள், உங்கள் சம்பள எண்ணிலிருந்து தொடர்வோம்.",
  askForm16Why: "உங்களைக் கேட்பதற்குப் பதிலாக முதலாளியின் எண்களையே பயன்படுத்த இது உதவும்.",
  askPf: "உங்கள் முதலாளி சம்பளத்திலிருந்து வருங்கால வைப்பு நிதி (PF) பிடிக்கிறாரா? சம்பளச் சீட்டில் இது 'PF' அல்லது 'EPF' என்று காட்டும்.",
  askPfWhy: "உங்கள் சொந்த PF பங்களிப்பு பழைய முறையில் வரியைக் குறைக்கலாம்.",
  askPfAmount: "இந்த முழு ஆண்டில் சம்பளத்திலிருந்து சுமார் எவ்வளவு PF பிடிக்கப்பட்டது? சீட்டுகளின் மாதாந்திர 'PF' வரியைக் கூட்டுங்கள்.",
  askProof: "அந்தத் தொகையைக் காட்டும் ஒன்றைப் பதிவேற்ற முடியுமா — சம்பளச் சீட்டு, PF பாஸ்புக் அல்லது பாலிசி ரசீது? தவிர்த்தால், இந்தக் கழிவு இல்லாமல் முறைகளை ஒப்பிடுவேன்.",
  askProofWhy: "பின்னால் பதிவு இருந்தால் மட்டுமே கழிவு கணக்கில் வரும்.",
  askHealthInsurance: "உங்களுக்கோ, குடும்பத்திற்கோ, பெற்றோருக்கோ சுகாதாரக் காப்பீட்டுப் பிரீமியம் செலுத்துகிறீர்களா?",
  askHealthInsuranceWhy: "பிரீமியம் பழைய முறையில் வரியைக் குறைக்கலாம்.",
  askHealthAmount: "இந்த ஆண்டு மொத்தம் எவ்வளவு பிரீமியம் செலுத்தினீர்கள்?",
  dontHaveIt: "என்னிடம் இல்லை",
  skipForNow: "இப்போது தவிர்",
  uploadDocument: "ஆவணத்தைப் பதிவேற்று",
  uploading: "பதிவேற்றுகிறது…",
  uploaded: "ஆவணம் பதிவேற்றப்பட்டது",
  uploadFailed: "அந்தப் பதிவேற்றம் நிராகரிக்கப்பட்டது. 5 MB-க்குக் குறைவான PDF அல்லது படத்தை முயற்சிக்கவும்.",
  intakeDocumentRecorded: "வால்ட்டில் சேமித்துப் படித்தேன்.",
  intakeClaimSkipped: "கவலை வேண்டாம் — பின்னால் பதிவு இல்லாததால் {section} தொகையை ஒப்பீட்டிலிருந்து விட்டுவிட்டேன். பின்னர் எப்போதும் சேர்க்கலாம்.",
  askIncomeSource: "முதலில் — இந்த ஆண்டு உங்கள் பணம் எங்கிருந்து வந்தது?",
  askIncomeSourceWhy: "எந்த ரிட்டர்ன் பொருந்தும், நான் எதைச் சரிபார்க்க வேண்டும் என்பதை இது தீர்மானிக்கிறது.",
  incomeSourceSalary: "ஒரு முதலாளியிடமிருந்து சம்பளம்",
  incomeSourceBusiness: "வணிகம் அல்லது ஃப்ரீலான்ஸ் வேலை",
  incomeSourceOther: "வேறு ஏதோ — ஓய்வூதியம், வட்டி, வாடகை, அல்லது கலவை",
  askSalaryTotal: "இந்த ஆண்டு மொத்தமாக, எந்தக் கழிவும் இல்லாமல், சுமார் எவ்வளவு சம்பளம் பெற்றீர்கள்? ஆஃபர் லெட்டர் அல்லது படிவம் 16-இல் அந்த எண் இருக்கும்.",
  askSalaryTotalWhy: "உங்களுக்காக இன்னும் எதுவும் அறிவிக்கப்படவில்லை, அதனால் உங்கள் எண்ணே தொடக்கம் — படிவம் 16 இருந்தால் அதனுடன் ஒப்பிடுவேன்.",
  askResident: "ஏப்ரல் 2025 முதல் மார்ச் 2026 வரை 182 நாட்கள் அல்லது அதற்கு மேல் இந்தியாவில் இருந்தீர்களா?",
  askResidentWhy: "எந்தத் தள்ளுபடிகளும் விலக்குகளும் உங்களுக்குப் பொருந்தும் என்பதை இது தீர்மானிக்கிறது.",
  intakeOtherIncomeUnsupported: "சொன்னதற்கு நன்றி. இந்த வெளியீடு சம்பள ரிட்டர்ன்களை மட்டுமே தயாரிக்கிறது — ஓய்வூதியம், வட்டி, வாடகை மற்றும் கலப்பு வருமானங்களுக்கு இன்னும் செய்யப்படாத சரிபார்ப்புகள் தேவை. விதிகள் பற்றிய கேள்விகளுக்கு மகிழ்ச்சியாகப் பதிலளிப்பேன், ஆனால் இங்கே அதற்கான ரிட்டர்னைக் கணக்கிட மாட்டேன்.",
  noteReviewPending: "இந்த வெளியீட்டுக்கு இன்னும் வரி மதிப்பாய்வாளர் ஒப்புதல் இல்லை; உண்மைகளைச் சேகரித்து விதிகளை விளக்க முடியும், ஆனால் இறுதிப் பரிந்துரை பூட்டியிருக்கும்.",
  askSource: "உங்கள் சம்பள எண்களை எங்கிருந்து எடுக்க? படிவம் 16 வேகமானது.",
  askSourceWhy: "முதலாளியின் எண்கள் கையால் எழுதியதை விடச் சிறந்தவை.",
  sourceUpload: "என் படிவம் 16-ஐ பதிவேற்று",
  sourceUploadDetail: "PDF அல்லது படம். சம்பளம் மற்றும் பிடித்த வரி எண்கள் அதிலிருந்து படிக்கப்படும்.",
  sourceDigiLocker: "DigiLocker-இலிருந்து எடு",
  sourceDigiLockerDetail: "இந்த முன்மாதிரியில் போலி. எது எடுக்கப்படும் என்பதை முன்பே பார்ப்பீர்கள்.",
  sourceVault: "வால்ட்டில் உள்ள படிவம் 16-ஐப் பயன்படுத்து",
  sourceManual: "நானே எண்களை எழுதுகிறேன்",
  askDigiLockerConsent: "இவற்றை உங்கள் DigiLocker-இலிருந்து எடுக்கிறேன். தொடரவா?",
  askDigiLockerConsentWhy: "நீங்கள் ஆம் என்று சொல்லும் வரை எதுவும் எடுக்கப்படாது.",
  askVaultConsent: "உங்கள் வால்ட்டில் ஒரு படிவம் 16 உள்ளது. இந்த ரிட்டர்னுக்காக அதைப் படிக்கவா?",
  askVaultConsentWhy: "நீங்கள் சொன்னால் மட்டுமே உங்கள் ஆவணங்கள் படிக்கப்படும்.",
  askDetails: "ஆண்டின் சில எண்கள், ஒரே முறையில். பொருந்தாதவற்றுக்கு 0 என்று எழுதுங்கள்.",
  askDetailsWhy: "இவற்றை உங்கள் சார்பாக யாரும் அறிவிப்பதில்லை.",
  fieldSalary: "ஆண்டின் மொத்த சம்பளம்",
  fieldSalaryHint: "எந்தக் கழிவும் இல்லாமல். ஆஃபர் லெட்டர் அல்லது படிவம் 16-இல் உள்ளது.",
  fieldPf: "ஆண்டில் சம்பளத்திலிருந்து பிடித்த PF",
  fieldPfHint: "சம்பளச் சீட்டுகளின் 'PF' அல்லது 'EPF' வரி, கூட்டி.",
  fieldHealth: "செலுத்திய மருத்துவக் காப்பீட்டுப் பிரீமியம்",
  fieldHealthHint: "உங்களுக்கு, குடும்பத்திற்கு அல்லது பெற்றோருக்கு.",
  fieldInterest: "சேமிப்பு அல்லது வைப்பில் கிடைத்த வட்டி",
  fieldInterestHint: "வங்கி அறிக்கை அல்லது AIS-இலிருந்து. வாடகை, ஃப்ரீலான்ஸ் அல்லது வணிக வருமானம் இந்த வெளியீட்டில் இல்லை.",
  fieldResident: "ஏப்ரல் 2025 – மார்ச் 2026-க்குள் 182 நாட்கள் அல்லது மேல் இந்தியாவில் இருந்தீர்களா?",
  detailsEntered: "எண்கள் பதிவானது",
  formSubmit: "சேமி",
  fetchedFromDigiLocker: "DigiLocker-இலிருந்து எடுத்தது:",
  readFromVault: "வால்ட்டின் படிவம் 16-இலிருந்து படித்தது:",
  fetchingFromDigiLocker: "DigiLocker-இலிருந்து எடுக்கிறேன்:",
  openerFallback: "வணக்கம் {name}. இது AY 2026-27 ரிட்டர்ன். ரீஃபண்ட் {account}-க்கு செல்லும் — சரியா? முதலில், இந்த ஆண்டின் ஆவணங்கள்.",
  openerFallbackNoAccount: "வணக்கம் {name}. இது AY 2026-27 ரிட்டர்ன். முதலில், இந்த ஆண்டின் ஆவணங்கள்.",
  sourceDigiLockerLinked: "ஆன்போர்டிங்கில் இணைக்கப்பட்டது — இந்த ஆண்டின் படிவம் 16 மற்றும் AIS ஒரே தட்டலில்",
  askHousing: "இந்த ஆண்டு நீங்கள் எங்கே வசித்தீர்கள்?",
  housingRent: "வாடகை வீடு",
  housingOwnSelf: "சொந்த வீடு, அதிலே வசிக்கிறேன்",
  housingOwnLetOut: "சொந்த வீடு, வாடகைக்கு விட்டுள்ளேன்",
  housingFamily: "குடும்பத்துடன்",
  askExtras: "இந்த ஆண்டு வேறு ஏதும்? பொருந்துவதை எல்லாம் தேர்வு செய்யுங்கள்.",
  extraBusiness: "ஃப்ரீலான்ஸ் அல்லது வணிக வருமானம்",
  extraSoldAssets: "சொத்து அல்லது பங்குகள் விற்றேன்",
  extraForeign: "வெளிநாட்டு வருமானம் அல்லது சொத்து",
  extraDirector: "இயக்குநர், அல்லது பட்டியலிடப்படாத பங்குகள்",
  extraCrypto: "கிரிப்டோ அல்லது லாட்டரி",
  extraAgri: "₹5,000-க்கு மேல் விவசாய வருமானம்",
  extraDisability: "மாற்றுத்திறன் (தான் அல்லது சார்ந்தவர்)",
  extraFamilyPension: "குடும்ப ஓய்வூதியம்",
  extraNone: "இவற்றில் எதுவும் இல்லை",
  askDeductionsHint: "ஆவணங்கள் காட்டாத செலவுகள். பொருந்தாதவற்றுக்கு 0 என்று எழுதுங்கள்.",
  ded80C: "LIC, PPF, ELSS, கல்விக் கட்டணம் (80C)",
  ded80D: "மருத்துவக் காப்பீடு (80D)",
  ded80CCD1B: "கூடுதல் NPS (80CCD(1B))",
  ded80E: "கல்விக் கடன் வட்டி (80E)",
  ded80G: "நன்கொடை (80G)",
  ded24B: "வீட்டுக் கடன் வட்டி (24(b))",
  ded80GG: "வாடகை, HRA இல்லாமல் (80GG)",
  ded80EEB: "மின்சார வாகனக் கடன் வட்டி (80EEB)",
  fieldEmployerCategory: "நீங்கள் யாரிடம் பணிபுரிகிறீர்கள்?",
  employerCentral: "மத்திய அரசு",
  employerState: "மாநில அரசு",
  employerPsu: "பொதுத்துறை நிறுவனம்",
  employerPensioner: "ஓய்வூதியம்",
  employerOthers: "நிறுவனம் அல்லது வேறு யாரும்",
  verdictItr1: "ITR-1 பொருந்துகிறது: {heads}. {regime}",
  regimeNewLeads: "புதிய முறை {saving} முன்னிலையில்; எந்தக் கழிவும் அந்த இடைவெளியை மூடாது.",
  regimeOldLeads: "பதிவின்படி பழைய முறை {saving} முன்னிலையில்.",
  regimeOpen: "இரு முறைகளும் நெருக்கமாக உள்ளன; இந்த ஆண்டின் செலவுகள் முடிவு செய்யும்.",
  verdictOtherForm: "இந்த ரிட்டர்னுக்கு {form} தேவை: {reasons}. ITR-1 இங்கே நிற்கிறது — CA மதிப்பாய்வு இதுவரை படித்த எல்லாவற்றையும் எடுத்துச் செல்லும்.",
  carriedFromLastYear: "கடந்த ஆண்டு போலவே — மாற்ற தட்டுங்கள்",
  inspectorModelNotes: "{n} முறை நிலையான வார்த்தைகள் — காரணம்:",
  chatHello: "வணக்கம் {name}. இந்த ஆண்டு வரியில் என்ன நடக்கிறது?",
  chatHelloAnon: "வணக்கம். இந்த ஆண்டு வரியில் என்ன நடக்கிறது?",
  chatThanks: "எப்போதும். வேறு ஏதும் பார்க்க வேண்டுமா?",
  chatWho: "நான் வாப்சி. உங்கள் பதிவில் இருப்பதைப் படிக்கிறேன், விடுபட்டதைக் கேட்கிறேன், ஒவ்வொரு எண்ணையும் மூலத்துடன் காட்டுகிறேன், உங்கள் உறுதிப்படுத்தல் இல்லாமல் எதையும் தாக்கல் செய்வதில்லை.",
  chatHelp: "இப்போது சம்பள ரிட்டர்ன் தயாரிக்கலாம், பழைய-புதிய முறைகளை ஒப்பிடலாம், உங்களைப் பற்றி அறிவிக்கப்பட்ட எண்களைச் சரிபார்க்கலாம், அல்லது வரிக் கேள்விக்குப் பதில் சொல்லலாம். எங்கே தொடங்க?",
  chatHowAreYou: "இங்கே எல்லாம் நலம். உங்களுக்கு என்ன செய்ய?",
  chatBye: "பிறகு பார்க்கலாம், {name}. உங்கள் ரிட்டர்ன் அப்படியே இருக்கும்.",
  chatByeAnon: "பிறகு பார்க்கலாம். உங்கள் ரிட்டர்ன் அப்படியே இருக்கும்.",
  leadFirst: "தொடங்க ஒரு சிறிய கேள்வி:",
  leadNext1: "நன்றி — அது உதவியது. அடுத்தது:",
  leadNext2: "புரிந்தது. இன்னொன்று:",
  leadNext3: "சரி. இப்போது இது:",
  leadDoc: "இது ஒரு ஆவணம் பற்றியது —",
  reviewIntro: "எண்கள் கீழே தயார். நீங்கள் உறுதிப்படுத்தும் வரை எதுவும் பொருந்தாது.",
  leadRecommendation: "சரி, எண்கள் வந்துவிட்டன.",
  cheerRefund: "நல்ல செய்தி: இந்த ஆண்டு நீங்கள் {amount} அதிகமாகச் செலுத்தினீர்கள், அது உங்களுக்குத் திரும்ப வரும்.",
  cheerDue: "இன்னும் {amount} செலுத்த வேண்டும் — பதற்றம் வேண்டாம், தாக்கல் செய்யும் முன் அதைச் சரியாக அமைப்போம்.",
  cheerNil: "உங்கள் கணக்கு சமம்: செலுத்த எதுவும் இல்லை, திரும்ப வரவும் எதுவும் இல்லை.",
  recommendRegime: "உங்கள் எண்களுக்கு {regime} முறை குறைவாகிறது — {saving} அளவுக்கு.",
  regimesEqual: "உங்கள் எண்களுக்கு இரு முறைகளிலும் ஒரே வரி, எனவே எந்தப் பக்கமும் இழப்பு இல்லை.",
  reviewFilingTitle: "தாக்கல் செய்யத் தயார் — எண்களை உறுதிப்படுத்துங்கள்",
  reviewRegimeTitle: "{regime} முறையைப் பயன்படுத்து",
  reviewCorrectionsTitle: "இந்தத் திருத்தங்களைப் பயன்படுத்து",
  confirmFiling: "உறுதிப்படுத்தி தாக்கல் செய் (உருவகப்படுத்தல்)",
  confirmRegime: "இந்த முறையைப் பயன்படுத்து",
  confirmCorrections: "திருத்தங்களைப் பயன்படுத்து",
  filedSimulated: "முடிந்தது! உங்கள் உருவகத் தாக்கல் நிறைவேறியது — ரசீது {id}. எந்த உண்மையான அதிகாரிக்கும் எதுவும் அனுப்பப்படவில்லை, கவலைப்பட ஒன்றுமில்லை.",
  regimeApplied: "உங்கள் ரிட்டர்னில் {regime} முறையைப் பயன்படுத்தினேன்.",
  correctionsApplied: "உங்கள் ரிட்டர்னில் திருத்தங்களைப் பயன்படுத்தினேன்.",
  cancelledAction: "பரவாயில்லை — எல்லாவற்றையும் இருந்தபடியே விட்டுவிட்டேன்.",
  staleReview: "ஒரு விஷயம்: இதைத் தயாரிக்கும்போது உங்கள் ரிட்டர்ன் மாறியது, எனவே புதிய எண்களுடன் மறுஆய்வை மீண்டும் செய்தேன்.",
  alreadyFiled: "நல்ல செய்தி — இந்த ரிட்டர்ன் ஏற்கனவே தாக்கல் ஆகிவிட்டது! விளக்கலாம் அல்லது முறைகளை ஒப்பிடலாம், ஆனால் தாக்கல் செய்ய இன்னும் எதுவும் இல்லை.",
  unsupportedTask: "சம்பள ரிட்டர்னைத் தயாரிக்கலாம், இரு முறைகளையும் ஒப்பிடலாம், அல்லது அறிவிக்கப்பட்ட எண்களைச் சரிபார்க்கலாம். மற்றவற்றுக்கு கைமுறைப் போர்ட்டலில் கருவிகள் உள்ளன.",
  budgetExhausted: "இந்தக் கணக்கின் இன்றைய வரம்பு எட்டப்பட்டது. எதுவும் மாறவில்லை. நாளை தொடரவும், அல்லது கைமுறைப் போர்ட்டலைப் பயன்படுத்தவும்.",
  injectionNotice: "ஒரு ஆவணத்தில் எனக்கு அறிவுறுத்தல் போலத் தோன்றிய உரை இருந்தது. அதைப் புறக்கணித்து ஆவணத்தைத் தரவாக மட்டுமே கருதினேன்.",
  errorGeneric: "என் பக்கம் ஏதோ தவறு. உங்கள் ரிட்டர்ன் தொடப்படவில்லை; சிறிது நேரத்தில் மீண்டும் முயலுங்கள்.",
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

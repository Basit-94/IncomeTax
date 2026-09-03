"use client";

import { useState } from "react";
import {
  X,
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calculator,
  ShieldAlert,
  Zap,
  Globe,
  CornerDownRight,
  Lock,
} from "lucide-react";
import type { Lang } from "@/lib/types";

interface AgenticModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  onOpenStandardFiling?: () => void;
}

interface Scenario {
  id: string;
  title: string;
  tag: string;
  userPrompt: string;
  agentResponse: string;
  actionTaken: string;
  taxImpact: string;
}

export default function AgenticModeModal({
  isOpen,
  onClose,
  lang,
  onOpenStandardFiling,
}: AgenticModeModalProps) {
  const isHindi = lang === "hi";

  const SCENARIOS: Scenario[] = [
    {
      id: "salary_switch",
      title: isHindi ? "नौकरी परिवर्तन व 2 फॉर्म 16" : "Job Switch & 2 Form 16s",
      tag: "ITR-1 · Sec 192",
      userPrompt: isHindi
        ? "मैंने अगस्त में कंपनी बदली। मुझे दो फॉर्म 16 मिले हैं (पहला ₹6.5L, दूसरा ₹8L)। मानक कटौती दो बार तो नहीं लगेगी?"
        : "I switched employers in August and received two Form 16s (₹6.5L and ₹8.0L). Can I claim standard deduction twice?",
      agentResponse: isHindi
        ? "मैंने दोनों फॉर्म 16 को मिला दिया है। आयकर अधिनियम की धारा 16(ia) के तहत मानक कटौती ₹75,000 केवल एक बार अनुमत है। आपका कुल वेतन ₹14.5L है। नई व्यवस्था में ₹1,06,600 टैक्स बनता है।"
        : "I have unified both Form 16s. Under Section 16(ia), the standard deduction of ₹75,000 is allowed once per taxpayer per year, not per employer. Total gross salary is ₹14.5L. I have prepared your consolidated facts.",
      actionTaken: isHindi ? "2 नियोक्ताओं का वेतन व TDS समेकित किया गया" : "Consolidated 2 Form 16s & prevented duplicate standard deduction",
      taxImpact: isHindi ? "धारा 143(1)(a) के नोटिस से बचाव" : "Protected against Section 143(1)(a) discrepancy notice",
    },
    {
      id: "regime_optimizer",
      title: isHindi ? "पुरानी बनाम नई व्यवस्था अनुकूलन" : "Regime Optimization via Chat",
      tag: "Sec 115BAC vs Old",
      userPrompt: isHindi
        ? "मेरी ₹12.5 लाख सैलरी है। मैंने ₹1.5 लाख PPF में और ₹35,000 स्वास्थ्य बीमा में दिया। कौन सी व्यवस्था में टैक्स बचेगा?"
        : "My salary is ₹12.5 Lakhs. I invested ₹1.5L in PPF and paid ₹35,000 for health insurance. Which regime saves more?",
      agentResponse: isHindi
        ? "नई व्यवस्था में आपका टैक्स ₹75,400 है। लेकिन पुरानी व्यवस्था में 80C (₹1.5L) + 80D (₹35k) और HRA कटौती के बाद आपका टैक्स ₹58,240 आता है। पुरानी व्यवस्था चुनने पर आपको ₹17,160 की सीधी बचत होगी!"
        : "In the New Regime, your tax is ₹75,400. In the Old Regime, factoring in Section 80C (₹1.5L) and Section 80D (₹35k), your taxable income drops to ₹9.9L, giving a tax liability of ₹58,240. Old Regime saves you ₹17,160!",
      actionTaken: isHindi ? "पुरानी कर व्यवस्था का चयन किया" : "Recommended Old Tax Regime with 80C/80D proof logging",
      taxImpact: isHindi ? "₹17,160 की शुद्ध कर बचत" : "Net tax saved: ₹17,160",
    },
    {
      id: "ais_discrepancy",
      title: isHindi ? "AIS बचत बैंक ब्याज विवाद" : "AIS Interest Mismatch Defense",
      tag: "AIS Reconcile · Sec 194A",
      userPrompt: isHindi
        ? "AIS में SBI बैंक ब्याज ₹45,000 दिखा रहा है, लेकिन मेरे पासबुक में सिर्फ ₹15,000 है। क्या करूँ?"
        : "My AIS shows SBI savings interest of ₹45,000, but my bank passbook only shows ₹15,000. How to resolve?",
      agentResponse: isHindi
        ? "यह एक सामान्य दोहराव (duplicate reporting) त्रुटि है। मैंने आपके बैंक विवरण के अनुसार घोषित आय को ₹15,000 पर सेट किया है और CBDT फीडबैक कोड 'Information is duplicate / reported in other year' के साथ स्वचालित जवाब तैयार कर दिया है।"
        : "This is a frequent duplicate reporting bug across branch IFSC codes. I have marked declared interest as ₹15,000 and attached the CBDT AIS feedback code 'Information is duplicate / partially correct'.",
      actionTaken: isHindi ? "AIS फीडबैक कोड व सुधारात्मक प्रतिक्रिया दर्ज" : "Marked CBDT feedback code 'Duplicate reporting'",
      taxImpact: isHindi ? "₹9,360 के अनुचित कर दायित्व से सुरक्षा" : "Avoided ₹9,360 wrongful tax liability",
    },
    {
      id: "notice_defense",
      title: isHindi ? "धारा 143(1)(a) नोटिस उत्तर" : "Defective Notice Resolution",
      tag: "Notice Resolution · Sec 139(9)",
      userPrompt: isHindi
        ? "मुझे सीपीसी से धारा 143(1)(a) का प्रथम दृष्टया समायोजन नोटिस मिला है। क्या आप इसका कानूनी जवाब लिख सकते हैं?"
        : "I received an intimation u/s 143(1)(a) proposing adjustments on 80D deduction. Can you draft a legal reply?",
      agentResponse: isHindi
        ? "हाँ! नोटिस में उल्लिखित कारणों का विश्लेषण करके मैंने कानूनी प्रारूप में जवाब तैयार किया है, जिसमें धारा 80D की रसीद संख्या और प्रासंगिक कानूनी पूर्वोदाहरण उद्धृत किए गए हैं।"
        : "Yes. I have parsed your intimation letter, cross-referenced your premium receipts, and drafted a statutory reply citing Section 80D proviso and CBDT circulars for instant upload on the portal.",
      actionTaken: isHindi ? "कानूनी प्रारूप में औपचारिक प्रतिवेदन तैयार" : "Drafted structured response citing Section 80D guidelines",
      taxImpact: isHindi ? "नोटिस की समयसीमा में अनुपालन" : "Resolved notice before statutory 30-day deadline",
    },
  ];

  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agentic-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="surface-panel relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-paper p-6 md:p-8 shadow-2xl border border-emerald-500/40 text-start">
        {/* Glow Header */}
        <div className="flex items-start justify-between border-b border-line pb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30">
              <Bot size={26} />
              <span className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-paper">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="agentic-modal-title" className="font-sans text-xl md:text-2xl font-black text-ink">
                  {isHindi ? "एजेंटिक मोड — स्वायत्त टैक्स सह-पायलट" : "Agentic Mode — Autonomous Tax Copilot"}
                </h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Next-Gen AI Filing
                </span>
              </div>
              <p className="text-xs text-ink-2 mt-1">
                {isHindi
                  ? "सामान्य भाषा में बातचीत द्वारा शून्य-फॉर्म, स्वचालित तथ्य-सत्यापन और सुरक्षित रिटर्न दाखिल।"
                  : "Zero-form, natural language tax preparation, AIS cross-reconciliation, and compliant filing."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-ink-3 hover:bg-paper-3 hover:text-ink transition cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Vision Pillars */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-paper-2 p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Globe size={16} />
              <span>{isHindi ? "23 भाषाओं में बातचीत" : "Talk in 23 Languages"}</span>
            </div>
            <p className="text-[11px] text-ink-2 mt-1.5 leading-relaxed">
              {isHindi
                ? "अंग्रेजी, हिन्दी, तमिल, बांग्ला या किसी भी भाषा में बोलें या लिखें। जटिल शब्दावली का अंत।"
                : "Speak or type in Hindi, English, Tamil, Telugu, or any Eighth Schedule language with zero translation loss."}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-paper-2 p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Zap size={16} />
              <span>{isHindi ? "स्वचालित तथ्य खोज व मिलान" : "Proactive Deduction Discovery"}</span>
            </div>
            <p className="text-[11px] text-ink-2 mt-1.5 leading-relaxed">
              {isHindi
                ? "एजेंट आपसे लक्षित प्रश्न पूछकर छूट (80C, 80D, 80G, HRA) खोजता है और AIS विसंगतियों को ठीक करता है।"
                : "The agent proactively interviews you to uncover eligible deductions (80C, 80D, 80G, HRA) and resolves AIS duplicates."}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-paper-2 p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Lock size={16} />
              <span>{isHindi ? "मानव स्वीकृति सुरक्षा (Human-in-Loop)" : "Irreversible Human Gate"}</span>
            </div>
            <p className="text-[11px] text-ink-2 mt-1.5 leading-relaxed">
              {isHindi
                ? "एजेंट तैयारी करता है, लेकिन अंतिम पुष्टि केवल आपके क्लिक से होती है। कोई अनचाहा कदम नहीं।"
                : "The agent prepares every figure with citations. Filing only executes when you explicitly confirm the numbers."}
            </p>
          </div>
        </div>

        {/* Interactive Scenario Sandbox */}
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-paper-2 p-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                {isHindi ? "इंटरैक्टिव एजेंट सिमुलेशन — बातचीत उदाहरण चुनें" : "Live Agentic Capabilities — Select a Scenario"}
              </span>
            </div>
            <span className="text-[11px] font-mono text-ink-3">
              {isHindi ? "वास्तविक करदाता स्थितियां" : "Real-World Citizen Situations"}
            </span>
          </div>

          {/* Scenario Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedScenario(s)}
                className={`rounded-xl border p-2.5 text-start transition cursor-pointer ${
                  selectedScenario.id === s.id
                    ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                    : "border-line bg-paper hover:bg-paper-3 text-ink-2"
                }`}
              >
                <span className="block font-mono text-[10px] text-ink-3">{s.tag}</span>
                <span className="block font-sans text-xs font-bold text-ink mt-0.5 truncate">
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Chat Bubble Simulation */}
          <div className="mt-4 space-y-3 rounded-xl border border-line bg-paper p-4 font-sans text-xs">
            {/* User Message */}
            <div className="flex items-start gap-2.5 justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-2.5 text-white shadow-sm">
                <span className="text-[10px] font-mono opacity-75 block mb-0.5">
                  {isHindi ? "आप (करदाता)" : "You (Citizen)"}
                </span>
                <p className="m-0 leading-relaxed font-medium">{selectedScenario.userPrompt}</p>
              </div>
            </div>

            {/* Agent Message */}
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-1">
                <Bot size={15} />
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-line bg-paper-2 p-3.5 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-bold text-ink">Wapsi Autonomous Tax Agent</span>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                    AY 2026-27 Certified
                  </span>
                </div>
                <p className="m-0 text-ink-2 leading-relaxed">{selectedScenario.agentResponse}</p>

                {/* Structured Resolution Pills */}
                <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-line/60 flex-wrap text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 size={13} />
                    <span>{selectedScenario.actionTaken}</span>
                  </div>
                  <span className="text-ink-3">·</span>
                  <span className="rounded bg-paper px-2 py-0.5 font-mono font-bold text-money border border-line">
                    {selectedScenario.taxImpact}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>
              {isHindi
                ? "पूर्ण स्वायत्त एजेंटिक मोड AY 2026-27 के लिए रोल-आउट में है।"
                : "Full autonomous chat interface will roll out with live voice intake."}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper-2 transition cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStandardFiling?.();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:opacity-90 transition cursor-pointer"
            >
              <span>{isHindi ? "मानक 5-चरणीय रिटर्न शुरू करें" : "Start Standard Filing"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

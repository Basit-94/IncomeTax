"use client";

import React, { useState, useMemo } from "react";
import { ChevronRight, ArrowLeft, Check, Sparkles, Volume2, HelpCircle } from "lucide-react";
import type { Lang, Persona } from "../../lib/types";
import type { Dict } from "../../lib/i18n";
import { formatMoney } from "../../lib/money";
import { computeTax } from "../../lib/engine/tax";
import { AnimatedAmount } from "../ui/animated-amount";

export interface UserTaxProfile {
  fullName: string;
  pan: string;
  employmentType: "salaried" | "freelancer" | "business" | "pension";
  hasForm16: boolean | null;
  monthlySalaryInput: number;
  annualSalaryInput: number;
  consultingIncome: number;
  businessIncome: number;
  savingsInterest: number;
  otherIncome: number;
  tdsDeducted: number;
  section80C: number;
  section80D: number;
}

export const BLANK_USER_PROFILE: UserTaxProfile = {
  fullName: "",
  pan: "",
  employmentType: "salaried",
  hasForm16: null,
  monthlySalaryInput: 0,
  annualSalaryInput: 0,
  consultingIncome: 0,
  businessIncome: 0,
  savingsInterest: 0,
  otherIncome: 0,
  tdsDeducted: 0,
  section80C: 0,
  section80D: 0,
};

interface RealUserTaxWizardProps {
  lang: Lang;
  t: Dict;
  onComplete: (persona: Persona, regime: "new" | "old") => void;
  onCancel: () => void;
}

export default function RealUserTaxWizard({
  lang,
  t,
  onComplete,
  onCancel,
}: RealUserTaxWizardProps) {
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [formData, setFormData] = useState<UserTaxProfile>(BLANK_USER_PROFILE);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedRegime, setSelectedRegime] = useState<"new" | "old">("new");

  const updateField = (field: keyof UserTaxProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Speaks/reads text in the current language
  const speakText = (textEn: string, textHi: string, textTa: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // stop any current speech
    
    let text = textEn;
    let voiceLang = "en-IN";
    if (lang === "hi") {
      text = textHi;
      voiceLang = "hi-IN";
    } else if (lang === "ta") {
      text = textTa;
      voiceLang = "ta-IN";
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    
    // Attempt to match local voice
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(voiceLang));
    if (voice) utterance.voice = voice;

    synth.speak(utterance);
  };

  // Regional tooltips helper
  const renderTooltip = (id: string, textEn: string, textHi: string, textTa: string) => {
    const isShowing = activeTooltip === id;
    let text = textEn;
    if (lang === "hi") text = textHi;
    if (lang === "ta") text = textTa;

    return (
      <div className="inline-block ml-1.5 relative">
        <button
          type="button"
          onClick={() => {
            setActiveTooltip(isShowing ? null : id);
            speakText(textEn, textHi, textTa);
          }}
          className="text-money hover:text-money-deep p-1 rounded-full hover:bg-money-soft transition-colors cursor-pointer inline-flex items-center justify-center align-middle"
          title="Explain simply"
        >
          <Volume2 size={13} className="shrink-0" />
        </button>
        {isShowing && (
          <div className="absolute left-0 top-6 z-40 bg-navy text-white text-xs p-3 rounded-xl shadow-xl w-64 leading-relaxed font-sans border border-money/25">
            <p>{text}</p>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-[10px] text-money font-bold underline mt-2 block w-full text-right cursor-pointer"
            >
              Got it / समझ गया / புரிந்தது
            </button>
          </div>
        )}
      </div>
    );
  };

  // Convert step-wise input questionnaire details into engine facts list
  const facts = useMemo(() => {
    const list = [];
    
    // Branching salary calculation
    let calculatedSalary = 0;
    if (formData.employmentType === "salaried") {
      if (formData.hasForm16) {
        calculatedSalary = formData.annualSalaryInput;
      } else {
        calculatedSalary = formData.monthlySalaryInput * 12;
      }
    }

    if (calculatedSalary > 0) {
      list.push({
        id: "real-salary",
        label: "Salary Income",
        amount: calculatedSalary,
        kind: "salary" as const,
        provenance: {
          reporter: "Self Declared",
          reporterKind: "self" as const,
          filedOn: "2026-08-25",
          statement: "self" as const,
          onlyReporterCanFix: false,
        },
      });
    }

    if (formData.employmentType === "freelancer" && formData.consultingIncome > 0) {
      list.push({
        id: "real-consulting",
        label: "Consulting / Professional Receipts",
        amount: formData.consultingIncome,
        kind: "salary" as const,
        provenance: {
          reporter: "Self Declared",
          reporterKind: "self" as const,
          filedOn: "2026-08-25",
          statement: "self" as const,
          onlyReporterCanFix: false,
        },
      });
    }

    if (formData.employmentType === "business" && formData.businessIncome > 0) {
      list.push({
        id: "real-business",
        label: "Business Receipts",
        amount: formData.businessIncome,
        kind: "salary" as const,
        provenance: {
          reporter: "Self Declared",
          reporterKind: "self" as const,
          filedOn: "2026-08-25",
          statement: "self" as const,
          onlyReporterCanFix: false,
        },
      });
    }

    if (formData.savingsInterest > 0) {
      list.push({
        id: "real-interest",
        label: "Bank Interest Income",
        amount: formData.savingsInterest,
        kind: "interest" as const,
        provenance: {
          reporter: "Self Declared",
          reporterKind: "self" as const,
          filedOn: "2026-08-25",
          statement: "self" as const,
          onlyReporterCanFix: false,
        },
      });
    }

    if (formData.otherIncome > 0) {
      list.push({
        id: "real-other",
        label: "Other Earnings & Dividends",
        amount: formData.otherIncome,
        kind: "other" as const,
        provenance: {
          reporter: "Self Declared",
          reporterKind: "self" as const,
          filedOn: "2026-08-25",
          statement: "self" as const,
          onlyReporterCanFix: false,
        },
      });
    }

    return list;
  }, [formData]);

  const claims = useMemo(() => {
    const list = [];
    if (formData.section80C > 0) {
      list.push({
        id: "real-80c",
        section: "80C",
        label: "Section 80C Investments",
        amount: formData.section80C,
        evidenceAttached: true,
      });
    }
    if (formData.section80D > 0) {
      list.push({
        id: "real-80d",
        section: "80D_SELF",
        label: "Section 80D Medical Premium",
        amount: formData.section80D,
        evidenceAttached: true,
      });
    }
    return list;
  }, [formData]);

  const newBreakdown = useMemo(() => {
    return computeTax({
      facts,
      claims,
      regime: "new",
      tdsCredits: formData.tdsDeducted,
      ageBand: "below_60",
    });
  }, [facts, claims, formData.tdsDeducted]);

  const oldBreakdown = useMemo(() => {
    return computeTax({
      facts,
      claims,
      regime: "old",
      tdsCredits: formData.tdsDeducted,
      ageBand: "below_60",
    });
  }, [facts, claims, formData.tdsDeducted]);

  const activeBreakdown = selectedRegime === "new" ? newBreakdown : oldBreakdown;

  const handleFinish = () => {
    const realUserPersona: Persona = {
      id: "custom",
      name: formData.fullName || "Real User",
      age: 29,
      city: "Bengaluru",
      state: "Karnataka",
      occupation:
        formData.employmentType === "salaried"
          ? "Salaried Professional"
          : formData.employmentType === "freelancer"
          ? "Independent Consultant"
          : "Business Owner",
      pan: formData.pan || "PENDINGPAN",
      mobile: "90000 00000",
      preferredLang: lang,
      situation: "Self-declared real user tax return.",
      act: 3,
      actLabel: "Real User",
      embodies: "Real User self-reported details.",
      assessmentYear: "2026-27",
      facts,
      taxPaid: [
        {
          id: "real-tds-192",
          label: "Tax Witheld at Source (TDS)",
          amount: formData.tdsDeducted,
          section: "192",
          provenance: {
            reporter: "Self Reported",
            reporterKind: "self" as const,
            filedOn: "2026-08-25",
            statement: "self" as const,
            onlyReporterCanFix: false,
          },
        },
      ],
      claims,
      banks: [
        {
          id: "real-bank-1",
          bank: "Primary Bank Account",
          maskedNumber: "•••• •••• 9999",
          ifsc: "SBIN0000123",
          status: "validated",
          nominatedForRefund: true,
        },
      ],
      refund: {
        state: "not_filed",
        amount: activeBreakdown.refundOrDue,
        holds: [],
        timeline: [
          {
            id: "tl-real-init",
            on: "2026-08-25",
            state: "not_filed",
            headline: "Return declared, waiting for verification",
            actor: "citizen",
          },
        ],
      },
      notices: [],
    };

    onComplete(realUserPersona, selectedRegime);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-paper rounded-2xl border border-line text-left shadow-sm">
      {/* Stepper Header */}
      <div className="mb-6 flex justify-between items-center border-b border-line pb-4">
        <div>
          <h2 className="text-base font-extrabold text-navy">Interactive Tax Assistant</h2>
          <p className="text-xs text-ink-3">Simple language tax filing for citizens</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-ink-2 hover:text-alarm transition font-bold"
        >
          Cancel Flow
        </button>
      </div>

      <div className="mb-6">
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-line">
          <div
            className="bg-money h-full transition-all duration-300"
            style={{ width: `${(wizardStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Name and PAN */}
      {wizardStep === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-navy">Let's start with your identity</h3>
            <p className="text-xs text-ink-2">Enter your basic credentials to verify tax eligibility.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                Your Full Name (as on your PAN card)
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="w-full px-4 py-2.5 bg-paper-2 border border-line rounded-xl text-ink text-sm focus:border-money focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                PAN Card Number
                {renderTooltip(
                  "pan",
                  "PAN is your unique 10-digit tax account number. Every taxpayer must have one.",
                  "पैन (PAN) आपका अनोखा 10-अंकों का टैक्स खाता नंबर है। हर करदाता के पास यह होना ज़रूरी है।",
                  "பான் (PAN) என்பது உங்கள் தனித்துவமான 10 இலக்க வரி கணக்கு எண். ஒவ்வொரு வரி செலுத்துபவருக்கும் இது தேவை."
                )}
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="ABCDE1234F"
                value={formData.pan}
                onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-paper-2 border border-line rounded-xl text-ink uppercase text-sm font-mono tracking-widest focus:border-money focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              disabled={!formData.fullName.trim() || formData.pan.length !== 10}
              onClick={() => setWizardStep(2)}
              className="px-5 py-2.5 bg-money hover:bg-money-deep text-white text-sm font-bold rounded-xl disabled:bg-slate-200 disabled:text-ink-3 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Next: How you earn</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Conversational Earning Questionnaire & Branching */}
      {wizardStep === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-navy">How do you earn your living?</h3>
            <p className="text-xs text-ink-2">Select the option that matches your primary livelihood.</p>
          </div>

          {/* Livings grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "salaried", label: "💼 Monthly Salary", desc: "For employees" },
              { id: "freelancer", label: "🛠️ Freelance / Contract", desc: "For developers, consultants" },
              { id: "business", label: "🏪 Small Business", desc: "Shopkeepers, traders" },
              { id: "pension", label: "🌾 Pension / Other", desc: "Retired or other sources" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateField("employmentType", opt.id)}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  formData.employmentType === opt.id
                    ? "border-money bg-money-soft/10 text-navy"
                    : "border-line bg-paper-2 hover:border-slate-400"
                }`}
              >
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className="block text-[10px] text-ink-3 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* Step-by-Step Branching Questions */}
          <div className="bg-paper-2 border border-line rounded-2xl p-5 space-y-4">
            {formData.employmentType === "salaried" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="block text-xs font-bold text-ink-2 uppercase tracking-wider">
                    Do you get a monthly payslip or Form 16?
                    {renderTooltip(
                      "form16",
                      "Form 16 is a certificate your company gives you once a year showing your total salary and tax cuts.",
                      "फॉर्म 16 एक सर्टिफिकेट है जो आपकी कंपनी साल में एक बार देती है, जिसमें आपका कुल वेतन और टैक्स कटौती दिखाई जाती है।",
                      "பார்ம் 16 என்பது உங்கள் நிறுவனம் வருடத்திற்கு ஒரு முறை வழங்கும் சான்றிதழ் ஆகும், இது உங்கள் மொத்த சம்பளம் மற்றும் வரி பிடித்தங்களைக் காட்டுகிறது."
                    )}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateField("hasForm16", true)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        formData.hasForm16 === true
                          ? "border-money bg-white text-money font-bold"
                          : "border-line bg-paper text-ink-2 hover:border-slate-400"
                      }`}
                    >
                      Yes, I have one
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("hasForm16", false)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        formData.hasForm16 === false
                          ? "border-money bg-white text-money font-bold"
                          : "border-line bg-paper text-ink-2 hover:border-slate-400"
                      }`}
                    >
                      No, I don't get one
                    </button>
                  </div>
                </div>

                {formData.hasForm16 === true && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-ink-2">
                      Enter your annual Gross Salary (CTC) (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 800000"
                      value={formData.annualSalaryInput || ""}
                      onChange={(e) => updateField("annualSalaryInput", Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
                    />
                  </div>
                )}

                {formData.hasForm16 === false && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-ink-2">
                      How much money enters your bank account each month? (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={formData.monthlySalaryInput || ""}
                      onChange={(e) => updateField("monthlySalaryInput", Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
                    />
                    <span className="block text-[10px] text-ink-3 mt-1">
                      We will automatically calculate your annual salary as ₹{(formData.monthlySalaryInput * 12).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {formData.employmentType === "freelancer" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider">
                  Total Freelance Receipts for the Year (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 600000"
                  value={formData.consultingIncome || ""}
                  onChange={(e) => updateField("consultingIncome", Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
                />
              </div>
            )}

            {formData.employmentType === "business" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider">
                  Total Business Receipts/Sales for the Year (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500000"
                  value={formData.businessIncome || ""}
                  onChange={(e) => updateField("businessIncome", Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
                />
              </div>
            )}

            {formData.employmentType === "pension" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider">
                  Total Pension / Agricultural Earnings (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 350000"
                  value={formData.otherIncome || ""}
                  onChange={(e) => updateField("otherIncome", Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Bank interest details */}
          <div className="space-y-1 bg-paper-2 border border-line rounded-2xl p-5">
            <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider">
              Do you have savings bank interest or FD interest? (₹)
            </label>
            <input
              type="number"
              placeholder="If yes, enter interest amount (e.g. 12000) else leave 0"
              value={formData.savingsInterest || ""}
              onChange={(e) => updateField("savingsInterest", Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setWizardStep(1)}
              className="px-4 py-2 border border-line text-ink-2 rounded-xl hover:bg-slate-50 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setWizardStep(3)}
              className="px-5 py-2.5 bg-money hover:bg-money-deep text-white text-sm font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <span>Next: Taxes & Investments</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: TDS & Investments */}
      {wizardStep === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-navy">Taxes Already Deducted & Savings</h3>
            <p className="text-xs text-ink-2">Enter what has already been paid and investments you made.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                TDS: Taxes already deducted from your payments (₹)
                {renderTooltip(
                  "tds",
                  "TDS (Tax Deducted at Source) is money withheld by companies or banks before they paid you. It counts as credit.",
                  "टीडीएस (TDS) वह पैसा है जो कंपनियों या बैंकों ने आपको भुगतान करने से पहले काट लिया था। यह आपके क्रेडिट में गिना जाता है।",
                  "டிடிஎஸ் (TDS) என்பது நிறுவனங்கள் அல்லது வங்கிகள் உங்களுக்கு பணம் செலுத்துவதற்கு முன் பிடித்தம் செய்த தொகையாகும். இது கிரெடிட்டாக கணக்கிடப்படும்."
                )}
              </label>
              <input
                type="number"
                placeholder="e.g. 35000"
                value={formData.tdsDeducted || ""}
                onChange={(e) => updateField("tdsDeducted", Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-paper-2 border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                Tax-saving investments (Section 80C) (₹)
                {renderTooltip(
                  "80c",
                  "Under Section 80C, you can reduce taxable income up to ₹1,50,000 by investing in PPF, ELSS, or EPF.",
                  "धारा 80C के तहत, आप पीपीएफ, ईएलएसएस या ईपीएफ में निवेश करके टैक्स योग्य आय को ₹1.5 लाख तक कम कर सकते हैं।",
                  "செக்ஷன் 80C-ன் கீழ், நீங்கள் பிபிஎஃப், இஎல்எஸ்எஸ் அல்லது இபிஎஃப் ஆகியவற்றில் முதலீடு செய்வதன் மூலம் வரி விதிக்கக்கூடிய வருமானத்தை ₹1.5 லட்சம் வரை குறைக்கலாம்."
                )}
              </label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={formData.section80C || ""}
                onChange={(e) => updateField("section80C", Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-paper-2 border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-2">
                Health insurance premium (Section 80D) (₹)
                {renderTooltip(
                  "80d",
                  "Section 80D is a tax exemption on money spent to buy health insurance policies for yourself or parents.",
                  "धारा 80डी आपके या माता-पिता के लिए स्वास्थ्य बीमा पॉलिसियों को खरीदने के लिए खर्च किए गए पैसे पर मिलने वाली टैक्स छूट है।",
                  "செக்ஷன் 80D என்பது உங்களுக்கோ அல்லது உங்கள் பெற்றோருக்கோ மருத்துவ காப்பீட்டு பாலிசிகளை வாங்குவதற்காக செலவழிக்கப்பட்ட பணத்திற்கான வரி விலக்கு ஆகும்."
                )}
              </label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={formData.section80D || ""}
                onChange={(e) => updateField("section80D", Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-paper-2 border border-line rounded-xl text-ink font-mono text-sm focus:border-money focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setWizardStep(2)}
              className="px-4 py-2 border border-line text-ink-2 rounded-xl hover:bg-slate-50 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setWizardStep(4)}
              className="px-5 py-2.5 bg-money hover:bg-money-deep text-white text-sm font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <span>Next: Optimize my tax</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Live Optimization COMPARISON */}
      {wizardStep === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-navy">Live Tax Optimization</h3>
            <p className="text-xs text-ink-2">We computed the results under both regimes. Choose what is best for you.</p>
          </div>

          {/* Simple Filer Badge */}
          <div className="bg-money-soft border border-money/20 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <p className="font-mono text-money font-bold uppercase tracking-wider text-[10px]">Verified Filer Details</p>
              <h4 className="font-bold text-navy mt-0.5">{formData.fullName} ({formData.pan})</h4>
            </div>
            <button
              onClick={() => setWizardStep(1)}
              className="text-money hover:text-money-deep underline font-bold"
            >
              Edit Details
            </button>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* NEW REGIME CARD */}
            <div
              onClick={() => setSelectedRegime("new")}
              className={`border-2 rounded-2xl p-5 cursor-pointer text-left transition flex flex-col justify-between ${
                selectedRegime === "new"
                  ? "border-money bg-paper shadow-md"
                  : "border-line bg-paper-2 hover:border-slate-400"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-navy">
                    New Regime (AY 2026-27)
                  </span>
                  {newBreakdown.refundOrDue >= oldBreakdown.refundOrDue && (
                    <span className="bg-money text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                      <Sparkles size={8} />
                      <span>Best Choice</span>
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-xs text-ink-2">
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span className="font-mono text-ink font-semibold">
                      {formatMoney(newBreakdown.taxableIncome, lang)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calculated Tax:</span>
                    <span className="font-mono text-ink">
                      {formatMoney(newBreakdown.totalTax, lang)}
                    </span>
                  </div>
                  {newBreakdown.rebate87A > 0 && (
                    <div className="flex justify-between text-money font-semibold">
                      <span>Rebate:</span>
                      <span className="font-mono">-{formatMoney(newBreakdown.rebate87A, lang)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-line/60 pt-4 mt-4 flex items-center justify-between">
                <span className="text-xs text-ink-2">Outcome:</span>
                <span className={`font-mono font-extrabold text-sm ${newBreakdown.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>
                  {newBreakdown.refundOrDue >= 0 ? "Refund: +" : "Payable: -"}
                  {formatMoney(Math.abs(newBreakdown.refundOrDue), lang)}
                </span>
              </div>
            </div>

            {/* OLD REGIME CARD */}
            <div
              onClick={() => setSelectedRegime("old")}
              className={`border-2 rounded-2xl p-5 cursor-pointer text-left transition flex flex-col justify-between ${
                selectedRegime === "old"
                  ? "border-money bg-paper shadow-md"
                  : "border-line bg-paper-2 hover:border-slate-400"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-navy">
                    Old Regime
                  </span>
                  {oldBreakdown.refundOrDue > newBreakdown.refundOrDue && (
                    <span className="bg-money text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                      <Sparkles size={8} />
                      <span>Best Choice</span>
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-xs text-ink-2">
                  <div className="flex justify-between">
                    <span>Taxable Income:</span>
                    <span className="font-mono text-ink font-semibold">
                      {formatMoney(oldBreakdown.taxableIncome, lang)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calculated Tax:</span>
                    <span className="font-mono text-ink">
                      {formatMoney(oldBreakdown.totalTax, lang)}
                    </span>
                  </div>
                  {oldBreakdown.rebate87A > 0 && (
                    <div className="flex justify-between text-money font-semibold">
                      <span>Rebate:</span>
                      <span className="font-mono">-{formatMoney(oldBreakdown.rebate87A, lang)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-line/60 pt-4 mt-4 flex items-center justify-between">
                <span className="text-xs text-ink-2">Outcome:</span>
                <span className={`font-mono font-extrabold text-sm ${oldBreakdown.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>
                  {oldBreakdown.refundOrDue >= 0 ? "Refund: +" : "Payable: -"}
                  {formatMoney(Math.abs(oldBreakdown.refundOrDue), lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Details breakdown trail */}
          <div className="border border-line rounded-xl overflow-hidden bg-paper text-xs text-ink-2 text-left mt-4">
            {/* Header: Show source and calculation trail */}
            <div className="p-4 bg-paper-2 border-b border-line">
              <span className="font-bold text-navy">Tax Calculation Trail</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex justify-between border-b border-line pb-1">
                <span>Gross Income:</span>
                <span className="font-mono text-ink font-semibold">
                  {formatMoney(activeBreakdown.grossIncome, lang)}
                </span>
              </div>
              {activeBreakdown.standardDeduction > 0 && (
                <div className="flex justify-between border-b border-line pb-1">
                  <span>Standard Deduction:</span>
                  <span className="font-mono text-money font-semibold">
                    -{formatMoney(activeBreakdown.standardDeduction, lang)}
                  </span>
                </div>
              )}
              {activeBreakdown.totalDeductions > 0 && (
                <div className="flex justify-between border-b border-line pb-1">
                  <span>Chapter VI-A Claims Allowed:</span>
                  <span className="font-mono text-money font-semibold">
                    -{formatMoney(activeBreakdown.totalDeductions, lang)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-line pb-1 font-bold text-navy">
                <span>Taxable Income:</span>
                <span className="font-mono">{formatMoney(activeBreakdown.taxableIncome, lang)}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-1">
                <span>Tax before rebate:</span>
                <span className="font-mono text-ink font-semibold">
                  {formatMoney(activeBreakdown.rawTax, lang)}
                </span>
              </div>
              {activeBreakdown.rebate87A > 0 && (
                <div className="flex justify-between border-b border-line pb-1 text-money font-semibold">
                  <span>Section 87A rebate:</span>
                  <span className="font-mono">-{formatMoney(activeBreakdown.rebate87A, lang)}</span>
                </div>
              )}
            </div>

            {/* Net Result - bottom padded row with color matching outer box */}
            <div className="flex justify-between items-center p-4 bg-money-soft border-t border-line">
              <span className="font-bold text-navy">Net Refund / Due</span>
              <span className={`font-mono text-sm font-bold ${activeBreakdown.refundOrDue >= 0 ? "text-money" : "text-alarm"}`}>
                {activeBreakdown.refundOrDue >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(activeBreakdown.refundOrDue), lang)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-line flex justify-between items-center">
            <button
              onClick={() => setWizardStep(3)}
              className="px-4 py-2 border border-line text-ink-2 rounded-xl hover:bg-slate-50 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={handleFinish}
              className="px-6 py-3 bg-money hover:bg-money-deep text-white text-sm font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check size={18} />
              <span>Confirm & Lock Selected Regime</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

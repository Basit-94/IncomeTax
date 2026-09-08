import { describe, expect, it } from "vitest";
import { detectRegister, detectReplyLanguage, digitsOf, replyLanguageName, whyRejected } from "../say";

const allowed = digitsOf("Salary ₹4,20,000; TDS ₹8,400; refund ₹8,400; standard deduction ₹75,000; slabs 4L 8L 12L; rebate 87A up to ₹12,00,000; sections 80C 80D 80CCD(1B) 24(b) 139(1) 2026-27");

describe("the check on a reply — figures come from the tools, never from the model (2026-09-07)", () => {
  it("accepts a reply whose every figure was in the facts, sections included", () => {
    expect(whyRejected("Your salary is ₹4,20,000 and ₹8,400 was deducted; under the new regime you get the full ₹8,400 back — s.87A covers income up to ₹12,00,000.", { allowed, actionHappened: false })).toBeNull();
    expect(whyRejected("Two things: 80C and 80D only work in the old regime; 80CCD(1B) too.", { allowed, actionHappened: false })).toBeNull();
  });
  it("refuses any figure the model was not given, in any script, and names it", () => {
    expect(whyRejected("You'll probably get ₹9,999 back.", { allowed, actionHappened: false })).toMatch(/figure not in the facts \(9999\)/);
    expect(whyRejected("आपको ८४,००० वापस मिलेंगे", { allowed, actionHappened: false })).toMatch(/figure not in the facts/);
  });
  it("lets small numbers through — dates, counts, list items", () => {
    expect(whyRejected("File by 31 July; there are 3 steps and 2 documents.", { allowed, actionHappened: false })).toBeNull();
  });
  it("refuses claims of filing or payment unless the action happened", () => {
    expect(whyRejected("Your return has been filed.", { allowed, actionHappened: false })).toMatch(/action that did not happen/);
    expect(whyRejected("Your return has been filed — simulated, receipt in the vault.", { allowed, actionHappened: true })).toBeNull();
  });
  it("refuses an identifier and self-description", () => {
    expect(whyRejected("Your PAN ABCDE1234F is on record.", { allowed, actionHappened: false })).toBe("identifier in reply");
    expect(whyRejected("Honestly, no jargon here: you're salaried.", { allowed, actionHappened: false })).toMatch(/self-description/);
    expect(whyRejected("", { allowed, actionHappened: false })).toBe("empty");
  });
  it("refuses code — a fence or lines that read as a program — but not section references (user, 2026-09-08)", () => {
    expect(whyRejected("Here you go:\n```python\ndef reverse(s):\n    return s[::-1]\n```", { allowed, actionHappened: false })).toBe("code in reply");
    expect(whyRejected("const x = 1;\nconsole.log(x);", { allowed, actionHappened: false })).toBe("code in reply");
    expect(whyRejected("Employer NPS under 80CCD(2) is the one deduction that survives the new regime; 24(b) does not.", { allowed, actionHappened: false })).toBeNull();
    expect(whyRejected("I only do tax here — code I'll leave to your editor. Want me to check what 80C would save you?", { allowed, actionHappened: false })).toBeNull();
  });
  it("never mistakes arithmetic, tables or ordinary sentences for code", () => {
    const sums = digitsOf("4,20,000; 75,000; 3,45,000; 5%; 3,00,000; 15,000; 4%; 600; 15,600; 8,400; 7,200; 1,50,000; 2,70,000");
    const ok = new Set([...allowed, ...sums]);
    expect(whyRejected([
      "Let me lay it out:",
      "Gross salary = ₹4,20,000",
      "Standard deduction = ₹75,000",
      "Taxable income = ₹4,20,000 − ₹75,000 = ₹3,45,000",
      "Tax = 5% × ₹3,00,000 = ₹15,000; cess 4% = ₹600; total = ₹15,600",
      "Rebate u/s 87A wipes it out, so refund = TDS = ₹8,400.",
    ].join("\n"), { allowed: ok, actionHappened: false })).toBeNull();
    expect(whyRejected([
      "| Line | New | Old |",
      "|---|---|---|",
      "| Gross | ₹4,20,000 | ₹4,20,000 |",
      "| Deductions | ₹0 | ₹1,50,000 |",
      "| Taxable | ₹3,45,000 | ₹2,70,000 |",
    ].join("\n"), { allowed: ok, actionHappened: false })).toBeNull();
    expect(whyRejected([
      "Return under the new regime: nil tax (s.87A).",
      "From your Form 16, TDS is ₹8,400.",
      "Class 10 fees count under 80C (old regime only).",
      "Select the old regime only if 80C + 80D beat the ₹75,000 standard deduction gap.",
      "Import duty is not income tax; ignore it here.",
      "(simulated — nothing goes to the department)",
    ].join("\n"), { allowed: ok, actionHappened: false })).toBeNull();
  });
  it("refuses an essay past the cap", () => {
    expect(whyRejected("word ".repeat(800), { allowed, actionHappened: false, maxWords: 700 })).toMatch(/too long/);
  });
});

describe("reply language follows the person's latest message — English, Hindi or Hinglish, nothing else for now", () => {
  it("Devanagari → Hindi, romanised Hindi → Hinglish, everything else → English", () => {
    expect(detectReplyLanguage("80C क्या है?")).toBe("hi");
    expect(detectReplyLanguage("80C kya hai bhai, mujhe batao")).toBe("hinglish");
    expect(detectReplyLanguage("what is 80C")).toBe("en");
    expect(detectReplyLanguage("80C என்றால் என்ன")).toBe("en"); // Tamil script: English for now
    expect(replyLanguageName("hinglish")).toMatch(/Hinglish/);
  });
});

describe("register — romanised Hindi is answered in Hinglish", () => {
  it("detects Hinglish from two or more Hindi function words in Latin script", () => {
    expect(detectRegister("mujhe 12 lpa ki naukri mili hai, tax file karna hai", "en")).toBe("hinglish");
    expect(detectRegister("bhai kya mera refund aayega", "en")).toBe("hinglish");
  });
  it("stays plain for English, for Devanagari, and for other UI languages", () => {
    expect(detectRegister("I got a job with a 12 LPA package and need to file", "en")).toBe("plain");
    expect(detectRegister("मुझे नौकरी मिली है", "hi")).toBe("plain");
    expect(detectRegister("mujhe naukri mili hai", "ta")).toBe("plain");
  });
});

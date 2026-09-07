import { describe, expect, it } from "vitest";
import {
  MUNSHI_CHARACTER,
  MUNSHI_VOICE,
  characterPrompt,
  generateIdentityAndKnowledgeReply,
  isIdentityOrPersonalInquiry,
  whoIsMunshi,
} from "../munshi-character";

describe("Munshi ji — one character, every surface (2026-09-07)", () => {
  it("knows his own name, how he reacts, and what he never does", () => {
    expect(MUNSHI_CHARACTER.name).toBe("Munshi ji");
    const prompt = characterPrompt({ surface: "agentic", langEnglishName: "English" });
    expect(prompt).toContain("You are Munshi ji");
    expect(prompt).toContain("A notice:");
    expect(prompt).toContain("Asked who you are:");
    expect(prompt).toContain("never");
    expect(prompt).toContain("Hinglish");
    expect(MUNSHI_VOICE).toContain("Munshi ji");
  });

  it("renders the surface and the detail mode into the prompt", () => {
    expect(characterPrompt({ surface: "copilot", langEnglishName: "Hindi", mode: "simple", userName: "Sunita" })).toMatch(/Manual dashboard.*Simple|Simple.*Manual dashboard/s);
    expect(characterPrompt({ surface: "expert", langEnglishName: "English", mode: "full" })).toContain("Detail mode: Full");
  });

  it("introduces himself in one breath — English, Hindi, Hinglish — with the name in it", () => {
    for (const text of [whoIsMunshi("en"), whoIsMunshi("hi"), whoIsMunshi("en", "hinglish", "Rahul")]) {
      expect(text).toMatch(/Munshi ji|मुंशी जी/);
      expect(text.split("\n")).toHaveLength(1);
      expect(text).not.toMatch(/\d\./); // never a numbered menu
    }
    expect(whoIsMunshi("en", "hinglish", "Rahul")).toContain("Rahul ji");
  });

  it("knows who named him Munshi ji and never identifies as 'I am Vopsi'", () => {
    expect(MUNSHI_CHARACTER.reactions.askedWhoNamedHim).toContain("Wapsi");
    const prompt = characterPrompt({ surface: "copilot", langEnglishName: "Hindi" });
    expect(prompt).toContain("Asked who named you:");
  });

  it("detects identity, personal knowledge, and Munshi inquiries in Hindi, Hinglish, and English", () => {
    const hindiMultiQuery = "मुंशी जी मेरा नाम क्या है? क्या आपको पता है? और आप मेरे बारे में अभी तक क्या-क्या जानते हैं? और थोड़ा अपने बारे में बताइए।";
    expect(isIdentityOrPersonalInquiry(hindiMultiQuery)).toBe(true);
    expect(isIdentityOrPersonalInquiry("मेरा नाम क्या है?")).toBe(true);
    expect(isIdentityOrPersonalInquiry("who am i")).toBe(true);
    expect(isIdentityOrPersonalInquiry("what do you know about me")).toBe(true);
    expect(isIdentityOrPersonalInquiry("mere bare me kya jante ho")).toBe(true);
    expect(isIdentityOrPersonalInquiry("apne bare me batao")).toBe(true);
    expect(isIdentityOrPersonalInquiry("आपका नाम मुंशी जी किसने रखा? आप बता सकते हैं? हिंदी में।")).toBe(true);
    expect(isIdentityOrPersonalInquiry("which regime is cheaper for me?")).toBe(false);
  });

  it("generates warm identity and record summary in Hindi without dumping regime comparison tables", () => {
    const reply = generateIdentityAndKnowledgeReply({
      lang: "hi",
      userName: "Faheem Ahmed",
      pan: "BZSPA7412M",
      employer: "Tech Mahindra Ltd",
      salary: 1380000,
      tdsCredits: 81770,
      regime: "new",
    });

    expect(reply).toContain("Faheem Ahmed");
    expect(reply).toContain("BZSPA7412M");
    expect(reply).toContain("Tech Mahindra Ltd");
    expect(reply).toContain("13,80,000");
    expect(reply).toContain("81,770");
    expect(reply).toContain("मुंशी जी");
    expect(reply).not.toContain("For the assessment year 2026-27, you have two choices for your return");
  });
});

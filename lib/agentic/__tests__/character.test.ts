import { describe, expect, it } from "vitest";
import { detectSmallTalk } from "../voice";
import { MUNSHI_CHARACTER, MUNSHI_VOICE, characterPrompt, whoIsMunshi } from "../munshi-character";

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

  it("hears 'who are you' the way people actually type it", () => {
    for (const t of ["aap kon h?", "aap kaun ho", "tum kon ho", "who r u", "who are you?", "what's your name", "aapka naam kya hai", "kaun ho aap"]) {
      expect(detectSmallTalk(t), t).toBe("who");
    }
    expect(detectSmallTalk("which regime is better for me?")).toBeNull();
    expect(detectSmallTalk("kya kar sakte ho")).toBe("help");
  });
});

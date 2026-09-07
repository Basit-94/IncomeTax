import { describe, expect, it } from "vitest";
import { LANGS } from "../i18n";
import { WHISPER_LANGUAGE, whisperLanguageFor } from "../speech";

describe("whisper language map", () => {
  it("covers every one of the 23 languages", () => {
    for (const lang of LANGS) {
      expect(Object.prototype.hasOwnProperty.call(WHISPER_LANGUAGE, lang)).toBe(true);
    }
    expect(Object.keys(WHISPER_LANGUAGE)).toHaveLength(LANGS.length);
  });

  it("uses Whisper's own codes where it has the language, and detection where it does not", () => {
    for (const lang of LANGS) {
      const code = whisperLanguageFor(lang);
      expect(code === null || /^[a-z]{2,3}$/.test(code)).toBe(true);
    }
    expect(whisperLanguageFor("en")).toBe("en");
    expect(whisperLanguageFor("hi")).toBe("hi");
    expect(whisperLanguageFor("ta")).toBe("ta");
    // Whisper was not trained on these; a forced wrong language is worse than detection.
    expect(whisperLanguageFor("or")).toBeNull();
    expect(whisperLanguageFor("sat")).toBeNull();
    expect(whisperLanguageFor("brx")).toBeNull();
  });
});

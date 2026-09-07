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

describe("speech audio mime mapping", () => {
  it("resolves extensions to proper audio mime types", async () => {
    const { mimeFromExt } = await import("../server/transcriber");
    expect(mimeFromExt("wav")).toBe("audio/wav");
    expect(mimeFromExt("webm")).toBe("audio/webm");
    expect(mimeFromExt("mp3")).toBe("audio/mp3");
    expect(mimeFromExt("ogg")).toBe("audio/ogg");
    expect(mimeFromExt("m4a")).toBe("audio/mp4");
  });
});

describe("transcribeWithGemini error handling", () => {
  it("returns error when no API key is present", async () => {
    const { transcribeWithGemini } = await import("../server/transcriber");
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_FALLBACK_API_KEY;
      const res = await transcribeWithGemini({ bytes: new Uint8Array([1, 2, 3]), mimeType: "audio/wav" });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toContain("GEMINI_API_KEY is not configured");
      }
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });
});


import { describe, expect, it } from "vitest";
import { getGeminiKeys } from "../geminiKeys";

describe("getGeminiKeys — universal key resolver", () => {
  it("resolves primary, fallback, and numbered fallback keys", () => {
    const env = {
      GEMINI_API_KEY: "key-primary",
      GEMINI_FALLBACK_API_KEY: "key-fb1",
      GEMINI_FALLBACK_API_KEY_2: "key-fb2",
      GEMINI_FALLBACK_API_KEY_5: "key-fb5",
      GEMINI_FALLBACK_API_KEY_8: "key-fb8",
    };
    const keys = getGeminiKeys(env);
    expect(keys).toEqual(["key-primary", "key-fb1", "key-fb2", "key-fb5", "key-fb8"]);
  });

  it("resolves comma-separated GEMINI_API_KEYS string and trims whitespace and quotes", () => {
    const env = {
      GEMINI_API_KEYS: 'key-1, "key-2", \'key-3\', key-4 , key-5',
    };
    const keys = getGeminiKeys(env);
    expect(keys).toEqual(["key-1", "key-2", "key-3", "key-4", "key-5"]);
  });

  it("deduplicates keys and filters empty strings or REPLACE_ME placeholders", () => {
    const env = {
      GEMINI_API_KEY: "AIza-REPLACE_ME",
      GEMINI_FALLBACK_API_KEY: "valid-key-1",
      GEMINI_FALLBACK_API_KEY_2: "valid-key-1", // duplicate
      GEMINI_API_KEYS: "valid-key-2, valid-key-3, REPLACE_ME",
    };
    const keys = getGeminiKeys(env);
    expect(keys).toEqual(["valid-key-2", "valid-key-3", "valid-key-1"]);
  });
});

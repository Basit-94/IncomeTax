import { describe, expect, it } from "vitest";
import { geminiModel } from "../model";

const env = { GEMINI_API_KEY: "key-one", GEMINI_FALLBACK_API_KEY: "key-two", AGENT_MODEL: "test-model" };
const reply = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { totalTokenCount: 5 } }), { status: 200 });
const quota = () => new Response(JSON.stringify({ error: { code: 429, message: "quota" } }), { status: 429 });

describe("the model adapter — a key out of quota is skipped, and every failure has a name (2026-09-06: a silent 429 made the whole agent read as templates)", () => {
  it("rotates to the fallback key on HTTP 429 and remembers the exhausted one", async () => {
    const used: string[] = [];
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      const key = String((init?.headers as Record<string, string>)["x-goog-api-key"]);
      used.push(key);
      return key === "key-one" ? quota() : reply("Fresh words.");
    }) as typeof fetch;
    const m = geminiModel(env, fetchImpl);
    const out = await m.phrase({ brief: "say hello", lang: "en", langEnglishName: "English", shape: "chat" });
    expect(out?.text).toBe("Fresh words.");
    expect(used).toEqual(["key-one", "key-two"]);
    await m.phrase({ brief: "again", lang: "en", langEnglishName: "English", shape: "chat" });
    expect(used).toEqual(["key-one", "key-two", "key-two"]); // key-one is not retried
    expect(m.lastFailure?.()).toBeNull();
  });

  it("names the failure when every key is out of quota, when the API errors, and when the reply is empty", async () => {
    const m429 = geminiModel(env, (async () => quota()) as typeof fetch);
    expect(await m429.phrase({ brief: "x", lang: "en", langEnglishName: "English", shape: "chat" })).toBeNull();
    expect(m429.lastFailure?.()).toMatch(/HTTP 429/);
    expect(await m429.phrase({ brief: "x", lang: "en", langEnglishName: "English", shape: "chat" })).toBeNull();
    expect(m429.lastFailure?.()).toMatch(/all keys out of quota/);

    const m500 = geminiModel(env, (async () => new Response("boom", { status: 500 })) as typeof fetch);
    expect(await m500.phrase({ brief: "x", lang: "en", langEnglishName: "English", shape: "chat" })).toBeNull();
    expect(m500.lastFailure?.()).toBe("HTTP 500");

    const mEmpty = geminiModel(env, (async () => new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }), { status: 200 })) as typeof fetch);
    expect(await mEmpty.phrase({ brief: "x", lang: "en", langEnglishName: "English", shape: "chat" })).toBeNull();
    expect(mEmpty.lastFailure?.()).toMatch(/empty reply \(SAFETY\)/);
  });

  it("is the null model when no usable key or no model id is configured", () => {
    expect(geminiModel({ AGENT_MODEL: "x" }).name).toBe("none");
    expect(geminiModel({ GEMINI_API_KEY: "REPLACE_ME", AGENT_MODEL: "x" }).name).toBe("none");
    expect(geminiModel({ GEMINI_API_KEY: "k" }).name).toBe("none");
  });
});

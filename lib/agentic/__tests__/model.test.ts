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

  it("askTaxExpert delivers dynamic tax guidance, extracts cited sections, and parses titles", async () => {
    const fetchImpl = (async () =>
      reply("### Capital Gains under Section 112A\n\nLong-term capital gains on listed shares are taxed u/s 112A at 12.5% beyond the ₹1,25,000 threshold. Under Section 111A, short-term capital gains are taxed at 20%.")) as typeof fetch;
    const m = geminiModel(env, fetchImpl);
    const out = await m.askTaxExpert?.({
      query: "how are my shares taxed?",
      lang: "en",
      langEnglishName: "English",
      taxpayerName: "Arjun",
    });
    expect(out).toBeDefined();
    expect(out?.title).toBe("Capital Gains under Section 112A");
    expect(out?.text).toContain("Section 112A");
    expect(out?.detectedProvisions).toContain("112A");
    expect(out?.detectedProvisions).toContain("111A");
  });
});

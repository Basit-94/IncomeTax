import { describe, expect, it } from "vitest";
import { geminiModel, type ConverseInput } from "../model";

const env = { GEMINI_API_KEY: "key-one", GEMINI_FALLBACK_API_KEY: "key-two", AGENT_MODEL: "test-model" };
const reply = (parts: unknown[]) => new Response(JSON.stringify({ candidates: [{ content: { parts } }], usageMetadata: { totalTokenCount: 5 } }), { status: 200 });
const quota = () => new Response(JSON.stringify({ error: { code: 429, message: "quota" } }), { status: 429 });
const input: ConverseInput = { system: "sys", messages: [{ role: "user", text: "hello" }], tools: [{ name: "get_return", description: "d", parameters: { type: "OBJECT", properties: {} } }], lang: "en" };

describe("the model adapter — one conversation call with tools; a key out of quota is skipped, every failure has a name", () => {
  it("rotates to the fallback key on HTTP 429, remembers the exhausted one, and returns text", async () => {
    const used: string[] = [];
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      used.push(String((init?.headers as Record<string, string>)["x-goog-api-key"]));
      return used[used.length - 1] === "key-one" ? quota() : reply([{ text: "Fresh words." }]);
    }) as typeof fetch;
    const m = geminiModel(env, fetchImpl);
    const out = await m.converse(input);
    expect(out?.text).toBe("Fresh words.");
    expect(out?.calls).toEqual([]);
    expect(used).toEqual(["key-one", "key-two"]);
    await m.converse(input);
    expect(used).toEqual(["key-one", "key-two", "key-two"]); // key-one is not retried
    expect(m.lastFailure?.()).toBeNull();
  });

  it("parses function calls, keeps the raw parts for the reply, and sends tool results back as functionResponse parts", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return reply([{ text: "Let me look." }, { functionCall: { name: "get_return", args: {} }, thoughtSignature: "sig" }]);
    }) as typeof fetch;
    const m = geminiModel(env, fetchImpl);
    const out = (await m.converse(input))!;
    expect(out.calls).toEqual([{ name: "get_return", args: {} }]);
    expect(out.text).toBe("Let me look.");
    expect(out.raw).toHaveLength(2);
    // The tools ride along, and the next hop echoes the model's own parts before the results.
    expect((bodies[0].tools as unknown[]).length).toBe(1);
    await m.converse({ ...input, messages: [...input.messages, { role: "model", raw: out.raw, calls: out.calls }, { role: "tool", results: [{ name: "get_return", response: { revision: 1 } }] }] });
    const contents = bodies[1].contents as { role: string; parts: Record<string, unknown>[] }[];
    expect(contents[1].role).toBe("model");
    expect(contents[1].parts[1]).toMatchObject({ functionCall: { name: "get_return" }, thoughtSignature: "sig" });
    expect(contents[2].parts[0]).toEqual({ functionResponse: { name: "get_return", response: { revision: 1 } } });
  });

  it("a per-minute 429 with a short 'retry in' is waited out and the same key tried again; a long one rests the key", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return calls === 1 ? new Response(JSON.stringify({ error: { code: 429, message: "Quota exceeded … Please retry in 0.01s." } }), { status: 429 }) : reply([{ text: "Back." }]);
    }) as typeof fetch;
    const m = geminiModel({ GEMINI_API_KEY: "only", AGENT_MODEL: "test-model" }, fetchImpl);
    expect((await m.converse(input))?.text).toBe("Back.");
    expect(calls).toBe(2);

    const long = geminiModel({ GEMINI_API_KEY: "only", AGENT_MODEL: "test-model" }, (async () => new Response(JSON.stringify({ error: { code: 429, message: "Please retry in 120s." } }), { status: 429 })) as typeof fetch);
    expect(await long.converse(input)).toBeNull();
    expect(long.lastFailure?.()).toMatch(/retry in 120 s/);
    expect(await long.converse(input)).toBeNull();
    expect(long.lastFailure?.()).toMatch(/next try in \d+ s/);
  });

  it("quotas are per model: a key out of quota on the primary falls through to the fallback model before the next key", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      urls.push(`${String((init?.headers as Record<string, string>)["x-goog-api-key"])}@${String(url).match(/models\/([^:]+):/)?.[1]}`);
      return String(url).includes("primary") ? quota() : reply([{ text: "From lite." }]);
    }) as typeof fetch;
    const m = geminiModel({ GEMINI_API_KEY: "key-one", GEMINI_FALLBACK_API_KEY: "key-two", AGENT_MODEL: "primary", AGENT_SMALL_MODEL: "lite" }, fetchImpl);
    const out = await m.converse(input);
    expect(out?.text).toBe("From lite.");
    expect(out?.usage.model).toBe("lite");
    expect(urls).toEqual(["key-one@primary", "key-one@lite"]);
    expect(m.name).toBe("primary");
  });

  it("names the failure when every key is out of quota, when the API errors, and when the reply is empty", async () => {
    const m429 = geminiModel(env, (async () => quota()) as typeof fetch);
    expect(await m429.converse(input)).toBeNull();
    expect(m429.lastFailure?.()).toMatch(/HTTP 429/);
    expect(await m429.converse(input)).toBeNull();
    expect(m429.lastFailure?.()).toMatch(/all keys out of quota/);

    const m500 = geminiModel(env, (async () => new Response("boom", { status: 500 })) as typeof fetch);
    expect(await m500.converse(input)).toBeNull();
    expect(m500.lastFailure?.()).toBe("HTTP 500");

    const mEmpty = geminiModel(env, (async () => new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }), { status: 200 })) as typeof fetch);
    expect(await mEmpty.converse(input)).toBeNull();
    expect(mEmpty.lastFailure?.()).toMatch(/empty reply \(SAFETY\)/);
  });

  it("is the null model when no usable key or no model id is configured", () => {
    expect(geminiModel({ AGENT_MODEL: "x" }).name).toBe("none");
    expect(geminiModel({ GEMINI_API_KEY: "REPLACE_ME", AGENT_MODEL: "x" }).name).toBe("none");
    expect(geminiModel({ GEMINI_API_KEY: "k" }).name).toBe("none");
  });
});

/**
 * Speech transcription engine.
 *
 * Primary engine: Google Gemini audio transcription (via GEMINI_API_KEY), matching the
 * original high-accuracy engine with native support for Indian languages, Latin digits,
 * and zero local Python/CUDA dependencies.
 *
 * Fallback engine: faster-whisper child process worker (scripts/transcribe_worker.py) if
 * Gemini key is not configured or cloud transcription is temporarily unavailable.
 *
 * Env: GEMINI_API_KEY, AGENT_MODEL (default "gemini-2.5-flash"), AGENT_FALLBACK_MODEL
 * (default "gemini-2.5-flash-lite"), WAPSI_PYTHON (default "python"), WAPSI_WHISPER_MODEL.
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getGeminiKeys } from "./geminiKeys";

export type TranscribeResult = { text: string; language: string | null };

type Pending = { resolve: (r: TranscribeResult) => void; reject: (e: Error) => void };

type Worker = {
  proc: ChildProcessWithoutNullStreams;
  ready: Promise<void>;
  pending: Map<number, Pending>;
  nextId: number;
  buffer: string;
  dead: boolean;
};

const REQUEST_TIMEOUT_MS = 120_000;
const READY_TIMEOUT_MS = 180_000;
const GEMINI_TIMEOUT_MS = 25_000;

// Survives Next's dev-server module reloads, so a hot reload does not leak a second model.
const g = globalThis as unknown as { __wapsiTranscriber?: Worker | null };

export function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, "");
  if (e === "wav") return "audio/wav";
  if (e === "mp3") return "audio/mp3";
  if (e === "ogg") return "audio/ogg";
  if (e === "m4a" || e === "mp4" || e === "aac") return "audio/mp4";
  return "audio/webm";
}

/**
 * Cloud transcription via Gemini: fast, multilingual across all 23 Indian languages,
 * formats numbers as Latin digits, and runs without local torch/CUDA dependencies.
 */
export async function transcribeWithGemini(input: {
  bytes: Uint8Array;
  mimeType: string;
  lang?: string | null;
}): Promise<{ ok: true; text: string; language: string | null } | { ok: false; error: string }> {
  const env = process.env;
  const keys = getGeminiKeys(env);

  if (keys.length === 0) {
    return { ok: false, error: "GEMINI_API_KEY is not configured" };
  }

  const primaryModel = env.AGENT_MODEL?.trim() || "gemini-2.5-flash";
  const fallbackModel = env.AGENT_FALLBACK_MODEL?.trim() || "gemini-2.5-flash-lite";
  const models = [primaryModel, ...(fallbackModel && fallbackModel !== primaryModel ? [fallbackModel] : [])];

  const languageCode = input.lang || "en";
  const base64Data = Buffer.from(input.bytes).toString("base64");
  const prompt = `Transcribe this recording verbatim in the language spoken (interface language code "${languageCode}"; Indian English, Hindi, Tamil and other Indian languages are likely). Write numbers with Latin digits. Reply with the transcript only; if nothing intelligible was said, reply with an empty string.`;

  let lastError = "model unavailable";

  for (const key of keys) {
    for (const model of models) {
      for (let round = 0; round < 2; round++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: input.mimeType, data: base64Data } },
                  ],
                },
              ],
              generationConfig: { maxOutputTokens: 500, temperature: 0 },
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            lastError = `HTTP ${res.status}: ${errText.slice(0, 160)}`;
            if (res.status === 503 || res.status === 429 || res.status === 500) {
              await new Promise((resolve) => setTimeout(resolve, 800 * (round + 1)));
              continue;
            }
            break;
          }

          const data = (await res.json()) as {
            candidates?: {
              content?: {
                parts?: Array<{ text?: string; thought?: boolean }>;
              };
            }[];
          };

          const text = (data.candidates?.[0]?.content?.parts ?? [])
            .filter((p) => !p.thought && p.text)
            .map((p) => p.text!)
            .join("")
            .trim();

          return { ok: true, text, language: input.lang ?? null };
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
        } finally {
          clearTimeout(timer);
        }
      }
    }
  }

  return { ok: false, error: lastError };
}

function spawnWorker(): Worker {
  const python = process.env.WAPSI_PYTHON || "python";
  // The interpreter comes from the environment, so `next build` prints one benign "dynamic filesystem
  // access" tracer warning here; a literal command would silence it but lose WAPSI_PYTHON.
  const proc = spawn(/*turbopackIgnore: true*/ python, ["scripts/transcribe_worker.py"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
    windowsHide: true,
  });
  const worker: Worker = { proc, ready: Promise.resolve(), pending: new Map(), nextId: 1, buffer: "", dead: false };

  worker.ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("transcriber_unavailable")), READY_TIMEOUT_MS);
    const fail = (why: string) => {
      clearTimeout(timer);
      worker.dead = true;
      reject(new Error(why));
    };
    proc.once("error", () => fail("transcriber_unavailable"));
    proc.once("exit", () => fail("transcriber_unavailable"));
    const onLine = (line: string) => {
      let msg: { ready?: boolean; error?: string; id?: number; text?: string; language?: string | null };
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if ("ready" in msg) {
        if (msg.ready) {
          clearTimeout(timer);
          resolve();
        } else {
          fail("transcriber_unavailable");
        }
        return;
      }
      if (typeof msg.id === "number") {
        const p = worker.pending.get(msg.id);
        if (!p) return;
        worker.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error));
        else p.resolve({ text: msg.text ?? "", language: msg.language ?? null });
      }
    };
    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => {
      worker.buffer += chunk;
      let nl = worker.buffer.indexOf("\n");
      while (nl >= 0) {
        onLine(worker.buffer.slice(0, nl).trim());
        worker.buffer = worker.buffer.slice(nl + 1);
        nl = worker.buffer.indexOf("\n");
      }
    });
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (chunk: string) => {
      if (process.env.NODE_ENV !== "production") console.warn("[transcribe]", chunk.trim().slice(0, 400));
    });
  });
  // A rejected ready promise is handled by every caller; keep Node from reporting it as unhandled meanwhile.
  worker.ready.catch(() => {});

  proc.on("exit", () => {
    worker.dead = true;
    for (const p of worker.pending.values()) p.reject(new Error("transcriber_unavailable"));
    worker.pending.clear();
    if (g.__wapsiTranscriber === worker) g.__wapsiTranscriber = null;
  });
  return worker;
}

function getWorker(): Worker {
  const cur = g.__wapsiTranscriber;
  if (cur && !cur.dead) return cur;
  const w = spawnWorker();
  g.__wapsiTranscriber = w;
  return w;
}

async function transcribeWithWorker(bytes: Uint8Array, ext: string, language: string | null): Promise<TranscribeResult> {
  const worker = getWorker();
  await worker.ready;
  const dir = await mkdtemp(path.join(tmpdir(), "wapsi-stt-"));
  const file = path.join(dir, `clip.${ext.replace(/[^a-z0-9]/gi, "") || "webm"}`);
  await writeFile(file, bytes);
  try {
    return await new Promise<TranscribeResult>((resolve, reject) => {
      const id = worker.nextId++;
      const timer = setTimeout(() => {
        worker.pending.delete(id);
        reject(new Error("timeout"));
      }, REQUEST_TIMEOUT_MS);
      worker.pending.set(id, {
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      worker.proc.stdin.write(JSON.stringify({ id, path: file, language }) + "\n");
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Post-processes a raw voice transcription using a fast lightweight LLM (gemini-2.5-flash-lite / gemini-2.5-flash).
 * Removes filler words ("um", "uh", "like", "you know", "basically", etc.), fixes spelling mistakes,
 * corrects mispronounced words or acoustic homophones (e.g. "lock" -> "lakh", "pan cord" -> "PAN card",
 * "eighty c" -> "80C", "regeem" -> "regime"), and returns clean, structured text.
 */
export async function refineTranscriptWithLlm(rawText: string, language?: string | null): Promise<string> {
  const trimmed = rawText.trim();
  if (!trimmed) return "";

  const env = process.env;
  const keys = getGeminiKeys(env);

  if (keys.length === 0) {
    return trimmed;
  }

  const smallModel = env.AGENT_FALLBACK_MODEL?.trim() || "gemini-2.5-flash-lite";
  const standardModel = env.AGENT_MODEL?.trim() || "gemini-2.5-flash";
  const models = [smallModel, ...(standardModel !== smallModel ? [standardModel] : [])];

  const systemInstruction = `You are an expert voice transcription post-processor for an Indian income tax assistant (Wapsi).
Your sole task is to transform raw voice transcriptions into clean, well-structured, clear text.

Rules:
1. REMOVE FILLER WORDS: Eliminate hesitation sounds, stuttering, repetitions, and vocal fillers (e.g. "um", "uh", "er", "ah", "like", "you know", "sort of", "actually", "basically", "matlab", "yani", "haan toh", etc.).
2. FIX SPELLINGS & MISPRONUNCIATIONS: Correct misheard words, wrong spellings, and acoustic homophones, especially financial and tax terminology (e.g., "lock"/"locks" -> "lakh", "crore", "pan cord"/"pen card" -> "PAN card", "eighty c"/"atc" -> "80C", "eighty d" -> "80D", "form sixteen" -> "Form 16", "regeem" -> "regime", "rent reset" -> "rent receipt", "challan 280", "advance tax", "TDS", "AIS", "ITR-V", etc.).
3. STRUCTURE & PUNCTUATION: Fix grammatical flow, capitalize proper nouns/acronyms (PAN, ITR, TDS, HRA), format numbers logically, and add proper punctuation (. ? ,).
4. PRESERVE INTENT & LANGUAGE: Keep the exact meaning, tone, and language of the speaker (English, Hindi, Hinglish, Tamil, Telugu, Marathi, Bengali, Gujarati, etc.). Never translate across languages unless correcting obvious acoustic misrecognition.
5. STRICT OUTPUT: Return ONLY the cleaned, structured text. Do NOT wrap in quotes, do NOT add conversational prefixes ("Here is the corrected transcript:"), and do NOT answer the question.`;

  for (const key of keys) {
    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemInstruction}\n\nInterface language: ${language || "auto"}\nRaw voice transcript:\n${trimmed}` },
                ],
              },
            ],
            generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
          }),
          signal: controller.signal,
        });

        if (!res.ok) continue;

        const data = (await res.json()) as {
          candidates?: {
            content?: {
              parts?: Array<{ text?: string; thought?: boolean }>;
            };
          }[];
        };

        let result = (data.candidates?.[0]?.content?.parts ?? [])
          .filter((p) => !p.thought && p.text)
          .map((p) => p.text!)
          .join("")
          .trim();

        if (result) {
          if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith('“') && result.endsWith('”'))) {
            result = result.slice(1, -1).trim();
          }
          return result;
        }
      } catch {
        // Fallback on next model/key
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return trimmed;
}

/**
 * Transcribe one audio clip.
 * `ext` is the container ("webm", "ogg", "m4a", "wav"); `language` is a language code or null.
 * First tries the Gemini cloud transcription engine; falls back to the faster-whisper worker.
 * Finally, runs the text through a lightweight LLM to remove filler words, fix mispronunciations,
 * and structure the transcription cleanly.
 */
export async function transcribeAudio(bytes: Uint8Array, ext: string, language: string | null): Promise<TranscribeResult> {
  const mimeType = mimeFromExt(ext);

  let rawResult: TranscribeResult;

  // 1. Primary: Gemini transcription engine
  const gemini = await transcribeWithGemini({ bytes, mimeType, lang: language });
  if (gemini.ok) {
    rawResult = { text: gemini.text, language: gemini.language };
  } else {
    // 2. Fallback: local faster-whisper worker
    try {
      rawResult = await transcribeWithWorker(bytes, ext, language);
    } catch (workerErr) {
      const workerMsg = workerErr instanceof Error ? workerErr.message : String(workerErr);
      if (gemini.error && !gemini.error.includes("not configured")) {
        throw new Error(`Gemini transcription failed: ${gemini.error}`);
      }
      throw new Error(workerMsg);
    }
  }

  // 3. Post-process through lightweight LLM to eliminate fillers, fix spellings, and structure cleanly
  if (rawResult.text.trim()) {
    const refined = await refineTranscriptWithLlm(rawResult.text, language || rawResult.language);
    return { text: refined, language: rawResult.language };
  }

  return rawResult;
}

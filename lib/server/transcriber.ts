/**
 * The bridge to the faster-whisper worker (scripts/transcribe_worker.py).
 *
 * One child process per server, started on the first request and kept warm so the model loads once;
 * requests are JSON lines over stdin/stdout, matched by id. If Python or faster-whisper is missing the
 * worker exits before saying "ready" and every caller gets `transcriber_unavailable` — the composer then
 * shows the mic as unavailable instead of a dead button.
 *
 * Env: WAPSI_PYTHON (default "python"), WAPSI_WHISPER_MODEL (default "small").
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

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

// Survives Next's dev-server module reloads, so a hot reload does not leak a second model.
const g = globalThis as unknown as { __wapsiTranscriber?: Worker | null };

function spawnWorker(): Worker {
  const python = process.env.WAPSI_PYTHON || "python";
  // The interpreter comes from the environment, so `next build` prints one benign "dynamic filesystem
  // access" tracer warning here; a literal command would silence it but lose WAPSI_PYTHON.
  const proc = spawn(python, ["scripts/transcribe_worker.py"], {
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

/** Transcribe one clip. `ext` is the container ("webm", "ogg", "m4a", "wav"); `language` a Whisper code or null for auto. */
export async function transcribeAudio(bytes: Uint8Array, ext: string, language: string | null): Promise<TranscribeResult> {
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

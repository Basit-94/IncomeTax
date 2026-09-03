/**
 * Voice fallback for when Chrome's own speech service is unreachable (its "network" error):
 * capture the microphone as 16 kHz mono PCM, stop after `silenceMs` of quiet, and hand back a
 * WAV the server can transcribe (app/api/speech). Silence is measured on the same samples,
 * so no second audio graph is needed. Browser-only.
 */

export type Recording = {
  /** Stop now and deliver what was captured. Idempotent. */
  stop(): void;
};

type RecorderOptions = {
  /** Called ~10× a second with the current level (0–1), for a meter. */
  onLevel?(level: number): void;
  /** The captured audio as a WAV file, once. */
  onDone(wav: Blob, seconds: number): void;
  /** Permission refused, no microphone, or nothing audible. */
  onError(reason: string): void;
  /** Always fires last. */
  onEnd(): void;
  silenceMs?: number;
  initialMs?: number;
  /** RMS below this counts as silence (default 0.012). */
  threshold?: number;
};

const TARGET_RATE = 16_000;
const MAX_SECONDS = 90;

function downsample(input: Float32Array, fromRate: number): Float32Array {
  if (fromRate === TARGET_RATE) return input;
  const ratio = fromRate / TARGET_RATE;
  const length = Math.floor(input.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = end > start ? sum / (end - start) : 0;
  }
  return out;
}

export function encodeWav(chunks: Float32Array[], sampleRate = TARGET_RATE): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const buffer = new ArrayBuffer(44 + total * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + total * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, total * 2, true);
  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function isRecorderSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== "undefined";
}

export async function startRecording(opts: RecorderOptions): Promise<Recording | null> {
  if (!isRecorderSupported()) return null;
  const silenceMs = opts.silenceMs ?? 3_000;
  const initialMs = opts.initialMs ?? 8_000;
  const threshold = opts.threshold ?? 0.012;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "unknown";
    opts.onError(name === "NotAllowedError" ? "not-allowed" : name === "NotFoundError" ? "audio-capture" : "start-failed");
    opts.onEnd();
    return null;
  }

  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated but universally available and needs no worklet file.
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  let heard = false;
  let lastVoice = performance.now();
  const startedAt = performance.now();
  let stopped = false;
  let samples = 0;

  const finish = () => {
    if (stopped) return;
    stopped = true;
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void context.close();
    const seconds = samples / TARGET_RATE;
    if (!heard || seconds < 0.5) opts.onError("no-speech");
    else opts.onDone(encodeWav(chunks), seconds);
    opts.onEnd();
  };

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);
    opts.onLevel?.(Math.min(1, rms * 8));
    const now = performance.now();
    if (rms >= threshold) {
      heard = true;
      lastVoice = now;
    }
    const down = downsample(input, context.sampleRate);
    chunks.push(down);
    samples += down.length;
    const quietFor = now - lastVoice;
    if ((heard && quietFor >= silenceMs) || (!heard && now - startedAt >= initialMs) || samples / TARGET_RATE >= MAX_SECONDS) finish();
  };

  source.connect(processor);
  processor.connect(context.destination);
  return { stop: finish };
}

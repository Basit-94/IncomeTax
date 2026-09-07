"""faster-whisper worker for /api/transcribe.

One long-lived process per Next.js server (spawned by lib/server/transcriber.ts): the model loads once,
then each stdin line is a request `{"id", "path", "language"}` and each stdout line a reply
`{"id", "text", "language"}` or `{"id", "error"}`. The first line is `{"ready": true, "device": ...}`.

Model: WAPSI_WHISPER_MODEL (default "small"). Device: WAPSI_WHISPER_DEVICE = auto | cuda | cpu (default
auto: CUDA float16 when a real decode works there, else CPU int8). Audio never leaves the machine — that
is the point of running Whisper here instead of the browser's hosted recognizer.
"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stdin.reconfigure(encoding="utf-8")


def emit(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def load_model():
    from faster_whisper import WhisperModel

    name = os.environ.get("WAPSI_WHISPER_MODEL", "small")
    wanted = os.environ.get("WAPSI_WHISPER_DEVICE", "auto")
    if wanted in ("auto", "cuda"):
        try:
            model = WhisperModel(name, device="cuda", compute_type="float16")
            # Constructing on CUDA can succeed while cuBLAS/cuDNN are missing; only a real decode proves it.
            import numpy as np

            list(model.transcribe(np.zeros(16000, dtype=np.float32), language="en", beam_size=1)[0])
            return model, "cuda"
        except Exception as exc:  # no usable CUDA runtime here: the CPU path is fine for short clips
            sys.stderr.write("transcribe_worker: cuda unavailable (%s); using cpu int8\n" % exc.__class__.__name__)
            if wanted == "cuda":
                raise
    return WhisperModel(name, device="cpu", compute_type="int8"), "cpu"


def main():
    try:
        model, device = load_model()
    except Exception as exc:
        emit({"ready": False, "error": "%s: %s" % (exc.__class__.__name__, exc)})
        return 1
    emit({"ready": True, "device": device, "model": os.environ.get("WAPSI_WHISPER_MODEL", "small")})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        rid = req.get("id")
        try:
            segments, info = model.transcribe(
                req["path"],
                language=req.get("language") or None,
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 400},
            )
            text = " ".join(seg.text.strip() for seg in segments).strip()
            emit({"id": rid, "text": text, "language": getattr(info, "language", None)})
        except Exception as exc:
            emit({"id": rid, "error": "%s: %s" % (exc.__class__.__name__, exc)})
    return 0


if __name__ == "__main__":
    sys.exit(main())

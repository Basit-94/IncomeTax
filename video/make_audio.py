#!/usr/bin/env python3
"""
Wapsi plan explainer - score, sound design, and master audio mix.

Everything audible except the voice is synthesised here from first principles
with NumPy; there are no samples and no external audio assets. The voice comes
from Windows SAPI via tts.ps1 (one WAV per narration line, in vo/).

What this script does, in order:

  1.  Loads each per-line SAPI WAV and trims SAPI's ~1.1 s of leading/trailing
      padding, so pacing is controlled purely by 'gapBefore' in vo-script.json.
  2.  Lays the trimmed lines out on a timeline and thereby FIXES the length of
      the film. Every scene boundary in index.html is derived from these
      numbers, which are written out to timing.json.
  3.  Synthesises the score: a slow sustained pad whose chord changes at scene
      boundaries, plus a soft low pulse (a clock, for a film about waiting).
  4.  Synthesises the UI/transition sounds, and places one only where something
      on screen actually changes state.
  5.  Mixes: voice centred and level-matched, score ~19 dB under the voice and
      ducked a further 3 dB while the voice is speaking, sound design ~10 dB
      under. Soft-limited so nothing clips.

  Output: wapsi-plan/audio/master.wav  (48 kHz, 16-bit stereo)
          timing.json                  (the derivation the composition uses)

  Run:  python make_audio.py
"""

import json
import os
import numpy as np
from scipy.io import wavfile
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
VO_DIR = os.path.join(HERE, "vo")
PROJ = os.path.join(HERE, "wapsi-plan")
AUDIO_OUT = os.path.join(PROJ, "audio")
SR = 48000

rng = np.random.default_rng(20260828)  # seeded: deterministic sound design

# ---------------------------------------------------------------- primitives


def lowpass(x, cutoff, order=4):
    b, a = signal.butter(order, cutoff / (SR / 2), btype="low")
    return signal.filtfilt(b, a, x)


def highpass(x, cutoff, order=4):
    b, a = signal.butter(order, cutoff / (SR / 2), btype="high")
    return signal.filtfilt(b, a, x)


def bandpass(x, lo, hi, order=4):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return signal.filtfilt(b, a, x)


def t_axis(dur):
    return np.arange(int(round(dur * SR))) / SR


def expdecay(dur, tau):
    return np.exp(-t_axis(dur) / tau)


def fade(x, fin=0.01, fout=0.01):
    """Click-free edges."""
    n = len(x)
    ni, no = int(fin * SR), int(fout * SR)
    y = x.copy()
    if ni > 0 and ni < n:
        y[:ni] *= np.linspace(0, 1, ni) ** 2
    if no > 0 and no < n:
        y[-no:] *= np.linspace(1, 0, no) ** 2
    return y


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def rms(x):
    return float(np.sqrt(np.mean(x**2))) if len(x) else 0.0


def db(x):
    return 10.0 ** (x / 20.0)


def add_at(buf, x, start_s, gain=1.0):
    """Sum a mono signal into a buffer at an absolute time."""
    i = int(round(start_s * SR))
    if i < 0:
        x = x[-i:]
        i = 0
    j = min(i + len(x), len(buf))
    if j > i:
        buf[i:j] += x[: j - i] * gain


# ------------------------------------------------------- 1. voice + timeline

cfg = json.load(open(os.path.join(HERE, "vo-script.json"), encoding="utf-8"))

LEAD_PAD = 0.05   # keep a sliver before the first phoneme
TAIL_PAD = 0.13   # and after the last, so consonants are not clipped


def load_trimmed(path):
    sr, data = wavfile.read(path)
    assert sr == SR, f"{path}: expected {SR} Hz, got {sr}"
    x = data.astype(np.float64) / 32768.0
    if x.ndim > 1:
        x = x.mean(axis=1)
    # 10 ms RMS envelope -> speech edges
    w = int(SR * 0.01)
    env = np.sqrt(np.convolve(x**2, np.ones(w) / w, mode="same"))
    thr = max(env.max() * 0.02, 1e-4)
    idx = np.flatnonzero(env > thr)
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(LEAD_PAD * SR))
    b = min(len(x), idx[-1] + int(TAIL_PAD * SR))
    return fade(x[a:b], 0.012, 0.02)


lines, cursor = [], 0.0
for spec in cfg["lines"]:
    seg = load_trimmed(os.path.join(VO_DIR, f"{spec['id']}.wav"))
    cursor += float(spec["gapBefore"])
    lines.append(
        {
            "id": spec["id"],
            "scene": spec["scene"],
            "text": spec["text"],
            "start": round(cursor, 3),
            "dur": round(len(seg) / SR, 3),
            "end": round(cursor + len(seg) / SR, 3),
            "_audio": seg,
        }
    )
    cursor += len(seg) / SR

TOTAL = round(cursor + float(cfg["tailSeconds"]), 3)
N = int(round(TOTAL * SR))

# Level-match the lines to each other, then lay them down.
voice = np.zeros(N)
target = np.median([rms(l["_audio"]) for l in lines])
for l in lines:
    r = rms(l["_audio"])
    g = np.clip(target / r, 0.7, 1.45) if r > 0 else 1.0
    add_at(voice, l["_audio"], l["start"], g)
voice = norm(voice, 0.80)

VOICE_RMS = rms(voice[np.abs(voice) > 1e-3])
VOICE_PEAK = float(np.max(np.abs(voice)))

# Scene extents, derived from which lines belong to which scene.
scene_ids = list(dict.fromkeys(l["scene"] for l in lines))
scenes = {}
for s in scene_ids:
    ls = [l for l in lines if l["scene"] == s]
    scenes[s] = {"first": ls[0]["start"], "lastEnd": ls[-1]["end"]}

# A scene's clip runs from a little before its first word to the start of the
# next scene's clip, so the visuals lead the narration rather than trail it.
LEADIN = 0.75
bounds = {}
for i, s in enumerate(scene_ids):
    start = 0.0 if i == 0 else max(0.0, scenes[s]["first"] - LEADIN)
    bounds[s] = start
sc = {}
for i, s in enumerate(scene_ids):
    start = bounds[s]
    end = TOTAL if i == len(scene_ids) - 1 else bounds[scene_ids[i + 1]]
    sc[s] = {"start": round(start, 3), "end": round(end, 3), "dur": round(end - start, 3)}


def T(line_id, which="start"):
    return next(l[which] for l in lines if l["id"] == line_id)


# ----------------------------------------------------------------- 2. score
#
# A slow sustained pad. Chords are low and warm; the progression is
# Dm -> Bb -> F -> Gm -> Bb -> F, changing on scene boundaries: minor while we
# are in the portal's world, major-ish once the warm-paper world arrives.

CHORDS = {
    "Dm": [73.42, 110.00, 146.83, 174.61],
    "Bb": [58.27, 87.31, 116.54, 146.83],
    "F": [87.31, 130.81, 174.61, 220.00],
    "Gm": [98.00, 146.83, 196.00, 233.08],
}
SCENE_CHORD = {"s1": "Dm", "s2": "Bb", "s3": "F", "s4": "Gm", "s5": "Bb", "s6": "F"}


def pad_voice(freqs, dur, seed):
    """Warm detuned sine stack with slow independent drift per partial."""
    r = np.random.default_rng(seed)
    t = t_axis(dur)
    out = np.zeros_like(t)
    for k, f in enumerate(freqs):
        amp = 1.0 / (1.0 + 0.85 * k)                       # tilt down the stack
        det = 1.0 + r.uniform(-0.0018, 0.0018)             # static detune
        drift = 0.0022 * np.sin(2 * np.pi * r.uniform(0.03, 0.075) * t + r.uniform(0, 7))
        ph = r.uniform(0, 2 * np.pi)
        sig = np.sin(2 * np.pi * f * det * (1 + drift) * t + ph)
        sig += 0.22 * np.sin(2 * np.pi * 2 * f * det * t + ph * 1.7)  # 2nd harmonic
        # slow breathing, never fully closing
        lfo = 0.80 + 0.20 * np.sin(2 * np.pi * r.uniform(0.045, 0.08) * t + r.uniform(0, 7))
        out += amp * sig * lfo
    out = lowpass(out, 780.0)
    return out / (np.max(np.abs(out)) + 1e-12)


XF = 1.6  # chord crossfade
pad_L = np.zeros(N)
pad_R = np.zeros(N)
for i, s in enumerate(scene_ids):
    a, b = sc[s]["start"], sc[s]["end"]
    seg_dur = (b - a) + XF
    ch = CHORDS[SCENE_CHORD[s]]
    for ch_i, buf in ((0, pad_L), (1, pad_R)):
        v = pad_voice(ch, seg_dur, seed=1000 + i * 10 + ch_i)
        v = fade(v, XF if i > 0 else 2.6, XF)
        add_at(buf, v, max(0.0, a - (XF / 2 if i > 0 else 0.0)))

# A soft low pulse - a clock, for a film about waiting.
def pulse_hit(seed=0):
    d = 0.42
    t = t_axis(d)
    sub = np.sin(2 * np.pi * 61.0 * t) * np.exp(-t / 0.085)
    body = np.sin(2 * np.pi * 183.0 * t) * np.exp(-t / 0.038) * 0.34
    x = lowpass(sub + body, 420.0)
    return fade(norm(x, 1.0), 0.004, 0.06)


PULSE_PERIOD = 1.875  # 64 bpm, every other beat
pulse = np.zeros(N)
hit = pulse_hit()
k = 0
while True:
    tt = 2.2 + k * PULSE_PERIOD
    if tt > TOTAL - 0.5:
        break
    # lay out slightly unevenly in level so it breathes rather than machines
    add_at(pulse, hit, tt, 0.82 + 0.18 * ((k % 4) == 0))
    k += 1

# --------------------------------------------------- 3. UI / transition sound


def sfx_stamp():
    """Rubber stamp landing: dry percussive slap + low thump."""
    d = 0.34
    t = t_axis(d)
    click = highpass(rng.normal(0, 1, len(t)), 1800.0) * np.exp(-t / 0.011)
    body = bandpass(rng.normal(0, 1, len(t)), 240.0, 1400.0) * np.exp(-t / 0.028)
    thump = np.sin(2 * np.pi * 68.0 * t) * np.exp(-t / 0.075)
    return fade(norm(0.55 * click + 0.7 * body + 0.9 * thump), 0.001, 0.05)


def sfx_tear():
    """Paper tear / slide - the before-to-after transition. Not a software swoosh."""
    d = 0.40
    t = t_axis(d)
    n = rng.normal(0, 1, len(t))
    # ragged fibre texture: amplitude modulated by low-rate seeded noise
    grain = np.interp(t, np.linspace(0, d, 70), rng.uniform(0.35, 1.0, 70))
    body = bandpass(n, 900.0, 6200.0) * grain
    env = np.minimum(1.0, t / 0.035) * np.exp(-t / 0.135)
    low = lowpass(rng.normal(0, 1, len(t)), 300.0) * np.exp(-t / 0.10) * 0.5
    return fade(norm(body * env + low), 0.002, 0.07)


def sfx_thud():
    """Something bureaucratic lands in front of you. Dull, closed, no sparkle."""
    d = 0.55
    t = t_axis(d)
    x = (
        np.sin(2 * np.pi * 88.0 * t) * np.exp(-t / 0.10)
        + 0.55 * np.sin(2 * np.pi * 58.0 * t) * np.exp(-t / 0.16)
        + 0.16 * bandpass(rng.normal(0, 1, len(t)), 150.0, 900.0) * np.exp(-t / 0.022)
    )
    return fade(norm(lowpass(x, 520.0)), 0.002, 0.10)


def sfx_tick():
    """One step of the state machine resolving. Very small."""
    d = 0.10
    t = t_axis(d)
    x = np.sin(2 * np.pi * 1180.0 * t) * np.exp(-t / 0.017)
    x += 0.3 * np.sin(2 * np.pi * 1770.0 * t) * np.exp(-t / 0.010)
    x += 0.12 * highpass(rng.normal(0, 1, len(t)), 3000.0) * np.exp(-t / 0.005)
    return fade(norm(x), 0.001, 0.03)


def sfx_confirm():
    """'Yes, that's right.' A quiet institutional-green two-note, not a game chime."""
    d = 0.46
    t = t_axis(d)
    out = np.zeros_like(t)
    for f, off in ((587.33, 0.0), (880.00, 0.085)):
        seg = np.sin(2 * np.pi * f * (t - off)) + 0.18 * np.sin(2 * np.pi * 2 * f * (t - off))
        e = np.where(t >= off, np.exp(-(t - off) / 0.11) * np.minimum(1.0, (t - off) / 0.008), 0.0)
        out += seg * e
    return fade(norm(lowpass(out, 4200.0)), 0.002, 0.08)


def sfx_release():
    """The hold clears and the money moves. Warm rising three-note."""
    d = 0.72
    t = t_axis(d)
    out = np.zeros_like(t)
    for f, off in ((293.66, 0.0), (440.00, 0.10), (587.33, 0.20)):
        seg = np.sin(2 * np.pi * f * (t - off)) + 0.22 * np.sin(2 * np.pi * 3 * f * (t - off))
        e = np.where(t >= off, np.exp(-(t - off) / 0.19) * np.minimum(1.0, (t - off) / 0.010), 0.0)
        out += seg * e
    return fade(norm(lowpass(out, 3600.0)), 0.002, 0.11)


def sfx_swipe():
    """Language switch. Airy, quick, a sheet moving across."""
    d = 0.34
    t = t_axis(d)
    n = rng.normal(0, 1, len(t))
    sweep = np.zeros_like(t)
    # crude time-varying bandpass via three overlapping fixed bands
    for lo, hi, c in ((600, 2000, 0.0), (1500, 4500, 0.11), (3000, 8000, 0.20)):
        e = np.exp(-((t - c - 0.06) ** 2) / (2 * 0.055**2))
        sweep += bandpass(n, lo, hi) * e
    env = np.minimum(1.0, t / 0.02) * np.exp(-t / 0.15)
    return fade(norm(sweep * env), 0.002, 0.06)


SFX = {
    "stamp": sfx_stamp(),
    "tear": sfx_tear(),
    "thud": sfx_thud(),
    "tick": sfx_tick(),
    "confirm": sfx_confirm(),
    "release": sfx_release(),
    "swipe": sfx_swipe(),
}

# Cues. One per on-screen state change, and nowhere else.
# Times are anchored to narration so picture and sound cannot drift apart.
CUES = [
    ("stamp", T("l01") + 0.30, 0.85),        # PROTOTYPE stamp lands on the cover
    ("tick", T("l01", "end") + 0.10, 0.55),  # the three ledger figures
    ("tick", T("l01", "end") + 0.28, 0.55),
    ("tick", T("l01", "end") + 0.46, 0.55),
    ("thud", T("l03") - 0.18, 1.00),         # 'Something went wrong' modal lands
    ("tear", T("l05") + 1.85, 0.95),         # ...dissolves into the real error
    ("tick", T("l05") + 2.55, 0.50),         # the offending field is named
    ("thud", sc["s3"]["start"] + 0.20, 0.55),   # cramped form row presses in
    ("tear", T("l08", "end") + 0.12, 0.95),  # form row tears into the warm card
    ("confirm", T("l08", "end") + 0.72, 0.80),  # Yes / No appear
    ("swipe", T("l10") + 1.55, 0.85),        # -> Hindi
    ("swipe", T("l10") + 3.35, 0.85),        # -> Tamil
    ("thud", T("l11") + 0.55, 0.90),         # 'Under processing' + spinner
    ("tear", T("l13") + 0.55, 0.95),         # spinner expands to the state machine
]
# the seven steps resolving, one tick each
for i in range(7):
    CUES.append(("tick", T("l13") + 1.05 + i * 0.30, 0.50))
CUES += [
    ("tick", T("l14", "end") + 0.15, 0.62),  # the named hold
    ("release", T("l15", "end") + 0.25, 0.95),  # the button that releases it
    ("thud", sc["s5"]["start"] + 0.25, 0.60),   # the notice, in law
    ("tear", T("l16", "end") + 0.15, 0.95),  # ...decoded
    ("tick", T("l17") + 4.20, 0.55),         # the deadline, in money and days
    ("confirm", sc["s6"]["start"] + 0.55, 0.80),  # 'You owe nothing.'
    ("stamp", T("l20") - 0.55, 0.95),        # final stamp
]

sfxbuf = np.zeros(N)
for name, when, g in CUES:
    add_at(sfxbuf, SFX[name], when, g)

# ------------------------------------------------------------------ 4. mix

# Score sits ~19 dB under the voice, ducked a further 3 dB while she speaks.
speaking = np.zeros(N)
for l in lines:
    a = int(max(0, (l["start"] - 0.25) * SR))
    b = int(min(N, (l["end"] + 0.35) * SR))
    speaking[a:b] = 1.0
# smooth the duck so it is inaudible as an effect
duck_env = lowpass(speaking, 2.5)
duck = db(-19.0) * (1.0 - duck_env * (1.0 - db(-3.0)))

pad_mix_L = pad_L * (VOICE_RMS / (rms(pad_L) + 1e-12)) * duck
pad_mix_R = pad_R * (VOICE_RMS / (rms(pad_R) + 1e-12)) * duck
pulse_mix = pulse * (VOICE_PEAK / (np.max(np.abs(pulse)) + 1e-12)) * db(-26.0)
sfx_mix = sfxbuf * (VOICE_PEAK / (np.max(np.abs(sfxbuf)) + 1e-12)) * db(-10.0)

# Voice dead centre; the pad carries all the width.
L = voice + pad_mix_L + pulse_mix + sfx_mix
R = voice + pad_mix_R + pulse_mix + sfx_mix

# Gentle high-shelf-ish cleanup: nothing below 35 Hz, and a whole-mix ceiling.
L = highpass(L, 32.0)
R = highpass(R, 32.0)


def soft_limit(x, ceiling=0.94, knee=0.72):
    """Smooth compression of everything above the knee. No hard clipping."""
    a = np.abs(x)
    over = a > knee
    y = x.copy()
    head = ceiling - knee
    y[over] = np.sign(x[over]) * (knee + head * np.tanh((a[over] - knee) / head))
    return y


L, R = soft_limit(L), soft_limit(R)
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
if peak > 0.97:
    L *= 0.97 / peak
    R *= 0.97 / peak

os.makedirs(AUDIO_OUT, exist_ok=True)
stereo = np.stack([L, R], axis=1)
wavfile.write(
    os.path.join(AUDIO_OUT, "master.wav"),
    SR,
    (np.clip(stereo, -1.0, 1.0) * 32767.0).astype(np.int16),
)

# ---------------------------------------------------------- 5. timing.json

timing = {
    "note": "Generated by make_audio.py. index.html's scene and beat times are derived from these numbers - regenerate this before changing composition timings.",
    "voice": cfg["voice"],
    "rate": cfg["rate"],
    "sampleRate": SR,
    "total": TOTAL,
    "fps": 30,
    "scenes": sc,
    "lines": [{k: v for k, v in l.items() if k != "_audio"} for l in lines],
    "cues": [{"sfx": n, "t": round(w, 3), "gain": g} for n, w, g in sorted(CUES, key=lambda c: c[1])],
}
json.dump(timing, open(os.path.join(HERE, "timing.json"), "w", encoding="utf-8"), indent=2)

# ------------------------------------------------------------------ report

print(f"voice          : {cfg['voice']}  (rate {cfg['rate']})")
print(f"speech         : {sum(l['dur'] for l in lines):.2f} s over {len(lines)} lines")
print(f"TOTAL DURATION : {TOTAL:.3f} s   ({TOTAL * 30:.1f} frames @30fps)")
print(f"voice rms/peak : {20 * np.log10(VOICE_RMS):.1f} dB / {20 * np.log10(VOICE_PEAK):.1f} dBFS")
print(f"score rel voice: -19 dB (gaps) / -22 dB (under speech)")
print(f"master peak    : {20 * np.log10(max(np.max(np.abs(L)), np.max(np.abs(R)))):.2f} dBFS")
print(f"sfx cues       : {len(CUES)}")
print("\nscene            start      end      dur")
for s in scene_ids:
    print(f"  {s:<6} {sc[s]['start']:>9.2f}{sc[s]['end']:>9.2f}{sc[s]['dur']:>9.2f}")
print("\nline   scene    start      end")
for l in lines:
    print(f"  {l['id']}   {l['scene']:<5}{l['start']:>8.2f} {l['end']:>8.2f}   {l['text'][:54]}")

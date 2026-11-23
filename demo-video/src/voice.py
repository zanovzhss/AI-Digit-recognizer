#!/usr/bin/env python3
"""Kazakh voice-over for the demo video.

1. Synthesises every line of src/narration.json with Piper (offline, kk_KZ-issai-high).
2. Plans the timing: each line starts at its scene time; if a line would run past its
   deadline, the video gets an extra still hold at `pauseAt` (the speech is never sped up).
3. Writes out/voice/plan.json (pauses + exact start time of each line) and
   out/voice/voice_track.wav (all lines placed on one track, mono, model sample rate).

Usage:
  python src/voice.py --model /path/kk_KZ-issai-high.onnx
  python src/voice.py --dry            # pipeline test without a model: durations estimated
"""
import argparse
import json
import os
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "voice"


def synth_all(segments, model, length_scale, dry, speaker_id=None):
    OUT.mkdir(parents=True, exist_ok=True)
    clips = {}
    if dry:
        sr = 22050
        for s in segments:
            dur = len(s["text"]) / 13.5  # rough Kazakh TTS rate, for testing only
            t = np.arange(int(dur * sr)) / sr
            clips[s["id"]] = (0.05 * np.sin(2 * np.pi * 220 * t)).astype(np.float32)
        return clips, sr
    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(model)
    cfg = SynthesisConfig(speaker_id=speaker_id, length_scale=length_scale, normalize_audio=True)
    sr = voice.config.sample_rate
    # Piper adds random noise, so every synthesis differs slightly: keep finished clips and
    # only synthesise lines whose text (or voice settings) changed.
    cache_file = OUT / "cache.json"
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    for s in segments:
        path = OUT / f"{s['id']}.wav"
        key = f"{speaker_id}|{length_scale}|{s['text']}"
        if cache.get(s["id"]) != key or not path.exists():
            with wave.open(str(path), "wb") as wf:
                voice.synthesize_wav(s["text"], wf, syn_config=cfg)
            cache[s["id"]] = key
    cache_file.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
    for s in segments:
        path = OUT / f"{s['id']}.wav"
        with wave.open(str(path), "rb") as wf:
            pcm = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        clips[s["id"]] = trim(pcm, sr)
    return clips, sr


def trim(x, sr, thr=0.004):
    """Remove leading/trailing silence so the planned start is the audible start."""
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * sr))
    b = min(len(x), idx[-1] + int(0.06 * sr))
    return x[a:b]


def plan(segments, clips, sr, gap, base_duration):
    pauses = []

    def mapt(t):
        return t + sum(p["dur"] for p in pauses if p["at"] <= t + 1e-9)

    out, prev_end = [], 0.0
    for s in segments:
        dur = len(clips[s["id"]]) / sr
        start = mapt(s["at"])
        if start < prev_end + gap:  # never overlap the previous line
            need = prev_end + gap - start
            pauses.append({"at": s["at"] - 0.01, "dur": round(need, 3), "why": f"before {s['id']}"})
            start = mapt(s["at"])
        end = start + dur
        dl = mapt(s["deadline"])
        if end + gap > dl:
            need = end + gap - dl
            assert s["at"] < s["pauseAt"] <= s["deadline"] + 1e-9, s["id"]
            pauses.append({"at": s["pauseAt"], "dur": round(need, 3), "why": f"after {s['id']}"})
        out.append({"id": s["id"], "start": round(start, 3), "dur": round(dur, 3), "end": round(end, 3), "text": s["text"]})
        prev_end = end
    total = mapt(base_duration)
    return pauses, out, total


def write_track(lines, clips, sr, total):
    buf = np.zeros(int(round(total * sr)) + sr, dtype=np.float32)
    for ln in lines:
        x = clips[ln["id"]]
        i = int(round(ln["start"] * sr))
        buf[i:i + len(x)] += x
    buf = buf[: int(round(total * sr))]
    pcm = (np.clip(buf, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT / "voice_track.wav"), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--base", type=float, default=160.0, help="duration of the silent timeline")
    a = ap.parse_args()
    nar = json.loads((ROOT / "src" / "narration.json").read_text())
    segs = nar["segments"]
    clips, sr = synth_all(segs, a.model, nar["voice"]["length_scale"], a.dry, nar["voice"].get("speaker_id"))
    pauses, lines, total = plan(segs, clips, sr, nar["voice"]["gap"], a.base)
    write_track(lines, clips, sr, total)
    speech = sum(l["dur"] for l in lines)
    result = {"dry": a.dry, "sample_rate": sr, "duration": round(total, 3), "speech_seconds": round(speech, 2),
              "pauses": pauses, "lines": lines}
    (OUT / "plan.json").write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(f"total {total:.2f}s  speech {speech:.1f}s  pauses {sum(p['dur'] for p in pauses):.2f}s in {len(pauses)} holds")
    for p in pauses:
        print(f"  hold +{p['dur']:.2f}s at {p['at']:.2f} ({p['why']})")


if __name__ == "__main__":
    main()

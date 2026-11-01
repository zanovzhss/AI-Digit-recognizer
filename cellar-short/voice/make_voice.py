# Narration for "The Warm Bucket": Piper TTS (en_US ryan high), one steady tone, word timings from Piper's
# phoneme alignments. Writes voice.wav (48 kHz mono) and words.json ([{w, s, e}] seconds on the video timeline).
import json, sys, wave
import numpy as np
from scipy import signal
from piper import PiperVoice, SynthesisConfig

TEXT = "He put a bucket of water in his cellar so his potatoes wouldn't freeze. Freezing water gives off heat — just enough to save them."
LEN = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0   # length_scale (bigger = slower)
LEAD = 0.12                                               # seconds of silence before the first word

voice = PiperVoice.load("model/en_US-ryan-high.onnx", include_alignments=True)
cfg = SynthesisConfig(length_scale=LEN, noise_scale=0.5, noise_w_scale=0.6)
sr = voice.config.sample_rate
audio, phones = [], []
t = 0.0
for ch in voice.synthesize(TEXT, cfg, include_alignments=True):
    a = ch.audio_int16_array.astype(np.float32) / 32768
    for al in ch.phoneme_alignments or []:
        d = al.num_samples / sr
        phones.append((al.phoneme, t, t + d)); t += d
    audio.append(a); t = sum(len(x) for x in audio) / sr
x = np.concatenate(audio)
print("sr", sr, "dur", len(x) / sr, "phones", len(phones))
json.dump([[p, round(s, 4), round(e, 4)] for p, s, e in phones], open("phones.json", "w"), ensure_ascii=False)
y = signal.resample_poly(x, 48000, sr) if sr != 48000 else x
y = np.concatenate([np.zeros(int(LEAD * 48000)), y])
pk = np.max(np.abs(y)); y = y / pk * 0.89
with wave.open("voice.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print("voice.wav", len(y) / 48000)

# ---- words.json: phoneme groups split on spaces, offset by LEAD; silences (^ $ . ;) trimmed off the words ----
WORDS = TEXT.replace("—", "").split()
groups, cur = [], []
for p, s, e in phones:
    if p in ("^", "$"):
        if cur: groups.append(cur); cur = []
        continue
    if p == " ":
        if cur: groups.append(cur); cur = []
        continue
    if p in (".", ";", ",", "!", "?"): continue
    cur.append((s, e))
if cur: groups.append(cur)
assert len(groups) == len(WORDS), (len(groups), len(WORDS))
out = [{"w": w.strip(".,"), "s": round(g[0][0] + LEAD, 3), "e": round(g[-1][1] + LEAD, 3)} for w, g in zip(WORDS, groups)]
json.dump(out, open("words.json", "w"), indent=1)
for o in out: print(f'{o["w"]:>10} {o["s"]:.3f} {o["e"]:.3f}  f{o["s"]*30:.1f}')

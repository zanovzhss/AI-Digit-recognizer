# words.json from voice.wav, forced to the approved script (stone short).
# faster-whisper (small.en, CPU int8) gives word timestamps; the script's own words are matched to them by sequence
# alignment on normalized spellings ("1896" ~ "eighteen ninety-six"). Script words with no match get times
# interpolated between their matched neighbours. Output: [{w, s, e}] where w is the script word (seconds in voice.wav).
# Usage: python align.py voice.wav script.txt words.json [heard.json]
import json, re, subprocess, sys, difflib
import numpy as np
from faster_whisper import WhisperModel

wav, scr, outp = sys.argv[1:4]
heard_out = sys.argv[4] if len(sys.argv) > 4 else None
pcm = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                   capture_output=True, check=True).stdout, np.float32)
m = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=8)
prompt = open(scr, encoding="utf-8").read()
segs, _ = m.transcribe(pcm, word_timestamps=True, language="en", beam_size=5, initial_prompt=prompt[:400])
hw = [(w.word.strip(), w.start, w.end, w.probability) for s in segs for w in s.words]
if heard_out:
    json.dump([{"w": w, "s": round(s, 3), "e": round(e, 3), "p": round(p, 3)} for w, s, e, p in hw],
              open(heard_out, "w", encoding="utf-8"), indent=1)

NUM = {"1896": "eighteenninetysix", "1933": "nineteenthirtythree", "2011": "twentyeleven",
       "twothousandeleven": "twentyeleven", "11": "eleven", "80": "eighty", "2": "two", "4": "four", "300": "threehundred"}


def norm(t):
    t = t.lower().replace(",", "").replace("’", "'")
    t = re.sub(r"[^a-z0-9']", "", t.replace("-", ""))
    return NUM.get(t, t)


script = prompt.split()
H = [norm(w) for w, _, _, _ in hw]
S = [norm(w) for w in script]
sm = difflib.SequenceMatcher(None, S, H, autojunk=False)
times = [None] * len(script)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): times[i1 + k] = (hw[j1 + k][1], hw[j1 + k][2])
    elif tag == "replace":
        a, b = hw[j1][1], hw[j2 - 1][2]
        n = i2 - i1
        for k in range(n): times[i1 + k] = (a + (b - a) * k / n, a + (b - a) * (k + 1) / n)
miss = [i for i, t in enumerate(times) if t is None]
for i in miss:
    lo = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
    hi = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), lo + 0.3)
    times[i] = (lo, max(lo + 0.05, hi))

out = [{"w": w, "s": round(float(s), 3), "e": round(float(e), 3)} for w, (s, e) in zip(script, times)]
json.dump(out, open(outp, "w", encoding="utf-8"), indent=1)
print(len(out), "script words;", len(hw), "heard;", len(miss), "interpolated; matched ratio %.3f" % sm.ratio())
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag != "equal": print(tag, script[i1:i2], [h[0] for h in hw[j1:j2]])
print(" ".join(f"{o['w']}@{o['s']}" for o in out))

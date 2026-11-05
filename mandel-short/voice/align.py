# words.json from voice.wav, forced to the approved script.
# faster-whisper (small.en, CPU int8) gives word timestamps; the script's own words are matched to them by sequence
# alignment on normalized spellings ("1960s" ~ "nineteen sixties", "twenty-seven" ~ "27"). Script words with no match
# get times interpolated between their matched neighbours. Output: [{w, s, e, cap}] where w is the script word and cap
# is the caption text (numbers as digits).
# Usage: python align.py voice.wav script.txt words.json
import json, re, subprocess, sys, difflib
import numpy as np
from faster_whisper import WhisperModel

wav, scr, outp = sys.argv[1:4]
pcm = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                   capture_output=True, check=True).stdout, np.float32)
m = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=8)
prompt = open(scr, encoding="utf-8").read()
segs, _ = m.transcribe(pcm, word_timestamps=True, language="en", beam_size=5)
hw = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]

NUM = {"0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight",
       "9": "nine", "10": "ten", "12": "twelve", "14": "fourteen", "27": "twentyseven", "1960s": "nineteensixties",
       "1992": "nineteenninetytwo", "60s": "sixties"}


def norm(t):
    t = t.lower().replace("$", "").replace(",", "")
    t = re.sub(r"[^a-z0-9']", "", t.replace("-", ""))
    return NUM.get(t, t)


script = [w for w in prompt.split()]
# hyphenated numbers are one spoken unit in the script but may be two whisper words: join whisper "twenty" "seven"
H = [norm(w) for w, _, _ in hw]
S = [norm(w) for w in script]
sm = difflib.SequenceMatcher(None, S, H, autojunk=False)
times = [None] * len(script)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): times[i1 + k] = (hw[j1 + k][1], hw[j1 + k][2])
    elif tag == "replace":
        # spread the whisper span over the script span
        a, b = hw[j1][1], hw[j2 - 1][2]
        n = i2 - i1
        for k in range(n): times[i1 + k] = (a + (b - a) * k / n, a + (b - a) * (k + 1) / n)
miss = [i for i, t in enumerate(times) if t is None]
for i in miss:
    lo = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
    hi = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), lo + 0.3)
    times[i] = (lo, max(lo + 0.05, hi))

def cap(w, nxt):
    c = w
    if w.lower().strip(",.?") == "fourteen": c = "14"
    elif w.lower().strip(",.") == "twelve": c = "12" + w[len("twelve"):] if w.lower().startswith("twelve") else "12"
    elif w == "twenty-seven": c = "$27"
    elif w == "seven" and nxt.startswith("million"): c = "7"
    elif w == "one" and nxt.startswith("dollar"): c = "$1"
    elif w == "three" and nxt.startswith("days"): c = "3"
    return c


out = []
for i, (w, (s, e)) in enumerate(zip(script, times)):
    nxt = script[i + 1] if i + 1 < len(script) else ""
    out.append({"w": w, "s": round(float(s), 3), "e": round(float(e), 3), "cap": cap(w, nxt)})
# "twenty-seven million dollars" -> the caption shows "$27 million" and drops "dollars"
for i, o in enumerate(out):
    if o["w"] == "dollars," and i >= 2 and out[i - 2]["w"] == "twenty-seven": o["cap"] = ""
json.dump(out, open(outp, "w", encoding="utf-8"), indent=1)
print(len(out), "script words;", len(hw), "heard;", len(miss), "interpolated")
print("matched ratio %.3f" % sm.ratio())
print(" ".join(f"{o['w']}@{o['s']}" for o in out))

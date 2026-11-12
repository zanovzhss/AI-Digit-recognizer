# Hand corrections to the forced alignment (words_raw.json -> words.json).
# Every fix below was read off the voice.wav waveform (10 ms energy + voicing + high-frequency map, see REPORT.md):
# whisper puts a word's start too early after a breath or a pause, and it hallucinated a few words at 0.0-0.5 s.
# Usage: python fix_words.py words_raw.json words.json
import json, sys

src, dst = sys.argv[1:3]
w = json.load(open(src, encoding="utf-8"))

# (unused index, script word, new start s, new end s or None to keep); the word is found as the nearest
# occurrence of that spelling to the new start (all fixes move a word by < 1 s)
FIX = [
    (0, "A", 0.08, 0.14),
    (1, "stone", 0.14, 0.50),
    (2, "in", 0.50, 0.60),
    (17, "below", 4.60, 4.84),
    (18, "this", 4.84, 5.04),
    (19, "point.", 5.04, 5.40),
    (20, "You", 5.87, 5.97),
    (21, "see,", 5.97, 6.18),
    (22, "in", 6.40, 6.52),
    (23, "1896,", 6.54, 7.53),
    (36, "Then,", 13.34, 13.70),
    (37, "in", 13.94, 14.04),
    (46, "Four", 16.58, 16.78),
    (47, "survivors.", 16.78, 17.30),
    (63, "eighty", 21.86, 22.04),
    (69, "Towns", 23.74, 24.04),
    (70, "grow", 24.04, 24.32),
    (105, "But", 33.12, 33.24),
    (125, "in", 38.40, 38.50),
    (126, "2011,", 38.50, 39.22),
    (149, "Aneyoshi...", 48.08, 48.72),
    (150, "and", 49.02, 49.14),
    (151, "stops", 49.14, 49.52),
    (153, "three", 50.02, 50.16),
    (154, "hundred", 50.16, 50.40),
    (155, "feet", 50.42, 50.60),
    (156, "below", 50.66, 51.00),
    (159, "Every", 51.97, 52.30),
]
for _, word, s, e in FIX:
    cand = [k for k, o in enumerate(w) if o["w"] == word]
    i = min(cand, key=lambda k: abs(w[k]["s"] - s))
    assert abs(w[i]["s"] - s) < 1.0, (word, w[i], s)
    w[i]["s"] = s
    if e is not None: w[i]["e"] = e
# keep times monotonic
for i in range(1, len(w)):
    assert w[i]["s"] >= w[i - 1]["s"] - 1e-6, (i, w[i - 1], w[i])
json.dump(w, open(dst, "w", encoding="utf-8"), indent=1)
KEY = ["below", "point.", "1896,", "1933,", "2011,", "stops", "standing."]
for o in w:
    if o["w"] in KEY: print(f"{o['w']:>12} s={o['s']:.2f}  frame={o['s'] * 30:.1f}")

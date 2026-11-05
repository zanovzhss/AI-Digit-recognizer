# Word timings for the study videos (faster-whisper, CPU int8). Output stays in gitignored frames/<key>/words.json.
# Usage: python -I research/ricks/tools/words.py <raw_dir> <frames_dir> [extra.mp4 ...]
import json, os, sys, glob
from faster_whisper import WhisperModel
import subprocess, numpy as np

def pcm(f):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(b, np.float32)

raw, frames = sys.argv[1], sys.argv[2]
m = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=8)
for f in sorted(glob.glob(os.path.join(raw, "*.mp4"))) + sys.argv[3:]:
    k = os.path.splitext(os.path.basename(f))[0]
    d = os.path.join(frames, k); os.makedirs(d, exist_ok=True)
    o = os.path.join(d, "words.json")
    if os.path.exists(o): continue
    segs, _ = m.transcribe(pcm(f), word_timestamps=True, language="en")
    w = [dict(w=x.word.strip(), s=round(x.start, 3), e=round(x.end, 3)) for s in segs for x in s.words]
    json.dump(w, open(o, "w"), indent=0)
    print(k, len(w), "words", flush=True)

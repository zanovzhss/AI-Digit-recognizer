# words.json from voice.wav: faster-whisper word timestamps (seconds), [{w, s, e}]
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2] if len(sys.argv) > 2 else "small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(sys.argv[1], word_timestamps=True, language="en", beam_size=5)
out = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, open(sys.argv[1].replace("voice.wav", "words.json"), "w"), indent=1)
print(" ".join(f"{o['w']}@{o['s']}" for o in out))

# words.json from voice.wav: forced alignment of the known script with pocketsphinx's bundled en-us model
# (Hugging Face model downloads are blocked in this environment). Output [{w, s, e}] in seconds.
import json, subprocess, sys
from pocketsphinx import Decoder
wav, text = sys.argv[1], open(sys.argv[2]).read().split()
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
d = Decoder(samprate=16000, bestpath=False)
d.set_align_text(" ".join(text))
d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
out = [{"w": s.word, "s": round(s.start_frame / 100, 3), "e": round((s.end_frame + 1) / 100, 3)} for s in d.seg() if s.word not in ("<s>", "</s>", "<sil>", "[NOISE]")]
print(len(out), "of", len(text))
json.dump(out, open(sys.argv[3], "w"), indent=1)
print(" ".join(f"{o['w']}@{o['s']}" for o in out))

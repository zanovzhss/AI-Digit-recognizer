# Rule 6 QA: no single flat colour may cover more than 35 % of the frame.
# Every `step`-th frame is scaled to 135x240, lightly blurred (2x2 box) so ink lines and noise do not split a flat area,
# quantized to 16 levels per channel; the largest colour bin's share of the frame must stay <= 35 %.
# usage: python -I mandel-short/tools/qa_flat.py video.mp4 [step=5] [limit=0.35]
import subprocess, sys
import numpy as np

src = sys.argv[1]; step = int(sys.argv[2]) if len(sys.argv) > 2 else 5; limit = float(sys.argv[3]) if len(sys.argv) > 3 else 0.35
W, H = 135, 240
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"select='not(mod(n\\,{step}))',scale={W}:{H}:flags=area", "-fps_mode", "passthrough",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
worst, fails = (0.0, -1, ""), []
for k, im in enumerate(F):
    b = (im[:-1, :-1] + im[1:, :-1] + im[:-1, 1:] + im[1:, 1:]) / 4
    q = (b // 16).astype(np.int32)
    key = q[..., 0] * 256 + q[..., 1] * 16 + q[..., 2]
    cnt = np.bincount(key.ravel(), minlength=4096)
    top = int(cnt.argmax()); share = cnt[top] / key.size
    hexc = "#%02x%02x%02x" % tuple(int(v * 16 + 8) for v in (top // 256, (top // 16) % 16, top % 16))
    if share > worst[0]: worst = (share, k * step, hexc)
    if share > limit: fails.append((k * step, round(share, 3), hexc))
print(f"frames checked: {len(F)} (every {step}th); largest flat colour: {worst[0]*100:.1f}% at frame {worst[1]} ({worst[2]}); limit {limit*100:.0f}%")
print("PASS" if not fails else f"FAIL on {len(fails)} frames: {fails[:12]}")
sys.exit(0 if not fails else 1)

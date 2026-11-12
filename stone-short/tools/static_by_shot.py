# Static frames per shot (the measure.py definition: mean |luma diff| < 1 at 54x96), the total %, and static frames in
# the first 5 s. usage: python stone-short/tools/static_by_shot.py video.mp4
import subprocess, sys
import numpy as np
W, H = 54, 96
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
Y = F @ np.array([.299, .587, .114], np.float32)
d = np.r_[0, np.abs(Y[1:] - Y[:-1]).mean((1, 2))]
B = [0, 194, 319, 350, 398, 458, 533, 583, 635, 756, 805, 854, 938, 992, 1088, 1134, 1182, 1228, 1329, 1400, 1469, 1557, len(d)]
for i in range(len(B) - 1):
    s = d[B[i]:B[i + 1]]
    print(f"shot {i + 1:2d} {B[i]:4d}-{B[i + 1]:4d}  median diff {np.median(s):5.2f}  static {(s < 1).sum():3d} ({100 * (s < 1).mean():4.1f} %)")
print(f"TOTAL static {(d < 1).sum()} frames = {100 * (d < 1).mean():.1f} %   first 5 s: {(d[1:150] < 1).sum()} static frames   median diff {np.median(d):.2f}")

# Sharpness check (the project's ice-short convention): every frame scaled to 360x640 grey, mean |Laplacian| (4-neighbour)
# per frame; reports the mean over frames and the 10th percentile, plus the softest frames.
# usage: python sharpness.py video.mp4
import subprocess, sys, json
import numpy as np

W, H = 360, 640
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                     capture_output=True).stdout
Y = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
lap = np.abs(4 * Y[:, 1:-1, 1:-1] - Y[:, :-2, 1:-1] - Y[:, 2:, 1:-1] - Y[:, 1:-1, :-2] - Y[:, 1:-1, 2:]).mean((1, 2))
r = dict(frames=len(lap), mean=round(float(lap.mean()), 2), p10=round(float(np.percentile(lap, 10)), 2), min=round(float(lap.min()), 2))
print(json.dumps(r))
order = np.argsort(lap)[:12]
print("softest frames:", [(int(i), round(float(lap[i]), 2)) for i in order])

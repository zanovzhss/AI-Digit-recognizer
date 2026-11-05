# Section 8 measurements for a MandelShort clip next to the reference targets (research/ricks/STYLE_REFERENCE.md):
# measure.py (the project's own), sub-pixel camera motion (research/ricks/tools/motion.py: pan px/f at 1080 wide,
# zoom %/f), and colour / detail from the frames (mean HSV saturation, strong-gradient share at 135x240).
# usage: python -I mandel-short/tools/measure_clip.py clip.mp4 out_dir  -> prints a markdown table, writes measure.md
import json, os, subprocess, sys
import numpy as np

root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
py = sys.executable
m = json.loads(subprocess.run([py, os.path.join(root, "measure.py"), src], capture_output=True, text=True, check=True).stdout)
subprocess.run([py, "-I", os.path.join(root, "research", "ricks", "tools", "motion.py"), src, out], check=True, capture_output=True)
mo = np.load(os.path.join(out, "motion.npz"))
sp, zm = np.minimum(np.hypot(mo["dx"], mo["dy"]), 200), mo["zoom"]
moving = (sp >= 3) | (np.abs(zm) >= 0.35)


def runs(mask):
    o, s = [], None
    for i, v in enumerate(mask):
        if v and s is None: s = i
        if not v and s is not None: o.append(i - s); s = None
    if s is not None: o.append(len(mask) - s)
    return o


holds = [n for n in runs(~moving) if n >= 4]
hp = zm[~moving & (zm > 0.02)]
W, H = 135, 240
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"select='not(mod(n\\,3))',scale={W}:{H}:flags=area", "-fps_mode", "passthrough",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32) / 255
mx, mn = F.max(3), F.min(3)
sat = float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0).mean())
Y = F @ np.array([.299, .587, .114])
g = np.abs(np.diff(Y, axis=1))[:, :, :-1] + np.abs(np.diff(Y, axis=2))[:, :-1]
edge = float((g > .12).mean())
rows = [
    ("medDiff (measure.py)", m["medDiff"], "4-5.5", "4.68"),
    ("staticPct (measure.py)", m["staticPct"], "8-18", "11.3"),
    ("longestStatic, frames (measure.py)", m["longestStatic"], "15-40", "24"),
    ("hardCuts (measure.py)", m["hardCuts"], "<= 1", "1"),
    ("blurMoves (measure.py)", m["blurMoves"], "<= 6", "4"),
    ("movePct (camera moving)", float(moving.mean() * 100), "35-55", "42.6"),
    ("hold median, frames", float(np.median(holds)) if holds else 0, ">= 10", "11"),
    ("hold p90, frames", float(np.percentile(holds, 90)) if holds else 0, "-", "45"),
    ("push-in during holds, %/f", float(np.median(hp)) if hp.size else 0, "0.07-0.15", "0.09"),
    ("fast-pan frames (>= 40 px/f), %", float((sp >= 40).mean() * 100), "<= 2.5", "1.1"),
    ("mean saturation", sat, "0.40-0.50", "0.44"),
    ("detail density", edge, ">= 0.15", "0.15"),
    ("contrast (measure.py)", m["contrast"], "-", "47.7"),
    ("p95 (measure.py)", m["p95"], "-", "199"),
    ("vignette (measure.py)", m["vignette"], "-", "20.1"),
]
lines = ["| Metric | This clip | Target (section 8) | Reference median |", "|---|---|---|---|"]
for name, v, tgt, ref in rows:
    lines.append(f"| {name} | {v:.2f} | {tgt} | {ref} |" if isinstance(v, float) else f"| {name} | {v} | {tgt} | {ref} |")
txt = "\n".join(lines)
open(os.path.join(out, "measure.md"), "w", encoding="utf-8").write(txt + "\n")
print(txt)

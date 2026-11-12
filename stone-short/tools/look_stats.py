# Saturation and detail density as the style study measures them (research/ricks/tools/analyze.py still_stats):
# mean HSV saturation and the fraction of strong-gradient pixels on 135x240 stills, averaged over one still per second.
# usage: python stone-short/tools/look_stats.py "out/stone/cs_final/f_*.jpg"
import glob, sys, json
import numpy as np
from PIL import Image
sat, edge = [], []
for p in sorted(glob.glob(sys.argv[1])):
    im = np.asarray(Image.open(p).convert("RGB").resize((135, 240)), np.float32) / 255
    Y = im @ np.array([.299, .587, .114]); mx, mn = im.max(2), im.min(2)
    sat.append(float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0).mean()))
    g = np.abs(np.diff(Y, axis=0))[:, :-1] + np.abs(np.diff(Y, axis=1))[:-1]; edge.append(float((g > .12).mean()))
print(json.dumps({"stills": len(sat), "saturation": round(float(np.mean(sat)), 3), "detailDensity": round(float(np.mean(edge)), 3)}))

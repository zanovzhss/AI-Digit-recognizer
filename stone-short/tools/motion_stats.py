# Camera-motion metrics of a render, with the reference study's definitions (research/ricks/tools/analyze.py):
# python motion_stats.py <motion.npz>  (from research/ricks/tools/motion.py)
import sys, json
import numpy as np


def runs(mask):
    out, i, n = [], 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j + 1 < n and mask[j + 1]: j += 1
            out.append((i, j)); i = j + 1
        else: i += 1
    return out


mo = np.load(sys.argv[1])
sp, zm = np.minimum(np.hypot(mo["dx"], mo["dy"]), 200), mo["zoom"]
still = (sp < 0.3) & (np.abs(zm) < 0.03)
moving = (sp >= 3) | (np.abs(zm) >= 0.35)
holds = [b - a + 1 for a, b in runs(~moving) if b - a + 1 >= 4]
r = dict(movePct=round(float(moving.mean() * 100), 1), staticPct_motion=round(float(still.mean() * 100), 1),
         holdMedF=float(np.median(holds)) if holds else 0, holdP90F=round(float(np.percentile(holds, 90)), 1) if holds else 0,
         pushInPct=round(float((zm > 0.04).mean() * 100), 1),
         holdPushMed=round(float(np.median(zm[~moving & (zm > 0.02)])) if (~moving & (zm > 0.02)).any() else 0, 3),
         panHoldMed=round(float(np.median(sp[~moving])), 2), fastPct=round(float((sp >= 40).mean() * 100), 1),
         panP95=round(float(np.percentile(sp, 95)), 1))
print(json.dumps(r))
fast = np.flatnonzero(sp >= 40)
print("fast-pan frames:", fast.tolist()[:80])

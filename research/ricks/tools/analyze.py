# Aggregate numbers for the style reference.
# Usage: python -I research/ricks/tools/analyze.py <frames_root> <ours_dir> <out.json>
# Reads frames/<key>/{frames.npz,events.json,words.json,s_*.jpg}; ours_dir has the same layout for our IceShort.
import json, os, sys, glob, colorsys
import numpy as np
from PIL import Image

root, ours, outp = sys.argv[1], sys.argv[2], sys.argv[3]


def runs(mask):
    out, s = [], None
    for i, m in enumerate(mask):
        if m and s is None: s = i
        if not m and s is not None: out.append((s, i - 1)); s = None
    if s is not None: out.append((s, len(mask) - 1))
    return out


def hexc(rgb): return "#%02x%02x%02x" % tuple(int(max(0, min(255, v))) for v in rgb)


def still_stats(p):
    im = np.asarray(Image.open(p).convert("RGB").resize((135, 240)), np.float32) / 255
    Y = im @ np.array([.299, .587, .114])
    mx, mn = im.max(2), im.min(2); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    hi = Y > np.percentile(Y, 85); lo = (Y < np.percentile(Y, 25)) & (Y > .04)
    top = im[:80].reshape(-1, 3).mean(0)
    # detail proxy: fraction of pixels with strong local gradient (edges, signage, props)
    g = np.abs(np.diff(Y, axis=0))[:, :-1] + np.abs(np.diff(Y, axis=1))[:-1]
    return dict(luma=float(Y.mean()), sat=float(sat.mean()), key=im[hi].mean(0), shadow=im[lo].mean(0) if lo.any() else np.zeros(3),
                top=top, edge=float((g > .12).mean()), contrast=float(Y.std()))


def classify(s):
    k = s["key"]; t = s["top"]
    h, l, sa = colorsys.rgb_to_hls(*k)
    th, tl, ts = colorsys.rgb_to_hls(*t)
    if s["luma"] < .30: return "night"
    if 0.52 < th < 0.70 and ts > .25 and tl > .45 and s["luma"] > .42: return "day"
    if (h < .14 or h > .9) and sa > .35 and k[0] > k[2] + .12: return "golden"
    return "interior"


def video(d):
    z = np.load(os.path.join(d, "frames.npz")); fps = float(z["fps"])
    diff = z["diff"]
    mo = np.load(os.path.join(d, "motion.npz"))
    sp, zm = np.hypot(mo["dx"], mo["dy"]), mo["zoom"]
    sp = np.minimum(sp, 200)  # >200 px/f = beyond phase-correlation range (whip / cut)
    ev = json.load(open(os.path.join(d, "events.json")))["events"]
    n = len(diff)
    still = (sp < 0.3) & (np.abs(zm) < 0.03)
    moving = (sp >= 3) | (np.abs(zm) >= 0.35)
    holds = [b - a + 1 for a, b in runs(~moving) if b - a + 1 >= 4]
    moves = [(a, b) for a, b in runs(sp >= 3) if b - a + 1 >= 4]
    peakpos = [float((np.argmax(sp[a:b + 1])) / max(1, b - a)) for a, b in moves]
    w = []
    wp = os.path.join(d, "words.json")
    if os.path.exists(wp): w = json.load(open(wp))
    dur = n / fps
    r = dict(frames=n, dur=round(dur, 2), events=len(ev), eventsPerMin=round(len(ev) / dur * 60, 1),
             kinds={k: sum(e["kind"] == k for e in ev) for k in sorted(set(e["kind"] for e in ev))},
             evLenMed=float(np.median([e["len"] for e in ev])) if ev else 0,
             holdMedF=float(np.median(holds)) if holds else 0, holdP90F=float(np.percentile(holds, 90)) if holds else 0,
             movePct=round(float(moving.mean() * 100), 1), staticPct=round(float(still.mean() * 100), 1),
             panSpeedP50=round(float(np.median(sp[sp >= 3])) if (sp >= 3).any() else 0, 1),
             panSpeedP95=round(float(np.percentile(sp, 95)), 1),
             movePeakPos=round(float(np.median(peakpos)), 2) if peakpos else None, moves=len(moves),
             pushInPct=round(float((zm > 0.04).mean() * 100), 1), pullOutPct=round(float((zm < -0.04).mean() * 100), 1),
             holdPushMed=round(float(np.median(zm[~moving & (zm > 0.02)])) if (~moving & (zm > 0.02)).any() else 0, 3),
             panHoldMed=round(float(np.median(sp[~moving])), 2), fastPct=round(float((sp >= 40).mean() * 100), 1),
             moveLenMed=float(np.median([b - a + 1 for a, b in moves])) if moves else 0)
    if w:
        wps = len(w) / (w[-1]["e"] - w[0]["s"])
        on = np.array([x["s"] for x in w])
        sent = [i for i, x in enumerate(w) if x["w"][-1:] in ".?!"]
        offs, atSent, atComma = [], 0, 0
        for e in ev:
            t = e["a"] / fps
            i = int(np.argmin(np.abs(on - t)))
            offs.append(round((t - on[i]) * fps))
            prev = w[i - 1]["w"] if i > 0 else "."
            atSent += prev[-1:] in ".?!"
            atComma += prev[-1:] in ",;:"
        sentDur = np.diff([w[0]["s"]] + [w[i]["e"] for i in sent])
        r.update(wps=round(wps, 2), voiceStart=round(w[0]["s"], 2), words=len(w),
                 evOffsetMedF=float(np.median(offs)) if offs else None,
                 evOffsetIQR=[float(np.percentile(offs, 25)), float(np.percentile(offs, 75))] if offs else None,
                 evAtSentencePct=round(100 * atSent / max(1, len(ev))), evAtCommaPct=round(100 * atComma / max(1, len(ev))),
                 sentenceSecMed=round(float(np.median(sentDur)), 2) if len(sentDur) else None,
                 secPerEvent=round(dur / max(1, len(ev)), 2))
    st = [still_stats(p) for p in sorted(glob.glob(os.path.join(d, "s_*.jpg")))]
    cls = [classify(s) for s in st]
    r["light"] = {k: cls.count(k) for k in ("day", "golden", "night", "interior")}
    r["edge"] = round(float(np.mean([s["edge"] for s in st])), 4)
    r["sat"] = round(float(np.mean([s["sat"] for s in st])), 3)
    r["_stills"] = [(c, s) for c, s in zip(cls, st)]
    r["_lightChanges"] = sum(1 for a, b in zip(cls, cls[1:]) if a != b)
    return r


res = {}
allst = []
for d in sorted(glob.glob(os.path.join(root, "2026*", "frames.npz"))):
    d = os.path.dirname(d)
    k = os.path.basename(d); r = video(d); allst += r.pop("_stills"); res[k] = r
our = video(ours); ourst = our.pop("_stills"); res["OURS_IceShort"] = our


def preset(sts):
    out = {}
    for c in ("day", "golden", "night", "interior"):
        s = [x for k, x in sts if k == c]
        if not s: continue
        out[c] = dict(n=len(s), key=hexc(np.median([x["key"] for x in s], 0) * 255), shadow=hexc(np.median([x["shadow"] for x in s], 0) * 255),
                      top=hexc(np.median([x["top"] for x in s], 0) * 255), luma=round(float(np.median([x["luma"] for x in s])), 3),
                      sat=round(float(np.median([x["sat"] for x in s])), 3), contrast=round(float(np.median([x["contrast"] for x in s])), 3),
                      edge=round(float(np.median([x["edge"] for x in s])), 4))
    return out


res["_presets_ref"] = preset(allst)
res["_presets_ours"] = preset(ourst)
json.dump(res, open(outp, "w"), indent=1, default=float)
keys = [k for k in res if k.startswith("2026")]
for f in ("pushInPct", "pullOutPct", "holdPushMed", "panHoldMed", "fastPct", "eventsPerMin", "evLenMed", "holdMedF", "holdP90F", "movePct", "staticPct", "panSpeedP50", "panSpeedP95", "movePeakPos",
          "moveLenMed", "wps", "evOffsetMedF", "evAtSentencePct", "evAtCommaPct", "sentenceSecMed", "secPerEvent", "edge", "sat"):
    v = [res[k][f] for k in keys if res[k].get(f) is not None]
    if v: print(f"{f:16s} ref med {np.median(v):8.2f}  range {min(v):7.2f}-{max(v):7.2f}   ours {our.get(f)}")
print("presets ref", json.dumps(res["_presets_ref"], indent=0))
print("presets ours", json.dumps(res["_presets_ours"], indent=0))

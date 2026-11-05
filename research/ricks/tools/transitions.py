# Shot-boundary finder + transition classifier.
# Usage: python -I research/ricks/tools/transitions.py <video.mp4> <dir>   (dir has motion.npz, words.json)
# Writes <dir>/transitions.json and strips <dir>/tr_<frame>.jpg (14 frames around each boundary).
import json, os, subprocess, sys
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
src, d = sys.argv[1], sys.argv[2]
W, H = 54, 96
raw = subprocess.run([FF, "-v", "error", "-i", src, "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
n = len(F); fps = 30.0
Y = F.astype(np.float32) @ np.array([.299, .587, .114], np.float32)
q = (F // 32).astype(np.int32); idx = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
hist = np.stack([np.bincount(i.ravel(), minlength=512) for i in idx]).astype(np.float32) / (W * H)
m = np.load(os.path.join(d, "motion.npz"))
pan = np.hypot(m["dx"], m["dy"]); zoom = m["zoom"]
diff = np.r_[0, np.abs(Y[1:] - Y[:-1]).mean((1, 2))]
luma = Y.mean((1, 2))
c = Y[:, 20:76, 10:44]
sharp = np.abs(4 * c[:, 1:-1, 1:-1] - c[:, :-2, 1:-1] - c[:, 2:, 1:-1] - c[:, 1:-1, :-2] - c[:, 1:-1, 2:]).mean((1, 2))
words = json.load(open(os.path.join(d, "words.json"))) if os.path.exists(os.path.join(d, "words.json")) else []

K = 6
Hd = np.zeros(n)
for t in range(K, n - K):
    Hd[t] = np.abs(hist[t + K] - hist[t - K]).sum()
# boundary = local max of Hd above threshold, >= 18 frames apart, with stable sides
cand = [t for t in range(K, n - K) if Hd[t] > 0.55 and Hd[t] == Hd[max(0, t - 9):t + 10].max()]
bounds = []
for t in cand:
    if bounds and t - bounds[-1] < 18: continue
    bounds.append(t)


def blend_resid(a, b):
    P, Q = Y[a].ravel(), Y[b].ravel(); dd = P - Q; den = dd @ dd + 1e-6
    r = []
    for k in range(a + 1, b):
        M = Y[k].ravel(); al = np.clip(((M - Q) @ dd) / den, 0, 1); r.append(np.abs(M - (Q + al * dd)).mean())
    return float(np.mean(r)) if r else 99.0


out = []
for t in bounds:
    h1 = np.r_[0, np.abs(hist[1:] - hist[:-1]).sum(1)]
    a = t
    while a > max(1, t - 25) and (h1[a] > 0.04 or diff[a] > 6): a -= 1
    b = t
    while b < min(n - 2, t + 25) and (h1[b + 1] > 0.04 or diff[b + 1] > 6): b += 1
    L = b - a
    seg = slice(a + 1, b + 1)
    tot = np.abs(hist[b] - hist[a]).sum() + 1e-6
    step = h1[seg].max() / tot if L > 0 else 1
    pk_pan = float(pan[seg].max()) if L > 0 else 0; pk_zoom = float(np.abs(zoom[seg]).max()) if L > 0 else 0
    lum_pk = float(luma[seg].max() - max(luma[a], luma[b])) if L > 0 else 0
    lum_dip = float(min(luma[a], luma[b]) - luma[seg].min()) if L > 0 else 0
    blur = float(sharp[seg].min() / max(1e-3, min(sharp[a], sharp[b]))) if L > 0 else 1
    br = blend_resid(a, b) if L >= 3 else 99
    base = float(np.abs(Y[a] - Y[b]).mean())
    if L == 0:
        base0 = float(np.abs(Y[max(0, t - K)] - Y[min(n - 1, t + K)]).mean())
        if base0 < 18: continue  # a creeping push or light change, not a boundary
        a, b, L = max(0, t - K), min(n - 1, t + K), 2 * K
        seg = slice(a + 1, b + 1); br = blend_resid(a, b); base = base0
    if L <= 2: kind = "cut"
    elif lum_pk > 40: kind = "flash"
    elif lum_dip > 40: kind = "dip/iris"
    elif pk_pan > 45 and blur < 0.75: kind = "whip"
    elif br < 0.18 * base + 2 and pk_pan < 25 and pk_zoom < 1.5: kind = "dissolve"
    elif pk_zoom > 1.5 and pk_zoom * 8 > pk_pan: kind = "push-through"
    elif pk_pan > 12: kind = "move (pan/orbit/crane)"
    else: kind = "other"
    tw = t / fps
    wi = int(np.argmin([abs(x["s"] - tw) for x in words])) if words else -1
    ctx = " ".join(x["w"] for x in words[max(0, wi - 4):wi + 3]) if wi >= 0 else ""
    prev = words[wi - 1]["w"] if wi > 0 else "."
    out.append(dict(f=int(t), a=int(a), b=int(b), len=int(L), t=round(tw, 2), tc="%d:%05.2f" % (tw // 60, tw % 60), kind=kind,
                    step=round(float(step), 2), pan=round(pk_pan, 1), zoom=round(pk_zoom, 2), lumPk=round(lum_pk, 1),
                    lumDip=round(lum_dip, 1), blur=round(blur, 2), blendRes=round(br, 1), base=round(base, 1),
                    word=words[wi]["w"] if wi >= 0 else "", wordOffF=round((tw - words[wi]["s"]) * fps) if wi >= 0 else None,
                    afterSentence=prev[-1:] in ".?!", afterComma=prev[-1:] in ",;:", ctx=ctx))
json.dump(dict(n=n, bounds=out), open(os.path.join(d, "transitions.json"), "w"), indent=1)
for e in out:
    p = os.path.join(d, f"tr_{e['f']:04d}.jpg")
    if os.path.exists(p): continue
    lo, hi = max(0, e["a"] - 3), min(n - 1, e["b"] + 3)
    if hi - lo + 1 < 14: lo = max(0, min(lo, hi - 13)); hi = min(n - 1, lo + 13)
    ks = sorted(set(int(round(x)) for x in np.linspace(lo, hi, 14)))
    sel = "+".join(f"eq(n\,{k})" for k in ks)
    subprocess.run([FF, "-v", "error", "-y", "-i", src, "-vf",
                    f"select='{sel}',scale=270:480,"
                    f"tile=7x2:padding=3", "-fps_mode", "passthrough", "-frames:v", "1", "-q:v", "3", p])
    e["stripFrames"] = ks
json.dump(dict(n=n, bounds=out), open(os.path.join(d, "transitions.json"), "w"), indent=1)
from collections import Counter
print(os.path.basename(src), len(out), dict(Counter(e["kind"] for e in out)))

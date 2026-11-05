# Frame study extractor (private reference study).
# Usage: python -I research/ricks/tools/extract.py <video.mp4> <out_dir>
# Writes to out_dir: s_###.jpg (1 still per second, 540x960), sheet.jpg (1-fps contact sheet),
# strip_<frame>.jpg (14 frames around every cut / fast move, 7x2), frames.npz (per-frame metrics), events.json.
import json, subprocess, sys, os
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
W, H = 108, 192  # analysis size; px values are reported x10 (= px at 1080 wide)


def probe():
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                        "stream=nb_read_packets,r_frame_rate", "-of", "json", src], capture_output=True, text=True)
    s = json.loads(r.stdout)["streams"][0]
    a, b = s["r_frame_rate"].split("/")
    return float(a) / float(b)


fps = probe()
raw = subprocess.run([FF, "-v", "error", "-hwaccel", "cuda", "-i", src, "-vf", f"scale={W}:{H}:flags=area",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
n = len(F)
Y = F @ np.array([.299, .587, .114], np.float32)

diff = np.r_[0, np.abs(Y[1:] - Y[:-1]).mean((1, 2))]
luma = Y.mean((1, 2))
# sharpness: mean abs Laplacian on the centre 60 % (motion blur / lens blur drop it)
c = Y[:, int(H * .2):int(H * .8), int(W * .2):int(W * .8)]
lap = np.abs(4 * c[:, 1:-1, 1:-1] - c[:, :-2, 1:-1] - c[:, 2:, 1:-1] - c[:, 1:-1, :-2] - c[:, 1:-1, 2:]).mean((1, 2))

# global translation by phase correlation (windowed), plus peak strength (1 = rigid pan, low = zoom/cut/blend)
win = np.outer(np.hanning(H), np.hanning(W)).astype(np.float32)
Fq = np.fft.rfft2((Y - Y.mean((1, 2), keepdims=True)) * win)
dx = np.zeros(n); dy = np.zeros(n); peak = np.ones(n)
for i in range(1, n):
    R = Fq[i] * np.conj(Fq[i - 1]); R /= np.abs(R) + 1e-6
    r = np.fft.irfft2(R, s=(H, W))
    k = int(np.argmax(r)); py, px = divmod(k, W)
    peak[i] = r.flat[k]
    dy[i] = py if py < H / 2 else py - H
    dx[i] = px if px < W / 2 else px - W
speed = np.hypot(dx, dy) * 10  # px/frame at 1080 wide
# zoom proxy: radial flow sign from centre vs edge difference of successive frames
np.savez_compressed(os.path.join(out, "frames.npz"), diff=diff, luma=luma, sharp=lap, dx=dx * 10, dy=dy * 10,
                    peak=peak, fps=fps)

# ---- events: cuts, flashes, dissolves, whips / fast moves
ev = []
i = 1
hot = (diff >= 22) | (speed >= 60)
while i < n:
    if hot[i]:
        j = i
        while j + 1 < n and (hot[j + 1] or (j + 2 < n and hot[j + 2])): j += 1
        a, b = i, j
        pre, post = max(0, a - 2), min(n - 1, b + 2)
        seg = slice(a, b + 1)
        kind = "move"
        L = b - a + 1
        lpk = luma[seg].max() - max(luma[pre], luma[post])
        # dissolve test: middle frames fit as blend of pre/post
        resid = None
        if L >= 3:
            P, Q = Y[pre].ravel(), Y[post].ravel()
            res = []
            for k in range(a, b + 1):
                M = Y[k].ravel(); d = P - Q
                al = np.clip(((M - Q) @ d) / (d @ d + 1e-6), 0, 1)
                res.append(np.abs(M - (Q + al * d)).mean())
            resid = float(np.mean(res))
        if lpk > 45: kind = "flash"
        elif L <= 2 and diff[seg].max() >= 30 and peak[seg].min() < .15: kind = "cut"
        elif resid is not None and resid < 6 and np.abs(Y[pre] - Y[post]).mean() > 20 and speed[seg].mean() < 40: kind = "dissolve"
        elif speed[seg].max() >= 120 or lap[seg].min() < .5 * np.median(lap[max(0, a - 15):a + 1]): kind = "whip/blur-move"
        ev.append(dict(a=int(a), b=int(b), len=int(L), t=round(a / fps, 2), kind=kind,
                       peakDiff=round(float(diff[seg].max()), 1), peakSpeed=round(float(speed[seg].max()), 1),
                       lumaPeak=round(float(lpk), 1), blendResid=None if resid is None else round(resid, 2)))
        i = j + 1
    i += 1
json.dump(dict(n=n, fps=fps, events=ev), open(os.path.join(out, "events.json"), "w"), indent=1)

# ---- stills (1/s) + contact sheet
subprocess.run([FF, "-v", "error", "-y", "-hwaccel", "cuda", "-i", src, "-vf", "fps=1:start_time=0.5,scale=540:960",
                "-q:v", "3", os.path.join(out, "s_%03d.jpg")])
cols = 9
rows = -(-int(n / fps) // cols)
subprocess.run([FF, "-v", "error", "-y", "-hwaccel", "cuda", "-i", src, "-vf",
                f"fps=1:start_time=0.5,scale=200:356,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='%{{eif\\:t+0.5\\:d}}':x=6:y=6:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6,tile={cols}x{rows}:padding=4",
                "-frames:v", "1", "-q:v", "3", os.path.join(out, "sheet.jpg")])

# ---- 14-frame strips around each event (7 before the event start, 7 from it)
for e in ev:
    f0 = max(0, e["a"] - 7)
    subprocess.run([FF, "-v", "error", "-y", "-ss", f"{max(0, f0 / fps - 1):.3f}", "-i", src, "-vf",
                    f"select='gte(n\\,{round(min(1, f0 / fps) * fps)})',scale=270:480,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='%{{eif\\:n+{f0}\\:d}}':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=7x2:padding=3",
                    "-frames:v", "1", "-q:v", "3", os.path.join(out, f"strip_{e['a']:04d}.jpg")])
print(os.path.basename(src), n, "frames", len(ev), "events", {k: sum(e["kind"] == k for e in ev) for k in set(e["kind"] for e in ev)})

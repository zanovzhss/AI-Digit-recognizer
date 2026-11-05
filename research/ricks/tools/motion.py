# Sub-pixel camera motion: pan (px/frame at 1080 wide) and zoom (%/frame, + = push-in) per frame.
# Usage: python -I research/ricks/tools/motion.py <video.mp4> <out_dir>   -> out_dir/motion.npz
import subprocess, sys, os
import numpy as np

FF = os.environ.get("FFMPEG", "ffmpeg")
src, out = sys.argv[1], sys.argv[2]
W, H = 216, 384
raw = subprocess.run([FF, "-v", "error", "-hwaccel", "cuda", "-i", src, "-vf", f"scale={W}:{H}:flags=area,format=gray",
                      "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
Y = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(Y)
win = np.outer(np.hanning(H), np.hanning(W)).astype(np.float32)


def phase(a, b):
    A = np.fft.rfft2((a - a.mean()) * win); B = np.fft.rfft2((b - b.mean()) * win)
    R = A * np.conj(B); R /= np.abs(R) + 1e-6
    r = np.fft.irfft2(R, s=(H, W))
    py, px = np.unravel_index(np.argmax(r), r.shape)
    pk = r[py, px]
    def ref(m, p, L):
        y0, y1, y2 = m(p - 1), m(p), m(p + 1)
        den = y0 - 2 * y1 + y2
        return p + (0.5 * (y0 - y2) / den if abs(den) > 1e-9 else 0)
    fy = ref(lambda q: r[q % H, px], py, H); fx = ref(lambda q: r[py, q % W], px, W)
    fy = fy if fy < H / 2 else fy - H; fx = fx if fx < W / 2 else fx - W
    return fx, fy, pk


# zoom: compare a centre crop of frame t with resampled crops of t-1 at scales s; pick min error (parabolic)
cy, cx = H // 2, W // 2; hh, hw = int(H * .3), int(W * .3)
yy, xx = np.mgrid[-hh:hh, -hw:hw].astype(np.float32)


def sample(img, s, dx, dy):
    y = cy + yy / s - dy; x = cx + xx / s - dx
    y0 = np.clip(np.floor(y).astype(int), 0, H - 2); x0 = np.clip(np.floor(x).astype(int), 0, W - 2)
    fy = np.clip(y - y0, 0, 1); fx = np.clip(x - x0, 0, 1)
    return (img[y0, x0] * (1 - fy) * (1 - fx) + img[y0 + 1, x0] * fy * (1 - fx) +
            img[y0, x0 + 1] * (1 - fy) * fx + img[y0 + 1, x0 + 1] * fy * fx)


scales = np.array([.97, .98, .99, .995, 1.0, 1.005, 1.01, 1.02, 1.03])
dx = np.zeros(n); dy = np.zeros(n); pk = np.ones(n); zm = np.zeros(n); zerr = np.zeros(n)
for i in range(1, n):
    fx, fy, p = phase(Y[i], Y[i - 1])
    dx[i], dy[i], pk[i] = fx, fy, p
    cur = Y[i][cy - hh:cy + hh, cx - hw:cx + hw]
    e = np.array([np.abs(sample(Y[i - 1], s, fx, fy) - cur).mean() for s in scales])
    k = int(np.argmin(e))
    s = scales[k]
    if 0 < k < len(scales) - 1:
        den = e[k - 1] - 2 * e[k] + e[k + 1]
        step = (scales[k + 1] - scales[k - 1]) / 2
        if den > 1e-9: s = scales[k] + 0.5 * (e[k - 1] - e[k + 1]) / den * step
    zm[i] = (s - 1) * 100; zerr[i] = e[k]
np.savez_compressed(os.path.join(out, "motion.npz"), dx=dx * 5, dy=dy * 5, peak=pk, zoom=zm, zerr=zerr)
sp = np.hypot(dx, dy) * 5
print(os.path.basename(src), "pan p50 %.2f p95 %.1f  zoom|p50| %.3f %%/f" % (np.median(sp), np.percentile(sp, 95), np.median(np.abs(zm))))

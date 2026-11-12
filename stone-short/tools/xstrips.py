# Round-4 checks: a 14-frame strip across every crossfade, and stills every 0.5 s from 44 s to the end.
# usage: python stone-short/tools/xstrips.py <video.mp4> <xfades.json> <outdir>
#   xfades.json: [{"id": shot, "at": first frame of the shot, "x": crossfade frames}, ...] (centred on "at")
#   writes <outdir>/xstrips_<n>.jpg (5 strips per sheet; the frames inside the crossfade are framed in orange)
#   and <outdir>/tail_stills.jpg (44.0 s .. end, every 0.5 s)
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

VID, XF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(f"{OUT}/fr", exist_ok=True)
FONT = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
W, H = 108, 192


_ALL = {}


def dump(frames, w=W, h=H):  # every frame of the video once, small (n = frame index), then pick
    key = (w, h)
    if key not in _ALL:
        d = f"{OUT}/fr/{w}x{h}"; os.makedirs(d, exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", VID, "-vf", f"scale={w}:{h}", "-q:v", "3", f"{d}/a_%05d.jpg"], check=True)
        _ALL[key] = d
    return {f: f"{_ALL[key]}/a_{f + 1:05d}.jpg" for f in frames}


xf = json.load(open(XF))
need = sorted({f for e in xf for f in range(e["at"] - 7, e["at"] + 7)})
got = dump(need)
rows = []
for e in xf:
    a, x = e["at"], e["x"]
    strip = Image.new("RGB", (14 * (W + 2) + 150, H + 26), (22, 22, 26)); d = ImageDraw.Draw(strip)
    d.text((6, 6), f"shot {e['id']}", fill=(255, 255, 255), font=FONT); d.text((6, 30), f"f{a}  x{x}", fill=(255, 210, 90), font=FONT)
    for k, f in enumerate(range(a - 7, a + 7)):
        px = 150 + k * (W + 2); strip.paste(Image.open(got[f]), (px, 0))
        if a - x / 2 <= f < a + x / 2: d.rectangle([px, 0, px + W - 1, H - 1], outline=(255, 150, 40), width=3)
        d.text((px + 3, H + 3), str(f), fill=(200, 200, 200), font=FONT)
    rows.append(strip)
for n in range(0, len(rows), 5):
    grp = rows[n:n + 5]; sh = Image.new("RGB", (grp[0].width, sum(r.height + 6 for r in grp)), (10, 10, 12)); y = 0
    for r in grp: sh.paste(r, (0, y)); y += r.height + 6
    sh.save(f"{OUT}/xstrips_{n // 5 + 1}.jpg", quality=85)
# stills every 0.5 s from 44 s to the end
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", VID], capture_output=True, text=True).stdout)
ts = [44 + 0.5 * k for k in range(int((dur - 44) / 0.5) + 1) if 44 + 0.5 * k < dur - 0.02]
fr = [min(int(round(t * 30)), int(dur * 30) - 1) for t in ts]
cols = 7; tw, th = 216, 384; got = dump(fr, tw, th)
sh = Image.new("RGB", (cols * (tw + 4), ((len(fr) + cols - 1) // cols) * (th + 4)), (10, 10, 12)); d = ImageDraw.Draw(sh)
for i, (t, f) in enumerate(zip(ts, fr)):
    x, y = (i % cols) * (tw + 4), (i // cols) * (th + 4); sh.paste(Image.open(got[f]).resize((tw, th)), (x, y))
    d.rectangle([x, y, x + 92, y + 22], fill=(0, 0, 0)); d.text((x + 3, y + 1), f"{t:.1f} s", fill=(255, 255, 255), font=FONT)
sh.save(f"{OUT}/tail_stills.jpg", quality=85)
print("strips", len(rows), "stills", len(fr))

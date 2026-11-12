# Before / after sheets for the round-3 and round-4 fixes (src/videos/stone/BUGS.md, "Round 3" / "Round 4").
# usage: python stone-short/tools/fixsheets.py <before.mp4> <after.mp4> [round]   (round 3 = F01..F09, round 4 = G01..G06)
#   stills of both at the same times, crossfade strips and big crops, then out/stone/fixes/<ID>.jpg
#   (BEFORE row above the AFTER row)
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

BEF, AFT = sys.argv[1], sys.argv[2]
ROUND = int(sys.argv[3]) if len(sys.argv) > 3 else 3
OUT = "out/stone/r3cmp" if ROUND == 3 else "out/stone/r4cmp"
FONT = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
FS = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)


def grab(video, t, path, w, h):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.4f}", "-i", video, "-frames:v", "1", "-vf", f"scale={w}:{h}", "-q:v", "3", path], check=True)


def tiles(video, tag, items):
    ims = []
    for it in items:
        kind, v = it
        if kind == "t":  # a still at time v (s)
            p = f"{OUT}/{tag}_{v:.2f}.jpg"; grab(video, v + 0.001, p, 216, 384); ims.append((Image.open(p), f"{v:.1f} s"))
        elif kind == "big":  # the lower half of a big frame (the feet)
            p = f"{OUT}/{tag}_big_{v:.2f}.jpg"; grab(video, v + 0.001, p, 540, 960); im = Image.open(p).crop((0, 420, 540, 960)).resize((324, 324)); ims.append((im, f"{v:.1f} s feet"))
        elif kind == "crop":  # a full-size crop (x0, y0, x1, y1 as fractions) at time t
            t, box = v; p = f"{OUT}/{tag}_crop_{t:.2f}.jpg"; grab(video, t + 0.001, p, 1080, 1920); im = Image.open(p)
            c = im.crop(tuple(int(b * s) for b, s in zip(box, (1080, 1920, 1080, 1920)))); c.thumbnail((384, 384)); ims.append((c, f"{t:.1f} s zoom"))
        elif kind == "x7":  # a 7-frame strip across the crossfade at frame v (every 2nd frame of the 14 around it)
            strip = Image.new("RGB", (7 * 108, 192))
            for i, o in enumerate((-7, -5, -3, -1, 1, 3, 5)):
                p = f"{OUT}/{tag}_x7_{v}_{o}.jpg"; grab(video, (v + o) / 30 + 0.001, p, 108, 192); strip.paste(Image.open(p), (i * 108, 0))
            ims.append((strip, f"f{v} -7..+5"))
        elif kind == "x":  # a 5-frame strip across the transition at frame v
            strip = Image.new("RGB", (5 * 108, 192))
            for i, o in enumerate((-6, -3, 0, 3, 6)):
                p = f"{OUT}/{tag}_x_{v}_{o}.jpg"; grab(video, (v + o) / 30 + 0.001, p, 108, 192); strip.paste(Image.open(p), (i * 108, 0))
            ims.append((strip, f"f{v} -6..+6"))
    return ims


FIX = {
    "F01": [("big", 36.5), ("big", 48.0), ("big", 50.5), ("big", 17.3)],
    "F02": [("t", 0.0), ("t", 1.0), ("t", 2.0), ("t", 3.0), ("t", 4.0)],
    "F03": [("t", 2.0), ("t", 18.5), ("t", 31.0), ("t", 50.0), ("t", 53.8)],
    "F04": [("x", 194), ("t", 7.0)],
    "F05": [("t", 13.5), ("t", 14.0), ("t", 14.6)],
    "F06": [("t", 21.4), ("t", 22.2), ("t", 23.2)],
    "F07": [("x", 854), ("t", 28.0), ("t", 28.6)],
    "F08": [("t", 47.0), ("t", 47.6), ("t", 48.2)],
    "F09": [("t", 52.6), ("t", 53.4), ("t", 54.1)],
}
FIX4 = {
    "G01": [("t", 49.0), ("t", 50.0), ("t", 51.0), ("crop", (51.0, (0.30, 0.15, 1.0, 0.62)))],
    "G02": [("x7", 194), ("x7", 854), ("x7", 1182)],
    "G03": [("t", 6.9), ("t", 7.0), ("crop", (7.0, (0.15, 0.30, 0.85, 0.75)))],
    "G04": [("t", 13.0), ("t", 13.5), ("t", 14.0)],
    "G05": [("t", 49.0), ("t", 49.8), ("t", 50.5), ("t", 51.2)],
    "G06": [("t", 52.0), ("t", 52.4), ("t", 52.8), ("t", 53.5), ("t", 54.1)],
}


def sheet(fid, items):
    before, after = tiles(BEF, "b", items), tiles(AFT, "a", items)
    W = max(sum(i.width + 4 for i, _ in before), sum(i.width + 4 for i, _ in after)) + 120
    H = max(i.height for i, _ in before) + max(i.height for i, _ in after) + 30
    sh = Image.new("RGB", (W, H), (24, 24, 28)); d = ImageDraw.Draw(sh); y = 0
    for lab, row in (("BEFORE", before), ("AFTER", after)):
        d.text((8, y + 8), lab, fill=(255, 210, 90) if lab == "BEFORE" else (120, 230, 140), font=FONT); d.text((8, y + 34), fid, fill=(230, 230, 230), font=FS)
        x = 120
        for im, t in row:
            sh.paste(im, (x, y)); d.rectangle([x, y, x + 8 + 9 * len(t), y + 20], fill=(0, 0, 0)); d.text((x + 3, y + 1), t, fill=(255, 255, 255), font=FS); x += im.width + 4
        y += max(i.height for i, _ in row) + 30
    os.makedirs("out/stone/fixes", exist_ok=True); sh.save(f"out/stone/fixes/{fid}.jpg", quality=82)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    TODO = FIX if ROUND == 3 else FIX4
    for fid, items in TODO.items(): sheet(fid, items)
    print("sheets:", len(TODO))

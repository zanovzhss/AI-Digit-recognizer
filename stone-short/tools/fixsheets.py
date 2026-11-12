# Before / after sheets for the round-3 fixes (src/videos/stone/BUGS.md, "Round 3").
# usage: python stone-short/tools/fixsheets.py <before.mp4> <after.mp4>
#   stills every 0.5 s of both into out/stone/r3cmp/{before,after}/half, transition strips and big frames for the feet,
#   then out/stone/fixes/F01..F10.jpg (BEFORE row above the AFTER row, same times)
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

BEF, AFT = sys.argv[1], sys.argv[2]
OUT = "out/stone/r3cmp"
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


def sheet(fid, items):
    before, after = tiles(BEF, "b", items), tiles(AFT, "a", items)
    W = max(sum(i.width + 4 for i, _ in before), sum(i.width + 4 for i, _ in after)) + 120
    H = max(i.height for i, _ in before) + max(i.height for i, _ in after) + 30
    sh = Image.new("RGB", (W, H), (24, 24, 28)); d = ImageDraw.Draw(sh); y = 0
    for lab, row in (("BEFORE", before), ("AFTER", after)):
        d.text((8, y + 8), lab, fill=(255, 210, 90) if lab == "BEFORE" else (120, 230, 140), font=FONT); d.text((8, y + 34), fid, fill=(230, 230, 230), font=FS)
        x = 120
        for im, t in row:
            sh.paste(im, (x, y)); d.rectangle([x, y, x + 96, y + 20], fill=(0, 0, 0)); d.text((x + 3, y + 1), t, fill=(255, 255, 255), font=FS); x += im.width + 4
        y += max(i.height for i, _ in row) + 30
    os.makedirs("out/stone/fixes", exist_ok=True); sh.save(f"out/stone/fixes/{fid}.jpg", quality=82)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for fid, items in FIX.items(): sheet(fid, items)
    print("sheets:", len(FIX))

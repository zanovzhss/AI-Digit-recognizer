# Before / after sheets for src/videos/stone/BUGS.md.
# usage: python stone-short/tools/bugsheets.py <new.mp4>
#   1. extracts one still every 0.5 s of <new.mp4> to out/stone/after/half/h_###.jpg (same numbering as out/stone/before/)
#      and a 5-frame strip at every transition to out/stone/after/trans/
#   2. writes out/stone/bugs/<ID>.jpg: the BEFORE stills (previous final) above the AFTER stills (new render), same times
import glob, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

NEW = sys.argv[1]
OUT = "out/stone"
FONT = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
FONT_S = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
B = [194, 319, 350, 398, 458, 533, 583, 635, 756, 805, 854, 938, 992, 1088, 1134, 1182, 1228, 1329, 1400, 1469, 1557]

# bug -> half-second still indices (time = index * 0.5 s) or ("t", frame) for a transition strip
BUGS = {
    "B01": [0, 5, 8], "B02": [("t", 194)], "B03": [17, 19, 20], "B04": [22], "B05": [25], "B06": [28, 30], "B07": [31, 33, 34],
    "B08": [39, 40], "B09": [44, 47, 49], "B10": [52], "B11": [54, ("t", 805)], "B12": [60, 65], "B13": [60], "B14": [73, 75],
    "B15": [85], "B16": [89, 91, 93], "B17": [94, 96], "B18": [99, 101, 103], "B19": [9, 95], "B20": [9, 60], "B21": [8, 37, 62, 100, 107],
    "B23": [8, 107],
}


def extract():
    os.makedirs(f"{OUT}/after/half", exist_ok=True); os.makedirs(f"{OUT}/after/trans", exist_ok=True)
    for f in glob.glob(f"{OUT}/after/half/*.jpg"): os.remove(f)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", NEW, "-vf", "select='not(mod(n\\,15))',scale=270:480", "-fps_mode", "vfr", "-q:v", "3", f"{OUT}/after/half/h_%03d.jpg"], check=True)
    for b in B:
        for o in (-8, -4, 0, 4, 8):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(b + o) / 30 + 0.001:.4f}", "-i", NEW, "-frames:v", "1", "-vf", "scale=135:240", "-q:v", "3", f"{OUT}/after/trans/t_{b}_{o}.jpg"], check=True)


def tiles(root, items):
    ims = []
    for it in items:
        if isinstance(it, tuple):
            strip = Image.new("RGB", (5 * 135, 240))
            for i, o in enumerate((-8, -4, 0, 4, 8)): strip.paste(Image.open(f"{root}/trans/t_{it[1]}_{o}.jpg"), (i * 135, 0))
            ims.append((strip.resize((5 * 108, 192)), f"f{it[1]} -8..+8"))
        else:
            ims.append((Image.open(f"{root}/half/h_{it + 1:03d}.jpg").resize((216, 384)), f"{it * 0.5:.1f} s"))
    return ims


def sheet(bid, items):
    before, after = tiles(f"{OUT}/before", items), tiles(f"{OUT}/after", items)
    W = max(sum(im.width for im, _ in before), sum(im.width for im, _ in after)) + 120
    H = max(im.height for im, _ in before) + max(im.height for im, _ in after) + 30
    sh = Image.new("RGB", (W, H), (24, 24, 28)); d = ImageDraw.Draw(sh)
    y = 0
    for lab, row in (("BEFORE", before), ("AFTER", after)):
        d.text((8, y + 8), lab, fill=(255, 210, 90) if lab == "BEFORE" else (120, 230, 140), font=FONT); d.text((8, y + 34), bid, fill=(230, 230, 230), font=FONT_S)
        x = 120
        for im, t in row:
            sh.paste(im, (x, y)); d.rectangle([x, y, x + 64, y + 20], fill=(0, 0, 0)); d.text((x + 3, y + 1), t, fill=(255, 255, 255), font=FONT_S); x += im.width + 4
        y += max(im.height for im, _ in row) + 30
    os.makedirs(f"{OUT}/bugs", exist_ok=True)
    sh.save(f"{OUT}/bugs/{bid}.jpg", quality=82)


if __name__ == "__main__":
    extract()
    for bid, items in BUGS.items(): sheet(bid, items)
    print("sheets:", len(BUGS))

# Labelled side-by-side sheet: top row ours, bottom row reference, each row with a caption bar.
# Usage: python -I sbs_labeled.py out.jpg "Title" --ours a.jpg ... --ref r1.jpg ... [--h 640] [--oursLabel ..] [--refLabel ..]
import sys
from PIL import Image, ImageDraw, ImageFont

a = sys.argv[1:]
out, title = a[0], a[1]
rows, cur, h = {"--ours": [], "--ref": []}, None, 640
lab = {"--ours": "OURS: IceShort final", "--ref": "REFERENCE (private study)"}
i = 2
while i < len(a):
    x = a[i]
    if x in rows: cur = x
    elif x == "--h": h = int(a[i + 1]); i += 1
    elif x == "--oursLabel": lab["--ours"] = a[i + 1]; i += 1
    elif x == "--refLabel": lab["--ref"] = a[i + 1]; i += 1
    else: rows[cur].append(x)
    i += 1
F = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 26)
FT = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 32)


def row(paths):
    ims = [Image.open(p).convert("RGB") for p in paths]
    ims = [im.resize((round(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    r = Image.new("RGB", (sum(im.width for im in ims) + 8 * (len(ims) - 1), h), "white")
    x = 0
    for im in ims: r.paste(im, (x, 0)); x += im.width + 8
    return r


rs = [(lab[k], row(rows[k])) for k in ("--ours", "--ref") if rows[k]]
W = max(r.width for _, r in rs)
bar, tb = 40, 52
S = Image.new("RGB", (W, tb + sum(r.height + bar for _, r in rs) + 12), (24, 24, 28))
d = ImageDraw.Draw(S)
d.text((10, 10), title, font=FT, fill=(255, 255, 255))
y = tb
for (t, r), col in zip(rs, [(255, 196, 64), (120, 200, 255)]):
    d.text((10, y + 6), t, font=F, fill=col); y += bar
    S.paste(r, (0, y)); y += r.height + 6
S.save(out, quality=88)
print(out, S.size)

# usage: python strip.py <prefix> <frames,comma> <out.jpg> [w=300]   -> one row of stills, labelled with their frame
import sys
from PIL import Image, ImageDraw
pre, frs, outp = sys.argv[1], [int(x) for x in sys.argv[2].split(",")], sys.argv[3]
w = int(sys.argv[4]) if len(sys.argv) > 4 else 300
h = int(w * 16 / 9)
sh = Image.new("RGB", (w * len(frs), h)); d = ImageDraw.Draw(sh)
for i, f in enumerate(frs):
    sh.paste(Image.open(f"{pre}{f}.jpg").resize((w, h)), (i * w, 0)); d.rectangle([i * w, 0, i * w + 44, 16], fill=(0, 0, 0)); d.text((i * w + 3, 2), str(f), fill=(255, 255, 0))
sh.save(outp, quality=88)

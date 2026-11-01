# usage: python scripts/sheet.py out.jpg img1 img2 ...  (side by side, 10 px gaps)
import sys
from PIL import Image
ims = [Image.open(p) for p in sys.argv[2:]]
H = max(i.height for i in ims); W = sum(i.width for i in ims) + 10 * (len(ims) - 1)
s = Image.new("RGB", (W, H), "white"); x = 0
for i in ims: s.paste(i, (x, 0)); x += i.width + 10
s.save(sys.argv[1], quality=85)

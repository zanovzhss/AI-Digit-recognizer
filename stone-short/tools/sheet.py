# Contact sheet of stills with frame labels: python sheet.py out.jpg cols width img1 img2 ...
import sys, os
from PIL import Image, ImageDraw, ImageFont

out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
h = int(w * 16 / 9)
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "black")
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", max(12, w // 14))
except Exception:
    font = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((w, h))
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(im, (x, y))
    lab = os.path.splitext(os.path.basename(f))[0].split("_")[-1]
    d.rectangle([x, y, x + len(lab) * w // 22 + 8, y + w // 12], fill=(0, 0, 0))
    d.text((x + 4, y + 1), lab, fill=(255, 230, 120), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)

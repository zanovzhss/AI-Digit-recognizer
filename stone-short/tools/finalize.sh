#!/usr/bin/env bash
# Final render of StoneShort: 1440x2560 on the GPU (ANGLE / D3D11 only), muxed with stone-short/audio/mix.wav, cut to the
# exact length of voice.wav; then the checks (measure.py, sharpness, contact sheet of one still per second).
# usage: bash stone-short/tools/finalize.sh   (from the project root)
set -euo pipefail
PY=/c/cartoon-shorts/.venv/Scripts/python.exe
RM=/c/cartoon-shorts/node_modules/.bin/remotion
export TEMP="${STONE_TMP:-$TEMP}" TMP="${STONE_TMP:-$TMP}"
mkdir -p out/stone
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 stone-short/voice/voice.wav)
echo "voice.wav: $DUR s"
$RM render src/index.ts StoneShort out/stone/video_2k.mp4 --gl=angle --codec h264 --crf 16 --scale=1.3333333333333333 \
  --concurrency=2 --timeout=240000 2>&1 | grep -v "X3595\|gradient instruction" | tail -2
# Remotion writes a silent track: take the picture from the render and the sound from the mix, cut to the voice length
ffmpeg -v error -y -i out/stone/video_2k.mp4 -i stone-short/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 \
  -t "$DUR" -movflags +faststart out/stone/final.mp4
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames,sample_rate,duration -of default=nw=1 out/stone/final.mp4
$PY measure.py out/stone/final.mp4
$PY stone-short/tools/sharpness.py out/stone/final.mp4
rm -rf out/stone/cs_final && mkdir -p out/stone/cs_final
ffmpeg -v error -y -i out/stone/final.mp4 -vf "select='not(mod(n\,30))',scale=270:480" -fps_mode vfr -q:v 3 out/stone/cs_final/f_%02d.jpg
$PY - <<'PYEOF'
from PIL import Image, ImageDraw, ImageFont
import glob
fs = sorted(glob.glob("out/stone/cs_final/f_*.jpg"))
W, H, cols = 270, 480, 11
rows = (len(fs) + cols - 1) // cols
sh = Image.new("RGB", (cols * W, rows * H), "black"); d = ImageDraw.Draw(sh)
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * H
    sh.paste(Image.open(f), (x, y)); d.rectangle([x, y, x + 50, y + 26], fill=(0, 0, 0)); d.text((x + 4, y + 1), f"{i}s", fill=(255, 230, 120), font=font)
sh.save("out/stone/contact_sheet.jpg", quality=88)
print("contact sheet", sh.size, len(fs), "stills")
PYEOF

#!/usr/bin/env bash
# Checks the finished MP4: streams, size, fps, duration, no audio, no black/frozen-empty frames,
# and extracts review frames at every caption so text and actions can be compared by eye.
set -euo pipefail
MP4="${1:-out/AI_Algorithm_Visualizer_demo.mp4}"
OUT="${2:-out/verify}"
mkdir -p "$OUT"

echo "== streams"
ffprobe -v error -show_entries stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames,duration -of default=nw=1 "$MP4"
echo "== audio streams (must be 0)"
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$MP4" | wc -l
echo "== container duration"
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=nw=1 "$MP4"
echo "== decoded frame count"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$MP4"
echo "== black frames (blackdetect, d>=0.05s)"
ffmpeg -v info -i "$MP4" -vf "blackdetect=d=0.05:pix_th=0.06" -an -f null - 2>&1 | grep -E "black_start" || echo "none"
echo "== review frames"
for t in 0 3 13 15.5 21.5 23 29 31.5 38.5 40.5 45.5 50.6 53 57.5 61.8 65 69.5 74.5 79.8 84 90.5 97.5 105.3 108.5 113 118.5 122 131.5 137.5 146 149 152 157 159.98; do
  ffmpeg -v error -y -ss "$t" -i "$MP4" -frames:v 1 "$OUT/t_$(printf '%07.2f' "$t").png"
done
ls "$OUT" | wc -l

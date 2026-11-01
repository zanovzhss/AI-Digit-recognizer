#!/usr/bin/env bash
# Mux the rendered picture with the mixed soundtrack (Remotion writes a silent audio track: map video from the render,
# audio from mix.wav), then run frame-by-frame QA.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -v error -i out/cellar/video.mp4 -i cellar-short/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -t 7.0 -movflags +faststart out/cellar/final.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration -of compact out/cellar/final.mp4
python3 scripts/short_qa.py out/cellar/final.mp4 out/cellar/qa out/cellar/shots.json

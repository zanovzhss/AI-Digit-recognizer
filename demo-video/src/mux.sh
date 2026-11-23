#!/usr/bin/env bash
# Voice track -> loudness-normalised 48 kHz master -> muxed with the video rendered with holds.
set -euo pipefail
cd "$(dirname "$0")/.."
V=out/voice
ffmpeg -hide_banner -i $V/voice_track.wav -af "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p' > $V/ln1.json
AF=$(python3 -c "import json;m=json.load(open('$V/ln1.json'));print('highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true,aresample=48000'.format(**m))")
ffmpeg -v error -y -i $V/voice_track.wav -af "$AF" -ar 48000 -ac 2 -c:a pcm_s16le $V/voice_master.wav
ffmpeg -v error -y -i $V/video_with_holds.mp4 -i $V/voice_master.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
  -metadata:s:a:0 language=kaz -metadata title="AI Algorithm Visualizer — Zanov Zhanarys · QAIRU" \
  out/AI_Algorithm_Visualizer_demo_kk_voice.mp4
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels,duration -of compact out/AI_Algorithm_Visualizer_demo_kk_voice.mp4

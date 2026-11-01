# The Warm Bucket - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav`, gain only (no EQ, no compression, no pitch).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 336,000 samples = 7.000 s |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-15.0 LUFS**, true peak **-1.2 dBTP**, LRA 1.2 LU, max momentary -11.7 LUFS, max short-term -14.2 LUFS
- Stems: voice -15.6 LUFS, music -25.6 LUFS, sfx -25.4 LUFS (voice gain -0.95 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -1.2 dBTP): max gain reduction 0.61 dB, active (>0.1 dB) on 3.48 % of samples, >0.5 dB on 0.29 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -15.0 LUFS
    Threshold: -25.1 LUFS
  Loudness range:
    LRA:         1.3 LU
    Threshold: -35.1 LUFS
    LRA low:   -15.6 LUFS
    LRA high:  -14.3 LUFS
  True peak:
    Peak:       -1.2 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| street (1) | 0.00-2.00 | -14.3 | -25.4 | -23.4 | -21.5 | 7.2 | 7.4 | 5.2 |
| cellar (2) | 2.00-4.00 | -17.2 | -25.8 | -25.1 | -23.9 | 6.6 | 8.3 | 3.2 |
| ice (3) | 4.00-5.83 | -15.0 | -25.6 | -30.1 | -24.3 | 9.2 | 9.5 | 3.1 |
| end (4) | 5.83-7.00 | -17.6 | -25.3 | -42.4 | -25.2 | 7.6 | 7.1 | 2.4 |

## Music map (original light march, F major, 120 bpm, bar 4 downbeat on 'save')
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): street -10.0, cellar -10.0, ice -10.0, end -10.0. Applied section gains (dB): all -3.4.

No extra rides in this clip.

| time s | frame | music |
|---|---|---|
| 0.13 | 4 | bar 1 street: tuba oom-pah F-F-C7-C7, glockenspiel tune, light snare |
| 2.13 | 64 | bar 2 cellar: pizzicato bass + vibraphone, brushes (F-F-Bb-Bb) |
| 4.13 | 124 | bar 3 ice: music-box sparkle over a pad, Dm-Bb-C7 |
| 6.13 | 184 | bar 4 on 'save': tonic F hit (tuba, horns, glockenspiel, soft cymbal), rings to 7.0 s |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -15.6 LUFS integrated). Street sounds use an open-air yard reverb (cut with the picture at 2.0 s), cellar sounds a small stone room.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.000 | 0.0 | wind (bed, integrated) | cold breeze over the snowy lane | -24 | -24.0 | -39.6 | +0.00 |
| 2 | 0.030 | 0.9 | snow step | footstep in snow 1 | -4 | -10.0 | -25.6 | -0.15 |
| 3 | 0.080 | 2.4 | handle clink | bucket handle shifts | -12 | -18.0 | -33.6 | +0.10 |
| 4 | 0.200 | 6.0 | glide whoosh | camera glides down from rooftop height | -14 | -20.0 | -35.6 | +0.10 |
| 5 | 0.517 | 15.5 | snow step | footstep in snow 2 | -4 | -9.8 | -25.3 | -0.15 |
| 6 | 0.567 | 17.0 | handle clink | bucket handle shifts | -12 | -18.0 | -33.6 | +0.10 |
| 7 | 1.015 | 30.4 | snow step | footstep in snow 3 | -4 | -9.5 | -25.1 | -0.15 |
| 8 | 1.065 | 31.9 | handle clink | bucket handle shifts | -12 | -18.0 | -33.6 | +0.10 |
| 9 | 1.315 | 39.5 | snow step | footstep in snow 4 | -3 | -9.3 | -24.8 | -0.15 |
| 10 | 1.365 | 41.0 | handle clink | bucket handle shifts | -12 | -18.0 | -33.6 | +0.10 |
| 11 | 1.467 | 44.0 | snow step | footstep in snow 5 (stop) | -2 | -8.0 | -23.6 | -0.15 |
| 12 | 1.500 | 45.0 | hatch creak | cellar hatch door creaks open (on 'cellar'), knocks against the wall | -2 | -8.0 | -23.6 | -0.30 |
| 13 | 2.000 | 60.0 | cellar room (bed, integrated) | room tone + wind muffled through the window + lantern flutter | -27 | -27.0 | -42.6 | +0.00 |
| 14 | 2.300 | 69.0 | bucket clank | steel bucket set down on the stone floor (before 'potatoes') | -1 | -7.0 | -22.6 | +0.10 |
| 15 | 4.000 | 120.0 | ice crackle | water freezing: fine ticks + tiny pings as the crystals spread | -6 | -12.0 | -27.6 | +0.00 |
| 16 | 4.900 | 147.0 | warm swell | the heat rising off the ice into the potatoes (on 'heat') | -10 | -16.0 | -31.6 | +0.20 |

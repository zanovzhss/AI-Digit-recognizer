# The Man Who Sold Ice to the Tropics - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav` unchanged (resampled to 48 kHz only: no gain, EQ, compression, pitch or speed change).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 2,648,189 samples = 55.1706 s (voice.wav length) |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-16.8 LUFS**, true peak **-1.1 dBTP**, LRA 3.2 LU, max momentary -10.5 LUFS, max short-term -14.3 LUFS
- Stems: voice -17.1 LUFS, music -27.1 LUFS, sfx -31.8 LUFS (voice gain +0.00 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -0.5 dBTP): max gain reduction -0.00 dB, active (>0.1 dB) on 0.00 % of samples, >0.5 dB on 0.00 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -16.8 LUFS
    Threshold: -26.9 LUFS
  Loudness range:
    LRA:         3.2 LU
    Threshold: -36.8 LUFS
    LRA low:   -18.4 LUFS
    LRA high:  -15.2 LUFS
  True peak:
    Peak:       -1.1 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| A hook+Boston | 0.00-10.35 | -17.3 | -27.8 | -31.1 | -26.1 | 8.8 | 8.9 | 5.3 |
| B joke+melt | 10.35-22.35 | -16.7 | -28.4 | -31.6 | -26.7 | 10.0 | 8.7 | 5.0 |
| C again | 22.35-24.35 | -16.2 | -25.2 | -33.5 | -25.6 | 9.4 | 8.3 | 7.0 |
| D prison | 24.35-28.35 | -19.3 | -27.7 | -27.8 | -25.1 | 5.8 | 6.9 | 1.7 |
| E idea | 28.35-34.35 | -16.4 | -27.4 | -36.1 | -26.8 | 10.4 | 10.3 | 7.3 |
| F towel+sawdust | 34.35-42.35 | -17.5 | -27.8 | -32.7 | -26.8 | 9.3 | 9.6 | 4.2 |
| G voyage | 42.35-48.35 | -18.1 | -26.2 | -31.1 | -25.0 | 6.9 | 6.9 | 3.7 |
| H Calcutta | 48.35-55.17 | -16.9 | -25.1 | -35.6 | -24.7 | 7.8 | 7.1 | 4.4 |

## Music map (original light march, F major, 120 bpm, bar 28 downbeat on 'laughed')
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): all -10.0. Applied section gains (dB): all -5.6.

No extra rides.

| time s | frame | music |
|---|---|---|
| 0.00 | 0 | A hook+Boston |
| 10.35 | 310 | B joke+melt |
| 22.35 | 670 | C again |
| 24.35 | 730 | D prison |
| 28.35 | 850 | E idea |
| 34.35 | 1030 | F towel+sawdust |
| 42.35 | 1270 | G voyage |
| 48.35 | 1450 | H Calcutta |
| 54.35 | 1630 | bar 28 on 'laughed': tonic F hit, rings to the end |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -17.1 LUFS integrated). Outdoor sounds use an open-air yard reverb, the cell and the hold a small room.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.000 | 0.0 | glide whoosh | fast glide in over the sand | -13 | -19.0 | -36.1 | +0.10 |
| 2 | 0.000 | 0.0 | surf (bed, integrated) | waves on the beach + gulls | -22 | -22.0 | -39.1 | +0.00 |
| 3 | 0.900 | 27.0 | plip | a drop of sweat / melt water | -14 | -20.0 | -37.1 | -0.20 |
| 4 | 1.600 | 48.0 | plip | a drop of sweat / melt water | -14 | -20.0 | -37.1 | -0.10 |
| 5 | 1.900 | 57.0 | surf (bed, integrated) | waves on the beach + gulls | -22 | -22.0 | -39.1 | +0.00 |
| 6 | 2.300 | 69.0 | plip | a drop of sweat / melt water | -14 | -20.0 | -37.1 | +0.00 |
| 7 | 2.950 | 88.5 | plip | a drop of sweat / melt water | -14 | -20.0 | -37.1 | +0.10 |
| 8 | 3.400 | 102.0 | plip | a drop of sweat / melt water | -14 | -20.0 | -37.1 | +0.20 |
| 9 | 3.517 | 105.5 | flash shimmer | white flash into 1806 | -10 | -16.0 | -33.1 | +0.00 |
| 10 | 3.567 | 107.0 | ice saw | cutter 1 saws the pond ice | -8 | -14.0 | -31.1 | -0.40 |
| 11 | 3.567 | 107.0 | ice saw | cutter 2 saws the pond ice | -8 | -14.0 | -31.1 | +0.00 |
| 12 | 3.567 | 107.0 | ice saw | cutter 3 saws the pond ice | -8 | -14.0 | -31.1 | +0.40 |
| 13 | 3.567 | 107.0 | winter wind (bed, integrated) | cold wind over the frozen pond | -24 | -24.0 | -41.1 | +0.00 |
| 14 | 5.400 | 162.0 | harbour (winter) (bed, integrated) | water slapping the quay, wind, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 15 | 5.600 | 168.0 | ship bell | the brig's bell | -9 | -15.0 | -32.1 | +0.30 |
| 16 | 6.933 | 208.0 | harbour (winter) (bed, integrated) | water slapping the quay, wind, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 17 | 7.083 | 212.5 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 18 | 7.413 | 222.4 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 19 | 7.743 | 232.3 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 20 | 8.073 | 242.2 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 21 | 8.403 | 252.1 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 22 | 8.733 | 262.0 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 23 | 9.000 | 270.0 | block thunk | an ice block set down on deck | -4 | -10.0 | -27.1 | -0.10 |
| 24 | 9.063 | 271.9 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 25 | 9.393 | 281.8 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 26 | 9.723 | 291.7 | plank step | boots on the gangplank | -12 | -18.0 | -35.1 | +0.00 |
| 27 | 9.767 | 293.0 | harbour (winter) (bed, integrated) | water slapping the quay, wind, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 28 | 9.767 | 293.0 | sail flap | sails fill as the brig leaves | -10 | -16.0 | -33.1 | +0.20 |
| 29 | 9.867 | 296.0 | creak | hull creak | -12 | -18.0 | -35.1 | -0.20 |
| 30 | 11.033 | 331.0 | harbour (winter) (bed, integrated) | street wind | -23 | -23.0 | -40.1 | +0.00 |
| 31 | 11.033 | 331.0 | newspaper | the newsboy shakes the paper | -8 | -14.0 | -31.1 | +0.00 |
| 32 | 12.200 | 366.0 | crowd laughter | the harbour crowd laughs and points | -4 | -10.0 | -27.1 | -0.20 |
| 33 | 12.200 | 366.0 | harbour (winter) (bed, integrated) | water slapping the quay, wind, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 34 | 13.467 | 404.0 | snow step | footstep on the packed snow | -9 | -15.0 | -32.1 | +0.00 |
| 35 | 13.567 | 407.0 | harbour (winter) (bed, integrated) | street wind | -23 | -23.0 | -40.1 | +0.00 |
| 36 | 13.633 | 409.0 | snow step | footstep on the packed snow | -9 | -15.0 | -32.1 | +0.00 |
| 37 | 13.800 | 414.0 | snow step | footstep on the packed snow | -9 | -15.0 | -32.1 | +0.00 |
| 38 | 13.900 | 417.0 | slip | skid on the ice patch, thump, 'oof', stars | -2 | -8.0 | -25.1 | +0.10 |
| 39 | 14.450 | 433.5 | laughter | the newsboy and a passer-by laugh | -9 | -15.0 | -32.1 | -0.30 |
| 40 | 15.700 | 471.0 | drips | the stack dripping | -12 | -18.0 | -35.1 | -0.20 |
| 41 | 15.700 | 471.0 | harbour (tropics) (bed, integrated) | lapping water, warm breeze, insects, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 42 | 15.800 | 474.0 | ship bell | the brig's bell in the hot port | -12 | -18.0 | -35.1 | -0.30 |
| 43 | 17.400 | 522.0 | harbour (tropics) (bed, integrated) | lapping water, warm breeze, insects, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 44 | 19.267 | 578.0 | harbour (tropics) (bed, integrated) | lapping water, warm breeze, insects, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 45 | 19.400 | 582.0 | wallet | the wallet flap opens: empty | -10 | -16.0 | -33.1 | +0.10 |
| 46 | 21.133 | 634.0 | coin roll | the last coin drops out and rolls away (on 'dollars') | -5 | -11.0 | -28.1 | +0.25 |
| 47 | 22.000 | 660.0 | harbour (winter) (bed, integrated) | water slapping the quay, wind, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 48 | 22.000 | 660.0 | ship bell | the bell as the brig leaves again | -10 | -16.0 | -33.1 | +0.20 |
| 49 | 22.050 | 661.5 | sail flap | sails fill | -11 | -17.0 | -34.1 | +0.00 |
| 50 | 23.633 | 709.0 | harbour (winter) (bed, integrated) | water slapping the quay, wind, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 51 | 23.633 | 709.0 | ship bell | the bell as the brig leaves again | -10 | -16.0 | -33.1 | -0.20 |
| 52 | 23.683 | 710.5 | sail flap | sails fill | -11 | -17.0 | -34.1 | +0.00 |
| 53 | 24.533 | 736.0 | drips | bigger puddles | -11 | -17.0 | -34.1 | +0.00 |
| 54 | 24.533 | 736.0 | harbour (tropics) (bed, integrated) | lapping water, warm breeze, insects, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 55 | 25.133 | 754.0 | cell door | the cell door slams, a key turns | -1 | -7.0 | -24.1 | +0.20 |
| 56 | 25.133 | 754.0 | cell room (bed, integrated) | stone room tone, air through the window | -27 | -27.0 | -44.1 | +0.00 |
| 57 | 26.967 | 809.0 | yawn | the guard's long yawn (on 'prison') | -6 | -12.0 | -29.1 | +0.25 |
| 58 | 27.867 | 836.0 | cell room (bed, integrated) | stone room tone, air through the window | -27 | -27.0 | -44.1 | +0.00 |
| 59 | 28.700 | 861.0 | idea ding | the light-bulb moment (on 'figures') | -6 | -12.0 | -29.1 | -0.10 |
| 60 | 29.800 | 894.0 | cell room (bed, integrated) | stone room tone, air through the window | -27 | -27.0 | -44.1 | +0.00 |
| 61 | 29.800 | 894.0 | icicle drips | the icicle melting in the window | -10 | -16.0 | -33.1 | +0.20 |
| 62 | 31.667 | 950.0 | cell room (bed, integrated) | stone room tone, air through the window | -27 | -27.0 | -44.1 | +0.00 |
| 63 | 31.667 | 950.0 | warm air | warm air drifting in through the window | -11 | -17.0 | -34.1 | +0.30 |
| 64 | 34.100 | 1023.0 | cell room (bed, integrated) | stone room tone, air through the window | -27 | -27.0 | -44.1 | +0.00 |
| 65 | 34.267 | 1028.0 | towel | the towel wrapped around the bottle (on 'wrapped') | -7 | -13.0 | -30.1 | +0.00 |
| 66 | 36.067 | 1082.0 | cell room (bed, integrated) | stone room tone, air through the window | -27 | -27.0 | -44.1 | +0.00 |
| 67 | 36.067 | 1082.0 | warm air | warm air drifting toward the towel | -12 | -18.0 | -35.1 | +0.00 |
| 68 | 37.933 | 1138.0 | bounce | the warm air bounces off the towel (on 'heat') | -9 | -15.0 | -32.1 | +0.00 |
| 69 | 38.767 | 1163.0 | hold (bed, integrated) | inside the hold: room tone + hull creaks | -25 | -25.0 | -42.1 | +0.00 |
| 70 | 38.817 | 1164.5 | shovel | shovel into sawdust, the throw, patter | -7 | -13.0 | -30.1 | -0.30 |
| 71 | 39.367 | 1181.0 | shovel | shovel into sawdust, the throw, patter | -7 | -13.0 | -30.1 | -0.10 |
| 72 | 39.917 | 1197.5 | shovel | shovel into sawdust, the throw, patter | -7 | -13.0 | -30.1 | +0.10 |
| 73 | 40.467 | 1214.0 | shovel | shovel into sawdust, the throw, patter | -7 | -13.0 | -30.1 | +0.30 |
| 74 | 40.667 | 1220.0 | mill yard (bed, integrated) | birds, breeze, a distant saw | -23 | -23.0 | -40.1 | +0.00 |
| 75 | 41.067 | 1232.0 | shovel | sawdust thrown onto the heap | -10 | -16.0 | -33.1 | -0.30 |
| 76 | 42.167 | 1265.0 | shovel | sawdust thrown onto the heap | -10 | -16.0 | -33.1 | -0.30 |
| 77 | 43.033 | 1291.0 | creak | the brig's hull working in the swell | -10 | -16.0 | -33.1 | +0.00 |
| 78 | 43.033 | 1291.0 | open sea (bed, integrated) | waves and wind at sea | -21 | -21.0 | -38.1 | +0.00 |
| 79 | 43.133 | 1294.0 | sail flap | sails full of wind | -12 | -18.0 | -35.1 | +0.20 |
| 80 | 43.267 | 1298.0 | shovel | sawdust thrown onto the heap | -10 | -16.0 | -33.1 | -0.30 |
| 81 | 44.367 | 1331.0 | hold (bed, integrated) | inside the hold: room tone + hull creaks | -25 | -25.0 | -42.1 | +0.00 |
| 82 | 44.733 | 1342.0 | page flip | a calendar month flips over | -6 | -12.0 | -29.1 | -0.10 |
| 83 | 45.400 | 1362.0 | page flip | a calendar month flips over | -6 | -12.0 | -29.1 | -0.10 |
| 84 | 45.967 | 1379.0 | page flip | a calendar month flips over | -6 | -12.0 | -29.1 | -0.10 |
| 85 | 46.433 | 1393.0 | page flip | a calendar month flips over | -6 | -12.0 | -29.1 | -0.10 |
| 86 | 47.267 | 1418.0 | harbour (Calcutta) (bed, integrated) | river water, warm breeze, gulls | -23 | -23.0 | -40.1 | +0.00 |
| 87 | 47.267 | 1418.0 | ship bell | the brig's bell in Calcutta | -11 | -17.0 | -34.1 | -0.30 |
| 88 | 47.400 | 1422.0 | hatch | the hatch cover lifted off and set down | -5 | -11.0 | -28.1 | +0.10 |
| 89 | 47.900 | 1437.0 | ice sparkle | the ice is still frozen under the sawdust | -9 | -15.0 | -32.1 | +0.00 |
| 90 | 49.000 | 1470.0 | market (bed, integrated) | the ice market's crowd + clinks | -21 | -21.0 | -38.1 | +0.00 |
| 91 | 50.533 | 1516.0 | clink | ice and glasses at the stall | -10 | -16.0 | -33.1 | -0.20 |
| 92 | 51.633 | 1549.0 | clink | ice and glasses at the stall | -10 | -16.0 | -33.1 | -0.05 |
| 93 | 52.533 | 1576.0 | clink | ice and glasses at the stall | -10 | -16.0 | -33.1 | +0.10 |
| 94 | 53.700 | 1611.0 | clink | ice and glasses at the stall | -10 | -16.0 | -33.1 | +0.25 |

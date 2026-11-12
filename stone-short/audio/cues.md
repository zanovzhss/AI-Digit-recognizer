# The Stone That Saved a Village - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav` unchanged (resampled to 48 kHz only: no gain, EQ, compression, pitch or speed change).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 2,600,993 samples = 54.1874 s (voice.wav length) |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-18.8 LUFS**, true peak **-1.2 dBTP**, LRA 7.1 LU, max momentary -9.6 LUFS, max short-term -14.3 LUFS
- Stems: voice -19.1 LUFS, music -29.1 LUFS, sfx -33.0 LUFS (voice gain +0.00 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -0.5 dBTP): max gain reduction -0.00 dB, active (>0.1 dB) on 0.00 % of samples, >0.5 dB on 0.00 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -18.8 LUFS
    Threshold: -29.0 LUFS
  Loudness range:
    LRA:         7.2 LU
    Threshold: -39.0 LUFS
    LRA low:   -22.2 LUFS
    LRA high:  -15.0 LUFS
  True peak:
    Peak:       -1.2 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| A the stone | 0.00-5.90 | -18.5 | -28.4 | -43.6 | -28.3 | 9.8 | 9.0 | 3.2 |
| B 1896 | 5.90-13.30 | -20.7 | -29.8 | -32.0 | -27.8 | 7.1 | 6.9 | 2.6 |
| C 1933 | 13.30-17.80 | -22.3 | -30.5 | -33.5 | -28.8 | 6.5 | 8.4 | 4.4 |
| D the carving | 17.80-21.20 | -18.1 | -29.3 | -34.8 | -28.1 | 10.1 | 9.0 | 3.4 |
| E eighty years | 21.20-28.40 | -20.4 | -27.5 | -40.6 | -27.3 | 6.9 | 7.3 | 3.6 |
| F forgotten stones | 28.40-33.10 | -19.1 | -31.5 | -44.1 | -31.3 | 12.2 | 12.4 | 8.9 |
| G eleven families | 33.10-37.80 | -20.6 | -28.4 | -43.0 | -28.2 | 7.6 | 7.8 | 3.3 |
| H 2011 | 37.80-46.40 | -17.9 | -29.3 | -29.5 | -27.0 | 9.1 | 9.1 | 6.7 |
| I the valley | 46.40-49.10 | -14.1 | -29.5 | -27.5 | -25.4 | 11.3 | 10.7 | 3.7 |
| J below the stone | 49.10-51.90 | -22.3 | -40.4 | -34.6 | -33.6 | 11.3 | 15.8 | 8.0 |
| K still standing | 51.90-54.19 | -21.6 | -27.4 | -45.1 | -28.6 | 7.0 | 14.8 | 2.5 |

## Music map (original score, sections cut to the story beats)
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): all -10.0. Applied section gains (dB): all -3.8.

No extra rides.

| time s | frame | music |
|---|---|---|
| 0.00 | 0 | A the stone |
| 5.90 | 177 | B 1896 |
| 13.30 | 399 | C 1933 |
| 17.80 | 534 | D the carving |
| 21.20 | 636 | E eighty years |
| 28.40 | 852 | F forgotten stones |
| 33.10 | 993 | G eleven families |
| 37.80 | 1134 | H 2011 |
| 46.40 | 1392 | I the valley |
| 49.10 | 1473 | J below the stone |
| 51.90 | 1557 | K still standing |
| 53.26 | 1598 | warm D major chord on 'still standing', rings to the end |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -19.1 LUFS integrated). Outdoor sounds use an open-air yard reverb, interiors a small room.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | -0.133 | -4.0 | bed: hill_golden (bed, integrated) | shot 1 ambience | -25 | -25.0 | -44.1 | +0.00 |
| 2 | 3.467 | 104.0 | crane up | the lens pulls off the carved face into the wind | -18 | -24.0 | -43.1 | +0.00 |
| 3 | 5.867 | 176.0 | push in | push back into the carved years | -17 | -23.0 | -42.1 | +0.00 |
| 4 | 6.267 | 188.0 | bed: storm (bed, integrated) | shot 2 ambience | -20 | -20.0 | -39.1 | +0.00 |
| 5 | 7.467 | 224.0 | the swell (bed, integrated) | a low roar builds far out at sea | -10 | -10.0 | -29.1 | +0.00 |
| 6 | 10.433 | 313.0 | bed: storm (bed, integrated) | shot 3 ambience | -20 | -20.0 | -39.1 | +0.00 |
| 7 | 11.533 | 346.0 | bed: storm (bed, integrated) | shot 4 ambience | -20 | -20.0 | -39.1 | +0.00 |
| 8 | 13.067 | 392.0 | bed: storm (bed, integrated) | shot 5 ambience | -20 | -20.0 | -39.1 | +0.00 |
| 9 | 15.067 | 452.0 | water between the houses (bed, integrated) | water rushing between the 1933 houses, at a distance | -13 | -13.0 | -32.1 | +0.00 |
| 10 | 15.133 | 454.0 | bed: storm (bed, integrated) | shot 6 ambience | -20 | -20.0 | -39.1 | +0.00 |
| 11 | 17.600 | 528.0 | bed: lantern (bed, integrated) | shot 7 ambience | -26 | -26.0 | -45.1 | +0.00 |
| 12 | 17.867 | 536.0 | chisel tap 1 | mallet on chisel into granite | -9 | -15.0 | -34.1 | +0.25 |
| 13 | 18.333 | 550.0 | chisel tap 2 | mallet on chisel into granite | -9 | -15.0 | -34.1 | +0.25 |
| 14 | 18.800 | 564.0 | chisel tap 3 | mallet on chisel into granite | -9 | -15.0 | -34.1 | +0.25 |
| 15 | 19.267 | 578.0 | chisel tap 4 | mallet on chisel into granite | -9 | -15.0 | -34.1 | +0.25 |
| 16 | 19.300 | 579.0 | bed: lantern (bed, integrated) | shot 8 ambience | -26 | -26.0 | -45.1 | +0.00 |
| 17 | 19.433 | 583.0 | rope creak 1 | the haul ropes groan over the sledge | -12 | -18.0 | -37.1 | -0.20 |
| 18 | 19.667 | 590.0 | haulers' feet | feet digging into the path | -18 | -24.0 | -43.1 | +0.00 |
| 19 | 20.067 | 602.0 | rope creak 2 | the haul ropes groan over the sledge | -12 | -18.0 | -37.1 | -0.20 |
| 20 | 20.633 | 619.0 | rope creak 3 | the haul ropes groan over the sledge | -12 | -18.0 | -37.1 | -0.20 |
| 21 | 20.933 | 628.0 | bed: town (bed, integrated) | shot 9 ambience | -25 | -25.0 | -44.1 | +0.00 |
| 22 | 21.333 | 640.0 | time-lapse | the town grows: a long airy rush | -20 | -26.0 | -45.1 | +0.00 |
| 23 | 25.067 | 752.0 | bed: harbour (bed, integrated) | shot 10 ambience | -23 | -23.0 | -42.1 | +0.00 |
| 24 | 26.700 | 801.0 | bed: market (bed, integrated) | shot 11 ambience | -22 | -22.0 | -41.1 | +0.00 |
| 25 | 27.500 | 825.0 | gull swoop | a gull swoops in | -16 | -22.0 | -41.1 | +0.40 |
| 26 | 27.767 | 833.0 | gull squawk | the gull's cry as it grabs the fish | -11 | -17.0 | -36.1 | +0.30 |
| 27 | 27.833 | 835.0 | wings | wing flaps as it flies off | -14 | -20.0 | -39.1 | -0.20 |
| 28 | 28.267 | 848.0 | bed: corner (bed, integrated) | shot 12 ambience | -25 | -25.0 | -44.1 | +0.00 |
| 29 | 30.167 | 905.0 | sparrow | a sparrow chirps near his crumbs | -16 | -22.0 | -41.1 | +0.30 |
| 30 | 31.133 | 934.0 | bed: corner (bed, integrated) | shot 13 ambience | -25 | -25.0 | -44.1 | +0.00 |
| 31 | 32.867 | 986.0 | bed: dawn (bed, integrated) | shot 14 ambience | -24 | -24.0 | -43.1 | +0.00 |
| 32 | 36.133 | 1084.0 | bed: dawn (bed, integrated) | shot 15 ambience | -24 | -24.0 | -43.1 | +0.00 |
| 33 | 37.633 | 1129.0 | bed: room (bed, integrated) | shot 16 ambience | -30 | -30.0 | -49.1 | +0.00 |
| 34 | 37.800 | 1134.0 | page | the calendar page stirs | -20 | -26.0 | -45.1 | +0.00 |
| 35 | 39.267 | 1178.0 | bed: room (bed, integrated) | shot 17 ambience | -30 | -30.0 | -49.1 | +0.00 |
| 36 | 39.333 | 1180.0 | earthquake rumble (bed, integrated) | a low rumble swells up out of the ground | -9 | -9.0 | -28.1 | +0.00 |
| 37 | 39.533 | 1186.0 | cup rattle | the teacup and the lid chatter on the table | -10 | -16.0 | -35.1 | +0.15 |
| 38 | 40.733 | 1222.0 | bed: map (bed, integrated) | shot 18 ambience | -30 | -30.0 | -49.1 | +0.00 |
| 39 | 41.433 | 1243.0 | boom | the quake far offshore | -12 | -18.0 | -37.1 | +0.00 |
| 40 | 43.367 | 1301.0 | wave line | a deep rush as the wave line heads for the coast | -15 | -21.0 | -40.1 | +0.00 |
| 41 | 43.933 | 1318.0 | roar: town (bed, integrated) | the water mass sweeps over the town (wide, distant) | -9 | -9.0 | -28.1 | +0.00 |
| 42 | 44.133 | 1324.0 | bed: wave (bed, integrated) | shot 19 ambience | -24 | -24.0 | -43.1 | +0.00 |
| 43 | 46.533 | 1396.0 | bed: valley (bed, integrated) | shot 20 ambience | -25 | -25.0 | -44.1 | +0.00 |
| 44 | 46.533 | 1396.0 | roar: valley (bed, integrated) | the water climbs the valley, far below | -10 | -10.0 | -29.1 | +0.00 |
| 45 | 46.533 | 1396.0 | whip | the whip into the valley | -15 | -21.0 | -40.1 | +0.00 |
| 46 | 46.733 | 1402.0 | running feet | people run uphill past the lens | -14 | -20.0 | -39.1 | +0.00 |
| 47 | 48.833 | 1465.0 | bed: valley (bed, integrated) | shot 21 ambience | -25 | -25.0 | -44.1 | +0.00 |
| 48 | 49.400 | 1482.0 | fizz | the foam stops and drains away | -16 | -22.0 | -41.1 | +0.00 |
| 49 | 51.700 | 1551.0 | bed: sunset (bed, integrated) | shot 22 ambience | -30 | -30.0 | -49.1 | +0.00 |
| 50 | 52.000 | 1560.0 | birdsong (bed, integrated) | evening birds over the eleven houses | -24 | -24.0 | -43.1 | +0.00 |

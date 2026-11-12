# The Stone That Saved a Village - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav` unchanged (resampled to 48 kHz only: no gain, EQ, compression, pitch or speed change).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 2,600,993 samples = 54.1874 s (voice.wav length) |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-19.1 LUFS**, true peak **-2.2 dBTP**, LRA 7.4 LU, max momentary -9.7 LUFS, max short-term -14.6 LUFS
- Stems: voice -19.1 LUFS, music -99.0 LUFS, sfx -36.9 LUFS (voice gain +0.00 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -0.5 dBTP): max gain reduction -0.00 dB, active (>0.1 dB) on 0.00 % of samples, >0.5 dB on 0.00 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -19.1 LUFS
    Threshold: -29.5 LUFS
  Loudness range:
    LRA:         7.4 LU
    Threshold: -39.5 LUFS
    LRA low:   -22.8 LUFS
    LRA high:  -15.4 LUFS
  True peak:
    Peak:       -2.2 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| A the stone | 0.00-5.90 | -18.5 | - | -47.6 | -47.6 | 29.1 | 28.4 | 23.1 |
| B 1896 | 5.90-13.30 | -20.7 | - | -35.1 | -35.1 | 14.4 | 16.7 | 9.8 |
| C 1933 | 13.30-17.80 | -22.3 | - | -37.5 | -37.5 | 15.3 | 21.4 | 12.8 |
| D the carving | 17.80-21.20 | -18.1 | - | -38.7 | -38.7 | 20.7 | 19.4 | 15.5 |
| E eighty years | 21.20-28.40 | -20.4 | - | -44.7 | -44.7 | 24.3 | 26.1 | 20.0 |
| F forgotten stones | 28.40-33.10 | -19.1 | - | -47.3 | -47.3 | 28.2 | 28.0 | 25.1 |
| G eleven families | 33.10-37.80 | -20.6 | - | -47.0 | -47.0 | 26.4 | 26.2 | 22.3 |
| H 2011 | 37.80-46.40 | -17.9 | - | -33.1 | -33.1 | 15.2 | 23.1 | 12.9 |
| I the valley | 46.40-49.10 | -14.1 | - | -32.4 | -32.4 | 18.3 | 17.1 | 10.7 |
| J below the stone | 49.10-51.90 | -22.3 | - | -37.5 | -37.5 | 15.2 | 21.2 | 10.1 |
| K still standing | 51.90-54.19 | -21.6 | - | -48.4 | -48.4 | 26.8 | 29.2 | 22.4 |

## Music map (original score, sections cut to the story beats)
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): all -10.0. Applied section gains (dB): .

No extra rides.

| time s | frame | music |
|---|---|---|
| 0.00 | 0 | no music (removed in the rebuild): voice + SFX only |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -19.1 LUFS integrated). Outdoor sounds use an open-air yard reverb, interiors a small room.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | -0.133 | -4.0 | bed: hill_golden (bed, integrated) | shot 1 ambience | -25 | -29.0 | -48.1 | +0.00 |
| 2 | 3.467 | 104.0 | crane up | the lens pulls off the carved face into the wind | -18 | -28.0 | -47.1 | +0.00 |
| 3 | 6.267 | 188.0 | bed: storm (bed, integrated) | shot 2 ambience | -20 | -24.0 | -43.1 | +0.00 |
| 4 | 6.867 | 206.0 | the swell (bed, integrated) | a low roar builds far out at sea | -10 | -14.0 | -33.1 | +0.00 |
| 5 | 10.433 | 313.0 | bed: storm (bed, integrated) | shot 3 ambience | -20 | -24.0 | -43.1 | +0.00 |
| 6 | 11.533 | 346.0 | bed: storm (bed, integrated) | shot 4 ambience | -20 | -24.0 | -43.1 | +0.00 |
| 7 | 13.067 | 392.0 | bed: storm (bed, integrated) | shot 5 ambience | -20 | -24.0 | -43.1 | +0.00 |
| 8 | 15.133 | 454.0 | bed: storm (bed, integrated) | shot 6 ambience | -20 | -24.0 | -43.1 | +0.00 |
| 9 | 15.333 | 460.0 | water between the houses (bed, integrated) | water rushing between the 1933 houses, at a distance | -13 | -17.0 | -36.1 | +0.00 |
| 10 | 17.600 | 528.0 | bed: lantern (bed, integrated) | shot 7 ambience | -26 | -30.0 | -49.1 | +0.00 |
| 11 | 17.867 | 536.0 | chisel tap 1 | mallet on chisel into granite | -9 | -19.0 | -38.1 | +0.25 |
| 12 | 18.333 | 550.0 | chisel tap 2 | mallet on chisel into granite | -9 | -19.0 | -38.1 | +0.25 |
| 13 | 18.800 | 564.0 | chisel tap 3 | mallet on chisel into granite | -9 | -19.0 | -38.1 | +0.25 |
| 14 | 19.267 | 578.0 | chisel tap 4 | mallet on chisel into granite | -9 | -19.0 | -38.1 | +0.25 |
| 15 | 19.300 | 579.0 | bed: lantern (bed, integrated) | shot 8 ambience | -26 | -30.0 | -49.1 | +0.00 |
| 16 | 19.433 | 583.0 | rope creak 1 | the haul ropes groan over the sledge | -12 | -22.0 | -41.1 | -0.20 |
| 17 | 19.667 | 590.0 | haulers' feet | feet digging into the path | -18 | -28.0 | -47.1 | +0.00 |
| 18 | 20.067 | 602.0 | rope creak 2 | the haul ropes groan over the sledge | -12 | -22.0 | -41.1 | -0.20 |
| 19 | 20.633 | 619.0 | rope creak 3 | the haul ropes groan over the sledge | -12 | -22.0 | -41.1 | -0.20 |
| 20 | 20.933 | 628.0 | bed: town (bed, integrated) | shot 9 ambience | -25 | -29.0 | -48.1 | +0.00 |
| 21 | 21.333 | 640.0 | time-lapse | the town grows: a long airy rush | -20 | -30.0 | -49.1 | +0.00 |
| 22 | 25.067 | 752.0 | bed: harbour (bed, integrated) | shot 10 ambience | -23 | -27.0 | -46.1 | +0.00 |
| 23 | 26.700 | 801.0 | bed: market (bed, integrated) | shot 11 ambience | -22 | -26.0 | -45.1 | +0.00 |
| 24 | 27.500 | 825.0 | gull swoop | a gull swoops in | -16 | -26.0 | -45.1 | +0.40 |
| 25 | 27.767 | 833.0 | gull squawk | the gull's cry as it grabs the fish | -11 | -21.0 | -40.1 | +0.30 |
| 26 | 27.833 | 835.0 | wings | wing flaps as it flies off | -14 | -24.0 | -43.1 | -0.20 |
| 27 | 28.267 | 848.0 | bed: corner (bed, integrated) | shot 12 ambience | -25 | -29.0 | -48.1 | +0.00 |
| 28 | 30.167 | 905.0 | sparrow | a sparrow chirps near his crumbs | -16 | -26.0 | -45.1 | +0.30 |
| 29 | 31.133 | 934.0 | bed: corner (bed, integrated) | shot 13 ambience | -25 | -29.0 | -48.1 | +0.00 |
| 30 | 32.867 | 986.0 | bed: dawn (bed, integrated) | shot 14 ambience | -24 | -28.0 | -47.1 | +0.00 |
| 31 | 36.133 | 1084.0 | bed: dawn (bed, integrated) | shot 15 ambience | -24 | -28.0 | -47.1 | +0.00 |
| 32 | 37.633 | 1129.0 | bed: room (bed, integrated) | shot 16 ambience | -30 | -34.0 | -53.1 | +0.00 |
| 33 | 37.800 | 1134.0 | page | the calendar page stirs | -20 | -30.0 | -49.1 | +0.00 |
| 34 | 39.267 | 1178.0 | bed: room (bed, integrated) | shot 17 ambience | -30 | -34.0 | -53.1 | +0.00 |
| 35 | 39.333 | 1180.0 | earthquake rumble (bed, integrated) | a low rumble swells up out of the ground | -9 | -13.0 | -32.1 | +0.00 |
| 36 | 39.533 | 1186.0 | cup rattle | the teacup and the lid chatter on the table | -10 | -20.0 | -39.1 | +0.15 |
| 37 | 40.733 | 1222.0 | bed: map (bed, integrated) | shot 18 ambience | -30 | -34.0 | -53.1 | +0.00 |
| 38 | 41.433 | 1243.0 | boom | the quake far offshore | -12 | -22.0 | -41.1 | +0.00 |
| 39 | 43.367 | 1301.0 | wave line | a deep rush as the wave line heads for the coast | -15 | -25.0 | -44.1 | +0.00 |
| 40 | 43.933 | 1318.0 | roar: town (bed, integrated) | the water mass sweeps over the town (wide, distant) | -9 | -13.0 | -32.1 | +0.00 |
| 41 | 44.133 | 1324.0 | bed: wave (bed, integrated) | shot 19 ambience | -24 | -28.0 | -47.1 | +0.00 |
| 42 | 46.533 | 1396.0 | bed: valley (bed, integrated) | shot 20 ambience | -25 | -29.0 | -48.1 | +0.00 |
| 43 | 46.533 | 1396.0 | roar: valley (bed, integrated) | the water climbs the valley, far below | -10 | -14.0 | -33.1 | +0.00 |
| 44 | 46.533 | 1396.0 | whip | the whip into the valley | -15 | -25.0 | -44.1 | +0.00 |
| 45 | 46.733 | 1402.0 | running feet | people run uphill past the lens | -14 | -24.0 | -43.1 | +0.00 |
| 46 | 48.833 | 1465.0 | bed: valley (bed, integrated) | shot 21 ambience | -25 | -29.0 | -48.1 | +0.00 |
| 47 | 49.400 | 1482.0 | fizz | the foam stops and drains away | -16 | -26.0 | -45.1 | +0.00 |
| 48 | 51.700 | 1551.0 | bed: sunset (bed, integrated) | shot 22 ambience | -30 | -34.0 | -53.1 | +0.00 |
| 49 | 52.000 | 1560.0 | birdsong (bed, integrated) | evening birds over the eleven houses | -24 | -28.0 | -47.1 | +0.00 |

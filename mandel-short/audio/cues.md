# The Man Who Won the Lottery 14 Times - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav` unchanged (resampled to 48 kHz only: no gain, EQ, compression, pitch or speed change).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 2,589,191 samples = 53.9415 s (voice.wav length) |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-18.4 LUFS**, true peak **-2.2 dBTP**, LRA 3.4 LU, max momentary -13.0 LUFS, max short-term -15.9 LUFS
- Stems: voice -18.9 LUFS, music -28.9 LUFS, sfx -34.0 LUFS (voice gain +0.00 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -0.5 dBTP): max gain reduction -0.00 dB, active (>0.1 dB) on 0.00 % of samples, >0.5 dB on 0.00 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -18.4 LUFS
    Threshold: -28.5 LUFS
  Loudness range:
    LRA:         3.4 LU
    Threshold: -38.4 LUFS
    LRA low:   -19.9 LUFS
    LRA high:  -16.5 LUFS
  True peak:
    Peak:       -2.2 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| A hook | 0.00-3.80 | -20.2 | -27.9 | -29.4 | -25.6 | 5.3 | 5.8 | 0.2 |
| B Bucharest | 3.80-9.80 | -18.5 | -30.1 | -36.1 | -29.1 | 10.6 | 11.0 | 5.8 |
| C the idea | 9.80-17.50 | -19.2 | -30.4 | -38.6 | -29.8 | 10.6 | 10.7 | 8.2 |
| D friends | 17.50-21.20 | -17.4 | -27.3 | -35.8 | -26.7 | 9.3 | 9.6 | 4.8 |
| E Melbourne | 21.20-25.40 | -16.4 | -28.9 | -34.0 | -27.7 | 11.3 | 11.5 | 8.8 |
| F Virginia 1992 | 25.40-34.60 | -19.2 | -30.1 | -38.2 | -29.7 | 10.5 | 11.1 | 5.7 |
| G the operation | 34.60-41.30 | -18.9 | -27.9 | -31.3 | -26.3 | 7.4 | 7.5 | 3.5 |
| H three days | 41.30-44.60 | -19.3 | -27.0 | -35.1 | -26.4 | 7.2 | 7.9 | 4.7 |
| I the winning ticket | 44.60-47.40 | -20.2 | -28.5 | -38.0 | -28.5 | 8.3 | 6.8 | 2.1 |
| J new rules | 47.40-51.50 | -18.5 | -30.2 | -36.0 | -29.3 | 10.8 | 10.6 | 5.7 |
| K the island | 51.50-53.94 | -20.6 | -27.6 | -36.4 | -27.1 | 6.5 | 8.8 | 2.1 |

## Music map (original score, 120 bpm, sections cut to the story beats)
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): all -10.0. Applied section gains (dB): all -6.8.

No extra rides.

| time s | frame | music |
|---|---|---|
| 0.00 | 0 | A hook |
| 3.80 | 114 | B Bucharest |
| 9.80 | 294 | C the idea |
| 17.50 | 525 | D friends |
| 21.20 | 636 | E Melbourne |
| 25.40 | 762 | F Virginia 1992 |
| 34.60 | 1038 | G the operation |
| 41.30 | 1239 | H three days |
| 44.60 | 1338 | I the winning ticket |
| 47.40 | 1422 | J new rules |
| 51.50 | 1545 | K the island |
| 53.30 | 1599 | final Bb chord on 'island', rings to the end |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -18.9 LUFS integrated). Outdoor sounds use an open-air yard reverb, interiors a small room.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.000 | 0.0 | bed: hall (bed, integrated) | shot 1 ambience | -26 | -26.0 | -44.9 | +0.00 |
| 2 | 0.000 | 0.0 | crowd cheer (bed, integrated) | the hall cheering the winner | -11 | -11.0 | -29.9 | +0.00 |
| 3 | 0.050 | 1.5 | confetti pop | confetti cannon | -9 | -15.0 | -33.9 | -0.30 |
| 4 | 2.033 | 61.0 | stiff tip | the neighbour goes rigid and tips back | -12 | -18.0 | -36.9 | +0.30 |
| 5 | 2.633 | 79.0 | heap thud | he lands in the confetti heap | -7 | -13.0 | -31.9 | +0.35 |
| 6 | 2.933 | 88.0 | stars | circling stars over his head | -15 | -21.0 | -39.9 | +0.35 |
| 7 | 3.533 | 106.0 | bed: hall (bed, integrated) | shot 2 ambience | -26 | -26.0 | -44.9 | +0.00 |
| 8 | 3.533 | 106.0 | page swish | push-in to the page | -14 | -20.0 | -38.9 | +0.00 |
| 9 | 4.133 | 124.0 | into 1962 | the crossfade into the flat | -16 | -22.0 | -40.9 | +0.00 |
| 10 | 4.133 | 124.0 | bed: flat (bed, integrated) | shot 3 ambience | -24 | -24.0 | -42.9 | +0.00 |
| 11 | 5.467 | 164.0 | bed: flat (bed, integrated) | shot 4 ambience | -24 | -24.0 | -42.9 | +0.00 |
| 12 | 6.500 | 195.0 | moth | a moth flutters out of his pocket | -12 | -18.0 | -36.9 | -0.20 |
| 13 | 7.833 | 235.0 | bed: flat (bed, integrated) | shot 5 ambience | -24 | -24.0 | -42.9 | +0.00 |
| 14 | 8.900 | 267.0 | pencil spring | the pencil springs up like an antenna | -9 | -15.0 | -33.9 | +0.20 |
| 15 | 9.200 | 276.0 | paper | push into the headline | -14 | -20.0 | -38.9 | +0.00 |
| 16 | 9.633 | 289.0 | bed: wall (bed, integrated) | shot 6 ambience | -27 | -27.0 | -45.9 | +0.00 |
| 17 | 10.000 | 300.0 | cells on | the wall's cells blink on | -16 | -22.0 | -40.9 | +0.00 |
| 18 | 13.567 | 407.0 | scale clank | the scale tips to the prize | -8 | -14.0 | -32.9 | -0.30 |
| 19 | 13.687 | 410.6 | coin chink | coins in the prize bag | -14 | -20.0 | -38.9 | -0.30 |
| 20 | 13.767 | 413.0 | bed: flat (bed, integrated) | shot 7 ambience | -24 | -24.0 | -42.9 | +0.00 |
| 21 | 15.000 | 450.0 | friends laugh | the friends laughing at him | -10 | -16.0 | -34.9 | +0.00 |
| 22 | 15.300 | 459.0 | cuckoo | a twirled finger: a little cuckoo call | -16 | -22.0 | -40.9 | +0.40 |
| 23 | 15.700 | 471.0 | bed: wall (bed, integrated) | shot 8 ambience | -27 | -27.0 | -45.9 | +0.00 |
| 24 | 16.067 | 482.0 | sinking | a friend sinks into the tickets | -12 | -18.0 | -36.9 | +0.00 |
| 25 | 17.333 | 520.0 | bed: flat (bed, integrated) | shot 9 ambience | -24 | -24.0 | -42.9 | +0.00 |
| 26 | 18.000 | 540.0 | coins | coins chip in to the jar | -11 | -17.0 | -35.9 | +0.20 |
| 27 | 18.350 | 550.5 | coins 2 | more coins | -14 | -20.0 | -38.9 | +0.25 |
| 28 | 18.733 | 562.0 | pencils | pencils scratching fast | -15 | -21.0 | -39.9 | +0.00 |
| 29 | 18.967 | 569.0 | steam | steam puffs from a friend's ears | -15 | -21.0 | -39.9 | +0.30 |
| 30 | 20.200 | 606.0 | bed: flat (bed, integrated) | shot 10 ambience | -24 | -24.0 | -42.9 | +0.00 |
| 31 | 20.567 | 617.0 | win cheer | the friends cheer, hats fly | -10 | -16.0 | -34.9 | +0.00 |
| 32 | 20.567 | 617.0 | win sting | the win: a bright ding | -8 | -14.0 | -32.9 | +0.00 |
| 33 | 20.617 | 618.5 | plaque | the WINS: 1 plaque thuds onto the wall | -12 | -18.0 | -36.9 | -0.40 |
| 34 | 21.000 | 630.0 | bed: kiosk (bed, integrated) | shot 11 ambience | -22 | -22.0 | -40.9 | +0.00 |
| 35 | 21.100 | 633.0 | into Melbourne | crossfade swish | -16 | -22.0 | -40.9 | +0.00 |
| 36 | 21.867 | 656.0 | suitcase | the suitcase hits the pavement and bounces | -8 | -14.0 | -32.9 | -0.20 |
| 37 | 22.117 | 663.5 | suitcase 2 | little bounce | -15 | -21.0 | -39.9 | -0.20 |
| 38 | 22.133 | 664.0 | hop 1 | the kangaroo hops off with his hat | -13 | -19.0 | -37.9 | -0.20 |
| 39 | 22.413 | 672.4 | hop 2 | the kangaroo hops off with his hat | -14 | -20.5 | -39.4 | +0.05 |
| 40 | 22.693 | 680.8 | hop 3 | the kangaroo hops off with his hat | -16 | -22.0 | -40.9 | +0.30 |
| 41 | 22.767 | 683.0 | tram | a tram bell down the street | -18 | -24.0 | -42.9 | +0.70 |
| 42 | 22.973 | 689.2 | hop 4 | the kangaroo hops off with his hat | -18 | -23.5 | -42.4 | +0.55 |
| 43 | 23.300 | 699.0 | bed: kiosk (bed, integrated) | shot 12 ambience | -22 | -22.0 | -40.9 | +0.00 |
| 44 | 23.467 | 704.0 | tick 2 | the plaque flips to 2 | -14 | -20.0 | -38.9 | +0.20 |
| 45 | 23.633 | 709.0 | tick 3 | the plaque flips to 3 | -14 | -20.0 | -38.9 | +0.20 |
| 46 | 23.800 | 714.0 | tick 4 | the plaque flips to 4 | -14 | -20.0 | -38.9 | +0.20 |
| 47 | 23.933 | 718.0 | tick 5 | the plaque flips to 5 | -14 | -20.0 | -38.9 | +0.20 |
| 48 | 24.067 | 722.0 | tick 6 | the plaque flips to 6 | -14 | -20.0 | -38.9 | +0.20 |
| 49 | 24.200 | 726.0 | envy | the clerk turns green: a jealous groan | -11 | -17.0 | -35.9 | +0.10 |
| 50 | 24.233 | 727.0 | tick 7 | the plaque flips to 7 | -14 | -20.0 | -38.9 | +0.20 |
| 51 | 24.400 | 732.0 | tick 8 | the plaque flips to 8 | -14 | -20.0 | -38.9 | +0.20 |
| 52 | 24.533 | 736.0 | tick 9 | the plaque flips to 9 | -14 | -20.0 | -38.9 | +0.20 |
| 53 | 24.667 | 740.0 | tick 10 | the plaque flips to 10 | -14 | -20.0 | -38.9 | +0.20 |
| 54 | 24.833 | 745.0 | tick 11 | the plaque flips to 11 | -14 | -20.0 | -38.9 | +0.20 |
| 55 | 25.000 | 750.0 | tick 12 | the plaque flips to 12 | -14 | -20.0 | -38.9 | +0.20 |
| 56 | 25.133 | 754.0 | bed: wall (bed, integrated) | shot 13 ambience | -27 | -27.0 | -45.9 | +0.00 |
| 57 | 25.133 | 754.0 | tick 13 | the plaque flips to 13 | -14 | -20.0 | -38.9 | +0.20 |
| 58 | 27.600 | 828.0 | glint | his glasses glint | -11 | -17.0 | -35.9 | +0.10 |
| 59 | 27.880 | 836.4 | whip 1 | whip pan to Virginia | -9 | -15.0 | -33.9 | +0.40 |
| 60 | 28.000 | 840.0 | bed: station (bed, integrated) | shot 14 ambience | -23 | -23.0 | -41.9 | +0.00 |
| 61 | 29.033 | 871.0 | digits roll | the jackpot digits roll up | -12 | -18.0 | -36.9 | -0.20 |
| 62 | 29.600 | 888.0 | jaw drop | the guard's jaw drops | -10 | -16.0 | -34.9 | -0.30 |
| 63 | 29.900 | 897.0 | roll stop | the board locks on $27,036,142 | -10 | -16.0 | -34.9 | -0.20 |
| 64 | 30.667 | 920.0 | bed: wall (bed, integrated) | shot 15 ambience | -27 | -27.0 | -45.9 | +0.00 |
| 65 | 31.033 | 931.0 | cells on 2 | the wall fills | -16 | -22.0 | -40.9 | +0.00 |
| 66 | 33.033 | 991.0 | bed: station (bed, integrated) | shot 16 ambience | -23 | -23.0 | -41.9 | +0.00 |
| 67 | 33.200 | 996.0 | ticket | the ticket on the counter | -15 | -21.0 | -39.9 | +0.00 |
| 68 | 33.600 | 1008.0 | coin on ticket | a coin set down on it | -14 | -20.0 | -38.9 | +0.00 |
| 69 | 34.400 | 1032.0 | bed: warehouse (bed, integrated) | shot 17 ambience | -25 | -25.0 | -43.9 | +0.00 |
| 70 | 34.417 | 1032.5 | presses (bed, integrated) | the presses running | -13 | -13.0 | -31.9 | +0.00 |
| 71 | 35.050 | 1051.5 | spit | tickets spat into the operator's face | -10 | -16.0 | -34.9 | -0.10 |
| 72 | 35.967 | 1079.0 | bed: wall (bed, integrated) | shot 18 ambience | -27 | -27.0 | -45.9 | +0.00 |
| 73 | 36.267 | 1088.0 | marker | the route drawn across the map | -14 | -20.0 | -38.9 | +0.10 |
| 74 | 36.567 | 1097.0 | ship horn | a cargo ship's horn far off | -16 | -22.0 | -40.9 | +0.30 |
| 75 | 37.667 | 1130.0 | bed: station (bed, integrated) | shot 19 ambience | -23 | -23.0 | -41.9 | +0.00 |
| 76 | 37.667 | 1130.0 | couriers run (bed, integrated) | an army of couriers running | -12 | -12.0 | -30.9 | +0.00 |
| 77 | 39.000 | 1170.0 | avalanche | tickets bury the clerk | -11 | -17.0 | -35.9 | +0.30 |
| 78 | 41.180 | 1235.4 | whip 2 | whip pan into the store | -9 | -15.0 | -33.9 | -0.40 |
| 79 | 41.300 | 1239.0 | bed: station (bed, integrated) | shot 20 ambience | -23 | -23.0 | -41.9 | +0.00 |
| 80 | 41.300 | 1239.0 | clock races | the clock races | -12 | -18.0 | -36.9 | -0.30 |
| 81 | 41.833 | 1255.0 | day 3 | a day flips off the calendar | -14 | -20.0 | -38.9 | +0.30 |
| 82 | 42.133 | 1264.0 | day 2 | a day flips off the calendar | -14 | -20.0 | -38.9 | +0.30 |
| 83 | 42.433 | 1273.0 | day 1 | a day flips off the calendar | -14 | -20.0 | -38.9 | +0.30 |
| 84 | 42.533 | 1276.0 | bed: wall (bed, integrated) | shot 21 ambience | -27 | -27.0 | -45.9 | +0.00 |
| 85 | 42.967 | 1289.0 | collapse | a courier keels over | -10 | -16.0 | -34.9 | +0.20 |
| 86 | 43.367 | 1301.0 | flop | he hits the floor | -10 | -16.0 | -34.9 | +0.20 |
| 87 | 44.433 | 1333.0 | bed: warehouse (bed, integrated) | shot 22 ambience | -25 | -25.0 | -43.9 | +0.00 |
| 88 | 44.900 | 1347.0 | golden glint | the winning ticket glints in the pile | -9 | -15.0 | -33.9 | +0.00 |
| 89 | 45.200 | 1356.0 | sip | Stefan sips his tea | -12 | -18.0 | -36.9 | +0.30 |
| 90 | 47.167 | 1415.0 | bed: office (bed, integrated) | shot 23 ambience | -26 | -26.0 | -44.9 | +0.00 |
| 91 | 48.433 | 1453.0 | binder slam | the RULES binder slammed shut | -6 | -12.0 | -30.9 | -0.20 |
| 92 | 49.000 | 1470.0 | steam | an official fumes, steam from his ears | -12 | -18.0 | -36.9 | +0.35 |
| 93 | 49.567 | 1487.0 | bed: office (bed, integrated) | shot 24 ambience | -26 | -26.0 | -44.9 | +0.00 |
| 94 | 50.267 | 1508.0 | stamp | NEVER AGAIN stamped | -6 | -12.0 | -30.9 | +0.00 |
| 95 | 51.300 | 1539.0 | bed: island (bed, integrated) | shot 25 ambience | -21 | -21.0 | -39.9 | +0.00 |
| 96 | 51.300 | 1539.0 | into the island | crossfade swish into the sun | -15 | -21.0 | -39.9 | +0.00 |
| 97 | 52.000 | 1560.0 | hammock | the hammock creaks | -16 | -22.0 | -40.9 | -0.10 |
| 98 | 52.733 | 1582.0 | parrot | the parrot squawks and steals his pencil | -10 | -16.0 | -34.9 | +0.40 |
| 99 | 53.233 | 1597.0 | wings | parrot wings flapping off | -14 | -20.0 | -38.9 | +0.60 |

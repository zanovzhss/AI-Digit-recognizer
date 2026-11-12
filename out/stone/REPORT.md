# StoneShort: "The Stone That Saved a Village": build report

Final video: `out/stone/final.mp4`, 1440x2560, 30 fps, H.264 (CRF 16) + AAC 320k 48 kHz. Voice and sound are mixed in. No captions,
subtitles or overlay text. Contact sheet (one still per second of the final): `out/stone/contact_sheet.jpg`.
Composition `StoneShort` (src/Root.tsx), code `src/videos/stone/`, shot plan `src/videos/stone/shots.md`.
Branch `claude/stone-tsunami-short` (pushed).

## 1. Voice

| | |
|---|---|
| Source | the attached ElevenLabs MP3, copied untouched to `stone-short/voice/voice_orig.mp3` (63.399 s) |
| Speed-up | `atempo=1.17` (pitch kept) → `stone-short/voice/voice.wav`, 48 kHz mono, **54.187 s** |
| Words | 164 words → **3.03 words/s** (reference median 3.69) |
| Timing | `words.json`: faster-whisper (small.en) word alignment, then hand-checked and corrected in `fix_words.py`. Key word onsets: "below this point" 4.60 / 4.84 / 5.04 s, "1896" 6.54 s, "1933" 14.04 s, "2011" 38.50 s, "stops" 49.14 s, "standing" 53.56 s |
| Video length | 1626 frames = 54.200 s. The final is cut to the voice length (`-t 54.187354`), so the audio is exactly the voice length. At 30 fps no whole number of frames equals 54.187 s, so the last frame ends 13 ms after the voice |

## 2. GPU

Every still and render used `--gl=angle`. The page logs its WebGL renderer, and `stone-short/tools/stills.mjs` stops if it is not
the NVIDIA card. Every still batch reported, including the check right after the final render:

`ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Ti (0x00002482) Direct3D11 vs_5_0 ps_5_0, D3D11)`

No SwiftShader, `--gl=swangle` or CPU fallback was used. `remotion gpu` failed (ERR_FAILED), so the GPU was confirmed from a
real still render's log instead.

## 3. Measurements vs the targets (STYLE_REFERENCE.md section 8)

Final video (`measure.py`, `stone-short/tools/motion_stats.py` on `research/ricks/tools/motion.py`, `stone-short/tools/sharpness.py`,
`stone-short/tools/look_stats.py`):

| Metric | Target | Final | |
|---|---|---|---|
| medDiff (frame-to-frame change) | 4-5.5 | **2.65** | below: calmer than the reference |
| staticPct | 8-18 | **21.2** | above |
| longestStatic | 15-40 f | 34 f | ok |
| hardCuts | reference median 1 (range 0-6) | 2 | in the reference range |
| blurMoves | ≤ 6 | 1 | ok |
| movePct (camera moving) | 35-55 % (brief: ~40-45 %) | 41.0 % | ok |
| hold median / p90 | ≥ 10 f / reference 45 f | 29 f / 90 f | ok (longer holds) |
| push-in speed in holds | 0.07-0.15 %/f (brief: 0.08-0.12) | 0.111 %/f | ok |
| fast-pan frames | ≤ 2.5 % | 2.2 % | ok |
| saturation | 0.40-0.50 | 0.424 | ok |
| detail density | ≥ 0.15 | **0.131** | below |
| vignette / top-minus-bottom / p95 / contrast | reference 20.1 / 16.4 / 199 / 47.7 | 18.2 / 39.4 / 181.5 / 46.5 | inside the reference ranges |
| words / s | reference 3.69 | 3.03 | the voice as given, at the brief's 1.17x |
| sharpness (360x640 mean abs Laplacian) | mean ≥ 6.5, p10 ≥ 2.5 | **10.53 / 4.90** (min 2.42, the dark boat shot) | ok |

File checks (ffprobe): video 1440x2560, 30/1 fps, 1626 frames, 54.200 s; audio AAC 48 kHz, 54.187354 s (= voice.wav). The mix is
-18.8 LUFS integrated.

Progress over the drafts (1080x1920):

| Draft | medDiff | staticPct | movePct | hold med | push in holds | fast-pan % | sharp mean / p10 |
|---|---|---|---|---|---|---|---|
| 6 (fix pass 1) | 3.00 | 20.4 | 42.4 | 14 f | 0.098 %/f | 2.2 | 10.11 / 4.71 |
| 7 (fix pass 2) | 2.76 | 22.9 | 39.1 | 26 f | 0.089 %/f | 2.3 | 10.22 / 4.76 |
| final (fix pass 3, 2K) | 2.65 | 21.2 | 41.0 | 29 f | 0.111 %/f | 2.2 | 10.53 / 4.90 |

## 4. Self-review and fixes

Loop: a full 1080 render, then measure.py against section 8, the sharpness check, a contact sheet of one still per second checked
line by line, six side-by-side sheets against reference frames (golden exterior, dusk interior, wide establishing, top-down,
close-up, transition strip: `out/stone/sbs/`), and one fresh-eyes reviewer given only the contact sheet, the side-by-sides and
STYLE_REFERENCE.md. Three fix passes in total.

**Fix pass 1 (my own review: draft 5 → 6).** Sunset end was murky: added a sun disc with rays and backlight. Far hills had no
forest: added a cedar forest. The 1896 houses had unlit backs: added lit back windows. The 2011 room was sparse: added more props.
The carving OTS was moved, and the storm was made darker. Earlier passes had already fixed fast pans (7.7 % → 2.2 % of frames),
too many whips, framing misses and the sound. The 1896 swell was made big enough to read.

**Fresh-eyes review: the 5 biggest problems found, and what was done:**

1. **The waves and the "stops" payoff did not read.** The boat shot was so tight it read as "a tilted plank". The 2011 wave was
   pale. In shot 21 the stone was blurred at the frame edge.
   - Shot 3 pulled back to show the whole overturned hull on the sand with the sea behind.
   - The town wave now has a dark water face under a white crest line.
   - Shot 21 was rebuilt. The camera was computed with a projection script (not guessed), so the carved stone is sharp and fills
     about a third of the frame, with the villager beside it. The water stopped at the 300 FT post is clear of both. A DOF bug
     (one key had no focus point) was fixed.
2. **The ending was murky.** Mostly fixed in pass 1. The crane now ends nearer the stone, and the rocks and grass tufts on the
   camera side of the stone were removed.
3. **The sets were sparse.**
   - The top-down town now has the shoreline in frame. Its time-lapse ran the wrong way: the waterfront filled early and the
     middle blocks grew back inland. It now grows from inland down to the water, and the waterfront block fills in too (only a
     small plaza is kept behind the market).
   - The market floor has crates, an ice box, buckets of fish, a hose and a puddle.
   - The wall by the 2011 calendar has a paper fan, a shelf with a vase and a tea tin, and a framed picture.
   - The 1896 shore stays empty of people, as the tone rules ask.
4. **The lunch scene did not read.** The flat green town hills looked like a missing texture, the ground was bare and white, and
   the stone and the lunch were unclear.
   - The hills are textured and darker, with 4200 trees.
   - The corner has a grass patch.
   - The forgotten stone is now a slab with its worn carved characters turned to the street.
   - The rice ball is bigger, and his lunch box sits on a cloth at the foot of the stone.
5. **The carving shot did not read.** The stone looked like cake, there was an orange wash and an anonymous foreground head, and
   no chisel or lantern was visible.
   - New camera from the foot of the slab, along its length: the carved columns read.
   - Two carvers in kasa hats with hammers and chisels.
   - A paper lantern on a bamboo pole and an andon in the foreground.
   - Softer lamps and smaller light pools in a blue night; darker sides on the slab.
   - The yard is now a flat spot. Before, the slope buried the far carver's legs and he looked like he was floating.

**Fix pass 3 (measurements of draft 7).**
- The hold creep went from ~0.09 to ~0.11 %/frame, still inside the brief's 0.08-0.12 and the reference range.
- The town time-lapse order was fixed (above).
- Shot 11 is now over a customer's back, to keep an OTS in the 15-30 s window. Shot 7's OTS was dropped for readability.

## 5. What still does not match the reference

- **Calmer than the reference.** medDiff (frame-to-frame change) stays below the 4-5.5 target, and staticPct is at or above the
  8-18 % band; see the table. The holds creep at the reference speed, but our frames carry less fine detail, so the same creep
  changes fewer pixels. Faster creep would break the brief's 0.08-0.12 %/f rule. The MandelShort ended with the same gap
  (medDiff 3.3).
- **Detail density** is ~0.13 against ≥ 0.15. The reference sets are busier (more props, signage, textures, people per frame),
  and its skies and light are richer: saturated golden/sunset skies, sun discs, colour in the shadows. Our storm, map and
  dark-grey scenes are flatter.
- **Characters** are often small in the wide shots. The reference keeps its characters bigger in frame for more of the time.
- **Hard cuts:** 2 one-frame events. These are the one whip (19 → 20, frame 1400) and a runner passing the lens in shot 20
  (frame 1446), where the reference median is 1. The one "blur move" is the quick pull-back off the 1933 plaque (frames
  440-453). No white frames, no other cuts.
- **OTS per 15 s:**
  - 0-15 s: shot 4 (the survivors).
  - 15-30 s: shot 11 (the customer).
  - 30-45 s: shot 17 (the old man).
  - The last 9 s window only has shot 22, which is over the stone's shoulder, not a person's. A person in the foreground of shot
    21 would hide either the stone or the stopped water, so the clearer framing was kept.
- **Artistic licence:**
  - The stone's carved face points up the hill, toward the hamlet, so the last shot can look past it at the eleven houses.
  - The inscription is the real Aneyoshi stone's text in kanji (a historical artefact, not a sign from any channel). Its first
    three columns are carved in the set.

## 6. Notes

- The sound is all synthesized in `stone-short/audio/`:
  - SFX: wind, waves, chisel taps, rope creak, gull, town bustle, cup rattle, the low quake rumble, the roar of water, then
    silence and birdsong.
  - Original score: calm and wistful, tension from beat 8, near-silence on "stops", a warm resolving chord under "still standing".
  - Mix: music +3 dB, SFX -6 dB, voice unchanged, 48 kHz, exactly the voice length. Loudness -18.8 LUFS, true peak -1.2 dBTP.
  - The stems and the `_cache` are intermediate files and are kept out of git, like the Mandel short. They were committed once by
    mistake and then untracked.
- `remotion render` downloaded Chrome Headless Shell into this worktree's `node_modules/.remotion` (Remotion's own browser, no
  new npm dependency).
- Renders used a scratch temp folder (`TEMP`/`TMP`) so the Remotion bundles do not fill the system temp folder.
- `out/` is git-ignored in this project (the MandelShort finals stay there too). `final.mp4` (171 MB, too close to GitHub's
  100 MB per-file limit) stays in `out/stone/`. This report and the contact sheet were force-added to git.
- Nothing outside the scope was touched:
  - Edited: `src/videos/stone/`, `src/Root.tsx` (StoneShort only), `stone-short/` and `out/stone/`.
  - Untouched: the "-54°C" Blender film files, other shorts, `templates/bridge/` and `research/ricks/` (its tools were only run).
  - No reference frames were committed or published.

## 7. Time per step (2026-11-12, local time)

Times are from the commits on this branch.

| Step | Done at | Took |
|---|---|---|
| Setup (branch, STYLE_REFERENCE + measurements read), voice: copy, atempo, alignment, hand-checked words.json | 05:28 | 5 min (from 05:23) |
| GPU confirmation (stills on the RTX 3070 Ti via ANGLE) | ~05:33 | ~5 min |
| shots.md + first full build (terrain, water, valley, town, room, cast) | 06:13 | ~40 min |
| Layout and camera pass | 06:29 | 16 min |
| Framing and look passes | 06:40 | 11 min |
| Motion pass + sound (SFX, score, mix) | 06:55 | 15 min |
| Self-review 1 (measure, contact sheet, six side-by-sides) + fix pass 1 (draft 6), shots.md sync, final chord, finalize script | 07:13 | 18 min |
| Fresh-eyes review + fix pass 2 (draft 7, measured) | ~07:38 | ~25 min |
| Fix pass 3 + commit | 07:44 | ~6 min |
| Final 2K render, mux, checks, contact sheet | 07:47 | 3 min |
| Report, memory, commit, push | ~07:55 | ~8 min |

Total: about 2 h 30 min.

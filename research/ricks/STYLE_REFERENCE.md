# Style reference: 3D cartoon story shorts

**Private study only.** This file describes *techniques* learned from the 25 narrated 3D story Shorts of the reference
channel (list: `videos.md`), studied frame by frame on 2026-11-05. Every future short in this project follows it.
We never reuse their frames, characters, stories, jokes, signs or shots. The videos and frames stay in the gitignored
`raw/` and `frames/` folders. Never upload them.

How it was measured:
- Every video was downloaded at 1080x1920 / 30 fps.
- Stills were taken 1 per second (25 contact sheets were viewed in full).
- 14-frame strips were cut around every one of 631 detected picture changes; about 15 strips were checked by eye (the rest are classified automatically).
- Every frame was measured with `measure.py` plus sub-pixel pan/zoom tracking (`tools/motion.py`).
- Transitions were classified with `tools/transitions.py`, and word timings were taken with faster-whisper.
- Per-video numbers are in `measurements.md`.

Video numbers below (#1-#25) follow `videos.md`. "#13 0:20.4" means video 13 at 0 min 20.4 s.

> The channel has only 25 story Shorts; everything older is a meme clip. The study uses all 25, not 30.

---

## 0. The look in one paragraph

The look is a busy, warmly lit diorama seen through a calm lens.
- **Sets:** every set is dense with props and readable signs that tell the joke.
- **Light:** light carries the mood. Warm practical lamps fill blue nights, bright saturated day only appears in
  fantasy beats, and golden light ends the story.
- **Camera:** the camera mostly *holds and creeps*: it moves 43 % of the time with a 0.09 %/frame push. Most picture
  changes are short eased moves or 8-16-frame crossfades into a macro insert, followed by a pull-back reveal.
- **Cuts and whips:** hard cuts are rare (1 % of changes), and fast whips are short accents, not the grammar.
- **Cadence:** something new appears on screen every ~1.7 s, landing on a word (70 % within ±3 frames of a word onset).

---

## 1. Transitions catalog

631 picture changes in 25 videos, about 28 per minute (one every 1.67 s, IQR 1.1-2.6 s).
- "Core" length is the frames of actual change: the frames where the camera moves at ≥30 % of its peak speed, or
  the length of the blend for a dissolve.
- The classes are automatic and were spot-checked by eye. "Push-through" and "slow push + blend" overlap in practice:
  both are a push-in that hands over to the next picture through a crossfade.

| Type | Share | Core length (frames) | What it looks like | When it is used (narration) | Examples |
|---|---|---|---|---|---|
| **Eased move to the next framing** (pan, orbit, crane, tilt) | 38 % (240) | median 4, IQR 2-10; peak pan median 41 px/f at 1080 | The camera glides inside the same set from one subject to the next. It eases out: the peak speed comes early, then a long settle | Inside one place, between clauses of a sentence; it follows the subject of the next clause | #1 0:38.7 (crane straight up from the canteen into a satellite map: place change *inside one move*); #2 0:08.6 (tilt across a canyon wall into the sky, down onto the desert); #5 0:03.9-0:07.7 (crane up and over a ring-shaped town to top-down) |
| **Push-in that hands over** (push-through, slow push + blend) | 36 % (225) | push 17 (IQR 7-22); blend 12 (IQR 5-20) | A slow push toward an object; near the end a crossfade of 3-12 f into a **macro insert** of that object, or a push into a dark or bright shape (pupil, porthole, chip glow) that fills the frame and opens on the next place | The noun of the line ("he scratches one", "every single atom") or the start of an explanation | #8 0:11.2 (push on the hero, dissolve into a macro of the ticket, a badge swings across the lens); #6 0:44.6 (push into a pupil until black, reveal a porthole interior); #25 0:08.0 (push into a body, dissolve into particles) |
| **Plain dissolve** (crossfade) | 10 % (65) | median 16, IQR 12-29 | A straight crossfade, often with a slow push on both sides | Place or time changes ("the next morning", "until sunrise"), and the explanation pivot; 22 % land right after a sentence end (twice the average) | #12 0:21.8 and 0:23.4 (house, night → morning); #9 0:52.2 (all-night vigil → sunrise); #22 0:31.5 (evidence board → elevator set, ~10 f) |
| **Whip / smash move** | 11 % (68) | median 2, IQR 2-5; peak pan median 80, p90 131 px/f | 1-3 frames of heavy motion blur, landing on a reaction or a macro. Often a fast crane-down rather than a sideways pan | Punchlines and reversals ("nothing happened", "but"); at most ~3 per minute | #13 0:20.4 (fast push-down onto a frog's mouth, then a shape-match dissolve into the wine cup and a pull-back to the emperor); #3 0:51.8; #16 0:37.5 |
| **Foreground object wipe** (part of the moves above) | ~5 % | 3-6 | A near-lens object swings through the frame: a blade, badge, tree trunk or crate slats. A dissolve often hides under it | Scene changes inside a sequence | #15 0:20.8 (a sword swings across a macro of the pardon, revealing the priest); #15 ~0:05-0:06 (tree trunk, then crate slats); #8 0:11.5 (a lanyard badge) |
| **Flash / bloom to white** | 3 % (19) | median 2 | A glowing prop blooms to warm white, or there is a 1-2 f white flash | Magic, ideas, explosions, "and it pays for everything" | #7 1:05.1 (glowing chip blooms to white); #16 ~0:37.5 (forge glow fills the frame on "So"); #25 0:22.5 (glitch) |
| **Iris / dip** (peephole, telescope, spotlight, dark object) | 1 % (8) | 2-23 | A circular mask or a dark shape covers the frame | POV beats and inner thoughts | #12 ~0:22 (peephole POV); #4 ~0:19 (telescope POV); #10 ~0:13 (spotlight iris on the hero's thought) |
| **Hard cut** | 1 % (6) | 1-2 | An instant change, often to a top-down or macro | Rare: big shocks or a jump to a new location after a full stop (50 % after a sentence end) | #20 0:23.7; #23 0:17.3 and 0:19.0 ("Big mistake."); #3 0:40.4 |

**Rules that follow from the catalog**
1. **Default change = eased move or push-in + 8-16 f crossfade.** Hard cuts ≤ 1 per video. A white flash only on a
   magic, idea or explosion beat.
2. **Insert → reveal loop:** dissolve into a macro of the prop the line names (the prop fills 50-80 % of the frame),
   then pull back to show who holds it. This is how they explain without captions.
3. **Change place inside a move** when possible: crane up out of the set to a map or aerial, then back down into the
   new place.
4. **Whips are accents:** core 2-3 frames of blur, ≤ 3 per minute, landing on a reaction.
5. **Timing:** a picture change lands on the word that names the new picture (median offset 0 f; 70 % within ±3 f).
   Only 11-22 % of changes wait for a sentence end; most happen mid-sentence on the noun.

---

## 2. Camera catalog

| Measure (median of 25, range) | Reference | IceShort final |
|---|---|---|
| Frames the camera is moving (pan ≥ 3 px/f or zoom ≥ 0.35 %/f) | **43 %** (24-66) | 89 % |
| Fully static frames (`measure.py` staticPct) | **11.3 %** (0.6-25) | 1.1 % |
| Hold length, median / 90th percentile | **11 f / 45 f** (p90 18-115) | 5 f / 11 f |
| Frames creeping in (zoom > 0.04 %/f) | 51 % (42-78) | 76 % |
| Push speed during holds | **0.09 %/f** (0.07-0.17) | 0.23 %/f |
| Residual pan during holds | 0.21 px/f | 0.38 px/f (hand-held float) |
| Frames with a fast pan (≥ 40 px/f) | **1.1 %** (0-2.5) | 13.8 % |
| Pan speed p95 | 15 px/f | > 200 px/f |
| `measure.py` medDiff | **4.7** (2.2-7.9) | 7.2 |
| `measure.py` blurMoves | 4 (0-10) | 23 |

**Move types**
- **Push-in creep on every hold:** 0.07-0.17 %/frame, straight down the lens axis, no float. It is the most common
  "move".
- **Eased glide** between framings in one set: ease-out (peak speed in the first third, then a long settle). Typical
  peak 10-40 px/f at 1080, 8-17 frames long.
- **Crane up / over** to an aerial or top-down for scale and place changes (#1, #5, #14, #16). The top-down reveal is a
  signature shot: concentric town, army lines, prison yard.
- **Low tracking at ground or rail level** with long vanishing lines (#2 railroad, #16 field path, #6 street). The lens
  sits 0.3-0.8 m above the ground.
- **Orbit:** short (≤ 30°) and slow, around a character at a counter or table.
- **Whip / smash:** 1-3 frames of blur (see section 1).
- **Fly-through:** through glass, a window or a porthole, into an object's interior (the cannon barrel in #14, the
  bowl in #3).

**Angles** (estimated by eye from the 25 contact sheets)
- Eye level ~45 %.
- Low or worm's-eye ~20 %: a hero against the sky, buttons and props looming.
- High or top-down ~20 %: beds, desks, maps, crowds, graves.
- Macro inserts ~15 %.
- Dutch tilts of 5-15° on panic beats (#11, #20).

**Lens**
- Wide (≈ 50-70° vertical FOV) for close-ups, so faces near the lens swell (#20 0:07, #19 0:15, #6 0:44).
- Long lens only for telescope or POV gags.

**Foreground objects**
- About 1 shot in 3 has a near-lens foreground layer, blurred:
  - an over-the-shoulder head or hat (#10 0:07-0:10, #18 0:41);
  - a holster or hip (#6 0:03, 0:15);
  - a cannon barrel (#14 0:25);
  - a cat (#18 0:32);
  - a pot rim (#3 0:07).
- The foreground object is always recognisable: never an anonymous blob.

---

## 3. Staging rules

1. **Distance to the lens:**
   - Close-ups put the face at 40-70 % of the frame width.
   - Medium shots put 1-2 characters at knee or waist height.
   - Full-body framings are mostly for entrances and crowds. A row of 3 characters standing face-on is rare.
2. **Characters per shot:** usually 1-2 named characters, plus extras or a crowd in the back layer. Crowd shots use
   hundreds of instanced extras in depth (#5 0:53, #13 0:15, #18 0:06, #4 0:29).
3. **Depth layers:** at least 3 per shot:
   - a foreground prop or shoulder (blurred);
   - the subject in focus;
   - a busy midground set;
   - a background that runs to a horizon or a back wall full of detail.
   Depth of field blurs the background on close-ups and medium shots; wides stay sharp.
4. **Off-centre placement:**
   - The subject sits on a third, facing into the frame.
   - Two-shots are angled 3/4, not lined up to the lens.
   - The horizon is usually in the top third (vertical frame), leaving the floor, desk or ground plane to fill with props.
5. **Vertical-frame tricks:** stack the story vertically.
   - Cross-sections with the coffin below and the bell above (#9 0:05).
   - Stacked signs (#15 0:11).
   - Building floors (#21 0:12).
   - A tall ladder seen from below (#5 0:13).
6. **Props in hands:** almost every character holds the story object: ticket, scratch card, stopwatch, bat, mug,
   pot, spear, magnifier.
7. **Recurring callback object:** the same prop or sign returns at the end with a changed state, such as a counter
   that goes up by one (#5, #16 "years at war" board, #11 office-door sign, #8 desk box).

---

## 4. Light presets

From 1,401 one-second stills, auto-split by light class (median colours; "key" = brightest 15 % of pixels,
"shadow" = darkest 25 % excluding ink). Share of screen time: interior 45 %, warm/golden 27 %, night 16 %, clear day 11 %.

| Preset | Key (lit surfaces) | Shadow | Sky / top of frame | Frame luma | Saturation | Practicals |
|---|---|---|---|---|---|---|
| **Day exterior** | #d9dcdb (near-neutral, slightly warm) | #504b4d (warm grey-mauve, *not* blue) | #7ca5d1, soft clouds, haze to a pale horizon | 0.56 | 0.41 | none; sun from high side, hard cast shadows of props on the ground |
| **Golden / sunset** | #e8cba5 | #4e2e39 (plum) | #97746c → peach horizon, big sun disc + rays | 0.48 | 0.46 | lanterns start glowing; long shadows toward the lens |
| **Night** | #a19097 on lit faces | #161328 (deep indigo) | #312e4c; moon disc, stars | 0.25 | 0.57 | **warm windows, lamps, candles, neon, each with a light pool on the floor and a warm rim on nearby faces** |
| **Interior** | #dbd6d4 | #3c354a | wall/ceiling #898593 | 0.51 | 0.39 | a visible source in frame (bulb, sconce, window): hard window-light patches on floors and walls, light shafts in the haze |
| *IceShort final, for comparison* | day #e7eced, interior #d3e9d0 | day **#42436b**, night **#18093c** (blue-violet) | day #68afe0 | 0.48 avg | **0.61** | one bulb card; no light pools |

**How light follows the story**
- About **17 light-class changes per minute**: the light changes with the beat, not only with the place.
- **Normal life** is day or warm interior.
- **Trouble, secrets, nights and waiting** are blue night with one warm practical (#12, #9, #18, #7).
- **Explanation / "you see"** moves to a special space with its own light: a blueprint-blue table, an X-ray HUD, the
  violet "digital" world, the inside of the head with porthole eyes, or an insert under one bulb (#22, #23, #24, #6).
- **Ending:** golden sunset or sunrise to close (#13, #15, #16, #9, #2, #21).
- **Daydreams and fantasies** get a pushed, saturated, pink-violet palette (#10 yacht, #7 pool) that is clearly
  different from reality.
- **Emotion tints** go on the character, not the world: green face for envy or sickness, purple for anger, red for
  heat or embarrassment (#8, #2, #23).

---

## 5. Set density

- **Detail density** (share of strong-gradient pixels, a proxy for set density): median **0.15**, range 0.11-0.27;
  interiors 0.17. IceShort: **0.128**, and 0.10 in its interiors.
- **Props per shot** (estimated by eye from the contact sheets):
  - interiors 15-40 distinct props (shelves of tins, posters, clocks, lamps, rugs, desk clutter);
  - exteriors 8-20 (fences, lamps, signs, barrels, carts, plants, background buildings to the horizon);
  - inserts are a single prop filling the frame, with readable print on it.
- **No empty planes:** no shot has a single flat colour over more than ~35 % of the frame. Floors have rugs, tiles,
  tape marks and light patches; walls have trims, posters, windows and stains. Skies have clouds, a moon, or a tower
  on the horizon.
- **Signage tells the story:** 1-3 legible signs per place, and they carry a joke or a fact so the narration doesn't
  have to:
  - shop and booth names;
  - labelled crates and barrels naming each item;
  - price and odds boards;
  - counters that tick up;
  - euphemism door signs;
  - newspaper headlines;
  - warning plaques.
  Signs are big, bold, period-styled, unlit (flat bright), and face the lens.
- **Scale gags with multiples:** hundreds of identical props (buttons, tickets, pills, extras) to show "every",
  "thousands" or "all of them".
- **Explanation dioramas:** the mechanism shown *as a place*:
  - cross-sections (ground layers, skin layers, a machine's inside);
  - X-ray / HUD overlays;
  - blueprints on a table;
  - a map with a red route line;
  - the body as a building with corridors and signs.

---

## 6. Acting and gags

- **Reaction effects** (2D cards in 3D):
  - sweat drops and tear streams;
  - steam puffs from the head;
  - anger veins and lightning streaks for speed;
  - sparkle and glow bursts on value;
  - dust puffs, splinter bursts and stars on impacts;
  - "!!" marks and exclamation lines.
  There are about 4-8 per minute (estimated by eye from the contact sheets).
- **Face changes on the beat:** the expression changes on the key word (smug → shocked → teeth-gritted) with a 2-4 f
  squash or pop. Eyes go huge on shock; the body stays a simple stick-limb pose.
- **Props in hands:** almost every character holds the story object (see Staging).
- **Visual jokes per minute:** about **6-10** (estimated by eye), roughly one every 6-10 s. The common kinds are:
  - a sign that contradicts the line;
  - a scale gag;
  - a prop gag (a cat that keeps appearing, a desk box);
  - a reaction face;
  - a callback object at the end.
- **The ending callback** reuses the opening place or prop with one changed detail; the video ends on the last word.

---

## 7. Rhythm

| Measure | Reference (median, IQR) | IceShort |
|---|---|---|
| Narration speed | **3.69 words/s** (3.36-4.09) | 3.13 |
| Voice starts | frame 0 | frame 0 |
| Sentence length | 3.3 s (2.1-4.6) | 4.3 s |
| Time between picture changes | **1.67 s** (1.1-2.6) | 1.52 s |
| Picture changes per sentence | 1.6 | 2.2 |
| Changes within ±3 f of a word onset | **70 %** | 55 % |
| Median offset change → nearest word | 0 f | -2 f |
| Light-class changes per minute | 17.6 | 32.6 (inflated by blur frames) |

- **One beat ≈ one clause (~1.7 s):** a new framing, insert or reaction per clause, on its noun or verb.
- **Fewer, longer moves:** the camera *settles* for ~11 frames (p90 45) after each change, then creeps until the next one.
- **Sentence ends** get a reaction hold or a dissolve, not a whip.

---

## 8. Numbers (summary; full per-video table in `measurements.md`)

| Metric | Ref median | Ref mean | Ref range | IceShort |
|---|---|---|---|---|
| medDiff | 4.68 | 4.69 | 2.2-7.9 | **7.16** |
| staticPct | 11.30 | 12.12 | 0.6-25.1 | **1.09** |
| longestStatic | 24 | 23.8 | 2-58 | **5** |
| hardCuts | 1 | 1.3 | 0-6 | 6 |
| blurMoves | 4 | 3.6 | 0-10 | **23** |
| vignette | 20.1 | 24.5 | 7.8-54.8 | 21.1 |
| topMinusBottom | 16.4 | 15.0 | -22.3-51.4 | 16.8 |
| p95 | 199.2 | 200.3 | 162.9-222.5 | 203.9 |
| contrast | 47.7 | 47.5 | 40.3-56.1 | 52.4 |
| picture changes / min | 28.1 | 27.1 | 18.7-38.3 | 35.9 |
| movePct | 42.6 | 42.7 | 23.8-65.9 | **89.4** |
| hold median / p90 (f) | 11 / 45 | 10.9 / 44.8 | 6-15 / 18-115 | **5 / 11** |
| push speed in holds (%/f) | 0.09 | 0.10 | 0.07-0.17 | **0.23** |
| fast-pan frames % | 1.1 | 1.2 | 0-2.5 | **13.8** |
| words / s | 3.69 | 3.70 | 3.36-4.09 | **3.13** |
| detail density | 0.15 | 0.16 | 0.11-0.27 | **0.13** |
| saturation | 0.44 | 0.45 | 0.31-0.62 | **0.61** |

**Targets for our shorts from now on:**
- medDiff 4-5.5, staticPct 8-18, longestStatic 15-40, blurMoves ≤ 6;
- movePct 35-55, hold median ≥ 10 f, push in holds 0.07-0.15 %/f;
- fast-pan frames ≤ 2.5 %, saturation 0.40-0.50, detail density ≥ 0.15.

These replace the old "medDiff ≥ 6 / staticPct ≤ 15" targets: the reference is calmer than we assumed.

---

## 9. Gap list: the 10 biggest differences, ranked, with fixes in our code

Ranked by how much each one changes the look of a whole video. File paths are `src/videos/ice/` (the same files
exist in every short started from the template).

1. **The camera never holds.**
   - Numbers: movePct 89 % vs 43 %; hold 5 f vs 11 f (p90 11 vs 45); staticPct 1 vs 11; push in holds 0.23 vs 0.09 %/f.
   - Fix in `story.ts` `camRig`:
     - drop the float (`a = 0.016 * k.d` → 0);
     - set `MOVE_X` 1.14 → 1.0;
     - replace the whole-shot cosine `ease` with a *move-then-hold* curve: glide A→B over the first 30-40 % of the
       shot with an ease-out, then creep at 0.08-0.12 %/f (dolly the distance by `d *= 1 - 0.001 * frames`) until the
       next change.
   - Raise the template targets to the ones in section 8.
2. **Whips and blur everywhere.**
   - Numbers: fast-pan frames 13.8 % vs 1.1 %; pan p95 > 200 vs 15 px/f; blurMoves 23 vs 4; 13 whip-type changes in
     55 s, plus white frames inside fly-throughs.
   - Fix in `story.ts` `TRANS`:
     - keep ≤ 2 `whip`s per video, with `deg` ≤ 35 and a 1-3 f core;
     - turn the other whips and the `fly`s into eased moves or push-in + crossfade (below);
     - remove the white frame in `fly` (f476);
     - in `motionblur.ts`, enable blur only above 40 px/f.
3. **No crossfades and no insert → reveal loop.**
   - Numbers: plain dissolves are 10 % of reference changes and push-in hand-overs 36 %; ours has `XFADE = {}`, so none.
   - Fix:
     - fill `XFADE` with 8-16 f crossfades at every place or time change (1806 → tropics, the cell, 1833) and use 3-6 f
       blends under push-ins;
     - add an `insert` shot kind (FOV 28-35°, prop fills 50-80 % of the frame, `dofAt` 14 px) for the ice block,
       newspaper, wallet, towel bottle, sawdust and calendar, followed by a pull-back to the character;
     - make the hold, cell and market changes one crane move each (as in #1 0:38.7).
4. **Only two light presets, so nights and interiors read flat blue-violet.**
   - Numbers: our night shadow is #18093c and interiors use "golden" with a violet shade; the reference night shadow
     is #161328 with warm practicals, and interior shadow #3c354a under a visible bulb or window.
   - Fix:
     - add `night` and `interior` to `LIGHTS`/`LOOK` in `lights.ts`:
       - night: cool moon key, shade ≈ [.06, .06, .16], sky #312e4c;
       - interior: warm-neutral key, shade ≈ [.24, .22, .30];
     - support point-light practicals in `world.ts` and `shade.ts` (lamp, window, lantern), each with a floor light
       pool and window-shaped light patches (unlit additive cards);
     - put the cell, the hold and the night port on these presets.
5. **Over-saturated, too-violet shadows.**
   - Numbers: saturation 0.61 vs 0.44; day shadow #42436b vs #504b4d.
   - Fix:
     - `grade.ts` day `sat` [0.98, 1.27, 1.46] → about [0.95, 1.02, 1.05], and lower the golden highlights 1.71 → 1.15;
     - `lights.ts` day `shade` [.27, .27, .42] → [.30, .28, .31], `lift` [.05, .06, .15] → [.05, .05, .07];
     - keep blue only in night shadows.
6. **Sets are sparse.**
   - Numbers: detail density 0.128 vs 0.15 (interiors 0.10 vs 0.17); white snow voids, bare walls and empty floors
     fill 40-60 % of many frames.
   - Fix in `build.ts`: give each place a dressing list:
     - interiors ≥ 15 props in frame (shelves, crates, sacks, lanterns, rugs, tools, posters, a clock), exteriors ≥ 8
       (carts, barrels, fences, lamps, market stalls);
     - background buildings or ships out to the horizon;
     - snow gets footprints, tracks, piles and blocks;
     - walls get trims, windows and posters;
     - a QA check in `scripts/short_qa.py`: no still where one flat colour covers > 35 % of the frame.
7. **No signage telling the story.**
   - The reference has 1-3 legible signs per place carrying facts and jokes; we have the newspaper and calendar only.
   - Fix:
     - add an unlit sign/label system in `paint.ts` (Canvas2D text, bold period serif or sans, sign faces unlit as in
       the template gotcha);
     - place signs in `build.ts`: ice-house and harbour names, "ICE"-stencilled crates, a shipping price board, a
       debtors'-prison door plate, a market-stall price card;
     - add a callback counter (e.g. a voyage tally board that changes at the end).
8. **Explanations are literal, with no mechanism diorama.**
   - The reference explains through cross-sections, X-ray or HUD overlays, maps with route lines, or the inside of an
     object as a place. Our "why sawdust works" is a towel-wrapped bottle on a bench.
   - Fix in `story.ts`/`build.ts`: one explanation set per short, for example:
     - a cutaway of the ship's hold, with sawdust layers and warm-air arrows bouncing off;
     - an animated world map with the ice route drawn in red (Boston → Martinique → Calcutta).
     Give it its own light (blueprint blue or a single bulb).
9. **Staging is flat: mid-distance, centred line-ups facing the lens.**
   - The reference puts faces at 40-70 % of the frame width with a wide lens, uses over-the-shoulder shots with a
     blurred foreground head, worm's-eye and top-down angles, and crowds in depth.
   - Fix in `story.ts` `RIGS`/`FOREGROUND`:
     - per 15 s, add ≥ 1 OTS (a foreground character card as a `FOREGROUND` entry), ≥ 1 low angle with a prop
       foreground, ≥ 1 top-down;
     - close-ups at FOV 50-60° with the lens 0.6-0.9 m from the face;
     - stage two-shots at 3/4 angles;
     - in `cast.ts`, crowds of 60+ instanced extras in depth for "the town laughed" beats.
10. **Slow narration and few gags or reaction effects.**
    - Numbers: 3.13 vs 3.69 words/s; the reference has ~6-10 visual jokes and 4-8 reaction effects per minute; we
      have sweat, stars and one bulb.
    - Fix:
      - generate the voice at 3.6-3.8 words/s and re-time `words.json`;
      - in `toon.ts`, add face-tint states (green envy, purple anger, red heat), steam puffs, anger veins, speed
        streaks and splinter bursts as fx cards;
      - in `cast.ts`, make expressions pop on the key word (2-4 f squash);
      - in the script, plan one visual gag per 6-10 s (sign gag, scale gag, recurring prop) and an ending callback
        object.

---

## 10. Checklist for every new short

- [ ] Script at 3.6-3.8 words/s, one clause ≈ one picture beat (~1.7 s), ending callback.
- [ ] Shot plan: insert → reveal at least every 10 s; ≤ 1 hard cut; ≤ 2 whips; crossfades at every place or time change.
- [ ] Camera: move-then-hold, push 0.07-0.15 %/f in holds, no float; ≥ 1 aerial or top-down, ≥ 1 low angle, ≥ 1 OTS per 15 s.
- [ ] Light: a mood arc (day/interior → night with warm practicals → explanation space → golden end); a light pool
      around every practical.
- [ ] Sets: ≥ 15 props in interior frames, ≥ 8 outside; 1-3 story signs per place; no flat area > 35 % of the frame.
- [ ] Gags: one every 6-10 s; reaction effects on key words; one callback prop.
- [ ] Measure: medDiff 4-5.5, staticPct 8-18, movePct 35-55, fast-pan ≤ 2.5 %, saturation 0.40-0.50, detail ≥ 0.15.

Tools to re-measure a new render:

```bash
python measure.py out/<name>/final.mp4
python -I research/ricks/tools/extract.py out/<name>/final.mp4 out/<name>/study
python -I research/ricks/tools/motion.py out/<name>/final.mp4 out/<name>/study
python -I research/ricks/tools/transitions.py out/<name>/final.mp4 out/<name>/study
```

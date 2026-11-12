# StoneShort: shot plan (rebuild)

**"The Stone That Saved a Village"**: 54.19 s (1626 frames at 30 fps), voice `stone-short/voice/voice.wav` (unchanged),
word times `stone-short/voice/words.json` (unchanged). Every picture change lands 0-3 frames before its word
(`cue = onset frame - 2`). The bug list that drove this rebuild, with before / after stills: `BUGS.md`.

Rules (`research/ricks/STYLE_REFERENCE.md` wins over older rules), plus the rebuild rules:
- **One stone** (`stonemodel.ts`): a rough upright natural slab ~1.22 m, irregular edges, moss at the base, the carved
  inscription on the front. The same model on the hill, in the carving yard, on the haul sledge, as the diorama marker and
  as the forgotten stone in town.
- **Collision rule** (`obstacles.ts`): every character keeps 0.6 m from the stone and every registered prop (a seat prop
  only for its sitter). **Near-clip rule** (`lens.ts`): no plant instance within 0.5 m of any lens position of the film.
- **Cycles that travel**: walkers and runners use the side-view walk / run cycles and move through the set.
- **Waves** (`wave.ts`): a toon wave wall (curling foam crest, teal under the lip, foam veins running down the face, foam
  churning at the toe, inked foam puffs and mist on the crest).
- **Sound**: voice unchanged, synthesized SFX at -10 dB (beds -4 dB), **no music**. No captions, no overlay text.
- Camera: glide over the first third, then hold and creep (~0.11 %/f); crossfades at place / time changes; one whip.

## Shots

| # | Frames | Line | Place · light | Camera | Out | Action / props |
|---|---|---|---|---|---|---|
| 1 | 0-194 | "A stone in the hills of Japan has one rule carved into it: do not build your home below this point." | valley · golden | LOW in front of the whole stone (lens 0.6 m, 2.4 m away): it towers against the golden sky, the carving readable; slow push on "carved"; on "do" (104) a crane up over the stone (30 f) and on up to a high view of the hamlet, the path and the valley falling to the sea (40 f); hold + creep | **12 f crossfade** (188-200) from the text-free high view | an old man sweeps along the path (walk cycle, broom), poles and wires, trees, birds |
| 2 | 194-319 | "You see, in 1896, a giant wave wiped out the little village of Aneyoshi." | 1896 village · storm dusk | opens on the painted "1896" notice board in the scene, glides back between two thatched roofs to the sea (50 f); a slow tilt up on "wiped" | **12 f crossfade** | the dark wave wall rises on the horizon (f206) and comes in at the village, towering over it by the end (~40 % of the frame); thatched roofs, lit paper windows, boats on the beach, nobody outside |
| 3 | 319-350 | "Only two people survived." | wrecked shore · storm | low 3/4 view of the overturned hull | crossfade | broken beams and planks, a fallen thatch roof piece, a door, crates, torn nets, water lapping |
| 4 | 350-398 | (survived) | slope · storm | **OTS** behind the two survivors | crossfades | they look down at what is left of the village (posts, fallen roofs) |
| 5 | 398-458 | "Then, in 1933, it happened again." | 1933 street · storm | the "1933" plaque on a rebuilt house, already sliding; on "1933" a pull back up the street: tiled roofs, lit shoji, a telegraph pole and wires | crossfade | — |
| 6 | 458-533 | "...again. Four survivors." | 1933 village · storm | a new angle from the side slope: the tiled roofs and the telegraph line below; the surge sweeps in from the sea between the houses (f460-520); on "Four" ease down behind the four survivors on the slope | crossfade | the surge: a low wave wall with foam, the flood spreading between the houses |
| 7 | 533-583 | "So the villagers carve a warning" | carving yard · lantern night | high 3/4 from the foot of the slab; slow move in on "warning" | crossfade | THE stone lying on logs, two carvers in kasa hats with hammers and chisels, lantern on a bamboo pole, andon |
| 8 | 583-635 | "and set it high on the hillside." | the path · lantern night | behind and above the sledge looking up the path; on "hillside" a tilt up the slope | crossfade | the stone on its sledge, ropes, six haulers leaning into them and walking uphill, an elder, a dog, lanterns |
| 9 | 635-756 | "Over the next eighty years, the coast changes. Towns grow right down to the water," | town · day | **TOP-ish** high oblique over the plain to the coast; slow creep | crossfade | time-lapse: fields give way to lots, houses pop up block by block from inland down to the water, roads appear with their blocks, the breakwater grows, boats pop in one by one, cloud shadows race |
| 10 | 756-805 | "because that's where the boats are," | the quay · day | low on the working quay; a glide on "boats" | crossfade | moored boats on mooring lines, bollards, fish boxes, crates, nets, coiled ropes; one fisherman coils a rope, one waves, one walks by with a net |
| 11 | 805-854 | "and the jobs, and the view." | fish market · day | **OTS** past a customer at an open-air stall under a striped awning, the harbour behind | crossfade | the vendor holds up a fish on "jobs"; a gull steals it on "view" (gag) |
| 12 | 854-938 | "All over Japan, old stones like this are forgotten." | stone corner · day | **LOW** across short grass to THE stone (old, leaning) and the bench beside it | eased push | gag: a man eats his lunch on the bench, his tea can stands on the stone, his bike leans on it |
| 13 | 938-992 | "Just old rocks in the grass." | stone corner · day | closer on the stone in the grass | crossfade (match on the stone) | a sparrow pecks his crumbs |
| 14 | 992-1088 | "But Aneyoshi's eleven families keep their houses up the hill," | hamlet · dawn | high 3/4 of the houses on the hill; a slow sideways glide on "houses" | crossfade | a woman opens a shutter, a man stretches |
| 15 | 1088-1134 | "and walk down to their boats." | the path · dawn | beside the path, the stone behind it; the lens holds | crossfade | two fishermen walk down through the frame (walk cycle, net, oar) |
| 16 | 1134-1182 | "Then, in 2011," | living room · grey | the "2011 MARCH" calendar, pull back to the wall and the room | crossfade | fan, shelf with vase and tea tin, framed picture, clock |
| 17 | 1182-1228 | "the ground starts shaking." | living room · grey | **OTS** past the old man at the low table; the only camera shake | crossfade | the cup rattles, the lamp swings, the wires sway; his wife looks up |
| 18 | 1228-1329 | "The strongest earthquake in Japan's recorded history sends a wave" | diorama · grey | a 3D miniature of the valley and bay from over the sea (tilt-shift); slow push on "history" | crossfade | the 1896 and 1933 water lines as glowing painted bands on the hill with big painted year labels, THE stone as a giant marker above both; quake rings spread from the sea, a white wave line heads in on "sends" |
| 19 | 1329-1400 | "that swallows whole towns along the coast." | town · dark grey | low over the rooftops, a long lens | **whip** | the 2011 wall (48 m, 40-65 % of the frame height) rolls in over the town: teal face with foam veins, white crest with inked foam puffs and mist, foam bursting over the roofs at its foot; nobody in sight |
| 20 | 1400-1469 | "It roars up the valley toward Aneyoshi..." | the path · dark grey | **LOW** on the path looking down the valley | crossfade | a crowd of 30 runs uphill toward and past the lens (run cycle: flight phase, knee drive, pumping arms, lean), parting around it; kids, an elder; the water climbs far below |
| 21 | 1469-1557 | "and stops about three hundred feet below the stone." | beside the stone · dark grey (front-lit stone) | from beside the stone looking down the slope (lens 42): the stone sharp at the lower left, a villager beside it; the water slows, foams and stops at the tall striped measuring post (300 FT); on "three" a slow rise; hold on the stone with the calm water below | crossfade | — |
| 22 | 1557-1626 | "Every single house is still standing." | hamlet · warm sunset | starts low beside the stone, cranes up (44 f) until the stone stands side-on in the foreground under the houses; hold + creep to the last frame | (end, no fade) | lit windows, chimney smoke, sun rays, a kid waves |

## Checks
- Staging per 15 s: OTS 4 / 11 / 17 / (22 over the stone's shoulder); low angle 1, 12, 15, 20; top-down / high 9, 18, 19.
- Light: golden → storm dusk → lantern night → day → dawn → grey interior → grey diorama → dark grey → warm sunset.
- Gags only in calm beats (the gull, the lunch on the bench, the sparrow). Nobody shown hurt or in the water.

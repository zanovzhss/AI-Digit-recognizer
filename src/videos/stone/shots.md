# StoneShort: shot plan (whole video)

**"The Stone That Saved a Village"**: 54.19 s (1626 frames at 30 fps), voice `stone-short/voice/voice.wav`
(ElevenLabs v4 original sped up 1.17x, pitch kept). Times are the word onsets in `stone-short/voice/words.json`
(force-aligned, hand-checked). Every picture change lands 0-3 frames before its word (`cue = onset frame - 2`).

Rules from `research/ricks/STYLE_REFERENCE.md` (section 8 targets win over older code):
- **Camera:** each shot glides over its first 30-40 %, then holds and creeps in at 0.08-0.12 %/frame, no float. Target:
  the camera moves in 40-45 % of frames. One subtle shake in the whole video (the cup on the table, shot 17).
- **Changes:** every place or time change is an 8-16 f crossfade, or a push-in to a prop (the stone, a plaque, the
  calendar) that crossfades into the next scene and pulls back. The stone returns at every era. One whip (shot 19 → 20).
- **Light:** golden hour → stormy grey-blue dusk → lantern-warm night → bright day → (dawn) → grey turning dark → warm
  sunset. Dusk and interiors get warm windows / lamps with light pools.
- **Colour:** grade saturation ~1.0-1.05; day shadows warm grey (#504b4d), never blue-violet.
- **Sets:** ≥ 8 props outdoors, ≥ 15 indoors, skies with clouds and birds, the sea with boats and buoys, hills with
  trees. Signs painted into the set only: the carved inscription, the 1896 / 1933 / 2011 plaques, the distance posts.
  **No captions, no overlay text.**
- **Tone:** a real disaster. No gags with the waves or the victims, nobody shown in danger or in the water. Danger is
  shown by the sea, empty boats, flooded lanes at a distance and people running uphill. Light gags only in calm beats.

Legend: **OTS** over-the-shoulder (blurred foreground head) · **LOW** low angle · **TOP** top-down / steep high angle ·
**WCU** wide-lens close-up · **R3** crossfade or prop loop · **R7** sign in the set · **R8** explanation diorama.

## Places

| Place | Built as | Eras / light | Story signs |
|---|---|---|---|
| **Aneyoshi valley** (`hill`) | a steep wooded valley opening onto a bay: terrain function shared by JS and the water shader; the stone by the path at 38 m; eleven houses on terraces above it; a small modern harbour; the old village on the shore (1896 / 1933 only) | golden (1, 22), storm dusk (2-6), lantern night (7-8), dawn (14-15), grey map (18), dark grey (20-21) | the carved inscription; "1896" notice board; "1933" plaque; painted 1896 / 1933 water lines (18); 100 / 200 / 300 FT posts (21) |
| **Coastal town** (`town`) | flat land on a bay: instanced houses that appear in order (time-lapse), streets, power poles and wires, harbour, boats, fish market | bright day (9-13), dark grey wave (19) | market banner "FISH", boat numbers |
| **Old stone corner** (`town` edge) | a weathered warning stone in tall grass at a street corner of the town | day (12-13) | weathered characters |
| **Living room, 2011** (`room`) | a Japanese living room: low table, tea set, TV, shelves, clock, lamp, window onto power lines | grey interior (16-17) | "2011 MARCH" wall calendar |

## Shots

| # | Frames | Line | Place · light | Camera (glide → hold/creep) | Change out | Props / acting | Rules |
|---|---|---|---|---|---|---|---|
| 1 | 0-194 | "A stone in the hills of Japan has one rule carved into it: do not build your home below this point." | valley · golden | macro of the moss-edged carved characters (FOV 34, 0.7 m), slow glide 0-40 then creep; on "do" (104) pull back + crane up past the stone (104-152) to a high 3/4 view over the stone, the eleven houses and the sea far below; hold + creep; on "You see" (174) push back into the carved face | push-in to the inscription + **12 f crossfade** (188-200) | carved stone, terraces, path, sea with boats and buoys, sun disc, clouds, birds; an old man sweeps by the stone | R3 · R9 TOP (high crane) |
| 2 | 194-319 | "You see, in 1896, a giant wave wiped out the little village of Aneyoshi." | valley shore 1896 · storm dusk | opens on the "1896" notice board, glides back over the thatched village (194-236), creep; the dark swell rises on the horizon on "giant" (230) and rolls in (252-319) | **12 f crossfade** (313-325) | lit windows (oil lamps), boats pulled up, nets, drying racks; nobody outside | R3 · R7 |
| 3 | 319-350 | "Only two people survived." | shore aftermath · storm | LOW beside an empty overturned boat (lens 0.45 m), glide then hold | eased crane up the slope | overturned boat, planks, torn net, a straw hat on the sand, water lapping | R9 LOW |
| 4 | 350-398 | (survived) | slope · storm | **OTS** behind the two survivors (blurred heads) looking down at the empty shore | **12 f crossfade** (392-404) | one puts a hand on the other's shoulder | R9 OTS |
| 5 | 398-458 | "Then, in 1933, it happened again." | valley shore 1933 · storm | insert on the "1933" plaque on a rebuilt house, pull back 428-458 to the rebuilt shoreline | eased crane up the hill | plaque, new timber houses, telegraph pole, boats | R3 · R7 |
| 6 | 458-533 | "...again. Four survivors." | slope · storm | high wide: water rushing between the houses at a distance; on "Four" (495) eases back to four survivors standing in the foreground, backs to the lens | **10 f crossfade** (528-538) | foam streaks, floating planks | R9 high |
| 7 | 533-583 | "So the villagers carve a warning" | carving yard · lantern night | **OTS** from a carver (blurred head left) onto the other carver chiselling the inscription; glide, hold | eased move | stone on logs, hammers, chisels, paper lanterns, andon lamp with light pools, straw mats, rope, chips | R9 OTS |
| 8 | 583-635 | "and set it high on the hillside." | valley path · lantern night | **LOW** up the slope: villagers haul the stone on a sledge with ropes, lanterns along the path; crane up toward the spot (608) | **14 f crossfade** (628-642) into day | sledge, rollers, ropes, lanterns; a dog trots along | R9 LOW |
| 9 | 635-756 | "Over the next eighty years, the coast changes. Towns grow right down to the water," | town · day | **TOP** over the town; time-lapse: houses, streets and power poles fill in toward the shore, cloud shadows race; slow creep | eased crane down to the harbour | houses, poles, fields shrinking, breakwater | R9 TOP |
| 10 | 756-805 | "because that's where the boats are," | harbour · day | 45° above the harbour, boats and buoys; hold + creep | eased move to the market | boats, buoys, nets, crates | a fisherman coils a rope |
| 11 | 805-854 | "and the jobs, and the view." | fish market · day | **WCU** (FOV 55) at the stall; the vendor holds up a fish on "jobs" (807) | **12 f crossfade** (848-860) | stall, fish on ice, scales, awning, sea view | **gag:** a seagull steals the fish on "view" (833) |
| 12 | 854-938 | "All over Japan, old stones like this are forgotten." | stone corner · day | **LOW** (lens 0.35 m) through tall grass: an old mossy stone half-hidden in grass, a bicycle leaning on it | eased push-in | bicycle, vending machine, pole, houses | **gag:** a man sits on the stone eating his lunch |
| 13 | 938-992 | "Just old rocks in the grass." | stone corner · day | insert on the stone half in the grass, the man's dangling feet | **12 f crossfade** (986-998), match on the stone | a sparrow pecks his crumbs | R3 |
| 14 | 992-1088 | "But Aneyoshi's eleven families keep their houses up the hill," | valley · dawn | close on the Aneyoshi stone (match), cranes up past it (992-1032) to the eleven houses high on the hill; hold + creep | eased move | eleven houses, gardens, laundry poles, smoke | a woman opens a shutter, a man stretches | R3 (stone returns) |
| 15 | 1088-1134 | "and walk down to their boats." | valley path · dawn | **LOW** tracking down the steep path behind two fishermen; the stone passes in the foreground | **10 f crossfade** (1129-1139) | the stone, steps, the bay with boats | they chat, one carries a net |
| 16 | 1134-1182 | "Then, in 2011," | living room · grey | insert on the "2011" wall calendar, pull back to the room | eased move | calendar, clock, TV, shelves, lamp + pool, cushions | R3 · R7 |
| 17 | 1182-1228 | "the ground starts shaking." | living room · grey | **OTS** past an old man's shoulder at the low table: the cup rattles (1184), power lines sway outside; the only camera shake | **12 f crossfade** (1222-1234) | tea set, window, poles and wires | he looks up |
| 18 | 1228-1329 | "The strongest earthquake in Japan's recorded history sends a wave" | valley as a map · grey | **TOP** (85°) over the valley and bay: painted 1896 and 1933 water lines with year labels, the stone circled above them; rings ripple offshore on "earthquake" (1243); a wave line heads for the coast on "sends" (1301) | **10 f crossfade** (1324-1334) | painted lines, labels | R8 · R9 TOP |
| 19 | 1329-1400 | "that swallows whole towns along the coast." | town · dark grey | high wide (55° down): a toon-ink water mass sweeps in over the distant rooftops | **whip** (1396-1405) | wave wall, foam, spray; nobody in the water | — |
| 20 | 1400-1469 | "It roars up the valley toward Aneyoshi..." | valley path · dark grey | **LOW** on the path looking down the valley: the foaming water climbs; people run uphill past the lens | eased move | foam, floating planks | R9 LOW |
| 21 | 1469-1557 | "and stops about three hundred feet below the stone." | by the stone · dark grey | **OTS** past a villager by the stone: the foam slows and stops at the 300 FT post (1472-1500); eases back so the stone is in the foreground and the water line far below (1505-1540); hold | **12 f crossfade** (1551-1563) | 100 / 200 / 300 FT posts, the stone | the villager lets out a breath |
| 22 | 1557-1626 | "Every single house is still standing." | valley · golden sunset | starts low on the stone, cranes up (1557-1600) to all eleven houses intact behind it, warm windows; hold + creep to the last frame | (end, no fade, no end card) | smoke, lit windows | a kid waves from a porch | callback |

## Totals and checks

- **Picture changes:** 21 boundaries + ~8 eased moves inside shots → a new picture every ~2 s.
  - Crossfades / prop loops at every place or time change: 1→2, 4→5, 6→7, 8→9, 11→12, 13→14, 15→16, 17→18, 18→19,
    21→22. Whips: 1 (19→20). Hard cuts: 0. No white frames.
- **Staging per 15 s:**

  | Window | OTS | Low angle | Top-down / high |
  |---|---|---|---|
  | 0-15 s | 4 | 3 | 1 (crane to a steep high view) |
  | 15-30 s | 7 | 8 | 9 |
  | 30-45 s | 17 | 12, 15 | 18 |
  | 45-54 s | 21 | 20 | 19 (55° high wide) |

- **Light changes:** golden → storm dusk → lantern night → day → dawn → grey interior → grey map → dark grey → golden.
- **Gags (calm beats only):** the seagull steals the fish (11), the man eating lunch on the forgotten stone (12-13), the
  sparrow and the crumbs (13). Nothing funny near the waves.
- **Callback:** the stone opens the video, returns at every era (7-8 carved and hauled, 14-15 at dawn, 21 by the water
  line) and closes it with every house still standing.

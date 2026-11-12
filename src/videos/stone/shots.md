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
| 1 | 0-194 | "A stone in the hills of Japan has one rule carved into it: do not build your home below this point." | valley · golden (world-fixed low sun from inland, raking across the face) | macro of the carved main column (FOV 34, 0.8 m), a small tilt 0-40, a slow push on "carved" (67); on "do" (104) a straight pull-back off the face (26 f) then a crane up over the eleven houses (46 f) to a high view down the valley to the sea; hold + creep; push back into the carved years (Meiji 29 = 1896) from 166 | push-in to the inscription + **12 f crossfade** (190-202) | the stone faces up the hill, toward the hamlet; an old man sweeps by it; terraces, road, poles, the sea with boats and buoys, birds | R3 · R9 TOP (high crane) |
| 2 | 194-319 | "You see, in 1896, a giant wave wiped out the little village of Aneyoshi." | valley shore 1896 · storm dusk | opens on the "1896" notice board, glides back and down (50 f) over the thatched village to the sea; on "wiped" (252) a slow push; the dark swell rises on "giant" (224) and towers over the horizon as it rolls in | **12 f crossfade** (313-325) | lamp-lit paper windows (front and back), boats pulled up, nets, drying racks; nobody outside | R3 · R7 |
| 3 | 319-350 | "Only two people survived." | shore aftermath · storm | LOW beside an empty overturned boat (lens 0.45 m), glide then hold | eased crane up the slope | overturned boat, planks, torn net, a straw hat on the sand, water lapping | R9 LOW |
| 4 | 350-398 | (survived) | slope · storm | **OTS** behind the two survivors (backs to the lens) on the line of sight to the empty shore | **10 f crossfade** in, **12 f crossfade** out | one rests a hand on the other's shoulder | R9 OTS |
| 5 | 398-458 | "Then, in 1933, it happened again." | valley shore 1933 · storm | insert on the "1933" plaque on a rebuilt house, pull back 428-458 to the rebuilt shoreline | eased crane up the hill | plaque, new timber houses, telegraph pole, boats | R3 · R7 |
| 6 | 458-533 | "...again. Four survivors." | slope · storm | **10 f crossfade** in; high wide: water rushing between the houses at a distance; on "Four" (495) eases down to four survivors standing in depth in the foreground, backs to the lens | **10 f crossfade** (528-538) | foam streaks only in the shallow flood | R9 high |
| 7 | 533-583 | "So the villagers carve a warning" | carving yard · lantern night | **OTS** from a carver (his head cut by the left edge) onto the other carver at the stone; on "warning" (569) a slow move in | **8 f crossfade** | stone on logs (the inscription half cut), hammer and chisel, paper lanterns on bamboo, andon lamp with light pools, straw mats, rope, chips | R9 OTS |
| 8 | 583-635 | "and set it high on the hillside." | valley path · lantern night | **LOW** diagonal up the path: the sledge with the stone near, the haulers leaning into two ropes up the slope, lanterns along the path; on "hillside" a gentle tilt up the path toward the stone's spot (40 f) | **14 f crossfade** (628-642) into day | sledge, rollers, ropes, lanterns; a dog trots along | R9 LOW |
| 9 | 635-756 | "Over the next eighty years, the coast changes. Towns grow right down to the water," | town · day | **TOP** over the town; time-lapse: houses, streets and power poles fill in toward the shore, cloud shadows race; slow creep | eased crane down to the harbour | houses, poles, fields shrinking, breakwater | R9 TOP |
| 10 | 756-805 | "because that's where the boats are," | harbour · day | **12 f crossfade** in; low along the quay at the moored boats (a row receding), buoys, the breakwater and lighthouse; on "boats" a glide along the quay | **10 f crossfade** | boats, buoys, crates | fishermen on the quay (one coils a rope, one waves) |
| 11 | 805-854 | "and the jobs, and the view." | fish market · day | **WCU** (FOV 55) from the customers' side: the vendor holds up a fish on "jobs" (807), the harbour behind him | **12 f crossfade** (848-860) | stall, fish on ice, scales, umbrella, the sea view | **gag:** a seagull steals the fish on "view" (833) |
| 12 | 854-938 | "All over Japan, old stones like this are forgotten." | stone corner · day | **LOW** (lens 0.35 m) through tall grass: an old mossy stone half-hidden in grass, a bicycle leaning on it | eased push-in | bicycle, vending machine, pole, houses | **gag:** a man sits on the stone eating his lunch |
| 13 | 938-992 | "Just old rocks in the grass." | stone corner · day | insert on the stone half in the grass, the man's dangling feet | **12 f crossfade** (986-998), match on the stone | a sparrow pecks his crumbs | R3 |
| 14 | 992-1088 | "But Aneyoshi's eleven families keep their houses up the hill," | valley · dawn (the low sun over the sea behind the lens) | **12 f crossfade** in; a high 3/4 view of the hamlet on the hill, the road and terraces; on "houses" (1049) a slow sideways glide | **8 f crossfade** | eleven houses, gardens, laundry poles, poles and wires | a woman opens a shutter, a man stretches | — |
| 15 | 1088-1134 | "and walk down to their boats." | valley path · dawn | **LOW** tracking down the steep path behind two fishermen; the stone passes in the foreground | **10 f crossfade** (1129-1139) | the stone, steps, the bay with boats | they chat, one carries a net |
| 16 | 1134-1182 | "Then, in 2011," | living room · grey | insert on the "2011" wall calendar, pull back to the room | eased move | calendar, clock, TV, shelves, lamp + pool, cushions | R3 · R7 |
| 17 | 1182-1228 | "the ground starts shaking." | living room · grey | **10 f crossfade** in; **OTS** past the old man's shoulder at the low table: the cup rattles (1184), the lamp swings, power lines sway outside; the only camera shake | **12 f crossfade** (1222-1234) | tea set, mandarins, newspaper, photo, radio, window, pole and wires | his wife looks up in alarm |
| 18 | 1228-1329 | "The strongest earthquake in Japan's recorded history sends a wave" | valley as a map · grey | **TOP** over the valley and bay (the sea at the top): topographic lines, the painted 1896 and 1933 water lines with year labels, the stone circled above them; quake rings spread in from the sea on "earthquake" (1243); on "history" a slow push down; a white wave line heads for the coast on "sends" (1301) | **10 f crossfade** (1324-1334) | painted lines, labels | R8 · R9 TOP |
| 19 | 1329-1400 | "that swallows whole towns along the coast." | town · dark grey | high wide (55° down): a toon-ink water mass sweeps in over the distant rooftops | **whip** (1396-1405) | wave wall, foam, spray; nobody in the water | — |
| 20 | 1400-1469 | "It roars up the valley toward Aneyoshi..." | valley path · dark grey | **LOW** on the grass beside the road looking down the valley: the foaming water climbs far below; people run uphill past the lens on both sides (focus on them) | **10 f crossfade** | foam, floating planks | R9 LOW |
| 21 | 1469-1557 | "and stops about three hundred feet below the stone." | by the stone · dark grey | **10 f crossfade** in; **OTS** past a villager beside the stone (its carved face toward us): the foam slows and stops at the 300 FT post (1472-1500); on "three" eases up and back; hold | **12 f crossfade** (1551-1563) | 100 / 200 / 300 FT posts, the stone | the villager lets out a breath |
| 22 | 1557-1626 | "Every single house is still standing." | valley · warm sunset (the sun just above the ridge, rays) | starts low behind the stone, cranes up (44 f) to the eleven houses intact up the hill, lamp-lit windows, chimney smoke; hold + creep to the last frame | (end, no fade, no end card) | smoke, lit windows | a kid waves from a porch | callback |

## Totals and checks

- **Picture changes:** 21 boundaries + ~8 eased moves inside shots → a new picture every ~2 s.
  - Crossfades / prop loops: 1→2 (push into the carved years), 2→3, 3→4, 4→5, 5→6, 6→7, 7→8, 8→9, 9→10, 10→11, 11→12,
    13→14, 14→15, 15→16, 16→17, 17→18, 18→19, 20→21, 21→22; eased moves inside one set: 12→13; one whip (19→20).
    Hard cuts: 0. No white frames.
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

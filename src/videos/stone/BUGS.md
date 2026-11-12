# StoneShort: bug list (rebuild)

Source of truth for the rebuild. Every bug gets a **before** still (from the previous final, `out/stone/before/`) and an
**after** still from the new full render, side by side in `out/stone/bugs/<ID>.jpg`. A bug is marked **fixed** only after
the after-still has been looked at.

Kept as is: `voice.wav`, `words.json`, the script, the order of the story beats. Renders: `--gl=angle` only.

How the list was made: the previous final (`out/stone/final.mp4`) watched as one still every 0.5 s
(`out/stone/before/half_sheet*.jpg`) and a 5-frame strip at every one of the 21 transitions (`out/stone/before/trans_sheet*.jpg`).

## Rules that apply everywhere

- **One stone.** A tall, rough, upright natural rock slab, about 1.2 m, irregular edges, moss at the base, carved characters
  on the front. One model (`stonemodel.ts`), used in every shot (hill, yard, haul, diorama, the forgotten stone in town).
- **Collision rule.** Characters keep at least 0.6 m from the stone and from every registered prop (checked in code).
- **Near-clip rule.** Nothing within 0.5 m of the lens (vegetation is cleared along every camera path; checked in code).
- **Cycles that travel.** Every walking or running character has a working cycle (legs, arms, bob, lean) and moves through
  the set.
- **No placeholders.** No flat colour fields, schematic maps, empty frames or repeated shots.

## Bugs

| ID | Time | Bug | Fix | Before | After | Status |
|---|---|---|---|---|---|---|
| B01 | 0–3.5 s | Opening is a flat beige wall of characters; the stone is never seen as an object | The whole stone on a grassy hill at golden hour, low angle so it towers against the sky, carved face readable; on "do not build your home below this point" crane up over the stone to the village and the sea far below | before/half/h_001, h_006 | | open |
| B02 | 6.3–6.7 s | "1896" board crossfaded over the carved Japanese years: muddy text-over-text double image | A clean 12-frame crossfade from a frame with no text; the year is a painted plaque standing in the 1896 scene | before/trans/t_194_0, half/h_014 | | open |
| B03 | 7–10.5 s | 1896: empty dark sea, the wave is only a faint light band on the horizon | Thatched village with wooden boats at dusk; a huge dark wave rises over the sea and comes at the village, seen from the hillside | before/half/h_018, h_021 | | open |
| B04 | 10.6–11.7 s | Aftermath: a boat alone on bare dark sand, nothing wrecked | Overturned boat on a wrecked, empty shore: broken planks and beams, a torn net, a roof piece, scattered debris | before/half/h_023 | | open |
| B05 | 11.7–13.3 s | Survivors look at the same empty sea again (repeats the 1896 view) | A different view: the two survivors on the slope looking down at the wrecked village site | before/half/h_026 | | open |
| B06 | 13.3–15.3 s | Static "1933" plaque held for ~2 s | The plaque in a moving shot that reveals the rebuilt 1933 street: tiled roofs, a telegraph pole and wires | before/half/h_029 | | open |
| B07 | 15.3–17.8 s | 1933 looks like 1896: the same empty sea, no visible wave | 1933 visibly different (kawara tiled roofs, telegraph poles); a second wave sweeps in between the houses at a distance; a new camera angle | before/half/h_034 | | open |
| B08 | 19.4–21.2 s | Unclear dark night street | Clearly the stone-raising: villagers hauling the stone uphill on a sledge by lantern light | before/half/h_041 | | open |
| B09 | 21.2–25.2 s | Town growth is flat green rectangles seen from straight above | A real 3D oblique time-lapse: house models, roads, the harbour and boats pop in step by step, growing toward the water | before/half/h_045, h_050 | | open |
| B10 | 25.2–26.8 s | Quay shot is nearly empty (a long pier, distant boats) | A finished harbour: fishermen at work on the quay, boats moored close, crates, nets, buoys | before/half/h_053 | | open |
| B11 | 26.8–28.5 s | Market reads as two scenes overlapped (a dark roof frame around a pasted sky panel; the pier diagonal over the stall in the crossfade) | One clean open-air market scene with the harbour behind; a clean crossfade | before/half/h_055, trans/t_805_0 | | open |
| B12 | 28.5–33 s | Huge grass blades fill the lens | Small foreground grass, nothing within 0.5 m of the camera (checked along the camera path) | before/half/h_061, h_066 | | open |
| B13 | 28.5–33 s | The lunch man sits inside the stone | Collision rule: he sits on a low wall beside it (≥ 0.6 m) and uses the stone as a table for his lunch box | before/half/h_061 | | open |
| B14 | 36.3–37.8 s | The two fishermen barely move | Walk cycle and real travel down the path past the stone | before/half/h_074, h_076 | | open |
| B15 | 41–44 s | Flat green map with tiny labels and red circles | 3D miniature diorama of the coast from above: terrain, sea, houses; the 1896 and 1933 water lines as glowing painted bands on the hill, large painted year labels, the stone above both | before/half/h_086 | | open |
| B16 | 44.3–46.7 s | The 2011 wave is a thin white strip | A tall foaming toon-ink water wall, ≥ 40 % of the frame height, clearly moving, rolling over distant rooftops | before/half/h_092 | | open |
| B17 | 46.7–49 s | People stand still on the road in an empty frame | A dense frame of people running uphill past the camera with real running cycles, lean and travel | before/half/h_095, h_097 | | open |
| B18 | 49–51.9 s | "Stops below the stone" is not shown (the water is a tiny strip at the horizon) | From beside the stone looking down the slope: the water rushes up the valley, slows, foams and stops at a wooden measuring post; hold on the stone with the calm water below | before/half/h_100, h_102 | | open |
| B19 | everywhere | Walking and running characters stand still (runners, fishermen, haulers, the sweeper) | Working cycles that travel (see B14, B17, B08) | before/half/h_010, h_096 | | open |
| B20 | everywhere | A character stands inside the stone (the sweeper at 4.5 s, the lunch man) | Collision rule, ≥ 0.6 m from the stone and props | before/half/h_010 | | open |
| B21 | everywhere | The stone looks different in every shot (beige wall, grey and pink tombstones, a mossy egg, a book-like slab) | ONE model, used everywhere | before/half/h_009, h_038, h_063, h_101, h_108 | | open |
| B22 | audio | The synthesized score sounds cheap | No music at all; voice unchanged; quieter SFX | — | | open |
| B23 | 4–4.5 s, 49–54 s | The stone stands in a ring of big boulders and is seen from its plain back at the end: it reads as a grave | Natural ground (grass, a few small stones); the end shows the stone side-on with its carved face catching the sunset | before/half/h_009, h_108 | | open |

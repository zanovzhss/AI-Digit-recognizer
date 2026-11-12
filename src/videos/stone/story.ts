// Timeline of "The Stone That Saved a Village" (54.19 s): 22 shots timed to the narration (shots.md).
// Camera rules (research/ricks/STYLE_REFERENCE.md, section 8): each framing is reached by an eased glide (peak speed in
// the first third, long settle), then the camera holds and creeps in at 0.1 %/frame with no float; place and time
// changes are 8-16 f crossfades or a push-in to a prop that crossfades into the next scene; one whip; one subtle shake
// (the earthquake, shot 17); no hard cuts, no white frames.
import { H, pathX, floorY, addPad } from "./terrain";

export const FPS = 30;
export const VOICE_S = 54.187354; // stone-short/voice/voice.wav
export const TOTAL = Math.round(VOICE_S * FPS); // 1626 frames
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** symmetric smootherstep */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
/** reference camera ease: velocity 12 u (1 - u)^2, peak speed at one third, long settle */
export const moveEase = (u: number) => { const x = clamp01(u); return 1 - (1 - x) ** 3 * (1 + 3 * x); };
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- words (stone-short/voice/words.json onsets, seconds) ----------------
export const W = {
  a: 0.08, carved: 2.3, do: 3.52, home: 4.34, below: 4.6, point: 5.04, you: 5.87, y1896: 6.54, giant: 7.74, wave: 8.12, wiped: 8.48,
  village: 9.32, aneyoshi: 9.74, only: 10.7, two: 10.92, survived: 11.52, then: 13.34, y1933: 14.04, happened: 15.34, again: 15.56,
  four: 16.58, survivors: 16.78, so: 17.82, villagers: 18.28, carve: 18.54, warning: 19.04, set: 19.5, high: 19.78, hillside: 20.34,
  over: 21.22, eighty: 21.86, years: 22.02, coast: 22.68, changes: 22.9, towns: 23.74, grow: 24.04, down: 24.6, water: 25.04,
  because: 25.28, boats: 26.18, jobs: 26.96, view: 27.84, all: 28.52, japan: 28.98, old: 29.6, stones: 29.72, forgotten: 30.58,
  just: 31.34, rocks: 31.86, grass: 32.38, but: 33.12, aneyoshis: 33.24, eleven: 33.8, families: 34.12, keep: 34.56, houses: 35.04,
  hill: 35.78, walk: 36.32, down2: 36.52, boats2: 37.02, then2: 37.88, y2011: 38.5, ground: 39.52, starts: 39.82, shaking: 40.1,
  the: 40.92, strongest: 41.06, earthquake: 41.5, history: 42.92, sends: 43.42, wave2: 44.04, swallows: 44.42, whole: 44.88,
  towns2: 45.2, coast2: 46.06, it: 46.74, roars: 46.88, valley: 47.58, toward: 47.82, aneyoshi2: 48.08, and: 49.02, stops: 49.14,
  three: 50.02, feet: 50.42, below2: 50.66, stone: 51.26, every: 51.97, single: 52.3, house: 52.6, still: 53.26, standing: 53.56,
};
/** every visual change lands 0-3 frames before its word: 2 frames here */
export const LEAD_F = 2;
export const cue = (s: number) => Math.round(s * FPS) - LEAD_F;

// ---------------- places: each built around its own x offset (far beyond the others' fog) ----------------
export type PlaceId = "hill" | "town" | "room";
export const OFF: Record<PlaceId, number> = { hill: 0, town: 8000, room: 16000 };
export const at = (pl: PlaceId, x: number, y: number, z: number): V3 => [OFF[pl] + x, y, z];
/** a point on the valley ground (hill set): x across, u = metres inland from the shore, lift above the ground */
export const gnd = (x: number, u: number, lift = 0): V3 => [x, H(x, -u) + lift, -u];
/** a point on the path centre line u metres inland */
export const onPath = (u: number, dx = 0, lift = 0): V3 => gnd(pathX(-u) + dx, u, lift);

// ---------------- the valley layout (hill set) ----------------
export const SU = 0.00216; // metres per design unit of the character canvas (600 x 1000, soles at 975)
/** the eleven houses, all up the hill above the stone: x offset from the path, u inland, yaw (0 = facing the sea, +z) */
export const HOUSES: [number, number, number][] = [
  [-11, 214, 0.2], [-25, 227, 0.3], [-13, 243, 0.2], [-27, 258, 0.3], [-12, 274, 0.15], [-24, 291, 0.25],
  [12, 219, -0.2], [26, 233, -0.3], [14, 250, -0.2], [27, 267, -0.3], [13, 286, -0.15],
];
/** the old village on the shore terrace (1896, rebuilt 1933): x, u, yaw */
export const VILLAGE: [number, number, number][] = [
  [-38, 14, 0.15], [-25, 10, 0.05], [-13, 17, -0.1], [13, 12, 0.1], [25, 17, -0.05], [37, 11, -0.15],
  [-32, 29, 0.2], [-17, 33, 0.0], [16, 30, -0.1], [31, 35, -0.2], [-7, 46, 0.1], [9, 47, -0.05], [-24, 49, 0.25], [24, 51, -0.2],
];
// register the terraces before anything samples the ground
const housePos = (x: number, u: number): [number, number] => [pathX(-u) + x, -u];
for (const [x, u] of HOUSES) { const [hx, hz] = housePos(x, u); addPad([hx, hz, 7.5, H(hx, hz) + 0.3]); }
for (const [x, u] of VILLAGE) { const [hx, hz] = housePos(x, u); addPad([hx, hz, 6, H(hx, hz)]); }
export const STONE_U = 200;
const STONE_X = pathX(-STONE_U) - 3.4;
addPad([STONE_X, -STONE_U, 2.6, H(STONE_X, -STONE_U) + 0.05]);
export const houseAt = (i: number): V3 => { const [x, u] = HOUSES[i]; const [hx, hz] = housePos(x, u); return [hx, H(hx, hz), hz]; };
export const villageAt = (i: number): V3 => { const [x, u] = VILLAGE[i]; const [hx, hz] = housePos(x, u); return [hx, H(hx, hz), hz]; };
/** the stone: base centre, face normal (the inscription faces up the hill, toward the hamlet), size */
const SN = (() => { const x = -0.25, z = -0.97, l = Math.hypot(x, z); return [x / l, z / l] as const; })();
export const STONE = { x: STONE_X, y: H(STONE_X, -STONE_U), z: -STONE_U, nx: SN[0], nz: SN[1], w: 0.95, h: 1.75, t: 0.3 };
/** a point on the stone's face: across (+ = right when facing it), up from the base, out from the face */
export const onStone = (across: number, up: number, out = 0): V3 => {
  const rx = -STONE.nz, rz = STONE.nx; // right of the viewer facing the stone = -left of the stone
  const k = STONE.t / 2 + out;
  return [STONE.x + STONE.nx * k - rx * across, STONE.y + up, STONE.z + STONE.nz * k - rz * across];
};
/** the 2011 water stops at the 300 ft post (91.4 m down the path from the stone) */
export const POSTS_U = [STONE_U - 30.5, STONE_U - 61, STONE_U - 91.4];
export const STOP_U = POSTS_U[2] + 1.5;
export const STOP_LEVEL = floorY(STOP_U);
/** the carving yard (1933, night), the haul path, the survivors' spots */
export const YARD = gnd(pathX(-40) + 22, 40);
export const HAUL_U = 150;
export const SURV2 = gnd(pathX(-78) - 26, 78);
export const SURV4 = gnd(pathX(-98) - 34, 98);
export const BOARD_1896 = onPath(58, 3.6);   // the village notice board by the path above the village (faces uphill, -z)
export const PLAQUE_1933 = 3;                // the plaque hangs on village house 3, right of its door
export const REBUILT_D = 5.2;                // depth of the 1933 houses
/** world position of the 1933 plaque (house-local (1.6, 1.95, d/2 + 0.06)) and its facing yaw */
export const PLAQUE_POS: V3 = (() => { const v = villageAt(PLAQUE_1933), yaw = VILLAGE[PLAQUE_1933][2], lx = 1.6, lz = REBUILT_D / 2 + 0.06;
  return [v[0] + lx * Math.cos(yaw) + lz * Math.sin(yaw), v[1] + 1.95, v[2] - lx * Math.sin(yaw) + lz * Math.cos(yaw)]; })();
/** the overturned boat on the 1896 shore (aftermath) */
export const BOAT_OVER = gnd(pathX(-1) + 2.5, 1.0);

// ---------------- the coastal town (town set): growth clock ----------------
/** houses appear in order of distance from the inland edge over shot 9 (the time-lapse) */
export const growAt = (f: number) => (f < 640 ? 0.12 : f > 752 ? 1 : 0.12 + 0.88 * smooth((f - 640) / 112));
export const MARKET = at("town", -18, 0, -14);
export const OLDSTONE = at("town", 132, 0, -386);

// ---------------- shots ----------------
export type Light = "golden" | "storm" | "lantern" | "day" | "dawn" | "room" | "grey" | "dark" | "sunset";
export type Era = "now" | "1896" | "1933" | "town" | "room";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: PlaceId; era: Era; sunAz?: number; sunEl?: number; sunW?: V3 };
const B = [0, 194, 319, 350, 398, 458, 533, 583, 635, 756, 805, 854, 938, 992, 1088, 1134, 1182, 1228, 1329, 1400, 1469, 1557, TOTAL];
const PL: [PlaceId, Light, Era, number?, number?][] = [
  ["hill", "golden", "now"],                // 1 the stone, the reveal (world-fixed low sun from inland, see SUNW)
  ["hill", "storm", "1896"],                // 2 1896, the swell
  ["hill", "storm", "1896"],                // 3 the overturned boat
  ["hill", "storm", "1896"],                // 4 the two survivors
  ["hill", "storm", "1933"],                // 5 the 1933 plaque
  ["hill", "storm", "1933"],                // 6 water between the houses, four survivors
  ["hill", "lantern", "1933"],              // 7 carving
  ["hill", "lantern", "1933"],              // 8 hauling it uphill
  ["town", "day", "town"],                  // 9 the town grows (top-down)
  ["town", "day", "town"],                  // 10 the boats
  ["town", "day", "town"],                  // 11 the fish market, the gull
  ["town", "day", "town"],                  // 12 the forgotten stone
  ["town", "day", "town"],                  // 13 just old rocks in the grass
  ["hill", "dawn", "now", 160, 14],         // 14 eleven houses up the hill (the low sun over the sea, behind the lens)
  ["hill", "dawn", "now", 25, 14],          // 15 walking down to the boats (into the morning sun)
  ["room", "room", "room"],                 // 16 2011 calendar
  ["room", "room", "room"],                 // 17 the cup rattles
  ["hill", "grey", "now"],                  // 18 the map: old water lines
  ["town", "dark", "town"],                 // 19 the wave over the rooftops
  ["hill", "dark", "now"],                  // 20 up the valley
  ["hill", "dark", "now"],                  // 21 it stops
  ["hill", "sunset", "now", 125, 11],       // 22 every house still standing
];
/** world-fixed sun directions (toward the sun) where a camera-relative key cannot light both framings of a shot:
 *  shot 1 = a low golden sun from inland, raking across the carved face and down the valley toward the sea */
const SUNW: Record<number, V3> = { 1: [-0.35, 0.36, -0.86] };
export const SHOTS: ShotDef[] = PL.map(([place, light, era, sunAz, sunEl], i) => ({ id: i + 1, a: B[i], b: B[i + 1], light, place, era, sunAz, sunEl, sunW: SUNW[i + 1] }));
/** crossfades (frames, centred on the shot's first frame) */
export const XFADE: Record<number, number> = { 2: 12, 3: 12, 5: 12, 7: 10, 8: 8, 9: 14, 12: 12, 14: 12, 15: 8, 16: 10, 18: 12, 19: 10, 22: 12 };
export const FLASH_AT: number | null = null;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story clocks ----------------
/** flood level (m) in the valley, by shot and frame: the aftermath lapping (3), water between the 1933 houses (6),
 *  the 2011 water climbing the valley (20) and stopping at the 300 ft post (21) */
export const floodAt = (id: number, f: number): number | null => {
  if (id === 3 || id === 4) return 0.25 + 0.12 * Math.sin(f * 0.11);
  if (id === 6) return -0.5 + 4.2 * smooth((f - 452) / 46);
  if (id === 20) return 9 + 13.5 * ((f - 1396) / 76);
  if (id === 21) { const u = clamp01((f - 1462) / 36); return 21.6 + (STOP_LEVEL - 21.6) * (1 - (1 - u) ** 3) + 0.06 * Math.sin(f * 0.21) * clamp01((f - 1500) / 20); }
  return null;
};
/** the 1896 swell: height and distance from the shore (m) */
export const swellAt = (f: number) => ({ h: 3 + 27 * smooth((f - 224) / 56), z: 560 - 400 * smooth((f - 236) / 84) });
/** the 2011 wave front in the town (local z, the sea is +z): it sweeps inland over the rooftops */
export const townFrontAt = (f: number) => 160 - 440 * clamp01((f - 1318) / 100) ** 0.9;
/** the map rings (shot 18): radius of the quake ripples and the wave line heading in */
export const ringAt = (f: number) => ({ r: Math.max(0, (f - cue(W.earthquake)) * 7.5), front: 330 - 300 * smooth((f - cue(W.sends)) / 40) });
export const SHAKE_F = cue(W.ground);
export const GULL_F = cue(W.view);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const D2R = Math.PI / 180;
/** a framing of a look point from the spherical direction (az from +z toward +x, el up) at distance d */
export const sph = (look: V3, d: number, az: number, el: number, fov = 46, roll = 0): Cam => {
  const e = el * D2R, a = az * D2R;
  return { pos: [look[0] + d * Math.cos(e) * Math.sin(a), look[1] + d * Math.sin(e), look[2] + d * Math.cos(e) * Math.cos(a)], look, fov, roll: roll * D2R };
};
const cam = (pos: V3, look: V3, fov = 46, roll = 0): Cam => ({ pos, look, fov, roll: roll * D2R });
const mixC = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
/** creep: dolly toward the look point by k of the distance */
const creepIn = (c: Cam, k: number): Cam => ({ ...c, pos: lerp3(c.look, c.pos, Math.max(0.5, 1 - k)) });
/** a key: from frame f, glide over dur frames to cam (then creep); the first key of a shot is its opening framing */
type Key = { f: number; dur?: number; cam: Cam | "prev"; creep?: number; ease?: (u: number) => number };
const CREEP = 0.001; // 0.1 %/frame
const SA = (id: number) => B[id - 1];
const SB = (id: number) => B[id];

const STONE_FACE = onStone(0, 1.0, 0);
const sFace = (across: number, up: number, d: number, fov = 34, tilt = 0): Cam => {
  const p = onStone(across, up, 0);
  return cam(onStone(across * 0.8, up + tilt, d), p, fov);
};
const P = (x: number, u: number, lift: number) => gnd(x, u, lift);
const PP = (u: number, dx: number, lift: number) => onPath(u, dx, lift);
const hs = (i: number, dy = 0): V3 => { const v = houseAt(i); return [v[0], v[1] + dy, v[2]]; };
const T = (x: number, y: number, z: number): V3 => at("town", x, y, z);
const RM = (x: number, y: number, z: number): V3 => at("room", x, y, z);

const KEYS: Record<number, Key[]> = {
  // 1 macro of the carved main column, a slow tilt down it; on "do" pull back and crane up over the eleven houses to the
  //   valley and the sea far below; hold + creep; on "You see" push back into the carved years (Meiji 29 = 1896)
  1: [
    { f: 0, cam: sFace(-0.05, 1.42, 0.8, 34, 0.12) },
    { f: 0, dur: 40, cam: sFace(-0.05, 1.18, 0.76, 34, 0.08) },
    { f: cue(W.do), dur: 46, cam: cam(PP(292, 3, 64), PP(150, 0, 0), 64) },
    { f: 176, dur: 20, cam: sFace(-0.22, 1.25, 0.55, 34, 0.04), creep: 0, ease: glide },
  ],
  // 2 the 1896 notice board above the village, then back and up over the thatched village to the stormy sea
  2: [
    { f: SA(2), cam: cam(add3(BOARD_1896, [0.1, 1.72, -3.6]), add3(BOARD_1896, [0, 1.55, 0]), 40) },
    { f: SA(2) + 8, dur: 40, cam: cam(PP(96, -6, 15), [2, 0, 46], 50) },
  ],
  // 3 LOW beside the empty overturned boat at the water's edge
  3: [
    { f: SA(3), cam: cam(add3(BOAT_OVER, [-2.2, 0.75, -4.6]), add3(BOAT_OVER, [1.0, 0.35, 0.8]), 50) },
    { f: SA(3), dur: 14, cam: cam(add3(BOAT_OVER, [-1.9, 0.7, -4.1]), add3(BOAT_OVER, [1.0, 0.35, 0.8]), 50) },
  ],
  // 4 OTS behind the two survivors on the slope, looking down at the empty shore
  4: [
    { f: SA(4), cam: "prev" },
    { f: SA(4), dur: 22, cam: cam(add3(SURV2, [0.35, 2.3, -3.1]), add3(BOAT_OVER, [0, 5, 0]), 46) },
  ],
  // 5 the 1933 plaque on a rebuilt house, pull back to the rebuilt shoreline
  5: [
    { f: SA(5), cam: cam(add3(PLAQUE_POS, [0.05, 0.04, 2.3]), add3(PLAQUE_POS, [0, 0, 0]), 38) },
    { f: cue(W.y1933) + 18, dur: 28, cam: cam(add3(PLAQUE_POS, [6, 3.0, 14]), add3(PLAQUE_POS, [-6, -1.5, -10]), 50) },
  ],
  // 6 high on the slope: water rushing between the houses; on "Four" ease back to the four survivors in the foreground
  6: [
    { f: SA(6), cam: "prev" },
    { f: SA(6), dur: 24, cam: cam(add3(SURV4, [-1, 9, -9]), PP(28, 0, 0), 48) },
    { f: cue(W.four), dur: 22, cam: cam(add3(SURV4, [0.4, 2.35, -4.4]), PP(26, 0, 2), 50) },
  ],
  // 7 OTS from a carver onto the other carver chiselling the stone (lantern night)
  7: [
    { f: SA(7), cam: cam(add3(YARD, [-2.6, 1.6, 3.4]), add3(YARD, [0.6, 0.7, -0.4]), 48) },
    { f: SA(7), dur: 18, cam: cam(add3(YARD, [-2.4, 1.55, 3.1]), add3(YARD, [0.6, 0.72, -0.4]), 48) },
  ],
  // 8 LOW from the side of the path: the haulers lean up the slope; on "hillside" crane up toward the stone's spot
  8: [
    { f: SA(8), cam: cam(PP(HAUL_U - 5.5, 4.6, 0.9), PP(HAUL_U + 6, -0.6, 1.3), 52) },
    { f: SA(8), dur: 18, cam: cam(PP(HAUL_U - 5, 4.2, 0.8), PP(HAUL_U + 6.5, -0.6, 1.4), 52) },
    { f: cue(W.hillside) - 4, dur: 22, cam: cam(PP(HAUL_U - 3, 3, 2.6), PP(STONE_U - 4, -1, 3), 54) },
  ],
  // 9 TOP over the town; the time-lapse; slow creep
  9: [
    { f: SA(9), cam: cam(T(10, 330, -150), T(10, 0, -150.1), 52) },
    { f: SA(9), dur: 30, cam: cam(T(5, 300, -142), T(5, 0, -142.1), 52) },
  ],
  // 10 crane down-and-forward to the harbour: the quay, the moored boats, the breakwater
  10: [
    { f: SA(10), cam: "prev" },
    { f: SA(10), dur: 26, cam: cam(T(14, 21, -28), T(4, 0, 22), 50) },
  ],
  // 11 WCU at the fish stall from the customers' side, the harbour behind the vendor; the gull on "view"
  11: [
    { f: SA(11), cam: "prev" },
    { f: SA(11), dur: 18, cam: cam(add3(MARKET, [0.9, 1.5, -3.7]), add3(MARKET, [-0.05, 1.45, 0.6]), 55) },
  ],
  // 12 LOW through the grass at the forgotten stone
  12: [
    { f: SA(12), cam: cam(add3(OLDSTONE, [-1.0, 0.45, 4.4]), add3(OLDSTONE, [0.2, 0.8, 0]), 52) },
    { f: SA(12), dur: 28, cam: cam(add3(OLDSTONE, [-0.9, 0.42, 3.7]), add3(OLDSTONE, [0.15, 0.82, 0]), 52) },
  ],
  // 13 the insert: the stone's base in the grass, his dangling feet, the sparrow
  13: [
    { f: SA(13), cam: "prev" },
    { f: SA(13), dur: 18, cam: cam(add3(OLDSTONE, [-0.3, 0.36, 1.55]), add3(OLDSTONE, [0.15, 0.36, 0]), 48) },
  ],
  // 14 dawn: low behind the Aneyoshi stone, gliding up past it to the eleven houses up the hill
  14: [
    { f: SA(14), cam: cam(onStone(0.75, 0.75, -1.6), PP(STONE_U + 40, 0, 7), 54) },
    { f: SA(14) + 4, dur: 40, cam: cam(onStone(-2.0, 2.1, -5.6), PP(STONE_U + 46, 0, 5), 56) },
  ],
  // 15 LOW tracking down the steep path behind two fishermen, the stone (its carved face) passing in the foreground
  15: [
    { f: SA(15), cam: cam(PP(STONE_U + 5, 0.9, 1.2), PP(STONE_U - 14, 0.4, 0.9), 56) },
    { f: SA(15), dur: 46, cam: cam(PP(STONE_U - 1.5, 0.7, 1.0), PP(STONE_U - 20, 0.2, 0.7), 56), ease: glide },
  ],
  // 16 the 2011 calendar, pull back into the room
  16: [
    { f: SA(16), cam: cam(RM(-1.2, 1.74, -1.25), RM(-1.2, 1.72, -2.2), 40) },
    { f: cue(W.y2011) + 6, dur: 24, cam: cam(RM(-0.1, 1.5, 1.6), RM(-0.9, 1.1, -2.0), 52) },
  ],
  // 17 OTS past the old man's shoulder at the low table: the cup, his wife, the window with the power lines
  17: [
    { f: SA(17), cam: "prev" },
    { f: SA(17), dur: 16, cam: cam(RM(-1.05, 1.62, 2.25), RM(0.3, 0.55, -0.6), 48) },
  ],
  // 18 TOP over the valley and bay as a map (the sea at the top of the frame)
  18: [
    { f: SA(18), cam: cam([0, 560, -40], [0, 0, -39], 54, 0) },
    { f: SA(18), dur: 34, cam: cam([0, 520, -30], [0, 0, -29], 54, 0) },
  ],
  // 19 high wide over the town: the wave sweeps in over the rooftops
  19: [
    { f: SA(19), cam: cam(T(-46, 78, -470), T(-10, 4, -130), 50) },
    { f: SA(19), dur: 24, cam: cam(T(-45, 74, -462), T(-10, 4, -124), 50) },
  ],
  // 20 LOW on the path looking down the valley: the water climbs far below, people run up past the lens
  20: [
    { f: SA(20), cam: cam(PP(STOP_U + 21, 1.3, 0.6), PP(STOP_U - 40, -1, 2), 56) },
    { f: SA(20), dur: 24, cam: cam(PP(STOP_U + 20, 1.2, 0.55), PP(STOP_U - 40, -1, 1.6), 56) },
  ],
  // 21 OTS past a villager beside the stone (its carved face toward us): the water stops at the 300 ft post far below
  21: [
    { f: SA(21), cam: "prev" },
    { f: SA(21), dur: 26, cam: cam(onStone(0.6, 2.15, 2.5), PP(STOP_U + 4, 0, 0), 52) },
    { f: cue(W.three) + 4, dur: 30, cam: cam(onStone(0.5, 2.7, 3.6), PP(STOP_U + 8, 0, 0), 52) },
  ],
  // 22 low behind the stone at sunset, crane up to all eleven houses up the hill; hold to the last frame
  22: [
    { f: SA(22), cam: cam(onStone(0.4, 0.75, -2.2), PP(STONE_U + 40, 0, 9), 52) },
    { f: SA(22) + 4, dur: 44, cam: cam(PP(STONE_U - 38, 3, 24), PP(STONE_U + 50, 0, 4), 56) },
  ],
};

const keyCam = (k: Key, id: number): Cam => (k.cam === "prev" ? camRig(id - 1, SA(id) - 1) : k.cam);
/** the camera of shot id at frame f: the key framing reached by the last key at or before f, crept in since */
const rigCam = (id: number, f: number): Cam => {
  const keys = KEYS[id];
  let c = keyCam(keys[0], id), tEnd = keys[0].f + (keys[0].dur ?? 0), creep = keys[0].creep ?? CREEP;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    const from = creepIn(c, creep * Math.max(0, k.f - tEnd));
    const to = keyCam(k, id), u = (k.ease ?? moveEase)((f - k.f) / Math.max(1, k.dur ?? 1));
    c = mixC(from, to, u);
    if (f < k.f + (k.dur ?? 0)) return c;
    c = to; tEnd = k.f + (k.dur ?? 0); creep = k.creep ?? CREEP;
  }
  return creepIn(c, creep * Math.max(0, f - tEnd));
};
/** the shot's own camera move: what the sight lines and the key light are built for */
export const camRig = (id: number, f: number): Cam => rigCam(id, f);

// ---------------- the whip (one in the video): a fast yaw out of shot 19 into shot 20 ----------------
const WHIPS: Record<number, { pre: number; post: number; dir: 1 | -1; deg: number }> = { 19: { pre: 4, post: 5, dir: 1, deg: 32 } };
const eIn = (u: number) => 2 * glide(u / 2), eOut = (u: number) => 2 * glide(0.5 + u / 2) - 1;
const yawAbout = (c: Cam, ang: number): Cam => {
  const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], cs = Math.cos(ang), sn = Math.sin(ang);
  return { ...c, look: [c.pos[0] + dx * cs + dz * sn, c.look[1], c.pos[2] - dx * sn + dz * cs], roll: c.roll + 0.1 * ang };
};
/** the earthquake: a subtle tremor on shot 17 only (sub-centimetre jitter, a fraction of a degree of roll) */
const shake = (c: Cam, id: number, f: number): Cam => {
  if (id !== 17 || f < SHAKE_F) return c;
  const k = Math.min(1, (f - SHAKE_F) / 8), n = (s: number) => Math.sin(f * 2.1 + s) * 0.6 + Math.sin(f * 3.7 + 2 * s) * 0.4;
  const a = 0.006 * k;
  return { ...c, pos: [c.pos[0] + a * n(1), c.pos[1] + a * 0.7 * n(2), c.pos[2] + a * 0.5 * n(3)], roll: c.roll + 0.0035 * k * n(4) };
};
export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], c = shake(camRig(id, f), id, f), out = WHIPS[id], inn = WHIPS[id - 1];
  if (out && f >= s.b - out.pre) return yawAbout(c, out.dir * out.deg * D2R * eIn((f - (s.b - out.pre) + 1) / out.pre));
  if (inn && f < s.a + inn.post) return yawAbout(c, -inn.dir * inn.deg * D2R * (1 - eOut((f - s.a) / inn.post)));
  return c;
};

// ---------------- lens: depth of field (focus = the camera's look target unless set) ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const EYE_H = 1.5;
const fixed = (p: V3): (() => V3) => () => p;
export const DOF: Dof[] = [
  { f: 0, cInf: 12, focus: fixed(STONE_FACE) }, { f: cue(W.do), dur: 30, cInf: 0 }, { f: cue(W.you), dur: 14, cInf: 12, focus: fixed(STONE_FACE) },
  { f: SA(2), cInf: 10 }, { f: SA(2) + 8, dur: 30, cInf: 0 },
  { f: SA(3), cInf: 11 }, { f: SA(4), cInf: 8 }, { f: SA(5), cInf: 12 }, { f: cue(W.y1933) + 18, dur: 24, cInf: 2 },
  { f: SA(6), cInf: 0 }, { f: cue(W.four), dur: 16, cInf: 5 },
  { f: SA(7), cInf: 11 }, { f: SA(8), cInf: 9 },
  { f: SA(9), cInf: 0 }, { f: SA(10), cInf: 4 }, { f: SA(11), cInf: 11 },
  { f: SA(12), cInf: 10 }, { f: SA(13), cInf: 12 },
  { f: SA(14), cInf: 12 }, { f: SA(14) + 6, dur: 30, cInf: 0 }, { f: SA(15), cInf: 8 },
  { f: SA(16), cInf: 12 }, { f: cue(W.y2011) + 6, dur: 20, cInf: 7 }, { f: SA(17), cInf: 10 },
  { f: SA(18), cInf: 0 }, { f: SA(19), cInf: 0 }, { f: SA(20), cInf: 5, focus: () => PP(STOP_U + 15, 0, 1.4) }, { f: SA(21), cInf: 7, focus: () => onStone(0, 1.2, 0) }, { f: cue(W.three) + 4, dur: 24, cInf: 4 },
  { f: SA(22), cInf: 10 }, { f: SA(22) + 4, dur: 34, cInf: 0 },
];
export const DOF_SCALE = 0.6;
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: DOF_SCALE * (p.cInf + (d.cInf - p.cInf) * k), focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => { const d = dofAt(f); return d.focus ? d.focus(f) : camAt(id, f).look; };

/** near framing objects: none (the foreground heads are cast members, see cast.ts) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
export { pathX, H };

// Timeline of "The Man Who Sold Ice to the Tropics" (~55 s): 29 shots timed to the narration words
// (ice-short/voice/words.json), the places they happen in, the story actions (sawing, loading, the brig leaving, the
// laugh, the slip, the melt, the coin, the yawn, the bulb, the icicle, the towel, the sawdust, the calendar, the hatch,
// the market) and the camera: one eased move per shot (never a hold), fly-throughs inside a place, whips and
// foreground wipes between places (cut frames unchanged), impacts are 7-frame kicks that flip sign every frame.
export const FPS = 30;
export const VOICE_S = 55.170612; // ice-short/voice/voice.wav
export const TOTAL = Math.round(VOICE_S * FPS); // 1655 frames
export const D0 = 0; // ground level (m); build.ts houses stand on it
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** reference camera ease: symmetric smootherstep */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- words (voice/words.json onsets, seconds) ----------------
export const W = {
  never: 1.97, you: 3.63, and1: 5.48, loaded: 6.99, ship: 7.33, headed: 9.82, the: 11.11, newspaper: 11.24, joke: 12.28,
  prove: 13.64, slippery: 13.97, it: 15.78, melts: 17.46, and2: 19.32, dollars: 21.21, so: 22.08, and3: 23.7, again2: 23.97,
  by: 25.2, prison: 27.24, and4: 27.93, figures: 28.78, ice: 29.86, it2: 31.73, warm: 33.11, ever: 34.15, wrapped: 34.33,
  the2: 36.12, heat: 37.99, so2: 38.82, which: 40.73, in: 43.1, ships: 44.42, eighty: 45.41, of: 46.04, india: 46.51,
  a: 47.32, hundred: 47.4, arrive: 48.3, and5: 49.08, city: 50.4, bought: 52.32, man: 53.45,
};
/** every visual reaction lands 0-3 frames before its word */
export const LEAD_F = 2;
export const cue = (s: number) => Math.round(s * FPS) - LEAD_F;

// ---------------- places: each is built around its own x offset (far beyond the fog of the others) ----------------
export type PlaceId = "street" | "cell" | "harbor" | "pond" | "beach" | "mill" | "port" | "hold" | "ocean" | "calcutta";
export const OFF: Record<PlaceId, number> = { street: 0, cell: 1500, harbor: 3000, pond: -3000, beach: 6000, mill: -6000, port: 9000, hold: 12000, ocean: 15000, calcutta: 18000 };
export const at = (pl: PlaceId, x: number, y: number, z: number): V3 => [OFF[pl] + x, y, z];

// the snowy street (CellarShort's lane, reused): houses at x = -10 facing +x, lane x -6..-1.35, fence at x = -0.95
export const LANE_X1 = -1.35, FENCE_X = -0.95;
export const HATCH = { x0: -6.0, x1: -4.75, z0: 5.25, z1: 6.75, top: 0.85 };
// the cell (CellarShort's cellar room, reused as the debtors' prison): stone room at OFF.cell
export const CX = OFF.cell;
export const C = (x: number, y: number, z: number): V3 => [CX + x, y, z];
export const CELLAR = { x0: -2.6, x1: 2.6, z0: -3.4, z1: 1.6, h: 2.6 };
export const CELL_WIN = { x: 0.95, y: 1.85, w: 0.56, h: 0.44 }; // barred window in the back wall
export const BARS_Z = 1.6; // the bar wall between the cell and the corridor
export const BENCH = { x0: -2.2, x1: 0.4, z: -3.05, h: 0.44, d: 0.42 };

// ---------------- the brig: harbor / port / ocean / calcutta (one model, posed per shot) ----------------
export const DECK_Y = 1.2; // deck above the waterline
export const WATER_Y = -1.0; // harbour water level under the quays (quay top = 0)
export type BrigPose = { pos: V3; yaw: number; roll: number; sail: string; show: boolean; furled?: boolean };
const SAIL = "#f1e9d6", RED = "#c8473a", GREEN = "#3f8a54";
/** where the brig is at frame f of shot id (all poses are pure functions of id + f) */
export const brigAt = (id: number, f: number): BrigPose => {
  const s = SHOTS[id - 1], u = (f - s.a) / Math.max(1, s.b - s.a), bob = 0.012 * Math.sin(f * 0.11);
  const P = (pl: PlaceId, x: number, z: number, yaw = 0, sail = SAIL): BrigPose => ({ pos: at(pl, x, WATER_Y, z), yaw, roll: bob, sail, show: true });
  switch (s.place) {
    case "beach": return { ...P("beach", 6, -46, 0.5), roll: bob * 2 };
    case "harbor":
      if (id === 6) return P("harbor", -4 - 6 * u, -16 - 10 * u, 2.11);
      if (id === 8) return P("harbor", 6, -44, 0.6);
      if (id === 13) return P("harbor", -6 - 4 * u, -20 - 7 * u, 2.09, RED);
      if (id === 14) return P("harbor", -2 - 3 * u, -22 - 6 * u, 2.03, GREEN);
      return P("harbor", 0, -4.2);
    case "port": return P("port", 0, -4.2);
    case "ocean": return { pos: at("ocean", 3.2 * (f - s.a) / FPS, WATER_Y, 0), yaw: 0, roll: 0.03 * Math.sin(f * 0.09), sail: SAIL, show: true };
    case "calcutta": return P("calcutta", 0, -6.2);
    default: return { pos: [0, -100, 0], yaw: 0, roll: 0, sail: SAIL, show: false };
  }
};

// ---------------- story actions ----------------
// shot 1-2 beach: Tudor holds out the block, the local stares; sweat runs
export const BEACH = { tudor: at("beach", 0.55, 0, 0) as V3, local: at("beach", -0.55, 0, 0.12) as V3 };
// shot 3 pond: three cutters saw a channel; a stack of cut blocks on the bank
export const POND = { workers: [at("pond", -1.05, 0, -4.3), at("pond", 0.1, 0, -4.05), at("pond", 1.2, 0, -4.35)] as V3[] };
// harbor: the quay (top y 0) runs along x, water for z < 0, houses at z = 24; the gangplank meets the brig's side
export const PLANK = { x: 2.2, z0: 0.5, z1: -1.75 }; // quay end -> deck end (deck end at DECK_Y + WATER_Y)
export const HARBOR = { tudor: at("harbor", -1.1, 0, 3.0) as V3, stack: at("harbor", -1.6, 0, 1.5) as V3 };
/** loading (shot 5): two cutters carry blocks from the stack up the plank onto the deck */
export const carrierAt = (i: number, f: number): { p: V3; walking: boolean; phase: number } => {
  const f0 = 208 + i * 26, u = clamp01((f - f0) / 62);
  const z = (i ? 4.4 : 3.2) + ((PLANK.z0 - 0.35) - (i ? 4.4 : 3.2)) * u;
  const y = z < PLANK.z0 ? ((PLANK.z0 - z) / (PLANK.z0 - PLANK.z1)) * (DECK_Y + WATER_Y) : 0;
  return { p: at("harbor", PLANK.x + (i ? -0.05 : 0.08), y, z), walking: u > 0 && u < 1, phase: (((f - f0) * 1.6) / FPS / 1.6) % 1 };
};
// shot 7-9 street: the newsboy with the paper, the man who slips on the ice patch
export const NEWSBOY_P: V3 = [-3.15, 0, 4.0];
export const ICE_PATCH: V3 = [-3.4, 0, 5.25];
export const SLIP = cue(W.slippery);
export const slipperAt = (f: number): { p: V3; fall: number; walking: boolean } => {
  const u = clamp01((f - 404) / (SLIP - 404));
  const z = 4.15 + (ICE_PATCH[2] - 4.15) * u;
  const k = clamp01((f - SLIP) / 9);
  return { p: [ICE_PATCH[0] + 0.05, 0.32 * Math.sin(Math.PI * Math.min(1, k * 1.2)) * (1 - k * 0.5), z + 0.25 * smooth(k)], fall: k, walking: f < SLIP };
};
// shots 10-12, 15 port: blocks melt into puddles, Tudor sweats; the wallet and the coin
export const PORT = { stack: at("port", -1.4, 0, 2.3) as V3, tudor: at("port", -2.2, 0, 0.6) as V3, wallet: at("port", 2.4, 0.0, 3.2) as V3 };
/** melt 0..1 of the port stack: shot 10 a little, shot 11 most of it, shot 15 nearly gone */
export const meltAt = (id: number, f: number) => id === 10 ? 0.1 + 0.15 * clamp01((f - 471) / 51) : id === 11 ? 0.25 + 0.55 * smooth((f - 522) / 56) : id === 15 ? 0.94 : 0;
export const WALLET_OPEN = [582, 600] as const;
export const COIN_F = cue(W.dollars);
// shots 16-21 cell
export const TUDOR_CELL: V3 = C(-0.45, BENCH.h - 0.02, BENCH.z + 0.08);
export const TUDOR_WIN: V3 = C(0.15, 0, -2.75);
export const GUARD_P: V3 = C(1.45, 0, 1.85);
export const YAWN = [cue(W.prison) - 6, cue(W.prison) + 26] as const;
export const BULB = cue(W.figures);
export const BOTTLE: V3 = C(-1.75, BENCH.h, BENCH.z + 0.04);
export const WRAP = [cue(W.wrapped), cue(W.wrapped) + 22] as const;
export const towelAt = (f: number) => (f < 1023 ? 0 : smooth((f - WRAP[0]) / (WRAP[1] - WRAP[0])));
export const HEAT_F = cue(W.heat);
// shots 22, 25 hold: sawdust rises over the ice; the calendar flips four months
export const HOLD = { workers: [at("hold", -0.38, 0, 2.3), at("hold", 0.55, 0, 3.2)] as V3[], post: at("hold", -1.0, 0, 3.0) as V3 };
export const sawdustAt = (f: number) => (f < 1163 ? 0.98 : 0.32 + 0.66 * smooth((f - 1163) / 57));
export const FLIPS = [1342, cue(W.eighty) + 2, cue(W.of), cue(W.india)];
// shot 26 calcutta: the hatch cover comes off
export const HATCH_OPEN = [cue(W.hundred) + 2, cue(W.hundred) + 20] as const;
// market (calcutta place, x 60..90)
export const MARKET = { stall: at("calcutta", 70, 0, 12.0) as V3, tudor: at("calcutta", 73.3, 0, 15.0) as V3 };

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: PlaceId; sunAz?: number; sunEl?: number };
const B = [0, cue(W.never), cue(W.you), cue(W.and1), cue(W.loaded), cue(W.headed), cue(W.the), cue(W.joke), cue(W.prove), cue(W.it),
  cue(W.melts), cue(W.and2), cue(W.so), cue(W.and3), 736, cue(W.by), cue(W.and4), cue(W.ice), cue(W.it2), cue(W.ever), cue(W.the2),
  cue(W.so2), cue(W.which), cue(W.in), cue(W.ships), cue(W.a), cue(W.and5), cue(W.city), cue(W.man), TOTAL];
const PL: [PlaceId, Light, number?, number?][] = [
  ["beach", "golden"], ["beach", "golden"],                                  // 1-2 hook
  ["pond", "day"], ["harbor", "day"], ["harbor", "day"], ["harbor", "day"],   // 3-6 1806 Boston
  ["street", "day"], ["harbor", "day"], ["street", "day"],                   // 7-9 the joke
  ["port", "day"], ["port", "day"], ["port", "day"],                         // 10-12 the melt
  ["harbor", "day"], ["harbor", "day"], ["port", "day"],                     // 13-15 again and again
  // cell: the key is the one warm window (back wall, right of frame), so Tudor and the room fall into violet-blue shade
  ["cell", "golden", 38, 24], ["cell", "golden", 38, 24], ["cell", "golden", 12, 18], ["cell", "golden", 42, 24], // 16-19
  ["cell", "golden", 60, 30], ["cell", "golden", 60, 30],                    // 20-21 the towel
  ["hold", "golden", 120, 62], ["mill", "day"],                              // 22-23 sawdust
  ["ocean", "day"], ["hold", "golden", 120, 62],                             // 24-25 1833
  ["calcutta", "golden"], ["calcutta", "golden"], ["calcutta", "golden"], ["calcutta", "golden"], // 26-29
];
export const SHOTS: ShotDef[] = PL.map(([place, light, sunAz, sunEl], i) => ({ id: i + 1, a: B[i], b: B[i + 1], light, place, sunAz, sunEl }));
/** hard cuts only; the white flash after the hook */
export const XFADE: Record<number, number> = {};
export const FLASH_AT = B[2];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
// Cinematic pass: the camera never holds. Every shot is one eased move (orbit / push / crane, with a slow float on
// top) around its subject, and every shot boundary is a transition that straddles the unchanged cut frame:
//   fly  - same place: one continuous flight from shot k's framing into shot k+1's (both rigs keep moving under it)
//   whip - place change: shot k whips away with accelerating yaw, shot k+1 arrives mid-whip and settles; the switch
//          happens at peak angular speed, inside the motion blur (motionblur.ts)
//   wipe - place change: a foreground object (crate, ship hull, sail) sweeps across the lens and the switch happens
//          while it covers the frame (world.ts poses the wiper from wipeAt)
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** a framing around a subject: distance (m), azimuth (deg from +z toward +x), elevation (deg; negative = lens below
 *  the look point, looking up), fov (deg), roll (deg) */
type Sph = { d: number; az: number; el: number; fov: number; roll: number };
type Rig = { look: (f: number) => V3; A: Sph; B: Sph };
const T = (f: number) => f / FPS;
const D2R = Math.PI / 180;
const S = (d: number, az: number, el: number, fov = 40, roll = 0): Sph => ({ d, az, el, fov, roll });
const mixS = (a: Sph, b: Sph, k: number): Sph => ({ d: a.d + (b.d - a.d) * k, az: a.az + (b.az - a.az) * k, el: a.el + (b.el - a.el) * k, fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
const sph = (look: V3, s: Sph): Cam => {
  const el = s.el * D2R, az = s.az * D2R;
  return { pos: [look[0] + s.d * Math.cos(el) * Math.sin(az), look[1] + s.d * Math.sin(el), look[2] + s.d * Math.cos(el) * Math.cos(az)], look, fov: s.fov, roll: s.roll * D2R };
};
const mixC = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
/** ease-in / ease-out over the whole shot */
const ease = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
const fixed = (pl: PlaceId, x: number, y: number, z: number) => () => at(pl, x, y, z);
const brigLook = (id: number, up: number, ahead = 1.5) => (f: number): V3 => {
  const b = brigAt(id, f); return [b.pos[0] + ahead * Math.cos(b.yaw), b.pos[1] + up, b.pos[2] - ahead * Math.sin(b.yaw)];
};
const RIGS: Record<number, Rig> = {
  // 1 beach: low glide in over the sand to the two-shot, ending below eye level
  1: { look: fixed("beach", 0, 1.0, 0), A: S(9.5, -30, 9, 42), B: S(4.0, 18, -7, 36, 1.5) },
  // 2 close-up on the local past Tudor's shoulder and the ice
  2: { look: fixed("beach", -0.5, 1.5, 0.12), A: S(2.5, 72, -8, 30, -2), B: S(1.7, 22, -1, 30, -3) },
  // 3 pond: low along the channel, the cutters in a diagonal receding from the lens
  3: { look: fixed("pond", 0.1, 1.0, -4.3), A: S(7.6, 64, 3, 38), B: S(5.4, 36, -4, 36, 2) },
  // 4 harbor: Tudor from below, proud, the brig behind
  4: { look: fixed("harbor", -1.0, 1.35, 2.8), A: S(4.8, 42, -9, 35, -2), B: S(3.4, 14, -11, 34, -3) },
  // 5 on deck: crane down toward the plank as the blocks come aboard
  5: { look: fixed("harbor", 2.3, 0.9, 1.6), A: S(6.8, 166, 15, 40, 2), B: S(6.0, 156, 10, 40, 1) },
  // 6 aerial: orbit the brig as it leaves the snowy harbour
  6: { look: (f) => { const b = brigAt(6, f); return [b.pos[0] - 2, 0, b.pos[2] - 6]; }, A: S(64, 60, 40), B: S(42, 10, 30) },
  // 7 street: the newspaper from below, sliding round the newsboy
  7: { look: fixed("street", -3.12, 0.9, 4.1), A: S(2.6, -14, -7, 36, 2), B: S(1.9, 14, -3, 36, 3) },
  // 8 harbor quay: low through the laughing crowd
  8: { look: fixed("harbor", -6.5, 1.15, 3.8), A: S(10.4, 30, 0, 40, -1), B: S(9.4, 14, -3, 38, -2) },
  // 9 street: ground-level push down the lane to the slip
  9: { look: fixed("street", -3.0, 0.8, 5.2), A: S(7.8, 26, 3, 40), B: S(6.6, 8, -1, 40, 1.5) },
  // 10 Caribbean port wide (scale): crane down onto the quay
  10: { look: fixed("port", -0.6, 0.9, 0.4), A: S(22, 52, 22, 40), B: S(12, 12, 7, 40) },
  // 11 the melting stack, Tudor sweating behind it, from below
  11: { look: fixed("port", -1.7, 0.75, 1.5), A: S(6.0, 46, 1, 36, 2), B: S(4.2, 16, -5, 34, 3) },
  // 12 the empty wallet on the dock boards; the look follows the coin as it rolls away
  12: { look: (f) => lerp3(at("port", 2.42, 0.04, 3.2), at("port", 3.1, 0.05, 3.25), glide((f - 630) / 30)), A: S(1.7, -55, 30, 34), B: S(1.0, 10, 12, 34) },
  // 13-14 two departures from Boston, sweeping under the sails
  13: { look: brigLook(13, 10.2), A: S(48, 45, -2, 40, 1), B: S(34, 0, -6, 40, 2) },
  14: { look: brigLook(14, 10.2), A: S(44, -20, -2, 40, -1), B: S(34, 28, -6, 40, -2.5) },
  // 15 port: the puddles, fast push
  15: { look: fixed("port", -1.4, 0.2, 2.0), A: S(6.6, 40, 25, 38), B: S(4.6, 22, 15, 38) },
  // 16 cell: from the corridor past the yawning guard's shoulder, trucking along the bars
  16: { look: fixed("cell", -0.45, 0.85, -2.8), A: S(8.8, 19, -1, 40), B: S(6.6, 2, 5, 40) },
  // 17 the light-bulb moment, from below
  17: { look: fixed("cell", -0.45, 1.43, -2.95), A: S(3.0, 48, -10, 38), B: S(1.9, 0, -5, 38, -2) },
  // 18 the icicle in the window, looking up
  18: { look: fixed("cell", 0.95, 1.98, -3.55), A: S(1.5, -35, -18, 32, 2), B: S(1.0, 15, -6, 32, 3) },
  // 19 Tudor at the window
  19: { look: fixed("cell", 0.35, 1.45, -3.05), A: S(3.8, -45, -8, 38, -1), B: S(2.6, 0, -2, 38, -2) },
  // 20-21 the bottle and the towel: one orbit carried across the cut
  20: { look: fixed("cell", -1.75, 0.66, -3.0), A: S(1.2, 70, 28, 30), B: S(0.8, -20, 8, 30) },
  21: { look: fixed("cell", -1.75, 0.66, -3.0), A: S(1.4, -40, 6, 34, 1), B: S(1.0, 50, 18, 34, 3) },
  // 22 the hold: sawdust shovelled over the ice
  22: { look: fixed("hold", 0.1, 1.0, 2.0), A: S(4.6, 22, 12, 40), B: S(4.5, 2, 5, 40, -1) },
  // 23 the mill yard, low past the logs
  23: { look: fixed("mill", -1.78, 1.51, -2.5), A: S(12.5, 50, 6, 40), B: S(8.2, 10, -1, 40, 1.5) },
  // 24 the brig alone on the hot ocean, aerial orbit (scale)
  24: { look: brigLook(24, 6), A: S(60, -62, 16), B: S(40, -12, 11) },
  // 25 the calendar on the post
  25: { look: fixed("hold", -1.0, 1.42, 3.06), A: S(2.6, -30, -6, 34), B: S(2.0, 26, 3, 34, 1) },
  // 26 Calcutta: over the hatch as its cover comes off
  26: { look: fixed("calcutta", 0.4, 0.35, -6.6), A: S(6.6, -30, 62, 40, -2), B: S(4.4, 22, 38, 40, -1) },
  // 27 the market, wide (scale)
  27: { look: fixed("calcutta", 71.5, 1.3, 11.5), A: S(24, 38, 12, 40), B: S(14, 2, 4, 40) },
  // 28 the stall, low, orbiting the counter
  28: { look: fixed("calcutta", 70.0, 1.25, 12.4), A: S(6.6, -32, -4, 40), B: S(4.4, 22, -6, 40, 1.5) },
  // 29 Tudor's smile, from below
  29: { look: fixed("calcutta", 73.3, 1.6, 15.0), A: S(3.1, -40, -9, 32, -2), B: S(2.0, 8, -4, 32, -3) },
};
const MOVE_X = 1.06;
/** the shot's own move (no transitions, no kicks): what the sight lines, the sun and the foreground props are built for */
export const camRig = (id: number, f: number): Cam => {
  // the move runs 3 % past A and B at either end (MOVE_X = 1.06): a little more travel, framings kept
  const s = SHOTS[id - 1], r = RIGS[id], k = mixS(r.A, r.B, 0.5 + (ease((f - s.a) / (s.b - s.a)) - 0.5) * MOVE_X);
  const c = sph(r.look(f), k), a = 0.016 * k.d; // float: a slow drift of ~1.6 % of the distance
  return { ...c, pos: [c.pos[0] + a * Math.sin(f * 0.085 + id), c.pos[1] + 0.6 * a * Math.sin(f * 0.11 + 2 * id), c.pos[2] + a * Math.cos(f * 0.075 + id)] };
};

// ---------------- transitions (key k = the boundary between shot k and shot k+1) ----------------
export type Wipe = "crate" | "hull" | "sail";
type Tr = { kind: "fly" | "whip" | "wipe"; pre: number; post: number; dir?: 1 | -1; deg?: number; lift?: number; wipe?: Wipe };
const fly = (pre: number, post: number, lift = 0): Tr => ({ kind: "fly", pre, post, lift });
// whip: peak turn ~17 deg/frame (about 3/4 of the frame width): faster than that the blurred frames all look alike
const whip = (dir: 1 | -1, pre = 7, post = 8, deg = 63): Tr => ({ kind: "whip", pre, post, dir, deg });
const wipe = (w: Wipe, dir: 1 | -1, pre = 6, post = 6): Tr => ({ kind: "wipe", pre, post, dir, wipe: w });
export const TRANS: Record<number, Tr> = {
  1: fly(5, 6), 2: wipe("hull", 1), 3: wipe("crate", -1), 4: fly(5, 5, 3), 5: fly(5, 5, 6), 6: wipe("sail", 1), 7: wipe("crate", 1),
  8: wipe("hull", -1), 9: wipe("hull", -1), 10: fly(5, 5, 2), 11: fly(5, 5), 12: wipe("crate", 1), 13: wipe("sail", -1), 14: wipe("sail", 1),
  15: wipe("crate", -1), 16: fly(7, 7), 17: fly(6, 6), 18: fly(6, 6), 19: fly(6, 6), 20: fly(6, 6), 21: wipe("sail", 1), 22: wipe("sail", -1),
  23: whip(-1), 24: wipe("hull", 1), 25: wipe("sail", 1), 26: fly(5, 5, 8), 27: fly(5, 5, 1), 28: fly(5, 5),
};
/** yaw the view about the lens (whips), with a little roll into the turn */
const yawAbout = (c: Cam, ang: number): Cam => {
  const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], cs = Math.cos(ang), sn = Math.sin(ang);
  return { ...c, look: [c.pos[0] + dx * cs + dz * sn, c.look[1], c.pos[2] - dx * sn + dz * cs], roll: c.roll + 0.12 * ang };
};
/** camera of shot id at frame f before kicks: its rig, taken over near its boundaries by the transitions */
const camT = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], out = TRANS[id], inn = TRANS[id - 1];
  if (out && f >= s.b - out.pre) {
    const u = (f - (s.b - out.pre)) / (out.pre + out.post);
    if (out.kind === "fly") { const c = mixC(camRig(id, f), camRig(id + 1, f), glide(u)); c.pos[1] += (out.lift ?? 0) * Math.sin(Math.PI * clamp01(u)); return c; }
    if (out.kind === "whip") return yawAbout(camRig(id, f), out.dir! * out.deg! * D2R * ((f - (s.b - out.pre)) / out.pre) ** 2);
    return camRig(id, f);
  }
  if (inn && f < s.a + inn.post) {
    const u = (f - (s.a - inn.pre)) / (inn.pre + inn.post);
    if (inn.kind === "fly") { const c = mixC(camRig(id - 1, f), camRig(id, f), glide(u)); c.pos[1] += (inn.lift ?? 0) * Math.sin(Math.PI * clamp01(u)); return c; }
    if (inn.kind === "whip") return yawAbout(camRig(id, f), -inn.dir! * inn.deg! * D2R * (1 - (f - s.a) / inn.post) ** 2);
    return camRig(id, f);
  }
  return camRig(id, f);
};
/** the foreground wiper of a wipe transition at frame f of shot id: x = its centre in half-frame widths. It is 4
 *  half-widths wide and never stops: it enters, covers the frame for ~4 frames around the switch and leaves on the other
 *  side, its planks / seams streaming past the lens the whole time (mild ease at both ends) */
export const WIPE_W = 4, WIPE_X0 = 3.3;
export const wipeAt = (id: number, f: number): { kind: Wipe; x: number } | null => {
  const s = SHOTS[id - 1], out = TRANS[id], inn = TRANS[id - 1];
  const tr = out?.kind === "wipe" && f >= s.b - out.pre - 1 ? { t: out, b: s.b } : inn?.kind === "wipe" && f < s.a + inn.post + 1 ? { t: inn, b: s.a } : null;
  if (!tr) return null;
  const u = clamp01((f - (tr.b - tr.t.pre - 1)) / (tr.t.pre + tr.t.post + 2)), v = 0.6 * u + 0.4 * smooth(u);
  return { kind: tr.t.wipe!, x: tr.t.dir! * WIPE_X0 * (1 - 2 * v) };
};

// impact kicks (flip sign every frame, decay over 7 f): the slip, the bulb, the hatch
const KICKS: [number, number][] = [[(SLIP + 4) / FPS, 1], [BULB / FPS, 0.6], [(HATCH_OPEN[0] + 1) / FPS, 0.5]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = camT(id, f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: depth of field + foreground framing ----------------
/** cInf = blur-disc radius in px at 1080x1920 for things at infinity (template: hook CU 15-16, CU 12-14, MS 10-12, wides 0) */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const EYE_H = 1.62;
const eyes = (p: V3, h = EYE_H): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, { f: 4, dur: 26, cInf: 11, focus: eyes(BEACH.local, 1.55) },
  { f: 57, cInf: 15, focus: eyes(BEACH.local, 1.55) },
  { f: 107, cInf: 10, focus: eyes(POND.workers[1]) },
  { f: 162, cInf: 11, focus: eyes(HARBOR.tudor) },
  { f: 208, cInf: 7, focus: (f) => { const c = carrierAt(0, f).p; return [c[0], c[1] + EYE_H, c[2]]; } },
  { f: 293, cInf: 0 },
  { f: 331, cInf: 13, focus: () => [NEWSBOY_P[0], 0.85, NEWSBOY_P[2] + 0.2] },
  { f: 366, cInf: 10, focus: () => at("harbor", -6.4, EYE_H, 3.2) },
  { f: 407, cInf: 9, focus: () => [ICE_PATCH[0], 1.2, ICE_PATCH[2]] },
  { f: 471, cInf: 0 },
  { f: 522, cInf: 13, focus: () => [PORT.stack[0], 0.4, PORT.stack[2]] },
  { f: 578, cInf: 14, focus: () => [PORT.wallet[0], 0.03, PORT.wallet[2]] },
  { f: 660, cInf: 0 },
  { f: 736, cInf: 9, focus: () => [PORT.stack[0], 0.1, PORT.stack[2]] },
  { f: 754, cInf: 10, focus: () => [TUDOR_CELL[0], 1.05, TUDOR_CELL[2]] },
  { f: 836, cInf: 11, focus: () => [TUDOR_CELL[0], 1.1, TUDOR_CELL[2]] },
  { f: 894, cInf: 13, focus: () => C(CELL_WIN.x, CELL_WIN.y + 0.1, CELLAR.z0 - 0.1) },
  { f: 950, cInf: 11, focus: () => [TUDOR_WIN[0], EYE_H, TUDOR_WIN[2]] },
  { f: 1023, cInf: 14, focus: () => [BOTTLE[0], BOTTLE[1] + 0.18, BOTTLE[2]] },
  { f: 1082, cInf: 13, focus: () => [BOTTLE[0], BOTTLE[1] + 0.18, BOTTLE[2]] },
  { f: 1163, cInf: 9, focus: () => [HOLD.workers[0][0], EYE_H, HOLD.workers[0][2]] },
  { f: 1220, cInf: 5, focus: () => at("mill", -1.2, 1.6, -1.0) },
  { f: 1291, cInf: 0 },
  { f: 1331, cInf: 13, focus: () => [HOLD.post[0], 1.42, HOLD.post[2] + 0.08] },
  { f: 1418, cInf: 9, focus: () => at("calcutta", 0, DECK_Y + WATER_Y + 0.1, -6.2) },
  { f: 1471, cInf: 4, focus: () => [MARKET.stall[0], 1.4, MARKET.stall[2]] },
  { f: 1510, cInf: 11, focus: () => [MARKET.stall[0], 1.5, MARKET.stall[2] + 0.9] },
  { f: 1602, cInf: 14, focus: () => [MARKET.tudor[0], EYE_H, MARKET.tudor[2]] },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => { const d = dofAt(f); return d.focus ? d.focus(f) : camAt(id, f).look; };

/** near framing objects (built outside the sight-line test), placed from each shot's own camera move so they stay
 *  close to the lens at the frame edge and slide past with the camera (parallax): barrels, crates, ice, posts, rope */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
/** a point on the floor (height y) `dist` m ahead of shot id's lens at fraction u of the shot, sx half-frame widths
 *  to the side (sx = +-0.8: near the frame edge) */
const nearLens = (id: number, u: number, dist: number, sx: number, y = 0): V3 => {
  const s = SHOTS[id - 1], c = camRig(id, s.a + u * (s.b - s.a));
  const fx = c.look[0] - c.pos[0], fz = c.look[2] - c.pos[2], n = Math.hypot(fx, fz) || 1, tx = Math.tan((c.fov * D2R) / 2) * (9 / 16) * dist * sx;
  return [c.pos[0] + (fx / n) * dist - (fz / n) * tx, y, c.pos[2] + (fz / n) * dist + (fx / n) * tx];
};
/** horizontal screen position of p in shot id at frame f (half-frame widths; NaN behind the lens) */
const screenX = (id: number, f: number, p: V3) => {
  const c = camRig(id, f), fx = c.look[0] - c.pos[0], fz = c.look[2] - c.pos[2], n = Math.hypot(fx, fz) || 1;
  const dx = p[0] - c.pos[0], dz = p[2] - c.pos[2], depth = (dx * fx + dz * fz) / n, side = (-dx * fz + dz * fx) / n;
  return depth > 0.3 ? side / (depth * Math.tan((c.fov * D2R) / 2) * (9 / 16)) : NaN;
};
/** a framing prop near the lens. A close prop sweeps across the frame as the camera orbits, so the placement is
 *  searched (anchor moment, side distance, depth): in view (|x| < 1.1) for at least a quarter of the shot, over the
 *  middle of the frame (|x| < 0.6, where the subject is) for at most 8 % of it, as much screen time as possible */
const fgOf = (id: number, kit: string, u: number, dist: number, sx: number, sc = 1, yaw = 0.4, y = 0, maxOver = 0.08): Fg | null => {
  const s = SHOTS[id - 1];
  let best: { pos: V3; score: number } | null = null;
  for (const dk of [1, 1.4, 1.9]) for (const ak of [1, 1.2, 1.45]) for (const uu of [u, 0.1, 0.3, 0.5, 0.7, 0.9]) {
    const pos = nearLens(id, uu, dist * dk, sx * ak, y);
    let seen = 0, over = 0, n = 0;
    for (let f = s.a; f < s.b; f += 2, n++) {
      const x = screenX(id, f, pos);
      if (Number.isNaN(x)) continue;
      if (Math.abs(x) < 0.6) over++;
      if (Math.abs(x) < 1.1) seen++;
    }
    const score = seen - 4 * over - 3 * (dk - 1) * n * 0.1;
    if (seen >= n / 4 && over <= n * maxOver && (!best || score > best.score)) best = { pos, score };
  }
  return best ? { a: s.a, b: s.b, kit, pos: best.pos, s: sc, yaw } : null;
};
export const FOREGROUND: Fg[] = ([
  // low crates / barrels (they cross legs, not faces) may pass the middle a little longer
  fgOf(1, "barrel", 0.8, 1.6, -1.25, 0.9, 0.4, 0, 0.12), fgOf(3, "ice", 0.7, 2.2, 1.25, 0.8), fgOf(4, "lantern", 0.6, 1.4, -1.2, 2.8),
  fgOf(5, "barrel", 0.5, 1.8, 1.2, 0.8, 0.4, DECK_Y + WATER_Y, 0.12), fgOf(8, "crate", 0.6, 2.0, 1.15, 0.9, 0.4, 0, 0.12),
  fgOf(9, "fencepost", 0.7, 1.4, -1.1, 1.1), fgOf(10, "palm", 0.6, 5.5, -0.95, 7), fgOf(12, "rope", 0.6, 0.55, -0.85, 0.45),
  fgOf(15, "crate", 0.5, 1.9, -1.15, 0.8), fgOf(22, "barrel", 0.6, 1.9, -1.2, 0.8), fgOf(23, "cart", 0.6, 4.0, 1.3, 1.5, 2.2),
  fgOf(26, "rope", 0.6, 2.0, -0.7, 1, 0, DECK_Y + WATER_Y), fgOf(27, "barrel", 0.6, 3.0, 0.9, 1, 0.4, 0, 0.12),
  fgOf(28, "crate", 0.6, 1.9, -1.25, 0.8, 0.4, 0, 0.12), fgOf(29, "barrel", 0.6, 1.5, 1.15),
]).filter((g): g is Fg => g !== null);

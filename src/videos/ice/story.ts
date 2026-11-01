// Timeline of "The Man Who Sold Ice to the Tropics" (~55 s): 29 shots timed to the narration words
// (ice-short/voice/words.json), the places they happen in, the story actions (sawing, loading, the brig leaving, the
// laugh, the slip, the melt, the coin, the yawn, the bulb, the icicle, the towel, the sawdust, the calendar, the hatch,
// the market) and the camera grammar of the bridge template: smootherstep glides 18-40 f, every hold creeps (no static
// hold), impacts are 7-frame kicks that flip sign every frame, no hand-held float, hard cuts between places.
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
export const HARBOR = { tudor: at("harbor", -1.1, 0, 3.0) as V3, stack: at("harbor", -2.7, 0, 2.2) as V3 };
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
export const HOLD = { workers: [at("hold", -0.5, 0, 2.3), at("hold", 0.55, 0, 3.2)] as V3[], post: at("hold", -1.0, 0, 3.0) as V3 };
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
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
/** push-in factor since f0: the subject grows ~rate per frame */
const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** a held framing that creeps in from the shot start (0.15-0.35 %/f; 0.6 on punch words) */
const hold = (pl: PlaceId, pos: [number, number, number], look: [number, number, number], f0: number, rate = 0.0025, rest: Partial<Cam> = {}) =>
  (f: number) => dolly(at(pl, ...pos), at(pl, ...look), pushK(f, f0, rate), rest);
const brigFollow = (id: number, rel: V3, lookUp = 4, rest: Partial<Cam> = {}) => (f: number): Shot => {
  const b = brigAt(id, f), c = Math.cos(b.yaw), s = Math.sin(b.yaw);
  return { pos: [b.pos[0] + rel[0], b.pos[1] + rel[1], b.pos[2] + rel[2]], look: [b.pos[0] + 1.5 * c, b.pos[1] + lookUp, b.pos[2] - 1.5 * s], ...rest };
};

const CAMS: Record<number, Key[]> = {
  // 1 beach: fast glide in from a wide over the sand to the two-shot (template glide, 30 f) then creep
  1: [{ f: 0, s: hold("beach", [0.4, 3.4, 13.5], [0, 1.1, -3], 0, 0.001, { fov: 42 }) }, { f: 2, dur: 30, s: hold("beach", [-0.05, 1.3, 6.0], [0, 1.0, 0], 32, 0.0015, { fov: 38, roll: 0.02 }) }],
  // 2 close-up on the local, Tudor's shoulder and the ice in the right of the frame
  2: [{ f: 57, s: hold("beach", [0.95, 1.5, 1.75], [-0.5, 1.5, 0.12], 57, 0.004, { fov: 30, roll: -0.04 }) }],
  // 3 pond: eye-level medium-wide on the cutters, slow lateral glide
  3: [{ f: 107, s: hold("pond", [2.2, 1.75, 4.0], [0.2, 1.0, -4.2], 107, 0.0015, { fov: 38 }) }, { f: 112, dur: 40, s: hold("pond", [0.6, 1.6, 3.3], [0.1, 1.0, -4.2], 140, 0.002, { fov: 38, roll: 0.03 }) }],
  // 4 harbor: Tudor, proud, the ice stack and the brig behind him
  4: [{ f: 162, s: hold("harbor", [0.7, 1.45, 6.9], [-1.0, 1.35, 2.8], 162, 0.0032, { fov: 35, roll: -0.03 }) }],
  // 5 harbor: on deck looking back at the plank, the cutters carry blocks aboard
  5: [{ f: 208, s: hold("harbor", [4.6, 2.1, -4.2], [2.3, 0.9, 1.6], 208, 0.0012, { fov: 40, roll: 0.02 }) }],
  // 6 aerial: the brig leaves the snowy harbour
  6: [{ f: 293, s: (f) => { const b = brigAt(6, f); return dolly([b.pos[0] + 22, 34, b.pos[2] + 34], [b.pos[0] - 2, 0, b.pos[2] - 6], pushK(f, 293, 0.002), { fov: 40 }); } }],
  // 7 street: the newspaper close-up, the newsboy's face over it
  7: [{ f: 331, s: hold("street", [-2.9, 0.9, 6.35], [-3.12, 0.9, 4.1], 331, 0.0018, { fov: 36, roll: 0.03 }) }],
  // 8 harbor quay: the crowd laughs and points at the brig out on the water
  8: [{ f: 366, s: hold("harbor", [-3.6, 1.6, 12.4], [-6.5, 1.15, 3.1], 366, 0.0015, { fov: 40, roll: -0.02 }) }],
  // 9 street: the slip on the ice patch
  9: [{ f: 407, s: hold("street", [-1.6, 1.6, 12.5], [-2.9, 0.8, 5.0], 407, 0.0012, { fov: 40 }) }],
  // 10 Caribbean port wide: the brig in, the sun on the stack
  10: [{ f: 471, s: hold("port", [8.0, 4.6, 14.5], [-0.6, 0.9, 0.4], 471, 0.002, { fov: 40 }) }],
  // 11 close on the melting stack, Tudor sweating behind it
  11: [{ f: 522, s: hold("port", [0.9, 0.95, 6.4], [-1.7, 0.75, 1.5], 522, 0.002, { fov: 36, roll: 0.03 }) }],
  // 12 the empty wallet; the coin rolls away
  12: [{ f: 578, s: hold("port", [1.95, 0.55, 4.5], [2.42, 0.04, 3.2], 578, 0.002, { fov: 34 }) },
    { f: 630, dur: 30, s: hold("port", [2.2, 0.4, 4.4], [3.1, 0.05, 3.25], 630, 0.002, { fov: 34 }) }],
  // 13-14 two quick departures from Boston: red sails, then green sails from the other side
  13: [{ f: 660, s: brigFollow(13, [14, 7.5, 38], 10.2, { fov: 40, roll: 0.02 }) }],
  14: [{ f: 709, s: brigFollow(14, [6, 7.5, 38], 10.2, { fov: 40, roll: -0.02 }) }],
  // 15 port: the puddles are bigger now
  15: [{ f: 736, s: hold("port", [1.6, 2.6, 6.8], [-1.4, 0.2, 2.0], 736, 0.006, { fov: 38 }) }],
  // 16 cell: from the corridor (the guard yawning in the foreground) toward Tudor on the bench, through the bars
  16: [{ f: 754, s: hold("cell", [2.15, 1.0, 5.45], [-0.45, 0.85, -2.8], 754, 0.0008, { fov: 40 }) }],
  // 17 inside: Tudor's light-bulb moment
  17: [{ f: 836, s: hold("cell", [0.45, 1.3, -0.45], [-0.45, 1.42, -2.95], 836, 0.0015, { fov: 38 }) }, { f: 857, dur: 18, s: hold("cell", [0.38, 1.3, -0.6], [-0.45, 1.45, -2.95], 875, 0.0015, { fov: 38, roll: -0.03 }) }],
  // 18 the icicle in the window, dripping
  18: [{ f: 894, s: hold("cell", [0.8, 1.72, -2.25], [0.95, 1.98, -3.55], 894, 0.003, { fov: 32, roll: 0.03 }) }],
  // 19 Tudor at the window, warm air drifting in
  19: [{ f: 950, s: hold("cell", [-0.75, 1.45, 0.35], [0.35, 1.45, -3.05], 950, 0.0015, { fov: 38, roll: -0.02 }) }],
  // 20-21 the bottle on the bench gets wrapped in the towel; warm air bounces off
  20: [{ f: 1023, s: hold("cell", [-1.5, 0.92, -2.1], [-1.75, 0.66, -3.0], 1023, 0.003, { fov: 30 }) }],
  21: [{ f: 1082, s: hold("cell", [-1.3, 0.95, -1.75], [-1.75, 0.66, -3.0], 1082, 0.0025, { fov: 34, roll: 0.03 }) }],
  // 22 the hold: sawdust shovelled over the ice
  22: [{ f: 1163, s: hold("hold", [0.3, 1.8, 6.8], [0.0, 0.8, 0.5], 1163, 0.0012, { fov: 40 }) }],
  // 23 the lumber mill yard and its sawdust mountains
  23: [{ f: 1220, s: hold("mill", [6.0, 2.3, 10.0], [-1.5, 1.6, -2.5], 1220, 0.0015, { fov: 40 }) }, { f: 1224, dur: 40, s: hold("mill", [4.2, 2.0, 8.2], [-1.8, 1.5, -2.5], 1264, 0.002, { fov: 40, roll: 0.02 }) }],
  // 24 the brig alone on a hot ocean, aerial
  24: [{ f: 1291, s: brigFollow(24, [-26, 18, 41], 6, { fov: 40 }) }],
  // 25 the calendar on the hold's post flips four months
  25: [{ f: 1331, s: (f) => { const s = hold("hold", [-0.82, 1.45, 4.85], [-1.0, 1.42, 3.06], 1331, 0.0012, { fov: 34 })(f); return { ...s, roll: 0.02 * Math.sin(f * 0.06) }; } }],
  // 26 Calcutta: on deck above the hatch as its cover comes off
  26: [{ f: 1418, s: hold("calcutta", [1.6, DECK_Y + WATER_Y + 2.4, -3.3], [0.0, DECK_Y + WATER_Y + 0.1, -6.2], 1418, 0.004, { fov: 40, roll: -0.03 }) }],
  // 27 the market, wide
  27: [{ f: 1471, s: hold("calcutta", [77, 3.8, 31], [71.5, 1.3, 11.5], 1471, 0.0025, { fov: 40 }) }],
  // 28 the stall: ice and cold drinks change hands
  28: [{ f: 1510, s: hold("calcutta", [69.6, 1.55, 18.6], [70.0, 1.25, 12.4], 1510, 0.0012, { fov: 40, roll: 0.02 }) }],
  // 29 Tudor's smile
  29: [{ f: 1602, s: hold("calcutta", [72.75, 1.62, 17.7], [73.3, 1.6, 15.0], 1602, 0.003, { fov: 32, roll: -0.03 }) }],
};

// impact kicks (flip sign every frame, decay over 7 f): the slip, the coin drop, the bulb, the hatch
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
  const c = run(CAMS[id], f), a = kickAt(T(f));
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

/** near framing objects (built outside the sight-line test): fence post in the slip shot, a crate in the crowd shot,
 *  a palm in the port wide, a barrel in the market wide */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 366, b: 407, kit: "crate", pos: at("harbor", -2.45, 0, 7.6), s: 0.8, yaw: 0.4 },
  { a: 1471, b: 1510, kit: "barrel", pos: at("calcutta", 74.6, 0, 27.4), s: 0.95, yaw: 0.2 },
];

// Timeline of "The Man Who Won the Lottery 14 Times" (53.94 s): 25 shots timed to the narration (shots.md).
// Camera rules (research/ricks/STYLE_REFERENCE.md, section 8): every shot glides over its first ~36 %, then holds and
// creeps in at 0.08-0.15 %/frame with no float; place / time changes are 8-16 f crossfades or a push-in to a prop insert
// that crossfades into the next place and pulls back; moves inside one place carry on from the last framing; two whips;
// no hard cuts, no kicks, no hand-held drift.
import { holdPoint, STEFAN } from "./toon";

export const FPS = 30;
export const VOICE_S = 53.941479; // mandel-short/voice/voice.wav
export const TOTAL = Math.round(VOICE_S * FPS); // 1618 frames
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** reference camera ease: symmetric smootherstep */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- words (mandel-short/voice/words.json onsets, seconds) ----------------
export const W = {
  never: 2.24, you: 3.89, and1: 5.64, broke: 6.56, when: 7.9, weird: 8.98, if: 9.88, prize: 13.82, everyone: 14.6, crazy: 15.36,
  youd: 15.94, millions: 16.24, so: 17.58, chip: 18.08, fill: 18.8, hand: 19.62, and2: 20.26, win: 20.62, he: 21.34, again: 22.72,
  and3: 23.36, again2: 23.52, twelve: 24.28, then: 25.4, y1992: 25.92, target: 27.66, the: 28.06, hits: 29.24, twentyseven: 29.46,
  and4: 30.92, seven: 31.56, tickets: 33.28, one: 33.72, he2: 34.62, prints: 34.78, ships: 36.2, and5: 37.88, couriers: 39.06,
  gas: 39.6, they: 41.32, three: 41.64, they2: 42.7, run: 42.82, all: 44.02, doesnt: 44.64, the2: 45.28, winning: 45.5, pile: 46.78,
  so2: 47.4, changed: 48.64, rules: 49.2, so3: 49.62, ever: 50.34, again3: 50.92, and6: 51.54, he3: 52.3, retired: 52.4, island: 53.3,
};
/** every visual reaction lands 0-2 frames before its word */
export const LEAD_F = 2;
export const cue = (s: number) => Math.round(s * FPS) - LEAD_F;

// ---------------- places: each built around its own x offset (far beyond the others' fog) ----------------
export type PlaceId = "hall" | "flat" | "wall" | "kiosk" | "station" | "warehouse" | "office" | "island";
export const OFF: Record<PlaceId, number> = { hall: 0, flat: 3000, wall: 6000, kiosk: 9000, station: 12000, warehouse: 15000, office: 18000, island: 21000 };
export const at = (pl: PlaceId, x: number, y: number, z: number): V3 => [OFF[pl] + x, y, z];

// ---------------- the cast's layout ----------------
export const SU = 0.00216; // metres per design unit of the character canvas (600 x 1000, soles at 975)
export const STEFAN_SEED = ((7 * 5 + 3) % 7) + 1; // cast.ts seedOf(7): Stefan's head shape in every shot
export const SEAT = 0.44; // chair seat height: a sitting card stands on it
/** lottery hall (hook) */
export const HALL = {
  stefan: at("hall", 0, 0, 0), neighbour: at("hall", 0.68, 0, -0.32),
  rows: [-1.9, -2.65, -3.4, -4.15, -4.9, -5.65, -6.4] as const, riserH: 0.3, backZ: -8.4,
};
const gripOf = (p: V3, fwd: number): V3 => {
  const [hx, hy] = holdPoint(STEFAN, { mode: "stand", prop: "hold", seed: STEFAN_SEED });
  return [p[0] + (hx - 300) * SU, p[1] + (975 - hy) * SU, p[2] + fwd];
};
/** the page of maths in Stefan's hands, tilted back toward his eyes and the lens */
export const PAGE = { pos: gripOf(HALL.stefan, 0.17), tilt: -0.62, w: 0.22, h: 0.29 };
export const FAINT = [cue(W.never) - 4, cue(W.never) + 14] as const;
export const faintAt = (f: number) => { const u = clamp01((f - FAINT[0]) / (FAINT[1] - FAINT[0])); return u * u * (1.6 - 0.6 * u); };
/** the Bucharest flat */
export const DESK = { pos: at("flat", 0, 0, 0), h: 0.76, w: 1.2, d: 0.66 };
export const FLAT_STEFAN: V3 = at("flat", 0, 0, -0.62);
export const PAGE_DESK: V3 = at("flat", 0.02, DESK.h + 0.004, 0.06);
export const FLAT = {
  standing: at("flat", -1.05, 0, -0.55),     // shot 4: pockets out by the desk
  landlady: at("flat", 0.02, 0, 0.58),       // shot 4: her head in the foreground (OTS), at the right edge of the lens
  paper: at("flat", 0.0, DESK.h + 0.17, -0.3), // shot 5: the newspaper propped up in front of him
  friends: [at("flat", -0.66, 0, 0.18), at("flat", 0.66, 0, 0.12), at("flat", 0.36, 0, -1.0)] as V3[], // shot 7
  seated: [at("flat", -0.78, SEAT, 0.0), at("flat", 0.78, SEAT, -0.02)] as V3[], // shots 9-10 (at the desk ends)
  fgFriend: at("flat", 0.32, SEAT, 1.05),    // shot 9: the foreground head (OTS)
  jar: at("flat", 0.28, DESK.h, 0.05),
  plaque: at("flat", -0.95, 2.0, -2.585),
};
/** the explanation room: the combination wall, the scale, the ticket mountain, the giant prize bag, the map */
export const ROOM = {
  wallZ: -6, wallX: [-6, 6] as const, wallY: [0.4, 9.0] as const, cols: 48, rows: 34,
  stefan: at("wall", -0.4, 0, -1.6), scale: at("wall", -3.4, 0, -2.6), mountain: at("wall", 3.3, 0, -2.4),
  bag: at("wall", -12, 0, -5), map: at("wall", 10.5, 0, -2.8), mapW: 5.2, mapH: 3.0,
  desk: at("wall", 8.6, 0, -1.2), mapStefan: at("wall", 9.9, 0, -1.55), courier: at("wall", 1.6, 0, 2.2),
};
/** the Melbourne kiosk (day) */
export const KIOSK = { pos: at("kiosk", 0, 0, 0), stefan: at("kiosk", -1.25, 0, 1.25), clerk: at("kiosk", 0.15, 0.05, -0.35),
  plaque: at("kiosk", 0.78, 1.72, 0.815), suitcase: at("kiosk", -0.55, 0, 1.45), cheques: at("kiosk", 1.45, 0, 1.0) };
/** the Virginia gas station and store (night) */
export const STATION = { board: at("station", -2.1, 1.75, -4.05), guard: at("station", -2.75, 0, -5.0), counter: at("station", 2.0, 1.1, -6.4),
  clerk: at("station", 1.95, 0, -7.0), clock: at("station", 1.4, 2.35, -7.94), days: at("station", 2.6, 2.1, -7.94), customer: at("station", 2.05, 0, -5.86),
  ticket: at("station", 2.2, 1.145, -6.45) };
/** the Melbourne warehouse */
export const WARE = { operator: at("warehouse", -0.55, 0, -2.5), fgOperator: at("warehouse", 0.35, 0, -0.6), pile: at("warehouse", 0, 0, 1.2),
  stefan: at("warehouse", 2.7, 0, 2.9), gold: at("warehouse", 0.25, 1.27, 1.35) };
/** the lottery office */
export const OFFICE = { desk: at("office", 0, 0, -1.2), officials: [at("office", -0.85, 0, -2.0), at("office", 0.2, 0, -2.15), at("office", 1.1, 0, -1.95)] as V3[],
  binder: at("office", -0.35, 0.78, -0.95), notice: at("office", 0.35, 0.782, -0.9) };
/** the tropical island */
export const ISLAND = { hammock: at("island", 0, 0, 0), palms: [at("island", -1.6, 0, -0.2), at("island", 1.6, 0, -0.1)] as V3[], plaque: at("island", 1.6, 1.55, 0.12) };

// ---------------- story clocks ----------------
/** wall cells lit 0..1 by shot and frame (the friends' crazy count, the 1992 buy, the run that stops short) */
export const fillAt = (id: number, f: number) => id === 6 ? 0.08 : id === 8 ? 0.15 : id === 15 ? 0.1 + 0.25 * smooth((f - 925) / 60)
  : id === 18 ? 0.35 : id === 21 ? 0.4 + 0.42 * smooth((f - 1280) / 36) : 0;
/** the scale's beam tilt (rad, + = the cost side down): it tips to the prize on "prize" */
export const beamAt = (f: number) => 0.28 - 0.6 * smooth((f - (cue(W.prize) - 6)) / 10);
/** WINS plaque count: 1 after the first win, ticking 2 -> 13 at the kiosk, 14 on the island */
export const winsAt = (id: number, f: number) => id <= 10 ? 1 : id <= 12 ? Math.min(13, 1 + Math.max(1, Math.floor((f - 700) / 4.5))) : 14;
/** the Virginia jackpot rolling up on "twenty-seven million" */
export const jackpotAt = (f: number) => 1000000 + 26036142 * smooth((f - (cue(W.hits) - 4)) / 26);
/** map route progress (Melbourne -> Virginia) */
export const routeAt = (f: number) => smooth((f - 1088) / 44);
export const WIN_F = cue(W.win), STAMP_F = cue(W.ever), PARROT_F = cue(W.retired) + 12;

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night" | "interior";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: PlaceId; sunAz?: number; sunEl?: number };
const B = [0, 106, 130, 168, 235, 294, 418, 475, 525, 606, 636, 699, 760, 840, 925, 996, 1037, 1085, 1136, 1239, 1280, 1338, 1420, 1487, 1545, TOTAL];
const PL: [PlaceId, Light, number?, number?][] = [
  ["hall", "golden", -140, 34], ["hall", "golden", -140, 34],                   // 1-2 hook, page insert
  ["flat", "night", 25, 20], ["flat", "night", 25, 20], ["flat", "night", 25, 20], // 3-5 Bucharest 1962
  ["wall", "night", -150, 50],                                                   // 6 the explanation wall + scale
  ["flat", "night", 25, 20],                                                     // 7 "everyone says it's crazy"
  ["wall", "night", -150, 50],                                                   // 8 the ticket mountain
  ["flat", "interior", -120, 55], ["flat", "interior", -120, 55],               // 9-10 the friends fill tickets, the win
  ["kiosk", "day", -120, 50], ["kiosk", "day", -120, 50],                       // 11-12 Melbourne, twelve times
  ["wall", "night", -150, 50],                                                   // 13 1992, the map
  ["station", "night", -40, 25],                                                 // 14 the Virginia jackpot board
  ["wall", "night", -150, 50],                                                   // 15 seven million combinations
  ["station", "night", -40, 25],                                                 // 16 the $1 ticket (insert)
  ["warehouse", "interior", -130, 60],                                           // 17 the presses
  ["wall", "night", -150, 50],                                                   // 18 the route on the map
  ["station", "night", -40, 25], ["station", "night", -40, 25],                 // 19-20 couriers, three days
  ["wall", "night", -150, 50],                                                   // 21 out of time
  ["warehouse", "interior", -130, 60],                                           // 22 the winning ticket in the pile
  ["office", "interior", -140, 45], ["office", "interior", -140, 45],           // 23-24 the rules change
  ["island", "day", -130, 55],                                                   // 25 the island
];
export const SHOTS: ShotDef[] = PL.map(([place, light, sunAz, sunEl], i) => ({ id: i + 1, a: B[i], b: B[i + 1], light, place, sunAz, sunEl }));
/** crossfades (frames, centred on the shot's first frame) */
export const XFADE: Record<number, number> = { 3: 12, 4: 8, 6: 10, 7: 10, 8: 8, 9: 10, 11: 12, 13: 12, 15: 10, 16: 10, 17: 10, 18: 12, 19: 12, 21: 8, 22: 10, 23: 10, 25: 12 };
export const FLASH_AT: number | null = null;

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
type Sph = { d: number; az: number; el: number; fov: number; roll: number };
const D2R = Math.PI / 180;
const S = (d: number, az: number, el: number, fov = 46, roll = 0): Sph => ({ d, az, el, fov, roll });
const mixS = (a: Sph, b: Sph, k: number): Sph => ({ d: a.d + (b.d - a.d) * k, az: a.az + (b.az - a.az) * k, el: a.el + (b.el - a.el) * k, fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
const sph = (look: V3, s: Sph): Cam => {
  const el = s.el * D2R, az = s.az * D2R;
  return { pos: [look[0] + s.d * Math.cos(el) * Math.sin(az), look[1] + s.d * Math.sin(el), look[2] + s.d * Math.cos(el) * Math.cos(az)], look, fov: s.fov, roll: s.roll * D2R };
};
const mixC = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
/** move-then-hold: glide A -> B over the first `g` of the shot (or from the previous shot's last framing when `cont`),
 *  then creep in at `creep` per frame; `push` = a push-in toward a prop that fills the frame before the crossfade out */
type Rig = { lookA: V3; lookB: V3; A: Sph; B: Sph; g?: number; creep?: number; cont?: boolean; push?: { n: number; cam: () => Cam } };
const R = (look: V3, A: Sph, B: Sph, o: Partial<Rig> = {}): Rig => ({ lookA: look, lookB: look, A, B, ...o });
const PAGE_N: V3 = [0, Math.sin(-PAGE.tilt), Math.cos(-PAGE.tilt)];
const pageCam = (): Cam => ({ pos: add3(PAGE.pos, [PAGE_N[0] * 0.5, PAGE_N[1] * 0.5, PAGE_N[2] * 0.5]), look: PAGE.pos, fov: 50, roll: 0 });
/** a straight-on insert framing of a point from a direction (az, el) at distance d */
const ins = (p: V3, d: number, az = 0, el = 0, fov = 46) => () => sph(p, S(d, az, el, fov));
const RIGS: Record<number, Rig> = {
  // 1 LOW angle in the hall: glide up and in, Stefan on the left third, then hold + creep
  1: { lookA: at("hall", 0.3, 1.02, 0), lookB: at("hall", 0.42, 1.24, -0.1), A: S(5.6, -16, -6.5, 52, 1.2), B: S(3.6, -7, -12, 52, -0.8), g: 0.36, creep: 0.003 },
  // 3 the page on the desk, pulling back and up to Stefan
  3: { lookA: PAGE_DESK, lookB: at("flat", -0.02, 1.02, -0.3), A: S(0.5, 0, 84, 50), B: S(2.25, -24, 34, 50), g: 0.4, creep: 0.003 },
  // 4 OTS past the landlady's head: Stefan stands by the desk, pockets out
  4: R(at("flat", -0.95, 1.2, -0.5), S(2.25, -24, 34, 50), S(2.9, 28, 6, 48), { cont: true }),
  // 5 WIDE-CU on Stefan at the desk behind the newspaper; then a push into the headline
  5: R(at("flat", 0.0, 1.25, -0.5), S(2.9, 28, 6, 48), S(1.05, -14, 4, 58), { cont: true, g: 0.3, push: { n: 16, cam: ins(FLAT.paper, 0.55, -6, 4, 46) } }),
  // 6 the explanation room: crane up from Stefan to the whole combination wall, the scale in the lower left
  6: { lookA: at("wall", -0.4, 1.3, -1.6), lookB: at("wall", -1.0, 3.9, -5), A: S(2.9, -12, 4, 50), B: S(11.5, -6, 4, 50), g: 0.36, creep: 0.0026 },
  // 7 the friends round the desk ("crazy"): an eased orbit, then hold
  7: R(at("flat", 0, 1.2, -0.3), S(3.4, -40, 16, 54), S(3.0, -12, 12, 54)),
  // 8 TOP-down over the ticket mountain, the wall glowing behind; then a push into the pile
  8: R(at("wall", 3.3, 1.1, -2.4), S(5.2, -8, 62, 50), S(4.0, -4, 70, 50), { g: 0.4, push: { n: 12, cam: ins(at("wall", 3.3, 1.35, -2.4), 0.8, 0, 80, 46) } }),
  // 9 OTS from behind a friend's head across the desk, low; then hold
  9: R(at("flat", 0, 1.0, -0.25), S(2.7, 6, 8, 54), S(2.3, 2, 4, 54)),
  // 10 the win: an eased move up to the faces (the WINS: 1 plaque goes up behind), hold
  10: R(at("flat", 0, 1.25, -0.4), S(2.3, 2, 4, 54), S(2.8, 10, 8, 54), { cont: true }),
  // 11 Melbourne: the suitcase lands (crane down with it), hold on Stefan at the kiosk
  11: { lookA: at("kiosk", -0.55, 2.4, 1.45), lookB: at("kiosk", -0.2, 1.3, 0.8), A: S(4.2, -20, 10, 48), B: S(4.6, -18, 4, 48), g: 0.36, creep: 0.0026 },
  // 12 insert on the WINS plaque ticking, then pull back to the green clerk
  12: { lookA: KIOSK.plaque, lookB: at("kiosk", 0.4, 1.4, 0.2), A: S(0.6, 0, 0, 46), B: S(2.8, -12, -6, 48), g: 0.5, creep: 0.0026 },
  // 13 WIDE-CU: Stefan in front of the glowing map, 1992 on the desk
  13: R(at("wall", 9.9, 1.45, -1.55), S(1.25, 18, 2, 60), S(1.0, 10, 0, 60)),
  // 14 LOW at the window board, the jackpot rolls up
  14: R(STATION.board, S(4.4, 22, -16, 46), S(3.4, 12, -20, 46)),
  // 15 crane back: the wall next to the giant prize bag
  15: { lookA: at("wall", -2, 4.0, -5), lookB: at("wall", -4.5, 5.0, -5), A: S(11, -4, 4, 50), B: S(21, -6, 6, 50), g: 0.36, creep: 0.0026 },
  // 16 TOP-down insert on the $1 ticket on the counter, pulling back a little
  16: R(STATION.ticket, S(0.34, 0, 82, 46), S(0.62, 10, 72, 46), { g: 0.5 }),
  // 17 OTS past an operator's head at the presses
  17: R(at("warehouse", -0.5, 1.4, -2.8), S(3.4, 14, 8, 50), S(2.7, 8, 6, 50)),
  // 18 the map: the route draws from Melbourne to Virginia; push to Virginia at the end
  18: R(at("wall", 10.5, 2.3, -2.8), S(5.2, -4, 2, 48), S(4.6, 0, 2, 48), { push: { n: 14, cam: ins(at("wall", 10.5 - 1.3, 2.75, -2.8), 1.2, 0, 0, 46) } }),
  // 19 LOW wide over the forecourt: the courier army runs between the pumps and the store
  19: R(at("station", 0, 1.6, -3), S(10.5, 10, 2, 52), S(8.6, 4, -2, 52)),
  // 20 OTS from a customer's head: the clerk, the clock, the days calendar
  20: R(at("station", 1.95, 1.75, -7.2), S(2.6, -10, 2, 50), S(2.2, -6, 0, 50)),
  // 21 the wall stops short; a courier collapses in front
  21: R(at("wall", 0.6, 2.8, -3), S(12.5, 8, 4, 50), S(11, 4, 2, 50)),
  // 22 TOP-down on the pile, the golden ticket; Stefan sips tea beside it; push to the ticket
  22: R(at("warehouse", 1.8, 0.8, 2.2), S(5.6, 22, 50, 52), S(4.8, 16, 55, 52), { push: { n: 12, cam: ins(WARE.gold, 0.6, 0, 80, 46) } }),
  // 23 LOW past the binder slammed shut, the officials behind
  23: R(at("office", 0.1, 1.4, -1.9), S(3.4, -14, -10, 56), S(3.0, -8, -12, 56)),
  // 24 WIDE-CU on the stamp hitting the notice
  24: R(OFFICE.notice, S(1.4, 10, 40, 56), S(0.95, 4, 48, 56), { cont: true, g: 0.3 }),
  // 25 crane down from the palms to Stefan in the hammock
  25: { lookA: at("island", 0, 4.8, -0.2), lookB: at("island", 0.1, 1.0, 0), A: S(7.5, -10, 6, 50), B: S(4.8, -6, 8, 54), g: 0.36, creep: 0.0026 },
};
const creepIn = (c: Cam, k: number): Cam => ({ ...c, pos: lerp3(c.look, c.pos, Math.max(0.5, 1 - k)) });
const rigCam = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], r = RIGS[id], n = s.b - s.a, g = r.g ?? 0.36, k = glide((f - s.a) / (g * n));
  const end = sph(r.lookB, r.B);
  let c = r.cont ? mixC(camRig(id - 1, s.a - 1), end, k) : sph(lerp3(r.lookA, r.lookB, k), mixS(r.A, r.B, k));
  c = creepIn(c, (r.creep ?? 0.003) * Math.max(0, f - (s.a + g * n)));
  if (r.push) { // push-in to the prop, done by the start of the outgoing crossfade
    const xf = XFADE[id + 1] ?? 0, t0 = s.b - xf / 2 - r.push.n;
    c = mixC(c, r.push.cam(), glide((f - t0) / r.push.n));
  }
  return c;
};
/** the shot's own camera move (no whips): what the sight lines and the key light are built for */
export const camRig = (id: number, f: number): Cam => {
  if (id === 2) { // the push-in to the page in his hands
    const s = SHOTS[1], a = rigCam(1, s.a), k = glide((f - s.a) / 18);
    return creepIn(mixC(a, pageCam(), k), 0.003 * Math.max(0, f - s.a - 18));
  }
  return rigCam(id, f);
};

// ---------------- whips (2 in the video): a fast yaw out of one shot and into the next, ease-in / ease-out ----------------
const WHIPS: Record<number, { pre: number; post: number; dir: 1 | -1; deg: number }> = { 13: { pre: 4, post: 5, dir: 1, deg: 50 }, 19: { pre: 4, post: 5, dir: -1, deg: 45 } };
const eIn = (u: number) => 2 * glide(u / 2), eOut = (u: number) => 2 * glide(0.5 + u / 2) - 1;
const yawAbout = (c: Cam, ang: number): Cam => {
  const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], cs = Math.cos(ang), sn = Math.sin(ang);
  return { ...c, look: [c.pos[0] + dx * cs + dz * sn, c.look[1], c.pos[2] - dx * sn + dz * cs], roll: c.roll + 0.1 * ang };
};
export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], c = camRig(id, f), out = WHIPS[id], inn = WHIPS[id - 1];
  if (out && f >= s.b - out.pre) return yawAbout(c, out.dir * out.deg * D2R * eIn((f - (s.b - out.pre) + 1) / out.pre));
  if (inn && f < s.a + inn.post) return yawAbout(c, -inn.dir * inn.deg * D2R * (1 - eOut((f - s.a) / inn.post)));
  return c;
};

// ---------------- lens: depth of field (focus = the camera's look target unless set) ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const EYE_H = 1.5;
const eyes = (p: V3, h = EYE_H): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: eyes(HALL.stefan) }, { f: 106, dur: 18, cInf: 14 }, { f: 130, cInf: 12 }, { f: 146, dur: 20, cInf: 11 },
  { f: 168, cInf: 11, focus: eyes(FLAT.standing) }, { f: 235, cInf: 13 }, { f: 294, cInf: 4 }, { f: 418, cInf: 10 }, { f: 475, cInf: 8 },
  { f: 525, cInf: 11 }, { f: 636, cInf: 7 }, { f: 699, cInf: 12 }, { f: 760, cInf: 13, focus: eyes(ROOM.mapStefan) }, { f: 840, cInf: 8 },
  { f: 925, cInf: 0 }, { f: 996, cInf: 13 }, { f: 1037, cInf: 10, focus: eyes(WARE.operator) }, { f: 1085, cInf: 6 }, { f: 1136, cInf: 4 },
  { f: 1239, cInf: 11, focus: eyes(STATION.clerk) }, { f: 1280, cInf: 4 }, { f: 1338, cInf: 9 }, { f: 1420, cInf: 10, focus: eyes(OFFICE.officials[1]) },
  { f: 1487, cInf: 13 }, { f: 1545, cInf: 6 },
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

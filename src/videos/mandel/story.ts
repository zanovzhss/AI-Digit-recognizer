// Timeline of "The Man Who Won the Lottery 14 Times" (53.94 s). Shot plan: shots.md (whole video); this file holds
// what is built so far (shots 1-3, 0-5 s) plus a placeholder hold for the rest.
// Camera rules (research/ricks/STYLE_REFERENCE.md, section 8): every shot glides over its first ~36 %, then holds and
// creeps in at 0.08-0.12 %/frame with no float; place changes are 8-16 f crossfades or a push-in to a prop insert that
// crossfades into the next place and pulls back; no kicks, no hand-held drift.
import { holdPoint, STEFAN } from "./toon";

export const FPS = 30;
export const VOICE_S = 53.941479; // mandel-short/voice/voice.wav
export const TOTAL = Math.round(VOICE_S * FPS); // 1618 frames
export const D0 = 0; // ground level (m)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** reference camera ease: symmetric smootherstep */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- words (mandel-short/voice/words.json onsets, seconds) ----------------
export const W = { won: 0.18, fourteen: 0.74, and0: 2.0, never: 2.24, lucky: 3.08, you: 3.89, see: 3.96, its: 4.4, sixties: 4.64, and1: 5.64 };
/** every visual reaction lands 0-2 frames before its word */
export const LEAD_F = 2;
export const cue = (s: number) => Math.round(s * FPS) - LEAD_F;

// ---------------- places: each built around its own x offset (far beyond the others' fog) ----------------
export type PlaceId = "hall" | "flat";
export const OFF: Record<PlaceId, number> = { hall: 0, flat: 3000 };
export const at = (pl: PlaceId, x: number, y: number, z: number): V3 => [OFF[pl] + x, y, z];

// ---------------- the cast's layout ----------------
export const SU = 0.00216; // metres per design unit of the character canvas (600 x 1000, soles at 975)
export const STEFAN_SEED = ((7 * 5 + 3) % 7) + 1; // cast.ts seedOf(7): Stefan's head shape in every shot
/** lottery hall (hook): Stefan on the floor in front of tiered risers packed with the crowd, the jackpot board behind */
export const HALL = {
  stefan: at("hall", 0, 0, 0),
  neighbour: at("hall", 0.68, 0, -0.32),
  rows: [-1.9, -2.65, -3.4, -4.15, -4.9, -5.65, -6.4] as const, // crowd rows (z); row i stands on riser i (i * riserH up)
  riserH: 0.3, backZ: -8.4, w: 22, h: 8.5,
};
/** the hold grip of Stefan's front card in world space (card facing +z), pushed `fwd` toward the lens */
const gripOf = (p: V3, fwd: number): V3 => {
  const [hx, hy] = holdPoint(STEFAN, { mode: "stand", prop: "hold", seed: STEFAN_SEED });
  return [p[0] + (hx - 300) * SU, p[1] + (975 - hy) * SU, p[2] + fwd];
};
/** the page of maths in Stefan's hands: centre, tilted back so it faces up toward his eyes and out to the lens */
export const PAGE = { pos: gripOf(HALL.stefan, 0.17), tilt: -0.62, w: 0.22, h: 0.29 };
/** the faint (gag): the neighbour topples over backwards-right into the confetti on "never" */
export const FAINT = [cue(W.never) - 4, cue(W.never) + 14] as const;
export const faintAt = (f: number) => { const u = clamp01((f - FAINT[0]) / (FAINT[1] - FAINT[0])); return u * u * (1.6 - 0.6 * u); };
/** the Bucharest flat: desk by the frosted window, Stefan sitting at it */
export const DESK = { pos: at("flat", 0, 0, 0), h: 0.76, w: 1.2, d: 0.66 };
export const FLAT_STEFAN: V3 = at("flat", 0, 0, -0.62);
export const PAGE_DESK: V3 = at("flat", 0.02, DESK.h + 0.004, 0.06);

// ---------------- shots ----------------
export type Light = "day" | "golden" | "night" | "interior";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: PlaceId; sunAz?: number; sunEl?: number };
// 1 hook in the hall (to the push), 2 the page insert, 3 the page on the Bucharest desk (pull back), 4 placeholder hold
const B = [0, 106, 130, 168, TOTAL];
// sun = the key: the hall's stage spots from the front-left; the flat's moon through the window behind Stefan (back light)
const PL: [PlaceId, Light, number?, number?][] = [["hall", "golden", -140, 34], ["hall", "golden", -140, 34], ["flat", "night", 25, 20], ["flat", "night", 25, 20]];
export const SHOTS: ShotDef[] = PL.map(([place, light, sunAz, sunEl], i) => ({ id: i + 1, a: B[i], b: B[i + 1], light, place, sunAz, sunEl }));
/** crossfades (frames, centred on the shot's first frame): the page insert in the hall -> the same page on the desk */
export const XFADE: Record<number, number> = { 3: 12 };
/** no white flashes */
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
/** a framing around a subject: distance (m), azimuth (deg from +z toward +x), elevation (deg; negative = lens below the
 *  look point, looking up), fov (deg), roll (deg) */
type Sph = { d: number; az: number; el: number; fov: number; roll: number };
const D2R = Math.PI / 180;
const S = (d: number, az: number, el: number, fov = 40, roll = 0): Sph => ({ d, az, el, fov, roll });
const mixS = (a: Sph, b: Sph, k: number): Sph => ({ d: a.d + (b.d - a.d) * k, az: a.az + (b.az - a.az) * k, el: a.el + (b.el - a.el) * k, fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
const sph = (look: V3, s: Sph): Cam => {
  const el = s.el * D2R, az = s.az * D2R;
  return { pos: [look[0] + s.d * Math.cos(el) * Math.sin(az), look[1] + s.d * Math.sin(el), look[2] + s.d * Math.cos(el) * Math.cos(az)], look, fov: s.fov, roll: s.roll * D2R };
};
const mixC = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), look: lerp3(a.look, b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k });
/** move-then-hold: glide A -> B (and lookA -> lookB) over the first `g` of the shot, then creep in at `creep` per frame */
type Rig = { lookA: V3; lookB: V3; A: Sph; B: Sph; g?: number; creep?: number };
const PAGE_N: V3 = [0, Math.sin(-PAGE.tilt), Math.cos(-PAGE.tilt)]; // the page's face normal (toward the lens, tilted up)
const RIGS: Record<number, Rig> = {
  // 1 LOW angle: the lens 0.4-0.6 m off the floor glides up and in toward Stefan (crowd on the risers behind him,
  //   the jackpot board above), then holds and creeps in at 0.10 %/f
  //   Stefan on the left third, the neighbour on the right third (his faint stays in frame)
  1: { lookA: at("hall", 0.3, 1.02, 0), lookB: at("hall", 0.42, 1.24, -0.1), A: S(5.6, -16, -6.5, 52, 1.2), B: S(3.6, -7, -12, 52, -0.8), g: 0.36, creep: 0.0015 },
  // 3 Bucharest: starts top-down on the page under the lamp (matching the insert), pulls back and up to Stefan at the desk
  3: { lookA: PAGE_DESK, lookB: at("flat", -0.02, 1.02, -0.3), A: S(0.5, 0, 84, 50), B: S(2.25, -24, 34, 50), g: 0.4, creep: 0.0015 },
  4: { lookA: at("flat", -0.02, 1.02, -0.3), lookB: at("flat", -0.02, 1.02, -0.3), A: S(2.25, -24, 34, 50), B: S(2.25, -24, 34, 50), g: 0.01, creep: 0.0008 },
};
/** the page insert framing: lens 0.5 m off the page along its normal (fov 50: the page fills ~65 % of the frame height) */
const pageCam = (): Cam => ({ pos: add3(PAGE.pos, [PAGE_N[0] * 0.5, PAGE_N[1] * 0.5, PAGE_N[2] * 0.5]), look: PAGE.pos, fov: 50, roll: 0 });
const creepIn = (c: Cam, k: number): Cam => ({ ...c, pos: lerp3(c.look, c.pos, Math.max(0.5, 1 - k)) });
const rigCam = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], r = RIGS[id], n = s.b - s.a, g = r.g ?? 0.36, u = (f - s.a) / n, k = glide(u / g);
  const c = sph(lerp3(r.lookA, r.lookB, k), mixS(r.A, r.B, k));
  return creepIn(c, (r.creep ?? 0.001) * Math.max(0, f - (s.a + g * n)));
};
/** the shot's own camera move: what the sight lines, the sun and the foreground props are built for */
export const camRig = (id: number, f: number): Cam => {
  if (id === 2) { // the push-in to the page: eased over 18 f from the end of shot 1, then a creep
    const s = SHOTS[1], a = rigCam(1, s.a), k = glide((f - s.a) / 18);
    return creepIn(mixC(a, pageCam(), k), 0.0015 * Math.max(0, f - s.a - 18));
  }
  return rigCam(id, f);
};
export const camAt = (id: number, f: number): Cam => camRig(id, f);

// ---------------- lens: depth of field ----------------
/** cInf = blur-disc radius in px at 1080x1920 for things at infinity (IceShort final values, x DOF_SCALE) */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const EYE_H = 1.5;
const eyes = (p: V3, h = EYE_H): (() => V3) => () => [p[0], p[1] + h, p[2]];
export const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: eyes(HALL.stefan) },           // the subject sharp, the crowd and the board soft
  // from the insert on, focus = each layer's own look target (the page in the hall, then the page on the desk, then
  // Stefan as the pull-back reaches him), so both layers of the crossfade are sharp on their own page
  { f: 106, dur: 18, cInf: 14 },
  { f: 130, cInf: 12 },
  { f: 146, dur: 20, cInf: 11 },
];
/** IceShort's sharpness setting: every blur strength at 60 % of the table */
export const DOF_SCALE = 0.6;
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: DOF_SCALE * (p.cInf + (d.cInf - p.cInf) * k), focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => { const d = dofAt(f); return d.focus ? d.focus(f) : camAt(id, f).look; };

/** near framing objects (none in shots 1-3: the confetti and the crowd frame the hook) */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];

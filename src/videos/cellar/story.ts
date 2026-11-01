// Timeline of "The Warm Bucket" (7 s test clip): shots timed to the narration words (cellar-short/voice/words.json),
// story actions (the farmer's walk, the hatch, the bucket set-down, the ice, the warm glow, the frost melting, the nod)
// and the camera grammar of the bridge template: smootherstep glides 18-40 f, every hold creeps (no static hold),
// impacts are 7-frame kicks that flip sign every frame, no hand-held float, hard cuts between places.
export const FPS = 30;
export const TOTAL = 210;
export const D0 = 0; // street level (m); build.ts houses stand on it
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** reference camera ease: symmetric smootherstep */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ---------------- words (voice/words.json onsets, seconds; frame = s x 30) ----------------
// He .143  put .248  a .410  bucket .503  of .863  water .991  in 1.374  his 1.478  cellar 1.629  so 2.036  his 2.210
// potatoes 2.361  wouldn't 2.883  freeze 3.231  Freezing 3.777  water 4.172  gives 4.497  off 4.764  heat 4.973
// just 5.472  enough 5.762  to 6.006  save 6.192  them 6.505 (ends 6.668)
export const W = {
  bucket: 0.503, water: 0.991, cellar: 1.629, so: 2.036, potatoes: 2.361, freeze: 3.231, Freezing: 3.777, water2: 4.172,
  heat: 4.973, just: 5.472, enough: 5.762, save: 6.192, them: 6.505,
};
/** every visual reaction lands 0-3 frames before its word */
export const LEAD_F = 2;
export const cue = (s: number) => Math.round(s * FPS) - LEAD_F; // frame of a reaction to the word at s seconds

// ---------------- places ----------------
/** the cellar is built far from the street (no street ground or houses over it to block the key light) */
export const CX = 1500;
export const C = (x: number, y: number, z: number): V3 => [CX + x, y, z]; // cellar-local -> world
export const CELLAR = { x0: -2.6, x1: 2.6, z0: -3.4, z1: 2.6, h: 2.35 };

// street: three townhouses on the left (fronts on x = -6, facing +x), cobbled lane x -6..-1.35, snowy fence line at x = -0.95
export const LANE_X1 = -1.35, FENCE_X = -0.95;
export const HATCH = { x0: -6.0, x1: -4.75, z0: 5.25, z1: 6.75, top: 0.85 }; // bulkhead door against the middle house
export const HATCH_OPEN = [cue(W.cellar) - 2, cue(W.cellar) + 9] as const; // door swings up as he reaches it (creak on "cellar")
export const hatchOpen = (f: number) => smooth((f - HATCH_OPEN[0]) / (HATCH_OPEN[1] - HATCH_OPEN[0]));

// the farmer's walk in shot 1: from up the lane to beside the hatch, stops just before "cellar"
export const WALK = { a: [-3.2, 0, 2.6] as V3, b: [-4.1, 0, 4.9] as V3, f0: 0, f1: cue(W.cellar) - 4 };
/** walking pace slows into the stop (ease-out on the last 30 %), phase from distance: 0.8 m per step, 2 steps per cycle */
export const walkU = (f: number) => {
  const u = clamp01((f - WALK.f0) / (WALK.f1 - WALK.f0));
  return u < 0.7 ? u * 0.9 : 0.63 + 0.37 * (1 - (1 - (u - 0.7) / 0.3) ** 2);
};
export const farmerStreet = (f: number): V3 => lerp3(WALK.a, WALK.b, walkU(f));
export const WALK_LEN = Math.hypot(WALK.b[0] - WALK.a[0], WALK.b[2] - WALK.a[2]);
export const walkPhase = (f: number) => ((walkU(f) * WALK_LEN) / 1.6) % 1;

// cellar: the farmer beside the crate, the bucket set down between them
export const FARMER_C = C(-0.5, 0, -1.22);
export const CRATE = { c: C(0.62, 0, -1.72), w: 0.86, h: 0.5, d: 0.56 };
export const BUCKET_C = C(-0.13, 0, -1.2); // where the bucket stands once set down (his hand lands ~0.36 m to his right)
export const BUCKET = { r0: 0.118, r1: 0.15, h: 0.29, water: 0.245 }; // bottom radius, top radius, height, water level
/** the set-down: crouch in, bucket lands (clank) just before "potatoes", stand back up */
export const SETDOWN = { f0: 60, land: cue(W.potatoes), f1: cue(W.potatoes) + 14 };
export const crouchAt = (f: number) =>
  f < SETDOWN.land ? smooth((f - SETDOWN.f0 + 1) / (SETDOWN.land - SETDOWN.f0)) : 1 - smooth((f - SETDOWN.land - 3) / (SETDOWN.f1 - SETDOWN.land - 3));
// ice: crystals spread from the rim on "water" (shot 3), done by "heat"; the warm glow rises on "heat"; the frost on the
// nearest potatoes melts on "just enough"; the nod lands on "save" with the kick
export const ICE = { f0: 120, f1: cue(W.heat) + 2 };
export const iceAt = (f: number) => clamp01((f - ICE.f0) / (ICE.f1 - ICE.f0));
export const GLOW = { f0: cue(W.heat), f1: 210 };
export const MELT = { f0: cue(W.just), f1: cue(W.enough) + 8 };
export const frostAt = (f: number) => 1 - smooth((f - MELT.f0) / (MELT.f1 - MELT.f0));
export const NOD = cue(W.save);
/** head dip in degrees (front card headTilt is a roll; the nod is drawn as a dip of the head + closed smile) */
export const nodAt = (f: number) => {
  const x = (f - NOD + 3) / 14;
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 1.5;
};

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; place: "street" | "cellar"; sunAz?: number; sunEl?: number };
// cellar shots use the golden preset (warm lantern key, violet-blue shade), the key turned to come from the lantern
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 60, light: "golden", place: "street", sunAz: 72, sunEl: 10 },
  { id: 2, a: 60, b: 120, light: "golden", place: "cellar", sunAz: 105, sunEl: 35 },
  { id: 3, a: 120, b: 175, light: "golden", place: "cellar", sunAz: 100, sunEl: 55 },
  { id: 4, a: 175, b: TOTAL, light: "golden", place: "cellar", sunAz: 105, sunEl: 35 },
];
/** hard cuts only (no crossfades); no white flash in this clip */
export const XFADE: Record<number, number> = {};
export const FLASH_AT = -1000;

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

// shot 1: rooftop height over the lane -> eye level beside the fence (smootherstep glide, 40 f), then a creeping push
const S1a = (f: number) => dolly([3.0, 10.6, 15.6], [-7.2, 4.6, -6.0], pushK(f, 0, 0.0025), { fov: 40 });
const S1b = (f: number) => dolly([1.25, 1.5, 10.1], [-4.45, 1.0, 5.25], pushK(f, 6, 0.0028), { fov: 33, roll: -0.035 });
// shot 2: medium-full of the farmer at the crate, slow creeping push-in toward his face
const S2a = (f: number) => dolly(C(0.12, 1.28, 2.05), C(-0.2, 0.88, -1.4), pushK(f, 60, 0.0028), { fov: 40 });
// shot 3: close-up of the bucket surface, a slow 20-degree orbit (smootherstep over the shot) + creep
// framing: the bucket bottom-centre, the potatoes in the top third (verifier fix 4); orbit about the point between them
const ORBIT = { r: 1.2, h: 1.0, a0: -65, a1: -45 }; // the bucket sits on the lens -> look line at -55 deg
const S3a = (f: number): Shot => {
  const u = glide((f - 120) / 55), a = ((ORBIT.a0 + (ORBIT.a1 - ORBIT.a0) * u) * Math.PI) / 180, k = pushK(f, 120, 0.0022);
  const [bx, , bz] = BUCKET_C, look: V3 = [bx + 0.34, 0.3, bz - 0.24];
  return { pos: [look[0] + Math.sin(a) * ORBIT.r * k, look[1] + ORBIT.h * k, look[2] + Math.cos(a) * ORBIT.r * k], look, fov: 40, roll: 0.03 };
};
// shot 4: medium shot of the farmer (thighs up), the window with falling snow behind him; creeping push
const S4a = (f: number) => dolly(C(-0.3, 1.38, 0.85), C(-0.46, 1.33, -1.22), pushK(f, 175, 0.003), { fov: 38, roll: 0.03 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 6, dur: 40, s: S1b }],
  2: [{ f: 60, s: S2a }],
  3: [{ f: 120, s: S3a }],
  4: [{ f: 175, s: S4a }],
};

// one impact kick on "save" (flips sign every frame, decays over 7 f)
const KICKS: [number, number][] = [[(NOD + 0.0001) / FPS, 1]];
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
/** cInf = blur-disc radius in px at 1080x1920 for things at infinity (template values: CU 12-14, MS 10-12) */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const EYE_H = 1.72; // farmer's eye height (m)
const farmerEyes = (f: number): V3 => { const p = farmerStreet(f); return [p[0], EYE_H, p[2]]; };
export const DOF: Dof[] = [
  { f: 0, cInf: 11, focus: farmerEyes },                                       // street: medium-shot value, on his eyes
  { f: 60, cInf: 13, focus: () => [FARMER_C[0], EYE_H - 0.06, FARMER_C[2]] },  // cellar close-up value, on his eyes
  { f: 120, cInf: 13, focus: () => [BUCKET_C[0], BUCKET.water, BUCKET_C[2]] }, // bucket CU: the ice
  { f: 175, cInf: 11, focus: () => [FARMER_C[0], EYE_H - 0.04, FARMER_C[2]] }, // medium shot, on his eyes
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => { const d = dofAt(f); return d.focus ? d.focus(f) : camAt(id, f).look; };

/** near framing objects (built outside the sight-line test): a snowy fence post in the street shot's bottom-right corner */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 0, b: 60, kit: "fencepost", pos: [-0.95, D0, 7.85], s: 0.86, yaw: 0.25 },
];

// Our cast as lit flat sprites in the 3D world (ice short: Tudor, the cutters, the townspeople, the newsboy, the guard,
// the Calcutta market). Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas
// per distinct drawing. Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side
// gradient toward the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects
// (sweat, drips, the bulb, sawdust, warm air) are unlit cards. Cards, effects and blobs live on the NOINK layer so the
// world ink pass never outlines their quads. Infrastructure (pool, cards, tiers, blinks, blobs) is the template's.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, holdPoint, TUDOR, worker, GUARD, NEWSBOY, LOCAL, SELLER, bengali, townsfolk, fxShadow, fxContact, fxWarm,
  fxBulb, fxDrop, fxSawdust, fxStars, Outfit, Expr, FrontOpts, SideOpts } from "./toon";
import {
  FPS, SHOTS, V3, clamp01, smooth, W, cue, at, BEACH, POND, HARBOR, carrierAt, NEWSBOY_P, slipperAt, SLIP, PORT, meltAt, TUDOR_CELL, TUDOR_WIN,
  GUARD_P, YAWN, BULB, HOLD, MARKET, brigAt, DECK_Y, HEAT_F, BOTTLE, CELL_WIN, CELLAR, C, HATCH_OPEN, sawdustAt,
} from "./story";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean; glow?: number };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
/** expression swaps (seconds of the word they react to), hidden under a blink */
const SWAPS: Record<number, number[]> = { 17: [W.figures], 29: [W.man] };
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean; flip?: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = (view.side && view.mirror) || !!view.flip, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};


// ---------------- the ice short cast ----------------
export type Held = { kind: "ice" | "paper"; pos: V3; yaw: number; s?: number };
export type Stage = { places: Place[]; fx: FxPlace[]; held: Held[] };
const ME = 7; // Tudor's index (blink seed, head-shape seed): the same bean head in every shot
const TUD: Who = { i: ME, o: TUDOR, okey: "tudor" };
const mk = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });

/** card yaw toward the camera (same as world.ts) and the card's local +x axis in world space */
const cardAxes = (x: number, z: number, cam: { pos: { x: number; z: number } }) => {
  const yaw = Math.atan2(cam.pos.x - x, cam.pos.z - z);
  return { yaw, rx: Math.cos(yaw), rz: -Math.sin(yaw) };
};
/** a front-facing figure standing (or walking / sitting) at p; returns its options for props placed at its hands */
const fig = (out: Stage, cam: CamInfo, who: Who, p: V3, f: number, fo: FrontOpts, o: { flip?: boolean; shadow?: boolean; scale?: number; roll?: number } = {}) => {
  const t = f / FPS, fo2: FrontOpts = { blink: lidAt(t, who.i, SWAPS[SHOTS.findIndex((s) => f >= s.a && f < s.b) + 1]), ...fo };
  const pl = person(cam, who, p[0], p[1], p[2], { side: false, mirror: false, flip: o.flip }, fo2, {}, o.scale ?? 1);
  if (o.roll) pl.roll = o.roll;
  out.places.push(pl);
  if (o.shadow !== false) blob(out, p[0], p[1], p[2], o.scale ?? 1);
  return fo2;
};
/** the 3D thing held at the "hold" grip of a front card (ice block / newspaper), pushed `fwd` m toward the lens */
const heldAt = (out: Stage, cam: CamInfo, who: Who, p: V3, fo: FrontOpts, kind: Held["kind"], fwd = 0.16, s = 1) => {
  const [hx, hy] = holdPoint(who.o, { ...fo, seed: seedOf(who.i) }), { yaw, rx, rz } = cardAxes(p[0], p[2], cam);
  const dx = (hx - 300) * SU;
  out.held.push({ kind, yaw, s, pos: [p[0] + rx * dx + Math.sin(yaw) * fwd, p[1] + (975 - hy) * SU, p[2] + rz * dx + Math.cos(yaw) * fwd] });
};
/** sweat: drops slide down beside the head of someone at p (head top ~ y + 1.75) */
const sweat = (out: Stage, cam: CamInfo, p: V3, f: number, n = 2, h = 1.62, seed = 1) => {
  for (let i = 0; i < n; i++) {
    const u = ((f / 16 + hh(i, seed)) % 1), side = i % 2 ? 1 : -1, r = cam.right;
    const ox = side * (0.15 + 0.03 * hh(i, seed + 3));
    out.fx.push({ key: "drop", cw: 64, ch: 96, draw: fxDrop, x: p[0] + r.x * ox, y: p[1] + h + 0.05 - 0.22 * u, z: p[2] + r.z * ox, w: 0.045, h: 0.068 });
  }
};
/** drips falling from a point (melting ice), period ~0.6 s each */
const drips = (out: Stage, x: number, y: number, z: number, f: number, n = 3, fall = 0.5, s = 1, seed = 5) => {
  for (let i = 0; i < n; i++) {
    const u = (f / 18 + hh(i, seed)) % 1, dx = (hh(i, seed + 1) - 0.5) * 0.3 * s, dz = (hh(i, seed + 2) - 0.5) * 0.3 * s;
    out.fx.push({ key: "drop", cw: 64, ch: 96, draw: fxDrop, x: x + dx, y: y - fall * u * u, z: z + dz, w: 0.035 * s, h: 0.053 * s });
  }
};
/** warm-air ribbons (additive glow) rising / drifting from a to b over their life */
const warmAir = (out: Stage, f: number, f0: number, a: V3, b: V3, n: number, len: number, rot = 0, seed = 7, life = 1.4, glow = 1.15) => {
  for (let i = 0; i < n; i++) {
    const born = f0 + i * (life * FPS / n), u0 = (f - born) / (life * FPS);
    if (u0 < 0) continue;
    const u = u0 % 1, e = smooth(u), jx = (hh(i, seed) - 0.5) * 0.3, jy = (hh(i, seed + 1) - 0.5) * 0.25, jz = (hh(i, seed + 2) - 0.5) * 0.3;
    const k = q(u, 30);
    out.fx.push({ key: `warm${k}`, cw: 128, ch: 512, draw: (p) => fxWarm(p, k), x: a[0] + (b[0] - a[0]) * e + jx, y: a[1] + (b[1] - a[1]) * e + jy, z: a[2] + (b[2] - a[2]) * e + jz,
      w: len * 0.2, h: len, rot, soft: true, glow });
  }
};
const saw = (f: number, i: number) => 0.5 + 0.5 * Math.sin((f / FPS) * Math.PI * 2 * 1.5 + i * 2.1);
const shovel = (f: number, i: number) => { const x = ((f / FPS) * 0.9 + i * 0.45) % 1; return x < 0.5 ? 0.15 * smooth(x / 0.5) : x < 0.8 ? 0.15 + 0.85 * smooth((x - 0.5) / 0.3) : 1 - smooth((x - 0.8) / 0.2); };

/** everything with a face (and the held props) in shot `id` at frame f */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [], held: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.place) {
    case "beach": {
      const fo = fig(out, cam, TUD, BEACH.tudor, f, { mode: "stand", expr: "smile", look: -1, facing: -1, prop: "hold", headTilt: -3 });
      heldAt(out, cam, TUD, BEACH.tudor, fo, "ice", 0.2);
      const lw = mk(3, LOCAL, "local");
      fig(out, cam, lw, BEACH.local, f, { mode: "stand", expr: id === 1 ? "nervous" : "shock", look: 1, facing: 1, tilt: id === 2 ? -3 : 0 });
      sweat(out, cam, BEACH.local, f, id === 2 ? 3 : 2, 1.6, 3);
      const h = out.held[0].pos;
      drips(out, h[0], h[1] - 0.14, h[2], f, 2, 0.9, 1, 9);
      break;
    }
    case "pond": {
      POND.workers.forEach((p, i) => fig(out, cam, mk(20 + i, worker(i), "w" + i), p, f, { mode: "stand", expr: i === 1 ? "whistle" : "neutral", prop: ["saw", q(saw(f, i), 20)], facing: 0, tilt: 3 * Math.sin(f * 0.2 + i) }));
      break;
    }
    case "harbor": {
      if (id === 4 || id === 5) {
        const tp: V3 = id === 4 ? HARBOR.tudor : at("harbor", 1.25, 0, 6.2);
        fig(out, cam, TUD, tp, f, { mode: "stand", expr: id === 4 ? "grin" : "smile", look: id === 4 ? 0 : 1, facing: 0, headTilt: id === 4 ? -5 : 2 * Math.sin(f * 0.15), prop: "point" });
        if (id === 4) {
          fig(out, cam, mk(21, worker(1), "w1"), at("harbor", -4.6, 0, 2.6), f, { mode: "stand", expr: "neutral", prop: "hold" });
          heldAt(out, cam, mk(21, worker(1), "w1"), at("harbor", -4.6, 0, 2.6), { mode: "stand", prop: "hold" }, "ice");
        }
      }
      if (id === 5) for (let i = 0; i < 2; i++) {
        const c = carrierAt(i, f), who = mk(22 + i, worker(2 + i), "c" + i);
        const fo = fig(out, cam, who, c.p, f, { mode: c.walking ? "march" : "stand", phase: c.walking ? q(c.phase, 60) : 0, lift: 30, expr: "neutral", prop: "hold" });
        heldAt(out, cam, who, c.p, fo, "ice");
      }
      if (id === 6) ([[-10.2, 2.4], [-9.1, 4.6], [-8.4, 3.1], [-4.8, 6.2], [-3.9, 3.4], [-2.6, 5.1], [-6.6, 8.4]] as const).forEach(([x, z], i) =>
        fig(out, cam, mk(40 + i, townsfolk(i), "tf" + i), at("harbor", x, 0, z), f, { mode: "stand", expr: "laugh", prop: i % 2 ? "point" : null, wave: i % 2 ? undefined : q(0.5 + 0.5 * Math.sin(f * 0.4 + i), 6) }, { flip: i % 3 === 0 }));
      if (id === 8) {
        const P: [number, number, number, boolean][] = [[-7.7, 2.0, 0, false], [-7.0, 3.4, 1, true], [-5.5, 1.8, 2, false], [-5.3, 4.5, 3, true], [-6.4, 6.0, 4, false], [-7.9, 6.4, 5, true]];
        P.forEach(([x, z, v, pt], i) => {
          const bob = Math.abs(Math.sin(f * 0.45 + i * 1.3));
          fig(out, cam, mk(40 + v, townsfolk(v), "tf" + v), at("harbor", x, 0, z), f, { mode: "stand", expr: f < cue(W.joke) && i % 2 ? "grin" : "laugh", prop: pt ? "point" : null, wave: pt ? undefined : q(bob, 6),
            tilt: -4 + 6 * q(bob, 6), headTilt: 5 * Math.sin(f * 0.45 + i), crouch: 0.15 * q(bob, 6) });
        });
      }
      break;
    }
    case "street": {
      if (id === 7) {
        const who = mk(30, NEWSBOY, "newsboy"), wave = 0.012 * Math.sin(f * 0.5);
        const p: V3 = [NEWSBOY_P[0], NEWSBOY_P[1], NEWSBOY_P[2]];
        const fo = fig(out, cam, who, p, f, { mode: "stand", expr: "grin", prop: "hold", headTilt: 4 * Math.sin(f * 0.3) });
        heldAt(out, cam, who, p, fo, "paper", 0.2 + wave, 1);
      } else {
        const sl = slipperAt(f), who = mk(42, townsfolk(2), "tf2");
        const falling = f >= SLIP;
        fig(out, cam, who, sl.p, f, { mode: falling ? "fall" : "march", phase: falling ? 0 : q(((f / FPS) * 1.8) % 1, 60), lift: 30, expr: falling ? "shock" : "smile_closed" },
          { roll: falling ? -0.95 * smooth(sl.fall * 1.3) : 0, shadow: true });
        if (falling && f < SLIP + 30) { const k = q((f - SLIP) / 30, 30); out.fx.push({ key: `stars${k}`, cw: 420, ch: 220, draw: (p) => fxStars(p, k), x: sl.p[0] + cam.right.x * 1.2, y: 1.15, z: sl.p[2] + cam.right.z * 1.2, w: 0.9, h: 0.47 }); }
        fig(out, cam, mk(30, NEWSBOY, "newsboy"), [-4.2, 0, 2.4], f, { mode: "stand", expr: falling ? "laugh" : "grin", prop: falling ? "point" : null }, { flip: true });
        fig(out, cam, mk(43, townsfolk(3), "tf3"), [-3.6, 0, 0.8], f, { mode: "stand", expr: falling ? "laugh" : "whistle", prop: falling ? "point" : "hold", headTilt: 4 * Math.sin(f * 0.2) });
      }
      break;
    }
    case "port": {
      if (id !== 12) {
        const m = meltAt(id, f);
        fig(out, cam, TUD, PORT.tudor, f, { mode: "stand", expr: id === 15 ? "dazed" : "nervous", look: 1, facing: 1, wave: q(0.55 + 0.45 * Math.sin(f * 0.9), 6), tilt: 2 * Math.sin(f * 0.3) });
        sweat(out, cam, PORT.tudor, f, 3, 1.62, 11);
        if (id === 10) {
          fig(out, cam, mk(50, { ...worker(0), skin: "#8a5636", hat: null, jacket: "#f2ead6" }, "pw0"), at("port", 1.6, 0, 3.2), f, { mode: "stand", expr: "laugh", prop: "point", tilt: -4 + 3 * Math.sin(f * 0.5) });
        }
        const [sx, , sz] = PORT.stack;
        drips(out, sx, 0.9 * (1 - m) + 0.1, sz + 0.35, f, 4, 0.9 * (1 - m) + 0.1, 1.4, 3);
        warmAir(out, f, s.a - 40, [sx, 0.3, sz], [sx, 1.6, sz], 6, 0.7, 0, 13, 1.6, 0.6);
      }
      break;
    }
    case "cell": {
      if (id === 16 || id === 17) {
        const bulb = f >= BULB && id === 17;
        fig(out, cam, TUD, TUDOR_CELL, f, { mode: "sit", expr: bulb ? "grin" : "stern", look: bulb ? 0 : -1, facing: 0, headTilt: bulb ? -6 : 4, nod: bulb ? 0 : q(0.5 + 0.5 * Math.sin(f * 0.12), 6), wave: bulb ? 1 : undefined }, { shadow: false });
        if (bulb) { const k = q(Math.min(1, (f - BULB) / 14), 30); out.fx.push({ key: `bulb${k}`, cw: 500, ch: 500, draw: (p) => fxBulb(p, k), x: TUDOR_CELL[0], y: TUDOR_CELL[1] + 1.45, z: TUDOR_CELL[2] + 0.05, w: 0.44, h: 0.44, glow: 1.6, soft: true }); }
      }
      if (id === 16) {
        const yk = clamp01((f - YAWN[0]) / (YAWN[1] - YAWN[0])), yawning = yk > 0 && yk < 1;
        fig(out, cam, mk(60, GUARD, "guard"), GUARD_P, f, { mode: "stand", expr: yawning ? "yawn" : "neutral", wave: yawning ? Math.sin(Math.PI * yk) : undefined, tilt: yawning ? -5 * Math.sin(Math.PI * yk) : 0, headTilt: yawning ? -8 * Math.sin(Math.PI * yk) : 0 });
      }
      const wx = C(CELL_WIN.x, CELL_WIN.y, CELLAR.z0)[0];
      if (id === 18) drips(out, wx, CELL_WIN.y + CELL_WIN.h / 2 - 0.28, CELLAR.z0 - 0.4, f, 3, 0.25, 0.8, 21);
      if (id === 19) {
        fig(out, cam, TUD, TUDOR_WIN, f, { mode: "stand", expr: "smile", look: 1, facing: 1, prop: "point" });
        warmAir(out, f, s.a - 30, C(CELL_WIN.x, CELL_WIN.y, CELLAR.z0 - 0.3), C(CELL_WIN.x - 0.6, CELL_WIN.y - 0.1, CELLAR.z0 + 1.0), 6, 0.55, 1.3, 31, 1.5, 0.9);
      }
      if (id === 21) {
        // warm air drifts in from both sides, meets the towel on "heat" and bounces back out
        for (let i = 0; i < 6; i++) {
          const side = i % 2 ? 1 : -1, ph = (i >> 1) * 7, u = clamp01((f - 1084 - ph) / (HEAT_F - 1084 - 6));
          const back = smooth((f - HEAT_F - ph * 0.3) / 18), dist = 0.62 - 0.5 * smooth(u) + 0.55 * back, k = q(0.3 + 0.4 * u - 0.3 * back, 30);
          if (k <= 0) continue;
          out.fx.push({ key: `warm${k}`, cw: 128, ch: 512, draw: (p) => fxWarm(p, k), x: BOTTLE[0] + side * dist, y: BOTTLE[1] + 0.12 + 0.07 * (i >> 1), z: BOTTLE[2] + 0.06,
            w: 0.07, h: 0.34, rot: side * (Math.PI / 2) + 0.15 * Math.sin(f * 0.2 + i), soft: true, glow: 1.1 });
        }
      }
      break;
    }
    case "hold": {
      if (id === 22) {
        HOLD.workers.forEach((p, i) => {
          const k = q(shovel(f, i), 20);
          fig(out, cam, mk(70 + i, worker(i + 1), "hw" + i), p, f, { mode: "stand", expr: "neutral", prop: ["shovel", k], tilt: -8 * (1 - k) + 4, crouch: 0.3 * (1 - k) }, { flip: i === 1 });
          // sawdust thrown in an arc from the blade toward the fill on the up-swing
          const x = ((f / FPS) * 0.9 + i * 0.45) % 1;
          if (x > 0.58 && x < 0.9) for (let j = 0; j < 7; j++) {
            const u = (x - 0.58) / 0.32 + hh(j, i) * 0.15, side = i ? -1 : 1;
            out.fx.push({ key: "dust", cw: 64, ch: 64, draw: fxSawdust, x: p[0] + side * (0.4 + 0.9 * u) + (hh(j, 3) - 0.5) * 0.3, y: 1.5 + 0.9 * u - 1.6 * u * u + (hh(j, 4) - 0.5) * 0.2, z: p[2] - 1.0 * u - 0.2 * hh(j, 5), w: 0.06, h: 0.06, rot: j });
          }
        });
        void sawdustAt;
      }
      break;
    }
    case "mill": {
      const k = q(shovel(f, 0), 20), wp = at("mill", -2.4, 0, -0.9);
      fig(out, cam, mk(73, worker(3), "mw"), wp, f, { mode: "stand", expr: "neutral", prop: ["shovel", k], tilt: -8 * (1 - k) + 4, crouch: 0.3 * (1 - k) }, { flip: true });
      const x = ((f / FPS) * 0.9) % 1;
      if (x > 0.58 && x < 0.9) for (let j = 0; j < 8; j++) {
        const u = (x - 0.58) / 0.32 + hh(j, 7) * 0.15;
        out.fx.push({ key: "dust", cw: 64, ch: 64, draw: fxSawdust, x: wp[0] - 0.4 - 1.2 * u, y: 1.4 + 1.2 * u - 1.4 * u * u, z: wp[2] - 1.2 * u, w: 0.07, h: 0.07, rot: j });
      }
      fig(out, cam, TUD, at("mill", 1.0, 0, 2.2), f, { mode: "stand", expr: "grin", prop: "point" }, { flip: true });
      break;
    }
    case "calcutta": {
      if (id === 26) {
        void brigAt; void DECK_Y; void HATCH_OPEN;
      } else {
        const [mx, , mz] = MARKET.stall;
        if (id === 27 || id === 28) {
          fig(out, cam, mk(82, SELLER, "seller"), [mx - 0.15, 0, mz - 0.45], f, { mode: "stand", expr: "grin", prop: "iceblock" });
          fig(out, cam, mk(83, bengali(1), "b1"), [mx - 0.35, 0, mz + 1.35], f, { mode: "stand", expr: "smile_closed", prop: "drink" });
          fig(out, cam, mk(84, bengali(2), "b2"), [mx + 0.35, 0, mz + 1.85], f, { mode: "stand", expr: "relief_open", prop: "iceblock" }, { flip: true });
        }
        const crowd: [number, number, number, Expr][] = [[-7.6, 1.6, 3, "smile"], [-5.4, 2.4, 4, "grin"], [-6.3, 0.9, 5, "smile_closed"], [5.4, 1.4, 6, "grin"], [6.6, 2.6, 7, "smile"],
          [-3.0, 4.0, 8, "smile_closed"], [4.4, 7.4, 9, "grin"], [1.6, 9.0, 10, "smile"], [-1.8, 7.6, 11, "grin"], [8.8, 5.0, 12, "smile_closed"]];
        crowd.forEach(([dx, dz, v, e], i) => fig(out, cam, mk(85 + i, bengali(v), "b" + v), [mx + dx, 0, mz + dz], f,
          { mode: i % 4 === 3 ? "stroll" : "stand", phase: q(((f / FPS) * 0.8 + i * 0.27) % 1, 60), expr: e, prop: i % 3 === 0 ? "drink" : i % 3 === 1 ? "iceblock" : null, wave: i % 3 === 2 ? q(0.5 + 0.5 * Math.sin(f * 0.3 + i), 6) : undefined }, { flip: i % 2 === 1 }));
        fig(out, cam, TUD, MARKET.tudor, f, { mode: "stand", expr: id === 29 && f >= cue(W.man) + 4 ? "smile_closed" : "smile", look: id === 29 ? 0 : -1, facing: id === 29 ? 0 : -1, headTilt: id === 29 ? -4 : 2 * Math.sin(f * 0.12), prop: "drink" });
      }
      break;
    }
    default: break;
  }
  return out;
};
export { FPS, clamp01, bodySide };
export type { Outfit, SideOpts };

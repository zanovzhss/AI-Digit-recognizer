// Our cast as lit flat sprites in the 3D world (stone short: the villagers of Aneyoshi in 1896, 1933 and today, the
// carvers and haulers, the town's fish vendor, the man on the forgotten stone, the old couple of 2011). Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas
// per distinct drawing. Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side
// gradient toward the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects
// (sweat, drips, the bulb, sawdust, warm air) are unlit cards. Cards, effects and blobs live on the NOINK layer so the
// world ink pass never outlines their quads. Infrastructure (pool, cards, tiers, blinks, blobs) is the template's.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxShadow, fxContact, Outfit, FrontOpts, SideOpts, fisher, villager, modern, VENDOR, LUNCH, GRANDPA, GRANDMA } from "./toon";
import { FPS, SHOTS, V3, W, clamp01, cue, smooth, STONE, onStone, houseAt, SURV2, SURV4, YARD, HAUL_U, STOP_U, STONE_U, MARKET, OLDSTONE, GULL_F, SHAKE_F, onPath, at, lerp3, OFF, townFrontAt } from "./story";
import { H } from "./terrain";
import { SEA_Y_TOWN as SEA_TOWN } from "./town";
import { LIGHTS, LightName, LOOK } from "./lights";
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
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; pitch?: number; size?: [number, number, number];
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
let LNAME: LightName = "day";
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
const SWAPS: Record<number, number[]> = {};
void W;
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
const CONTACT: Record<LightName, [number, number, number]> = { day: [0.22, 0.2, 0.22], golden: [0.24, 0.17, 0.24], sunset: [0.24, 0.17, 0.24], lantern: [0.12, 0.11, 0.2],
  room: [0.24, 0.21, 0.26], storm: [0.2, 0.2, 0.26], grey: [0.24, 0.24, 0.27], dark: [0.2, 0.2, 0.25], dawn: [0.24, 0.21, 0.27] };
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



// ---------------- the stone short cast ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const mk = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });

/** a front-facing figure standing (or sitting) at p */
const fig = (out: Stage, cam: CamInfo, who: Who, p: V3, f: number, fo: FrontOpts, o: { flip?: boolean; shadow?: boolean; scale?: number; roll?: number; pitch?: number } = {}) => {
  const t = f / FPS, fo2: FrontOpts = { blink: lidAt(t, who.i, SWAPS[SHOTS.findIndex((s) => f >= s.a && f < s.b) + 1]), ...fo };
  const pl = person(cam, who, p[0], p[1], p[2], { side: false, mirror: false, flip: o.flip }, fo2, {}, o.scale ?? 1);
  if (o.roll) pl.roll = o.roll;
  if (o.pitch) pl.pitch = o.pitch;
  out.places.push(pl);
  if (o.shadow !== false) blob(out, p[0], p[1], p[2], o.scale ?? 1);
  return fo2;
};
/** a side-view figure walking along (dx, dz): faces the way it walks on screen */
const walker = (out: Stage, cam: CamInfo, who: Who, p: V3, f: number, dir: [number, number], so: SideOpts, o: { scale?: number; shadow?: boolean } = {}) => {
  const t = f / FPS, so2: SideOpts = { blink: lidAt(t, who.i), ...so };
  const left = dir[0] * cam.right.x + dir[1] * cam.right.z < 0;
  out.places.push(person(cam, who, p[0], p[1], p[2], { side: true, mirror: left }, {}, so2, o.scale ?? 1));
  if (o.shadow !== false) blob(out, p[0], p[1], p[2], o.scale ?? 1);
};
const G = (p: V3): V3 => [p[0], H(p[0], p[2]), p[2]];
const off = (p: V3, dx: number, dz: number): V3 => G([p[0] + dx, 0, p[2] + dz]);

// ---- effect drawings ----
const birdDraw = (k: number) => (p: Pen) => { const g = p.g, w = Math.sin(k * Math.PI * 2); g.strokeStyle = "#2a2430"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); g.moveTo(8, 40 - 22 * w); g.quadraticCurveTo(34, 30 + 8 * w, 64, 44); g.quadraticCurveTo(94, 30 + 8 * w, 120, 40 - 22 * w); g.stroke(); };
const gullDraw = (k: number, fish: boolean) => (p: Pen) => {
  const g = p.g, w = Math.sin(k * Math.PI * 2);
  g.strokeStyle = "#241726"; g.lineWidth = 5; g.lineJoin = "round";
  g.fillStyle = "#f4f2ee"; g.beginPath(); g.moveTo(110, 80); g.lineTo(20, 80 - 70 * w); g.lineTo(60, 92); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(120, 96, 46, 20, -0.1, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(166, 84, 17, 15, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#f2b030"; g.beginPath(); g.moveTo(180, 84); g.lineTo(204, 90); g.lineTo(180, 94); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#8a909a"; g.beginPath(); g.moveTo(110, 82); g.lineTo(200, 80 - 70 * w); g.lineTo(150, 92); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#241726"; g.beginPath(); g.arc(170, 80, 3.5, 0, Math.PI * 2); g.fill();
  if (fish) { g.fillStyle = "#9fb4c4"; g.beginPath(); g.ellipse(196, 116, 30, 9, 0.9, 0, Math.PI * 2); g.fill(); g.stroke(); }
};
const sparrowDraw = (k: number) => (p: Pen) => {
  const g = p.g, d = Math.max(0, Math.sin(k * Math.PI * 2)) * 10;
  g.strokeStyle = "#241726"; g.lineWidth = 4; g.fillStyle = "#9a6a42";
  g.beginPath(); g.ellipse(60, 70, 30, 20, 0.1, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#7a4e30"; g.beginPath(); g.arc(88, 52 + d, 15, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#e8d8b8"; g.beginPath(); g.ellipse(58, 80, 18, 9, 0.1, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#3a2a20"; g.beginPath(); g.moveTo(101, 52 + d); g.lineTo(114, 58 + d); g.lineTo(100, 60 + d); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(30, 66); g.lineTo(8, 60); g.lineTo(28, 76); g.closePath(); g.fill();
  g.fillStyle = "#1a1418"; g.beginPath(); g.arc(91, 49 + d, 2.6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#5a3a20"; g.beginPath(); g.moveTo(54, 88); g.lineTo(52, 104); g.moveTo(66, 88); g.lineTo(68, 104); g.stroke();
};
const dogDraw = (k: number) => (p: Pen) => {
  const g = p.g;
  g.strokeStyle = "#241726"; g.lineWidth = 5; g.fillStyle = "#c89a62";
  g.beginPath(); g.ellipse(110, 100, 52, 26, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(170, 74, 24, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(160, 58); g.lineTo(168, 36); g.lineTo(180, 56); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(58, 92); g.quadraticCurveTo(36, 70, 44, 58); g.stroke();
  for (const [x, ph] of [[80, 0], [96, 0.5], [128, 0.5], [144, 0]] as const) { const a = 0.4 * Math.sin((k + ph) * Math.PI * 2); g.beginPath(); g.moveTo(x, 118); g.lineTo(x + 26 * Math.sin(a), 118 + 30 * Math.cos(a)); g.stroke(); }
  g.fillStyle = "#241726"; g.beginPath(); g.arc(178, 70, 3.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(192, 80, 4, 0, Math.PI * 2); g.fill();
};
const chipDraw = (p: Pen) => { const g = p.g; g.fillStyle = "#c8c0b0"; g.beginPath(); g.moveTo(4, 10); g.lineTo(20, 2); g.lineTo(28, 18); g.lineTo(12, 28); g.closePath(); g.fill(); };
const smokeDraw = (k: number) => (p: Pen) => { const g = p.g; g.fillStyle = `rgba(235,232,228,${(0.55 * (1 - k)).toFixed(3)})`; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(64 + 18 * Math.sin(i * 2.1 + k * 3), 64 - i * 12, 26 + 16 * k, 0, Math.PI * 2); g.fill(); } };
const sprayDraw = (k: number) => (p: Pen) => {
  const g = p.g;
  for (let i = 0; i < 6; i++) { const a = i * 1.1, r = 22 + 18 * k + 10 * Math.sin(i * 2.3); g.fillStyle = `rgba(250,252,255,${(0.9 * (1 - 0.7 * k)).toFixed(3)})`; g.beginPath(); g.arc(64 + 30 * Math.cos(a) * (0.5 + k), 70 - 26 * Math.sin(a) * (0.4 + k) - 20 * k, r, 0, Math.PI * 2); g.fill(); }
};

/** birds circling in the sky ahead of the lens (golden, day, dawn, sunset), far and small */
const birds = (out: Stage, cam: CamInfo, t: number, n: number, seed: number) => {
  const fx = -cam.right.z, fz = cam.right.x; // camera forward (horizontal) = right x up
  for (let i = 0; i < n; i++) {
    const d = 70 + 90 * hh(i, seed), a = (hh(i, seed + 1) - 0.5) * 0.7, ca = Math.cos(a), sa = Math.sin(a);
    const dirx = fx * ca - fz * sa, dirz = fz * ca + fx * sa, ph = t * (0.18 + 0.1 * hh(i, seed + 2)) + i;
    const x = cam.pos.x + dirx * d + 9 * Math.cos(ph), z = cam.pos.z + dirz * d + 9 * Math.sin(ph), y = cam.pos.y + 14 + 26 * hh(i, seed + 3) + 2 * Math.sin(ph * 1.7);
    const k = q(((t * (2.2 + hh(i, seed + 4))) + hh(i, seed + 5)) % 1, 8);
    out.fx.push({ key: `bird${k}`, cw: 128, ch: 64, draw: birdDraw(k), x, y, z, w: 1.5, h: 0.75, rot: 0.15 * Math.sin(ph) });
  }
};

/** everything with a face (and the effects) in shot `id` at frame f */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  if (LOOK[s.light].birds && s.place !== "room" && id !== 9) birds(out, cam, t, id === 1 || id === 22 ? 9 : 6, id * 13);
  switch (id) {
    case 1: { // an old man sweeps by the stone; up by the houses a woman hangs laundry, a kid flies a kite
      fig(out, cam, mk(1, modern(6), "sweeper"), G(onStone(-1.4, 0, 1.9)), f, { mode: "stand", expr: "smile_closed", prop: "broom", tilt: 3 * Math.sin(f * 0.12), facing: -1 });
      fig(out, cam, mk(2, modern(1), "laundry"), off(houseAt(1), 3, 4.6), f, { mode: "stand", expr: "neutral", reach: q(0.6 + 0.3 * Math.sin(f * 0.08), 8) });
      fig(out, cam, mk(3, { ...modern(4), build: "kid" }, "kiteKid"), off(houseAt(6), -2, 6), f, { mode: "stand", expr: "grin", prop: "point", facing: 1 });
      break;
    }
    case 4: { // the two survivors on the slope, backs to the lens, looking down at the empty shore
      fig(out, cam, mk(10, fisher(1), "surv1"), SURV2, f, { mode: "stand", back: true, prop: "shoulder", nod: 0.4 });
      fig(out, cam, mk(11, villager(1), "surv2"), off(SURV2, 0.62, 0.18), f, { mode: "stand", back: true, nod: 0.7 });
      break;
    }
    case 6: { // four survivors on the slope above the flooded lanes (seen once the camera eases back on "Four")
      const P4: [number, number][] = [[-0.9, 0.1], [0.05, -0.25], [0.95, 0.15], [1.9, -0.1]];
      const W4: Outfit[] = [fisher(0), villager(2), fisher(4), villager(3)];
      P4.forEach(([dx, dz], i) => fig(out, cam, mk(20 + i, W4[i], "surv4_" + i), off(SURV4, dx, dz), f, { mode: "stand", back: true, nod: 0.3 + 0.15 * i, tilt: i === 3 ? -4 : 0 }));
      break;
    }
    case 7: { // the carvers: one in the foreground (OTS, his profile, blurred), the other kneels at the stone with hammer and chisel
      walker(out, cam, mk(30, fisher(2), "carverA"), [YARD[0] - 1.35, YARD[1] + 0.02, YARD[2] + 1.55], f, [1, -0.9], { mode: "stand", expr: "neutral" }, { shadow: false });
      const tap = (f % 14) / 14, k = tap < 0.25 ? tap / 0.25 : 1 - (tap - 0.25) / 0.75;
      fig(out, cam, mk(31, fisher(3), "carverB"), [YARD[0] + 0.95, YARD[1] + 0.05, YARD[2] - 0.55], f, { mode: "sit", expr: "stern", prop: ["hammer", q(k, 8)], chisel: true, facing: -1, headTilt: 8 }, { shadow: false });
      fig(out, cam, mk(32, villager(0), "watcher"), [YARD[0] + 2.4, YARD[1], YARD[2] - 1.6], f, { mode: "stand", expr: "neutral", facing: -1 });
      if (tap < 0.35) for (let i = 0; i < 5; i++) { const u2 = tap / 0.35, a = hh(i + Math.floor(f / 14) * 7, 3) * Math.PI; out.fx.push({ key: "chip", cw: 32, ch: 32, draw: chipDraw, x: YARD[0] + 0.55 + Math.cos(a) * 0.3 * u2, y: YARD[1] + 0.62 + 0.25 * u2 - 0.5 * u2 * u2, z: YARD[2] - 0.2 + Math.sin(a) * 0.2 * u2, w: 0.025, h: 0.025, rot: i + f }); }
      break;
    }
    case 8: { // the haul: six villagers lean into two ropes up the path; an elder walks beside; a dog trots along
      const su = HAUL_U + 2.5 * smooth((f - 583) / 52);
      for (let i = 0; i < 6; i++) {
        const u = su + 3.4 + 1.25 * i, sd = i % 2 ? 0.55 : -0.55, p: V3 = onPath(u, sd, 0), ph = q(((f / 30) * 1.1 + i * 0.37) % 1, 16);
        walker(out, cam, mk(40 + i, i % 3 === 2 ? villager(i) : fisher(i + 1), "hauler" + i), p, f, [0, -1], { mode: "march", phase: ph, stride: 0.55, pull: 1, expr: i % 2 ? "pained" : "stern" });
      }
      walker(out, cam, mk(47, fisher(5), "elder"), onPath(su + 2, 2.2, 0), f, [0, -1], { mode: "march", phase: q((f / 30 * 0.9) % 1, 16), stride: 0.5, expr: "neutral" });
      const dk = q((f / 30 * 2.4) % 1, 8), dp = onPath(su + 1.2, 1.4, 0.32);
      out.fx.push({ key: `dog${dk}`, cw: 224, ch: 160, draw: dogDraw(dk), x: dp[0], y: dp[1], z: dp[2], w: 0.7, h: 0.5 });
      break;
    }
    case 10: { // fishermen on the quay: one coils a rope, one waves to a boat
      fig(out, cam, mk(50, modern(3), "quay1"), at("town", 22, 0, -2.5), f, { mode: "stand", expr: "neutral", prop: "hold", tilt: 4 * Math.sin(f * 0.1) });
      fig(out, cam, mk(51, modern(2), "quay2"), at("town", 34, 0, -3.5), f, { mode: "stand", expr: "grin", wave: q(0.5 + 0.5 * Math.sin(f * 0.3), 4) });
      break;
    }
    case 11: { // the vendor holds up a fish on "jobs"; on "view" a gull swoops in and takes it
      const took = f >= GULL_F + 2;
      fig(out, cam, mk(60, VENDOR, "vendor"), [MARKET[0] - 0.15, 0, MARKET[2] + 0.75], f, { mode: "stand", expr: took ? "shock" : f > cue(W.jobs) ? "grin" : "smile", prop: f > cue(W.jobs) - 6 ? (took ? "fishless" : "fish") : "hold", facing: 0 });
      fig(out, cam, mk(61, modern(5), "customer"), [MARKET[0] - 0.75, 0, MARKET[2] - 2.2], f, { mode: "stand", back: true });
      for (let i = 0; i < 6; i++) fig(out, cam, mk(62 + i, modern(i + 7), "shopper" + i), [MARKET[0] - 8 + i * 3.1, 0, MARKET[2] + 1.5 + 3.5 * hh(i, 9)], f, { mode: "stand", expr: "neutral", facing: i % 2 ? 1 : -1 }, { scale: 0.97 });
      const u = (f - (GULL_F - 10)) / 28;
      if (u > 0 && u < 1) {
        const hand: V3 = [MARKET[0] + 0.12, 2.25, MARKET[2] + 0.8], a: V3 = [hand[0] + 3.5, 5.5, hand[2] + 3], c: V3 = [hand[0] - 2.5, 6.5, hand[2] + 9];
        const pnt = u < 0.36 ? lerp3(a, hand, smooth(u / 0.36)) : lerp3(hand, c, smooth((u - 0.36) / 0.64));
        const k = q((f % 6) / 6, 6);
        out.fx.push({ key: `gull${k}${u > 0.36}`, cw: 220, ch: 140, draw: gullDraw(k, u > 0.36), x: pnt[0], y: pnt[1], z: pnt[2], w: 0.9, h: 0.57 });
      }
      break;
    }
    case 12: case 13: { // the man on the forgotten stone eats his rice ball; a sparrow pecks his crumbs
      const chew = Math.floor(f / 9) % 2;
      fig(out, cam, mk(70, LUNCH, "lunch"), [OLDSTONE[0] - 0.02, 0.7, OLDSTONE[2] + 0.12], f, { mode: "sit", expr: chew ? "smile_closed" : "grin", prop: "onigiri", facing: 1, headTilt: -4 }, { shadow: false });
      if (id === 13 || f > 900) {
        const hop = ((f - 900) / 22) % 1, k = q(hop, 8), x = OLDSTONE[0] + 0.55 + 0.08 * (Math.floor((f - 900) / 22) % 3);
        out.fx.push({ key: `sparrow${k}`, cw: 128, ch: 112, draw: sparrowDraw(k), x, y: 0.09 + 0.05 * Math.max(0, Math.sin(hop * Math.PI)), z: OLDSTONE[2] + 0.75, w: 0.16, h: 0.14 });
      }
      break;
    }
    case 14: { // dawn up the hill: a woman opens a shutter, a man stretches on his porch
      fig(out, cam, mk(80, modern(1), "dawnWoman"), off(houseAt(0), 1.6, 3.6), f, { mode: "stand", expr: "smile_closed", reach: 0.8 });
      fig(out, cam, mk(81, modern(4), "dawnMan"), off(houseAt(7), -1.2, 3.8), f, { mode: "stand", expr: "yawn", cheer: q(0.6 + 0.4 * Math.sin(f * 0.06), 4) });
      break;
    }
    case 15: { // two fishermen walk down the steep path toward the boats, one with a net, one with an oar
      const w = (f - 1088) / 30 * 1.1;
      walker(out, cam, mk(82, { ...modern(0), jacket: "#e8a030" }, "fishA"), onPath(STONE_U - 7 - w, 0.45, 0), f, [0.1, 1], { mode: "march", phase: q((f / 30 * 1.6) % 1, 16), stride: 0.8, carry: "net", expr: "grin" });
      walker(out, cam, mk(83, { ...modern(3), jacket: "#2f5f9a" }, "fishB"), onPath(STONE_U - 8.4 - w, -0.55, 0), f, [0.1, 1], { mode: "march", phase: q((f / 30 * 1.6 + 0.4) % 1, 16), stride: 0.8, carry: "oar", expr: "smile" });
      break;
    }
    case 16: case 17: { // the old couple at the low table; the cup rattles, she looks up
      const shk = f >= SHAKE_F;
      fig(out, cam, mk(90, GRANDPA, "grandpa"), at("room", -0.32, 0.06, 0.62), f, { mode: "sit", back: true, nod: shk ? 0 : 0.3, headTilt: shk ? 6 : 0 }, { shadow: false });
      fig(out, cam, mk(91, GRANDMA, "grandma"), at("room", 0.62, 0.06, -1.02), f, { mode: "sit", expr: shk ? (f > SHAKE_F + 12 ? "shock" : "nervous") : "smile_closed", prop: shk ? null : "drink", facing: -1, look: shk ? -1 : 0 }, { shadow: false });
      break;
    }
    case 19: { // spray along the wave front sweeping in over the rooftops (nobody anywhere near)
      const fz = townFrontAt(f);
      if (fz < 140) for (let i = 0; i < 26; i++) {
        const x = OFF.town - 380 + 760 * hh(i, 51), u = ((t * 1.3 + hh(i, 52)) % 1), k = q(u, 8);
        out.fx.push({ key: `spray${k}`, cw: 128, ch: 128, draw: sprayDraw(k), x, y: SEA_TOWN + 12.5 * 1.3 + 4 * u, z: fz + 3 + 4 * u, w: 16 + 10 * u, h: 12 + 8 * u, soft: true });
      }
      break;
    }
    case 20: { // people run uphill past the lens; far below the foaming water climbs
      for (let i = 0; i < 7; i++) {
        const sp = 3.2 + 0.9 * hh(i, 31), u = STOP_U + 9 + sp * (f - 1400) / 30 + 4 * hh(i, 32), dx = (hh(i, 33) - 0.5) * 2.6;
        if (u > STOP_U + 30) continue;
        const p = onPath(u, dx, 0), o = i === 3 ? { ...modern(i), build: "kid" as const } : modern(i + 2);
        fig(out, cam, mk(100 + i, o, "runner" + i), p, f, { mode: "march", phase: q(((f / 30) * 2.4 + hh(i, 34)) % 1, 16), lift: 80, expr: i % 3 ? "nervous" : "pained", tilt: -4, facing: dx > 0 ? -1 : 1 }, { scale: i === 3 ? 0.85 : 1 });
      }
      break;
    }
    case 21: { // a villager by the stone watches the water stop far below (backs to the lens); two more further up
      fig(out, cam, mk(110, modern(6), "watcherStone"), G(onStone(1.0, 0, 0.35)), f, { mode: "stand", back: true, nod: f > cue(W.stops) + 20 ? 0.2 : 0.5 });
      fig(out, cam, mk(111, modern(1), "watcher2"), onPath(STONE_U + 6, 1.2, 0), f, { mode: "stand", back: true, nod: 0.4 });
      fig(out, cam, mk(112, modern(8), "watcher3"), onPath(STONE_U + 7, 2.2, 0), f, { mode: "stand", back: true, prop: "shoulder" });
      break;
    }
    case 22: { // sunset: a kid waves from a porch, a grandmother by her door, smoke from the chimneys
      fig(out, cam, mk(120, { ...modern(4), build: "kid" }, "kidWave"), off(houseAt(2), 1.5, 4.2), f, { mode: "stand", expr: "grin", wave: q(0.5 + 0.5 * Math.sin(f * 0.35), 4) });
      fig(out, cam, mk(121, GRANDMA, "grandmaEnd"), off(houseAt(8), -1.4, 4.0), f, { mode: "stand", expr: "smile_closed", facing: -1 });
      for (const i of [0, 2, 4, 7, 9]) { const p = houseAt(i); for (let k = 0; k < 3; k++) { const u = ((t * 0.25 + k / 3 + hh(i, 41)) % 1); out.fx.push({ key: `smoke${q(u, 10)}`, cw: 128, ch: 128, draw: smokeDraw(q(u, 10)), x: p[0] + 1.2 + 0.6 * u, y: p[1] + 8.4 + 3.5 * u, z: p[2] - 1.5, w: 1.6 + 1.6 * u, h: 1.6 + 1.6 * u, soft: true }); } }
      break;
    }
  }
  return out;
};

// Our cast as lit flat sprites in the 3D world (ice short: Tudor, the cutters, the townspeople, the newsboy, the guard,
// the Calcutta market). Each frame every character asks for a drawing (a key + a draw call); the pool keeps one canvas
// per distinct drawing. Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side
// gradient toward the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects
// (sweat, drips, the bulb, sawdust, warm air) are unlit cards. Cards, effects and blobs live on the NOINK layer so the
// world ink pass never outlines their quads. Infrastructure (pool, cards, tiers, blinks, blobs) is the template's.
import * as THREE from "three";
import { Pen, bodyFront, bodySide, STEFAN, STEFAN_BEACH, crowd, friend, courier, clerk, INK, SKINS, fxShadow, fxContact, fxStars, fxPuff, fxBurst, fxDrop, Outfit, Expr, FrontOpts, SideOpts } from "./toon";
import { FPS, SHOTS, V3, W, HALL, FLAT_STEFAN, OFF, FAINT, faintAt, clamp01, FLAT, ROOM, KIOSK, STATION, WARE, OFFICE, cue, SEAT, DESK, WIN_F, PARROT_F, smooth, at } from "./story";
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
let LNAME: "day" | "golden" | "night" | "interior" = "day";
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
const CONTACT: Record<"day" | "golden" | "night" | "interior", [number, number, number]> = { day: [0.22, 0.2, 0.22], golden: [0.24, 0.17, 0.24], night: [0.12, 0.11, 0.2], interior: [0.24, 0.21, 0.26] };
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


// ---------------- the mandel short cast ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const ME = 7; // Stefan's index (blink seed, head-shape seed = story.ts STEFAN_SEED): the same bean head in every shot
const STEF: Who = { i: ME, o: STEFAN, okey: "stefan" };
const mk = (i: number, o: Outfit, okey: string): Who => ({ i, o, okey });
/** the neighbour who faints: a stout presenter in a plum suit with a moustache */
const NEIGH: Who = mk(11, { jacket: "#6a3a5a", pants: "#3a2e3a", boots: "#231c22", hat: "hair", hair: "#5a3b2a", moustache: "#3a2a20", build: "stout", tie: "#f2c94a", skin: "#f5c9a0" }, "neigh");

/** a front-facing figure standing (or sitting / falling) at p */
const fig = (out: Stage, cam: CamInfo, who: Who, p: V3, f: number, fo: FrontOpts, o: { flip?: boolean; shadow?: boolean; scale?: number; roll?: number; pitch?: number } = {}) => {
  const t = f / FPS, fo2: FrontOpts = { blink: lidAt(t, who.i, SWAPS[SHOTS.findIndex((s) => f >= s.a && f < s.b) + 1]), ...fo };
  const pl = person(cam, who, p[0], p[1], p[2], { side: false, mirror: false, flip: o.flip }, fo2, {}, o.scale ?? 1);
  if (o.roll) pl.roll = o.roll;
  if (o.pitch) pl.pitch = o.pitch;
  out.places.push(pl);
  if (o.shadow !== false) blob(out, p[0], p[1], p[2], o.scale ?? 1);
  return fo2;
};

// ---- falling paper: confetti and lottery tickets (unlit cut-out cards, spinning, fluttering) ----
const CONF = ["#e2453c", "#f2c94a", "#3f8ad8", "#4fb36a", "#e86aa8", "#ffffff", "#f28a2c", "#8a5ad8"];
const confDraw = (c: string) => (p: Pen) => { p.g.fillStyle = c; p.g.fillRect(2, 2, 28, 16); };
const ticketDraw = (p: Pen) => {
  const g = p.g; g.fillStyle = "#fff8e6"; g.fillRect(2, 2, 92, 44); g.fillStyle = "#2f7a54"; g.fillRect(2, 2, 92, 12);
  g.fillStyle = "#c23a2a"; for (let i = 0; i < 6; i++) g.fillRect(10 + i * 13, 24, 8, 8); g.strokeStyle = "#2a2a3a"; g.lineWidth = 2; g.strokeRect(2, 2, 92, 44);
};
/** n pieces raining through a box (x0..x1, z0..z1, falling from yTop to the floor), deterministic in t */
const rain = (out: Stage, t: number, n: number, seed: number, box: [number, number, number, number, number], ticket = false) => {
  const [x0, x1, z0, z1, yTop] = box;
  for (let i = 0; i < n; i++) {
    const v = (ticket ? 0.45 : 0.6) + 0.45 * hh(i, seed + 3), H = yTop + 0.5, ph = hh(i, seed + 4) * H;
    const y = yTop - ((t * v + ph) % H);
    const x = x0 + (x1 - x0) * hh(i, seed + 1) + 0.18 * Math.sin(t * 2.6 + i * 1.7), z = z0 + (z1 - z0) * hh(i, seed + 2) + 0.1 * Math.cos(t * 2.1 + i);
    const flip = Math.abs(Math.cos(t * (5 + 3 * hh(i, seed + 5)) + i)), rot = t * (hh(i, seed + 6) - 0.5) * 9 + i;
    if (ticket) out.fx.push({ key: "ticket", cw: 96, ch: 48, draw: ticketDraw, x, y, z, w: 0.15, h: 0.075 * Math.max(0.2, flip), rot });
    else { const c = CONF[i % CONF.length]; out.fx.push({ key: "conf" + c, cw: 32, ch: 20, draw: confDraw(c), x, y, z, w: 0.05, h: 0.031 * Math.max(0.15, flip), rot }); }
  }
};

/** the hook in the lottery hall: Stefan, the fainting neighbour, the crowd, the falling paper */
const hallCast = (out: Stage, cam: CamInfo, f: number, t: number) => {
      // Stefan: calm, reading his page of maths (the hold grip), not smiling, the cheque under his arm (sets.ts)
      fig(out, cam, STEF, HALL.stefan, f, { mode: "stand", expr: "neutral", prop: "hold", headTilt: -3 + 1.5 * Math.sin(f * 0.05), facing: 0 });
      // the neighbour: cheers, goes rigid, topples backwards-right into the confetti heap (gag, on "never")
      const k = faintAt(f), [nx, ny, nz] = HALL.neighbour;
      if (k <= 0) fig(out, cam, NEIGH, HALL.neighbour, f, { mode: "stand", expr: "laugh", cheer: q(0.5 + 0.5 * Math.sin(f * 0.55), 4), facing: -1 });
      else {
        // stiff as a board he tips back and to the right (card pitch + roll about the feet) into the heap behind him
        const fall = Math.min(1, k), settle = k >= 1 ? 0.04 * Math.sin((f - FAINT[1]) * 0.9) * Math.exp(-(f - FAINT[1]) / 6) : 0;
        fig(out, cam, NEIGH, [nx + 0.08 * fall, ny, nz - 0.05 * fall], f, { mode: "stand", expr: fall > 0.3 ? "dazed" : "shock", facing: -1, cheer: fall < 0.3 ? 1 : undefined },
          { roll: -0.62 * fall + settle, pitch: -1.0 * fall, shadow: fall < 0.4 });
        const land: V3 = [nx + 0.75, 0.55, nz - 1.0];
        if (k >= 1) { // circling stars over his head where it landed
          const u = ((f - FAINT[1]) / 24) % 1;
          out.fx.push({ key: `stars${q(u, 24)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 24)), x: land[0], y: land[1] + 0.45, z: land[2], w: 0.62, h: 0.31 });
        }
        const pu = (f - FAINT[1] + 2) / 14;
        if (pu > 0 && pu < 1) out.fx.push({ key: `puff${q(pu, 14)}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, q(pu, 14)), x: land[0], y: 0.35, z: land[2] + 0.3, w: 1.3, h: 1.3, soft: true });
        if (pu > 0 && pu < 1.6) for (let i = 0; i < 30; i++) { // a burst of confetti thrown up by the landing
          const a = 0.25 + hh(i, 41) * (Math.PI - 0.5), sp = 1.6 + 1.6 * hh(i, 42), tt = (f - FAINT[1] + 2) / FPS, c = CONF[i % CONF.length];
          const y = 0.4 + sp * Math.sin(a) * tt - 2.4 * tt * tt;
          if (y > 0.02) out.fx.push({ key: "conf" + c, cw: 32, ch: 20, draw: confDraw(c), x: land[0] + sp * Math.cos(a) * tt * 0.7, y, z: land[2] + 0.3 + (hh(i, 43) - 0.5) * 0.5, w: 0.05, h: 0.03, rot: tt * 12 + i });
        }
      }
      // the crowd: 7 rows on the risers (story HALL), ~20 per row, cheering with both arms, a few waving or pointing
      HALL.rows.forEach((z, r) => {
        const n = 21, y = r * HALL.riserH;
        for (let j = 0; j < n; j++) {
          const i = r * n + j, x = -4.6 + (9.2 * (j + 0.5 * (r % 2))) / n + (hh(i, 7) - 0.5) * 0.14, zz = z + (hh(i, 8) - 0.5) * 0.16;
          if (r === 0 && Math.abs(x) < 1.6) continue; // keep the front row clear behind Stefan and the neighbour
          const who = mk(100 + (i % 23), crowd(i % 23), "crowd" + (i % 23)), b = 0.5 + 0.5 * Math.sin(f * (0.42 + 0.12 * hh(i, 9)) + i * 1.7);
          const expr: Expr = (["laugh", "grin", "relief_open", "laugh", "shock"] as Expr[])[i % 5];
          const wave = i % 6 === 2;
          fig(out, cam, who, [x, y, zz], f, { mode: "stand", expr, facing: (hh(i, 10) < 0.5 ? -1 : 1), ...(wave ? { wave: q(b, 4) } : i % 9 === 4 ? { prop: "point" as const } : { cheer: q(b, 4) }),
            tilt: -3 + 6 * q(b, 4) * (hh(i, 11) - 0.5) }, { scale: 0.93 + 0.12 * hh(i, 12), shadow: r < 2 });
        }
      });
      // confetti and tickets raining over everyone
      rain(out, t, 240, 1, [-4.2, 4.2, -6.8, 2.6, 6.2]);
      rain(out, t, 46, 2, [-3.8, 3.8, -6.0, 2.2, 6.0], true);
};

// ---- the rest of the cast ----
const FRIENDS: Who[] = [0, 1, 2, 3].map((v) => mk(30 + v, friend(v), "friend" + v));
const LANDLADY: Who = mk(40, { jacket: "#6a4a5a", pants: "#3a3036", boots: "#2a2024", hat: "hair", hair: "#8a8a92", dress: "#7a5a6a", skin: "#f5c9a0", build: "stout" }, "landlady");
const CLERK_K: Who = mk(41, clerk(0), "clerkK");
const CLERK_V: Who = mk(42, clerk(1), "clerkV");
const GUARD_V: Who = mk(43, { jacket: "#24346a", pants: "#24283a", boots: "#1a1a20", hat: "cap", cap: "#24346a", belt: "#1a1a20", buttons: "#d9c27a", moustache: "#3a2a20", build: "stout", skin: "#c99067" }, "guardV");
const OPER: Who = mk(44, { jacket: "#4a5a6a", pants: "#3a3a44", boots: "#2a2428", hat: "flatcap", cap: "#5a5248", belt: "#8a5a3a", skin: "#ecd0b6" }, "oper");
const OPER2: Who = mk(45, { jacket: "#6a4a3a", pants: "#3a3a44", boots: "#2a2428", hat: "cap", cap: "#c23a2a", skin: "#f5c9a0" }, "oper2");
const OFFICIALS: Who[] = [0, 1, 2].map((v) => mk(50 + v, { jacket: ["#3a3f52", "#4a3a3a", "#3a4a3a"][v], pants: "#2a2a32", boots: "#1a1a20", hat: "hair", hair: ["#8a8a92", "#2a1d18", "#5a3b2a"][v],
  tie: ["#c23a2a", "#2f4a8a", "#c9a441"][v], glasses: v === 0 ? INK : undefined, moustache: v === 1 ? "#2a1d18" : undefined, build: v === 1 ? "stout" : "adult", skin: SKINS[v] }, "official" + v));
const STEF_B: Who = { i: ME, o: STEFAN_BEACH, okey: "stefanBeach" };
const STEF_B2: Who = { i: ME, o: { ...STEFAN_BEACH, pencil: false }, okey: "stefanBeachNoPencil" };
const STEF_NP: Who = { i: ME, o: STEFAN, okey: "stefan" };

/** a side-view figure (walking / running / standing in profile), facing screen right unless `left` */
const side = (out: Stage, cam: CamInfo, who: Who, p: V3, f: number, so: SideOpts, left: boolean, o: { scale?: number; shadow?: boolean } = {}) => {
  const t = f / FPS, so2: SideOpts = { blink: lidAt(t, who.i), ...so };
  out.places.push(person(cam, who, p[0], p[1], p[2], { side: true, mirror: left }, {}, so2, o.scale ?? 1));
  if (o.shadow !== false) blob(out, p[0], p[1], p[2], o.scale ?? 1);
};

// ---- effect drawings (unlit cards) ----
const mothDraw = (k: number) => (p: Pen) => {
  const g = p.g, w = 0.4 + 0.6 * Math.abs(Math.sin(k * Math.PI));
  g.fillStyle = "#b8b0a0"; g.strokeStyle = "#3a3030"; g.lineWidth = 3;
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 22, 52, 24, 30 * w, s * 0.5, 0, Math.PI * 2); g.fill(); g.stroke(); }
  g.fillStyle = "#5a4a40"; g.beginPath(); g.ellipse(64, 64, 7, 20, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#3a3030"; g.beginPath(); g.moveTo(60, 46); g.lineTo(50, 30); g.moveTo(68, 46); g.lineTo(78, 30); g.stroke();
};
const steamDraw = (t: number) => (p: Pen) => {
  const g = p.g;
  for (let i = 0; i < 4; i++) { const a = 0.3 + i * 0.5, d = 30 + 70 * t, r = (26 + 10 * (i % 2)) * (1 - 0.5 * t); g.fillStyle = `rgba(255,255,255,${(0.95 * (1 - t)).toFixed(3)})`; g.beginPath(); g.arc(64 + d * Math.cos(a) * 0.4, 120 - d * Math.sin(a + 0.6), r, 0, Math.PI * 2); g.fill(); }
};
const streakDraw = (p: Pen) => { const g = p.g; g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.lineCap = "round"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(10, 20 + i * 22); g.lineTo(110 - i * 12, 20 + i * 22); g.stroke(); } };
const hatDraw = (c: string) => (p: Pen) => { const g = p.g; g.fillStyle = c; g.strokeStyle = "#241726"; g.lineWidth = 6; g.beginPath(); g.ellipse(64, 70, 50, 26, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.ellipse(64, 70, 60, 10, 0, 0, Math.PI * 2); g.fill(); g.stroke(); };
const kangarooDraw = (k: number) => (p: Pen) => {
  const g = p.g, up = Math.sin(k * Math.PI);
  g.fillStyle = "#c08a5a"; g.strokeStyle = "#241726"; g.lineWidth = 6;
  g.beginPath(); g.ellipse(120, 140 - 20 * up, 46, 60, -0.35, 0, Math.PI * 2); g.fill(); g.stroke();                // body
  g.beginPath(); g.ellipse(160, 70 - 20 * up, 22, 18, -0.2, 0, Math.PI * 2); g.fill(); g.stroke();                   // head
  g.beginPath(); g.ellipse(160, 44 - 20 * up, 6, 16, 0.2, 0, Math.PI * 2); g.fill(); g.stroke();                     // ear
  g.beginPath(); g.moveTo(80, 170 - 20 * up); g.quadraticCurveTo(30, 200, 10, 230); g.stroke();                      // tail
  g.beginPath(); g.moveTo(110, 190 - 20 * up); g.lineTo(150, 236 - 6 * up); g.lineTo(190, 236 - 6 * up); g.stroke(); // legs
  g.fillStyle = "#241726"; g.beginPath(); g.arc(168, 66 - 20 * up, 3.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#3a3a40"; g.beginPath(); g.ellipse(158, 50 - 20 * up, 24, 9, -0.2, 0, Math.PI * 2); g.fill(); g.fillRect(146, 32 - 20 * up, 22, 18); // Stefan's hat on its head
};
const parrotDraw = (k: number, pencil: boolean) => (p: Pen) => {
  const g = p.g, w = Math.sin(k * Math.PI * 2);
  g.strokeStyle = "#241726"; g.lineWidth = 5;
  g.fillStyle = "#3aa04a"; g.beginPath(); g.moveTo(70, 70); g.lineTo(20, 70 - 50 * w); g.lineTo(90, 80); g.closePath(); g.fill(); g.stroke(); // wing
  g.fillStyle = "#e2453c"; g.beginPath(); g.ellipse(80, 80, 40, 22, -0.2, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(118, 66, 18, 16, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#f2c94a"; g.beginPath(); g.moveTo(132, 64); g.lineTo(150, 72); g.lineTo(132, 78); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#2f6ab5"; g.beginPath(); g.moveTo(44, 86); g.lineTo(6, 104); g.lineTo(44, 96); g.closePath(); g.fill(); g.stroke();
  if (pencil) { g.save(); g.translate(150, 74); g.rotate(0.3); g.fillStyle = "#f2c230"; g.fillRect(0, -5, 52, 10); g.fillStyle = "#e88a9a"; g.fillRect(52, -5, 8, 10); g.restore(); }
};
const glintDraw = (t: number) => (p: Pen) => fxBurst(p, t, "#fff8d0", 8, 30, 210);

/** everything with a face (and the effects) in shot `id` at frame f */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  switch (id) {
    case 1: case 2: hallCast(out, cam, f, t); break;
    case 3: fig(out, cam, STEF, [FLAT_STEFAN[0], SEAT, FLAT_STEFAN[2]], f, { mode: "sit", expr: "neutral", headTilt: -6 }, { shadow: false }); snow(out, t); break;
    case 4: { // broke: pockets out, a moth flies out; the landlady's head in the foreground (profile, facing him)
      fig(out, cam, STEF, FLAT.standing, f, { mode: "stand", expr: f > cue(W.broke) ? "nervous" : "neutral", prop: "pockets", headTilt: 2 * Math.sin(f * 0.1) });
      side(out, cam, LANDLADY, FLAT.landlady, f, { mode: "stand", expr: "stern" }, true, { shadow: false });
      const u = (f - cue(W.broke)) / 40;
      if (u > 0 && u < 1) out.fx.push({ key: `moth${q(f % 6 / 6, 6)}`, cw: 128, ch: 128, draw: mothDraw(q((f % 6) / 6, 6)), x: FLAT.standing[0] + 0.25 + 0.4 * u, y: 0.95 + 1.3 * u, z: FLAT.standing[2] + 0.1, w: 0.14, h: 0.14 });
      snow(out, t);
      break;
    }
    case 5: { // the newspaper headline: the pencil springs up like an antenna on "weird"
      const k = (f - cue(W.weird)) / 6, up = k <= 0 ? 0 : k < 1 ? k : 1 + 0.15 * Math.sin((k - 1) * 3) * Math.exp(-(k - 1) * 0.6);
      fig(out, cam, STEF, [FLAT_STEFAN[0], SEAT, FLAT_STEFAN[2]], f, { mode: "sit", expr: k > 0 ? "stern" : "neutral", headTilt: -3, pencilUp: up, look: 0 }, { shadow: false });
      snow(out, t);
      break;
    }
    case 6: fig(out, cam, STEF, ROOM.stefan, f, { mode: "stand", expr: "smile", prop: "point", facing: -1 }); break;
    case 7: { // "Everyone says it's crazy": a finger twirled at the temple, a laugh, spiral eyes
      fig(out, cam, STEF, [FLAT_STEFAN[0], SEAT, FLAT_STEFAN[2]], f, { mode: "sit", expr: "smile" }, { shadow: false });
      const cz = f >= cue(W.crazy);
      fig(out, cam, FRIENDS[0], FLAT.friends[0], f, { mode: "stand", expr: "laugh", prop: "point", headTilt: 6 * Math.sin(f * 0.4), facing: 1 });
      fig(out, cam, FRIENDS[1], FLAT.friends[1], f, { mode: "stand", expr: cz ? "dazed" : "grin", facing: -1, tilt: cz ? 4 * Math.sin(f * 0.6) : 0 });
      fig(out, cam, FRIENDS[2], FLAT.friends[2], f, { mode: "stand", expr: "laugh", cheer: q(0.5 + 0.5 * Math.sin(f * 0.5), 4) });
      snow(out, t);
      break;
    }
    case 8: { // a friend sinks into the ticket mountain up to his hat
      const sink = smooth((f - 482) / 30), [mx, , mz] = ROOM.mountain;
      fig(out, cam, FRIENDS[1], [mx + 0.1, 1.42 - 1.0 * sink, mz + 0.3], f, { mode: "stand", expr: sink > 0.3 ? "shock" : "nervous", cheer: q(sink, 4) }, { shadow: false });
      rain(out, t, 40, 7, [mx - 1.5, mx + 1.5, mz - 1.2, mz + 1.2, 3.5], true);
      break;
    }
    case 9: case 10: { // the friends fill tickets by hand (OTS past a friend's profile); the win: hats fly, WINS: 1
      const win = id === 10 && f >= WIN_F;
      fig(out, cam, STEF, [FLAT_STEFAN[0], SEAT, FLAT_STEFAN[2]], f, { mode: "sit", expr: win ? "smile_closed" : "neutral" }, { shadow: false });
      FLAT.seated.forEach((p, i) => fig(out, cam, win ? mk(30 + i, { ...friend(i), hat: "hair" }, "friendNoHat" + i) : FRIENDS[i], win ? [p[0], 0, p[2]] : p, f,
        win ? { mode: "stand", expr: "relief_open", cheer: q(0.5 + 0.5 * Math.sin(f * 0.6 + i), 4) } : { mode: "sit", expr: i ? "pained" : "neutral", facing: i ? -1 : 1 }, { shadow: false }));
      if (id === 9) side(out, cam, FRIENDS[3], FLAT.fgFriend, f, { mode: "stand", expr: "neutral" }, true, { shadow: false });
      if (!win) {
        for (let i = 0; i < 2; i++) { const p = FLAT.seated[i]; out.fx.push({ key: "streak", cw: 128, ch: 112, draw: streakDraw, x: p[0] * 0.5 + OFF.flat * 0.5 + (i ? 0.25 : -0.25), y: DESK.h + 0.08, z: p[2] + 0.12, w: 0.28, h: 0.24, rot: Math.sin(f * 1.7 + i) * 0.4 }); }
        const su = ((f - cue(W.hand) + 30) / 24) % 1;
        if (f > cue(W.hand) - 30) for (const sx of [-1, 1]) out.fx.push({ key: `steam${q(su, 12)}`, cw: 128, ch: 128, draw: steamDraw(q(su, 12)), x: FLAT.seated[1][0] + sx * 0.18, y: FLAT.seated[1][1] + 1.05 + 0.2 * su, z: FLAT.seated[1][2], w: 0.22, h: 0.22, soft: true });
      } else {
        const u = (f - WIN_F) / 22;
        if (u < 1) FLAT.seated.forEach((p, i) => out.fx.push({ key: "hat" + i, cw: 128, ch: 112, draw: hatDraw(friend(i).cap ?? "#5a5248"), x: p[0] + 0.1 * u * (i ? 1 : -1), y: 1.65 + 1.4 * u - 0.9 * u * u, z: p[2], w: 0.28, h: 0.24, rot: u * 6 * (i ? 1 : -1) }));
        const gt = ((f - WIN_F) % 20) / 20;
        out.fx.push({ key: `glint${q(gt, 10)}`, cw: 500, ch: 500, draw: glintDraw(q(gt, 10)), x: FLAT_STEFAN[0], y: 1.05, z: FLAT_STEFAN[2] + 0.25, w: 0.5, h: 0.5, soft: true, glow: 1.4 });
      }
      break;
    }
    case 11: case 12: { // Melbourne: Stefan (and his hat) by the kiosk; a kangaroo hops off with the hat; the clerk turns green
      const hatGone = f >= 672;
      fig(out, cam, hatGone ? STEF_NP : mk(ME, { ...STEFAN, hat: "flatcap", cap: "#4a4a52" }, "stefanHat"), KIOSK.stefan, f, { mode: "stand", expr: id === 12 ? "smile" : hatGone ? "shock" : "neutral", facing: 1 });
      if (id === 11) {
        const u = (f - 664) / 34;
        if (u > 0 && u < 1) { const hop = (u * 4) % 1; out.fx.push({ key: `roo${q(hop, 8)}`, cw: 256, ch: 256, draw: kangarooDraw(q(hop, 8)), x: KIOSK.stefan[0] + 0.3 + 5.5 * u, y: 0.12 + 0.55 + 0.5 * Math.sin(hop * Math.PI), z: KIOSK.stefan[2] - 0.4, w: 1.1, h: 1.1 }); }
      }
      const green = id === 12 && f >= cue(W.twelve);
      fig(out, cam, CLERK_K, KIOSK.clerk, f, { mode: "stand", expr: green ? "stern" : "neutral", tint: green ? "#5ac25a" : undefined, facing: -1 }, { shadow: false });
      for (let i = 0; i < 4; i++) fig(out, cam, mk(60 + i, crowd(i + 3), "crowd" + (i + 3)), at("kiosk", -6 + i * 3.4, 0.12, -11.4 + (i % 2) * 0.6), f, { mode: "stand", expr: "neutral" }, { scale: 0.95 });
      break;
    }
    case 13: { // 1992: Stefan before the map, his glasses glint on "target"
      fig(out, cam, STEF, ROOM.mapStefan, f, { mode: "stand", expr: f > cue(W.target) - 10 ? "smile" : "neutral", facing: -1 });
      const gu = (f - cue(W.target)) / 10;
      if (gu > 0 && gu < 1) out.fx.push({ key: `glint${q(gu, 10)}`, cw: 500, ch: 500, draw: glintDraw(q(gu, 10)), x: ROOM.mapStefan[0] + 0.16, y: 1.55, z: ROOM.mapStefan[2] + 0.12, w: 0.35, h: 0.35, soft: true, glow: 1.6 });
      break;
    }
    case 14: { // the security guard's jaw drops as the jackpot rolls up
      fig(out, cam, GUARD_V, STATION.guard, f, { mode: "stand", expr: f > cue(W.twentyseven) + 6 ? "shock" : "neutral", facing: 1 }, { shadow: false });
      couriersIdle(out, cam, f);
      break;
    }
    case 15: fig(out, cam, STEF, at("wall", -6.6, 0, -1.4), f, { mode: "stand", expr: "smile", facing: -1 }); break;
    case 17: { // OTS past an operator's profile; the press spits tickets into the other operator's face
      fig(out, cam, OPER, WARE.operator, f, { mode: "stand", expr: f > cue(W.prints) + 10 ? "pained" : "neutral", facing: 1 });
      side(out, cam, OPER2, WARE.fgOperator, f, { mode: "stand", expr: "neutral" }, true, { shadow: false });
      for (let i = 0; i < 18; i++) {
        const u = (((f - cue(W.prints)) / 30 + i / 18) % 1);
        if (f < cue(W.prints)) break;
        out.fx.push({ key: "ticket", cw: 96, ch: 48, draw: ticketDraw, x: WARE.operator[0] + 0.05 + 0.3 * u, y: 1.0 + 0.6 * u + 0.1 * Math.sin(i), z: WARE.operator[2] - 0.8 + 0.85 * u, w: 0.14, h: 0.07, rot: i + u * 6 });
      }
      break;
    }
    case 19: { // the courier army runs between the pumps and the store; the clerk is buried by the avalanche
      for (let i = 0; i < 72; i++) {
        const dir = i % 2 ? 1 : -1, v = 2.6 + 1.4 * hh(i, 71), lane = -3.1 + 6.2 * hh(i, 72), off = 22 * hh(i, 73);
        const x = dir > 0 ? -11 + ((t * v + off) % 22) : 11 - ((t * v + off) % 22);
        if (Math.abs(x - 0) < 1.1 && Math.abs(lane - 0.5) < 0.6) continue; // not through the pump islands
        side(out, cam, mk(70 + (i % 15), courier(i % 15), "courier" + (i % 15)), at("station", x, 0, lane), f,
          { mode: "march", phase: q(((t * v) / 1.6 + hh(i, 74)) % 1, 16), stride: 1.3, expr: i % 3 ? "grin" : "shock" }, dir < 0, { scale: 0.95 + 0.1 * hh(i, 75) });
      }
      fig(out, cam, CLERK_V, STATION.clerk, f, { mode: "stand", expr: "shock", cheer: 1 }, { shadow: false });
      break;
    }
    case 20: { // three days: the clock races (speed streaks); the clerk sweats behind the counter
      fig(out, cam, CLERK_V, STATION.clerk, f, { mode: "stand", expr: "nervous", facing: 0 }, { shadow: false });
      sweat(out, cam, STATION.clerk, f, 3, 1.6, 4);
      for (let i = 0; i < 3; i++) out.fx.push({ key: "streak", cw: 128, ch: 112, draw: streakDraw, x: STATION.clock[0] + 0.42 * Math.cos(f * 0.5 + i * 2.1), y: STATION.clock[1] + 0.42 * Math.sin(f * 0.5 + i * 2.1), z: STATION.clock[2] + 0.08, w: 0.28, h: 0.24, rot: f * 0.5 + i * 2.1 + Math.PI / 2 });
      break;
    }
    case 21: { // out of time: a courier keels over, tongue out
      const k = smooth((f - cue(W.run) - 6) / 14);
      fig(out, cam, mk(71, courier(1), "courier1"), ROOM.courier, f, { mode: "stand", expr: k > 0.2 ? "lick" : "pained", facing: -1 }, { roll: 0.5 * k, pitch: -1.2 * k, shadow: k < 0.4 });
      if (k < 0.2) sweat(out, cam, ROOM.courier, f, 3, 1.6, 5);
      break;
    }
    case 22: { // the winning ticket glints in the pile; Stefan sips his tea calmly beside the chaos
      fig(out, cam, STEF, WARE.stefan, f, { mode: "stand", expr: "smile_closed", prop: "drink", facing: -1 });
      const gu = (f % 24) / 24;
      out.fx.push({ key: `glint${q(gu, 12)}`, cw: 500, ch: 500, draw: glintDraw(q(gu, 12)), x: WARE.gold[0], y: WARE.gold[1] + 0.05, z: WARE.gold[2], w: 0.6, h: 0.6, soft: true, glow: 1.6 });
      for (let i = 0; i < 3; i++) side(out, cam, mk(72 + i, courier(i + 2), "courier" + (i + 2)), at("warehouse", -3.5 + i * 1.3, 0, 2.6 + 0.3 * i), f, { mode: "march", phase: q((t * 1.8 + i * 0.3) % 1, 16), stride: 1.1, expr: "nervous" }, i % 2 === 1);
      break;
    }
    case 23: case 24: { // the officials change the rules: one points, one fumes (steam from the ears)
      OFFICIALS.forEach((who, i) => fig(out, cam, who, OFFICE.officials[i], f, { mode: "stand", expr: i === 2 ? "stern" : i === 0 ? "neutral" : "stern", prop: i === 0 ? "point" : null, facing: i === 0 ? 1 : i === 2 ? -1 : 0, tint: i === 2 && f > cue(W.rules) ? "#e87a6a" : undefined }));
      if (f > cue(W.rules) - 4) {
        const su = ((f - cue(W.rules) + 4) / 18) % 1, p = OFFICE.officials[2];
        for (const sx of [-1, 1]) out.fx.push({ key: `steam${q(su, 12)}`, cw: 128, ch: 128, draw: steamDraw(q(su, 12)), x: p[0] + sx * 0.2, y: 1.72 + 0.25 * su, z: p[2] + 0.05, w: 0.24, h: 0.24, soft: true });
      }
      break;
    }
    case 25: { // the island: Stefan in his beach shirt, stretched out in the hammock; a parrot steals his pencil
      const took = f >= PARROT_F + 8;
      fig(out, cam, took ? STEF_B2 : STEF_B, at("island", -0.75, 0.86, 0.02), f, { mode: "stand", expr: "smile_closed", facing: 0, headTilt: -8 }, { roll: -1.42, shadow: false });
      const u = (f - PARROT_F + 14) / 36;
      if (u > 0 && u < 1) {
        const x = -2.5 + 5 * u, y = 2.4 - 1.5 * Math.sin(u * Math.PI);
        out.fx.push({ key: `parrot${q((f % 8) / 8, 8)}${took}`, cw: 220, ch: 160, draw: parrotDraw(q((f % 8) / 8, 8), took), x: at("island", x, 0, 0)[0], y, z: 0.3, w: 0.55, h: 0.4 });
      }
      break;
    }
  }
  return out;
};

/** sweat: drops slide down beside the head of someone at p (head top ~ y + 1.75) */
const sweat = (out: Stage, cam: CamInfo, p: V3, f: number, n = 2, h = 1.62, seed = 1) => {
  for (let i = 0; i < n; i++) {
    const u = ((f / 16 + hh(i, seed)) % 1), side = i % 2 ? 1 : -1, r = cam.right, ox = side * (0.15 + 0.03 * hh(i, seed + 3));
    out.fx.push({ key: "drop", cw: 64, ch: 96, draw: fxDrop, x: p[0] + r.x * ox, y: p[1] + h + 0.05 - 0.22 * u, z: p[2] + r.z * ox, w: 0.045, h: 0.068 });
  }
};
const snow = (out: Stage, t: number) => { // snow falling past the flat's window outside
  for (let i = 0; i < 40; i++) {
    const x = OFF.flat + 0.4 + 1.3 * hh(i, 51), z = -2.75 - 0.4 * hh(i, 52), y = 2.4 - ((t * (0.25 + 0.2 * hh(i, 53)) + hh(i, 54) * 1.8) % 1.8);
    out.fx.push({ key: "snowflake", cw: 32, ch: 32, draw: (p) => { p.g.fillStyle = "#ffffff"; p.g.beginPath(); p.g.arc(16, 16, 12, 0, Math.PI * 2); p.g.fill(); }, x: x + 0.05 * Math.sin(t * 2 + i), y, z, w: 0.025, h: 0.025, soft: true });
  }
};
/** shot 14: a few couriers already waiting outside the store */
const couriersIdle = (out: Stage, cam: CamInfo, f: number) => {
  for (let i = 0; i < 5; i++) fig(out, cam, mk(70 + i, courier(i), "courier" + i), at("station", -1.2 + i * 0.75, 0, -2.9 + 0.3 * (i % 2)), f, { mode: "stand", expr: i % 2 ? "grin" : "neutral", facing: i % 2 ? 1 : -1 });
};

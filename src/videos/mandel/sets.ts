// The mandel short's sets, built once around their own x offsets (story.ts OFF). Dense on purpose (rule 6: 15+ props
// in interiors, no flat colour over a third of the frame) and with story signs painted in (rule 7).
//   hall - the lottery hall of the hook: tiered risers for the crowd, the glowing JACKPOT board with chasing marquee
//          bulbs, LOTTERY neon, a GRAND DRAW banner, chandeliers, curtains, bunting, the draw drum, podium, stanchions,
//          balloons, ticket crates, a confetti carpet and the heap the neighbour faints into; the cheque and the page
//   flat - Stefan's Bucharest flat, 1962, at night: wallpaper, the frosted window onto the snowy street, the desk with
//          the green-shaded lamp (the practical that lights the scene) and its clutter, shelf, radiator, bed, coat rack
// Practical lamps are returned as point-light specs; world.ts creates the lights and switches them per place.
import * as THREE from "three";
import { Batch, V, lam, quad, boxGeo, crate, lanternCore } from "./build";
import { ctex, rep, planksHD, beamHD, plasterTex } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { at, OFF, HALL, PAGE, DESK, PAGE_DESK, FLAT_STEFAN, V3 } from "./story";
import { mathPageTex, chequeTex, jackpotTex, neonTex, bannerTex, confettiTex, wallpaperTex, calendar62Tex, lottoPosterTex, nightWindowTex } from "./signs";

export type Practical = { place: "hall" | "flat"; pos: V3; color: string; intensity: number; distance: number };
export type HallParts = { page: THREE.Mesh; cheque: THREE.Mesh; bulbs: THREE.Mesh[]; bulbOn: THREE.MeshBasicMaterial; bulbOff: THREE.MeshBasicMaterial };
export type FlatParts = { page: THREE.Mesh };

const tr = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const cyl = (r0: number, r1: number, h: number, n = 14) => new THREE.CylinderGeometry(r1, r0, h, n).translate(0, h / 2, 0);
const col = (key: string, c: string) => lam(key, () => ({ color: c }));
/** self-lit HDR material (blooms above 1.0) */
const glow = (key: string, r: number, g: number, b: number, map?: THREE.Texture) => {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), map: map ?? null, fog: false });
  m.name = key; return m;
};
/** a textured plane facing +z (sign, poster, page) */
const plane = (w: number, h: number, mat: THREE.Material) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
/** additive light pool / patch card (NOINK, no depth write) */
const pool = (w: number, h: number, r: number, g: number, b: number, key: string) => {
  const t = ctex("pool" + key, 256, 256, (c) => {
    const gr = c.createRadialGradient(128, 128, 6, 128, 128, 126); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.45, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  m.layers.set(NOINK); m.renderOrder = 2;
  return m;
};

// ======================================================================== the lottery hall
export const buildHall = (root: THREE.Object3D): { parts: HallParts; lights: Practical[] } => {
  const b = new Batch(), O = OFF.hall, Z = HALL.backZ, P = (x: number, y: number, z: number) => V(O + x, y, z);
  // ---- room shell ----
  const floor = lam("hallFloor", () => ({ map: rep(planksHD(), 6, 6), color: "#b07a50" }));
  const wall = lam("hallWall", () => ({ map: rep(plasterTex("#8a3038"), 4, 3), color: "#c27a7a", side: THREE.DoubleSide }));
  const ceil = col("hallCeil", "#4a2a2e"), gold = lam("gold", () => ({ color: "#d9a84a" })), carpet = col("hallCarpet", "#9a2430");
  b.add(quad(P(-11, 0, 12), P(11, 0, 12), P(11, 0, Z), P(-11, 0, Z), 1, 1), floor);
  b.add(quad(P(-11, 8.5, Z), P(11, 8.5, Z), P(11, 8.5, 12), P(-11, 8.5, 12)), ceil);
  b.add(quad(P(-11, 0, Z), P(11, 0, Z), P(11, 8.5, Z), P(-11, 8.5, Z), 1, 1), wall);
  b.add(quad(P(-11, 0, 12), P(-11, 0, Z), P(-11, 8.5, Z), P(-11, 8.5, 12)), wall);
  b.add(quad(P(11, 0, Z), P(11, 0, 12), P(11, 8.5, 12), P(11, 8.5, Z)), wall);
  // gold pilasters and a cornice along the back wall
  for (const x of [-7.5, -4.6, 4.6, 7.5]) {
    b.add(boxGeo(P(x - 0.22, 0, Z), P(x + 0.22, 8.2, Z + 0.18)), gold);
    b.add(boxGeo(P(x - 0.32, 7.9, Z), P(x + 0.32, 8.15, Z + 0.26)), gold);
  }
  b.add(boxGeo(P(-11, 8.15, Z), P(11, 8.5, Z + 0.3)), gold);
  // red carpet runner toward the lens
  b.add(quad(P(-1.4, 0.004, 12), P(1.4, 0.004, 12), P(1.4, 0.004, -1.5), P(-1.4, 0.004, -1.5), 1, 1), carpet);
  for (const s of [-1, 1]) b.add(boxGeo(P(s * 1.4 - 0.04, 0, -1.5), P(s * 1.4 + 0.04, 0.012, 12)), gold);
  // ---- risers for the crowd: row i stands i * riserH up; carpeted fronts with gold nosing ----
  const riserTop = col("riserTop", "#6a2830"), riserFront = lam("riserFront", () => ({ map: rep(plasterTex("#7a1e2a"), 4, 1), color: "#b0545a" }));
  HALL.rows.forEach((z, i) => {
    if (i === 0) return;
    const h = i * HALL.riserH, z0 = z - 0.38;
    b.add(boxGeo(P(-8, 0, Z), P(8, h - 0.02, z0)), riserFront);
    b.add(quad(P(-8, h, z0), P(8, h, z0), P(8, h, Z), P(-8, h, Z)), riserTop);
    b.add(boxGeo(P(-8, h - 0.035, z0 - 0.03), P(8, h, z0 + 0.03)), gold);
  });
  // ---- the JACKPOT board (self-lit) + marquee bulbs, LOTTERY neon, GRAND DRAW banner ----
  const board = plane(4.4, 2.4, glow("jackpot", 1.55, 1.4, 1.25, jackpotTex()));
  board.position.set(O, 5.6, Z + 0.06); board.layers.set(NOINK); root.add(board);
  b.add(boxGeo(P(-2.42, 4.28, Z), P(2.42, 6.92, Z + 0.04)), gold);
  const bulbOn = glow("bulbOn", 6.0, 4.6, 2.4), bulbOff = glow("bulbOff", 0.9, 0.55, 0.3);
  const bulbs: THREE.Mesh[] = [], bg = new THREE.SphereGeometry(0.055, 10, 8);
  const ring: [number, number][] = [];
  for (let i = 0; i <= 22; i++) { ring.push([-2.3 + (4.6 * i) / 22, 6.84]); ring.push([-2.3 + (4.6 * i) / 22, 4.36]); }
  for (let i = 1; i < 12; i++) { ring.push([-2.33, 4.36 + (2.48 * i) / 12]); ring.push([2.33, 4.36 + (2.48 * i) / 12]); }
  for (const [x, y] of ring) { const m = new THREE.Mesh(bg, bulbOn); m.position.set(O + x, y, Z + 0.1); m.layers.set(NOINK); root.add(m); bulbs.push(m); }
  const neon = plane(3.6, 0.9, glow("neonLottery", 1.9, 1.3, 1.3, neonTex("LOTTERY")));
  neon.position.set(O, 7.45, Z + 0.06); neon.layers.set(NOINK); root.add(neon);
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.03), twoTone(new THREE.MeshLambertMaterial({ map: bannerTex("GRAND DRAW"), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })));
  ban.position.set(O, 3.82, Z + 0.12); root.add(ban);
  // ---- curtains (red velvet folds) both sides of the board ----
  const velvet = col("velvet", "#a52a36");
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) {
    const x = s * (2.9 + k * 0.24);
    b.add(new THREE.CylinderGeometry(0.15, 0.17, 8.1, 10).translate(0, 4.05, 0), velvet, tr(O + x, 0, Z + 0.3 + 0.05 * (k % 2)));
  }
  for (const s of [-1, 1]) b.add(new THREE.TorusGeometry(0.22, 0.05, 8, 16), gold, tr(O + s * 3.05, 3.2, Z + 0.55));
  // ---- chandeliers (brass ring, candle bulbs, a chain to the ceiling) ----
  const brass = lam("brass", () => ({ color: "#c9963a" }));
  const lights: Practical[] = [];
  for (const [x, z] of [[-2.4, -4.6], [2.4, -4.6], [0, -1.2]] as const) {
    const y = z > -2 ? 7.6 : 7.0;
    b.add(new THREE.TorusGeometry(0.55, 0.04, 8, 32).rotateX(Math.PI / 2), brass, tr(O + x, y, z));
    b.add(cyl(0.02, 0.02, 8.5 - y), brass, tr(O + x, y, z));
    b.add(new THREE.SphereGeometry(0.16, 12, 10), brass, tr(O + x, y - 0.12, z));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, cx = O + x + 0.55 * Math.cos(a), cz = z + 0.55 * Math.sin(a);
      b.add(cyl(0.03, 0.03, 0.14), col("candleW", "#f4ead2"), tr(cx, y, cz));
      b.add(new THREE.SphereGeometry(0.045, 8, 6).scale(1, 1.5, 1), lanternCore(), tr(cx, y + 0.18, cz));
    }
    lights.push({ place: "hall", pos: [O + x, y - 0.1, z], color: "#ffb35e", intensity: 22, distance: 12 });
  }
  lights.push({ place: "hall", pos: [O, 5.2, Z + 1.2], color: "#ff9a5a", intensity: 26, distance: 9 }); // the board's glow on the crowd
  // ---- bunting across the hall ----
  const flagCols = ["#e2453c", "#f2c94a", "#3f8ad8", "#4fb36a", "#ffffff"];
  for (const [z, y0, sag] of [[-2.2, 5.5, 0.3]] as const) for (let i = 0; i < 26; i++) {
    const t = i / 25, x = -5 + 10 * t, y = y0 - sag * 4 * t * (1 - t);
    const g = new THREE.BufferGeometry().setFromPoints([V(-0.14, 0, 0), V(0.14, 0, 0), V(0, -0.3, 0)]); g.setIndex([0, 2, 1]); g.computeVertexNormals();
    b.add(g, lam("flag" + (i % 5), () => ({ color: flagCols[i % 5], side: THREE.DoubleSide })), tr(O + x, y, z));
  }
  // ---- the draw drum (wire sphere with balls) on a stand, left ----
  const wire = lam("drumWire", () => ({ color: "#d9a84a", wireframe: true }));
  b.add(new THREE.IcosahedronGeometry(0.55, 1), wire, tr(O - 2.1, 1.45, -1.5));
  b.add(cyl(0.06, 0.06, 0.9), brass, tr(O - 2.1, 0, -1.5));
  b.add(cyl(0.35, 0.3, 0.08), brass, tr(O - 2.1, 0, -1.5));
  const ballCols = ["#ffffff", "#f2c94a", "#e2453c", "#3f8ad8"];
  for (let i = 0; i < 18; i++) b.add(new THREE.SphereGeometry(0.075, 10, 8), col("ball" + (i % 4), ballCols[i % 4]), tr(O - 2.1 + 0.32 * Math.cos(i * 2.4) * (i % 3) / 2, 1.08 + 0.12 * (i % 3), -1.5 + 0.3 * Math.sin(i * 2.4) * (i % 3) / 2));
  // ---- podium with a microphone and a trophy, right ----
  const wood = lam("podium", () => ({ map: rep(beamHD(), 1, 1), color: "#8a5a3a" }));
  b.add(boxGeo(P(2.6, 0, -1.9), P(3.4, 1.15, -1.3)), wood);
  b.add(boxGeo(P(2.55, 1.15, -1.95), P(3.45, 1.2, -1.25)), gold);
  b.add(cyl(0.012, 0.012, 0.45), col("micStand", "#2a2a32"), tr(O + 2.9, 1.2, -1.4));
  b.add(new THREE.SphereGeometry(0.06, 10, 8).scale(1, 1.3, 1), col("mic", "#5a5a66"), tr(O + 2.9, 1.7, -1.4));
  b.add(cyl(0.12, 0.05, 0.1), gold, tr(O + 3.2, 1.2, -1.7)); b.add(cyl(0.05, 0.16, 0.22), gold, tr(O + 3.2, 1.3, -1.7));
  // ---- velvet-rope stanchions in front of the first row ----
  const posts = [-3.4, -2.0, 2.0, 3.4];
  for (const x of posts) { b.add(cyl(0.04, 0.04, 0.95), brass, tr(O + x, 0, -1.25)); b.add(new THREE.SphereGeometry(0.07, 10, 8), brass, tr(O + x, 0.98, -1.25)); b.add(cyl(0.16, 0.14, 0.05), brass, tr(O + x, 0, -1.25)); }
  const rope = col("velvetRope", "#b8202e");
  for (const [x0, x1] of [[-3.4, -2.0], [2.0, 3.4]] as const) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(P(x0 + (x1 - x0) * t, 0.9 - 0.22 * 4 * t * (1 - t), -1.25)); }
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.025, 6), rope);
  }
  // ---- balloons, flower pots, ticket crates, a stage spot on a stand ----
  const balloonCols = ["#e2453c", "#f2c94a", "#3f8ad8", "#e86aa8"];
  for (const [x, z] of [[-3.0, -1.0], [3.7, -0.9]] as const) for (let k = 0; k < 5; k++) {
    const bx = O + x + 0.25 * Math.cos(k * 1.3), bz = z + 0.2 * Math.sin(k * 1.7), by = 2.5 + 0.35 * (k % 3);
    b.add(new THREE.SphereGeometry(0.22, 14, 12).scale(1, 1.2, 1), lam("balloon" + (k % 4), () => ({ color: balloonCols[k % 4] })), tr(bx, by, bz));
    b.add(cyl(0.004, 0.004, by - 1.0), col("string", "#f4ead2"), tr(bx, 1.0, bz));
  }
  for (const [x, z] of [[-3.0, -1.0], [3.7, -0.9]] as const) {
    b.add(cyl(0.18, 0.24, 0.5), col("pot", "#c27a4a"), tr(O + x, 0, z));
    for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(0.13, 10, 8), lam("bloom" + (k % 3), () => ({ color: ["#e2453c", "#f2c94a", "#ffffff"][k % 3] })), tr(O + x + 0.15 * Math.cos(k), 0.62 + 0.08 * (k % 2), z + 0.15 * Math.sin(k)));
  }
  crate(b, O - 3.0, -2.05, 0.5, 0.3); crate(b, O - 2.7, -2.15, 0.42, -0.4);
  b.add(cyl(0.03, 0.03, 1.8), col("spotStand", "#2a2a32"), tr(O - 4.2, 0, 0.2));
  b.add(cyl(0.16, 0.2, 0.36).rotateX(1.2), col("spotCan", "#3a3a44"), tr(O - 4.2, 1.8, 0.2));
  // ---- confetti: a carpet of it on the floor and the heap the neighbour falls into ----
  const confFloor = new THREE.MeshLambertMaterial({ map: rep(confettiTex(null), 3, 3), transparent: true, alphaTest: 0.5, depthWrite: true });
  twoTone(confFloor);
  b.add(quad(P(-4.5, 0.008, 3.5), P(4.5, 0.008, 3.5), P(4.5, 0.008, -1.7), P(-4.5, 0.008, -1.7), 1, 1), confFloor);
  const heap = lam("confHeap", () => ({ map: rep(confettiTex("#efe4cc"), 2, 1) }));
  b.add(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), heap, new THREE.Matrix4().compose(P(2.15, 0, -0.35), new THREE.Quaternion(), V(1.25, 0.26, 0.75)));
  b.add(new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), heap, new THREE.Matrix4().compose(P(-1.5, 0, 0.3), new THREE.Quaternion(), V(0.7, 0.14, 0.5)));
  // the heap the neighbour faints into, right behind him
  b.add(new THREE.SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2), heap, new THREE.Matrix4().compose(P(HALL.neighbour[0] + 0.7, 0, HALL.neighbour[2] - 0.95), new THREE.Quaternion(), V(1.0, 0.42, 0.62)));
  b.build(root, true);

  // ---- the cheque under Stefan's arm and the page of maths in his hands ----
  const cheque = plane(1.3, 0.56, twoTone(new THREE.MeshLambertMaterial({ map: chequeTex(), side: THREE.DoubleSide })));
  cheque.position.set(HALL.stefan[0] - 0.82, 0.82, HALL.stefan[2] + 0.03); cheque.rotation.set(0, 0.28, 0.16);
  cheque.castShadow = true; root.add(cheque);
  const page = plane(PAGE.w, PAGE.h, twoTone(new THREE.MeshLambertMaterial({ map: mathPageTex(), side: THREE.DoubleSide })));
  page.position.set(...PAGE.pos); page.rotation.x = PAGE.tilt; page.castShadow = true; root.add(page);
  return { parts: { page, cheque, bulbs, bulbOn, bulbOff }, lights };
};

// ======================================================================== the Bucharest flat (1962, night)
export const buildFlat = (root: THREE.Object3D): { parts: FlatParts; lights: Practical[] } => {
  const b = new Batch(), O = OFF.flat, P = (x: number, y: number, z: number) => V(O + x, y, z);
  const x0 = -2.3, x1 = 2.3, zb = -2.6, zf = 3.2, h = 2.7, win = { x: 1.0, y: 1.55, w: 1.0, h: 1.15 };
  const paper = lam("wallpaper", () => ({ map: rep(wallpaperTex(), 4, 2.5), side: THREE.DoubleSide }));
  const boards = lam("flatFloor", () => ({ map: rep(planksHD(), 2.5, 2.5), color: "#8a6044" }));
  b.add(quad(P(x0, 0, zf), P(x1, 0, zf), P(x1, 0, zb), P(x0, 0, zb)), boards);
  b.add(quad(P(x0, h, zb), P(x1, h, zb), P(x1, h, zf), P(x0, h, zf)), lam("flatCeil", () => ({ map: rep(plasterTex("#d8ccb4"), 2, 2), side: THREE.DoubleSide })));
  b.add(quad(P(x0, 0, zf), P(x0, 0, zb), P(x0, h, zb), P(x0, h, zf), 1, 1), paper);
  b.add(quad(P(x1, 0, zb), P(x1, 0, zf), P(x1, h, zf), P(x1, h, zb), 1, 1), paper);
  // back wall with the window opening
  const wx0 = win.x - win.w / 2, wx1 = win.x + win.w / 2, wy0 = win.y - win.h / 2, wy1 = win.y + win.h / 2;
  const back = (ax: number, bx: number, ay: number, by: number) => b.add(quad(P(ax, ay, zb), P(bx, ay, zb), P(bx, by, zb), P(ax, by, zb), (bx - x0) / (x1 - x0), by / h, (ax - x0) / (x1 - x0), ay / h), paper);
  back(x0, wx0, 0, h); back(wx1, x1, 0, h); back(wx0, wx1, 0, wy0); back(wx0, wx1, wy1, h);
  const frameW = col("winFrame", "#e8e0d0"), sill = col("sill", "#cfc6b4");
  for (const [ax, ay, bx, by] of [[wx0 - 0.06, wy0 - 0.06, wx1 + 0.06, wy0], [wx0 - 0.06, wy1, wx1 + 0.06, wy1 + 0.06], [wx0 - 0.06, wy0, wx0, wy1], [wx1, wy0, wx1 + 0.06, wy1], [win.x - 0.025, wy0, win.x + 0.025, wy1], [wx0, win.y - 0.02, wx1, win.y + 0.02]] as const)
    b.add(boxGeo(P(ax, ay, zb - 0.08), P(bx, by, zb + 0.04)), frameW);
  b.add(boxGeo(P(wx0 - 0.12, wy0 - 0.08, zb), P(wx1 + 0.12, wy0 - 0.03, zb + 0.18)), sill);
  b.add(boxGeo(P(wx0, wy0 - 0.03, zb - 0.3), P(wx1, wy0 + 0.05, zb - 0.08)), col("snowSill", "#f2f2f6")); // snow outside on the sill
  const night = plane(win.w * 2.6, win.h * 2.2, glow("nightWin", 1.0, 1.0, 1.15, nightWindowTex()));
  night.position.set(O + win.x, win.y, zb - 0.9); night.layers.set(NOINK); root.add(night);
  // frost in the pane corners
  const frost = ctex("frostCorners", 256, 256, (g, r) => { for (let i = 0; i < 260; i++) { const a = r(), x = a < 0.5 ? r() * 70 : 256 - r() * 70, y = r() < 0.5 ? r() * 70 : 256 - r() * 70; g.fillStyle = `rgba(230,240,255,${0.25 + 0.4 * r()})`; g.beginPath(); g.arc(x, y, 2 + 6 * r(), 0, Math.PI * 2); g.fill(); } });
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(win.w, win.h), new THREE.MeshBasicMaterial({ map: frost, transparent: true, depthWrite: false, color: new THREE.Color(0.8, 0.85, 1.0) }));
  fm.position.set(O + win.x, win.y, zb - 0.02); fm.layers.set(NOINK); root.add(fm);
  // curtains
  const curtain = col("flatCurtain", "#7a3a3a");
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.06, 0.07, 1.6, 8).translate(0, 0.8, 0), curtain, tr(O + win.x + s * (win.w / 2 + 0.1 + k * 0.1), wy0 - 0.15, zb + 0.12));
  b.add(cyl(0.015, 0.015, 1.6).rotateZ(Math.PI / 2).translate(0.8, 0, 0), col("rod", "#6a5040"), tr(O + win.x - 0.8, wy1 + 0.12, zb + 0.12));
  // radiator under the window
  for (let k = 0; k < 9; k++) b.add(boxGeo(P(win.x - 0.4 + k * 0.1, 0.12, zb + 0.05), P(win.x - 0.34 + k * 0.1, 0.68, zb + 0.16)), col("radiator", "#d8d0c0"));
  // ---- the desk (Stefan behind it) with the lamp, the page and its clutter ----
  const deskW = lam("deskWood", () => ({ map: rep(beamHD(), 1, 1), color: "#7a4a2e" }));
  const [dx, , dz] = DESK.pos, top = DESK.h;
  b.add(boxGeo(V(dx - DESK.w / 2, top - 0.04, dz - DESK.d / 2), V(dx + DESK.w / 2, top, dz + DESK.d / 2)), deskW);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) b.add(boxGeo(V(dx + sx * (DESK.w / 2 - 0.05) - 0.03, 0, dz + sz * (DESK.d / 2 - 0.05) - 0.03), V(dx + sx * (DESK.w / 2 - 0.05) + 0.03, top - 0.04, dz + sz * (DESK.d / 2 - 0.05) + 0.03)), deskW);
  b.add(boxGeo(V(dx + 0.15, top - 0.22, dz - DESK.d / 2 + 0.02), V(dx + DESK.w / 2 - 0.04, top - 0.04, dz + DESK.d / 2 - 0.02)), deskW); // drawer block
  // desk lamp: base, arm, green shade, bulb (the practical)
  const lampX = dx - 0.42, lampZ = dz - 0.14, green = twoTone(new THREE.MeshPhongMaterial({ color: "#2f7a4a", specular: "#cfe8d0", shininess: 50, side: THREE.DoubleSide }));
  b.add(cyl(0.09, 0.1, 0.03), col("lampBrass", "#b8903a"), tr(lampX, top, lampZ));
  b.add(cyl(0.012, 0.012, 0.36), col("lampBrass", "#b8903a"), tr(lampX, top + 0.03, lampZ));
  b.add(new THREE.ConeGeometry(0.15, 0.16, 20, 1, true).translate(0, -0.08, 0), green, new THREE.Matrix4().makeRotationZ(-0.5).setPosition(lampX + 0.06, top + 0.42, lampZ + 0.03));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), lanternCore()); bulb.position.set(lampX + 0.1, top + 0.36, lampZ + 0.04); bulb.layers.set(NOINK); root.add(bulb);
  const lights: Practical[] = [{ place: "flat", pos: [lampX + 0.12, top + 0.33, lampZ + 0.06], color: "#ffb05a", intensity: 0.85, distance: 2.4 }];
  // the lamp's warm pool on the desk and on the floor, the moon's cold patch under the window
  const dp = pool(0.8, 0.65, 0.13, 0.08, 0.03, "desk"); dp.rotation.x = -Math.PI / 2; dp.position.set(lampX + 0.22, top + 0.003, dz - 0.06); root.add(dp);
  const fp = pool(1.8, 1.5, 0.1, 0.06, 0.02, "floor"); fp.rotation.x = -Math.PI / 2; fp.position.set(dx - 0.2, 0.004, dz + 0.4); root.add(fp);
  const mp = pool(1.0, 1.6, 0.06, 0.09, 0.2, "moon"); mp.rotation.x = -Math.PI / 2; mp.rotation.z = 0.25; mp.position.set(O + win.x - 0.15, 0.005, zb + 1.1); root.add(mp);
  const page = plane(PAGE.w, PAGE.h, twoTone(new THREE.MeshLambertMaterial({ map: mathPageTex(), side: THREE.DoubleSide })));
  page.rotation.set(-Math.PI / 2, 0, 0.06); page.position.set(...PAGE_DESK); page.receiveShadow = true; root.add(page);
  // clutter: pencils, eraser, tea glass in a holder, radio, books, abacus, ashtray, empty coin tin, ink pot, slide rule
  for (let k = 0; k < 3; k++) b.add(cyl(0.005, 0.005, 0.17).rotateZ(Math.PI / 2), col("pencil", "#f2c230"), new THREE.Matrix4().makeRotationY(0.4 + k * 0.5).setPosition(dx + 0.22 + k * 0.03, top + 0.006, dz + 0.17));
  b.add(boxGeo(V(dx + 0.3, top, dz - 0.02), V(dx + 0.35, top + 0.015, dz + 0.01)), col("eraser", "#e88a9a"));
  b.add(cyl(0.032, 0.03, 0.1), lam("teaGlass", () => ({ color: "#b8603a" })), tr(dx + 0.46, top, dz - 0.05));
  b.add(cyl(0.036, 0.036, 0.06), col("holder", "#b8b8c0"), tr(dx + 0.46, top, dz - 0.05));
  b.add(boxGeo(V(dx + 0.2, top, dz - 0.32), V(dx + 0.52, top + 0.2, dz - 0.18)), lam("radio", () => ({ color: "#8a5a3a" })));
  const dial = plane(0.12, 0.05, glow("dial", 1.6, 1.2, 0.6)); dial.position.set(dx + 0.36, top + 0.13, dz - 0.179); dial.layers.set(NOINK); root.add(dial);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(dx - 0.58, top + k * 0.045, dz + 0.1 - 0.01 * k), V(dx - 0.36, top + k * 0.045 + 0.04, dz + 0.27 + 0.01 * k)), col("book" + k, ["#7a2a2a", "#2a4a7a", "#3a6a3a", "#8a6a2a"][k]));
  b.add(boxGeo(V(dx - 0.2, top, dz - 0.3), V(dx + 0.06, top + 0.012, dz - 0.18)), col("abacusBase", "#6a4a2e"));
  for (let k = 0; k < 4; k++) for (let j = 0; j < 6; j++) b.add(new THREE.SphereGeometry(0.011, 6, 5), col("bead" + (j % 2), j % 2 ? "#c23a2a" : "#f2c94a"), tr(dx - 0.18 + j * 0.022 + (k % 2) * 0.03, top + 0.03, dz - 0.29 + k * 0.03));
  b.add(cyl(0.05, 0.04, 0.02), col("ashtray", "#5a6a7a"), tr(dx - 0.1, top, dz + 0.24));
  b.add(cyl(0.05, 0.05, 0.035), col("tin", "#a8b0b8"), tr(dx + 0.5, top, dz + 0.2));
  b.add(cyl(0.022, 0.025, 0.05), col("ink", "#1a2a5a"), tr(dx + 0.12, top, dz - 0.27));
  b.add(boxGeo(V(dx - 0.3, top, dz + 0.27), V(dx + 0.1, top + 0.01, dz + 0.3)), col("slideRule", "#e8e0c8"));
  // chair behind the desk
  const chairW = lam("chair", () => ({ map: rep(beamHD(), 1, 1), color: "#6a3e26" }));
  const [sx0, , sz0] = FLAT_STEFAN;
  b.add(boxGeo(V(sx0 - 0.22, 0.42, sz0 - 0.22), V(sx0 + 0.22, 0.46, sz0 + 0.18)), chairW);
  b.add(boxGeo(V(sx0 - 0.22, 0.46, sz0 - 0.24), V(sx0 + 0.22, 0.98, sz0 - 0.2)), chairW);
  for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) b.add(boxGeo(V(sx0 + a * 0.19 - 0.02, 0, sz0 + c * 0.17 - 0.02), V(sx0 + a * 0.19 + 0.02, 0.42, sz0 + c * 0.17 + 0.02)), chairW);
  // rug under the desk
  b.add(new THREE.CircleGeometry(1.1, 40).rotateX(-Math.PI / 2).scale(1.3, 1, 1), lam("rug", () => ({ map: ctex("rug", 256, 256, (g) => { for (let r = 128; r > 0; r -= 16) { g.fillStyle = ["#8a2a2a", "#c9a46a", "#2a4a6a", "#e8d8b0"][(r / 16) % 4]; g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.fill(); } }) })), tr(dx, 0.006, dz - 0.1));
  // wall: calendar 1962, LOTTO poster, a clock, a framed photo, a shelf of books
  for (const [tex, w, hh, x, y] of [[calendar62Tex(), 0.36, 0.5, -0.55, 1.75], [lottoPosterTex(), 0.46, 0.65, -1.45, 1.6]] as const) {
    const m = plane(w, hh, twoTone(new THREE.MeshLambertMaterial({ map: tex }))); m.position.set(O + x, y, zb + 0.012); root.add(m);
  }
  b.add(cyl(0.16, 0.16, 0.04).rotateX(Math.PI / 2), col("clockRim", "#5a3a26"), tr(O - 0.05, 2.25, zb + 0.02));
  const clockFace = plane(0.26, 0.26, twoTone(new THREE.MeshLambertMaterial({ map: ctex("clockFace62", 256, 256, (g) => {
    g.fillStyle = "#f4ead2"; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill(); g.fillStyle = "#2a2a3a";
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillRect(128 + 100 * Math.sin(a) - 4, 128 - 100 * Math.cos(a) - 4, 8, 8); }
    g.lineWidth = 9; g.strokeStyle = "#2a2a3a"; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 50, 128 + 30); g.moveTo(128, 128); g.lineTo(128 - 10, 128 - 85); g.stroke();
  }), transparent: true, alphaTest: 0.5 })));
  clockFace.position.set(O - 0.05, 2.25, zb + 0.045); root.add(clockFace);
  b.add(boxGeo(P(-2.25, 1.15, -1.6), P(-1.95, 1.18, -0.4)), deskW);
  for (let k = 0; k < 9; k++) b.add(boxGeo(P(-2.24, 1.18, -1.55 + k * 0.12), P(-2.04 - 0.04 * (k % 2), 1.4 + 0.04 * (k % 3), -1.47 + k * 0.12)), col("shelfBook" + (k % 4), ["#7a2a2a", "#2a4a7a", "#3a6a3a", "#c9a46a"][k % 4]));
  // bed corner (right), coat rack with a coat (left front)
  b.add(boxGeo(P(1.3, 0, 0.6), P(2.28, 0.45, 2.6)), lam("bedFrame", () => ({ map: rep(beamHD(), 1, 1), color: "#6a3e26" })));
  b.add(boxGeo(P(1.33, 0.45, 0.62), P(2.26, 0.6, 2.58)), lam("blanket", () => ({ map: ctex("blanket", 256, 256, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#8a2a3a" : "#c9a46a"; g.fillRect(i * 32, j * 32, 32, 32); } }) })));
  b.add(cyl(0.025, 0.025, 1.75), col("rack", "#4a3020"), tr(O - 1.9, 0, 1.6));
  b.add(new THREE.SphereGeometry(0.22, 12, 10).scale(1, 2.3, 0.7), col("coat", "#4a4a52"), tr(O - 1.88, 1.2, 1.6));
  b.add(new THREE.SphereGeometry(0.12, 12, 10).scale(1, 0.6, 1), col("hat", "#3a3a40"), tr(O - 1.9, 1.78, 1.6));
  b.build(root, true);
  return { parts: { page }, lights };
};

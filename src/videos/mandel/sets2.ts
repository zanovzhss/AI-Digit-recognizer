// The rest of the mandel short's sets (sets.ts holds the hall and the flat). Each is dense (rule 6) and carries 1-3
// story signs (rule 7); animated parts are returned for world.ts to pose per frame.
//   wall      - the explanation set (rule 8): a dark room with the wall of all combinations (instanced cells that light
//               up), its counter, the cost-vs-prize scale, the ticket mountain, the giant prize bag, the glowing world
//               map with the Melbourne -> Virginia route, the 1992 desk; its own light (cool wall glow + warm lamps)
//   kiosk     - a Melbourne street corner by day: the LOTTERY kiosk with the WINS plaque, gum trees, shopfronts
//   station   - a Virginia gas station + grocery at night: canopy lights, pumps, neon GAS, lit store windows, the
//               rolling JACKPOT board, the counter inside with clerk, clock and DAYS calendar, the ticket avalanche
//   warehouse - the Melbourne print room: presses, paper rolls, TICKETS crates, hanging work lamps, the ticket pile
//   office    - the lottery office: wood panels, blinds, desk with the RULES binder, the notice and the stamp
//   island    - the tropical island: sand, sea, palms, the hammock, the WINS: 14 plaque (callback)
import * as THREE from "three";
import { Batch, V, lam, quad, boxGeo, crate, lanternCore, prop, palm, lampPost, Kit } from "./build";
import { ctex, rep, planksHD, beamHD, plasterTex, stoneHD, brick, facadeHD, awningTex, waterNear, cloudHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { at, OFF, ROOM, KIOSK, STATION, WARE, OFFICE, ISLAND, V3 } from "./story";
import { tr, cyl, col, glow, plane, pool, Practical } from "./sets";
import { DynTex, signTex, drawPlaque, drawMap, ticketTex, ticketHeapTex, chequeTex, noticeTex, neonTex } from "./signs";

const lit = (key: string, map: THREE.Texture, side: THREE.Side = THREE.FrontSide) => twoTone(new THREE.MeshLambertMaterial({ map, side }));
const signMesh = (root: THREE.Object3D, tex: THREE.Texture, w: number, h: number, p: V3, yaw = 0, selfLit = 0) => {
  const m = plane(w, h, selfLit ? glow("sign" + tex.uuid, selfLit, selfLit, selfLit, tex) : lit("sign" + tex.uuid, tex));
  m.position.set(...p); m.rotation.y = yaw; if (selfLit) m.layers.set(NOINK); root.add(m); return m;
};
const floorQuad = (b: Batch, x0: number, x1: number, z0: number, z1: number, y: number, mat: THREE.Material, u = 1, v = 1) =>
  b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), u, v), mat);

// ======================================================================== the explanation room
export type WallParts = { cells: THREE.InstancedMesh; counter: DynTex; map: DynTex; beam: THREE.Group; pans: THREE.Group[] };
export const buildWall = (root: THREE.Object3D): { parts: WallParts; lights: Practical[] } => {
  const b = new Batch(), O = OFF.wall, Z = ROOM.wallZ;
  const floor = lam("roomFloor", () => ({ map: rep(planksHD(), 10, 10), color: "#8a84a0" }));
  floorQuad(b, O - 20, O + 20, -12, 12, 0, floor, 1, 1);
  b.add(quad(V(O - 20, 0, -9), V(O + 20, 0, -9), V(O + 20, 14, -9), V(O - 20, 14, -9)), lam("roomBack", () => ({ map: rep(plasterTex("#3a4268"), 8, 3), color: "#9aa4d0" })));
  b.add(quad(V(O - 20, 14, -9), V(O + 20, 14, -9), V(O + 20, 14, 12), V(O - 20, 14, 12)), col("roomCeil", "#14182a"));
  // the wall: a dark frame with 48 x 34 cells, a header counter, a ladder and crates at its foot
  b.add(boxGeo(V(O + ROOM.wallX[0] - 0.3, 0, Z - 0.4), V(O + ROOM.wallX[1] + 0.3, ROOM.wallY[1] + 0.3, Z)), col("wallFrame", "#2a3150"));
  const nC = ROOM.cols * ROOM.rows, cw = (ROOM.wallX[1] - ROOM.wallX[0]) / ROOM.cols, ch = (ROOM.wallY[1] - ROOM.wallY[0]) / ROOM.rows;
  const cells = new THREE.InstancedMesh(new THREE.BoxGeometry(cw * 0.86, ch * 0.86, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.5) }), nC);
  const m4 = new THREE.Matrix4(), off = new THREE.Color(0.06, 0.08, 0.16);
  for (let i = 0; i < nC; i++) {
    const c = i % ROOM.cols, r = Math.floor(i / ROOM.cols);
    m4.makeTranslation(O + ROOM.wallX[0] + (c + 0.5) * cw, ROOM.wallY[0] + (r + 0.5) * ch, Z + 0.03); cells.setMatrixAt(i, m4); cells.setColorAt(i, off);
  }
  cells.layers.set(NOINK); root.add(cells);
  const counter = new DynTex(1536, 256);
  const cm = plane(7.2, 1.2, glow("counterGlow", 1.25, 1.25, 1.25, counter.tex)); cm.position.set(O, ROOM.wallY[1] + 1.0, Z + 0.05); cm.layers.set(NOINK); root.add(cm);
  for (let k = 0; k < 9; k++) b.add(boxGeo(V(O + 6.6, 0.3 + k * 0.6, Z + 0.1), V(O + 7.2, 0.34 + k * 0.6, Z + 0.4)), col("ladderRung", "#8a6a4a"));
  for (const x of [6.6, 7.2]) b.add(boxGeo(V(O + x - 0.04, 0, Z + 0.2), V(O + x + 0.04, 5.6, Z + 0.3)), col("ladderRail", "#7a5a3a"));
  for (const [x, z, s] of [[-6.6, -4.9, 0.7], [-7.4, -4.6, 0.6], [5.8, -4.7, 0.65], [7.6, -4.4, 0.55], [-7.0, -3.9, 0.5]] as const) crate(b, O + x, z, s, x);
  // the scale: COST (a block of tickets) vs PRIZE (a money bag); the beam and pans pose in world.ts
  const [sx, , sz] = ROOM.scale, brass = lam("brass", () => ({ color: "#c9963a" }));
  b.add(cyl(0.5, 0.42, 0.18), brass, tr(sx, 0, sz)); b.add(cyl(0.06, 0.06, 2.5), brass, tr(sx, 0.18, sz));
  const beam = new THREE.Group(); beam.position.set(sx, 2.68, sz); root.add(beam);
  beam.add(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.1), brass));
  const pans: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(sx + s * 1.3, 2.68, sz); root.add(g); pans.push(g);
    for (const a of [0, 2.1, 4.2]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0), col("chainS", "#8a8a8a")); st.position.set(0.32 * Math.cos(a) * 0.5, -0.5, 0.32 * Math.sin(a) * 0.5); g.add(st); }
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.06, 24), brass); pan.position.y = -1.0; g.add(pan);
    if (s < 0) { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.42), lit("ticketBlock", rep(ticketHeapTex(), 0.6, 0.4))); tk.position.y = -0.76; g.add(tk); }
    else { const bag = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 14).scale(1, 1.05, 1), col("moneyBag", "#5a8a52")); bag.position.y = -0.66; g.add(bag);
      const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.16, 12), col("moneyBag", "#5a8a52")); nk.position.y = -0.3; g.add(nk); }
    const lab = plane(0.62, 0.24, lit("lab" + s, signTex(s < 0 ? "cost" : "prize", 512, 192, s < 0 ? "#f4ead2" : "#f2c94a", "#2a2a3a", s < 0 ? "COST" : "PRIZE")));
    lab.position.set(0, -1.18, 0.36); g.add(lab);
  }
  signMesh(root, signTex("pvc", 768, 256, "#2a3150", "#ffe8b0", "PRIZE vs COST"), 1.8, 0.6, [sx, 3.35, sz - 0.4]);
  // the ticket mountain
  b.add(new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, 0, Math.PI / 2), lit("ticketMount", rep(ticketHeapTex(), 3, 2)), new THREE.Matrix4().compose(V(...ROOM.mountain), new THREE.Quaternion(), V(2.0, 1.45, 1.6)));
  // the giant prize bag (left, beyond the wall), with its tag
  const [bx, , bz] = ROOM.bag, burlap = col("burlap", "#6a8a4a");
  b.add(new THREE.SphereGeometry(4.6, 30, 22).scale(1, 1.15, 1), burlap, tr(bx, 4.8, bz));
  b.add(cyl(1.1, 1.8, 1.6), burlap, tr(bx, 9.6, bz)); b.add(new THREE.TorusGeometry(1.15, 0.2, 10, 24).rotateX(Math.PI / 2), col("rope", "#c4a272"), tr(bx, 9.9, bz));
  signMesh(root, signTex("dollar", 256, 256, "#6a8a4a", "#f2e6a0", "$", "", undefined, "#6a8a4a"), 3.2, 3.2, [bx + 0.6, 5.0, bz + 4.75], -0.1);
  signMesh(root, signTex("bagTag", 1024, 384, "#f4ead2", "#2a2a3a", "JACKPOT", "$27,000,000"), 3.8, 1.42, [bx + 4.0, 7.6, bz + 3.2], -0.5);
  // the world map (glowing), a lamp over it, the desk with 1992 on it
  const map = new DynTex(2048, 1182), [mx, , mz] = ROOM.map;
  b.add(boxGeo(V(mx - ROOM.mapW / 2 - 0.12, 0.7, mz - 0.12), V(mx + ROOM.mapW / 2 + 0.12, 0.85 + ROOM.mapH + 0.12, mz)), col("mapFrame", "#6a4a2e"));
  const mm = plane(ROOM.mapW, ROOM.mapH, glow("mapGlow", 1.12, 1.12, 1.12, map.tex)); mm.position.set(mx, 0.8 + ROOM.mapH / 2, mz + 0.02); mm.layers.set(NOINK); root.add(mm);
  b.add(cyl(0.02, 0.02, 1.2), col("lampArm", "#2a2a32"), tr(mx, 0.85 + ROOM.mapH + 0.1, mz + 0.2));
  const [dx, , dz] = ROOM.desk;
  b.add(boxGeo(V(dx - 0.7, 0.72, dz - 0.4), V(dx + 0.7, 0.78, dz + 0.4)), lam("deskWood", () => ({ map: rep(beamHD(), 1, 1), color: "#7a4a2e" })));
  for (const [ax, az] of [[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]] as const) b.add(boxGeo(V(dx + ax - 0.03, 0, dz + az - 0.03), V(dx + ax + 0.03, 0.72, dz + az + 0.03)), col("deskLeg", "#5a3a22"));
  const cal = plane(0.36, 0.46, lit("cal92", signTex("cal1992", 512, 640, "#f4ecd8", "#b8352a", "1992", "JANUARY", undefined, "#b8352a")));
  cal.position.set(dx - 0.35, 1.0, dz - 0.25); cal.rotation.x = -0.25; root.add(cal);
  b.add(boxGeo(V(dx + 0.1, 0.78, dz - 0.2), V(dx + 0.5, 0.83, dz + 0.1)), col("mapBooks", "#2a4a7a"));
  b.add(cyl(0.05, 0.05, 0.1), col("mug", "#c23a2a"), tr(dx + 0.45, 0.78, dz + 0.22));
  b.build(root, true);
  const lights: Practical[] = [
    { place: "wall", pos: [O, 4.2, Z + 1.6], color: "#a8c0ff", intensity: 34, distance: 16 },
    { place: "wall", pos: [sx, 4.6, sz + 0.4], color: "#ffb35e", intensity: 12, distance: 7 },
    { place: "wall", pos: [mx, 4.4, mz + 1.4], color: "#ffcf8a", intensity: 14, distance: 8 },
  ];
  const sp = pool(3.2, 2.4, 0.18, 0.1, 0.04, "scale"); sp.rotation.x = -Math.PI / 2; sp.position.set(sx, 0.01, sz + 0.2); root.add(sp);
  const fp = pool(30, 12, 0.1, 0.12, 0.22, "wallFloor"); fp.rotation.x = -Math.PI / 2; fp.position.set(O, 0.008, Z + 2.6); root.add(fp);
  return { parts: { cells, counter, map, beam, pans }, lights };
};

// ======================================================================== the Melbourne kiosk (day)
export type KioskParts = { plaque: DynTex; suitcase: THREE.Group };
export const buildKiosk = (root: THREE.Object3D, kit: Kit): { parts: KioskParts } => {
  const b = new Batch(), O = OFF.kiosk, P = (x: number, y: number, z: number) => V(O + x, y, z);
  floorQuad(b, O - 40, O + 40, -1.2, 30, 0.12, lam("pavers", () => ({ map: rep(stoneHD("paversHD", ["#d8cfc0", "#cfc5b5", "#e0d8ca", "#c8bead"], "#a8a090"), 20, 8) })));
  b.add(boxGeo(P(-40, 0, -1.35), P(40, 0.12, -1.2)), col("curb", "#bab2a6"));
  floorQuad(b, O - 40, O + 40, -9.5, -1.2, 0, col("asphalt", "#5a5a62"));
  for (let x = -38; x < 40; x += 4) floorQuad(b, O + x, O + x + 2, -5.5, -5.3, 0.004, col("laneDash", "#f2f0e6"));
  floorQuad(b, O - 40, O + 40, -13, -9.5, 0.12, lam("pavers", () => ({ map: rep(stoneHD("paversHD", ["#d8cfc0", "#cfc5b5", "#e0d8ca", "#c8bead"], "#a8a090"), 20, 8) })));
  // shopfronts across the street
  const fronts = [["#e8c890", "#2f6a43"], ["#c98a6a", "#2f5f6a"], ["#ece0c4", "#8c3b4a"], ["#d8b070", "#3f6fb5"], ["#c9a48a", "#5a3b2a"], ["#e0d0a8", "#2f6a43"]];
  for (let i = 0; i < 9; i++) {
    const [wall, shutter] = fronts[i % fronts.length], x0 = -18 + i * 4.2, h = 5 + (i % 3) * 1.2;
    const fm = lam("front" + i, () => ({ map: facadeHD("front" + (i % 6), 4, h, { wall, shutter, door: true, brick: i % 3 === 1 }) }));
    b.add(quad(P(x0, 0, -13), P(x0 + 4.1, 0, -13), P(x0 + 4.1, h, -13), P(x0, h, -13)), fm);
    b.add(boxGeo(P(x0, h, -13.4), P(x0 + 4.1, h + 0.3, -12.9)), col("cornice", "#efe3c8"));
    b.add(boxGeo(P(x0 + 0.2, 2.6, -12.95), P(x0 + 3.9, 2.75, -12.2)), lam("awn" + (i % 3), () => ({ map: awningTex(["#c23a2a", "#2f6ab5", "#2f8a54"][i % 3], "#f4f0e6"), side: THREE.DoubleSide })));
  }
  // the kiosk: green booth, striped awning, counter window, LOTTERY sign on top, posters, the WINS plaque
  const green = col("kioskGreen", "#2f7a54"), cream = col("kioskCream", "#f2ead6");
  b.add(boxGeo(P(-1.0, 0.12, -0.8), P(1.0, 1.0, 0.8)), green);
  b.add(boxGeo(P(-1.0, 1.0, -0.8), P(-0.85, 2.3, 0.8)), green); b.add(boxGeo(P(0.85, 1.0, -0.8), P(1.0, 2.3, 0.8)), green);
  b.add(boxGeo(P(-1.0, 1.0, -0.8), P(1.0, 2.3, -0.65)), green);
  b.add(boxGeo(P(-1.0, 2.3, -0.8), P(1.0, 2.55, 0.8)), cream);
  b.add(boxGeo(P(-1.15, 2.55, -0.95), P(1.15, 2.65, 0.95)), green);
  b.add(boxGeo(P(-0.85, 1.0, 0.6), P(0.85, 1.06, 0.95)), cream); // counter shelf
  b.add(quad(P(-1.0, 2.25, 0.8), P(1.0, 2.25, 0.8), P(1.0, 2.05, 1.3), P(-1.0, 2.05, 1.3)), lam("kAwning", () => ({ map: awningTex("#e2453c", "#f4f0e6"), side: THREE.DoubleSide })));
  signMesh(root, signTex("kioskLottery", 1024, 256, "#e2453c", "#ffe08a", "LOTTERY"), 2.1, 0.52, [O, 2.95, 0.6]);
  signMesh(root, signTex("kioskJackpot", 512, 704, "#1f3f7a", "#ffffff", "BIG DRAW", "SATURDAY"), 0.6, 0.82, [O - 1.01, 1.6, 0.2], -Math.PI / 2);
  for (let k = 0; k < 8; k++) b.add(boxGeo(P(-0.8 + k * 0.2, 1.1, 0.62), P(-0.66 + k * 0.2, 1.1 + 0.1 + 0.05 * (k % 3), 0.7)), col("kGoods" + (k % 4), ["#c23a2a", "#f2c94a", "#3f8ad8", "#ffffff"][k % 4]));
  const plaque = new DynTex(768, 256);
  const pm = plane(0.62, 0.21, lit("plaqueK", plaque.tex)); pm.position.set(...KIOSK.plaque); root.add(pm);
  // giant cheques leaning on the kiosk (the earlier wins)
  for (let k = 0; k < 3; k++) { const c = plane(1.3, 0.56, lit("chequeK" + k, chequeTex(), THREE.DoubleSide)); c.position.set(KIOSK.cheques[0] + 0.05 * k, 0.4 + 0.02 * k, KIOSK.cheques[2] - 0.06 * k); c.rotation.set(-0.15, -0.35, Math.PI / 2 - 0.12); root.add(c); }
  // street dressing: gum trees, a kangaroo-crossing sign, a bench, a bin, a red letterbox, lamp posts, a bike rack
  for (const [x, z, h] of [[-4.6, 1.8, 6.5], [4.3, 2.4, 7.2], [-9.0, 1.4, 6.0], [9.5, 1.6, 6.8], [-6.5, -12.2, 5.5], [7.5, -12.2, 5.0]] as const) prop(b, kit, "tree_default", O + x, 0.12, z, h);
  b.add(cyl(0.04, 0.04, 2.3), col("signPost", "#8a8a90"), tr(O + 2.7, 0.12, 1.3));
  const roo = ctex("kangarooSign", 256, 256, (g) => {
    g.fillStyle = "#f2c230"; g.save(); g.translate(128, 128); g.rotate(Math.PI / 4); g.fillRect(-86, -86, 172, 172); g.strokeStyle = "#1a1a1a"; g.lineWidth = 8; g.strokeRect(-80, -80, 160, 160); g.restore();
    g.fillStyle = "#1a1a1a"; g.beginPath(); g.ellipse(132, 140, 34, 22, -0.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(158, 104, 12, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(150, 86, 5, 14); g.beginPath(); g.moveTo(104, 152); g.lineTo(62, 178); g.lineTo(66, 168); g.closePath(); g.fill(); g.fillRect(120, 156, 8, 26); g.fillRect(138, 156, 26, 6);
  });
  signMesh(root, roo, 0.6, 0.6, [O + 2.7, 2.2, 1.34]);
  b.add(boxGeo(P(-3.2, 0.5, 2.6), P(-1.9, 0.56, 3.0)), lam("bench", () => ({ map: rep(beamHD(), 1, 1), color: "#8a5a3a" })));
  for (const x of [-3.1, -2.0]) b.add(boxGeo(P(x - 0.04, 0.12, 2.65), P(x + 0.04, 0.5, 2.95)), col("benchLeg", "#3a3a40"));
  b.add(cyl(0.22, 0.22, 0.8), col("bin", "#2f6a43"), tr(O + 1.9, 0.12, 2.5));
  b.add(cyl(0.2, 0.2, 1.2), col("letterbox", "#c8352a"), tr(O + 3.4, 0.12, 0.7)); b.add(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), col("letterbox", "#c8352a"), tr(O + 3.4, 1.32, 0.7));
  for (const x of [-7, 6.5]) lampPost(b, O + x, 0.4, 3.4);
  for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(0.3, 0.025, 6, 20, Math.PI), col("rack", "#8a8a90"), tr(O - 5.5 + k * 0.45, 0.12, -0.6));
  b.build(root, true);
  // the suitcase (animated: it lands in shot 11)
  const suitcase = new THREE.Group(), sb = new Batch();
  sb.add(boxGeo(V(-0.32, 0, -0.1), V(0.32, 0.46, 0.1)), col("suitcase", "#8a5a34"));
  sb.add(boxGeo(V(-0.33, 0.12, -0.11), V(0.33, 0.16, 0.11)), col("strap", "#5a3a22")); sb.add(boxGeo(V(-0.33, 0.3, -0.11), V(0.33, 0.34, 0.11)), col("strap", "#5a3a22"));
  sb.add(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), col("strap", "#5a3a22"), tr(0, 0.46, 0));
  sb.build(suitcase, true); suitcase.traverse((o) => { o.matrixAutoUpdate = true; }); root.add(suitcase);
  return { parts: { plaque, suitcase } };
};

// ======================================================================== the Virginia gas station + grocery (night)
export type StationParts = { board: DynTex; days: DynTex; hands: THREE.Mesh[]; avalanche: THREE.Mesh };
export const buildStation = (root: THREE.Object3D): { parts: StationParts; lights: Practical[] } => {
  const b = new Batch(), O = OFF.station, P = (x: number, y: number, z: number) => V(O + x, y, z);
  floorQuad(b, O - 40, O + 40, -4, 14, 0, lam("forecourt", () => ({ map: rep(stoneHD("concreteHD", ["#8a8a90", "#848490", "#90909a", "#80808a"], "#6a6a74"), 16, 6), color: "#b0b0b8" })));
  floorQuad(b, O - 40, O + 40, 14, 30, 0, col("road2", "#3a3a44"));
  // the store: walls with two big windows and a door, roof sign, posters; inside a floor, shelves, fridge, the counter
  const wall = lam("storeWall", () => ({ map: rep(brick(), 3, 1.5), color: "#c8b8a8" })), Zf = -4, Zb = -8, H = 3.3;
  b.add(quad(P(-4.5, 0, Zb), P(4.5, 0, Zb), P(4.5, H, Zb), P(-4.5, H, Zb), 1, 1), lam("storeIn", () => ({ map: rep(plasterTex("#e8e0cc"), 3, 1), side: THREE.DoubleSide })));
  for (const s of [-1, 1]) b.add(boxGeo(P(s > 0 ? 4.4 : -4.5, 0, Zb), P(s > 0 ? 4.5 : -4.4, H, Zf)), wall);
  const front = (x0: number, x1: number, y0: number, y1: number) => b.add(boxGeo(P(x0, y0, Zf - 0.15), P(x1, y1, Zf)), wall);
  front(-4.5, -3.7, 0, H); front(-0.7, 0.7, 2.3, H); front(3.7, 4.5, 0, H); front(-3.7, -0.7, 0, 0.6); front(0.7, 3.7, 0, 0.6); front(-3.7, -0.7, 2.6, H); front(0.7, 3.7, 2.6, H);
  b.add(boxGeo(P(-4.6, H, Zb - 0.1), P(4.6, H + 0.2, Zf + 0.2)), col("storeRoof", "#4a4a54"));
  floorQuad(b, O - 4.4, O + 4.4, Zb, Zf, 0.01, col("storeFloor", "#d8d0c0"));
  const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.7, 0.85), transparent: true, opacity: 0.12, depthWrite: false });
  for (const [x0, x1] of [[-3.7, -0.7], [0.7, 3.7]] as const) { const g = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.0), glass); g.position.set(O + (x0 + x1) / 2, 1.6, Zf + 0.01); g.layers.set(NOINK); root.add(g); }
  signMesh(root, neonTex("GAS · GROCERY", "#7ae0ff"), 6.4, 1.1, [O, H + 0.85, Zf + 0.12], 0, 1.6);
  signMesh(root, signTex("vaPoster", 512, 704, "#1f3f7a", "#ffffff", "VIRGINIA", "LOTTERY"), 0.7, 0.96, [O + 3.1, 1.55, Zf + 0.03]);
  signMesh(root, signTex("coldDrinks", 512, 256, "#c23a2a", "#ffffff", "COLD DRINKS"), 0.8, 0.4, [O + 1.4, 2.25, Zf + 0.03]);
  const board = new DynTex(1024, 420);
  const bm = plane(2.2, 0.9, glow("boardGlow", 1.35, 1.35, 1.35, board.tex)); bm.position.set(...STATION.board); bm.layers.set(NOINK); root.add(bm);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) { // shelves of goods (left half), a fridge (back right)
    b.add(boxGeo(P(-3.9, 0.3 + r * 0.55, -7.6 + k * 0.42), P(-3.4, 0.33 + r * 0.55, -7.25 + k * 0.42)), col("shelf", "#bab2a6"));
    b.add(boxGeo(P(-3.85, 0.33 + r * 0.55, -7.58 + k * 0.42), P(-3.45, 0.62 + r * 0.55, -7.3 + k * 0.42)), col("goods" + ((r + k) % 5), ["#e2453c", "#f2c94a", "#3f8ad8", "#4fb36a", "#f28a2c"][(r + k) % 5]));
  }
  const fridge = plane(1.4, 2.0, glow("fridge", 1.1, 1.25, 1.35, ctex("fridgeGlass", 256, 384, (g) => { g.fillStyle = "#cfe8f4"; g.fillRect(0, 0, 256, 384); for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { g.fillStyle = ["#e2453c", "#4fb36a", "#f2c94a", "#3f8ad8"][(r + k) % 4]; g.fillRect(14 + k * 40, 20 + r * 74, 24, 54); } })));
  fridge.position.set(O + 3.4, 1.15, Zb + 0.05); fridge.layers.set(NOINK); root.add(fridge);
  const [cx, cyy, cz] = STATION.counter;
  b.add(boxGeo(V(cx - 1.3, 0, cz - 0.35), V(cx + 1.3, cyy, cz + 0.35)), lam("counterWood", () => ({ map: rep(beamHD(), 1, 1), color: "#8a5a3a" })));
  b.add(boxGeo(V(cx - 1.35, cyy, cz - 0.4), V(cx + 1.35, cyy + 0.04, cz + 0.4)), col("counterTop", "#d8d0c0"));
  b.add(boxGeo(V(cx + 0.5, cyy + 0.04, cz - 0.25), V(cx + 0.95, cyy + 0.32, cz + 0.05)), col("register", "#5a5a66"));
  b.add(boxGeo(V(cx - 0.9, cyy + 0.04, cz - 0.25), V(cx - 0.5, cyy + 0.45, cz - 0.05)), col("terminal", "#2f4a8a"));
  signMesh(root, signTex("terminalScreen", 256, 192, "#1a2a4a", "#7ae0ff", "LOTTO"), 0.3, 0.22, [cx - 0.7, cyy + 0.32, cz - 0.04], 0, 1.3);
  // wall clock (hands animated) + the DAYS LEFT calendar
  const [kx, ky, kz] = STATION.clock;
  const face = plane(0.62, 0.62, lit("clockFace", ctex("clockFaceVA", 256, 256, (g) => { g.fillStyle = "#f4f0e6"; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#2a2a3a"; g.lineWidth = 10; g.stroke(); g.fillStyle = "#2a2a3a"; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillRect(128 + 100 * Math.sin(a) - 5, 128 - 100 * Math.cos(a) - 5, 10, 10); } })));
  face.position.set(kx, ky, kz + 0.02); root.add(face);
  const hands = [0.16, 0.24].map((L, i) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.025, L, 0.01).translate(0, L / 2, 0), col("hand" + i, "#2a2a3a")); h.position.set(kx, ky, kz + 0.04 + 0.005 * i); root.add(h); return h; });
  const days = new DynTex(384, 448);
  const dm = plane(0.42, 0.5, lit("days", days.tex)); dm.position.set(...STATION.days); root.add(dm);
  // the ticket avalanche on the counter (scaled up in shot 19-20)
  const avalanche = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), lit("avalanche", rep(ticketHeapTex(), 1, 1)));
  avalanche.position.set(cx - 0.2, cyy + 0.02, cz - 0.3); avalanche.castShadow = true; root.add(avalanche);
  // the $1 ticket on the counter (the insert, shot 16) and a coin on it
  const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1).rotateX(-Math.PI / 2), lit("vaTicketM", ticketTex())); tk.position.set(...STATION.ticket); tk.rotation.y = 0.08; root.add(tk);
  b.add(new THREE.CylinderGeometry(0.014, 0.014, 0.003, 20), lam("coin1", () => ({ color: "#c8c0b0" })), tr(STATION.ticket[0] + 0.06, STATION.ticket[1] + 0.003, STATION.ticket[2] + 0.02));
  // the forecourt: canopy with lights, two pump islands, the GAS price sign, a parked car, a street lamp, bins
  b.add(boxGeo(P(-4.6, 4.2, -1.6), P(4.6, 4.6, 2.6)), col("canopy", "#e8e8ee"));
  b.add(boxGeo(P(-4.6, 4.05, -1.6), P(4.6, 4.2, -1.45)), col("canopyStripe", "#c23a2a")); b.add(boxGeo(P(-4.6, 4.05, 2.45), P(4.6, 4.2, 2.6)), col("canopyStripe", "#c23a2a"));
  for (const x of [-2.4, 2.4]) {
    b.add(cyl(0.12, 0.12, 4.2), col("canopyPost", "#d8d8e0"), tr(O + x, 0, 0.5));
    const pl = plane(2.0, 1.0, glow("canopyLight", 2.2, 2.2, 2.0)); pl.rotation.x = Math.PI / 2; pl.position.set(O + x, 4.04, 0.5); pl.layers.set(NOINK); root.add(pl);
    b.add(boxGeo(P(x - 0.9, 0, 0.1), P(x + 0.9, 0.18, 0.9)), col("island", "#bab2a6"));
    for (const s of [-1, 1]) {
      b.add(boxGeo(P(x + s * 0.45 - 0.25, 0.18, 0.3), P(x + s * 0.45 + 0.25, 1.6, 0.7)), col("pump", "#e2453c"));
      b.add(boxGeo(P(x + s * 0.45 - 0.22, 1.2, 0.71), P(x + s * 0.45 + 0.22, 1.5, 0.72)), col("pumpScreen", "#1a2a2a"));
      b.add(boxGeo(P(x + s * 0.45 - 0.28, 1.6, 0.25), P(x + s * 0.45 + 0.28, 1.75, 0.75)), col("pumpTop", "#f4f0e6"));
    }
  }
  b.add(cyl(0.12, 0.12, 5.4), col("signPole", "#8a8a90"), tr(O + 5.6, 0, -1.2));
  signMesh(root, signTex("gasPrice", 512, 512, "#1a1a22", "#ffd040", "GAS", "$1.05"), 1.6, 1.6, [O + 5.6, 5.0, -1.05], 0, 1.4);
  const car = new Batch(); // a parked car
  car.add(boxGeo(V(-1.0, 0.3, -2.0), V(1.0, 0.95, 2.0)), col("carBody", "#3f6fb5")); car.add(boxGeo(V(-0.85, 0.95, -1.0), V(0.85, 1.45, 1.0)), col("carTop", "#3f6fb5"));
  car.add(boxGeo(V(-0.87, 1.0, -0.95), V(0.87, 1.4, 0.95)), col("carGlass", "#1a2a3a"));
  for (const [x, z] of [[-1.0, -1.3], [1.0, -1.3], [-1.0, 1.3], [1.0, 1.3]] as const) car.add(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 16).rotateZ(Math.PI / 2), col("tyre", "#1a1a1e"), tr(x, 0.32, z));
  const carG = new THREE.Group(); car.build(carG, true); carG.position.set(O + 6.2, 0, 4.2); carG.rotation.y = 0.3; root.add(carG);
  lampPost(b, O - 6.5, 6.5, 4.0);
  for (const x of [-4.0, 4.0]) b.add(cyl(0.25, 0.25, 0.9), col("binVA", "#2a4a3a"), tr(O + x, 0, -3.3));
  for (let k = 0; k < 4; k++) b.add(boxGeo(P(-4.3 + k * 0.5, 0, -3.6), P(-3.9 + k * 0.5, 0.45, -3.2)), col("iceBox" + (k % 2), k % 2 ? "#3f8ad8" : "#f4f0e6"));
  b.build(root, true);
  const lights: Practical[] = [
    { place: "station", pos: [O - 2.4, 3.9, 0.5], color: "#eaf2ff", intensity: 26, distance: 9 },
    { place: "station", pos: [O + 2.4, 3.9, 0.5], color: "#eaf2ff", intensity: 26, distance: 9 },
    { place: "station", pos: [O + 0.5, 2.9, -6.0], color: "#ffd8a0", intensity: 18, distance: 7 },
    { place: "station", pos: [O + 5.6, 4.6, 0.2], color: "#ffcf60", intensity: 8, distance: 6 },
  ];
  for (const x of [-2.4, 2.4]) { const p = pool(5.5, 4.5, 0.16, 0.17, 0.2, "canopy"); p.rotation.x = -Math.PI / 2; p.position.set(O + x, 0.006, 0.6); root.add(p); }
  const wp = pool(7, 3, 0.2, 0.15, 0.08, "storeSpill"); wp.rotation.x = -Math.PI / 2; wp.position.set(O, 0.007, Zf + 1.2); root.add(wp);
  return { parts: { board, days, hands, avalanche }, lights };
};

// ======================================================================== the Melbourne warehouse (print room)
export type WareParts = { gold: THREE.Mesh };
export const buildWarehouse = (root: THREE.Object3D): { parts: WareParts; lights: Practical[] } => {
  const b = new Batch(), O = OFF.warehouse, P = (x: number, y: number, z: number) => V(O + x, y, z);
  floorQuad(b, O - 9, O + 9, -8, 6, 0, lam("concrete", () => ({ map: rep(stoneHD("concreteHD", ["#8a8a90", "#848490", "#90909a", "#80808a"], "#6a6a74"), 6, 5), color: "#c8c0b4" })));
  const bw = lam("wareBrick", () => ({ map: rep(brick(), 5, 2.5), color: "#d8b8a0", side: THREE.DoubleSide }));
  b.add(quad(P(-9, 0, -8), P(9, 0, -8), P(9, 6, -8), P(-9, 6, -8), 1, 1), bw);
  b.add(quad(P(-9, 0, 6), P(-9, 0, -8), P(-9, 6, -8), P(-9, 6, 6), 1, 1), bw); b.add(quad(P(9, 0, -8), P(9, 0, 6), P(9, 6, 6), P(9, 6, -8), 1, 1), bw);
  b.add(quad(P(-9, 6, -8), P(9, 6, -8), P(9, 6, 6), P(-9, 6, 6)), col("wareRoof", "#3a3a44"));
  for (const z of [-6, -3, 0, 3]) b.add(boxGeo(P(-9, 5.6, z - 0.12), P(9, 5.85, z + 0.12)), col("truss", "#5a4a3a"));
  signMesh(root, signTex("printRoom", 1024, 256, "#2a3a2a", "#f2e6c0", "PRINT ROOM"), 3.2, 0.8, [O, 4.4, -7.95]);
  // presses: dark green bodies, rollers, feed trays, output stacks of tickets
  for (const x of [-4.2, -0.5, 3.4]) {
    b.add(boxGeo(P(x - 1.0, 0, -4.4), P(x + 1.0, 1.5, -3.2)), col("press", "#3a5a4a"));
    b.add(boxGeo(P(x - 0.9, 1.5, -4.3), P(x + 0.9, 1.75, -3.3)), col("pressTop", "#2a3a32"));
    for (let k = 0; k < 3; k++) b.add(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 16).rotateZ(Math.PI / 2), col("roller", "#8a8a90"), tr(O + x, 1.85 + k * 0.05, -4.0 + k * 0.32));
    b.add(boxGeo(P(x - 0.5, 0.9, -3.2), P(x + 0.5, 0.95, -2.6)), col("tray", "#8a8a90"));
    b.add(boxGeo(P(x - 0.4, 0.95, -3.1), P(x + 0.4, 1.15, -2.7)), lit("trayStack", rep(ticketHeapTex(), 0.4, 0.2)));
    b.add(cyl(0.3, 0.3, 1.4).rotateX(Math.PI / 2), col("paperRoll", "#f4f0e6"), tr(O + x, 2.1, -4.6));
  }
  // crates stencilled TICKETS, pallets, paper rolls stacked
  const tickets = signTex("ticketsStencil", 512, 256, "#b08458", "#3a2a1a", "TICKETS", "", undefined, "#7a5638");
  for (const [x, z, y] of [[-7.5, -6.5, 0], [-6.7, -6.5, 0], [-7.1, -6.5, 0.8], [6.8, -5.8, 0], [7.6, -5.8, 0], [7.2, 1.5, 0], [-7.6, 2.2, 0]] as const) {
    b.add(boxGeo(P(x - 0.4, y, z - 0.4), P(x + 0.4, y + 0.8, z + 0.4)), lam("crateW", () => ({ map: rep(beamHD(), 1, 1), color: "#b08458" })));
    const s = plane(0.72, 0.36, lit("tksten", tickets)); s.position.set(O + x, y + 0.4, z + 0.41); root.add(s);
  }
  for (let k = 0; k < 5; k++) b.add(cyl(0.35, 0.35, 1.3), col("paperRoll", "#f4f0e6"), tr(O + 5.8 + (k % 3) * 0.75, 0, 3.6 + Math.floor(k / 3) * 0.8));
  b.add(boxGeo(P(-3.5, 0, 3.2), P(-2.3, 0.14, 4.4)), col("pallet", "#a8805a"));
  // the ticket pile (the winning ticket glows in it)
  b.add(new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, 0, Math.PI / 2), lit("warePile", rep(ticketHeapTex(), 3, 2)), new THREE.Matrix4().compose(V(...WARE.pile), new THREE.Quaternion(), V(2.6, 1.25, 2.0)));
  const gold = plane(0.2, 0.1, glow("goldTicket", 3.2, 2.6, 1.2, ticketTex())); gold.position.set(...WARE.gold); gold.rotation.set(-1.1, 0.3, 0.2); gold.layers.set(NOINK); root.add(gold);
  // a tea table for Stefan
  b.add(cyl(0.25, 0.25, 0.04), col("teaTable", "#8a5a3a"), tr(O + 2.6, 0.7, 1.5)); b.add(cyl(0.03, 0.03, 0.7), col("teaLeg", "#5a3a22"), tr(O + 2.6, 0, 1.5));
  // hanging work lamps (practicals) with floor pools
  const lights: Practical[] = [];
  const shade = twoTone(new THREE.MeshPhongMaterial({ color: "#2f5a4a", specular: "#cfe8d0", shininess: 40, side: THREE.DoubleSide }));
  for (const [x, z] of [[-4.2, -3.0], [-0.5, -2.6], [3.4, -3.0], [0.5, 1.6]] as const) {
    b.add(cyl(0.01, 0.01, 1.6), col("lampCord", "#1a1a1e"), tr(O + x, 4.4, z));
    b.add(new THREE.ConeGeometry(0.38, 0.3, 20, 1, true).translate(0, -0.15, 0), shade, tr(O + x, 4.55, z));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), lanternCore()); bulb.position.set(O + x, 4.28, z); bulb.layers.set(NOINK); root.add(bulb);
    lights.push({ place: "warehouse", pos: [O + x, 4.15, z], color: "#ffc070", intensity: 16, distance: 7 });
    const p = pool(3.4, 3.4, 0.2, 0.13, 0.05, "wareLamp"); p.rotation.x = -Math.PI / 2; p.position.set(O + x, 0.006, z); root.add(p);
  }
  b.build(root, true);
  return { parts: { gold }, lights };
};

// ======================================================================== the lottery office
export type OfficeParts = { cover: THREE.Group; stamp: THREE.Group; notice: THREE.Mesh };
export const buildOffice = (root: THREE.Object3D): { parts: OfficeParts; lights: Practical[] } => {
  const b = new Batch(), O = OFF.office, P = (x: number, y: number, z: number) => V(O + x, y, z);
  floorQuad(b, O - 5, O + 5, -4.2, 4, 0, col("officeCarpet", "#5a6a7a"));
  const panel = lam("panelWall", () => ({ map: rep(beamHD(), 3, 2), color: "#9a7050", side: THREE.DoubleSide }));
  b.add(quad(P(-5, 0, -4.2), P(5, 0, -4.2), P(5, 3.0, -4.2), P(-5, 3.0, -4.2), 1, 1), panel);
  b.add(quad(P(-5, 0, 4), P(-5, 0, -4.2), P(-5, 3, -4.2), P(-5, 3, 4), 1, 1), panel); b.add(quad(P(5, 0, -4.2), P(5, 0, 4), P(5, 3, 4), P(5, 3, -4.2), 1, 1), panel);
  b.add(quad(P(-5, 3, -4.2), P(5, 3, -4.2), P(5, 3, 4), P(-5, 3, 4)), col("officeCeil", "#e8e0d0"));
  // blinds window (daylight stripes), filing cabinets, a certificate, a clock, a water cooler, the door sign
  const blind = plane(2.2, 1.4, glow("blinds", 1.3, 1.3, 1.2, ctex("blindsTex", 256, 256, (g) => { for (let y = 0; y < 256; y += 16) { g.fillStyle = "#f4f0e0"; g.fillRect(0, y, 256, 10); g.fillStyle = "#c8c0a8"; g.fillRect(0, y + 10, 256, 6); } })));
  blind.position.set(O + 2.4, 1.8, -4.18); blind.layers.set(NOINK); root.add(blind);
  for (let k = 0; k < 6; k++) { const s = pool(2.2, 0.18, 0.1, 0.09, 0.06, "stripe" + k); s.rotation.x = -Math.PI / 2; s.position.set(O + 1.7, 0.006, -2.9 + k * 0.35); root.add(s); }
  for (const x of [-4.3, -3.7, -3.1]) { b.add(boxGeo(P(x - 0.28, 0, -4.15), P(x + 0.28, 1.35, -3.6)), col("cabinet", "#8a9098")); for (let k = 0; k < 3; k++) b.add(boxGeo(P(x - 0.1, 0.3 + k * 0.42, -3.59), P(x + 0.1, 0.34 + k * 0.42, -3.56)), col("handle", "#c8c8d0")); }
  signMesh(root, signTex("cert", 512, 384, "#f4ecd8", "#2a2a3a", "STATE LOTTERY", "COMMISSION"), 0.8, 0.6, [O - 1.3, 2.0, -4.17]);
  signMesh(root, signTex("officeRules", 512, 384, "#1f3f7a", "#ffffff", "RULES", "SINCE 1988"), 0.7, 0.52, [O + 0.3, 2.25, -4.17]);
  b.add(cyl(0.18, 0.18, 0.04).rotateX(Math.PI / 2), col("clockRim", "#5a3a26"), tr(O - 0.4, 2.45, -4.17));
  b.add(cyl(0.18, 0.2, 1.1), col("cooler", "#d8e0e8"), tr(O + 4.2, 0, -3.4)); b.add(cyl(0.16, 0.16, 0.45), lam("coolerBottle", () => ({ color: "#8ac8f0" })), tr(O + 4.2, 1.1, -3.4));
  // the desk with the RULES binder (its cover slams shut), the notice, the stamp
  const [dx, , dz] = OFFICE.desk;
  b.add(boxGeo(V(dx - 1.1, 0.74, dz - 0.5), V(dx + 1.1, 0.78, dz + 0.5)), lam("officeDesk", () => ({ map: rep(beamHD(), 1, 1), color: "#6a4028" })));
  b.add(boxGeo(V(dx - 1.05, 0, dz - 0.45), V(dx - 0.55, 0.74, dz + 0.45)), lam("officeDesk", () => ({ map: rep(beamHD(), 1, 1), color: "#6a4028" })));
  b.add(boxGeo(V(dx + 0.55, 0, dz - 0.45), V(dx + 1.05, 0.74, dz + 0.45)), lam("officeDesk", () => ({ map: rep(beamHD(), 1, 1), color: "#6a4028" })));
  const [bx, by, bz] = OFFICE.binder;
  b.add(boxGeo(V(bx - 0.2, by, bz - 0.15), V(bx + 0.2, by + 0.07, bz + 0.15)), col("binderBody", "#f4f0e6"));
  const cover = new THREE.Group(); cover.position.set(bx - 0.2, by + 0.07, bz); root.add(cover);
  const cv = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.32).translate(0.21, 0, 0), lit("binderCover", signTex("rulesBinder", 512, 384, "#1f3f7a", "#ffffff", "RULES")));
  cover.add(cv);
  const notice = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.385).rotateX(-Math.PI / 2), lit("noticeA", noticeTex(false)));
  notice.position.set(...OFFICE.notice); notice.rotation.y = -0.1; root.add(notice);
  const stamp = new THREE.Group(), sb2 = new Batch();
  sb2.add(boxGeo(V(-0.07, 0, -0.04), V(0.07, 0.03, 0.04)), col("stampBase", "#3a3a40")); sb2.add(cyl(0.02, 0.02, 0.12), col("stampNeck", "#8a5a3a"), tr(0, 0.03, 0));
  sb2.add(new THREE.SphereGeometry(0.045, 12, 10), col("stampKnob", "#c23a2a"), tr(0, 0.17, 0)); sb2.build(stamp, true);
  stamp.traverse((o) => { o.matrixAutoUpdate = true; }); root.add(stamp);
  for (const [x, z] of [[-0.85, -1.5], [0.85, -1.5]] as const) { // green banker's lamps (practicals)
    b.add(cyl(0.08, 0.09, 0.03), col("lampBrassO", "#b8903a"), tr(O + x, 0.78, z)); b.add(cyl(0.01, 0.01, 0.3), col("lampBrassO", "#b8903a"), tr(O + x, 0.81, z));
    b.add(new THREE.CylinderGeometry(0.07, 0.16, 0.1, 18, 1, true).rotateZ(Math.PI / 2), twoTone(new THREE.MeshPhongMaterial({ color: "#2f7a4a", side: THREE.DoubleSide })), tr(O + x, 1.12, z));
  }
  b.add(boxGeo(V(dx - 0.95, 0.78, dz - 0.35), V(dx - 0.65, 0.98, dz - 0.15)), col("inTray", "#8a8a90"));
  b.build(root, true);
  return { parts: { cover, stamp, notice }, lights: [
    { place: "office", pos: [O - 0.85, 1.05, -1.4], color: "#ffcf8a", intensity: 3.5, distance: 3 },
    { place: "office", pos: [O + 0.85, 1.05, -1.4], color: "#ffcf8a", intensity: 3.5, distance: 3 },
  ] };
};

// ======================================================================== the tropical island
export type IslandParts = { plaque: DynTex };
export const buildIsland = (root: THREE.Object3D): { parts: IslandParts } => {
  const b = new Batch(), O = OFF.island, P = (x: number, y: number, z: number) => V(O + x, y, z);
  floorQuad(b, O - 60, O + 60, -8, 40, 0, lam("islandSand", () => ({ map: rep(stoneHD("sandHD2", ["#f0dcae", "#ead4a2", "#f4e2b8", "#e6cf9c"], "#dcc290"), 30, 12), color: "#fff4dc" })));
  const sea = twoTone(new THREE.MeshLambertMaterial({ color: "#3ab8c8" }));
  b.add(quad(P(-400, -0.05, -8), P(400, -0.05, -8), P(400, -0.05, -600), P(-400, -0.05, -600), 1, 1), sea);
  for (const [x, z, h, sd] of [[-1.6, -0.2, 6.2, 11], [1.6, -0.1, 5.6, 12], [-5.5, -2.5, 7.2, 13], [5.8, -3.0, 6.6, 14], [-10, 1.5, 6.0, 15], [9.5, 2.0, 7.0, 16]] as const) palm(b, O + x, 0, z, h, sd);
  // the hammock between the two near palms (a sagging striped strip)
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(P(-1.45 + 2.9 * t, 1.25 - 0.55 * Math.sin(Math.PI * t), 0)); }
  const curve = new THREE.CatmullRomCurve3(pts), seg = 40, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) { const p = curve.getPoint(i / seg); for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z + s * 0.38); uv.push(i / seg, s > 0 ? 1 : 0); } }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); hg.setIndex(idx); hg.computeVertexNormals();
  b.add(hg, lam("hammock", () => ({ map: ctex("hammockTex", 256, 64, (g) => { for (let x = 0; x < 256; x += 32) { g.fillStyle = (x / 32) % 2 ? "#f2c94a" : "#e2453c"; g.fillRect(x, 0, 32, 64); } }), side: THREE.DoubleSide })));
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.01, 0.01, 0.5).rotateZ(s * 1.1), col("hRope", "#c4a272"), tr(O + s * 1.55, 1.28, 0));
  // stump table with a coconut drink, shells, a starfish, a parasol, a little boat far out, the WINS: 14 plaque on the palm
  b.add(cyl(0.22, 0.25, 0.5), col("stump", "#8a5a3a"), tr(O + 1.9, 0, 0.9));
  b.add(new THREE.SphereGeometry(0.12, 14, 10), col("coconut", "#7a5030"), tr(O + 1.9, 0.62, 0.9)); b.add(cyl(0.006, 0.006, 0.22).rotateZ(0.3), col("straw", "#e2453c"), tr(O + 1.9, 0.68, 0.9));
  b.add(new THREE.SphereGeometry(0.05, 8, 6).scale(1.4, 0.6, 1), col("umbrellaPick", "#e86aa8"), tr(O + 1.95, 0.82, 0.9));
  for (let k = 0; k < 7; k++) b.add(new THREE.SphereGeometry(0.06, 8, 6).scale(1, 0.5, 1.2), col("shell" + (k % 2), k % 2 ? "#f4d8c8" : "#f2e6d0"), tr(O - 2.5 + k * 0.8, 0, 1.8 + 0.4 * Math.sin(k)));
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 2.2), col("parasolPole", "#f4f0e6"), tr(O - 3.0, 1.1, 1.0));
  b.add(new THREE.ConeGeometry(1.2, 0.5, 12, 1, true), lam("parasol", () => ({ map: awningTex("#2f6ab5", "#f4f0e6"), side: THREE.DoubleSide })), tr(O - 3.0, 2.3, 1.0));
  b.add(boxGeo(P(18, -0.05, -40.6), P(22, 0.5, -39.4)), col("boat", "#c23a2a")); b.add(cyl(0.04, 0.04, 2.5), col("mast", "#f4f0e6"), tr(O + 20, 0.5, -40));
  b.build(root, true);
  const plaque = new DynTex(768, 256);
  const pm = plane(0.42, 0.14, lit("plaqueI", plaque.tex)); pm.position.set(...ISLAND.plaque); pm.rotation.y = -0.15; root.add(pm);
  plaque.set("14", drawPlaque(14));
  for (let i = 0; i < 6; i++) { // clouds
    const c = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudHD(i % 4), color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
    c.position.set(O - 160 + i * 64, 60 + (i % 3) * 20, -300); c.scale.set(110 + (i % 2) * 40, 55, 1); c.layers.set(NOINK); root.add(c);
  }
  return { parts: { plaque } };
};

// The 2011 living room (room set, shots 16-17): tatami floor, fusuma doors, a low table with a tea set and a bowl of
// mandarins, cushions, the TV on its cabinet, shelves, a wall clock, the "2011 MARCH" calendar, a pendant lamp and a
// floor lamp (warm practicals with pools), and the window onto a utility pole and wires under a grey sky.
// The cup, the lid of the teapot, the pendant lamp and the wires outside are returned for world.ts to shake.
import * as THREE from "three";
import { Batch, V, lam, quad, lanternCore } from "./build";
import { OFF } from "./story";
import { tr, lbox, col, utilityPole } from "./jhouse";
import { tatamiTex, fusumaTex, calendar2011Tex, plasterJTex, groundDetailTex, kawaraTex } from "./jpaint";
import { rep, beamHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { pool, Practical } from "./common";

export type RoomParts = { cup: THREE.Group; lid: THREE.Mesh; lamp: THREE.Group; wires: THREE.Group; tea: THREE.Mesh };
export const ROOM = { table: V(OFF.room + 0.2, 0, -0.3), man: V(OFF.room - 0.32, 0, 0.62), wife: V(OFF.room + 0.62, 0, -1.02), cup: V(OFF.room + 0.02, 0.335, -0.08) };

export const buildRoom = (root: THREE.Object3D): { parts: RoomParts; lights: Practical[] } => {
  const O = OFF.room, P = (x: number, y: number, z: number) => V(O + x, y, z), b = new Batch(), m0 = new THREE.Matrix4();
  const X0 = -2.6, X1 = 2.6, Z0 = -2.4, Z1 = 2.6, HT = 2.45;
  // floor (tatami), ceiling (wood), walls (plaster), fusuma on the left, the window in the back wall
  b.add(quad(P(X0, 0, Z1), P(X1, 0, Z1), P(X1, 0, Z0), P(X0, 0, Z0), 3, 2.4), lam("tatamiM", () => ({ map: rep(tatamiTex(), 1, 1) })));
  b.add(quad(P(X0, HT, Z0), P(X1, HT, Z0), P(X1, HT, Z1), P(X0, HT, Z1), 4, 4), lam("ceilWood", () => ({ map: rep(beamHD(), 4, 4), color: "#b89a74", side: THREE.DoubleSide })));
  const wall = lam("roomWall", () => ({ map: plasterJTex("#e6dcc8"), side: THREE.DoubleSide }));
  const wx0 = -0.3, wx1 = 1.5, wy0 = 0.85, wy1 = 2.1;
  const back = (ax: number, bx: number, ay: number, by: number) => b.add(quad(P(ax, ay, Z0), P(bx, ay, Z0), P(bx, by, Z0), P(ax, by, Z0)), wall);
  back(X0, wx0, 0, HT); back(wx1, X1, 0, HT); back(wx0, wx1, 0, wy0); back(wx0, wx1, wy1, HT);
  b.add(quad(P(X1, 0, Z0), P(X1, 0, Z1), P(X1, HT, Z1), P(X1, HT, Z0)), wall);
  b.add(quad(P(X0, 0, Z1), P(X0, 0, Z0), P(X0, HT, Z0), P(X0, HT, Z1)), lam("fusumaM", () => ({ map: rep(fusumaTex(), 3, 1) })));
  b.add(quad(P(X1, 0, Z1), P(X0, 0, Z1), P(X0, HT, Z1), P(X1, HT, Z1)), wall);
  const wood = lam("roomTrim", () => ({ map: rep(beamHD(), 1, 1), color: "#6a4a32" }));
  lbox(b, wood, m0, O + X0, O + X1, 1.95, 2.02, Z0, Z0 + 0.05); lbox(b, wood, m0, O + X0, O + X1, 0, 0.08, Z0, Z0 + 0.04);
  for (const [ax, ay, bx, by] of [[wx0 - 0.06, wy0 - 0.06, wx1 + 0.06, wy0], [wx0 - 0.06, wy1, wx1 + 0.06, wy1 + 0.06], [wx0 - 0.06, wy0, wx0, wy1], [wx1, wy0, wx1 + 0.06, wy1], [(wx0 + wx1) / 2 - 0.03, wy0, (wx0 + wx1) / 2 + 0.03, wy1]] as const)
    lbox(b, col("aluWin", "#c8ccd0"), m0, O + ax, O + bx, ay, by, Z0 - 0.06, Z0 + 0.04);
  // the low table with the tea set and mandarins
  const [tx, , tz] = [ROOM.table.x, 0, ROOM.table.z];
  b.add(new THREE.CylinderGeometry(0.58, 0.58, 0.04, 40).translate(0, 0.31, 0), lam("chabudai", () => ({ map: rep(beamHD(), 1, 1), color: "#8a5a36" })), tr(tx, 0, tz));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6; lbox(b, wood, tr(tx + Math.cos(a) * 0.4, 0, tz + Math.sin(a) * 0.4), -0.03, 0.03, 0, 0.3, -0.03, 0.03); }
  const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12).scale(1, 0.85, 1), twoTone(new THREE.MeshPhongMaterial({ color: "#7a5a3a", specular: "#806040", shininess: 40 }))); teapot.position.set(tx + 0.18, 0.395, tz - 0.12); root.add(teapot);
  b.add(new THREE.CylinderGeometry(0.012, 0.016, 0.1, 8).rotateZ(-1.0), col("spout", "#7a5a3a"), tr(tx + 0.26, 0.4, tz - 0.12));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.02, 14), twoTone(new THREE.MeshLambertMaterial({ color: "#6a4a30" }))); lid.position.set(tx + 0.18, 0.46, tz - 0.12); root.add(lid);
  b.add(new THREE.CylinderGeometry(0.11, 0.07, 0.07, 20).translate(0, 0.33 + 0.035, 0), col("bowl", "#e8e0d0"), tr(tx - 0.2, 0, tz - 0.18));
  for (let k = 0; k < 5; k++) b.add(new THREE.SphereGeometry(0.035, 10, 8).scale(1, 0.85, 1), col("mikan", "#f2a030"), tr(tx - 0.2 + 0.04 * Math.cos(k * 1.3), 0.405 + (k > 3 ? 0.04 : 0), tz - 0.18 + 0.04 * Math.sin(k * 1.3)));
  lbox(b, col("newspaper", "#e8e4dc"), tr(tx + 0.15, 0.33, tz + 0.22, 0.4), -0.2, 0.2, 0, 0.008, -0.14, 0.14);
  const cup = new THREE.Group(); // the cup that rattles: a yunomi with tea in it
  const cb = new Batch(); cb.add(new THREE.CylinderGeometry(0.036, 0.03, 0.085, 18, 1, true).translate(0, 0.0425, 0), lam("cupClay", () => ({ color: "#5a7a8a", side: THREE.DoubleSide }))); cb.add(new THREE.CircleGeometry(0.03, 16).rotateX(-Math.PI / 2).translate(0, 0.002, 0), col("cupClay2", "#5a7a8a")); cb.build(cup, true);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(0.033, 18).rotateX(-Math.PI / 2), twoTone(new THREE.MeshLambertMaterial({ color: "#8aa050" }))); tea.position.y = 0.07; cup.add(tea);
  cup.position.copy(ROOM.cup); root.add(cup);
  // cushions, the TV, shelves, the clock, the calendar, a phone, a plant, the floor lamp
  for (const [x, z] of [[ROOM.man.x - O, ROOM.man.z], [ROOM.wife.x - O, ROOM.wife.z], [tx - O - 0.9, tz + 0.1]] as const) b.add(new THREE.BoxGeometry(0.6, 0.08, 0.6).translate(0, 0.04, 0), col("zabuton", "#8a3a4a"), tr(O + x, 0, z, 0.1));
  lbox(b, lam("tvCab", () => ({ map: rep(beamHD(), 1, 1), color: "#5a3a26" })), m0, O + 2.0, O + 2.55, 0, 0.45, -1.4, 0.2);
  lbox(b, col("tvBody", "#1e1e22"), m0, O + 2.38, O + 2.48, 0.5, 1.15, -1.15, -0.05);
  lbox(b, col("tvScreen", "#2a3440"), m0, O + 2.36, O + 2.38, 0.54, 1.11, -1.11, -0.09);
  lbox(b, wood, m0, O + X0 + 0.02, O + X0 + 0.32, 1.4, 1.44, -1.6, -0.2); lbox(b, wood, m0, O + X0 + 0.02, O + X0 + 0.32, 1.78, 1.82, -1.6, -0.2);
  const bookC = ["#7a2a2a", "#2a4a7a", "#3a6a3a", "#c9a46a", "#5a4a6a"];
  for (let k = 0; k < 10; k++) lbox(b, col("rBook" + (k % 5), bookC[k % 5]), m0, O + X0 + 0.04, O + X0 + 0.28, 1.44, 1.62 + 0.04 * (k % 3), -1.58 + k * 0.13, -1.48 + k * 0.13);
  b.add(new THREE.SphereGeometry(0.07, 12, 10), col("daruma", "#c8352a"), tr(O + X0 + 0.16, 1.88, -0.5));
  b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 24).rotateX(Math.PI / 2), col("clockRimR", "#5a3a26"), tr(O + 0.9, 2.2, Z0 + 0.03));
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.145, 24), twoTone(new THREE.MeshLambertMaterial({ color: "#f4efe4" }))); clock.position.set(O + 0.9, 2.2, Z0 + 0.06); root.add(clock);
  for (const [len, a] of [[0.09, 0.9], [0.12, 3.6]] as const) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.012, len, 0.004).translate(0, len / 2, 0), col("clockHand", "#2a2a2a")); h.position.set(O + 0.9, 2.2, Z0 + 0.07); h.rotation.z = a; root.add(h); }
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.59), twoTone(new THREE.MeshLambertMaterial({ map: calendar2011Tex() }))); cal.position.set(O - 1.2, 1.72, Z0 + 0.012); root.add(cal);
  lbox(b, col("phoneTable", "#6a4a32"), m0, O - 2.5, O - 2.0, 0, 0.7, 0.9, 1.4); lbox(b, col("phone", "#e8e4dc"), m0, O - 2.38, O - 2.12, 0.7, 0.78, 1.05, 1.25);
  b.add(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 14).translate(0, 0.15, 0), col("potR", "#b8704a"), tr(O + 2.2, 0, Z0 + 0.35)); b.add(new THREE.SphereGeometry(0.28, 12, 10).scale(1, 1.4, 1), col("plantR", "#4a8a3a"), tr(O + 2.2, 0.62, Z0 + 0.35));
  b.add(new THREE.CylinderGeometry(0.015, 0.015, 1.5).translate(0, 0.75, 0), col("lampStand", "#2a2a2e"), tr(O - 2.2, 0, Z0 + 0.4));
  b.add(new THREE.CylinderGeometry(0.12, 0.2, 0.28, 16, 1, true), lam("lampShadeF", () => ({ color: "#f2e2c0", side: THREE.DoubleSide })), tr(O - 2.2, 1.55, Z0 + 0.4));
  // the pendant lamp over the table (it swings in the quake)
  const lamp = new THREE.Group(); lamp.position.set(tx, HT, tz);
  const lb = new Batch(); lb.add(new THREE.CylinderGeometry(0.004, 0.004, 0.7).translate(0, -0.35, 0), col("cordR", "#2a2a2a")); lb.add(new THREE.ConeGeometry(0.26, 0.2, 24, 1, true).translate(0, -0.78, 0), lam("lampShadeP", () => ({ color: "#e8d4a8", side: THREE.DoubleSide }))); lb.build(lamp, true);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), lanternCore()); bulb.position.y = -0.84; bulb.layers.set(NOINK); lamp.add(bulb);
  root.add(lamp);
  const tp = pool(1.6, 1.6, 0.16, 0.11, 0.05, "tablePool"); tp.rotation.x = -Math.PI / 2; tp.position.set(tx, 0.335, tz); root.add(tp);
  const fp = pool(1.8, 1.8, 0.12, 0.08, 0.04, "lampFloorPool"); fp.rotation.x = -Math.PI / 2; fp.position.set(O - 2.0, 0.01, Z0 + 0.6); root.add(fp);
  // outside the window: a utility pole and wires (they sway), the neighbour's roof, the hills, a hedge
  b.add(quad(P(-30, -0.4, 0), P(30, -0.4, 0), P(30, -0.4, -60), P(-30, -0.4, -60), 10, 10), lam("yardGround", () => ({ map: rep(groundDetailTex(), 8, 8), color: "#8a9a6a" })));
  b.add(new THREE.BoxGeometry(9, 4.2, 6).translate(0, 2.1, 0), lam("neighbourWall", () => ({ color: "#d8cdb8" })), tr(O - 3.5, -0.4, -16, 0.1));
  b.add(new THREE.ConeGeometry(6.4, 2.6, 4).rotateY(Math.PI / 4).scale(1, 1, 0.75).translate(0, 5.5, 0), lam("neighbourRoof", () => ({ map: rep(kawaraTex("#4a5462"), 3, 2) })), tr(O - 3.5, -0.4, -16, 0.1));
  b.add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lam("roomHills", () => ({ color: "#5a7a4a" })), new THREE.Matrix4().compose(P(6, -2, -90), new THREE.Quaternion(), V(60, 26, 30)));
  for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(0.7, 10, 8), col("hedgeR", "#4a7a3a"), tr(O - 2 + k * 1.1, 0.0, -5.5));
  const wiresG = new THREE.Group(); root.add(wiresG);
  const wbx = new Batch(); const pts = utilityPole(wbx, O + 1.9, -0.4, -7.5, 0.3, 9); wbx.build(wiresG, true);
  for (let i = 0; i < 3; i++) { // three wires across the window, built in the group's space (world.ts sways the group)
    const a = pts[i], c = a.clone().add(V(-14, -0.3, 3.5)), d = a.clone().add(V(14, -0.4, -3));
    for (const e of [c, d]) { const ps: THREE.Vector3[] = []; for (let k = 0; k <= 10; k++) { const t = k / 10; ps.push(a.clone().lerp(e, t).add(V(0, -0.8 * 4 * t * (1 - t), 0))); } const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps), 14, 0.02, 4), col("wireR", "#1e1e22")); wiresG.add(tube); }
  }
  b.build(root, true);
  const lights: Practical[] = [
    { place: "room", pos: [tx, HT - 0.86, tz], color: "#ffcf8a", intensity: 2.4, distance: 4.5 },
    { place: "room", pos: [O - 2.2, 1.5, Z0 + 0.4], color: "#ffbf70", intensity: 1.6, distance: 3.2 },
  ];
  return { parts: { cup, lid, lamp, wires: wiresG, tea }, lights };
};

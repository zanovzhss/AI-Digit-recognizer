// The coastal town (town set): a flat plain on a bay, the sea toward +z. Instanced houses appear in order from the
// inland edge to the water (the time-lapse of shot 9: growAt), rice fields give way to blocks, power poles follow the
// blocks; roads, the harbour with breakwaters, moored boats and buoys, the fish market (shot 11), the forgotten stone
// in the grass at a street corner (shots 12-13), wooded hills behind. The town sea carries the 2011 wave (shot 19).
import * as THREE from "three";
import { Batch, V, lam, quad } from "./build";
import { OFF, MARKET, OLDSTONE, growAt } from "./story";
import { modernBoat, utilityPole, wires, tr, lbox, col, bicycle, vendingMachine, jHouse } from "./jhouse";
import { kawaraTex, marketSignTex, fishTex, oldStoneTex, groundDetailTex, boatNumTex } from "./jpaint";
import { plant, Inst } from "./forest";
import { rep, rng, ctex, stoneHD } from "./paint";
import { twoTone } from "./shade";
import { TWIN_LAYER, inkTwins, NOINK } from "./ink";
import { waterUniforms, waterMaterial, waterInkMaterial, waterGrid, WaterU } from "./water";
import { crateY } from "./common";

export const SEA_Y_TOWN = -1.6;
export type TownParts = {
  bodies: THREE.InstancedMesh; roofs: THREE.InstancedMesh; poles: THREE.InstancedMesh; keys: Float32Array; mats: THREE.Matrix4[]; roofMats: THREE.Matrix4[];
  fields: { mesh: THREE.Mesh; key: number }[]; lots: { mesh: THREE.Mesh; key: number }[]; poleKeys: Float32Array; poleMats: THREE.Matrix4[];
  harbour: THREE.Group; boats: THREE.Group; water: WaterU; win: THREE.Mesh[]; fish: THREE.Mesh; man: THREE.Vector3;
  trees: THREE.InstancedMesh[]; treeKeys: Float32Array; cloudShadow: THREE.Mesh;
};

const wallTex = () => ctex("townWall", 256, 256, (g) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#5a6470"; for (const [x, y] of [[30, 60], [150, 60], [30, 160], [150, 160]]) g.fillRect(x, y, 70, 52);
  g.fillStyle = "#e8e8e8"; for (const [x, y] of [[30, 60], [150, 60], [30, 160], [150, 160]]) { g.fillRect(x + 33, y, 4, 52); g.fillRect(x, y + 24, 70, 4); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 120, 256, 6);
});
const paddyTex = () => ctex("paddy", 512, 512, (g, r) => {
  g.fillStyle = "#8aa45e"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 8) { g.fillStyle = `rgba(${r() < 0.5 ? "60,110,40" : "150,190,90"},0.35)`; g.fillRect(0, y, 512, 3); }
  g.strokeStyle = "#9a8a5a"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 502); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.stroke();
});
const lotTex = () => ctex("lot", 256, 256, (g, r) => {
  g.fillStyle = "#b8b2a2"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.6 ? "rgba(90,130,60,0.35)" : "rgba(80,76,70,0.2)"; g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 12, 0, Math.PI * 2); g.fill(); }
});
/** unit hip roof (footprint 1 x 1 at y = 0, ridge along x, overhang included by the instance scale) */
const roofUnit = () => {
  const W = 0.5, D = 0.5, rh = 0.32, R = 0.18, g = new THREE.BufferGeometry();
  const a = [-W, 0, D], b = [W, 0, D], c = [R, rh, 0], d = [-R, rh, 0], e = [W, 0, -D], f = [-W, 0, -D];
  const P = [a, b, c, a, c, d, e, f, d, e, d, c, b, e, c, f, a, d].flat();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  const uv: number[] = []; for (let i = 0; i < P.length / 3; i++) uv.push(P[i * 3] + 0.5, P[i * 3 + 2] + 0.5);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
};

export const buildTown = (root: THREE.Object3D): { parts: TownParts } => {
  const O = OFF.town, P = (x: number, y: number, z: number) => V(O + x, y, z), r = rng(23);
  const b = new Batch(), wb = new Batch();
  // ---- ground: the plain, roads, the seawall; hills behind ----
  b.add(quad(P(-760, 0, 0), P(760, 0, 0), P(760, 0, -480), P(-760, 0, -480), 1, 1), lam("townGround", () => ({ map: rep(groundDetailTex(), 120, 40), color: "#a8a888" })));
  const asphalt = lam("asphaltT", () => ({ color: "#6e6c6a" })), line = lam("roadLine", () => ({ color: "#e8e4d8" }));
  const ROADS_Z = [-30, -110, -190, -270, -350, -430], ROADS_X = [-330, -250, -170, -90, -10, 70, 150, 230, 310];
  for (const z of ROADS_Z) { b.add(quad(P(-760, 0.03, z + 4), P(760, 0.03, z + 4), P(760, 0.03, z - 4), P(-760, 0.03, z - 4)), asphalt); for (let x = -740; x < 740; x += 12) b.add(quad(P(x, 0.05, z + 0.15), P(x + 6, 0.05, z + 0.15), P(x + 6, 0.05, z - 0.15), P(x, 0.05, z - 0.15)), line); }
  for (const x of ROADS_X) b.add(quad(P(x - 3, 0.025, 0), P(x + 3, 0.025, 0), P(x + 3, 0.025, -480), P(x - 3, 0.025, -480)), asphalt);
  lbox(b, lam("seawall", () => ({ map: rep(groundDetailTex(), 60, 1), color: "#b8b4aa" })), new THREE.Matrix4(), O - 760, O + 760, -3, 0.6, -1.5, 1.2);
  const hills: [number, number, number, number, number][] = [[-500, -620, 420, 150, 200], [-80, -640, 380, 120, 190], [330, -610, 420, 160, 200], [720, -560, 300, 140, 180], [-860, -480, 300, 120, 220], [960, -420, 260, 100, 200]];
  for (const [x, z, sx, sy, sz] of hills) b.add(new THREE.SphereGeometry(1, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), lam("townHill", () => ({ color: "#5a8a46" })), new THREE.Matrix4().compose(P(x, -6, z), new THREE.Quaternion(), V(sx, sy, sz)));
  const trees: Inst[] = [];
  for (let k = 0; k < 1500; k++) { // trees on the hills behind
    const x = -900 + r() * 1800, z = -470 - r() * 330;
    let y = -1e9;
    for (const [hx, hz, sx, sy, sz] of hills) { const dx = (x - hx) / sx, dz = (z - hz) / sz, d2 = dx * dx + dz * dz; if (d2 < 1) y = Math.max(y, -6 + sy * Math.sqrt(1 - d2)); }
    if (y < 2) continue;
    trees.push({ x: O + x, y, z, h: 12 + 8 * r(), w: 11 + 4 * r(), c: Math.floor(r() * 4) });
  }
  plant(root, "sugi", trees.filter((_, i) => i % 3 !== 0)); plant(root, "round", trees.filter((_, i) => i % 3 === 0).map((t) => ({ ...t, h: t.h * 0.7 })));
  // ---- blocks: fields that turn into lots, houses (instanced) appearing in order, power poles ----
  type House = { x: number; z: number; w: number; d: number; h: number; yaw: number; key: number; wall: string; roof: string };
  const houses: House[] = [], fields: TownParts["fields"] = [], lots: TownParts["lots"] = [], poleSpots: { x: number; z: number; key: number }[] = [];
  const WALLC = ["#e8e0d0", "#d8cdb8", "#f0ece4", "#c8b89a", "#dcd4c8", "#b8c4c8", "#e0d0b8"], ROOFC = ["#4a5462", "#3e4a5c", "#6a4a40", "#56606e", "#3a4048", "#8a5a48"];
  const paddyM = lam("paddyM", () => ({ map: paddyTex() })), lotM = lam("lotM", () => ({ map: rep(lotTex(), 4, 4) }));
  for (let bz = 0; bz < ROADS_Z.length - 1; bz++) for (let bx = 0; bx < ROADS_X.length - 1; bx++) {
    const z0 = ROADS_Z[bz + 1] + 5, z1 = ROADS_Z[bz] - 5, x0 = ROADS_X[bx] + 4, x1 = ROADS_X[bx + 1] - 4;
    const key = 1 - (bz + 0.5) / (ROADS_Z.length - 1) * 0.0 - (ROADS_Z.length - 2 - bz) / (ROADS_Z.length - 1) - 0.06 + 0.08 * r(); // inland blocks first
    const k = Math.max(0, Math.min(0.98, 1 - (bz + 1) / (ROADS_Z.length - 1) + 0.1 * r()));
    void key;
    const blockKey = 1 - k; // 0 = earliest (inland), 1 = last (by the water)
    const fm = new THREE.Mesh(quad(P(x0, 0.02, z1), P(x1, 0.02, z1), P(x1, 0.02, z0), P(x0, 0.02, z0)), paddyM); fm.receiveShadow = true; root.add(fm);
    const lm = new THREE.Mesh(quad(P(x0, 0.015, z1), P(x1, 0.015, z1), P(x1, 0.015, z0), P(x0, 0.015, z0)), lotM); lm.receiveShadow = true; root.add(lm);
    const inner = bz === 0 ? 0.5 : 1; // the block by the water is half harbour front
    fields.push({ mesh: fm, key: (bz === ROADS_Z.length - 2 ? 0 : blockKey) }); lots.push({ mesh: lm, key: (bz === ROADS_Z.length - 2 ? 0 : blockKey) });
    for (let hz = z1 - 6; hz > z0 + 4; hz -= 13) for (let hx = x0 + 6; hx < x1 - 4; hx += 12.5) {
      if (bz === 0 && hx > -60 + O * 0 && hx < 60) continue; // keep the harbour front open
      if (Math.hypot(hx - OLDSTONE[0] + O, hz - OLDSTONE[2]) < 14) continue; // the stone corner
      if (r() < 0.12 * inner) continue;
      const big = r() < 0.25;
      houses.push({ x: hx + (r() - 0.5) * 3, z: hz + (r() - 0.5) * 2, w: big ? 10 : 7 + 2 * r(), d: big ? 8 : 6 + r(), h: big ? 6.5 : r() < 0.5 ? 5.6 : 3.2, yaw: r() < 0.85 ? 0 : Math.PI / 2,
        key: (bz === ROADS_Z.length - 2 ? 0.02 * r() : blockKey + 0.12 * r() * (1 - blockKey)), wall: WALLC[Math.floor(r() * WALLC.length)], roof: ROOFC[Math.floor(r() * ROOFC.length)] });
    }
    poleSpots.push({ x: x0 - 1.5, z: z1 + 3, key: blockKey }, { x: (x0 + x1) / 2, z: z1 + 3, key: blockKey + 0.05 });
  }
  houses.sort((a, c) => a.key - c.key);
  const lotTrees: (Inst & { key: number })[] = [];
  for (const h of houses) if (r() < 0.45) lotTrees.push({ x: O + h.x + (r() < 0.5 ? -1 : 1) * (h.w / 2 + 2), y: 0, z: h.z + (r() - 0.5) * 4, h: 5 + 3 * r(), c: Math.floor(r() * 4), key: h.key + 0.01 });
  lotTrees.sort((a, c2) => a.key - c2.key);
  const treeG = plant(root, "round", lotTrees), treeKeys = new Float32Array(lotTrees.map((t) => t.key));
  const cloudShadow = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), new THREE.MeshBasicMaterial({ map: ctex("cloudShadow", 512, 512, (g, rr) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 512); g.filter = "blur(18px)"; for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(90,96,120,0.55)"; g.beginPath(); g.ellipse(rr() * 512, rr() * 512, 50 + rr() * 70, 30 + rr() * 40, rr() * 3, 0, Math.PI * 2); g.fill(); } g.filter = "none"; }), blending: THREE.MultiplyBlending, premultipliedAlpha: true, transparent: true, depthWrite: false, fog: false }));
  cloudShadow.rotation.x = -Math.PI / 2; cloudShadow.position.set(O, 9.5, -200); cloudShadow.layers.set(NOINK); cloudShadow.renderOrder = 3; root.add(cloudShadow);
  const n = houses.length, keys = new Float32Array(n), mats: THREE.Matrix4[] = [], roofMats: THREE.Matrix4[] = [];
  const bodyM = twoTone(new THREE.MeshLambertMaterial({ map: rep(wallTex(), 1, 1) })), roofM = twoTone(new THREE.MeshLambertMaterial({ map: rep(kawaraTex("#9aa0aa"), 3, 3), side: THREE.DoubleSide }));
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), bodyM, n), roofs = new THREE.InstancedMesh(roofUnit(), roofM, n);
  const q = new THREE.Quaternion(), c = new THREE.Color();
  houses.forEach((h, i) => {
    keys[i] = h.key;
    q.setFromAxisAngle(V(0, 1, 0), h.yaw);
    const m = new THREE.Matrix4().compose(P(h.x, 0, h.z), q, V(h.w, h.h, h.d)); mats.push(m); bodies.setMatrixAt(i, m);
    const rm = new THREE.Matrix4().compose(P(h.x, h.h, h.z), q, V(h.w + 1.2, Math.min(h.w, h.d) * 0.9, h.d + 1.2)); roofMats.push(rm); roofs.setMatrixAt(i, rm);
    bodies.setColorAt(i, c.set(h.wall)); roofs.setColorAt(i, c.set(h.roof));
  });
  for (const im of [bodies, roofs]) { im.instanceMatrix.needsUpdate = true; im.instanceColor!.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; root.add(im); }
  poleSpots.sort((a, c2) => a.key - c2.key);
  const poleGeo = (() => { const g1 = new THREE.CylinderGeometry(0.12, 0.16, 9, 8).translate(0, 4.5, 0), g2 = new THREE.BoxGeometry(2.0, 0.14, 0.14).translate(0, 8.5, 0); const mg = new THREE.BufferGeometry(); const a = g1.toNonIndexed(), b2 = g2.toNonIndexed(); const pos = new Float32Array([...(a.attributes.position.array as Float32Array), ...(b2.attributes.position.array as Float32Array)]); const nor = new Float32Array([...(a.attributes.normal.array as Float32Array), ...(b2.attributes.normal.array as Float32Array)]); mg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); mg.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); return mg; })();
  const poles = new THREE.InstancedMesh(poleGeo, twoTone(new THREE.MeshLambertMaterial({ color: "#a8a49c" })), poleSpots.length);
  const poleKeys = new Float32Array(poleSpots.length), poleMats: THREE.Matrix4[] = [];
  poleSpots.forEach((p, i) => { poleKeys[i] = p.key; const m = new THREE.Matrix4().makeTranslation(O + p.x, 0, p.z); poleMats.push(m); poles.setMatrixAt(i, m); });
  poles.instanceMatrix.needsUpdate = true; poles.castShadow = true; poles.receiveShadow = true; poles.frustumCulled = false; root.add(poles);
  // ---- the harbour: breakwaters, quay, boats, buoys (the breakwater grows in shot 9) ----
  const harbour = new THREE.Group(); root.add(harbour);
  const hb = new Batch(), conc = lam("breakwater", () => ({ map: rep(stoneHD("bwHD", ["#b4b0a6", "#aaa69c", "#bcb8ae", "#a29e94"], "#7a766e"), 8, 1) }));
  lbox(hb, conc, new THREE.Matrix4(), O - 102, O - 92, -3, 1.8, 0, 118); lbox(hb, conc, new THREE.Matrix4(), O - 102, O - 36, -3, 1.8, 112, 122);
  lbox(hb, conc, new THREE.Matrix4(), O + 92, O + 102, -3, 1.8, 0, 100);
  for (let k = 0; k < 40; k++) lbox(hb, col("tetrapod", "#a8a49a"), tr(O + (k < 22 ? -106 : 106), -0.8, 4 + (k % 22) * 5, k), -1.5, 1.5, -1, 1.6, -1.5, 1.5);
  lbox(hb, lam("lighthouseW", () => ({ color: "#f0ece4" })), new THREE.Matrix4(), O - 40, O - 36, 1.8, 9, 115, 119);
  lbox(hb, col("lighthouseR", "#c8352a"), new THREE.Matrix4(), O - 40.2, O - 35.8, 7, 8, 114.8, 119.2);
  hb.build(harbour, true);
  const boats = new THREE.Group(); root.add(boats);
  const bb = new Batch();
  const BOATS: [number, number, number, string][] = [[-70, 10, 1.62, "#2f5f9a"], [-52, 9, 1.5, "#c8352a"], [-36, 11, 1.58, "#2f8a54"], [-8, 9, 1.55, "#2f5f9a"], [18, 10, 1.6, "#d8a030"], [36, 9.5, 1.52, "#2f5f9a"], [56, 11, 1.64, "#c8352a"], [-40, 52, 0.9, "#2f5f9a"], [20, 68, 2.2, "#2f8a54"]];
  for (const [x, z, yaw, s] of BOATS) modernBoat(bb, wb, O + x, SEA_Y_TOWN + 0.55, z, yaw, 8 + (x % 3), s);
  for (let k = 0; k < 18; k++) bb.add(new THREE.SphereGeometry(0.4, 12, 9), col("buoy" + (k % 3), ["#f28a2c", "#f4f0e6", "#e8352a"][k % 3]), tr(O - 80 + r() * 160, SEA_Y_TOWN + 0.15, 25 + r() * 80));
  bb.build(boats, true);
  BOATS.slice(0, 7).forEach(([x, z, yaw], i) => { const nm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.52), lam("bnum" + i, () => ({ map: boatNumTex(String(11 + i * 7)), transparent: true, alphaTest: 0.4 }))); nm.position.set(O + x + Math.cos(yaw) * 2.6, SEA_Y_TOWN + 1.45, z - Math.sin(yaw) * 2.6 + 1.25); nm.rotation.y = yaw - Math.PI / 2; boats.add(nm); });
  // ---- the fish market (shot 11): the shed, the stalls, the fish on ice, the banner ----
  const [mx, , mz] = MARKET, mb = new Batch();
  for (const sx of [-12, -4, 4, 12]) for (const sz of [-5, 5]) lbox(mb, col("shedPost", "#8a8a8e"), new THREE.Matrix4(), mx + sx - 0.15, mx + sx + 0.15, 0, 4.4, mz + sz - 0.15, mz + sz + 0.15);
  mb.add(new THREE.BoxGeometry(26, 0.25, 12.5).translate(mx, 4.5, mz), lam("shedRoof", () => ({ color: "#8aa2b8" })));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), twoTone(new THREE.MeshLambertMaterial({ map: marketSignTex() }))); sign.position.set(mx - 4, 3.6, mz - 6.3); sign.rotation.y = Math.PI; root.add(sign);
  // the vendor's stall: a table with blue crates of fish on ice (the customers stand inland, -z; the sea behind the vendor)
  lbox(mb, lam("stallTable", () => ({ color: "#d8d4cc" })), new THREE.Matrix4(), mx - 1.4, mx + 1.4, 0.82, 0.9, mz - 0.55, mz + 0.55);
  for (const sx of [-1.3, 1.3]) for (const sz of [-0.45, 0.45]) lbox(mb, col("stallLeg", "#6a6a70"), new THREE.Matrix4(), mx + sx - 0.04, mx + sx + 0.04, 0, 0.82, mz + sz - 0.04, mz + sz + 0.04);
  const fishM = lam("fishCut", () => ({ map: fishTex(), alphaTest: 0.5, side: THREE.DoubleSide }));
  for (let k = 0; k < 4; k++) {
    const cx = mx - 1.0 + k * 0.66;
    lbox(mb, col("fishCrate", k % 2 ? "#2f6ab5" : "#3a7ac8"), new THREE.Matrix4(), cx - 0.3, cx + 0.3, 0.9, 1.08, mz - 0.38, mz + 0.38);
    lbox(mb, col("ice", "#e8f2f8"), new THREE.Matrix4(), cx - 0.27, cx + 0.27, 1.0, 1.07, mz - 0.35, mz + 0.35);
    for (let j = 0; j < 4; j++) mb.add(new THREE.PlaneGeometry(0.42, 0.16).rotateX(-Math.PI / 2), fishM, tr(cx + (r() - 0.5) * 0.1, 1.075 + j * 0.004, mz - 0.25 + j * 0.17, 0.2 + (r() - 0.5) * 0.4));
  }
  for (let k = 0; k < 8; k++) crateY(mb, mx - 9 + (k % 4) * 0.7, 0, mz + 3 + Math.floor(k / 4) * 0.7, 0.55, k * 0.3);
  for (let k = 0; k < 3; k++) { // other stalls along the shed
    const sx = mx - 8 + k * 7 + (k > 0 ? 3 : 0); if (Math.abs(sx - mx) < 3) continue;
    lbox(mb, lam("stallTable", () => ({ color: "#d8d4cc" })), new THREE.Matrix4(), sx - 1.3, sx + 1.3, 0.82, 0.9, mz - 0.5, mz + 0.5);
    for (let j = 0; j < 3; j++) lbox(mb, col("fishCrate", "#2f6ab5"), new THREE.Matrix4(), sx - 1.0 + j * 0.7 - 0.28, sx - 1.0 + j * 0.7 + 0.28, 0.9, 1.07, mz - 0.36, mz + 0.36);
  }
  lbox(mb, col("scale", "#c8352a"), new THREE.Matrix4(), mx + 1.05, mx + 1.35, 0.9, 1.15, mz + 0.1, mz + 0.4);
  mb.add(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8).translate(0, 1.3, 0), col("umbPole", "#e8e4dc"), tr(mx + 1.9, 0, mz + 0.9));
  mb.add(new THREE.ConeGeometry(1.5, 0.5, 10, 1, true).translate(0, 2.7, 0), lam("umbrella", () => ({ color: "#d8462a", side: THREE.DoubleSide })), tr(mx + 1.9, 0, mz + 0.9));
  mb.build(root, true);
  // the fish the vendor holds up (shot 11; hidden once the gull has it)
  const fish = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), fishM); root.add(fish);
  // ---- the forgotten stone at a street corner (shots 12-13): tall grass, the stone, a bicycle, a vending machine ----
  const [ox, , oz] = OLDSTONE, sb = new Batch();
  const og = new THREE.SphereGeometry(1, 20, 16).scale(0.42, 0.62, 0.22).translate(0, 0.5, 0);
  const op = og.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < op.count; i++) { const y = op.getY(i); if (y < 0) op.setY(i, y * 0.3); op.setX(i, op.getX(i) * (1 + 0.06 * Math.sin(i))); }
  og.computeVertexNormals();
  const oldStone = new THREE.Mesh(og, twoTone(new THREE.MeshLambertMaterial({ map: oldStoneTex() }))); oldStone.position.set(ox, -0.12, oz); oldStone.castShadow = true; oldStone.receiveShadow = true; root.add(oldStone);
  lbox(sb, lam("cornerWall", () => ({ map: rep(groundDetailTex(), 4, 1), color: "#b8b4aa" })), new THREE.Matrix4(), ox - 5, ox + 6, 0, 0.9, oz - 3.2, oz - 2.8);
  vendingMachine(sb, root, ox - 3.4, 0, oz - 1.8, 0.15);
  const pp = utilityPole(sb, ox + 3.6, 0, oz - 2.2, 0, 9); void pp;
  sb.add(new THREE.CylinderGeometry(0.16, 0.16, 1.1, 12).translate(0, 0.55, 0), col("mailbox", "#c8352a"), tr(ox + 2.4, 0, oz - 1.6));
  jHouse(sb, wb, ox + 1, 0, oz - 12, 0, { w: 9, d: 7, style: "modern", wall: "#d8cdb8", roof: "#4a5462", seed: 77 });
  jHouse(sb, wb, ox - 12, 0, oz - 14, 0.05, { w: 8, d: 7, style: "modern", wall: "#e8e0d0", roof: "#6a4a40", seed: 78 });
  for (const [px, pz] of [[-2.2, 1.6], [2.8, 2.4], [-4.6, 0.6]] as const) { sb.add(new THREE.CylinderGeometry(0.25, 0.2, 0.4, 12).translate(0, 0.2, 0), col("planter", "#8a5a3a"), tr(ox + px, 0, oz + pz)); sb.add(new THREE.SphereGeometry(0.32, 10, 8), col("planterLeaf", "#5a9a3a"), tr(ox + px, 0.6, oz + pz)); }
  sb.build(root, true);
  bicycle(root, ox + 0.78, 0, oz + 0.3, -1.25, 0.2);
  const grass: Inst[] = [];
  const lens = [[ox - 1.0, oz + 4.4, 1.3], [ox - 0.9, oz + 3.7, 1.3], [ox - 0.3, oz + 1.55, 0.45]];
  for (let k = 0; k < 700; k++) {
    const a = r() * 6.283, d = 0.35 + 3.4 * Math.sqrt(r()), x = ox + Math.cos(a) * d * 1.3, z = oz + Math.sin(a) * d * 0.8 + 0.4;
    if (lens.some(([lx, lz, lr]) => Math.hypot(x - lx, z - lz) < lr)) continue;
    grass.push({ x, y: 0, z, h: 0.3 + 0.35 * r() * (d < 1.2 ? 1.3 : 1), w: 0.9 + 0.5 * r(), c: Math.floor(r() * 4) });
  }
  plant(root, "blades", grass, { shadow: false });
  // ---- street dressing: wires along the main road, a few cars, bushes ----
  const bushes: Inst[] = [];
  for (let k = 0; k < 260; k++) bushes.push({ x: O - 700 + r() * 1400, y: 0, z: -20 - r() * 440, h: 1.2 + r(), c: Math.floor(r() * 3) });
  plant(root, "bush", bushes);
  let prev: THREE.Vector3[] | null = null;
  for (let x = -330; x <= 330; x += 33) { const pts = utilityPole(b, O + x, 0, -33.5, 0, 8.5); if (prev) wires(b, prev, pts, 0.6); prev = pts; }
  for (let k = 0; k < 16; k++) { const x = O - 300 + r() * 600, z = ROADS_Z[Math.floor(r() * 4)] + (r() < 0.5 ? 2 : -2), cc = ["#f0f0f0", "#2a2a32", "#c8352a", "#8a9aa8"][k % 4]; lbox(b, col("car" + cc, cc), tr(x, 0, z, Math.PI / 2), -0.85, 0.85, 0.3, 1.2, -2.0, 2.0); lbox(b, col("carGlass", "#2a3442"), tr(x, 0, z, Math.PI / 2), -0.75, 0.75, 1.2, 1.65, -1.0, 0.9); }
  b.build(root, true);
  const tmpG = new THREE.Group(); wb.build(tmpG, false); const win: THREE.Mesh[] = []; for (const ch of [...tmpG.children]) { root.add(ch); win.push(ch as THREE.Mesh); }
  // ---- the town sea (the 2011 wave sweeps in over the plain) ----
  const water = waterUniforms();
  water.uFrontH.value = 12.5; water.uOrigin.value.set(O, 0);
  const wm = waterMaterial(water, "town"), wink = waterInkMaterial(water);
  for (const g of [waterGrid(O - 760, O + 760, -470, 230, 3.5, 3.5), waterGrid(O - 2600, O + 2600, 230, 2700, 26, 12), waterGrid(O - 2600, O - 760, -60, 230, 30, 12), waterGrid(O + 760, O + 2600, -60, 230, 30, 12)]) {
    const mesh = new THREE.Mesh(g, wm); mesh.position.y = SEA_Y_TOWN; mesh.layers.set(TWIN_LAYER); mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false;
    mesh.userData.inkNormal = wink; inkTwins.add(mesh); root.add(mesh);
  }
  void growAt;
  return { parts: { bodies, roofs, poles, keys, mats, roofMats, fields, lots, poleKeys, poleMats, harbour, boats, water, win, fish, man: V(ox, 0.7, oz),
    trees: treeG.children as THREE.InstancedMesh[], treeKeys, cloudShadow } };
};

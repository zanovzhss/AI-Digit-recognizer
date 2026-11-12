// Builders for the stone short's Japanese fishing village and town: houses (thatched minka, timber-and-plaster 1933
// rebuilds, modern two-storey houses), wooden and modern fishing boats, and the village dressing (drying racks, nets,
// paper lanterns, utility poles and wires, stone terrace walls, laundry poles, bicycles, vending machines).
// Static parts go into Batches (one merged mesh per material). Window panes go into their own batch so world.ts can
// switch them between daylight paper / glass and warm lit glow per shot.
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, lanternCore } from "./build";
import { boardsTex, plasterJTex, shojiTex, kawaraTex, thatchTex, sidingTex, tinTex, netTex, vendingTex } from "./jpaint";
import { rep, beamHD, stoneHD, rng } from "./paint";
import { twoTone } from "./shade";

export const tr = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const UB = new THREE.BoxGeometry(1, 1, 1);
/** axis box in the local frame of m */
export const lbox = (b: Batch, mat: THREE.Material, m: THREE.Matrix4, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  b.add(UB, mat, m.clone().multiply(new THREE.Matrix4().compose(V((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), new THREE.Quaternion(), V(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)))));
export const col = (key: string, c: string) => lam(key, () => ({ color: c }));
const cylG = (r0: number, r1: number, h: number, n = 10) => new THREE.CylinderGeometry(r1, r0, h, n).translate(0, h / 2, 0);

// ---------------- windows: one merged batch per world, materials swapped by world.ts ----------------
export type WinKind = "shoji" | "glass";
export const winPaper = () => lam("winPaper", () => ({ map: shojiTex(false) }));
export const winGlassDay = () => { const m = lam("winGlass", () => ({ color: "#4a5a6c" })); return m; };
const glowMats = new Map<string, THREE.MeshBasicMaterial>();
/** self-lit window glow (HDR, blooms): its colour is scaled per shot by world.ts (LIGHTS.windows) */
export const winGlow = (kind: WinKind) => {
  let m = glowMats.get(kind);
  if (!m) { m = new THREE.MeshBasicMaterial({ map: kind === "shoji" ? shojiTex(true) : null, color: kind === "shoji" ? new THREE.Color(1.6, 1.2, 0.75) : new THREE.Color(1.9, 1.35, 0.8), fog: true }); m.name = "winGlow" + kind; glowMats.set(kind, m); }
  return m;
};
export const WIN_BASE = { shoji: new THREE.Color(1.6, 1.2, 0.75), glass: new THREE.Color(1.9, 1.35, 0.8) };

// ---------------- roofs ----------------
/** hip roof over a w x d footprint (local), eaves at y0 with overhang o, ridge along x; thick = fascia depth */
const hipRoof = (b: Batch, m: THREE.Matrix4, w: number, d: number, y0: number, o: number, pitch: number, mat: THREE.Material, fascia: THREE.Material, thick: number, ridgeMat: THREE.Material) => {
  const W = w / 2 + o, D = d / 2 + o, rh = pitch * D, R = Math.max(0.2, W - D);
  const a = V(-W, y0, D), bb = V(W, y0, D), c = V(R, y0 + rh, 0), dd = V(-R, y0 + rh, 0);
  const e = V(W, y0, -D), f = V(-W, y0, -D);
  const t = (u: number) => u / 2.2; // texture metres
  b.add(quad(a, bb, c, dd, t(2 * W), t(Math.hypot(D, rh))), mat, m);
  b.add(quad(e, f, dd, c, t(2 * W), t(Math.hypot(D, rh))), mat, m);
  b.add(tri(bb, e, c), mat, m); b.add(tri(f, a, dd), mat, m);
  // fascia boards (roof thickness) and the ridge cap
  lbox(b, fascia, m, -W, W, y0 - thick, y0, D - 0.12, D); lbox(b, fascia, m, -W, W, y0 - thick, y0, -D, -D + 0.12);
  lbox(b, fascia, m, -W, -W + 0.12, y0 - thick, y0, -D, D); lbox(b, fascia, m, W - 0.12, W, y0 - thick, y0, -D, D);
  lbox(b, ridgeMat, m, -R - 0.15, R + 0.15, y0 + rh - 0.08, y0 + rh + 0.22, -0.22, 0.22);
  return rh;
};

// ---------------- houses ----------------
export type HouseStyle = "thatch" | "rebuilt" | "modern";
export type HouseOpts = { w: number; d: number; style: HouseStyle; storeys?: number; wall?: string; roof?: string; seed?: number };
/** a house at (x, y, z) facing local +z turned by yaw; returns the window batch pieces it added */
export const jHouse = (b: Batch, win: Batch, x: number, y: number, z: number, yaw: number, o: HouseOpts) => {
  const m = tr(x, y, z, yaw), r = rng(o.seed ?? 7), w = o.w, d = o.d, hw = w / 2, hd = d / 2;
  const st = o.style, storeys = o.storeys ?? (st === "modern" ? 2 : 1), H = (st === "modern" ? 2.7 : 2.6) * storeys + (st === "thatch" ? 0.2 : 0);
  const stoneBase = lam("jPlinth", () => ({ map: rep(stoneHD("jPlinthHD", ["#8a8478", "#7d776c", "#948e82", "#726c62"], "#4a463e"), 2, 1) }));
  const timber = lam("jTimber", () => ({ map: rep(beamHD(), 1, 1), color: "#4a3426" }));
  // ---- foundation and walls ----
  lbox(b, st === "modern" ? col("concrete", "#9a9a98") : stoneBase, m, -hw - 0.1, hw + 0.1, -0.6, 0.35, -hd - 0.1, hd + 0.1);
  if (st === "modern") {
    const wc = o.wall ?? "#e4dccb";
    const siding = lam("siding" + wc, () => ({ map: rep(sidingTex(wc), 1, 1) }));
    lbox(b, siding, m, -hw, hw, 0.35, H + 0.35, -hd, hd);
    lbox(b, col("jTrimW", "#f4f0e8"), m, -hw - 0.04, hw + 0.04, 2.95, 3.08, -hd - 0.04, hd + 0.04); // floor band
  } else {
    const boards = lam("boards" + (st === "thatch" ? "old" : "new"), () => ({ map: rep(boardsTex(st === "thatch" ? "#4e3a2a" : "#6a4c34"), 1, 1) }));
    const plaster = lam("jPlaster" + st, () => ({ map: plasterJTex(st === "thatch" ? "#c8b48c" : "#ece2cc") }));
    lbox(b, boards, m, -hw, hw, 0.35, 1.4, -hd, hd);
    lbox(b, plaster, m, -hw + 0.02, hw - 0.02, 1.4, H + 0.35, -hd + 0.02, hd - 0.02);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lbox(b, timber, m, sx * hw - 0.12, sx * hw + 0.12, 0.35, H + 0.35, sz * hd - 0.12, sz * hd + 0.12); // corner posts
    lbox(b, timber, m, -hw - 0.05, hw + 0.05, H + 0.15, H + 0.4, hd - 0.1, hd + 0.12); // wall plate
    lbox(b, timber, m, -hw - 0.05, hw + 0.05, 1.32, 1.46, hd, hd + 0.06);
    for (let k = 1; k < Math.floor(w / 1.8); k++) lbox(b, timber, m, -hw + k * (w / Math.floor(w / 1.8)) - 0.07, -hw + k * (w / Math.floor(w / 1.8)) + 0.07, 1.4, H + 0.35, hd - 0.02, hd + 0.04);
    // engawa: a low veranda along the front
    const deck = lam("engawa", () => ({ map: rep(beamHD(), 2, 0.5), color: "#8a6a48" }));
    lbox(b, deck, m, -hw, hw, 0.35, 0.5, hd, hd + 0.85);
    for (const sx of [-0.9, 0, 0.9]) lbox(b, timber, m, sx * hw - 0.06, sx * hw + 0.06, 0.5, H + 0.3, hd + 0.75, hd + 0.87);
    lbox(b, stoneBase, m, -0.5, 0.5, 0, 0.22, hd + 0.85, hd + 1.3); // step stone
  }
  // ---- doors and windows (window batch) ----
  if (st === "modern") {
    const glass = (wx: number, wy: number, ww: number, wh: number, face: number) => { // face 0 front (+z), 1 back
      const zf = face ? -hd - 0.03 : hd + 0.03, s = face ? -1 : 1;
      win.add(quad(V(wx - (s * ww) / 2, wy, zf), V(wx + (s * ww) / 2, wy, zf), V(wx + (s * ww) / 2, wy + wh, zf), V(wx - (s * ww) / 2, wy + wh, zf)), winGlassDay(), m);
      lbox(b, col("aluFrame", "#d8d8dc"), m, wx - ww / 2 - 0.06, wx + ww / 2 + 0.06, wy - 0.08, wy, zf - 0.06 * s, zf + 0.06 * s);
    };
    glass(-hw * 0.45, 0.9, 1.6, 1.3, 0); glass(hw * 0.5, 0.9, 1.2, 1.3, 0); glass(-hw * 0.4, 3.6, 1.2, 1.1, 0); glass(hw * 0.4, 3.6, 1.2, 1.1, 0);
    glass(0, 3.6, 1.0, 1.0, 1);
    lbox(b, col("frontDoor", "#6a4a34"), m, 0.6 - 0.45, 0.6 + 0.45, 0.35, 2.4, hd, hd + 0.05);
    // a small balcony on the upper floor and an AC unit
    lbox(b, col("balcony", "#cfcac0"), m, -hw * 0.75, hw * 0.1, 3.1, 3.2, hd, hd + 0.9);
    lbox(b, col("balconyRail", "#8a8a90"), m, -hw * 0.75, hw * 0.1, 3.2, 3.95, hd + 0.86, hd + 0.92);
    lbox(b, col("acUnit", "#e8e8ea"), m, hw - 0.9, hw - 0.1, 0.4, 1.0, hd + 0.02, hd + 0.35);
  } else {
    const n = Math.max(2, Math.floor(w / 1.6));
    for (let k = 0; k < n; k++) {
      const x0 = -hw + 0.25 + (k * (w - 0.5)) / n, x1 = x0 + (w - 0.5) / n - 0.06;
      win.add(quad(V(x0, 0.5, hd + 0.02), V(x1, 0.5, hd + 0.02), V(x1, 2.25, hd + 0.02), V(x0, 2.25, hd + 0.02)), winPaper(), m);
    }
    // a small side window and two on the back
    win.add(quad(V(hw + 0.02, 1.2, 0.6), V(hw + 0.02, 1.2, -0.6), V(hw + 0.02, 2.0, -0.6), V(hw + 0.02, 2.0, 0.6)), winPaper(), m);
    for (const cx of [-hw * 0.45, hw * 0.4]) win.add(quad(V(cx + 0.55, 1.15, -hd - 0.02), V(cx - 0.55, 1.15, -hd - 0.02), V(cx - 0.55, 2.05, -hd - 0.02), V(cx + 0.55, 2.05, -hd - 0.02)), winPaper(), m);
  }
  // ---- roof ----
  const rcol = o.roof ?? (st === "modern" ? "#4a5462" : "#4e5866");
  if (st === "thatch") {
    const th = lam("thatchHD", () => ({ map: rep(thatchTex(), 1, 1), side: THREE.DoubleSide }));
    const fas = lam("thatchEdge", () => ({ map: rep(thatchTex(), 1, 0.3), color: "#b89a64" }));
    hipRoof(b, m, w, d, H + 0.35, 0.9, 1.0, th, fas, 0.45, lam("thatchRidge", () => ({ color: "#5a4a30" })));
  } else {
    const tile = lam("kawara" + rcol, () => ({ map: rep(kawaraTex(rcol), 1, 1), side: THREE.DoubleSide }));
    hipRoof(b, m, w, d, H + 0.35, st === "modern" ? 0.55 : 0.85, st === "modern" ? 0.5 : 0.62, tile, col("roofEdge" + rcol, "#2e343e"), 0.16, col("ridge" + rcol, "#2a3038"));
  }
  return H;
};

// ---------------- boats ----------------
const hullGeo = new Map<string, THREE.BufferGeometry>();
/** an open wooden hull, length L, beam W, depth D: stern at -L/2 (blunt), bow at +L/2 (pointed, raised); along local +x */
export const hullGeometry = (L: number, W: number, D: number, modern = false) => {
  const key = `${L}_${W}_${D}_${modern}`;
  let g = hullGeo.get(key);
  if (g) return g;
  const nL = 24, nA = 14, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nL; i++) {
    const t = i / nL;
    const wk = (t < 0.12 ? Math.sin((t / 0.12) * Math.PI / 2) ** 0.7 * 0.75 + 0.25 : 1) * (t > 0.62 ? Math.cos(((t - 0.62) / 0.38) * Math.PI / 2) ** 0.75 : 1);
    const hw = (W / 2) * Math.max(0.02, wk), sheer = D * (0.15 * (t - 0.5) ** 2 * 4 + (modern ? 0.1 : 0.45) * Math.max(0, t - 0.7) / 0.3);
    for (let j = 0; j <= nA; j++) {
      const a = (j / nA) * Math.PI;
      const x = -L / 2 + t * L, z = hw * Math.cos(a), yb = -D * Math.sin(a) ** (modern ? 0.6 : 0.85) * (0.45 + 0.55 * Math.min(1, wk * 1.5));
      pos.push(x, yb + sheer, z); uv.push(t * L / 2, j / nA);
    }
  }
  for (let i = 0; i < nL; i++) for (let j = 0; j < nA; j++) { const a = i * (nA + 1) + j, b2 = a + nA + 1; idx.push(a, b2, a + 1, b2, b2 + 1, a + 1); }
  g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  hullGeo.set(key, g);
  return g;
};
/** a wooden fishing boat (1896 / 1933 / the old-style boats of the bay); overturned = keel up on the sand */
export const woodBoat = (b: Batch, x: number, y: number, z: number, yaw: number, L = 6.5, opts: { over?: boolean; oars?: boolean; tint?: string } = {}) => {
  const W = L * 0.24, D = L * 0.11;
  const wood = lam("boatWood" + (opts.tint ?? ""), () => ({ map: rep(beamHD(), 2, 1), color: opts.tint ?? "#8a6a4a", side: THREE.DoubleSide }));
  const dark = col("boatRail", "#4a3424");
  if (opts.over) {
    const m = tr(x, y + D * 0.92, z, yaw).multiply(new THREE.Matrix4().makeRotationX(Math.PI));
    b.add(hullGeometry(L, W, D), wood, m);
    lbox(b, dark, m, -L * 0.45, L * 0.45, -0.02, 0.06, -0.06, 0.06); // keel strip (now on top)
    return;
  }
  const m = tr(x, y, z, yaw);
  b.add(hullGeometry(L, W, D), wood, m);
  for (const s of [-1, 1]) lbox(b, dark, m, -L * 0.42, L * 0.3, D * 0.02, D * 0.12, s * W * 0.47 - 0.04, s * W * 0.47 + 0.04); // gunwales
  for (const tx of [-0.25, 0.05, 0.3]) lbox(b, dark, m, tx * L - 0.08, tx * L + 0.08, -D * 0.25, -D * 0.16, -W * 0.44, W * 0.44); // thwarts
  if (opts.oars !== false) for (const s of [-1, 1]) lbox(b, col("oar", "#b08a5a"), m, -L * 0.35, L * 0.05, D * 0.15, D * 0.2, s * W * 0.3 - 0.03, s * W * 0.3 + 0.03);
};
/** a modern fishing boat: white hull with a blue sheer stripe, a cabin with windows, a mast */
export const modernBoat = (b: Batch, win: Batch, x: number, y: number, z: number, yaw: number, L = 9, stripe = "#2f5f9a") => {
  const W = L * 0.3, D = L * 0.15, m = tr(x, y, z, yaw);
  b.add(hullGeometry(L, W, D, true), lam("hullWhite", () => ({ color: "#f2f0ea", side: THREE.DoubleSide })), m);
  for (const s of [-1, 1]) lbox(b, col("stripe" + stripe, stripe), m, -L * 0.45, L * 0.38, D * 0.05, D * 0.22, s * W * 0.49 - 0.03, s * W * 0.49 + 0.03);
  lbox(b, col("deckGrey", "#b8b4aa"), m, -L * 0.44, L * 0.36, D * 0.1, D * 0.16, -W * 0.44, W * 0.44);
  lbox(b, col("cabin", "#f4f2ec"), m, -L * 0.22, L * 0.06, D * 0.16, D * 0.16 + 1.5, -W * 0.3, W * 0.3);
  lbox(b, col("cabinRoof", "#3a4a6a"), m, -L * 0.24, L * 0.08, D * 0.16 + 1.5, D * 0.16 + 1.62, -W * 0.33, W * 0.33);
  win.add(quad(V(L * 0.061, D * 0.16 + 0.75, -W * 0.25), V(L * 0.061, D * 0.16 + 0.75, W * 0.25), V(L * 0.061, D * 0.16 + 1.3, W * 0.25), V(L * 0.061, D * 0.16 + 1.3, -W * 0.25)), winGlassDay(), m);
  b.add(cylG(0.04, 0.03, 3.2), col("mast", "#e8e8e8"), m.clone().multiply(tr(-L * 0.08, D * 0.16 + 1.6, 0)));
  lbox(b, col("radar", "#e8e8e8"), m, -L * 0.08 - 0.35, -L * 0.08 + 0.35, D * 0.16 + 3.3, D * 0.16 + 3.38, -0.06, 0.06);
  for (const s of [-1, 1]) lbox(b, col("tyreFender", "#2a2a2e"), m, -L * 0.1, L * 0.1, D * -0.1, D * 0.1, s * W * 0.5 - 0.05, s * W * 0.5 + 0.05);
};

// ---------------- dressing ----------------
/** a fish / seaweed drying rack: two A-frames, three bars, hanging strips */
export const dryingRack = (b: Batch, x: number, y: number, z: number, yaw: number, len = 3.2, seed = 1) => {
  const m = tr(x, y, z, yaw), pole = col("rackPole", "#7a5a3a"), r = rng(seed);
  for (const sx of [-len / 2, len / 2]) for (const s of [-1, 1]) {
    const g = cylG(0.035, 0.03, 2.1).rotateX(s * 0.2);
    b.add(g, pole, m.clone().multiply(tr(sx, 0, s * 0.18)));
  }
  for (const yy of [1.95, 1.45]) lbox(b, pole, m, -len / 2 - 0.2, len / 2 + 0.2, yy - 0.03, yy + 0.03, -0.03, 0.03);
  const hang = [col("kelp", "#3a4a2a"), col("fishDry", "#a89a7a"), col("kelp2", "#4a5a30")];
  for (let i = 0; i < Math.floor(len / 0.16); i++) {
    const xx = -len / 2 + 0.1 + i * 0.16, yy = i % 2 ? 1.95 : 1.45, l = 0.35 + 0.35 * r();
    lbox(b, hang[i % 3], m, xx - 0.035, xx + 0.035, yy - l, yy, -0.01, 0.01);
  }
};
/** a net draped over two posts (cut-out mesh) */
export const netOnPosts = (b: Batch, x: number, y: number, z: number, yaw: number, len = 3) => {
  const m = tr(x, y, z, yaw), pole = col("rackPole", "#7a5a3a");
  for (const sx of [-len / 2, len / 2]) b.add(cylG(0.04, 0.035, 1.8), pole, m.clone().multiply(tr(sx, 0, 0)));
  const g = new THREE.PlaneGeometry(len, 1.6, 12, 6), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const xx = p.getX(i), yy = p.getY(i); p.setZ(i, 0.12 * Math.sin(xx * 2.1) * (0.8 - yy / 1.6)); p.setY(i, yy + 0.95 - 0.12 * Math.cos((xx / len) * Math.PI)); }
  g.computeVertexNormals();
  b.add(g, netMat(), m);
};
export const netMat = () => lam("netCut", () => ({ map: rep(netTex(), 3, 2), alphaTest: 0.5, side: THREE.DoubleSide, transparent: false }));
/** a heap of net on the ground */
export const netHeap = (b: Batch, x: number, y: number, z: number, s = 1) =>
  b.add(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.8 * s, 0.35 * s, 0.6 * s), lam("netHeap", () => ({ color: "#6e6048" })), tr(x, y, z));
/** paper lantern (chochin) hanging at (x, y, z): glowing body, dark caps */
export const chochin = (b: Batch, root: THREE.Object3D, x: number, y: number, z: number, s = 1) => {
  const glowM = (() => { const k = "chochinGlow"; const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 1.9, 0.75) }); m.name = k; return m; })();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.17 * s, 16, 12).scale(1, 1.3, 1), glowM); body.position.set(x, y, z); root.add(body);
  for (const dy of [0.21, -0.21]) b.add(cylG(0.09 * s, 0.09 * s, 0.05 * s, 12), col("chochinCap", "#2a1e18"), tr(x, y + dy * s - 0.025 * s, z));
  b.add(cylG(0.006, 0.006, 0.4), col("cord", "#2a2a2a"), tr(x, y + 0.22 * s, z));
  return body;
};
/** standing floor lantern (andon): a paper box glowing warm */
export const andon = (b: Batch, root: THREE.Object3D, x: number, y: number, z: number) => {
  const frame = col("andonFrame", "#3a2618");
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) lbox(b, frame, tr(x, y, z), sx * 0.17 - 0.02, sx * 0.17 + 0.02, 0, 0.75, sz * 0.17 - 0.02, sz * 0.17 + 0.02);
  const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.7, 0.8), map: shojiTex(true) });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), glowM); box.position.set(x, y + 0.42, z); root.add(box);
};
/** a wooden utility / telegraph pole with a cross-arm and insulators; returns the wire attachment points */
export const utilityPole = (b: Batch, x: number, y: number, z: number, yaw: number, h = 8, modern = true): THREE.Vector3[] => {
  const m = tr(x, y, z, yaw), pole = col(modern ? "poleConcrete" : "poleWood", modern ? "#a8a49c" : "#6a5038");
  b.add(cylG(0.16, 0.12, h, 10), pole, m);
  lbox(b, col("crossArm", "#5a5048"), m, -1.0, 1.0, h - 0.6, h - 0.48, -0.06, 0.06);
  const pts: THREE.Vector3[] = [];
  for (const sx of [-0.85, -0.3, 0.3, 0.85]) {
    b.add(cylG(0.05, 0.04, 0.16, 8), col("insulator", "#e8e4dc"), m.clone().multiply(tr(sx, h - 0.48, 0)));
    pts.push(V(sx, h - 0.33, 0).applyMatrix4(m));
  }
  if (modern) { b.add(cylG(0.28, 0.28, 0.75, 12), col("transformer", "#8a8e92"), m.clone().multiply(tr(0.45, h - 2.4, 0.3))); }
  return pts;
};
/** sagging wires between two lists of attachment points (thin dark tubes) */
export const wires = (b: Batch, a: THREE.Vector3[], c: THREE.Vector3[], sag = 0.6) => {
  const wm = col("wire", "#1e1e22");
  for (let i = 0; i < Math.min(a.length, c.length); i++) {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(a[i].clone().lerp(c[i], t).add(V(0, -sag * 4 * t * (1 - t), 0))); }
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.02, 4), wm);
  }
};
/** a dry-stone terrace wall (ishigaki) along a segment, height h */
export const terraceWall = (b: Batch, x0: number, z0: number, x1: number, z1: number, yb: number, h: number) => {
  const st = lam("ishigaki", () => ({ map: rep(stoneHD("ishigakiHD", ["#9a948a", "#8a847a", "#a8a296", "#7d786e"], "#5a554c"), 3, 1) }));
  const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2;
  const m = tr((x0 + x1) / 2, yb, (z0 + z1) / 2, yaw);
  lbox(b, st, m, -len / 2, len / 2, -1.2, h, -0.35, 0.35);
};
/** vegetable rows on a plot (dark soil strips with green clumps) */
export const vegRows = (b: Batch, x: number, y: number, z: number, yaw: number, w = 4, d = 3, seed = 3) => {
  const m = tr(x, y, z, yaw), r = rng(seed), soil = col("soil", "#6a4e36"), leaf = col("vegLeaf", "#5f9a3a"), leaf2 = col("vegLeaf2", "#7aac48");
  for (let k = 0; k < Math.floor(d / 0.6); k++) {
    const zz = -d / 2 + 0.3 + k * 0.6;
    lbox(b, soil, m, -w / 2, w / 2, -0.05, 0.12, zz - 0.18, zz + 0.18);
    for (let i = 0; i < Math.floor(w / 0.35); i++) b.add(new THREE.SphereGeometry(0.13 + 0.05 * r(), 8, 6), i % 2 ? leaf : leaf2, m.clone().multiply(tr(-w / 2 + 0.2 + i * 0.35, 0.18, zz)));
  }
};
/** a laundry pole with clothes hanging (modern village) */
export const laundry = (b: Batch, x: number, y: number, z: number, yaw: number, seed = 2) => {
  const m = tr(x, y, z, yaw), r = rng(seed), post = col("laundryPost", "#c8c4bc");
  for (const sx of [-1.4, 1.4]) b.add(cylG(0.04, 0.04, 1.9), post, m.clone().multiply(tr(sx, 0, 0)));
  lbox(b, col("laundryBar", "#d8d4cc"), m, -1.5, 1.5, 1.8, 1.85, -0.025, 0.025);
  const cl = ["#e8e4dc", "#4a6a9a", "#c8504a", "#f2c94a", "#7aa86a", "#f4f0e8"];
  for (let i = 0; i < 6; i++) { const xx = -1.2 + i * 0.48, hh2 = 0.45 + 0.25 * r(); lbox(b, col("cloth" + i, cl[i]), m, xx - 0.17, xx + 0.17, 1.8 - hh2, 1.8, -0.01, 0.01); }
};
/** a bicycle leaning at (x, y, z): wheels, frame, basket (lean = roll toward its support) */
export const bicycle = (root: THREE.Object3D, x: number, y: number, z: number, yaw: number, lean = 0.18) => {
  const g = new THREE.Group(), b = new Batch(), fr = col("bikeFrame", "#c8352a"), blk = col("tyre", "#1a1a1e"), chrome = col("chrome", "#c8c8cc");
  for (const sx of [-0.52, 0.52]) b.add(new THREE.TorusGeometry(0.33, 0.03, 8, 24), blk, tr(sx, 0.35, 0));
  const tube = (a: THREE.Vector3, c: THREE.Vector3, rr = 0.025, mat = fr) => { const len = a.distanceTo(c); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()); b.add(new THREE.CylinderGeometry(rr, rr, len, 8).translate(0, len / 2, 0), mat, new THREE.Matrix4().compose(a, q, V(1, 1, 1))); };
  const rear = V(-0.52, 0.35, 0), front = V(0.52, 0.35, 0), crank = V(-0.05, 0.33, 0), seat = V(-0.2, 0.82, 0), head = V(0.38, 0.85, 0);
  tube(rear, crank); tube(crank, seat); tube(rear, seat); tube(crank, head); tube(seat, head); tube(head, front, 0.022, chrome); tube(head, V(0.34, 1.0, 0), 0.02, chrome);
  lbox(b, chrome, new THREE.Matrix4(), 0.3, 0.38, 0.98, 1.02, -0.28, 0.28);
  lbox(b, col("saddle", "#2a2a2e"), new THREE.Matrix4(), -0.3, -0.1, 0.82, 0.88, -0.07, 0.07);
  lbox(b, col("basket", "#b8b8bc"), new THREE.Matrix4(), 0.45, 0.75, 0.82, 1.02, -0.17, 0.17);
  b.build(g, true);
  g.position.set(x, y, z); g.rotation.set(0, yaw, lean, "YXZ"); root.add(g);
  return g;
};
/** a drinks vending machine with a glowing front */
export const vendingMachine = (b: Batch, root: THREE.Object3D, x: number, y: number, z: number, yaw: number) => {
  const m = tr(x, y, z, yaw);
  lbox(b, col("vendBody", "#e8e8ec"), m, -0.5, 0.5, 0, 1.83, -0.38, 0.38);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.7), new THREE.MeshBasicMaterial({ map: vendingTex(), color: new THREE.Color(1.15, 1.15, 1.15) }));
  f.position.set(0, 0.95, 0.385).applyMatrix4(m); f.rotation.y = yaw; root.add(f);
};
export { lanternCore, twoTone };

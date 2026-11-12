// Instanced vegetation and rocks (stone short): thousands of storybook trees on the valley slopes for the cost of a
// few draw calls. Kinds: sugi (tall stacked cedar), round broadleaf, pine (flat lobes), bush, grass tuft, rock.
// Each kind = canopy InstancedMesh (two-tone, smooth lobes so the ink draws clean silhouettes) + trunk InstancedMesh.
// Per-instance colour varies the green. Placement is the caller's (hill.ts / town.ts), with its own camera-clearance test.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { twoTone } from "./shade";
import { ctex } from "./paint";

export type TreeKind = "sugi" | "round" | "pine" | "bush" | "tuft" | "rock" | "bamboo";
const sph = (r: number, sy: number, x: number, y: number, z: number, ws = 16, hs = 11) => new THREE.SphereGeometry(r, ws, hs).scale(1, sy, 1).translate(x, y, z);
/** unit-height geometries (scaled per instance) */
const canopyGeo = (k: TreeKind): THREE.BufferGeometry => {
  switch (k) {
    case "sugi": return mergeGeometries([sph(0.2, 1.25, 0, 0.36, 0), sph(0.17, 1.3, 0, 0.55, 0), sph(0.13, 1.35, 0, 0.72, 0), sph(0.08, 1.5, 0, 0.87, 0)].map((g) => g.toNonIndexed()));
    case "round": return mergeGeometries([sph(0.27, 0.9, 0, 0.62, 0), sph(0.2, 0.9, 0.19, 0.55, 0.06), sph(0.19, 0.9, -0.17, 0.57, -0.08), sph(0.18, 0.9, 0.03, 0.56, 0.2), sph(0.17, 0.9, 0.02, 0.8, -0.03)].map((g) => g.toNonIndexed()));
    case "pine": return mergeGeometries([sph(0.26, 0.42, 0.06, 0.84, 0), sph(0.2, 0.42, -0.14, 0.7, 0.05), sph(0.17, 0.45, 0.12, 0.62, -0.08)].map((g) => g.toNonIndexed()));
    case "bush": return mergeGeometries([sph(0.5, 0.8, 0, 0.42, 0, 14, 9), sph(0.36, 0.8, 0.36, 0.32, 0.08, 12, 8), sph(0.34, 0.8, -0.34, 0.3, -0.06, 12, 8)].map((g) => g.toNonIndexed()));
    case "tuft": { const bl: THREE.BufferGeometry[] = []; for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; bl.push(new THREE.ConeGeometry(0.05, 1, 4, 1).translate(0, 0.5, 0).rotateZ(0.32 * Math.cos(a)).rotateX(0.32 * Math.sin(a)).translate(0.1 * Math.cos(a), 0, 0.1 * Math.sin(a)).toNonIndexed()); } return mergeGeometries(bl); }
    case "rock": { const g = new THREE.IcosahedronGeometry(0.5, 1); const p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setXYZ(i, p.getX(i) * (1 + 0.15 * Math.sin(i * 1.7)), (y < 0 ? y * 0.3 : y * 0.75) + 0.12, p.getZ(i) * (1 + 0.15 * Math.cos(i * 2.3))); } g.computeVertexNormals(); return g; }
    case "bamboo": { const st: THREE.BufferGeometry[] = []; for (let i = 0; i < 5; i++) { const a = i * 2.4, rr = 0.12 * (i % 3); st.push(new THREE.CylinderGeometry(0.025, 0.03, 1, 6).translate(rr * Math.cos(a), 0.5, rr * Math.sin(a)).rotateZ(0.05 * Math.cos(a)).toNonIndexed()); } st.push(sph(0.22, 0.7, 0.05, 0.9, 0, 10, 7).toNonIndexed(), sph(0.16, 0.7, -0.12, 0.8, 0.06, 10, 7).toNonIndexed()); return mergeGeometries(st); }
  }
};
const trunkGeo = (k: TreeKind) => k === "sugi" ? new THREE.CylinderGeometry(0.018, 0.03, 0.42, 7).translate(0, 0.21, 0)
  : k === "round" ? new THREE.CylinderGeometry(0.026, 0.04, 0.5, 7).translate(0, 0.25, 0)
    : k === "pine" ? new THREE.CylinderGeometry(0.02, 0.035, 0.75, 7).rotateZ(0.12).translate(0.03, 0.37, 0) : null;

const leafTex = () => ctex("leafInst", 256, 128, (g, r) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 128);
  for (let k = 0; k < 60; k++) { const x = r() * 256, y = 8 + r() * 112, rad = 4 + r() * 8, light = y < 60 ? r() < 0.7 : r() < 0.25;
    for (const ox of [-256, 0, 256]) { g.strokeStyle = light ? "rgba(255,255,230,0.35)" : "rgba(30,60,30,0.28)"; g.lineWidth = 2.5; g.lineCap = "round"; g.beginPath(); g.arc(x + ox, y + rad * 0.6, rad, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } }
});
const COLS: Record<TreeKind, string[]> = {
  sugi: ["#3f6e3a", "#36643a", "#4a7a40", "#2f5c36"], round: ["#5a9a40", "#4e8c3a", "#6aa648", "#7aa84a"], pine: ["#3e6a3c", "#48743e", "#365e36"],
  bush: ["#5a9040", "#4e8838", "#6a9c48"], tuft: ["#7aa04a", "#6a9442", "#8aac52", "#9aa84e"], rock: ["#8e8a80", "#7e7a72", "#9c968a"], bamboo: ["#6a9a48", "#7aa850", "#5e8e42"],
};
export type Inst = { x: number; y: number; z: number; h: number; yaw?: number; w?: number; c?: number };
/** build the instanced meshes of one kind; returns the group (call once per kind per set) */
export const plant = (root: THREE.Object3D, kind: TreeKind, list: Inst[], opts: { shadow?: boolean; tint?: string[] } = {}) => {
  const g = new THREE.Group();
  if (!list.length) return g;
  const cols = opts.tint ?? COLS[kind];
  const leafMat = twoTone(new THREE.MeshLambertMaterial({ map: kind === "rock" ? null : leafTex(), color: "#ffffff" }));
  const canopy = new THREE.InstancedMesh(canopyGeo(kind), leafMat, list.length);
  const tg = trunkGeo(kind), trunk = tg ? new THREE.InstancedMesh(tg, twoTone(new THREE.MeshLambertMaterial({ color: kind === "sugi" ? "#6a4a36" : "#7a5a40" })), list.length) : null;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), Y = new THREE.Vector3(0, 1, 0);
  list.forEach((t, i) => {
    q.setFromAxisAngle(Y, t.yaw ?? (i * 2.399) % 6.283);
    const w = t.w ?? t.h;
    s.set(w, t.h, w); p.set(t.x, t.y - 0.05 * t.h, t.z);
    m.compose(p, q, s); canopy.setMatrixAt(i, m); trunk?.setMatrixAt(i, m);
    c.set(cols[(t.c ?? i) % cols.length]); canopy.setColorAt(i, c);
  });
  canopy.instanceMatrix.needsUpdate = true; if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
  for (const mesh of [canopy, trunk]) if (mesh) { mesh.castShadow = opts.shadow ?? true; mesh.receiveShadow = true; mesh.frustumCulled = false; g.add(mesh); }
  root.add(g);
  return g;
};

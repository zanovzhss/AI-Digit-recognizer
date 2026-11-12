// Small shared pieces for the stone short's sets: practical lamp specs, additive light pools, self-lit planes, and
// crates / barrels that stand on uneven ground (the template's versions assume y = 0).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "./build";
import { ctex, rep, beamHD } from "./paint";
import { NOINK } from "./ink";
import type { PlaceId, V3 } from "./story";

export type Practical = { place: PlaceId; pos: V3; color: string; intensity: number; distance: number; shots?: number[] };
/** self-lit HDR material (blooms above 1.0) */
export const glow = (key: string, r: number, g: number, b: number, map?: THREE.Texture) => {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), map: map ?? null, fog: false });
  m.name = key; return m;
};
export const plane = (w: number, h: number, mat: THREE.Material) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
/** additive light pool / patch card (NOINK, no depth write) */
export const pool = (w: number, h: number, r: number, g: number, b: number, key: string) => {
  const t = ctex("pool" + key, 256, 256, (c) => {
    const gr = c.createRadialGradient(128, 128, 6, 128, 128, 126); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.45, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  m.layers.set(NOINK); m.renderOrder = 2;
  return m;
};
const trY = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const woodM = (key: string, c: string) => lam(key, () => ({ map: rep(beamHD(), 1, 1), color: c }));
export const crateY = (b: Batch, x: number, y: number, z: number, s: number, yaw = 0) => {
  const m = trY(x, y, z, yaw);
  b.add(boxGeo(V(-s / 2, 0, -s / 2), V(s / 2, s, s / 2), 0.5), woodM("crate", "#b08458"), m);
  b.add(boxGeo(V(-s / 2 - 0.01, s * 0.15, -s / 2 - 0.01), V(s / 2 + 0.01, s * 0.25, s / 2 + 0.01)), woodM("crateBand", "#7a5638"), m);
};
export const barrelY = (b: Batch, x: number, y: number, z: number, s = 1) => {
  b.add(new THREE.CylinderGeometry(0.33 * s, 0.3 * s, 0.85 * s, 16).translate(0, 0.425 * s, 0), woodM("barrel", "#a8805a"), trY(x, y, z));
  for (const h of [0.15, 0.7]) b.add(new THREE.TorusGeometry(0.315 * s, 0.018, 6, 24).rotateX(Math.PI / 2), lam("hoop", () => ({ color: "#3d414c" })), trY(x, y + h * s, z));
};

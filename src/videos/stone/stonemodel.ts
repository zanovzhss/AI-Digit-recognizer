// THE stone: one model used in every shot (the hill, the carving yard, the haul, the diorama, the forgotten stone in town).
// A tall, rough, upright natural rock slab (~0.78 x 1.22 x 0.34 m): an uneven tapering outline, rounded weathered edges,
// an asymmetric crown, rough sides, moss at the base (vertex colour), the carved inscription on the front face.
import * as THREE from "three";
import { STONE } from "./story";
import { stoneFaceTex, stoneBumpTex, rockSideTex } from "./jpaint";
import { twoTone } from "./shade";

const fract = (v: number) => v - Math.floor(v);
const hash = (x: number, y: number, z: number) => fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
const sm = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, y: number, z: number) => {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy), l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
};
const fbm = (x: number, y: number, z: number) => 0.55 * vnoise(x, y, z) + 0.3 * vnoise(2.1 * x, 2.1 * y, 2.1 * z) + 0.15 * vnoise(4.3 * x, 4.3 * y, 4.3 * z);
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** crown height (fraction of h) across the slab: one shoulder higher, an uneven top */
const crownAt = (u: number) => 1 - 0.17 * (u + 0.22) ** 2 - 0.05 * u + 0.022 * Math.sin(7 * u + 0.4);

let GEO: THREE.BufferGeometry | null = null;
/** the slab geometry, base centre at the origin, the carved face toward +z (BoxGeometry group 4) */
export const stoneGeometry = () => {
  if (GEO) return GEO;
  const { w, h, t } = STONE;
  const g = new THREE.BoxGeometry(w, h, t, 18, 28, 6).translate(0, h / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute, cols: number[] = [];
  const P = 3.0; // superellipse exponent of the cross-section: rounded, weathered vertical edges
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let u = x / (w / 2), s = z / (t / 2);
    const v = y / h, s0 = s;
    const m = Math.max(Math.abs(u), Math.abs(s));
    if (m > 1e-6) { const r = (Math.abs(u) ** P + Math.abs(s) ** P) ** (1 / P); u *= m / r; s *= m / r; }
    const a = (w / 2) * (1.02 - 0.14 * v + 0.045 * Math.sin(6.5 * v + 1.3) + 0.03 * Math.sin(13 * v));
    const crownV = v < 0.68 ? 0 : (v - 0.68) / 0.32;
    const b = (t / 2) * (1.12 - 0.24 * v) * (1 - 0.5 * crownV ** 2);
    const yy = v < 0.68 ? y : h * (0.68 + crownV * (crownAt(u) - 0.68));
    let X = u * a, Z = s * b, Y = yy;
    // rough surface: noise pushed out from the core, gentle on the carved face so the inscription stays readable
    const n = fbm(x * 3.2 + 7, y * 3.2, z * 3.2) - 0.5, amp = 0.038 - 0.03 * sstep(0.55, 1, s0);
    const hl = Math.hypot(u, s) || 1;
    X += (u / hl) * n * amp * 2; Z += (s / hl) * n * amp * 2;
    if (v > 0.85) Y += n * 0.05 * crownV;
    if (v < 0.02) Y -= 0.02; // the foot sits in the ground
    p.setXYZ(i, X, Y, Z);
    // moss: thick at the foot, thinning upward in ragged tongues; a few lichen patches on the crown
    const mn = fbm(x * 5 + 3, y * 5, z * 5);
    const moss = sstep(0.2, 0.0, v + (mn - 0.5) * 0.22); // green moss at the base only
    cols.push(1 - 0.42 * moss, 1 - 0.16 * moss, 1 - 0.55 * moss);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  GEO = g;
  return g;
};

/** highest point of the crown (local y) near local x, for props set on top of the stone */
export const stoneTopAt = (lx: number) => {
  const p = stoneGeometry().attributes.position as THREE.BufferAttribute;
  let best = 0;
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i) - lx) < 0.05 && Math.abs(p.getZ(i)) < 0.06) best = Math.max(best, p.getY(i));
  return best;
};

let MATS: THREE.Material[] | null = null;
/** THE stone mesh (a new mesh each call, shared geometry and materials) */
export const makeStone = () => {
  if (!MATS) {
    const face = twoTone(new THREE.MeshLambertMaterial({ map: stoneFaceTex(), bumpMap: stoneBumpTex(), bumpScale: 3.2, vertexColors: true }));
    const side = twoTone(new THREE.MeshLambertMaterial({ map: rockSideTex(), vertexColors: true }));
    // BoxGeometry groups: +x, -x, +y, -y, +z (front, the inscription), -z
    MATS = [side, side, side, side, face, side];
  }
  const mesh = new THREE.Mesh(stoneGeometry(), MATS as THREE.MeshLambertMaterial[]);
  mesh.castShadow = true; mesh.receiveShadow = false; // the carved face always takes the key (no stray cast shadow over the inscription)
  return mesh;
};

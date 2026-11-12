// Where the feet go: the height of the ground actually drawn under a point. On the hill that is the terrain MESH (the exact
// triangle of the 2 m grid under the point, i.e. a ray cast straight down onto it) or a visible surface lying on it (the
// road ribbon); in the town the plain at y = 0 or a visible surface on it (the quay apron, the roads). cast.ts snaps every
// standing / walking / running character to the highest ground under its two feet, every frame.
import * as THREE from "three";
import { GRID, heightGrid, H } from "./terrain";

const SURF: THREE.Mesh[] = [];
/** register visible ground surfaces (their meshes are tested only while they and their parents are visible) */
export const addGround = (o: THREE.Object3D) => {
  o.updateMatrixWorld(true);
  o.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh) { m.geometry.computeBoundingSphere(); SURF.push(m); } });
};

let HG: Float32Array | null = null;
/** the hill terrain mesh height at (x, z): the grid triangle under the point (same split as hill.ts buildTerrain) */
export const terrainY = (x: number, z: number) => {
  const { nx, nz, x0, z0, step } = GRID;
  const gx = (x - x0) / step, gz = (z - z0) / step, ix = Math.floor(gx), iz = Math.floor(gz);
  if (ix < 0 || iz < 0 || ix >= nx - 1 || iz >= nz - 1) return H(x, z);
  if (!HG) HG = heightGrid();
  const fx = gx - ix, fz = gz - iz, a = HG[iz * nx + ix], b = HG[iz * nx + ix + 1], d = HG[(iz + 1) * nx + ix], e = HG[(iz + 1) * nx + ix + 1];
  // triangles (a, d, b) and (b, d, e): the diagonal runs from b (ix + 1, iz) to d (ix, iz + 1)
  return fx + fz <= 1 ? a + (b - a) * fx + (d - a) * fz : e + (d - e) * (1 - fx) + (b - e) * (1 - fz);
};

const rc = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), O = new THREE.Vector3();
const shown = (o: THREE.Object3D | null): boolean => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
/** ground height under (x, z): the terrain / plain, raised to any visible registered surface found by a ray cast down */
export const groundAt = (x: number, z: number) => {
  const hill = Math.abs(x) < 4000;
  let y = hill ? terrainY(x, z) : 0;
  O.set(x, y + 40, z); rc.set(O, DOWN); rc.far = 80;
  for (const m of SURF) {
    if (!shown(m)) continue;
    const s = m.geometry.boundingSphere!;
    const cx = s.center.x + m.matrixWorld.elements[12], cz = s.center.z + m.matrixWorld.elements[14];
    if (Math.hypot(cx - x, cz - z) > s.radius + 0.5) continue;
    const hit = rc.intersectObject(m, false)[0];
    if (hit && hit.point.y > y) y = hit.point.y;
  }
  return y;
};
/** the highest ground under a pair of feet: the centre and four points 0.16 m out (no sole ends below the surface) */
export const feetY = (x: number, z: number) => Math.max(groundAt(x, z), groundAt(x + 0.16, z), groundAt(x - 0.16, z), groundAt(x, z + 0.16), groundAt(x, z - 0.16));

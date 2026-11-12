// The Aneyoshi valley as one height function y = H(x, z) (metres, hill set local coordinates): the sea lies toward +z,
// the valley climbs toward -z. A gentle shore terrace (the old village), a steep wooded valley with a path up its floor,
// the stone by the path at 200 m inland (38 m up), house terraces on the slopes above it, and two headlands framing the
// bay. The same grid feeds the ground mesh and a float texture that the flood shader samples (water depth = level - H),
// so the foam line sits exactly where the water meets the ground.
import * as THREE from "three";

const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const softplus = (x: number, k: number) => (x / k > 30 ? x : k * Math.log1p(Math.exp(x / k)));

/** centre line of the path (x as a function of z) */
export const pathX = (z: number) => { const u = -z; return 4.5 * Math.sin(u / 38) + 2.0 * Math.sin(u / 17 + 1.3) * sstep(10, 60, u); };
/** valley floor height at inland distance u (negative u = under the sea) */
export const floorY = (u: number) => (u >= 0 ? 56 * (1 - Math.exp(-u / 165)) * (0.35 + 0.65 * sstep(0, 70, u)) : Math.max(-12, -0.12 * -u));
/** half width of the flat valley floor */
const halfW = (u: number) => (u >= 0 ? 16 + 48 * Math.exp(-u / 70) : 64 + 0.8 * -u);

/** how far (m) a point lies up the valley side, outside the flat floor (0 on the floor) */
export const sideDist = (x: number, z: number) => softplus(Math.abs(x - pathX(z) * 0.3) - halfW(-z), 6);
/** flat pads cut into the slope (house terraces, the stone's ledge): x, z, radius, height */
export type Pad = [number, number, number, number];
const PADS: Pad[] = [];
export const addPad = (p: Pad) => { PADS.push(p); };

/** the raw valley without pads */
export const rawH = (x: number, z: number) => {
  const u = -z, px = pathX(z);
  const d = softplus(Math.abs(x - px * 0.3) - halfW(u), 6);
  const seaFade = u < 0 ? Math.exp(u / 260) : 1;
  const side = (0.6 * d + 0.0035 * d * d) * seaFade;
  const bump = (2.2 * Math.sin(x * 0.045 + 1.7) * Math.sin(z * 0.038) + 1.2 * Math.sin(x * 0.11 - z * 0.07) + 0.6 * Math.sin(x * 0.23 + z * 0.19)) * sstep(2, 18, d);
  const dish = 0.006 * Math.min(400, (x - px) * (x - px)) * sstep(-10, 20, u);
  return floorY(u) + side + bump + dish;
};
/** the ground height (with the pads) */
export const H = (x: number, z: number) => {
  let y = rawH(x, z);
  for (const [px, pz, r, py] of PADS) {
    const dd = Math.hypot(x - px, z - pz);
    if (dd < r + 7) { const m = 1 - sstep(r, r + 7, dd); y = y + (py - y) * m; }
  }
  return y;
};
/** surface normal of H (finite differences) */
export const normalAt = (x: number, z: number, out = new THREE.Vector3()) => {
  const e = 0.6;
  return out.set(H(x - e, z) - H(x + e, z), 2 * e, H(x, z - e) - H(x, z + e)).normalize();
};

/** the sampled grid: GRID.x0..x0 + (nx - 1) * step, same for z; heights row-major [iz * nx + ix] */
export const GRID = { x0: -520, z0: -560, step: 2, nx: 521, nz: 461 };
let heights: Float32Array | null = null;
export const heightGrid = () => {
  if (!heights) {
    heights = new Float32Array(GRID.nx * GRID.nz);
    for (let iz = 0; iz < GRID.nz; iz++) for (let ix = 0; ix < GRID.nx; ix++)
      heights[iz * GRID.nx + ix] = H(GRID.x0 + ix * GRID.step, GRID.z0 + iz * GRID.step);
  }
  return heights;
};
let heightTex: THREE.DataTexture | null = null;
/** the grid as a float texture (R = height in metres), linear filtered, for the water shader */
export const heightTexture = () => {
  if (!heightTex) {
    heightTex = new THREE.DataTexture(heightGrid(), GRID.nx, GRID.nz, THREE.RedFormat, THREE.FloatType);
    heightTex.magFilter = THREE.LinearFilter; heightTex.minFilter = THREE.LinearFilter;
    heightTex.wrapS = heightTex.wrapT = THREE.ClampToEdgeWrapping; heightTex.needsUpdate = true;
  }
  return heightTex;
};

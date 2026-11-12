// Near-clip rule: nothing within 0.5 m of the lens. Every camera position of every shot (sampled every 2 frames, with the
// crossfade margins) is collected once; instanced plants and props test their capsule against it at build time.
import { camAt, SHOTS, V3 } from "./story";

export const LENS_CLEAR = 0.5;
let PTS: V3[] | null = null;
let GRID: Map<string, V3[]> | null = null;
const CELL = 4;
const key = (x: number, z: number) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;

/** every lens position of the film */
export const lensPoints = (): V3[] => {
  if (PTS) return PTS;
  PTS = [];
  for (const s of SHOTS) for (let f = s.a - 16; f < s.b + 16; f += 2) PTS.push(camAt(s.id, Math.max(0, f)).pos);
  GRID = new Map();
  for (const p of PTS) { const k = key(p[0], p[2]); if (!GRID.has(k)) GRID.set(k, []); GRID.get(k)!.push(p); }
  return PTS;
};

/** distance from the nearest lens position to a vertical capsule (base y0, height h, horizontal radius r) at x, z */
export const lensDist = (x: number, y0: number, z: number, h: number, r: number) => {
  lensPoints();
  let best = Infinity;
  const reach = Math.ceil((r + 6) / CELL);
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
    const list = GRID!.get(`${cx + i},${cz + j}`);
    if (!list) continue;
    for (const p of list) {
      const dy = p[1] < y0 ? y0 - p[1] : p[1] > y0 + h ? p[1] - (y0 + h) : 0;
      const d = Math.hypot(Math.max(0, Math.hypot(p[0] - x, p[2] - z) - r), dy);
      if (d < best) best = d;
    }
  }
  return best;
};

// ---- footprints: every place a character stands in the film (filled by world.ts before the sets are built) ----
let FOOT: Map<string, [number, number][]> | null = null;
export const setFootprints = (pts: [number, number][]) => {
  FOOT = new Map();
  for (const p of pts) { const k = key(p[0], p[1]); if (!FOOT.has(k)) FOOT.set(k, []); FOOT.get(k)!.push(p); }
};
/** no plant within 0.45 m (plus its own radius) of a footprint, so no tuft, rock or bush hides a character's feet */
export const clearOfFeet = (x: number, z: number, r: number) => {
  if (!FOOT) return true;
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL), reach = Math.ceil((r + 1) / CELL);
  for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
    const list = FOOT.get(`${cx + i},${cz + j}`);
    if (list) for (const p of list) if (Math.hypot(p[0] - x, p[1] - z) < 0.45 + r) return false;
  }
  return true;
};

/** true when a capsule keeps the 0.5 m lens clearance (plus an optional margin) everywhere in the film */
export const clearOfLens = (x: number, y0: number, z: number, h: number, r: number, margin = 0) => lensDist(x, y0, z, h, r) > LENS_CLEAR + margin;

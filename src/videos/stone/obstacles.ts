// Collision rule: every character keeps at least 0.6 m from the stone and from every registered prop. The sets register
// footprints (oriented rectangles on the ground) while they are built; cast.ts pushes each character's ground point out of
// them every frame. A character may sit on its own seat prop (named in `seat`), nothing else.
import { H } from "./terrain";
import { V3 } from "./story";

export type Obst = { x: number; z: number; hx: number; hz: number; yaw: number; tag: string };
export const OBST: Obst[] = [];
export const CLEAR = 0.6;
/** register a footprint: centre x, z, half extents along its own axes, yaw (radians, about +y) */
export const addObst = (tag: string, x: number, z: number, hx: number, hz: number, yaw = 0) => { OBST.push({ tag, x, z, hx, hz, yaw }); };

/** signed distance from (x, z) to an obstacle footprint */
export const distTo = (o: Obst, x: number, z: number) => {
  const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.x, dz = z - o.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c, qx = Math.abs(lx) - o.hx, qz = Math.abs(lz) - o.hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
};

const logged = new Set<string>();
/** the character's ground point pushed out to CLEAR from every obstacle except its seat; on the hill the feet follow the
 *  ground. Logs each pushed character once. */
export const keepClear = (p: V3, who: string, seat?: string): V3 => {
  let x = p[0], z = p[2];
  for (let it = 0; it < 6; it++) {
    let moved = false;
    for (const o of OBST) {
      if (o.tag === seat || Math.abs(o.x - x) > 12 || Math.abs(o.z - z) > 12) continue;
      const d = distTo(o, x, z);
      if (d >= CLEAR) continue;
      const e = 0.005, gx = distTo(o, x + e, z) - distTo(o, x - e, z), gz = distTo(o, x, z + e) - distTo(o, x, z - e), gl = Math.hypot(gx, gz) || 1;
      const k = CLEAR - d + 0.003;
      x += (gx / gl) * k; z += (gz / gl) * k; moved = true;
      const lk = `${who}|${o.tag}`;
      if (!logged.has(lk)) { logged.add(lk); console.warn(`KEEPCLEAR ${who} pushed ${(k).toFixed(2)} m off ${o.tag}`); }
    }
    if (!moved) break;
  }
  if (x === p[0] && z === p[2]) return p;
  const hill = Math.abs(p[0]) < 4000; // the valley set sits at x = 0 (town and room are 8 / 16 km away)
  return [x, hill ? p[1] + H(x, z) - H(p[0], p[2]) : p[1], z];
};

/** the smallest clearance of a ground point to any obstacle (for the checks) */
export const clearance = (x: number, z: number, seat?: string) => {
  let best = Infinity;
  for (const o of OBST) if (o.tag !== seat) best = Math.min(best, distTo(o, x, z));
  return best;
};

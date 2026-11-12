// The Aneyoshi valley (hill set): terrain with painted ground colours (and a map overlay for shot 18), the forest,
// the warning stone, the eleven modern houses on their terraces with the road and the little harbour (now), the
// thatched 1896 village and its aftermath, the 1933 rebuild with its plaque, the carving yard and the haul (1933,
// night), the 100 / 200 / 300 FT posts, the sea and the valley flood. Era groups are switched per shot by world.ts.
import * as THREE from "three";
import { Batch, V, lam, quad } from "./build";
import { H, GRID, heightGrid, heightTexture, pathX, sideDist, floorY } from "./terrain";
import { MAP_1896, MAP_1933, MAP_EYE } from "./story";
import { STONE, HOUSES, VILLAGE, houseAt, villageAt, BOARD_1896, PLAQUE_1933, PLAQUE_POS, REBUILT_D, BOAT_OVER, YARD, HAUL_U, POSTS_U, STONE_U,
  SHOTS, camRig, gnd, onPath, V3, WAVE_DEF } from "./story";
import { jHouse, woodBoat, modernBoat, dryingRack, netOnPosts, netHeap, chochin, andon, utilityPole, wires, terraceWall, vegRows, laundry, tr, lbox, col } from "./jhouse";
import { makeStone } from "./stonemodel";
import { addObst } from "./obstacles";
import { addGround } from "./ground";
import { gravelTex, yearBoardTex, postTex, mapLabelTex, ringMarkTex, groundDetailTex } from "./jpaint";
import { plant, Inst } from "./forest";
import { rep, beamHD, rng, cloudHD, CLOUD_DAY } from "./paint";
import { twoTone } from "./shade";
import { NOINK, TWIN_LAYER, inkTwins } from "./ink";
import { waterUniforms, waterMaterial, waterInkMaterial, waterGrid, WaterU } from "./water";
import { pool, Practical, crateY, barrelY } from "./common";
import { makeWave, Wave } from "./wave";
import { bucket, ropeCoil, sack } from "./build";

export type HillParts = {
  groups: Record<"now" | "v1896" | "ruins" | "v1933" | "yard" | "haul" | "posts" | "map", THREE.Group>;
  stone: THREE.Mesh; sledge: THREE.Group; water: WaterU; mapU: { uMap: { value: number } }; w1896: Wave; w1933: Wave;
  winOld: THREE.Mesh[]; winNow: THREE.Mesh[]; winRebuilt: THREE.Mesh[];
};

// ---------------- the sight lines of every hill shot: nothing tall grows on them ----------------
type Seg = { a: THREE.Vector3; b: THREE.Vector3 };
let SEGS: Seg[] | null = null;
const segs = () => {
  if (SEGS) return SEGS;
  SEGS = [];
  for (const s of SHOTS) if (s.place === "hill") for (let f = s.a; f < s.b; f += 6) {
    const c = camRig(s.id, f), a = V(...c.pos), look = V(...c.look), d = look.clone().sub(a), L = d.length();
    SEGS.push({ a, b: a.clone().add(d.multiplyScalar(Math.min(1, 70 / L))) });
  }
  return SEGS;
};
const tmp = new THREE.Vector3(), cl = new THREE.Vector3();
/** true inside the corridor the shot-1 sun crosses on its way to the stone (no trees or bamboo may shade the face) */
const inSunPath = (x: number, z: number) => {
  const sx = 0.24, sz = -0.97, dx = x - STONE.x, dz = z - STONE.z, t = dx * sx + dz * sz, perp = Math.abs(dx * sz - dz * sx);
  return t > -2 && t < 60 && perp < 6 + t * 0.12;
};
/** true when a thing of radius r / height h at (x, y, z) stays clear of every lens and its first 70 m of sight */
export const clear = (x: number, y: number, z: number, r: number, h: number) => {
  for (const { a, b } of segs()) {
    for (const k of [0.1, 0.5, 0.9]) {
      tmp.set(x, y + h * k, z);
      const ab = cl.subVectors(b, a), t = Math.max(0, Math.min(1, tmp.clone().sub(a).dot(ab) / ab.lengthSq()));
      if (tmp.distanceTo(a.clone().add(ab.multiplyScalar(t))) < r + 0.8) return false;
    }
  }
  return true;
};

// ---------------- terrain ----------------
const C = (h: string) => new THREE.Color(h);
const GR = [C("#76984f"), C("#688a47"), C("#86a25a"), C("#94a464")], FOREST = C("#56723f"), ROCK = C("#8c8474"), SAND = C("#bca67c"), WET = C("#8e7c60"),
  BED = C("#8a9a8a"), DIRT = C("#a8885e"), FIELD = C("#8a7448");
const terrainMat = () => {
  const m = twoTone(new THREE.MeshLambertMaterial({ vertexColors: true, map: rep(groundDetailTex(), 160, 140) }));
  const u = { uMap: { value: 0 }, uLevels: { value: new THREE.Vector2(MAP_1896, MAP_1933) } };
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvWp = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp; uniform float uMap; uniform vec2 uLevels;")
      .replace("#include <color_fragment>", `#include <color_fragment>
      float mapB1 = 0.0, mapB2 = 0.0;
      if ( uMap > 0.5 ) { // painted bands along the 1896 and 1933 water lines (ragged painted edges)
        float y = vWp.y, rag = 0.35 * sin( vWp.x * 0.9 ) * sin( vWp.z * 0.7 );
        mapB1 = 1.0 - smoothstep( 1.1, 1.7, abs( y - uLevels.x + rag ) );
        mapB2 = 1.0 - smoothstep( 1.1, 1.7, abs( y - uLevels.y + rag ) );
        diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 1.0, 0.42, 0.16 ), mapB1 );
        diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 1.0, 0.78, 0.2 ), mapB2 );
      }`).replace("#include <opaque_fragment>", `#include <opaque_fragment>
      if ( uMap > 0.5 ) { // the bands glow (HDR, the bloom picks them up), with a soft halo either side
        float y = vWp.y, h1 = 1.0 - smoothstep( 1.0, 6.0, abs( y - uLevels.x ) ), h2 = 1.0 - smoothstep( 1.0, 6.0, abs( y - uLevels.y ) );
        gl_FragColor.rgb += vec3( 1.0, 0.36, 0.1 ) * ( 0.55 * mapB1 + 0.1 * h1 ) + vec3( 0.95, 0.72, 0.12 ) * ( 0.5 * mapB2 + 0.1 * h2 );
      }`);
  };
  m.customProgramCacheKey = () => "hillTerrain";
  return { m, u };
};
const buildTerrain = (root: THREE.Object3D) => {
  const hg = heightGrid(), { nx, nz, x0, z0, step } = GRID, n = nx * nz;
  const pos = new Float32Array(n * 3), colA = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  const c = new THREE.Color(), nrm = new THREE.Vector3();
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const i = iz * nx + ix, x = x0 + ix * step, z = z0 + iz * step, y = hg[i], u = -z;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; uv[i * 2] = ix / (nx - 1); uv[i * 2 + 1] = iz / (nz - 1);
    const hx = hg[iz * nx + Math.min(nx - 1, ix + 1)] - hg[iz * nx + Math.max(0, ix - 1)], hz = hg[Math.min(nz - 1, iz + 1) * nx + ix] - hg[Math.max(0, iz - 1) * nx + ix];
    nrm.set(-hx, 4, -hz).normalize();
    const nse = Math.sin(x * 0.07 + z * 0.031) * 0.5 + Math.sin(x * 0.19 - z * 0.13) * 0.3 + Math.sin(x * 0.53 + z * 0.41) * 0.2;
    c.copy(GR[0]).lerp(GR[1], 0.5 + 0.5 * Math.sin(x * 0.045 - z * 0.06)).lerp(GR[2], Math.max(0, nse) * 0.7).lerp(GR[3], Math.max(0, -nse) * 0.35);
    const sd = sideDist(x, z);
    c.lerp(FOREST, Math.min(1, Math.max(0, (sd - 6) / 10)) * 0.85);
    c.lerp(ROCK, Math.min(1, Math.max(0, (0.8 - nrm.y) / 0.15)) * 0.8);
    if (y < 2.2 && u < 26) c.lerp(SAND, Math.min(1, (2.2 - y) / 1.0));
    if (y < 0.5) c.lerp(WET, Math.min(1, (0.5 - y) / 0.5));
    if (y < -0.6) c.lerp(BED, 1);
    const dp = Math.abs(x - pathX(z));
    if (u > 3 && u < 330) c.lerp(DIRT, (1 - Math.min(1, Math.max(0, (dp - 1.3) / 0.9))) * 0.9);
    colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b;
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let k = 0;
  for (let iz = 0; iz < nz - 1; iz++) for (let ix = 0; ix < nx - 1; ix++) { const a = iz * nx + ix, b = a + 1, d = a + nx, e = d + 1; idx[k++] = a; idx[k++] = d; idx[k++] = b; idx[k++] = b; idx[k++] = d; idx[k++] = e; }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(colA, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const { m, u } = terrainMat();
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.castShadow = true; mesh.frustumCulled = false; root.add(mesh);
  return u;
};

// ---------------- vegetation ----------------
const buildForest = (root: THREE.Object3D) => {
  const r = rng(11), sugi: Inst[] = [], round: Inst[] = [], pine: Inst[] = [], bush: Inst[] = [], tuft: Inst[] = [], rock: Inst[] = [], bamboo: Inst[] = [];
  const nearPad = (x: number, z: number, pad: number) => {
    for (let i = 0; i < HOUSES.length; i++) { const p = houseAt(i); if (Math.hypot(x - p[0], z - p[2]) < pad) return true; }
    for (let i = 0; i < VILLAGE.length; i++) { const p = villageAt(i); if (Math.hypot(x - p[0], z - p[2]) < pad - 1) return true; }
    return Math.hypot(x - STONE.x, z - STONE.z) < 7;
  };
  for (let z = -548; z < 260; z += 7) for (let x = -510; x < 510; x += 7) {
    const px = x + (r() - 0.5) * 6, pz = z + (r() - 0.5) * 6, y = H(px, pz), u = -pz, sd = sideDist(px, pz);
    if (y < 1.2) continue;
    const far = Math.hypot(px, pz + 120) > 330;
    if (far && r() < 0.35) continue;
    const onFloor = sd < 4, dp = Math.abs(px - pathX(pz));
    if (dp < 4.5 && u > -5) continue;
    if (nearPad(px, pz, 11)) continue;
    if (u < 62 && Math.abs(px) < 60 && sd < 10) { if (r() < 0.06 && dp > 8) round.push({ x: px, y, z: pz, h: 6 + 3 * r(), c: Math.floor(r() * 4) }); continue; } // the shore village terrace: open
    if (onFloor) { if (r() < 0.12 && dp > 7 && !inSunPath(px, pz)) (r() < 0.5 ? round : bush).push({ x: px, y, z: pz, h: r() < 0.5 ? 6 + 4 * r() : 1.6 + r(), c: Math.floor(r() * 4) }); continue; }
    const h = 11 + 9 * r(), kind = u < 40 && sd > 10 && r() < 0.6 ? "pine" : r() < 0.78 ? "sugi" : "round";
    if (!clear(px, y, pz, kind === "sugi" ? 2.2 : 3.4, h) || inSunPath(px, pz)) continue;
    (kind === "pine" ? pine : kind === "sugi" ? sugi : round).push({ x: px, y, z: pz, h: kind === "round" ? h * 0.65 : h, w: kind === "sugi" ? h * 0.85 : undefined, c: Math.floor(r() * 4) });
  }
  // bamboo groves and bushes behind the houses up the hill; grass tufts along the path and around the stone; rocks
  for (let i = 0; i < HOUSES.length; i++) {
    const p = houseAt(i), s = HOUSES[i][0] < 0 ? -1 : 1;
    for (let k = 0; k < 9; k++) { const x = p[0] + s * (7 + 6 * r()), z = p[2] + (r() - 0.5) * 14; if (clear(x, H(x, z), z, 1.2, 8) && !inSunPath(x, z)) bamboo.push({ x, y: H(x, z), z, h: 7 + 3 * r(), w: 5 }); }
    for (let k = 0; k < 4; k++) { const x = p[0] + (r() - 0.5) * 16, z = p[2] - 6 - 3 * r(); if (clear(x, H(x, z), z, 1, 1.6) && !inSunPath(x, z)) bush.push({ x, y: H(x, z), z, h: 1.2 + 0.6 * r() }); }
  }
  for (let u = 4; u < 330; u += 5.5) for (const s of [-1, 1]) {
    const x = pathX(-u) + s * (2.6 + 4.5 * r()), z = -u + (r() - 0.5) * 0.8, y = H(x, z);
    if (Math.hypot(x - STONE.x, z - STONE.z) < 1.0) continue;
    if (!clear(x, y, z, 0.4, 0.5)) continue;
    tuft.push({ x, y, z, h: 0.3 + 0.3 * r(), w: 0.45 + 0.35 * r(), c: Math.floor(r() * 4) });
  }
  for (let k = 0; k < 45; k++) { const a = r() * 6.283, d = 1.2 + 4 * r(), x = STONE.x + Math.cos(a) * d, z = STONE.z + Math.sin(a) * d; if (Math.hypot(x - STONE.x, z - STONE.z) < 1.0) continue; tuft.push({ x, y: H(x, z), z, h: 0.22 + 0.25 * r(), w: 0.4 + 0.25 * r(), c: Math.floor(r() * 4) }); }
  for (let k = 0; k < 420; k++) { const x = (r() - 0.5) * 700, z = -r() * 420 + 40, y = H(x, z); if (y < 0.5 || Math.abs(x - pathX(z)) < 3 || nearPad(x, z, 9) || Math.hypot(x - STONE.x, z - STONE.z) < 16) continue; rock.push({ x, y, z, h: 0.6 + 2.4 * r() ** 2, w: 0.9 + 3 * r() ** 2 }); }
  plant(root, "sugi", sugi); plant(root, "round", round); plant(root, "pine", pine); plant(root, "bush", bush);
  plant(root, "bamboo", bamboo); plant(root, "tuft", tuft, { shadow: false }); plant(root, "rock", rock);
};

// ---------------- the stone ----------------
/** the slab: a thick rounded box with the painted, bump-carved face on +z (local), a rough back and sides */
// ---------------- the set ----------------
export const buildHill = (root: THREE.Object3D): { parts: HillParts; lights: Practical[] } => {
  const groups = { now: new THREE.Group(), v1896: new THREE.Group(), ruins: new THREE.Group(), v1933: new THREE.Group(), yard: new THREE.Group(), haul: new THREE.Group(), posts: new THREE.Group(), map: new THREE.Group() };
  for (const g of Object.values(groups)) root.add(g);
  const mapU = buildTerrain(root);
  buildForest(root);
  const lights: Practical[] = [];
  const winOld: THREE.Mesh[] = [], winNow: THREE.Mesh[] = [], winRebuilt: THREE.Mesh[] = [];
  const collectWin = (wb: Batch, g: THREE.Group, list: THREE.Mesh[]) => { const tmpG = new THREE.Group(); wb.build(tmpG, false); for (const c of [...tmpG.children]) { const m = c as THREE.Mesh; m.receiveShadow = false; g.add(m); list.push(m); } };

  // ---- the stone (now) ----
  const stone = makeStone();
  stone.position.set(STONE.x, STONE.y - 0.04, STONE.z); stone.rotation.y = Math.atan2(STONE.nx, STONE.nz);
  addObst("stone", STONE.x, STONE.z, STONE.w / 2 + 0.05, STONE.t / 2 + 0.06, stone.rotation.y);
  groups.now.add(stone);
  // natural ground round it: a few small field stones half in the grass (no ring, nothing grave-like)
  const nb = new Batch();
  for (const [ax, az, rr] of [[0.95, -0.55, 0.13], [-1.1, 0.35, 0.1], [0.6, 1.25, 0.09], [-0.7, -1.3, 0.12]] as const) {
    const gx = STONE.x + ax, gz = STONE.z + az;
    nb.add(new THREE.IcosahedronGeometry(rr, 1).scale(1.3, 0.6, 1), lam("fieldStone", () => ({ color: "#8a8478" })), tr(gx, H(gx, gz) + rr * 0.15, gz, ax * 3));
  }
  nb.build(groups.now, true);

  // ---- the modern hamlet: eleven houses on terraces, the road, poles and wires, gardens, the harbour ----
  const b = new Batch(), wb = new Batch(), r = rng(5);
  const WALLS = ["#e4dccb", "#d8cdb8", "#eae6dc", "#c9b89a", "#dcd2c2", "#e8d8bc"], ROOFS = ["#4a5462", "#3e4a5c", "#5a4a42", "#4a5462", "#56606e"];
  HOUSES.forEach(([, , yaw], i) => {
    const p = houseAt(i), w = 7.6 + (i % 3) * 0.8, d = 6 + (i % 2) * 0.6;
    jHouse(b, wb, p[0], p[1] + 0.3, p[2], yaw, { w, d, style: "modern", wall: WALLS[i % WALLS.length], roof: ROOFS[i % ROOFS.length], seed: i + 3 });
    // retaining wall on the downhill side of the terrace, a garden plot, a laundry pole on some
    const dz = 8.5, wx0 = p[0] - 7, wx1 = p[0] + 7;
    terraceWall(b, wx0, p[2] + dz, wx1, p[2] + dz, Math.min(H(wx0, p[2] + dz), H(wx1, p[2] + dz)) - 0.2, Math.max(0.6, p[1] + 0.3 - Math.min(H(wx0, p[2] + dz + 1.5), H(wx1, p[2] + dz + 1.5))));
    if (i % 2 === 0) vegRows(b, p[0] + (HOUSES[i][0] < 0 ? -4 : 4), p[1] + 0.3, p[2] + 5.4, yaw, 4.2, 2.4, i);
    if (i % 3 === 1) laundry(b, p[0] + (HOUSES[i][0] < 0 ? 3 : -3), p[1] + 0.3, p[2] + 4.6, yaw, i);
    if (i % 4 === 2) { crateY(b, p[0] + 4.6, p[1] + 0.3, p[2] + 2.5, 0.5); barrelY(b, p[0] - 4.4, p[1] + 0.3, p[2] + 2.2, 0.8); }
  });
  // the road: a grey ribbon along the path from the quay up past the stone
  {
    const pts: number[] = [], uvs: number[] = [], ix: number[] = [];
    let n = 0;
    for (let u = -2; u <= 320; u += 1.5) {
      const z = -u, px = pathX(z), dx = (pathX(z - 0.5) - pathX(z + 0.5)), l = Math.hypot(dx, 1), nxx = 1 / l, nzz = dx / l;
      for (const s of [-1, 1]) { const x = px + s * 1.6 * nxx, zz = z + s * 1.6 * nzz * 0.0; pts.push(x, H(x, zz) + 0.07, zz); uvs.push(s > 0 ? 1 : 0, u / 12); }
      if (n) { const a = (n - 1) * 2; ix.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      n++;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(ix); g.computeVertexNormals();
    const road = new THREE.Mesh(g, lam("roadGravel", () => ({ map: rep(gravelTex(), 1, 1), side: THREE.DoubleSide }))); road.receiveShadow = true; groups.now.add(road);
    // the road up from the 300 ft post (shots 20-21): bushes and rocks on its left, a fence on its right, things dropped
    const rb3 = new Batch(), rr3 = rng(57), bushes: Inst[] = [], rocks: Inst[] = [];
    for (let u = POSTS_U[2] - 14; u < POSTS_U[2] + 44; u += 1.6 + rr3() * 1.4) {
      const p = onPath(u, -2.7 - rr3() * 2.2, 0); bushes.push({ x: p[0], y: p[1], z: p[2], h: 0.9 + rr3() * 0.8, w: 1.0 + rr3() * 0.7, c: Math.floor(rr3() * 3) });
      if (rr3() < 0.5) { const q = onPath(u + 0.7, -2.1 - rr3() * 0.6, 0); rocks.push({ x: q[0], y: q[1], z: q[2], h: 0.25 + rr3() * 0.25, w: 0.35 + rr3() * 0.3, c: Math.floor(rr3() * 3) }); }
    }
    for (let u = POSTS_U[2] - 10; u < POSTS_U[2] + 42; u += 2.2) { // a low wooden fence on the right
      const a = onPath(u, 6.6, 0), b = onPath(u + 2.2, 6.6, 0);
      rb3.add(new THREE.BoxGeometry(0.1, 1.0, 0.1).translate(0, 0.5, 0), col("fencePost", "#6a5038"), tr(a[0], a[1], a[2]));
      for (const hgt of [0.45, 0.85]) { const m = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = m.length(); rb3.add(new THREE.BoxGeometry(0.05, 0.07, l).translate(0, hgt, l / 2), col("fenceRail", "#7a5c40"), new THREE.Matrix4().lookAt(new THREE.Vector3(), m, new THREE.Vector3(0, 1, 0)).setPosition(a[0], a[1], a[2]).multiply(new THREE.Matrix4().makeRotationY(Math.PI))); }
    }
    for (const [u, dx, kind] of [[POSTS_U[2] + 8, -1.95, 0], [POSTS_U[2] + 15, 5.6, 1], [POSTS_U[2] + 20, -2.2, 2], [POSTS_U[2] + 3, 5.4, 0]] as const) {
      const p = onPath(u, dx, 0);
      if (kind === 0) crateY(rb3, p[0], p[1] - 0.05, p[2], 0.45, u); else if (kind === 1) bucket(rb3, p[0], p[1], p[2]); else sack(rb3, p[0], p[1], p[2]);
    }
    rb3.build(groups.now, true);
    plant(groups.now, "bush", bushes, { shadow: true }); plant(groups.now, "rock", rocks, { shadow: true });
    addGround(road);
  }
  let prevPole: THREE.Vector3[] | null = null;
  for (let u = 20; u < 320; u += 38) { const x = pathX(-u) + 3.2, z = -u; const pts = utilityPole(b, x, H(x, z) - 0.2, z, 0.1, 8); if (prevPole) wires(b, prevPole, pts, 0.7); prevPole = pts; }
  // the harbour: a concrete quay, a breakwater arm, modern boats, buoys, crates
  const conc = lam("quayConcrete", () => ({ map: rep(groundDetailTex(), 8, 2), color: "#b4b0a6" }));
  lbox(b, conc, new THREE.Matrix4(), -46, -6, -3, 1.3, -6, 4);
  lbox(b, conc, new THREE.Matrix4(), -52, -44, -3, 2.0, -6, 78);
  for (let k = 0; k < 14; k++) lbox(b, col("tetrapod", "#a8a49a"), tr(-55.5 + (k % 2), 0.3, 8 + k * 5, k), -1.2, 1.2, -1.2, 1.4, -1.2, 1.2);
  modernBoat(b, wb, -34, 0.45, 9.5, Math.PI / 2 + 0.05, 9, "#2f5f9a"); modernBoat(b, wb, -22, 0.45, 9.8, Math.PI / 2 - 0.04, 8, "#c8352a"); modernBoat(b, wb, -12, 0.45, 10.5, Math.PI / 2 + 0.1, 7.5, "#2f8a54");
  for (let k = 0; k < 10; k++) { const x = -30 + k * 7 + r() * 3, z = 30 + r() * 60; b.add(new THREE.SphereGeometry(0.35, 12, 9), col("buoy" + (k % 3), ["#f28a2c", "#f4f0e6", "#e8352a"][k % 3]), tr(x, 0.15, z)); }
  for (let k = 0; k < 4; k++) crateY(b, -40 + k * 1.3, 1.3, -2 + (k % 2), 0.6, k);
  b.build(groups.now, true); collectWin(wb, groups.now, winNow);
  for (let i = 0; i < HOUSES.length; i++) { const p = houseAt(i); lights.push({ place: "hill", pos: [p[0], p[1] + 2.2, p[2] + 4.4], color: "#ffbf70", intensity: 7, distance: 9, shots: [1, 14, 22] }); }

  // ---- the 1896 village: thatched houses, boats pulled up, racks, nets, the notice board ----
  const vb = new Batch(), vw = new Batch();
  VILLAGE.forEach(([, , yaw], i) => { const p = villageAt(i); jHouse(vb, vw, p[0], p[1], p[2], yaw, { w: 7 + (i % 3) * 0.8, d: 5, style: "thatch", seed: i }); });
  const beachBoats: [number, number, number][] = [[-30, 2.2, 1.45], [-18, 1.6, 1.6], [-8, 2.6, 1.5], [10, 1.8, 1.7], [22, 2.4, 1.55], [34, 2.0, 1.4]];
  for (const [x, u, yaw] of beachBoats) woodBoat(vb, x, H(x, -u) + 0.35, -u, yaw, 6.2);
  for (const [x, u, yaw] of [[-20, 7, 0.1], [4, 6.5, -0.1], [28, 7.5, 0.2], [-36, 8, 0.0]] as const) dryingRack(vb, x, H(x, -u), -u, yaw, 3.4, x);
  for (const [x, u, yaw] of [[-4, 9, 0.3], [18, 10, -0.2], [-28, 11, 0.1]] as const) netOnPosts(vb, x, H(x, -u), -u, yaw, 3);
  for (const [x, u] of [[-12, 5], [14, 5.5], [30, 6]] as const) netHeap(vb, x, H(x, -u), -u, 1);
  for (const [x, u] of [[-22, 12], [8, 13], [26, 12]] as const) { barrelY(vb, x, H(x, -u), -u, 0.9); bucket(vb, x + 0.8, H(x + 0.8, -u), -u + 0.3); }
  for (let i = 0; i < VILLAGE.length; i += 3) { const p = villageAt(i); vegRows(vb, p[0] + 6, p[1], p[2] - 3, 0, 3.2, 2.4, i); }
  // the notice board (faces uphill, toward the camera of shot 2)
  {
    const [bx, by, bz] = BOARD_1896, post = lam("boardPost", () => ({ map: rep(beamHD(), 0.3, 1), color: "#5a4030" }));
    for (const s of [-1, 1]) lbox(vb, post, tr(bx, by, bz, Math.PI), s * 0.62 - 0.06, s * 0.62 + 0.06, 0, 2.2, -0.06, 0.06);
    lbox(vb, lam("boardRoof", () => ({ color: "#3a2c22" })), tr(bx, by, bz, Math.PI), -0.85, 0.85, 2.2, 2.32, -0.3, 0.3);
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), twoTone(new THREE.MeshLambertMaterial({ map: yearBoardTex("1896") })));
    bm.position.set(bx, by + 1.6, bz - 0.07); bm.rotation.y = Math.PI; bm.castShadow = true; groups.v1896.add(bm);
  }
  vb.build(groups.v1896, true); collectWin(vw, groups.v1896, winOld);
  for (const i of [1, 3, 4, 7, 9, 11]) { const p = villageAt(i); lights.push({ place: "hill", pos: [p[0], p[1] + 1.6, p[2] + 3.4], color: "#ffb060", intensity: 6, distance: 8, shots: [2, 5, 6, 7, 8] }); }

  // ---- the 1896 aftermath: the overturned boat, debris, broken frames at a distance ----
  const rb = new Batch(), rr = rng(9);
  woodBoat(rb, BOAT_OVER[0], BOAT_OVER[1] - 0.05, BOAT_OVER[2], 0.42, 6.4, { over: true, tint: "#a88a66" });
  const plank = lam("debrisPlank", () => ({ map: rep(beamHD(), 1, 0.2), color: "#7a5a40" }));
  for (let k = 0; k < 46; k++) { const x = (rr() - 0.5) * 80, u = 0.5 + rr() * 24, y = H(x, -u); lbox(rb, plank, tr(x, y + 0.06, -u, rr() * 3).multiply(new THREE.Matrix4().makeRotationZ((rr() - 0.5) * 0.4)), -0.9 - rr(), 0.9 + rr(), 0, 0.08, -0.12, 0.12); }
  netHeap(rb, BOAT_OVER[0] + 3.4, BOAT_OVER[1], BOAT_OVER[2] - 1.6, 0.8);
  { // the wrecked shore round the boat: broken beams and planks, a fallen thatch roof piece, a door, crates, a second net
    const [bx, by, bz] = BOAT_OVER, beam = lam("debrisBeam", () => ({ map: rep(beamHD(), 1, 0.3), color: "#6a4c36" }));
    const at = (dx: number, dz: number, lift = 0) => { const x = bx + dx, z = bz + dz; return [x, H(x, z) + lift, z] as const; };
    for (const [dx, dz, yaw, len, roll] of [[2.2, -3.2, 0.5, 3.4, 0.12], [-1.6, -4.4, -0.9, 3.0, -0.2], [3.8, -1.2, 1.4, 2.6, 0.3], [-3.6, -2.2, 0.2, 2.8, 0.18], [0.6, -5.6, 1.1, 3.2, -0.1]] as const) {
      const [x, y, z] = at(dx, dz, 0.12); lbox(rb, beam, tr(x, y, z, yaw).multiply(new THREE.Matrix4().makeRotationZ(roll)), -len / 2, len / 2, 0, 0.18, -0.1, 0.1);
    }
    for (let k = 0; k < 22; k++) { const [x, y, z] = at((rr() - 0.5) * 11, -0.5 - rr() * 7); lbox(rb, plank, tr(x, y + 0.05, z, rr() * 3).multiply(new THREE.Matrix4().makeRotationZ((rr() - 0.5) * 0.5)), -0.6 - rr() * 0.5, 0.6 + rr() * 0.5, 0, 0.06, -0.1, 0.1); }
    { const [x, y, z] = at(-3.4, -3.6, 0.35); rb.add(new THREE.BoxGeometry(3.4, 0.32, 2.2), lam("thatchFallen", () => ({ color: "#7d6640" })), tr(x, y, z, 0.7).multiply(new THREE.Matrix4().makeRotationX(0.28))); }
    { const [x, y, z] = at(2.8, -4.8, 0.04); lbox(rb, col("doorFrame", "#5a4030"), tr(x, y, z, 0.3), -0.9, 0.9, 0, 0.05, -0.45, 0.45); lbox(rb, col("doorPaper", "#a89c80"), tr(x, y, z, 0.3), -0.8, 0.8, 0.05, 0.06, -0.38, 0.38); }
    for (const [dx, dz, s2] of [[1.4, -2.2, 0.5], [-2.2, -1.1, 0.45], [4.4, -3.6, 0.55]] as const) { const [x, y, z] = at(dx, dz); crateY(rb, x, y - 0.12, z, s2, dx); }
    netHeap(rb, bx - 1.0, by, bz - 2.8, 0.6);
  }
  rb.add(new THREE.ConeGeometry(0.42, 0.22, 18).translate(0, 0.08, 0).rotateZ(0.35), lam("strawHat", () => ({ color: "#d8b870" })), tr(BOAT_OVER[0] - 2.4, BOAT_OVER[1] + 0.02, BOAT_OVER[2] - 1.2));
  VILLAGE.forEach(([, , yaw], i) => { // what is left of the houses: a few posts, a fallen roof slab, timber piles
    const p = villageAt(i), m = tr(p[0], p[1], p[2], yaw + (rr() - 0.5) * 0.4);
    lbox(rb, col("ruinBase", "#7a7468"), m, -3.5, 3.5, -0.4, 0.35, -2.5, 2.5);
    for (let k = 0; k < 3; k++) if (rr() < 0.7) lbox(rb, col("ruinPost", "#4a3426"), m.clone().multiply(new THREE.Matrix4().makeRotationZ((rr() - 0.5) * 0.5)), -3.2 + k * 3.2 - 0.12, -3.2 + k * 3.2 + 0.12, 0.35, 1.2 + rr() * 1.6, 2.2, 2.45);
    if (i % 2 === 0) rb.add(new THREE.BoxGeometry(5.5, 0.35, 3.5), lam("thatchFallen", () => ({ color: "#7d6640" })), m.clone().multiply(new THREE.Matrix4().makeRotationX(0.35 + rr() * 0.2).setPosition(0.5, 0.7, -0.4)));
    for (let k = 0; k < 5; k++) lbox(rb, plank, m.clone().multiply(new THREE.Matrix4().makeRotationY(rr() * 3)), -1.4, 1.4, 0.35 + k * 0.1, 0.43 + k * 0.1, -0.1, 0.1);
  });
  rb.build(groups.ruins, true);

  // ---- the 1933 rebuild: timber-and-plaster houses with tile roofs, the plaque, a telegraph line ----
  { // a telegraph pole with its wires by the plaque house, so the plaque shot reveals it
    const qp = new Batch(), px = PLAQUE_POS[0] - 1.8, pz = PLAQUE_POS[2] + 5.5, a = utilityPole(qp, px, H(px, pz) - 0.2, pz, 0.2, 7.5, false), b2 = utilityPole(qp, px - 26, H(px - 26, pz - 6) - 0.2, pz - 6, 0.25, 7.5, false);
    wires(qp, a.slice(1, 3), b2.slice(1, 3), 0.6); qp.build(groups.v1933, true);
  }
  const qb = new Batch(), qw = new Batch();
  VILLAGE.forEach(([, , yaw], i) => { const p = villageAt(i); jHouse(qb, qw, p[0], p[1], p[2], yaw, { w: 7.2 + (i % 3) * 0.7, d: REBUILT_D, style: "rebuilt", roof: i % 3 ? "#4e5866" : "#5a5048", seed: i + 20 }); });
  for (const [x, u, yaw] of beachBoats) woodBoat(qb, x + 2, H(x + 2, -u - 0.4) + 0.35, -u - 0.4, yaw + 0.1, 6.4, { tint: "#9a7656" });
  for (const [x, u, yaw] of [[-20, 7, 0.1], [4, 6.5, -0.1], [28, 7.5, 0.2]] as const) dryingRack(qb, x, H(x, -u), -u, yaw, 3.4, x + 3);
  for (const [x, u, yaw] of [[-4, 9, 0.3], [18, 10, -0.2]] as const) netOnPosts(qb, x, H(x, -u), -u, yaw, 3);
  let prevT: THREE.Vector3[] | null = null;
  for (let u = 6; u < 140; u += 34) { const x = pathX(-u) - 3.2, z = -u; const pts = utilityPole(qb, x, H(x, z) - 0.2, z, 0.15, 7, false); if (prevT) wires(qb, prevT.slice(1, 3), pts.slice(1, 3), 0.6); prevT = pts; }
  {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.48), twoTone(new THREE.MeshLambertMaterial({ map: yearBoardTex("1933", "#c8a070") })));
    pm.position.set(...PLAQUE_POS); pm.rotation.y = VILLAGE[PLAQUE_1933][2]; groups.v1933.add(pm);
  }
  qb.build(groups.v1933, true); collectWin(qw, groups.v1933, winRebuilt);

  // ---- the carving yard (1933, night): the stone on logs, tools, mats, lanterns ----
  const yb = new Batch(), [yx, yy, yz] = YARD;
  const yardStone = makeStone();
  // (one stone material: no separate side colour for the yard)
  yardStone.rotation.set(-Math.PI / 2, 0, 0.25, "YXZ"); yardStone.rotation.y = 0.25; yardStone.position.set(yx, yy + 0.52, yz + STONE.h / 2 - 0.1); groups.yard.add(yardStone);
  addObst("stone:yard", yx - 0.29, yz - 0.03, STONE.w / 2 + 0.05, STONE.h / 2 + 0.04, 0.5);
  // the two logs under the slab; the near one stops short of carver B's mat (it used to run under him)
  const logM = lam("log", () => ({ map: rep(beamHD(), 1, 0.3), color: "#5e5044" })), lc = Math.cos(0.25), ls = Math.sin(0.25);
  yb.add(new THREE.CylinderGeometry(0.13, 0.13, 1.3, 12).rotateZ(Math.PI / 2), logM, tr(yx, yy + 0.24, yz + 0.6, 0.25));
  yb.add(new THREE.CylinderGeometry(0.13, 0.13, 0.95, 12).rotateZ(Math.PI / 2), logM, tr(yx - 0.525 * lc, yy + 0.24, yz - 0.6 + 0.525 * ls, 0.25));
  // straw mats under the two carvers (one each side of the slab, as seen from its foot)
  lbox(yb, lam("strawMatY", () => ({ color: "#9a8456" })), tr(yx + 0.3, yy, yz - 0.5, 0.5), -0.5, 0.5, 0, 0.03, -0.9, 0.9);
  lbox(yb, lam("strawMatY", () => ({ color: "#9a8456" })), tr(yx - 1.2, yy, yz - 0.9, 0.5), -0.5, 0.5, 0, 0.03, -0.7, 0.7);
  for (let k = 0; k < 5; k++) lbox(yb, col("chisel", "#8a8e94"), tr(yx + 0.39 + k * 0.08, yy + 0.04, yz + 0.96, 0.3 + k * 0.2), -0.1, 0.1, 0, 0.02, -0.01, 0.01);
  // carver A sits on his mat; the crate that was under him (he clipped into it) stands behind him, clear of everyone
  bucket(yb, yx - 0.8, yy, yz + 0.87); ropeCoil(yb, yx + 1.08, yy, yz + 0.87); sack(yb, yx - 2.15, yy, yz - 0.85); crateY(yb, yx + 1.5, yy, yz - 1.9, 0.5, 0.4); crateY(yb, yx - 1.0, yy, yz - 2.05, 0.46, 0.3);
  const lanternPos: V3[] = [[yx - 0.71, yy + 1.75, yz - 1.68], [yx + 0.78, yy + 1.9, yz - 1.13]];
  for (const [lx, ly, lz] of lanternPos) { chochin(yb, groups.yard, lx, ly, lz, 1.2); yb.add(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6).translate(0, 1.2, 0), col("bambooPole", "#8a9a5a"), tr(lx + 0.25, yy, lz)); lbox(yb, col("bambooPole", "#8a9a5a"), tr(lx, ly + 0.35, lz), -0.02, 0.27, -0.02, 0.02, -0.02, 0.02); }
  andon(yb, groups.yard, yx + 0.34, yy, yz + 1.61); addObst("andon", yx + 0.34, yz + 1.61, 0.2, 0.2);
  addObst("bucket", yx - 0.8, yz + 0.87, 0.2, 0.2); addObst("rope", yx + 1.08, yz + 0.87, 0.3, 0.3); addObst("crate", yx + 1.5, yz - 1.9, 0.3, 0.3);
  // the collision rule covers every prop of the yard, not only the stone: logs, both crates, the sack, the chisels, the
  // lantern poles, and the straw mats (each carver sits on his own mat, named as his seat)
  addObst("log", yx - 0.525 * lc, yz - 0.6 + 0.525 * ls, 0.475, 0.13, 0.25); addObst("log", yx, yz + 0.6, 0.65, 0.13, 0.25);
  addObst("crate", yx - 1.0, yz - 2.05, 0.25, 0.25, 0.3); addObst("sack", yx - 2.15, yz - 0.85, 0.26, 0.2); addObst("chisels", yx + 0.55, yz + 0.96, 0.25, 0.12);
  for (const [lx, , lz] of lanternPos) addObst("lanternPole", lx + 0.25, lz, 0.05, 0.05);
  addObst("mat:carverA", yx - 1.2, yz - 0.9, 0.5, 0.7, 0.5); addObst("mat:carverB", yx + 0.3, yz - 0.5, 0.5, 0.9, 0.5);
  yb.build(groups.yard, true);
  for (const [lx, ly, lz] of lanternPos) { lights.push({ place: "hill", pos: [lx, ly - 0.2, lz], color: "#ffa850", intensity: 3.8, distance: 4.2, shots: [7] }); const p = pool(2.8, 2.8, 0.14, 0.08, 0.03, "yardPool"); p.rotation.x = -Math.PI / 2; p.position.set(lx, yy + 0.04, lz); groups.yard.add(p); }
  lights.push({ place: "hill", pos: [yx + 0.34, yy + 0.6, yz + 1.61], color: "#ffb860", intensity: 1.6, distance: 3, shots: [7] });

  // ---- the haul (shot 8): the sledge with the stone (moved per frame), lanterns on poles along the path ----
  const sledge = new THREE.Group(), sb = new Batch();
  for (const s of [-1, 1]) lbox(sb, lam("sledgeWood", () => ({ map: rep(beamHD(), 1, 0.3), color: "#6a4a30" })), new THREE.Matrix4(), s * 0.55 - 0.1, s * 0.55 + 0.1, 0, 0.2, -1.2, 1.2);
  for (const dz of [-0.9, 0, 0.9]) lbox(sb, lam("sledgeWood", () => ({ color: "#6a4a30" })), new THREE.Matrix4(), -0.7, 0.7, 0.2, 0.3, dz - 0.1, dz + 0.1);
  for (const dz of [-1.5, 1.5]) sb.add(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 10).rotateZ(Math.PI / 2), lam("log", () => ({ color: "#7a5a3c" })), tr(0, 0.0, dz));
  for (const s of [-1, 1]) sb.add(new THREE.TorusGeometry(0.62, 0.025, 6, 18), lam("ropeH", () => ({ color: "#c4a272" })), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(0, 0.95, s * 0.4));
  sb.build(sledge, true);
  const hs = makeStone(); hs.rotation.set(-1.25, 0, 0); hs.position.set(0, 0.32, 0.85); sledge.add(hs);
  for (const s of [-0.45, 0.45]) { // the hauling ropes, up the path ahead of the sledge
    const pts = [V(s, 0.25, -1.2), V(s * 1.3, 0.6, -4), V(s * 1.6, 0.9, -9)];
    sledge.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.03, 5), lam("ropeH", () => ({ color: "#c4a272" }))));
  }
  sledge.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  groups.haul.add(sledge);
  const hb = new Batch();
  for (let k = 0; k < 7; k++) {
    const u = k === 6 ? STONE_U + 2 : HAUL_U - 8 + k * 9, s = k % 2 ? 1 : -1, x = pathX(-u) + s * 2.4, z = -u, y = H(x, z);
    hb.add(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 6).translate(0, 1.3, 0), col("bambooPole", "#8a9a5a"), tr(x, y, z));
    chochin(hb, groups.haul, x - s * 0.3, y + 2.25, z, 1.1);
    lights.push({ place: "hill", pos: [x - s * 0.3, y + 2.05, z], color: "#ffa850", intensity: 12, distance: 10, shots: [8] });
    const p = pool(4, 4, 0.2, 0.12, 0.05, "haulPool"); p.rotation.x = -Math.PI / 2; p.position.set(x, y + 0.05, z); groups.haul.add(p);
  }
  { // a lantern on a pole beside the sledge, so the stone is lit as it is hauled past
    const lp = onPath(HAUL_U + 0.4, -1.6, 0); chochin(hb, groups.haul, lp[0], lp[1] + 2.1, lp[2], 1.1);
    hb.add(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6).translate(0, 1.2, 0), col("bambooPole", "#8a9a5a"), tr(lp[0] + 0.25, lp[1], lp[2]));
    lights.push({ place: "hill", pos: [lp[0], lp[1] + 1.9, lp[2]], color: "#ffa850", intensity: 8, distance: 7, shots: [8] });
  }
  hb.build(groups.haul, true);

  // ---- the 100 / 200 / 300 FT posts below the stone (shots 20-21), boards facing uphill ----
  const ptb = new Batch();
  ["100 FT", "200 FT", "300 FT"].forEach((lab, i) => {
    const u = POSTS_U[i], x = pathX(-u) + 2.3, z = -u, y = H(x, z);
    // the 300 ft post where the water stops is a tall wooden measuring post (red bands every half metre, readable from
    // the stone far above); the 100 / 200 ft posts stay small
    const tall = i === 2, ph = tall ? 6.0 : 2.2, pr = tall ? 0.16 : 0.06;
    ptb.add(new THREE.BoxGeometry(pr * 2, ph, pr * 2).translate(0, ph / 2, 0), lam("postWood", () => ({ map: rep(beamHD(), 1, 2), color: "#b08a5a" })), tr(x, y - 0.3, z));
    for (let k = 0; k < (tall ? 11 : 4); k++) ptb.add(new THREE.BoxGeometry(pr * 2 + 0.02, tall ? 0.22 : 0.18, pr * 2 + 0.02).translate(0, 0.25 + k * (tall ? 0.5 : 0.42), 0), col("postRed", "#c8352a"), tr(x, y - 0.3, z));
    if (tall) for (let k = 0; k < 11; k++) ptb.add(new THREE.BoxGeometry(pr * 2 + 0.03, 0.03, pr * 2 + 0.03).translate(0, 0.5 + k * 0.5, 0), col("postTick", "#f4f0e6"), tr(x, y - 0.3, z));
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(tall ? 1.9 : 0.95, tall ? 1.2 : 0.6), new THREE.MeshBasicMaterial({ map: postTex(lab), color: new THREE.Color(0.92, 0.92, 0.92) }));
    bm.position.set(x, y + (tall ? 4.6 : 1.8), z - (tall ? 0.2 : 0.09)); bm.rotation.y = Math.PI + 0.25; groups.posts.add(bm);
  });
  ptb.build(groups.posts, true);

  // ---- the diorama (shot 18): big year labels painted on the bands, THE stone as a giant marker above both ----
  const mapEye = new THREE.Vector3(...MAP_EYE);
  const lab = (text: string, colr: string, level: number, side: number) => {
    let u = 0; while (u < 200 && floorY(u) < level) u += 0.5;
    const x = pathX(-u) + side * 22, z = -u - 4, m = new THREE.Mesh(new THREE.PlaneGeometry(50, 19.5), new THREE.MeshBasicMaterial({ map: mapLabelTex(text, colr), transparent: true, depthWrite: false, depthTest: false }));
    m.position.set(x, H(x, z) + 7, z); m.lookAt(mapEye); m.layers.set(NOINK); m.renderOrder = 2; groups.map.add(m);
  };
  lab("1896", "#ff8a4a", MAP_1896, -1); lab("1933", "#ffd84a", MAP_1933, 1);
  void ringMarkTex;
  { const big = makeStone(); big.scale.setScalar(30); big.position.set(STONE.x, STONE.y - 0.3, STONE.z); big.lookAt(mapEye.x, STONE.y, mapEye.z); groups.map.add(big);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(17, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.35, 0.9), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    void halo; }

  // ---- water: the sea and the valley flood share one material ----
  const water = waterUniforms();
  water.uGround.value = heightTexture(); water.uGroundO.value.set(GRID.x0, GRID.z0); water.uGroundS.value.set((GRID.nx - 1) * GRID.step, (GRID.nz - 1) * GRID.step); water.uHasGround.value = 1;
  const wm = waterMaterial(water, "hill"), wink = waterInkMaterial(water);
  for (const g of [waterGrid(-2600, 2600, -60, 2700, 26, 8), waterGrid(-170, 170, -270, -50, 2, 2)]) {
    const mesh = new THREE.Mesh(g, wm); mesh.layers.set(TWIN_LAYER); mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false;
    mesh.userData.inkNormal = wink; inkTwins.add(mesh); root.add(mesh);
  }
  // far headland hills beyond the terrain grid (silhouettes behind the bay)
  const fb = new Batch();
  for (const [x, z, sx, sy, sz] of [[-760, 300, 300, 160, 260], [780, 260, 320, 180, 280], [-900, -200, 400, 260, 400], [920, -260, 420, 240, 380], [0, -900, 700, 300, 300]] as const)
    fb.add(new THREE.SphereGeometry(1, 30, 14, 0, Math.PI * 2, 0, Math.PI / 2), lam("farHill", () => ({ color: "#4e7a46" })), new THREE.Matrix4().compose(V(x, -20, z), new THREE.Quaternion(), V(sx, sy, sz)));
  fb.build(root, false);
  { // cedar forest on the far hills (no flat, featureless domes behind the valley)
    const fr = rng(31), far: Inst[] = [];
    for (const [hx, hz, sx, sy, sz] of [[-760, 300, 300, 160, 260], [780, 260, 320, 180, 280], [-900, -200, 400, 260, 400], [920, -260, 420, 240, 380], [0, -900, 700, 300, 300]] as const) {
      for (let k = 0; k < 520; k++) {
        const a2 = fr() * Math.PI * 2, rr = Math.sqrt(fr()) * 0.96, dx = Math.cos(a2) * rr, dz = Math.sin(a2) * rr;
        const x = hx + dx * sx, z = hz + dz * sz, y = -20 + sy * Math.sqrt(Math.max(0, 1 - rr * rr));
        if (Math.abs(x) < 520 && z > -560 && z < 360) continue; // inside the terrain grid: the valley has its own forest
        far.push({ x, y: y - 1, z, h: 24 + 14 * fr(), w: 20 + 8 * fr(), c: Math.floor(fr() * 4) });
      }
    }
    plant(root, "sugi", far, { shadow: false });
  }
  void onPath; void gnd; void STONE_U; void quad; void cloudHD; void CLOUD_DAY;
  // the toon wave walls: 1896 across the whole bay (dark storm water), the 1933 surge into the rebuilt village
  const w1896 = makeWave(WAVE_DEF.w1896.cx, WAVE_DEF.w1896.len, WAVE_DEF.w1896.base, { back: "#1f3a58", foam: "#d6dee4", faceTop: "#3f86a8", face: "#16385a", toe: "#bcc8d0" }, 3, 220);
  const w1933 = makeWave(WAVE_DEF.w1933.cx, WAVE_DEF.w1933.len, WAVE_DEF.w1933.base, { back: "#2a4258", foam: "#dfe6ea", faceTop: "#3a7894", face: "#16304a", toe: "#cfd8de" }, 7, 110);
  root.add(w1896.mesh, w1933.mesh);
  water.uFrontDrop.value = 0; water.uFrontH.value = 0.62 * 4.8;
  return { parts: { groups, stone, sledge, water, mapU, winOld, winNow, winRebuilt, w1896, w1933 }, lights };
};

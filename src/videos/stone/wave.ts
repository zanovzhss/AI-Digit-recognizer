// The toon wave wall (1896 at sea, the 1933 surge between the houses, the 2011 wall over the town): one long extruded
// profile (back slope, foam crest, curling lip, steep dark face, foam at the toe). The vertices are rebuilt every frame
// on the CPU (height, curl and position change over time), so the ink pass sees the real silhouette and creases.
// Flat toon colours (vertex colours) with scene fog; white foam veins run down the face (a scrolling vein texture mixed
// in on the face rows), the crest is ragged, and cast.ts puts inked foam puffs along it (crestPoint).
import * as THREE from "three";
import { ctex } from "./paint";

export type WaveLook = { back: string; foam: string; faceTop: string; face: string; toe: string };
export type WaveState = {
  on: boolean;
  /** world z of the toe (where the wall meets the water ahead of it); the wall travels toward -z */
  toe: number;
  /** wall height (m) above `base` */
  H: number;
  /** 0 = a steep wall, 1 = a curling lip over the face */
  curl: number;
  /** level of the water behind the wall, as a fraction of H (0 = a lone wave at sea, ~0.5 = a flood behind) */
  backLevel: number;
  /** time (s) for the veins and the ragged crest */
  t: number;
};
export type WaveDef = { cx: number; len: number; base: number; seed: number };

const fract = (v: number) => v - Math.floor(v);
const hash1 = (x: number) => fract(Math.sin(x * 127.1) * 43758.5453);
const n1 = (x: number) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash1(i) + (hash1(i + 1) - hash1(i)) * u; };

/** local wall height at x: ragged along the wall, tapering at its ends, slowly changing */
const heightAt = (d: WaveDef, s: Pick<WaveState, "H" | "t">, x: number) => {
  const e = Math.min(1, Math.min(x - (d.cx - d.len / 2), d.cx + d.len / 2 - x) / (d.len * 0.08));
  return s.H * (0.68 + 0.16 * n1(x / 45 + d.seed + s.t * 0.12) + 0.11 * n1(x / 16 + 2 * d.seed + s.t * 0.5) + 0.05 * n1(x / 6 + 3 * d.seed + s.t)) * (0.3 + 0.7 * Math.max(0, e));
};
const zOff = (d: WaveDef, s: Pick<WaveState, "H">, x: number) => 0.14 * s.H * (n1(x / 80 + d.seed * 2) - 0.5);
/** the top of the crest at x (for the foam puffs and spray in cast.ts) */
export const crestPoint = (d: WaveDef, s: Pick<WaveState, "H" | "t" | "toe">, x: number): [number, number, number] => {
  const hx = heightAt(d, s, x);
  return [x, d.base + 1.02 * hx, s.toe + zOff(d, s, x) + 0.26 * hx];
};
/** where the wall's foot meets the water / the ground ahead of it */
export const toePoint = (d: WaveDef, s: Pick<WaveState, "H" | "t" | "toe">, x: number): [number, number, number] => {
  const hx = heightAt(d, s, x);
  return [x, d.base + 0.06 * hx, s.toe + zOff(d, s, x)];
};
/** curl varies along the wall */
const curlAt = (d: WaveDef, c: number, x: number, t: number) => c * (0.55 + 0.45 * n1(x / 34 + d.seed * 4 + t * 0.2));

/** profile control points (forward = the travel direction, up), in units of H */
const profile = (c: number, back: number): [number, number][] => [
  [-3.0, back - 0.03], [-1.75, back + (1 - back) * 0.24], [-0.85, back + (1 - back) * 0.63], [-0.3, 0.93], [0.05, 1.03],
  [0.05 + 0.27 * c, 1.0 - 0.02 * c], [0.08 + 0.36 * c, 0.86], [0.07 + 0.24 * c, 0.72],
  [0.13, 0.57], [0.08, 0.36], [0.12, 0.12], [0.32, -0.03],
];
const ROWS_PER_SEG = 4;

/** foam veins: wavy white fingers running down, thinning, with foam flecks (red channel = foam amount) */
const veinTex = () => ctex("waveVeins", 512, 512, (g, r) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, 512, 512);
  g.lineCap = "round";
  for (let i = 0; i < 64; i++) {
    let x = r() * 512, y = r() * 512;
    const len = 120 + r() * 300, w0 = 5 + r() * 12, ph = r() * 6.28, amp = 5 + r() * 12;
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
      g.beginPath();
      for (let k = 0; k <= 24; k++) { const t = k / 24, xx = x + ox + amp * Math.sin(ph + t * 7), yy = y + oy + t * len; if (k === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
      g.strokeStyle = `rgba(255,255,255,${0.55 + 0.45 * r()})`; g.lineWidth = w0; g.stroke();
    }
    x += 0; y += 0;
  }
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * r()})`; const x = r() * 512, y = r() * 512, rr = 1.5 + r() * 4; g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.fill(); }
});

export type Wave = { mesh: THREE.Mesh; def: WaveDef; update: (s: WaveState) => void };

/** a wave wall `len` metres long centred on x = cx, sitting on water level `base` */
export const makeWave = (cx: number, len: number, base: number, look: WaveLook, seed: number, nx = 180): Wave => {
  const def: WaveDef = { cx, len, base, seed };
  const P0 = profile(0, 0), ns = (P0.length - 1) * ROWS_PER_SEG + 1;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(nx * ns * 3), col = new Float32Array(nx * ns * 3), uv = new Float32Array(nx * ns * 2), face = new Float32Array(nx * ns);
  const idx: number[] = [];
  for (let i = 0; i < nx - 1; i++) for (let j = 0; j < ns - 1; j++) { const a = i * ns + j, b = (i + 1) * ns + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setIndex(idx);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("aFace", new THREE.BufferAttribute(face, 1));
  const C = (h: string) => new THREE.Color(h);
  const cBack = C(look.back), cFoam = C(look.foam), cTop = C(look.faceTop), cFace = C(look.face), cToe = C(look.toe);
  const tmp = new THREE.Color();
  for (let i = 0; i < nx; i++) {
    const fx = n1(i * 0.37 + seed), fy = n1(i * 0.11 + seed * 3), fz = n1(i * 0.9 + seed * 5);
    for (let j = 0; j < ns; j++) {
      const sg = j / ROWS_PER_SEG; // control segment coordinate 0..11
      const foamBack = 3.35 + 0.5 * fy, foamFace = 6.15 + 1.0 * fx * fz + 0.25 * fx, toe = 10.2 - 0.7 * fy;
      let fc = 0;
      if (sg < foamBack) { tmp.copy(cBack).lerp(cTop, Math.max(0, (sg - foamBack + 1.2) / 1.2) * 0.55); fc = 0.35; }
      else if (sg < foamFace) { tmp.copy(cFoam); fc = 0; }
      else if (sg < toe) { const k = Math.min(1, (sg - foamFace) / 2.4); tmp.copy(cTop).lerp(cFace, k); fc = 1.0 - 0.4 * k; }
      else { tmp.copy(cFace).lerp(cToe, Math.min(1, (sg - toe) / 0.6)); fc = 0.5; }
      col.set([tmp.r, tmp.g, tmp.b], (i * ns + j) * 3);
      face[i * ns + j] = fc;
      uv.set([(i / (nx - 1)) * len / 60, (j / (ns - 1)) * 1.6], (i * ns + j) * 2);
    }
  }
  const tex = veinTex().clone(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
  const foamC = C(look.foam);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, map: tex, fog: false, side: THREE.DoubleSide }); // the hero: full contrast through the storm haze
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aFace;\nvarying float vFace;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n  vFace = aFace;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\nvarying float vFace;\nconst vec3 FOAMC = vec3(${foamC.r.toFixed(4)}, ${foamC.g.toFixed(4)}, ${foamC.b.toFixed(4)});`)
      .replace("#include <map_fragment>", `#ifdef USE_MAP
  vec4 tx = texture2D( map, vMapUv );
  diffuseColor.rgb = mix( diffuseColor.rgb, FOAMC, clamp( tx.r * vFace, 0.0, 1.0 ) );
#endif`);
  };
  mat.customProgramCacheKey = () => "waveFoam" + look.foam;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.visible = false;
  const update = (s: WaveState) => {
    mesh.visible = s.on;
    if (!s.on) return;
    const P = profile(s.curl, s.backLevel);
    const cr = (k: number): [number, number] => { // Catmull-Rom through the control points
      const i = Math.min(P.length - 2, Math.floor(k)), u = k - i;
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
    };
    for (let i = 0; i < nx; i++) {
      const x = cx - len / 2 + (len * i) / (nx - 1), hx = heightAt(def, s, x), zo = zOff(def, s, x);
      P.splice(0, P.length, ...profile(curlAt(def, s.curl, x, s.t), s.backLevel));
      const rows = Array.from({ length: ns }, (_, j) => cr(j / ROWS_PER_SEG));
      const lump = 0.06 * s.H * (n1(x / 6 + s.t * 1.3 + seed) - 0.5);
      for (let j = 0; j < ns; j++) {
        const [fw, up] = rows[j], sg = j / ROWS_PER_SEG, isCrest = sg > 3 && sg < 7.5;
        pos.set([x, base + up * hx + (isCrest ? lump : 0), s.toe + zo + (0.32 - fw) * hx], (i * ns + j) * 3);
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    tex.offset.set(s.t * 0.015, s.t * 0.55);
  };
  return { mesh, def, update };
};

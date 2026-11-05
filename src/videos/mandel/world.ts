// The mandel short as one three.js scene: the template's sky dome, camera-relative key ("sun") with shadows and fog,
// plus the practical lamps (point lights) of each set; every place built once around its own x offset (story.ts OFF):
// the lottery hall, the Bucharest flat, the explanation room, the Melbourne kiosk, the Virginia gas station, the
// warehouse, the lottery office and the island. update(id, f, camera) poses everything for shot `id` at frame f (pure
// function of id + f): the light rig, the practicals, the animated props (marquee, wall cells and counter, the scale, the
// map route, the plaques, the suitcase, the jackpot roll, the clock, the avalanche, the binder, the stamp, the coin jar)
// and the cast + effects from cast.ts.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { V, Kit } from "./build";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, camRig, ShotDef, ROOM, KIOSK, STATION, OFFICE, fillAt, beamAt, winsAt, jackpotAt, routeAt, WIN_F, STAMP_F, smooth, clamp01, cue, W } from "./story";
import { buildHall, buildFlat, HallParts, FlatParts, Practical } from "./sets";
import { buildWall, buildKiosk, buildStation, buildWarehouse, buildOffice, buildIsland, WallParts, KioskParts, StationParts, OfficeParts } from "./sets2";
import { drawPlaque, drawCounter, drawMap, drawJackpotRoll, drawDays, noticeTex } from "./signs";

// ---------------- assets ----------------
// Kenney CC0 kits in public/bridge/kenney/<name>.glb: not used by the first sets, kept for the later ones
const KENNEY: string[] = [];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunCache = new Map<number, THREE.Vector3>();
  private hall: HallParts; private flat: FlatParts; private wall: WallParts; private kiosk: KioskParts;
  private station: StationParts; private office: OfficeParts; private cellCol = new THREE.Color(); private cellsLit = -1;
  private practicals: { spec: Practical; light: THREE.PointLight }[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky (template shader; seen only through windows and doors) + key light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);

    // ---- places ----
    const hall = buildHall(R), flat = buildFlat(R), wall = buildWall(R), kiosk = buildKiosk(R, kit), station = buildStation(R), ware = buildWarehouse(R),
      office = buildOffice(R);
    buildIsland(R);
    this.hall = hall.parts; this.flat = flat.parts; this.wall = wall.parts; this.kiosk = kiosk.parts; this.station = station.parts; this.office = office.parts;
    for (const spec of [...hall.lights, ...flat.lights, ...wall.lights, ...station.lights, ...ware.lights, ...office.lights]) {
      const l = new THREE.PointLight(spec.color, 0, spec.distance, 2);
      l.position.set(...spec.pos); l.castShadow = false; R.add(l);
      this.practicals.push({ spec, light: l });
    }
  }

  /** camera-relative key frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camRig(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  /** the animated props of the place in view (pure function of id + f) */
  private props(id: number, f: number) {
    const s = SHOTS[id - 1];
    // the flat: the newspaper (shot 5), the coin jar filling and the slips (9-10), the WINS: 1 plaque from the win on
    const fl = this.flat;
    fl.paper.visible = id === 5;
    fl.coins.visible = id === 9 || id === 10; fl.coins.scale.y = id === 9 ? 0.02 + 0.14 * smooth((f - cue(W.chip)) / 20) : 0.16;
    fl.slips.visible = id === 9 || id === 10; fl.slips.scale.y = id === 9 ? 0.01 + 0.07 * smooth((f - cue(W.fill)) / 30) : 0.08;
    const drop = clamp01((f - WIN_F) / 8);
    fl.plaque.visible = id === 10 && f >= WIN_F; fl.plaque.position.y = 2.0 + 0.5 * (1 - drop * drop) - 0.03 * Math.sin(Math.min(1, (f - WIN_F - 8) / 10) * Math.PI) * (f > WIN_F + 8 ? 1 : 0);
    if (s.place === "wall") { // the wall cells, the counter, the scale, the route
      const w = this.wall, n = ROOM.cols * ROOM.rows, lit = Math.round(fillAt(id, f) * n);
      if (lit !== this.cellsLit) {
        for (let i = 0; i < n; i++) {
          const h = Math.sin(i * 127.1) * 43758.5453, r = h - Math.floor(h); // a scattered fill, not a sweep
          const on = r < lit / n;
          this.cellCol.setRGB(on ? 1 : 0.06, on ? 0.92 : 0.08, on ? 0.7 : 0.16); w.cells.setColorAt(i, this.cellCol);
        }
        w.cells.instanceColor!.needsUpdate = true; this.cellsLit = lit;
      }
      const cnt = Math.round(fillAt(id, f) * 7059052);
      w.counter.set(String(cnt), drawCounter(cnt));
      const a = beamAt(id === 6 ? f : 1e9);
      w.beam.rotation.z = a;
      w.pans.forEach((g, i) => { const sx = i ? 1 : -1; g.position.set(w.beam.position.x + sx * 1.3 * Math.cos(a), w.beam.position.y + sx * 1.3 * Math.sin(a), w.beam.position.z); });
      const pr = id === 18 ? routeAt(f) : id > 18 ? 1 : 0;
      w.map.set(pr.toFixed(3), drawMap(pr));
    }
    if (s.place === "kiosk") { // the plaque ticks 2 -> 13; the suitcase drops in and bounces (shot 11)
      const n = winsAt(id, f); this.kiosk.plaque.set(String(n), drawPlaque(n));
      const u = (f - 640) / 16, k = this.kiosk.suitcase;
      const y = u < 1 ? 3.2 * (1 - u * u) : 0.12 + 0.16 * Math.abs(Math.sin((u - 1) * 3.2)) * Math.exp(-(u - 1) * 2.2);
      k.visible = id === 11 ? f >= 640 : id === 12;
      k.position.set(KIOSK.suitcase[0], id === 12 ? 0.12 : Math.max(0.12, y), KIOSK.suitcase[2]); k.rotation.set(0, 0.4, u < 1 ? 0.4 * (1 - u) : 0);
    }
    if (s.place === "station") { // the jackpot rolls up, the clock races, the days run out, the avalanche grows
      const st = this.station, v = id === 14 ? jackpotAt(f) : 27036142;
      st.board.set(String(Math.round(v / 1000)), drawJackpotRoll(v));
      const spin = id === 20 ? (f - 1239) * 0.9 : 0;
      st.hands[0].rotation.z = -0.6 - spin * 0.08; st.hands[1].rotation.z = -2.2 - spin;
      const days = id === 20 ? Math.max(0, 3 - Math.floor((f - 1246) / 9)) : 3; st.days.set(String(days), drawDays(days));
      const av = id === 19 ? 0.15 + 0.85 * smooth((f - 1170) / 50) : id === 20 ? 0.28 : id === 16 ? 0.0 : 0.1;
      st.avalanche.scale.set(0.4 + 0.5 * av, 0.05 + 0.75 * av, 0.3 + 0.25 * av);
    }
    if (s.place === "office") { // the binder slams shut on "changed"; the stamp comes down on "ever"
      const o = this.office, sl = smooth((f - (cue(W.changed) - 4)) / 6);
      o.cover.rotation.z = (Math.PI * 0.85) * (1 - sl) + 0.0;
      const su = (f - (STAMP_F - 6)) / 6, hit = f >= STAMP_F;
      const y = su < 0 ? 0.45 : su < 1 ? 0.45 * (1 - su * su) : hit ? 0.004 + 0.18 * smooth((f - STAMP_F - 6) / 10) : 0.004;
      o.stamp.position.set(OFFICE.notice[0] + 0.02, OFFICE.notice[1] + y, OFFICE.notice[2] + 0.04);
      const m = o.notice.material as THREE.MeshLambertMaterial, want = noticeTex(hit && id === 24);
      if (m.map !== want) { m.map = want; m.needsUpdate = true; }
    }
    void STATION;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- key light: camera-relative, frozen per shot, shadow box fitted around the subject ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.2 + 6, 9, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 10; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    TONE.uPract.value = L.practical;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- practical lamps: only the ones of this place are on ----
    for (const p of this.practicals) p.light.intensity = p.spec.place === s.place && (!p.spec.shots || p.spec.shots.includes(id)) ? p.spec.intensity * L.practical : 0;
    // ---- sky + fog ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    // ---- the hall's marquee: bulbs chase in threes ----
    if (s.place === "hall") { const k = Math.floor(f / 3); this.hall.bulbs.forEach((m, i) => { m.material = (i + k) % 3 === 0 ? this.hall.bulbOff : this.hall.bulbOn; }); }
    this.props(id, f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 2.2 * sc2))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(p.pitch ?? 0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const fe = this.fx(fi++);
      fe.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      fe.use(!!p.soft);
      fe.soft.blending = p.glow ? THREE.AdditiveBlending : THREE.NormalBlending;
      fe.soft.color.setScalar(p.glow ?? 1); fe.soft.toneMapped = !p.glow;
      fe.mesh.visible = true;
      fe.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) fe.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { fe.mesh.quaternion.copy(cam.quaternion); fe.mesh.rotateZ(p.rot ?? 0); }
      fe.mesh.scale.set(p.w, p.h, 1);
      fused.push(fe);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}

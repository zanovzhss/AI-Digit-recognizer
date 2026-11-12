// The stone short as one three.js scene: the template's sky dome, camera-relative key ("sun") with shadows and fog, a
// sun disc for the low-sun lights, painted clouds, night stars, the practical lamps of each set; three places built once
// around their own x offsets (story.ts OFF): the Aneyoshi valley (hill.ts), the coastal town (town.ts), the 2011 room
// (room.ts). update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f): the light rig,
// the era groups of the valley, the windows (paper by day, lamp-lit at dusk), the water (swell, flood, wave, map
// ripples), the town's time-lapse, the earthquake in the room, the haul, and the cast + effects from cast.ts.
import * as THREE from "three";
import { V, Kit } from "./build";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK, TWIN_LAYER } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, camRig, ShotDef, OFF, floodAt, swellAt, townFrontAt, ringAt, growAt, SHAKE_F, smooth, clamp01, onPath, HAUL_U, cue, W } from "./story";
import { pathX, H } from "./terrain";
import { buildHill, HillParts } from "./hill";
import { buildTown, TownParts } from "./town";
import { buildRoom, RoomParts } from "./room";
import { Practical } from "./common";
import { winGlow, winPaper, winGlassDay, WIN_BASE } from "./jhouse";
import { cloudHD } from "./paint";

export const loadKit = () => Promise.resolve({} as Kit);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunCache = new Map<number, THREE.Vector3>();
  private hill: HillParts; private town: TownParts; private room: RoomParts;
  private practicals: { spec: Practical; light: THREE.PointLight }[] = [];
  private clouds: { mesh: THREE.Mesh; place: string; k: number }[] = [];
  private cloudMat: THREE.MeshBasicMaterial[] = [];
  private stars: THREE.Points; private disc: THREE.Mesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private lastG = -1;

  constructor(kit: Kit) {
    void kit;
    const R = this.root;
    // ---- sky (template shader) + key light ----
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
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    // ---- sun disc, stars ----
    const discTex = new THREE.CanvasTexture((() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,1)"); gr.addColorStop(0.36, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return c; })());
    this.disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    this.disc.layers.set(NOINK); this.disc.renderOrder = -0.5; R.add(this.disc);
    const sp: number[] = [];
    for (let i = 0; i < 700; i++) { const a = (((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1) * Math.PI * 2, e = 0.08 + 0.92 * Math.sqrt(((i * 0.618) % 1)), r = 1200; sp.push(Math.cos(a) * Math.cos(e * 1.4) * r, Math.sin(e * 1.4) * r, Math.sin(a) * Math.cos(e * 1.4) * r); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(1.3, 1.3, 1.4), size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
    this.stars.layers.set(NOINK); this.stars.frustumCulled = false; R.add(this.stars);
    // ---- places ----
    const hill = buildHill(R), town = buildTown(R), room = buildRoom(R);
    this.hill = hill.parts; this.town = town.parts; this.room = room.parts;
    for (const spec of [...hill.lights, ...room.lights]) {
      const l = new THREE.PointLight(spec.color, 0, spec.distance, 2);
      l.position.set(...spec.pos); l.castShadow = false; R.add(l);
      this.practicals.push({ spec, light: l });
    }
    // ---- clouds: painted cards on a ring round each place, far beyond the sets ----
    for (let k = 0; k < 4; k++) this.cloudMat.push(new THREE.MeshBasicMaterial({ map: cloudHD(k), transparent: true, depthWrite: false, fog: false }));
    const ring = (place: string, cx: number, cz: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.3 * Math.sin(i * 7.1), d = 700 + 260 * ((i * 0.37) % 1), y = 90 + 170 * ((i * 0.53) % 1), s = 260 + 200 * ((i * 0.71) % 1);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), this.cloudMat[i % 4]);
        m.position.set(cx + Math.cos(a) * d, y, cz + Math.sin(a) * d); m.scale.set(s, s, 1); m.lookAt(cx, y, cz);
        m.layers.set(NOINK); m.renderOrder = -0.8; R.add(m); this.clouds.push({ mesh: m, place, k: (i * 0.618) % 1 });
      }
    };
    ring("hill", 0, -60, 30); ring("town", OFF.town, -150, 30); ring("room", OFF.room, -40, 16);
  }

  /** camera-relative key frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    if (s.sunW) { v = new THREE.Vector3(...s.sunW).normalize(); this.sunCache.set(id, v); return v; }
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

  /** the animated parts of the place in view (pure function of id + f) */
  private props(id: number, f: number, t: number, L: LightPreset) {
    const s = SHOTS[id - 1], look = LOOK[s.light];
    // ---- windows: lamp-lit at dusk / night / sunset, plain paper or glass by day ----
    const lit = L.windows > 0.05;
    for (const m of [...this.hill.winOld, ...this.hill.winNow, ...this.hill.winRebuilt, ...this.town.win]) {
      const kind = (m.userData.kind as "shoji" | "glass" | undefined) ?? ((m.material as THREE.Material).name === "winGlow" + "glass" || (m.material as THREE.MeshLambertMaterial).map == null ? "glass" : "shoji");
      m.userData.kind = kind;
      m.material = lit ? winGlow(kind) : kind === "shoji" ? winPaper() : winGlassDay();
    }
    for (const kind of ["shoji", "glass"] as const) winGlow(kind).color.copy(WIN_BASE[kind]).multiplyScalar(Math.max(0.05, L.windows));
    if (s.place === "hill") {
      const g = this.hill.groups, era = s.era;
      g.now.visible = era === "now"; g.v1896.visible = id === 2; g.ruins.visible = id === 3 || id === 4; g.v1933.visible = era === "1933";
      g.yard.visible = id === 7; g.haul.visible = id === 8; g.posts.visible = id === 20 || id === 21; g.map.visible = id === 18;
      this.hill.mapU.uMap.value = id === 18 ? 1 : 0;
      const w = this.hill.water;
      w.uTime.value = t;
      w.uLevel.value = floodAt(id, f) ?? 0;
      const sw = id === 2 ? swellAt(f) : { h: 0, z: 1e5 };
      w.uSwellH.value = sw.h; w.uSwellZ.value = sw.z;
      w.uChop.value = s.light === "storm" ? 2.6 : s.light === "dark" ? 2.0 : 1.0;
      w.uFlow.value = id === 6 ? 1.0 : id === 20 ? 1.3 : id === 21 ? 1.3 * (1 - clamp01((f - 1462) / 40)) + 0.15 : 0;
      w.uFlowDir.value.set(0, -1);
      w.uFoamW.value = id === 20 || id === 21 || id === 6 ? 2.2 : id === 3 || id === 4 ? 0.12 : 0.7;
      const rg = id === 18 ? ringAt(f) : null;
      w.uRingR.value = rg ? rg.r : 0; w.uRingC.value.set(40, 430); w.uMapFront.value = rg && f >= cue(W.sends) ? rg.front : 1e5;
      this.seaColours(w, look);
      // the haul: the sledge slides up the path
      if (id === 8) {
        const u = HAUL_U + 2.5 * smooth((f - 583) / 52), p = onPath(u, 0, 0), p2 = onPath(u + 1, 0, 0);
        this.hill.sledge.position.set(...p);
        this.hill.sledge.rotation.set(Math.atan2(p2[1] - p[1], 1), Math.atan2(pathX(-u - 1) - pathX(-u), -1) + Math.PI, 0, "YXZ");
      }
    }
    if (s.place === "town") {
      const T = this.town, g = id === 9 ? growAt(f) : 1.0001;
      // houses and poles appear in order; the newest pop up from their base
      const n = T.keys.length;
      let cnt = 0; while (cnt < n && T.keys[cnt] <= g) cnt++;
      if (Math.abs(g - this.lastG) > 0.04 || this.lastG < 0) { for (let i = 0; i < n; i++) { T.bodies.setMatrixAt(i, T.mats[i]); T.roofs.setMatrixAt(i, T.roofMats[i]); } }
      const sc = new THREE.Matrix4(), tmp = new THREE.Matrix4();
      for (let i = Math.max(0, cnt - 40); i < cnt; i++) {
        const k = clamp01((g - T.keys[i]) / 0.025), e = k < 1 ? 0.25 + 0.75 * (1 - (1 - k) ** 3) + 0.08 * Math.sin(k * Math.PI) : 1;
        const p = new THREE.Vector3().setFromMatrixPosition(T.mats[i]);
        sc.makeTranslation(p.x, 0, p.z).multiply(tmp.makeScale(1, e, 1)).multiply(new THREE.Matrix4().makeTranslation(-p.x, 0, -p.z));
        T.bodies.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(sc, T.mats[i]));
        T.roofs.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(sc, T.roofMats[i]));
      }
      T.bodies.count = cnt; T.roofs.count = cnt; T.bodies.instanceMatrix.needsUpdate = true; T.roofs.instanceMatrix.needsUpdate = true;
      this.lastG = g;
      let pc = 0; while (pc < T.poleKeys.length && T.poleKeys[pc] <= g) pc++;
      T.poles.count = pc;
      let tc = 0; while (tc < T.treeKeys.length && T.treeKeys[tc] <= g) tc++;
      for (const im of T.trees) im.count = tc;
      T.cloudShadow.visible = id === 9;
      if (id === 9) { const mt = (T.cloudShadow.material as THREE.MeshBasicMaterial).map!; mt.offset.set(-(f - 635) * 0.006, (f - 635) * 0.004); }
      for (const fl of T.fields) fl.mesh.visible = fl.key > g;
      for (const lo of T.lots) lo.mesh.visible = lo.key <= g;
      T.harbour.scale.set(1, 1, id === 9 ? Math.max(0.001, smooth((f - 668) / 40)) : 1);
      T.boats.visible = id !== 9 || f > 700;
      T.fish.visible = false;
      const w = T.water;
      w.uTime.value = t;
      w.uFrontOn.value = id === 19 ? 1 : 0; w.uFrontZ.value = townFrontAt(f);
      w.uChop.value = id === 19 ? 2.2 : 1.0; w.uFlow.value = id === 19 ? 1.6 : 0; w.uFlowDir.value.set(0, -1);
      this.seaColours(w, look);
    }
    if (s.place === "room") { // the earthquake: the cup rattles and walks, the lid clatters, the lamp swings, the wires sway
      const R = this.room, k = f >= SHAKE_F ? Math.min(1, (f - SHAKE_F) / 10) : 0;
      const j = (a: number, b: number) => Math.sin(f * a + b) * 0.6 + Math.sin(f * a * 1.7 + 2 * b) * 0.4;
      R.cup.position.set(OFF.room + 0.02 + 0.004 * k * j(2.3, 1) + 0.0006 * k * (f - SHAKE_F), 0.335 + 0.002 * k * Math.max(0, j(3.1, 2)), -0.08 + 0.004 * k * j(2.7, 3));
      R.cup.rotation.set(0.05 * k * j(2.9, 4), 0.01 * (f - SHAKE_F) * k, 0.05 * k * j(3.3, 5));
      R.tea.scale.setScalar(1 - 0.06 * k * Math.abs(j(4.1, 6)));
      R.lid.position.y = 0.46 + 0.006 * k * Math.max(0, j(3.7, 7)); R.lid.rotation.z = 0.12 * k * j(2.2, 8);
      R.lamp.rotation.z = 0.09 * k * Math.sin((f - SHAKE_F) * 0.32); R.lamp.rotation.x = 0.05 * k * Math.sin((f - SHAKE_F) * 0.27 + 1);
      R.wires.rotation.z = 0.012 * k * Math.sin((f - SHAKE_F) * 0.5); R.wires.position.y = 0.06 * k * Math.sin((f - SHAKE_F) * 0.44);
    }
  }
  private seaColours(w: { uNear: { value: THREE.Color }; uFar: { value: THREE.Color }; uDeep: { value: THREE.Color }; uFoam: { value: THREE.Color } }, look: (typeof LOOK)["day"]) {
    w.uNear.value.set(look.sea.near); w.uFar.value.set(look.sea.far); w.uDeep.value.set(look.sea.deep); w.uFoam.value.set(look.sea.foam);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 3200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); cam.layers.enable(TWIN_LAYER);
    // ---- key light: camera-relative, frozen per shot, shadow box fitted around the subject ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.3 + 8, 10, 240);
    this.sun.position.copy(focus).addScaledVector(sunDir, 600); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 50; sc.far = 1400; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias * (Rr > 60 ? 3 : 1); this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    TONE.uPract.value = L.practical;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- practical lamps: only the ones of this place (and shot) are on ----
    for (const p of this.practicals) p.light.intensity = p.spec.place === s.place && (!p.spec.shots || p.spec.shots.includes(id)) ? p.spec.intensity * L.practical : 0;
    // ---- sky, fog, clouds, stars, the sun disc ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const cm = new THREE.Color(K.cloud.mid), cl = new THREE.Color(K.cloud.lit);
    for (const m of this.cloudMat) m.color.copy(cl).lerp(cm, 0.5).multiplyScalar(1.05);
    for (const cd of this.clouds) cd.mesh.visible = cd.place === s.place && cd.k < K.clouds;
    this.stars.visible = K.stars; this.stars.position.copy(cam.position);
    const discOn = L.sunDisc !== "#000000" && sunDir.y > -0.02;
    this.disc.visible = discOn;
    if (discOn) { this.disc.position.copy(cam.position).addScaledVector(sunDir, 1150); this.disc.lookAt(cam.position); this.disc.scale.setScalar(150); (this.disc.material as THREE.MeshBasicMaterial).color.set(L.sunDisc).multiplyScalar(2.4); }
    this.props(id, f, t, L);
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
    for (const e2 of fused) e2.bind();
    void H;
    return focus;
  }
}

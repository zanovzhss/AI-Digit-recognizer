// The whole short as one three.js scene: sky, sun rig, fog and water (the bridge template's), every place built once
// around its own x offset (story.ts OFF): the snowy street and the cell (CellarShort's lane and cellar, reused), the
// frozen pond, Boston harbour, the tropical beach, the Caribbean port, the ship's hold, the lumber mill, the open ocean
// and Calcutta with its ice market. update(id, f, camera) poses everything for shot `id` at frame f (pure function of
// id + f): the brig, the held blocks and the newspaper, the melting stack and its puddles, the wallet and the coin, the
// icicles, the towel, the sawdust fill, the calendar page, and the cast.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, V, lam, Kit, Ray, kitClone, buildStreet, fencePost, SNOW_GLOW, buildBrig, BrigParts, buildPond, buildHarbor, buildBeach, buildPort, buildCell,
  CellParts, buildHold, HoldParts, buildMill, buildCalcutta, iceMat, palm, crate, barrel, vegOrigin } from "./build";
import { ctex, snowHD, snowCobbleHD, beamHD, rep, cloudHD, waterNear, waterFar, sandHD, grassHD, stoneHD, towelTex, newspaperTex, calendarTex } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, LFB, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, HATCH, LANE_X1, OFF, at, brigAt, WATER_Y, PORT, meltAt, WALLET_OPEN, COIN_F, smooth, clamp01,
  BOTTLE, towelAt, sawdustAt, FLIPS, HATCH_OPEN, ICE_PATCH } from "./story";

// ---------------- assets ----------------
// Kenney CC0 kit (optional): public/bridge/kenney/<name>.glb; missing models are skipped (vegetation is drawn by build.ts)
const KENNEY: string[] = []; // not shipped in this repo: all vegetation and props are drawn by build.ts
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** every lens position of the street shots looking at its subject (fence posts / props there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) if (s.place === "street") for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private WU: Record<string, THREE.IUniform>;
  private brig: BrigParts; private plank: THREE.Object3D;
  private held: { ice: THREE.Mesh[]; paper: THREE.Mesh };
  private stack: THREE.Mesh[] = []; private puddles: THREE.Mesh[] = [];
  private wallet: { flap: THREE.Group; coin: THREE.Mesh };
  private cell: CellParts; private towel: THREE.Mesh;
  private hold: HoldParts; private calKey = "";
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light (template) ----
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
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); m.frustumCulled = false;
      this.clouds.push(m); R.add(m);
    }

    // ---- water (template river shader, one material for every harbour / sea) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "river1";
    const water = (pl: keyof typeof OFF, z0: number, z1: number, y: number) => {
      const m = new THREE.Mesh(quadUp(OFF[pl] - 900, OFF[pl] + 900, z0, z1, 1, 1, y), waterM); m.receiveShadow = true; R.add(m);
    };
    water("harbor", -900, 0, WATER_Y); water("port", -900, 0, WATER_Y); water("calcutta", -900, -3, WATER_Y); water("ocean", -900, 900, WATER_Y); water("beach", -900, -4.9, 0.03);

    // ---- grounds ----
    const g = new Batch();
    const snowM = lam("snowHD", () => ({ map: snowHD(), emissive: SNOW_GLOW, emissiveMap: snowHD() })), laneM = lam("snowCobbleHD", () => ({ map: snowCobbleHD(), emissive: SNOW_GLOW, emissiveMap: snowCobbleHD() }));
    const sandM = lam("sandGround", () => ({ map: rep(sandHD(), 1, 1) })), grassM = lam("grassGround", () => ({ map: grassHD() }));
    const ghatM = lam("ghatGround", () => ({ map: rep(stoneHD("ghatHD", ["#e0c8a0", "#d4ba92", "#e8d4b0", "#c9ad86"], "#8f7a5c"), 1, 1) }));
    const ground = (pl: keyof typeof OFF, z0: number, z1: number, m: THREE.Material, tile: number, dy = 0, hw = 300) =>
      g.add(quadUp(OFF[pl] - hw, OFF[pl] + hw, z0, z1, (2 * hw) / tile, (z1 - z0) / tile, dy), m);
    ground("street", -700, 700, snowM, 2, 0, 700);
    g.add(quadUp(-6, LANE_X1, -160, 60, (LANE_X1 + 6) / 4, 220 / 4, 0.01), laneM);
    ground("pond", -300, 300, snowM, 2); ground("harbor", 0, 300, laneM, 4); ground("beach", -6, 300, sandM, 3); ground("port", 0, 300, sandM, 3);
    ground("mill", -300, 300, grassM, 4); ground("calcutta", 0, 300, ghatM, 2.5);
    g.add(quadUp(OFF.mill - 16, OFF.mill + 16, -22, 6, 8, 7, 0.01), lam("millYard", () => ({ map: rep(sandHD(), 1, 1), color: "#c8a070" })));
    g.build(R);
    // the slippery ice patch on the lane (shot 9)
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32).rotateX(-Math.PI / 2).scale(1, 1, 0.6), iceMat());
    patch.position.set(ICE_PATCH[0], 0.02, ICE_PATCH[2]); R.add(patch);

    // ---- places ----
    vegOrigin(0, 0);
    buildStreet(R, kit, sightLines());
    this.streetDoor(R);
    this.cell = buildCell(R);
    buildPond(R, kit); this.plank = buildHarbor(R, kit); buildBeach(R); buildPort(R); buildMill(R, kit); buildCalcutta(R);
    this.hold = buildHold(R);
    this.hold.pageMat.map = calendarTex(0); this.hold.underMat.map = calendarTex(1); this.hold.pageMat.needsUpdate = this.hold.underMat.needsUpdate = true;
    this.brig = buildBrig(); R.add(this.brig.group);

    // ---- held things: ice blocks (beach, loading) and the newspaper ----
    const ice = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.3), iceMat()); m.castShadow = true; m.visible = false; R.add(m); return m; };
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshLambertMaterial({ map: newspaperTex(), side: THREE.DoubleSide }));
    twoTone(paper.material as THREE.MeshLambertMaterial); paper.visible = false; R.add(paper);
    this.held = { ice: [ice(), ice(), ice(), ice()], paper };
    // ---- the port stack (6 blocks) and its puddles ----
    const [sx, , sz] = PORT.stack;
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.46, 0.5).translate(0, 0.23, 0), iceMat());
      const l = i < 3 ? 0 : i < 5 ? 1 : 2, k = i < 3 ? i - 1 : i < 5 ? i - 3.5 : 0;
      m.position.set(sx + k * 0.53, l * 0.46, sz); m.userData.base = [sx + k * 0.53, l * 0.46, sz, l];
      m.castShadow = true; m.receiveShadow = true; R.add(m); this.stack.push(m);
    }
    const pudM = lam("puddle", () => ({ color: "#8fc4e0", emissive: new THREE.Color(0.18, 0.28, 0.38) }));
    for (const [dx, dz, s] of [[0, 0.1, 1], [0.7, 0.6, 0.6], [-0.8, 0.4, 0.7]] as const) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), pudM);
      m.position.set(sx + dx, 0.012 + 0.001 * s, sz + dz); m.userData.s = s; m.receiveShadow = true; R.add(m); this.puddles.push(m);
    }
    // ---- the wallet (open, empty) and the coin ----
    const leather = lam("wallet", () => ({ color: "#7a4a2a" })), [wx, , wz] = PORT.wallet;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.018, 0.11).translate(0, 0.009, 0), leather);
    base.position.set(wx, 0.004, wz); base.rotation.y = 0.35; R.add(base);
    const flap = new THREE.Group(), fm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.11).translate(0, 0.006, -0.055), leather);
    flap.add(fm); flap.position.set(0, 0.018, -0.055); base.add(flap);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.005, 24).rotateX(Math.PI / 2), twoTone(new THREE.MeshPhongMaterial({ color: "#d9b44a", specular: "#fff0b0", shininess: 80 }), 0.2));
    coin.castShadow = true; R.add(coin);
    this.wallet = { flap, coin };
    for (const o of [base, fm]) { o.castShadow = true; o.receiveShadow = true; }
    // ---- the cold bottle on the bench and the striped towel that wraps it ----
    const pts = [[0, 0], [0.042, 0], [0.045, 0.02], [0.045, 0.2], [0.03, 0.26], [0.016, 0.29], [0.016, 0.33], [0, 0.33]].map(([x, y]) => new THREE.Vector2(x, y));
    const bottle = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), twoTone(new THREE.MeshPhongMaterial({ color: "#4f8f6a", specular: "#e8fff0", shininess: 90 }), 0.25));
    bottle.position.set(...BOTTLE); bottle.castShadow = true; R.add(bottle);
    const tex = towelTex(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.towel = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.062, 0.22, 24, 1, true).translate(0, 0.11, 0), twoTone(new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })));
    this.towel.position.set(BOTTLE[0], BOTTLE[1] + 0.004, BOTTLE[2]); this.towel.castShadow = true; R.add(this.towel);

    // ---- near framing objects: built once, never passed through the sight-line filter, toggled per frame ----
    for (const fg of FOREGROUND) {
      const fb = new Batch(), grp = new THREE.Group();
      if (fg.kit === "fencepost") fencePost(fb, 0, 0, fg.s ?? 1, 0, true);
      else if (fg.kit === "crate") crate(fb, 0, 0, fg.s ?? 1);
      else if (fg.kit === "barrel") barrel(fb, 0, 0, fg.s ?? 1);
      else if (fg.kit === "palm") palm(fb, 0, 0, 0, fg.s ?? 7, 77);
      else { const o = kitClone(kit, fg.kit, fg.s ?? 1); if (o) grp.add(o); }
      fb.build(grp, true);
      grp.traverse((x) => { x.matrixAutoUpdate = true; });
      grp.position.set(...fg.pos); grp.rotation.y = fg.yaw ?? 0; grp.visible = false;
      this.fgs.push({ o: grp, a: fg.a, b: fg.b }); R.add(grp);
    }
  }

  /** CellarShort's bulkhead hatch door on the street, closed */
  private streetDoor(R: THREE.Object3D) {
    const { x0, x1, z0, z1, top } = HATCH, L = Math.hypot(x1 - x0, top), slope = Math.atan2(top, x1 - x0), door = new THREE.Group();
    const plank = lam("hatchPlank", () => ({ map: rep(beamHD(), 1, 1), color: "#9a6c48" }));
    door.add(new THREE.Mesh(new THREE.BoxGeometry(L + 0.04, 0.06, z1 - z0 + 0.02).translate((L + 0.04) / 2, 0.03, 0), plank));
    door.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.9, 0.05, (z1 - z0) * 0.86).translate(L * 0.5, 0.085, 0), lam("snowCap", () => ({ color: "#f3f0ec" }))));
    door.position.set(x0 + 0.02, D0 + top, (z0 + z1) / 2); door.rotation.set(0, 0, -slope);
    door.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(door);
    void ctex;
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    // near plane stays at the template 0.2 m: the lens blur linearizes depth with the near / far it copied at build time
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig (template): camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden" && s.place !== "cell" && s.place !== "hold") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden" && s.place !== "cell" && s.place !== "hold";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    const ox = OFF[s.place];
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial, a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      m.position.set(ox + Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- water colours (on-screen targets, tone-map-inverted) ----
    const WU = this.WU, wc = K.water;
    untone(wc.near, WU.wNearC.value); untone(wc.mid, WU.wMidC.value); untone(wc.far, WU.wFarC.value);
    untone(wc.crest, WU.wCrest.value); untone(wc.trough, WU.wTrough.value); untone(wc.glint, WU.wGlint.value);
    WU.wShade.value.set(...wc.shade); WU.wTime.value = t;
    // ---- foreground framing objects: inside their frames AND their own shot ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- the brig ----
    const bp = brigAt(id, f), bg = this.brig.group;
    bg.visible = bp.show; bg.position.set(...bp.pos); bg.rotation.set(bp.roll, bp.yaw, 0, "YXZ");
    this.brig.sail.color.set(bp.sail);
    this.plank.visible = id <= 5;
    const lk = id === 26 ? smooth((f - HATCH_OPEN[0]) / (HATCH_OPEN[1] - HATCH_OPEN[0])) : 0;
    this.brig.lid.position.set(0.4, 1.52 + 0.5 * Math.sin(Math.PI * Math.min(1, lk * 1.4)) * (1 - lk) - 0.27 * lk, -1.3 * lk);
    this.brig.lid.rotation.set(0.25 * Math.sin(Math.PI * lk), 0, 0);
    // ---- port: the stack melts into puddles ----
    const m = meltAt(id, f), inPort = s.place === "port";
    for (const b of this.stack) {
      const [bx, by, bz, l] = b.userData.base as number[], gone = l === 2 ? clamp01((m - 0.35) / 0.3) : l === 1 ? clamp01((m - 0.55) / 0.3) : 0;
      const k = Math.max(0.12, 1 - m * 0.75);
      b.visible = inPort && gone < 1;
      b.scale.set(0.75 + 0.25 * k, k * (1 - gone), 0.75 + 0.25 * k);
      b.position.set(bx, by * k * 0.92, bz);
    }
    for (const p of this.puddles) { const r = (0.35 + 2.1 * m) * (p.userData.s as number); p.visible = inPort && m > 0; p.scale.set(r, 1, r * 0.8); }
    // ---- wallet + coin (shot 12) ----
    const wo = smooth((f - WALLET_OPEN[0]) / (WALLET_OPEN[1] - WALLET_OPEN[0]));
    this.wallet.flap.rotation.x = -Math.PI * 0.92 * wo;
    const cu = Math.max(0, (f - COIN_F) / FPS), [wx, , wz] = PORT.wallet, dist2 = 0.55 * cu + 0.12 * cu * cu;
    this.wallet.coin.visible = inPort;
    this.wallet.coin.position.set(wx + 0.05 + dist2 * 0.94, 0.024 + (f < COIN_F ? 0.0 : 0.0), wz + 0.02 + dist2 * 0.34);
    this.wallet.coin.rotation.set(0, -0.35, -dist2 / 0.024 + 0.08 * Math.sin(cu * 9) * Math.min(1, cu));
    if (f < COIN_F) { this.wallet.coin.position.set(wx + 0.02, 0.022, wz - 0.01); this.wallet.coin.rotation.set(Math.PI / 2, 0, 0); }
    // ---- cell: icicles melt, the towel wraps the bottle ----
    const ik = id < 18 ? 1 : id === 18 ? 1 - 0.35 * smooth((f - 894) / 56) : 0.62;
    this.cell.icicles.forEach((ic, i) => { ic.scale.set(1, ik * (1 - 0.06 * i), 1); });
    const tw = id === 20 ? towelAt(f) : id === 21 ? 1 : 0;
    this.towel.visible = tw > 0.01; this.towel.scale.set(1, Math.max(0.01, tw), 1);
    (this.towel.material as THREE.MeshLambertMaterial).map!.offset.x = 0.25 * (1 - tw);
    // ---- hold: the sawdust fill rises; the calendar flips ----
    this.hold.sawdust.scale.y = s.place === "hold" ? (id === 22 ? sawdustAt(f) : 0.98) : 0.98;
    let n = 0, flip = 0;
    for (const fl of FLIPS) { if (f >= fl + 7) n++; else if (f >= fl) { flip = (f - fl) / 7; break; } }
    const ck = `${n}|${flip > 0}`;
    if (ck !== this.calKey) { this.hold.pageMat.map = calendarTex(n); this.hold.underMat.map = calendarTex(n + 1); this.calKey = ck; }
    this.hold.page.rotation.x = -Math.PI * 0.6 * smooth(flip);
    this.hold.page.position.y = 1.67 + 0.9 * smooth(flip) ** 1.4;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
    // held blocks / newspaper
    let hi = 0;
    this.held.paper.visible = false;
    for (const h of st.held) {
      if (h.kind === "paper") { const p = this.held.paper; p.visible = true; p.position.set(...h.pos); p.rotation.set(-0.08, h.yaw, 0.03 * Math.sin(f * 0.4), "YXZ"); continue; }
      const b = this.held.ice[hi++]; if (!b) continue;
      b.visible = true; b.position.set(h.pos[0], h.pos[1] - 0.02, h.pos[2]); b.rotation.set(0, h.yaw + 0.25, 0); b.scale.setScalar(h.s ?? 1);
    }
    for (let i = hi; i < this.held.ice.length; i++) this.held.ice[i].visible = false;
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.soft.blending = p.glow ? THREE.AdditiveBlending : THREE.NormalBlending;
      e.soft.color.setScalar(p.glow ?? 1); e.soft.toneMapped = !p.glow;
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);           // slow river along +x
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

/** horizontal quad facing up at height D0 + dy covering x0..x1, z0..z1 (z0 < z1) */
function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy, g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}

// The whole clip as one three.js scene: sky, the winter lane (three snowy townhouses, the bulkhead hatch, fence),
// the root cellar built far off at CX (frosted stone, crate of potatoes, lantern, window with falling snow), the steel
// bucket whose water freezes, and the cast. update(id, f, camera) poses everything for shot `id` at frame f (pure
// function of id + f). Sky, sun rig, two-tone uniforms, fog and card handling are the bridge template's, unchanged.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, V, lam, Kit, Ray, kitClone, buildStreet, buildCellar, fencePost, CellarParts, SNOW_GLOW, LANTERN } from "./build";
import { ctex, snowHD, snowCobbleHD, beamHD, rep, cloudHD } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage, WINDOW } from "./cast";
import { FPS, D0, SHOTS, camAt, V3, FOREGROUND, ShotDef, HATCH, hatchOpen, BUCKET, iceAt, frostAt, GLOW, smooth, LANE_X1, SETDOWN } from "./story";

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
/** every lens position of the street shot looking at its subject (houses / posts there are left out) */
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

/** the water surface in the bucket: dark water; ice crystals grow in from the rim (k 0..1), frosting over */
const ICE_N = 512;
const drawIce = (g: CanvasRenderingContext2D, k: number, warm: number, rip: number) => {
  const S = ICE_N, c = S / 2, R = S / 2;
  let seed = 7;
  const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const bg = g.createRadialGradient(c, c, 0, c, c, R);
  bg.addColorStop(0, "#3f7690"); bg.addColorStop(0.7, "#2e5e78"); bg.addColorStop(1, "#244a62");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  g.fillStyle = "rgba(255,255,255,0.10)"; g.beginPath(); g.ellipse(c - 70, c - 90, 120, 40, -0.5, 0, Math.PI * 2); g.fill(); // sheen
  if (rip > 0 && rip < 1) for (let j = 0; j < 3; j++) { // the bucket was just set down: rings run out to the rim
    const u = rip - j * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.strokeStyle = `rgba(215,236,250,${0.6 * (1 - u)})`; g.lineWidth = 7 * (1 - u) + 2; g.beginPath(); g.arc(c, c, 30 + (R - 34) * u, 0, Math.PI * 2); g.stroke();
  }
  if (k > 0) {
    // frost grows in from the rim as a ring, the centre stays dark open water until the end
    const rin = R * Math.max(0.0, 1 - 0.95 * k);
    const fr = g.createRadialGradient(c, c, rin, c, c, R);
    fr.addColorStop(0, "rgba(214,232,246,0)"); fr.addColorStop(Math.min(0.99, 0.25 + 0.2 * k), "rgba(214,232,246,0.38)"); fr.addColorStop(1, "rgba(236,246,255,0.75)");
    g.fillStyle = fr; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fill();
    g.lineCap = "round";
    const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      g.strokeStyle = depth ? "rgba(225,240,255,0.85)" : "rgba(245,251,255,0.98)"; g.lineWidth = w;
      g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
      if (depth < 1) for (let i = 1; i <= 4; i++) {
        const t = i / 5, bx = x + Math.cos(a) * len * t, by = y + Math.sin(a) * len * t, bl = len * (1 - t) * 0.55;
        for (const s of [-1, 1]) branch(bx, by, a + s * (Math.PI / 3), bl, w * 0.6, depth + 1);
      }
    };
    for (let i = 0; i < 34; i++) { // feathers of frost of random length from the rim (no even spokes)
      const a = r() * Math.PI * 2, L = R * (0.12 + 0.5 * r() ** 2) * Math.min(1, k * (1.1 + 0.3 * r()));
      if (L < 4) continue;
      branch(c + Math.cos(a) * R * 0.98, c + Math.sin(a) * R * 0.98, a + Math.PI + (r() - 0.5) * 0.9, L, 3.5 + 2 * r(), 0);
    }
  }
  if (warm > 0) { // the heat leaving the ice: a soft warm bloom in the middle
    const wg = g.createRadialGradient(c, c, 0, c, c, R * 0.8);
    wg.addColorStop(0, `rgba(255,200,130,${0.55 * warm})`); wg.addColorStop(1, "rgba(255,170,90,0)");
    g.fillStyle = wg; g.fillRect(0, 0, S, S);
  }
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
  private door = new THREE.Group();
  private bucket = new THREE.Group();
  private iceCv = document.createElement("canvas"); private iceTex: THREE.CanvasTexture; private iceKey = "";
  private cellar: CellarParts;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light ----
    // sky: 5 colour stops by elevation (textures.md 5.2 #5 + depth.md 2/6.5), written as tone-map-inverted linear values
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
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }


    // ---- the lane: snow ground, trodden snowy cobbles, houses / fence / trees (sight-line culled) ----
    const b = new Batch();
    const snowM = lam("snowHD", () => ({ map: snowHD(), emissive: SNOW_GLOW, emissiveMap: snowHD() })), laneM = lam("snowCobbleHD", () => ({ map: snowCobbleHD(), emissive: SNOW_GLOW, emissiveMap: snowCobbleHD() }));
    b.add(quadUp(-700, 700, -700, 700, 350, 350), snowM);
    b.add(quadUp(-6, LANE_X1, -160, 60, (LANE_X1 + 6) / 4, 220 / 4, 0.01), laneM);
    b.build(R);
    buildStreet(R, kit, sightLines());
    // the hatch door: planks + iron straps, hinged at the top edge against the wall, swung by hatchOpen(f)
    const { x0, x1, z0, z1, top } = HATCH, L = Math.hypot(x1 - x0, top), slope = Math.atan2(top, x1 - x0);
    const plank = lam("hatchPlank", () => ({ map: rep(beamHD(), 1, 1), color: "#9a6c48" })), iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(L + 0.04, 0.06, z1 - z0 + 0.02).translate((L + 0.04) / 2, 0.03, 0), plank);
    const snowLid = new THREE.Mesh(new THREE.BoxGeometry(L * 0.9, 0.05, (z1 - z0) * 0.86).translate(L * 0.5, 0.085, 0), lam("snowCap", () => ({ color: "#f3f0ec" })));
    this.door.add(slab, snowLid);
    for (const dz of [-0.45, 0.45]) this.door.add(new THREE.Mesh(new THREE.BoxGeometry(L * 0.7, 0.075, 0.07).translate(L * 0.35, 0.03, dz), iron));
    this.door.position.set(x0 + 0.02, D0 + top, (z0 + z1) / 2);
    this.door.userData.slope = slope;
    this.door.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(this.door);

    // ---- the root cellar (far off at CX) ----
    this.cellar = buildCellar(R, WINDOW);
    // lantern halo (additive, depth-tested): the practical light's glow in the air around it (verifier fix 7)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1.0, 0.62, 0.3).multiplyScalar(0.55), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.position.set(LANTERN[0], LANTERN[1], LANTERN[2]); halo.scale.setScalar(0.9); halo.layers.set(NOINK); R.add(halo);

    // ---- the steel bucket: tapered open drum, rolled rim, two ears, wire handle, water / ice surface ----
    const steel = twoTone(new THREE.MeshPhongMaterial({ color: "#a3a9b2", specular: "#d8dce2", shininess: 70, side: THREE.DoubleSide }), 0.15);
    const { r0, r1, h, water } = BUCKET;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 32, 1, true).translate(0, h / 2, 0), steel);
    const floorD = new THREE.Mesh(new THREE.CircleGeometry(r0, 32).rotateX(-Math.PI / 2).translate(0, 0.004, 0), steel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r1, 0.008, 8, 40).rotateX(Math.PI / 2).translate(0, h, 0), steel);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(r0 + (r1 - r0) * 0.3, 0.006, 6, 40).rotateX(Math.PI / 2).translate(0, h * 0.3, 0), steel);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(r1 + 0.01, 0.0045, 6, 32, Math.PI).translate(0, h - 0.035, 0), iron);
    for (const s of [-1, 1]) this.bucket.add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6).translate(s * (r1 + 0.004), h - 0.035, 0), iron));
    this.iceCv.width = this.iceCv.height = ICE_N;
    this.iceTex = new THREE.CanvasTexture(this.iceCv); this.iceTex.colorSpace = THREE.SRGBColorSpace; this.iceTex.anisotropy = 8;
    const rw = r0 + (r1 - r0) * (water / h);
    // unlit (as the template did for its painted sign): under the orange key the ice read as straw
    const surf = new THREE.Mesh(new THREE.CircleGeometry(rw, 48).rotateX(-Math.PI / 2).translate(0, water, 0), new THREE.MeshBasicMaterial({ map: this.iceTex, color: new THREE.Color(0.8, 0.82, 0.86) }));
    this.bucket.add(body, floorD, rim, hoop, handle, surf);
    this.bucket.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    R.add(this.bucket);

    // near framing objects: built once, never passed through the sight-line filter, toggled per frame
    for (const fg of FOREGROUND) {
      let o: THREE.Object3D | null;
      if (fg.kit === "fencepost") {
        const fb = new Batch(), grp = new THREE.Group();
        fencePost(fb, 0, 0, fg.s ?? 1, 0, true); fb.build(grp, false);
        grp.traverse((x) => { x.matrixAutoUpdate = true; });
        o = grp;
      } else o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
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
    const ss = s as ShotDef & { sunAz?: number; sunEl?: number };
    const az = THREE.MathUtils.degToRad(ss.sunAz ?? L.az), el = THREE.MathUtils.degToRad(ss.sunEl ?? L.el);
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
    // near plane stays at the template 0.2 m: the lens-blur effect linearizes depth with the near / far it copied from
    // the camera when the composer was built, so a different near here made it misread every cellar depth (all blurred)
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig (lighting.md 9.4): camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30); // el 7: 2 m cards throw ~16 m shadows, houses much longer
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0; // not used by the two-tone shading
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog (colour = horizon colour, linear fogNear -> fogFar), sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- foreground framing objects: inside their frames AND their own shot ----
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- hatch door: slope angle (closed) -> 105 deg up against the wall (open) ----
    this.door.rotation.set(0, 0, -(this.door.userData.slope as number) + hatchOpen(f) * (Math.PI * 105) / 180);
    // ---- ice + frost ----
    const k = Math.round(iceAt(f) * 40) / 40, warm = Math.round(smooth((f - GLOW.f0 + 2) / 10) * 20) / 20;
    const rip = f >= SETDOWN.land && f < SETDOWN.land + 26 ? (f - SETDOWN.land + 1) / 26 : 0, key = `${k}|${warm}|${rip}`;
    if (key !== this.iceKey) { drawIce(this.iceCv.getContext("2d")!, k, warm, rip); this.iceTex.needsUpdate = true; this.iceKey = key; }
    this.cellar.frostNear.opacity = frostAt(f); this.cellar.frostFar.opacity = 0.45 + 0.55 * frostAt(f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
    this.bucket.position.set(...st.bucket.pos); this.bucket.rotation.set(0, st.bucket.yaw, 0);
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
      if (a.mat.emissiveMap) a.mat.emissive.set(tint); // legacy emissive card until the CHAR agent's cardShade lands
      a.mesh.castShadow = L.actorShadow; // day: soft contact blobs instead (CHAR agent)
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
      // heat wisps: additive HDR glow (blooms); everything else keeps the template's plain soft / cut-out cards
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

/** horizontal quad facing up at height D0 + dy covering x0..x1, z0..z1 (z0 < z1) */
function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy, g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}

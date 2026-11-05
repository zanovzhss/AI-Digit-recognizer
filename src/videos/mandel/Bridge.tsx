// "The Man Who Won the Lottery 14 Times": ~54 s short, flat characters in a 3D toon world (IceShort post chain: focus, lens, ink), with captions.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, FLASH_AT, SHOTS, layersAt, dofAt, camAt, FPS } from "./story";
import { CAPTIONS } from "./captions";
import { MotionBlurEffect } from "./motionblur";

export const MANDEL_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean; mblur: boolean };
/** camera shutter as a fraction of a frame (180 degrees): the motion blur gathers along the path of the last half frame */
const SHUTTER = 0.5;
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, mblur: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const prevCam = new THREE.PerspectiveCamera();
const tp = new THREE.Vector3();
/** how far (px at 1080 wide) the point on the view axis at distance d moves on screen between prev and cur */
const screenTravel = (cur: THREE.PerspectiveCamera, prev: THREE.PerspectiveCamera, d: number) => {
  tp.set(0, 0, -d).applyMatrix4(cur.matrixWorld).project(prev);
  return tp.z >= 1 ? 1000 : Math.hypot(tp.x * 540, tp.y * 960);
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("mandel kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  // GPU check: log the real WebGL renderer once (must be the RTX via ANGLE / Direct3D 11, never SwiftShader)
  useEffect(() => {
    const c = gl.getContext(), ext = c.getExtension("WEBGL_debug_renderer_info");
    console.log("MANDEL_GL_RENDERER", ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER));
  }, [gl]);
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 14, nearScale: 0.35 }), // background blur; near foreground only gently
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    mblur: new MotionBlurEffect(100),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); }, [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {[
        on.ink ? <primitive key="ink" object={fx.ink} dispose={null} /> : null,
        on.lens && on.pre ? <primitive key="pre" object={fx.lens.pre} dispose={null} /> : null,
        on.lens ? <primitive key="lens" object={fx.lens.main} dispose={null} /> : null,
        on.mblur ? <primitive key="mblur" object={fx.mblur} dispose={null} /> : null,
        on.bloom ? <primitive key="bloom" object={fx.bloom} dispose={null} /> : null,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        on.grade ? <primitive key="grade" object={fx.grade} dispose={null} /> : null,
        on.grain ? <primitive key="grain" object={fx.grain} dispose={null} /> : null,
      ].filter((e): e is JSX.Element => e !== null)}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  // motion blur: the same shot's camera half a frame earlier (pure function of id + f, also across hidden switches)
  const pc = camAt(id, f - SHUTTER);
  prevCam.position.set(...pc.pos); prevCam.up.set(0, 1, 0); prevCam.lookAt(...pc.look); prevCam.rotateZ(pc.roll);
  prevCam.fov = pc.fov; prevCam.aspect = cam.aspect; prevCam.near = cam.near; prevCam.far = cam.far;
  prevCam.updateProjectionMatrix(); prevCam.updateMatrixWorld();
  fx.mblur.setCameras(cam.matrixWorld, cam.projectionMatrix, prevCam.projectionMatrix, prevCam.matrixWorldInverse);
  // streak only on fast moves (rule 2: motion blur only above 40 px/frame): the travel over the half-frame shutter of a
  // point at the focus distance and of a far point (px at 1080 wide); none below 20 px per half frame (= 40 px/f),
  // full from 60 (= 120 px/f, whips)
  fx.mblur.depth = fx.lens.focus;
  fx.mblur.amount = THREE.MathUtils.smoothstep(Math.max(screenTravel(cam, prevCam, fx.lens.focus), screenTravel(cam, prevCam, 400)), 20, 60);
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** Captions (this video has them): one word at a time (2-3 only for very short words), hard swap on each word, synced to
 *  words.json via captions.ts. White, bold clean sans (Segoe UI Black: the system's nearest to Montserrat ExtraBold),
 *  thin black outline ~4 px at 1080 wide, no box, ~5.5 % of the frame height, centred at 60 % down (clear of the top
 *  12 % and the bottom 20 %). Sized in % of the frame so the 2K export matches. */
const Caption: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS, c = CAPTIONS.find(([s, e]) => t >= s && t < e);
  if (!c) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "5%", right: "5%", top: "60%", transform: "translateY(-50%)", textAlign: "center",
        fontFamily: "'Segoe UI Black', 'Montserrat', 'Arial Black', sans-serif", fontWeight: 900, fontSize: "5.5vh", lineHeight: 1.05, color: "#ffffff",
        WebkitTextStroke: "0.42vh #000000", paintOrder: "stroke fill", letterSpacing: "0.01em" }}>
        {c[2]}
      </div>
    </AbsoluteFill>
  );
};

export const MandelShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = FLASH_AT !== null && f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  return (
    <AbsoluteFill style={{ background: "#120e16" }}>
      {layersAt(f).map((l, i) => <ShotView key={SHOTS[l.id - 1].place} id={l.id} kit={kit} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Caption f={f} />
    </AbsoluteFill>
  );
};

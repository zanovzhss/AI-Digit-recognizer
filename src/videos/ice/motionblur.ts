// Camera motion blur for the fast moves only (whips, fly-throughs, passes): every pixel is reprojected into the
// camera of half a frame earlier, assuming it sits at the subject's focus distance, and the colour is gathered along
// that screen-space path. No depth read: in this composer chain a second depth-reading effect after the lens blur got
// a stale depth texture and smeared in-focus subjects with the whole camera rotation. At the focus distance the
// subject itself reprojects exactly; during whips (pure rotation) every depth does. `amount` scales the streak with
// the camera's own speed (Bridge.tsx): zero on glides, orbits and holds, full on whips and flights.
// Pixel lengths are specified at 1080x1920 and scale with the output height, like the other post parameters.
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Matrix4, Vector2 } from "three";

const frag = /* glsl */ `
uniform mat4 mbViewInv;    // current camera matrixWorld
uniform mat4 mbPrevVP;     // previous projection * previous view
uniform vec2 mbProj;       // current projection [0][0], [1][1]
uniform float mbDepth;     // assumed view distance of every pixel (the focus distance)
uniform float mbMaxPx;     // longest streak (px at 1080x1920)
uniform float mbAmount;    // 0 = off .. 1 = full streak

float mbHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (mbAmount < 0.01) { outputColor = inputColor; return; }
  float vz = -mbDepth;
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 view = vec4(ndc.x * -vz / mbProj.x, ndc.y * -vz / mbProj.y, vz, 1.0);
  vec4 clip = mbPrevVP * (mbViewInv * view);
  vec2 prev = clip.w > 0.0 ? clip.xy / clip.w * 0.5 + 0.5 : uv;
  vec2 px = vec2(1080.0, 1920.0);
  vec2 v = (uv - prev) * px * mbAmount;         // streak in 1080x1920 px
  float L = length(v);
  if (L < 0.75) { outputColor = inputColor; return; }
  if (L > mbMaxPx) v *= mbMaxPx / L;
  vec2 dv = v / px;
  const int N = 24;
  float j = mbHash(uv * 1931.0) - 0.5;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < N; i++) {
    float t = (float(i) + 0.5 + j) / float(N) - 0.5;
    acc += texture2D(inputBuffer, clamp(uv - dv * t, vec2(0.0005), vec2(0.9995))).rgb;
  }
  outputColor = vec4(acc / float(N), inputColor.a);
}`;

export class MotionBlurEffect extends Effect {
  constructor(maxPx = 100) {
    super("MotionBlurEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["mbViewInv", new Uniform(new Matrix4())], ["mbPrevVP", new Uniform(new Matrix4())],
        ["mbProj", new Uniform(new Vector2(1, 1))], ["mbDepth", new Uniform(5)], ["mbMaxPx", new Uniform(maxPx)], ["mbAmount", new Uniform(0)],
      ]),
    });
  }
  /** cur: the camera of this frame; prevProj / prevView: the camera at the start of the shutter interval */
  setCameras(curWorld: Matrix4, curProj: Matrix4, prevProj: Matrix4, prevViewInverse: Matrix4) {
    const u = this.uniforms;
    (u.get("mbViewInv")!.value as Matrix4).copy(curWorld);
    (u.get("mbPrevVP")!.value as Matrix4).multiplyMatrices(prevProj, prevViewInverse);
    (u.get("mbProj")!.value as Vector2).set(curProj.elements[0], curProj.elements[5]);
  }
  set depth(v: number) { this.uniforms.get("mbDepth")!.value = v; }
  set amount(v: number) { this.uniforms.get("mbAmount")!.value = v; }
}

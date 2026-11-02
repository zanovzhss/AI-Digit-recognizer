// Camera motion blur for the fly-through transitions and the always-moving camera: every pixel is reprojected from
// its depth into the camera of a moment earlier (the shutter interval), and the colour is gathered along that
// screen-space path. The world is static apart from the cast, so camera reprojection gives the right streaks for
// whips (rotation: depth-independent), fly-throughs (translation: near things smear more) and orbits. Deterministic:
// the previous camera comes from camAt(id, f - shutter), a pure function of the shot and frame.
// Pixel lengths are specified at 1080x1920 and scale with the output height, like the other post parameters.
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Matrix4, Vector2 } from "three";

const frag = /* glsl */ `
uniform mat4 mbViewInv;    // current camera matrixWorld
uniform mat4 mbPrevVP;     // previous projection * previous view
uniform vec2 mbProj;       // current projection [0][0], [1][1]
uniform float mbMaxPx;     // longest streak (px at 1080x1920)
uniform float mbOn;        // 0 = bypass

float mbHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (mbOn < 0.5) { outputColor = inputColor; return; }
  float vz = getViewZ(depth);
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 view = vec4(ndc.x * -vz / mbProj.x, ndc.y * -vz / mbProj.y, vz, 1.0);
  vec4 clip = mbPrevVP * (mbViewInv * view);
  vec2 prev = clip.w > 0.0 ? clip.xy / clip.w * 0.5 + 0.5 : uv;
  vec2 px = vec2(1080.0, 1920.0);
  vec2 v = (uv - prev) * px;                    // streak in 1080x1920 px
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
  constructor(maxPx = 220) {
    super("MotionBlurEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["mbViewInv", new Uniform(new Matrix4())], ["mbPrevVP", new Uniform(new Matrix4())],
        ["mbProj", new Uniform(new Vector2(1, 1))], ["mbMaxPx", new Uniform(maxPx)], ["mbOn", new Uniform(1)],
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
  set on(v: boolean) { this.uniforms.get("mbOn")!.value = v ? 1 : 0; }
}

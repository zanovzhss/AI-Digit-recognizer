// Toon water for the stone short: one material family on top of the world's two-tone light (shade.ts twoTone), so the
// sea, the floods and the waves take the same key, shade and fog as everything else.
//   level     - the water surface height (the flood in the valley climbs and stops by raising it)
//   swell     - a long dark ridge far out at sea that rises and rolls in (1896)
//   front     - the 2011 wave in the town: a raised sea behind a foaming crest that sweeps inland over the rooftops
//   ground    - the valley height texture (terrain.ts): water depth = surface - ground, a foam band where it is shallow
//   flow      - foam streaks running inland (water rushing between houses / up the valley)
//   rings     - the map view: quake ripples offshore and a white wave line heading for the coast
// Geometry is a flat grid at y = 0 in world xz (meshes are only translated); the vertex shader displaces it and rebuilds
// the normal from the height function, so the ink pass draws the crest silhouettes and the waterline creases.
import * as THREE from "three";
import { twoTone } from "./shade";

export type WaterU = {
  uTime: { value: number }; uLevel: { value: number }; uChop: { value: number };
  uSwellH: { value: number }; uSwellZ: { value: number }; uSwellW: { value: number };
  uFrontOn: { value: number }; uFrontZ: { value: number }; uFrontH: { value: number };
  uGround: { value: THREE.Texture | null }; uGroundO: { value: THREE.Vector2 }; uGroundS: { value: THREE.Vector2 }; uHasGround: { value: number };
  uFoamW: { value: number }; uFlow: { value: number }; uFlowDir: { value: THREE.Vector2 };
  uNear: { value: THREE.Color }; uFar: { value: THREE.Color }; uDeep: { value: THREE.Color }; uFoam: { value: THREE.Color };
  uRingC: { value: THREE.Vector2 }; uRingR: { value: number }; uMapFront: { value: number }; uOrigin: { value: THREE.Vector2 };
};
export const waterUniforms = (): WaterU => ({
  uTime: { value: 0 }, uLevel: { value: 0 }, uChop: { value: 1 },
  uSwellH: { value: 0 }, uSwellZ: { value: 1e5 }, uSwellW: { value: 38 },
  uFrontOn: { value: 0 }, uFrontZ: { value: 1e5 }, uFrontH: { value: 9 },
  uGround: { value: null }, uGroundO: { value: new THREE.Vector2() }, uGroundS: { value: new THREE.Vector2(1, 1) }, uHasGround: { value: 0 },
  uFoamW: { value: 0.6 }, uFlow: { value: 0 }, uFlowDir: { value: new THREE.Vector2(0, -1) },
  uNear: { value: new THREE.Color("#2f6f86") }, uFar: { value: new THREE.Color("#8fb6cc") }, uDeep: { value: new THREE.Color("#1e4c66") }, uFoam: { value: new THREE.Color("#ffffff") },
  uRingC: { value: new THREE.Vector2(0, 1e5) }, uRingR: { value: 0 }, uMapFront: { value: 1e5 }, uOrigin: { value: new THREE.Vector2() },
});

const DECL = /* glsl */ `
uniform float uTime, uLevel, uChop, uSwellH, uSwellZ, uSwellW, uFrontOn, uFrontZ, uFrontH;
uniform vec2 uOrigin;
float wHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
float wNoise( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( wHash( i ), wHash( i + vec2( 1, 0 ) ), f.x ), mix( wHash( i + vec2( 0, 1 ) ), wHash( i + vec2( 1, 1 ) ), f.x ), f.y );
}
/** surface height above the mesh base at world xz; crest = 0..1 how much of a breaking crest this point is */
float waterH( vec2 p, out float crest ) {
  vec2 q = p - uOrigin;
  float h = uLevel + uChop * ( 0.09 * sin( q.x * 0.21 + uTime * 1.3 ) + 0.07 * sin( q.y * 0.17 - uTime * 1.1 + q.x * 0.05 ) );
  float dz = ( q.y - uSwellZ ) / uSwellW;
  float sw = exp( -dz * dz ) * ( 1.0 + 0.12 * sin( q.x * 0.018 + 1.3 ) );
  h += uSwellH * sw;
  crest = smoothstep( 0.55, 0.95, sw ) * smoothstep( 4.0, 10.0, uSwellH ) * step( q.y, uSwellZ + 6.0 );
  if ( uFrontOn > 0.5 ) {
    float s = q.y - uFrontZ;                                   // < 0 ahead of the front (dry land), > 0 behind it
    float k = 1.0 / ( 1.0 + exp( -s / 1.7 ) );
    float bump = exp( -pow( ( s - 4.5 ) / 5.5, 2.0 ) );
    h += mix( -16.0, uFrontH * ( 1.0 + 0.5 * bump ), k ) + 0.9 * sin( q.x * 0.07 + uTime * 2.2 ) * k;
    crest = max( crest, bump * k );
  }
  return h;
}
varying vec3 vWPos; varying float vCrest;
`;
const VERT_BEGIN = /* glsl */ `
vec4 wp0 = modelMatrix * vec4( position, 1.0 );
float cr0;
float hh0 = waterH( wp0.xz, cr0 );
vec3 transformed = vec3( position.x, position.y + hh0, position.z );
vCrest = cr0;
vWPos = vec3( wp0.x, wp0.y + hh0, wp0.z );
`;
const VERT_NORMAL = /* glsl */ `
vec4 wpN = modelMatrix * vec4( position, 1.0 );
float crN;
float hxa = waterH( wpN.xz + vec2( 0.8, 0.0 ), crN ), hxb = waterH( wpN.xz - vec2( 0.8, 0.0 ), crN );
float hza = waterH( wpN.xz + vec2( 0.0, 0.8 ), crN ), hzb = waterH( wpN.xz - vec2( 0.0, 0.8 ), crN );
vec3 objectNormal = normalize( vec3( hxb - hxa, 1.6, hzb - hza ) );
#ifdef USE_TANGENT
vec3 objectTangent = vec3( 1.0, 0.0, 0.0 );
#endif
`;
const FRAG_DECL = /* glsl */ `
uniform float uTime, uHasGround, uFoamW, uFlow, uRingR, uMapFront;
uniform sampler2D uGround; uniform vec2 uGroundO, uGroundS, uFlowDir, uRingC, uOrigin;
uniform vec3 uNear, uFar, uDeep, uFoam;
varying vec3 vWPos; varying float vCrest;
float fHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
float fNoise( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( fHash( i ), fHash( i + vec2( 1, 0 ) ), f.x ), mix( fHash( i + vec2( 0, 1 ) ), fHash( i + vec2( 1, 1 ) ), f.x ), f.y );
}
`;
const FRAG_COLOR = /* glsl */ `
{
  vec2 q = vWPos.xz - uOrigin;
  float dist = length( vWPos - cameraPosition );
  vec3 col = mix( uNear, uFar, smoothstep( 60.0, 900.0, dist ) );
  // painted crest marks drifting on the open water (short dashes, fewer far away)
  float m = fNoise( vec2( q.x * 0.09 + uTime * 0.05, q.y * 0.32 - uTime * 0.12 ) );
  col = mix( col, mix( col, uFoam, 0.55 ), smoothstep( 0.8, 0.88, m ) * ( 1.0 - smoothstep( 150.0, 500.0, dist ) ) );
  col = mix( col, uDeep, 0.35 * smoothstep( 0.2, 0.0, m ) );
  float foam = 0.0;
  if ( uHasGround > 0.5 ) {                       // shoreline / flood edge: foam where the water is shallow
    float g = texture2D( uGround, ( q - uGroundO ) / uGroundS ).r;
    float depth = vWPos.y - g;
    float edge = fNoise( q * 0.35 + vec2( uTime * 0.6, -uTime * 0.4 ) );
    foam = max( foam, 1.0 - smoothstep( 0.0, uFoamW * ( 0.6 + 0.8 * edge ), depth ) );
    col = mix( col, mix( col, uFoam, 0.25 ), 1.0 - smoothstep( 0.0, uFoamW * 4.0, depth ) );
  }
  if ( uFlow > 0.0 ) {                            // foam streaks running with the water
    vec2 d = normalize( uFlowDir ), n2 = vec2( -d.y, d.x );
    float a = dot( q, d ), b = dot( q, n2 );
    float s1 = fNoise( vec2( b * 0.22, a * 0.05 - uTime * 1.6 * uFlow ) ), s2 = fNoise( vec2( b * 0.5 + 7.0, a * 0.11 - uTime * 2.3 * uFlow ) );
    foam = max( foam, smoothstep( 0.62, 0.8, s1 ) * 0.85 + smoothstep( 0.72, 0.86, s2 ) * 0.6 );
  }
  foam = max( foam, vCrest * ( 0.75 + 0.25 * fNoise( q * 0.6 + uTime ) ) );
  if ( uRingR > 0.0 ) {                           // map: quake ripples (rings behind a leading ring)
    float rd = length( q - uRingC );
    float band = 1.0 - smoothstep( 0.0, 3.5, abs( fract( ( uRingR - rd ) / 70.0 ) * 70.0 - 2.0 ) );
    foam = max( foam, band * step( rd, uRingR ) * ( 1.0 - smoothstep( 300.0, 900.0, rd ) ) * 0.9 );
  }
  if ( uMapFront < 9e4 ) {                        // map: the wave line heading for the coast
    float fd = q.y - uMapFront;
    foam = max( foam, ( 1.0 - smoothstep( 0.0, 5.0, abs( fd ) ) ) + 0.35 * smoothstep( 0.0, 3.0, fd ) * ( 1.0 - smoothstep( 3.0, 60.0, fd ) ) );
  }
  diffuseColor.rgb = mix( col, uFoam, clamp( foam, 0.0, 1.0 ) );
}
`;

let n = 0;
/** a water material: two-tone lit, displaced, with its own uniforms (one per water body) */
export const waterMaterial = (u: WaterU, key: string) => {
  const m = twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff" }));
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\n" + DECL)
      .replace("#include <beginnormal_vertex>", VERT_NORMAL)
      .replace("#include <begin_vertex>", VERT_BEGIN);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + FRAG_DECL)
      .replace("#include <map_fragment>", "#include <map_fragment>\n" + FRAG_COLOR);
  };
  const ck = "water_" + key + "_" + n++;
  m.customProgramCacheKey = () => ck;
  return m;
};

/** the same displaced surface for the ink pass: view-space normals (ink.ts TWIN_LAYER / inkTwins) */
export const waterInkMaterial = (u: WaterU) => new THREE.ShaderMaterial({
  uniforms: u as unknown as Record<string, THREE.IUniform>, side: THREE.DoubleSide,
  vertexShader: DECL + /* glsl */ `
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4( position, 1.0 );
  float c0, c1;
  float h = waterH( wp.xz, c0 );
  float hxa = waterH( wp.xz + vec2( 0.8, 0.0 ), c1 ), hxb = waterH( wp.xz - vec2( 0.8, 0.0 ), c1 );
  float hza = waterH( wp.xz + vec2( 0.0, 0.8 ), c1 ), hzb = waterH( wp.xz - vec2( 0.0, 0.8 ), c1 );
  vN = normalize( normalMatrix * normalize( vec3( hxb - hxa, 1.6, hzb - hza ) ) );
  vCrest = c0; vWPos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position.x, position.y + h, position.z, 1.0 );
}`,
  fragmentShader: /* glsl */ `
varying vec3 vN;
void main() { gl_FragColor = vec4( normalize( vN ) * ( gl_FrontFacing ? 1.0 : -1.0 ), 1.0 ); }`,
});

/** a flat grid in world xz (x0..x1, z0..z1) with segment sizes sx, sz, at y = 0 */
export const waterGrid = (x0: number, x1: number, z0: number, z1: number, sx: number, sz: number) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.max(1, Math.round((x1 - x0) / sx)), Math.max(1, Math.round((z1 - z0) / sz)));
  g.rotateX(-Math.PI / 2);
  g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  return g;
};

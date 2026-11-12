// Light presets for the stone short (research/ricks/STYLE_REFERENCE.md section 4 + the brief's light arc):
// golden hour -> stormy grey-blue dusk -> lantern-warm night -> bright day -> dawn -> grey interior / grey -> dark grey ->
// warm sunset. The "sun" is the one shadow-casting key, CAMERA-RELATIVE and frozen per shot (world.ts): az = degrees
// from the shot camera's forward axis (0 = backlight, +90 = screen right, 180 = behind the camera), el = elevation.
// lit/shade/lift are LINEAR RGB multipliers for shade.ts. Practical lamps (point lights with pools) come per set.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cardshade.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string;
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;
  bias: number; normalBias: number;
  /** practical lamps: intensity multiplier for the set's point lights (0 = off) */
  practical: number;
  /** self-lit windows (oil lamps / room lights) brightness, 0 = dark */
  windows: number;
};
export type LightName = "golden" | "storm" | "lantern" | "day" | "dawn" | "room" | "grey" | "dark" | "sunset";
const base = {
  lambert: 0.35, sideK: 0.84, term: 0.18, charGrad: 0.08, bodyGrad: 0.22, bias: -0.0004, normalBias: 0.02, actorShadow: true,
  skyCurve: [0.0, 0.5, 0.6] as C3, sunDisc: "#000000",
};
export const LIGHTS: Record<LightName, LightPreset> = {
  // golden hour over the bay: low warm sun from the sea side, plum shade (#4e2e39 on screen), peach horizon
  golden: {
    ...base, az: 8, el: 9,
    lit: [1.6, 1.3, 0.98], shade: [0.27, 0.2, 0.25], lift: [0.05, 0.035, 0.05], term: 0.14,
    charTint: [1.0, 0.9, 0.78], charShade: 0.86, charGrad: 0.1, bodyGrad: 0.26, sideTint: [0.9, 0.84, 0.9],
    blob: [0.75, 0.68, 0.76], top: "#97746c", hor: "#ffd08a", fog: "#f2b98e", fogNear: 70, fogFar: 1100, sunDisc: "#ffcf9e",
    sunCol: "#ffb36b", sunI: 4.2, sky: "#e8b8a8", ground: "#8a6a60", hemiI: 0.5, practical: 0.6, windows: 0.5,
  },
  // stormy grey-blue dusk (1896 / 1933): no hard sun, a low cool key from the sea, slate shade; the village's oil lamps
  storm: {
    ...base, az: -20, el: 18,
    lit: [0.74, 0.8, 0.95], shade: [0.2, 0.21, 0.28], lift: [0.03, 0.035, 0.06], term: 0.45, lambert: 0.5,
    charTint: [0.86, 0.9, 1.0], charShade: 0.84, charGrad: 0.06, bodyGrad: 0.18, sideTint: [0.82, 0.86, 0.96],
    blob: [0.55, 0.56, 0.66], actorShadow: false, top: "#3f4a63", hor: "#8b96a8", fog: "#7d889b", fogNear: 60, fogFar: 760,
    sunCol: "#c8d4ec", sunI: 1.5, sky: "#9aa6c0", ground: "#4a4c58", hemiI: 0.45, practical: 1.0, windows: 1.0,
  },
  // lantern night (the carving, the haul): a cool moon key, deep indigo shade (#161328), warm paper lanterns with pools
  lantern: {
    ...base, az: -60, el: 30,
    lit: [0.5, 0.58, 0.95], shade: [0.08, 0.075, 0.16], lift: [0.02, 0.02, 0.06], lambert: 0.4, sideK: 0.8, term: 0.15,
    charTint: [1.0, 0.84, 0.66], charShade: 0.8, charGrad: 0.14, bodyGrad: 0.3, sideTint: [0.72, 0.74, 0.96],
    blob: [0.5, 0.45, 0.6], top: "#262640", hor: "#46507a", fog: "#1d2240", fogNear: 40, fogFar: 520,
    sunCol: "#9fb4ff", sunI: 1.2, sky: "#2a3060", ground: "#1a1820", hemiI: 0.2, practical: 1.0, windows: 1.2,
  },
  // bright day (the town): high side sun, near-neutral warm grey shade (#504b4d), never blue-violet
  day: {
    ...base, az: 75, el: 56,
    lit: [1.62, 1.54, 1.38], shade: [0.3, 0.28, 0.31], lift: [0.05, 0.05, 0.07], term: 0.2,
    charTint: [1.0, 0.96, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.94, 0.92, 0.94],
    blob: [0.62, 0.58, 0.58], actorShadow: false, top: "#6f9bd0", hor: "#c9dcef", fog: "#c9dcef", fogNear: 80, fogFar: 1300,
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55, practical: 0, windows: 0,
  },
  // dawn (the fishermen walk down): a low pink-gold sun from the sea, soft cool shade, peach-pink horizon
  dawn: {
    ...base, az: 30, el: 12,
    lit: [1.42, 1.24, 1.08], shade: [0.31, 0.28, 0.31], lift: [0.04, 0.04, 0.06], term: 0.2,
    charTint: [1.0, 0.92, 0.86], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.9, 0.88, 0.95],
    blob: [0.62, 0.58, 0.66], top: "#7d8fb8", hor: "#f4c8a8", fog: "#e6c2b0", fogNear: 70, fogFar: 1100, sunDisc: "#ffe0c0",
    sunCol: "#ffd2a8", sunI: 3.0, sky: "#e8d0d8", ground: "#8a7a70", hemiI: 0.5, practical: 0.3, windows: 0.45,
  },
  // the 2011 living room: grey daylight from the window, a warm lamp, shade #3c354a
  room: {
    ...base, az: 55, el: 35,
    lit: [1.3, 1.3, 1.3], shade: [0.25, 0.24, 0.3], lift: [0.04, 0.035, 0.06], term: 0.3, lambert: 0.45,
    charTint: [0.98, 0.95, 0.94], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.9, 0.9, 0.96],
    blob: [0.62, 0.58, 0.62], top: "#9aa2ac", hor: "#c4c8cc", fog: "#9aa0a8", fogNear: 40, fogFar: 400,
    sunCol: "#e8eef6", sunI: 2.2, sky: "#d8dce4", ground: "#8a8078", hemiI: 0.5, practical: 1.0, windows: 0.8,
  },
  // grey afternoon (the map): overcast, flat, low saturation
  grey: {
    ...base, az: 40, el: 50,
    lit: [1.24, 1.26, 1.3], shade: [0.3, 0.3, 0.34], lift: [0.05, 0.05, 0.07], term: 0.5, lambert: 0.5,
    charTint: [0.96, 0.96, 0.98], charShade: 0.86, charGrad: 0.06, bodyGrad: 0.18, sideTint: [0.9, 0.9, 0.94],
    blob: [0.6, 0.6, 0.64], actorShadow: false, top: "#8a929e", hor: "#b8bec6", fog: "#aab0b8", fogNear: 120, fogFar: 1400,
    sunCol: "#eef2f6", sunI: 2.0, sky: "#d0d4da", ground: "#7a7874", hemiI: 0.55, practical: 0, windows: 0.3,
  },
  // grey turning dark (the wave): heavy overcast, dim slate key, darker shade; nothing warm but house windows
  dark: {
    ...base, az: -30, el: 30,
    lit: [0.86, 0.9, 1.0], shade: [0.2, 0.21, 0.26], lift: [0.03, 0.035, 0.05], term: 0.45, lambert: 0.5,
    charTint: [0.88, 0.9, 0.98], charShade: 0.84, charGrad: 0.06, bodyGrad: 0.18, sideTint: [0.84, 0.86, 0.94],
    blob: [0.55, 0.56, 0.62], actorShadow: false, top: "#4a5262", hor: "#8e96a2", fog: "#7c8490", fogNear: 70, fogFar: 900,
    sunCol: "#d4dcea", sunI: 1.6, sky: "#a4acba", ground: "#4a4c52", hemiI: 0.45, practical: 0.6, windows: 0.6,
  },
  // warm sunset (the end): the low sun behind the lens on the houses, plum shade, peach sky, lit windows
  sunset: {
    ...base, az: 175, el: 10,
    lit: [1.62, 1.28, 0.95], shade: [0.44, 0.31, 0.33], lift: [0.06, 0.04, 0.05], term: 0.14,
    charTint: [1.0, 0.88, 0.76], charShade: 0.86, charGrad: 0.1, bodyGrad: 0.26, sideTint: [0.9, 0.84, 0.9],
    blob: [0.75, 0.68, 0.76], top: "#8a6e86", hor: "#ffc98a", fog: "#e8b08e", fogNear: 70, fogFar: 1000, sunDisc: "#ffcf9e",
    sunCol: "#ffb066", sunI: 4.4, sky: "#e8b0a8", ground: "#8a6a60", hemiI: 0.5, practical: 0.8, windows: 0.9,
  },
};

/** world-only look per light (sky stops by elevation in degrees, sea colours, cloud palette, bounce, albedo saturation).
 *  All colours are ON-SCREEN targets under the PBR-Neutral tone map; world.ts pre-inverts them (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };
  sea: { near: string; far: string; foam: string; deep: string };
  bounce: C3;
  sat: number;
  cloud: { lit: string; mid: string; shade: string };
  /** cloud cover 0..1 (number and size of cloud cards), birds in the sky */
  clouds: number; birds: boolean; stars: boolean;
};
export const LOOK: Record<LightName, WorldLook> = {
  golden: {
    sky: { c: ["#ffd496", "#f8c08a", "#e8a88a", "#b89490", "#8e8090"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#5a7e8a", far: "#e8b894", foam: "#fff0dc", deep: "#36566a" }, cloud: { lit: "#ffd8b0", mid: "#f0aa94", shade: "#a894b4" },
    bounce: [0.05, 0.025, 0.0], sat: 0.92, clouds: 0.7, birds: true, stars: false,
  },
  storm: {
    sky: { c: ["#8a90a0", "#5e6a82", "#4a5670", "#3a4460", "#2c344a"], e: [0, 3, 9, 20, 45] },
    sea: { near: "#3c4e60", far: "#66748a", foam: "#d8dee8", deep: "#22303f" }, cloud: { lit: "#6c7690", mid: "#545e76", shade: "#3c445a" },
    bounce: [0, 0, 0.01], sat: 0.82, clouds: 1.0, birds: false, stars: false,
  },
  lantern: {
    sky: { c: ["#46507a", "#3a4270", "#323862", "#2a2c4c", "#1e1e38"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#1e2a48", far: "#3a4670", foam: "#8a96c0", deep: "#141c34" }, cloud: { lit: "#5a6090", mid: "#454a78", shade: "#30345a" },
    bounce: [0.03, 0.015, 0.0], sat: 0.85, clouds: 0.5, birds: false, stars: true,
  },
  day: {
    sky: { c: ["#c9dcef", "#a9c6e6", "#8cb4de", "#78a2d4", "#6692c8"], e: [0, 3, 8, 16, 40] },
    sea: { near: "#3e6670", far: "#8ea6b2", foam: "#ffffff", deep: "#28485a" }, cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c8ccdc" },
    bounce: [0, 0, 0], sat: 0.98, clouds: 0.6, birds: true, stars: false,
  },
  dawn: {
    sky: { c: ["#f4c8a8", "#e8b4a8", "#c8a4b0", "#9a9cbc", "#7d8fb8"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#4a7890", far: "#e0b8b0", foam: "#fff4ec", deep: "#2a4c66" }, cloud: { lit: "#ffe4d0", mid: "#e8b8b8", shade: "#a8a0c4" },
    bounce: [0.03, 0.02, 0.01], sat: 0.92, clouds: 0.55, birds: true, stars: false,
  },
  room: {
    sky: { c: ["#c4c8cc", "#b4b8c0", "#a4aab4", "#9aa2ac", "#8a929e"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#5a6e7a", far: "#a4b0b8", foam: "#f0f2f4", deep: "#3a4c58" }, cloud: { lit: "#e8eaee", mid: "#d0d4da", shade: "#b0b6c0" },
    bounce: [0.02, 0.015, 0.0], sat: 0.95, clouds: 1.0, birds: false, stars: false,
  },
  grey: {
    sky: { c: ["#b8bec6", "#aab0ba", "#9aa2ae", "#8a929e", "#7a828e"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#4e6270", far: "#a0aab4", foam: "#f0f2f4", deep: "#34485a" }, cloud: { lit: "#d4d8de", mid: "#bcc2ca", shade: "#9aa2ae" },
    bounce: [0, 0, 0], sat: 0.7, clouds: 1.0, birds: false, stars: false,
  },
  dark: {
    sky: { c: ["#868e9a", "#707886", "#5c6474", "#4a5262", "#3a4252"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#34465a", far: "#66707e", foam: "#dfe4ea", deep: "#1e2a3a" }, cloud: { lit: "#8a92a0", mid: "#727a88", shade: "#5a6270" },
    bounce: [0, 0, 0.01], sat: 0.66, clouds: 1.0, birds: false, stars: false,
  },
  sunset: {
    sky: { c: ["#ffc994", "#f6ae8a", "#e2988e", "#b4869a", "#8a7896"], e: [0, 4, 10, 22, 45] },
    sea: { near: "#4a6a84", far: "#e8a888", foam: "#fff0dc", deep: "#2f4a64" }, cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.05, 0.025, 0.0], sat: 0.92, clouds: 0.7, birds: true, stars: false,
  },
};

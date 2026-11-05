// Light presets per look (research/ricks/STYLE_REFERENCE.md section 4): day, golden, night and interior. The "sun" is
// the one shadow-casting key, CAMERA-RELATIVE and frozen per shot (world.ts): az = degrees from the shot camera's
// forward axis (0 = straight ahead = backlight, +90 = screen right, 180 = behind the camera), el = elevation. For night
// and interiors it is the moon through a window / the main room light. lit/shade/lift are LINEAR RGB multipliers for
// shade.ts. Practical lamps (point lights with floor pools) are added per set in world.ts on top of these.
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
};
export type LightName = "day" | "golden" | "night" | "interior";
export const LIGHTS: Record<LightName, LightPreset> = {
  // rule 5: day shadows near-neutral warm grey (#504b4d on screen), never blue-violet
  day: {
    az: 80, el: 58,
    lit: [1.62, 1.54, 1.38], shade: [0.30, 0.28, 0.31], lift: [0.05, 0.05, 0.07], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.96, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.94, 0.92, 0.94],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#7ca5d1", hor: "#c9dcef", skyCurve: [0.0, 0.5, 0.6], fog: "#c9dcef", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015, practical: 0,
  },
  // the lottery hall: a warm golden interior (stage spots from the front-left, marquee bulbs and chandeliers), plum shade
  golden: {
    az: 35, el: 32,
    lit: [1.55, 1.32, 1.0], shade: [0.25, 0.21, 0.25], lift: [0.05, 0.04, 0.05], lambert: 0.35, sideK: 0.84, term: 0.12,
    charTint: [1.0, 0.92, 0.82], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.9, 0.86, 0.9],
    blob: [0.75, 0.7, 0.8], actorShadow: true,
    top: "#97746c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#6a4a4a", fogNear: 40, fogFar: 260, sunDisc: "#ffcf9e",
    sunCol: "#ffb36b", sunI: 4.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03, practical: 1.0,
  },
  // night interior (the Bucharest flat): a cool moon key through the window, deep indigo shade (#161328 on screen);
  // the warm desk lamp (a practical) is the main light on Stefan and the desk
  night: {
    az: -70, el: 22,
    lit: [0.36, 0.44, 0.82], shade: [0.055, 0.05, 0.12], lift: [0.015, 0.015, 0.05], lambert: 0.4, sideK: 0.8, term: 0.15,
    charTint: [1.0, 0.82, 0.62], charShade: 0.8, charGrad: 0.14, bodyGrad: 0.3, sideTint: [0.7, 0.72, 0.95],
    blob: [0.5, 0.45, 0.6], actorShadow: true,
    top: "#312e4c", hor: "#4a4f7a", skyCurve: [0.0, 0.5, 0.6], fog: "#1b1e36", fogNear: 30, fogFar: 220, sunDisc: "#000000",
    sunCol: "#9fb4ff", sunI: 1.2, sky: "#2a3060", ground: "#1a1820", hemiI: 0.2,
    bias: -0.0004, normalBias: 0.02, practical: 1.0,
  },
  // warm interior (kitchen, warehouse, office): a room key from a window or ceiling, warm-neutral, shadow #3c354a
  interior: {
    az: 40, el: 50,
    lit: [1.45, 1.3, 1.08], shade: [0.26, 0.23, 0.30], lift: [0.04, 0.035, 0.06], lambert: 0.35, sideK: 0.84, term: 0.18,
    charTint: [1.0, 0.94, 0.88], charShade: 0.86, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.92, 0.9, 0.95],
    blob: [0.62, 0.58, 0.62], actorShadow: true,
    top: "#898593", hor: "#c9c0b8", skyCurve: [0.0, 0.5, 0.6], fog: "#8a8090", fogNear: 40, fogFar: 260, sunDisc: "#000000",
    sunCol: "#fff0d6", sunI: 2.4, sky: "#dcd4cc", ground: "#8a7a6a", hemiI: 0.5,
    bias: -0.0004, normalBias: 0.02, practical: 1.0,
  },
};

/** world-only look per light (sky stops by elevation in degrees, water, cloud palette, bounce, albedo saturation).
 *  All colours are ON-SCREEN targets under the PBR-Neutral tone map; world.ts pre-inverts them (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;
  sat: number;
  cloud: { lit: string; mid: string; shade: string };
};
const WATER_DAY = { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] as C3 };
export const LOOK: Record<LightName, WorldLook> = {
  day: {
    sky: { c: ["#c9dcef", "#a9c6e6", "#8cb4de", "#7ca5d1", "#6694c8"], e: [0, 3, 8, 16, 40] },
    water: WATER_DAY, cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c8ccdc" }, bounce: [0, 0, 0], sat: 1.0,
  },
  golden: {
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#97746c"], e: [0, 4, 10, 20, 40] },
    water: WATER_DAY, cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" }, bounce: [0.05, 0.025, 0.0], sat: 0.85, // the red-and-gold hall: albedo saturation down so the frame lands near the reference mean
  },
  night: {
    sky: { c: ["#4a4f7a", "#3e4370", "#363a62", "#312e4c", "#24223a"], e: [0, 4, 10, 20, 40] },
    water: WATER_DAY, cloud: { lit: "#5a6090", mid: "#454a78", shade: "#30345a" }, bounce: [0.03, 0.015, 0.0], sat: 0.85,
  },
  interior: {
    sky: { c: ["#c9c0b8", "#b8b0b0", "#a8a0a8", "#898593", "#7a7686"], e: [0, 4, 10, 20, 40] },
    water: WATER_DAY, cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c8ccdc" }, bounce: [0.02, 0.015, 0.0], sat: 1.0,
  },
};

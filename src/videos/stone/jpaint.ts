// Painted textures for the stone short (cached canvases, paint.ts ctex): the carved warning stone, Japanese walls,
// shoji, roof tiles, thatch, tatami, nets, and the story signs painted into the set (the 1896 notice board, the 1933
// plaque, the 2011 calendar, the 100 / 200 / 300 FT posts, the map labels). Signs are flat, bold and unlit-looking.
import * as THREE from "three";
import { ctex, rng } from "./paint";

const JP = "'Yu Gothic', 'YuGothic', 'MS Gothic', sans-serif";
const SANS = "'Segoe UI Black', 'Arial Black', 'Segoe UI', sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const TAU = Math.PI * 2;
const jitHex = (r: () => number, c: THREE.Color, k: number) => { const x = c.clone().offsetHSL(0, 0, (r() - 0.5) * k); return "#" + x.getHexString(); };

// ---------------- the warning stone ----------------
/** the real inscription (columns read right to left): "High dwellings are the peace of our descendants / remember the
 *  calamity of the great tsunami / do not build your homes below this point", plus the two years (Meiji 29, Showa 8) */
const COLS: { t: string; size: number; x: number; y0: number }[] = [
  { t: "高き住居は児孫の和楽", size: 0.085, x: 0.79, y0: 0.13 },
  { t: "想へ惨禍の大津浪", size: 0.085, x: 0.64, y0: 0.13 },
  { t: "此処より下に家を建てるな", size: 0.098, x: 0.45, y0: 0.08 },
  { t: "明治二十九年", size: 0.05, x: 0.27, y0: 0.2 },
  { t: "昭和八年", size: 0.05, x: 0.18, y0: 0.2 },
];
const SW = 1600, SH = 2950; // 0.95 m x 1.75 m
/** draws every glyph through fn(char, cx, cy, px) in canvas units of the SW x SH face */
const eachGlyph = (fn: (ch: string, cx: number, cy: number, px: number) => void) => {
  for (const c of COLS) {
    const px = c.size * SW * 1.0;
    [...c.t].forEach((ch, i) => fn(ch, c.x * SW, c.y0 * SH + (i + 0.5) * px * 1.07, px));
  }
};
const stoneOutline = (g: CanvasRenderingContext2D) => { // a rough slab silhouette with a rounded, uneven crown
  g.beginPath(); g.moveTo(SW * 0.03, SH);
  g.lineTo(SW * 0.01, SH * 0.2); g.quadraticCurveTo(SW * 0.06, SH * 0.03, SW * 0.38, SH * 0.012);
  g.quadraticCurveTo(SW * 0.72, SH * 0.0, SW * 0.92, SH * 0.06); g.quadraticCurveTo(SW * 1.0, SH * 0.14, SW * 0.985, SH * 0.3);
  g.lineTo(SW * 0.97, SH); g.closePath();
};
/** colour of the face: weathered granite, moss on the edges and the foot, carved characters with a dark floor and a
 *  sunlit lip (the golden key comes low from the left of the face) */
export const stoneFaceTex = () => ctex("stoneFace", SW, SH, (g, r) => {
  g.fillStyle = "#9c9488"; g.fillRect(0, 0, SW, SH);
  const gr = g.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, "rgba(255,248,235,0.12)"); gr.addColorStop(1, "rgba(40,36,30,0.18)");
  g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
  for (let i = 0; i < 26000; i++) { // granite speckle
    const x = r() * SW, y = r() * SH, s = 1 + r() * 3.2, k = r();
    g.fillStyle = k < 0.45 ? `rgba(60,54,48,${0.1 + 0.25 * r()})` : k < 0.8 ? `rgba(225,218,205,${0.1 + 0.25 * r()})` : `rgba(150,120,95,${0.15 + 0.2 * r()})`;
    g.fillRect(x, y, s, s);
  }
  for (let i = 0; i < 70; i++) { // weathering streaks running down
    const x = r() * SW, y = r() * SH * 0.7, l = 200 + r() * 900;
    g.strokeStyle = `rgba(70,64,56,${0.04 + 0.06 * r()})`; g.lineWidth = 6 + r() * 26;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - 0.5) * 40, y + l * 0.3, x + (r() - 0.5) * 60, y + l * 0.7, x + (r() - 0.5) * 50, y + l); g.stroke();
  }
  // carved characters: a lit lip outside the lower-right edge, then the engraved glyph (its own canvas): a dark
  // upper-left inner wall and a mid-dark rough floor, so the strokes read as cut into the stone, not printed on it
  g.textAlign = "center"; g.textBaseline = "middle";
  eachGlyph((ch, cx, cy, px) => { g.font = `bold ${px}px ${JP}`; g.fillStyle = "rgba(246,236,214,0.7)"; g.fillText(ch, cx + px * 0.03, cy + px * 0.03); });
  const gc = document.createElement("canvas"); gc.width = SW; gc.height = SH;
  const gg = gc.getContext("2d")!; gg.textAlign = "center"; gg.textBaseline = "middle";
  eachGlyph((ch, cx, cy, px) => { gg.font = `bold ${px}px ${JP}`; gg.fillStyle = "#2e2924"; gg.fillText(ch, cx, cy); });
  gg.globalCompositeOperation = "source-atop";
  eachGlyph((ch, cx, cy, px) => { gg.font = `bold ${px}px ${JP}`; gg.fillStyle = "#6b6258"; gg.fillText(ch, cx + px * 0.045, cy + px * 0.045); });
  for (let i = 0; i < 9000; i++) { gg.fillStyle = r() < 0.5 ? "rgba(30,26,22,0.35)" : "rgba(150,140,125,0.3)"; gg.fillRect(r() * SW, r() * SH, 2 + r() * 3, 2 + r() * 3); }
  g.drawImage(gc, 0, 0);
  // moss: a ragged band on the left and right edges, the crown and the foot (none on the inscription)
  const moss = ["#6f8a3a", "#5d7a34", "#8aa04a", "#4e6a2e", "#7a9442"];
  for (let i = 0; i < 5200; i++) {
    const side = r(), t = r();
    let x: number, y: number;
    if (side < 0.3) { x = r() ** 2.4 * SW * 0.1; y = SH * (0.06 + 0.94 * t); }
    else if (side < 0.6) { x = SW - r() ** 2.4 * SW * 0.1; y = SH * (0.06 + 0.94 * t); }
    else if (side < 0.85) { x = SW * t; y = SH - r() ** 2.2 * SH * 0.1; }
    else { x = SW * t; y = r() ** 2.4 * SH * 0.05; }
    const rad = 3 + r() * 12;
    g.fillStyle = moss[Math.floor(r() * moss.length)]; g.globalAlpha = 0.5 + 0.45 * r();
    g.beginPath(); g.ellipse(x, y, rad, rad * (0.5 + 0.6 * r()), r() * 3, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // outside the slab outline: transparent (alphaTest)
  g.globalCompositeOperation = "destination-in"; g.fillStyle = "#000"; stoneOutline(g); g.fill(); g.globalCompositeOperation = "source-over";
});
/** bump: the face is high (white), the carved strokes low (black), soft chisel walls */
export const stoneBumpTex = () => ctex("stoneBump", SW / 2, SH / 2, (g, r) => {
  g.fillStyle = "#c8c8c8"; g.fillRect(0, 0, SW / 2, SH / 2);
  for (let i = 0; i < 9000; i++) { const v = 170 + Math.floor(r() * 70); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * SW / 2, r() * SH / 2, 2, 2); }
  g.textAlign = "center"; g.textBaseline = "middle"; g.filter = "blur(2px)";
  eachGlyph((ch, cx, cy, px) => { g.font = `bold ${px / 2}px ${JP}`; g.fillStyle = "#1a1a1a"; g.fillText(ch, cx / 2, cy / 2); });
  g.filter = "none";
});
export const STONE_TEX_ASPECT = SW / SH;

/** the forgotten stone in the grass (town): rounder, darker, its characters worn almost away */
export const oldStoneTex = () => ctex("oldStone", 768, 1024, (g, r) => {
  g.fillStyle = "#8a857c"; g.fillRect(0, 0, 768, 1024);
  for (let i = 0; i < 9000; i++) { const k = r(); g.fillStyle = k < 0.5 ? `rgba(50,46,40,${0.1 + 0.25 * r()})` : `rgba(210,204,190,${0.1 + 0.2 * r()})`; g.fillRect(r() * 768, r() * 1024, 2 + r() * 3, 2 + r() * 3); }
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 96px ${JP}`;
  [..."此処より下に"].forEach((ch, i) => { g.fillStyle = "rgba(40,36,32,0.42)"; g.fillText(ch, 384, 170 + i * 104); g.fillStyle = "rgba(240,232,215,0.25)"; g.fillText(ch, 387, 173 + i * 104); });
  for (let i = 0; i < 1400; i++) { const x = r() * 768, y = r() < 0.6 ? 1024 - r() ** 2 * 380 : r() * 1024, rad = 5 + r() * 20; g.fillStyle = ["#6f8a3a", "#5d7a34", "#8aa04a", "#4e6a2e"][Math.floor(r() * 4)]; g.globalAlpha = 0.3 + 0.5 * r(); g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
});

// ---------------- walls, roofs, floors ----------------
/** vertical board wall (dark charred cedar or weathered pine), battens every ~0.45 m */
export const boardsTex = (col: string) => ctex("boards" + col, 512, 512, (g, r) => {
  const c = new THREE.Color(col);
  for (let x = 0; x < 512; x += 32) {
    g.fillStyle = jitHex(r, c, 0.08); g.fillRect(x, 0, 32, 512);
    for (let k = 0; k < 5; k++) { g.strokeStyle = `rgba(0,0,0,${0.08 + 0.08 * r()})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 4 + r() * 24, 0); g.lineTo(x + 4 + r() * 24, 512); g.stroke(); }
    g.fillStyle = "rgba(20,14,10,0.6)"; g.fillRect(x, 0, 2, 512);
  }
  for (let x = 0; x < 512; x += 128) { g.fillStyle = "rgba(25,18,12,0.55)"; g.fillRect(x + 60, 0, 10, 512); g.fillStyle = "rgba(255,240,220,0.08)"; g.fillRect(x + 60, 0, 3, 512); }
});
export const plasterJTex = (col: string) => ctex("plasterJ" + col, 256, 256, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,110,95,${0.03 + 0.05 * r()})`; g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 16, 0, TAU); g.fill(); }
});
/** shoji / sliding paper doors: a wooden lattice over paper; lit = the paper glows warm from the lamp inside */
export const shojiTex = (lit: boolean) => ctex("shoji" + lit, 256, 384, (g) => {
  g.fillStyle = lit ? "#ffe2a8" : "#e8e0cc"; g.fillRect(0, 0, 256, 384);
  if (lit) { const gr = g.createRadialGradient(128, 230, 10, 128, 230, 260); gr.addColorStop(0, "rgba(255,250,220,0.9)"); gr.addColorStop(1, "rgba(230,150,60,0.25)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 384); }
  g.fillStyle = lit ? "#5a3a20" : "#6a4a30";
  for (let x = 0; x <= 256; x += 64) g.fillRect(x - 5, 0, 10, 384);
  for (let y = 0; y <= 384; y += 64) g.fillRect(0, y - 4, 256, 8);
  g.fillRect(0, 0, 256, 14); g.fillRect(0, 370, 256, 14); g.fillRect(0, 0, 12, 384); g.fillRect(244, 0, 12, 384);
});
/** kawara roof tiles: rows of rounded tiles, dark blue-grey (or terracotta), painted ridges */
export const kawaraTex = (col: string) => ctex("kawara" + col, 512, 512, (g, r) => {
  const c = new THREE.Color(col);
  g.fillStyle = "#" + c.clone().offsetHSL(0, 0, -0.12).getHexString(); g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) {
    g.fillStyle = jitHex(r, c, 0.07);
    g.beginPath(); g.ellipse(x + 16, y + 18, 14, 18, 0, Math.PI, TAU); g.lineTo(x + 30, y + 32); g.lineTo(x + 2, y + 32); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x + 8, y + 4, 4, 22);
  }
  for (let y = 0; y < 512; y += 32) { g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, y + 30, 512, 3); }
});
export const thatchTex = () => ctex("thatch", 512, 512, (g, r) => {
  g.fillStyle = "#8f7442"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const x = r() * 512, y = r() * 512, l = 18 + r() * 40;
    g.strokeStyle = r() < 0.5 ? `rgba(196,164,96,${0.4 + 0.4 * r()})` : `rgba(90,68,36,${0.3 + 0.4 * r()})`; g.lineWidth = 1 + r() * 2.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + l); g.stroke();
  }
  for (let y = 0; y < 512; y += 128) { g.fillStyle = "rgba(50,36,18,0.35)"; g.fillRect(0, y + 120, 512, 8); }
});
export const sidingTex = (col: string) => ctex("siding" + col, 256, 256, (g, r) => {
  const c = new THREE.Color(col);
  for (let y = 0; y < 256; y += 16) { g.fillStyle = jitHex(r, c, 0.04); g.fillRect(0, y, 256, 16); g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(0, y + 14, 256, 2); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(0, y, 256, 2); }
});
export const tinTex = (col: string) => ctex("tin" + col, 256, 256, (g) => {
  for (let x = 0; x < 256; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, col); gr.addColorStop(0.5, "#" + new THREE.Color(col).offsetHSL(0, 0, 0.1).getHexString()); gr.addColorStop(1, "#" + new THREE.Color(col).offsetHSL(0, 0, -0.1).getHexString()); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); }
});
export const tatamiTex = () => ctex("tatami", 512, 1024, (g, r) => {
  g.fillStyle = "#c9c08a"; g.fillRect(0, 0, 512, 1024);
  for (let y = 0; y < 1024; y += 6) { g.fillStyle = `rgba(${r() < 0.5 ? "120,110,60" : "230,220,160"},${0.15 + 0.15 * r()})`; g.fillRect(0, y, 512, 3); }
  g.fillStyle = "#3a4a3a"; g.fillRect(0, 0, 30, 1024); g.fillRect(482, 0, 30, 1024);
});
export const fusumaTex = () => ctex("fusuma", 512, 768, (g, r) => {
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 512, 768);
  g.strokeStyle = "rgba(90,110,90,0.55)"; g.lineWidth = 3;
  for (let k = 0; k < 5; k++) { const y = 420 + k * 40; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y - 60 * Math.sin(x / 140 + k) * (0.4 + 0.2 * r())); g.stroke(); }
  g.fillStyle = "#4a3a2a"; g.fillRect(0, 0, 512, 16); g.fillRect(0, 752, 512, 16); g.fillRect(0, 0, 16, 768); g.fillRect(496, 0, 16, 768);
  g.fillStyle = "#2a2a2a"; g.beginPath(); g.ellipse(440, 400, 12, 22, 0, 0, TAU); g.fill();
});
/** fishing net: diamond mesh with alpha (cut-out) */
export const netTex = () => ctex("net", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "#6a5a3a"; g.lineWidth = 3;
  for (let k = -256; k < 512; k += 24) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 256, 256); g.stroke(); g.beginPath(); g.moveTo(k, 256); g.lineTo(k + 256, 0); g.stroke(); }
});
export const fishTex = () => ctex("fishCard", 256, 96, (g) => {
  const gr = g.createLinearGradient(0, 10, 0, 86); gr.addColorStop(0, "#4a6a8a"); gr.addColorStop(0.5, "#c8d4dc"); gr.addColorStop(1, "#f0f2f0");
  g.fillStyle = gr; g.strokeStyle = "#241726"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(14, 48); g.quadraticCurveTo(90, 4, 190, 40); g.lineTo(240, 14); g.lineTo(230, 48); g.lineTo(240, 82); g.lineTo(190, 56); g.quadraticCurveTo(90, 92, 14, 48); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#241726"; g.beginPath(); g.arc(44, 42, 6, 0, TAU); g.fill();
});
export const vendingTex = () => ctex("vending", 384, 768, (g) => {
  g.fillStyle = "#f2f2f4"; g.fillRect(0, 0, 384, 768);
  g.fillStyle = "#cfe8f8"; g.fillRect(24, 40, 336, 380);
  const cans = ["#d8352a", "#2f6ab5", "#f2c230", "#3a9a5a", "#e86a2a", "#8a4ab5"];
  for (let rr = 0; rr < 3; rr++) for (let k = 0; k < 6; k++) { g.fillStyle = cans[(rr * 2 + k) % 6]; g.fillRect(40 + k * 54, 70 + rr * 120, 34, 80); g.fillStyle = "#ffffff"; g.fillRect(44 + k * 54, 158 + rr * 120, 26, 10); }
  g.fillStyle = "#2a2a32"; g.fillRect(40, 520, 120, 70); g.fillRect(240, 640, 110, 60); g.fillStyle = "#d8352a"; g.fillRect(0, 0, 384, 28);
});

// ---------------- story signs ----------------
const board = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, col = "#b08a5a") => {
  const c = new THREE.Color(col);
  for (let y = 0; y < h; y += h / 4) { g.fillStyle = jitHex(r, c, 0.08); g.fillRect(0, y, w, h / 4); g.fillStyle = "rgba(40,26,14,0.5)"; g.fillRect(0, y + h / 4 - 4, w, 4); }
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(60,40,20,${0.1 + 0.15 * r()})`; g.lineWidth = 2; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + (r() - 0.5) * 10); g.stroke(); }
  g.strokeStyle = "#4a3018"; g.lineWidth = Math.max(10, h * 0.05); g.strokeRect(0, 0, w, h);
};
/** a weathered wooden notice board / plaque with a year painted big in dark ink */
export const yearBoardTex = (year: string, col = "#b8925e") => ctex("yearBoard" + year + col, 768, 512, (g, r) => {
  board(g, r, 768, 512, col);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `bold 300px ${SERIF}`;
  g.fillStyle = "rgba(255,240,210,0.35)"; g.fillText(year, 388, 272);
  g.fillStyle = "#1e140c"; g.fillText(year, 384, 268);
  for (const [x, y] of [[40, 40], [728, 40], [40, 472], [728, 472]]) { g.fillStyle = "#2a2018"; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }
});
/** the 2011 wall calendar (March), big year on top */
export const calendar2011Tex = () => ctex("cal2011", 640, 900, (g) => {
  g.fillStyle = "#f6f2ea"; g.fillRect(0, 0, 640, 900);
  g.fillStyle = "#2f6ab5"; g.fillRect(0, 0, 640, 90); for (let k = 0; k < 9; k++) { g.fillStyle = "#e8e8ee"; g.beginPath(); g.arc(50 + k * 68, 45, 12, 0, TAU); g.fill(); }
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#c8352a"; g.font = `bold 230px ${SANS}`; g.fillText("2011", 320, 250);
  g.fillStyle = "#2a2a32"; g.font = `bold 78px ${SANS}`; g.fillText("MARCH", 320, 420);
  g.font = `bold 40px ${SANS}`;
  ["S", "M", "T", "W", "T", "F", "S"].forEach((d, i) => { g.fillStyle = i === 0 ? "#c8352a" : "#2a2a32"; g.fillText(d, 70 + i * 83, 500); });
  for (let d = 1; d <= 31; d++) { const k = d + 1, x = 70 + (k % 7) * 83, y = 570 + Math.floor(k / 7) * 64; g.fillStyle = k % 7 === 0 ? "#c8352a" : "#3a3a44"; g.fillText(String(d), x, y); }
});
/** distance post board: "300 FT" with an arrow up the slope to the stone */
export const postTex = (label: string) => ctex("post" + label, 512, 320, (g) => {
  g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, 512, 320); g.strokeStyle = "#1e1e24"; g.lineWidth = 16; g.strokeRect(8, 8, 496, 304);
  g.fillStyle = "#1e1e24"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 150px ${SANS}`; g.fillText(label, 300, 165);
  g.fillStyle = "#c8352a"; g.beginPath(); g.moveTo(80, 70); g.lineTo(130, 150); g.lineTo(98, 150); g.lineTo(98, 250); g.lineTo(62, 250); g.lineTo(62, 150); g.lineTo(30, 150); g.closePath(); g.fill();
});
/** map labels painted on the hill (transparent background) */
export const mapLabelTex = (text: string, col: string) => ctex("mapLabel" + text + col, 512, 200, (g) => {
  g.clearRect(0, 0, 512, 200); g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 150px ${SANS}`;
  g.lineWidth = 18; g.strokeStyle = "rgba(20,20,26,0.85)"; g.strokeText(text, 256, 104); g.fillStyle = col; g.fillText(text, 256, 104);
});
export const ringMarkTex = () => ctex("ringMark", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256); g.strokeStyle = "rgba(20,20,26,0.85)"; g.lineWidth = 30; g.beginPath(); g.arc(128, 128, 100, 0, TAU); g.stroke();
  g.strokeStyle = "#e8352a"; g.lineWidth = 18; g.beginPath(); g.arc(128, 128, 100, 0, TAU); g.stroke();
});
/** the fish market's banner */
export const marketSignTex = () => ctex("marketSign", 1024, 256, (g) => {
  g.fillStyle = "#1f3f7a"; g.fillRect(0, 0, 1024, 256); g.strokeStyle = "#f4f0e6"; g.lineWidth = 12; g.strokeRect(14, 14, 996, 228);
  g.fillStyle = "#f4f0e6"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 150px ${SANS}`; g.fillText("FISH MARKET", 512, 134);
});
export const boatNumTex = (n: string) => ctex("boatNum" + n, 256, 96, (g) => {
  g.clearRect(0, 0, 256, 96); g.fillStyle = "#1e2a4a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `bold 70px ${SANS}`; g.fillText(n, 128, 52);
});
/** terrain detail (grey-scale grain multiplied over the vertex colours) */
export const groundDetailTex = () => ctex("groundDetail", 512, 512, (g, r) => {
  g.fillStyle = "#e8e8e8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const v = 200 + Math.floor(r() * 55); g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1.2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 4 - r() * 6); g.stroke(); }
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(150,150,150,${0.08 + 0.1 * r()})`; g.beginPath(); g.arc(r() * 512, r() * 512, 8 + r() * 30, 0, TAU); g.fill(); }
});
export { rng };

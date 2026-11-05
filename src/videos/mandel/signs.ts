// Painted textures for the mandel short's sets: the story signs (rule 7), the page of maths, the giant cheque, the
// jackpot board, the hall's neon and banner, the confetti carpet, and the Bucharest flat's wallpaper, calendar, poster
// and the snowy night outside its window. All Canvas2D (ctex cache), system fonts only (Ink Free for handwriting,
// Showcard Gothic for the marquee board, Britannic Bold / Bahnschrift for signs). Text is our own, in English.
import { ctex } from "./paint";

const HAND = "'Ink Free', 'Segoe Print', cursive";
const MARQ = "'Showcard Gothic', 'Britannic Bold', Impact, sans-serif";
const SIGN = "'Britannic Bold', 'Bahnschrift', 'Arial Black', sans-serif";

/** Stefan's page of maths: cream paper, pencil formulas for the number of combinations, a circled result, crossings out */
export const mathPageTex = () => ctex("mathPage", 768, 1008, (g, r) => {
  g.fillStyle = "#f4ead2"; g.fillRect(0, 0, 768, 1008);
  g.strokeStyle = "rgba(90,140,200,0.35)"; g.lineWidth = 2;
  for (let y = 120; y < 1008; y += 56) { g.beginPath(); g.moveTo(30, y); g.lineTo(738, y); g.stroke(); }
  g.strokeStyle = "rgba(210,80,80,0.45)"; g.beginPath(); g.moveTo(92, 0); g.lineTo(92, 1008); g.stroke();
  g.fillStyle = "#2a2a3a"; g.textBaseline = "alphabetic";
  const line = (t: string, x: number, y: number, s = 46, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.font = `bold ${s}px ${HAND}`; g.fillText(t, 0, 0); g.restore(); };
  // era-neutral (the same page is on the 1962 desk): the count of combinations, then the idea
  line("how many tickets?", 112, 104, 50, -0.02);
  line("n·(n-1)·(n-2)·(n-3)·(n-4)·(n-5)", 106, 216, 40, 0.01);
  g.fillRect(112, 236, 590, 4);
  line("6·5·4·3·2·1", 280, 290, 48);
  line("= EVERY combination", 120, 400, 56, -0.03);
  g.strokeStyle = "#c23a2a"; g.lineWidth = 7; g.beginPath(); g.ellipse(410, 382, 300, 62, -0.03, 0, Math.PI * 2); g.stroke();
  line("cost of all of them", 112, 520, 46, 0.01);
  line("vs. the jackpot", 112, 600, 46, -0.01);
  line("cost < prize ?", 150, 712, 58, -0.02);
  g.strokeStyle = "#2f8a4a"; g.lineWidth = 9; g.beginPath(); g.moveTo(590, 690); g.lineTo(620, 720); g.lineTo(690, 640); g.stroke();
  g.fillStyle = "#2a2a3a"; line("lucky numbers", 112, 830, 44, 0.02);
  g.strokeStyle = "#2a2a3a"; g.lineWidth = 5; g.beginPath(); g.moveTo(104, 818); g.lineTo(420, 800); g.stroke();
  line("BUY THEM ALL", 330, 940, 50, -0.04);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(120,100,70,${0.04 + 0.05 * r()})`; g.fillRect(r() * 768, r() * 1008, 2 + 6 * r(), 2 + 6 * r()); }
});

/** the giant presentation cheque */
export const chequeTex = () => ctex("cheque", 1024, 440, (g, r) => {
  g.fillStyle = "#f6f0dc"; g.fillRect(0, 0, 1024, 440);
  g.fillStyle = "#2f7a54"; g.fillRect(0, 0, 1024, 64);
  g.fillStyle = "#fff6d8"; g.font = `bold 42px ${SIGN}`; g.fillText("STATE LOTTERY  ·  GRAND DRAW", 40, 46);
  g.strokeStyle = "rgba(47,122,84,0.25)"; g.lineWidth = 2;
  for (let x = -440; x < 1024; x += 26) { g.beginPath(); g.moveTo(x, 440); g.lineTo(x + 440, 64); g.stroke(); }
  g.fillStyle = "#2a2a3a"; g.font = `bold 34px ${SIGN}`; g.fillText("PAY", 44, 150); g.fillText("THE SUM OF", 44, 250);
  g.font = `bold 56px ${HAND}`; g.fillText("Stefan Mandel", 150, 156); g.fillText("one million dollars", 270, 254);
  g.fillStyle = "#2a2a3a"; g.fillRect(150, 168, 560, 4); g.fillRect(270, 268, 690, 4);
  g.strokeStyle = "#2a2a3a"; g.lineWidth = 6; g.strokeRect(700, 100, 290, 90);
  g.font = `bold 60px ${SIGN}`; g.fillText("$1,000,000", 712, 168);
  g.font = `bold 50px ${HAND}`; g.fillText("Director", 640, 380); g.fillRect(620, 392, 340, 3);
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(90,80,60,${0.04 * r()})`; g.fillRect(r() * 1024, 64 + r() * 376, 8, 8); }
});

/** the glowing JACKPOT board (self-lit; the marquee bulbs around it are separate emissive spheres) */
export const jackpotTex = () => ctex("jackpot", 1024, 560, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, "#6a1420"); gr.addColorStop(1, "#3a0a14");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 560);
  g.strokeStyle = "#f2c94a"; g.lineWidth = 14; g.strokeRect(22, 22, 980, 516);
  g.lineWidth = 4; g.strokeRect(44, 44, 936, 472);
  g.textAlign = "center";
  g.font = `220px ${MARQ}`; g.fillStyle = "#ffe08a"; g.fillText("JACKPOT", 512, 300);
  g.font = `110px ${MARQ}`; g.fillStyle = "#ffffff"; g.fillText("WINNER!", 512, 450);
  for (const [x, y] of [[110, 110], [914, 110], [110, 470], [914, 470]]) { g.fillStyle = "#ffe08a"; star(g, x, y, 34); }
});
const star = (g: CanvasRenderingContext2D, x: number, y: number, R: number) => {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.45 : R; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
  g.closePath(); g.fill();
};

/** red neon "LOTTERY" on a dark backing board (the tube colour is boosted in the material so it blooms) */
export const neonTex = (text: string, col = "#ff5a5a") => ctex("neon" + text + col, 1024, 256, (g) => {
  g.fillStyle = "#1c1218"; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = "#3a2a30"; g.lineWidth = 10; g.strokeRect(5, 5, 1014, 246);
  g.textAlign = "center"; g.font = `bold 170px ${SIGN}`;
  g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fillText(text, 512, 196);
  g.shadowBlur = 0; g.fillStyle = "#ffe6e6"; g.font = `bold 170px ${SIGN}`; g.globalAlpha = 0.55; g.fillText(text, 512, 196); g.globalAlpha = 1;
});

/** cloth banner "GRAND DRAW" (navy with gold letters, fringe) */
export const bannerTex = (text: string) => ctex("banner" + text, 1024, 220, (g) => {
  g.fillStyle = "#24346a"; g.fillRect(0, 0, 1024, 190);
  g.fillStyle = "#f2c94a"; g.fillRect(0, 0, 1024, 12); g.fillRect(0, 178, 1024, 12);
  for (let x = 6; x < 1024; x += 22) g.fillRect(x, 190, 9, 26);
  g.textAlign = "center"; g.font = `bold 120px ${SIGN}`; g.fillStyle = "#f2c94a"; g.fillText(text, 512, 140);
});

/** the confetti carpet: scattered paper bits over the hall's red carpet colour (for the floor mound + decals) */
export const confettiTex = (bg: string | null) => ctex("confettiFloor" + bg, 1024, 1024, (g, r) => {
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, 1024, 1024); }
  const cols = ["#e2453c", "#f2c94a", "#3f8ad8", "#4fb36a", "#e86aa8", "#ffffff", "#f28a2c", "#8a5ad8"];
  for (let i = 0; i < 2600; i++) {
    g.save(); g.translate(r() * 1024, r() * 1024); g.rotate(r() * Math.PI);
    g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(-9, -5, 18, 10); g.restore();
  }
  for (let i = 0; i < 70; i++) { // printed lottery tickets in the heap
    g.save(); g.translate(r() * 1024, r() * 1024); g.rotate(r() * Math.PI);
    g.fillStyle = "#fff8e6"; g.fillRect(-34, -16, 68, 32); g.fillStyle = "#2f7a54"; g.fillRect(-34, -16, 68, 9);
    g.fillStyle = "#c23a2a"; g.fillRect(-26, 0, 30, 5); g.restore();
  }
});

/** 1960s wallpaper: faded mustard with brown diamonds and small flowers */
export const wallpaperTex = () => ctex("wallpaper60s", 512, 512, (g, r) => {
  g.fillStyle = "#c9b27a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) {
    g.fillStyle = "#a88a54"; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 14, y); g.lineTo(x, y + 18); g.lineTo(x - 14, y); g.closePath(); g.fill();
    g.fillStyle = "#e6d6a6"; g.beginPath(); g.arc(x + 32, y + 32, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#8a5a3a"; g.beginPath(); g.arc(x + 32, y + 32, 2.5, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,70,40,${0.05 * r()})`; g.fillRect(r() * 512, r() * 512, 4 + 10 * r(), 4 + 10 * r()); }
});

/** wall calendar: JANUARY 1962 */
export const calendar62Tex = () => ctex("calendar62", 512, 704, (g) => {
  g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, 512, 704);
  g.fillStyle = "#b8352a"; g.fillRect(0, 0, 512, 200);
  g.textAlign = "center"; g.fillStyle = "#fff6e0"; g.font = `bold 150px ${SIGN}`; g.fillText("1962", 256, 160);
  g.fillStyle = "#2a2a3a"; g.font = `bold 54px ${SIGN}`; g.fillText("JANUARY", 256, 270);
  g.font = `bold 36px ${SIGN}`;
  for (let d = 1; d <= 31; d++) { const c = (d - 1) % 7, rw = Math.floor((d - 1) / 7); g.fillStyle = c === 6 ? "#b8352a" : "#2a2a3a"; g.fillText(String(d), 60 + c * 66, 350 + rw * 72); }
});

/** state lottery poster on the flat's wall */
export const lottoPosterTex = () => ctex("lottoPoster", 512, 720, (g) => {
  g.fillStyle = "#2c4a8a"; g.fillRect(0, 0, 512, 720);
  g.fillStyle = "#f2c94a"; g.beginPath(); g.arc(256, 300, 170, 0, Math.PI * 2); g.fill();
  g.textAlign = "center"; g.fillStyle = "#b8352a"; g.font = `bold 150px ${SIGN}`; g.fillText("LOTTO", 256, 350);
  g.fillStyle = "#ffffff"; g.font = `bold 52px ${SIGN}`; g.fillText("6 FROM 49", 256, 560);
  g.font = `bold 40px ${SIGN}`; g.fillText("EVERY SUNDAY", 256, 640);
  for (let i = 0; i < 6; i++) { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(76 + i * 72, 90, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = "#2c4a8a"; g.font = `bold 28px ${SIGN}`; g.fillText(String([3, 11, 19, 27, 38, 45][i]), 76 + i * 72, 100); }
});

/** the snowy night outside the flat's window: deep blue sky, snowy roofs, warm lit windows, falling snow (self-lit) */
export const nightWindowTex = () => ctex("nightWindow", 768, 640, (g, r) => {
  const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, "#1c2048"); gr.addColorStop(1, "#3a4478");
  g.fillStyle = gr; g.fillRect(0, 0, 768, 640);
  g.fillStyle = "#f4f2e0"; g.beginPath(); g.arc(600, 120, 46, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 6; i++) { // apartment blocks across the street
    const x = i * 140 - 20, w = 120, h = 250 + 120 * r();
    g.fillStyle = "#2a2e52"; g.fillRect(x, 640 - h, w, h);
    g.fillStyle = "#e8ecf6"; g.fillRect(x - 4, 640 - h - 10, w + 8, 14);
    for (let yy = 640 - h + 30; yy < 620; yy += 46) for (let xx = x + 14; xx < x + w - 20; xx += 34)
      if (r() < 0.32) { g.fillStyle = r() < 0.7 ? "#ffcf7a" : "#ffe6b0"; g.fillRect(xx, yy, 18, 24); } else { g.fillStyle = "#3a4070"; g.fillRect(xx, yy, 18, 24); }
  }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * r()})`; g.beginPath(); g.arc(r() * 768, r() * 640, 1.5 + 2.5 * r(), 0, Math.PI * 2); g.fill(); }
});

// Timeline engine: deterministic frame-by-frame recording of the real app.
// Every frame: camera + cursor are computed from time, real mouse/keyboard input is sent
// through Playwright, the app's own timers are advanced by exactly 1/fps, then a screenshot is taken.
'use strict';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const smooth = (u) => u * u * u * (u * (u * 6 - 15) + 10); // smootherstep

class Timeline {
  constructor() {
    this.actions = []; // discrete, executed once at time t
    this.cams = [];
    this.moves = [];
    this.clicks = []; // visual press/ripple
    this.captions = [];
    this.rings = [];
    this.listboxes = [];
    this.cursorKeys = [{ t: 0, o: 0, dur: 0 }];
    this.titleKeys = null;
    this.weeks = { items: [], keys: [], active: [] };
    this.finalKey = null;
    this.scrimKeys = [];
  }
  at(t, kind, data = {}) { this.actions.push({ t, kind, ...data }); return this; }
  cam(t, dur, spec) { this.cams.push({ t, dur, ...spec }); return this; }
  move(t, dur, target) { this.moves.push({ t, dur, target }); return this; }
  click(t, { real = true } = {}) {
    this.clicks.push({ t });
    if (real) { this.at(t, 'down'); this.at(t + 0.083, 'up'); }
    return this;
  }
  drag(t, dur, target) {
    this.clicks.push({ t, noRipple: true, hold: dur + 0.1 });
    this.at(t, 'down');
    this.move(t + 0.08, dur, target);
    this.at(t + dur + 0.16, 'up');
    return this;
  }
  key(t, combo) { return this.at(t, 'key', { combo }); }
  type(t, text, gap = 0.12) { [...text].forEach((ch, i) => this.at(t + i * gap, 'key', { combo: ch })); return this; }
  select(t, sel, value) { return this.at(t, 'select', { sel, value }); }
  probe(t, name, expr) { return this.at(t, 'probe', { name, expr }); }
  listbox(t0, t1, sel, hovers) { this.listboxes.push({ t0, t1, sel, hovers }); return this; }
  caption(t0, t1, text, kicker, html) { this.captions.push({ t0, t1, text, kicker, html }); return this; }
  ring(t0, t1, spec) { this.rings.push({ t0, t1, ...spec }); return this; }
  cursor(t, o, dur = 0.35) { this.cursorKeys.push({ t, o, dur }); return this; }
  scrim(t, top, len = 170, o = 0, dur = 0) { this.scrimKeys.push({ t, top, len, o, dur }); return this; }
}

// ---------- per-frame evaluation helpers ----------
function fade(t, t0, t1, fin = 0.45, fout = 0.35) {
  if (t < t0 || t > t1) return 0;
  return Math.min(easeOut(clamp((t - t0) / fin)), easeOut(clamp((t1 - t) / fout)));
}

function keyValue(keys, t) { // stepwise fade keys {t,o,dur}
  let v = 0, prev = 0;
  for (const k of keys) {
    if (t < k.t) break;
    const u = k.dur > 0 ? clamp((t - k.t) / k.dur) : 1;
    v = lerp(prev, k.o, easeInOut(u));
    prev = k.o; // assumes keys far enough apart
  }
  return v;
}

function fit(rect, { region = { l: 70, r: 1850, t: 40, b: 868 }, maxS = 1.45, minS = 0.5, pad = 16, ax = 0.5, ay = 0.5 } = {}) {
  const w = rect.w + 2 * pad, h = rect.h + 2 * pad;
  const s = clamp(Math.min((region.r - region.l) / w, (region.b - region.t) / h, maxS), minS, 4);
  const rcx = lerp(region.l, region.r, ax), rcy = lerp(region.t, region.b, ay);
  const pcx = rect.x + rect.w * ax, pcy = rect.y + rect.h * ay;
  return { cx: pcx - (rcx - 960) / s, cy: pcy - (rcy - 540) / s, s };
}

const toPage = (cam, sx, sy) => ({ x: (sx - 960) / cam.s + cam.cx, y: (sy - 540) / cam.s + cam.cy });
const toScreen = (cam, px, py) => ({ x: (px - cam.cx) * cam.s + 960, y: (py - cam.cy) * cam.s + 540 });
const rectToPage = (cam, r) => { const a = toPage(cam, r.x, r.y); return { x: a.x, y: a.y, w: r.w / cam.s, h: r.h / cam.s }; };

module.exports = { Timeline, clamp, lerp, easeInOut, easeOut, smooth, fade, keyValue, fit, toPage, toScreen, rectToPage };

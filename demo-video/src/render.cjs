#!/usr/bin/env node
// Usage:
//   node src/render.cjs --out out/demo.mp4            full 1920x1080 60 fps render (silent)
//   node src/render.cjs --fps 10 --dir out/preview     PNG preview frames
//   node src/render.cjs --stills 5,20.5,43 --dir out/stills
//   node src/render.cjs --from 40 --to 60 --out out/part.mp4
'use strict';
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const E = require('./engine.cjs');
const build = require('./timeline.cjs');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = Number(args.fps || 60);
const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app', 'index.html');
const tl = build();
const DURATION = tl.duration;
const N = Math.round(DURATION * FPS);
const from = args.from ? Math.round(Number(args.from) * FPS) : 0;
const to = args.to ? Math.min(N, Math.round(Number(args.to) * FPS)) : N;
const stills = args.stills ? String(args.stills).split(',').map((s) => Math.round(Number(s) * FPS)) : null;
const every = Number(args.every || 1);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  // Virtual timers: the app animates A*/BFS/DFS with setInterval. We advance them by exactly
  // 1/fps per recorded frame, so the animation speed in the video equals the real setting.
  await page.addInitScript(() => {
    let now = 0, nextId = 1; const timers = new Map();
    const add = (fn, ms, rep, a) => { const d = Math.max(1, Number(ms) || 0); timers.set(nextId, { fn, d, next: now + d, rep, a }); return nextId++; };
    window.setInterval = (fn, ms, ...a) => add(fn, ms, true, a);
    window.setTimeout = (fn, ms, ...a) => add(fn, ms, false, a);
    window.clearInterval = window.clearTimeout = (id) => { timers.delete(id); };
    window.__vtAdvance = (dt) => {
      const end = now + dt;
      for (;;) {
        let id = null, tm = null;
        for (const [k, v] of timers) if (v.next <= end && (!tm || v.next < tm.next)) { id = k; tm = v; }
        if (!tm) break;
        now = tm.next;
        if (tm.rep) tm.next += tm.d; else timers.delete(id);
        tm.fn(...tm.a);
      }
      now = end;
    };
  });
  await page.goto('file://' + APP);
  await page.addStyleTag({ path: path.join(__dirname, 'overlay.css') });
  await page.addScriptTag({ path: path.join(__dirname, 'overlay.js') });
  await page.evaluate(() => document.fonts.ready);
  const cdp = await page.context().newCDPSession(page);

  let ff = null;
  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', args.preset || 'slow', '-crf', String(args.crf || 16), '-tune', 'animation',
      '-profile:v', 'high', '-level:v', '4.2', '-g', String(FPS * 2),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-r', String(FPS), '-an', '-movflags', '+faststart', path.resolve(args.out)], { stdio: ['pipe', 'inherit', 'inherit'] });
  }
  if (args.dir) fs.mkdirSync(args.dir, { recursive: true });

  // ---- state ----
  const actions = [...tl.actions].sort((a, b) => a.t - b.t);
  let ai = 0;
  let cam = { ...tl.camStart };
  let camActive = null, camIdx = 0;
  const cams = [...tl.cams].sort((a, b) => a.t - b.t);
  let cur = null; // cursor page coords
  let moveActive = null, moveIdx = 0;
  const moves = [...tl.moves].sort((a, b) => a.t - b.t);
  const facts = {};
  let lastMouse = null;

  async function rectsOf(specs) { return page.evaluate((s) => window.__ov.rects(s), specs); }
  function union(rs) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rs) if (r) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  async function resolveCam(c) {
    if (c.to) return { ...c.to };
    // apply current camera first so rects are consistent
    await page.evaluate((cc) => { document.body.style.transform = `translate(${960 - cc.s * cc.cx}px, ${540 - cc.s * cc.cy}px) scale(${cc.s})`; }, cam);
    const rs = await rectsOf(c.focus.map((s) => (typeof s === 'string' ? { sel: s } : s)));
    rs.forEach((r, i) => { if (!r) throw new Error(`camera focus not found: ${JSON.stringify(c.focus[i])} at ${c.t}s`); });
    const pr = E.rectToPage(cam, union(rs));
    return E.fit(pr, c);
  }
  async function resolveTarget(tg) {
    if (tg.page) return { ...tg.page };
    if (tg.screen) return E.toPage(cam, tg.screen.x, tg.screen.y);
    await page.evaluate((cc) => { document.body.style.transform = `translate(${960 - cc.s * cc.cx}px, ${540 - cc.s * cc.cy}px) scale(${cc.s})`; }, cam);
    const [r] = await rectsOf([{ sel: tg.sel, nth: tg.nth || 0 }]);
    if (!r) throw new Error(`cursor target not found: ${tg.sel}`);
    const p = E.toPage(cam, r.x + r.w * (tg.ax ?? 0.5) + (tg.dx || 0), r.y + r.h * (tg.ay ?? 0.5) + (tg.dy || 0));
    return p;
  }

  const t0wall = Date.now();
  for (let f = 0; f < N && f < to; f++) {
    const t = f / FPS;
    // ---- camera ----
    while (camIdx < cams.length && cams[camIdx].t <= t + 1e-9) {
      const c = cams[camIdx++];
      const target = await resolveCam(c);
      camActive = { c, from: { ...cam }, target };
    }
    if (camActive) {
      const { c, from: a, target: b } = camActive;
      const u = c.dur > 0 ? E.clamp((t - c.t) / c.dur) : 1;
      const e = E.easeInOut(u);
      // zoom path: interpolate log-scale for even perceived speed
      const s = Math.exp(E.lerp(Math.log(a.s), Math.log(b.s), e));
      cam = { cx: E.lerp(a.cx, b.cx, e), cy: E.lerp(a.cy, b.cy, e), s };
      if (u >= 1 && (c.drift || c.driftX)) {
        // slow "breathing" camera on holds; the zoom is anchored at screen y = anchorY (default: top edge)
        const dt = t - (c.t + c.dur), A = c.anchorY ?? 0;
        const s2 = b.s * (1 + (c.drift || 0) * dt);
        const pa = (A - 540) / b.s + b.cy;
        cam = { cx: b.cx + (c.driftX || 0) * dt, cy: pa - (A - 540) / s2, s: s2 };
      }
    }
    // ---- cursor ----
    while (moveIdx < moves.length && moves[moveIdx].t <= t + 1e-9) {
      const m = moves[moveIdx++];
      const target = await resolveTarget(m.target);
      const start = cur || E.toPage(cam, 2000, 1150);
      moveActive = { m, start, target };
    }
    if (moveActive) {
      const { m, start, target } = moveActive;
      const u = m.dur > 0 ? E.clamp((t - m.t) / m.dur) : 1;
      const e = E.easeInOut(u);
      const dx = target.x - start.x, dy = target.y - start.y, d = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(Math.PI * e) * Math.min(42, d * 0.1) * (m.target.arc ?? 1);
      cur = { x: E.lerp(start.x, target.x, e) + (-dy / d) * arc, y: E.lerp(start.y, target.y, e) + (dx / d) * arc };
    }
    const curS = cur ? E.toScreen(cam, cur.x, cur.y) : { x: 2000, y: 1150 };
    const mx = Math.round(curS.x * 100) / 100, my = Math.round(curS.y * 100) / 100;
    if (!lastMouse || lastMouse.x !== mx || lastMouse.y !== my) { await page.mouse.move(mx, my); lastMouse = { x: mx, y: my }; }

    // ---- discrete actions ----
    while (ai < actions.length && actions[ai].t <= t + 1e-9) {
      const a = actions[ai++];
      if (a.kind === 'down') await page.mouse.down();
      else if (a.kind === 'up') await page.mouse.up();
      else if (a.kind === 'key') await page.keyboard.press(a.combo);
      else if (a.kind === 'select') await page.selectOption(a.sel, a.value);
      else if (a.kind === 'probe') facts[a.name] = await page.evaluate(a.expr);
      else if (a.kind === 'eval') await page.evaluate(a.expr);
      else if (a.kind === 'layout' && args.layout) {
        const dump = await page.evaluate((sels) => {
          const bt = document.body.style.transform; document.body.style.transform = 'none';
          const out = {};
          for (const s of sels) out[s] = [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).slice(0, 12).map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom), (e.textContent || '').trim().slice(0, 28)]; });
          document.body.style.transform = bt; return out;
        }, a.sels);
        facts['layout_' + a.name] = dump;
        await page.evaluate(() => { window.__bt = document.body.style.transform; document.body.style.transform = 'none'; document.getElementById('ov-root').style.display = 'none'; document.documentElement.style.setProperty('overflow', 'visible', 'important'); });
        await page.screenshot({ path: path.join(ROOT, 'out', `layout_${a.name}.png`), fullPage: true });
        await page.evaluate(() => { document.body.style.transform = window.__bt; document.getElementById('ov-root').style.display = ''; document.documentElement.style.removeProperty('overflow'); });
      }
    }
    await page.evaluate((dt) => window.__vtAdvance(dt), 1000 / FPS);

    // ---- overlay state ----
    let press = 1, ripple = 0, rx = 0, ry = 0;
    for (const c of tl.clicks) {
      const dt = t - c.t;
      if (dt >= 0 && dt < (c.hold ? c.hold + 0.25 : 0.3)) {
        const hold = c.hold || 0.08;
        press = Math.min(press, dt < 0.08 ? E.lerp(1, 0.86, dt / 0.08) : dt < hold ? 0.86 : E.lerp(0.86, 1, E.clamp((dt - hold) / 0.17)));
      }
      if (!c.noRipple && dt >= 0 && dt < 0.55) {
        ripple = dt / 0.55;
        if (!c.pos) c.pos = { ...curS };
        rx = c.pos.x; ry = c.pos.y;
      }
    }
    let caption = null;
    for (const c of tl.captions) {
      const o = E.fade(t, c.t0, c.t1, 0.45, 0.35);
      if (o > 0 && (!caption || o >= caption.o)) caption = { text: c.text, kicker: c.kicker, html: c.html, o };
    }
    const rings = tl.rings.map((r) => ({ sel: r.sel, nth: r.nth, pad: r.pad, color: r.color, radius: r.radius, o: E.fade(t, r.t0, r.t1, 0.35, 0.3) })).filter((r) => r.o > 0);
    let listbox = null;
    for (const l of tl.listboxes) {
      const o = E.fade(t, l.t0, l.t1, 0.16, 0.14);
      if (o > 0) {
        let hover = -1;
        for (const h of l.hovers) if (t >= h.t) hover = h.i;
        listbox = { sel: l.sel, o, hover };
      }
    }
    const T = tl.titleKeys;
    const title = { o: T ? E.fade(t, T.t0, T.t1, 0.01, T.out) : 0, p: T ? T.lines.map((s) => E.easeOut(E.clamp((t - s) / 0.9))) : [0, 0, 0] };
    const W = tl.weeks;
    const weeks = { items: W.items, p: W.keys.map((k) => E.fade(t, k, W.until, 0.6, 0.4)), active: W.active.reduce((acc, a) => (t >= a.t ? a.i : acc), -1) };
    const F = tl.finalKey;
    const final = { o: F ? E.fade(t, F.t0, F.t1, 0.8, 0.3) : 0, text: F ? F.text : '' };
    let scrimTop = 780, scrimLen = 170, scrimBase = 0, prev = null;
    for (const k of tl.scrimKeys) {
      if (t < k.t) break;
      const u = k.dur ? E.easeInOut(E.clamp((t - k.t) / k.dur)) : 1;
      const p = prev || k;
      scrimTop = E.lerp(p.top, k.top, u); scrimLen = E.lerp(p.len ?? 170, k.len ?? 170, u); scrimBase = E.lerp(p.o ?? 0, k.o ?? 0, u);
      prev = { top: scrimTop, len: scrimLen, o: scrimBase };
    }
    const scrim = Math.max(scrimBase, caption ? caption.o : 0, title.o, final.o);
    const cursorO = E.keyValue(tl.cursorKeys, t);
    const state = { cam, rings, listbox, title, weeks, final, caption, scrim, scrimTop, scrimLen, cursor: { x: curS.x, y: curS.y, o: cursorO, press, ripple, rx, ry } };
    await page.evaluate((st) => window.__ov.update(st), state);

    // ---- capture ----
    const want = f >= from && (stills ? stills.includes(f) : (f - from) % every === 0);
    if (want) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      const buf = Buffer.from(data, 'base64');
      if (ff) { if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); }
      if (args.dir) fs.writeFileSync(path.join(args.dir, stills ? `t${(t).toFixed(2).padStart(7, '0')}.png` : `f${String(f).padStart(5, '0')}.png`), buf);
    }
    if (f % (FPS * 5) === 0) process.stderr.write(`t=${t.toFixed(1)}s  frame ${f}/${N}  ${((Date.now() - t0wall) / 1000).toFixed(0)}s elapsed\n`);
  }
  if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
  const outFacts = path.join(ROOT, 'out', args.facts || 'facts.json');
  fs.mkdirSync(path.dirname(outFacts), { recursive: true });
  fs.writeFileSync(outFacts, JSON.stringify({ facts, errors, fps: FPS, frames: N, duration: DURATION }, null, 2));
  console.log(JSON.stringify({ errors, facts }, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

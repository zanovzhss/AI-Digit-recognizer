// Injected into the real app page. It never touches the app's algorithms or state:
// it only adds a screen-space layer (cursor, captions, highlight rings, title cards)
// and applies a "camera" transform to <body> so the recording can zoom and pan.
(() => {
  if (window.__ov) return;
  const NS = 'ov';
  const root = document.createElement('div');
  root.id = `${NS}-root`;
  root.innerHTML = `
    <div id="ov-scrim"></div>
    <div id="ov-rings"></div>
    <div id="ov-listbox"></div>
    <div id="ov-title">
      <div class="ov-t1">AI Algorithm Visualizer</div>
      <div class="ov-t2">Zanov Zhanarys · QAIRU</div>
      <div class="ov-t3">AI алгоритмдерін интерактивті зерттеу</div>
    </div>
    <div id="ov-weeks"></div>
    <div id="ov-final"><div class="ov-final-k">AI Algorithm Visualizer · Zanov Zhanarys · QAIRU</div><div class="ov-final-t"></div></div>
    <div id="ov-caption"><div class="ov-k"></div><div class="ov-c"></div></div>
    <div id="ov-ripple"></div>
    <div id="ov-cursor"><svg width="34" height="40" viewBox="0 0 34 40"><path d="M3 2 L3 31 L10.5 24.2 L15.6 36.2 L21 33.9 L15.9 22.2 L26 22.2 Z" fill="#ffffff" stroke="#0b1016" stroke-width="2.2" stroke-linejoin="round"/></svg></div>`;
  document.documentElement.appendChild(root);
  const $ = (id) => document.getElementById(id);
  const els = {
    scrim: $('ov-scrim'), rings: $('ov-rings'), listbox: $('ov-listbox'), title: $('ov-title'),
    weeks: $('ov-weeks'), final: $('ov-final'), caption: $('ov-caption'), ripple: $('ov-ripple'), cursor: $('ov-cursor'),
  };
  const capK = els.caption.querySelector('.ov-k');
  const capC = els.caption.querySelector('.ov-c');
  const ringPool = [];

  function pick(spec) {
    const all = [...document.querySelectorAll(spec.sel)].filter((e) => e.getClientRects().length);
    return all[spec.nth || 0] || null;
  }
  function rectOf(spec) {
    if (spec.rect) return spec.rect;
    const list = Array.isArray(spec.sel) ? spec.sel : [spec.sel];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of list) {
      const e = pick({ sel: s, nth: spec.nth });
      if (!e) continue;
      const r = e.getBoundingClientRect();
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    if (!isFinite(x0)) return null;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function update(st) {
    // 1. camera: screen = (page - c) * s + (960, 540)
    const c = st.cam;
    const tx = 960 - c.s * c.cx, ty = 540 - c.s * c.cy;
    document.body.style.transform = `translate(${tx}px, ${ty}px) scale(${c.s})`;

    // 2. scrim (bottom gradient behind captions / title)
    els.scrim.style.opacity = st.scrim.toFixed(3);
    els.scrim.style.setProperty('--scrim-top', `${st.scrimTop}px`);
    els.scrim.style.setProperty('--scrim-len', `${st.scrimLen}px`);

    // 3. highlight rings (positions come from the real, transformed DOM)
    st.rings.forEach((r, i) => {
      let el = ringPool[i];
      if (!el) { el = document.createElement('div'); el.className = 'ov-ring'; els.rings.appendChild(el); ringPool[i] = el; }
      const rc = rectOf(r);
      if (!rc || r.o <= 0.001) { el.style.opacity = 0; return; }
      const pad = (r.pad ?? 8);
      const sc = 1 + 0.06 * (1 - r.o);
      el.style.left = `${rc.x - pad}px`; el.style.top = `${rc.y - pad}px`;
      el.style.width = `${rc.w + 2 * pad}px`; el.style.height = `${rc.h + 2 * pad}px`;
      el.style.opacity = r.o.toFixed(3);
      el.style.transform = `scale(${sc})`;
      el.style.setProperty('--ring', r.color || '#c0f46d');
      el.style.borderRadius = `${r.radius ?? 12}px`;
    });
    for (let i = st.rings.length; i < ringPool.length; i++) ringPool[i].style.opacity = 0;

    // 4. listbox (stand-in for the OS dropdown, built from the real <option> elements)
    const lb = st.listbox;
    if (lb && lb.o > 0.001) {
      const sel = document.querySelector(lb.sel);
      const r = sel.getBoundingClientRect();
      const opts = [...sel.options];
      if (els.listbox.dataset.sel !== lb.sel) {
        els.listbox.innerHTML = opts.map((o) => `<div class="ov-opt">${o.textContent}</div>`).join('');
        els.listbox.dataset.sel = lb.sel;
      }
      els.listbox.style.left = `${r.left}px`;
      els.listbox.style.top = `${r.bottom + 4 * c.s}px`;
      els.listbox.style.minWidth = `${Math.max(r.width, 230 * c.s)}px`;
      els.listbox.style.fontSize = `${14 * c.s}px`;
      els.listbox.style.opacity = lb.o.toFixed(3);
      els.listbox.style.transform = `translateY(${(1 - lb.o) * -6}px)`;
      [...els.listbox.children].forEach((d, i) => {
        d.classList.toggle('hover', i === lb.hover);
        d.classList.toggle('current', opts[i].value === sel.value);
      });
    } else {
      els.listbox.style.opacity = 0;
    }

    // 5. title card (intro)
    const T = st.title;
    els.title.style.opacity = T.o.toFixed(3);
    els.title.querySelectorAll('div').forEach((d, i) => {
      const p = T.p[i];
      d.style.opacity = p.toFixed(3);
      d.style.transform = `translateY(${(1 - p) * 26}px)`;
      d.style.filter = `blur(${((1 - p) * 8).toFixed(2)}px)`;
    });

    // 6. weeks list + final statement (ending)
    const W = st.weeks;
    if (els.weeks.childElementCount !== W.items.length) {
      els.weeks.innerHTML = W.items.map((it) => `<div class="ov-week"><b>${it.k}</b><span>${it.v}</span></div>`).join('');
    }
    [...els.weeks.children].forEach((d, i) => {
      const p = W.p[i] || 0;
      d.style.opacity = p.toFixed(3);
      d.style.transform = `translateX(${(1 - p) * -30}px)`;
      d.classList.toggle('active', i === W.active);
    });
    els.final.style.opacity = st.final.o.toFixed(3);
    els.final.style.transform = `translate(-50%, ${(1 - st.final.o) * 24}px)`;
    els.final.style.filter = `blur(${((1 - st.final.o) * 6).toFixed(2)}px)`;
    els.final.querySelector('.ov-final-t').textContent = st.final.text;

    // 7. caption (lower third)
    const C = st.caption;
    if (C && C.o > 0.001) {
      if (capC.dataset.text !== C.text) { capC.innerHTML = C.html || C.text; capC.dataset.text = C.text; }
      capK.textContent = C.kicker || '';
      capK.style.display = C.kicker ? '' : 'none';
      els.caption.style.opacity = C.o.toFixed(3);
      els.caption.style.transform = `translate(-50%, ${(1 - C.o) * 22}px)`;
      els.caption.style.filter = `blur(${((1 - C.o) * 6).toFixed(2)}px)`;
    } else {
      els.caption.style.opacity = 0;
    }

    // 8. cursor + click ripple (hotspot = arrow tip at 3,2 in the SVG)
    const K = st.cursor;
    els.cursor.style.opacity = K.o.toFixed(3);
    els.cursor.style.transform = `translate(${K.x - 3}px, ${K.y - 2}px) scale(${K.press})`;
    if (K.ripple > 0 && K.ripple < 1) {
      const R = 10 + K.ripple * 44;
      els.ripple.style.opacity = ((1 - K.ripple) * 0.9).toFixed(3);
      els.ripple.style.width = els.ripple.style.height = `${R * 2}px`;
      els.ripple.style.left = `${K.rx - R}px`;
      els.ripple.style.top = `${K.ry - R}px`;
    } else {
      els.ripple.style.opacity = 0;
    }
  }

  function rects(specs) {
    return specs.map((s) => rectOf(s));
  }

  window.__ov = { update, rects };
})();

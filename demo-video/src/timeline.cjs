// Scene script for the AI Algorithm Visualizer demo (silent, 1920x1080, 160 s).
// Every result on screen comes from real clicks in the unmodified app; probes record
// what the app actually displayed to out/facts.json so captions can be checked against it.
'use strict';
const { Timeline } = require('./engine.cjs');

const K_ASTAR = '2-апта · A*, BFS, DFS';
const K_HILL = '3-апта · Hill Climbing';
const K_MM = '4-апта · Minimax';
const PURPLE = '#bf9bff';

// Camera framings in page pixels (layout of the app at a 1920 px wide viewport).
// `top` is the page y shown at the top edge of the frame; each one sits in a gap between
// text rows of BOTH columns so no line of the interface is cut by the frame edge.
const shot = (s, top, cx = 960) => ({ to: { s, cx, cy: top + 540 / s } });
const SHOT = {
  home: { to: { s: 1, cx: 960, cy: 520 } },
  tabs: shot(1.05, 100), // hero + tabs + top of the panel
  aMain: shot(1.25, 547), // select, grid, playbar, metrics, seed controls
  aCompare: shot(1.58, 1131), // legend → comparison table, with metrics and status on the right
  hMain: shot(1.5, 497), // bars, playbar, values / start index / apply
  hHistory: shot(1.13, 497), // bars + step history
  hRestartWide: shot(1.45, 1005), // history + Random Restart box
  hRestart: shot(1.56, 1180), // Random Restart table
  mMain: shot(1.3, 390), // difficulty, board, turn text, AI metrics
  mTree: shot(1.75, 1128, 930), // decision tree
  end: shot(1.0, 270, 731), // tabs + panel, leaves the left side for the summary list
};

const opt = (i) => ({ sel: '#ov-listbox .ov-opt', nth: i, ax: 0.35 });
const cell = (n) => ({ sel: `#ttt button:nth-child(${n})`, ax: 0.5, ay: 0.55 });
const text = (id) => `document.getElementById('${id}').textContent`;
const aMetrics = `({count: ${text('a-count')}, cost: ${text('a-cost')}, f: ${text('a-f')}, status: ${text('a-status')}})`;
const metricRows12 = ['#astar .metrics > div:nth-child(1)', '#astar .metrics > div:nth-child(2)'];

module.exports = function build() {
  const T = new Timeline();
  T.duration = 160;
  T.camStart = { ...SHOT.home.to };

  // ───────────── 0:00–0:12 · Title over the real home page ─────────────
  T.cam(0, 0, { ...SHOT.home, drift: 0.004, anchorY: 540 });
  T.titleKeys = { t0: 0, t1: 10.4, out: 0.7, lines: [0.2, 1.1, 1.9] };
  T.scrim(0, 430, 260, 0);
  T.cursor(4.6, 1, 0.4);
  T.move(4.6, 1.1, { sel: '[data-panel=astar]', ax: 0.42, ay: 0.62 });
  T.move(6.3, 0.8, { sel: '[data-panel=hill]', ax: 0.42, ay: 0.62 });
  T.move(7.8, 0.8, { sel: '[data-panel=minimax]', ax: 0.42, ay: 0.62 });
  T.ring(5.5, 6.9, { sel: '[data-panel=astar]', pad: 6 });
  T.ring(7.0, 8.4, { sel: '[data-panel=hill]', pad: 6 });
  T.ring(8.5, 10.0, { sel: '[data-panel=minimax]', pad: 6 });

  // ───────────── 0:12–1:00 · A*, BFS, DFS ─────────────
  T.scrim(10.39, 845, 90, 0);
  T.scrim(10.4, 845, 90, 1, 0.8);
  T.cam(10.2, 2.0, { ...SHOT.aMain, driftX: -1.2 });
  T.move(10.9, 1.1, { sel: '#a-step' });
  T.caption(12.2, 19.6, 'A*: f(n) = g(n) + h(n)', K_ASTAR, 'A*: <em>f(n) = g(n) + h(n)</em>');
  [12.6, 13.6, 14.6, 15.6, 16.6].forEach((t) => T.click(t));
  T.ring(12.9, 19.3, { sel: '#astar .metrics > div:nth-child(3)', pad: 8 });
  T.probe(17.2, 'astar_after_5_steps', aMetrics);
  // speed slider → 20 ms per step (fastest), then run the animation
  T.move(17.3, 0.7, { sel: '#speed', ax: 0.271 });
  T.ring(17.6, 19.4, { sel: '#astar .playbar label', pad: 6 });
  T.drag(18.25, 0.45, { sel: '#speed', ax: 0, dx: -6, arc: 0 });
  T.probe(19.0, 'speed_fast_ms', `document.getElementById('speed').value`);
  T.move(19.0, 0.75, { sel: '#a-run' });
  T.click(19.95);
  T.move(20.6, 0.6, { sel: '#a-run', ax: 0.8, ay: 1.75 });
  T.ring(22.1, 24.4, { sel: metricRows12, pad: 8 });
  T.probe(22.3, 'astar_result', aMetrics);

  // BFS
  T.move(24.2, 0.85, { sel: '#a-algo', ax: 0.5 });
  T.click(25.2, { real: false });
  T.listbox(25.25, 26.4, '#a-algo', [{ t: 25.25, i: 0 }, { t: 25.75, i: 1 }]);
  T.move(25.4, 0.4, opt(1));
  T.click(26.1, { real: false });
  T.select(26.2, '#a-algo', 'bfs');
  T.caption(25.6, 32.4, 'BFS: түйіндерді қабатпен зерттейді', K_ASTAR, 'BFS: <em>түйіндерді қабатпен</em> зерттейді');
  T.move(26.6, 0.8, { sel: '#a-run' });
  T.click(27.6);
  T.move(28.2, 0.6, { sel: '#a-run', ax: 0.8, ay: 1.75 });
  T.ring(31.6, 33.2, { sel: metricRows12, pad: 8 });
  T.probe(31.7, 'bfs_result', aMetrics);

  // DFS
  T.move(32.3, 0.85, { sel: '#a-algo', ax: 0.5 });
  T.click(33.3, { real: false });
  T.listbox(33.35, 34.5, '#a-algo', [{ t: 33.35, i: 1 }, { t: 33.85, i: 2 }]);
  T.move(33.5, 0.4, opt(2));
  T.click(34.2, { real: false });
  T.select(34.3, '#a-algo', 'dfs');
  T.caption(33.7, 40.7, 'DFS: бір тармақтың тереңіне жүреді', K_ASTAR, 'DFS: <em>бір тармақтың тереңіне</em> жүреді');
  T.move(34.5, 0.65, { sel: '#speed', ax: 0.1 });
  T.ring(34.9, 36.4, { sel: '#astar .playbar label', pad: 6 });
  T.drag(35.25, 0.4, { sel: '#speed', ax: 0.271, arc: 0 });
  T.probe(35.9, 'speed_dfs_ms', `document.getElementById('speed').value`);
  T.move(35.9, 0.6, { sel: '#a-run' });
  T.click(36.6);
  T.move(37.2, 0.6, { sel: '#a-run', ax: 0.8, ay: 1.75 });
  T.ring(39.9, 41.4, { sel: metricRows12, pad: 8 });
  T.probe(40.2, 'dfs_result', aMetrics);

  // Compare the three algorithms on the same map
  T.cam(40.9, 1.5, { ...SHOT.aCompare, drift: 0.001 });
  T.move(41.2, 0.9, { sel: '#a-compare' });
  T.click(42.4);
  T.probe(42.6, 'comparison_table', `[...document.querySelectorAll('#a-comparison tr')].map(r => [...r.children].map(c => c.textContent))`);
  T.move(42.9, 0.7, { sel: '#a-compare', ax: 0.6, ay: 1.75 });
  T.caption(43.2, 49.0, 'DFS ең қысқа жолға кепілдік бермейді', K_ASTAR, 'DFS <i>ең қысқа жолға</i> кепілдік бермейді');
  T.ring(43.5, 48.8, { sel: ['#a-comparison tbody tr:nth-child(1) td:nth-child(2)', '#a-comparison tbody tr:nth-child(2) td:nth-child(2)'], pad: 6 });
  T.ring(44.3, 48.8, { sel: '#a-comparison tbody tr:nth-child(3)', pad: 4, color: PURPLE });

  // Seed-generated map (back to A*, new seed, A* result on the generated map)
  T.cam(48.8, 1.6, { ...SHOT.aMain, driftX: 1.2 });
  T.move(49.0, 0.95, { sel: '#a-algo', ax: 0.5 });
  T.click(50.05, { real: false });
  T.listbox(50.1, 51.05, '#a-algo', [{ t: 50.1, i: 2 }, { t: 50.5, i: 0 }]);
  T.move(50.25, 0.35, opt(0));
  T.click(50.8, { real: false });
  T.select(50.9, '#a-algo', 'astar');
  T.move(51.2, 0.8, { sel: '#a-seed', ax: 0.3 });
  T.click(52.1);
  T.key(52.35, 'Control+A');
  T.type(52.6, '2026', 0.13);
  T.caption(52.3, 58.4, 'Бір seed — бірдей карта', K_ASTAR, 'Бір <em>seed</em> — бірдей карта');
  T.ring(52.4, 54.4, { sel: '#a-seed', pad: 6 });
  T.move(53.3, 0.7, { sel: '#a-random' });
  T.click(54.2);
  T.probe(54.4, 'seed_status', text('a-status'));
  T.move(54.8, 0.85, { sel: '#a-finish' });
  T.click(55.9);
  T.move(56.4, 0.6, { sel: '#a-finish', ax: 0.75, ay: 1.75 });
  T.ring(56.2, 58.4, { sel: metricRows12, pad: 8 });
  T.probe(56.3, 'seed_astar_result', aMetrics);

  // ───────────── 1:00–1:45 · Hill Climbing ─────────────
  T.cam(58.3, 1.4, SHOT.tabs);
  T.move(58.6, 0.9, { sel: '[data-panel=hill]', ax: 0.4 });
  T.click(59.7);
  T.cam(60.0, 1.5, { ...SHOT.hMain, driftX: -1 });
  T.move(60.6, 0.9, { sel: '#h-values', ax: 0.8 });
  T.ring(61.2, 63.2, { sel: '#h-values', pad: 6 });
  T.move(62.4, 0.6, { sel: '#h-start', ax: 0.3 });
  T.caption(62.9, 67.4, 'Бастапқы индекс: 0', K_HILL, 'Бастапқы индекс: <em>0</em>');
  T.ring(63.1, 67.0, { sel: '#h-start', pad: 6 });
  T.ring(63.4, 67.0, { sel: '#bars button:nth-child(1)', pad: 6 });
  T.move(63.8, 0.5, { sel: '#h-apply' });
  T.click(64.5);
  T.move(65.0, 0.85, { sel: '#h-step' });
  T.click(66.0);
  T.click(67.1);
  T.caption(67.6, 71.8, 'Жергілікті максимум: 7', K_HILL, 'Жергілікті максимум: <em>7</em>');
  T.ring(67.8, 71.6, { sel: '#bars button:nth-child(3)', pad: 6 });
  T.click(69.9); // one more step: nothing changes, the search has stopped
  T.probe(70.2, 'hill_start0', `({status: ${text('h-status')}, current: ${text('h-current')}, steps: ${text('h-count')}, history: [...document.querySelectorAll('#h-history tr')].map(r => [...r.children].map(c => c.textContent))})`);
  T.cam(71.5, 1.3, SHOT.hHistory);
  T.caption(72.0, 77.2, 'Жақсырақ көрші жоқ. Іздеу тоқтайды', K_HILL);
  T.ring(72.5, 76.9, { sel: '#bars button:nth-child(2)', pad: 5, color: PURPLE });
  T.ring(72.5, 76.9, { sel: '#bars button:nth-child(4)', pad: 5, color: PURPLE });
  T.ring(73.2, 76.9, { sel: '#h-history tbody tr:last-child', pad: 4 });
  T.cam(77.0, 1.2, { ...SHOT.hMain, driftX: 1 });
  T.move(77.2, 0.85, { sel: '#h-start', ax: 0.3 });
  T.click(78.3);
  T.key(78.55, 'Control+A');
  T.type(78.8, '5');
  T.move(79.1, 0.7, { sel: '#h-apply' });
  T.click(80.0);
  T.move(80.4, 0.85, { sel: '#h-run' });
  T.click(81.5);
  T.caption(81.8, 86.6, 'Ғаламдық максимум: 9', K_HILL, 'Ғаламдық максимум: <em>9</em>');
  T.ring(81.9, 86.4, { sel: '#bars button:nth-child(7)', pad: 6 });
  T.probe(81.8, 'hill_start5', `({status: ${text('h-status')}, current: ${text('h-current')}, steps: ${text('h-count')}})`);
  // Random Restart
  T.cam(86.5, 1.5, SHOT.hRestartWide);
  T.move(86.9, 1.0, { sel: '#h-restart' });
  T.click(88.2);
  T.cam(88.45, 1.3, { ...SHOT.hRestart, drift: 0.0012 });
  T.probe(88.5, 'restart_table', `({summary: document.querySelector('#h-restarts p').textContent, rows: [...document.querySelectorAll('#h-restarts tr')].map(r => [...r.children].map(c => c.textContent))})`);
  T.move(89.0, 0.9, { sel: '#h-restarts .restart-choices', ax: 0.97, ay: 0.5 });
  T.caption(88.9, 94.4, 'Бірнеше бастапқы орыннан іздеу', K_HILL);
  T.ring(89.3, 94.2, { sel: ['#h-restarts thead th:nth-child(2)', '#h-restarts tbody tr:last-child td:nth-child(2)'], pad: 6 });
  T.caption(94.6, 100.8, 'Ғаламдық максимумға кепілдік жоқ', K_HILL, 'Ғаламдық максимумға <i>кепілдік жоқ</i>');
  T.ring(94.8, 100.6, { sel: '#h-restarts > p', pad: 6 });
  T.ring(95.4, 100.6, { sel: ['#h-restarts thead th:nth-child(5)', '#h-restarts tbody tr:last-child td:nth-child(5)'], pad: 6, color: PURPLE });

  // ───────────── 1:45–2:25 · Minimax ─────────────
  T.cam(100.9, 1.4, SHOT.tabs);
  T.move(101.2, 1.0, { sel: '[data-panel=minimax]', ax: 0.4 });
  T.click(102.5);
  T.cam(102.8, 1.5, { ...SHOT.mMain, driftX: -0.8 });
  T.move(103.5, 0.9, { sel: '#m-level', ax: 0.5 });
  T.click(104.6, { real: false });
  T.listbox(104.65, 105.9, '#m-level', [{ t: 104.65, i: 0 }]);
  T.move(104.85, 0.45, opt(0));
  T.click(105.6, { real: false });
  T.select(105.7, '#m-level', 'hard');
  T.move(106.1, 0.9, { sel: '#ttt', ax: 1.28, ay: 0.32 });
  T.caption(105.0, 110.2, 'Қиын режим: толық Minimax', K_MM, 'Қиын режим: <em>толық Minimax</em>');
  T.ring(106.0, 110.0, { sel: '#m-mode', pad: 6 });
  T.probe(106.2, 'mm_mode', text('m-mode'));
  T.caption(110.4, 116.8, 'Адам — X. AI — O', K_MM, 'Адам — <em>X</em>. AI — <i>O</i>');
  T.ring(110.5, 112.9, { sel: '#minimax .canvas-head .subtle', pad: 6 });
  const human = [[5, 110.8, 111.9], [3, 112.8, 113.9], [4, 114.8, 115.9], [8, 116.8, 117.9], [9, 118.8, 119.9]];
  human.forEach(([n, tm, tc], i) => {
    T.move(tm, 0.75, cell(n));
    T.click(tc);
    T.probe(tc + 0.2, `mm_move_${i + 1}`, `({board: [...document.querySelectorAll('#ttt button')].map(b => (b.childNodes[0] && b.childNodes[0].nodeType === 3 ? b.childNodes[0].textContent : '') || '.').join(''), turn: ${text('m-turn')}, nodes: ${text('m-nodes')}, aiCell: ${text('m-move')}, score: ${text('m-score')}})`);
  });
  T.ring(112.3, 118.2, { sel: '#minimax aside .metrics', pad: 6 });
  T.move(120.4, 0.8, { sel: '#ttt', ax: 1.28, ay: 0.55 });
  T.caption(120.3, 124.8, 'Нәтиже: тең ойын', K_MM, 'Нәтиже: <em>тең ойын</em>');
  T.ring(120.4, 124.6, { sel: '#m-turn', pad: 4 });
  // Decision tree of the last AI move
  T.cam(124.8, 1.5, { ...SHOT.mTree, drift: 0.0008 });
  T.move(125.2, 1.0, { sel: '#m-tree .tree-branch.chosen summary', ax: 0.25 });
  T.click(126.6);
  T.move(127.1, 0.8, { sel: '#m-tree .tree-branch:not(.chosen) summary', ax: 0.25 });
  T.click(128.2);
  T.probe(128.6, 'mm_tree', `({root: document.querySelector('#m-tree .tree-root').textContent, branches: [...document.querySelectorAll('#m-tree .tree-branch')].map(b => ({summary: b.querySelector('summary').textContent, chosen: b.classList.contains('chosen'), label: b.querySelector('.caption').textContent, replies: [...b.querySelectorAll('.reply-list span')].map(s => s.textContent + (s.className ? ' [' + s.className + ']' : ''))}))})`);
  T.move(128.8, 1.0, { sel: '#m-tree .tree-grid', ax: 0.86, ay: 0.42 });
  T.caption(129.4, 134.2, 'O — MAX, X — MIN', K_MM, '<i>O</i> — MAX, <em>X</em> — MIN');
  T.ring(129.6, 134.0, { sel: '#m-tree .tree-root', pad: 4 });
  T.ring(130.4, 134.0, { sel: '#m-tree .tree-branch.chosen .caption', pad: 9 });
  T.caption(134.4, 141.2, 'AI қарсыластың ең тиімді жауабын ескереді', K_MM, 'AI қарсыластың <em>ең тиімді жауабын</em> ескереді');
  T.ring(134.6, 141.0, { sel: '#m-tree .tree-branch.chosen', pad: 6 });
  T.ring(135.6, 141.0, { sel: '#m-tree .tree-branch:not(.chosen) .reply-list span', pad: 5, color: PURPLE });
  T.ring(136.4, 141.0, { sel: '#m-tree .tree-branch.chosen .reply-list span', pad: 5 });

  // ───────────── 2:25–2:40 · Wrap-up ─────────────
  T.scrim(141.2, 700, 220, 1, 2.0);
  T.cam(141.3, 2.2, { ...SHOT.end, drift: 0.0015 });
  T.weeks = {
    items: [
      { k: '2-апта:', v: 'A*, BFS, DFS' },
      { k: '3-апта:', v: 'Hill Climbing' },
      { k: '4-апта:', v: 'Minimax' },
    ],
    keys: [144.7, 147.7, 150.7],
    active: [{ t: 144.7, i: 0 }, { t: 147.7, i: 1 }, { t: 150.7, i: 2 }],
    until: 160.5,
  };
  T.move(142.8, 1.0, { sel: '[data-panel=astar]', ax: 0.4 });
  T.click(144.5);
  T.ring(144.7, 147.4, { sel: '[data-panel=astar]', pad: 6 });
  T.move(146.2, 0.8, { sel: '[data-panel=hill]', ax: 0.4 });
  T.click(147.5);
  T.ring(147.7, 150.4, { sel: '[data-panel=hill]', pad: 6 });
  T.move(149.2, 0.8, { sel: '[data-panel=minimax]', ax: 0.4 });
  T.click(150.5);
  T.ring(150.7, 153.4, { sel: '[data-panel=minimax]', pad: 6 });
  T.move(151.4, 1.2, { screen: { x: 1980, y: 1120 } });
  T.cursor(151.6, 0, 0.8);
  T.finalKey = { t0: 153.4, t1: 160.5, text: 'Үш түрлі аптаның AI әдістері бір қосымшада' };

  // layout dumps (only used with --layout, for choosing camera framings)
  const L = ['.intro', 'nav', '.bottom-note', '#astar .stage > *', '#astar aside > *', '#astar aside .metrics > div', '#hill .stage > *', '#hill aside > *', '#hill aside .metrics > div', '#minimax .stage > *', '#minimax aside > *', '#minimax aside .metrics > div', '#m-tree', '#m-tree .tree-branch', '#h-restarts > *', '#h-history', '#astar .workspace', '#hill .workspace', '#minimax .workspace'];
  [['a_steps', 17.0], ['a_compare', 42.6], ['a_seed', 56.6], ['h_start0', 70.5], ['h_start5', 82.2], ['h_restart', 88.7], ['mm_game', 120.2], ['mm_tree', 128.7]].forEach(([n, t]) => T.at(t, 'layout', { name: n, sels: L }));
  return T;
};

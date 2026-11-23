#!/usr/bin/env node
// Real screenshots of the unmodified AI Algorithm Visualizer.
// Serves dist/ with `python3 -m http.server` (as the project README describes), opens it in
// Chromium (Playwright), clicks through the real UI and saves element screenshots.
// Nothing is injected into the page: no overlays, no CSS changes, no scripted values.
//
//   node report/tools/screenshots.cjs <path-to-AI_Visualizer/dist> <output-dir>
'use strict';
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const DIST = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
const PORT = 8765;
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', DIST], { stdio: ['ignore', 'ignore', 'pipe'] });
  const serverLog = [];
  server.stderr.on('data', (d) => serverLog.push(String(d)));
  await sleep(800);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const text = (sel) => page.$eval(sel, (e) => e.textContent.trim());
  const rows = (sel) => page.$$eval(`${sel} tr`, (trs) => trs.map((r) => [...r.children].map((c) => c.textContent.trim())));
  const parkMouse = () => page.mouse.move(2, 2); // no hover highlight in the shot
  const facts = { url: `http://127.0.0.1:${PORT}/`, viewport: '1440x900 @2x', browser: browser.version() };

  // ── 1. A*, BFS, DFS comparison after a finished run ────────────────────────
  await page.click('[data-panel=astar]');
  await page.click('#a-example'); // «Дайын лабиринт»
  await page.selectOption('#a-algo', 'astar');
  await page.click('#a-finish'); // «Нәтижеге өту» — A* runs to the end
  await page.click('#a-compare'); // «Салыстыру»
  await parkMouse();
  facts.astar = {
    algorithm: await page.$eval('#a-algo', (s) => s.options[s.selectedIndex].text),
    explored: await text('#a-count'), length: await text('#a-cost'), f: await text('#a-f'),
    status: await text('#a-status'), comparison: await rows('#a-comparison'),
  };
  await page.locator('#astar .workspace').screenshot({ path: path.join(OUT, '01_astar_bfs_dfs.png'), animations: 'disabled' });

  // ── 2. Hill Climbing result + Random Restart ───────────────────────────────
  await page.click('[data-panel=hill]');
  await page.fill('#h-values', '1, 3, 7, 5, 4, 6, 9, 8, 2');
  await page.fill('#h-start', '0');
  await page.fill('#h-restart-count', '5');
  await page.fill('#h-seed', '42');
  await page.click('#h-restart'); // «Қайта іздеу» (applies the parameters, then 5 restarts)
  await page.click('#h-run'); // «Толық орындау» — the run from index 0 to its stop
  await parkMouse();
  facts.hill = {
    values: await page.inputValue('#h-values'), start: await page.inputValue('#h-start'),
    steps: await text('#h-count'), current: await text('#h-current'), global: await text('#h-global'),
    status: await text('#h-status'), history: await rows('#h-history'),
    restartSummary: await text('#h-restarts > p'), restarts: await rows('#h-restarts'),
  };
  await page.locator('#hill .workspace').screenshot({ path: path.join(OUT, '02_hill_climbing_restart.png'), animations: 'disabled' });

  // ── 3. Minimax with the decision tree expanded ────────────────────────────
  await page.click('[data-panel=minimax]');
  await page.selectOption('#m-level', 'hard');
  await page.selectOption('#m-first', 'human');
  await page.click('#m-reset');
  for (const cell of [5, 3]) await page.click(`#ttt button:nth-child(${cell})`); // human X; AI O answers each move
  for (const s of await page.$$('#m-tree .tree-branch summary')) await s.click(); // open every branch
  await parkMouse();
  facts.minimax = {
    level: await page.$eval('#m-level', (s) => s.options[s.selectedIndex].text),
    board: await page.$$eval('#ttt button', (bs) => bs.map((b) => (b.childNodes[0] && b.childNodes[0].nodeType === 3 ? b.childNodes[0].textContent : '') || '·').join('')),
    turn: await text('#m-turn'), nodes: await text('#m-nodes'), aiCell: await text('#m-move'), score: await text('#m-score'),
    history: await rows('#m-history'),
    tree: {
      root: await text('#m-tree .tree-root'),
      branches: await page.$$eval('#m-tree .tree-branch', (bs) => bs.map((b) => ({
        open: b.open, chosen: b.classList.contains('chosen'), summary: b.querySelector('summary').textContent,
        replies: [...b.querySelectorAll('.reply-list span')].map((s) => s.textContent + (s.className === 'worst' ? ' (min)' : '')),
      }))),
    },
  };
  await page.locator('#minimax .workspace').screenshot({ path: path.join(OUT, '03_minimax_tree.png'), animations: 'disabled' });

  facts.pageErrors = errors;
  facts.httpLog = serverLog.join('').trim().split('\n').filter(Boolean);
  fs.writeFileSync(path.join(OUT, 'screenshots_facts.json'), JSON.stringify(facts, null, 2));
  console.log(JSON.stringify(facts, null, 1));
  await browser.close();
  server.kill();
})().catch((e) => { console.error(e); process.exit(1); });

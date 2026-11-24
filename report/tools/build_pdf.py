#!/usr/bin/env python3
"""docs/REPORT_KK.md -> docs/REPORT_KK.html -> REPORT_KK.pdf (A4, Chromium print, page numbers).

The screenshots are embedded as they are (real PNGs, aspect ratio kept). Only page layout is decided here:
every figure stays together with its caption, headings stay with the text that follows them,
and the screenshot section starts together with its first figure (no half-empty page).

  python tools/build_pdf.py                      # build
  python tools/build_pdf.py --github URL         # also put the GitHub link into docs/REPORT_KK.md
"""
import argparse
import re
import subprocess
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
MD = ROOT / "docs" / "REPORT_KK.md"
GITHUB_PLACEHOLDER = "**GitHub:** _сілтеме кейін қосылады_"

# width of each screenshot on the A4 page (mm); height follows from the image's own aspect ratio
FIG_WIDTH_MM = {
    "01_astar_bfs_dfs.png": 166,
    "02_hill_climbing.png": 112,
    "03_hill_history_restart.png": 150,
    "04_minimax_board.png": 170,
    "05_minimax_tree.png": 136,
}

ap = argparse.ArgumentParser()
ap.add_argument("--github")
a = ap.parse_args()
md = MD.read_text(encoding="utf-8")
if a.github:
    md = md.replace(GITHUB_PLACEHOLDER, f"**GitHub:** [{a.github}]({a.github})")
    MD.write_text(md, encoding="utf-8")

# Python-Markdown needs an empty line before a table; the report has one table right after a paragraph.
fixed = []
for ln in md.split("\n"):
    if ln.startswith("|") and fixed and fixed[-1].strip() and not fixed[-1].startswith("|"):
        fixed.append("")
    fixed.append(ln)
# Python-Markdown would read the asterisk of two "A*" in one paragraph as emphasis; escape it (outside code spans)
text = "\n".join(fixed)
text = "".join(part if i % 2 else re.sub(r"(?<=A)\*", r"\\*", part) for i, part in enumerate(re.split(r"(`[^`]*`)", text)))
body = markdown.markdown(text, extensions=["tables", "sane_lists"])

# <p><img></p><p><em>Сурет N…</em></p>  ->  <figure><img><figcaption>Сурет N…</figcaption></figure>
def figure(m):
    src, alt, cap = m.group("src"), m.group("alt"), m.group("cap")
    w = FIG_WIDTH_MM.get(Path(src).name, 170)
    return f'<figure><img src="{src}" alt="{alt}" style="width:{w}mm"><figcaption>{cap}</figcaption></figure>'

body = re.sub(r'<p><img alt="(?P<alt>[^"]*)" src="(?P<src>[^"]+)" /></p>\s*<p><em>(?P<cap>Сурет.*?)</em></p>', figure, body, flags=re.S)
# keep "heading + actions + figure" together, and the section title + intro with the first figure
body = re.sub(r'(<h3>[^<]*</h3>\s*<p>Әрекеттер:.*?</p>\s*<figure>.*?</figure>)', r'<div class="keep">\1</div>', body, flags=re.S)
body = re.sub(r'(<h2>Скриншоттар</h2>\s*<p>.*?</p>\s*)<div class="keep">', r'<div class="keep">\1', body, flags=re.S)
# the label "Тексеру мысалдары" stays with its table
body = re.sub(r'(<p><strong>Тексеру мысалдары</strong>.*?</p>\s*<table>.*?</table>)', r'<div class="keep">\1</div>', body, flags=re.S)

css = """
body { font-family: 'Inter', 'DejaVu Sans', sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1b2430; margin: 0; }
h1 { font-size: 19pt; margin: 0 0 6pt; } h2 { font-size: 14pt; margin: 15pt 0 6pt; border-bottom: 1px solid #d5dbe3; padding-bottom: 3pt; }
h3 { font-size: 12pt; margin: 11pt 0 4pt; } h2, h3 { break-after: avoid; } p, li { margin: 3.5pt 0; orphans: 3; widows: 3; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 9.5pt; break-inside: avoid; }
th, td { border: 1px solid #c9d1db; padding: 3.5pt 6pt; text-align: left; vertical-align: top; } th { background: #eef2f6; }
code { font-family: 'JetBrains Mono', monospace; font-size: 9pt; background: #eef2f6; padding: 0 3pt; border-radius: 3px; }
a { color: #1d5fb8; }
figure { margin: 6pt 0 8pt; break-inside: avoid; text-align: center; }
figure img { display: block; height: auto; max-width: 100%; margin: 0 auto; border: 1px solid #b9c3cf; border-radius: 3px; }
figcaption { font-size: 9.5pt; font-style: italic; color: #3a4654; margin-top: 4pt; }
.keep { break-inside: avoid; }
"""
html = (f"<!doctype html><html lang='kk'><head><meta charset='utf-8'><title>Technical Report — AI Algorithm Visualizer</title>"
        f"<style>{css}</style></head><body>{body}</body></html>")
out_html = MD.with_suffix(".html")
out_html.write_text(html, encoding="utf-8")

node = r"""
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[1], { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: process.argv[2], format: 'A4', printBackground: true,
    margin: { top: '15mm', bottom: '17mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:8.5px;color:#5b6675;font-family:Inter,sans-serif"><span class=pageNumber></span> / <span class=totalPages></span></div>' });
  await b.close();
})();
"""
subprocess.run(["node", "-e", node, str(out_html), str(ROOT / "REPORT_KK.pdf")], check=True)
out_html.unlink()
print("written", ROOT / "REPORT_KK.pdf")

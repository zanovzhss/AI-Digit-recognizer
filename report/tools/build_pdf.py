#!/usr/bin/env python3
"""docs/REPORT_KK.md -> REPORT_KK.html -> REPORT_KK.pdf (A4, Chromium print). Images stay real PNG screenshots."""
import subprocess, sys
from pathlib import Path
import markdown

ROOT = Path(__file__).resolve().parent.parent
md = (ROOT / "docs" / "REPORT_KK.md").read_text(encoding="utf-8")
# Python-Markdown needs an empty line before a table; the report has one table right after a paragraph.
lines, fixed = md.split("\n"), []
for ln in lines:
    if ln.startswith("|") and fixed and fixed[-1].strip() and not fixed[-1].startswith("|"):
        fixed.append("")
    fixed.append(ln)
md = "\n".join(fixed)
body = markdown.markdown(md, extensions=["tables", "sane_lists"])
# keep every figure (heading + screenshot + explanation) on one page
import re
body = re.sub(r'(<h3>Сурет.*?)(?=<h3|<h2)', r'<section class="fig">\1</section>', body, flags=re.S)
css = """
@page { size: A4; margin: 16mm 15mm 16mm 15mm; }
body { font-family: 'Inter', 'DejaVu Sans', sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1b2430; }
h1 { font-size: 20pt; margin: 0 0 6pt; } h2 { font-size: 14pt; margin: 16pt 0 6pt; border-bottom: 1px solid #d5dbe3; padding-bottom: 3pt; }
h3 { font-size: 12pt; margin: 12pt 0 5pt; break-after: avoid; } p, li { margin: 4pt 0; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 9.5pt; } th, td { border: 1px solid #d5dbe3; padding: 4pt 6pt; text-align: left; }
th { background: #eef2f6; } code { font-family: 'JetBrains Mono', monospace; font-size: 9pt; background: #eef2f6; padding: 0 3pt; border-radius: 3px; }
img { display: block; max-width: 100%; max-height: 158mm; margin: 6pt auto; border: 1px solid #c7cfd9; border-radius: 4px; break-inside: avoid; }
p:has(> img) { break-inside: avoid; }
.fig { break-inside: avoid; }
.fig:first-of-type img { max-height: 140mm; }
"""
html = f"<!doctype html><html lang='kk'><head><meta charset='utf-8'><title>Technical Report — AI Algorithm Visualizer</title><style>{css}</style></head><body>{body}</body></html>"
out_html = ROOT / "docs" / "REPORT_KK.html"
out_html.write_text(html, encoding="utf-8")
node = """
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.argv[1], { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: process.argv[2], format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close(); })();
"""
subprocess.run(["node", "-e", node, str(out_html), str(ROOT / "REPORT_KK.pdf")], check=True)
print("written", ROOT / "REPORT_KK.pdf")

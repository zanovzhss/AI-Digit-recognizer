#!/usr/bin/env python3
"""Writes the voice-over as subtitles (out/AI_Algorithm_Visualizer_voiceover_kk.srt).
The spoken text is spelled for the TTS (Эй-стар, жиырма төрт ...); subtitles use the written forms."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WRITTEN = [
    ("«Эй-ай алгоритм визуалайзер»", "«AI Algorithm Visualizer»"), ("Эй-стар", "A*"), ("Би-эф-эс", "BFS"),
    ("Ди-эф-эс", "DFS"), ("эй-ай", "AI"), ("Хилл Клайминг", "Hill Climbing"), ("Минимакс", "Minimax"),
    ("Рэндом рестарт", "Random Restart"), ("сид", "seed"), ("жиырма төрт", "24"), ("тоқсан тоғыз", "99"),
    ("жүз сексен тоғыз", "189"), ("отыз сегіз", "38"), ("минус сегіз", "−8"), ("баға нөл", "баға 0"),
    ("Адам — икс, AI — о.", "Адам — X, AI — O."), ("О — макс, икс — мин", "O — MAX, X — MIN"),
    ("О тоғызыншыға жүрсе, икс екіншіні", "O 9-ұяшыққа жүрсе, X 2-ұяшықты"), ("екінші ұяшықты", "2-ұяшықты"),
    ("Икс қауіп", "X қауіп"),
]


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


plan = json.loads((ROOT / "out" / "voice" / "plan.json").read_text())
blocks = []
for i, line in enumerate(plan["lines"], 1):
    text = line["text"]
    for a, b in WRITTEN:
        text = text.replace(a, b)
    blocks.append(f"{i}\n{ts(line['start'])} --> {ts(line['end'])}\n{text}\n")
(ROOT / "out" / "AI_Algorithm_Visualizer_voiceover_kk.srt").write_text("\n".join(blocks), encoding="utf-8")
print("\n".join(blocks))

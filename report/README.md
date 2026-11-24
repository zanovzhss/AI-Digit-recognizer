# Отчёт со скриншотами

- `docs/REPORT_KK.md` — отчёт проекта: разделы «Іске қосу нұсқаулығы», «Скриншоттар» (5 рисунков с подписями и пояснениями) и «Қорытынды». Им заменяется `docs/REPORT_KK.md` в проекте; рядом должна лежать папка `docs/screenshots/`.
- `docs/screenshots/0*.png` — настоящие скриншоты. Сайт из ZIP запущен через `python -m http.server --directory dist` и открыт в Chromium (Playwright) в окне 1000×900 с двойной чёткостью. Рисунки 3–5 — вырезки реальной отрисовки страницы, без перерисовки.
- `docs/screenshots/screenshots_facts.json` — значения, прочитанные со страницы в момент съёмки, и журнал HTTP-сервера.
- `REPORT_KK.pdf` — тот же отчёт в формате A4, с номерами страниц и кликабельными ссылками.

Повторить:

```bash
node tools/screenshots.cjs <путь>/AI_Visualizer/dist docs/screenshots 1000
python tools/build_pdf.py                         # нужен пакет markdown
python tools/build_pdf.py --github <ссылка>       # вставить ссылку на GitHub вместо заглушки и пересобрать PDF
```

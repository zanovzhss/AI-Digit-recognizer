# Отчёт со скриншотами

- `docs/REPORT_KK.md` — отчёт проекта (`docs/REPORT_KK.md` из ZIP) с новым разделом «Скриншоттар» (3 рисунка с пояснениями) и тремя обновлёнными фразами о браузерной проверке. Файл заменяет `docs/REPORT_KK.md` в проекте; рядом нужно положить папку `docs/screenshots/`.
- `docs/screenshots/*.png` — настоящие скриншоты: сайт из ZIP запущен через `python -m http.server --directory dist`, открыт в Chromium (Playwright), 1440×900 @2x. Страница не изменялась, на неё ничего не накладывалось.
- `docs/screenshots/screenshots_facts.json` — значения, прочитанные со страницы в момент съёмки, и журнал HTTP-сервера.
- `REPORT_KK.pdf` — тот же отчёт в PDF (A4).

Повторить:

```bash
node tools/screenshots.cjs <путь>/AI_Visualizer/dist docs/screenshots
python tools/build_pdf.py     # нужен пакет markdown
```

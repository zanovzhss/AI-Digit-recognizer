# The Warm Bucket: 7 s test clip, build notes (2026-11-01)

Output: `out/cellar/final.mp4` (not in git): 1440x2560, 30 fps, 210 frames, 7.000 s, h264 crf 16 + AAC 48 kHz stereo,
-15.0 LUFS / -1.2 dBTP. QA (`scripts/short_qa.py`): no black, white, frozen or pop frames (see QA_report.md).

Pipeline as run: script + facts (SCRIPT.md) -> Piper voice + word timings (voice/) -> story.ts shot plan from
templates/bridge -> world/cast -> sound (audio/: timeline, sfx, music, mix) -> look stills + Opus max verifier round 1
(LOOK_REPORT_round1.md, all 9 fixes applied) -> final render (`--scale 1.3333333333333333`) -> mux + QA (scripts/cellar_final.sh).

Deviations from the brief / template:
- `--scale 1.3333` makes 2559.936 px, which Remotion 4.0.539 refuses (integer sizes only); rendered at exact 4/3 = 1440x2560.
- No Remotion project existed in the repo: scaffolded package.json, tsconfig, src/index.ts, src/Root.tsx (CellarShort only;
  BridgeShort does not exist here) and scripts/ from the skill templates. Rendering uses software GL (swangle), no GPU.
- Voice: Piper TTS (en_US ryan high, from the rhasspy GitHub release); word timings from Piper's phoneme alignments
  (needs the `onnx` pip package). 24 words in 6.53 s = 3.7 words/s (3.5 would overrun 7 s).
- No Kenney GLB kit here: vegetation is build.ts's own cartoon vegetation; fence posts, lantern, crate, potatoes, bucket,
  hatch are new procedural props. Houses are the template house() with a new snow option.
- Lights: shot 1 golden preset, sun turned to az 72 / el 10 (the default backlit az 6 put the whole lane behind the
  houses). Cellar shots use the golden preset with the key turned to come from the lantern (no interior preset exists).
- Snow materials (new) carry a cool self-lit share so snow stays near-white under the orange golden key; the ice
  surface is unlit (template precedent: the unlit sign face). Light presets, ink, lens, post and grade are untouched.
- toon.ts additions only: FARMER outfit, flat cap, bucket arm (`bucketHand` so the 3D bucket hangs from the drawn hand),
  crouch, reach, nod; fxSnow / fxWarm effect cards.
- Shot 3 (bucket insert): the lens stands where the farmer does, so he is out of that frame.
- No deep Opus audit after the final render (one verifier round on the stills; QA clean).

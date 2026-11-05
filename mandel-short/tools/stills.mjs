// Look-check stills for MandelShort: bundles once, renders the given frames on the GPU (ANGLE / Direct3D 11 only;
// never SwiftShader). Logs the WebGL renderer the page reports and aborts if it is not the NVIDIA GPU.
// usage: node mandel-short/tools/stills.mjs <outPrefix> <frame,frame,...> [scale]
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const chromiumOptions = { gl: "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "MandelShort", chromiumOptions });
let renderer = "";
const onBrowserLog = (l) => {
  if (l.text.startsWith("MANDEL_GL_RENDERER")) renderer = l.text;
  else if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 400));
};
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 90, scale: Number(scale),
    chromiumOptions, timeoutInMilliseconds: 240000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s", renderer);
  if (renderer && !/NVIDIA/i.test(renderer)) { console.error("GPU NOT DETECTED - stopping:", renderer); process.exit(2); }
}

import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const manifestPath = path.resolve("public", "audio", "manifest.json");
const manifestText = await readFile(manifestPath, "utf8");
const manifest = JSON.parse(manifestText.replace(/^\uFEFF/, ""));
const sceneStartMs = [0, 9533, 23833, 38100, 52600, 65133, 77000, 90100];

const normalizeCaptionText = (text) =>
  text
    .replaceAll("R-F-Q", "RFQ")
    .replaceAll("M-C-P", "MCP")
    .replace("quote readiness", "quote-readiness")
    .replace("quote ready package", "quote-ready package")
    .replace("Apache two point zero", "Apache 2.0");

const scenes = manifest.map((scene, index) => ({
  startMs: sceneStartMs[index],
  durationMs: Math.round(scene.durationSeconds * 1000),
  text: normalizeCaptionText(scene.text),
}));

const captions = [];

for (const scene of scenes) {
  const words = scene.text.split(/\s+/);
  const weights = words.map((word) => Math.max(1, word.replace(/[^\w]/g, "").length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let elapsedWeight = 0;

  words.forEach((word, index) => {
    const startMs =
      scene.startMs + (elapsedWeight / totalWeight) * scene.durationMs;
    elapsedWeight += weights[index];
    const endMs =
      scene.startMs + (elapsedWeight / totalWeight) * scene.durationMs;
    captions.push({
      text: `${index === 0 ? "" : " "}${word}`,
      startMs: Math.round(startMs),
      endMs: Math.round(endMs),
      timestampMs: null,
      confidence: null,
    });
  });
}

const outputPath = path.resolve("public", "captions.json");
await mkdir(path.dirname(outputPath), {recursive: true});
await writeFile(outputPath, `${JSON.stringify(captions, null, 2)}\n`);
process.stdout.write(`Wrote ${captions.length} caption tokens to ${outputPath}\n`);

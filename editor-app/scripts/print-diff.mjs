#!/usr/bin/env node
/**
 * Pixel-diff the preview vs. reskin print PNGs from print-audit.
 *
 * Uses pixelmatch (already a transitive dep of Playwright) with the
 * same tolerance settings as our visual regression config (threshold
 * 0.2, which tolerates anti-aliasing and sub-pixel font noise).
 *
 * Writes a diff PNG highlighting changed pixels in red so we can see
 * exactly WHERE the preview diverges from the reskin.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, "..", "print-audit");

async function loadPNG(name) {
  const buf = await readFile(resolve(dir, name));
  return PNG.sync.read(buf);
}

const pairs = [
  { a: "reskin-print.png", b: "preview-print.png", diff: "diff-print.png", label: "PRINT-MEDIA" },
  { a: "reskin-screen.png", b: "preview-screen.png", diff: "diff-screen.png", label: "SCREEN-MEDIA" },
];

console.log("\n=== Pixel-diff: preview vs. reskin ===\n");

for (const { a, b, diff, label } of pairs) {
  const imgA = await loadPNG(a);
  const imgB = await loadPNG(b);

  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    console.log(
      `[${label}] size mismatch: ${a} is ${imgA.width}x${imgA.height}, ${b} is ${imgB.width}x${imgB.height}`,
    );
    continue;
  }

  const { width, height } = imgA;
  const diffPng = new PNG({ width, height });
  const mismatched = pixelmatch(
    imgA.data,
    imgB.data,
    diffPng.data,
    width,
    height,
    { threshold: 0.2, includeAA: false },
  );

  const totalPixels = width * height;
  const ratio = mismatched / totalPixels;
  const pct = (ratio * 100).toFixed(3);

  await writeFile(resolve(dir, diff), PNG.sync.write(diffPng));

  console.log(`[${label}] ${a} vs ${b}`);
  console.log(`  size:       ${width}x${height} (${totalPixels.toLocaleString()} px)`);
  console.log(`  different:  ${mismatched.toLocaleString()} px (${pct}%)`);
  console.log(`  diff image: ${resolve(dir, diff)}`);
  console.log("");
}

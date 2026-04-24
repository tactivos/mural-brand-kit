#!/usr/bin/env node
/**
 * Print-fidelity audit.
 *
 * Generates two artifacts each for the editor's /preview route and the
 * canonical static reskin:
 *
 *   1. An 8.5 × 11 in PDF produced through Chromium's real print
 *      pipeline (page.pdf()). This is the same engine the browser
 *      uses for File > Print > Save as PDF — the exact pipeline our
 *      users will hit.
 *   2. A print-media-emulated PNG of the first page for quick side-
 *      by-side visual comparison in this terminal session.
 *
 * Output lands in editor-app/print-audit/ (git-ignored). Open the two
 * PDFs in Preview.app afterwards for the final eyeball pass.
 *
 * Usage:
 *   # in one terminal
 *   npm run build && npm run start -- -p 3100
 *   # in another
 *   node scripts/print-audit.mjs
 *
 * Design choice: we do NOT reuse the Playwright visual regression test
 * infrastructure because toHaveScreenshot() uses screen-media by
 * default. The point of this audit is specifically to exercise the
 * print path, which has its own CSS media context and font metrics.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const editorRoot = resolve(__dirname, "..");
const outputDir = resolve(editorRoot, "print-audit");

const PREVIEW_URL = "http://localhost:3100/preview/product-one-sheet";
const RESKIN_PATH = resolve(
  repoRoot,
  "reskins/product-one-sheet/mural-overview.html",
);
const RESKIN_URL = pathToFileURL(RESKIN_PATH).toString();

const PDF_OPTS = {
  format: "Letter",        // 8.5 × 11 in
  printBackground: true,   // without this, .brand-bar colors drop
  preferCSSPageSize: true, // honor any @page rule in the document
  margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
};

const SCREENSHOT_OPTS = {
  fullPage: true,
  // 8.5 × 11 in @ 96dpi = 816 × 1056 px. Using the same viewport as
  // the Playwright visual regression config keeps screenshots
  // directly comparable to existing goldens.
  type: "png",
};

async function render(browser, label, url) {
  const page = await browser.newPage({
    viewport: { width: 816, height: 1056 },
    deviceScaleFactor: 2,
  });

  await page.goto(url, { waitUntil: "networkidle" });

  // Let fonts settle. Paged.js / @font-face can relayout after fonts
  // flip from fallback to installed; without this we sometimes catch
  // the fallback pass and everything looks half a line off.
  await page.waitForTimeout(600);

  const pdfPath = resolve(outputDir, `${label}.pdf`);
  const pngScreenPath = resolve(outputDir, `${label}-screen.png`);
  const pngPrintPath = resolve(outputDir, `${label}-print.png`);

  // Screen-media screenshot first (what the user sees in their tab).
  await page.emulateMedia({ media: "screen" });
  const screenBytes = await page.screenshot(SCREENSHOT_OPTS);
  await writeFile(pngScreenPath, screenBytes);

  // Print-media screenshot — CSS @media print rules are now active.
  await page.emulateMedia({ media: "print" });
  const printBytes = await page.screenshot(SCREENSHOT_OPTS);
  await writeFile(pngPrintPath, printBytes);

  // Actual PDF via Chromium's print pipeline.
  const pdfBytes = await page.pdf(PDF_OPTS);
  await writeFile(pdfPath, pdfBytes);

  await page.close();

  const pdfStat = await stat(pdfPath);
  const pngScreenStat = await stat(pngScreenPath);
  const pngPrintStat = await stat(pngPrintPath);

  return {
    label,
    url,
    pdfPath,
    pdfBytes: pdfStat.size,
    pngScreenPath,
    pngScreenBytes: pngScreenStat.size,
    pngPrintPath,
    pngPrintBytes: pngPrintStat.size,
  };
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  let results;
  try {
    results = [
      await render(browser, "preview", PREVIEW_URL),
      await render(browser, "reskin", RESKIN_URL),
    ];
  } finally {
    await browser.close();
  }

  console.log("\n=== Print-fidelity audit ===\n");
  for (const r of results) {
    console.log(`[${r.label}]`);
    console.log(`  url:         ${r.url}`);
    console.log(`  pdf:         ${r.pdfPath}`);
    console.log(`               ${fmt(r.pdfBytes)}`);
    console.log(`  screen png:  ${r.pngScreenPath}`);
    console.log(`               ${fmt(r.pngScreenBytes)}`);
    console.log(`  print png:   ${r.pngPrintPath}`);
    console.log(`               ${fmt(r.pngPrintBytes)}`);
    console.log("");
  }

  console.log("Next step: open both PDFs in Preview.app side-by-side.");
  console.log(`  open ${results[0].pdfPath} ${results[1].pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

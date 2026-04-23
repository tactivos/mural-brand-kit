import { defineConfig, devices } from "@playwright/test";

/**
 * Visual-regression config for the Mural PDF Generator.
 *
 * Scope (v0): Product one-sheet reskin only. This is the "golden" capture
 * pass — we screenshot existing static HTML reskins BEFORE any React code
 * lands, so we have pure baselines unaffected by the new editor.
 *
 * Platform pinning: Playwright suffixes snapshot filenames with the project
 * name and OS. Goldens in this repo are macOS/darwin snapshots captured with
 * the system's installed fonts. Running on Linux will produce different
 * goldens (different font fallbacks); if CI on Linux is added later, either
 * commit platform-specific goldens or run CI on macOS.
 *
 * Rollback: `git revert` the commit that adds this file and the snapshot
 * directory. No runtime impact on the existing HTML files.
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  workers: 1,
  reporter: [["list"]],

  // Consider screenshots equal if <= 0.5% of pixels differ. Anti-aliasing
  // and sub-pixel font rendering produce tiny deltas across runs; we care
  // about structural drift, not sub-pixel noise.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
      threshold: 0.2,
      animations: "disabled",
      caret: "hide",
    },
  },

  use: {
    ...devices["Desktop Chrome"],
    // 8.5 x 11 in @ 96dpi = 816 x 1056 px. Use 2x scale factor for
    // retina-quality diffs.
    viewport: { width: 816, height: 1056 },
    deviceScaleFactor: 2,
    // Reskins use file:// URLs; no base URL needed.
  },

  projects: [
    {
      name: "reskins-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

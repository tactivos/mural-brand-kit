import { test, expect } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

/**
 * Reskins covered by visual-regression.
 *
 * v0 scope: Product one-sheet only (matches the editor v1 scope in
 * EDITOR-COMPONENT-INVENTORY.md). Extend this list when additional doc
 * types come online.
 */
const RESKINS = [
  {
    name: "product-one-sheet/mural-overview",
    path: "reskins/product-one-sheet/mural-overview.html",
  },
] as const;

for (const reskin of RESKINS) {
  test(`reskin: ${reskin.name}`, async ({ page }) => {
    const fileUrl = pathToFileURL(resolve(REPO_ROOT, reskin.path)).href;

    await page.goto(fileUrl, { waitUntil: "networkidle" });

    // Wait for fonts to fully load so the golden captures final glyphs,
    // not fallback placeholders mid-swap.
    await page.evaluate(() => document.fonts.ready);

    // Screenshot each .page element individually. Multi-page docs will
    // produce one PNG per page, each with a stable filename derived from
    // its index.
    const pages = page.locator(".page");
    const count = await pages.count();
    expect(count, `${reskin.name} must have at least one .page`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const el = pages.nth(i);
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveScreenshot(
        `${reskin.name.replace(/\//g, "__")}__page-${i + 1}.png`,
      );
    }
  });
}

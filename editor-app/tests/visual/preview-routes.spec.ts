import { test, expect } from "@playwright/test";

/**
 * Visual regression for the editor's /preview print routes.
 *
 * Each /preview route renders a canonical MuralDoc fixture through our React
 * components. The golden captures what the editor's print target actually
 * produces. A separate spec (reskins.spec.ts) captures goldens for the
 * static HTML reskins that pre-date the editor.
 *
 * Comparing /preview to the static reskin is a human review exercise, not
 * an automated test — there are known, intentional content-model trade-offs
 * (no forced <br> line breaks in blockquotes, etc.) that produce small,
 * acceptable diffs. Both goldens must remain stable on their own.
 */

const PREVIEW_ROUTES = [
  { name: "product-one-sheet", path: "/preview/product-one-sheet" },
] as const;

for (const route of PREVIEW_ROUTES) {
  test(`preview: ${route.name}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const pages = page.locator(".page");
    const count = await pages.count();
    expect(count, `${route.name} must have at least one .page`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const el = pages.nth(i);
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveScreenshot(`preview__${route.name}__page-${i + 1}.png`);
    }
  });
}

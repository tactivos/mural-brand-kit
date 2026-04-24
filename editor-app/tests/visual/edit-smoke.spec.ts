import { test, expect } from "@playwright/test";

/**
 * /edit smoke test — verifies Puck mounts cleanly and the seed content
 * renders inside the canvas. Not a visual regression; the editor UI
 * will iterate faster than goldens can keep up.
 */
test("/edit mounts Puck and renders seed components", async ({ page }) => {
  const jsErrors: Error[] = [];
  page.on("pageerror", (error) => jsErrors.push(error));

  await page.goto("/edit", { waitUntil: "networkidle" });

  // Page chrome from root.render — presence-in-DOM is the invariant;
  // toBeVisible() is too strict for Puck's canvas wrapping layers.
  await expect(page.locator(".page")).toHaveCount(1);
  await expect(page.locator(".brand-bar")).toHaveCount(1);
  await expect(page.locator(".brand-bar > span")).toHaveCount(5);
  await expect(page.locator(".page-footer")).toHaveCount(1);

  // Editable content from the muralOverviewFixture (loaded via the
  // MuralDoc -> Puck adapter). These strings will survive light edits
  // to the fixture; if the smoke test starts failing unexpectedly, the
  // adapter is the first place to look.
  await expect(page.locator(".page-meta .left")).toContainText("Product overview");
  await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");
  await expect(page.locator(".intro-copy p").first()).toContainText(
    "When ideas are visible",
  );
  // CombinedGrid: the content slot should have at least one BodyCopy
  // subhead, and the quote slot should have the Bo Storozuk attribution.
  await expect(page.locator(".body-copy p").first()).toContainText(
    "You need an enterprise-grade platform",
  );
  await expect(page.locator(".quote-attribution")).toContainText("Bo Storozuk");
  // LogoStrip: 8 logo boxes end up on the page (via the fixture).
  await expect(page.locator(".logo-strip .logo-box.has-logo")).toHaveCount(8);

  expect(jsErrors, `Unexpected JS errors: ${jsErrors.map((e) => e.message).join(", ")}`).toHaveLength(0);
});

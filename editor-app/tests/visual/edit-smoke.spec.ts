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

  // Editable content from initialData.content and root fields
  await expect(page.locator(".page-meta .left")).toContainText("Product overview");
  await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");
  await expect(page.locator(".body-copy p")).toContainText("When ideas are visible");

  expect(jsErrors, `Unexpected JS errors: ${jsErrors.map((e) => e.message).join(", ")}`).toHaveLength(0);
});

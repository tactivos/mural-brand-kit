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

  await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");
  await expect(page.locator(".eyebrow")).toContainText("Product overview");
  await expect(page.locator(".body-copy p")).toContainText("When ideas are visible");

  expect(jsErrors, `Unexpected JS errors: ${jsErrors.map((e) => e.message).join(", ")}`).toHaveLength(0);
});

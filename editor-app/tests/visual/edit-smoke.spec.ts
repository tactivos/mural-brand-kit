import { test, expect } from "@playwright/test";

/**
 * /edit smoke test — verifies Puck mounts cleanly and the seed content
 * renders inside the canvas. Not a visual regression; the editor UI
 * will iterate faster than goldens can keep up.
 *
 * Scoping note: as of the unified edit/preview shell (`.edit-shell`),
 * the page mounts BOTH Puck and the preview surface in the DOM
 * simultaneously and toggles them with `display: none`. This means
 * `.page`, `.brand-bar`, etc. each appear twice on the document.
 * We scope the smoke assertions to `.edit-shell__edit` (the Puck
 * subtree) so the test still validates exactly what it used to:
 * "Puck mounted and rendered the fixture content."
 */
test("/edit mounts Puck and renders seed components", async ({ page }) => {
  const jsErrors: Error[] = [];
  page.on("pageerror", (error) => jsErrors.push(error));

  await page.goto("/edit", { waitUntil: "networkidle" });

  const editPane = page.locator(".edit-shell__edit");

  // Page chrome from root.render — presence-in-DOM is the invariant;
  // toBeVisible() is too strict for Puck's canvas wrapping layers.
  await expect(editPane.locator(".page")).toHaveCount(1);
  await expect(editPane.locator(".brand-bar")).toHaveCount(1);
  await expect(editPane.locator(".brand-bar > span")).toHaveCount(5);
  await expect(editPane.locator(".page-footer")).toHaveCount(1);

  // Editable content from the muralOverviewFixture (loaded via the
  // MuralDoc -> Puck adapter). These strings will survive light edits
  // to the fixture; if the smoke test starts failing unexpectedly, the
  // adapter is the first place to look.
  await expect(editPane.locator(".page-meta .left")).toContainText("Product overview");
  await expect(editPane.locator("h1")).toContainText("Make it a mural, not a meeting.");
  await expect(editPane.locator(".intro-copy p").first()).toContainText(
    "When ideas are visible",
  );
  // CombinedGrid: the content slot should have at least one BodyCopy
  // subhead, and the quote slot should have the Bo Storozuk attribution.
  await expect(editPane.locator(".body-copy p").first()).toContainText(
    "You need an enterprise-grade platform",
  );
  await expect(editPane.locator(".quote-attribution")).toContainText("Bo Storozuk");
  // LogoStrip: 8 logo boxes end up on the page (via the fixture).
  await expect(editPane.locator(".logo-strip .logo-box.has-logo")).toHaveCount(8);

  expect(jsErrors, `Unexpected JS errors: ${jsErrors.map((e) => e.message).join(", ")}`).toHaveLength(0);
});

/**
 * Toggle smoke — flipping the segmented Edit/Preview control swaps
 * which subtree is visible, while both stay mounted. This pins the
 * core promise of the unified shell: "preview = print" without
 * leaving the page.
 */
test("/edit toggles between edit and preview surfaces", async ({ page }) => {
  await page.goto("/edit", { waitUntil: "networkidle" });

  const shell = page.locator(".edit-shell");
  const editPane = page.locator(".edit-shell__edit");
  const previewPane = page.locator(".edit-shell__preview");

  await expect(shell).toHaveAttribute("data-mode", "edit");
  await expect(editPane).toBeVisible();
  await expect(previewPane).toBeHidden();

  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(shell).toHaveAttribute("data-mode", "preview");
  await expect(previewPane).toBeVisible();
  await expect(editPane).toBeHidden();
  // Preview surface shows the same fixture content the print route would.
  await expect(previewPane.locator("h1")).toContainText("Make it a mural, not a meeting.");

  await page.getByRole("tab", { name: "Edit" }).click();
  await expect(shell).toHaveAttribute("data-mode", "edit");
  await expect(editPane).toBeVisible();
});

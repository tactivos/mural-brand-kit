import { test, expect, type Page } from "@playwright/test";

/**
 * /edit persistence smoke tests.
 *
 * Scope: verify the contract between the editor and localStorage.
 *   1. Fresh browser → fixture renders.
 *   2. A MuralDoc seeded in localStorage before navigation is picked
 *      up on mount (hydration swap).
 *   3. `?reset=1` wipes storage and falls back to the fixture, and the
 *      URL is normalized so refreshes don't re-trigger the reset.
 *
 * We seed localStorage directly rather than driving a full
 * edit-and-publish round-trip through Puck's UI — Puck's inspector
 * panels change between releases and clicking fields is brittle. The
 * adapter round-trip is already pinned by the adapter unit tests; this
 * file only verifies that `/edit` talks to localStorage correctly.
 */

const STORAGE_KEY = "mural-editor:v1:product-one-sheet";

async function clearStorage(page: Page): Promise<void> {
  await page.goto("/edit");
  await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);
}

test.describe("/edit persistence", () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test("fresh browser renders the fixture", async ({ page }) => {
    await page.goto("/edit", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");
    await expect(page.locator(".page-meta .left")).toContainText("Product overview");
  });

  test("seeded localStorage is picked up on mount", async ({ page }) => {
    // Shape-preserving minimal MuralDoc with a different headline.
    // If isValidMuralDoc accepts it and the adapter runs cleanly, the
    // h1 should change.
    const seeded = {
      schemaVersion: 1,
      docType: "product-one-sheet",
      meta: {
        title: "Seeded from localStorage",
        topicLabel: "Seeded topic",
        createdAt: "2026-04-24T00:00:00.000Z",
        updatedAt: "2026-04-24T00:00:00.000Z",
      },
      pages: [
        {
          id: "page-1",
          sections: [
            {
              id: "content-section",
              type: "Content",
              strips: [
                {
                  id: "seed-body",
                  type: "BodyGroup",
                  children: [
                    {
                      id: "seed-headline",
                      type: "Headline",
                      props: {
                        text: "Seeded from localStorage",
                        level: 1,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    // Set storage first, then navigate. The navigate-then-clear dance
    // in beforeEach already put us on /edit once; we need a second
    // navigation so the hydration useEffect fires against the seeded
    // value.
    await page.evaluate(
      ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
      { key: STORAGE_KEY, value: seeded },
    );
    await page.goto("/edit", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText("Seeded from localStorage");
    await expect(page.locator(".page-meta .left")).toContainText("Seeded topic");
  });

  test("?reset=1 wipes storage and reverts to fixture, and clears the query param", async ({ page }) => {
    // Seed first so reset has something to wipe.
    const seeded = {
      schemaVersion: 1,
      docType: "product-one-sheet",
      meta: {
        title: "Doomed",
        topicLabel: "Doomed",
        createdAt: "2026-04-24T00:00:00.000Z",
        updatedAt: "2026-04-24T00:00:00.000Z",
      },
      pages: [
        {
          id: "page-1",
          sections: [
            {
              id: "s",
              type: "Content",
              strips: [
                {
                  id: "bg",
                  type: "BodyGroup",
                  children: [
                    {
                      id: "h",
                      type: "Headline",
                      props: { text: "Doomed headline", level: 1 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    await page.evaluate(
      ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
      { key: STORAGE_KEY, value: seeded },
    );

    await page.goto("/edit?reset=1", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");

    const url = new URL(page.url());
    expect(url.search).toBe("");

    const remaining = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(remaining).toBeNull();
  });

  test("corrupt JSON is recovered by falling back to the fixture", async ({ page }) => {
    await page.evaluate(
      (key) => window.localStorage.setItem(key, "{this is not json"),
      STORAGE_KEY,
    );
    await page.goto("/edit", { waitUntil: "networkidle" });

    // Fixture renders, and the corrupt blob was removed.
    await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");
    const remaining = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(remaining).toBeNull();
  });

  test("wrong schemaVersion is rejected and cleared", async ({ page }) => {
    const wrongSchema = {
      schemaVersion: 99,
      docType: "product-one-sheet",
      meta: {
        title: "Future",
        topicLabel: "Future",
        createdAt: "2026-04-24T00:00:00.000Z",
        updatedAt: "2026-04-24T00:00:00.000Z",
      },
      pages: [],
    };
    await page.evaluate(
      ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
      { key: STORAGE_KEY, value: wrongSchema },
    );
    await page.goto("/edit", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText("Make it a mural, not a meeting.");
    const remaining = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(remaining).toBeNull();
  });
});

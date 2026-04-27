import { ProductOneSheetRenderer } from "../../../src/components/preview/ProductOneSheetRenderer.js";
import { muralOverviewFixture } from "../../../src/fixtures/mural-overview.js";

/**
 * /preview/product-one-sheet — the print target for the Mural Overview fixture.
 *
 * Renders the canonical MuralDoc fixture through ProductOneSheetRenderer.
 * Output should be pixel-identical to reskins/product-one-sheet/mural-overview.html
 * (within the visual-regression tolerance), modulo the documented content-
 * model trade-offs (no forced line breaks inside quote text, etc.).
 *
 * This route has zero editor chrome — it's the page the user prints from via
 * `File > Print > Save as PDF`.
 *
 * The same renderer is used by /edit's Preview mode (see app/edit/page.tsx),
 * which guarantees that what the user sees while editing matches what they
 * print, regardless of which surface they print from.
 */
export default function ProductOneSheetPreview() {
  return <ProductOneSheetRenderer doc={muralOverviewFixture} />;
}

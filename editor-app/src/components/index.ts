/**
 * editor-app/src/components — React components that emit pattern-library HTML.
 *
 * Public entry point. Consumers should import from here, not from submodules.
 *
 * Invariant: every component in this tree emits HTML and class names that
 * are byte-identical to the static pattern library. Styling comes exclusively
 * from editor-app/styles/brand.css. No CSS-in-JS.
 */

export { BrandBar } from "./page-chrome/BrandBar.js";
export { PageFooter } from "./page-chrome/PageFooter.js";
export type { PageFooterRenderProps } from "./page-chrome/PageFooter.js";
export { PageNumber } from "./page-chrome/PageNumber.js";

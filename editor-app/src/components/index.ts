/**
 * editor-app/src/components — React components that emit pattern-library HTML.
 *
 * Public entry point. Consumers should import from here, not from submodules.
 *
 * Invariant: every component in this tree emits HTML and class names that
 * are byte-identical to the static pattern library. Styling comes exclusively
 * from editor-app/styles/brand.css. No CSS-in-JS.
 */

// Page chrome
export { BrandBar } from "./page-chrome/BrandBar.js";
export { PageFooter } from "./page-chrome/PageFooter.js";
export type { PageFooterRenderProps } from "./page-chrome/PageFooter.js";
export { PageNumber } from "./page-chrome/PageNumber.js";

// Structural wrappers
export { Page, PageInner, PageMeta, Document } from "./structure/Page.js";

// Sections
export { OpenerSection } from "./sections/OpenerSection.js";
export { ContentSection } from "./sections/ContentSection.js";

// Strips
export { CombinedGrid } from "./strips/CombinedGrid.js";
export { StatBand, StatBandRule } from "./strips/StatBand.js";
export { LogoStrip } from "./strips/LogoStrip.js";

// Text elements
export { Headline } from "./elements/Headline.js";
export { SubHeading, SectionHeading } from "./elements/SubHeading.js";
export { Eyebrow } from "./elements/Eyebrow.js";
export { Deck } from "./elements/Deck.js";
export { IntroCopy } from "./elements/IntroCopy.js";
export { BodyCopy } from "./elements/BodyCopy.js";
export { BulletList } from "./elements/BulletList.js";
export { Blockquote } from "./elements/Blockquote.js";

// Data elements
export { LogoBox } from "./elements/LogoBox.js";

// Rich-text helper (rarely imported directly by consumers)
export { RichText } from "./rich-text/RichText.js";

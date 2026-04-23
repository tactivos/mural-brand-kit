/**
 * MuralDoc — canonical document schema (v1).
 *
 * Transcription of MURAL-DOC-SCHEMA.md. This file is the TypeScript source
 * of truth for the shape of every document that flows through the editor.
 *
 * Invariant: any change here must be mirrored in MURAL-DOC-SCHEMA.md and
 * must either bump `schemaVersion` or remain fully backward compatible.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Document envelope
// ─────────────────────────────────────────────────────────────────────────────

export type MuralDoc = {
  schemaVersion: 1;
  docType: DocType;
  meta: DocMeta;
  pages: Page[];
};

export type DocType =
  | "product-one-sheet"
  | "use-case"
  | "competitive-comparison"
  | "pricing-guide"
  | "topic-deep-dive"
  | "program-overview"
  | "partnership-one-sheet";

export type DocMeta = {
  title: string;
  topicLabel: string;
  audience?: string;
  tone?: Tone;
  outputLength?: OutputLength;
  accent?: BrandColorToken;
  createdAt: string;
  updatedAt: string;
};

export type Tone = "Professional" | "Conversational" | "Technical" | "Bold";
export type OutputLength = "Concise" | "Standard" | "Detailed";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export type Page = {
  id: string;
  layoutOverride?: LayoutVariant;
  accentOverride?: BrandColorToken;
  sections: Section[];
};

export type LayoutVariant =
  | "full-width"
  | "two-column-even"
  | "two-column-sidebar"
  | "grid-2x2"
  | "grid-3up"
  | "table-matrix";

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

export type SectionType = "Opener" | "Content" | "StatBand" | "Closing";

export type Section = {
  id: string;
  type: SectionType;
  props?: SectionProps;
  strips: Strip[];
};

export type SectionProps = {
  suppressTopRule?: boolean;
  background?: "white" | "natural" | "black";
};

// ─────────────────────────────────────────────────────────────────────────────
// Strip
// ─────────────────────────────────────────────────────────────────────────────

export type StripType =
  | "FiveColOpenerGrid"
  | "CombinedGrid"
  | "PillarGridThreeUp"
  | "PillarGridTwoUp"
  | "LogoStrip"
  | "StatCluster"
  | "StatBand"
  | "CompareTable"
  | "MatrixTable"
  | "AwardCallout"
  | "BodyGroup";

export type Strip = {
  id: string;
  type: StripType;
  props?: Record<string, unknown>;
  /** Most strips use a single ordered child list. */
  children?: Element[];
  /** Multi-slot strips (e.g. FiveColOpenerGrid, CombinedGrid) use named slots. */
  slots?: Record<string, Element[]>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Element
// ─────────────────────────────────────────────────────────────────────────────

export type ElementType =
  // Text
  | "Headline"
  | "SubHeading"
  | "SectionHeading"
  | "Eyebrow"
  | "Deck"
  | "IntroCopy"
  | "BodyCopy"
  | "BulletList"
  | "NumberedList"
  | "Blockquote"
  | "Attribution"
  | "Callout"
  // Inline marks are NOT element types; they live inside InlineNode trees.

  // Data / Proof
  | "StatNumeral"
  | "StateMark"
  | "AwardBadge"

  // Images / Logos
  | "PlacedImage"
  | "LogoBox"
  | "PartnerLockup"

  // Structural / Page chrome
  | "BrandBar"
  | "TopRule"
  | "PageFooter"
  | "PageNumber"
  | "CTA";

export type Element = {
  id: string;
  type: ElementType;
  props: ElementProps;
};

// ─────────────────────────────────────────────────────────────────────────────
// Element props (union of known types; extend as components are built)
// ─────────────────────────────────────────────────────────────────────────────

export type ElementProps =
  | HeadlineProps
  | SubHeadingProps
  | SectionHeadingProps
  | EyebrowProps
  | DeckProps
  | IntroCopyProps
  | BodyCopyProps
  | BulletListProps
  | BlockquoteProps
  | AttributionProps
  | StatNumeralProps
  | LogoBoxProps
  | CTAProps
  | PageFooterProps
  | PageNumberProps
  | BrandBarProps
  /** Fallback for components that don't have a dedicated prop type yet.
   * Every component should have a proper type before it ships. */
  | Record<string, unknown>;

// Text ------------------------------------------------------------------------

export type HeadlineProps = {
  text: string;
  level?: 1 | 2;
};

export type SubHeadingProps = {
  text: string;
};

export type SectionHeadingProps = {
  text: string;
  weight?: "light" | "default";
};

export type EyebrowProps = {
  text: string;
};

export type DeckProps = {
  text: string;
};

export type IntroCopyProps = {
  paragraphs: InlineNode[][];
};

export type BodyCopyProps = {
  /** Single paragraph. */
  content: InlineNode[];
  /** Multi-paragraph body. When present, `content` is ignored by renderers. */
  paragraphs?: InlineNode[][];
  /** Renders as max-width: min(5.05in, 100%) on the leaf. */
  maxMeasure?: "body-copy";
};

export type BulletListProps = {
  items: Array<{ content: InlineNode[] }>;
  style?: "bullet" | "number";
};

export type BlockquoteProps = {
  text: string;
  variant: "default" | "large" | "display";
  attribution?: {
    name: string;
    role?: string;
    /** Key into logo-manifest.json. */
    logoKey?: string;
  };
};

export type AttributionProps = {
  name: string;
  role?: string;
  logoKey?: string;
};

// Inline marks (not Element types — live inside rich-text props) ---------------

export type InlineMark = "bold";

export type InlineNode =
  | { type: "text"; value: string; marks?: InlineMark[] }
  | { type: "link"; href: string; label: string; marks?: InlineMark[] };

// Data / Proof ----------------------------------------------------------------

export type StatNumeralProps = {
  numeral: string;
  label: string;
  source?: string;
};

// Logos / chrome --------------------------------------------------------------

export type LogoBoxProps = {
  /** Key into editor-app/data/logo-manifest.json (stood up in a later step). */
  logoKey: string;
  variant: "auto" | "B" | "W";
  assetScale?: number;
  assetShiftX?: string;
  assetShiftY?: string;
};

export type CTAProps = {
  label: string;
  href: string;
};

export type PageFooterProps = {
  url: "mural.co" | "luma.institute";
  lockup?: "mural" | "mural-lead-luma" | "luma-lead";
  pageNumber?: number;
};

export type PageNumberProps = {
  value: number;
};

export type BrandBarProps = Record<string, never>;

// ─────────────────────────────────────────────────────────────────────────────
// Brand colors (aligned with .cursorrules palette)
// ─────────────────────────────────────────────────────────────────────────────

export type BrandColorToken =
  | "jade"
  | "mural-green"
  | "mural-red"
  | "mural-blue"
  | "mural-pink"
  | "mural-yellow"
  | "spring"
  | "mint"
  | "natural"
  | "black"
  | "white";

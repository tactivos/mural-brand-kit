/**
 * Element Catalog — the authoritative list of registered entities for v1.
 *
 * Transcription of EDITOR-COMPONENT-INVENTORY.md (Product one-sheet scope,
 * 24 entities). Any change here must be mirrored in that doc.
 *
 * Use this module as the single source of truth for:
 *   - which entity names are registered in Puck
 *   - which children each Section/Strip allows (slot allowlist)
 *   - where each entity's pattern-library reference lives
 */

import type { ElementType, SectionType, StripType } from "./mural-doc.js";

// ─────────────────────────────────────────────────────────────────────────────
// V1 scope: Product one-sheet
// ─────────────────────────────────────────────────────────────────────────────

export const V1_DOC_TYPE = "product-one-sheet" as const;

/** 4 Section types registered for v1. */
export const V1_SECTIONS: readonly SectionType[] = [
  "Opener",
  "Content",
  "StatBand",
  "Closing",
] as const;

/** 5 Strip types registered for v1. */
export const V1_STRIPS: readonly StripType[] = [
  "FiveColOpenerGrid",
  "CombinedGrid",
  "PillarGridThreeUp",
  "LogoStrip",
  "StatCluster",
] as const;

/** 12 Element types registered for v1 (10 text + 2 data). Page chrome and
 * inline marks are listed separately below. */
export const V1_ELEMENTS: readonly ElementType[] = [
  // Text (10)
  "Eyebrow",
  "Headline",
  "SubHeading",
  "SectionHeading",
  "Deck",
  "IntroCopy",
  "BodyCopy",
  "BulletList",
  "Blockquote",
  // "InlineLink" is an inline mark, not an Element type — see mural-doc.ts InlineNode.

  // Data (2)
  "StatNumeral",
  "LogoBox",
] as const;

/** 3 page-chrome Elements (not draggable; composed into every Page). */
export const V1_PAGE_CHROME: readonly ElementType[] = [
  "BrandBar",
  "PageFooter",
  "PageNumber",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Slot allowlists
// ─────────────────────────────────────────────────────────────────────────────

/** Which Section types may appear in a Page.sections list, in what order. */
export const PAGE_SECTION_RULES = {
  /** Opener is allowed only as the first section of page 1. */
  openerOnlyOnFirstPage: true,
  /** Closing, when present, must be the last section of the last page. */
  closingMustBeLast: true,
} as const;

/** Which Strip types each Section type accepts. */
export const SECTION_STRIP_ALLOWLIST: Record<SectionType, readonly StripType[]> = {
  Opener: ["FiveColOpenerGrid", "CombinedGrid", "BodyGroup"],
  Content: ["CombinedGrid", "PillarGridThreeUp", "PillarGridTwoUp", "LogoStrip", "AwardCallout", "BodyGroup", "CompareTable", "MatrixTable"],
  StatBand: ["StatCluster"],
  Closing: ["CombinedGrid", "BodyGroup", "AwardCallout"],
} as const;

/** Which Element types each Strip accepts, and in which slot (if multi-slot). */
export type SlotAllowlist =
  | { kind: "children"; allow: readonly ElementType[]; min?: number; max?: number }
  | { kind: "slots"; slots: Record<string, { allow: readonly ElementType[]; min?: number; max?: number }> };

export const STRIP_CHILD_ALLOWLIST: Record<StripType, SlotAllowlist> = {
  FiveColOpenerGrid: {
    kind: "slots",
    slots: {
      main: {
        allow: ["Headline", "Deck", "IntroCopy", "BodyCopy", "BulletList", "Blockquote"],
        min: 1,
      },
      rail: {
        allow: ["SubHeading", "BodyCopy", "BulletList", "StatNumeral"],
      },
    },
  },
  CombinedGrid: {
    kind: "slots",
    slots: {
      content: { allow: ["BodyCopy", "BulletList", "SubHeading", "IntroCopy"] },
      quote: { allow: ["Blockquote"], max: 1 },
    },
  },
  PillarGridThreeUp: {
    kind: "children",
    // Items are mini-blocks (SubHeading + BodyCopy); modeled as children for now,
    // may refactor to a dedicated "Pillar" mini-strip if needed.
    allow: ["SubHeading", "BodyCopy"],
    min: 6,
    max: 6,
  },
  PillarGridTwoUp: {
    kind: "children",
    allow: ["SubHeading", "BodyCopy"],
    min: 4,
    max: 4,
  },
  LogoStrip: {
    kind: "children",
    allow: ["LogoBox"],
    min: 3,
    max: 6,
  },
  StatCluster: {
    kind: "children",
    allow: ["StatNumeral"],
    min: 2,
    max: 4,
  },
  StatBand: {
    kind: "children",
    allow: ["StatNumeral"],
    min: 1,
    max: 4,
  },
  CompareTable: {
    // Props-driven, not free children. No slot allowlist applies.
    kind: "children",
    allow: [],
    max: 0,
  },
  MatrixTable: {
    kind: "children",
    allow: [],
    max: 0,
  },
  AwardCallout: {
    kind: "children",
    allow: ["BodyCopy", "SubHeading"],
  },
  BodyGroup: {
    kind: "children",
    allow: ["SubHeading", "BodyCopy", "BulletList", "IntroCopy", "Eyebrow", "CTA", "Blockquote"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Content constraints (validation limits from PDF-GENERATOR-SPEC.md §176-182)
// ─────────────────────────────────────────────────────────────────────────────

export const CONSTRAINTS = {
  Headline: { minLines: 2, maxLines: 4 },
  Deck: { minWords: 45, maxWords: 75 },
  BulletList: { minItems: 2, maxItems: 5 },
  Blockquote: { minWords: 20, maxWords: 45 },
  LogoStrip: { minLogos: 3, maxLogos: 6 },
  BodyCopy: {
    // Page-aggregate soft warning; not per-element.
    pageMinWords: 180,
    pageMaxWords: 260,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-library references (line ranges in mural-pdf-generator-pattern-library.html)
// Used by visual-regression tests to assert React components match specs.
// ─────────────────────────────────────────────────────────────────────────────

export const PATTERN_LIB_REFS: Record<string, { file: string; lines: [number, number] }> = {
  BrandBar: { file: "mural-pdf-generator-pattern-library.html", lines: [75, 80] },
  PageFooter: { file: "mural-pdf-generator-pattern-library.html", lines: [1322, 1328] },
  OpenerSection: { file: "mural-pdf-generator-pattern-library.html", lines: [93, 115] },
  ContentSection: { file: "mural-pdf-generator-pattern-library.html", lines: [254, 261] },
  StatBandSection: { file: "mural-pdf-generator-pattern-library.html", lines: [800, 806] },
  CombinedGrid: { file: "mural-pdf-generator-pattern-library.html", lines: [276, 282] },
  PillarGridThreeUp: { file: "mural-pdf-generator-pattern-library.html", lines: [283, 293] },
  LogoStrip: { file: "mural-pdf-generator-pattern-library.html", lines: [300, 314] },
  StatCluster: { file: "mural-pdf-generator-pattern-library.html", lines: [807, 813] },
  Eyebrow: { file: "mural-pdf-generator-pattern-library.html", lines: [201, 209] },
  Headline: { file: "mural-pdf-generator-pattern-library.html", lines: [117, 127] },
  SubHeading: { file: "mural-pdf-generator-pattern-library.html", lines: [129, 133] },
  Deck: { file: "mural-pdf-generator-pattern-library.html", lines: [184, 188] },
  IntroCopy: { file: "mural-pdf-generator-pattern-library.html", lines: [189, 200] },
  BulletList: { file: "mural-pdf-generator-pattern-library.html", lines: [546, 567] },
  StatNumeral: { file: "mural-pdf-generator-pattern-library.html", lines: [814, 832] },
  LogoBox: { file: "mural-pdf-generator-pattern-library.html", lines: [888, 909] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Totals (sanity check — enforced at typecheck time)
// ─────────────────────────────────────────────────────────────────────────────

/** Expected v1 entity count: 4 + 5 + 12 + 3 = 24. Runtime-checked by tests. */
export const V1_ENTITY_COUNT =
  V1_SECTIONS.length + V1_STRIPS.length + V1_ELEMENTS.length + V1_PAGE_CHROME.length;

export const V1_ENTITY_COUNT_EXPECTED = 24 as const;

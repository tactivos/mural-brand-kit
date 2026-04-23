/**
 * editor-app entry point (stub).
 *
 * Re-exports the public API of the schema and adapter layers. Consumers
 * (the Next.js editor app and the AI pipeline) should import from here,
 * never from submodules directly.
 */

export type {
  MuralDoc,
  DocType,
  DocMeta,
  Page,
  Section,
  SectionType,
  Strip,
  StripType,
  Element,
  ElementType,
  ElementProps,
  InlineNode,
  InlineMark,
  BrandColorToken,
  LayoutVariant,
  Tone,
  OutputLength,
} from "./schema/mural-doc.js";

export {
  V1_DOC_TYPE,
  V1_SECTIONS,
  V1_STRIPS,
  V1_ELEMENTS,
  V1_PAGE_CHROME,
  V1_ENTITY_COUNT,
  V1_ENTITY_COUNT_EXPECTED,
  PAGE_SECTION_RULES,
  SECTION_STRIP_ALLOWLIST,
  STRIP_CHILD_ALLOWLIST,
  CONSTRAINTS,
  PATTERN_LIB_REFS,
} from "./schema/element-catalog.js";

export type { PuckData } from "./adapter/puck.js";
export { muralDocToPuck, puckToMuralDoc, roundTripIsIdentity } from "./adapter/puck.js";

/**
 * muraldoc-puck.ts — adapter between MuralDoc JSON and Puck's Data shape.
 *
 * Purpose
 * -------
 * MuralDoc (see ../schema/mural-doc.ts) is the editor-independent canonical
 * document format — the thing the AI emits, storage persists, and static
 * renderers consume. Puck's Data is the editor-native format Puck's
 * <Puck> component round-trips to itself.
 *
 * This file is the ONLY place where the two formats are allowed to know
 * about each other. Keeping that translation layer thin and explicit is
 * what lets us swap editors (Craft.js, GrapesJS, a custom UI) in the
 * future without touching persistence, AI, or static rendering.
 *
 * Scope v1 (A9 → A12)
 * -------------------
 * Only covers what the Puck config v0.7 supports:
 *   - Elements: Headline, SubHeading, SectionHeading, Eyebrow, Deck,
 *     IntroCopy, BodyCopy, BulletList, Blockquote, LogoBox
 *   - Strips:   BodyGroup (exploded), CombinedGrid, StatBand, LogoStrip
 *   - Meta:     topicLabel (via pageMetaLabel)
 *   - Rich text (A12): BodyCopy, IntroCopy, and BulletList items move
 *     their inline content through an HTML bridge (see ./rich-text-html).
 *     Bold marks and link nodes now survive the full round trip;
 *     previously they collapsed to plain text.
 *
 * Known losses (documented; accepted for v1; addressed by later steps):
 *   - Multi-page MuralDocs throw. Editor is single-page until a page
 *     switcher ships.
 *   - Section boundaries collapse. All strips are flattened into a
 *     single Content section on the return trip. Section types
 *     (Opener/Content/StatBand/Closing) and suppressTopRule are lost.
 *   - Multi-paragraph BodyCopy/IntroCopy keep only their first
 *     paragraph. Resolved when the schema adds a first-class multi-
 *     paragraph field (and the Puck config follows with a paragraphs
 *     array of RichtextFields).
 *   - Blockquote.text is still plain; rich text on the quote body
 *     will land once a user asks for bold inside a pull quote.
 *   - LogoBox.variant defaults to "B"; user can't pick W until we add
 *     that field in the Puck config.
 *
 * Round-trip stability
 * --------------------
 * `muralDocToPuck(doc)` is lossy on multi-paragraph content (still), but
 * the output IS stable — after the first pass, further round-trips are
 * the identity. The test in tests/adapters/muraldoc-puck.spec.ts pins
 * this invariant. A12 adds a bold-preservation round-trip test as well.
 */

import type {
  MuralDoc,
  Page as MuralPage,
  Section,
  Strip,
  Element as MuralElement,
  InlineNode,
  HeadlineProps,
  SubHeadingProps,
  SectionHeadingProps,
  EyebrowProps,
  DeckProps,
  IntroCopyProps,
  BodyCopyProps,
  BulletListProps,
  BlockquoteProps,
  LogoBoxProps,
} from "../schema/mural-doc.js";
import type { MuralPuckData } from "../puck/config.js";
import { LOGO_MANIFEST, type LogoKey } from "../data/logo-manifest.js";
import {
  htmlToInlineNodes,
  inlineNodesToHTML,
} from "./rich-text-html.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Puck content entry. Matches the shape of ComponentData for any of the
 * components registered in puckConfig, plus the element/strip-id we store
 * under props.id. We use a minimal structural type rather than importing
 * Puck's full generic-laden type — we only need the discriminator and
 * the props bag for translation, not the field-validation machinery.
 */
type PuckItem = {
  type: string;
  props: Record<string, unknown> & { id: string };
};

/**
 * Narrow a PuckItem's props bag to a specific shape. Uses an
 * `unknown`-mediated cast because PuckItem.props is intentionally loose
 * (Record<string, unknown>) — the discriminator-switch in each
 * puckToMural* function is what actually guarantees the shape.
 */
function propsAs<T>(item: PuckItem): T {
  return item.props as unknown as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline nodes <-> plain text (still used where Puck stores a plain string)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten an InlineNode[] to plain string. Drops marks (bold) and link
 * structure — bold text becomes plain; links become their label text only.
 *
 * As of A12, the three rich fields (BodyCopy, IntroCopy, BulletList
 * items) no longer route through this helper; they go through
 * inlineNodesToHTML / htmlToInlineNodes instead and preserve marks.
 * Retained (not deleted) because:
 *   1. It still serves the test suite for lossy-flatten assertions.
 *   2. Any future field that intentionally wants plain-text storage
 *      (e.g. a single-line accessible label, a non-RichtextField)
 *      should reuse this rather than re-deriving it inline.
 */
export function inlineNodesToPlain(nodes: InlineNode[]): string {
  return nodes
    .map((n) => (n.type === "text" ? n.value : n.label))
    .join("");
}

/**
 * Wrap a plain string as a single-TextNode inline array. Kept alongside
 * inlineNodesToPlain for the same symmetry reasons documented above;
 * not currently called by the adapter's rich-field pathways.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- see above
function plainToInlineNodes(text: string): InlineNode[] {
  return [{ type: "text", value: text }];
}

// ─────────────────────────────────────────────────────────────────────────────
// Elements: MuralDoc -> Puck
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Set of known "bare element" Puck component types — i.e. things that
 * show up as direct children of the root content array, as opposed to
 * strips (which are multi-slot containers). Kept in sync with
 * puckConfig.components by convention; the round-trip test guards this.
 */
export const ELEMENT_PUCK_TYPES = new Set<string>([
  "Headline",
  "SubHeading",
  "SectionHeading",
  "Eyebrow",
  "Deck",
  "IntroCopy",
  "BodyCopy",
  "BulletList",
  "Blockquote",
  "LogoBox",
]);

function muralElementToPuck(el: MuralElement): PuckItem {
  const base = { id: el.id };

  switch (el.type) {
    case "Headline": {
      const p = el.props as HeadlineProps;
      return {
        type: "Headline",
        props: { ...base, text: p.text, level: p.level ?? 1 },
      };
    }

    case "SubHeading": {
      const p = el.props as SubHeadingProps;
      return { type: "SubHeading", props: { ...base, text: p.text } };
    }

    case "SectionHeading": {
      const p = el.props as SectionHeadingProps;
      return { type: "SectionHeading", props: { ...base, text: p.text } };
    }

    case "Eyebrow": {
      const p = el.props as EyebrowProps;
      return { type: "Eyebrow", props: { ...base, text: p.text } };
    }

    case "Deck": {
      const p = el.props as DeckProps;
      return { type: "Deck", props: { ...base, text: p.text } };
    }

    case "IntroCopy": {
      const p = el.props as IntroCopyProps;
      // v1: still takes only the first paragraph (schema-side multi-
      // paragraph support is a future change). Marks and links are
      // preserved via the HTML bridge. Empty paragraph list collapses
      // to "<p></p>" so Puck's RichtextField always has a valid
      // editor document on load.
      const first = p.paragraphs[0] ?? [];
      return {
        type: "IntroCopy",
        props: { ...base, text: inlineNodesToHTML(first) },
      };
    }

    case "BodyCopy": {
      const p = el.props as BodyCopyProps;
      // Prefer `content` (single paragraph). If only `paragraphs` is set
      // (schema edge case), fall through to the first paragraph.
      const content =
        p.content ?? (p.paragraphs && p.paragraphs[0]) ?? [];
      return {
        type: "BodyCopy",
        props: { ...base, text: inlineNodesToHTML(content) },
      };
    }

    case "BulletList": {
      const p = el.props as BulletListProps;
      return {
        type: "BulletList",
        props: {
          ...base,
          style: p.style ?? "bullet",
          items: p.items.map((item) => ({
            text: inlineNodesToHTML(item.content),
          })),
        },
      };
    }

    case "Blockquote": {
      const p = el.props as BlockquoteProps;
      // v1 supports only the default variant at the Puck layer; larger
      // variants throw so we catch them at save/load time rather than
      // silently downgrading.
      if (p.variant !== "default") {
        throw new AdapterError(
          `Blockquote variant="${p.variant}" not supported by Puck v1. Only "default" ships; add .quote-large/.quote-display component variants first.`,
        );
      }
      const logoKey = p.attribution?.logoKey ?? "";
      assertKnownLogoKeyOrEmpty(logoKey, el.id);
      return {
        type: "Blockquote",
        props: {
          ...base,
          text: p.text,
          attributionName: p.attribution?.name ?? "",
          attributionRole: p.attribution?.role ?? "",
          logoKey,
        },
      };
    }

    case "LogoBox": {
      const p = el.props as LogoBoxProps;
      assertKnownLogoKey(p.logoKey, el.id);
      return {
        type: "LogoBox",
        props: {
          ...base,
          logoKey: p.logoKey as LogoKey,
          // Preserve null sentinel for "use manifest default" — matches
          // the Puck field's `number | null` type.
          assetScale: p.assetScale ?? null,
        },
      };
    }

    default:
      throw new AdapterError(
        `muralElementToPuck: element type "${el.type}" is not supported by Puck v1. Add it to puckConfig.components first.`,
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Elements: Puck -> MuralDoc
// ─────────────────────────────────────────────────────────────────────────────

function puckToMuralElement(item: PuckItem): MuralElement {
  const id = item.props.id;

  switch (item.type) {
    case "Headline": {
      const { text, level } = propsAs<{ text: string; level: 1 | 2 }>(item);
      return { id, type: "Headline", props: { text, level } };
    }

    case "SubHeading": {
      const { text } = propsAs<{ text: string }>(item);
      return { id, type: "SubHeading", props: { text } };
    }

    case "SectionHeading": {
      const { text } = propsAs<{ text: string }>(item);
      return { id, type: "SectionHeading", props: { text } };
    }

    case "Eyebrow": {
      const { text } = propsAs<{ text: string }>(item);
      return { id, type: "Eyebrow", props: { text } };
    }

    case "Deck": {
      const { text } = propsAs<{ text: string }>(item);
      return { id, type: "Deck", props: { text } };
    }

    case "IntroCopy": {
      const { text } = propsAs<{ text: string }>(item);
      return {
        id,
        type: "IntroCopy",
        props: { paragraphs: [htmlToInlineNodes(text)] },
      };
    }

    case "BodyCopy": {
      const { text } = propsAs<{ text: string }>(item);
      return {
        id,
        type: "BodyCopy",
        props: { content: htmlToInlineNodes(text) },
      };
    }

    case "BulletList": {
      const { items, style } = propsAs<{
        items: Array<{ text: string }>;
        style: "bullet" | "number";
      }>(item);
      return {
        id,
        type: "BulletList",
        props: {
          style,
          items: items.map((it) => ({ content: htmlToInlineNodes(it.text) })),
        },
      };
    }

    case "Blockquote": {
      const { text, attributionName, attributionRole, logoKey } = propsAs<{
        text: string;
        attributionName: string;
        attributionRole: string;
        logoKey: LogoKey | "";
      }>(item);
      const attribution = attributionName
        ? {
            name: attributionName,
            ...(attributionRole ? { role: attributionRole } : {}),
            ...(logoKey ? { logoKey } : {}),
          }
        : undefined;
      return {
        id,
        type: "Blockquote",
        props: {
          text,
          variant: "default",
          ...(attribution ? { attribution } : {}),
        },
      };
    }

    case "LogoBox": {
      const { logoKey, assetScale } = propsAs<{
        logoKey: LogoKey;
        assetScale: number | null;
      }>(item);
      return {
        id,
        type: "LogoBox",
        props: {
          logoKey,
          variant: "B",
          ...(assetScale !== null ? { assetScale } : {}),
        },
      };
    }

    default:
      throw new AdapterError(
        `puckToMuralElement: item type "${item.type}" is not an element. Strip types should be routed through puckToMuralStrip.`,
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Strips: MuralDoc -> Puck
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Translate a Strip into zero or more Puck content entries. BodyGroup
 * returns a list because its children get hoisted to root — Puck has
 * no BodyGroup component in v0.6 (a future version may add one if users
 * want explicit grouping, but today it's redundant with the root
 * drop zone). All other strips return exactly one entry.
 */
function muralStripToPuck(strip: Strip): PuckItem[] {
  switch (strip.type) {
    case "BodyGroup": {
      return (strip.children ?? []).map(muralElementToPuck);
    }

    case "CombinedGrid": {
      const contentElements = strip.slots?.["content"] ?? [];
      const quoteElements = strip.slots?.["quote"] ?? [];
      return [
        {
          type: "CombinedGrid",
          props: {
            id: strip.id,
            contentSlot: contentElements.map(muralElementToPuck),
            quoteSlot: quoteElements.map(muralElementToPuck),
          },
        },
      ];
    }

    case "StatBand": {
      // MuralDoc StatBand uses a flat children[] where [0] is the
      // intro and [1..] is the body — matches the /preview renderer's
      // convention. We split it back into named slots here.
      const children = strip.children ?? [];
      const [intro, ...body] = children;
      return [
        {
          type: "StatBand",
          props: {
            id: strip.id,
            introSlot: intro ? [muralElementToPuck(intro)] : [],
            bodySlot: body.map(muralElementToPuck),
          },
        },
      ];
    }

    case "LogoStrip": {
      const onNaturalField = Boolean(
        (strip.props as { onNaturalField?: boolean } | undefined)
          ?.onNaturalField,
      );
      const ariaLabel =
        (strip.props as { ariaLabel?: string } | undefined)?.ariaLabel ??
        "Customer logos";
      return [
        {
          type: "LogoStrip",
          props: {
            id: strip.id,
            ariaLabel,
            onNaturalField,
            logosSlot: (strip.children ?? []).map(muralElementToPuck),
          },
        },
      ];
    }

    default:
      throw new AdapterError(
        `muralStripToPuck: strip type "${strip.type}" is not supported by Puck v1. Add it to puckConfig.components first.`,
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Strips: Puck -> MuralDoc
// ─────────────────────────────────────────────────────────────────────────────

function puckToMuralStrip(item: PuckItem): Strip {
  const id = item.props.id;
  switch (item.type) {
    case "CombinedGrid": {
      const { contentSlot, quoteSlot } = propsAs<{
        contentSlot: PuckItem[];
        quoteSlot: PuckItem[];
      }>(item);
      return {
        id,
        type: "CombinedGrid",
        slots: {
          content: contentSlot.map(puckToMuralElement),
          quote: quoteSlot.map(puckToMuralElement),
        },
      };
    }

    case "StatBand": {
      const { introSlot, bodySlot } = propsAs<{
        introSlot: PuckItem[];
        bodySlot: PuckItem[];
      }>(item);
      return {
        id,
        type: "StatBand",
        children: [
          ...introSlot.map(puckToMuralElement),
          ...bodySlot.map(puckToMuralElement),
        ],
      };
    }

    case "LogoStrip": {
      const { logosSlot, ariaLabel, onNaturalField } = propsAs<{
        logosSlot: PuckItem[];
        ariaLabel: string;
        onNaturalField: boolean;
      }>(item);
      return {
        id,
        type: "LogoStrip",
        props: { ariaLabel, onNaturalField },
        children: logosSlot.map(puckToMuralElement),
      };
    }

    default:
      throw new AdapterError(
        `puckToMuralStrip: item type "${item.type}" is not a strip. Bare elements should be routed through puckToMuralElement.`,
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level: MuralDoc -> Puck
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a MuralDoc into Puck's Data shape for the current v0.6 config.
 *
 * The resulting Puck Data has a flat `content` array containing both
 * bare elements (from exploded BodyGroup strips) and strip components,
 * in their original document order.
 */
export function muralDocToPuck(doc: MuralDoc): MuralPuckData {
  if (doc.pages.length === 0) {
    throw new AdapterError("muralDocToPuck: document has no pages.");
  }
  if (doc.pages.length > 1) {
    throw new AdapterError(
      `muralDocToPuck: multi-page documents not supported in v1 (found ${doc.pages.length} pages).`,
    );
  }

  const page = doc.pages[0] as MuralPage;
  const content: PuckItem[] = page.sections.flatMap((section) =>
    section.strips.flatMap(muralStripToPuck),
  );

  return {
    content: content as MuralPuckData["content"],
    root: {
      props: {
        pageMetaLabel: doc.meta.topicLabel,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level: Puck -> MuralDoc
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert Puck Data back into a MuralDoc.
 *
 * `baseDoc` (optional) supplies the fields the editor does not yet
 * expose a UI for — docType, meta.title, meta.audience, meta.tone,
 * meta.outputLength, createdAt. When absent, a sane default is used
 * so the output is still a valid MuralDoc. `updatedAt` is set to the
 * provided `now` (default: `new Date()`).
 *
 * Consecutive bare elements are grouped into a single BodyGroup strip.
 * This is the symmetric inverse of the BodyGroup explosion in
 * muralDocToPuck, so consecutive elements always round-trip through
 * the same structural shape.
 */
export function puckToMuralDoc(
  data: MuralPuckData,
  baseDoc?: MuralDoc,
  now: Date = new Date(),
): MuralDoc {
  const strips: Strip[] = [];
  let bodyBuffer: MuralElement[] = [];
  let bodyGroupIdx = 0;

  const flushBody = () => {
    if (bodyBuffer.length > 0) {
      strips.push({
        id: baseDoc
          ? `${baseDoc.pages[0]?.id ?? "page-1"}-bodygroup-${++bodyGroupIdx}`
          : `bodygroup-${++bodyGroupIdx}`,
        type: "BodyGroup",
        children: bodyBuffer,
      });
      bodyBuffer = [];
    }
  };

  for (const raw of data.content as unknown as PuckItem[]) {
    if (ELEMENT_PUCK_TYPES.has(raw.type)) {
      bodyBuffer.push(puckToMuralElement(raw));
    } else {
      flushBody();
      strips.push(puckToMuralStrip(raw));
    }
  }
  flushBody();

  const rootProps = (data.root?.props ?? {}) as { pageMetaLabel?: string };
  const pageMetaLabel = rootProps.pageMetaLabel ?? baseDoc?.meta.topicLabel ?? "";

  const updatedAt = now.toISOString();
  const createdAt = baseDoc?.meta.createdAt ?? updatedAt;

  return {
    schemaVersion: 1,
    docType: baseDoc?.docType ?? "product-one-sheet",
    meta: {
      title: baseDoc?.meta.title ?? "",
      topicLabel: pageMetaLabel,
      ...(baseDoc?.meta.audience !== undefined
        ? { audience: baseDoc.meta.audience }
        : {}),
      ...(baseDoc?.meta.tone !== undefined ? { tone: baseDoc.meta.tone } : {}),
      ...(baseDoc?.meta.outputLength !== undefined
        ? { outputLength: baseDoc.meta.outputLength }
        : {}),
      ...(baseDoc?.meta.accent !== undefined
        ? { accent: baseDoc.meta.accent }
        : {}),
      createdAt,
      updatedAt,
    },
    pages: [
      {
        id: baseDoc?.pages[0]?.id ?? "page-1",
        sections: [
          {
            id: `${baseDoc?.pages[0]?.id ?? "page-1"}-content`,
            type: "Content",
            strips,
          },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AdapterError — thrown when the adapter hits a shape it can't translate
 * (unsupported element/strip type, unknown logoKey, multi-page doc, etc.).
 * A dedicated class makes it easy to catch and surface in the UI.
 */
export class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdapterError";
  }
}

function assertKnownLogoKey(key: string, elementId: string): void {
  if (!(key in LOGO_MANIFEST)) {
    throw new AdapterError(
      `Unknown logoKey "${key}" on element "${elementId}". Add it to editor-app/src/data/logo-manifest.ts.`,
    );
  }
}

function assertKnownLogoKeyOrEmpty(key: string, elementId: string): void {
  if (key === "") return;
  assertKnownLogoKey(key, elementId);
}

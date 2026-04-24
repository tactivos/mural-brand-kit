"use client";

/**
 * Puck config — v0.8 (A13).
 *
 * Changes from v0.7 (A12):
 *   - A13: Bounded fields. Five fields now carry
 *     `metadata.bounded`, which the `boundedOverrides` wrapper reads
 *     to render a soft-limit badge below the field in the inspector:
 *
 *       Headline.text           2–4 lines  (approx. 90 chars/line)
 *       Deck.text              45–75 words
 *       Blockquote.text        20–45 words
 *       BulletList.items        2–5 items
 *       LogoStrip.logosSlot     3–6 items
 *
 *     Limits are sourced from MURAL-DOC-SCHEMA.md's "Validation
 *     rules (content guardrails)" table — update that table first if
 *     a limit changes. Philosophy per the spec: warn, never block.
 *     The counter shows status and suggests action; it does NOT
 *     prevent save.
 *
 * Changes from v0.6 (A8e):
 *   - A12: BodyCopy, IntroCopy, and BulletList items upgraded from
 *     plain textarea to RichtextField. The field's enabled TipTap
 *     extensions are locked to the MuralDoc InlineNode subset:
 *     paragraph + bold + link. Italic, underline, strikethrough, inline
 *     code, code blocks, headings, lists, blockquotes, and horizontal
 *     rules are disabled at the field level so non-designers
 *     physically cannot emit formatting MuralDoc can't represent.
 *
 *     Values are stored as HTML strings (TipTap's native serialization
 *     — `editor.getHTML()`). The MuralDoc adapter translates between
 *     HTML and InlineNode[] at the save/load boundary.
 *
 * Changes from v0.2 (A7):
 *   - A8a: Simple text elements — SubHeading, SectionHeading, Deck, IntroCopy.
 *   - A8b: BulletList with ArrayField items + bullet/numbered select.
 *   - A8c: Blockquote with flat field shape; default variant only.
 *   - A8d: LogoBox with logoKey select + optional assetScale override.
 *   - A8e: Strip components — CombinedGrid, StatBand, LogoStrip — each
 *     using Puck SlotFields with `allow` allowlists. Allowlists are
 *     sourced from EDITOR-COMPONENT-INVENTORY.md and enforced by Puck
 *     at drag time, so non-designers physically cannot place, e.g., a
 *     Headline inside a LogoStrip's logo slot. This is the Wix-style
 *     "multi-piece component within a strip" layer.
 *
 * Still in scope for later cuts:
 *   - BodyCopy aggregate page-body word bound (180–260) — cross-element
 *   - Link.href URL validation — orthogonal, belongs in the HTML parser
 *   - Blockquote "large" and "display" variants
 *   - Multi-paragraph BodyCopy/IntroCopy (needs a schema field update)
 *   - Rich text on Blockquote.text (low leverage — current fixture is plain)
 *
 * See EDITOR-COMPONENT-INVENTORY.md for the full v1 manifest.
 */
import type { Config, Data, Slot } from "@puckeditor/core";
import { Headline } from "../components/elements/Headline.js";
import {
  SubHeading,
  SectionHeading,
} from "../components/elements/SubHeading.js";
import { Eyebrow } from "../components/elements/Eyebrow.js";
import { Deck } from "../components/elements/Deck.js";
import { IntroCopy } from "../components/elements/IntroCopy.js";
import { BodyCopy } from "../components/elements/BodyCopy.js";
import { BulletList } from "../components/elements/BulletList.js";
import { Blockquote } from "../components/elements/Blockquote.js";
import { LogoBox } from "../components/elements/LogoBox.js";
import { CombinedGrid } from "../components/strips/CombinedGrid.js";
import {
  StatBand,
  StatBandRule,
} from "../components/strips/StatBand.js";
import { LogoStrip } from "../components/strips/LogoStrip.js";
import { LOGO_MANIFEST, type LogoKey } from "../data/logo-manifest.js";
import { htmlToInlineNodes } from "../adapters/rich-text-html.js";
import { BrandBar } from "../components/page-chrome/BrandBar.js";
import { PageFooter } from "../components/page-chrome/PageFooter.js";
import {
  Document,
  Page,
  PageInner,
  PageMeta,
} from "../components/structure/Page.js";

type HeadlineFields = {
  text: string;
  level: 1 | 2;
};

type SubHeadingFields = {
  text: string;
};

type SectionHeadingFields = {
  text: string;
};

type EyebrowFields = {
  text: string;
};

type DeckFields = {
  text: string;
};

type IntroCopyFields = {
  /**
   * HTML fragment from Puck's RichtextField. The config locks the field
   * to the MuralDoc InlineNode subset (paragraph + bold + link) so the
   * string is safe to parse with htmlToInlineNodes at render time.
   * Multi-paragraph arrives when the schema grows a paragraphs-array
   * field; for now, only the first <p> is consumed.
   */
  text: string;
};

type BodyCopyFields = {
  /** HTML fragment from Puck's RichtextField. See IntroCopyFields. */
  text: string;
};

type BulletListFields = {
  /** Each item's `text` is a single-paragraph HTML fragment. */
  items: Array<{ text: string }>;
  style: "bullet" | "number";
};

type BlockquoteFields = {
  text: string;
  attributionName: string;
  attributionRole: string;
  /**
   * Logo key into LOGO_MANIFEST. Empty string means "no logo". Kept flat
   * here rather than nested under attribution so Puck's inspector shows
   * each field at the top level — simpler UX for non-designers.
   */
  logoKey: LogoKey | "";
};

type LogoBoxFields = {
  logoKey: LogoKey;
  /**
   * Optical-balance scale override. Leave blank to use the manifest's
   * defaultScale for this logo. Numbers outside ~0.5–1.2 look wrong at
   * normal sizes — we don't clamp, but the validator should warn.
   */
  assetScale: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Slot allowlists — the brand-enforcement heart of the strip layer.
// Sourced from EDITOR-COMPONENT-INVENTORY.md. A value here is the
// authoritative list of elements a user is allowed to drop into that
// slot; Puck's SlotField enforces this at drag time, so non-designers
// physically cannot place a Headline inside a LogoStrip, etc.
// ─────────────────────────────────────────────────────────────────────────────
const CONTENT_SLOT_ALLOW = [
  "Eyebrow",
  "SubHeading",
  "SectionHeading",
  "IntroCopy",
  "BodyCopy",
  "BulletList",
];

const QUOTE_SLOT_ALLOW = ["Blockquote"];

const STAT_INTRO_SLOT_ALLOW = ["SectionHeading", "Headline"];

const STAT_BODY_SLOT_ALLOW = ["IntroCopy", "BodyCopy"];

const LOGO_STRIP_SLOT_ALLOW = ["LogoBox"];

type CombinedGridFields = {
  contentSlot: Slot;
  quoteSlot: Slot;
};

type StatBandFields = {
  introSlot: Slot;
  bodySlot: Slot;
};

type LogoStripFields = {
  ariaLabel: string;
  /**
   * When true, the strip renders a thin rule above and a natural-color
   * background band around the logos — matching the Mural Overview
   * reskin. Off by default for flexibility.
   */
  onNaturalField: boolean;
  logosSlot: Slot;
};

type RootFields = {
  /** Small uppercase label that sits above the top rule on every page. */
  pageMetaLabel: string;
};

type PuckComponents = {
  Headline: HeadlineFields;
  SubHeading: SubHeadingFields;
  SectionHeading: SectionHeadingFields;
  Eyebrow: EyebrowFields;
  Deck: DeckFields;
  IntroCopy: IntroCopyFields;
  BodyCopy: BodyCopyFields;
  BulletList: BulletListFields;
  Blockquote: BlockquoteFields;
  LogoBox: LogoBoxFields;
  CombinedGrid: CombinedGridFields;
  StatBand: StatBandFields;
  LogoStrip: LogoStripFields;
};

/**
 * Select options for logoKey fields. Regenerated from LOGO_MANIFEST so
 * any new logo added there automatically appears in the editor.
 */
const LOGO_KEY_REQUIRED_OPTIONS: Array<{ label: string; value: LogoKey }> = (
  Object.entries(LOGO_MANIFEST) as Array<
    [LogoKey, (typeof LOGO_MANIFEST)[LogoKey]]
  >
).map(([key, entry]) => ({ label: entry.alt, value: key }));

/** Same list prefixed with a "— No logo —" option for optional slots. */
const LOGO_KEY_OPTIONAL_OPTIONS: Array<{ label: string; value: LogoKey | "" }> = [
  { label: "— No logo —", value: "" },
  ...LOGO_KEY_REQUIRED_OPTIONS,
];

/**
 * Typed Data alias for our config — saves every consumer from having to
 * spell out the generic parameters. Use this instead of the untyped
 * re-exported `Data` when declaring seed data or state that flows
 * through puckConfig.
 */
export type MuralPuckData = Data<PuckComponents, RootFields>;

/**
 * TipTap extension gate for every RichtextField in this config.
 * Anything not explicitly kept is disabled — the inspector won't show
 * that formatting button, and paste from the OS / other apps is
 * stripped on insert. The kept set — paragraph (implicit, not listed
 * since there's no option to disable text), bold, link, hardBreak —
 * matches MuralDoc's InlineNode schema exactly, so the HTML emitted by
 * TipTap round-trips losslessly through htmlToInlineNodes.
 */
const RICH_TEXT_OPTIONS = {
  italic: false,
  underline: false,
  strike: false,
  code: false,
  codeBlock: false,
  heading: false,
  bulletList: false,
  orderedList: false,
  listItem: false,
  listKeymap: false,
  blockquote: false,
  horizontalRule: false,
  textAlign: false,
} as const;

/**
 * Display-only helper for array-item summaries — the Puck inspector
 * shows one line per item in a collapsed accordion. Raw HTML like
 * "<p>Item</p>" looks broken; this strips tags for that one label.
 * Not a security primitive — the underlying HTML is still the source
 * of truth for rendering.
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export const puckConfig: Config<{
  components: PuckComponents;
  root: RootFields;
}> = {
  root: {
    label: "Page",
    fields: {
      pageMetaLabel: {
        type: "text",
        label: "Topic label",
      },
    },
    defaultProps: {
      pageMetaLabel: "Product overview",
    },
    /**
     * root.render receives `{ children }` — that's the Puck drop zone.
     * Anything we put around `{children}` becomes non-editable page chrome.
     * BrandBar and PageFooter are fixed brand furniture; users never edit
     * those here. The topic label (pageMetaLabel) is editable via the
     * root field above.
     */
    render: ({ children, pageMetaLabel }) => (
      <Document>
        <Page>
          <BrandBar />
          <PageInner>
            <PageMeta leftLabel={pageMetaLabel} />
            {children}
          </PageInner>
          <PageFooter url="mural.co" lockup="mural" />
        </Page>
      </Document>
    ),
  },

  components: {
    Headline: {
      label: "Headline",
      fields: {
        text: {
          type: "text",
          label: "Headline text",
          // Spec: 2–4 lines at h1 size, ≈ 90 chars per line.
          metadata: {
            bounded: { kind: "lines", min: 2, max: 4, charsPerLine: 90 },
          },
        },
        level: {
          type: "select",
          label: "Heading level",
          options: [
            { label: "H1 — Primary (31pt)", value: 1 },
            { label: "H2 — Subordinate (23pt)", value: 2 },
          ],
        },
      },
      defaultProps: {
        text: "Your headline goes here",
        level: 1,
      },
      render: ({ text, level }) => <Headline text={text} level={level} />,
    },

    SubHeading: {
      label: "Sub-heading (H4)",
      fields: {
        text: { type: "text", label: "Sub-heading text" },
      },
      defaultProps: {
        text: "Sub-heading",
      },
      render: ({ text }) => <SubHeading text={text} />,
    },

    SectionHeading: {
      label: "Section heading (H3)",
      fields: {
        text: { type: "text", label: "Section heading text" },
      },
      defaultProps: {
        text: "Section heading",
      },
      render: ({ text }) => <SectionHeading text={text} />,
    },

    Eyebrow: {
      label: "Eyebrow",
      fields: {
        text: { type: "text", label: "Eyebrow text" },
      },
      defaultProps: {
        text: "Section label",
      },
      render: ({ text }) => <Eyebrow text={text} />,
    },

    Deck: {
      label: "Deck",
      fields: {
        text: {
          type: "textarea",
          label: "Deck text",
          // Spec: 45–75 words.
          metadata: { bounded: { kind: "words", min: 45, max: 75 } },
        },
      },
      defaultProps: {
        text: "A short supporting sentence beneath the headline.",
      },
      render: ({ text }) => <Deck text={text} />,
    },

    IntroCopy: {
      label: "Intro copy",
      fields: {
        text: {
          type: "richtext",
          label: "Intro paragraph",
          options: RICH_TEXT_OPTIONS,
        },
      },
      defaultProps: {
        text: "<p>Intro copy sits below the headline, styled with the tighter intro leading.</p>",
      },
      render: ({ text }) => (
        <IntroCopy paragraphs={[htmlToInlineNodes(text)]} />
      ),
    },

    BodyCopy: {
      label: "Body copy",
      fields: {
        text: {
          type: "richtext",
          label: "Paragraph text",
          options: RICH_TEXT_OPTIONS,
        },
      },
      defaultProps: {
        text: "<p>Body copy goes here. One paragraph for now; multi-paragraph support arrives when the schema adds a paragraphs field.</p>",
      },
      render: ({ text }) => <BodyCopy content={htmlToInlineNodes(text)} />,
    },

    Blockquote: {
      label: "Quote",
      fields: {
        text: {
          type: "textarea",
          label: "Quote text",
          // Spec: 20–45 words.
          metadata: { bounded: { kind: "words", min: 20, max: 45 } },
        },
        attributionName: { type: "text", label: "Attribution name" },
        attributionRole: { type: "text", label: "Attribution role / title" },
        logoKey: {
          type: "select",
          label: "Company logo",
          options: LOGO_KEY_OPTIONAL_OPTIONS,
        },
      },
      defaultProps: {
        text: "Short, punchy quote from a real customer.",
        attributionName: "Jane Doe",
        attributionRole: "Title, Company",
        logoKey: "",
      },
      render: ({ text, attributionName, attributionRole, logoKey }) => {
        const logoSrc = logoKey ? LOGO_MANIFEST[logoKey].src : undefined;
        const attribution = attributionName
          ? {
              name: attributionName,
              role: attributionRole || undefined,
              logoKey: logoKey || undefined,
            }
          : undefined;
        return (
          <Blockquote
            text={text}
            variant="default"
            attribution={attribution}
            logoSrc={logoSrc}
          />
        );
      },
    },

    BulletList: {
      label: "Bullet list",
      fields: {
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Bulleted (•)", value: "bullet" },
            { label: "Numbered (1, 2, 3)", value: "number" },
          ],
        },
        items: {
          type: "array",
          label: "Items",
          // Spec: 2–5 items.
          metadata: { bounded: { kind: "items", min: 2, max: 5 } },
          getItemSummary: (item, i) =>
            item.text ? stripTags(item.text).slice(0, 60) : `Item ${(i ?? 0) + 1}`,
          defaultItemProps: { text: "<p>New bullet item</p>" },
          arrayFields: {
            text: {
              type: "richtext",
              label: "Item text",
              options: RICH_TEXT_OPTIONS,
            },
          },
        },
      },
      defaultProps: {
        style: "bullet",
        items: [
          { text: "<p>First bullet item</p>" },
          { text: "<p>Second bullet item</p>" },
          { text: "<p>Third bullet item</p>" },
        ],
      },
      render: ({ items, style }) => (
        <BulletList
          style={style}
          items={items.map((item) => ({
            content: htmlToInlineNodes(item.text),
          }))}
        />
      ),
    },

    LogoBox: {
      label: "Logo",
      fields: {
        logoKey: {
          type: "select",
          label: "Logo",
          options: LOGO_KEY_REQUIRED_OPTIONS,
        },
        assetScale: {
          type: "number",
          label: "Optical scale (blank = manifest default)",
          min: 0.3,
          max: 1.6,
          step: 0.01,
        },
      },
      defaultProps: {
        logoKey: "ibm",
        assetScale: null,
      },
      render: ({ logoKey, assetScale }) => {
        const entry = LOGO_MANIFEST[logoKey];
        const scale =
          assetScale !== null && assetScale !== undefined
            ? assetScale
            : entry.defaultScale;
        return <LogoBox src={entry.src} alt={entry.alt} assetScale={scale} />;
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // Strips — multi-element containers. Each slot carries an `allow`
    // list so the drop indicator rejects non-allowed elements at drag
    // time. This is the Wix-style "multi-piece component" layer.
    // ─────────────────────────────────────────────────────────────────────

    CombinedGrid: {
      label: "Combined grid (content + quote)",
      fields: {
        contentSlot: {
          type: "slot",
          label: "Content (left column)",
          allow: CONTENT_SLOT_ALLOW,
        },
        quoteSlot: {
          type: "slot",
          label: "Quote (right column)",
          allow: QUOTE_SLOT_ALLOW,
        },
      },
      defaultProps: {
        contentSlot: [],
        quoteSlot: [],
      },
      render: ({ contentSlot: Content, quoteSlot: Quote }) => (
        <CombinedGrid content={<Content />} quote={<Quote />} />
      ),
    },

    StatBand: {
      label: "Stat band (hero stat + narrative)",
      fields: {
        introSlot: {
          type: "slot",
          label: "Stat heading (left column)",
          allow: STAT_INTRO_SLOT_ALLOW,
        },
        bodySlot: {
          type: "slot",
          label: "Narrative (right column)",
          allow: STAT_BODY_SLOT_ALLOW,
        },
      },
      defaultProps: {
        introSlot: [],
        bodySlot: [],
      },
      render: ({ introSlot: Intro, bodySlot: Body }) => (
        <StatBand intro={<Intro />} body={<Body />} />
      ),
    },

    LogoStrip: {
      label: "Logo strip",
      fields: {
        ariaLabel: {
          type: "text",
          label: "Accessible label (e.g. 'Customer logos')",
        },
        onNaturalField: {
          type: "radio",
          label: "Background",
          options: [
            { label: "Transparent", value: false },
            { label: "Natural band with top rule", value: true },
          ],
        },
        logosSlot: {
          type: "slot",
          label: "Logos",
          allow: LOGO_STRIP_SLOT_ALLOW,
          // Spec: 3–6 LogoBox children.
          metadata: { bounded: { kind: "items", min: 3, max: 6 } },
        },
      },
      defaultProps: {
        ariaLabel: "Customer logos",
        onNaturalField: false,
        logosSlot: [],
      },
      render: ({ ariaLabel, onNaturalField, logosSlot: Logos }) => {
        const extraStyle = onNaturalField
          ? {
              marginTop: 0,
              padding: "0.16in 0.18in 0.24in",
              background: "var(--natural)",
            }
          : undefined;
        return (
          <>
            {onNaturalField ? <StatBandRule /> : null}
            <LogoStrip ariaLabel={ariaLabel} extraStyle={extraStyle}>
              <Logos />
            </LogoStrip>
          </>
        );
      },
    },
  },
};

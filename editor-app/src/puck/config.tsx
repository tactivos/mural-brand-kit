"use client";

/**
 * Puck config — v0.5 (A8a + A8b + A8c + A8d).
 *
 * Changes from v0.2 (A7):
 *   - A8a: Simple text elements — SubHeading (h4), SectionHeading (h3),
 *     Deck (p.deck), IntroCopy (div.intro-copy with one wrapped paragraph).
 *   - A8b: BulletList with ArrayField items + bullet/numbered select.
 *   - A8c: Blockquote with a flat field shape (text, attributionName,
 *     attributionRole, logoKey) that reconstructs the nested attribution
 *     object at render time. Only the "default" variant is wired.
 *   - A8d: LogoBox with a logoKey select driven by LOGO_MANIFEST plus
 *     an optional numeric assetScale override. Blank scale falls back
 *     to the manifest's per-logo defaultScale.
 *
 * Still in scope for later cuts:
 *   - Strip components with SlotField allowlists (CombinedGrid, StatBand,
 *     LogoStrip)
 *   - Rich text (RichtextField) for BodyCopy/IntroCopy/BulletList items
 *   - Bounded field types (max lines, max words, max items)
 *   - Blockquote "large" and "display" variants
 *   - MuralDoc adapter
 *
 * See EDITOR-COMPONENT-INVENTORY.md for the full v1 manifest.
 */
import type { Config, Data } from "@puckeditor/core";
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
import { LOGO_MANIFEST, type LogoKey } from "../data/logo-manifest.js";
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
   * Plain-text intro paragraph for the v0.3 config. Wrapped in a single
   * TextNode paragraph at render time. Multi-paragraph and inline marks
   * arrive with the RichtextField integration.
   */
  text: string;
};

type BodyCopyFields = {
  /**
   * Plain-text body copy for the v0.3 config. We accept a single string
   * here and wrap it in a TextNode at render time. Multi-paragraph bodies
   * and inline marks arrive with the RichtextField integration.
   */
  text: string;
};

type BulletListFields = {
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
        text: { type: "text", label: "Headline text" },
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
        text: { type: "textarea", label: "Deck text" },
      },
      defaultProps: {
        text: "A short supporting sentence beneath the headline.",
      },
      render: ({ text }) => <Deck text={text} />,
    },

    IntroCopy: {
      label: "Intro copy",
      fields: {
        text: { type: "textarea", label: "Intro paragraph" },
      },
      defaultProps: {
        text: "Intro copy sits below the headline, styled with the tighter intro leading. Multi-paragraph support arrives with the rich-text field integration.",
      },
      render: ({ text }) => (
        <IntroCopy paragraphs={[[{ type: "text", value: text }]]} />
      ),
    },

    BodyCopy: {
      label: "Body copy",
      fields: {
        text: { type: "textarea", label: "Paragraph text" },
      },
      defaultProps: {
        text: "Body copy goes here. One paragraph for now; multi-paragraph support arrives with the rich-text field integration.",
      },
      render: ({ text }) => (
        <BodyCopy content={[{ type: "text", value: text }]} />
      ),
    },

    Blockquote: {
      label: "Quote",
      fields: {
        text: { type: "textarea", label: "Quote text" },
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
          getItemSummary: (item, i) =>
            item.text ? item.text.slice(0, 60) : `Item ${(i ?? 0) + 1}`,
          defaultItemProps: { text: "New bullet item" },
          arrayFields: {
            text: { type: "text", label: "Item text" },
          },
        },
      },
      defaultProps: {
        style: "bullet",
        items: [
          { text: "First bullet item" },
          { text: "Second bullet item" },
          { text: "Third bullet item" },
        ],
      },
      render: ({ items, style }) => (
        <BulletList
          style={style}
          items={items.map((item) => ({
            content: [{ type: "text", value: item.text }],
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
  },
};

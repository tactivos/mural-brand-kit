"use client";

/**
 * Puck config — v0.2 (A7).
 *
 * Changes from v0.1 (A6):
 *   - Added `root.render` that wraps user content in the canonical
 *     Document → Page → (BrandBar + PageInner + PageFooter) frame. The
 *     editor canvas now shows an 8.5 x 11 in page with the brand bar at
 *     top and the signature footer at bottom — matching /preview exactly.
 *   - Added a root-level `pageMetaLabel` text field so the user can edit
 *     the topic label (eyebrow text above the top rule) from the Page
 *     inspector panel.
 *
 * Still in scope for later cuts:
 *   - Sections/Strips with slot allowlists (SlotField)
 *   - Rich text (RichtextField) for BodyCopy
 *   - Bounded field types (max lines, max words)
 *   - Remaining components: SubHeading, Deck, IntroCopy, BulletList,
 *     Blockquote, LogoBox, strip wrappers, etc.
 *   - MuralDoc adapter
 *
 * See EDITOR-COMPONENT-INVENTORY.md for the full v1 manifest.
 */
import type { Config, Data } from "@puckeditor/core";
import { Headline } from "../components/elements/Headline.js";
import { Eyebrow } from "../components/elements/Eyebrow.js";
import { BodyCopy } from "../components/elements/BodyCopy.js";
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

type EyebrowFields = {
  text: string;
};

type BodyCopyFields = {
  /**
   * Plain-text body copy for the v0.2 config. We accept a single string
   * here and wrap it in a TextNode at render time. Multi-paragraph bodies
   * and inline marks arrive with the RichtextField integration.
   */
  text: string;
};

type RootFields = {
  /** Small uppercase label that sits above the top rule on every page. */
  pageMetaLabel: string;
};

type PuckComponents = {
  Headline: HeadlineFields;
  Eyebrow: EyebrowFields;
  BodyCopy: BodyCopyFields;
};

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
  },
};

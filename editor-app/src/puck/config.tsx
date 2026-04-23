"use client";

/**
 * Puck config — v0.1 minimal (A6).
 *
 * Scope of this first cut: just three editable elements (Headline, Eyebrow,
 * BodyCopy) so we can verify the plumbing end-to-end:
 *   1. Puck renders in Next.js App Router with our stylesheet.
 *   2. Drag-and-drop adds components to the canvas.
 *   3. Inspector edits update the canvas live.
 *   4. The rendered HTML uses the same class names as /preview, so brand.css
 *      styles them identically.
 *
 * NOT in this cut (deliberately):
 *   - Sections/Strips with slot allowlists — arrives with Puck slots config.
 *   - Rich text editing (marks, links) — Puck 0.21 RichtextField comes later.
 *   - Bounded field types (max lines, max words) — Puck Plugin system later.
 *   - MuralDoc <-> Puck Data adapter — Puck stores its own JSON for now.
 *
 * See EDITOR-COMPONENT-INVENTORY.md for the full v1 manifest that this
 * config will grow into.
 */
import type { Config } from "@puckeditor/core";
import { Headline } from "../components/elements/Headline.js";
import { Eyebrow } from "../components/elements/Eyebrow.js";
import { BodyCopy } from "../components/elements/BodyCopy.js";

type HeadlineFields = {
  text: string;
  level: 1 | 2;
};

type EyebrowFields = {
  text: string;
};

type BodyCopyFields = {
  /**
   * Plain-text body copy for the v0.1 config. We accept a single string
   * here and wrap it in a TextNode at render time. Multi-paragraph bodies
   * and inline marks arrive with the RichtextField integration.
   */
  text: string;
};

export const puckConfig: Config<{
  Headline: HeadlineFields;
  Eyebrow: EyebrowFields;
  BodyCopy: BodyCopyFields;
}> = {
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

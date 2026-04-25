/**
 * Prompt builders for the AI generation pipeline (A15).
 *
 * Two functions live here:
 *
 * - buildSystemPrompt(docType): returns the long-form system prompt
 *   that pins the model to the MuralDoc schema. Contains the schema
 *   description, the bounded-field constraints, the allowed logo
 *   keys, and a one-shot example built from the canonical fixture.
 *
 * - buildUserPrompt(input): assembles the per-request topic /
 *   audience / tone / length into a single user message.
 *
 * Why prompt-engineering, not strict JSON Schema mode? See the
 * docstring on `app/api/generate/route.ts` — TL;DR a strict schema
 * for MuralDoc would be ~300 LOC of mirror code and would have to
 * declare every optional field as `nullable: true`, which is fragile
 * across schema bumps. The route still validates the model's output
 * structurally via `isValidMuralDoc` and dynamically via the adapter
 * round-trip, so a bad shape can never reach the editor.
 */
import type { DocType, MuralDoc } from "../schema/mural-doc.js";
import { LOGO_MANIFEST } from "../data/logo-manifest.js";
import { muralOverviewFixture } from "../fixtures/mural-overview.js";

/** What the user fills in on /generate (or what tests pass directly). */
export type GenerateInput = {
  /** What the document is about. Required. */
  topic: string;
  /** Who the document is for. Free text. */
  audience?: string;
  /** Voice register. Defaults to "Professional". */
  tone?: MuralDoc["meta"]["tone"];
  /** Document length target. Single-page docs are "Concise". */
  outputLength?: MuralDoc["meta"]["outputLength"];
};

/**
 * Returns the system prompt for a given doc type. Only `product-one-sheet`
 * is supported in v1; other doc types throw so we don't silently emit a
 * malformed shape against the wrong template.
 */
export function buildSystemPrompt(docType: DocType): string {
  if (docType !== "product-one-sheet") {
    throw new Error(
      `[ai] buildSystemPrompt: docType "${docType}" not supported in v1. ` +
        `Only product-one-sheet is wired today.`,
    );
  }

  const allowedLogoKeys = Object.keys(LOGO_MANIFEST);

  // Use the canonical fixture as the one-shot example. JSON.stringify
  // with 2-space indent is what the model will be asked to emit, so
  // showing it the same shape minimizes drift.
  const exampleJson = JSON.stringify(muralOverviewFixture, null, 2);

  return [
    "You generate JSON documents for the Mural PDF Generator.",
    "",
    "Your output MUST be a single JSON object that conforms to the MuralDoc schema described below. Output JSON only, no prose, no markdown, no code fences.",
    "",
    "## Hard rules",
    "",
    "- `schemaVersion` is the literal number 1.",
    '- `docType` is the literal string "product-one-sheet".',
    "- The document has exactly one entry in `pages`.",
    "- Every `id` field is a short, lowercase, hyphenated string. Every id within a doc is unique.",
    "- Use only Unicode escapes that fit inside a JSON string. Do not output literal control characters.",
    "- Do not invent fields. Every key you emit must appear in the example below.",
    "",
    "## Allowed values",
    "",
    "- `meta.tone`: one of \"Professional\", \"Conversational\", \"Technical\", \"Bold\".",
    "- `meta.outputLength`: one of \"Concise\", \"Standard\", \"Detailed\".",
    "- `section.type`: one of \"Opener\", \"Content\", \"StatBand\", \"Closing\".",
    "- `strip.type`: one of \"BodyGroup\", \"CombinedGrid\", \"StatBand\", \"LogoStrip\".",
    "- `element.type` (text): \"Headline\", \"SubHeading\", \"SectionHeading\", \"Eyebrow\", \"Deck\", \"IntroCopy\", \"BodyCopy\", \"BulletList\", \"Blockquote\".",
    "- `element.type` (logo / data): \"LogoBox\", \"StatNumeral\".",
    "- `element.type` (chrome): \"CTA\", \"PageFooter\", \"BrandBar\", \"PageNumber\". Do not include chrome elements unless the example below shows them.",
    "- `LogoBox.props.logoKey`: one of " +
      allowedLogoKeys.map((k) => `"${k}"`).join(", ") +
      ". Do not invent logo keys.",
    "- `LogoBox.props.variant`: one of \"auto\", \"B\", \"W\". Use \"B\" on light backgrounds.",
    "- `Blockquote.props.variant`: \"default\", \"large\", or \"display\".",
    "",
    "## Document structure for product-one-sheet",
    "",
    "A product one-sheet has exactly three sections in this order:",
    "",
    "1. `Opener`: a single `BodyGroup` strip containing a `Headline` (level 1) followed by an `IntroCopy`.",
    "2. `Content`: a `CombinedGrid` strip with two slots:",
    "   - `content` slot: an `Eyebrow`, then alternating bold `BodyCopy` subheads + `BulletList`s.",
    "   - `quote` slot: one `Blockquote` (variant: \"default\") with attribution.",
    "3. `StatBand`: contains TWO strips:",
    "   - A `StatBand` strip with a `SectionHeading` and a `BodyCopy`.",
    "   - A `LogoStrip` with 3 to 6 `LogoBox` elements.",
    "",
    "## Content rules (soft limits — stay inside these ranges)",
    "",
    "- `Headline.props.text`: 2 to 4 lines, around 90 chars per line. Aim for a headline that reads as one concise statement.",
    "- `Deck.props.text`: 45 to 75 words.",
    "- `Blockquote.props.text`: 20 to 45 words.",
    "- `BulletList.props.items`: 2 to 5 items per list. Each item is a single concise sentence.",
    "- `LogoStrip.children`: 3 to 6 `LogoBox` elements.",
    "- Bold marks (`{ \"type\": \"text\", \"value\": \"...\", \"marks\": [\"bold\"] }`) are allowed. The only allowed mark is `bold`.",
    "- Links: use `{ \"type\": \"link\", \"href\": \"...\", \"label\": \"...\" }`. Use real, plausible URLs only when the topic warrants them.",
    "",
    "## InlineNode shape",
    "",
    "Rich-text fields like `BodyCopy.content`, `IntroCopy.paragraphs[i]`, and `BulletList.items[i].content` are arrays of `InlineNode`. Each inline node is one of:",
    "",
    "- `{ \"type\": \"text\", \"value\": \"...\" }` (optionally with `\"marks\": [\"bold\"]`).",
    "- `{ \"type\": \"link\", \"href\": \"...\", \"label\": \"...\" }`.",
    "",
    "## Tone calibration",
    "",
    "When generating copy, match the requested `tone`:",
    "",
    "- Professional: clear, executive register, no jargon, no exclamation points.",
    "- Conversational: warm, second-person (\"you\"), short sentences.",
    "- Technical: precise nouns, named technologies, concrete metrics.",
    "- Bold: short, declarative, big claims that stay defensible.",
    "",
    "## Example (canonical product-one-sheet)",
    "",
    "```json",
    exampleJson,
    "```",
    "",
    "Use the example above as the structural template. Replace the topic-specific copy and logo keys with content that matches the user's request. Preserve the section/strip/element ordering and field names exactly.",
  ].join("\n");
}

/**
 * Assembles the per-request user message. Keeps the topic prominent
 * at the top so the model anchors on it before reading metadata.
 */
export function buildUserPrompt(input: GenerateInput): string {
  const lines: string[] = [];
  lines.push(`Topic: ${input.topic.trim()}`);
  if (input.audience && input.audience.trim()) {
    lines.push(`Audience: ${input.audience.trim()}`);
  }
  lines.push(`Tone: ${input.tone ?? "Professional"}`);
  lines.push(`Output length: ${input.outputLength ?? "Concise"}`);
  lines.push("");
  lines.push(
    "Produce a complete product-one-sheet MuralDoc as a single JSON object. Output JSON only.",
  );
  return lines.join("\n");
}

/**
 * Stamp `createdAt` / `updatedAt` on a model-emitted doc. The model
 * is told not to invent timestamps in the system prompt; we set them
 * here so we don't depend on its clock awareness. Returns a new doc
 * (does not mutate input).
 */
export function stampTimestamps(doc: MuralDoc): MuralDoc {
  const now = new Date().toISOString();
  return {
    ...doc,
    meta: {
      ...doc.meta,
      createdAt: now,
      updatedAt: now,
    },
  };
}

# Mural PDF Generator Kit

This kit turns the current trust-and-security prototype into a reusable system for making on-brand Mural PDFs.

It is meant to be shared alongside the brand guide so another person can generate a polished PDF without manually redesigning every page.

## What This Kit Includes

- `mural-pdf-generator-starter.html` as the blank starter template for new PDFs
- `mural-pdf-generator-pattern-library.html` as the review surface for draft reusable patterns
- `mural-pdf-generator.html` as the filled trust-and-security example
- `PDF-GENERATOR-SPEC.md` as the source of truth for what belongs in the kit
- this document as the reusable operating guide

## What The Kit Is For

Use this kit when the output should feel like:

- a sales one-sheet
- a leave-behind
- an executive brief
- a product or capability overview
- a lightweight multi-page PDF handout

Do not use this kit as-is for:

- interactive web pages
- long reports
- dense whitepapers
- highly data-heavy layouts

## Core Principles

- Design fixed pages, not fluid screens.
- Keep browser preview and print output visually aligned.
- Keep body copy at `11pt` or smaller at `100%` print scale.
- Use editorial restraint: fewer elements, stronger hierarchy, more white space.
- Build in vertical slack so the print dialog does not create surprise overflow pages.
- Prefer a small number of repeatable page types over one-off custom layouts.

## Reusable Page Types

### 1. Opener Page

Use for the first page of a PDF.

Include:

- slim brand bar
- one utilitarian topic label above the top rule
- headline
- deck
- one supporting proof area such as logos, key stat, or short narrative
- subtle footer signature

Recommended limits:

- utilitarian topic label: short phrase repeated consistently across the full document
- headline: `2-4` lines
- deck: `45-75` words
- supporting narrative: `60-90` words
- enterprise logo row: `3-6` logos

### 2. Structured Content Page

Use for core narrative pages.

Include:

- page heading aligned to the same top hang line as other interior pages
- `2-4` content blocks
- short supporting paragraphs or bullets
- optional quote or short callout

Recommended limits:

- section heading: `1-2` lines
- each content block: `1` heading plus `2-5` bullets or a short paragraph
- total body copy on the page: approximately `180-260` words

### 3. Certifications / Logos Page

Use when credibility marks are important.

Include:

- short intro line
- horizontally balanced rows of logos
- restrained captions if needed

Rules:

- align logos optically, not mechanically
- normalize perceived weight so one mark does not dominate the row
- keep row spacing optically even
- avoid mixing too many differently scaled marks in the same row
- start from normalized containment, then use small per-mark scale or vertical-position tweaks so uploaded assets look balanced on first pass

### 4. Quote / Resource Page

Use when a testimonial, customer quote, or short resource list strengthens the story.

Include:

- one quote with hanging punctuation if appropriate
- short attribution
- short list of follow-up resources or links

Recommended limits:

- quote: `20-45` words
- attribution: `1-2` lines
- resources: `3-5` items

Quote rules:

- Use hanging punctuation so the opening quotation mark hangs to the left of the text block or grid.
- Align the quote text, the heading above it, and the attribution below it to the same text edge.
- Keep the quote visually strong but compact; do not let the quote block become a loose page-filling paragraph.

### 5. Closing / Contact Page

Use as the final page when needed.

Include:

- short closing statement
- CTA or contact line
- footer signature and page number

## First-Pass Pattern Library

This is the initial list of reusable patterns the kit should support.

These should be treated as draft modules for brand review and refinement, not as automatically approved final patterns.

In the pattern library, specimen labels such as `Pattern: Multi-stat ROI grid` are document annotations for review, not content that must appear inside the final component.

### Core Editorial Patterns

- Editorial opener
- Opener with proof strip
- Two-column narrative page
- Bullet-grid / capabilities page
- Quote and resources page
- Certifications / badges grid
- Customer logo strip
- Stat or proof callout
- Closing / CTA page

### Comparison Patterns

- Competitor comparison table
- Grouped comparison matrix
- Feature checklist with `Included`, `Limited`, and `Not available` states
- User-type access matrix
- Role comparison table
- Integrated column heads with short descriptors
- Short framing intro above a comparison chart
- Takeaway or proof block below a comparison chart
- Footnotes or plan qualification notes below a chart
- Help-center or learn-more row tied to a matrix

### Comparison Chart Rules

- Use alternating white and `Natural` (`#EDEDD8`) fills to separate rows or row groups when additional scanability is needed.
- Keep comparison layouts editorial rather than spreadsheet-like.
- Prefer fill-based row separation over horizontal rules.
- Default to no heading above the left-hand feature or capability column.
- Group rows under clear labels such as `Capabilities`, `Resources`, and `Integrations`.
- Allow both competitor-comparison layouts and operational matrices for permissions, pricing, access, or plan differences.
- Support short descriptive blurbs above columns when users or plan types need definition.
- Prefer plain typographic column heads with short descriptors over boxed cards when introducing matrix user types.
- Default to integrating those user-type names and descriptors directly into the matrix header rather than separating them into a detached preface block.
- Center integrated user-type header copy within its columns when it improves scanability and balance.
- Prefer simple print-oriented value states such as checks, x's, plain text, dashes, or limited-support markers.
- Avoid UI-like pills or badge treatments inside chart cells.
- Support footnotes and qualification language at the bottom of charts when access or pricing conditions need clarification.
- Preserve enough white space so the chart remains readable in print and in exported PDFs.

### Stat And Proof Patterns

- Big stat section
- Multi-stat ROI grid
- Case-study stat cluster
- Customer logo plus attributed stats
- Narrative intro paired with large metrics
- Headline-led oversized stat option
- Full-width stat panel or tinted stat canvas

### Stat Pattern Rules

- Use oversized numerals as the primary visual anchor when the proof point is strong enough to support it.
- Pair each large number with a short explanatory label or sentence rather than a long paragraph.
- Group stats into intentional clusters so they read as one proof story rather than scattered callouts.
- Allow optional customer attribution such as a logo, company name, or source note when needed.
- Use stronger visual separation behind a stat zone when it helps distinguish proof content from narrative body copy.
- Keep supporting copy concise so the numbers remain dominant in the hierarchy.
- Support both a subdued proof-grid option and a more assertive headline-led oversized-stat option.
- When using the more assertive option, let a short setup headline frame the proof story before the reader encounters the largest numbers.

### Image And Screenshot Patterns

- Single placed image, full width
- Single placed image, 3/4 width
- Single hero image
- Single ecosystem graphic
- Single infographic or logo matrix as one placed asset
- Two-up image layout
- Annotated product screenshot
- UI screenshot paired with narrative copy
- Product image plus proof stat
- Narrative copy above image
- Image with supporting bullets below
- Image plus proof or certification strip
- Image-led section with colored background fields

### Image Pattern Rules

- Use a single placed image when the visual communicates a complete idea more clearly than breaking it into smaller modules.
- Treat screenshots, ecosystems, diagrams, and logo matrices as editorial content blocks rather than decorative filler.
- Support both full-width placed images and more contained single-image placements that align to the text-column measure above.
- Support both single-image and two-image layouts in the library.
- Allow annotations when they materially improve understanding of the image.
- Pair images with short narrative, bullets, proof points, or certification strips when the page needs additional context.
- Use background color fields only when they strengthen hierarchy and help the image section read as a distinct block.
- Keep image corners restrained so they feel print-forward rather than webpage-like; prefer subtle radii such as `4px` when rounding is needed.

### Logo And Badge Rules

- Prefer square corners for logo and badge containers; avoid pill-like placeholder shapes when they start to feel webpage-like.
- Keep logo and badge framing quiet so the marks themselves remain the visual focus.
- Give uploaded logos and badges a normalized bounding area by default so they begin from a balanced shared height rather than their raw file dimensions.
- Support small optical adjustments per mark, especially `scale` and vertical shift, because mathematically centered assets often do not look visually centered.
- Expect light manual refinement for unusual marks, but make the default starting state as balanced as possible.
- When demonstrating an optional customer logo in a pattern library or starter, use an explicit image placeholder so users understand that a placed asset can go there.
- When a real customer logo is placed as attribution, remove any placeholder rule or box unless a frame is intentionally needed for the concept.

## Layout Rules

- Use explicit Letter dimensions: `8.5 x 11 in`.
- Treat each page as a fixed canvas.
- Use one global utilitarian topic label above the top rule and repeat it consistently on every page.
- Do not add a competing field at the top right of the page header.
- Keep a consistent page hang line for headings and main content starts.
- Interior pages should begin from the same perceived top alignment so the document feels orderly from page to page.
- Keep footer elements baseline aligned.
- Prefer fewer rules and separators; simplify when lines begin to feel excessive or fussy.
- Allow breathing room at the bottom of every page.
- Avoid orphan rows, awkward page breaks, and edge-hugging content.

## Type Rules

- Headlines: `Merriweather Light`
- Primary `h1`: `31pt`, `line-height: 1.1`, `letter-spacing: -1.5px`
- Primary `h2`: `23pt`, `line-height: 1.1`, `letter-spacing: -1px`
- Body: `Arial`
- Body copy should generally live around `10-10.5pt`
- Small utility copy can be smaller, but should remain comfortably printable
- Bullet copy should match body copy styling unless there is a clear reason not to
- Bullet subheads should stay clearly smaller and quieter than the primary section heading above them
- Use gray body text where a softer editorial tone is appropriate

## Content Rules

- Write for print reading, not scanning on a webpage.
- Keep paragraph measure in a readable range of roughly `45-75` characters per line; aim closer to `50-70` when possible.
- Separate the utilitarian topic label from the editorial headline: the label names the subject plainly, while the headline carries the written expression.
- Keep paragraphs compact.
- Avoid overly long decks.
- Edit for better rags when necessary.
- Use soft returns sparingly and intentionally when a line break materially improves the page.
- Improve rags before tightening type or spacing; use line breaks only when they produce a visibly cleaner result.
- Watch for "horsey" bullets or lists: avoid overly bouncy spacing, oversized subheads, heavy rule treatment, deep indents, or styling that makes short lists feel awkward and over-articulated.
- When bullet sections feel horsey, normalize them back toward body copy, simplify the structure, and preserve a calmer editorial rhythm.
- Remove extraneous UI-style labels, helper copy, and web navigation language.

## Safe Capacity Rules

To reduce print-time surprises, leave extra room in the layout:

- do not fill a page to `100%` of its visible height
- leave a bottom safety band before the footer
- keep content modules within known word-count ranges
- cap the number of cards, bullets, and logos used on each page type

When in doubt, shorten copy before tightening spacing.

## Export Workflow

The goal is a painless export.

Recommended workflow:

1. Open the HTML file in the browser.
2. Choose `File > Print`.
3. Select `Save as PDF`.
4. Confirm `Letter` paper size.
5. Confirm scale is `100%` or default.
6. Keep backgrounds enabled so the brand bar and fills print correctly.
7. Save the PDF.

If the design is built correctly, the user should not need to manually move content around or rework line breaks at export time.

## Recommended Working Pattern

Use the files in this order:

1. Start from `mural-pdf-generator-starter.html`.
2. Review `mural-pdf-generator-pattern-library.html` when you need optional layout modules beyond the starter.
3. Replace placeholder copy with the new subject matter.
4. Use `mural-pdf-generator.html` as the filled example when you need to see how a finished piece should look.
5. Check browser preview and print preview before sharing.

## Prompt Template

Use this prompt when asking an AI to build a new PDF from the kit:

```text
Create a Mural-branded print-first PDF in a single self-contained HTML file using the Mural PDF Generator Kit and brand guide as references.

Goal:
- Produce a polished editorial PDF, not a webpage
- Design for fixed 8.5 x 11 in Letter pages
- Keep browser preview closely aligned with PDF output
- Keep body copy at 11pt or smaller when printed at 100%

Requirements:
- Use a small set of repeatable page types
- Preserve clear hierarchy and generous white space
- Build in enough vertical slack to avoid accidental overflow pages in Print > Save as PDF
- Use optical alignment for logos when needed
- Use subtle footer signatures and baseline-aligned pagination
- Keep all CSS, JS, and SVG assets inline or local to the project

Deliverable:
- One self-contained HTML file
- Clean page-by-page structure
- Copy edited to fit the chosen page architecture
```

## Build Checklist

Before sharing a generated PDF, check:

- page count makes sense for the content
- no page spills unexpectedly in print preview
- body copy size is print-appropriate
- footer elements align cleanly
- logos feel balanced
- section spacing is optically even
- rags are acceptable
- browser preview matches the exported PDF closely

## Starter And Example

The starter template is `mural-pdf-generator-starter.html`.

The pattern library is `mural-pdf-generator-pattern-library.html`.

The current filled example implementation is `mural-pdf-generator.html`.

Use the starter as:

- a blank starting point for new PDFs
- the file to duplicate or adapt for new subject matter

Use the pattern library as:

- a review surface for draft modules
- a place to refine and approve reusable pattern options
- a visual reference when the starter needs an additional layout

Use the example as:

- a proof of concept
- a styling reference
- a page architecture reference
- a finished reference for future subject-matter PDFs

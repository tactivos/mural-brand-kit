# Mural PDF Generator — Canonical Spec

This file is the source of truth for the reusable PDF generator kit in this project.

Use it to keep the PDF generator system coherent as new examples, templates, and prompts are added.

## Purpose

The PDF generator kit exists to help people create Mural-branded PDFs that:

- feel editorial and print-first rather than webpage-like
- preview in the browser as fixed pages
- export cleanly through `File > Print > Save as PDF`
- preserve brand consistency without manual layout tinkering
- work as a standalone web tool (Mural Creative Team app) with AI-assisted generation

## Core Assets

These files are part of the PDF generator kit:

- `mural-pdf-generator-starter.html` — shared foundation CSS and blank page template
- `mural-pdf-generator-pattern-library.html` — visual library of rendered patterns
- `mural-pdf-generator.html` — filled example (trust-and-security prototype)
- `PDF-GENERATOR-KIT.md` — reusable guidance, page recipes, and rules
- `PDF-GENERATOR-SPEC.md` — this canonical spec

### Document type starters

Each document type has a self-contained HTML starter that serves as both a preview for users and a structural reference for AI generation:

- `starters/product-one-sheet.html`
- `starters/use-case.html`
- `starters/competitive-comparison.html`
- `starters/pricing-guide.html`
- `starters/topic-deep-dive.html`
- `starters/program-overview.html`
- `starters/partnership-one-sheet.html`

## Supporting Assets

These local assets support the kit and should remain available unless intentionally replaced:

- `Mural_Wordmark_Multicolor.svg`
- `cert-logos/`
- `enterprise-logos/`

## Document Types

The PDF generator supports 7 document types, organized by user intent:

### 1. Product one-sheet

User intent: "I need to pitch Mural."

Typical structure:
- Page 1: Opener (brand bar, headline, deck) → two-column (narrative + 2x2 proof points) → customer logo strip → footer
- Page 2 (optional): Sidebar-heavy layout (quote + supporting content) → CTA → footer

### 2. Use case

User intent: "I need to show how [audience] uses Mural."

Typical structure:
- Page 1: Opener (audience-specific headline, deck) → section heading + bullets → screenshot or image placeholder → footer
- Page 2 (optional): Quote → resource links → CTA → footer

### 3. Competitive comparison

User intent: "I need to compare Mural to a competitor."

Typical structure:
- Page 1: Opener (positioning headline) → framing intro → comparison table with state marks → proof stat or takeaway → footer

### 4. Pricing guide

User intent: "I need to explain our pricing."

Typical structure:
- Page 1: Opener (title + subtitle) → headline promise → narrative → 2x2 proof points → quote → footer
- Page 2: Access/entitlements matrix (user types as columns, features as rows) → footnotes → footer

### 5. Topic deep-dive

User intent: "I need to go deep on a topic (security, ROI, AI, compliance...)."

Typical structure:
- Page 1: Opener (topic headline) → narrative → supporting proof (cert grid, stat grid, or feature list) → footer
- Page 2 (optional): Additional proof → quote → CTA → footer

### 6. Program overview

User intent: "I need to promote a training program."

Typical structure:
- Page 1: Sidebar-heavy layout (large quote ~40%, program details ~60%) → program description → inclusions list → two pricing options side by side → CTA in footer

### 7. Partnership one-sheet

User intent: "I need to explain a partnership."

Typical structure:
- Page 1: Opener (joint value headline) → integration benefits as bullets → ecosystem logo grid → partner award badge → quote → footer

## Design System Layers

The PDF generator uses a layered approach that balances guardrails with creative flexibility:

### Layer 1: Foundation

Type scale, colors, spacing tokens, page dimensions, print rules. This is the real design system — if the foundation is right, content looks on-brand automatically regardless of layout choices.

- Type: `STK Bureau` / `Merriweather` for headlines, `ABC Social` / `Arial` for body
- Body rhythm: `10pt / 13pt` with `6.5pt` paragraph spacing
- Page: `8.5 x 11 in` Letter, fixed canvas
- Colors: brand palette from `.cursorrules`

### Layer 2: Page frames

The chrome that wraps every page — brand bar, topic label, top rule, footer with wordmark/URL/page number. Consistent across all document types.

### Layer 3: Page layouts

How the page content area is divided. Users select a layout per page:

- **Full-width** — single column, content flows top to bottom
- **Two-column (even)** — 50/50 split (narrative + pillars, narrative + bullets)
- **Two-column (sidebar-heavy)** — 40/60 split with sidebar quote
- **Grid (2x2, 3-up)** — for blocks of equal weight
- **Table / matrix** — for structured data

### Layer 4: Specialized markup

Only the elements that need specific HTML/CSS because they cannot be freestyled from the type system:

- Comparison table (row alternation, state marks, column alignment)
- Access/entitlements matrix (multi-column headers with descriptors)
- Stat grid (oversized numerals with specific sizing and leading)
- Certification/badge grid (image containers with optical normalization)
- Brand bar + footer (SVG markup, baseline alignment)

Everything else — headlines, body copy, bullets, quotes, numbered lists, section headings, callouts, CTAs — is the type system used within a layout. No rigid component needed.

## Generator Principles

- Design for fixed `8.5 x 11 in` Letter pages
- Prioritize print fidelity over responsive web behavior
- Make browser preview closely match PDF output
- Keep body copy at `11pt` or smaller when printed at `100%`
- Default print body rhythm to `10pt / 13pt` with `6.5pt` paragraph spacing unless a specific pattern requires a different treatment
- Default body copy color to `#000000` unless a specific pattern intentionally uses a secondary text treatment
- Use typography, spacing, and alignment instead of app-like UI components
- Favor optical alignment over purely mathematical centering when needed
- Keep enough spare vertical space so content does not unexpectedly spill to a new page in print
- Preserve provided source copy as-is by default on the first pass unless the user explicitly asks for rewriting
- Preserve the source copy structure before improving, condensing, or re-sequencing the writing
- Prefer adapting layout to the supplied content over rewriting content to suit the layout
- If copy must be shortened for fit, keep edits minimal and clearly note that the source was compressed
- Treat non-designers as the default kit user, so the system should solve hierarchy and composition without requiring rewritten copy up front

## Page System

Across all document types, every page uses one consistent utilitarian topic label above the top rule.

That label should:

- repeat on every page
- describe the subject plainly
- remain separate from the larger editorial headline
- avoid a competing top-right meta field

Footer elements should be baseline-aligned when a page uses a logo, URL, and page number together.

## Content Guardrails

Every page should have practical limits so users do not need to manually fix overflows:

- headline: 2-4 lines
- deck: 45-75 words
- bullets per block: 2-5
- quote: 20-45 words
- logo row: 3-6 logos
- sections should be designed with bottom safety room

When in doubt, shorten copy before tightening spacing.

## Web Tool UI

The PDF generator runs as a web tool within the Mural Creative Team app (Next.js). The UI follows a three-panel editor pattern inspired by AirOps SlideGen:

### Entry point

The user sees the 7 document types in a left nav, each with a name and short description. Selecting a type loads its starter example in the preview panel.

### Three-panel editor

- **Left panel — page navigator**: Thumbnail strip of all pages in the document. Click to select a page.
- **Center panel — canvas**: Live rendered preview of the selected page at approximately actual proportions.
- **Right panel — inspector**: Controls for the selected page, organized top-to-bottom:
  - Document-level settings (type, topic label)
  - Page-level layout selection (full-width, two-column, sidebar-heavy, table/matrix)
  - Content fields (headline, body, etc.)
  - AI prompt field for custom refinements

### Generation flow

1. User selects a document type → sees the starter example
2. User pastes their content into the source content field
3. User hits "Generate" → AI produces a new document using the selected type's starter as the structural reference and the user's content
4. User reviews the result in the canvas, adjusts per-page settings, and uses the AI prompt to refine specific pages
5. User exports via browser print (File > Print > Save as PDF)

## Export Workflow

1. Open the document in the preview canvas
2. Choose `File > Print` (or click Export PDF button)
3. Confirm `Letter` paper size, `100%` scale, backgrounds enabled
4. Save the PDF

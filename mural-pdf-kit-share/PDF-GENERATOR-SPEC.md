# Mural PDF Generator — Canonical Spec

This file is the source of truth for the reusable PDF generator kit in this project.

Use it to keep the PDF generator system coherent as new examples, templates, and prompts are added.

## Purpose

The PDF generator kit exists to help people create Mural-branded PDFs that:

- feel editorial and print-first rather than webpage-like
- preview in the browser as fixed pages
- export cleanly through `File > Print > Save as PDF`
- preserve brand consistency without manual layout tinkering
- work cleanly inside Cursor when used alongside the Mural brand guidelines kit and Bill's AI coding rules

## Core Assets

These files are part of the PDF generator kit:

- `mural-pdf-generator-starter.html` — blank starter template for new PDFs
- `mural-pdf-generator-pattern-library.html` — first-pass visual library of draft reusable patterns
- `mural-pdf-generator.html` — filled example implementation based on the trust-and-security prototype
- `PDF-GENERATOR-KIT.md` — reusable guidance, page recipes, prompt, and workflow
- `PDF-GENERATOR-SPEC.md` — this canonical spec

## Supporting Assets

These local assets support the prototype and should remain available unless intentionally replaced:

- `Mural_Wordmark_Multicolor.svg`
- `cert-logos/`
- `enterprise-logos/`

## Generator Principles

The generator kit should follow these rules:

- Design for fixed `8.5 x 11 in` Letter pages
- Prioritize print fidelity over responsive web behavior
- Make browser preview closely match PDF output
- Keep body copy at `11pt` or smaller when printed at `100%`
- Use `STK Bureau` for headlines and `ABC Social Light (300)` for body copy by default in PDF generator outputs
- Default print body rhythm to `10pt / 13pt` with `6.5pt` paragraph spacing unless a specific pattern requires a different treatment
- Default body copy color to `#000000` unless a specific pattern intentionally uses a secondary text treatment
- Use typography, spacing, and alignment instead of app-like UI components
- Favor optical alignment over purely mathematical centering when needed
- Keep enough spare vertical space so content does not unexpectedly spill to a new page in print
- Default comparison and matrix check marks to black unless a user intentionally overrides the color
- When a comparison or matrix check mark includes an asterisk or note marker, keep the check aligned with adjacent checks and let the marker hang tightly to the right
- Keep copy concise and avoid redundant explanation when the same context can live directly with the content it clarifies
- Place explanatory context as close as possible to the data, chart, or message it supports so readers do not need to cross-reference
- Preserve provided source copy as-is by default on the first pass unless the user explicitly asks for rewriting
- Preserve the source copy structure before improving, condensing, or re-sequencing the writing
- Prefer adapting layout to the supplied content over rewriting content to suit the layout
- If copy must be shortened for fit, keep edits minimal and clearly note that the source was compressed
- Treat non-designers as the default kit user, so the system should solve hierarchy and composition without requiring rewritten copy up front

## Page System

The reusable kit should support a small set of predictable page types:

- opener / cover page
- structured content page
- certifications / logo page
- quote / resource page
- closing / contact page

Across those page types, the document should use one consistent utilitarian topic label above the top rule.

That label should:

- repeat on every page
- describe the subject plainly
- remain separate from the larger editorial headline
- avoid a competing top-right meta field
- keep footer elements baseline-aligned when a page uses a logo, URL, and page number together

## Content Guardrails

Every reusable page type should have practical limits so users do not need to manually fix overflows:

- headline length should be constrained
- deck length should be constrained
- list length should be constrained
- quote length should be constrained
- logo counts per row should be constrained
- sections should be designed with bottom safety room

## Current Prototype Role

`mural-pdf-generator-starter.html` should be the first file people duplicate or adapt when building a new PDF.

`mural-pdf-generator-pattern-library.html` should be used to review, refine, and approve reusable pattern options before they are normalized into the starter or recommended pattern set.

`mural-pdf-generator.html` remains the filled reference example and proof of concept for the kit.

It should be treated as:

- a content-filled example users can study
- a working reference for page structure
- a place to test print-safe design decisions
- a model that can later be abstracted into more generic templates

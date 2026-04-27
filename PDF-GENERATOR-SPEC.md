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
- `starters/partnership-one-sheet.html` (Partnership/integration one-sheet)

### Editor stack (v1, additive)

The editor stack is being stood up additively alongside the static HTML kit above. Nothing in the static kit is being removed or rewritten; the editor renders the same HTML with the same class names so both output surfaces stay identical.

- `editor-app/` — TypeScript workspace for the Puck-based visual editor. Self-contained Node subproject; the root repo remains a static HTML repo.
- `editor-app/styles/brand.css` — canonical stylesheet for the editor's `/preview/*` print routes. Sourced from the approved reskins (`reskins/product-one-sheet/mural-overview.html` is the v1 seed; additional doc types merge in here, not per-doc-type sheets). Not loaded by the editor UI, landing page, or any admin surface — only by `app/preview/layout.tsx`. The static HTML kit (pattern library, reskins, starters) continues to carry its own inline styles and is NOT modified to reference this file.
- `editor-app/src/schema/` — canonical `MuralDoc` types and the v1 Element Catalog.
- `editor-app/tests/visual/` — Playwright visual-regression goldens captured from existing reskins. Ensures the editor's `/preview` output stays pixel-identical to the static HTML surface.
- `MURAL-DOC-SCHEMA.md` — canonical JSON schema for documents (editor-independent). AI emits this; the editor loads and saves this; storage uses this.
- `EDITOR-COMPONENT-INVENTORY.md` — 24-entity build manifest (4 Sections + 5 Strips + 12 Elements + 3 page-chrome) with slot allowlists, prop shapes, and pattern-library line references.

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

### 7. Partnership/integration one-sheet

User intent: "I need to explain a partnership or integration."

Typical structure:
- Page 1: Partner lockup (Mural wordmark + partner logo) → opener (joint value headline) → integration benefits as bullets → ecosystem logo grid → quote → footer

## Editor Architecture

The editor is a Puck-based visual tool for non-designers. It enforces a three-level hierarchy (Wix-style) so that at every scale — page, grouping, individual part — there is one clear thing to edit, move, duplicate, or delete.

### Hierarchy

1. **Page** — a fixed `8.5 x 11 in` canvas. Every document has one or more. Page chrome (brand bar, footer, optional page number) is composed, not editable as free-floating elements.
2. **Section** — a horizontal page band. Four section types are registered for v1:
   - `Opener` — first section of page 1 only
   - `Content` — the workhorse; most body-copy pages are Content sections
   - `StatBand` — full-width stat cluster with natural background
   - `Closing` — last section of the last page (when used)
3. **Strip** — a multi-piece grouping that lives inside a Section. Five strip types are registered for v1:
   - `FiveColOpenerGrid` — the five-column opener logic from `PDF-GENERATOR-KIT.md`
   - `CombinedGrid` — wide content column + narrow quote column (matches LUMA PCP pattern)
   - `PillarGridThreeUp` — three equal feature/benefit pillars
   - `LogoStrip` — 3–6 optically-balanced customer or partner logos
   - `StatCluster` — 2–4 oversized-numeral stats with labels
4. **Element** — an individual editable part that lives inside a Strip. Twelve element types are registered for v1:
   - Text: `Eyebrow`, `Headline`, `SubHeading`, `SectionHeading`, `Deck`, `IntroCopy`, `BodyCopy`, `BulletList`, `Blockquote`
   - Data / proof: `StatNumeral`, `LogoBox`
   - Inline marks (`bold`, `link`) live inside text-element rich-text props, not as standalone Elements.

Every level is editable, movable, duplicatable, and deletable in the editor. Sibling moves and parent moves are both supported. Sections can only hold allowed Strips; Strips can only hold allowed Elements. See `EDITOR-COMPONENT-INVENTORY.md` for the full slot-allowlist matrix.

### Data model

The canonical data shape is **`MuralDoc`** — see `MURAL-DOC-SCHEMA.md`. This schema is editor-independent:

- The AI pipeline emits `MuralDoc` JSON (not HTML).
- Storage persists `MuralDoc`.
- The editor loads `MuralDoc` through an adapter that converts to Puck's internal format on input and back on save.
- Nothing outside `editor-app/src/adapter/` ever sees Puck-internal JSON.

This decoupling means the editor library can be swapped later without touching AI, storage, or validation logic.

### Rendering and the print target

The editor has two rendering surfaces, driven from the same React components:

- **Edit surface** — the three-panel editor UI (see `Web Tool UI` below). Renders without `brand.css`, so the editor chrome is free to use its own styling.
- **Print surface** — a `/preview/:docId` route that runs Puck's `<Render>` with zero editor chrome, scoped under `app/preview/layout.tsx` which is the only place `brand.css` loads. This is the page the user prints from via `File > Print > Save as PDF`.

The print surface emits the same HTML and class names as the approved reskins (`reskins/product-one-sheet/mural-overview.html` and siblings). Visual-regression CI captures goldens for both the static reskins and the `/preview` routes; any drift between the two fails the build.

### brand.css invariant

- **Source of truth:** the approved reskins under `reskins/` (per `.cursor/rules/reskin-rules.mdc`). `brand.css` starts as a promotion of `reskins/product-one-sheet/mural-overview.html`'s inline styles; additional doc types contribute their rules here as they come online.
- **Not** a copy of `mural-pdf-generator-pattern-library.html`. The pattern library is a specimen showcase that also contains annotation-only styles (`.pattern-card`, specimen labels, code blocks) and does not carry the full reskin layout grids (`.combined-grid`, 4-up `.logo-strip`, 1fr/1fr `.stat-hero`). Sourcing `brand.css` from reskins closes that gap.
- **Scope of effect:** `brand.css` is loaded only by `/preview/*` routes. Static HTML files are unaffected; they keep their own inline styles.
- When a change to `brand.css` is needed, update it first, then re-run visual-regression to capture the intended diff.

### Print pipeline: browser-native, no Paged.js

**Decision (A14):** Use the browser's native `File > Print > Save as PDF` (Chromium's `page.pdf()` under the hood, Safari/Firefox's equivalents too). **Paged.js is NOT integrated.** Revisit only when multi-page paginated documents land.

**Rationale.** An audit run on 2026-04-24 (`editor-app/scripts/print-audit.mjs`) generated 8.5 × 11 in PDFs from both `/preview/product-one-sheet` and the static reskin `reskins/product-one-sheet/mural-overview.html`, using the same Chromium print engine. Results:

| Measure | Value |
|---|---|
| PDF size | 118.8 KB vs 118.7 KB (0.08% delta) |
| Print-media PNG diff | 2.56% of pixels (88,262 / 3,446,784) |
| Root cause of diff | 4 hand-authored `<br>` forced line breaks in the reskin (lines 381, 382, 403, 404) that our editor deliberately does not surface |
| Pixel-perfect regions | Brand bar, eyebrow, headline, intro copy, rule lines, stat-band heading, right-column quote (majority) |
| Drift regions | Body-copy bullet lists (cascading vertical offset from the forced breaks), and everything below them on the same page |

The CSS, font metrics, page dimensions, and layout engine match exactly. The delta is a **content-model** difference (we don't model forced `<br>`s, the reskin does), not a **pipeline** difference. Printing from the editor produces a document that is visually equivalent in every brand-relevant dimension: typography, spacing, grid, color, logo optical balance, rule lines, page frame.

**Follow-ups logged, not blocking:**

1. Visual regression continues to compare `/preview` to its own stored golden (not to the reskin). Hand-tuned reskins are not the correct bar for pixel-perfect automated comparison.
2. If product wants designers to be able to reproduce the reskin's hand-tuned breaks, add **soft line-break** support to `RichText` (Shift+Enter → `<br>` in a locked-down TipTap extension). Not in A14 scope.
3. Paged.js becomes worth re-evaluating only when a document type needs true multi-page pagination with running headers/footers/page numbers across pages. Single-page docs stay browser-native.

**Artifacts regenerate on demand:**

```
cd editor-app
npm run build && npm run start -- -p 3100  # in one shell
node scripts/print-audit.mjs               # in another
# outputs land in editor-app/print-audit/ (gitignored)
```

### AI generation pipeline

**Status (A15):** Wired end-to-end for `product-one-sheet`. Live, behind Azure OpenAI.

**Topology.** A single Next.js route — `POST /api/generate` — turns a user prompt into a `MuralDoc`:

```
/generate (client form)
  -> POST /api/generate (Node runtime, holds Azure key)
    -> Azure OpenAI chat.completions.create
       (model = AZURE_OPENAI_DEPLOYMENT, response_format: json_object)
    -> JSON.parse + isValidMuralDoc + muralDocToPuck round-trip
    -> stampTimestamps
    -> 200 { doc }
  <- saveDoc(doc) to localStorage
  <- router.push("/edit")
```

The browser never sees the Azure key; only the server-side route reads `AZURE_OPENAI_*` env vars (template at `editor-app/.env.local.example`).

**Provider choice.** Azure OpenAI was selected to match the `jmoore-ai.openai.azure.com` deployment that already exists for this project. The deployment serves GPT-5.4 today; the SDK call is `chat.completions.create()` with `response_format: { type: "json_object" }` for reliable JSON output.

**Why prompt-engineering, not strict JSON Schema mode.** A strict JSON Schema mirror of `MuralDoc` would be roughly 300 LOC of fragile type-mirror code with `nullable: true` on every optional field. Instead, the system prompt (`editor-app/src/ai/system-prompt.ts`) describes the schema in natural language, embeds the canonical fixture as a one-shot example, and enumerates the allowed strip / element / logo-key values. Server-side validation through `isValidMuralDoc` plus a `muralDocToPuck` round-trip guarantees that anything malformed never reaches the editor. One retry on validation failure, then 502 with the model's last error.

**v1 scope:**

- `product-one-sheet` only. Other doc types return 400.
- No streaming, no incremental rendering — single response, redirect on success.
- No automated end-to-end test against Azure (would need a live key in CI and a paid call per run). Pure-function tests of the prompt builder live at `editor-app/tests/ai/system-prompt.spec.ts`.
- Model errors surface inline on the form; user can retry without reloading.

**Follow-ups (not blocking):**

1. Add the remaining doc types to the system prompt and the `SUPPORTED_DOC_TYPES` allow-list.
2. Consider strict JSON Schema mode once we have telemetry on actual hallucination rates.
3. Add a "regenerate this section" affordance inside `/edit` that posts a partial-doc context to a future `/api/refine` route.

### Unified edit + preview surface

**Status (A16):** `/edit` is now the single UI surface for both editing and previewing. `/preview/:docType` still exists as a stable deep-link / golden-test target, unchanged.

**The toggle.** A segmented control in the `/edit` top bar swaps between two modes:

- **Edit** — the full Puck UI (Navigator + Canvas + Inspector). Selection outlines, dropzones, the brand bar, and component drag handles all visible.
- **Preview** — the same React component tree that `/preview/product-one-sheet` renders, with no editor chrome at all. This is what `File > Print > Save as PDF` produces.

**Shared renderer.** `src/components/preview/ProductOneSheetRenderer.tsx` is the canonical view of a `MuralDoc`. Both `/preview/product-one-sheet/page.tsx` and `/edit`'s preview pane import it. They are guaranteed pixel-identical because they share code, not because they happen to render similar markup.

**Both subtrees are mounted simultaneously** under `.edit-shell__edit` and `.edit-shell__preview`, toggled with `display: none`. This:

1. Preserves Puck's internal state (selection, scroll, undo stack) across mode switches.
2. Keeps the preview live: every Puck `onChange` syncs a `MuralDoc` mirror via `puckToMuralDoc`, so flipping the toggle shows the latest in-progress edits without any save step.
3. Lets `Cmd+P` print correctly from either mode — `@media print` rules in `styles/edit-shell.css` force the preview subtree as the only visible element on paper, regardless of the active screen mode.

**Tests.** `tests/visual/edit-smoke.spec.ts` includes a toggle test that asserts both panes mount, that the active mode controls visibility via `[data-mode]`, and that the preview pane shows the fixture content. The persistence tests are scoped to `.edit-shell__edit` to avoid double-matching across subtrees. The `/preview` visual-regression golden remains the print-fidelity contract; it didn't change as part of A16.

**Out of scope (deferred):**

- Fixing Puck's slot wrappers breaking grid-based layouts inside Edit mode (e.g. logos stacking vertically inside `.logo-strip`). Preview mode bypasses Puck entirely so it doesn't suffer this; Edit mode WYSIWYG fidelity is a follow-up.
- Restyling `/` and `/generate` to match the brand. Tracked separately.

### Additive, reversible migration

- No existing HTML file is modified. `mural-pdf-generator-starter.html`, `mural-pdf-generator-pattern-library.html`, `mural-pdf-generator.html`, and every file under `starters/` and `reskins/` continues to work exactly as before.
- Rollback at any point via `git revert` of the offending commits, or via the `checkpoint-pre-puck-editor` tag for a full reset.
- Until the editor ships, the static HTML kit remains the production path.

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

### How layers map to the editor hierarchy

When the Puck-based editor is used, the layers above correspond directly to levels of the Section / Strip / Element hierarchy described in `Editor Architecture`:

- Layer 1 (Foundation) lives in two places that must agree visually: the reskins' inline styles (static kit) and `editor-app/styles/brand.css` (editor `/preview/*`). The latter is promoted from the former per the `brand.css invariant` above.
- Layer 2 (Page frames) is composed as page chrome (`BrandBar`, `PageFooter`, `PageNumber`) — see the page-chrome list in `EDITOR-COMPONENT-INVENTORY.md`.
- Layer 3 (Page layouts) corresponds to Sections and the Strips they contain. Each named layout here maps to one or more Strip types.
- Layer 4 (Specialized markup) corresponds to dedicated Strip types (e.g. `CompareTable`, `MatrixTable`, `StatCluster`, `LogoStrip`) and a small number of specialized Elements (`StatNumeral`, `LogoBox`).

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

The PDF generator runs as a web tool within the Mural Creative Team app (Next.js). The UI follows a three-panel editor pattern inspired by AirOps SlideGen and is built on **Puck**, a React visual-editor library that gives us the Section / Strip / Element hierarchy out of the box (see `Editor Architecture`). Puck handles drag-and-drop, slot allowlists, and the inspector form layer; brand enforcement comes from our own component props, bounded field types, and `brand.css`.

### Entry point

The user sees the 7 document types in a left nav, each with a name and short description. Selecting a type loads its starter example in the preview panel.

### Three-panel editor

- **Left panel — page navigator**: Document type selector at top, thumbnail strip of all pages below. Click to select a page. Page count updates when user adds/removes pages via the inspector.
- **Center panel — canvas**: Live rendered preview at approximately actual proportions. Below the preview, a **layout variant strip** shows 5 clickable SVG thumbnails (Full-width hero, Two-column, Sidebar, Table/matrix, Stat grid) for visually switching the selected page's layout.
- **Right panel — inspector**: Organized into a pinned export bar and 7 collapsible sections:

#### Pinned export bar (top, non-scrolling)
- Filename input (auto-populated from doc type, editable)
- Generate PDF button (primary action)
- Error messages appear below the button

#### Collapsible sections (scrollable)

1. **Document settings**: Topic label, Audience (text), Tone (select: Professional, Conversational, Technical, Bold), Output length (select: Concise/1pg, Standard/2pg, Detailed/3+pg)
2. **Content**: Toggle between Paste mode (freeform textarea) and Structured mode (Headline, Deck, Body, Stats, CTA as separate fields) via a segmented control
3. **Images**: Search input (placeholder for future brand image library), Upload button (accepts jpg/png/webp/svg, stores as base64), thumbnail grid of uploaded images with select/remove
4. **Page layout**: Document-default layout selector (dropdown) + per-page overrides shown when a page has a non-default layout (with Reset to default link). Syncs with the canvas layout strip.
5. **Brand colors**: Grid of 11 Mural brand color swatches for accent theming. Document-level default + per-page overrides (hybrid pattern).
6. **Page count**: +/− buttons (min 1, max 6) that update the left navigator's page list
7. **AI refinement**: Freeform prompt for custom AI adjustments

### Generation flow

1. User selects a document type → sees the starter example
2. User fills in document settings and content (paste or structured)
3. User optionally adjusts page layouts, colors, and page count
4. User hits "Generate PDF" → AI produces a new document using the selected type's starter as the structural reference, the user's content, and all inspector settings
5. User reviews the result in the canvas, adjusts per-page settings, and uses the AI prompt to refine specific pages
6. User exports via browser print (File > Print > Save as PDF)

## Export Workflow

1. Open the document in the preview canvas (static HTML file, or the `/preview/:docId` route in the editor — both produce the same visual output; see `Editor Architecture > brand.css invariant`)
2. Choose `File > Print` (or click Export PDF button)
3. Confirm `Letter` paper size, `100%` scale, backgrounds enabled
4. Save the PDF

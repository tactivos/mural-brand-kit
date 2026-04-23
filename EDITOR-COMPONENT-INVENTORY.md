# Editor Component Inventory — v1 (Product one-sheet)

**Status:** Draft v0.1. Depends on [MURAL-DOC-SCHEMA.md](MURAL-DOC-SCHEMA.md).
**Scope:** The complete list of registered entities (Sections, Strips, Elements) needed to build a Product one-sheet end-to-end in the Puck editor. 24 entities total.

## How to read this doc

Each entity has:

- **Name** — used in `MuralDoc` as the `type` discriminator and in Puck's `config.components` registry.
- **Level** — Section, Strip, or Element.
- **Emits** — the exact pattern library CSS class(es) the React component renders. No inventions.
- **Pattern library refs** — line ranges in [mural-pdf-generator-pattern-library.html](mural-pdf-generator-pattern-library.html) the component must match pixel-for-pixel.
- **Props** — TypeScript prop shape (from [MURAL-DOC-SCHEMA.md](MURAL-DOC-SCHEMA.md)).
- **Slots** (Sections/Strips only) — children types allowed.
- **Constraints** — field validators enforced in the Puck inspector.
- **Quality-bar reference** — the reskin HTML file that serves as the golden for visual regression.

Everything else — fonts, colors, spacing — comes from `editor-app/styles/brand.css` (a verbatim copy of the pattern library's `<style>` block). No CSS-in-JS. No overrides.

## Shared CSS tokens (locked)

These come from the pattern library `:root` block, lines 11-40. Every component uses these; none override them.

```
--page-width: 8.5in;  --page-height: 11in;
--page-padding-x: 0.62in;  --page-padding-y: 0.58in;
--hang-offset: 0.34in;
--body-copy: 10pt;  --body-leading: 13pt;  --body-space: 6.5pt;
--small-copy: 8.75pt;
--grid-columns: 6;  --grid-gutter: 0.24in;  --grid-column: 1.01in;
--jade: #00C27A;  --natural: #EDEDD8;  --black: #000000;  --white: #FFFFFF;
--font-headline: 'STK Bureau', 'STK Bureau Serif', 'Merriweather', Georgia, serif;
--font-body: 'ABC Social', Arial, Helvetica, sans-serif;
```

Reference reskin for Product one-sheet golden: [reskins/product-one-sheet/mural-overview.html](reskins/product-one-sheet/mural-overview.html).

---

## Page chrome (3 entities)

### 1. `BrandBar`
- **Level:** Element (page chrome; rendered once per `Page`)
- **Emits:** `<div class="brand-bar">` with 5 spans (pink, red, green, yellow, blue per `.cursorrules` Brand Bar proportions 16 / 33 / 9.5 / 15 / 26)
- **Pattern library refs:** lines 75–80 (class), 1298 (usage)
- **Props:** `{}` — no user-editable props
- **Constraints:** height locked to 10px; proportions locked per spec
- **Notes:** NEVER use equal fifths. NOT always at the bottom edge per `.cursorrules`.

### 2. `PageFooter`
- **Level:** Element (page chrome)
- **Emits:** `<div class="page-footer">` containing `<a class="page-signature">` with wordmark SVG + `page-signature-url` + `<div class="page-number">`
- **Pattern library refs:** lines 1322–1328, reused on every page
- **Props:**
  ```ts
  { url: "mural.co" | "luma.institute"; lockup?: "mural" | "mural-lead-luma" | "luma-lead"; pageNumber?: number }
  ```
- **Constraints:** baseline-aligned (per PDF-GENERATOR-KIT.md lines 103, 188); lockup choice governed by kit rules (lines 104-107)
- **Notes:** `pageNumber` only rendered when document has 2+ pages (per reskin-rules.mdc "Page numbers only on multi-page documents").

### 3. `PageNumber`
- **Level:** Element (child of `PageFooter`; exposed separately for single-page hiding)
- **Emits:** `<div class="page-number">`
- **Props:** `{ value: number }`
- **Constraints:** omit entirely when total pages < 2

---

## Sections (4 entities)

Sections own vertical rhythm, background variant, and the top-rule rule. They cannot nest other Sections.

### 4. `OpenerSection`
- **Level:** Section
- **Emits:** `<header class="page-meta">` (topic label + top rule) + `<section class="page-opening">` wrapper
- **Pattern library refs:** 93–115 (meta), 180–183 (opening), 1302–1320 (usage)
- **Props:** `{ suppressTopRule?: boolean }`
- **Slots:** `strips: Strip[]` — allowlist: `FiveColOpenerGrid | CombinedGrid | BodyGroup`. **Refuses** `StatCluster`, `LogoStrip`, `AwardCallout`, matrix/compare strips (preserves "clean hero" rule from reskin-rules.mdc).
- **Constraints:** max 1 `OpenerSection` per document; only on page 1.
- **Quality-bar note:** per reskin-rules "Clean hero area — page-opening should be full-width and uncluttered. Do not place quotes, stats, or sidebar content alongside the title."

### 5. `ContentSection`
- **Level:** Section
- **Emits:** `<section class="section">`
- **Pattern library refs:** 254–261
- **Props:** `{ suppressTopRule?: boolean; topMargin?: "default" | "tight" }`
- **Slots:** `strips: Strip[]` — allowlist: any Strip type except `StatBand` (use `StatBandSection` instead).
- **Constraints:** `suppressTopRule` required when the first strip is `LogoStrip` or a colored band (per reskin-rules "No rule line before colored background blocks").

### 6. `StatBandSection`
- **Level:** Section
- **Emits:** `<section class="section">` with `border-top: none` + child `<div class="stat-band">` inside
- **Pattern library refs:** 800–806 (band), 1697 (usage)
- **Props:** `{ background?: "natural" }` — default `natural`
- **Slots:** `strips: Strip[]` — allowlist: `StatCluster` only
- **Constraints:** suppresses top rule automatically; max 1 per page.

### 7. `ClosingSection`
- **Level:** Section
- **Emits:** `<section class="section">` (plain) with `PageFooter` following outside
- **Pattern library refs:** 1455–1460 (CTA usage), PDF-GENERATOR-KIT.md lines 173–188
- **Props:** `{ tone?: "default" | "tinted" }` — tinted uses `--natural` fill, square corners per kit rules
- **Slots:** `strips: Strip[]` — allowlist: `BodyGroup | AwardCallout | BodyGroup` (closing statement + CTA)
- **Constraints:** may appear only as the last Section of the last Page.

---

## Strips (5 entities)

Strips own column layout. They cannot nest other Strips (flat child lists / named slots only).

### 8. `FiveColOpenerGrid`
- **Level:** Strip (multi-slot)
- **Emits:** a CSS grid with 5 columns — narrative in cols 1–3, column 4 empty, sidebar rail in column 5 (per PDF-GENERATOR-KIT.md lines 95-100)
- **Pattern library refs:** none directly (composition rule); see luma-practitioner-certification-program.html for the target application
- **Props:** `{}` (layout is fixed)
- **Slots:**
  - `main: Element[]` — allowlist: `Headline | Deck | IntroCopy | BodyCopy | BulletList | Blockquote`
  - `rail: Element[]` — allowlist: `SubHeading | BodyCopy | BulletList | StatNumeral`
- **Constraints:** `main` requires at least one `Headline`.
- **Notes:** Only used inside `OpenerSection`.

### 9. `CombinedGrid`
- **Level:** Strip (multi-slot)
- **Emits:** `<div class="combined-grid">` (grid-template-columns: `5.05in 1fr` per reskin-rules)
- **Pattern library refs:** 276–282
- **Props:** `{}`
- **Slots:**
  - `content: Element[]` — allowlist: `BodyCopy | BulletList | SubHeading | IntroCopy`
  - `quote: Element[]` — allowlist: `Blockquote` (default variant, max 1)
- **Constraints:** Quote placement in right column enforced (reskin-rules "Quote placement consistency").

### 10. `PillarGridThreeUp`
- **Level:** Strip (single-list)
- **Emits:** `<div class="pillar-grid three-up">` (`max-width: 5.05in`)
- **Pattern library refs:** 283–293
- **Props:** `{}`
- **Slots:** `children: Element[]` — allowlist: `BodyGroup`-equivalent mini-blocks (each: `SubHeading + BodyCopy`); min 3, max 3
- **Constraints:** appears below body copy in the same content flow; no rule line above (`suppressTopRule: true` on parent Section — validator enforces).

### 11. `LogoStrip`
- **Level:** Strip (single-list)
- **Emits:** `<div class="proof-strip">` wrapping a 4-up logo grid
- **Pattern library refs:** 300–314, 1771–1780 (pattern), reskin-rules.mdc "Logo handling"
- **Props:** `{}`
- **Slots:** `children: Element[]` — allowlist: `LogoBox` only
- **Constraints:** min 3, max 6 logos (PDF-GENERATOR-SPEC.md line 181). Parent `ContentSection.suppressTopRule` required when LogoStrip is first strip.

### 12. `StatCluster`
- **Level:** Strip (single-list)
- **Emits:** `<div class="stat-grid">` (multi-stat ROI grid)
- **Pattern library refs:** 807–813, 1696–1720 (pattern)
- **Props:** `{}`
- **Slots:** `children: Element[]` — allowlist: `StatNumeral` only
- **Constraints:** min 2, max 4 stats; only used inside `StatBandSection`.

---

## Elements: Text (10 entities)

Widths on leaves, not parents. Every text element that holds body-measure content sets `max-width: min(5.05in, 100%)` on itself.

### 13. `Eyebrow`
- **Level:** Element
- **Emits:** `<p class="eyebrow">`
- **Pattern library refs:** 201–209
- **Props:** `{ text: string }`
- **Constraints:** `maxLength: 64` chars. Uppercase styling comes from CSS.
- **Notes:** Used for the topic label (utilitarian, repeated per page) and for pattern labels.

### 14. `Headline`
- **Level:** Element
- **Emits:** `<h1>` (or `<h2>` when `level: 2`)
- **Pattern library refs:** 117–127 (h1/h2 specs)
- **Props:** `{ text: string; level?: 1 | 2 }`
- **Constraints:** 2–4 lines enforced via live counter (PDF-GENERATOR-SPEC.md line 177). No manual `<br>` per reskin-rules "No forced line breaks".
- **Notes:** `line-height: 1.08` per reskin-rules (not `1.1`).

### 15. `SubHeading`
- **Level:** Element
- **Emits:** `<h3>`
- **Pattern library refs:** 129–133
- **Props:** `{ text: string }`
- **Constraints:** `maxLines: 2`. Defaults to `ABC Social Light` treatment per PDF-GENERATOR-KIT.md line 234.

### 16. `SectionHeading`
- **Level:** Element
- **Emits:** `<h4>` or `<p class="specimen-section-head">` depending on hierarchy context
- **Pattern library refs:** 135–139 (h4), 525–533 (specimen section head)
- **Props:** `{ text: string; weight?: "light" | "default" }`
- **Constraints:** `maxLines: 1` preferred, 2 allowed.

### 17. `Deck`
- **Level:** Element
- **Emits:** `<p class="deck">`
- **Pattern library refs:** 184–188 (`margin-top: 14px; max-width: 34em`)
- **Props:** `{ text: string }`
- **Constraints:** 45–75 words (PDF-GENERATOR-SPEC.md line 178). Color is `var(--black)` (not `--muted`) per reskin-rules.

### 18. `IntroCopy`
- **Level:** Element
- **Emits:** `<p class="intro-copy">` or `<div class="intro-copy">` for multi-paragraph
- **Pattern library refs:** 189–200
- **Props:** `{ paragraphs: InlineNode[][] }`
- **Constraints:** `margin-top: 0.22in; max-width: 5.05in` per reskin-rules "Headline-to-body spacing". Total word count ≈ 60–120.
- **Notes:** No rule line between a headline and its `IntroCopy`.

### 19. `BodyCopy`
- **Level:** Element
- **Emits:** `<p class="body-copy">` or a wrapping container with `<p>` children when multi-paragraph
- **Pattern library refs:** global `p, li` at 141–147 + `.body-copy` width rule from reskin-rules
- **Props:** `{ content: InlineNode[]; paragraphs?: InlineNode[][] }`
- **Constraints:** leaf-level `max-width: min(5.05in, 100%)`. Paragraph spacing `var(--body-space)` = 6.5pt (reskin-rules "Body copy paragraph spacing"). Page total 180–260 words (PDF-GENERATOR-KIT.md line 124).
- **Rich text:** only `bold` and `link` inline marks. See `InlineLink` below.

### 20. `BulletList`
- **Level:** Element
- **Emits:** `<ul class="specimen-list">` or `<ol>` when `style: "number"`
- **Pattern library refs:** 546–567
- **Props:** `{ items: Array<{ content: InlineNode[] }>; style?: "bullet" | "number" }`
- **Constraints:** 2–5 items (PDF-GENERATOR-SPEC.md line 179). `max-width: 5.05in` on the list. Items use same body rhythm as paragraphs.
- **Notes:** Avoid "horsey bullets" per PDF-GENERATOR-KIT.md lines 365–366. Bullet subheads stay smaller and quieter than the primary section heading.

### 21. `Blockquote`
- **Level:** Element
- **Emits:** `<blockquote>` with optional `.quote-large` / `.quote-display` modifier
- **Pattern library refs:** 1805–1832 (three variants), reskin-rules "Quotes"
- **Props:**
  ```ts
  {
    text: string;
    variant: "default" | "large" | "display";
    attribution?: { name: string; role?: string; logoKey?: string };
  }
  ```
- **Constraints:** 20–45 words (PDF-GENERATOR-SPEC.md line 180). `max-width` varies by variant: default 4.9in, large 15.8em, display 31pt / 1.08 / -1.5px.
- **Notes:** Hanging punctuation `-0.065in` (default) or `-0.08in` (large); display hangs at `-0.14in` per reskin-rules. Attribution: 8.2pt / 1.2 / color `var(--black)`, `margin-top: 0.1in`, name `<strong>`.

### 22. `InlineLink` (inline mark — not a standalone component)
- **Level:** Inline mark inside `BodyCopy`/`BulletList`/`IntroCopy` content trees
- **Emits:** `<a href="...">`
- **Props (as an `InlineNode`):** `{ type: "link"; href: string; label: string; marks?: ["bold"] }`
- **Constraints:** color forced to `#3776E4` (Blue ADA) at render; `text-decoration-thickness: 1px`; `text-underline-offset: 2px`. No color picker, no underline options in the editor UI.
- **Notes:** Exposed as a rich-text toolbar button, not as a draggable component. Listed here for completeness of the v1 element count (24).

---

## Elements: Data / Proof (2 entities)

### 23. `StatNumeral`
- **Level:** Element
- **Emits:** `<div class="stat-card">` containing `<div class="stat-number">` + `<div class="stat-copy">`
- **Pattern library refs:** 814–832
- **Props:** `{ numeral: string; label: string; source?: string }`
- **Constraints:** `numeral` ≤ 8 chars (e.g. "87%", "3.2×", "$4.1M"). `label` ≤ 14 words.
- **Notes:** Only appears inside `StatCluster`. Oversized numerals are the primary visual anchor (PDF-GENERATOR-KIT.md "Stat Pattern Rules").

### 24. `LogoBox`
- **Level:** Element
- **Emits:** `<div class="logo-box has-logo">` with `<img>` inside
- **Pattern library refs:** 888–909
- **Props:**
  ```ts
  {
    logoKey: string;      // key in editor-app/data/logo-manifest.json
    variant: "auto" | "B" | "W";
    assetScale?: number;  // default 1
    assetShiftX?: string; // e.g. "-0.02in"
    assetShiftY?: string;
  }
  ```
- **Constraints:** `logoKey` must exist in `logo-manifest.json`. `variant: "auto"` picks `_B` on light backgrounds, `_W` on dark, per reskin-rules "Logo handling".
- **Notes:** Per-logo optical balancing is required. Default starting state must be as balanced as possible; expect light manual refinement for unusual marks.

---

## Summary count

| Level   | Count | Names |
|---------|------:|-------|
| Page chrome | 3 | `BrandBar`, `PageFooter`, `PageNumber` |
| Section | 4 | `OpenerSection`, `ContentSection`, `StatBandSection`, `ClosingSection` |
| Strip   | 5 | `FiveColOpenerGrid`, `CombinedGrid`, `PillarGridThreeUp`, `LogoStrip`, `StatCluster` |
| Element (text) | 10 | `Eyebrow`, `Headline`, `SubHeading`, `SectionHeading`, `Deck`, `IntroCopy`, `BodyCopy`, `BulletList`, `Blockquote`, `InlineLink` |
| Element (data) | 2 | `StatNumeral`, `LogoBox` |
| **Total** | **24** | |

If the Product one-sheet prototype needs a component not in this list, that's a scope decision — add it to this inventory before implementing, don't invent it in a React file.

## Slot allowlist matrix (what fits where)

| Parent ↓ / Child → | Opener | Content | StatBand | Closing | FiveCol | Combined | Pillar3 | LogoStrip | StatCluster |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `Page.sections` | ✓ (pg1) | ✓ | ✓ | ✓ (last) | — | — | — | — | — |
| `OpenerSection.strips` | — | — | — | — | ✓ | ✓ | — | — | — |
| `ContentSection.strips` | — | — | — | — | — | ✓ | ✓ | ✓ | — |
| `StatBandSection.strips` | — | — | — | — | — | — | — | — | ✓ |
| `ClosingSection.strips` | — | — | — | — | — | ✓ | — | — | — |

Leaf allowlists are in the per-component sections above.

## Validation rules summary (table form)

| Entity | Constraint | Enforcement |
|--------|-----------|-------------|
| `Headline.text` | 2–4 lines | Live line counter + reject on save |
| `Deck.text` | 45–75 words | Live word counter + soft warning |
| `BulletList.items` | 2–5 items | Max-items button disabled after 5 |
| `Blockquote.text` | 20–45 words | Live counter + variant-aware |
| `LogoStrip.children` | 3–6 logos | Add-logo button disabled at 6 |
| `BodyCopy` aggregate per page | 180–260 words | Page-level soft warning only |
| `InlineLink` | color = `#3776E4` | Forced at render, no UI toggle |
| Bold text | `font-weight: 700` | Forced at render, no UI toggle |
| Em dashes | `—` with `&#8239;` hair spaces | Paste transform |
| Smart quotes | `"` / `"` | Paste transform |

Overflow behavior on any limit: live counter → soft warning → AI trim suggestion → override-with-warning. Never silently drop content.

## Open questions (not v0.1 blockers)

- **`BodyGroup` as a Strip:** do we need a generic "ordered block of elements" strip, or does a single-slot section suffice? Current thinking: keep `BodyGroup` as a fallback strip for simple "heading + body" sequences that don't need a grid. Decide during component-build.
- **Per-element hanging offsets:** `Blockquote.quote-open` hangs at `-0.065in` / `-0.08in` / `-0.14in` depending on variant. Should this be a prop or derived from variant? Leaning derived.
- **Multi-page Product one-sheet:** Spec defines 1–2 pages for Product one-sheet. v1 prototype should support both. Page 2 template composition (sidebar-heavy layout) may need a sixth Strip type — defer until page 2 is in scope.

## Next steps

1. Review this inventory with brand + engineering.
2. Lock slot allowlists and validation rules.
3. Build `logo-manifest.json` enumerating approved customer logos (`_B` / `_W` paths, default `assetScale`, aspect ratio).
4. Scaffold `editor-app/` (Next.js + TypeScript, no Puck yet): schema types, validators, `logo-manifest.json`, adapter stub.
5. Begin copying `brand.css` (additive migration step 3).

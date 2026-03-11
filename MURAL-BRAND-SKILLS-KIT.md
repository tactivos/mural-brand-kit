# Mural Brand Guidelines — Project Context

This is a single self-contained HTML file (`mural-brand-guidelines.html`) that serves as the complete Mural brand guidelines and web design system. All CSS, JS, and SVG assets are inlined — no external dependencies besides Google Fonts (Merriweather).

## Brand Colors (canonical — sourced from logo SVGs)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Mural Red | #FF4B4B | 255, 75, 75 | Brand bar, accents |
| Mural Green | #00843F | 0, 132, 63 | Brand bar, logo |
| Mural Blue | #5887FF | 88, 135, 255 | Brand bar, accents |
| Mural Pink | #FC83FF | 252, 131, 255 | Brand bar, accents |
| Mural Yellow | #FFAA00 | 255, 170, 0 | Brand bar, accents |
| Jade | #00C27A | 0, 194, 122 | Primary brand green, CTAs, links |
| Spring | #9FEC7F | 159, 236, 127 | Gradients, data viz |
| Mint | #B4F5C0 | 180, 245, 192 | Backgrounds, subtle fills |
| Natural | #EDEDD8 | 237, 237, 216 | Warm background surfaces |
| Black | #000000 | — | Text, dark sections |
| White | #FFFFFF | — | Backgrounds, light text |
| Red ADA | #E02935 | 224, 41, 53 | Accessible variant of red |
| Blue ADA | #3776E4 | 55, 118, 228 | Accessible variant of blue |

## Brand Bar

Order and proportions (left to right):
- Pink (#FC83FF) — flex: 16
- Red (#FF4B4B) — flex: 33
- Green (#00843F) — flex: 9.5
- Yellow (#FFAA00) — flex: 15
- Blue (#5887FF) — flex: 26

NOT equal fifths. NOT always at the bottom edge of a frame.

## Typography

### Brand (presentations, print, general brand)
- Headlines: Merriweather Light (300) — loaded via Google Fonts
- Body: Arial

### Web Design System
- Headlines: STK Bureau Light (300)
- Body: ABC Social — Light (300), Medium (500), Bold (700)
- Base size: 16px (1rem)
- Use rem units, clamp() for fluid scaling

## Key Design Tokens

### Spacing (desktop / mobile)
- tiny: 2px / 2px
- xxsmall: 4px / 4px
- xsmall: 8px / 8px
- small: 16px / 16px
- medium: 32px / 20px
- large: 48px / 24px
- xlarge: 64px / 32px
- xxlarge: 80px / 48px
- huge: 96px / 56px
- xhuge: 128px / 64px
- xxhuge: 192px / 72px

### Border Radius
- radius-sm: 4px (0.25rem)
- radius-md: 8px (0.5rem)
- radius-mdl: 12px (0.75rem)
- radius-lg: 16px (1rem)
- radius-xl: 24px (1.5rem)
- radius-2xl: 32px (2rem)

### Shadow
- shadow-default: 0 4px 4px rgba(0,0,0,0.08)
- shadow-hover: 0 12px 12px rgba(0,0,0,0.12)
- shadow-elevated: 0 0 1px rgba(11,41,70,0.32), 0 24px 20px rgba(42,82,121,0.08)

### Grid
- 12-column, 32px (2rem) gutters
- Container Large: 1280px (80rem)
- Container Medium: 1024px (64rem)
- Container Small: 768px (48rem)

## Background Dot-Grid Patterns
- Light canvas: #FFFFFF bg, rgba(0,0,0,0.18) dots, 18px grid
- Dark canvas: #000000 bg, rgba(255,255,255,0.35) dots, 18px grid
- Mint canvas: #B4F5C0 bg, rgba(0,60,20,0.12) dots, 18px grid

## Brand Motion
- Easing: cubic-bezier(0.22, 1, 0.36, 1)
- Standard duration: 0.3s for UI transitions

## LUMA Sub-brand Colors
- LUMA Red: #EE3A43
- Dark Olive: #575651
- Light Olive: #989891
- Deep Red: #C41230
- Yellow: #ECB12E
- Green: #8EA84E
- Blue: #2F9DBA

## Form Elements (Web Design System)

- **Text inputs:** `.wds-form-input` with `.light-input` or `.dark-input`. Base: 18px font, 15px 12px padding, 4px radius, 1px solid border. Default/filled: border and placeholder `#808080`; light bg `var(--white)`, dark bg `var(--black)`. Hover fill: light `#F0F0F0`, dark `#1e1e1e`. Focused (mouse): border `#00c27a` only. Keyboard focused (`:focus-visible`): border `#00c27a` + 3px ring light `#bfffd2`, dark `#073b28`. Labels: `.wds-form-field-label` 14px, font-weight 500; `.light-label` black, `.dark-label` white. State table: `.wds-form-input-table` (5 columns), `.wds-layout-label + .wds-form-input-table` gets 12px margin-top.
- **Checkboxes & radios:** Tokens in `:root`: `--primary-gray`, `--form-bg-dark`, `--form-control-border`, `--form-focus-ring-light`, `--form-focus-ring-dark`, `--form-hover-light`, `--form-hover-dark`, `--surface-pills-bg`. Option row: `.wds-check-item` (flex, 12px gap, 8px padding, 4px radius); dark context: wrap in `.wds-check-dark-block`. Checkbox: `.wds-check-box` 20×20px, 4px radius; radio: `.wds-radio-circle` + `.wds-radio-dot`. States: Default, Hover, Keyboard focused, Selected.
- **Filter buttons:** Filled pills; 4px radius, 8px padding, 14px. Light: default `#f0f0f0`, hover `#e2e2e2`, focus ring 3px `#bfffd2`, selected `#D5F8E0`. Dark: default `#373737`, hover `#545454`, focus ring 4px `#bfffd2`, selected `#00C27A`. Use `.wds-check-table` + `.wds-check-state-label` for state table layout when documenting.
- **Toggle switch:** Track 40×22px, radius 11px; off `rgba(0,0,0,0.15)`, on `var(--jade)`; thumb 18×18px white, `box-shadow: 0 1px 3px rgba(0,0,0,0.2)`.

## File Structure
- `mural-brand-guidelines.html` — the complete brand guide (single file, self-contained)

## Editing Guidelines
- Keep everything in the single HTML file (inline CSS, inline JS, inline SVGs)
- Preserve the sidebar navigation — add `<a href="#section-id">` links when adding sections
- Use CSS custom properties (defined in :root) for all brand colors
- Follow existing section pattern: `<section id="..."><div class="section-inner">...</div></section>` with `<hr class="divider">` between sections
- The sidebar nav is grouped: Foundation, Voice, Application, Web Design System, Visual Rules, Sub-brand

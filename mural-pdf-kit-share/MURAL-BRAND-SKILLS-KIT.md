# Mural Brand Guidelines — Project Context

This project is a single self-contained HTML file, `mural-brand-guidelines.html`, that serves as the complete Mural brand guidelines and web design system. All CSS, JS, and most assets are inline or local to the project. The hero download button points to `MURAL-BRAND-SKILLS-KIT.md`.

## Core Brand Sections

### Foundation
- Brand Messaging
- Logo
- Color
- Typography

### Voice
- Tone of Voice
- Editorial

### Supporting Graphics
- Brand Bar
- Background Patterns
- Data Visualization
- Mascot
- Photography

### Web Design System
- Grid System
- Spacing
- Radius & Shadow
- Web Typography
- Buttons
- Form Elements
- Icons
- Page Components
- Interaction & Motion

### Visual Rules
- Do's & Don'ts

### Sub-brand
- LUMA

### Co-branding
- Partnerships
- Integrations
- Collaborations

## Logo

The Mural logo exists in two forms:
- **Wordmark** — use for big brand moments where name recognition matters
- **Symbol** — use where it is already clear the communication comes from Mural

Approved variants for both:
- **Multicolor** — for white or natural backgrounds only
- **Black** — for light backgrounds
- **White** — for dark backgrounds

The multicolor mark is built from the five core colors plus the two foundational black bars. The bars are a required part of the logo and must not be removed or altered.

### Logo misuse
The guide now includes a dedicated `Logo misuse` section with paired example cards for:
- Dark-background mismatches
- Recolored logos
- Disproportionate scaling
- Multicolor logos placed on photos
- Multicolor logos placed on unsupported backgrounds
- Altered or removed black bars

## Brand Colors

Canonical brand colors:

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
| Red ADA | #E02935 | 224, 41, 53 | Accessible red |
| Blue ADA | #3776E4 | 55, 118, 228 | Accessible blue |

## Brand Bar

Fixed stripe order and proportions:
- Pink `#FC83FF` — `16`
- Red `#FF4B4B` — `33`
- Green `#00843F` — `9.5`
- Yellow `#FFAA00` — `15`
- Blue `#5887FF` — `26`

Rules:
- Not equal fifths
- Not always pinned to the bottom edge
- Preserve order and proportion

## Typography

### Brand typography
- Headlines: Merriweather Light (300)
- Body: Arial

### Web typography
- Headlines: STK Bureau Serif
- Body: ABC Social
- Base size: `16px / 1rem`
- Prefer `rem` units and `clamp()` for fluid scaling

### LUMA typography
- Headlines: ITC Charter BT
- Body Copy: Helvetica Neue

## Editorial

The Editorial section now includes:
- Quick reference
- "Do not use" words
- Capitalization
- Punctuation
- Numbers, dates, & times
- Writing about people
- Accessibility

Key additions reflected in the guide:
- AP Style link styling in black with underline-on-default / remove-on-hover behavior
- Concise punctuation rules
- Number/date/time formatting guidance
- Accessibility guidance covering headings, organization, directions, captions, mobile optimization, alt text, and CTA phrasing

## Photography

The Photography section sits under Supporting Graphics and includes:

### Overview
- Photography should feel real, human, and grounded in how people actually work
- Favor documentary-style moments over staged scenes
- Prioritize candid interaction, active work, authentic environments, and process
- Make the work the hero rather than posed portraiture

### Casting
- Celebrate diversity across identities, ages, ethnicities, and lived experiences
- Cast people who feel genuine and believable on camera
- Describe scenarios and mood, but do not over-script behavior
- Avoid cliched corporate or stock-photo energy

## Supporting Graphics

### Background Patterns
- Light canvas: white background, subtle dark dots, 18px grid
- Dark canvas: black background, subtle white dots, 18px grid
- Mint canvas: mint background, subtle green dots, 18px grid

### Data Visualization
- Use Spring and Jade for emphasis with accessible colors where needed

### Mascot
- `Anku` is the named Mural mascot

## Key Design Tokens

### Spacing
- tiny: `2px / 2px`
- xxsmall: `4px / 4px`
- xsmall: `8px / 8px`
- small: `16px / 16px`
- medium: `32px / 20px`
- large: `48px / 24px`
- xlarge: `64px / 32px`
- xxlarge: `80px / 48px`
- huge: `96px / 56px`
- xhuge: `128px / 64px`
- xxhuge: `192px / 72px`

### Border Radius
- radius-sm: `4px`
- radius-md: `8px`
- radius-mdl: `12px`
- radius-lg: `16px`
- radius-xl: `24px`
- radius-2xl: `32px`

### Shadow
- shadow-default: `0 4px 4px rgba(0,0,0,0.08)`
- shadow-hover: `0 12px 12px rgba(0,0,0,0.12)`
- shadow-elevated: `0 0 1px rgba(11,41,70,0.32), 0 24px 20px rgba(42,82,121,0.08)`

### Grid
- 12-column system
- 32px / 2rem gutters
- Large container: `1280px`
- Medium container: `1024px`
- Small container: `768px`

## Buttons

All buttons:
- Height `40px`
- Radius `8px`
- ABC Social Medium `16px`
- `border: 2px solid transparent`

### Primary
- Jade background, black text
- Mint arrow box with black chevron

### Secondary
- Black background, white text
- Dark gray arrow box with white chevron

### Tertiary
- Light and dark variants

### Link buttons
- Light and dark variants
- Chevron shifts right on hover

### CTA examples
CTA section examples in the guide were updated to use the defined brand button styling rather than custom ad hoc styles.

## Form Elements

Included components:
- Text inputs
- Selects
- Checkboxes
- Radios
- Filter switches

## Page Components

Included components:
- Content cards
- Category tags
- CTA sections

## LUMA

The LUMA section now includes:
- LUMA color palette
- LUMA typography
- LUMA logos (full color, white, black; horizontal and stacked)
- LUMA supporting graphic
- LUMA icons in card layout
- Mural + LUMA logo lockups

LUMA colors:
- LUMA Red: `#EE3A43`
- Dark Olive: `#575651`
- Light Olive: `#989891`
- Deep Red: `#C41230`
- Yellow: `#ECB12E`
- Green: `#8EA84E`
- Blue: `#2F9DBA`

## Co-branding

The Co-branding area now includes three sections:

### Partnerships
- Partner logo lockups should be created by the Creative team
- Pair wordmark with wordmark and symbol with symbol
- When Mural leads, use Mural as the scaling reference
- Includes side-by-side partner wordmark and symbol examples

### Integrations
- Use symbol lockups connected by a `+`
- Scale partner symbols for visual balance
- Example spec in guide:
  - symbols at `140px` height
  - `+` in ABC Social Light at `70pt`
  - `+` is black and half the symbol height
- Includes downloadable integration lockups and example SVG

### Collaborations
- Use wordmark lockups connected by a black stroke
- Stroke should be visible but not overpower the logos
- Example spec in guide:
  - wordmarks at `140px` height
  - stroke thickness `1.5px`
  - stroke matches Mural wordmark height
- Includes downloadable collaboration lockups and example SVG

## Motion
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Standard duration: `0.3s`

## File Structure
- `mural-brand-guidelines.html` — complete self-contained guide
- `MURAL-BRAND-SKILLS-KIT.md` — downloadable companion skills kit
- Local image and SVG assets live beside the HTML file as needed for guide examples

## Editing Guidelines
- Keep the guide in the single HTML file
- Preserve the section pattern: `<section id="..."><div class="section-inner">...</div></section>`
- Separate top-level sections with `<hr class="divider">`
- Use CSS custom properties in `:root` for brand values
- Keep sidebar navigation aligned with actual page section order
- Reuse existing card and grid patterns where possible
- Keep download links pointed at the current asset or markdown file
- Use `.code-block` for code examples

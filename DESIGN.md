# DESIGN

NyaayWatch design-system source of truth.

Use this file for reusable visual, typographic, component, responsive, and accessibility rules. Use [docs/NYAAYWATCH_DESIGN.md](docs/NYAAYWATCH_DESIGN.md) for product-specific route hierarchy, trust-surface rationale, and IA decisions.

## Product Stance

NyaayWatch should feel:

- investigative
- public-interest
- calm
- exact
- evidence-first

The product should look like an investigative public dossier, not a startup dashboard and not a glossy activism campaign.

## Core Visual Rules

### Visual Stance

- typography-led rather than decoration-led
- restrained, serious, and editorial
- tables, charts, metadata, and source context are the primary visual surfaces
- minimal card usage; cards must earn their existence through interaction or grouping value
- calm color system with one restrained accent, not a rainbow status palette
- dense enough to feel useful, but never cramped or bureaucratic

The target visual language is:

- document-like hierarchy over app-like chrome
- strong metadata treatment and evidence labeling
- restrained serif/sans pairing rather than default startup typography
- citation-ready footnotes, caveats, and trust annotations as first-class UI elements
- enough warmth to feel maintained by people, but not enough ornament to feel like a campaign site

### Hierarchy

- the first viewport should behave like a public-interest front page, not a widget board
- brand, headline, trust strip, and toplines should read as one composition
- district tables and charts should read as evidence surfaces, not as decorative support
- caveats and quality signals should stay visible without overpowering the evidence
- methodology, download, and API links should feel like trust utilities, not competing calls to action

### AI Slop Blacklist

Do not ship:

- purple, violet, or blue-to-purple gradient brand treatments
- three-column feature grids with icon circles and short SaaS blurbs
- centered-everything marketing layouts
- decorative blob backgrounds, wavy section dividers, or ornamental floating shapes
- oversized rounded cards wrapping every metric, chart, and table by default
- generic hero copy such as "unlock judicial insights" or "all-in-one transparency platform"
- dashboard-card mosaics where every insight is trapped in a separate panel

### Preferred Primitives

- strong headlines with editorial rhythm
- compact trust strips and metadata rows
- full-width or near-full-width comparison tables
- charts with restrained annotation, not decorative illustration
- inline badges for freshness and quality state
- footnotes, caveat blocks, and methodology links that feel citation-ready

### Density Rule

Prefer fewer, stronger surfaces over many equal surfaces. If a layout can delete 30 percent of its chrome and still communicate better, it should.

## Foundation

### Typography

- use a restrained serif for major editorial headings and a clear sans-serif for interface text
- avoid default stacks such as Inter, Arial, Roboto, or generic system-first typography
- headlines should feel investigative and public-interest oriented, not startup-promotional
- body text and metadata must optimize for long reading sessions, scanability, and evidence comprehension
- tables, badges, and trust strips should use disciplined typographic contrast rather than heavy borders or bright fills

### Color Tokens

Define these CSS variables before implementation:

- `--color-bg`
- `--color-surface`
- `--color-surface-muted`
- `--color-text`
- `--color-text-muted`
- `--color-border`
- `--color-accent`
- `--color-warning`
- `--color-danger`
- `--color-success`

Rules:

- backgrounds stay light, calm, and document-like
- the accent color should be restrained and used sparingly for links, active states, and data emphasis
- warning and quality colors should signal clearly without turning the interface into a traffic-light dashboard
- no purple-forward palette and no blue-to-purple gradients

### Brand Assets

- brand identity should be wordmark-first, with a compact support mark for favicon and small-footprint surfaces
- the mark should feel like a published-evidence seal, archive stamp, or watch dial, not a government emblem
- do not use Ashoka lions, official court silhouettes, wreaths, shields, gavels, literal scales, or any insignia that implies official affiliation
- AI can be used for concept exploration, but the canonical logo assets must be redrawn as reproducible SVG
- the repo-owned source of truth for brand rules and export structure lives in `brand/BRAND.md`

### Spacing And Layout

- use a consistent spacing scale rather than one-off values
- prioritize generous vertical rhythm around headline, trust, and evidence sections
- tables and charts should have enough surrounding whitespace to read clearly while still occupying meaningful width
- mobile layouts should preserve hierarchy through reflow, not by shrinking everything into cramped cards

### Surface Rules

- cards are not the default container
- tables, charts, text blocks, and metadata rows should often sit directly on the page or within minimal surfaces
- if a card is used, it must have a specific grouping or interaction purpose
- shadows should be minimal; separation should come primarily from spacing, typography, and subtle borders

### Core Component Vocabulary

Standardize at least these primitives:

- trust strip
- topline metric block
- district ranking table
- quality badge
- freshness warning banner
- anomaly callout
- caveat block
- methodology link cluster
- export action group

Every new user-facing alpha screen should assemble from this vocabulary before adding new primitives.

## Responsive And Accessibility

Responsive behavior is part of the trust model, not a visual afterthought.

### Responsive Layout Rules

- desktop should prioritize side-by-side comparison where it improves evidence reading
- tablet should preserve the public dossier rhythm while reducing simultaneous density
- mobile should preserve trust hierarchy and tap-through clarity rather than forcing desktop tables into cramped horizontal scroll patterns

### District Browsing On Mobile

- desktop: full ranking table with meaningful comparison columns
- tablet: reduced-column comparison table with clear tap targets
- mobile: ranked stacked list where each item shows district name, status, one to two key metrics, and a direct link into the district evidence page

Mobile should not rely on a wide table with horizontal scrolling as the primary exploration pattern.

### Accessibility Baseline

- keyboard navigation across all primary routes, filters, links, exports, and evidence-page actions
- semantic landmarks for header, main content, navigation, table/list regions, and footer
- visible focus states that do not disappear into the visual system
- minimum touch targets of 44px for interactive controls
- accessible contrast for text and status colors
- chart text summaries or data tables so meaning is not color-only or pointer-only
- freshness states and quality badges must pair color with text labels
- logical heading structure on district ranking and evidence pages
- loading, empty, partial, and error states must be understandable to assistive technology

If a surface cannot explain itself to keyboard users, screen-reader users, or low-vision users, it is not ready to claim civic usefulness.

## Change Discipline

- update this file when reusable design rules change
- update [docs/NYAAYWATCH_DESIGN.md](docs/NYAAYWATCH_DESIGN.md) when route hierarchy, trust-surface behavior, or product-specific IA changes
- keep public copy calm, exact, and evidence-first

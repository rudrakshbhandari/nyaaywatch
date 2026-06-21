# NyaayWatch Brand System

Source of truth for NyaayWatch logo construction, brand assets, typography pairing, export rules, and AI-assisted design workflow.

This file exists so the visual identity stays reproducible across the repo, Figma, and Canva instead of drifting into one-off assets.

## Intent

NyaayWatch should look:

- investigative
- public-interest
- calm
- exact
- evidence-first

The brand should read like a civic evidence project, not a government department, advocacy campaign, or SaaS analytics tool.

## Canonical Direction

Use the `archive seal` direction as the primary logo family.

What that means:

- a restrained circular mark
- sparse watch-dial cues
- a simple geometric monogram
- editorial, stamped, document-like character

Why this direction wins:

- it keeps the `watch` idea
- it avoids official judiciary insignia language
- it survives favicon and one-color use
- it fits the repo's public-dossier posture

The `docket stamp` direction is the secondary exploration path for icon-heavy use cases. Treat it as a support direction, not the primary public logo.

## What The Brand Must Not Do

Do not use:

- Supreme Court of India emblem language
- Ashoka lions
- wreaths, seals, or badges that look official
- literal scales of justice as the hero symbol
- gavels, court pillars, shields, or crests
- purple gradients, glossy highlights, or startup-style icon circles
- AI-generated raster art as the final source asset

If a reporter or citizen could mistake the mark for an official judiciary or state logo, reject it.

## Source Of Truth

Long-term repeatable workflow:

1. Explore directions with AI.
2. Refine geometry in Figma.
3. Store the canonical masters in this repo as SVG.
4. Export PNG variants from SVG or Figma.
5. Use Canva only for derivative social/media layouts.

Tool posture:

- AI: ideation only
- Figma: construction and review
- repo SVG: final durable source of truth
- Canva: downstream composition only

## Asset Layout

Canonical repo structure:

```text
brand/
  BRAND.md
  logo/
    nyaaywatch-archive-seal-mark.svg
    nyaaywatch-docket-stamp-mark.svg
    nyaaywatch-favicon.svg
    nyaaywatch-logo-dark.svg
    nyaaywatch-logo-light.svg
    nyaaywatch-nw-square-mark.svg
```

Expected future additions once the wordmark is finalized:

- `nyaaywatch-wordmark.svg`
- `nyaaywatch-lockup-horizontal.svg`
- `nyaaywatch-lockup-stacked.svg`
- `exports/png/*`

## Primary Mark: Archive Seal

File:

- `brand/logo/nyaaywatch-archive-seal-mark.svg`

Construction rules:

- circular outer ring with crisp stroke
- one restrained accent tick or center point
- geometric monogram centered inside the seal
- no ornamental flourishes
- must work at one color

Usage:

- favicon
- social avatar
- watermark
- small navigation mark
- document stamp motif

## Secondary Mark: Docket Stamp

File:

- `brand/logo/nyaaywatch-docket-stamp-mark.svg`

Construction rules:

- square-ish archival/file-stamp silhouette
- one subtle watch cue such as a crown dot or timing notch
- same monogram logic as the archive seal
- sharper and more editorial than app-like

Usage:

- alternate icon where a square silhouette is stronger
- internal decks
- document covers
- merchandise only after the primary mark is settled

## Favicon

File:

- `brand/logo/nyaaywatch-favicon.svg`

Rules:

- simplified from the archive seal
- no thin inner details
- one accent max
- remains legible at 16px

## NW Square Mark

File:

- `brand/logo/nyaaywatch-nw-square-mark.svg`
- `brand/logo/nyaaywatch-logo-light.svg`
- `brand/logo/nyaaywatch-logo-dark.svg`

Rules:

- keep these files in sync with the website masthead and `/press/logo-*.svg` downloads
- use the square mark for compact avatar-style placements where the wordmark is too wide
- preserve the black rounded-square field and `NW` text treatment from the public site

## Wordmark

The logo should remain wordmark-first even though the current repo assets focus on the mark.

Wordmark guidance:

- use a restrained serif for the name
- avoid official-looking calligraphy
- avoid geometric startup sans as the main brand voice
- track tightly but not theatrically
- preserve legibility in India-focused editorial/headline contexts

Recommended pairing:

- headings / wordmark exploration: `Source Serif 4`
- UI text: `IBM Plex Sans`
- metadata / timestamps: `IBM Plex Mono`

Do not make Canva the place where the final wordmark gets invented.

## Color System

Brand tokens:

- `--color-bg: #f5f1e8`
- `--color-surface: #fbf7ef`
- `--color-surface-muted: #efe7d8`
- `--color-text: #12100e`
- `--color-text-muted: #5c554d`
- `--color-border: #d2c8b8`
- `--color-accent: #a12a1e`
- `--color-warning: #8a5a00`
- `--color-danger: #8f2018`
- `--color-success: #215c43`

Rules:

- light, paper-first backgrounds
- accent used sparingly
- no blue-led or purple-led brand treatment
- icon and wordmark should work in pure black on light paper

## Variation Rules

Every logo family should have these variants:

- full-color on light background
- one-color dark on light
- one-color light on dark
- favicon-safe simplified mark

Every variant must preserve:

- exact geometry
- stroke weights
- clear space
- accent placement

Do not redraw variants manually in Canva.

## Clear Space And Minimum Size

Archive seal:

- clear space: at least 0.5x the outer-ring width around the mark
- minimum digital size: 20px for favicon-safe mark, 32px for normal UI use

Docket stamp:

- clear space: at least the width of the accent crown dot
- minimum digital size: 24px

If the mark needs to go below those sizes, use the favicon variant only.

## AI Workflow

Use AI for:

- silhouette exploration
- composition options
- moodboards
- alternate monogram geometry
- stress-testing whether a mark reads too official, too startup-like, or too advocacy-coded

Do not use AI for:

- final logo master
- final favicon export
- final wordmark asset
- production SVG that needs repeatable geometry

## Figma Workflow

Create one Figma file named:

- `NyaayWatch Brand System`

Recommended pages:

- `01 Directions`
- `02 Canonical Mark`
- `03 Wordmark`
- `04 Variants`
- `05 Exports`

Recommended components:

- archive seal mark
- docket stamp mark
- favicon mark
- horizontal lockup
- stacked lockup

Recommended variables:

- color tokens listed above
- spacing token for clear space

## Canva Workflow

Canva is allowed for:

- social posts
- simple announcement graphics
- deck covers
- derivatives built from exported canonical SVG assets

Canva is not allowed for:

- inventing the logo
- changing geometry
- changing the wordmark font without updating this repo and Figma
- exporting the only existing copy of an asset

## Acceptance Test

The brand system is only acceptable if all of the following are true:

- the mark does not look official
- the mark does not look like a startup dashboard logo
- the favicon is legible at small sizes
- the icon works in one color
- the identity feels serious enough to sit next to methodology and source citations
- a future contributor can recreate the full system from this file plus the SVG assets

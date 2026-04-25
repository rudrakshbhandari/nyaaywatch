# NyaayWatch — instructions for Claude

## Public copy

Any text that lands on a public page must follow `docs/COPY_VOICE.md`.
Read it before writing or editing copy on:

- the national or state homepages
- Supreme Court / High Court overview pages
- district list and detail pages
- `/api`, `/data`, `/press`
- 404 / empty states
- OG cards
- flag reasons and tile notes generated in `src/normalize/` or
  `src/api/home/`

Banned phrases on public routes are enforced by
`tests/public-copy-guardrails.test.ts`. If a copy change adds new
jargon worth banning project-wide, add the regex there at the same
time.

The methodology page (`src/api/pages/methodology.ts` and the High
Court / Supreme Court methodology variants) is the one surface where
publishing-pipeline vocabulary ("published snapshot", "captured run",
etc.) is allowed — it documents the discipline itself.

## Other repo conventions

- Product voice is fixed in `README.md` and `docs/NYAAYWATCH_DESIGN.md`
  as investigative, public-interest, calm, exact, evidence-first.
- Trust posture: the public site never exposes data fresher than the
  latest published snapshot; operator-only views stay private.
- Tests: `npm test` (vitest). Typecheck: `npm run typecheck`.

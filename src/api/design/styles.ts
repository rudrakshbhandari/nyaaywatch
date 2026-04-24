/**
 * Canonical NyaayWatch design system.
 *
 * One CSS blob every page shares: tokens, typography, layout shell, the
 * masthead / ticker / colophon, the info-icon component, buttons, section
 * heads, tables, and the responsive breakpoints. Each page adds its own
 * page-specific CSS on top via renderPage(title, body, pageCss).
 *
 * Tokens were locked in by the editorial homepage (see src/api/home/home.ts
 * commit history). Any visual change that isn't page-specific belongs here.
 */
export const FONTS_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />`;

export const BASE_CSS = `
  :root {
    --ink: #0c0a08;
    --ink-soft: #2f2b26;
    --ink-mid: #56514a;
    --ink-muted: #5f5a53;
    --rule: #d9d3c8;
    --rule-soft: #e7e1d4;
    --paper: #f4efe3;
    --paper-bright: #fbf7ea;
    --accent: #bd2716;
    --accent-dark: #8a1408;
    --flag: #6f4b00;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: "Inter Tight", "Inter", system-ui, -apple-system, sans-serif;
    background: var(--paper);
    color: var(--ink);
    font-size: 17px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "ss01", "cv11";
  }
  a { color: var(--accent); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  a:hover { color: var(--accent-dark); }
  h1, h2, h3 {
    font-family: "Inter Tight", "Inter", system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.025em;
  }

  main { max-width: 1280px; margin: 0 auto; padding: 0 32px 120px; }

  /* --- masthead --- */
  .masthead {
    max-width: 1280px; margin: 0 auto; padding: 32px 32px 22px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid var(--ink);
  }
  .masthead__brand { display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--ink); }
  .masthead__mark {
    display: inline-flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; background: var(--ink); color: var(--paper);
    font-family: "Inter Tight", sans-serif; font-weight: 900; font-size: 18px;
    letter-spacing: -0.03em;
    border-radius: 2px;
  }
  .masthead__wordmark { font-family: "Inter Tight", sans-serif; font-weight: 800; font-size: 26px; letter-spacing: -0.035em; }
  .masthead__nav { display: flex; gap: 22px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
  .masthead__nav a { color: var(--ink-soft); text-decoration: none; }
  .masthead__nav a:hover { color: var(--accent); }
  .masthead__nav a.is-active { color: var(--accent); }

  .state-switcher {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 32px 0;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .state-switcher a {
    display: inline-flex;
    align-items: center;
    padding: 7px 12px 8px;
    border: 1px solid var(--rule);
    background: var(--paper-bright);
    color: var(--ink-soft);
    text-decoration: none;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 999px;
  }
  .state-switcher a:hover { border-color: var(--ink); color: var(--ink); }
  .state-switcher a.is-active {
    border-color: var(--accent);
    color: var(--accent-dark);
    background: #f6e2df;
  }

  /* Overflow variant: when there are more scopes than fit on a single line
     (e.g. /high-courts/:slug with 14+ High Courts), render a collapsed
     <details> summary instead of a chip wall. The active scope stays
     visible in the summary; the full list expands on click. Keeps the
     editorial fold tight without losing the switcher. */
  details.state-switcher {
    display: block;
    padding-top: 14px;
  }
  details.state-switcher > summary {
    list-style: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 14px 8px;
    border: 1px solid var(--rule);
    background: var(--paper-bright);
    color: var(--ink-soft);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 999px;
    transition: border-color 120ms ease, color 120ms ease;
  }
  details.state-switcher > summary::-webkit-details-marker { display: none; }
  details.state-switcher > summary::marker { content: ""; }
  details.state-switcher > summary:hover { border-color: var(--ink); color: var(--ink); }
  details.state-switcher > summary::after {
    content: "\u25BE";
    font-size: 10px;
    opacity: 0.6;
    transition: transform 120ms ease;
  }
  details.state-switcher[open] > summary::after { transform: rotate(180deg); }
  details.state-switcher .state-switcher__label { color: var(--ink-muted); }
  details.state-switcher .state-switcher__current { color: var(--accent-dark); }
  details.state-switcher > .state-switcher__list {
    margin-top: 12px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* --- ticker --- */
  .ticker {
    max-width: 1280px; margin: 0 auto; padding: 14px 32px 0;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-muted);
  }

  /* --- hero / section heads --- */
  .page-hero { padding: 40px 0 48px; max-width: 900px; }
  .page-hero__eyebrow {
    margin: 0 0 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .page-hero__hed {
    margin: 0 0 22px;
    font-size: clamp(32px, 4.6vw, 56px);
    line-height: 1;
    letter-spacing: -0.032em;
    text-wrap: balance;
  }
  .page-hero__lede {
    margin: 0 0 22px;
    font-size: clamp(16px, 1.5vw, 19px);
    line-height: 1.52;
    color: var(--ink-soft);
    max-width: 62ch;
    font-weight: 500;
  }
  /* Reference-doc hero: API pages, data downloads, press kit. The editorial
     56px headline is wrong for pages where the body is code, tables, or
     dense reference copy — readers need to get to the content, not stare at
     a masthead. */
  .page-hero--compact { padding: 28px 0 28px; }
  .page-hero--compact .page-hero__hed {
    font-size: clamp(26px, 2.6vw, 36px);
    line-height: 1.08;
    letter-spacing: -0.028em;
  }
  .page-hero--compact .page-hero__lede { font-size: 16px; }

  .section-head { margin: 0 0 32px; max-width: 720px; }
  .section-head h2 {
    margin: 0 0 12px;
    font-size: clamp(24px, 2.8vw, 34px); line-height: 1.05;
    letter-spacing: -0.028em;
  }
  .section-head__lede {
    margin: 0;
    color: var(--ink-soft); font-size: 16px; line-height: 1.55;
    font-weight: 500;
  }

  /* --- buttons --- */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 22px; border-radius: 2px;
    font-weight: 600; font-size: 14px; text-decoration: none;
    letter-spacing: 0.01em;
    border: 1.5px solid var(--ink);
    cursor: pointer;
    background: transparent;
    color: var(--ink);
    transition: background 120ms ease, color 120ms ease;
  }
  .btn--primary { background: var(--ink); color: var(--paper); }
  .btn--primary:hover { background: var(--accent); border-color: var(--accent); color: #fff; }
  .btn--ghost:hover { background: var(--ink); color: var(--paper); }
  .btn--small { padding: 8px 14px; font-size: 12px; }

  /* --- colophon (footer) --- */
  .colophon {
    max-width: 1280px; margin: 0 auto; padding: 48px 32px;
    border-top: 2px solid var(--ink);
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;
    font-size: 13px; color: var(--ink-soft);
  }
  .colophon p { margin: 0 0 6px; }
  .colophon__brand { font-family: "Inter Tight", sans-serif; font-weight: 800; font-size: 20px; color: var(--ink); letter-spacing: -0.03em; }
  .colophon__col a { display: block; color: var(--ink); }
  .colophon__col a + a { margin-top: 6px; }

  /* --- info icon (tooltip popover used site-wide) --- */
  .info { display: inline-block; position: relative; }
  .info summary {
    list-style: none; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; border-radius: 999px;
    border: 1px solid currentColor; color: var(--ink-muted);
    font-family: "Inter Tight", sans-serif; font-weight: 700; font-size: 10px;
    line-height: 1; background: transparent;
    transition: background 120ms ease, color 120ms ease;
  }
  .info summary::-webkit-details-marker { display: none; }
  .info summary::marker { content: ""; }
  .info:hover summary, .info[open] summary, .info summary:focus-visible {
    background: var(--ink); color: var(--paper); border-color: var(--ink);
    outline: none;
  }
  .info-popover {
    position: absolute; z-index: 20; top: calc(100% + 10px); left: 50%;
    transform: translateX(-50%);
    /* Cap at the narrower of: preferred 320px, or viewport minus a 16px
       gutter on each side. Stops the tooltip from overflowing the viewport
       when an info icon lives near the right edge on tablet/desktop. */
    min-width: 260px; max-width: min(320px, calc(100vw - 32px));
    padding: 16px 18px;
    background: var(--paper-bright); color: var(--ink);
    border: 1px solid var(--ink); border-radius: 2px;
    box-shadow: 4px 4px 0 var(--ink);
    font-family: "Inter Tight", sans-serif;
    text-transform: none; letter-spacing: 0;
  }
  .info:hover .info-popover, .info[open] .info-popover, .info:focus-within .info-popover { display: block; }
  .info .info-popover { display: none; }
  .info-popover strong { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); }
  .info-popover p { margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: var(--ink-soft); font-weight: 500; }
  .info-popover p:last-child { margin-bottom: 0; }
  .info-short { color: var(--ink) !important; font-weight: 600 !important; }

  /* --- shared table (used by districts, methodology history, etc.) --- */
  .data-table {
    width: 100%; border-collapse: collapse;
    background: var(--paper-bright);
    border: 1px solid var(--ink);
    font-size: 14px;
  }
  .data-table th, .data-table td {
    padding: 14px 16px; text-align: left;
    border-bottom: 1px solid var(--rule);
    vertical-align: top;
  }
  .data-table th {
    background: var(--ink); color: var(--paper);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    position: sticky; top: 0;
  }
  .data-table th a {
    color: var(--paper); text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .data-table th a:hover { color: #fff; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover,
  .data-table tbody tr:has(a:focus-visible) { background: var(--paper); }
  .data-table .num {
    font-variant-numeric: lining-nums tabular-nums;
    font-weight: 600;
    text-align: right;
  }
  .data-table .flag { color: var(--flag); }
  .data-table .accent { color: var(--accent-dark); }

  /* --- shared "stat tile" used on /districts and /districts/:id --- */
  .stat-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    padding: 28px 0 32px;
    margin: 16px 0 64px;
  }
  .stat-tile {
    padding: 0 24px 0 24px;
    border-left: 1px solid var(--rule);
    display: flex; flex-direction: column; gap: 10px;
  }
  .stat-tile:first-child { border-left: none; padding-left: 0; }
  .stat-tile:last-child { padding-right: 0; }
  .stat-tile__label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-muted);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .stat-tile__value {
    font-family: "Inter Tight", sans-serif;
    font-weight: 900;
    font-size: clamp(36px, 4vw, 52px);
    line-height: 0.95;
    letter-spacing: -0.035em;
    font-variant-numeric: lining-nums tabular-nums;
    color: var(--ink);
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: normal;
  }
  .stat-tile__unit { font-size: 0.5em; font-weight: 700; color: var(--ink-muted); margin-left: 4px; }
  .stat-tile__note { margin: 0; font-size: 13px; color: var(--ink-soft); line-height: 1.45; font-weight: 500; }
  .stat-tile--accent .stat-tile__label { color: var(--accent-dark); }
  .stat-tile--flag .stat-tile__label { color: var(--flag); }

  /* --- optional sparkline + delta chip on stat tiles --- */
  /* Sparkline sits on its own row *below* the value, left-aligned. Earlier
     iteration placed the sparkline on the right edge of the value row
     (space-between), which made short values like "74.0" feel detached
     from their chart and varied the visual x-position tile-to-tile. */
  .stat-tile__spark-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
  }
  .sparkline {
    width: 96px; height: 24px;
    flex-shrink: 0;
    color: var(--ink-muted);
    opacity: 0.85;
  }
  .stat-tile--accent .sparkline { color: var(--accent-dark); opacity: 0.9; }
  .stat-tile--flag .sparkline { color: var(--flag); opacity: 0.9; }
  .stat-tile__delta {
    align-self: flex-start;
    display: inline-flex;
    padding: 2px 7px 3px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid currentColor;
    border-radius: 2px;
  }
  .stat-tile__delta--good { color: #2a7a3f; }
  .stat-tile__delta--bad { color: var(--accent-dark); }
  .stat-tile__delta--flat { color: var(--ink-muted); }

  /* --- shared card surface used for callouts --- */
  .card {
    background: var(--paper-bright);
    border: 1px solid var(--ink);
    padding: 28px 28px 30px;
  }
  .card h3 {
    margin: 0 0 10px; font-size: 20px; line-height: 1.15;
    letter-spacing: -0.025em;
  }
  .card p { margin: 0 0 10px; color: var(--ink-soft); font-size: 15px; line-height: 1.5; font-weight: 500; }
  .card p:last-child { margin-bottom: 0; }
  .card ul { margin: 0; padding-left: 18px; color: var(--ink-soft); font-size: 15px; line-height: 1.55; font-weight: 500; }
  .card ul li + li { margin-top: 6px; }
  .card code {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 13px;
    background: var(--rule-soft);
    padding: 1px 6px;
    border-radius: 2px;
  }

  .card-grid { display: grid; gap: 20px; }
  .card-grid--1 { grid-template-columns: 1fr; }
  .card-grid--2 { grid-template-columns: repeat(2, 1fr); }
  .card-grid--3 { grid-template-columns: repeat(3, 1fr); }

  /* --- endpoint card (shared by /api, /high-courts/:slug/api, /supreme-court/api) ---
     GET + path sit tight on row 1, description flows below. Earlier layout
     used a fixed 64px column for the verb, which stranded short paths with
     a big gap to the badge. */
  .endpoint {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 12px;
    row-gap: 12px;
    align-items: baseline;
  }
  .endpoint p { grid-column: 1 / -1; margin: 0; }
  code.endpoint__verb {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 8px;
    background: var(--ink); color: var(--paper);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em;
    border-radius: 2px;
  }
  code.endpoint__path {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 16px; font-weight: 600;
    color: var(--ink);
    background: transparent;
    padding: 0;
    word-break: break-all;
  }
  .endpoints { margin-bottom: 72px; }

  /* --- inline JSON sample (collapsible <details> inside endpoint cards) --- */
  .code-sample-reveal {
    margin-top: 14px;
    grid-column: 1 / -1;
  }
  .code-sample-reveal > summary {
    cursor: pointer;
    list-style: none;
    display: inline-flex; align-items: center; gap: 8px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--ink-muted);
    padding: 4px 0;
    transition: color 120ms ease;
  }
  .code-sample-reveal > summary::-webkit-details-marker { display: none; }
  .code-sample-reveal > summary::marker { content: ""; }
  .code-sample-reveal > summary::after { content: "\u25BE"; font-size: 10px; opacity: 0.6; }
  .code-sample-reveal[open] > summary::after { transform: rotate(180deg); display: inline-block; }
  .code-sample-reveal > summary:hover { color: var(--ink); }
  .code-sample {
    margin: 10px 0 0;
    padding: 16px 18px;
    background: #1e1c19;
    color: #d4cec4;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; line-height: 1.65;
    overflow-x: auto;
    border-radius: 2px;
    white-space: pre;
    tab-size: 2;
    -webkit-overflow-scrolling: touch;
  }

  /* --- meta-row (tight list of label:value pairs) --- */
  .meta-row {
    display: flex; flex-wrap: wrap; gap: 22px 34px;
    margin: 0 0 28px; padding: 16px 0 18px;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    font-size: 13px;
  }
  .meta-row > div { display: flex; align-items: baseline; gap: 10px; }
  .meta-row dt {
    margin: 0;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--ink-muted);
  }
  .meta-row dd {
    margin: 0;
    font-weight: 600; color: var(--ink);
    font-variant-numeric: lining-nums tabular-nums;
  }

  /* --- badges --- */
  .badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px 4px;
    border: 1px solid var(--rule);
    border-radius: 2px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--ink-muted);
    background: var(--paper-bright);
  }
  .badge--flag { color: var(--flag); border-color: var(--flag); }
  .badge--accent { color: var(--accent); border-color: var(--accent); }
  .badge--complete { color: #2f6a3a; border-color: #8fb89a; }

  /* --- accessibility: focus rings that match the editorial palette --- */
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    border-radius: 2px;
  }
  .btn:focus-visible { outline-offset: 4px; }
  .masthead__brand:focus-visible, .masthead__nav a:focus-visible, .state-switcher a:focus-visible { outline-offset: 6px; }
  .info summary:focus-visible { outline: none; }

  /* Form-control defaults — inputs that don't override get a consistent
     placeholder color and a visible focus ring. Individual components can
     still style themselves further. */
  input::placeholder, textarea::placeholder {
    color: var(--ink-muted);
    opacity: 0.7;
  }
  input, textarea, select { font-family: inherit; color: var(--ink); }
  input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* --- evidence deep-linking: every claim on the site can anchor to an
         explanation elsewhere. When a URL hash lands on an element with a
         matching id, flash the outline so the reader's eye goes to it. The
         scroll-margin keeps the target clear of the sticky masthead. --- */
  [id] { scroll-margin-top: 96px; }
  :target { animation: target-flash 2.2s ease-out; }
  @keyframes target-flash {
    0%, 18% { outline: 3px solid var(--accent); outline-offset: 6px; }
    100%    { outline: 3px solid transparent; outline-offset: 6px; }
  }

  /* --- anchor permalink affordance. Cards that carry a permalinkable claim
         render a tiny "#" in the corner that appears on hover/focus. --- */
  .card { position: relative; }
  .anchor-link {
    position: absolute; top: 14px; right: 16px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 13px; font-weight: 700; line-height: 1;
    color: var(--ink-muted); text-decoration: none;
    opacity: 0;
    transition: opacity 120ms ease, color 120ms ease;
    padding: 4px 6px; border-radius: 2px;
  }
  .card:hover .anchor-link,
  .card:focus-within .anchor-link,
  .anchor-link:focus-visible { opacity: 1; }
  .anchor-link:hover, .anchor-link:focus-visible { color: var(--accent); }

  /* --- stat-tile labels that link through to methodology. The underline is
         suppressed so the tile reads as typography, but a small \u2197 glyph
         appears on hover to signal the jump. --- */
  .stat-tile__link, .numbers__label a {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px dotted transparent;
  }
  .stat-tile__link:hover, .stat-tile__link:focus-visible,
  .numbers__label a:hover, .numbers__label a:focus-visible {
    color: var(--accent);
    border-bottom-color: currentColor;
  }
  .stat-tile__link::after, .numbers__label a::after {
    content: "\u2009\u2197";
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .stat-tile__link:hover::after, .stat-tile__link:focus-visible::after,
  .numbers__label a:hover::after, .numbers__label a:focus-visible::after {
    opacity: 1;
  }

  /* --- responsive --- */
  @media (max-width: 1100px) {
    .stat-grid { grid-template-columns: repeat(2, 1fr); row-gap: 32px; }
    .stat-tile:nth-child(3) { border-left: none; padding-left: 0; }
    .card-grid--3 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 960px) {
    .card-grid--2, .card-grid--3 { grid-template-columns: 1fr; }
  }
  @media (max-width: 720px) {
    .masthead { padding: 22px 18px 16px; flex-wrap: wrap; gap: 18px; }
    .masthead__nav { width: 100%; gap: 14px; overflow-x: auto; }
    .state-switcher { padding: 12px 18px 0; }
    .ticker { padding: 12px 18px 0; }
    main { padding: 0 18px 80px; }
    .page-hero { padding: 28px 0 32px; }
    .colophon { grid-template-columns: 1fr; padding: 36px 18px; }
    .stat-grid { grid-template-columns: 1fr; padding: 20px 0 24px; row-gap: 28px; }
    .stat-tile { border-left: none; padding: 0; }
    .data-table th, .data-table td { padding: 10px 12px; font-size: 13px; }
    .info-popover {
      left: 0; transform: none;
      min-width: 0; max-width: calc(100vw - 36px);
      width: max-content;
    }
    /* Ensure table wrappers never push beyond viewport */
    .data-table-wrap, [class*="-table-wrap"] { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    /* Minimum tap target size for all interactive elements */
    .btn, button, a[role="button"],
    .masthead__nav a, .colophon a { min-height: 44px; }
  }
  @media (max-width: 480px) {
    .stat-grid { row-gap: 20px; }
    .stat-tile__value { font-size: clamp(28px, 10vw, 48px); }
    .card-grid--2, .card-grid--3 { gap: 2px; }
  }

  /* --- honor reader motion preferences --- */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* --- print: journalists and researchers print methodology + district
         pages for citation and filing. Strip navigation + share chrome, keep
         the evidence, and append absolute URLs after external/internal
         links so a printed page still reads as a citeable document. --- */
  @media print {
    @page { margin: 18mm; }
    body {
      background: #fff; color: #000;
      font-size: 10.5pt; line-height: 1.45;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .masthead, .state-switcher, .ticker, .colophon,
    .btn, .info, .anchor-link, .hero__cta, .national-hero__cta,
    .district-hero__crumb, .district-col__cta, .cite-block__copy,
    .waiting-room, .waiting-room__overlay { display: none !important; }
    main { max-width: none; padding: 0; }
    a { color: #000; text-decoration: underline; }
    a[href^="http"]::after,
    a[href^="/"]::after {
      content: " \u2039" attr(href) "\u203a";
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 8.5pt; color: #555;
      word-break: break-all;
      font-weight: normal;
    }
    a[href^="#"]::after,
    .masthead__brand a::after,
    .colophon a::after { content: none !important; }
    h1, h2, h3 { page-break-after: avoid; break-after: avoid; color: #000; }
    .card, .stat-grid, .data-table, .watch-card, .tier-card,
    .numbers__cell, .waiting-clock, .trend, .history-table-wrap,
    .method, .section-head {
      break-inside: avoid; page-break-inside: avoid;
    }
    .section-head { break-after: avoid; }
    .card-grid { display: block !important; }
    .card-grid > .card + .card { margin-top: 10pt; }
    .card { border: 0.5pt solid #999; padding: 10pt 12pt; background: #fff; }
    .data-table th { background: #000 !important; color: #fff !important; }
    .data-table tbody tr:hover { background: transparent !important; }
    .numbers { border-color: #000 !important; margin-bottom: 18pt !important; }
    .numbers::after { display: none !important; }
    .stat-grid { border-color: #000 !important; padding: 14pt 0 !important; margin: 10pt 0 18pt !important; }
    .stat-tile { border-left-color: #999 !important; }
    .colophon-print {
      display: block !important;
      font-size: 9pt; color: #555;
      border-top: 1pt solid #ccc; padding-top: 6pt; margin-top: 24pt;
    }
  }
  .colophon-print { display: none; }
`;

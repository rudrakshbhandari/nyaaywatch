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
    display: grid; grid-template-columns: 1.4fr 1.2fr 1fr; gap: 32px;
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
    min-width: 260px; max-width: 320px;
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
  .data-table tbody tr:hover { background: var(--paper); }
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
  }
  .stat-tile__unit { font-size: 0.5em; font-weight: 700; color: var(--ink-muted); margin-left: 4px; }
  .stat-tile__note { margin: 0; font-size: 13px; color: var(--ink-soft); line-height: 1.45; font-weight: 500; }
  .stat-tile--accent .stat-tile__label { color: var(--accent-dark); }
  .stat-tile--flag .stat-tile__label { color: var(--flag); }

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
  .card-grid--2 { grid-template-columns: repeat(2, 1fr); }
  .card-grid--3 { grid-template-columns: repeat(3, 1fr); }

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
`;

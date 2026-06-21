export const WATCHROOM_PAGE_CSS = `
  .watchroom-hero {
    padding: 58px 0 34px;
    max-width: 920px;
  }
  .watchroom-hero__eyebrow,
  .watchroom-section__eyebrow {
    margin: 0 0 10px;
    color: var(--accent);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .watchroom-hero h1 {
    margin: 0 0 14px;
    max-width: 780px;
    font-size: clamp(44px, 7vw, 88px);
    line-height: 0.95;
    letter-spacing: 0;
  }
  .watchroom-hero__lede {
    margin: 0 0 14px;
    max-width: 720px;
    color: var(--ink);
    font-size: clamp(21px, 3vw, 31px);
    line-height: 1.18;
    font-weight: 700;
  }
  .watchroom-hero__body,
  .watchroom-hero__meta {
    max-width: 760px;
    color: var(--ink-soft);
    font-size: 16px;
    line-height: 1.58;
    font-weight: 500;
  }
  .watchroom-hero__meta {
    margin-top: 18px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    line-height: 1.5;
    text-transform: uppercase;
  }
  .watchroom-toplines {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 10px 0 48px;
  }
  .watchroom-section {
    margin: 64px 0;
    padding-top: 24px;
    border-top: 1px solid var(--ink);
  }
  .watchroom-section__head {
    max-width: 760px;
    margin-bottom: 18px;
  }
  .watchroom-section__head h2 {
    margin: 0 0 10px;
    font-size: clamp(28px, 3vw, 42px);
    line-height: 1.04;
    letter-spacing: 0;
  }
  .watchroom-section__head p:not(.watchroom-section__eyebrow) {
    margin: 0;
    color: var(--ink-soft);
    font-size: 15px;
    line-height: 1.55;
    font-weight: 500;
  }
  .watchroom-table-wrap {
    overflow-x: auto;
    border-top: 1px solid var(--rule);
  }
  .watchroom-table {
    width: 100%;
    min-width: 900px;
  }
  .watchroom-table th,
  .watchroom-table td {
    padding: 12px 10px;
    border-bottom: 1px solid var(--rule);
    text-align: left;
    vertical-align: top;
  }
  .watchroom-table th {
    background: var(--paper);
    color: var(--ink);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .watchroom-table .num {
    text-align: right;
    white-space: nowrap;
  }
  .watchroom-empty {
    margin: 0;
    padding: 18px;
    background: var(--rule-soft);
    border: 1px solid var(--rule);
    color: var(--ink-soft);
    font-weight: 600;
  }
  .watchroom-caveat__grid,
  .watchroom-card-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--rule);
    border-left: 1px solid var(--rule);
  }
  .watchroom-caveat__grid article,
  .watchroom-card-grid article {
    padding: 20px;
    border-right: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .watchroom-caveat__grid h3,
  .watchroom-card-grid h3,
  .watchroom-missing h3 {
    margin: 0 0 8px;
    font-size: 18px;
    line-height: 1.2;
    letter-spacing: 0;
  }
  .watchroom-caveat__grid p,
  .watchroom-card-grid p,
  .watchroom-missing p {
    margin: 0;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.5;
  }
  .watchroom-card-grid a {
    display: inline-flex;
    margin-top: 14px;
    font-weight: 800;
  }
  .watchroom-card-grid .watchroom-card--muted {
    background: var(--rule-soft);
  }
  .watchroom-missing {
    margin-top: 18px;
    padding: 18px;
    border: 1px solid var(--rule);
    background: var(--paper);
  }
  @media (max-width: 860px) {
    .watchroom-toplines,
    .watchroom-caveat__grid,
    .watchroom-card-grid {
      grid-template-columns: 1fr;
    }
  }
`;

import { escapeHtml } from "../../lib/html.js";

export interface EvidenceEntryPoint {
  title: string;
  body: string;
  href: string;
  cta: string;
  codeLabel?: string;
}

export interface EvidenceEntryPointsOptions {
  headline: string;
  lede: string;
  entries: EvidenceEntryPoint[];
}

export function renderEvidenceEntryPoints(options: EvidenceEntryPointsOptions): string {
  return `
    <section class="evidence-entry-points" aria-label="Evidence downloads">
      <header class="evidence-entry-points__head">
        <p class="evidence-entry-points__eyebrow">USE THIS EVIDENCE</p>
        <h2>${escapeHtml(options.headline)}</h2>
        <p>${escapeHtml(options.lede)}</p>
      </header>
      <div class="evidence-entry-points__grid">
        ${options.entries.map(renderEvidenceEntryPoint).join("")}
      </div>
    </section>
  `;
}

function renderEvidenceEntryPoint(entry: EvidenceEntryPoint): string {
  const code = entry.codeLabel
    ? `<code class="evidence-entry-points__code">${escapeHtml(entry.codeLabel)}</code>`
    : "";
  return `
    <article class="evidence-entry-point">
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.body)}</p>
      ${code}
      <a class="btn btn--ghost btn--small" href="${escapeHtml(entry.href)}">${escapeHtml(entry.cta)}</a>
    </article>
  `;
}

export const EVIDENCE_ENTRY_POINTS_CSS = `
  .evidence-entry-points {
    margin: 44px 0 60px;
    padding: 24px 0 0;
    border-top: 1px solid var(--rule);
  }
  .evidence-entry-points__head {
    max-width: 760px;
    margin-bottom: 18px;
  }
  .evidence-entry-points__eyebrow {
    margin: 0 0 8px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .evidence-entry-points__head h2 {
    margin: 0 0 10px;
    font-size: clamp(24px, 2.8vw, 36px);
    line-height: 1.05;
    letter-spacing: 0;
  }
  .evidence-entry-points__head p {
    margin: 0;
    color: var(--ink-soft);
    font-size: 15px;
    line-height: 1.55;
    font-weight: 500;
  }
  .evidence-entry-points__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--rule);
    border-left: 1px solid var(--rule);
  }
  .evidence-entry-point {
    min-width: 0;
    padding: 20px;
    border-right: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    background: var(--paper);
  }
  .evidence-entry-point h3 {
    margin: 0 0 8px;
    font-size: 18px;
    line-height: 1.2;
    letter-spacing: 0;
  }
  .evidence-entry-point p {
    margin: 0 0 14px;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.5;
  }
  .evidence-entry-points__code {
    display: block;
    margin: 0 0 14px;
    padding: 8px 10px;
    background: var(--rule-soft);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 2px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.45;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  @media (max-width: 900px) {
    .evidence-entry-points__grid { grid-template-columns: 1fr; }
  }
`;

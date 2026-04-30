import { escapeHtml } from "../../lib/html.js";

export interface InvestigationStep {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

export interface InvestigationWorkflowOptions {
  headline: string;
  lede: string;
  steps: InvestigationStep[];
}

export function renderInvestigationWorkflow(options: InvestigationWorkflowOptions): string {
  return `
    <section class="investigation-flow" aria-label="Investigation path">
      <header class="investigation-flow__head">
        <p class="investigation-flow__eyebrow">INVESTIGATION PATH</p>
        <h2>${escapeHtml(options.headline)}</h2>
        <p>${escapeHtml(options.lede)}</p>
      </header>
      <div class="investigation-flow__grid">
        ${options.steps.map(renderInvestigationStep).join("")}
      </div>
    </section>
  `;
}

function renderInvestigationStep(step: InvestigationStep): string {
  return `
    <article class="investigation-step">
      <p class="investigation-step__eyebrow">${escapeHtml(step.eyebrow)}</p>
      <h3>${escapeHtml(step.title)}</h3>
      <p>${escapeHtml(step.body)}</p>
      <a href="${escapeHtml(step.href)}">${escapeHtml(step.cta)}</a>
    </article>
  `;
}

export const INVESTIGATION_WORKFLOW_CSS = `
  .investigation-flow {
    margin: 52px 0 72px;
    padding: 28px 0 0;
    border-top: 1px solid var(--ink);
  }
  .investigation-flow__head {
    max-width: 760px;
    margin-bottom: 22px;
  }
  .investigation-flow__eyebrow,
  .investigation-step__eyebrow {
    margin: 0 0 8px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .investigation-flow__head h2 {
    margin: 0 0 10px;
    font-size: clamp(28px, 3vw, 42px);
    line-height: 1.02;
    letter-spacing: -0.03em;
  }
  .investigation-flow__head p {
    margin: 0;
    color: var(--ink-soft);
    font-size: 16px;
    line-height: 1.55;
    font-weight: 500;
  }
  .investigation-flow__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 1px solid var(--rule);
    border-left: 1px solid var(--rule);
  }
  .investigation-step {
    min-width: 0;
    padding: 22px 20px;
    border-right: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    background: var(--paper);
  }
  .investigation-step h3 {
    margin: 0 0 10px;
    font-size: 20px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .investigation-step p:not(.investigation-step__eyebrow) {
    margin: 0 0 16px;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.5;
  }
  .investigation-step a {
    font-weight: 700;
    color: var(--ink);
    text-decoration-color: var(--accent);
    text-underline-offset: 3px;
  }
  .investigation-step a:hover { color: var(--accent-dark); }
  @media (max-width: 980px) {
    .investigation-flow__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 620px) {
    .investigation-flow { margin: 40px 0 56px; }
    .investigation-flow__grid { grid-template-columns: 1fr; }
  }
`;

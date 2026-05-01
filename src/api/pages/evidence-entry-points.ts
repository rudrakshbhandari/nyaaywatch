import { escapeHtml } from "../../lib/html.js";

export interface EvidenceEntryPoint {
  title: string;
  body: string;
  href: string;
  cta: string;
  codeLabel?: string;
  citationText?: string;
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
  const citation = entry.citationText
    ? `<div class="evidence-entry-points__citation">
        <p>Citation text</p>
        <pre>${escapeHtml(entry.citationText)}</pre>
        <button class="btn btn--ghost btn--small evidence-entry-points__copy" type="button" data-copy-text="${escapeHtml(entry.citationText)}">Copy citation</button>
      </div>`
    : "";
  return `
    <article class="evidence-entry-point">
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.body)}</p>
      ${code}
      ${citation}
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
  .evidence-entry-points__citation {
    margin: 0 0 14px;
  }
  .evidence-entry-points__citation p {
    margin: 0 0 6px;
    color: var(--accent);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    line-height: 1.3;
    text-transform: uppercase;
  }
  .evidence-entry-points__citation pre {
    margin: 0 0 8px;
    padding: 10px;
    background: var(--rule-soft);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 2px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .evidence-entry-points__copy.is-copied {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .evidence-entry-points__copy.is-error {
    color: var(--accent-dark);
    border-color: var(--accent-dark);
  }
  @media (max-width: 900px) {
    .evidence-entry-points__grid { grid-template-columns: 1fr; }
  }
`;

export const EVIDENCE_ENTRY_POINTS_SCRIPT = `
  <script>
  (function() {
    if (window.__nyaaywatchEvidenceCopyReady) return;
    window.__nyaaywatchEvidenceCopyReady = true;
    document.addEventListener("click", function(event) {
      var target = event.target;
      if (!target || !target.matches || !target.matches(".evidence-entry-points__copy")) return;
      var text = target.getAttribute("data-copy-text") || "";
      var reset = function() {
        setTimeout(function() {
          target.textContent = "Copy citation";
          target.classList.remove("is-copied");
          target.classList.remove("is-error");
        }, 2000);
      };
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        target.textContent = "Copy unavailable";
        target.classList.add("is-error");
        reset();
        return;
      }
      navigator.clipboard.writeText(text).then(function() {
        target.textContent = "Copied";
        target.classList.add("is-copied");
        reset();
      }, function() {
        target.textContent = "Copy failed";
        target.classList.add("is-error");
        reset();
      });
    });
  })();
  </script>
`;

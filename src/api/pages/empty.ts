import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";

/**
 * Graceful fallback used when no published snapshot is available yet (503)
 * or when a requested district is not in the latest snapshot (404). Uses the
 * shared shell so it still carries the masthead, nav, and colophon rather
 * than dropping the reader onto a stranded error string.
 */
export function renderEmptyState(title: string, message: string): string {
  const body = `
    <section class="empty">
      <p class="empty__eyebrow">NOT AVAILABLE</p>
      <h1 class="empty__hed">${escapeHtml(title)}</h1>
      <p class="empty__lede">${escapeHtml(message)}</p>
      <div class="empty__cta">
        <a class="btn btn--primary" href="/">Back to the homepage</a>
        <a class="btn btn--ghost" href="/methodology">How the site works</a>
      </div>
    </section>
  `;

  return renderPageShell({
    title: `${title} — NyaayWatch`,
    body,
    pageCss: EMPTY_PAGE_CSS,
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
  });
}

const EMPTY_PAGE_CSS = `
  .empty { padding: 72px 0 80px; max-width: 720px; }
  .empty__eyebrow {
    margin: 0 0 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .empty__hed {
    margin: 0 0 18px;
    font-size: clamp(32px, 4.4vw, 52px);
    line-height: 1.02;
    letter-spacing: -0.03em;
  }
  .empty__lede {
    margin: 0 0 28px;
    font-size: 18px; line-height: 1.5;
    color: var(--ink-soft); font-weight: 500;
  }
  .empty__cta { display: flex; gap: 12px; flex-wrap: wrap; }
`;

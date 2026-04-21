import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml } from "../../lib/html.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { formatDate } from "../home/view-model.js";
import type { HomeViewModel } from "../home/view-model.js";

/**
 * Embeddable iFrame widgets. Minimal HTML — no shared shell, no masthead,
 * no colophon. The widget renders in ~420×220px by default and links back
 * to the full evidence page with a branded footer line.
 *
 * Content-Security-Policy on the embed route allows framing from any origin
 * so the widget works in Substack, Ghost, WordPress, etc.
 */

export function renderDistrictEmbedWidget(
  snapshot: PublishedSnapshot["snapshot"],
  district: DistrictSnapshot,
  districtHref: string,
): string {
  const waitMonths = Math.round(district.medianAgeDays / 30);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(district.districtName)} — NyaayWatch</title>
  <style>${EMBED_CSS}</style>
</head>
<body class="embed">
  <div class="embed-card">
    <div class="embed-header">
      <span class="embed-header__label">NyaayWatch · ${escapeHtml(snapshot.stateName.toUpperCase())}</span>
      <span class="embed-header__date">${escapeHtml(formatDate(snapshot.sourceSnapshotAt))}</span>
    </div>
    <div class="embed-divider"></div>
    <p class="embed-eyebrow">DISTRICT EVIDENCE · RANK #${district.rank}</p>
    <h1 class="embed-name">${escapeHtml(district.districtName)}</h1>
    <p class="embed-summary">${escapeHtml(district.summary.length > 120 ? district.summary.slice(0, 117) + "…" : district.summary)}</p>
    <div class="embed-stats">
      <div class="embed-stat">
        <span class="embed-stat__value">${district.backlogCases.toLocaleString("en-IN")}</span>
        <span class="embed-stat__label">cases waiting</span>
      </div>
      <div class="embed-stat">
        <span class="embed-stat__value">~${waitMonths}<span class="embed-stat__unit">mo</span></span>
        <span class="embed-stat__label">typical wait</span>
      </div>
      <div class="embed-stat">
        <span class="embed-stat__value">${district.disposalRate.toFixed(0)}<span class="embed-stat__unit">/100</span></span>
        <span class="embed-stat__label">cleared / 100</span>
      </div>
    </div>
    <div class="embed-footer">
      <a href="${escapeHtml(SITE_ORIGIN + districtHref)}" target="_blank" rel="noopener" class="embed-footer__link">Full evidence on NyaayWatch →</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderStateEmbedWidget(
  snapshot: PublishedSnapshot["snapshot"],
  model: HomeViewModel,
  stateHref: string,
): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(snapshot.stateName)} — NyaayWatch</title>
  <style>${EMBED_CSS}</style>
</head>
<body class="embed">
  <div class="embed-card">
    <div class="embed-header">
      <span class="embed-header__label">NyaayWatch · LOWER COURTS</span>
      <span class="embed-header__date">${escapeHtml(model.sourceDateLabel)}</span>
    </div>
    <div class="embed-divider"></div>
    <p class="embed-eyebrow">STATE OVERVIEW</p>
    <h1 class="embed-name">${escapeHtml(snapshot.stateName)}</h1>
    <p class="embed-summary">How long is the wait for justice in ${escapeHtml(snapshot.stateName)}?</p>
    <div class="embed-stats">
      <div class="embed-stat">
        <span class="embed-stat__value">${escapeHtml(model.pendingLakh)}</span>
        <span class="embed-stat__label">pending cases</span>
      </div>
      <div class="embed-stat">
        <span class="embed-stat__value">~${model.typicalWaitMonths}<span class="embed-stat__unit">mo</span></span>
        <span class="embed-stat__label">typical wait</span>
      </div>
      <div class="embed-stat">
        <span class="embed-stat__value">${model.clearanceRate.toFixed(0)}<span class="embed-stat__unit">/100</span></span>
        <span class="embed-stat__label">cleared / 100</span>
      </div>
    </div>
    <div class="embed-footer">
      <a href="${escapeHtml(SITE_ORIGIN + stateHref)}" target="_blank" rel="noopener" class="embed-footer__link">Full data on NyaayWatch →</a>
    </div>
  </div>
</body>
</html>`;
}

const EMBED_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body.embed {
    font-family: "Inter Tight", "Inter", system-ui, -apple-system, sans-serif;
    background: #f4efe3;
    color: #0c0a08;
    padding: 0;
    margin: 0;
  }
  .embed-card {
    padding: 16px 18px 14px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .embed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .embed-header__label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #5f5a53;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
  }
  .embed-header__date {
    font-size: 9px;
    font-weight: 500;
    color: #5f5a53;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .embed-divider { height: 1px; background: #0c0a08; margin-bottom: 10px; }
  .embed-eyebrow {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #bd2716;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    margin-bottom: 4px;
  }
  .embed-name {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -0.035em;
    margin-bottom: 6px;
  }
  .embed-summary {
    font-size: 11px;
    color: #2f2b26;
    line-height: 1.45;
    flex: 1;
    margin-bottom: 10px;
    font-weight: 500;
  }
  .embed-stats {
    display: flex;
    gap: 0;
    border-top: 1px solid #0c0a08;
    padding-top: 10px;
    margin-bottom: 10px;
  }
  .embed-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .embed-stat__value {
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
  }
  .embed-stat__unit {
    font-size: 11px;
    font-weight: 600;
    color: #5f5a53;
    letter-spacing: -0.01em;
  }
  .embed-stat__label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #5f5a53;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-weight: 500;
    border-top: 1px solid #d9d3c8;
    padding-top: 4px;
  }
  .embed-footer { border-top: 1px dashed #d9d3c8; padding-top: 8px; }
  .embed-footer__link {
    font-size: 10px;
    color: #bd2716;
    text-decoration: none;
    font-weight: 600;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    letter-spacing: 0.04em;
  }
  .embed-footer__link:hover { text-decoration: underline; }
`;

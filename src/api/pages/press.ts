import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import { SITE_ORIGIN } from "../share/site-origin.js";

export function renderPressPage(): string {
  const curlExample = `curl ${SITE_ORIGIN}/v1/stats/himachal | jq`;
  const districtExample = `curl ${SITE_ORIGIN}/v1/districts | jq '.districts[0]'`;

  const body = `
    <section class="press-hero">
      <p class="press-hero__eyebrow">PRESS & EMBED KIT</p>
      <h1 class="press-hero__hed">For journalists,<br>researchers,<br>and civic groups.</h1>
      <p class="press-hero__lede">Everything you need to cite, embed, or republish NyaayWatch data — logos, embed codes, suggested captions, and methodology links. All numbers come from public NJDG data with full methodology disclosure.</p>
    </section>

    <section class="press-section">
      ${renderSectionHead({ headline: "One-paragraph description.", lede: "Paste this into bylines, story intros, or grant applications." })}
      <div class="card press-quote-card">
        <p class="press-quote">NyaayWatch is an independent court-transparency project that publishes reviewed snapshots of pending caseloads, clearance rates, and wait times across India's Supreme Court, High Courts, and district courts. All data is drawn from public NJDG (National Judicial Data Grid) records and released under a documented, versioned methodology. Numbers are never shown without a dated source citation and a click-reachable methodology link.</p>
        <button class="btn btn--ghost btn--small press-copy-btn" data-copy="NyaayWatch is an independent court-transparency project that publishes reviewed snapshots of pending caseloads, clearance rates, and wait times across India's Supreme Court, High Courts, and district courts. All data is drawn from public NJDG (National Judicial Data Grid) records and released under a documented, versioned methodology. Numbers are never shown without a dated source citation and a click-reachable methodology link.">Copy text</button>
      </div>
    </section>

    <section class="press-section">
      ${renderSectionHead({ headline: "Wordmark and logotype.", lede: "Flat SVG — scale to any size, use on light or dark backgrounds." })}
      <div class="card-grid card-grid--2">
        <article class="card press-logo-card press-logo-card--light">
          <p class="press-logo__label">LIGHT BACKGROUND</p>
          <div class="press-logo__mark">
            <span class="press-logo__nw">NW</span>
            <span class="press-logo__word">NyaayWatch</span>
          </div>
          <div class="press-logo__actions">
            <a class="btn btn--ghost btn--small" href="/press/logo-light.svg" download>Download SVG</a>
          </div>
        </article>
        <article class="card press-logo-card press-logo-card--dark">
          <p class="press-logo__label">DARK BACKGROUND</p>
          <div class="press-logo__mark press-logo__mark--inv">
            <span class="press-logo__nw">NW</span>
            <span class="press-logo__word">NyaayWatch</span>
          </div>
          <div class="press-logo__actions">
            <a class="btn btn--ghost btn--small" href="/press/logo-dark.svg" download>Download SVG</a>
          </div>
        </article>
      </div>
      <p class="press-note">Do not alter the wordmark colours, proportions, or letterforms. Do not place the mark on a photographic background without sufficient contrast. Do not add decorative elements (courts, gavels, scales) to the mark.</p>
    </section>

    <section class="press-section">
      ${renderSectionHead({ headline: "Embed a district or state widget.", lede: "Drop an iframe into Substack, WordPress, Ghost, or any CMS. The widget shows live numbers and links back to the full evidence page." })}
      <div class="card">
        <p class="press-embed__intro">Replace <code>kangra</code> with any district ID from the <a href="/districts">districts page</a>. Replace <code>himachal</code> with any state slug.</p>
        <div class="press-embed__variants">
          <div class="press-embed__variant">
            <p class="press-embed__variant-label">District widget</p>
            <pre class="press-embed__code" id="embed-district">&lt;iframe src="${escapeHtml(SITE_ORIGIN)}/embed/district/kangra"
  width="420" height="220"
  frameborder="0" style="border:none;"
  title="NyaayWatch — Kangra district courts"&gt;&lt;/iframe&gt;</pre>
            <button class="btn btn--ghost btn--small press-copy-btn" data-copy='<iframe src="${SITE_ORIGIN}/embed/district/kangra" width="420" height="220" frameborder="0" style="border:none;" title="NyaayWatch — Kangra district courts"></iframe>'>Copy embed</button>
          </div>
          <div class="press-embed__variant">
            <p class="press-embed__variant-label">State widget</p>
            <pre class="press-embed__code" id="embed-state">&lt;iframe src="${escapeHtml(SITE_ORIGIN)}/embed/state/himachal"
  width="420" height="220"
  frameborder="0" style="border:none;"
  title="NyaayWatch — Himachal Pradesh courts"&gt;&lt;/iframe&gt;</pre>
            <button class="btn btn--ghost btn--small press-copy-btn" data-copy='<iframe src="${SITE_ORIGIN}/embed/state/himachal" width="420" height="220" frameborder="0" style="border:none;" title="NyaayWatch — Himachal Pradesh courts"></iframe>'>Copy embed</button>
          </div>
        </div>
      </div>
    </section>

    <section class="press-section">
      ${renderSectionHead({ headline: "Journalist quickstart.", lede: "Pull the numbers directly from the API. No authentication, no rate limits for reasonable use." })}
      <div class="card">
        <div class="press-api-row">
          <p class="press-api__label">State summary (Himachal Pradesh)</p>
          <pre class="press-embed__code">${escapeHtml(curlExample)}</pre>
          <button class="btn btn--ghost btn--small press-copy-btn" data-copy="${escapeHtml(curlExample)}">Copy</button>
        </div>
        <div class="press-api-row">
          <p class="press-api__label">All districts</p>
          <pre class="press-embed__code">${escapeHtml(districtExample)}</pre>
          <button class="btn btn--ghost btn--small press-copy-btn" data-copy="${escapeHtml(districtExample)}">Copy</button>
        </div>
        <p class="card__meta">Full API reference: <a href="/api">/api</a> · <a href="/methodology">Methodology</a> · <a href="/data">Data downloads</a></p>
      </div>
    </section>

    <section class="press-section">
      ${renderSectionHead({ headline: "Suggested captions.", lede: "These are starting points. Always verify numbers against the latest published snapshot before publishing." })}
      <div class="card press-caption-card">
        <p class="press-caption">According to NyaayWatch (nyaaywatch.in), which tracks pending caseloads using public NJDG data, [DISTRICT] district courts had [NUMBER] cases waiting as of [DATE]. The median case in this district has been pending for approximately [MONTHS] months.</p>
        <p class="press-caption press-caption--note">Replace bracketed values with numbers from the district evidence page. Link "NyaayWatch (nyaaywatch.in)" to the specific district page for traceability.</p>
      </div>
    </section>

    <section class="press-section">
      ${renderSectionHead({ headline: "What NyaayWatch is — and isn't.", lede: "For accurate characterisation in stories and reports." })}
      <div class="card-grid card-grid--2">
        <article class="card">
          <h3>What it is</h3>
          <ul class="press-list">
            <li>An independent, non-partisan court-data transparency project</li>
            <li>A publisher of reviewed, versioned snapshots from public NJDG records</li>
            <li>A tool for tracking backlog pressure, clearance pace, and delay trends</li>
            <li>A citation surface: every number links to a dated source and methodology</li>
          </ul>
        </article>
        <article class="card">
          <h3>What it isn't</h3>
          <ul class="press-list">
            <li>A live or real-time data feed — numbers are published after review</li>
            <li>A ranking or judgment of judicial performance</li>
            <li>A predictor of when any specific case will be decided</li>
            <li>Affiliated with any government body, court, or judicial authority</li>
          </ul>
        </article>
      </div>
    </section>

    <script>
    document.querySelectorAll(".press-copy-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var text = btn.getAttribute("data-copy") || "";
        navigator.clipboard.writeText(text).then(function() {
          var orig = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(function() { btn.textContent = orig; }, 2000);
        });
      });
    });
    </script>
  `;

  return renderPageShell({
    title: "Press & Embed Kit — NyaayWatch",
    body,
    brandHref: "/",
    brandTag: "Judicial observability across tiers",
    navLinks: [
      { id: "districts", href: "/districts", label: "Districts" },
      { id: "data", href: "/data", label: "Data" },
      { id: "methodology", href: "/methodology", label: "Method" },
      { id: "api", href: "/api", label: "API" },
    ],
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
    pageCss: PRESS_PAGE_CSS,
    og: {
      title: "Press & Embed Kit — NyaayWatch",
      description: "Logos, embed codes, suggested captions, API quickstart, and methodology links for journalists and researchers using NyaayWatch court data.",
    },
  });
}

const PRESS_PAGE_CSS = `
  .press-hero { padding: 40px 0 56px; max-width: 820px; }
  .press-hero__eyebrow {
    margin: 0 0 14px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.18em;
    color: var(--accent);
  }
  .press-hero__hed {
    margin: 0 0 20px;
    font-size: clamp(44px, 6vw, 74px);
    line-height: 0.96; letter-spacing: -0.04em;
  }
  .press-hero__lede {
    margin: 0; font-size: clamp(17px, 1.6vw, 20px);
    color: var(--ink-soft); font-weight: 500; line-height: 1.5; max-width: 58ch;
  }

  .press-section { margin-bottom: 72px; }

  .press-quote-card { position: relative; }
  .press-quote {
    margin: 0 0 14px; font-size: 16px;
    line-height: 1.7; color: var(--ink-soft);
    font-style: italic;
    border-left: 3px solid var(--accent);
    padding-left: 18px;
  }

  .press-logo-card { display: flex; flex-direction: column; gap: 24px; }
  .press-logo-card--light { background: var(--paper); }
  .press-logo-card--dark { background: var(--ink); }
  .press-logo__label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ink-muted);
  }
  .press-logo-card--dark .press-logo__label { color: rgba(244,239,227,0.45); }
  .press-logo__mark { display: flex; align-items: center; gap: 14px; }
  .press-logo__nw {
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 4px;
    background: var(--ink); color: var(--paper);
    font-family: "Inter Tight", sans-serif; font-size: 18px; font-weight: 900;
    letter-spacing: -0.08em;
  }
  .press-logo__mark--inv .press-logo__nw { background: var(--paper); color: var(--ink); }
  .press-logo__word {
    font-family: "Inter Tight", sans-serif;
    font-size: 26px; font-weight: 900;
    letter-spacing: -0.04em; color: var(--ink);
  }
  .press-logo__mark--inv .press-logo__word { color: var(--paper); }
  .press-logo__actions { margin-top: 4px; }
  .press-note { margin: 14px 0 0; font-size: 13px; color: var(--ink-muted); max-width: 68ch; }

  .press-embed__variants { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 4px; }
  .press-embed__variant { display: flex; flex-direction: column; gap: 8px; }
  .press-embed__variant-label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--ink-muted); margin: 0;
  }
  .press-embed__intro { margin: 0 0 18px; color: var(--ink-soft); font-size: 15px; }
  .press-embed__code {
    margin: 0 0 8px; padding: 12px;
    background: var(--rule-soft);
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; color: var(--ink);
    white-space: pre-wrap; word-break: break-word;
    border: 1px solid var(--rule); border-radius: 2px;
    line-height: 1.6;
  }

  .press-api-row { margin-bottom: 20px; }
  .press-api__label { margin: 0 0 6px; font-size: 14px; color: var(--ink-soft); font-weight: 500; }

  .press-caption-card .press-caption {
    margin: 0 0 10px; font-size: 16px; line-height: 1.7; color: var(--ink);
    font-style: italic;
    border-left: 3px solid var(--rule); padding-left: 16px;
  }
  .press-caption--note { color: var(--ink-muted); font-size: 13px; font-style: normal; }

  .press-list { margin: 10px 0 0; padding: 0 0 0 18px; }
  .press-list li { margin-bottom: 8px; font-size: 15px; color: var(--ink-soft); line-height: 1.55; }

  @media (max-width: 720px) {
    .press-embed__variants { grid-template-columns: 1fr; }
  }
`;

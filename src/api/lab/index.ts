import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { buildCopy } from "./copy.js";
import { buildViewModel, escapeHtml, LAB_VARIANTS } from "./shared.js";

const FONTS_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:wght@600;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />`;

export function renderLabIndex(snapshot: PublishedSnapshot): string {
  const model = buildViewModel(snapshot);
  const copy = buildCopy(model);

  const variantCards = LAB_VARIANTS.map(
    (variant) => `<a class="variant-card variant-card--${variant.id}" href="/lab/${variant.id}">
      <div class="variant-card__head">
        <span class="variant-card__accent" style="background: ${variant.accentHex}"></span>
        <span class="variant-card__id">${variant.id}</span>
      </div>
      <h2 class="variant-card__name">${escapeHtml(variant.name)}</h2>
      <p class="variant-card__influences">${escapeHtml(variant.influences)}</p>
      <p class="variant-card__pitch">${escapeHtml(variant.pitch)}</p>
      <div class="variant-card__thumb" aria-hidden="true">${thumbFor(variant.id)}</div>
      <span class="variant-card__cta">Open \u2192</span>
    </a>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lab \u2014 NyaayWatch design bake-off</title>
  ${FONTS_LINK}
  <style>${css()}</style>
</head>
<body>
  <header class="hdr">
    <div class="hdr__inner">
      <div class="hdr__brand">
        <span class="hdr__mark">NW</span>
        <div>
          <p class="hdr__title">NyaayWatch design lab</p>
          <p class="hdr__sub">Four homepage directions, same real data, same rewritten copy. Pick the one that feels right and we build on it.</p>
        </div>
      </div>
      <a class="hdr__live" href="/">
        <span class="hdr__live-dot"></span>
        View current live site
      </a>
    </div>
  </header>

  <main>
    <section class="context">
      <div class="context__inner">
        <div>
          <p class="context__kicker">What you are looking at</p>
          <p class="context__body">
            Each variant below is a full homepage redesign, rendered with real fixture data
            (${escapeHtml(model.pendingLakh)} cases pending, ${model.totalDistricts} districts, trend through ${escapeHtml(model.sourceDateLabel)}).
            Click any card to open that variant. All four share the rewritten copy: no
            <code>snapshot</code> / <code>alpha</code> / audit jargon on the hero, plain English,
            and every technical term has an info icon you can hover.
          </p>
        </div>
        <aside class="context__rules">
          <p class="context__rules-title">Shared rules</p>
          <ul>
            <li>Lead with what the data says, not how it was sourced.</li>
            <li>No \u201Csnapshot\u201D, \u201Calpha\u201D, or auditor language on the hero.</li>
            <li>Every jargon term gets an info icon (\u24D8) with short + long explanation.</li>
            <li>Real data from the same published fixture, so you can compare like-for-like.</li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="variants">
      <div class="variants__grid">${variantCards}</div>
    </section>

    <section class="next">
      <div class="next__inner">
        <h2>How this works</h2>
        <ol>
          <li><strong>Pick the direction that feels closest.</strong> Right now the four variants are the homepage only \u2014 that's the highest-leverage surface and also the one you said felt worst.</li>
          <li><strong>We iterate the winner.</strong> Adjust typography, palette, layout, copy until it is actually great, not just different.</li>
          <li><strong>Then we roll it out.</strong> Apply the direction to districts, district detail, data, methodology, and API pages. Replace the current homepage. Retire the <code>/lab</code> routes.</li>
          <li><strong>Framework decision happens after direction is set.</strong> If the chosen direction benefits from a component framework (Astro, Next), we migrate then \u2014 never before.</li>
        </ol>
      </div>
    </section>
  </main>

  <footer class="foot">
    <p>Design lab \u00b7 ${escapeHtml(copy.brand)} \u00b7 fixture data from ${escapeHtml(model.sourceDateLabel)}</p>
  </footer>
</body>
</html>`;
}

function thumbFor(id: string): string {
  switch (id) {
    case "editorial":
      return `<div class="thumb thumb--editorial">
        <div class="thumb__eyebrow"></div>
        <div class="thumb__head"></div>
        <div class="thumb__head thumb__head--short"></div>
        <div class="thumb__rule"></div>
        <div class="thumb__row"><span></span><span></span><span></span><span></span></div>
      </div>`;
    case "terminal":
      return `<div class="thumb thumb--terminal">
        <div class="thumb__bar"></div>
        <div class="thumb__grid">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="thumb__table">
          <div></div><div></div><div></div><div></div>
        </div>
      </div>`;
    case "product":
      return `<div class="thumb thumb--product">
        <div class="thumb__glow"></div>
        <div class="thumb__pill"></div>
        <div class="thumb__hed"></div>
        <div class="thumb__hed thumb__hed--short"></div>
        <div class="thumb__dashboard">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>`;
    case "civic":
      return `<div class="thumb thumb--civic">
        <div class="thumb__crest"></div>
        <div class="thumb__hed"></div>
        <div class="thumb__rule thumb__rule--thick"></div>
        <div class="thumb__list"><span></span><span></span><span></span></div>
      </div>`;
    default:
      return "";
  }
}

function css(): string {
  return `
    :root {
      --bg: #0f1016;
      --bg-2: #171823;
      --surface: rgba(255, 255, 255, 0.04);
      --surface-hi: rgba(255, 255, 255, 0.08);
      --border: rgba(255, 255, 255, 0.1);
      --border-hi: rgba(255, 255, 255, 0.18);
      --text: #f4f4f7;
      --text-dim: #a6a6b3;
      --text-muted: #6c6c7d;
    }
    * { box-sizing: border-box; }
    html, body { background: var(--bg); }
    body {
      margin: 0;
      color: var(--text);
      font-family: "Inter", -apple-system, system-ui, sans-serif;
      font-size: 15px; line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }
    a { color: var(--text); text-decoration: none; }
    code { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 0.85em; background: var(--surface); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); }

    .hdr { border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.25); backdrop-filter: blur(12px); }
    .hdr__inner {
      max-width: 1200px; margin: 0 auto; padding: 22px 32px;
      display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
    }
    .hdr__brand { display: flex; align-items: center; gap: 18px; }
    .hdr__mark {
      display: inline-flex; align-items: center; justify-content: center;
      width: 46px; height: 46px; border-radius: 12px;
      background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
      color: #fff; font-family: "Fraunces", serif; font-weight: 900; font-size: 18px;
      box-shadow: 0 8px 24px -8px rgba(129, 140, 248, 0.5);
    }
    .hdr__title { margin: 0; font-size: 16px; font-weight: 600; }
    .hdr__sub { margin: 2px 0 0; font-size: 13px; color: var(--text-dim); max-width: 60ch; }
    .hdr__live {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 16px; border-radius: 999px;
      background: var(--surface); border: 1px solid var(--border-hi);
      font-size: 13px; color: var(--text-dim);
      transition: background 140ms ease, color 140ms ease;
    }
    .hdr__live:hover { background: var(--surface-hi); color: var(--text); }
    .hdr__live-dot { width: 6px; height: 6px; border-radius: 999px; background: #22c55e; box-shadow: 0 0 10px #22c55e; }

    main { max-width: 1200px; margin: 0 auto; padding: 56px 32px 80px; }

    .context { margin-bottom: 56px; }
    .context__inner {
      display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 0.9fr); gap: 40px;
      padding: 32px 36px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface);
    }
    .context__kicker {
      margin: 0 0 8px; font-family: "JetBrains Mono", monospace;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #818cf8;
    }
    .context__body { margin: 0; font-size: 16px; color: var(--text-dim); line-height: 1.6; }
    .context__rules {
      padding: 20px; border: 1px solid var(--border); border-radius: 12px; background: rgba(0,0,0,0.2);
    }
    .context__rules-title { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-family: "JetBrains Mono", monospace; }
    .context__rules ul { margin: 0; padding-left: 18px; font-size: 14px; color: var(--text-dim); }
    .context__rules li { margin-bottom: 8px; }
    .context__rules li:last-child { margin-bottom: 0; }

    .variants__grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
    }
    .variant-card {
      position: relative;
      display: flex; flex-direction: column; gap: 16px;
      padding: 32px;
      border: 1px solid var(--border); border-radius: 16px;
      background: var(--surface);
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      overflow: hidden;
      min-height: 340px;
    }
    .variant-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-hi);
      background: var(--surface-hi);
    }
    .variant-card__head { display: flex; align-items: center; gap: 10px; }
    .variant-card__accent { width: 8px; height: 8px; border-radius: 999px; }
    .variant-card__id { font-family: "JetBrains Mono", monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); }
    .variant-card__name {
      margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;
      font-family: "Fraunces", serif;
    }
    .variant-card__influences { margin: 0; font-size: 12px; color: var(--text-muted); font-family: "JetBrains Mono", monospace; text-transform: uppercase; letter-spacing: 0.08em; }
    .variant-card__pitch { margin: 0; font-size: 15px; color: var(--text-dim); line-height: 1.55; max-width: 50ch; }
    .variant-card__cta { margin-top: auto; font-size: 13px; color: var(--text); font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
    .variant-card:hover .variant-card__cta { color: #818cf8; }
    .variant-card__thumb { margin-top: 8px; height: 120px; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid var(--border); }

    .thumb { position: absolute; inset: 0; padding: 14px; display: flex; flex-direction: column; gap: 8px; }

    .thumb--editorial { background: #f6f1e8; color: #131211; }
    .thumb--editorial .thumb__eyebrow { width: 28%; height: 4px; background: #b3301a; }
    .thumb--editorial .thumb__head { width: 80%; height: 10px; background: #131211; }
    .thumb--editorial .thumb__head--short { width: 55%; }
    .thumb--editorial .thumb__rule { height: 1px; background: #131211; margin: 4px 0; }
    .thumb--editorial .thumb__row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .thumb--editorial .thumb__row span { height: 24px; background: rgba(19,18,17,0.12); border-left: 1px solid #131211; }

    .thumb--terminal { background: #0a0d10; color: #7cf0b7; padding: 10px; }
    .thumb--terminal .thumb__bar { height: 4px; background: #7cf0b7; border-radius: 1px; width: 40%; margin-bottom: 6px; }
    .thumb--terminal .thumb__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; flex: 0 0 auto; }
    .thumb--terminal .thumb__grid span { height: 30px; border: 1px solid #262c36; background: #161b22; }
    .thumb--terminal .thumb__table { display: grid; grid-template-columns: 1fr; gap: 2px; margin-top: 8px; }
    .thumb--terminal .thumb__table div { height: 6px; background: rgba(124, 240, 183, 0.16); }

    .thumb--product { background: #0b0b13; color: #fff; padding: 12px 14px; }
    .thumb--product .thumb__glow { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); width: 160px; height: 80px; background: radial-gradient(circle, rgba(129, 140, 248, 0.6) 0%, transparent 60%); filter: blur(10px); }
    .thumb--product .thumb__pill { width: 50%; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.1); margin: 4px auto 4px; }
    .thumb--product .thumb__hed { width: 75%; height: 10px; border-radius: 3px; background: linear-gradient(90deg, #fff, #aaa); margin: 0 auto; }
    .thumb--product .thumb__hed--short { width: 50%; }
    .thumb--product .thumb__dashboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: auto; padding: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; }
    .thumb--product .thumb__dashboard span { height: 20px; background: rgba(129, 140, 248, 0.25); border-radius: 2px; }

    .thumb--civic { background: #ffffff; color: #0b0c0c; }
    .thumb--civic .thumb__crest { width: 16px; height: 16px; background: #0b0c0c; position: relative; }
    .thumb--civic .thumb__crest::before, .thumb--civic .thumb__crest::after { content: ""; position: absolute; left: 2px; right: 2px; height: 2px; background: #ffdd00; }
    .thumb--civic .thumb__crest::before { top: 3px; }
    .thumb--civic .thumb__crest::after { bottom: 3px; }
    .thumb--civic .thumb__hed { width: 75%; height: 10px; background: #0b0c0c; margin-top: 4px; }
    .thumb--civic .thumb__rule { height: 1px; background: #dcdfe0; }
    .thumb--civic .thumb__rule--thick { height: 3px; background: #0b0c0c; margin: 4px 0; }
    .thumb--civic .thumb__list { display: flex; flex-direction: column; gap: 4px; }
    .thumb--civic .thumb__list span { height: 4px; background: rgba(11,12,12,0.18); }

    .next { margin-top: 80px; }
    .next__inner {
      padding: 40px 36px; border: 1px solid var(--border); border-radius: 16px;
      background: linear-gradient(180deg, var(--surface), transparent);
    }
    .next__inner h2 { margin: 0 0 20px; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
    .next__inner ol { margin: 0; padding-left: 20px; color: var(--text-dim); font-size: 15px; line-height: 1.65; }
    .next__inner ol li { margin-bottom: 10px; }
    .next__inner strong { color: var(--text); font-weight: 600; }

    .foot { max-width: 1200px; margin: 0 auto; padding: 32px; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 13px; }
    .foot p { margin: 0; }

    @media (max-width: 900px) {
      .context__inner { grid-template-columns: 1fr; gap: 24px; }
      .variants__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 680px) {
      main { padding: 32px 18px 60px; }
      .hdr__inner { padding: 18px; }
      .context__inner, .next__inner { padding: 24px 20px; }
      .variant-card { padding: 24px; min-height: 300px; }
    }
  `;
}

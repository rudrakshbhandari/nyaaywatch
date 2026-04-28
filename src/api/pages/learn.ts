import { renderPageShell } from "../design/shell.js";
import { renderSectionHead } from "../design/ui.js";
import { SITE_ORIGIN } from "../share/site-origin.js";

const LEARN_NAV_LINKS = [
  { id: "supreme-court", href: "/supreme-court", label: "Supreme Court" },
  { id: "high-courts", href: "/high-courts", label: "High Courts" },
  { id: "districts", href: "/districts", label: "Districts" },
  { id: "learn", href: "/learn", label: "Learn" },
];

export function renderLearnPage(): string {
  const body = `
    ${renderSectionHead({
      isHero: true,
      headline: "Understand India's courts before reading the numbers.",
      lede:
        "A simple guide to the court system, the words used on NyaayWatch, and the safest way to read public court data.",
    })}

    <section class="learn-map" aria-labelledby="learn-map-title">
      <div>
        <h2 id="learn-map-title">The basic structure</h2>
        <p>India's judiciary has many courts, but the public data on NyaayWatch is easier to read if you first separate three levels.</p>
      </div>
      <ol class="learn-steps">
        <li>
          <span class="learn-steps__index">01</span>
          <h3>Supreme Court</h3>
          <p>The Supreme Court sits in New Delhi and handles constitutional questions, major appeals, and other powers given by the Constitution and law.</p>
          <p><a href="/supreme-court">Open Supreme Court data</a></p>
        </li>
        <li>
          <span class="learn-steps__index">02</span>
          <h3>High Courts</h3>
          <p>High Courts lead judicial administration for their territories. Some High Courts cover one state, and some cover more than one state or Union Territory.</p>
          <p><a href="/high-courts">Browse High Courts</a></p>
        </li>
        <li>
          <span class="learn-steps__index">03</span>
          <h3>District and subordinate courts</h3>
          <p>District and subordinate courts are where many ordinary civil and criminal cases begin. They carry a large share of the day-to-day pressure people feel.</p>
          <p><a href="/districts">Browse district courts</a></p>
        </li>
      </ol>
    </section>

    <section class="learn-section">
      ${renderSectionHead({
        headline: "Words you will see on NyaayWatch",
        lede: "These are plain meanings for reading this site. They are not legal definitions for a court filing.",
      })}
      <div class="learn-glossary">
        <article class="card">
          <h3>Pending cases</h3>
          <p>Cases still waiting in a court's docket at the time shown on the page.</p>
        </article>
        <article class="card">
          <h3>Filed cases</h3>
          <p>Cases added to the court during a stated period, usually last month on NyaayWatch pages.</p>
        </article>
        <article class="card">
          <h3>Cleared cases</h3>
          <p>Cases that moved out of the pending count during the same period. This can happen for different procedural reasons, so read it as clearance pace, not as a comment on case quality.</p>
        </article>
        <article class="card">
          <h3>Clearance rate</h3>
          <p>How many cases were cleared for every 100 cases filed. A rate below 100 usually means the pending pile grew during that period.</p>
        </article>
        <article class="card">
          <h3>Typical wait</h3>
          <p>A rough age signal built from available public aggregates. It helps compare pressure, but it does not predict how long any one case will take.</p>
        </article>
        <article class="card">
          <h3>Flagged signal</h3>
          <p>A signal that asks for attention, such as high backlog pressure or weak clearance pace. It is not a finding about a court, judge, lawyer, or litigant.</p>
        </article>
      </div>
    </section>

    <section class="learn-section learn-reading">
      <div>
        ${renderSectionHead({
          headline: "How to read a NyaayWatch page",
          lede:
            "Start with the court level, then the date, then the metric. Do not compare different court levels as if they are one league table.",
        })}
      </div>
      <div class="card learn-reading__card">
        <ol>
          <li><strong>Check the court level.</strong> Supreme Court, High Court, and district court numbers describe different institutions.</li>
          <li><strong>Check the date.</strong> NyaayWatch pages are reviewed snapshots, not a running ticker.</li>
          <li><strong>Check the source line.</strong> Every public number should point back to a dated public source and method.</li>
          <li><strong>Read signals carefully.</strong> A flag means "look closer", not "someone is at fault".</li>
          <li><strong>Use methodology for detail.</strong> Formula choices, caveats, and source limits belong on the method pages.</li>
        </ol>
      </div>
    </section>

    <section class="learn-section">
      ${renderSectionHead({
        headline: "Quick questions",
        lede: "Short answers for readers who are new to the Indian court system.",
      })}
      <div class="card-grid card-grid--2 learn-faq">
        <article class="card">
          <h3>Is this legal advice?</h3>
          <p>No. NyaayWatch explains public aggregate data. It does not tell you what to do in a case.</p>
        </article>
        <article class="card">
          <h3>Why not show case-level details?</h3>
          <p>This product is built around aggregate public data and stored evidence. It avoids exposing raw artifacts or case-level material as a public product surface.</p>
        </article>
        <article class="card">
          <h3>Can I compare one High Court with one district court?</h3>
          <p>You can read both, but be careful. Court levels handle different work, and the metrics are not a single national ranking.</p>
        </article>
        <article class="card">
          <h3>Where can I check the official sources?</h3>
          <p>Start with the <a href="https://www.sci.gov.in/jurisdiction/" rel="noopener noreferrer" target="_blank">Supreme Court jurisdiction guide</a>, <a href="https://ecommitteesci.gov.in/service/national-judicial-data-grid/" rel="noopener noreferrer" target="_blank">e-Committee NJDG page</a>, and the method pages linked from each NyaayWatch court page.</p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "Learn the Indian court system | NyaayWatch",
    activeNav: "learn",
    navLinks: LEARN_NAV_LINKS,
    body,
    brandTag: "Plain-language guide to Indian court data",
    footer: {
      sourceDateLabel: null,
      methodologyVersion: null,
      sourceAttribution: null,
    },
    og: {
      title: "Learn the Indian court system | NyaayWatch",
      description:
        "A simple guide to India's court hierarchy, common court-data terms, and how to read NyaayWatch without mistaking snapshots for legal advice.",
      url: `${SITE_ORIGIN}/learn`,
    },
    pageCss: LEARN_PAGE_CSS,
  });
}

const LEARN_PAGE_CSS = `
  .learn-map {
    display: grid;
    grid-template-columns: minmax(240px, 0.72fr) minmax(0, 1.28fr);
    gap: 48px;
    align-items: start;
    margin: 8px 0 72px;
    padding-top: 34px;
    border-top: 2px solid var(--ink);
  }
  .learn-map h2 {
    margin: 0 0 14px;
    font-size: clamp(28px, 3vw, 42px);
    line-height: 1.02;
  }
  .learn-map p {
    margin: 0;
    color: var(--ink-soft);
    font-weight: 500;
  }
  .learn-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--ink);
  }
  .learn-steps li {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 18px 24px;
    padding: 24px 0 26px;
    border-bottom: 1px solid var(--rule);
  }
  .learn-steps__index {
    grid-row: 1 / span 3;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--accent);
  }
  .learn-steps h3 {
    margin: 0;
    font-size: 24px;
    line-height: 1.1;
  }
  .learn-steps p {
    margin: 0;
    max-width: 68ch;
  }
  .learn-section {
    margin: 0 0 80px;
  }
  .learn-glossary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }
  .learn-reading {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 32px;
    align-items: start;
    padding: 34px 0 0;
    border-top: 2px solid var(--ink);
  }
  .learn-reading .section-head {
    margin-bottom: 0;
  }
  .learn-reading__card ol {
    margin: 0;
    padding-left: 20px;
  }
  .learn-reading__card li + li {
    margin-top: 10px;
  }
  .learn-faq {
    align-items: stretch;
  }
  @media (max-width: 960px) {
    .learn-map,
    .learn-reading {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .learn-glossary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 720px) {
    .learn-map {
      margin-bottom: 56px;
    }
    .learn-steps li {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .learn-steps__index {
      grid-row: auto;
    }
    .learn-glossary {
      grid-template-columns: 1fr;
      gap: 2px;
    }
    .learn-section {
      margin-bottom: 56px;
    }
  }
`;

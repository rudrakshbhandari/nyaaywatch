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

    <section class="learn-section learn-hierarchy">
      <div>
        ${renderSectionHead({
          headline: "How the levels connect",
          lede:
            "A lower court, a High Court, and the Supreme Court do not do the same job. Read each level on its own terms first.",
        })}
      </div>
      <div class="learn-hierarchy__diagram" aria-label="How the levels connect">
        <div class="learn-node learn-node--supreme">
          <span>01</span>
          <strong>Supreme Court</strong>
          <p>National constitutional and appellate role.</p>
        </div>
        <div class="learn-connector" aria-hidden="true"></div>
        <div class="learn-node learn-node--high">
          <span>02</span>
          <strong>High Courts</strong>
          <p>State or territory-level constitutional courts.</p>
        </div>
        <div class="learn-connector" aria-hidden="true"></div>
        <div class="learn-node learn-node--district">
          <span>03</span>
          <strong>District and subordinate courts</strong>
          <p>Many civil and criminal cases begin here.</p>
        </div>
      </div>
      <div class="learn-scope-table" role="table" aria-label="What NyaayWatch tracks by court level">
        <div role="row" class="learn-scope-table__head">
          <span role="columnheader">Level</span>
          <span role="columnheader">Tracked here</span>
          <span role="columnheader">Read with care</span>
        </div>
        <div role="row">
          <span role="cell">Supreme Court</span>
          <span role="cell">Pending cases, filed cases, cleared cases, and age buckets.</span>
          <span role="cell">Its role is different from trial courts, so do not rank it against districts.</span>
        </div>
        <div role="row">
          <span role="cell">High Courts</span>
          <span role="cell">Court-level pressure signals for all 25 High Courts.</span>
          <span role="cell">Some High Courts cover more than one state or Union Territory.</span>
        </div>
        <div role="row">
          <span role="cell">Lower courts</span>
          <span role="cell">State, Union Territory, and district-level public aggregates.</span>
          <span role="cell">Districts vary by size, case mix, and local court structure.</span>
        </div>
      </div>
    </section>

    <section class="learn-section learn-journey">
      ${renderSectionHead({
        headline: "How a case usually moves",
        lede:
          "This is a simple reading map, not legal advice. A real case can move differently depending on the law, court, case type, and orders passed.",
      })}
      <ol class="learn-timeline">
        <li>
          <span class="learn-timeline__number">01</span>
          <h3>Filed</h3>
          <p>A case is brought to a court or registry. NyaayWatch counts filings only when they appear in the public aggregate source for that period.</p>
        </li>
        <li>
          <span class="learn-timeline__number">02</span>
          <h3>Listed and heard</h3>
          <p>The case may be listed for hearings, procedural steps, replies, evidence, arguments, or orders. This can take one hearing or many.</p>
        </li>
        <li>
          <span class="learn-timeline__number">03</span>
          <h3>Still pending</h3>
          <p>If the case has not moved out of the pending count by the date shown, it remains part of the backlog pressure you see on the page.</p>
        </li>
        <li>
          <span class="learn-timeline__number">04</span>
          <h3>Cleared</h3>
          <p>A cleared case has moved out of the pending count in the public aggregate. That does not tell you whether someone won, lost, settled, withdrew, or used another legal route.</p>
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
        <article class="card">
          <h3>Old-case burden</h3>
          <p>The share of pending cases that have been waiting for several years. It helps show where long waits are concentrated.</p>
        </article>
        <article class="card">
          <h3>File-clear gap</h3>
          <p>The difference between cases filed and cases cleared in the same period. A positive gap usually adds pressure.</p>
        </article>
        <article class="card">
          <h3>Source date</h3>
          <p>The date attached to the public source used for the number. Check it before quoting or comparing a page.</p>
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

    <section class="learn-section learn-pressure" id="pressure-signals">
      ${renderSectionHead({
        headline: "How to read pressure signals",
        lede:
          "These signals help you move from a big pending count to a better question. They are not predictions, rankings of people, or findings of fault.",
      })}
      <div class="learn-pressure-grid">
        <article class="learn-pressure-card">
          <span>Age</span>
          <h3>Old-case burden</h3>
          <p>Shows how much of the pending pile has already waited for years. A high share means long waits are not just a few isolated cases.</p>
        </article>
        <article class="learn-pressure-card">
          <span>Movement</span>
          <h3>Backlog movement</h3>
          <p>Compares cases filed and cleared last month against the pending pile. Positive movement means the queue grew; negative movement means it shrank.</p>
        </article>
        <article class="learn-pressure-card">
          <span>Pace</span>
          <h3>Break-even clearances</h3>
          <p>Shows how many more cases would have needed to clear last month to stop the backlog from growing. Zero means filings were matched or exceeded.</p>
        </article>
        <article class="learn-pressure-card">
          <span>Scenario</span>
          <h3>10% reduction scenario</h3>
          <p>Estimates the extra monthly clearances needed to cut the pending pile by 10% in a year while covering new filings. It is a workload scenario, not a forecast.</p>
        </article>
      </div>
      <div class="learn-pressure-note">
        <strong>Zero and N/A mean different things.</strong>
        <p>A zero can be a real result, such as no extra clearances needed to break even. N/A means the public source did not publish usable inputs or the metric does not apply. When NJDG reports 0 filed and 0 cleared cases against a non-zero backlog, NyaayWatch names that source condition instead of turning it into a zero clearance rate.</p>
      </div>
    </section>

    <section class="learn-section learn-data-rules">
      ${renderSectionHead({
        headline: "How to read delay data",
        lede:
          "Court numbers are useful only when the limits are visible. These rules stop a rough signal from becoming a false claim.",
      })}
      <div class="learn-rule-grid">
        <article class="learn-rule">
          <strong>Pending is not blame</strong>
          <p>A pending case count shows pressure. It does not explain why a case is pending or who caused the delay.</p>
        </article>
        <article class="learn-rule">
          <strong>Clearance rate needs context</strong>
          <p>A high clearance rate can still sit beside a large backlog. A low rate can be temporary. Read it with filed and pending cases.</p>
        </article>
        <article class="learn-rule">
          <strong>Old cases matter</strong>
          <p>Two courts can have similar pending counts but very different wait profiles if one has more older cases.</p>
        </article>
        <article class="learn-rule">
          <strong>One month is not a trend</strong>
          <p>A monthly gap is a signal for attention. A longer trend is stronger than one unusual month.</p>
        </article>
      </div>
    </section>

    <section class="learn-section learn-mistakes">
      ${renderSectionHead({
        headline: "Common mistakes to avoid",
        lede:
          "These are the traps that make court-data numbers sound stronger than they are.",
      })}
      <div class="card learn-mistakes__card">
        <ul>
          <li><strong>Do not turn flags into accusations.</strong> A flag says the number needs attention, not that a person or court acted wrongly.</li>
          <li><strong>Do not rank every court together.</strong> Supreme Court, High Court, and district court numbers describe different work.</li>
          <li><strong>Do not quote a number without its date.</strong> A court page is easier to check when the source date travels with the number.</li>
          <li><strong>Do not assume missing movement means nothing changed.</strong> The public source may refresh after the period shown on NyaayWatch.</li>
          <li><strong>Do not use this as case advice.</strong> Aggregate data can explain public pressure, not what to do in one case.</li>
        </ul>
      </div>
    </section>

    <section class="learn-section learn-citation">
      <div>
        ${renderSectionHead({
          headline: "A simple way to cite a number",
          lede:
            "A good citation includes the court, the number, the date, and the method link. That makes the claim checkable later.",
        })}
      </div>
      <div class="learn-citation__example" aria-label="Example citation">
        <p>Example:</p>
        <blockquote>
          NyaayWatch reported <strong>cases pending in the High Court of Delhi</strong> on the page dated <strong>31 March 2026</strong>, using public NJDG aggregate data and the method linked on that court page.
        </blockquote>
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
          <h3>Why do some High Courts cover more than one place?</h3>
          <p>India's High Court map does not match the state map one-to-one. Some High Courts serve more than one state or Union Territory.</p>
        </article>
        <article class="card">
          <h3>Why are some numbers rounded or simplified?</h3>
          <p>NyaayWatch uses public aggregate data. The page explains pressure clearly, while the method page carries formula details and caveats.</p>
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
  .learn-hierarchy {
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
    gap: 32px;
    align-items: start;
    padding: 34px 0 0;
    border-top: 2px solid var(--ink);
  }
  .learn-hierarchy .section-head {
    margin-bottom: 0;
  }
  .learn-hierarchy__diagram {
    display: grid;
    grid-template-columns: 1fr 28px 1fr 28px 1fr;
    align-items: stretch;
  }
  .learn-node {
    min-height: 190px;
    padding: 18px;
    border: 1px solid var(--ink);
    background: var(--paper);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .learn-node span,
  .learn-timeline__number {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--accent);
  }
  .learn-node strong {
    display: block;
    margin-top: 28px;
    font-size: 21px;
    line-height: 1.08;
  }
  .learn-node p {
    margin: 12px 0 0;
    color: var(--ink-soft);
  }
  .learn-connector {
    align-self: center;
    height: 1px;
    background: var(--ink);
  }
  .learn-scope-table {
    grid-column: 1 / -1;
    margin-top: 24px;
    border-top: 1px solid var(--ink);
  }
  .learn-scope-table [role="row"] {
    display: grid;
    grid-template-columns: minmax(140px, 0.65fr) minmax(0, 1.25fr) minmax(0, 1.1fr);
    gap: 18px;
    padding: 18px 0;
    border-bottom: 1px solid var(--rule);
  }
  .learn-scope-table [role="columnheader"] {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .learn-scope-table [role="cell"] {
    color: var(--ink-soft);
  }
  .learn-scope-table [role="cell"]:first-child {
    color: var(--ink);
    font-weight: 800;
  }
  .learn-journey {
    padding: 36px 0 0;
    border-top: 2px solid var(--ink);
  }
  .learn-timeline {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--ink);
    border-left: 1px solid var(--ink);
  }
  .learn-timeline li {
    min-height: 236px;
    padding: 18px;
    border-right: 1px solid var(--ink);
    border-bottom: 1px solid var(--ink);
    background: var(--paper);
  }
  .learn-timeline h3 {
    margin: 34px 0 12px;
    font-size: 24px;
    line-height: 1.05;
  }
  .learn-timeline p {
    margin: 0;
    color: var(--ink-soft);
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
  .learn-data-rules,
  .learn-mistakes,
  .learn-citation,
  .learn-pressure {
    padding: 34px 0 0;
    border-top: 2px solid var(--ink);
  }
  .learn-pressure-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    border: 1px solid var(--ink);
    background: var(--ink);
  }
  .learn-pressure-card {
    min-height: 248px;
    padding: 20px;
    background: var(--paper);
  }
  .learn-pressure-card span {
    display: inline-block;
    margin-bottom: 28px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .learn-pressure-card h3 {
    margin: 0 0 12px;
    font-size: 22px;
    line-height: 1.08;
  }
  .learn-pressure-card p {
    margin: 0;
    color: var(--ink-soft);
  }
  .learn-pressure-note {
    margin-top: 18px;
    padding: 20px 22px;
    border-left: 4px solid var(--accent);
    background: color-mix(in srgb, var(--paper) 82%, var(--accent) 18%);
  }
  .learn-pressure-note strong {
    display: block;
    margin-bottom: 8px;
    font-size: 19px;
    line-height: 1.15;
  }
  .learn-pressure-note p {
    margin: 0;
    color: var(--ink-soft);
  }
  .learn-rule-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .learn-rule {
    min-height: 190px;
    padding: 18px;
    border: 1px solid var(--rule);
    background: color-mix(in srgb, var(--paper) 84%, var(--accent) 16%);
  }
  .learn-rule strong {
    display: block;
    font-size: 19px;
    line-height: 1.08;
  }
  .learn-rule p {
    margin: 14px 0 0;
    color: var(--ink-soft);
  }
  .learn-mistakes__card ul {
    margin: 0;
    padding-left: 20px;
  }
  .learn-mistakes__card li + li {
    margin-top: 12px;
  }
  .learn-citation {
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    gap: 32px;
    align-items: start;
  }
  .learn-citation .section-head {
    margin-bottom: 0;
  }
  .learn-citation__example {
    padding: 22px;
    border: 1px solid var(--ink);
    background: var(--paper);
  }
  .learn-citation__example p {
    margin: 0 0 10px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .learn-citation__example blockquote {
    margin: 0;
    padding: 0 0 0 18px;
    border-left: 3px solid var(--accent);
    color: var(--ink-soft);
    font-size: 20px;
    line-height: 1.45;
  }
  .learn-faq {
    align-items: stretch;
  }
  @media (max-width: 960px) {
    .learn-map,
    .learn-hierarchy,
    .learn-reading,
    .learn-citation {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .learn-hierarchy__diagram {
      grid-template-columns: 1fr;
    }
    .learn-connector {
      width: 1px;
      height: 24px;
      justify-self: center;
    }
    .learn-timeline,
    .learn-rule-grid,
    .learn-pressure-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
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
    .learn-scope-table [role="row"] {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .learn-timeline,
    .learn-rule-grid,
    .learn-pressure-grid {
      grid-template-columns: 1fr;
    }
    .learn-timeline li,
    .learn-rule,
    .learn-node,
    .learn-pressure-card {
      min-height: auto;
    }
    .learn-section {
      margin-bottom: 56px;
    }
  }
`;

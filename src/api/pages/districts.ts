import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml, safeJsonForHtmlScript } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { infoIcon, renderBadge, renderSectionHead, renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import { formatShare } from "./metric-insights.js";
import { INVESTIGATION_WORKFLOW_CSS, renderInvestigationWorkflow } from "./investigation-workflow.js";

type DistrictSort = "rank" | "backlog" | "disposal" | "age" | "gap";
type DistrictView = "all" | "flagged";

export interface DistrictsPageOptions {
  search: string;
  sort: DistrictSort;
  view: DistrictView;
}

const SORT_LABELS: Record<DistrictSort, string> = {
  rank: "Biggest pressure signal",
  backlog: "Most cases waiting",
  disposal: "Slowest clearance pace",
  age: "Longest typical wait",
  gap: "Biggest file-clear gap",
};

const VIEW_LABELS: Record<DistrictView, string> = {
  all: "All districts",
  flagged: "Only districts to watch",
};

/**
 * /districts — the district workspace. Lets a reader sort and filter the same
 * published snapshot by different pressure angles, then click through to a
 * district's evidence page. Stays entirely within the published read model,
 * so every row is citeable with the same source date.
 */
export function renderDistrictsPage(
  snapshot: PublishedSnapshot,
  options: DistrictsPageOptions,
  context: PublicPageContext,
): string {
  const districts = filterAndSortDistricts(
    snapshot.districts,
    options,
    snapshot.stats.flaggedDistricts,
  );
  const sortedByBacklog = [...snapshot.districts].sort(
    (left, right) => right.backlogCases - left.backlogCases,
  );
  const sortedByDisposal = [...snapshot.districts].sort(
    (left, right) => left.disposalRate - right.disposalRate,
  );
  const highestBacklog = sortedByBacklog[0];
  const slowestClearance = sortedByDisposal[0];
  const comparisonHref =
    highestBacklog && slowestClearance && highestBacklog.districtId !== slowestClearance.districtId
      ? context.routes.compare(highestBacklog.districtId, slowestClearance.districtId)
      : context.routes.districts;
  const districtSuggestions = safeJsonForHtmlScript(
    snapshot.districts.map((d) => ({
      id: d.districtId,
      name: d.districtName,
      href: context.routes.district(d.districtId),
      wait: Math.round(d.medianAgeDays / 30),
      backlog: d.backlogCases,
    })),
  );

  const body = `
    ${renderSectionHead({
      eyebrow: "DISTRICT WORKSPACE",
      headline: "Scan the districts under the most pressure.",
      lede:
        "Sort the current publication by backlog, clearance pace, typical wait, or file-clear gap. When a district looks unusual, open its evidence page for history, caveats, and exports.",
      isHero: true,
    })}

    <div class="your-district-chip" id="your-district-chip">
      <span class="your-district-chip__label">Which district are you in?</span>
      <input type="search" id="your-district-input" class="your-district-chip__input" placeholder="Type a district name…" autocomplete="off" aria-label="Find your district" />
      <div id="your-district-suggestions" class="your-district-chip__suggestions" role="listbox" aria-label="District suggestions"></div>
    </div>

    <section class="stat-grid">
      ${renderStatTile({
        label: "Biggest backlog",
        value: highestBacklog?.districtName ?? "—",
        note: highestBacklog
          ? `${highestBacklog.backlogCases.toLocaleString("en-IN")} cases waiting.`
          : "No district data.",
        tone: "accent",
      })}
      ${renderStatTile({
        label: "Slowest clearance",
        value: slowestClearance?.districtName ?? "—",
        note: slowestClearance
          ? `${slowestClearance.disposalRate.toFixed(1)} cleared for every 100 filed.`
          : "No district data.",
      })}
      ${renderStatTile({
        label: "Districts to watch",
        value: snapshot.stats.flaggedDistricts.toLocaleString("en-IN"),
        infoKey: "watchlist",
        note: "These are the clearest districts to inspect first, not a finding about any court or official.",
        tone: "flag",
      })}
      ${renderStatTile({
        label: "Oldest burden",
        value: highestBacklog ? formatShare(highestBacklog.oldCaseBurden.fivePlusYearsShare) : "—",
        note: highestBacklog
          ? `${highestBacklog.districtName}: share of pending cases older than 5 years.`
          : "No district data.",
        tone: "accent",
      })}
      ${renderStatTile({
        label: "Showing",
        value: `${districts.length}/${snapshot.districts.length}`,
        note: `${VIEW_LABELS[options.view]}${options.search ? ` matching \u201C${options.search}\u201D` : ""}. Sorted by ${SORT_LABELS[options.sort].toLowerCase()}.`,
      })}
    </section>

    ${renderControls(options, context)}

    ${renderInvestigationWorkflow({
      headline: "Turn a district list into a trail.",
      lede:
        "Use the table to find a pressure signal, then open evidence, compare districts inside this geography, or check what moved between published snapshots.",
      steps: [
        {
          eyebrow: "01",
          title: "Sort for pressure",
          body: "Switch between backlog, clearance pace, typical wait, and file-clear gap instead of relying on one headline rank.",
          href: context.routes.districts,
          cta: "Reset workspace",
        },
        {
          eyebrow: "02",
          title: "Open a district",
          body: "Every district row links to a standalone evidence page with history, caveats, citation text, and CSV downloads.",
          href: highestBacklog ? context.routes.district(highestBacklog.districtId) : context.routes.districts,
          cta: "Inspect biggest backlog",
        },
        {
          eyebrow: "03",
          title: "Compare two signals",
          body: "Put two districts side by side when you need a cleaner local contrast, without turning it into a statewide finding.",
          href: comparisonHref,
          cta: "Open comparison",
        },
        {
          eyebrow: "04",
          title: "Check movement",
          body: "Use movers when there are at least two published snapshots, so you can separate scale from recent change.",
          href: context.routes.movers,
          cta: "Open movers",
        },
      ],
    })}

    ${districts.length > 0 ? renderTable(districts, context) : renderNoResults(options, context)}

    <script>
    (function() {
      var DISTRICTS = ${districtSuggestions};
      var input = document.getElementById("your-district-input");
      var box = document.getElementById("your-district-suggestions");
      if (!input || !box) return;
      input.addEventListener("input", function() {
        var q = input.value.toLowerCase().trim();
        box.textContent = "";
        if (q.length < 2) { box.style.display = "none"; return; }
        var matches = DISTRICTS.filter(function(d) { return d.name.toLowerCase().includes(q); }).slice(0, 6);
        if (matches.length === 0) { box.style.display = "none"; return; }
        matches.forEach(function(d) {
          var el = document.createElement("a");
          el.className = "your-district-chip__option";
          el.href = d.href;
          el.setAttribute("role", "option");
          var name = document.createElement("strong");
          name.textContent = d.name;
          var meta = document.createElement("span");
          meta.textContent = d.backlog.toLocaleString("en-IN") + " cases waiting · ~" + d.wait + " mo typical wait";
          el.appendChild(name);
          el.appendChild(meta);
          box.appendChild(el);
        });
        box.style.display = "block";
      });
      document.addEventListener("click", function(e) {
        if (!document.getElementById("your-district-chip").contains(e.target)) {
          box.style.display = "none";
        }
      });
    })();
    </script>
  `;

  return renderPageShell({
    title: "Districts — NyaayWatch",
    body,
    activeNav: "districts",
    brandHref: context.brandHref,
    brandTag: context.brandTag,
    navLinks: context.navLinks,
    stateLinks: context.stateLinks,
    ticker: `${escapeHtml(snapshot.snapshot.stateName.toUpperCase())} · UPDATED ${escapeHtml(formatDate(snapshot.snapshot.sourceSnapshotAt))} · ${escapeHtml(snapshot.snapshot.methodologyVersion)}`,
    pageCss: DISTRICTS_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS,
    footer: {
      sourceDateLabel: formatDate(snapshot.snapshot.sourceSnapshotAt),
      methodologyVersion: snapshot.snapshot.methodologyVersion,
      sourceAttribution: snapshot.snapshot.sourceAttribution,
    },
  });
}

function renderControls(options: DistrictsPageOptions, context: PublicPageContext): string {
  return `
    <section class="controls" aria-label="District filters">
      <form class="controls__form" method="get" action="${context.routes.districts}">
        <label class="controls__field">
          <span class="controls__label">Search</span>
          <input
            type="search"
            name="q"
            value="${escapeHtml(options.search)}"
            placeholder="District name or summary"
            class="controls__input"
          />
        </label>
        <label class="controls__field">
          <span class="controls__label">View</span>
          <select name="view" class="controls__select">
            ${renderOption("all", options.view, VIEW_LABELS.all)}
            ${renderOption("flagged", options.view, VIEW_LABELS.flagged)}
          </select>
        </label>
        <label class="controls__field">
          <span class="controls__label">Sort by</span>
          <select name="sort" class="controls__select">
            ${renderOption("rank", options.sort, SORT_LABELS.rank)}
            ${renderOption("backlog", options.sort, SORT_LABELS.backlog)}
            ${renderOption("disposal", options.sort, SORT_LABELS.disposal)}
            ${renderOption("age", options.sort, SORT_LABELS.age)}
            ${renderOption("gap", options.sort, SORT_LABELS.gap)}
          </select>
        </label>
        <button type="submit" class="btn btn--primary btn--small">Apply</button>
      </form>
      <div class="controls__links">
        <a href="${context.routes.districts}">Reset filters</a>
        <a href="${context.routes.districts}${escapeHtml(buildDistrictsHref({ ...options, view: "flagged" }))}">Only districts to watch</a>
        <a href="${context.routes.movers}">Snapshot movers</a>
        <a href="${context.routes.districtsCsv}">Download ${escapeHtml(context.lowerCourtCopy.aggregateAdjective)} CSV</a>
      </div>
    </section>
  `;
}

function renderTable(districts: DistrictSnapshot[], context: PublicPageContext): string {
  const rows = districts
    .map(
      (district) => `
        <tr>
          <td>
            <a class="district-row__name" href="${context.routes.district(district.districtId)}">${escapeHtml(district.districtName)}</a>
            <p class="district-row__summary">${escapeHtml(district.summary)}</p>
          </td>
          <td class="num accent">#${district.rank}</td>
          <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
          <td class="num">${district.disposalRate.toFixed(1)}</td>
          <td class="num">${Math.round(district.medianAgeDays / 30)} mo</td>
          <td class="num">${district.oldCaseBurden.fivePlusYearsShare.toFixed(1)}%</td>
          <td class="num">${district.watchlistPersistence.flaggedInLastSix}/${district.watchlistPersistence.lastSixWindow}</td>
          <td class="num flag">${district.filingVsDisposalGap >= 0 ? "+" : "\u2212"}${Math.abs(district.filingVsDisposalGap).toFixed(1)}</td>
          <td class="district-row__reason">${escapeHtml(district.flagReason)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="districts-table-wrap">
      <table class="data-table districts-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Rank</th>
            <th>Cases waiting ${infoIcon("backlog")}</th>
            <th>Cleared / 100 filed ${infoIcon("clearance")}</th>
            <th>Typical wait ${infoIcon("typicalWait")}</th>
            <th>Older than 5 years</th>
            <th>Repeat signal</th>
            <th>File-clear gap ${infoIcon("fileClearGap")}</th>
            <th>Why it stands out</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function renderNoResults(options: DistrictsPageOptions, context: PublicPageContext): string {
  const hasSearch = options.search.trim().length > 0;
  const isWatchlistOnly = options.view === "flagged";

  let hint: string;
  if (hasSearch && isWatchlistOnly) {
    hint = `No listed district matches <strong>&ldquo;${escapeHtml(options.search)}&rdquo;</strong>. Try broadening the search or switching to all districts.`;
  } else if (hasSearch) {
    hint = `No district matches <strong>&ldquo;${escapeHtml(options.search)}&rdquo;</strong>. Check the spelling or try a partial name.`;
  } else {
    hint = "No districts appear in the current view. Switch to all districts to see the full list.";
  }

  return `
    <article class="card no-results">
      <p class="card__eyebrow">NO RESULTS</p>
      <h3>Nothing to show here.</h3>
      <p>${hint}</p>
      <p><a class="btn btn--ghost btn--small" href="${context.routes.districts}">Reset filters</a></p>
    </article>
  `;
}

function renderOption(value: string, current: string, label: string): string {
  return `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function filterAndSortDistricts(
  districts: DistrictSnapshot[],
  options: DistrictsPageOptions,
  flaggedCount: number,
): DistrictSnapshot[] {
  const search = options.search.trim().toLowerCase();
  const filtered = districts.filter((district) => {
    const matchesView = options.view === "all" || district.rank <= flaggedCount;
    const matchesSearch =
      search.length === 0 ||
      district.districtName.toLowerCase().includes(search) ||
      district.summary.toLowerCase().includes(search);

    return matchesView && matchesSearch;
  });

  return filtered.sort((left, right) => compareDistricts(left, right, options.sort));
}

function compareDistricts(
  left: DistrictSnapshot,
  right: DistrictSnapshot,
  sort: DistrictSort,
): number {
  if (sort === "backlog") {
    return right.backlogCases - left.backlogCases || left.rank - right.rank;
  }
  if (sort === "disposal") {
    return left.disposalRate - right.disposalRate || left.rank - right.rank;
  }
  if (sort === "age") {
    return right.medianAgeDays - left.medianAgeDays || left.rank - right.rank;
  }
  if (sort === "gap") {
    return right.filingVsDisposalGap - left.filingVsDisposalGap || left.rank - right.rank;
  }
  return left.rank - right.rank;
}

function buildDistrictsHref(options: DistrictsPageOptions): string {
  const params = new URLSearchParams();
  if (options.search) {
    params.set("q", options.search);
  }
  if (options.view !== "all") {
    params.set("view", options.view);
  }
  if (options.sort !== "rank") {
    params.set("sort", options.sort);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

const DISTRICTS_PAGE_CSS = `
  .your-district-chip {
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 28px;
    padding: 12px 16px;
    border: 1px solid var(--rule);
    background: var(--paper-bright);
    max-width: 100%;
    transition: border-color 120ms ease, background 120ms ease;
  }
  .your-district-chip:hover,
  .your-district-chip:focus-within {
    border-color: var(--ink);
  }
  .your-district-chip__label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--ink-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .your-district-chip__input {
    flex: 1; min-width: 0; border: none; background: transparent;
    font-family: "Inter Tight", sans-serif; font-size: 15px; font-weight: 600;
    color: var(--ink); outline: none;
    border-bottom: 1px solid var(--rule);
    padding: 2px 0;
    width: 0;
    transition: border-color 120ms ease;
  }
  .your-district-chip__input:focus { border-bottom-color: var(--accent); }
  .your-district-chip__input::placeholder { color: var(--ink-muted); font-weight: 500; }
  .your-district-chip__suggestions {
    display: none;
    position: absolute;
    top: calc(100% + 2px); left: 0; right: 0;
    background: var(--paper-bright);
    border: 1px solid var(--ink);
    z-index: 10;
    box-shadow: 4px 4px 0 rgba(12, 10, 8, 0.08);
  }
  .your-district-chip__option {
    display: block;
    padding: 10px 16px;
    text-decoration: none;
    color: var(--ink);
    border-bottom: 1px solid var(--rule);
  }
  .your-district-chip__option:last-child { border-bottom: none; }
  .your-district-chip__option:hover { background: var(--rule-soft); }
  .your-district-chip__option strong { display: block; font-size: 14px; font-weight: 700; }
  .your-district-chip__option span { display: block; font-size: 12px; color: var(--ink-muted); font-family: "IBM Plex Mono", ui-monospace, monospace; margin-top: 2px; }

  .controls {
    margin: 0 0 32px;
    padding: 20px 24px 22px;
    border: 1px solid var(--ink);
    background: var(--paper-bright);
  }
  .controls__form {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1.4fr auto;
    gap: 16px 20px;
    align-items: end;
  }
  .controls__field { display: flex; flex-direction: column; gap: 6px; }
  .controls__label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-muted);
  }
  .controls__input, .controls__select {
    font-family: "Inter Tight", sans-serif;
    font-size: 14px; font-weight: 500;
    padding: 10px 12px;
    border: 1px solid var(--rule);
    background: var(--paper);
    color: var(--ink);
    border-radius: 2px;
    min-height: 42px;
  }
  .controls__input:focus, .controls__select:focus {
    outline: none;
    border-color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--ink);
  }
  .controls__links {
    margin-top: 14px; padding-top: 14px;
    border-top: 1px dashed var(--rule);
    display: flex; flex-wrap: wrap; gap: 18px;
    font-size: 13px;
  }
  .controls__links a { color: var(--ink-soft); }

  .districts-table-wrap {
    overflow-x: auto;
    margin-bottom: 72px;
    background:
      linear-gradient(to right, var(--paper) 30%, rgba(244, 240, 232, 0)),
      linear-gradient(to right, rgba(244, 240, 232, 0), var(--paper) 70%) 100% 0,
      linear-gradient(to right, rgba(12, 10, 8, 0.12), rgba(12, 10, 8, 0)),
      linear-gradient(to left, rgba(12, 10, 8, 0.12), rgba(12, 10, 8, 0)) 100% 0;
    background-repeat: no-repeat;
    background-size: 32px 100%, 32px 100%, 14px 100%, 14px 100%;
    background-attachment: local, local, scroll, scroll;
  }
  .districts-table { table-layout: auto; }
  .districts-table th:first-child, .districts-table td:first-child { min-width: 200px; }
  .district-row__name {
    font-weight: 700; color: var(--ink); text-decoration: none;
    font-size: 16px; letter-spacing: -0.01em;
  }
  .district-row__name:hover { color: var(--accent); text-decoration: underline; }
  .district-row__summary { margin: 4px 0 0; font-size: 12px; color: var(--ink-muted); line-height: 1.4; font-weight: 500; }
  .district-row__reason { color: var(--ink-soft); font-size: 13px; max-width: 34ch; }

  .no-results { margin-bottom: 72px; max-width: 600px; }
  .no-results .card__eyebrow {
    margin: 0 0 8px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--accent);
  }
  .no-results h3 { margin: 0 0 14px; font-size: 24px; }

  @media (max-width: 960px) {
    .controls__form { grid-template-columns: 1fr 1fr; }
    .controls__form button { grid-column: 1 / -1; justify-self: start; }
  }
  @media (max-width: 720px) {
    .controls__form { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .your-district-chip {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      padding: 12px 14px 14px;
    }
    .your-district-chip__input {
      width: 100%;
      font-size: 16px;
      padding: 6px 0;
    }
  }
`;

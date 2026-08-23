import type { DistrictSnapshot, PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { escapeHtml, safeJsonForHtmlScript } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import type { PublicPageContext } from "../public-state.js";
import { infoIcon, renderBadge, renderSectionHead, renderStatTile } from "../design/ui.js";
import { formatDate } from "../home/view-model.js";
import {
  canComputeClearancePace,
  describeClearancePer100,
  formatClearancePer100,
  formatFileClearGap,
  formatShare,
  type MonthlyActivityInputs,
} from "./metric-insights.js";
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
 * so every row is citeable with the same reference date.
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
          ? describeClearancePer100(monthlyActivityInputs(slowestClearance))
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
        anchorId: "districts-showing",
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

    ${renderTable(snapshot.districts, context, new Set(districts.map((district) => district.districtId)), snapshot.stats.flaggedDistricts)}
    ${renderNoResults(options, context, districts.length === 0)}

    <script>
    (function() {
      var DISTRICTS = ${districtSuggestions};
      var input = document.getElementById("your-district-input");
      var box = document.getElementById("your-district-suggestions");
      var form = document.querySelector(".controls__form");
      var rows = Array.prototype.slice.call(document.querySelectorAll("tr[data-district-id]"));
      var tableBody = document.querySelector(".districts-table tbody");
      var noResults = document.getElementById("districts-no-results");
      var noResultsHint = document.getElementById("districts-no-results-hint");
      var showingTile = document.getElementById("districts-showing");
      var validSorts = ["rank", "backlog", "disposal", "age", "gap"];
      var validViews = ["all", "flagged"];
      if (!input || !box || !form || !tableBody) return;

      function optionsFromLocation() {
        var params = new URLSearchParams(window.location.search);
        var sort = validSorts.indexOf(params.get("sort")) >= 0 ? params.get("sort") : "rank";
        var view = validViews.indexOf(params.get("view")) >= 0 ? params.get("view") : "all";
        return { q: (params.get("q") || "").trim().toLowerCase(), sort: sort, view: view };
      }

      function compare(left, right, sort) {
        if (sort === "backlog") return Number(right.dataset.backlog) - Number(left.dataset.backlog) || Number(left.dataset.rank) - Number(right.dataset.rank);
        if (sort === "disposal") return Number(right.dataset.disposalAvailable) - Number(left.dataset.disposalAvailable) || Number(left.dataset.disposal) - Number(right.dataset.disposal) || Number(left.dataset.rank) - Number(right.dataset.rank);
        if (sort === "age") return Number(right.dataset.age) - Number(left.dataset.age) || Number(left.dataset.rank) - Number(right.dataset.rank);
        if (sort === "gap") return Number(right.dataset.gapAvailable) - Number(left.dataset.gapAvailable) || Number(right.dataset.gap) - Number(left.dataset.gap) || Number(left.dataset.rank) - Number(right.dataset.rank);
        return Number(left.dataset.rank) - Number(right.dataset.rank);
      }

      function applyQuery() {
        var options = optionsFromLocation();
        form.elements.q.value = options.q;
        form.elements.view.value = options.view;
        form.elements.sort.value = options.sort;
        var visibleRows = rows.filter(function(row) {
          var matchesView = options.view === "all" || row.dataset.flagged === "true";
          var matchesSearch = !options.q || row.dataset.search.includes(options.q);
          return matchesView && matchesSearch;
        });
        rows.slice().sort(function(left, right) { return compare(left, right, options.sort); }).forEach(function(row) {
          tableBody.appendChild(row);
        });
        rows.forEach(function(row) { row.hidden = visibleRows.indexOf(row) < 0; });
        if (noResults) noResults.hidden = visibleRows.length > 0;
        if (noResultsHint && visibleRows.length === 0) {
          if (options.q && options.view === "flagged") noResultsHint.textContent = "No listed district matches \u201C" + options.q + "\u201D. Try broadening the search or switching to all districts.";
          else if (options.q) noResultsHint.textContent = "No district matches \u201C" + options.q + "\u201D. Check the spelling or try a partial name.";
          else noResultsHint.textContent = "No districts appear in the current view. Switch to all districts to see the full list.";
        }
        if (showingTile) {
          var value = showingTile.querySelector(".stat-tile__value");
          var note = showingTile.querySelector(".stat-tile__note");
          if (value) value.textContent = visibleRows.length + "/" + rows.length;
          if (note) note.textContent = (options.view === "flagged" ? "Only districts to watch" : "All districts") + (options.q ? " matching \u201C" + options.q + "\u201D" : "") + ". Sorted by " + ({ rank: "biggest pressure signal", backlog: "most cases waiting", disposal: "slowest clearance pace", age: "longest typical wait", gap: "biggest file-clear gap" }[options.sort]) + ".";
        }
      }

      form.addEventListener("submit", function(event) {
        event.preventDefault();
        var data = new FormData(form);
        var params = new URLSearchParams();
        ["q", "view", "sort"].forEach(function(key) {
          var value = String(data.get(key) || "");
          if (value && !(key === "view" && value === "all") && !(key === "sort" && value === "rank")) params.set(key, value);
        });
        var next = new URL(window.location.href);
        next.search = params.toString();
        window.history.pushState({}, "", next.href);
        applyQuery();
      });
      window.addEventListener("popstate", applyQuery);

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
      applyQuery();
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
    ticker: `${escapeHtml(snapshot.snapshot.stateName.toUpperCase())} · UPDATED ${escapeHtml(formatDate(snapshot.snapshot.referenceDateAt))} · ${escapeHtml(snapshot.snapshot.methodologyVersion)}`,
    pageCss: DISTRICTS_PAGE_CSS + INVESTIGATION_WORKFLOW_CSS,
    footer: {
      sourceDateLabel: formatDate(snapshot.snapshot.referenceDateAt),
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

function renderTable(
  districts: DistrictSnapshot[],
  context: PublicPageContext,
  visibleDistrictIds: Set<string>,
  flaggedCount: number,
): string {
  const rows = districts
    .map(
      (district) => {
        const activity = monthlyActivityInputs(district);
        const isFlagged = district.rank <= flaggedCount;
        return `
        <tr data-district-id="${escapeHtml(district.districtId)}" data-search="${escapeHtml(`${district.districtName} ${district.summary}`.toLowerCase())}" data-flagged="${isFlagged ? "true" : "false"}" data-rank="${district.rank}" data-backlog="${district.backlogCases}" data-disposal="${district.disposalRate}" data-disposal-available="${canComputeClearancePace(activity) ? "1" : "0"}" data-age="${district.medianAgeDays}" data-gap="${district.filingVsDisposalGap}" data-gap-available="${canComputeClearancePace(activity) ? "1" : "0"}"${visibleDistrictIds.has(district.districtId) ? "" : " hidden"}>
          <td>
            <a class="district-row__name" href="${context.routes.district(district.districtId)}">${escapeHtml(district.districtName)}</a>
            <p class="district-row__summary">${escapeHtml(district.summary)}</p>
          </td>
          <td class="num accent">#${district.rank}</td>
          <td class="num">${district.backlogCases.toLocaleString("en-IN")}</td>
          <td class="num">${formatClearancePer100(activity, 1)}</td>
          <td class="num">${Math.round(district.medianAgeDays / 30)} mo</td>
          <td class="num">${district.oldCaseBurden.fivePlusYearsShare.toFixed(1)}%</td>
          <td class="num">${district.watchlistPersistence.flaggedInLastSix}/${district.watchlistPersistence.lastSixWindow}</td>
          <td class="num flag">${formatFileClearGap(activity)}</td>
          <td class="district-row__reason">${escapeHtml(district.flagReason)}</td>
        </tr>
      `;
      },
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

function renderNoResults(options: DistrictsPageOptions, context: PublicPageContext, visible: boolean): string {
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
    <article class="card no-results" id="districts-no-results"${visible ? "" : " hidden"}>
      <p class="card__eyebrow">NO RESULTS</p>
      <h3>Nothing to show here.</h3>
      <p id="districts-no-results-hint">${hint}</p>
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
    const leftAvailable = canComputeClearancePace(monthlyActivityInputs(left));
    const rightAvailable = canComputeClearancePace(monthlyActivityInputs(right));
    if (leftAvailable !== rightAvailable) {
      return leftAvailable ? -1 : 1;
    }
    return left.disposalRate - right.disposalRate || left.rank - right.rank;
  }
  if (sort === "age") {
    return right.medianAgeDays - left.medianAgeDays || left.rank - right.rank;
  }
  if (sort === "gap") {
    const leftAvailable = canComputeClearancePace(monthlyActivityInputs(left));
    const rightAvailable = canComputeClearancePace(monthlyActivityInputs(right));
    if (leftAvailable !== rightAvailable) {
      return leftAvailable ? -1 : 1;
    }
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

function monthlyActivityInputs(district: DistrictSnapshot): MonthlyActivityInputs {
  return {
    pendingCases: district.backlogCases,
    filedLastMonthCases: district.filedLastMonthCases,
    clearedLastMonthCases: district.clearedLastMonthCases,
  };
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

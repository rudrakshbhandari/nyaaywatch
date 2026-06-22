import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { NjdgStateProfile } from "../../geographies.js";
import { escapeHtml } from "../../lib/html.js";
import { renderPageShell } from "../design/shell.js";
import { renderStatTile } from "../design/ui.js";
import { SITE_ORIGIN } from "../share/site-origin.js";
import { formatDate } from "../home/view-model.js";
import { WATCHROOM_PAGE_CSS } from "./watchroom-shared.js";

export interface WatchIndexEntry {
  profile: NjdgStateProfile;
  snapshot: PublishedSnapshot;
}

export function renderWatchIndexPage(entries: WatchIndexEntry[]): string {
  const geographiesWithAgeBuckets = entries.filter((entry) => entry.snapshot.stats.oldCaseBurden.state === "ok").length;
  const geographiesWithConcentration = entries.filter((entry) => entry.snapshot.stats.backlogConcentration.state === "ok").length;
  const oldCaseSignals = entries
    .flatMap((entry) =>
      entry.snapshot.stats.oldCaseBurden.state === "ok"
        ? [{ entry, share: entry.snapshot.stats.oldCaseBurden.value.threePlusYearsShare }]
        : [],
    )
    .sort((a, b) => b.share - a.share || b.entry.snapshot.stats.pendingCases - a.entry.snapshot.stats.pendingCases);
  const topOldCaseSignal = oldCaseSignals[0] ?? null;
  const persistentDistricts = entries
    .flatMap((entry) =>
      entry.snapshot.districts
        .filter((district) => district.watchlistPersistence.lastSixWindow > 0 && district.watchlistPersistence.flaggedInLastSix > 0)
        .map((district) => ({ entry, district })),
    )
    .sort(
      (a, b) =>
        persistenceRate(b.district) - persistenceRate(a.district) ||
        b.district.watchlistPersistence.flaggedInLastSix - a.district.watchlistPersistence.flaggedInLastSix ||
        b.district.backlogCases - a.district.backlogCases,
    );
  const topPersistentSignal = persistentDistricts[0] ?? null;
  const concentrationSignals = entries
    .flatMap((entry) =>
      entry.snapshot.stats.backlogConcentration.state === "ok" && entry.snapshot.districts.length > 5
        ? [{ entry, share: entry.snapshot.stats.backlogConcentration.value.topFiveDistrictsShare }]
        : [],
    )
    .sort((a, b) => b.share - a.share || b.entry.snapshot.stats.pendingCases - a.entry.snapshot.stats.pendingCases);
  const topConcentrationSignal = concentrationSignals[0] ?? null;
  const geographiesWithPersistentSignals = entries.filter((entry) =>
    entry.snapshot.districts.some(
      (district) => district.watchlistPersistence.lastSixWindow > 0 && district.watchlistPersistence.flaggedInLastSix > 0,
    ),
  ).length;
  const latestReferenceDate = entries
    .map((entry) => entry.snapshot.snapshot.referenceDateAt)
    .sort()
    .at(-1);
  const sourceDateLabel = latestReferenceDate ? formatDate(latestReferenceDate) : null;

  const body = `
    <section class="watchroom-hero">
      <p class="watchroom-hero__eyebrow">ISSUE WATCHROOMS</p>
      <h1>Watchrooms</h1>
      <p class="watchroom-hero__lede">Start with the pressure signals that deserve closer inspection.</p>
      <p class="watchroom-hero__body">Watchrooms collect lower-court signals that are easy to misread in isolation. Each page keeps the source date, scale, caveats, and evidence links close to the numbers.</p>
      <p class="watchroom-hero__meta">${entries.length.toLocaleString("en-IN")} lower-court geographies checked · Source: National Judicial Data Grid public district dashboards</p>
    </section>

    <section class="watchroom-toplines" aria-label="Watchroom toplines">
      ${renderStatTile({
        label: "Issue pages live",
        value: "3",
        note: "Old-case burden, persistent pressure, and backlog concentration",
        tone: "accent",
      })}
      ${renderStatTile({
        label: "With age buckets",
        value: geographiesWithAgeBuckets.toLocaleString("en-IN"),
        unit: `/ ${entries.length.toLocaleString("en-IN")}`,
      })}
      ${renderStatTile({
        label: "With concentration",
        value: geographiesWithConcentration.toLocaleString("en-IN"),
        unit: `/ ${entries.length.toLocaleString("en-IN")}`,
      })}
    </section>

    <section class="watchroom-section">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">OPEN WATCHROOMS</p>
        <h2>Choose the question first.</h2>
        <p>These pages do not rank every court tier together. They keep each issue inside the lower-court source family and point back to reusable evidence.</p>
      </header>
      <div class="watchroom-card-grid">
        <article class="watchroom-decision-card">
          <div>
            <p class="watchroom-decision-card__question">Where are old cases concentrated?</p>
            <h3>Old-case burden</h3>
            <p>Find where pending cases are already older than three, five, and ten years.</p>
          </div>
          <div class="watchroom-decision-card__meta">
            <p><span>Top signal</span>${escapeHtml(describeOldCaseSignal(topOldCaseSignal))}</p>
            <p><span>Use when</span>You need to separate long waits from the size of the pending pile.</p>
          </div>
          <a class="watchroom-decision-card__cta" href="/watch/old-case-burden">Open watchroom</a>
        </article>
        <article class="watchroom-decision-card">
          <div>
            <p class="watchroom-decision-card__question">Which districts keep getting flagged?</p>
            <h3>Persistent pressure</h3>
            <p>Find districts that have been flagged repeatedly across recent public readings.</p>
          </div>
          <div class="watchroom-decision-card__meta">
            <p><span>Top signal</span>${escapeHtml(describePersistentSignal(topPersistentSignal))}</p>
            <p><span>Use when</span>You want repeated pressure, not a one-reading spike.</p>
          </div>
          <a class="watchroom-decision-card__cta" href="/watch/persistent-pressure">Open watchroom</a>
        </article>
        <article class="watchroom-decision-card">
          <div>
            <p class="watchroom-decision-card__question">Is backlog concentrated in a few districts?</p>
            <h3>Backlog concentration</h3>
            <p>Find whether pending cases are held by a few large districts or spread across the geography.</p>
          </div>
          <div class="watchroom-decision-card__meta">
            <p><span>Top signal</span>${escapeHtml(describeConcentrationSignal(topConcentrationSignal))}</p>
            <p><span>Use when</span>You need to choose between district-level inspection and wider geography pressure.</p>
          </div>
          <a class="watchroom-decision-card__cta" href="/watch/backlog-concentration">Open watchroom</a>
        </article>
      </div>
    </section>

    <section class="watchroom-section">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">QUICK COUNTS</p>
        <h2>What the watchrooms can read right now.</h2>
        <p>These counts only show available lower-court signals. Missing source fields stay out of the ranking until the public data can support them.</p>
      </header>
      <div class="watchroom-card-grid">
        <article>
          <h3>Repeat signals</h3>
          <p>${geographiesWithPersistentSignals.toLocaleString("en-IN")} geographies include ${persistentDistricts.length.toLocaleString("en-IN")} districts flagged at least once in the recent window.</p>
        </article>
        <article>
          <h3>Age buckets</h3>
          <p>${geographiesWithAgeBuckets.toLocaleString("en-IN")} geographies expose old-case age buckets for the old-case burden watchroom.</p>
        </article>
        <article>
          <h3>District concentration</h3>
          <p>${geographiesWithConcentration.toLocaleString("en-IN")} geographies expose district pending-case counts for the concentration watchroom.</p>
        </article>
      </div>
    </section>

    <section class="watchroom-section watchroom-caveat">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">HOW TO READ</p>
        <h2>Watchrooms are prompts for evidence, not conclusions.</h2>
      </header>
      <div class="watchroom-caveat__grid">
        <article>
          <h3>Start with the signal.</h3>
          <p>Use the watchroom to choose a geography or district that deserves closer reading.</p>
        </article>
        <article>
          <h3>Check the scale.</h3>
          <p>Read the case count beside the signal so small and large districts do not look the same.</p>
        </article>
        <article>
          <h3>Carry the caveat.</h3>
          <p>Open the evidence pack or district page before quoting a number outside NyaayWatch.</p>
        </article>
      </div>
    </section>
  `;

  return renderPageShell({
    title: "Watchrooms — NyaayWatch",
    body,
    activeNav: "watch",
    navLinks: [
      { id: "districts", href: "/districts", label: "Districts" },
      { id: "watch", href: "/watch", label: "Watch" },
      { id: "data", href: "/data", label: "Data" },
      { id: "methodology", href: "/methodology", label: "Method" },
      { id: "api", href: "/api", label: "API" },
      { id: "learn", href: "/learn", label: "Learn" },
    ],
    ticker: `WATCHROOMS · LOWER COURTS · ${entries.length.toLocaleString("en-IN")} GEOGRAPHIES CHECKED`,
    footer: {
      sourceDateLabel,
      methodologyVersion: entries[0]?.snapshot.snapshot.methodologyVersion ?? null,
      sourceAttribution: "National Judicial Data Grid public district dashboards",
    },
    pageCss: WATCHROOM_PAGE_CSS,
    og: {
      title: "Watchrooms — NyaayWatch",
      description: "Lower-court issue watchrooms for old cases, repeated pressure, and evidence-first inspection.",
      url: `${SITE_ORIGIN}/watch`,
    },
  });
}

function describeOldCaseSignal(signal: { entry: WatchIndexEntry; share: number } | null): string {
  if (!signal) {
    return "No age-bucket signal is available right now.";
  }
  return `${signal.entry.profile.stateName}: ${formatPercent(signal.share)} of pending cases are older than 3 years.`;
}

function describePersistentSignal(signal: { entry: WatchIndexEntry; district: PublishedSnapshot["districts"][number] } | null): string {
  if (!signal) {
    return "No repeat district signal is available right now.";
  }
  const { flaggedInLastSix, lastSixWindow } = signal.district.watchlistPersistence;
  return `${signal.district.districtName}, ${signal.entry.profile.stateName}: flagged in ${flaggedInLastSix} of ${lastSixWindow} recent readings.`;
}

function describeConcentrationSignal(signal: { entry: WatchIndexEntry; share: number } | null): string {
  if (!signal) {
    return "No comparable concentration signal is available right now.";
  }
  return `${signal.entry.profile.stateName}: top 5 districts hold ${formatPercent(signal.share)} of pending cases.`;
}

function persistenceRate(district: PublishedSnapshot["districts"][number]): number {
  const { flaggedInLastSix, lastSixWindow } = district.watchlistPersistence;
  return lastSixWindow > 0 ? flaggedInLastSix / lastSixWindow : 0;
}

function formatPercent(value: number): string {
  return `${(Math.round(value * 10) / 10).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

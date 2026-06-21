import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import type { NjdgStateProfile } from "../../geographies.js";
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
  const persistentDistricts = entries.flatMap((entry) =>
    entry.snapshot.districts.filter(
      (district) => district.watchlistPersistence.lastSixWindow > 0 && district.watchlistPersistence.flaggedInLastSix > 0,
    ),
  );
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
        value: "2",
        note: "Old-case burden and persistent pressure",
        tone: "accent",
      })}
      ${renderStatTile({
        label: "With age buckets",
        value: geographiesWithAgeBuckets.toLocaleString("en-IN"),
        unit: `/ ${entries.length.toLocaleString("en-IN")}`,
      })}
      ${renderStatTile({
        label: "With repeat signals",
        value: geographiesWithPersistentSignals.toLocaleString("en-IN"),
        note: `${persistentDistricts.length.toLocaleString("en-IN")} districts flagged at least once in the recent window`,
      })}
    </section>

    <section class="watchroom-section">
      <header class="watchroom-section__head">
        <p class="watchroom-section__eyebrow">OPEN WATCHROOMS</p>
        <h2>Choose the question first.</h2>
        <p>These pages do not rank every court tier together. They keep each issue inside the lower-court source family and point back to reusable evidence.</p>
      </header>
      <div class="watchroom-card-grid">
        <article>
          <h3>Old-case burden</h3>
          <p>Find where pending cases are already older than three, five, and ten years.</p>
          <a href="/watch/old-case-burden">Open old-case watchroom</a>
        </article>
        <article>
          <h3>Persistent pressure</h3>
          <p>Find districts that have been flagged repeatedly across recent published snapshots.</p>
          <a href="/watch/persistent-pressure">Open persistent-pressure watchroom</a>
        </article>
        <article class="watchroom-card--muted">
          <h3>Backlog concentration</h3>
          <p>Next candidate: show whether delay is held by a few large districts or spread across the geography.</p>
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

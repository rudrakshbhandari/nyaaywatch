import React from "react";

import type { DistrictDetailPayload } from "../../../shared/src/contracts";
import { TrustStrip } from "../components/trust-strip";
import { formatInteger, formatPercent, sentenceCase } from "../format";

export interface DistrictPageProps {
  data: DistrictDetailPayload | null;
  districtSlug: string;
}

export function DistrictPage({ data, districtSlug }: DistrictPageProps) {
  if (!data) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <p className="eyebrow">District evidence</p>
          <h1>District not available in published coverage.</h1>
          <p className="lede">
            NyaayWatch could not find a published Himachal district record for <strong>{districtSlug}</strong>.
          </p>
          <a className="inline-link" href="/">
            Return to the published snapshot
          </a>
        </section>
      </div>
    );
  }

  const { district, snapshot } = data;

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">District evidence page</p>
        <h1>{district.name}</h1>
        <p className="lede">{district.plainLanguageSummary}</p>
        {snapshot.freshnessStatus === "stale" ? (
          <div className="warning-banner" role="status">
            This district page is showing a stale published snapshot from <strong>{snapshot.snapshotDate}</strong>.
          </div>
        ) : null}
        <TrustStrip snapshot={snapshot} />
      </section>

      <section className="metric-grid" aria-label={`${district.name} key metrics`}>
        <article className="metric-card">
          <span className="metric-label">Pending cases</span>
          <strong className="metric-value">{formatInteger(district.pendingCases)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Backlog change</span>
          <strong className="metric-value">{formatPercent(district.backlogChangePct)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Disposal rate</span>
          <strong className="metric-value">{formatPercent(district.disposalRatePct)}</strong>
        </article>
      </section>

      <section className="content-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Flagged status</p>
            <h2>
              {district.flagged ? "Flagged signal" : "Watched district"} · Rank {district.rank}
            </h2>
          </div>
          <p className="section-note">Quality: {sentenceCase(district.qualityStatus)}</p>
        </div>
        <p>{district.signalSummary}</p>
        <ul className="evidence-list">
          {district.evidenceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="content-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Stored history</p>
            <h2>District trend</h2>
          </div>
          <p className="section-note">Each point comes from a published or replayable snapshot row.</p>
        </div>
        <ul className="trend-list">
          {district.trend.map((point) => (
            <li key={point.snapshotDate}>
              <strong>{point.snapshotDate}</strong>
              <span>
                {formatInteger(point.pendingCases)} pending cases · {formatPercent(point.disposalRatePct)} disposal
                rate
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

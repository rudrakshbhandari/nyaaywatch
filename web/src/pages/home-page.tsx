import React from "react";

import type { HimachalStatsPayload } from "../../../shared/src/contracts";
import { TrustStrip } from "../components/trust-strip";
import { formatInteger, formatPercent, sentenceCase } from "../format";

export interface HomePageProps {
  data: HimachalStatsPayload | null;
}

export function HomePage({ data }: HomePageProps) {
  if (!data) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <p className="eyebrow">Public alpha</p>
          <h1>No published Himachal snapshot yet.</h1>
          <p className="lede">
            NyaayWatch only serves a published snapshot. Public routes stay empty until an operator publishes a
            complete Himachal run.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="eyebrow">Public alpha</p>
        <h1>See how slow justice is, district by district.</h1>
        <p className="lede">
          We observed these metrics in the latest published Himachal Pradesh snapshot. Numbers stay tied to that
          stored evidence until a new run is explicitly published.
        </p>
        {data.snapshot.freshnessStatus === "stale" ? (
          <div className="warning-banner" role="status">
            This snapshot is stale. NyaayWatch is still showing the last trustworthy published numbers from{" "}
            <strong>{data.snapshot.snapshotDate}</strong>.
          </div>
        ) : null}
        <TrustStrip snapshot={data.snapshot} />
      </section>

      <section className="metric-grid" aria-label="Himachal topline metrics">
        <article className="metric-card">
          <span className="metric-label">Pending cases</span>
          <strong className="metric-value">{formatInteger(data.metrics.pendingCases)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Filing minus disposal gap</span>
          <strong className="metric-value">{formatPercent(data.metrics.filingDisposalGapPct)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Districts flagged</span>
          <strong className="metric-value">{formatInteger(data.metrics.districtsFlagged)}</strong>
        </article>
      </section>

      <section className="content-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Discovery surface</p>
            <h2>District ranking preview</h2>
          </div>
          <p className="section-note">Rows are ordered by the published statewide ranking for this snapshot.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>District</th>
                <th>Pending cases</th>
                <th>Backlog change</th>
                <th>Disposal rate</th>
                <th>Flagged signal</th>
              </tr>
            </thead>
            <tbody>
              {data.districtsPreview.map((district) => (
                <tr key={district.slug}>
                  <td>{district.rank}</td>
                  <td>
                    <a href={`/districts/${district.slug}`}>{district.name}</a>
                  </td>
                  <td>{formatInteger(district.pendingCases)}</td>
                  <td>{formatPercent(district.backlogChangePct)}</td>
                  <td>{formatPercent(district.disposalRatePct)}</td>
                  <td>
                    <span className={`badge ${district.flagged ? "badge-alert" : ""}`}>
                      {district.flagged ? "Flagged" : "Watching"}
                    </span>
                    <span className="cell-note">{district.signalSummary}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Statewide trend</p>
            <h2>Backlog direction across stored snapshots</h2>
          </div>
          <p className="section-note">Direction is currently {sentenceCase(data.metrics.trendDirection)}.</p>
        </div>
        <ul className="trend-list">
          {data.trend.map((point) => (
            <li key={point.snapshotDate}>
              <strong>{point.snapshotDate}</strong>
              <span>{formatInteger(point.pendingCases)} pending cases</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="content-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Flagged signals</p>
            <h2>Why districts were called out</h2>
          </div>
          <p className="section-note">Signals are rule-based and descriptive, not verdicts.</p>
        </div>
        <div className="signal-grid">
          {data.flaggedSignals.map((signal) => (
            <article key={signal.slug} className="signal-card">
              <h3>{signal.label}</h3>
              <p>{signal.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import React from "react";

import type { SnapshotTrustMetadata } from "../../../shared/src/contracts";
import { sentenceCase } from "../format";

export interface TrustStripProps {
  snapshot: SnapshotTrustMetadata;
}

export function TrustStrip({ snapshot }: TrustStripProps) {
  return (
    <section className="trust-strip" aria-label="Published snapshot metadata">
      <div>
        <span className="trust-label">Snapshot</span>
        <strong>{snapshot.snapshotDate}</strong>
      </div>
      <div>
        <span className="trust-label">Published</span>
        <strong>{snapshot.publishedAt.slice(0, 10)}</strong>
      </div>
      <div>
        <span className="trust-label">Methodology</span>
        <strong>{snapshot.methodologyVersion}</strong>
      </div>
      <div>
        <span className="trust-label">Source</span>
        <strong>{snapshot.sourceName}</strong>
      </div>
      <div>
        <span className="trust-label">Freshness</span>
        <strong>{sentenceCase(snapshot.freshnessStatus)}</strong>
      </div>
      <div>
        <span className="trust-label">Quality</span>
        <strong>{sentenceCase(snapshot.qualityStatus)}</strong>
      </div>
    </section>
  );
}

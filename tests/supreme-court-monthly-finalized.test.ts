import { describe, expect, it } from "vitest";

import {
  SupremeCourtPublishedSnapshotSchema,
  type SupremeCourtPublishedSnapshot,
} from "../src/domain/supreme-court-snapshot-schema.js";
import type { ExtractedSupremeCourtSnapshot } from "../src/extract/supreme-court-njdg-html.js";
import { buildMonthlyFinalized } from "../src/normalize/supreme-court-snapshot-candidate.js";

type PublishedSnapshotInput = {
  referenceDateAt: string;
  institutedLastMonthTotalCases: number;
  disposedLastMonthTotalCases: number;
};

function makePublishedSnapshot(input: PublishedSnapshotInput): SupremeCourtPublishedSnapshot {
  return {
    snapshot: {
      courtTier: "supreme_court",
      courtCode: "SCI",
      courtSlug: "supreme-court",
      courtName: "Supreme Court of India",
      sourceName: "Supreme Court NJDG dashboard",
      sourceSnapshotAt: null,
      referenceDateAt: input.referenceDateAt,
      referenceDateKind: "captured_at",
      publishedAt: input.referenceDateAt,
      methodologyVersion: "2026.04-supreme-court-draft",
      qualityState: "complete",
      freshnessDays: 0,
      sourceAttribution: "Supreme Court of India National Judicial Data Grid",
    },
    stats: {
      pendingCivilRegisteredCases: 0,
      pendingCivilUnregisteredCases: 0,
      pendingCivilTotalCases: 0,
      pendingCriminalRegisteredCases: 0,
      pendingCriminalUnregisteredCases: 0,
      pendingCriminalTotalCases: 0,
      pendingRegisteredCases: 0,
      pendingUnregisteredCases: 0,
      pendingTotalCases: 0,
      institutedLastMonthCivilCases: 0,
      institutedLastMonthCriminalCases: 0,
      institutedLastMonthTotalCases: input.institutedLastMonthTotalCases,
      disposedLastMonthCivilCases: 0,
      disposedLastMonthCriminalCases: 0,
      disposedLastMonthTotalCases: input.disposedLastMonthTotalCases,
      institutedCurrentYearCivilCases: 0,
      institutedCurrentYearCriminalCases: 0,
      institutedCurrentYearTotalCases: 0,
      disposedCurrentYearCivilCases: 0,
      disposedCurrentYearCriminalCases: 0,
      disposedCurrentYearTotalCases: 0,
    },
    trends: [
      {
        referenceDateAt: input.referenceDateAt,
        referenceDateKind: "captured_at",
        pendingTotalCases: 0,
        institutedLastMonthTotalCases: input.institutedLastMonthTotalCases,
        disposedLastMonthTotalCases: input.disposedLastMonthTotalCases,
      },
    ],
    monthlyFinalized: [],
  };
}

function makeExtracted(input: {
  capturedAt: string;
  institutedTotal: number;
  disposedTotal: number;
}): ExtractedSupremeCourtSnapshot {
  return {
    capturedAt: input.capturedAt,
    courtCode: "SCI",
    courtSlug: "supreme-court",
    courtName: "Supreme Court of India",
    sourceName: "Supreme Court NJDG dashboard",
    sourceAttribution: "Supreme Court of India National Judicial Data Grid",
    sourceSnapshotAt: null,
    pendingCivil: { registeredCases: 0, unregisteredCases: 0, totalCases: 0 },
    pendingCriminal: { registeredCases: 0, unregisteredCases: 0, totalCases: 0 },
    pendingRegisteredCases: 0,
    pendingUnregisteredCases: 0,
    pendingTotalCases: 0,
    institutedLastMonth: { civilCases: 0, criminalCases: 0, totalCases: input.institutedTotal },
    disposedLastMonth: { civilCases: 0, criminalCases: 0, totalCases: input.disposedTotal },
    institutedCurrentYear: { civilCases: 0, criminalCases: 0, totalCases: 0 },
    disposedCurrentYear: { civilCases: 0, criminalCases: 0, totalCases: 0 },
  };
}

describe("buildMonthlyFinalized", () => {
  it("returns an empty array when we have fewer than two captures", () => {
    const extracted = makeExtracted({
      capturedAt: "2026-04-19T00:00:00.000Z",
      institutedTotal: 6638,
      disposedTotal: 4735,
    });
    expect(buildMonthlyFinalized([], extracted)).toEqual([]);
  });

  it("returns an empty array while all captures stay within the same month (accumulator rising, no reset)", () => {
    const previous = [
      makePublishedSnapshot({
        referenceDateAt: "2026-04-05T00:00:00.000Z",
        institutedLastMonthTotalCases: 1500,
        disposedLastMonthTotalCases: 1200,
      }),
      makePublishedSnapshot({
        referenceDateAt: "2026-04-12T00:00:00.000Z",
        institutedLastMonthTotalCases: 3400,
        disposedLastMonthTotalCases: 2800,
      }),
    ];
    const extracted = makeExtracted({
      capturedAt: "2026-04-19T00:00:00.000Z",
      institutedTotal: 5000,
      disposedTotal: 4200,
    });
    expect(buildMonthlyFinalized(previous, extracted)).toEqual([]);
  });

  it("emits one finalized entry when the accumulator resets between two captures", () => {
    const previous = [
      makePublishedSnapshot({
        referenceDateAt: "2026-04-28T00:00:00.000Z",
        institutedLastMonthTotalCases: 6638,
        disposedLastMonthTotalCases: 4735,
      }),
    ];
    // May 1 capture: accumulator has reset to low values for May
    const extracted = makeExtracted({
      capturedAt: "2026-05-01T06:00:00.000Z",
      institutedTotal: 120,
      disposedTotal: 95,
    });
    expect(buildMonthlyFinalized(previous, extracted)).toEqual([
      {
        yearMonth: "2026-04",
        institutedTotalCases: 6638,
        disposedTotalCases: 4735,
        derivedFromReferenceDateAt: "2026-04-28T00:00:00.000Z",
      },
    ]);
  });

  it("uses the IST calendar month when labelling — a UTC timestamp late on the last day of the month belongs to the next IST day", () => {
    // 2026-04-30T23:00Z = 2026-05-01T04:30 IST, so this capture sits in May IST.
    // It must NOT be labelled April 2026.
    const previous = [
      makePublishedSnapshot({
        referenceDateAt: "2026-04-29T12:00:00.000Z",
        institutedLastMonthTotalCases: 6000,
        disposedLastMonthTotalCases: 4500,
      }),
      makePublishedSnapshot({
        referenceDateAt: "2026-04-30T23:00:00.000Z",
        institutedLastMonthTotalCases: 6638,
        disposedLastMonthTotalCases: 4735,
      }),
    ];
    const extracted = makeExtracted({
      capturedAt: "2026-05-02T06:00:00.000Z",
      institutedTotal: 300,
      disposedTotal: 250,
    });
    const result = buildMonthlyFinalized(previous, extracted);
    expect(result).toHaveLength(1);
    // The pre-reset capture is the April 30 23:00Z one, which is May 1 in IST.
    expect(result[0]?.yearMonth).toBe("2026-05");
  });

  it("emits one entry per detected reset when the history spans multiple month boundaries", () => {
    const previous = [
      // February closing values
      makePublishedSnapshot({
        referenceDateAt: "2026-02-26T00:00:00.000Z",
        institutedLastMonthTotalCases: 5100,
        disposedLastMonthTotalCases: 3900,
      }),
      // March, in-progress
      makePublishedSnapshot({
        referenceDateAt: "2026-03-10T00:00:00.000Z",
        institutedLastMonthTotalCases: 2200,
        disposedLastMonthTotalCases: 1700,
      }),
      // March closing values
      makePublishedSnapshot({
        referenceDateAt: "2026-03-28T00:00:00.000Z",
        institutedLastMonthTotalCases: 5800,
        disposedLastMonthTotalCases: 4200,
      }),
      // April in-progress
      makePublishedSnapshot({
        referenceDateAt: "2026-04-05T00:00:00.000Z",
        institutedLastMonthTotalCases: 900,
        disposedLastMonthTotalCases: 700,
      }),
    ];
    // April closing → next capture in May triggers the third reset
    const extracted = makeExtracted({
      capturedAt: "2026-05-01T06:00:00.000Z",
      institutedTotal: 150,
      disposedTotal: 120,
    });
    const april = makePublishedSnapshot({
      referenceDateAt: "2026-04-30T12:00:00.000Z",
      institutedLastMonthTotalCases: 6638,
      disposedLastMonthTotalCases: 4735,
    });

    const result = buildMonthlyFinalized([...previous, april], extracted);
    expect(result).toEqual([
      {
        yearMonth: "2026-02",
        institutedTotalCases: 5100,
        disposedTotalCases: 3900,
        derivedFromReferenceDateAt: "2026-02-26T00:00:00.000Z",
      },
      {
        yearMonth: "2026-03",
        institutedTotalCases: 5800,
        disposedTotalCases: 4200,
        derivedFromReferenceDateAt: "2026-03-28T00:00:00.000Z",
      },
      {
        yearMonth: "2026-04",
        institutedTotalCases: 6638,
        disposedTotalCases: 4735,
        derivedFromReferenceDateAt: "2026-04-30T12:00:00.000Z",
      },
    ]);
  });

  it("dedupes multiple captures with the same reference date", () => {
    // Same reference date appears twice in previousSnapshots — the second
    // occurrence must be ignored so the derivation still sees a clean
    // chronological history.
    const duplicate = makePublishedSnapshot({
      referenceDateAt: "2026-04-28T00:00:00.000Z",
      institutedLastMonthTotalCases: 6638,
      disposedLastMonthTotalCases: 4735,
    });
    const extracted = makeExtracted({
      capturedAt: "2026-05-01T06:00:00.000Z",
      institutedTotal: 120,
      disposedTotal: 95,
    });
    const result = buildMonthlyFinalized([duplicate, duplicate], extracted);
    expect(result).toHaveLength(1);
    expect(result[0]?.yearMonth).toBe("2026-04");
  });
});

describe("SupremeCourtPublishedSnapshotSchema", () => {
  it("parses snapshots published before monthlyFinalized existed and defaults the field to []", () => {
    const legacy = makePublishedSnapshot({
      referenceDateAt: "2026-04-19T00:00:00.000Z",
      institutedLastMonthTotalCases: 6638,
      disposedLastMonthTotalCases: 4735,
    });
    const { monthlyFinalized: _drop, ...withoutField } = legacy;
    const parsed = SupremeCourtPublishedSnapshotSchema.parse(withoutField);
    expect(parsed.monthlyFinalized).toEqual([]);
  });
});

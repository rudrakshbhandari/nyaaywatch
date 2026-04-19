import { afterEach, describe, expect, it, vi } from "vitest";

import {
  extractSupremeCourtCaptureBundle,
  extractSupremeCourtSourceSnapshotAt,
} from "../src/extract/supreme-court-njdg-html.js";
import { SupremeCourtNjdgSourceClient } from "../src/ingest/supreme-court-source-client.js";
import { BASE_SUPREME_COURT_HTML, buildSupremeCourtCaptureBundle } from "./fixtures/supreme-court.js";

describe("Supreme Court source client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("captures the Supreme Court NJDG dashboard page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => BASE_SUPREME_COURT_HTML,
        url,
      })),
    );

    const client = new SupremeCourtNjdgSourceClient();
    const bundle = await client.captureLatest();

    expect(bundle.courtCode).toBe("SCI");
    expect(bundle.homePage.url).toBe("https://scdg.sci.gov.in/scnjdg/");
  });
});

describe("Supreme Court NJDG extraction", () => {
  it("extracts the aggregate Supreme Court metrics from the source page", () => {
    const extracted = extractSupremeCourtCaptureBundle(buildSupremeCourtCaptureBundle());

    expect(extracted.pendingCivil).toEqual({
      registeredCases: 54949,
      unregisteredCases: 17934,
      totalCases: 72883,
    });
    expect(extracted.pendingCriminal).toEqual({
      registeredCases: 15402,
      unregisteredCases: 3960,
      totalCases: 19362,
    });
    expect(extracted.pendingRegisteredCases).toBe(70351);
    expect(extracted.pendingUnregisteredCases).toBe(21894);
    expect(extracted.pendingTotalCases).toBe(92245);
    expect(extracted.institutedLastMonth).toEqual({
      civilCases: 4502,
      criminalCases: 2136,
      totalCases: 6638,
    });
    expect(extracted.disposedLastMonth).toEqual({
      civilCases: 2970,
      criminalCases: 1765,
      totalCases: 4735,
    });
    expect(extracted.institutedCurrentYear).toEqual({
      civilCases: 1225,
      criminalCases: 567,
      totalCases: 1792,
    });
    expect(extracted.disposedCurrentYear).toEqual({
      civilCases: 1004,
      criminalCases: 636,
      totalCases: 1640,
    });
  });

  it("keeps the source-date contract explicit when the page lacks a defensible source snapshot timestamp", () => {
    expect(extractSupremeCourtSourceSnapshotAt(BASE_SUPREME_COURT_HTML)).toBeNull();
  });
});

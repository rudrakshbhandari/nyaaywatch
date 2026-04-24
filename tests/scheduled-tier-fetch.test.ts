import { afterEach, describe, expect, it, vi } from "vitest";

const listHighCourtProfiles = vi.fn();
const getSupremeCourtProfile = vi.fn();
const runOperatorInvocation = vi.fn();

vi.mock("../src/high-courts.js", () => ({
  listHighCourtProfiles,
}));

vi.mock("../src/supreme-court.js", () => ({
  getSupremeCourtProfile,
}));

vi.mock("../src/dev/operator-ops.js", () => ({
  runOperatorInvocation,
}));

describe("scheduled tier fetch helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs the High Court scheduled fetch only for reviewed courts", async () => {
    listHighCourtProfiles.mockReturnValueOnce([
      {
        courtCode: "HPHC",
        courtSlug: "himachal",
        courtName: "High Court of Himachal Pradesh",
        coveredGeographies: [{ geographyCode: "HP", geographyName: "Himachal Pradesh", geographyType: "state", lowerCourtStateCode: "HP" }],
        sourceReviewStatus: "reviewed",
      },
      {
        courtCode: "UPHC",
        courtSlug: "uttar-pradesh",
        courtName: "Allahabad High Court",
        coveredGeographies: [{ geographyCode: "UP", geographyName: "Uttar Pradesh", geographyType: "state", lowerCourtStateCode: "UP" }],
        sourceReviewStatus: "reviewed",
      },
      {
        courtCode: "KAHC",
        courtSlug: "karnataka",
        courtName: "High Court of Karnataka",
        coveredGeographies: [{ geographyCode: "KA", geographyName: "Karnataka", geographyType: "state", lowerCourtStateCode: "KA" }],
        sourceReviewStatus: "queued",
      },
    ]);
    runOperatorInvocation
      .mockResolvedValueOnce({ run: { id: "run_hphc_123" } })
      .mockResolvedValueOnce({ run: { id: "run_uphc_456" } });

    const { runScheduledHighCourtFetches } = await import("../src/dev/scheduled-high-court-fetch.js");
    const summary = await runScheduledHighCourtFetches();

    expect(runOperatorInvocation.mock.calls).toEqual([
      [
        {
          command: "fetch",
          highCourtCode: "HPHC",
          note: "Scheduled daily High Court internal raw fetch for High Court of Himachal Pradesh [himachal]",
        },
        process.env,
      ],
      [
        {
          command: "fetch",
          highCourtCode: "UPHC",
          note: "Scheduled daily High Court internal raw fetch for Allahabad High Court [uttar-pradesh]",
        },
        process.env,
      ],
    ]);

    expect(summary).toEqual({
      notePrefix: "Scheduled daily High Court internal raw fetch",
      totalCourts: 2,
      successfulCourtSlugs: ["himachal", "uttar-pradesh"],
      failedCourtSlugs: [],
      results: [
        {
          courtCode: "HPHC",
          courtSlug: "himachal",
          courtName: "High Court of Himachal Pradesh",
          coveredGeographies: [{ geographyCode: "HP", geographyName: "Himachal Pradesh", geographyType: "state", lowerCourtStateCode: "HP" }],
          ok: true,
          runId: "run_hphc_123",
          autoPublish: "gate_inputs_missing",
          autoPublishReason: undefined,
        },
        {
          courtCode: "UPHC",
          courtSlug: "uttar-pradesh",
          courtName: "Allahabad High Court",
          coveredGeographies: [{ geographyCode: "UP", geographyName: "Uttar Pradesh", geographyType: "state", lowerCourtStateCode: "UP" }],
          ok: true,
          runId: "run_uphc_456",
          autoPublish: "gate_inputs_missing",
          autoPublishReason: undefined,
        },
      ],
    });
  });

  it("runs the Supreme Court scheduled fetch only when the source is reviewed", async () => {
    getSupremeCourtProfile.mockReturnValueOnce({
      courtCode: "SCI",
      courtSlug: "supreme-court",
      courtName: "Supreme Court of India",
      sourceReviewStatus: "reviewed",
    });
    runOperatorInvocation.mockResolvedValueOnce({ run: { id: "run_sci_123" } });

    const { runScheduledSupremeCourtFetch } = await import("../src/dev/scheduled-supreme-court-fetch.js");
    const summary = await runScheduledSupremeCourtFetch();

    expect(runOperatorInvocation).toHaveBeenCalledWith(
      {
        command: "fetch",
        supremeCourt: true,
        note: "Scheduled daily Supreme Court internal raw fetch for Supreme Court of India",
      },
      process.env,
    );
    expect(summary).toEqual({
      notePrefix: "Scheduled daily Supreme Court internal raw fetch",
      target: {
        courtCode: "SCI",
        courtSlug: "supreme-court",
        courtName: "Supreme Court of India",
      },
      ok: true,
      runId: "run_sci_123",
      autoPublish: "gate_inputs_missing",
      autoPublishReason: undefined,
    });
  });

  it("fails loudly when the Supreme Court source review status is not reviewed", async () => {
    getSupremeCourtProfile.mockReturnValueOnce({
      courtCode: "SCI",
      courtSlug: "supreme-court",
      courtName: "Supreme Court of India",
      sourceReviewStatus: "queued",
    });

    const { runScheduledSupremeCourtFetch } = await import("../src/dev/scheduled-supreme-court-fetch.js");

    await expect(runScheduledSupremeCourtFetch()).rejects.toThrow(
      "Supreme Court scheduled fetch is only allowed when the source review status is reviewed.",
    );
    expect(runOperatorInvocation).not.toHaveBeenCalled();
  });
});

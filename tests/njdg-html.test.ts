import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { extractSourceSnapshotAt } from "../src/extract/njdg-html.js";

const OLD_LABEL = "<p>Last Reviewed and Updated on : 10-04-2026</p>";
const LIVE_LABEL = '<p class="pt-md-4">Last Updated :<strong> 09-10-2026</strong></p>';

describe("NJDG source snapshot date", () => {
  it("reads the older plain-text footer label", () => {
    expect(extractSourceSnapshotAt(OLD_LABEL, "2026-04-12T00:00:00.000Z")).toBe("2026-04-10T00:00:00.000Z");
  });

  it("reads the live footer when the date is wrapped in markup", () => {
    expect(extractSourceSnapshotAt(LIVE_LABEL, "2026-10-11T02:30:00.000Z")).toBe("2026-10-09T00:00:00.000Z");
  });

  it("still reads the older label from a stored Himachal capture", () => {
    const html = readFileSync("fixtures/himachal/raw-html/state.html", "utf8");

    expect(extractSourceSnapshotAt(html, "2026-04-12T00:00:00.000Z")).toBe("2026-04-10T00:00:00.000Z");
  });

  it("returns null when the parsed date is past the stale threshold", () => {
    expect(extractSourceSnapshotAt(LIVE_LABEL, "2026-11-01T00:00:00.000Z")).toBeNull();
  });

  it("fails when the footer date is missing", () => {
    expect(() => extractSourceSnapshotAt("<p>No date here</p>")).toThrow(
      "Could not extract source snapshot date from NJDG HTML.",
    );
  });
});

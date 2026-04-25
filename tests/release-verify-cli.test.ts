import { describe, expect, it } from "vitest";

import { readReleaseVerifyTarget } from "../src/dev/release-verify.js";

describe("release:verify target parsing", () => {
  it("lets an explicit Supreme Court flag override ambient state env defaults", () => {
    expect(
      readReleaseVerifyTarget(["--supreme-court"], {
        STATE_SLUG: "himachal-pradesh",
      }),
    ).toEqual({
      stateSlug: undefined,
      highCourtSlug: undefined,
      supremeCourt: true,
    });
  });

  it("lets an explicit High Court flag override ambient target env defaults", () => {
    expect(
      readReleaseVerifyTarget(["--high-court", "himachal"], {
        STATE_SLUG: "himachal-pradesh",
        SUPREME_COURT: "1",
      }),
    ).toEqual({
      stateSlug: undefined,
      highCourtSlug: "himachal",
      supremeCourt: false,
    });
  });

  it("still rejects conflicting env defaults when no explicit target flag is provided", () => {
    expect(() =>
      readReleaseVerifyTarget([], {
        STATE_SLUG: "himachal-pradesh",
        HIGH_COURT_SLUG: "himachal",
      }),
    ).toThrow("Select only one release target");
  });

  it("rejects conflicting explicit target flags", () => {
    expect(() => readReleaseVerifyTarget(["--state-slug", "himachal-pradesh", "--supreme-court"], {})).toThrow(
      "Select only one release target",
    );
  });
});

import { describe, expect, it } from "vitest";

import { hasFlag, readBooleanFlag, readFlag, stripFlag } from "../src/dev/cli-flag-utils.js";

describe("cli flag utils", () => {
  it("reads value flags in separate or inline form", () => {
    expect(readFlag(["--base-url", "https://nyaaywatch.in"], "--base-url")).toBe("https://nyaaywatch.in");
    expect(readFlag(["--base-url=https://nyaaywatch.in"], "--base-url")).toBe("https://nyaaywatch.in");
  });

  it("detects boolean flags in separate or inline form", () => {
    expect(hasFlag(["--supreme-court"], "--supreme-court")).toBe(true);
    expect(hasFlag(["--supreme-court=true"], "--supreme-court")).toBe(true);
    expect(hasFlag(["publications"], "--supreme-court")).toBe(false);
  });

  it("reads boolean flags without stealing the next positional argument", () => {
    expect(readBooleanFlag(["--supreme-court", "publications"], "--supreme-court")).toBe("true");
    expect(readBooleanFlag(["--supreme-court=false", "publications"], "--supreme-court")).toBe("false");
  });

  it("strips boolean flags without consuming the operator command", () => {
    expect(stripFlag(["--supreme-court", "publications"], "--supreme-court", false)).toEqual(["publications"]);
  });

  it("strips inline value flags without touching the operator command", () => {
    expect(stripFlag(["--base-url=https://nyaaywatch.in", "publications"], "--base-url")).toEqual(["publications"]);
  });
});

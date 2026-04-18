import { describe, expect, it } from "vitest";

import { readFlag } from "../src/dev/cli-flags.js";

describe("cli flag parsing", () => {
  it("supports separated flag values", () => {
    expect(readFlag(["--base-url", "https://nyaaywatch.in"], "--base-url")).toBe("https://nyaaywatch.in");
  });

  it("supports inline flag values", () => {
    expect(readFlag(["--base-url=https://nyaaywatch.in"], "--base-url")).toBe("https://nyaaywatch.in");
  });
});

import { describe, expect, it } from "vitest";

import { parseOperatorInvocation } from "../src/dev/operator-ops.js";

describe("operator invocation parsing", () => {
  it("parses the Supreme Court publications selector", () => {
    expect(parseOperatorInvocation(["--supreme-court", "publications"])).toEqual({
      command: "publications",
      supremeCourt: true,
    });
  });

  it("supports inline value flags alongside the Supreme Court selector", () => {
    expect(() => parseOperatorInvocation(["--supreme-court", "--state=HP", "fetch", "ignored"])).toThrow(
      "Select either --state, --high-court, or --supreme-court, not multiple targets.",
    );
  });

  it("keeps the full fetch note for Supreme Court commands", () => {
    expect(parseOperatorInvocation(["--supreme-court", "fetch", "Internal", "Supreme", "Court", "fetch"])).toEqual({
      command: "fetch",
      supremeCourt: true,
      note: "Internal Supreme Court fetch",
    });
  });
});

import { describe, expect, it } from "vitest";

import { parseOperatorInvocation } from "../src/dev/operator-ops.js";

describe("parliamentary operator selector", () => {
  it("parses the internal parliamentary lifecycle commands", () => {
    expect(parseOperatorInvocation(["--parliament", "fetch", "bounded fixture"])).toMatchObject({
      parliamentary: true,
      command: "fetch",
      note: "bounded fixture",
    });
    expect(parseOperatorInvocation(["--parliament", "publish", "run_123", "reviewed"])).toMatchObject({
      parliamentary: true,
      command: "publish",
      targetId: "run_123",
      note: "reviewed",
    });
  });

  it("rejects mixing parliamentary and judiciary targets", () => {
    expect(() => parseOperatorInvocation(["--parliament", "--state", "HP", "fetch"])).toThrow(
      "Select one operator target",
    );
  });
});

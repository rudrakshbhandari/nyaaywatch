import { describe, expect, it } from "vitest";

import { safeJsonForHtmlScript } from "../src/lib/html.js";

describe("HTML serialization helpers", () => {
  it("escapes JSON so source-derived strings cannot break out of script tags", () => {
    const payload = {
      districtName: `Kangra </script><script>alert("xss")</script>`,
      sourceAttribution: "NJDG & public source\u2028with separator",
    };

    const serialized = safeJsonForHtmlScript(payload);

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script");
    expect(serialized).not.toContain("&");
    expect(JSON.parse(serialized)).toEqual(payload);
  });
});

import { describe, expect, it } from "vitest";

import { renderStatTile } from "../src/api/design/ui.js";

describe("renderStatTile — optional sparkline + delta", () => {
  it("renders no sparkline or delta when series is absent", () => {
    const html = renderStatTile({
      label: "Pending",
      value: "12,345",
      note: "Backlog.",
    });
    expect(html).toContain("stat-tile__value");
    expect(html).not.toContain("stat-tile--with-spark");
    expect(html).not.toContain("<svg class=\"sparkline");
    expect(html).not.toContain("stat-tile__delta");
  });

  it("renders no sparkline when only one data point is provided", () => {
    const html = renderStatTile({
      label: "Pending",
      value: "12,345",
      series: [12345],
    });
    expect(html).not.toContain("<svg class=\"sparkline");
    expect(html).not.toContain("stat-tile--with-spark");
  });

  it("renders a sparkline SVG and a bad delta chip when a rising backlog series is provided", () => {
    const html = renderStatTile({
      label: "Pending total",
      value: "75,500",
      series: [70000, 72000, 73500, 75500],
      seriesLabel: "Pending total over recent months",
      deltaDirectionHint: "up-is-bad",
    });
    expect(html).toContain("stat-tile--with-spark");
    expect(html).toContain("<svg class=\"sparkline");
    expect(html).toContain("aria-label=\"Pending total over recent months\"");
    expect(html).toContain("stat-tile__delta--bad");
    // 70000 -> 75500 is +7.9% rounded to one decimal
    expect(html).toMatch(/\+7\.9%/);
  });

  it("colors a rising clearance-rate series as good when hint is up-is-good", () => {
    const html = renderStatTile({
      label: "Cleared / 100 filed",
      value: "88.5",
      series: [80, 82, 85, 88.5],
      deltaDirectionHint: "up-is-good",
    });
    expect(html).toContain("stat-tile__delta--good");
    expect(html).not.toContain("stat-tile__delta--bad");
  });

  it("can render a labeled semantic delta", () => {
    const html = renderStatTile({
      label: "Pending total",
      value: "92,409",
      series: [94158, 94311, 92409],
      deltaDirectionHint: "up-is-bad",
      deltaLabel: "Pending trend",
    });
    expect(html).toContain("stat-tile__delta--good");
    expect(html).toContain("Pending trend −1.9%");
    expect(html).not.toContain("stat-tile__delta--bad");
  });

  it("keeps a current condition signal visible when a sparkline is present", () => {
    const html = renderStatTile({
      label: "Backlog change this month",
      value: "+1,591",
      series: [1200, 1591],
      deltaDirectionHint: "up-is-bad",
      trendSignal: { tone: "worsening", label: "Backlog growing" },
    });
    expect(html).toContain("stat-tile--with-spark");
    expect(html).toContain("stat-tile__signal--worsening");
    expect(html).toContain("Backlog growing");
  });

  it("suppresses both the sparkline and the delta chip for a perfectly flat series", () => {
    // Rationale: a horizontal sparkline next to a "flat" chip is visual noise,
    // not signal — the big number already carries the information. We only
    // render these affordances when the series actually moves.
    const html = renderStatTile({
      label: "Pending",
      value: "100",
      series: [100, 100, 100],
    });
    expect(html).not.toContain("stat-tile--with-spark");
    expect(html).not.toContain("<svg class=\"sparkline");
    expect(html).not.toContain("stat-tile__delta");
  });
});

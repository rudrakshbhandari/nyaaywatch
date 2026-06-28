import { describe, expect, it } from "vitest";

import {
  buildPublicAlphaMonitorAlertPayload,
  buildPublicAlphaMonitorUsage,
  DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_EXPRESSION,
  DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_STATE,
  DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_TIMEZONE,
  PUBLIC_ALPHA_OPS_ALERT_PREFIX,
  PUBLIC_ALPHA_OPS_RESULT_PREFIX,
  readPublicAlphaMonitorLagThreshold,
  readPublicAlphaMonitorTargetSet,
  resolvePublicAlphaMonitorBaseUrl,
} from "../src/dev/public-alpha-monitor.js";

describe("public alpha monitor helpers", () => {
  it("prefers an explicit base-url flag before environment defaults", () => {
    expect(
      resolvePublicAlphaMonitorBaseUrl(["--base-url", "https://check.example"], {
        PUBLIC_BASE_URL: "https://public.example",
        BASE_URL: "https://base.example",
      } as NodeJS.ProcessEnv),
    ).toBe("https://check.example");

    expect(
      resolvePublicAlphaMonitorBaseUrl([], {
        PUBLIC_BASE_URL: "https://public.example",
        BASE_URL: "https://base.example",
      } as NodeJS.ProcessEnv),
    ).toBe("https://public.example");
  });

  it("parses a non-negative daily lag threshold and rejects invalid values", () => {
    expect(readPublicAlphaMonitorLagThreshold(["--daily-fetch-lag-days", "3"])).toBe(3);
    expect(() => readPublicAlphaMonitorLagThreshold(["--daily-fetch-lag-days", "-1"])).toThrow(
      "--daily-fetch-lag-days must be a non-negative integer.",
    );
  });

  it("parses the target set from flags or environment", () => {
    expect(readPublicAlphaMonitorTargetSet(["--target-set", "smoke"])).toBe("smoke");
    expect(readPublicAlphaMonitorTargetSet(["--target-set=smoke"])).toBe("smoke");
    expect(readPublicAlphaMonitorTargetSet([], { PUBLIC_ALPHA_OPS_TARGET_SET: "all" } as NodeJS.ProcessEnv)).toBe("all");
    expect(() => readPublicAlphaMonitorTargetSet(["--target-set", "wide"])).toThrow(
      "--target-set must be one of: all, smoke.",
    );
  });

  it("builds an alert payload with summary context when the sweep fails", () => {
    const payload = buildPublicAlphaMonitorAlertPayload(
      "https://nyaaywatch.in/",
      new Date("2026-04-20T12:00:00.000Z"),
      new Error("Public alpha operations check failed: stale public snapshots: HP"),
      {
        baseUrl: "https://nyaaywatch.in",
        checkedAt: "2026-04-20T12:00:00.000Z",
        staleSnapshotThresholdDays: 14,
        dailyFetchLagThresholdDays: 2,
        totalTargets: 3,
        healthyTargets: [],
        staleTargets: ["HP", "high_court:HPHC"],
        dailyFetchLagTargets: ["PB"],
        failingTargets: ["HR"],
        targets: [],
        totalStates: 1,
        healthyStates: [],
        staleStates: ["HP"],
        dailyFetchLagStates: ["PB"],
        failingStates: ["HR"],
        states: [],
      },
    );

    expect(payload).toEqual({
      baseUrl: "https://nyaaywatch.in",
      checkedAt: "2026-04-20T12:00:00.000Z",
      error: "Public alpha operations check failed: stale public snapshots: HP",
      staleTargets: ["HP", "high_court:HPHC"],
      dailyFetchLagTargets: ["PB"],
      failingTargets: ["HR"],
      staleStates: ["HP"],
      dailyFetchLagStates: ["PB"],
      failingStates: ["HR"],
    });
  });

  it("keeps the exported schedule defaults and log prefixes stable", () => {
    expect(PUBLIC_ALPHA_OPS_RESULT_PREFIX).toBe("NYAAYWATCH_PUBLIC_ALPHA_OPS_RESULT=");
    expect(PUBLIC_ALPHA_OPS_ALERT_PREFIX).toBe("NYAAYWATCH_PUBLIC_ALPHA_OPS_ALERT=");
    expect(DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_EXPRESSION).toBe("cron(0/30 * * * ? *)");
    expect(DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_TIMEZONE).toBe("Asia/Kolkata");
    expect(DEFAULT_PUBLIC_ALPHA_MONITOR_SCHEDULE_STATE).toBe("ENABLED");
    expect(buildPublicAlphaMonitorUsage()).toContain("ecs-public-alpha-ops-entrypoint.js");
  });
});

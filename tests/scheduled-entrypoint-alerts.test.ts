import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("scheduled entrypoint failure alerts", () => {
  it("publishes and rethrows lower-court failures", async () => {
    const error = new Error("lower-court failed");
    const publish = vi.fn().mockRejectedValue(new Error("notification failed"));
    vi.doMock("../src/ops/alarm-notifier.js", () => ({
      createAlarmNotifier: () => ({ publish }),
    }));
    vi.doMock("../src/dev/scheduled-fetch.js", () => ({
      runScheduledFetches: vi.fn().mockRejectedValue(error),
      assertScheduledFetchSucceeded: vi.fn(),
    }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { main } = await import("../src/dev/ecs-scheduled-fetch-entrypoint.js");

    await expect(main()).rejects.toBe(error);
    expect(publish).toHaveBeenCalledWith("NyaayWatch scheduled fetch failed", "lower-court failed");
  });

  it("publishes and rethrows Supreme Court failures", async () => {
    const error = new Error("Supreme Court failed");
    const publish = vi.fn().mockRejectedValue(new Error("notification failed"));
    vi.doMock("../src/ops/alarm-notifier.js", () => ({
      createAlarmNotifier: () => ({ publish }),
    }));
    vi.doMock("../src/dev/scheduled-supreme-court-fetch.js", () => ({
      runScheduledSupremeCourtFetch: vi.fn().mockRejectedValue(error),
      assertScheduledSupremeCourtFetchSucceeded: vi.fn(),
    }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { main } = await import("../src/dev/ecs-scheduled-supreme-court-fetch-entrypoint.js");

    await expect(main()).rejects.toBe(error);
    expect(publish).toHaveBeenCalledWith("NyaayWatch Supreme Court fetch failed", "Supreme Court failed");
  });

  it("publishes and rethrows High Court failures", async () => {
    const error = new Error("High Court failed");
    const publish = vi.fn().mockRejectedValue(new Error("notification failed"));
    vi.doMock("../src/ops/alarm-notifier.js", () => ({
      createAlarmNotifier: () => ({ publish }),
    }));
    vi.doMock("../src/dev/scheduled-high-court-fetch.js", () => ({
      runScheduledHighCourtFetches: vi.fn().mockRejectedValue(error),
      assertScheduledHighCourtFetchSucceeded: vi.fn(),
    }));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { main } = await import("../src/dev/ecs-scheduled-high-court-fetch-entrypoint.js");

    await expect(main()).rejects.toBe(error);
    expect(publish).toHaveBeenCalledWith("NyaayWatch High Court fetch failed", "High Court failed");
  });
});

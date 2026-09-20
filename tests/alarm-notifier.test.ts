import { afterEach, describe, expect, it, vi } from "vitest";

import { createAlarmNotifier } from "../src/ops/alarm-notifier.js";

describe("alarm notifier", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the structured payload to the configured webhook", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await createAlarmNotifier({ ALARM_WEBHOOK_URL: "https://alerts.example.test/hook" }).publish("subject", "message");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://alerts.example.test/hook",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ subject: "subject", message: "message", source: "nyaaywatch" }),
      }),
    );
  });

  it("fails when the webhook rejects the alert", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(
      createAlarmNotifier({ ALARM_WEBHOOK_URL: "https://alerts.example.test/hook" }).publish("subject", "message"),
    ).rejects.toThrow("Alarm webhook returned HTTP 500.");
  });

  it("uses the safe no-op fallback when no notifier is configured", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await createAlarmNotifier({}).publish("subject", "message");

    expect(log).toHaveBeenCalledWith(expect.stringContaining("ALARM_TOPIC_ARN not set; skipping publish"));
  });
});

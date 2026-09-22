import { afterEach, describe, expect, it, vi } from "vitest";

import { EmailClient } from "@azure/communication-email";
import { createAlarmNotifier } from "../src/ops/alarm-notifier.js";

vi.mock("@azure/communication-email", () => ({
  EmailClient: vi.fn(),
}));

describe("alarm notifier", () => {
  afterEach(() => {
    vi.clearAllMocks();
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

  it("sends Azure email alerts and waits for successful delivery", async () => {
    const pollUntilDone = vi.fn().mockResolvedValue({ status: "Succeeded" });
    const beginSend = vi.fn().mockResolvedValue({ pollUntilDone });
    vi.mocked(EmailClient).mockImplementation(function () {
      return { beginSend } as unknown as EmailClient;
    });

    await createAlarmNotifier({
      AZURE_COMMUNICATION_CONNECTION_STRING: "endpoint=https://example.test/;accesskey=test",
      AZURE_EMAIL_SENDER: "DoNotReply@example.test",
      ALARM_EMAIL_TO: "operator@example.test",
    }).publish("subject", "message");

    expect(EmailClient).toHaveBeenCalledWith("endpoint=https://example.test/;accesskey=test");
    expect(beginSend).toHaveBeenCalledWith({
      senderAddress: "DoNotReply@example.test",
      recipients: { to: [{ address: "operator@example.test" }] },
      content: { subject: "subject", plainText: "message" },
    });
    expect(pollUntilDone).toHaveBeenCalledOnce();
  });

  it("fails when Azure email delivery finishes unsuccessfully", async () => {
    const pollUntilDone = vi.fn().mockResolvedValue({ status: "Failed" });
    const beginSend = vi.fn().mockResolvedValue({ pollUntilDone });
    vi.mocked(EmailClient).mockImplementation(function () {
      return { beginSend } as unknown as EmailClient;
    });

    await expect(
      createAlarmNotifier({
        AZURE_COMMUNICATION_CONNECTION_STRING: "endpoint=https://example.test/;accesskey=test",
        AZURE_EMAIL_SENDER: "DoNotReply@example.test",
        ALARM_EMAIL_TO: "operator@example.test",
      }).publish("subject", "message"),
    ).rejects.toThrow("Azure alarm email finished with status Failed.");
  });

  it("uses the safe no-op fallback when no notifier is configured", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await createAlarmNotifier({}).publish("subject", "message");

    expect(log).toHaveBeenCalledWith(expect.stringContaining("ALARM_TOPIC_ARN not set; skipping publish"));
  });
});

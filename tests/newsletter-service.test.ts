import { describe, expect, it, vi } from "vitest";

const beginSend = vi.fn();

vi.mock("@azure/communication-email", () => ({
  EmailClient: class {
    beginSend = beginSend;
  },
}));

import { NewsletterService } from "../src/services/newsletter-service.js";

const pool = { query: vi.fn() } as never;

describe("NewsletterService Azure email provider", () => {
  it("skips confirmation delivery when Azure email is incomplete", async () => {
    const service = new NewsletterService(pool, {
      AWS_REGION: "ap-south-1",
      SES_SOURCE_EMAIL: undefined,
      EMAIL_PROVIDER: "azure",
      AZURE_COMMUNICATION_CONNECTION_STRING: undefined,
      AZURE_EMAIL_SENDER: undefined,
    });

    await expect(service.sendConfirmationEmail("reader@example.com", "token", "https://nyaaywatch.in")).resolves.toBeUndefined();
    expect(beginSend).not.toHaveBeenCalled();
  });

  it("sends a confirmation through Azure and waits for completion", async () => {
    const pollUntilDone = vi.fn().mockResolvedValue({ status: "Succeeded" });
    beginSend.mockResolvedValueOnce({ pollUntilDone });
    const service = new NewsletterService(pool, {
      AWS_REGION: "ap-south-1",
      SES_SOURCE_EMAIL: undefined,
      EMAIL_PROVIDER: "azure",
      AZURE_COMMUNICATION_CONNECTION_STRING: "endpoint=https://example.communication.azure.com/;accesskey=test",
      AZURE_EMAIL_SENDER: "news@nyaaywatch.in",
    });

    await service.sendConfirmationEmail("reader@example.com", "token", "https://nyaaywatch.in");

    expect(beginSend).toHaveBeenCalledWith(expect.objectContaining({
      senderAddress: "news@nyaaywatch.in",
      recipients: { to: [{ address: "reader@example.com" }] },
    }));
    expect(pollUntilDone).toHaveBeenCalledOnce();
  });
});

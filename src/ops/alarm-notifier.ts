import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { EmailClient } from "@azure/communication-email";

export interface AlarmNotifier {
  publish(subject: string, message: string): Promise<void>;
}

class NoopAlarmNotifier implements AlarmNotifier {
  async publish(subject: string, message: string): Promise<void> {
    console.log(`[alarm-notifier] ALARM_TOPIC_ARN not set; skipping publish. subject=${subject} message=${message}`);
  }
}

class SnsAlarmNotifier implements AlarmNotifier {
  constructor(private readonly client: SNSClient, private readonly topicArn: string) {}

  async publish(subject: string, message: string): Promise<void> {
    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: subject.slice(0, 100),
        Message: message,
      }),
    );
  }
}

class WebhookAlarmNotifier implements AlarmNotifier {
  constructor(private readonly webhookUrl: string) {}

  async publish(subject: string, message: string): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, message, source: "nyaaywatch" }),
    });
    if (!response.ok) {
      throw new Error(`Alarm webhook returned HTTP ${response.status}.`);
    }
  }
}

class AzureEmailAlarmNotifier implements AlarmNotifier {
  constructor(
    private readonly client: EmailClient,
    private readonly sender: string,
    private readonly recipient: string,
  ) {}

  async publish(subject: string, message: string): Promise<void> {
    const poller = await this.client.beginSend({
      senderAddress: this.sender,
      recipients: { to: [{ address: this.recipient }] },
      content: { subject, plainText: message },
    });
    const result = await poller.pollUntilDone();
    if (result.status !== "Succeeded") {
      throw new Error(`Azure alarm email finished with status ${result.status}.`);
    }
  }
}

export function createAlarmNotifier(rawEnv: NodeJS.ProcessEnv = process.env): AlarmNotifier {
  const webhookUrl = rawEnv.ALARM_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    return new WebhookAlarmNotifier(webhookUrl);
  }
  const emailConnectionString = rawEnv.AZURE_COMMUNICATION_CONNECTION_STRING?.trim();
  const emailSender = rawEnv.AZURE_EMAIL_SENDER?.trim();
  const emailRecipient = rawEnv.ALARM_EMAIL_TO?.trim();
  if (emailConnectionString && emailSender && emailRecipient) {
    return new AzureEmailAlarmNotifier(new EmailClient(emailConnectionString), emailSender, emailRecipient);
  }
  const topicArn = rawEnv.ALARM_TOPIC_ARN?.trim();
  if (!topicArn) {
    return new NoopAlarmNotifier();
  }
  const region = rawEnv.AWS_REGION?.trim() || "ap-south-1";
  const client = new SNSClient({ region });
  return new SnsAlarmNotifier(client, topicArn);
}

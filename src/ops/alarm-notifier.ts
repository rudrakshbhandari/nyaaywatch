import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

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

export function createAlarmNotifier(rawEnv: NodeJS.ProcessEnv = process.env): AlarmNotifier {
  const topicArn = rawEnv.ALARM_TOPIC_ARN?.trim();
  if (!topicArn) {
    return new NoopAlarmNotifier();
  }
  const region = rawEnv.AWS_REGION?.trim() || "ap-south-1";
  const client = new SNSClient({ region });
  return new SnsAlarmNotifier(client, topicArn);
}

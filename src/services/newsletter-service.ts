import { randomBytes, randomUUID } from "node:crypto";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Pool } from "pg";

import type { AppConfig } from "../config/env.js";
import { logError, logInfo } from "../lib/logger.js";
import type { PublishedSnapshot } from "../domain/snapshot-schema.js";

export interface Subscriber {
  id: string;
  email: string;
  scope: string;
  token: string;
  confirmed: boolean;
}

export class NewsletterService {
  private readonly ses: SESClient | null;
  private readonly sourceEmail: string | undefined;

  constructor(
    private readonly pool: Pool,
    config: Pick<AppConfig, "AWS_REGION" | "SES_SOURCE_EMAIL">,
  ) {
    this.sourceEmail = config.SES_SOURCE_EMAIL;
    this.ses = this.sourceEmail
      ? new SESClient({ region: config.AWS_REGION })
      : null;
  }

  async subscribe(email: string, scope: string): Promise<{ token: string; alreadyConfirmed: boolean }> {
    const id = randomUUID();
    const token = randomBytes(24).toString("hex");
    const result = await this.pool.query<{ token: string; confirmed: boolean }>(
      `INSERT INTO newsletter_subscriptions (id, email, scope, token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, scope) DO UPDATE
         SET unsubscribed_at = NULL
       RETURNING token, confirmed`,
      [id, email.trim().toLowerCase(), scope, token],
    );
    const row = result.rows[0]!;
    return { token: row.token, alreadyConfirmed: row.confirmed };
  }

  async confirm(token: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE newsletter_subscriptions
       SET confirmed = TRUE, confirmed_at = NOW()
       WHERE token = $1 AND confirmed = FALSE AND unsubscribed_at IS NULL
       RETURNING id`,
      [token],
    );
    return result.rowCount! > 0;
  }

  async unsubscribe(token: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE newsletter_subscriptions
       SET unsubscribed_at = NOW()
       WHERE token = $1 AND unsubscribed_at IS NULL
       RETURNING id`,
      [token],
    );
    return result.rowCount! > 0;
  }

  async getConfirmedSubscribers(scope: string): Promise<Subscriber[]> {
    const result = await this.pool.query<Subscriber>(
      `SELECT id, email, scope, token, confirmed
       FROM newsletter_subscriptions
       WHERE scope = $1 AND confirmed = TRUE AND unsubscribed_at IS NULL`,
      [scope],
    );
    return result.rows;
  }

  async sendConfirmationEmail(
    email: string,
    token: string,
    baseUrl: string,
  ): Promise<void> {
    if (!this.ses || !this.sourceEmail) return;
    const confirmUrl = `${baseUrl}/subscribe/confirm/${token}`;
    const unsubUrl = `${baseUrl}/unsubscribe/${token}`;
    await this.sendEmail({
      to: email,
      subject: "Confirm your NyaayWatch subscription",
      text: [
        "You asked to receive NyaayWatch snapshot digests.",
        "",
        "Confirm your subscription:",
        confirmUrl,
        "",
        "If you did not request this, ignore this email or unsubscribe:",
        unsubUrl,
        "",
        "— NyaayWatch",
      ].join("\n"),
    });
  }

  async sendDigest(
    snapshot: PublishedSnapshot,
    baseUrl: string,
    scope: string,
    stateSlug: string,
  ): Promise<number> {
    if (!this.ses || !this.sourceEmail) {
      logInfo(`[newsletter] SES not configured — skipping digest for scope ${scope}`);
      return 0;
    }

    const subscribers = await this.getConfirmedSubscribers(scope);
    if (subscribers.length === 0) return 0;

    const { stats, snapshot: meta, districts } = snapshot;
    const topDistrict = districts[0];
    const stateUrl = `${baseUrl}/states/${stateSlug}`;
    const subject = `NyaayWatch snapshot: ${meta.stateName} · ${meta.sourceSnapshotAt.slice(0, 10)}`;

    const text = [
      `NyaayWatch — ${meta.stateName} snapshot`,
      `Published: ${meta.sourceSnapshotAt.slice(0, 10)}`,
      `Methodology: ${meta.methodologyVersion}`,
      "",
      "HEADLINE NUMBERS",
      `  Cases waiting:    ${stats.pendingCases.toLocaleString("en-IN")}`,
      `  Cleared per 100:  ${stats.disposalRate.toFixed(1)}`,
      `  Typical wait:     ~${Math.round(stats.medianCaseAgeDays / 30)} months`,
      `  Flagged districts: ${stats.flaggedDistricts.toLocaleString("en-IN")}`,
      "",
      topDistrict
        ? [
            "TOP FLAGGED DISTRICT",
            `  ${topDistrict.districtName} — rank #${topDistrict.rank}`,
            `  ${topDistrict.backlogCases.toLocaleString("en-IN")} cases, ${topDistrict.disposalRate.toFixed(1)} cleared/100 filed`,
            `  ${topDistrict.flagReason}`,
          ].join("\n")
        : "",
      "",
      `Full evidence: ${stateUrl}`,
      `Source: ${meta.sourceAttribution}`,
      "",
    ].filter(Boolean).join("\n");

    let sent = 0;
    for (const sub of subscribers) {
      try {
        const unsubUrl = `${baseUrl}/unsubscribe/${sub.token}`;
        await this.sendEmail({
          to: sub.email,
          subject,
          text: text + `Unsubscribe: ${unsubUrl}\n`,
        });
        sent++;
      } catch (err) {
        logError(`[newsletter] failed to send digest to ${sub.email}`, { error: String(err) });
      }
    }

    logInfo(`[newsletter] sent digest for ${scope} to ${sent}/${subscribers.length} subscribers`);
    return sent;
  }

  private async sendEmail(opts: { to: string; subject: string; text: string }): Promise<void> {
    if (!this.ses || !this.sourceEmail) return;
    await this.ses.send(
      new SendEmailCommand({
        Source: this.sourceEmail,
        Destination: { ToAddresses: [opts.to] },
        Message: {
          Subject: { Data: opts.subject, Charset: "UTF-8" },
          Body: { Text: { Data: opts.text, Charset: "UTF-8" } },
        },
      }),
    );
  }
}

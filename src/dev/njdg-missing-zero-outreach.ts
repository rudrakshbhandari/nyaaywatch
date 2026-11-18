import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { EmailClient } from "@azure/communication-email";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { listPublicStateProfiles, type SupportedStateCode } from "../geographies.js";
import { readFlag } from "./cli-flags.js";

interface PublicStatsPayload {
  snapshot: {
    stateCode: string;
    stateName: string;
    sourceSnapshotAt: string | null;
    referenceDateAt: string;
    referenceDateKind: "source_snapshot_at" | "captured_at";
    sourceAttribution: string;
  };
  stats: {
    pendingCases: number;
    filedLastMonthCases: number;
    clearedLastMonthCases: number;
  };
}

interface PublicDistrictsPayload {
  districts: Array<{
    districtName: string;
    backlogCases: number;
    filedLastMonthCases: number;
    clearedLastMonthCases: number;
  }>;
}

export interface MissingMonthlyMovementIssue {
  scope: "state" | "district";
  stateCode: string;
  stateName: string;
  sourceSnapshotAt: string | null;
  referenceDateAt: string;
  referenceDateKind: "source_snapshot_at" | "captured_at";
  sourceAttribution: string;
  districtName?: string;
  pendingCases: number;
  filedLastMonthCases: number;
  clearedLastMonthCases: number;
  publicUrl: string;
}

interface NjdgOutreachMessage {
  subject: string;
  text: string;
  to: string[];
}

interface SendOutreachResult {
  archiveContainer: string;
  archiveKey: string;
  bcc: string[];
  messageId: string | null;
  replyTo: string[];
}

const OFFICIAL_CPC_EMAIL_BY_STATE_CODE: Record<SupportedStateCode, string> = {
  AN: "cpc-cal@aij.gov.in",
  AP: "cpc-aphc@aij.gov.in",
  AR: "cpc-asm@aij.gov.in",
  AS: "cpc-asm@aij.gov.in",
  BR: "cpc-bih@aij.gov.in",
  CG: "cpc-cgh@aij.gov.in",
  CHD: "cpc-punj@aij.gov.in",
  DL: "cpc-del@aij.gov.in",
  DNHDD: "cpc-bom@aij.gov.in",
  GA: "cpc-bom@aij.gov.in",
  GJ: "cpc-guj@aij.gov.in",
  HP: "cpc-hp@aij.gov.in",
  HR: "cpc-punj@aij.gov.in",
  JH: "cpc-jhr@aij.gov.in",
  JK: "cpc-jk@aij.gov.in",
  KA: "cpc-kar@aij.gov.in",
  KL: "cpc-ker@aij.gov.in",
  LA: "cpc-jk@aij.gov.in",
  LD: "cpc-ker@aij.gov.in",
  MH: "cpc-bom@aij.gov.in",
  ML: "cpc-mgl@aij.gov.in",
  MN: "cpc-mnp@aij.gov.in",
  MP: "cpc-mp@aij.gov.in",
  MZ: "cpc-asm@aij.gov.in",
  NL: "cpc-asm@aij.gov.in",
  OD: "cpc-ori@aij.gov.in",
  PB: "cpc-punj@aij.gov.in",
  PY: "cpc-mad@aij.gov.in",
  RJ: "cpc-raj@aij.gov.in",
  SK: "cpc-sik@aij.gov.in",
  TN: "cpc-mad@aij.gov.in",
  TR: "cpc-tri@aij.gov.in",
  TS: "cpc-tel@aij.gov.in",
  UK: "cpc-uk@aij.gov.in",
  UP: "cpc-alb@aij.gov.in",
  WB: "cpc-cal@aij.gov.in",
};

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = (readFlag(args, "--base-url") ?? process.env.PUBLIC_BASE_URL ?? "https://nyaaywatch.in").replace(/\/+$/, "");
  const send = args.includes("--send");
  const issues = await findMissingMonthlyMovementIssues(baseUrl);
  const recipients = deriveOutreachRecipients(issues);
  const message = composeNjdgOutreachMessage(baseUrl, issues, recipients);
  const checkedAt = new Date().toISOString();
  const summary = {
    baseUrl,
    checkedAt,
    issueCount: issues.length,
    recipientCount: recipients.length,
    recipients,
    bccRecipientCount: 0,
    bccRecipients: [] as string[],
    replyToRecipients: [] as string[],
    sendRequested: send,
    sent: false,
    emailMessageId: null as string | null,
    archiveContainer: null as string | null,
    archiveKey: null as string | null,
    issues,
  };

  if (issues.length === 0) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (send) {
    const result = await sendOutreachEmail(message, { baseUrl, checkedAt, issues });
    summary.sent = true;
    summary.bccRecipientCount = result.bcc.length;
    summary.bccRecipients = result.bcc;
    summary.replyToRecipients = result.replyTo;
    summary.emailMessageId = result.messageId;
    summary.archiveContainer = result.archiveContainer;
    summary.archiveKey = result.archiveKey;
  } else {
    console.log(message.text);
  }

  console.log(JSON.stringify(summary, null, 2));
}

async function findMissingMonthlyMovementIssues(baseUrl: string): Promise<MissingMonthlyMovementIssue[]> {
  const issues: MissingMonthlyMovementIssue[] = [];

  for (const profile of listPublicStateProfiles()) {
    const routes = buildStateApiRoutes(profile.stateSlug);
    const [statsPayload, districtsPayload] = await Promise.all([
      fetchJson<PublicStatsPayload>(`${baseUrl}${routes.stats}`),
      fetchJson<PublicDistrictsPayload>(`${baseUrl}${routes.districts}`),
    ]);

    if (sourceReportsMissingMonthlyMovement(statsPayload.stats.pendingCases, statsPayload.stats.filedLastMonthCases, statsPayload.stats.clearedLastMonthCases)) {
      issues.push({
        scope: "state",
        stateCode: statsPayload.snapshot.stateCode,
        stateName: statsPayload.snapshot.stateName,
        sourceSnapshotAt: statsPayload.snapshot.sourceSnapshotAt,
        referenceDateAt: statsPayload.snapshot.referenceDateAt,
        referenceDateKind: statsPayload.snapshot.referenceDateKind,
        sourceAttribution: statsPayload.snapshot.sourceAttribution,
        pendingCases: statsPayload.stats.pendingCases,
        filedLastMonthCases: statsPayload.stats.filedLastMonthCases,
        clearedLastMonthCases: statsPayload.stats.clearedLastMonthCases,
        publicUrl: `${baseUrl}${routes.home}`,
      });
    }

    for (const district of districtsPayload.districts) {
      if (!sourceReportsMissingMonthlyMovement(district.backlogCases, district.filedLastMonthCases, district.clearedLastMonthCases)) {
        continue;
      }

      issues.push({
        scope: "district",
        stateCode: statsPayload.snapshot.stateCode,
        stateName: statsPayload.snapshot.stateName,
        sourceSnapshotAt: statsPayload.snapshot.sourceSnapshotAt,
        referenceDateAt: statsPayload.snapshot.referenceDateAt,
        referenceDateKind: statsPayload.snapshot.referenceDateKind,
        sourceAttribution: statsPayload.snapshot.sourceAttribution,
        districtName: district.districtName,
        pendingCases: district.backlogCases,
        filedLastMonthCases: district.filedLastMonthCases,
        clearedLastMonthCases: district.clearedLastMonthCases,
        publicUrl: `${baseUrl}${routes.home}`,
      });
    }
  }

  return issues;
}

export function composeNjdgOutreachMessage(baseUrl: string, issues: MissingMonthlyMovementIssue[], to = deriveOutreachRecipients(issues)) {
  const subject = `NyaayWatch source-data check: ${issues.length} NJDG monthly movement zero ${issues.length === 1 ? "case" : "cases"}`;
  const grouped = issues.slice(0, 25).map((issue) => {
    const label = issue.scope === "district" ? `${issue.stateName} / ${issue.districtName}` : issue.stateName;
    return [
      `- ${label}`,
      `  Reference date: ${issue.referenceDateKind === "captured_at" ? "captured " : "source snapshot "}${formatDate(issue.referenceDateAt)}`,
      `  Pending cases: ${issue.pendingCases.toLocaleString("en-IN")}`,
      `  Filed last month shown by NJDG: ${issue.filedLastMonthCases.toLocaleString("en-IN")}`,
      `  Cleared last month shown by NJDG: ${issue.clearedLastMonthCases.toLocaleString("en-IN")}`,
      `  Public reference: ${issue.publicUrl}`,
    ].join("\n");
  });
  const overflow = issues.length > grouped.length ? `\n\nAdditional affected rows: ${issues.length - grouped.length}` : "";
  const text = [
    "Hello NJDG team,",
    "",
    "NyaayWatch publishes reviewed public snapshots derived from NJDG aggregate dashboards. In the latest public check, we found rows under your High Court CPC coverage where NJDG shows a non-zero pending backlog but reports 0 filed and 0 disposed cases for the last-month movement fields.",
    "",
    "We are marking these derived monthly movement metrics as N/A on NyaayWatch instead of treating them as zero-rate performance. Could you please confirm whether these rows are intentionally zero for the period, or whether the monthly movement fields are missing from the public dashboard output?",
    "",
    grouped.join("\n\n") || "- No affected rows.",
    overflow,
    "",
    `NyaayWatch public site: ${baseUrl}`,
    "",
    "Thank you,",
    "NyaayWatch operators",
  ].join("\n");

  return { subject, text, to };
}

export function deriveOutreachRecipients(issues: MissingMonthlyMovementIssue[], extraRecipients = process.env.NJDG_OUTREACH_TO): string[] {
  const recipients = issues.map((issue) => {
    const cpcEmail = OFFICIAL_CPC_EMAIL_BY_STATE_CODE[issue.stateCode as SupportedStateCode];
    if (!cpcEmail) {
      throw new Error(`No official NJDG CPC contact is configured for ${issue.stateCode} (${issue.stateName}).`);
    }
    return cpcEmail;
  });
  return uniqueEmailList([...recipients, ...parseEmailList(extraRecipients)]);
}

export function parseEmailList(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) ?? []
  );
}

export function deriveOutreachBcc(sourceEmail: string, extraBcc = process.env.NJDG_OUTREACH_BCC): string[] {
  return uniqueEmailList([...parseEmailList(extraBcc), sourceEmail.trim()].filter(Boolean));
}

export function validateOutreachSourceEmail(sourceEmail: string): string {
  const normalized = sourceEmail.trim().toLowerCase();
  if (!normalized.endsWith("@nyaaywatch.in") && !normalized.endsWith("@outreach.nyaaywatch.in")) {
    throw new Error(
      "NJDG outreach must use an authenticated @nyaaywatch.in or @outreach.nyaaywatch.in sender. Do not send this outreach from a personal mailbox.",
    );
  }
  return normalized;
}

export function deriveOutreachReplyTo(sourceEmail: string, replyTo = process.env.NJDG_OUTREACH_REPLY_TO): string[] {
  return uniqueEmailList([...parseEmailList(replyTo), sourceEmail.trim()].filter(Boolean));
}

export function buildOutreachArchiveKey(checkedAtIso: string): string {
  const date = checkedAtIso.slice(0, 10);
  const [year, month, day] = date.split("-");
  const safeTimestamp = checkedAtIso.replace(/[:.]/g, "-");
  return `ops/njdg-missing-zero-outreach/${year}/${month}/${day}/${safeTimestamp}.json`;
}

function uniqueEmailList(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function sendOutreachEmail(
  message: NjdgOutreachMessage,
  context: { baseUrl: string; checkedAt: string; issues: MissingMonthlyMovementIssue[] },
): Promise<SendOutreachResult> {
  const source = validateOutreachSourceEmail(process.env.NJDG_OUTREACH_SENDER ?? "");
  const emailConnectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING?.trim();
  const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL?.trim();
  const archiveContainer = process.env.AZURE_STORAGE_CONTAINER?.trim();
  if (message.to.length === 0) {
    throw new Error("At least one NJDG outreach recipient is required when --send is set.");
  }
  if (!emailConnectionString) {
    throw new Error("AZURE_COMMUNICATION_CONNECTION_STRING is required when --send is set.");
  }
  if (!storageAccountUrl || !archiveContainer) {
    throw new Error("AZURE_STORAGE_ACCOUNT_URL and AZURE_STORAGE_CONTAINER are required when --send is set.");
  }

  const bcc = deriveOutreachBcc(source);
  const replyTo = deriveOutreachReplyTo(source);
  const archiveKey = buildOutreachArchiveKey(context.checkedAt);
  await archiveOutreachEmail({
    accountUrl: storageAccountUrl,
    container: archiveContainer,
    key: archiveKey,
    record: buildOutreachArchiveRecord({
      ...context,
      bcc,
      message,
      replyTo,
      source,
      status: "prepared",
      messageId: null,
      sentAt: null,
    }),
  });

  const client = new EmailClient(emailConnectionString);
  const poller = await client.beginSend({
    senderAddress: source,
    recipients: {
      to: message.to.map((address) => ({ address })),
      bcc: bcc.map((address) => ({ address })),
    },
    replyTo: replyTo.map((address) => ({ address })),
    content: { subject: message.subject, plainText: message.text },
  });
  const response = await poller.pollUntilDone();
  if (response.status !== "Succeeded") {
    throw new Error(`Azure outreach email finished with status ${response.status}.`);
  }
  const sentAt = new Date().toISOString();
  await archiveOutreachEmail({
    accountUrl: storageAccountUrl,
    container: archiveContainer,
    key: archiveKey,
    record: buildOutreachArchiveRecord({
      ...context,
      bcc,
      message,
      replyTo,
      source,
      status: "sent",
      messageId: response.id ?? null,
      sentAt,
    }),
  });

  return { archiveContainer, archiveKey, bcc, messageId: response.id ?? null, replyTo };
}

function buildOutreachArchiveRecord(input: {
  baseUrl: string;
  bcc: string[];
  checkedAt: string;
  issues: MissingMonthlyMovementIssue[];
  message: NjdgOutreachMessage;
  messageId: string | null;
  replyTo: string[];
  sentAt: string | null;
  source: string;
  status: "prepared" | "sent";
}) {
  return {
    kind: "njdg_missing_zero_outreach_email",
    version: 1,
    status: input.status,
    baseUrl: input.baseUrl,
    checkedAt: input.checkedAt,
    sentAt: input.sentAt,
    emailMessageId: input.messageId,
    source: input.source,
    to: input.message.to,
    bcc: input.bcc,
    replyTo: input.replyTo,
    subject: input.message.subject,
    text: input.message.text,
    issueCount: input.issues.length,
    issues: input.issues,
  };
}

async function archiveOutreachEmail(input: { accountUrl: string; container: string; key: string; record: unknown }): Promise<void> {
  const service = new BlobServiceClient(input.accountUrl, new DefaultAzureCredential());
  const container = service.getContainerClient(input.container);
  await container.createIfNotExists();
  const body = JSON.stringify(input.record, null, 2);
  await container.getBlockBlobClient(input.key).upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
}

function buildStateApiRoutes(stateSlug: string) {
  if (stateSlug === "himachal-pradesh") {
    return {
      home: "/states/himachal",
      stats: "/v1/stats/himachal",
      districts: "/v1/districts",
    };
  }

  return {
    home: `/states/${stateSlug}`,
    stats: `/v1/states/${stateSlug}/stats`,
    districts: `/v1/states/${stateSlug}/districts`,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function sourceReportsMissingMonthlyMovement(pendingCases: number, filedLastMonthCases: number, clearedLastMonthCases: number) {
  return pendingCases > 0 && filedLastMonthCases === 0 && clearedLastMonthCases === 0;
}

function formatDate(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}

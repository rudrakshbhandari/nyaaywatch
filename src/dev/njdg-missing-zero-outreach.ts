import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { listPublicStateProfiles, type SupportedStateCode } from "../geographies.js";
import { readFlag } from "./cli-flags.js";

interface PublicStatsPayload {
  snapshot: {
    stateCode: string;
    stateName: string;
    sourceSnapshotAt: string;
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
  sourceSnapshotAt: string;
  sourceAttribution: string;
  districtName?: string;
  pendingCases: number;
  filedLastMonthCases: number;
  clearedLastMonthCases: number;
  publicUrl: string;
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
  const summary = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    issueCount: issues.length,
    recipientCount: recipients.length,
    recipients,
    sendRequested: send,
    sent: false,
    issues,
  };

  if (issues.length === 0) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (send) {
    await sendOutreachEmail(message);
    summary.sent = true;
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
      `  Source date: ${formatDate(issue.sourceSnapshotAt)}`,
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

function uniqueEmailList(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function sendOutreachEmail(message: { subject: string; text: string; to: string[] }): Promise<void> {
  const source = process.env.SES_SOURCE_EMAIL?.trim();
  const region = process.env.AWS_REGION?.trim() || "ap-south-1";
  if (!source) {
    throw new Error("SES_SOURCE_EMAIL is required when --send is set.");
  }
  if (message.to.length === 0) {
    throw new Error("At least one NJDG outreach recipient is required when --send is set.");
  }

  const client = new SESClient({ region });
  await client.send(
    new SendEmailCommand({
      Source: source,
      Destination: { ToAddresses: message.to },
      Message: {
        Subject: { Data: message.subject },
        Body: { Text: { Data: message.text } },
      },
    }),
  );
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

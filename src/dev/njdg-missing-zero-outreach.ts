import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

import { listPublicStateProfiles } from "../geographies.js";
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

interface MissingMonthlyMovementIssue {
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

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = (readFlag(args, "--base-url") ?? process.env.PUBLIC_BASE_URL ?? "https://nyaaywatch.in").replace(/\/+$/, "");
  const send = args.includes("--send");
  const issues = await findMissingMonthlyMovementIssues(baseUrl);
  const message = composeNjdgOutreachMessage(baseUrl, issues);
  const summary = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    issueCount: issues.length,
    sendRequested: send,
    sent: false,
    sendSkipped: false,
    issues,
  };

  if (issues.length === 0) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (send) {
    summary.sent = await sendOutreachEmail(message);
    summary.sendSkipped = !summary.sent;
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

function composeNjdgOutreachMessage(baseUrl: string, issues: MissingMonthlyMovementIssue[]) {
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
    "NyaayWatch publishes reviewed public snapshots derived from NJDG aggregate dashboards. In the latest public check, we found rows where NJDG shows a non-zero pending backlog but reports 0 filed and 0 disposed cases for the last-month movement fields.",
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

  return { subject, text };
}

async function sendOutreachEmail(message: { subject: string; text: string }): Promise<boolean> {
  const to = process.env.NJDG_OUTREACH_TO?.trim();
  const source = process.env.SES_SOURCE_EMAIL?.trim();
  const region = process.env.AWS_REGION?.trim() || "ap-south-1";
  if (!to || !source) {
    console.log("NJDG_OUTREACH_TO or SES_SOURCE_EMAIL is not configured. Logging outreach draft instead of sending.");
    console.log(message.text);
    return false;
  }

  const client = new SESClient({ region });
  await client.send(
    new SendEmailCommand({
      Source: source,
      Destination: { ToAddresses: to.split(",").map((value) => value.trim()).filter(Boolean) },
      Message: {
        Subject: { Data: message.subject },
        Body: { Text: { Data: message.text } },
      },
    }),
  );
  return true;
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

function sourceReportsMissingMonthlyMovement(pendingCases: number, filedLastMonthCases: number, clearedLastMonthCases: number) {
  return pendingCases > 0 && filedLastMonthCases === 0 && clearedLastMonthCases === 0;
}

function formatDate(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

await main();

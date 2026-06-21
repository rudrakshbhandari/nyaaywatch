import type { PublicationHistoryEntry } from "../../services/published-snapshot-service.js";
import type { PublishedSnapshot } from "../../domain/snapshot-schema.js";
import { formatClearancePer100 } from "./metric-insights.js";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderRssFeed(opts: {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  entries: PublicationHistoryEntry[];
  currentSnapshot: PublishedSnapshot | null;
}): string {
  const { title, description, link, feedUrl, entries, currentSnapshot } = opts;
  const lastBuildDate = entries[0]?.publication.createdAt ?? new Date().toISOString();

  const items = entries.slice(0, 20).map((entry) => {
    const snap = entry.snapshot;
    const pubDate = new Date(entry.publication.createdAt).toUTCString();
    const guid = `${link}#publication-${escapeXml(entry.publication.id)}`;
    const itemTitle = `${escapeXml(snap.stateName)} snapshot · ${snap.referenceDateAt.slice(0, 10)}`;
    const itemDesc = buildItemDescription(entry, currentSnapshot);

    return `  <item>
    <title>${itemTitle}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="false">${escapeXml(guid)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${itemDesc}]]></description>
  </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(title)}</title>
  <link>${escapeXml(link)}</link>
  <description>${escapeXml(description)}</description>
  <language>en-in</language>
  <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
  <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
</channel>
</rss>`;
}

function buildItemDescription(
  entry: PublicationHistoryEntry,
  current: PublishedSnapshot | null,
): string {
  const lines: string[] = [
    `<strong>${entry.snapshot.stateName}</strong> — snapshot published ${entry.snapshot.referenceDateAt.slice(0, 10)}`,
    `<br>Methodology: ${entry.snapshot.methodologyVersion}`,
    `<br>Source: ${entry.snapshot.sourceAttribution}`,
  ];

  if (current) {
    const { stats } = current;
    lines.push(
      `<br><br><strong>Current headline numbers:</strong>`,
      `<br>Cases waiting: ${stats.pendingCases.toLocaleString("en-IN")}`,
      `<br>Cleared per 100 filed: ${formatClearancePer100(stats, 1)}`,
      `<br>Typical wait: ~${Math.round(stats.medianCaseAgeDays / 30)} months`,
      `<br>Flagged districts: ${stats.flaggedDistricts.toLocaleString("en-IN")}`,
    );
  }

  return lines.join("");
}

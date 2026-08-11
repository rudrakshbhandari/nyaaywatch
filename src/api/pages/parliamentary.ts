import type { ParliamentaryPublishedSnapshot } from "../../domain/parliamentary-schema.js";

export function buildParliamentaryJsonPayload(snapshot: ParliamentaryPublishedSnapshot) {
  return {
    snapshot,
    aggregate: snapshot.aggregate,
    profiles: snapshot.profiles,
    methodology: snapshot.methodology,
    citations: snapshot.sourceEvidence,
  };
}

export function renderParliamentarySnapshotPage(
  snapshot: ParliamentaryPublishedSnapshot,
  personId?: string,
): string {
  const profile = personId ? snapshot.profiles.find((candidate) => candidate.person.personId === personId) : snapshot.profiles[0];
  const title = profile
    ? `${profile.person.fullName} — Lok Sabha parliamentary profile`
    : "Lok Sabha parliamentary activity snapshot";
  const body = profile ? renderProfile(snapshot, profile) : renderAggregate(snapshot);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(title)} — NyaayWatch internal</title>
    <style>${PAGE_CSS}</style>
  </head>
  <body>
    <header class="masthead"><span>NYAAWATCH / INTERNAL</span><span>LOK SABHA ONLY</span></header>
    <main data-lineage-id="${escapeHtml(snapshot.metadata.lineageId)}" data-scope-id="${escapeHtml(snapshot.metadata.scopeId)}">
      ${body}
      ${renderSnapshotMeta(snapshot)}
      ${renderMethodology(snapshot)}
      ${renderCitations(snapshot)}
    </main>
  </body>
</html>`;
}

function renderAggregate(snapshot: ParliamentaryPublishedSnapshot): string {
  const activity = snapshot.aggregate.activity;
  return `
    <p class="eyebrow">PARLIAMENTARY ACTIVITY SNAPSHOT</p>
    <h1>Lok Sabha activity</h1>
    <p class="lede">A bounded, source-linked snapshot for ${escapeHtml(snapshot.aggregate.scopeLabel)}. It records activity counts and missing data; it does not rate people or parties.</p>
    <p class="quality">Quality: <strong>${escapeHtml(snapshot.metadata.qualityState)}</strong> · Internal publication only</p>
    <section class="grid" aria-label="Published activity values">
      ${metric("Bill records", activity.bills.recordCount)}
      ${metric("Unique bills", activity.bills.uniqueBillCount)}
      ${metric("Member-attributed bills", activity.bills.attributedToMemberCount)}
      ${metric("Questions reported by source", activity.questions.sourceReportedCount ?? "Not available")}
      ${metric("Session-scoped question rows", activity.questions.sessionScopedCount ?? "Not captured")}
      ${metric("Debate participation records", activity.debateParticipationCount ?? "Not available")}
      ${metric("Committee participation records", activity.committeeParticipationCount ?? "Not available")}
      ${metric("Attendance", "Not published")}
    </section>
    ${renderQuestionCaveat(activity.questions.sourceReportedCount, activity.questions.sourceReportedScope, activity.questions.breakdownStatus)}
    <h2>MP profiles in this snapshot</h2>
    <div class="profiles">${snapshot.profiles.map((profile) => renderProfileCard(profile)).join("")}</div>
  `;
}

function renderProfile(snapshot: ParliamentaryPublishedSnapshot, profile: ParliamentaryPublishedSnapshot["profiles"][number]): string {
  const activity = profile.activity;
  return `
    <p class="eyebrow">TIME-BOUNDED MP PROFILE</p>
    <h1>${escapeHtml(profile.person.fullName)}</h1>
    <p class="lede">Official-record identity and activity for ${escapeHtml(snapshot.aggregate.scopeLabel)}. This is a record of sourced activity, not a judgment about the MP.</p>
    <dl class="identity">
      <div><dt>Party</dt><dd>${escapeHtml(profile.person.party.name)}${profile.person.party.abbreviation ? ` (${escapeHtml(profile.person.party.abbreviation)})` : ""}</dd></div>
      <div><dt>Constituency</dt><dd>${escapeHtml(profile.person.constituency.name)}, ${escapeHtml(profile.person.constituency.stateOrUnionTerritory)}</dd></div>
      <div><dt>House</dt><dd>Lok Sabha ${profile.person.lokSabhaNumber}</dd></div>
      <div><dt>Term</dt><dd>${profile.person.termLabels.map(escapeHtml).join(", ")}</dd></div>
    </dl>
    <h2>Activity in the published scope</h2>
    <section class="grid" aria-label="Published MP activity values">
      ${metric("Bill records", activity.bills.recordCount)}
      ${metric("Unique bills", activity.bills.uniqueBillCount)}
      ${metric("Member-attributed bills", activity.bills.attributedToMemberCount)}
      ${metric("Questions reported by source", activity.questions.sourceReportedCount ?? "Not available")}
      ${metric("Session-scoped question rows", activity.questions.sessionScopedCount ?? "Not captured")}
      ${metric("Debate participation records", activity.debateParticipationCount ?? "Not available")}
      ${metric("Committee participation records", activity.committeeParticipationCount ?? "Not available")}
      ${metric("Attendance", "Not published")}
    </section>
    ${renderQuestionCaveat(activity.questions.sourceReportedCount, activity.questions.sourceReportedScope, activity.questions.breakdownStatus)}
    <h2>Roles</h2>
    <ul>${profile.roles.map((role) => `<li><strong>${escapeHtml(role.title)}</strong> — ${escapeHtml(role.sourcePeriod)}</li>`).join("")}</ul>
  `;
}

function renderProfileCard(profile: ParliamentaryPublishedSnapshot["profiles"][number]): string {
  return `<article class="profile-card"><h3><a href="/operator/parliamentary/html/mp/${encodeURIComponent(profile.person.personId)}">${escapeHtml(profile.person.fullName)}</a></h3><p>${escapeHtml(profile.person.party.abbreviation ?? profile.person.party.name)} · ${escapeHtml(profile.person.constituency.name)}, ${escapeHtml(profile.person.constituency.stateOrUnionTerritory)}</p><p>Questions reported by source: ${profile.activity.questions.sourceReportedCount ?? "Not available"}; session rows: ${profile.activity.questions.sessionScopedCount ?? "Not captured"}.</p></article>`;
}

function renderSnapshotMeta(snapshot: ParliamentaryPublishedSnapshot): string {
  return `<section class="meta"><h2>Snapshot and lineage</h2><dl class="meta-list"><div><dt>Scope</dt><dd>${escapeHtml(snapshot.metadata.scopeId)}</dd></div><div><dt>Reference date</dt><dd>${escapeHtml(snapshot.metadata.referenceDateAt)}</dd></div><div><dt>Captured at</dt><dd>${escapeHtml(snapshot.metadata.capturedAt)}</dd></div><div><dt>Methodology</dt><dd>${escapeHtml(snapshot.metadata.methodologyVersion)}</dd></div><div><dt>Lineage</dt><dd><code>${escapeHtml(snapshot.metadata.lineageId)}</code></dd></div><div><dt>Published from run</dt><dd><code>${escapeHtml(snapshot.publishedFromRunId)}</code></dd></div></dl></section>`;
}

function renderMethodology(snapshot: ParliamentaryPublishedSnapshot): string {
  const methodology = snapshot.methodology;
  return `<section class="methodology"><h2>Methodology</h2><p><strong>Scope:</strong> ${escapeHtml(methodology.scope)}</p><h3>Sourced facts</h3><ul>${methodology.sourcedFacts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h3>Derived values</h3><ul>${methodology.derivedValues.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h3>Missing-data rules</h3><ul>${methodology.missingDataRules.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p><strong>Publication boundary:</strong> ${escapeHtml(methodology.publicationBoundary)}</p></section>`;
}

function renderCitations(snapshot: ParliamentaryPublishedSnapshot): string {
  return `<section class="citations"><h2>Official source links</h2><ul>${snapshot.sourceEvidence.map((evidence) => `<li><a href="${escapeHtml(evidence.url)}" rel="noreferrer">${escapeHtml(evidence.sourceName)}</a><span>${escapeHtml(evidence.locator ?? "Official source record")}</span></li>`).join("")}</ul></section>`;
}

function renderQuestionCaveat(
  sourceReportedCount: number | null,
  sourceReportedScope: string,
  breakdownStatus: string,
): string {
  return `<aside class="caveat"><strong>Question data note:</strong> ${sourceReportedCount ?? "No count"} is reported for the ${escapeHtml(sourceReportedScope)} scope. Session question rows are ${escapeHtml(breakdownStatus)}; the source count is not labeled as a Session 5 total.</aside>`;
}

function metric(label: string, value: number | string): string {
  return `<div class="metric"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

const PAGE_CSS = `
  :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #1c2220; background: #f5f2ea; }
  body { margin: 0; } main { max-width: 980px; margin: 0 auto; padding: 28px 22px 72px; } .masthead { display:flex; justify-content:space-between; padding:18px 22px; background:#183b36; color:#f5f2ea; font:700 11px ui-monospace, monospace; letter-spacing:.12em; }
  .eyebrow { color:#b15b36; font:700 11px ui-monospace, monospace; letter-spacing:.14em; } h1 { font-size: clamp(34px, 6vw, 64px); line-height:1; margin:10px 0 18px; } h2 { margin-top:42px; border-top:1px solid #c8c2b5; padding-top:18px; } h3 { margin-bottom:6px; } .lede { max-width:700px; font-size:19px; line-height:1.5; } .quality, .caveat { padding:14px 16px; background:#e9e2d5; } .caveat { margin-top:24px; border-left:4px solid #b15b36; line-height:1.5; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin-top:24px; } .metric, .profile-card, .meta, .methodology, .citations { background:#fffdf8; border:1px solid #d8d1c4; padding:16px; } .metric dt, .identity dt, .meta-list dt { color:#6a706d; font:700 11px ui-monospace, monospace; text-transform:uppercase; letter-spacing:.08em; } .metric dd { margin:8px 0 0; font-size:30px; font-weight:700; } .profiles { display:grid; gap:12px; } .profile-card a { color:#183b36; } .identity, .meta-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; } .identity div, .meta-list div { background:#fffdf8; border:1px solid #d8d1c4; padding:14px; } dd { margin:6px 0 0; } li { margin:8px 0; line-height:1.45; } .citations li { display:flex; flex-direction:column; gap:4px; } .citations a { color:#183b36; font-weight:700; } code { overflow-wrap:anywhere; }
`;

import {
  ParliamentarySnapshotCandidateSchema,
  type ParliamentaryBill,
  type ParliamentaryBreakdownEntry,
  type ParliamentaryCaptureBundle,
  type ParliamentaryQuestion,
  type ParliamentarySnapshotCandidate,
} from "../domain/parliamentary-schema.js";
import { extractParliamentaryCapture } from "../extract/parliamentary-source.js";
import type { ExtractedParliamentaryCapture } from "../extract/parliamentary-source.js";

const METHODOLOGY_VERSION = "2026.08-parliament-pilot-1";

export function buildParliamentarySnapshotCandidate(
  capture: ParliamentaryCaptureBundle,
): ParliamentarySnapshotCandidate {
  const extracted = extractParliamentaryCapture(capture);
  const sourceEvidenceIds = extracted.sourceEvidence.map((evidence) => evidence.evidenceId);
  const aggregateActivity = buildActivitySummary(extracted, "house_session");
  const profileActivity = buildActivitySummary(extracted, "member_session");
  const aggregateMissingData = buildMissingData(extracted, "house_session");
  const profileMissingData = buildMissingData(extracted, "member_session");
  const metadata = {
    scopeId: `ls-${extracted.lokSabhaNumber}-session-${extracted.sessionNumber}`,
    house: extracted.house,
    lokSabhaNumber: extracted.lokSabhaNumber,
    sessionNumber: extracted.sessionNumber,
    sessionStartDate: extracted.sessionStartDate,
    sessionEndDate: extracted.sessionEndDate,
    capturedAt: extracted.capturedAt,
    referenceDateAt: `${extracted.sessionEndDate}T00:00:00.000Z`,
    referenceDateKind: "source_session_end_date" as const,
    methodologyVersion: METHODOLOGY_VERSION,
    qualityState: aggregateMissingData.length === 0 ? ("complete" as const) : ("partial" as const),
    lineageId: extracted.captureId,
    sourceEvidenceIds,
  };

  return ParliamentarySnapshotCandidateSchema.parse({
    metadata,
    sourceEvidence: extracted.sourceEvidence,
    methodology: buildMethodology(),
    aggregate: {
      scopeLabel: `Lok Sabha ${extracted.lokSabhaNumber}, Session ${extracted.sessionNumber}`,
      activity: aggregateActivity,
      missingData: aggregateMissingData,
    },
    profiles: [
      {
        person: extracted.person,
        roles: extracted.roles,
        activity: profileActivity,
        missingData: profileMissingData,
      },
    ],
  });
}

function buildMethodology() {
  return {
    version: METHODOLOGY_VERSION,
    scope: "Lok Sabha 18, Session 5 only; one official-record MP profile for Shri Mani A.",
    sourcedFacts: [
      "Person name, party, constituency, House, term label, and role period labels come from Digital Sansad member records.",
      "Bill records come from the captured Digital Sansad Lok Sabha bills result and retain official links only.",
      "Member question, debate, and committee participation counts are reported by the cited Digital Sansad member endpoints and appear only on the MP profile.",
      "The aggregate contains House/session bill totals; full-session question coverage was not captured by this fixture.",
      "Session boundaries come from the cited Digital Sansad session register.",
    ],
    derivedValues: [
      "Unique bill count deduplicates captured records by bill number and title.",
      "Question breakdowns are counted only from captured question rows and are never inferred from an aggregate count.",
      "The reference date is the official session end date at midnight UTC for deterministic snapshot labeling.",
    ],
    missingDataRules: [
      "A Lok Sabha-wide question aggregate is not labeled as a Session 5 count.",
      "Bill sponsorship is missing when the official result does not publish a member identifier.",
      "Attendance is not published until the official attendance code legend is verified.",
      "No ranking, composite score, or judgment about a person is derived from activity counts.",
    ],
    publicationBoundary: "Internal operator surfaces only until source reuse, legal, methodology, and publication gates pass.",
  };
}

function buildActivitySummary(
  capture: ExtractedParliamentaryCapture,
  scope: "house_session" | "member_session",
) {
  const uniqueBillIds = new Set(capture.bills.map((bill) => `${bill.billNumber}:${bill.title}`));
  const attributedBillCount = capture.bills.filter((bill) => bill.introducedByMemberId === capture.person.personId).length;
  const attributedBillRecords = capture.bills.filter((bill) => bill.introducedByMemberId !== null).length;
  const nullAttributionRecords = capture.bills.length - attributedBillRecords;
  const questionRows = scope === "member_session" && capture.questionRowsComplete ? capture.questions : [];
  const isMemberScope = scope === "member_session";

  return {
    scope,
    bills: {
      recordCount: capture.bills.length,
      uniqueBillCount: uniqueBillIds.size,
      attributedToMemberCount: isMemberScope ? attributedBillCount : null,
      attributionStatus:
        nullAttributionRecords === 0
          ? ("complete" as const)
          : attributedBillRecords === 0
            ? ("not_published_by_source" as const)
            : ("partial" as const),
    },
    questions: {
      sessionScopedCount: questionRows.length > 0 ? questionRows.length : null,
      sourceReportedCount: isMemberScope ? capture.participation.questionCount : null,
      sourceReportedScope: isMemberScope ? capture.participation.questionCountScope : ("not_available" as const),
      bySession: countBy(questionRows, (question) => `Session ${question.sessionNumber}`),
      byMinistry: countBy(questionRows, (question) => question.ministry ?? "Not stated"),
      byType: countBy(questionRows, (question) => question.questionType ?? "Not stated"),
      breakdownStatus: !isMemberScope
        ? ("not_captured" as const)
        : !capture.questionRowsComplete
          ? ("incomplete" as const)
          : questionRows.length > 0
            ? ("captured" as const)
            : ("not_captured" as const),
    },
    debateParticipationCount: isMemberScope ? capture.participation.debateCount : null,
    debateParticipationScope: isMemberScope ? capture.participation.debateCountScope : ("not_available" as const),
    committeeParticipationCount: isMemberScope ? capture.participation.committeeParticipationCount : null,
    committeeParticipationScope: isMemberScope
      ? capture.participation.committeeParticipationCountScope
      : ("not_available" as const),
    attendanceStatus: "not_published" as const,
  };
}

function buildMissingData(capture: ExtractedParliamentaryCapture, scope: "house_session" | "member_session"): string[] {
  const missingData: string[] = [];
  if (scope === "house_session") {
    missingData.push("house-session-question-coverage-not-captured");
  } else {
    if (capture.questions.length === 0) {
      missingData.push("question-rows-not-captured-modern-endpoint-unresolved");
    } else if (!capture.questionRowsComplete) {
      missingData.push("question-result-incomplete");
    }
    if (capture.participation.questionCountScope !== "session") {
      missingData.push("source-question-aggregate-not-session-scoped");
    }
  }
  if (scope === "member_session" && !capture.bills.some((bill) => bill.introducedByMemberId !== null)) {
    missingData.push("bill-attribution-not-published-by-source");
  }
  missingData.push("attendance-not-published-official-code-legend-unverified");
  return missingData;
}

function countBy(
  questions: ParliamentaryQuestion[],
  labelFor: (question: ParliamentaryQuestion) => string,
): ParliamentaryBreakdownEntry[] {
  const counts = new Map<string, number>();
  for (const question of questions) {
    const label = labelFor(question);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, count]) => ({ label, count }));
}

export function isBillAttributedToPerson(bill: ParliamentaryBill, personId: string): boolean {
  return bill.introducedByMemberId === personId;
}

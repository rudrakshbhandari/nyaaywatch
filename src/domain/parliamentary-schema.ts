import { z } from "zod";

const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO calendar date");
const HouseSchema = z.literal("lok_sabha");
const EvidenceIdsSchema = z.array(z.string().min(1)).min(1);
const ParticipationScopeSchema = z.enum(["lok_sabha", "session", "unknown", "not_available"]);

export const ParliamentarySourceEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  sourceSystem: z.enum(["digital_sansad", "parliament_digital_library"]),
  sourceName: z.string().min(1),
  url: z.string().url(),
  retrievedAt: z.string().datetime(),
  sourceTimestamp: z.string().min(1).nullable(),
  locator: z.string().min(1).nullable(),
  permittedUse: z.enum(["internal_fixture_only", "normalized_aggregate_with_link", "unknown"]),
  note: z.string().min(1).nullable(),
});

export const ParliamentaryPartySchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1).nullable(),
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryConstituencySchema = z.object({
  name: z.string().min(1),
  stateOrUnionTerritory: z.string().min(1),
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryPersonSchema = z.object({
  personId: z.string().min(1),
  sourceMemberCode: z.string().min(1),
  fullName: z.string().min(1),
  house: HouseSchema,
  lokSabhaNumber: z.number().int().positive(),
  party: ParliamentaryPartySchema,
  constituency: ParliamentaryConstituencySchema,
  status: z.enum(["sitting", "former", "unknown"]),
  termLabels: z.array(z.string().min(1)).min(1),
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryOfficeRoleSchema = z.object({
  roleId: z.string().min(1),
  roleType: z.enum(["member", "committee_member", "office_holder"]),
  title: z.string().min(1),
  fromDate: DateOnlySchema.nullable(),
  toDate: DateOnlySchema.nullable(),
  sourcePeriod: z.string().min(1),
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryBillSchema = z.object({
  billId: z.string().min(1),
  billNumber: z.string().min(1),
  title: z.string().min(1),
  billType: z.string().min(1).nullable(),
  billCategory: z.string().min(1).nullable(),
  ministry: z.string().min(1).nullable(),
  house: HouseSchema,
  lokSabhaNumber: z.number().int().positive(),
  sessionNumber: z.number().int().positive(),
  introducedDate: DateOnlySchema.nullable(),
  introducedByMemberId: z.string().min(1).nullable(),
  status: z.string().min(1).nullable(),
  officialUrl: z.string().url(),
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryQuestionSchema = z.object({
  questionId: z.string().min(1),
  questionNumber: z.string().min(1),
  subject: z.string().min(1).nullable(),
  ministry: z.string().min(1).nullable(),
  questionType: z.string().min(1).nullable(),
  house: HouseSchema,
  lokSabhaNumber: z.number().int().positive(),
  sessionNumber: z.number().int().positive(),
  askedDate: DateOnlySchema.nullable(),
  memberId: z.string().min(1).nullable(),
  officialUrl: z.string().url(),
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryParticipationSummarySchema = z.object({
  questionCount: z.number().int().nonnegative().nullable(),
  questionCountScope: ParticipationScopeSchema,
  debateCount: z.number().int().nonnegative().nullable(),
  debateCountScope: ParticipationScopeSchema,
  billParticipationCount: z.number().int().nonnegative().nullable(),
  billParticipationCountScope: ParticipationScopeSchema,
  committeeParticipationCount: z.number().int().nonnegative().nullable(),
  committeeParticipationCountScope: ParticipationScopeSchema,
  evidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryCaptureBundleSchema = z.object({
  captureId: z.string().min(1),
  capturedAt: z.string().datetime(),
  house: HouseSchema,
  lokSabhaNumber: z.number().int().positive(),
  sessionNumber: z.number().int().positive(),
  sessionStartDate: DateOnlySchema,
  sessionEndDate: DateOnlySchema,
  sourceResultTotals: z.object({
    billRecords: z.number().int().nonnegative().nullable(),
    questionRecords: z.number().int().nonnegative().nullable(),
  }),
  sourceEvidence: z.array(ParliamentarySourceEvidenceSchema).min(1),
  person: ParliamentaryPersonSchema,
  roles: z.array(ParliamentaryOfficeRoleSchema).min(1),
  bills: z.array(ParliamentaryBillSchema),
  questions: z.array(ParliamentaryQuestionSchema),
  participation: ParliamentaryParticipationSummarySchema,
});

export const ParliamentaryBreakdownEntrySchema = z.object({
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
});

export const ParliamentarySnapshotMetadataSchema = z.object({
  scopeId: z.string().min(1),
  house: HouseSchema,
  lokSabhaNumber: z.number().int().positive(),
  sessionNumber: z.number().int().positive(),
  sessionStartDate: DateOnlySchema,
  sessionEndDate: DateOnlySchema,
  capturedAt: z.string().datetime(),
  referenceDateAt: z.string().datetime(),
  referenceDateKind: z.literal("source_session_end_date"),
  methodologyVersion: z.string().min(1),
  qualityState: z.enum(["complete", "partial", "blocked"]),
  lineageId: z.string().min(1),
  sourceEvidenceIds: EvidenceIdsSchema,
});

export const ParliamentaryBillActivitySummarySchema = z.object({
  recordCount: z.number().int().nonnegative().nullable(),
  uniqueBillCount: z.number().int().nonnegative().nullable(),
  captureStatus: z.enum(["complete", "incomplete", "unverified"]),
  attributedToMemberCount: z.number().int().nonnegative().nullable(),
  attributionStatus: z.enum(["complete", "not_published_by_source", "partial"]),
});

export const ParliamentaryQuestionActivitySummarySchema = z.object({
  sessionScopedCount: z.number().int().nonnegative().nullable(),
  sourceReportedCount: z.number().int().nonnegative().nullable(),
  sourceReportedScope: ParticipationScopeSchema,
  bySession: z.array(ParliamentaryBreakdownEntrySchema),
  byMinistry: z.array(ParliamentaryBreakdownEntrySchema),
  byType: z.array(ParliamentaryBreakdownEntrySchema),
  breakdownStatus: z.enum(["captured", "incomplete", "unverified", "not_captured", "not_session_scoped"]),
});

export const ParliamentaryActivitySummarySchema = z.object({
  scope: z.enum(["house_session", "member_session"]),
  bills: ParliamentaryBillActivitySummarySchema,
  questions: ParliamentaryQuestionActivitySummarySchema,
  debateParticipationCount: z.number().int().nonnegative().nullable(),
  debateParticipationScope: ParticipationScopeSchema,
  committeeParticipationCount: z.number().int().nonnegative().nullable(),
  committeeParticipationScope: ParticipationScopeSchema,
  attendanceStatus: z.literal("not_published"),
});

export const ParliamentaryAggregateSnapshotSchema = z.object({
  scopeLabel: z.string().min(1),
  activity: ParliamentaryActivitySummarySchema,
  missingData: z.array(z.string().min(1)),
});

export const ParliamentaryMethodologySchema = z.object({
  version: z.string().min(1),
  scope: z.string().min(1),
  sourcedFacts: z.array(z.string().min(1)).min(1),
  derivedValues: z.array(z.string().min(1)).min(1),
  missingDataRules: z.array(z.string().min(1)).min(1),
  publicationBoundary: z.string().min(1),
});

export const ParliamentaryMpProfileSnapshotSchema = z.object({
  person: ParliamentaryPersonSchema,
  roles: z.array(ParliamentaryOfficeRoleSchema).min(1),
  activity: ParliamentaryActivitySummarySchema,
  missingData: z.array(z.string().min(1)),
});

export const ParliamentarySnapshotCandidateSchema = z.object({
  metadata: ParliamentarySnapshotMetadataSchema,
  sourceEvidence: z.array(ParliamentarySourceEvidenceSchema).min(1),
  methodology: ParliamentaryMethodologySchema,
  aggregate: ParliamentaryAggregateSnapshotSchema,
  profiles: z.array(ParliamentaryMpProfileSnapshotSchema).min(1),
});

export const ParliamentaryPublishedSnapshotSchema = ParliamentarySnapshotCandidateSchema.extend({
  publishedAt: z.string().datetime(),
  publishedFromRunId: z.string().min(1),
});

export type ParliamentarySourceEvidence = z.infer<typeof ParliamentarySourceEvidenceSchema>;
export type ParliamentaryParty = z.infer<typeof ParliamentaryPartySchema>;
export type ParliamentaryConstituency = z.infer<typeof ParliamentaryConstituencySchema>;
export type ParliamentaryPerson = z.infer<typeof ParliamentaryPersonSchema>;
export type ParliamentaryOfficeRole = z.infer<typeof ParliamentaryOfficeRoleSchema>;
export type ParliamentaryBill = z.infer<typeof ParliamentaryBillSchema>;
export type ParliamentaryQuestion = z.infer<typeof ParliamentaryQuestionSchema>;
export type ParliamentaryParticipationSummary = z.infer<typeof ParliamentaryParticipationSummarySchema>;
export type ParliamentaryCaptureBundle = z.infer<typeof ParliamentaryCaptureBundleSchema>;
export type ParliamentaryBreakdownEntry = z.infer<typeof ParliamentaryBreakdownEntrySchema>;
export type ParliamentaryMethodology = z.infer<typeof ParliamentaryMethodologySchema>;
export type ParliamentarySnapshotCandidate = z.infer<typeof ParliamentarySnapshotCandidateSchema>;
export type ParliamentaryPublishedSnapshot = z.infer<typeof ParliamentaryPublishedSnapshotSchema>;

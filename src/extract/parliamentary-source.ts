import {
  ParliamentaryCaptureBundleSchema,
  type ParliamentaryBill,
  type ParliamentaryCaptureBundle,
  type ParliamentaryQuestion,
} from "../domain/parliamentary-schema.js";

export type ExtractedParliamentaryCapture = ParliamentaryCaptureBundle;

export function extractParliamentaryCapture(
  capture: unknown,
): ExtractedParliamentaryCapture {
  const parsed = ParliamentaryCaptureBundleSchema.parse(capture);

  return {
    ...parsed,
    roles: [...parsed.roles].sort((left, right) => left.roleId.localeCompare(right.roleId)),
    bills: [...parsed.bills].sort(compareBills),
    questions: [...parsed.questions].sort(compareQuestions),
    sourceEvidence: [...parsed.sourceEvidence].sort((left, right) =>
      left.evidenceId.localeCompare(right.evidenceId),
    ),
  };
}

function compareBills(left: ParliamentaryBill, right: ParliamentaryBill): number {
  return left.billId.localeCompare(right.billId);
}

function compareQuestions(left: ParliamentaryQuestion, right: ParliamentaryQuestion): number {
  return left.questionId.localeCompare(right.questionId);
}

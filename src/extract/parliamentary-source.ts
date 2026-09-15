import {
  ParliamentaryCaptureBundleSchema,
  type ParliamentaryBill,
  type ParliamentaryCaptureBundle,
  type ParliamentaryQuestion,
} from "../domain/parliamentary-schema.js";

export type ExtractedParliamentaryCapture = ParliamentaryCaptureBundle & {
  questionRowsComplete: boolean;
};

export function extractParliamentaryCapture(
  capture: unknown,
): ExtractedParliamentaryCapture {
  const parsed = ParliamentaryCaptureBundleSchema.parse(capture);

  const outOfScopeQuestions = parsed.questions.filter(
    (question) =>
      question.house !== parsed.house ||
      question.lokSabhaNumber !== parsed.lokSabhaNumber ||
      question.sessionNumber !== parsed.sessionNumber ||
      question.memberId !== parsed.person.personId,
  );
  if (outOfScopeQuestions.length > 0) {
    throw new Error(`Parliamentary question rows are outside the declared capture scope: ${outOfScopeQuestions.map((question) => question.questionId).join(", ")}`);
  }

  return {
    ...parsed,
    questionRowsComplete:
      parsed.sourceResultTotals.questionRecords === null ||
      parsed.questions.length === parsed.sourceResultTotals.questionRecords,
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

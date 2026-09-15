import {
  ParliamentaryCaptureBundleSchema,
  type ParliamentaryBill,
  type ParliamentaryCaptureBundle,
  type ParliamentaryQuestion,
} from "../domain/parliamentary-schema.js";

export type ExtractedParliamentaryCapture = ParliamentaryCaptureBundle & {
  billRowsStatus: "complete" | "incomplete" | "unverified";
  questionRowsStatus: "complete" | "incomplete" | "unverified";
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

  const outOfScopeBills = parsed.bills.filter(
    (bill) =>
      bill.house !== parsed.house ||
      bill.lokSabhaNumber !== parsed.lokSabhaNumber ||
      bill.sessionNumber !== parsed.sessionNumber,
  );
  if (outOfScopeBills.length > 0) {
    throw new Error(`Parliamentary bill rows are outside the declared capture scope: ${outOfScopeBills.map((bill) => bill.billId).join(", ")}`);
  }

  return {
    ...parsed,
    billRowsStatus: resultSetStatus(parsed.sourceResultTotals.billRecords, parsed.bills.length),
    questionRowsStatus: resultSetStatus(parsed.sourceResultTotals.questionRecords, parsed.questions.length),
    roles: [...parsed.roles].sort((left, right) => left.roleId.localeCompare(right.roleId)),
    bills: [...parsed.bills].sort(compareBills),
    questions: [...parsed.questions].sort(compareQuestions),
    sourceEvidence: [...parsed.sourceEvidence].sort((left, right) =>
      left.evidenceId.localeCompare(right.evidenceId),
    ),
  };
}

function resultSetStatus(
  declaredTotal: number | null,
  capturedRows: number,
): "complete" | "incomplete" | "unverified" {
  if (declaredTotal === null) return "unverified";
  return declaredTotal === capturedRows ? "complete" : "incomplete";
}

function compareBills(left: ParliamentaryBill, right: ParliamentaryBill): number {
  return left.billId.localeCompare(right.billId);
}

function compareQuestions(left: ParliamentaryQuestion, right: ParliamentaryQuestion): number {
  return left.questionId.localeCompare(right.questionId);
}

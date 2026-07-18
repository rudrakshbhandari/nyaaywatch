import { runOperatorInvocation, type OperatorInvocation } from "../dev/operator-ops.js";
import { createAlarmNotifier, type AlarmNotifier } from "./alarm-notifier.js";
import { evaluateAutoPublish, type AutoPublishDecision } from "./auto-publish-gate.js";

export type AutoPublishAction = "published" | "skipped_review" | "publish_failed" | "gate_inputs_missing";

export interface AutoPublishOutcome {
  action: AutoPublishAction;
  decision?: AutoPublishDecision;
  publishRunId?: string;
  error?: string;
}

export interface AutoPublishRequest {
  scopeLabel: string;
  selector: Pick<OperatorInvocation, "stateCode" | "highCourtCode" | "supremeCourt">;
  fetchResult: unknown;
  pendingField: "pendingTotalCases" | "pendingCases";
  note?: string;
  /**
   * Override the gate's `previousPending` baseline. The candidate's `trends`
   * array is built when the run is captured, so it reflects the publication
   * history at fetch time — not the publication history at publish time. When
   * a sweep publishes multiple runs in sequence, the second and later runs
   * need to be evaluated against the immediately-prior just-published run, not
   * against whatever was already published when this run was originally
   * captured. Pass that value here to short-circuit the candidate's trends.
   */
  previousPendingOverride?: number;
  /**
   * Previous published district backlog map keyed by districtId. Required for
   * the lower-court concentrated-district gate; omit for High Court / Supreme
   * Court scopes that have no district surface.
   */
  previousDistrictPending?: Record<string, number>;
}

export interface AutoPublishRunnerDeps {
  runOperator?: typeof runOperatorInvocation;
  notifier?: AlarmNotifier;
  rawEnv?: NodeJS.ProcessEnv;
}

export async function runAutoPublish(
  request: AutoPublishRequest,
  deps: AutoPublishRunnerDeps = {},
): Promise<AutoPublishOutcome> {
  const rawEnv = deps.rawEnv ?? process.env;
  const runOperator = deps.runOperator ?? runOperatorInvocation;
  const notifier = deps.notifier ?? createAlarmNotifier(rawEnv);

  const inputs = extractGateInputs(request.fetchResult, request.pendingField);
  if (!inputs.runId || !inputs.qualityState) {
    return { action: "gate_inputs_missing" };
  }

  const previousPending =
    request.previousPendingOverride !== undefined && Number.isFinite(request.previousPendingOverride)
      ? request.previousPendingOverride
      : inputs.previousPending;

  const decision = evaluateAutoPublish({
    qualityState: inputs.qualityState,
    currentPending: inputs.currentPending,
    previousPending,
    currentDistrictPending: inputs.currentDistrictPending,
    previousDistrictPending: request.previousDistrictPending,
  });

  if (!decision.publish) {
    const subject = `NyaayWatch review required: ${request.scopeLabel}`;
    const message = formatReviewMessage(request, inputs.runId, decision);
    await notifier.publish(subject, message);
    return { action: "skipped_review", decision };
  }

  try {
    await runOperator(
      {
        ...request.selector,
        command: "publish",
        targetId: inputs.runId,
        note: request.note,
      },
      rawEnv,
    );
    return { action: "published", decision, publishRunId: inputs.runId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await notifier.publish(
      `NyaayWatch auto-publish failed: ${request.scopeLabel}`,
      `Run: ${inputs.runId}\nReason: ${message}`,
    );
    return { action: "publish_failed", decision, publishRunId: inputs.runId, error: message };
  }
}

interface ExtractedGateInputs {
  runId?: string;
  qualityState?: string;
  currentPending?: number;
  previousPending?: number;
  currentDistrictPending?: Record<string, number>;
}

export function extractDistrictPendingMap(result: unknown): Record<string, number> | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }
  const obj = result as Record<string, unknown>;
  const candidate = obj.candidate as Record<string, unknown> | null | undefined;
  const payload = candidate ?? (obj.payload as Record<string, unknown> | undefined) ?? obj;
  const districts = Array.isArray(payload.districts) ? (payload.districts as Array<Record<string, unknown>>) : [];
  if (districts.length === 0) {
    return undefined;
  }

  const map: Record<string, number> = {};
  for (const district of districts) {
    const districtId =
      typeof district.districtId === "string"
        ? district.districtId
        : typeof district.districtCode === "string"
          ? district.districtCode
          : undefined;
    const pendingRaw = district.backlogCases ?? district.pendingCases;
    if (!districtId || typeof pendingRaw !== "number" || !Number.isFinite(pendingRaw)) {
      continue;
    }
    map[districtId] = pendingRaw;
  }
  return Object.keys(map).length > 0 ? map : undefined;
}

function extractGateInputs(result: unknown, pendingField: "pendingTotalCases" | "pendingCases"): ExtractedGateInputs {
  if (!result || typeof result !== "object") {
    return {};
  }
  const obj = result as Record<string, unknown>;

  const run = obj.run as Record<string, unknown> | undefined;
  const runId = typeof run?.id === "string" ? run.id : undefined;

  const candidate = obj.candidate as Record<string, unknown> | null | undefined;
  if (!candidate) {
    return { runId };
  }

  const snapshot = candidate.snapshot as Record<string, unknown> | undefined;
  const qualityState = typeof snapshot?.qualityState === "string" ? snapshot.qualityState : undefined;

  const stats = candidate.stats as Record<string, unknown> | undefined;
  const currentPendingRaw = stats?.[pendingField];
  const currentPending = typeof currentPendingRaw === "number" ? currentPendingRaw : undefined;

  const trends = Array.isArray(candidate.trends) ? (candidate.trends as Array<Record<string, unknown>>) : [];
  const previousPending = trends.length >= 2 ? trends[trends.length - 2]?.[pendingField] : undefined;

  return {
    runId,
    qualityState,
    currentPending,
    previousPending: typeof previousPending === "number" ? previousPending : undefined,
    currentDistrictPending: extractDistrictPendingMap(obj),
  };
}

function formatReviewMessage(request: AutoPublishRequest, runId: string, decision: AutoPublishDecision): string {
  const lines = [
    `Scope: ${request.scopeLabel}`,
    `Run: ${runId}`,
    `Reason: ${decision.reason ?? "unknown"}`,
    `Quality state: ${decision.qualityState}`,
  ];
  if (decision.currentPending !== undefined) {
    lines.push(`Current pending: ${decision.currentPending}`);
  }
  if (decision.previousPending !== undefined) {
    lines.push(`Previous published pending: ${decision.previousPending}`);
  }
  if (decision.deltaFraction !== undefined) {
    lines.push(
      `Delta fraction: ${(decision.deltaFraction * 100).toFixed(1)}% (threshold ${(decision.deltaThreshold * 100).toFixed(0)}%)`,
    );
  }
  if (decision.districtDelta) {
    const d = decision.districtDelta;
    lines.push(
      `District: ${d.districtId} ${d.previousPending} -> ${d.currentPending} (${(d.deltaFraction * 100).toFixed(1)}%, ${(d.stateDeltaShare * 100).toFixed(0)}% of state delta)`,
    );
  }
  lines.push(
    "",
    "Inspect this run via the operator CLI and publish or discard manually once reviewed.",
  );
  return lines.join("\n");
}

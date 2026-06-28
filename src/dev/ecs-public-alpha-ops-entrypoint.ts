import { assertPublicAlphaOperationsHealthy, verifyPublicAlphaOperations } from "./public-alpha-ops.js";
import {
  buildPublicAlphaMonitorAlertPayload,
  buildPublicAlphaMonitorUsage,
  PUBLIC_ALPHA_OPS_ALERT_PREFIX,
  PUBLIC_ALPHA_OPS_RESULT_PREFIX,
  readPublicAlphaMonitorLagThreshold,
  readPublicAlphaMonitorTargetSet,
  resolvePublicAlphaMonitorBaseUrl,
} from "./public-alpha-monitor.js";

async function main() {
  const args = process.argv.slice(2);
  const checkedAt = new Date();
  const baseUrl = resolvePublicAlphaMonitorBaseUrl(args);
  const operatorToken = process.env.OPERATOR_API_TOKEN;
  let summary;

  if (!baseUrl) {
    throw new Error(buildPublicAlphaMonitorUsage());
  }

  if (!operatorToken) {
    throw new Error("Public alpha ops monitor requires OPERATOR_API_TOKEN so daily internal fetch cadence is checked from operator run history.");
  }

  try {
    summary = await verifyPublicAlphaOperations(baseUrl, {
      now: checkedAt,
      dailyFetchLagThresholdDays: readPublicAlphaMonitorLagThreshold(args),
      operatorToken,
      targetSet: readPublicAlphaMonitorTargetSet(args),
    });
    console.log(`${PUBLIC_ALPHA_OPS_RESULT_PREFIX}${JSON.stringify(summary)}`);
    assertPublicAlphaOperationsHealthy(summary);
  } catch (error) {
    console.error(
      `${PUBLIC_ALPHA_OPS_ALERT_PREFIX}${JSON.stringify(buildPublicAlphaMonitorAlertPayload(baseUrl, checkedAt, error, summary))}`,
    );
    throw error;
  }
}

await main();

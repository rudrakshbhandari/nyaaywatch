import { readFlag } from "./cli-flags.js";
import {
  readCourtSlugs,
  resolveSourceReviewStatus,
  verifyHighCourtInternalWaveReadiness,
} from "./high-court-wave-readiness-verification.js";

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = readFlag(args, "--base-url") ?? process.env.BASE_URL;
  const operatorToken = process.env.OPERATOR_API_TOKEN;
  const sourceReviewStatus = resolveSourceReviewStatus(readFlag(args, "--source-review-status"));
  const courtSlugs = readCourtSlugs(readFlag(args, "--court-slugs"));

  if (!baseUrl || !operatorToken) {
    throw new Error(
      "Usage: tsx src/dev/high-court-wave-readiness.ts --base-url <https://nyaaywatch.in> [--court-slugs <himachal,uttar-pradesh>] [--source-review-status <reviewed|queued|all>] with OPERATOR_API_TOKEN in the environment.",
    );
  }

  const summary = await verifyHighCourtInternalWaveReadiness(baseUrl, operatorToken, {
    courtSlugs,
    sourceReviewStatus,
  });
  console.log(JSON.stringify(summary, null, 2));
}

await main();

import { readFlag } from "./cli-flags.js";
import { verifyHighCourtInternalReadiness } from "./high-court-readiness-verification.js";

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = readFlag(args, "--base-url") ?? process.env.BASE_URL;
  const courtSlug = readFlag(args, "--court-slug") ?? process.env.HIGH_COURT_SLUG;
  const operatorToken = process.env.OPERATOR_API_TOKEN;

  if (!baseUrl || !courtSlug || !operatorToken) {
    throw new Error(
      "Usage: tsx src/dev/high-court-readiness.ts --base-url <https://nyaaywatch.in> --court-slug <himachal> with OPERATOR_API_TOKEN in the environment.",
    );
  }

  const summary = await verifyHighCourtInternalReadiness(baseUrl, operatorToken, {
    courtSlug,
  });
  console.log(JSON.stringify(summary, null, 2));
}

await main();

import {
  parseRemoteOperatorCommand,
  resolveRemoteOperatorHighCourtSlug,
  resolveRemoteOperatorSupremeCourtSelection,
  resolveRemoteOperatorStateCode,
  runRemoteOperatorCommand,
} from "./operator-remote-client.js";
import { hasFlag, readBooleanFlag, readFlag, stripFlag } from "./cli-flag-utils.js";

async function main() {
  const args = process.argv.slice(2);
  const commandArgs = ([
    ["--base-url", true],
    ["--state", true],
    ["--state-slug", true],
    ["--high-court", true],
    ["--supreme-court", false],
    ["--connect-host", true],
    ["--connect-port", true],
    ["--timeout-ms", true],
  ] as Array<[string, boolean]>).reduce((currentArgs, [flag, takesValue]) => stripFlag(currentArgs, flag, takesValue), args);
  const timeoutStr = readFlag(args, "--timeout-ms");
  const connectPortStr = readFlag(args, "--connect-port");
  const baseUrl = readFlag(args, "--base-url") ?? process.env.OPERATOR_BASE_URL ?? process.env.BASE_URL;
  const operatorToken = process.env.OPERATOR_API_TOKEN;
  const stateCode = resolveRemoteOperatorStateCode(
    readFlag(args, "--state-slug") ?? readFlag(args, "--state") ?? process.env.STATE_SLUG,
  );
  const highCourtSlug = resolveRemoteOperatorHighCourtSlug(readFlag(args, "--high-court") ?? process.env.HIGH_COURT_SLUG);
  const supremeCourt = resolveRemoteOperatorSupremeCourtSelection(
    hasFlag(args, "--supreme-court") ? readBooleanFlag(args, "--supreme-court") : process.env.SUPREME_COURT_ENABLED,
  );
  const connectHost = readFlag(args, "--connect-host") ?? process.env.OPERATOR_CONNECT_HOST;
  const connectPort = connectPortStr ?? process.env.OPERATOR_CONNECT_PORT;
  const command = parseRemoteOperatorCommand(commandArgs);

  if (!baseUrl || !operatorToken) {
    throw new Error(
      "Usage: tsx src/dev/operator-remote.ts --base-url <https://nyaaywatch.in> [--state <HP|PB|HR|UK|RJ|UP> | --state-slug <state-slug> | --high-court <court-slug>] [--connect-host <alb-dns>] [--connect-port <443>] [--timeout-ms <900000>] <fetch|inspect|publications|publish|replay|rollback> [target-id] [note]",
    );
  }

  if ([Boolean(stateCode), Boolean(highCourtSlug), supremeCourt].filter(Boolean).length > 1) {
    throw new Error("Select either a state, a High Court, or Supreme Court, not multiple targets.");
  }

  const result = await runRemoteOperatorCommand(
    supremeCourt
      ? { ...command, supremeCourt: true }
      : highCourtSlug
      ? { ...command, highCourtSlug }
      : command.name === "fetch" || command.name === "publications"
        ? { ...command, stateCode }
        : command,
    {
      baseUrl,
      operatorToken,
      connectHost,
      connectPort: connectPort ? Number(connectPort) : undefined,
      timeoutMs: timeoutStr ? Number(timeoutStr) : undefined,
    },
  );

  console.log(JSON.stringify(result, null, 2));
}

await main();

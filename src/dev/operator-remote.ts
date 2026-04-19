import {
  parseRemoteOperatorCommand,
  resolveRemoteOperatorHighCourtSlug,
  resolveRemoteOperatorStateCode,
  runRemoteOperatorCommand,
} from "./operator-remote-client.js";

async function main() {
  const args = process.argv.slice(2);
  const commandArgs = ["--base-url", "--state", "--state-slug", "--high-court", "--connect-host", "--connect-port", "--timeout-ms"].reduce(
    (currentArgs, flag) => stripFlag(currentArgs, flag),
    args,
  );
  const timeoutStr = readFlag(args, "--timeout-ms");
  const connectPortStr = readFlag(args, "--connect-port");
  const baseUrl = readFlag(args, "--base-url") ?? process.env.OPERATOR_BASE_URL ?? process.env.BASE_URL;
  const operatorToken = process.env.OPERATOR_API_TOKEN;
  const stateCode = resolveRemoteOperatorStateCode(
    readFlag(args, "--state-slug") ?? readFlag(args, "--state") ?? process.env.STATE_SLUG,
  );
  const highCourtSlug = resolveRemoteOperatorHighCourtSlug(readFlag(args, "--high-court") ?? process.env.HIGH_COURT_SLUG);
  const connectHost = readFlag(args, "--connect-host") ?? process.env.OPERATOR_CONNECT_HOST;
  const connectPort = connectPortStr ?? process.env.OPERATOR_CONNECT_PORT;
  const command = parseRemoteOperatorCommand(commandArgs);

  if (!baseUrl || !operatorToken) {
    throw new Error(
      "Usage: tsx src/dev/operator-remote.ts --base-url <https://nyaaywatch.in> [--state <HP|PB|HR|UK|RJ|UP> | --state-slug <state-slug> | --high-court <court-slug>] [--connect-host <alb-dns>] [--connect-port <443>] [--timeout-ms <900000>] <fetch|inspect|publications|publish|replay|rollback> [target-id] [note]",
    );
  }

  if (stateCode && highCourtSlug) {
    throw new Error("Select either a state or a High Court target, not both.");
  }

  const result = await runRemoteOperatorCommand(
    highCourtSlug
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

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function stripFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  if (index < 0) {
    return args;
  }

  return args.filter((_, currentIndex) => currentIndex !== index && currentIndex !== index + 1);
}

await main();

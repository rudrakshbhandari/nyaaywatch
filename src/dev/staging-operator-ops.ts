import { parseOperatorInvocation, type OperatorInvocation } from "./operator-ops.js";

export const ECS_OPERATOR_RESULT_PREFIX = "NYAAYWATCH_ECS_OPERATOR_RESULT=";
export const ECS_OPERATOR_ERROR_PREFIX = "NYAAYWATCH_ECS_OPERATOR_ERROR=";

export interface StagingOperatorCliOptions {
  stackName: string;
  region: string;
  profile?: string;
  invocation: OperatorInvocation;
}

export function parseStagingOperatorCliOptions(args: string[]): StagingOperatorCliOptions {
  const stackName = readFlag(args, "--stack") ?? "nyaaywatch-staging";
  const region = readFlag(args, "--region") ?? "ap-south-1";
  const profile = readFlag(args, "--profile");
  const invocation = parseOperatorInvocation(stripFlags(args, ["--stack", "--region", "--profile"]));

  return {
    stackName,
    region,
    profile,
    invocation,
  };
}

export function buildStagingOperatorCommand(invocation: OperatorInvocation): string[] {
  const command = ["node", "dist/src/dev/ecs-operator-entrypoint.js"];
  if (invocation.stateCode) {
    command.push("--state", invocation.stateCode);
  }
  if (invocation.highCourtCode) {
    command.push("--high-court", invocation.highCourtCode);
  }
  if (invocation.supremeCourt) {
    command.push("--supreme-court");
  }

  command.push(invocation.command);

  if (invocation.targetId) {
    command.push(invocation.targetId);
  }

  if (invocation.note) {
    command.push(invocation.note);
  }

  return command;
}

export function buildTaskLogStreamName(taskArn: string, containerName: string, prefix = "ecs") {
  const taskId = taskArn.split("/").at(-1);
  if (!taskId) {
    throw new Error(`Unable to derive task id from task ARN: ${taskArn}`);
  }

  return `${prefix}/${containerName}/${taskId}`;
}

export function extractStagingOperatorResult(messages: string[]) {
  const resultLine = [...messages].reverse().find((message) => message.startsWith(ECS_OPERATOR_RESULT_PREFIX));
  if (!resultLine) {
    const errorLine = [...messages].reverse().find((message) => message.startsWith(ECS_OPERATOR_ERROR_PREFIX));
    if (errorLine) {
      throw new Error(errorLine.slice(ECS_OPERATOR_ERROR_PREFIX.length));
    }

    throw new Error("The ECS operator task finished without emitting a result payload.");
  }

  return JSON.parse(resultLine.slice(ECS_OPERATOR_RESULT_PREFIX.length)) as unknown;
}

function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function stripFlags(args: string[], flags: string[]) {
  const indexesToSkip = new Set<number>();

  for (const flag of flags) {
    const index = args.findIndex((value) => value === flag);
    if (index >= 0) {
      indexesToSkip.add(index);
      indexesToSkip.add(index + 1);
    }
  }

  return args.filter((_, index) => !indexesToSkip.has(index));
}

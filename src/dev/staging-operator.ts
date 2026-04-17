import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  buildStagingOperatorCommand,
  buildTaskLogStreamName,
  extractStagingOperatorResult,
  parseStagingOperatorCliOptions,
} from "./staging-operator-ops.js";

const execFileAsync = promisify(execFile);
const AWS_MAX_BUFFER = 10 * 1024 * 1024;

interface StackOutputs {
  ClusterName: string;
  LogGroupName: string;
}

interface ServiceDescription {
  serviceName: string;
  taskDefinition: string;
  networkConfiguration: {
    awsvpcConfiguration: {
      subnets: string[];
      securityGroups: string[];
      assignPublicIp?: "ENABLED" | "DISABLED";
    };
  };
}

interface TaskDefinitionDescription {
  containerName: string;
  logStreamPrefix: string;
}

interface TaskStatus {
  taskArn: string;
  stoppedReason?: string;
  containers: Array<{
    exitCode?: number;
    reason?: string;
  }>;
}

async function main() {
  const options = parseStagingOperatorCliOptions(process.argv.slice(2));
  const stackOutputs = await fetchStackOutputs(options.stackName, options.region, options.profile);
  const serviceName = await fetchServiceName(options.stackName, options.region, options.profile);
  const service = await fetchServiceDescription(stackOutputs.ClusterName, serviceName, options.region, options.profile);
  const taskDefinition = await fetchTaskDefinition(service.taskDefinition, options.region, options.profile);

  const taskArn = await runOperatorTask(
    {
      clusterName: stackOutputs.ClusterName,
      taskDefinitionArn: service.taskDefinition,
      containerName: taskDefinition.containerName,
      command: buildStagingOperatorCommand(options.invocation),
      networkConfiguration: service.networkConfiguration.awsvpcConfiguration,
    },
    options.region,
    options.profile,
  );

  await waitForTaskToStop(stackOutputs.ClusterName, taskArn, options.region, options.profile);
  const taskStatus = await fetchTaskStatus(stackOutputs.ClusterName, taskArn, options.region, options.profile);
  const logStreamName = buildTaskLogStreamName(taskArn, taskDefinition.containerName, taskDefinition.logStreamPrefix);
  const logMessages = await fetchTaskLogMessages(
    stackOutputs.LogGroupName,
    logStreamName,
    options.region,
    options.profile,
  );

  const exitCode = taskStatus.containers[0]?.exitCode ?? 1;
  if (exitCode !== 0) {
    const reason = taskStatus.containers[0]?.reason ?? taskStatus.stoppedReason ?? "unknown";
    throw new Error(
      `The staging operator task exited with code ${exitCode}: ${reason}\n${renderRecentLogExcerpt(logMessages)}`,
    );
  }

  const result = extractStagingOperatorResult(logMessages);
  console.log(JSON.stringify(result, null, 2));
}

async function fetchStackOutputs(stackName: string, region: string, profile?: string) {
  const describedStacks = await awsJson<{ Stacks: Array<{ Outputs?: Array<{ OutputKey: string; OutputValue: string }> }> }>(
    ["cloudformation", "describe-stacks", "--stack-name", stackName, "--region", region, "--output", "json"],
    profile,
  );
  const resolvedOutputs = describedStacks.Stacks[0]?.Outputs ?? [];
  const outputMap = Object.fromEntries(resolvedOutputs.map((output) => [output.OutputKey, output.OutputValue])) as Partial<StackOutputs>;

  if (!outputMap.ClusterName || !outputMap.LogGroupName) {
    throw new Error(`Stack ${stackName} is missing the ClusterName or LogGroupName outputs.`);
  }

  return {
    ClusterName: outputMap.ClusterName,
    LogGroupName: outputMap.LogGroupName,
  } satisfies StackOutputs;
}

async function fetchServiceName(stackName: string, region: string, profile?: string) {
  const response = await awsJson<{ StackResourceDetail?: { PhysicalResourceId?: string } }>(
    [
      "cloudformation",
      "describe-stack-resource",
      "--stack-name",
      stackName,
      "--logical-resource-id",
      "Service",
      "--region",
      region,
      "--output",
      "json",
    ],
    profile,
  );
  const serviceName = response.StackResourceDetail?.PhysicalResourceId;
  if (!serviceName) {
    throw new Error(`Stack ${stackName} does not expose an ECS Service resource.`);
  }

  return serviceName;
}

async function fetchServiceDescription(clusterName: string, serviceName: string, region: string, profile?: string) {
  const response = await awsJson<{ services?: ServiceDescription[]; failures?: Array<{ reason?: string }> }>(
    ["ecs", "describe-services", "--cluster", clusterName, "--services", serviceName, "--region", region, "--output", "json"],
    profile,
  );
  const service = response.services?.[0];
  if (!service) {
    const failureReason = response.failures?.[0]?.reason;
    throw new Error(`Unable to describe ECS service ${serviceName}.${failureReason ? ` ${failureReason}` : ""}`);
  }

  return service;
}

async function fetchTaskDefinition(taskDefinitionArn: string, region: string, profile?: string) {
  const response = await awsJson<{
    taskDefinition?: {
      containerDefinitions?: Array<{
        name?: string;
        logConfiguration?: {
          options?: Record<string, string>;
        };
      }>;
    };
  }>(["ecs", "describe-task-definition", "--task-definition", taskDefinitionArn, "--region", region, "--output", "json"], profile);
  const container = response.taskDefinition?.containerDefinitions?.[0];
  const containerName = container?.name;
  const logStreamPrefix = container?.logConfiguration?.options?.["awslogs-stream-prefix"];

  if (!containerName || !logStreamPrefix) {
    throw new Error(`Task definition ${taskDefinitionArn} is missing container or awslogs configuration.`);
  }

  return {
    containerName,
    logStreamPrefix,
  } satisfies TaskDefinitionDescription;
}

async function runOperatorTask(
  input: {
    clusterName: string;
    taskDefinitionArn: string;
    containerName: string;
    command: string[];
    networkConfiguration: ServiceDescription["networkConfiguration"]["awsvpcConfiguration"];
  },
  region: string,
  profile?: string,
) {
  const overrides = {
    containerOverrides: [
      {
        name: input.containerName,
        command: input.command,
      },
    ],
  };
  const networkConfiguration = {
    awsvpcConfiguration: {
      subnets: input.networkConfiguration.subnets,
      securityGroups: input.networkConfiguration.securityGroups,
      assignPublicIp: input.networkConfiguration.assignPublicIp ?? "ENABLED",
    },
  };
  const response = await awsJson<{ tasks?: Array<{ taskArn?: string }>; failures?: Array<{ reason?: string; detail?: string }> }>(
    [
      "ecs",
      "run-task",
      "--cluster",
      input.clusterName,
      "--task-definition",
      input.taskDefinitionArn,
      "--launch-type",
      "FARGATE",
      "--network-configuration",
      JSON.stringify(networkConfiguration),
      "--overrides",
      JSON.stringify(overrides),
      "--started-by",
      "nyaaywatch-operator-staging",
      "--region",
      region,
      "--output",
      "json",
    ],
    profile,
  );
  const taskArn = response.tasks?.[0]?.taskArn;
  if (!taskArn) {
    const failure = response.failures?.[0];
    throw new Error(
      `Unable to start staging operator task.${failure?.reason ? ` ${failure.reason}` : ""}${failure?.detail ? ` ${failure.detail}` : ""}`,
    );
  }

  return taskArn;
}

async function waitForTaskToStop(clusterName: string, taskArn: string, region: string, profile?: string) {
  await awsVoid(["ecs", "wait", "tasks-stopped", "--cluster", clusterName, "--tasks", taskArn, "--region", region], profile);
}

async function fetchTaskStatus(clusterName: string, taskArn: string, region: string, profile?: string) {
  const response = await awsJson<{ tasks?: TaskStatus[] }>(
    ["ecs", "describe-tasks", "--cluster", clusterName, "--tasks", taskArn, "--region", region, "--output", "json"],
    profile,
  );
  const task = response.tasks?.[0];
  if (!task) {
    throw new Error(`Unable to describe ECS task ${taskArn}.`);
  }

  return task;
}

async function fetchTaskLogMessages(logGroupName: string, logStreamName: string, region: string, profile?: string) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const response = await awsJson<{ events?: Array<{ message?: string }> }>(
        [
          "logs",
          "get-log-events",
          "--log-group-name",
          logGroupName,
          "--log-stream-name",
          logStreamName,
          "--start-from-head",
          "--region",
          region,
          "--output",
          "json",
        ],
        profile,
      );

      const messages =
        response.events?.map((event) => event.message).filter((message): message is string => Boolean(message)) ?? [];
      if (messages.length > 0 || attempt === 10) {
        return messages;
      }
    } catch (error) {
      if (attempt === 10) {
        throw error;
      }
    }

    await sleep(2_000);
  }

  return [];
}

function renderRecentLogExcerpt(messages: string[]) {
  if (messages.length === 0) {
    return "No task logs were captured.";
  }

  return messages.slice(-20).join("\n");
}

async function awsJson<T>(args: string[], profile?: string): Promise<T> {
  const { stdout } = await execAws(args, profile);
  return JSON.parse(stdout) as T;
}

async function awsVoid(args: string[], profile?: string) {
  await execAws(args, profile);
}

async function execAws(args: string[], profile?: string) {
  const awsArgs = profile ? ["--profile", profile, ...args] : args;
  return execFileAsync("aws", awsArgs, { maxBuffer: AWS_MAX_BUFFER });
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

await main();

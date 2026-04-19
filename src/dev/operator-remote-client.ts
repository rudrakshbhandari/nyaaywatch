import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import { getStateProfileByCodeOrSlug } from "../geographies.js";
import { getHighCourtProfileBySlug } from "../high-courts.js";

type RemoteOperatorCommand =
  | { name: "fetch"; targetId?: undefined; note?: string; stateCode?: string }
  | { name: "publications"; targetId?: undefined; note?: undefined; stateCode?: string }
  | { name: "inspect"; targetId: string; note?: undefined; stateCode?: undefined }
  | { name: "publish"; targetId: string; note?: string; stateCode?: undefined }
  | { name: "replay"; targetId: string; note?: string; stateCode?: undefined }
  | { name: "rollback"; targetId: string; note?: string; stateCode?: undefined }
  | { name: "fetch"; targetId?: undefined; note?: string; highCourtSlug: string }
  | { name: "publications"; targetId?: undefined; note?: undefined; highCourtSlug: string }
  | { name: "inspect"; targetId: string; note?: undefined; highCourtSlug: string }
  | { name: "publish"; targetId: string; note?: string; highCourtSlug: string }
  | { name: "replay"; targetId: string; note?: string; highCourtSlug: string }
  | { name: "rollback"; targetId: string; note?: string; highCourtSlug: string };

export interface RemoteOperatorRequestOptions {
  baseUrl: string;
  operatorToken: string;
  connectHost?: string;
  connectPort?: number;
  timeoutMs?: number;
}

interface RemoteOperatorRequestTarget {
  url: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
}

export async function runRemoteOperatorCommand(
  command: RemoteOperatorCommand,
  options: RemoteOperatorRequestOptions,
): Promise<unknown> {
  const target = buildOperatorRequestTarget(command, options.baseUrl);
  return requestJson(target.url, {
    operatorToken: options.operatorToken,
    connectHost: options.connectHost,
    connectPort: options.connectPort,
    timeoutMs: options.timeoutMs,
    method: target.method,
    body: target.body,
  });
}

export function resolveRemoteOperatorStateCode(selected?: string) {
  const trimmed = selected?.trim();
  if (!trimmed) {
    return undefined;
  }

  const profile = getStateProfileByCodeOrSlug(trimmed);
  if (!profile) {
    throw new Error(`Unsupported state selector: ${trimmed}`);
  }

  return profile.stateCode;
}

export function resolveRemoteOperatorHighCourtSlug(selected?: string) {
  const trimmed = selected?.trim();
  if (!trimmed) {
    return undefined;
  }

  const profile = getHighCourtProfileBySlug(trimmed);
  if (!profile) {
    throw new Error(`Unsupported High Court selector: ${trimmed}`);
  }

  return profile.courtSlug;
}

export function parseRemoteOperatorCommand(args: string[]): RemoteOperatorCommand {
  const command = args[0];
  const targetId = args[1];
  const note = args.slice(2).join(" ").trim() || undefined;

  if (!command) {
    throw new Error("A remote operator command is required.");
  }

  if (command === "fetch") {
    return { name: "fetch", note: args.slice(1).join(" ").trim() || undefined };
  }

  if (command === "publications") {
    return { name: "publications" };
  }

  if (command === "inspect" && targetId) {
    return { name: "inspect", targetId };
  }

  if (command === "publish" && targetId) {
    return { name: "publish", targetId, note };
  }

  if (command === "replay" && targetId) {
    return { name: "replay", targetId, note };
  }

  if (command === "rollback" && targetId) {
    return { name: "rollback", targetId, note };
  }

  throw new Error(`Unsupported or incomplete remote operator command: ${command}`);
}

function buildOperatorRequestTarget(command: RemoteOperatorCommand, baseUrl: string): RemoteOperatorRequestTarget {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const highCourtBase = "highCourtSlug" in command ? `${normalizedBaseUrl}/operator/high-courts/${encodeURIComponent(command.highCourtSlug)}` : null;
  const stateCode = "stateCode" in command ? command.stateCode : undefined;

  if (command.name === "fetch") {
    return {
      url: highCourtBase ? `${highCourtBase}/runs/fetch` : `${normalizedBaseUrl}/operator/runs/fetch`,
      method: "POST",
      body: highCourtBase
        ? command.note
          ? { note: command.note }
          : undefined
        : {
            ...(command.note ? { note: command.note } : {}),
            ...(stateCode ? { stateCode } : {}),
          },
    };
  }

  if (command.name === "publications") {
    const search = highCourtBase ? "" : stateCode ? `?stateCode=${encodeURIComponent(stateCode)}` : "";
    return {
      url: highCourtBase ? `${highCourtBase}/publications` : `${normalizedBaseUrl}/operator/publications${search}`,
      method: "GET",
      body: undefined,
    };
  }

  if (command.name === "inspect") {
    return {
      url: highCourtBase
        ? `${highCourtBase}/runs/${encodeURIComponent(command.targetId)}`
        : `${normalizedBaseUrl}/operator/runs/${encodeURIComponent(command.targetId)}`,
      method: "GET",
      body: undefined,
    };
  }

  if (command.name === "publish") {
    return {
      url: highCourtBase
        ? `${highCourtBase}/runs/${encodeURIComponent(command.targetId)}/publish`
        : `${normalizedBaseUrl}/operator/runs/${encodeURIComponent(command.targetId)}/publish`,
      method: "POST",
      body: command.note ? { note: command.note } : undefined,
    };
  }

  if (command.name === "replay") {
    return {
      url: highCourtBase
        ? `${highCourtBase}/runs/${encodeURIComponent(command.targetId)}/replay`
        : `${normalizedBaseUrl}/operator/runs/${encodeURIComponent(command.targetId)}/replay`,
      method: "POST",
      body: command.note ? { note: command.note } : undefined,
    };
  }

  return {
    url: highCourtBase
      ? `${highCourtBase}/publications/${encodeURIComponent(command.targetId)}/rollback`
      : `${normalizedBaseUrl}/operator/publications/${encodeURIComponent(command.targetId)}/rollback`,
    method: "POST",
    body: command.note ? { note: command.note } : undefined,
  };
}

async function requestJson(
  url: string,
  input: {
    operatorToken: string;
    connectHost?: string;
    connectPort?: number;
    timeoutMs?: number;
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  },
) {
  const response = input.connectHost
    ? await requestJsonWithOriginOverride(url, {
        ...input,
        connectHost: input.connectHost,
      })
    : await requestJsonWithFetch(url, input);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Operator request failed for ${url}: ${response.statusCode} ${response.body}`);
  }

  if (response.body.length === 0) {
    return null;
  }

  return JSON.parse(response.body) as unknown;
}

async function requestJsonWithFetch(
  url: string,
  input: {
    operatorToken: string;
    timeoutMs?: number;
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  },
) {
  const response = await fetch(url, {
    method: input.method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-operator-token": input.operatorToken,
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
    signal: AbortSignal.timeout(input.timeoutMs ?? 15 * 60 * 1000),
  });

  return {
    statusCode: response.status,
    body: await response.text(),
  };
}

async function requestJsonWithOriginOverride(
  urlString: string,
  input: {
    operatorToken: string;
    connectHost: string;
    connectPort?: number;
    timeoutMs?: number;
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  },
) {
  const url = new URL(urlString);
  const isHttps = url.protocol === "https:";
  const requestImpl = isHttps ? httpsRequest : httpRequest;
  const requestBody = input.body ? JSON.stringify(input.body) : undefined;
  const port = input.connectPort ?? Number(url.port || (isHttps ? "443" : "80"));

  return await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    const request = requestImpl(
      {
        hostname: input.connectHost,
        method: input.method,
        path: `${url.pathname}${url.search}`,
        port,
        servername: isHttps ? url.hostname : undefined,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "content-length": requestBody ? Buffer.byteLength(requestBody) : 0,
          host: url.host,
          "x-operator-token": input.operatorToken,
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 500,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    request.on("error", reject);
    request.setTimeout(input.timeoutMs ?? 15 * 60 * 1000, () => {
      request.destroy(new Error(`Operator request timed out after ${input.timeoutMs ?? 15 * 60 * 1000}ms.`));
    });

    if (requestBody) {
      request.write(requestBody);
    }
    request.end();
  });
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error("A base URL is required.");
  }

  return trimmed.replace(/\/+$/, "");
}

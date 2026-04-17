import { createServer, type IncomingMessage, type Server } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { runRemoteOperatorCommand } from "../src/dev/operator-remote-client.js";

describe("remote operator client", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const server = servers.pop();
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("sends state-scoped fetch requests through the base URL", async () => {
    let receivedBody = "";
    let receivedToken = "";
    const server = createServer((request, response) => {
      receivedToken = request.headers["x-operator-token"]?.toString() ?? "";
      request.on("data", (chunk) => {
        receivedBody += chunk.toString();
      });
      request.on("end", () => {
        response.setHeader("content-type", "application/json");
        response.statusCode = 201;
        response.end(JSON.stringify({ ok: true }));
      });
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected a TCP address.");
    }

    const result = await runRemoteOperatorCommand(
      { name: "fetch", note: "UP fetch", stateCode: "UP" },
      {
        baseUrl: `http://127.0.0.1:${address.port}`,
        operatorToken: "remote-operator-token",
      },
    );

    expect(result).toEqual({ ok: true });
    expect(receivedToken).toBe("remote-operator-token");
    expect(JSON.parse(receivedBody)).toEqual({
      note: "UP fetch",
      stateCode: "UP",
    });
  });

  it("preserves the canonical host header when connecting to an override host", async () => {
    let requestSummary: { host: string; path: string; token: string } | null = null;
    const server = createServer((request, response) => {
      requestSummary = summarizeRequest(request);
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ publications: [] }));
    });
    servers.push(server);

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected a TCP address.");
    }

    const result = await runRemoteOperatorCommand(
      { name: "publications", stateCode: "UP" },
      {
        baseUrl: "http://nyaaywatch.in",
        operatorToken: "remote-operator-token",
        connectHost: "127.0.0.1",
        connectPort: address.port,
      },
    );

    expect(result).toEqual({ publications: [] });
    expect(requestSummary).toEqual({
      host: "nyaaywatch.in",
      path: "/operator/publications?stateCode=UP",
      token: "remote-operator-token",
    });
  });
});

function summarizeRequest(request: IncomingMessage) {
  return {
    host: request.headers.host ?? "",
    path: request.url ?? "",
    token: request.headers["x-operator-token"]?.toString() ?? "",
  };
}

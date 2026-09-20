import { describe, expect, it, vi } from "vitest";

import { createMigrationWriteFreezeMiddleware } from "../src/api/app.js";

function createResponse() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

describe("migration write freeze", () => {
  it("rejects mutating requests while preserving read-only requests", () => {
    const middleware = createMigrationWriteFreezeMiddleware(true);
    const next = vi.fn();
    const blocked = createResponse();

    middleware({ method: "POST" } as never, blocked as never, next);

    expect(blocked.status).toHaveBeenCalledWith(503);
    expect(blocked.json).toHaveBeenCalledWith({ error: "Writes are temporarily paused for migration." });
    expect(next).not.toHaveBeenCalled();

    const allowed = createResponse();
    middleware({ method: "GET" } as never, allowed as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(allowed.status).not.toHaveBeenCalled();
  });

  it("rejects state-changing newsletter GET routes", () => {
    const middleware = createMigrationWriteFreezeMiddleware(true);
    const next = vi.fn();
    const blocked = createResponse();

    middleware({ method: "GET", path: "/subscribe/confirm/token" } as never, blocked as never, next);

    expect(blocked.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects HEAD requests that Express would dispatch through mutating GET routes", () => {
    const middleware = createMigrationWriteFreezeMiddleware(true);
    const next = vi.fn();
    const blocked = createResponse();

    middleware({ method: "HEAD", path: "/unsubscribe/token" } as never, blocked as never, next);

    expect(blocked.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});

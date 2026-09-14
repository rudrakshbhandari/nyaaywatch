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
});

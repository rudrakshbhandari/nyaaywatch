import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestApp, createTestContext, seedTestSnapshot } from "./helpers.js";

describe("Subscribe and RSS routes", () => {
  const pools: Array<{ end: () => Promise<void> }> = [];

  afterEach(async () => {
    while (pools.length > 0) {
      await pools.pop()?.end();
    }
  });

  it("GET /subscribe renders the subscription form", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    const res = await request(app).get("/subscribe");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Get snapshot digests by email");
    expect(res.text).toContain('action="/subscribe"');
    expect(res.text).toContain('type="email"');
  });

  it("POST /subscribe with a valid email shows pending-confirmation page", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    const res = await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "test@example.com", scope: "HP" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Confirmation sent");
    expect(res.text).toContain("test@example.com");
  });

  it("POST /subscribe with an invalid email shows an inline error", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    const res = await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "not-an-email", scope: "HP" });

    expect(res.status).toBe(400);
    expect(res.text).toContain("valid email");
  });

  it("POST /subscribe with an empty email shows an inline error", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    const res = await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "", scope: "HP" });

    expect(res.status).toBe(400);
    expect(res.text).toContain("valid email");
  });

  it("POST /subscribe twice with the same email returns already-confirmed page", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    // First subscribe
    const first = await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "dup@example.com", scope: "HP" });
    expect(first.status).toBe(200);

    // Manually confirm the subscription so second subscribe sees alreadyConfirmed=true
    await context.pool.query(
      `UPDATE newsletter_subscriptions SET confirmed = TRUE, confirmed_at = NOW() WHERE email = $1`,
      ["dup@example.com"],
    );

    // Second subscribe
    const second = await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "dup@example.com", scope: "HP" });
    expect(second.status).toBe(200);
    expect(second.text).toContain("already subscribed");
  });

  it("GET /subscribe/confirm/:token confirms a pending subscription", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    // Create a subscription
    await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "confirm@example.com", scope: "HP" });

    // Fetch the token from DB
    const row = await context.pool.query<{ token: string }>(
      `SELECT token FROM newsletter_subscriptions WHERE email = $1`,
      ["confirm@example.com"],
    );
    const token = row.rows[0]!.token;

    const confirmRes = await request(app).get(`/subscribe/confirm/${token}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.text).toContain("Subscription confirmed");

    // Confirm the DB row is now confirmed
    const check = await context.pool.query<{ confirmed: boolean }>(
      `SELECT confirmed FROM newsletter_subscriptions WHERE email = $1`,
      ["confirm@example.com"],
    );
    expect(check.rows[0]!.confirmed).toBe(true);
  });

  it("GET /unsubscribe/:token unsubscribes and shows removed page", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    // Create and confirm a subscription
    await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "unsub@example.com", scope: "HP" });

    const row = await context.pool.query<{ token: string }>(
      `SELECT token FROM newsletter_subscriptions WHERE email = $1`,
      ["unsub@example.com"],
    );
    const token = row.rows[0]!.token;

    const unsubRes = await request(app).get(`/unsubscribe/${token}`);
    expect(unsubRes.status).toBe(200);
    expect(unsubRes.text).toContain("removed");

    // Confirm the DB row is unsubscribed
    const check = await context.pool.query<{ unsubscribed_at: string | null }>(
      `SELECT unsubscribed_at FROM newsletter_subscriptions WHERE email = $1`,
      ["unsub@example.com"],
    );
    expect(check.rows[0]!.unsubscribed_at).not.toBeNull();
  });

  it("requires a new confirmation before reactivating an unsubscribed email", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "resub@example.com", scope: "HP" });

    await context.pool.query(
      `UPDATE newsletter_subscriptions
       SET confirmed = TRUE, confirmed_at = NOW()
       WHERE email = $1`,
      ["resub@example.com"],
    );

    const existing = await context.pool.query<{ token: string }>(
      `SELECT token FROM newsletter_subscriptions WHERE email = $1`,
      ["resub@example.com"],
    );
    const oldToken = existing.rows[0]!.token;

    await request(app).get(`/unsubscribe/${oldToken}`);

    const resubscribe = await request(app)
      .post("/subscribe")
      .type("form")
      .send({ email: "resub@example.com", scope: "HP" });

    expect(resubscribe.status).toBe(200);
    expect(resubscribe.text).toContain("Confirmation sent");

    const check = await context.pool.query<{ token: string; confirmed: boolean; unsubscribed_at: string | null }>(
      `SELECT token, confirmed, unsubscribed_at FROM newsletter_subscriptions WHERE email = $1`,
      ["resub@example.com"],
    );
    expect(check.rows[0]!.token).not.toBe(oldToken);
    expect(check.rows[0]!.confirmed).toBe(false);
    expect(check.rows[0]!.unsubscribed_at).toBeNull();
  });

  it("redacts newsletter tokens from structured request logs", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );
    const infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      await request(app)
        .post("/subscribe")
        .type("form")
        .send({ email: "redacted@example.com", scope: "HP" });

      const row = await context.pool.query<{ token: string }>(
        `SELECT token FROM newsletter_subscriptions WHERE email = $1`,
        ["redacted@example.com"],
      );
      const token = row.rows[0]!.token;

      await request(app).get(`/subscribe/confirm/${token}`);
      await request(app).get(`/unsubscribe/${token}`);

      const messages = infoSpy.mock.calls.map((call) => String(call[0]));
      expect(messages.join("\n")).not.toContain(token);
      expect(messages.some((message) => message.includes("/subscribe/confirm/[redacted]"))).toBe(true);
      expect(messages.some((message) => message.includes("/unsubscribe/[redacted]"))).toBe(true);
    } finally {
      infoSpy.mockRestore();
    }
  });

  it("GET /states/himachal-pradesh/feed.xml returns valid RSS 2.0", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    await seedTestSnapshot(context.service);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    const res = await request(app).get("/states/himachal-pradesh/feed.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/rss\+xml/);
    expect(res.text).toContain('<?xml version="1.0"');
    expect(res.text).toContain('<rss version="2.0"');
    expect(res.text).toContain("NyaayWatch — Himachal Pradesh");
    expect(res.text).toContain("<item>");
  });

  it("GET /states/unknown-state/feed.xml returns 404", async () => {
    const context = await createTestContext();
    pools.push(context.pool);
    const app = createTestApp(
      context.config,
      context.service,
      context.publicServices,
      context.highCourtServices,
      context.supremeCourtService,
      context.pool,
    );

    const res = await request(app).get("/states/nonexistent-state/feed.xml");
    expect(res.status).toBe(404);
  });
});

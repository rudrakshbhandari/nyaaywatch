import { expect, test } from "@playwright/test";

test("citizen flow loads the homepage, district workspace, and district permalink", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "The courts, in the latest published snapshots." })).toBeVisible();
  await expect(page.locator(".national-hero__accountability")).toContainText(/Captured|Source snapshot/);
  await expect(page.getByRole("link", { name: /View Supreme Court/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Himachal lower-court overview/i })).toBeVisible();

  await page.getByRole("link", { name: /Inspect districts/i }).click();
  await expect(page).toHaveURL(/\/districts$/);
  await expect(page.getByRole("heading", { name: "Scan the districts under the most pressure." })).toBeVisible();
  await expect(page.getByLabel("View")).toBeVisible();

  await page.getByRole("link", { name: "Kangra" }).first().click();
  await expect(page).toHaveURL(/\/districts\/kangra$/);
  await expect(page.getByRole("heading", { name: "Kangra" })).toBeVisible();
  await expect(page.getByText("Published district history")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download district history CSV" })).toBeVisible();
});

test("reporter flow reaches methodology and public download surfaces from district context", async ({ page }) => {
  await page.goto("/districts/kangra");

  await expect(page.getByText("Durable citation surface")).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Data" }).click();

  await expect(page).toHaveURL(/\/data$/);
  await expect(page.getByRole("heading", { name: "Download exactly what the public site is showing." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download CSV" })).toBeVisible();

  await page.getByRole("navigation").getByRole("link", { name: "Method" }).click();
  await expect(page).toHaveURL(/\/methodology$/);
  await expect(page.getByRole("heading", { name: "Every public number comes from one stored published snapshot." })).toBeVisible();
  await expect(page.getByText("How the public metrics are derived")).toBeVisible();
  await expect(page.getByText("Published methodology and snapshot lineage")).toBeVisible();
});

test("developer parity flow matches homepage toplines to the published stats API", async ({ page, request }) => {
  const statsResponse = await request.get("/v1/supreme-court/stats");
  expect(statsResponse.ok()).toBeTruthy();
  const statsPayload = await statsResponse.json();

  await page.goto("/");

  await expect(page.getByText(statsPayload.stats.pendingTotalCases.toLocaleString("en-IN"))).toBeVisible();
  await expect(page.getByText(statsPayload.stats.pendingRegisteredCases.toLocaleString("en-IN"))).toBeVisible();
  await expect(page.getByText(statsPayload.stats.disposedLastMonthTotalCases.toLocaleString("en-IN"))).toBeVisible();
});

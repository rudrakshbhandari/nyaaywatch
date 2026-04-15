import { expect, test } from "@playwright/test";

test("citizen flow loads the homepage, district workspace, and district permalink", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "See where cases are getting stuck in Himachal Pradesh." })).toBeVisible();
  await expect(page.getByText("Published trust metadata")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the full district index" })).toBeVisible();

  await page.getByRole("link", { name: "Open the full district index" }).click();
  await expect(page).toHaveURL(/\/districts$/);
  await expect(page.getByRole("heading", { name: "Scan the districts under the most pressure." })).toBeVisible();
  await expect(page.getByText("Districts currently on the watchlist")).toBeVisible();

  await page.getByRole("link", { name: "Kangra" }).first().click();
  await expect(page).toHaveURL(/\/districts\/kangra$/);
  await expect(page.getByRole("heading", { name: "Kangra" })).toBeVisible();
  await expect(page.getByText("Published district history")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download district history CSV" })).toBeVisible();
});

test("reporter flow reaches methodology and public download surfaces from district context", async ({ page }) => {
  await page.goto("/districts/kangra");

  await expect(page.getByText("Durable citation surface")).toBeVisible();
  await page.getByRole("link", { name: "Data" }).click();

  await expect(page).toHaveURL(/\/data$/);
  await expect(page.getByRole("heading", { name: "Download exactly what the public site is showing." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Statewide district CSV" })).toBeVisible();

  await page.getByRole("link", { name: "Methodology" }).click();
  await expect(page).toHaveURL(/\/methodology$/);
  await expect(page.getByRole("heading", { name: "Every public number comes from one stored published snapshot." })).toBeVisible();
  await expect(page.getByText("How the public metrics are derived")).toBeVisible();
  await expect(page.getByText("Published methodology and snapshot lineage")).toBeVisible();
});

test("developer parity flow matches homepage toplines to the published stats API", async ({ page, request }) => {
  const statsResponse = await request.get("/v1/stats/himachal");
  expect(statsResponse.ok()).toBeTruthy();
  const statsPayload = await statsResponse.json();

  await page.goto("/");

  await expect(page.getByRole("heading", { name: statsPayload.stats.pendingCases.toLocaleString("en-IN") })).toBeVisible();
  await expect(page.getByRole("heading", { name: `${statsPayload.stats.disposalRate.toFixed(1)}%` })).toBeVisible();
  await expect(page.getByRole("heading", { name: `${statsPayload.stats.medianCaseAgeDays} days` })).toBeVisible();
});

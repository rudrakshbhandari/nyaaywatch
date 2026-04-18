import { expect, test } from "@playwright/test";
import { formatLakh } from "../../src/api/home/view-model.js";

test("citizen flow loads the homepage, district workspace, and district permalink", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "How long is the wait for justice in Himachal Pradesh?" })).toBeVisible();
  await expect(page.getByText(/Numbers published/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Inspect the districts/i })).toBeVisible();

  await page.getByRole("link", { name: /Inspect the districts/i }).click();
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
  const statsResponse = await request.get("/v1/stats/himachal");
  expect(statsResponse.ok()).toBeTruthy();
  const statsPayload = await statsResponse.json();

  await page.goto("/");

  await expect(page.getByText(formatLakh(statsPayload.stats.pendingCases))).toBeVisible();
  await expect(page.getByText(`${statsPayload.stats.disposalRate.toFixed(0)}/ 100`)).toBeVisible();
  await expect(page.getByText(`~${Math.round(statsPayload.stats.medianCaseAgeDays / 30)}mo`)).toBeVisible();
});

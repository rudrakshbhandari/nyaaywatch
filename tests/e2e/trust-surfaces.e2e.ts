import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TRUST_ROUTES = ["/", "/districts", "/districts/kangra", "/data", "/methodology"];

test.describe("responsive trust surfaces", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps district scanning and trust metadata usable on mobile", async ({ page }) => {
    await page.goto("/districts?view=flagged");

    await expect(page.getByRole("heading", { name: "District workspace" })).toBeVisible();
    await expect(page.getByText("Published trust metadata")).toBeVisible();
    await expect(page.getByLabel("Search districts")).toBeVisible();
    await expect(page.getByRole("link", { name: "Kangra" }).first()).toBeVisible();

    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsViewport).toBe(true);
  });
});

test.describe("accessibility smoke", () => {
  test("exposes navigation, headings, and citation/download actions to keyboard users", async ({ page }) => {
    await page.goto("/districts/kangra");

    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Kangra" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download district history CSV" })).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Districts" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Data" })).toBeFocused();
  });

  for (const route of TRUST_ROUTES) {
    test(`has no critical axe violations on ${route}`, async ({ page }) => {
      await page.goto(route);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TRUST_ROUTES = ["/", "/supreme-court", "/high-courts", "/districts", "/districts/kangra", "/data", "/methodology"];
const RESPONSIVE_ROUTES = [
  "/",
  "/supreme-court",
  "/supreme-court/data",
  "/supreme-court/methodology",
  "/supreme-court/api",
  "/high-courts",
  "/high-courts/himachal",
  "/high-courts/himachal/data",
  "/high-courts/himachal/methodology",
  "/high-courts/himachal/api",
  "/states/himachal",
  "/states/himachal/data",
  "/states/himachal/methodology",
  "/states/himachal/api",
  "/districts",
  "/data",
  "/methodology",
  "/api",
];

test.describe("responsive trust surfaces", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps district scanning and trust metadata usable on mobile", async ({ page }) => {
    await page.goto("/districts?view=flagged");

    await expect(page.getByRole("heading", { name: "Scan the districts under the most pressure." })).toBeVisible();
    await expect(page.getByText(/Numbers published/i)).toBeVisible();
    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.getByRole("link", { name: "Kangra" }).first()).toBeVisible();

    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsViewport).toBe(true);
  });
});

test.describe("public layout overflow", () => {
  for (const route of RESPONSIVE_ROUTES) {
    test(`keeps ${route} within the viewport on desktop and mobile`, async ({ page }) => {
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(route);

        const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(fitsViewport).toBe(true);
      }
    });
  }

  test("uses the wide High Courts directory frame on large desktop", async ({ page }) => {
    await page.setViewportSize({ width: 2048, height: 1200 });
    await page.goto("/high-courts");

    await expect(page.getByRole("heading", { name: "India's High Courts, ranked by pressure" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Published High Court snapshots" })).toBeVisible();

    const layout = await page.evaluate(() => {
      const main = document.querySelector("main")?.getBoundingClientRect();
      const firstCard = document.querySelector(".hc-card")?.getBoundingClientRect();

      return {
        mainLeft: main?.left ?? 0,
        mainWidth: main?.width ?? 0,
        firstCardWidth: firstCard?.width ?? 0,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.mainLeft).toBeLessThanOrEqual(170);
    expect(layout.mainWidth).toBeGreaterThanOrEqual(1700);
    expect(layout.firstCardWidth).toBeGreaterThanOrEqual(820);
  });

  test("keeps High Court metric numbers and API method badges readable", async ({ page }) => {
    await page.setViewportSize({ width: 2048, height: 1200 });
    await page.goto("/high-courts");

    const highCourtCardMetrics = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".hc-card .stat-tile__value")).map((value) => {
        const rect = value.getBoundingClientRect();
        const tile = value.closest(".stat-tile")?.getBoundingClientRect();
        const lineHeight = Number.parseFloat(getComputedStyle(value).lineHeight);
        return {
          text: value.textContent?.trim() ?? "",
          height: rect.height,
          lineHeight,
          left: rect.left,
          right: rect.right,
          tileLeft: tile?.left ?? 0,
          tileRight: tile?.right ?? 0,
        };
      }),
    );

    const decimalMetric = highCourtCardMetrics.find((metric) => /^\d+\.\d$/.test(metric.text));
    expect(decimalMetric).toBeTruthy();
    expect(decimalMetric!.height).toBeLessThan(decimalMetric!.lineHeight * 1.35);
    for (const metric of highCourtCardMetrics) {
      expect(metric.left).toBeGreaterThanOrEqual(metric.tileLeft - 1);
      expect(metric.right).toBeLessThanOrEqual(metric.tileRight + 1);
    }

    await page.goto("/high-courts/uttar-pradesh");
    const ageBucketMetrics = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".stat-grid--5 .stat-tile__value")).map((value) => {
        const rect = value.getBoundingClientRect();
        const tile = value.closest(".stat-tile")?.getBoundingClientRect();
        return {
          right: rect.right,
          tileRight: tile?.right ?? 0,
        };
      }),
    );
    for (const metric of ageBucketMetrics) {
      expect(metric.right).toBeLessThanOrEqual(metric.tileRight + 1);
    }

    await page.goto("/high-courts/kerala/api");
    const contrast = await page.locator(".endpoint__verb").first().evaluate((node) => {
      const style = getComputedStyle(node);
      return contrastRatio(style.color, style.backgroundColor);

      function contrastRatio(foreground: string, background: string) {
        const fg = rgb(foreground);
        const bg = rgb(background);
        const lighter = Math.max(luminance(fg), luminance(bg));
        const darker = Math.min(luminance(fg), luminance(bg));
        return (lighter + 0.05) / (darker + 0.05);
      }

      function rgb(value: string) {
        const channels = value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        return channels as [number, number, number];
      }

      function luminance([r, g, b]: [number, number, number]) {
        return [r, g, b]
          .map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
      }
    });
    expect(contrast).toBeGreaterThanOrEqual(7);
  });
});

test.describe("accessibility smoke", () => {
  test("exposes navigation, headings, and citation/download actions to keyboard users", async ({ page }) => {
    await page.goto("/districts/kangra");

    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Kangra" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download district history CSV" })).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "NyaayWatch" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Districts" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Data" })).toBeFocused();
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

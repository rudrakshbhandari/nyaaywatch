import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const OUT = path.join(process.env.HOME, "Desktop", "nyaaywatch-linkedin");
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT_WIDTH = 1600;
const VIEWPORT_HEIGHT = 1000;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const PAGE_WIDTH = VIEWPORT_WIDTH;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 48;

async function shoot(name, clip) {
  const pageSize = await page.evaluate(() => ({
    width: Math.ceil(Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth)),
    height: Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight)),
  }));
  const cleanClip = {
    x: Math.max(0, Math.floor(clip.x ?? 0)),
    y: Math.max(0, Math.floor(clip.y ?? 0)),
    width: Math.min(pageSize.width, Math.ceil(clip.width ?? pageSize.width)),
    height: Math.max(1, Math.ceil(clip.height)),
  };
  cleanClip.height = Math.min(cleanClip.height, Math.max(1, pageSize.height - cleanClip.y));
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, clip: cleanClip });
  console.log("  saved", `${name}.png`);
}

async function go(url) {
  console.log("->", url);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

async function pageYForText(selector, text, offset = 0) {
  return page.evaluate(
    ({ selector, text, offset }) => {
      const matcher = new RegExp(text, "i");
      const el = [...document.querySelectorAll(selector)].find((node) => matcher.test(node.textContent ?? ""));
      if (!el) {
        throw new Error(`Could not find ${selector} matching ${text}`);
      }
      return Math.max(0, el.getBoundingClientRect().top + window.scrollY + offset);
    },
    { selector, text, offset },
  );
}

async function maybePageYForText(selector, text, offset = 0) {
  try {
    return await pageYForText(selector, text, offset);
  } catch {
    return null;
  }
}

async function nextHeadingY(afterY, fallbackHeight) {
  return page.evaluate(
    ({ afterY, fallbackHeight }) => {
      const headings = [...document.querySelectorAll("h1,h2")].map((node) => ({
        text: node.textContent ?? "",
        y: node.getBoundingClientRect().top + window.scrollY,
      }));
      const next = headings
        .filter((heading) => heading.y > afterY + 220)
        .sort((a, b) => a.y - b.y)[0];
      const pageHeight = document.documentElement.scrollHeight;
      return Math.min(next ? next.y : afterY + fallbackHeight, pageHeight);
    },
    { afterY, fallbackHeight },
  );
}

async function shootBetween(name, startY, endY, { bottomPadding = BOTTOM_PADDING } = {}) {
  const y = Math.max(0, startY - TOP_PADDING);
  await shoot(name, {
    x: 0,
    y,
    width: PAGE_WIDTH,
    height: Math.max(1, endY - y + bottomPadding),
  });
}

async function shootFromHeadingToNext(name, selector, text, { startOffset = -40, fallbackHeight = 1200 } = {}) {
  const startY = await pageYForText(selector, text, startOffset);
  const endY = await nextHeadingY(startY, fallbackHeight);
  await shootBetween(name, startY, endY, { bottomPadding: 0 });
}

async function shootBetweenText(
  name,
  startText,
  endText,
  { selector = "h2", startOffset = -40, endOffset = -80, fallbackHeight = 1400 } = {},
) {
  const startY = await pageYForText(selector, startText, startOffset);
  const endY = (await maybePageYForText(selector, endText, endOffset)) ?? startY + fallbackHeight;
  await shootBetween(name, startY, Math.max(endY, startY + 500), { bottomPadding: 24 });
}

async function heroBottomY(fallbackHeight) {
  return page.evaluate((fallbackHeight) => {
    const firstDivider = [...document.querySelectorAll("main *")]
      .map((node) => ({
        node,
        rect: node.getBoundingClientRect(),
      }))
      .filter(({ rect }) => rect.width > 1000 && rect.height <= 8 && rect.top + window.scrollY > 300)
      .map(({ rect }) => rect.top + window.scrollY)
      .sort((a, b) => a - b)[0];
    return Math.min(firstDivider ? firstDivider + 24 : fallbackHeight, document.documentElement.scrollHeight);
  }, fallbackHeight);
}

await go("https://nyaaywatch.in/");
await shoot("01-homepage-hero", { x: 0, y: 0, width: PAGE_WIDTH, height: await heroBottomY(820) });

await shootBetweenText("02-high-courts-grid", "High Courts across India", "Lower courts show", {
  startOffset: -40,
  endOffset: -72,
  fallbackHeight: 1600,
});

await shootBetweenText("03-pressure-map", "Where is delay piling up", "Methodology", {
  startOffset: -56,
  endOffset: -72,
  fallbackHeight: 1550,
});

await go("https://nyaaywatch.in/supreme-court");
await shoot("04-supreme-court", { x: 0, y: 0, width: PAGE_WIDTH, height: await heroBottomY(780) });

await go("https://nyaaywatch.in/high-courts/bombay");
await shoot("05-bombay-high-court", { x: 0, y: 0, width: PAGE_WIDTH, height: await heroBottomY(820) });

await go("https://nyaaywatch.in/states/maharashtra");
try {
  const skipBtn = page.locator("button, a").filter({ hasText: /^\s*SKIP/i });
  if (await skipBtn.first().isVisible().catch(() => false)) {
    await skipBtn.first().click();
  }
} catch {}
await page.waitForTimeout(2500);
await shootFromHeadingToNext("06-maharashtra-stats", "h1,h2", "How long is the wait", {
  startOffset: -40,
  fallbackHeight: 1300,
});

await browser.close();
console.log("\nAll screenshots saved to", OUT);

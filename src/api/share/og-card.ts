/**
 * OG card image generation using satori + @resvg/resvg-js.
 *
 * Generates 1200×630 PNG cards for Twitter, LinkedIn, WhatsApp, and other
 * sharing surfaces. Cards use the locked editorial design language: Inter Tight
 * (headings), IBM Plex Mono (labels), warm paper palette (#f4efe3), ink/accent
 * color tokens.
 *
 * Fonts are fetched from Google Fonts on first render and cached in-process.
 * Rendered PNGs are cached keyed by (type + id + snapshotPublishedAt) so a
 * re-fetch is never triggered within the same deployment lifecycle unless the
 * snapshot data changes.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import satori, { type Font as SatoriFontOptions } from "satori";
import { Resvg } from "@resvg/resvg-js";

// ── Design tokens (must be hex/rgb — no CSS variables in satori) ─────────────
const PAPER = "#f4efe3";
const INK = "#0c0a08";
const INK_SOFT = "#2f2b26";
const INK_MUTED = "#5f5a53";
const RULE = "#d9d3c8";
const ACCENT = "#bd2716";

// ── Font loading ─────────────────────────────────────────────────────────────

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../assets/fonts");

let fontsCache: SatoriFontOptions[] | null = null;

async function loadBundledFont(fontFile: string): Promise<ArrayBuffer> {
  const font = await readFile(join(FONT_DIR, fontFile));
  return font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength);
}

async function getFonts(): Promise<SatoriFontOptions[]> {
  if (fontsCache) return fontsCache;
  const [interTight800, interTight600, ibmPlexMono500] = await Promise.all([
    loadBundledFont("InterTight-ExtraBold.ttf"),
    loadBundledFont("InterTight-SemiBold.ttf"),
    loadBundledFont("IBMPlexMono-Medium.ttf"),
  ]);
  fontsCache = [
    { name: "Inter Tight", data: interTight800, weight: 800 as const, style: "normal" as const },
    { name: "Inter Tight", data: interTight600, weight: 600 as const, style: "normal" as const },
    { name: "IBM Plex Mono", data: ibmPlexMono500, weight: 500 as const, style: "normal" as const },
  ];
  return fontsCache;
}

// ── Element helpers ───────────────────────────────────────────────────────────
// Satori takes plain JS objects (no JSX needed). Every container must use
// display: flex.

function row(style: Record<string, unknown>, children: unknown[]): object {
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "row", ...style },
      children,
    },
  };
}

function col(style: Record<string, unknown>, children: unknown[]): object {
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", ...style },
      children,
    },
  };
}

function text(style: Record<string, unknown>, content: string): object {
  return { type: "div", props: { style: { display: "flex", ...style }, children: content } };
}

// ── Card renderers ─────────────────────────────────────────────────────────

export type StateOgCardData = {
  stateName: string;
  headline: string;
  pendingLakh: string;
  typicalWaitMonths: number;
  clearanceRate: number;
  flaggedCount: number;
  sourceDateLabel: string;
};

export type DistrictOgCardData = {
  stateName: string;
  districtName: string;
  rank: number;
  totalDistricts: number;
  summary: string;
  backlogCases: number;
  typicalWaitMonths: number;
  clearanceRate: number;
  sourceDateLabel: string;
};

export type NationalOgCardStat = {
  value: string;
  unit: string;
  label: string;
};

export type NationalOgCardData = {
  eyebrow: string;
  headline: string;
  lede: string;
  sourceDateLabel: string;
  stats: NationalOgCardStat[];
};

export type HighCourtOgCardData = {
  courtName: string;
  headline: string;
  pendingLakh: string;
  clearanceRate: number;
  sourceDateLabel: string;
};

const PNG_CACHE = new Map<string, Buffer>();

async function svgToPng(svg: string, width: number): Promise<Buffer> {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return Buffer.from(resvg.render().asPng());
}

async function generateCard(
  cacheKey: string,
  vnode: object,
  width = 1200,
  height = 630,
): Promise<Buffer> {
  const cached = PNG_CACHE.get(cacheKey);
  if (cached) return cached;

  const fonts = await getFonts();
  const svg = await satori(vnode, { width, height, fonts });
  const png = await svgToPng(svg, width);
  PNG_CACHE.set(cacheKey, png);
  return png;
}

function topBar(leftLabel: string, rightLabel: string): object {
  return row({ justifyContent: "space-between", alignItems: "center" }, [
    text(
      { fontFamily: "Inter Tight", fontWeight: 800, fontSize: 20, color: INK, letterSpacing: "-0.03em" },
      leftLabel,
    ),
    text(
      {
        fontFamily: "IBM Plex Mono",
        fontWeight: 500,
        fontSize: 11,
        color: INK_MUTED,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
      },
      rightLabel,
    ),
  ]);
}

function divider(): object {
  return {
    type: "div",
    props: { style: { display: "flex", height: 2, background: INK, margin: "20px 0 24px" } },
  };
}

export async function renderStateOgCard(data: StateOgCardData, cacheKey: string): Promise<Buffer> {
  const rightLabel = `${data.stateName.toUpperCase()} · ${data.sourceDateLabel.toUpperCase()}`;

  const pending = data.pendingLakh;
  const pendingNum = pending.replace(/\s*(lakh|crore).*/i, "").trim();
  const pendingUnit = pending.match(/(lakh|crore)/i)?.[1]?.toLowerCase() ?? "";

  const vnode = col(
    { background: PAPER, padding: "52px 64px", width: "100%", height: "100%", gap: 0 },
    [
      topBar("NyaayWatch", rightLabel),
      divider(),

      // Eyebrow
      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 11,
          color: ACCENT,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: 16,
        },
        "THE WAIT",
      ),

      // Headline
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 52,
          color: INK,
          lineHeight: 1.0,
          letterSpacing: "-0.035em",
          maxWidth: 900,
          flex: 1,
        },
        data.headline,
      ),

      // Numbers row
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            borderTop: `2px solid ${INK}`,
            paddingTop: 24,
            gap: 0,
          },
          children: [
            numberCell(pendingNum, pendingUnit, "PENDING CASES"),
            numberCell(`~${data.typicalWaitMonths}`, "mo", "TYPICAL WAIT"),
            numberCell(data.clearanceRate.toFixed(0), "/ 100", "CLEARED PER 100"),
            numberCell(data.flaggedCount.toLocaleString("en-IN"), "", "DISTRICTS FLAGGED"),
          ],
        },
      },
    ],
  );

  return generateCard(cacheKey, vnode);
}

export async function renderDistrictOgCard(data: DistrictOgCardData, cacheKey: string): Promise<Buffer> {
  const rightLabel = `${data.stateName.toUpperCase()} · ${data.sourceDateLabel.toUpperCase()}`;
  const eyebrow = `DISTRICT EVIDENCE · RANK #${data.rank}`;
  const summary = data.summary.length > 90 ? data.summary.slice(0, 87) + "…" : data.summary;

  const vnode = col(
    { background: PAPER, padding: "52px 64px", width: "100%", height: "100%", gap: 0 },
    [
      topBar("NyaayWatch", rightLabel),
      divider(),

      // Eyebrow
      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 11,
          color: ACCENT,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: 12,
        },
        eyebrow,
      ),

      // District name (very large)
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 84,
          color: INK,
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
          marginBottom: 18,
        },
        data.districtName,
      ),

      // Summary
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 600,
          fontSize: 19,
          color: INK_SOFT,
          lineHeight: 1.45,
          flex: 1,
        },
        summary,
      ),

      // Three-stat row
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            borderTop: `2px solid ${INK}`,
            paddingTop: 24,
            gap: 0,
          },
          children: [
            numberCell(data.backlogCases.toLocaleString("en-IN"), "", "BACKLOG"),
            numberCell(`~${data.typicalWaitMonths}`, "mo", "TYPICAL WAIT"),
            numberCell(data.clearanceRate.toFixed(0), "/ 100", "CLEARED PER 100"),
          ],
        },
      },
    ],
  );

  return generateCard(cacheKey, vnode);
}

export async function renderNationalOgCard(data: NationalOgCardData, cacheKey: string): Promise<Buffer> {
  const vnode = col(
    { background: PAPER, padding: "52px 64px", width: "100%", height: "100%", gap: 0 },
    [
      topBar("NyaayWatch", `INDIA · ${data.sourceDateLabel.toUpperCase()}`),
      divider(),

      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 11,
          color: ACCENT,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: 16,
        },
        data.eyebrow,
      ),

      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 56,
          color: INK,
          lineHeight: 1.0,
          letterSpacing: "-0.035em",
          maxWidth: 1000,
          marginBottom: 20,
        },
        data.headline,
      ),

      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 600,
          fontSize: 24,
          color: INK_SOFT,
          lineHeight: 1.35,
          letterSpacing: "-0.005em",
          maxWidth: 1000,
          flex: 1,
        },
        data.lede,
      ),

      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            borderTop: `2px solid ${INK}`,
            paddingTop: 24,
            gap: 0,
          },
          children: data.stats.map((stat) => numberCell(stat.value, stat.unit, stat.label)),
        },
      },
    ],
  );

  return generateCard(cacheKey, vnode);
}

export async function renderHighCourtOgCard(data: HighCourtOgCardData, cacheKey: string): Promise<Buffer> {
  const pendingNum = data.pendingLakh.replace(/\s*(lakh|crore).*/i, "").trim();
  const pendingUnit = data.pendingLakh.match(/(lakh|crore)/i)?.[1]?.toLowerCase() ?? "";

  const vnode = col(
    { background: PAPER, padding: "52px 64px", width: "100%", height: "100%", gap: 0 },
    [
      topBar("NyaayWatch", data.sourceDateLabel.toUpperCase()),
      divider(),

      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 11,
          color: ACCENT,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: 16,
        },
        "HIGH COURT",
      ),

      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 52,
          color: INK,
          lineHeight: 1.0,
          letterSpacing: "-0.035em",
          flex: 1,
        },
        data.headline,
      ),

      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            borderTop: `2px solid ${INK}`,
            paddingTop: 24,
            gap: 0,
          },
          children: [
            numberCell(pendingNum, pendingUnit, "PENDING CASES"),
            numberCell(data.clearanceRate.toFixed(0), "/ 100", "CLEARED PER 100"),
          ],
        },
      },
    ],
  );

  return generateCard(cacheKey, vnode);
}

// ── Square card (1080×1080) for WhatsApp / Telegram / Instagram ──────────────

export async function renderSquareDistrictCard(data: DistrictOgCardData, cacheKey: string): Promise<Buffer> {
  const eyebrow = `${data.stateName.toUpperCase()} · RANK #${data.rank}`;
  const summary = data.summary.length > 110 ? data.summary.slice(0, 107) + "…" : data.summary;

  const vnode = col(
    { background: PAPER, padding: "72px 72px 60px", width: "100%", height: "100%", gap: 0 },
    [
      // Header
      row({ justifyContent: "space-between", alignItems: "center", marginBottom: 32 }, [
        text(
          { fontFamily: "Inter Tight", fontWeight: 800, fontSize: 22, color: INK, letterSpacing: "-0.03em" },
          "NyaayWatch",
        ),
        text(
          {
            fontFamily: "IBM Plex Mono",
            fontWeight: 500,
            fontSize: 11,
            color: INK_MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          },
          data.sourceDateLabel.toUpperCase(),
        ),
      ]),

      // 2px divider
      { type: "div", props: { style: { display: "flex", height: 2, background: INK, marginBottom: 32 } } },

      // Eyebrow
      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 12,
          color: ACCENT,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: 18,
        },
        eyebrow,
      ),

      // District name — huge
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 100,
          color: INK,
          lineHeight: 0.88,
          letterSpacing: "-0.04em",
          marginBottom: 24,
        },
        data.districtName,
      ),

      // Summary
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 600,
          fontSize: 21,
          color: INK_SOFT,
          lineHeight: 1.45,
          flex: 1,
        },
        summary,
      ),

      // Two key stats row
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            borderTop: `2px solid ${INK}`,
            paddingTop: 28,
            gap: 0,
          },
          children: [
            squareNumberCell(data.backlogCases.toLocaleString("en-IN"), "", "BACKLOG"),
            squareNumberCell(`~${data.typicalWaitMonths}`, "mo", "TYPICAL WAIT"),
            squareNumberCell(data.clearanceRate.toFixed(0), "/ 100", "CLEARED PER 100"),
          ],
        },
      },

      // Footer URL
      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 12,
          color: INK_MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginTop: 20,
        },
        "nyaaywatch.in",
      ),
    ],
  );

  return generateCard(cacheKey, vnode, 1080, 1080);
}

export async function renderSquareStateCard(data: StateOgCardData, cacheKey: string): Promise<Buffer> {
  const pendingNum = data.pendingLakh.replace(/\s*(lakh|crore).*/i, "").trim();
  const pendingUnit = data.pendingLakh.match(/(lakh|crore)/i)?.[1]?.toLowerCase() ?? "";

  const vnode = col(
    { background: PAPER, padding: "72px 72px 60px", width: "100%", height: "100%", gap: 0 },
    [
      row({ justifyContent: "space-between", alignItems: "center", marginBottom: 32 }, [
        text(
          { fontFamily: "Inter Tight", fontWeight: 800, fontSize: 22, color: INK, letterSpacing: "-0.03em" },
          "NyaayWatch",
        ),
        text(
          {
            fontFamily: "IBM Plex Mono",
            fontWeight: 500,
            fontSize: 11,
            color: INK_MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          },
          data.stateName.toUpperCase(),
        ),
      ]),

      { type: "div", props: { style: { display: "flex", height: 2, background: INK, marginBottom: 28 } } },

      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 12,
          color: ACCENT,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: 16,
        },
        "THE WAIT",
      ),

      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 54,
          color: INK,
          lineHeight: 1.0,
          letterSpacing: "-0.035em",
          flex: 1,
        },
        data.headline,
      ),

      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            borderTop: `2px solid ${INK}`,
            paddingTop: 28,
            gap: 0,
          },
          children: [
            squareNumberCell(pendingNum, pendingUnit, "PENDING"),
            squareNumberCell(`~${data.typicalWaitMonths}`, "mo", "TYPICAL WAIT"),
            squareNumberCell(data.flaggedCount.toLocaleString("en-IN"), "", "FLAGGED"),
          ],
        },
      },

      text(
        {
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 12,
          color: INK_MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginTop: 20,
        },
        "nyaaywatch.in",
      ),
    ],
  );

  return generateCard(cacheKey, vnode, 1080, 1080);
}

function squareNumberCell(value: string, unit: string, label: string): object {
  return col({ flex: 1, paddingRight: 12, gap: 0 }, [
    row({ alignItems: "baseline", gap: 6 }, [
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 68,
          color: INK,
          letterSpacing: "-0.045em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        },
        value,
      ),
      unit
        ? text(
            { fontFamily: "Inter Tight", fontWeight: 700, fontSize: 20, color: INK_MUTED, letterSpacing: "-0.01em" },
            unit,
          )
        : { type: "div", props: { style: { display: "flex" }, children: "" } },
    ]),
    text(
      {
        fontFamily: "IBM Plex Mono",
        fontWeight: 500,
        fontSize: 10,
        color: INK_MUTED,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginTop: 8,
        borderTop: `1px solid ${RULE}`,
        paddingTop: 8,
      },
      label,
    ),
  ]);
}

function numberCell(value: string, unit: string, label: string): object {
  return col({ flex: 1, paddingRight: 16, gap: 0 }, [
    row({ alignItems: "baseline", gap: 6 }, [
      text(
        {
          fontFamily: "Inter Tight",
          fontWeight: 800,
          fontSize: 60,
          color: INK,
          letterSpacing: "-0.045em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        },
        value,
      ),
      unit
        ? text(
            {
              fontFamily: "Inter Tight",
              fontWeight: 700,
              fontSize: 18,
              color: INK_MUTED,
              letterSpacing: "-0.01em",
            },
            unit,
          )
        : { type: "div", props: { style: { display: "flex" }, children: "" } },
    ]),
    text(
      {
        fontFamily: "IBM Plex Mono",
        fontWeight: 500,
        fontSize: 10,
        color: INK_MUTED,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginTop: 8,
        borderTop: `1px solid ${RULE}`,
        paddingTop: 8,
      },
      label,
    ),
  ]);
}

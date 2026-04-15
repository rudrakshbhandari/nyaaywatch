import type { LabViewModel } from "./shared.js";

/**
 * Plain-English glossary. Every technical term gets a short, reader-first explanation.
 * Attached to info icons (\u24D8) next to the term wherever it appears in the UI.
 *
 * The old definitions in src/api/render.ts were written for auditors. These are written
 * for a reader who may be encountering court data for the first time.
 */
export const GLOSSARY: Record<
  | "backlog"
  | "clearance"
  | "typicalWait"
  | "watchlist"
  | "fileClearGap"
  | "freshness"
  | "quality"
  | "source"
  | "methodology",
  { term: string; short: string; long: string }
> = {
  backlog: {
    term: "pending cases",
    short: "Cases waiting to be decided.",
    long:
      "These are court cases that have been filed but not yet disposed. We count everything that is still open on the day the source numbers were published \u2014 including cases that are only a few days old and cases that have been pending for years.",
  },
  clearance: {
    term: "cases cleared per 100 filed",
    short: "How many cases courts finish for every 100 new ones they get.",
    long:
      "If this number is 100, courts are keeping pace with new filings. Below 100 means the pile is growing. Above 100 means courts are catching up. We calculate it from the monthly filing and disposal totals published in the source dashboard.",
  },
  typicalWait: {
    term: "typical wait",
    short: "About how long a pending case has been waiting in court.",
    long:
      "This is an estimate of the middle of the pile \u2014 roughly how old a typical pending case is. It is not the age of any one case. Courts publish cases grouped into age buckets (0\u20131 year, 1\u20133 years, and so on), and we estimate from those buckets.",
  },
  watchlist: {
    term: "districts on the watchlist",
    short: "Districts where several pressure signals line up at once.",
    long:
      "A district lands on the watchlist when it combines a large pile of pending cases with slower clearance or longer waits than the state average. It is a signal for closer inspection, not a judgment about any specific court or official.",
  },
  fileClearGap: {
    term: "file-clear gap",
    short: "How much more work is coming in than going out.",
    long:
      "A positive gap means cases are being filed faster than courts are clearing them \u2014 the pile grows. A negative gap means the reverse. We calculate it from the most recent month of filings and disposals.",
  },
  freshness: {
    term: "freshness",
    short: "How many days old the source numbers are.",
    long:
      "Court dashboards are not live. We pull a fresh pull on a regular schedule and publish it after review. Freshness tells you how many days have passed since the source numbers were captured.",
  },
  quality: {
    term: "data quality",
    short: "Whether we got a clean, complete pull this time.",
    long:
      "\u201CComplete\u201D means we captured all 12 Himachal districts on the latest pull. \u201CPartial\u201D means some districts were missing, in which case we do not publish. \u201CStale\u201D means the last clean pull is older than our freshness threshold.",
  },
  source: {
    term: "where the numbers come from",
    short: "The National Judicial Data Grid public district aggregates.",
    long:
      "All numbers on this site come from the NJDG public district dashboards \u2014 the same data the Supreme Court of India publishes for public use. We do not add, estimate, or adjust the underlying figures. We re-organize them so they are easier to read.",
  },
  methodology: {
    term: "methodology",
    short: "The exact rules we used to produce these numbers.",
    long:
      "Every public number on the site carries a methodology version tag so you can check exactly which rules were in effect when it was produced. Any time we change the rules \u2014 for example, how we estimate typical wait \u2014 the version tag changes and you can see the difference on the methodology page.",
  },
};

export type GlossaryKey = keyof typeof GLOSSARY;

/**
 * Headlines & ledes per variant. Each variant gets its own voice, but all four follow
 * the same rules:
 *   - Lead with what the data says, not how it was produced.
 *   - No "snapshot", "alpha", "evidence-first" jargon on the hero.
 *   - Numbers are rounded and framed in terms a non-expert reader recognizes.
 *   - Where technical terms appear, they get an info icon.
 */
export function buildCopy(model: LabViewModel) {
  const topName = model.topDistrict.districtName;
  const topWaitMonths = Math.round(model.topDistrict.medianAgeDays / 30);
  const backlogDirection = model.backlogDelta > 0 ? "grown" : "shrunk";
  const backlogTrendLine =
    model.backlogDelta > 0
      ? `The pile has ${backlogDirection} by roughly ${Math.round(model.backlogDeltaPct)}% since December.`
      : `The pile has ${backlogDirection} slightly since December.`;

  return {
    brand: "NyaayWatch",
    brandTag: "Court transparency, Himachal Pradesh",

    editorial: {
      eyebrow: `Himachal Pradesh \u00b7 ${model.sourceDateLabel}`,
      headline: `In Himachal, the wait for justice is getting longer.`,
      lede:
        `More than ${model.pendingLakh} court cases are waiting to be heard across Himachal's district courts. ` +
        `${backlogTrendLine} In ${topName}, the district carrying the heaviest load, a typical pending case has already been waiting more than ${topWaitMonths} months.`,
      pullQuote: `Courts in Himachal closed only ${model.clearanceRate.toFixed(0)} cases for every 100 new ones filed last month. The pile grew.`,
      ctaPrimary: "See which districts are the worst",
      ctaSecondary: "How we got these numbers",
      sectionWatchlist: "The three districts to watch",
      sectionWatchlistLede:
        "These are the districts where the load is heaviest and the pace of work is slowest. They are not villains \u2014 they are signals for a closer look.",
      sectionTrend: "How the pile has changed",
      sectionTrendLede:
        "Every month we pull a fresh set of numbers from the public court dashboards. Here is how the statewide backlog has moved.",
      sectionWhat: "What this site is",
      sectionWhatBody:
        "NyaayWatch is an independent, reader-first view of publicly available court numbers. We do not speed anything up or slow anything down. We just make the numbers easier to read so citizens, journalists, and civic groups can ask better questions.",
    },

    terminal: {
      systemLine: `NYAAYWATCH \u2022 HP \u2022 ${model.sourceDateLabel} \u2022 BACKLOG \u2191`,
      statusHeadline: `${model.pendingLakh} cases pending statewide`,
      statusSubline: `${model.flaggedCount} districts flagged \u00b7 typical wait ~${model.typicalWaitMonths} months \u00b7 clearance ${model.clearanceRate.toFixed(1)}%`,
      actionsLabel: "Drill in",
      ctaPrimary: "Open district table",
      ctaSecondary: "Read methodology",
    },

    product: {
      kicker: "Himachal Pradesh \u00b7 updated monthly",
      headline: "Watch how Himachal's courts are actually doing.",
      subline:
        `Over ${model.pendingLakh} cases are waiting in district courts. We pull the public numbers every month and show you where the pressure is building \u2014 so you can ask the right questions.`,
      ctaPrimary: "See the district table",
      ctaSecondary: "How it works",
      featureTitle: "What you get",
      features: [
        {
          title: "The districts falling behind",
          body: "A ranked view of where the pile is growing fastest and where cases are waiting longest.",
        },
        {
          title: "Plain-English metrics",
          body: "Every technical term has a one-line explanation. Hover the \u24D8 for the long version.",
        },
        {
          title: "Free data downloads",
          body: "Every number on the site is downloadable as CSV, for reporters and researchers.",
        },
      ],
    },

    civic: {
      h1: "Court delays in Himachal Pradesh",
      intro:
        `This site tracks how many cases are waiting in Himachal's district courts, how quickly courts are clearing them, and how long a typical case has been waiting. ` +
        `Right now, ${model.pendingLakh} cases are pending across the state. The typical pending case has been waiting about ${model.typicalWaitMonths} months.`,
      start: "Start here",
      startOptions: [
        {
          label: "See the district table",
          href: "/districts",
          description: "Sort and compare all 12 districts by backlog, clearance, or waiting time.",
        },
        {
          label: `Look at ${topName}`,
          href: `/districts/${model.topDistrict.districtId}`,
          description: `${topName} has the biggest pile and the longest typical wait right now.`,
        },
        {
          label: "Download the data",
          href: "/data",
          description: "Every number on the site is available as CSV.",
        },
        {
          label: "Read how we got these numbers",
          href: "/methodology",
          description: "The sources, the rules, and the limits of what we can say.",
        },
      ],
    },
  } as const;
}

export type LabCopy = ReturnType<typeof buildCopy>;

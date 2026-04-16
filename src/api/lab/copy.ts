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

  // Districts where the median pending case has been waiting substantially
  // longer than a year. These drive the "some have waited two years" line
  // that makes the statewide median feel dishonest.
  const longWaitDistricts = model.allDistricts.filter(
    (district) => district.medianAgeDays >= 365 && district.backlogCases > 0,
  );
  const longWaitMonths =
    longWaitDistricts.length > 0
      ? Math.round(longWaitDistricts[0].medianAgeDays / 30)
      : 0;
  const longWaitSampleName = longWaitDistricts[0]?.districtName ?? topName;

  return {
    brand: "NyaayWatch",
    brandTag: "Court transparency, Himachal Pradesh",

    editorial: {
      // Small meta strip above the headline \u2014 quiet, informational.
      ticker: `HIMACHAL PRADESH \u00b7 UPDATED ${model.sourceDateLabel}`,
      // Small label above the headline. No "snapshot" / methodology jargon.
      eyebrow: "THE WAIT",
      // Ask the reader a question. The numbers answer it.
      headline: "How long is the wait for justice in Himachal?",
      // One-paragraph hero lede. Fact-first, adversarial framing in plain English.
      lede: buildEditorialLede(model, longWaitDistricts.length, longWaitMonths),

      // Each of the four headline numbers gets a short human-consequence caption.
      // No made-up comparisons \u2014 every line is defensible against the data.
      bigNumbers: {
        pending: {
          label: "pending cases",
          caption: "Every one of these is a person waiting for their day in court.",
        },
        wait: {
          label: "typical wait",
          caption: buildWaitCaption(longWaitDistricts.length, longWaitMonths, longWaitSampleName),
        },
        clearance: {
          label: "cleared per 100 filed",
          caption: buildClearanceCaption(model.clearanceRate),
        },
        flagged: {
          label: "districts flagged",
          caption: "Where the pile is heaviest, or the wait is longest, or the pace is slowest.",
        },
      },

      ctaPrimary: "See the worst districts",
      ctaSecondary: "How we got these numbers",

      sectionWatchlist: "Three districts that need eyes on them",
      sectionWatchlistLede:
        "A district lands here when its backlog, its waiting time, or its pace of work is out of line with the rest of the state. Not villains \u2014 signals for closer inspection.",

      sectionTrend: "How the statewide pile has moved",
      sectionTrendLede:
        "Every month we pull a fresh set of numbers from the public court dashboards. Here is what the statewide backlog has done, month by month.",

      sectionWhat: "Why this site exists",
      sectionWhatBody:
        "NyaayWatch is an independent, reader-first view of publicly available court numbers. We do not speed anything up or slow anything down. We just make the numbers impossible to ignore \u2014 so citizens, reporters, and civic groups can ask sharper questions, and demand sharper answers.",
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

function buildEditorialLede(
  model: LabViewModel,
  longWaitCount: number,
  longWaitMonths: number,
): string {
  const base = `${model.pendingLakh} cases are waiting in Himachal's district courts. The middle of the pile has already been waiting about ${model.typicalWaitMonths} months.`;
  if (longWaitCount > 0 && longWaitMonths > model.typicalWaitMonths) {
    return (
      `${base} In ${longWaitCount} district${longWaitCount === 1 ? "" : "s"}, the middle is closer to ${longWaitMonths} months. ` +
      `A backlog this big is not going to move on its own.`
    );
  }
  return `${base} A backlog this big is not going to move on its own.`;
}

function buildWaitCaption(
  longWaitCount: number,
  longWaitMonths: number,
  sampleName: string,
): string {
  if (longWaitCount === 0) {
    return "Middle of the pile. Half the cases have been waiting longer than this.";
  }
  if (longWaitCount === 1) {
    return `Middle of the statewide pile. In ${sampleName}, the middle is closer to ${longWaitMonths} months.`;
  }
  return `Middle of the statewide pile. In ${longWaitCount} districts, the middle is closer to ${longWaitMonths} months.`;
}

function buildClearanceCaption(rate: number): string {
  if (rate >= 100) {
    return "Courts are finally clearing faster than new cases come in. The backlog built up over years is another story.";
  }
  if (rate >= 90) {
    return "Courts are nearly keeping pace with new filings. The backlog is still growing.";
  }
  return "For every 100 new cases, only " + Math.round(rate) + " are being cleared. The pile keeps growing.";
}

import type { HomeViewModel } from "./view-model.js";
import type { PublicLowerCourtCopy } from "../public-state.js";

/**
 * Plain-English glossary. Every technical term gets a short, reader-first explanation.
 * Attached to info icons (\u24D8) next to the term wherever it appears in the UI.
 *
 * Written for a reader who may be encountering court data for the first time,
 * not for auditors.
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
      "A rate of 100 means filings and clearances matched during that period. Below 100 means more cases were filed than cleared; above 100 means more were cleared than filed. The rate uses the monthly totals in the source dashboard.",
  },
  typicalWait: {
    term: "typical wait",
    short: "About how long a pending case has been waiting in court.",
    long:
      "This is an estimate of the middle of the backlog \u2014 roughly how old a typical pending case is. It is not the age of any one case. Courts publish cases grouped into age buckets (0\u20131 year, 1\u20133 years, and so on), and we estimate from those buckets.",
  },
  watchlist: {
    term: "districts to watch",
    short: "Districts where several pressure signals line up at once.",
    long:
      "A district lands on this list when it combines a large backlog of pending cases with slower clearance or longer waits than the state average. It is a signal for closer inspection, not a finding about any specific court or official.",
  },
  fileClearGap: {
    term: "file-clear gap",
    short: "How much more work is coming in than going out.",
    long:
      "A positive gap means cases are being filed faster than courts are clearing them \u2014 the backlog grows. A negative gap means the reverse. We calculate it from the most recent month of filings and disposals.",
  },
  freshness: {
    term: "freshness",
    short: "How many days old the source numbers are.",
    long:
      "Court dashboards are not live. Freshness is the number of days since the source date shown on the page.",
  },
  quality: {
    term: "data quality",
    short: "Whether the data passed completeness and freshness checks.",
    long:
      "\u201CComplete\u201D means all expected districts are present. \u201CPartial\u201D means some districts are missing, so NyaayWatch does not publish that reading. \u201CStale\u201D means the available data is older than the freshness limit.",
  },
  source: {
    term: "where the numbers come from",
    short: "The National Judicial Data Grid public district aggregates.",
    long:
      "NJDG provides the source figures. NyaayWatch also calculates estimates and flags using the methods linked on each page.",
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
 * Homepage copy. Rules:
 *   - Lead with what the data says, not how it was produced.
 *   - No "snapshot", "alpha", "evidence-first" jargon on the hero.
 *   - Numbers are rounded and framed in terms a non-expert reader recognizes.
 *   - Where technical terms appear, they get an info icon.
 */
export function buildCopy(
  model: HomeViewModel,
  publicScopeDescription: string,
  lowerCourtCopy: PublicLowerCourtCopy,
) {
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

  return {
    brand: "NyaayWatch",
    brandTag: `Court transparency, ${model.snapshot.snapshot.stateName}`,

    // Small meta strip above the headline \u2014 quiet, informational.
    ticker: `${model.snapshot.snapshot.stateName.toUpperCase()} \u00b7 UPDATED ${model.sourceDateLabel}`,
    // Small label above the headline. No "snapshot" / methodology jargon.
    eyebrow: "THE WAIT",
    // Ask the reader a question. The numbers answer it.
    headline: `How long is the wait for justice in ${model.snapshot.snapshot.stateName}?`,
    // One-paragraph hero lede. Fact-first, adversarial framing in plain English.
    lede: buildHeroLede(model, longWaitDistricts.length, longWaitMonths),

    // Each of the four headline numbers gets a short human-consequence caption.
    // No made-up comparisons \u2014 every line is defensible against the data.
    bigNumbers: {
      pending: {
        label: "pending cases",
        caption: "Each case is still pending in court.",
      },
      wait: {
        label: "typical wait",
        caption: "Half the cases pending today have been waiting longer than this.",
      },
      clearance: {
        label: "cleared per 100 filed",
        caption: buildClearanceCaption(model),
      },
      flagged: {
        label: "districts flagged",
        caption: "Districts with high backlogs, long waits, or slow clearance.",
      },
    },

    ctaPrimary: "Inspect the districts",
    ctaSecondary: "Read the methodology",

    sectionWatchlist: "Three districts to inspect first",
    sectionWatchlistLede:
      `A district lands here when its backlog, its waiting time, or its pace of work is out of line with the rest of the ${lowerCourtCopy.geographyLabelLower}. These are signals for closer inspection, not findings.`,

    sectionTrend: `How the ${lowerCourtCopy.aggregateAdjective} backlog has moved`,
    sectionTrendLede:
      `Each bar shows a dated reading of the ${lowerCourtCopy.aggregateAdjective} backlog. The chart is not live.`,

    sectionWhat: "Why this site exists",
    sectionWhatBody:
      `NyaayWatch publishes reviewed readings of public court data. ${publicScopeDescription} Compare dated figures, check the source and method, and download the published data.`,
  } as const;
}

export type HomeCopy = ReturnType<typeof buildCopy>;

function buildHeroLede(
  model: HomeViewModel,
  longWaitCount: number,
  longWaitMonths: number,
): string {
  const base = `${model.pendingLakh} cases are waiting in ${model.snapshot.snapshot.stateName}'s district courts. The middle of the backlog has already been waiting about ${model.typicalWaitMonths} months.`;
  if (longWaitCount > 0 && longWaitMonths > model.typicalWaitMonths) {
    return (
      `${base} In ${longWaitCount} district${longWaitCount === 1 ? "" : "s"}, the middle is closer to ${longWaitMonths} months.`
    );
  }
  return base;
}

function buildClearanceCaption(model: HomeViewModel): string {
  if (!model.clearancePaceAvailable) {
    const { pendingCases, filedLastMonthCases, clearedLastMonthCases } = model.snapshot.stats;
    if (pendingCases > 0 && filedLastMonthCases === 0 && clearedLastMonthCases === 0) {
      return "NJDG reports 0 filed and 0 cleared cases for last month, so NyaayWatch shows this pace as N/A.";
    }
    return "NJDG does not report a positive filed-case count for last month, so NyaayWatch cannot compute this pace.";
  }
  const rate = model.clearanceRate;
  if (rate >= 100) {
    return "Last month, clearances matched or exceeded filings. The pending count may still be high.";
  }
  if (rate >= 90) {
    return "Last month, courts cleared nearly as many cases as were filed.";
  }
  return "For every 100 new cases, only " + Math.round(rate) + " are being cleared. The backlog keeps growing.";
}

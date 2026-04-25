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
      "If this number is 100, courts are keeping pace with new filings. Below 100 means the backlog is growing. Above 100 means courts are catching up. We calculate it from the monthly filing and disposal totals published in the source dashboard.",
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
      "Court dashboards are not live. We capture new source runs on a regular schedule and publish only after review. Freshness tells you how many days have passed since the source numbers were captured.",
  },
  quality: {
    term: "data quality",
    short: "Whether we got a clean, complete pull this time.",
    long:
      "\u201CComplete\u201D means we captured every expected district for the state on the latest pull. \u201CPartial\u201D means some districts were missing, in which case we do not publish. \u201CStale\u201D means the last clean pull is older than our freshness threshold.",
  },
  source: {
    term: "where the numbers come from",
    short: "The National Judicial Data Grid public district aggregates.",
    long:
      "All numbers on this site come from the NJDG public district dashboards. We do not add, estimate, or adjust the underlying figures. We reorganize them so they are easier to read and compare.",
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
        caption: "Every one of these is a person waiting for their day in court.",
      },
      wait: {
        label: "typical wait",
        caption: "Half the cases pending today have been waiting longer than this.",
      },
      clearance: {
        label: "cleared per 100 filed",
        caption: buildClearanceCaption(model.clearanceRate),
      },
      flagged: {
        label: "districts flagged",
        caption: "Where the backlog is heaviest, or the wait is longest, or the pace is slowest.",
      },
    },

    ctaPrimary: "Inspect the districts",
    ctaSecondary: "Read the methodology",

    sectionWatchlist: "Three districts to inspect first",
    sectionWatchlistLede:
      `A district lands here when its backlog, its waiting time, or its pace of work is out of line with the rest of the ${lowerCourtCopy.geographyLabelLower}. These are signals for closer inspection, not findings.`,

    sectionTrend: `How the ${lowerCourtCopy.aggregateAdjective} backlog has moved`,
    sectionTrendLede:
      `Each bar is a previously published ${lowerCourtCopy.aggregateAdjective} snapshot. It shows how the backlog has moved across publication dates, not a continuously refreshed surface.`,

    sectionWhat: "Why this site exists",
    sectionWhatBody:
      `NyaayWatch is an independent view of public court aggregates. ${publicScopeDescription} It publishes reviewed snapshots instead of a continuously refreshed surface, so citizens, reporters, and civic groups can inspect the numbers, cite them, and ask sharper questions.`,
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
      `${base} In ${longWaitCount} district${longWaitCount === 1 ? "" : "s"}, the middle is closer to ${longWaitMonths} months. ` +
      `A backlog this big is not going to move on its own.`
    );
  }
  return `${base} A backlog this big is not going to move on its own.`;
}

function buildClearanceCaption(rate: number): string {
  if (rate >= 100) {
    return "Courts are finally clearing faster than new cases come in. The backlog built up over years is another story.";
  }
  if (rate >= 90) {
    return "Courts are nearly keeping pace with new filings. The backlog is still growing.";
  }
  return "For every 100 new cases, only " + Math.round(rate) + " are being cleared. The backlog keeps growing.";
}

/**
 * Public methodology lineage tables show every published snapshot for a scope.
 * Operationally we may publish multiple times for the same reference date (a
 * manual backfill, a rollback, an immediate re-publish) — those events live in
 * the operator publication history, but on the public surface they only
 * confuse readers, who see the same calendar day repeated several times with
 * subtly different "published at" timestamps.
 *
 * This helper collapses any history list down to one entry per displayed
 * reference-date label, keeping the entry with the latest publication
 * timestamp (i.e. the version that ended up live). It's deliberately generic
 * so the state, Supreme Court, and High Court pages can share it.
 */
export function dedupeLineageByReferenceDate<T>(
  history: readonly T[],
  options: {
    /**
     * The label we render in the first column of the lineage table — usually
     * `formatDate(snapshot.referenceDateAt)` or equivalent. Two entries with
     * the same label collapse into one row.
     */
    referenceDateLabel: (entry: T) => string;
    /**
     * A sortable timestamp (ISO string) for "which event is the most recent"
     * within a group of same-day entries. The latest publication wins, since
     * that's the one that's actually live for that day.
     */
    publicationTimestamp: (entry: T) => string;
    /**
     * A sortable timestamp (ISO string) representing the *reference date* of
     * the snapshot — the source data the row is about, not when it was
     * published. The deduped output is sorted DESC on this so readers see
     * recent reference dates first regardless of when they were backfilled.
     */
    referenceDateSortKey: (entry: T) => string;
  },
): T[] {
  const winners = new Map<string, T>();
  for (const entry of history) {
    const key = options.referenceDateLabel(entry);
    const existing = winners.get(key);
    if (!existing || options.publicationTimestamp(entry) > options.publicationTimestamp(existing)) {
      winners.set(key, entry);
    }
  }

  // Sort by reference date DESC so the most recent calendar date is at the
  // top of the table. This is independent of publication.createdAt — a
  // backfilled entry for an old date should still appear in its historical
  // slot, not at the top just because the publish event fired today.
  return [...winners.values()].sort((a, b) =>
    options.referenceDateSortKey(b).localeCompare(options.referenceDateSortKey(a)),
  );
}

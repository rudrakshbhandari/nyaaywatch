export const STALE_SNAPSHOT_THRESHOLD_DAYS = 14;

export function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function freshnessDays(sourceSnapshotAt: string, now = new Date()): number {
  const startedAt = new Date(sourceSnapshotAt).getTime();
  const diff = now.getTime() - startedAt;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

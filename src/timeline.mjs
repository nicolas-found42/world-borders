export const START_YEAR = 1776;
export const END_YEAR = 2026;
export function clampYear(value) {
  return Math.max(START_YEAR, Math.min(END_YEAR, value));
}
export function snapshotForYear(snapshots, year) {
  // Never silently carry an old boundary into an unsupported year.
  return snapshots.find(snapshot => snapshot.year === Math.floor(year)) ?? null;
}
export function adjacentSnapshot(snapshots, year, direction) {
  return direction > 0
    ? snapshots.find(snapshot => snapshot.year > Math.floor(year))?.year ?? null
    : [...snapshots].reverse().find(snapshot => snapshot.year < Math.floor(year))?.year ?? null;
}
export function advanceTime(year, deltaSeconds, yearsPerSecond) {
  return clampYear(year + Math.max(0, deltaSeconds) * yearsPerSecond);
}
export function nearestSnapshot(snapshots, year) {
  if (!snapshots.length) return null;
  return snapshots.reduce((best, next) => Math.abs(next.year - year) < Math.abs(best.year - year) ? next : best).year;
}

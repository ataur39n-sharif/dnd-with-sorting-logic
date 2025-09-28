export const DEFAULT_STEP = 1024;

export function initialRanks(n: number, step = DEFAULT_STEP): number[] {
  return Array.from({ length: n }, (_, i) => (i + 1) * step);
}

export function midRank(
  left?: number | null,
  right?: number | null,
  step = DEFAULT_STEP
): number {
  if (left == null && right == null) return step;
  if (left == null) return Math.floor((right! - 1) / 2) || 1; // insert at head
  if (right == null) return left + step;                      // insert at tail
  const mid = Math.floor((left + right) / 2);
  return mid > left && mid < right ? mid : Number.NaN;        // NaN => needs reindex
}

export function needsReindex(sortedRanks: number[]): boolean {
  for (let i = 1; i < sortedRanks.length; i++) {
    if (sortedRanks[i] - sortedRanks[i - 1] <= 1) return true;
  }
  return false;
}

export function reindexCollection(items: { orderRank: number }[], step = DEFAULT_STEP): void {
  items.forEach((item, idx) => {
    item.orderRank = (idx + 1) * step;
  });
}